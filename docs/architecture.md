# FocusGarden アーキテクチャ（MVP）

## 分離方針
- src/core: ビジネスロジック（UI非依存）
- src/features: 状態管理・ユースケース（coreを呼ぶ）
- app/: 画面（expo-router）

## coreの設計
- domain/models.ts: 型定義（Plant, SessionState等）
- domain/rules.ts: ルール（純関数）
  - calcGrowthPoints(elapsedMs)
  - rollsForSession(minutes)
  - rollMutation(plant, minutes, rng) など
- engine/focusEngine.ts: 時刻入力で状態遷移するエンジン（純関数＋小さな副作用I/F）
- rng.ts: RNGを差し替え可能に（テストで固定seed）

## storage
- repo.ts: インターフェース
- repo.async.ts: AsyncStorage実装（MVP）
- 将来: repo.sqlite.ts を追加して差し替え
