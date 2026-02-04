# FocusGarden

育成モード（Focus）中だけ植物が成長する、集中×植物育成アプリ（MVP）。
まずは **ロジック品質（成長/セッション/突然変異抽選）** を固め、デザインは後で詰める。

## MVPのコア仕様（要点）
- 成長は Focus育成モード中のみ進む
- 10分 = 1 Growth Point（GP）
- 完全成長まで 20時間相当 = 120GP
- セッション: 10 / 25 / 45 / 60 分
- 突然変異抽選は **完走時のみ**
  - 抽選回数: 10=1回, 25=2回, 45=3回, 60=4回
  - 1回あたり確率: p=0.5%（0.005）
  - 当たりが出たらそこで打ち切り（最大1当選/セッション）
  - 5種から等確率で付与、すでに持っていたら何も起きない（再抽選なし）
  - 変異は個体に永続

詳細は `docs/spec.md` を参照。

---

## Tech
- Expo + React Native + TypeScript
- expo-router
- Jest（ロジックの単体テストを最重視）
- 保存: MVPは AsyncStorage（将来SQLiteに差し替え可能なI/F）

---

## セットアップ

### 1) 作成（まだ未作成の場合）
```bash
npx create-expo-app focus-garden --template blank-typescript
cd focus-garden
