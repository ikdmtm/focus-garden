# FocusGarden - 環境構築手順

## セットアップ完了済み ✅

以下の環境構築が完了しています：

### 1. 設定ファイル
- ✅ `package.json` - 依存関係とスクリプト
- ✅ `tsconfig.json` - TypeScript設定
- ✅ `jest.config.js` - Jest設定
- ✅ `babel.config.js` - Babel設定（パスエイリアス含む）
- ✅ `.eslintrc.js` - ESLint設定
- ✅ `app.json` - Expo設定
- ✅ `.gitignore` - Git除外設定

### 2. 依存パッケージ
- ✅ `npm install --legacy-peer-deps` 完了（1410パッケージ）

### 3. プロジェクト構造
```
focus-garden/
├── app/              # 画面（expo-router）
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── focus.tsx
│   │   ├── index.tsx
│   │   └── settings.tsx
│   └── plant/
│       └── [id].tsx
├── src/
│   ├── core/         # ビジネスロジック（UI非依存）
│   │   ├── domain/
│   │   │   ├── ids.ts
│   │   │   ├── models.ts
│   │   │   ├── rng.ts
│   │   │   └── rules.ts
│   │   ├── engine/
│   │   │   └── focusEngine.ts
│   │   ├── storage/
│   │   │   ├── repo.async.ts
│   │   │   ├── repo.ts
│   │   │   └── schema.ts
│   │   └── __tests__/
│   │       ├── rules.test.ts
│   │       └── focusEngine.test.ts
│   └── features/     # 状態管理・ユースケース
│       └── plants/
│           ├── selectors.ts
│           └── usePlantsStore.ts
├── docs/             # ドキュメント
│   ├── spec.md
│   ├── architecture.md
│   ├── milestones.md
│   └── prompts/
└── assets/           # 画像リソース（TODO）
```

### 4. テスト環境
- ✅ Jest設定完了
- ✅ テストスケルトン作成（8テスト）
- ✅ `npm test` が正常に動作

### 5. TypeScript
- ✅ 型チェック設定完了
- ✅ パスエイリアス設定（@, @core, @features）
- ✅ `npm run type-check` が正常に動作

---

## 利用可能なコマンド

```bash
# 開発サーバー起動
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# テスト実行
npm test
npm run test:watch

# 型チェック
npm run type-check

# Lint
npm run lint
```

---

## 次のステップ

1. **コアロジックの実装**
   - `src/core/domain/models.ts` - 型定義
   - `src/core/domain/rules.ts` - ビジネスルール
   - `src/core/engine/focusEngine.ts` - セッションエンジン

2. **テストの実装**
   - `src/core/__tests__/rules.test.ts` - ルールのテスト
   - `src/core/__tests__/focusEngine.test.ts` - エンジンのテスト

3. **ストレージの実装**
   - `src/core/storage/repo.async.ts` - AsyncStorage実装

4. **状態管理の実装**
   - `src/features/plants/usePlantsStore.ts` - Zustandストア

5. **画面の実装**
   - `app/(tabs)/index.tsx` - ホーム画面
   - `app/(tabs)/focus.tsx` - フォーカス画面
   - `app/plant/[id].tsx` - 植物詳細画面

---

## トラブルシューティング

### npm installでエラーが出る場合
```bash
npm install --legacy-peer-deps
```

### キャッシュクリア
```bash
npm start -- --clear
```

### Expo CLIの再インストール
```bash
npm install -g expo-cli
```

---

## 技術スタック

- **フレームワーク**: Expo ~51.0.0
- **ルーティング**: expo-router ~3.5.0
- **言語**: TypeScript ~5.3.3
- **UI**: React Native 0.74.0
- **状態管理**: Zustand ^4.5.0
- **ストレージ**: AsyncStorage 1.23.1
- **テスト**: Jest ^29.7.0, jest-expo ~51.0.0
- **Lint**: ESLint ^9.0.0, typescript-eslint ^8.0.0
