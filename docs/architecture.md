# アーキテクチャ指針

## レイヤー構成

```
app/              UI層（React Native / Expo Router）
  └─ (tabs)/      画面コンポーネント

src/
  ├─ core/        ドメイン層（UI非依存）
  │  ├─ domain/   ドメインモデル、ビジネスルール、エンジン
  │  └─ storage/  リポジトリI/F、永続化実装
  └─ features/    アプリケーション層（状態管理、ユースケース）
```

---

## core/domain/ の設計原則

### 1. models.ts - ドメインモデル
純粋な型定義のみ。ロジックは含まない。

**主要なモデル**:
- `PlantSpecies`: 植物の種類（種データ）
- `Plant`: 育成中の個体
- `Seed`: ガチャで入手した種
- `FocusSession`: セッション
- `SlotConfig`: 育成枠の設定

**例**:
```typescript
export interface PlantSpecies {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic';
  growthRateMultiplier: number;  // 成長速度補正
  description: string;
}

export interface Plant {
  id: string;
  speciesId: string;           // 植物種のID
  slotIndex: number;            // 育成枠のインデックス（0-8）
  growthPoints: number;         // GP（0-120）
  waterLevel: number;           // 水分レベル（0-100）
  nutritionLevel: number;       // 栄養レベル（0-100）
  healthStatus: 'healthy' | 'sick' | 'dead';
  isSick: boolean;              // 病気フラグ
  mutations: MutationId[];      // 突然変異リスト
  plantedAt: number;            // 植えた日時
  lastWatered: number | null;   // 最後に水やりした日時
  lastFertilized: number | null;// 最後に肥料をやった日時
  updatedAt: number;
}
```

---

### 2. rules.ts - ビジネスルール（純関数）
すべて純関数として実装。副作用なし、テスト容易。

**主要な関数**:
```typescript
// 成長ポイント計算
export function calcGrowthPoints(minutes: SessionMinutes): number;

// 成長速度補正を適用したGP計算
export function calcGrowthPointsWithMultiplier(
  minutes: SessionMinutes,
  growthRateMultiplier: number,
  nutritionLevel: number
): number;

// 水分・栄養の時間経過による減少
export function calcWaterDecay(elapsedMinutes: number): number;
export function calcNutritionDecay(elapsedMinutes: number): number;

// 枯死判定
export function isDeadFromDehydration(waterLevel: number, hoursSinceLastCheck: number): boolean;
export function isDeadFromOverwatering(waterLevel: number, hoursSinceLastCheck: number): boolean;
export function isDeadFromSickness(isSick: boolean, daysSinceInfection: number): boolean;

// 病気発生判定
export function rollSickness(rng: RNG): boolean;  // 2%の確率

// 突然変異抽選
export function rollsForSession(minutes: SessionMinutes): number;
export function rollMutation(plant: Plant, rng: RNG): MutationId | null;

// ガチャ排出判定
export function rollGacha(isFree: boolean, rng: RNG): 'common' | 'rare' | 'epic';
```

---

### 3. engine/ - ドメインエンジン
ドメインモデルとルールを組み合わせて複雑なロジックを実行。

**focusEngine.ts - セッション管理**:
```typescript
// セッション開始
export function startSession(params: StartSessionParams): FocusSession;

// セッション完了
export function completeSession(
  session: FocusSession,
  plants: Plant[],
  currentTime: number,
  rng: RNG
): {
  session: FocusSession;
  updatedPlants: Plant[];
};

// セッション中断
export function interruptSession(
  session: FocusSession,
  plants: Plant[],
  currentTime: number
): {
  session: FocusSession;
  updatedPlants: Plant[];
};

// セッション完了チェック
export function isSessionCompleted(session: FocusSession, currentTime: number): boolean;
```

**plantEngine.ts - 植物状態管理** (新規):
```typescript
// 水やり
export function waterPlant(plant: Plant, currentTime: number): Plant;

// 肥料
export function fertilizePlant(plant: Plant, currentTime: number): Plant;

// 病気治療
export function curePlant(plant: Plant): Plant;

// 時間経過による状態更新
export function updatePlantOverTime(plant: Plant, elapsedMinutes: number, rng: RNG): Plant;

// 枯死チェック
export function checkIfDead(plant: Plant, currentTime: number): Plant;
```

**gachaEngine.ts - ガチャ** (新規):
```typescript
// ガチャ実行
export function executeGacha(isFree: boolean, rng: RNG): Seed;

// 無料ガチャの残り回数チェック
export function getFreeGachaRemaining(lastResetDate: number, usedCount: number): number;
```

---

### 4. rng.ts - RNG抽象化
テスト時に固定値・シーケンスを注入できるようにする。

```typescript
export interface RNG {
  next(): number;  // 0.0〜1.0の乱数を返す
}

export class DefaultRNG implements RNG {
  next(): number {
    return Math.random();
  }
}

export class FixedRNG implements RNG {
  constructor(private value: number) {}
  next(): number {
    return this.value;
  }
}

export class SequenceRNG implements RNG {
  constructor(private values: number[], private index: number = 0) {}
  next(): number {
    const val = this.values[this.index % this.values.length];
    this.index++;
    return val;
  }
}
```

---

## core/storage/ の設計

### リポジトリインターフェース
永続化を抽象化。AsyncStorage → SQLite に差し替え可能。

```typescript
export interface PlantRepository {
  getAllPlants(): Promise<Plant[]>;
  getPlantById(id: string): Promise<Plant | null>;
  getPlantsBySlot(slotIndex: number): Promise<Plant | null>;
  savePlant(plant: Plant): Promise<void>;
  deletePlant(id: string): Promise<void>;
}

export interface SpeciesRepository {
  getAllSpecies(): Promise<PlantSpecies[]>;
  getSpeciesById(id: string): Promise<PlantSpecies | null>;
  getSpeciesByRarity(rarity: string): Promise<PlantSpecies[]>;
}

export interface SeedRepository {
  getAllSeeds(): Promise<Seed[]>;
  addSeed(seed: Seed): Promise<void>;
  removeSeed(seedId: string): Promise<void>;
}

export interface GachaRepository {
  getFreeGachaCount(): Promise<number>;
  incrementFreeGachaCount(): Promise<void>;
  resetFreeGachaCount(): Promise<void>;
  getLastResetDate(): Promise<number>;
}

export interface SlotRepository {
  getMaxSlots(): Promise<number>;  // 3, 6, or 9
  setMaxSlots(slots: number): Promise<void>;
}
```

---

## features/ の設計

### Zustand ストア
UI層とドメイン層の橋渡し。非同期処理、エラーハンドリング。

**usePlantsStore.ts**:
```typescript
interface PlantsState {
  plants: Plant[];
  maxSlots: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadPlants(): Promise<void>;
  plantSeed(seed: Seed, slotIndex: number): Promise<void>;
  waterPlant(plantId: string): Promise<void>;
  fertilizePlant(plantId: string): Promise<void>;
  curePlant(plantId: string): Promise<void>;
  updatePlantsOverTime(): Promise<void>;  // バックグラウンド更新
}
```

**useSessionStore.ts**:
```typescript
interface SessionState {
  activeSession: FocusSession | null;
  isActive: boolean;

  // Actions
  startSession(minutes: SessionMinutes): Promise<void>;
  checkSessionCompletion(): Promise<void>;
  interruptSession(): Promise<void>;
  
  // Helpers
  getProgress(): number;
  getRemainingTime(): number;
}
```

**useGachaStore.ts** (新規):
```typescript
interface GachaState {
  freeGachaRemaining: number;
  seeds: Seed[];

  // Actions
  executeGacha(isFree: boolean): Promise<Seed>;
  checkAndResetFreeGacha(): Promise<void>;
}
```

**useCollectionStore.ts** (新規):
```typescript
interface CollectionState {
  collection: PlantSpecies[];
  totalSpecies: number;

  // Actions
  loadCollection(): Promise<void>;
  getCompletionRate(): number;
}
```

---

## テスト戦略

### 単体テスト（Jest）
- **rules.ts**: すべての純関数をテスト
  - 成長計算、水分/栄養減少、枯死判定、突然変異抽選、ガチャ排出
  - FixedRNG / SequenceRNG を使って確率系をテスト
- **engine/**: 各エンジンのロジックをテスト
  - セッション完了/中断、植物状態更新、ガチャ実行
- **storage/**: モックリポジトリでテスト

### E2Eテスト（将来）
- セッション実行→完走→GP獲得
- ガチャ→種入手→植える→育成
- 世話→状態変化→枯死回避

---

## データフロー

```
User Action (UI)
  ↓
Zustand Store (features/)
  ↓
Domain Engine (core/engine/)
  ↓
Business Rules (core/domain/rules.ts)
  ↓
Domain Models (core/domain/models.ts)
  ↓
Repository (core/storage/repo.ts)
  ↓
AsyncStorage / SQLite
```

---

## 開発の優先順位

1. **Phase 1: 緊急修正**
   - バグ修正（モーダル、自動完了）
   - 全植物同時育成に変更

2. **Phase 2: 植物種・枠システム**
   - `PlantSpecies` モデル追加
   - `SpeciesRepository` 実装
   - 育成枠UI

3. **Phase 3: 世話システム**
   - `plantEngine.ts` 実装
   - 水やり、肥料、病気ロジック
   - 時間経過による状態更新

4. **Phase 4: ガチャ**
   - `gachaEngine.ts` 実装
   - `GachaRepository` 実装
   - ガチャUI

5. **Phase 5: 図鑑**
   - `useCollectionStore` 実装
   - 図鑑UI

6. **Phase 6: 課金**
   - 枠拡張ロジック
   - Expo IAP連携

---

## 備考

### なぜこの構造？
- **ドメイン層の独立性**: UIフレームワークに依存しない
- **テスト容易性**: 純関数でテストしやすい
- **差し替え可能性**: AsyncStorage → SQLite、React Native → Next.js（Web版）
- **保守性**: ビジネスロジックが1箇所にまとまる

### ドメイン層の責務
- **models.ts**: 型定義のみ
- **rules.ts**: 純関数のビジネスルール
- **engine/**: ドメインモデル + ルールの組み合わせ
- **rng.ts**: テスト可能な乱数生成

### UI層の責務
- ユーザー入力のハンドリング
- 画面レンダリング
- Zustandストアの呼び出し

### アプリケーション層の責務
- 非同期処理
- エラーハンドリング
- ストレージとの連携
