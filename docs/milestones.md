# マイルストーン（MVP）

## M0: リポジトリ基盤
完了条件:
- Expo(TypeScript)で起動
- Jestが動く
- CIで lint/test/typecheck が走る

## M1: core/domain（抽選ロジック）
完了条件:
- rollsForSession: {10:1,25:2,45:3,60:4}
- p=0.005
- 当たりで打ち切り
- 既存変異はno-op
- Jestテストが全部green

## M2: セッション進行（focusEngine）
完了条件:
- 10分=1GP、120GPで成熟
- 中断は抽選なし、完走で抽選
- 「nowを渡すと状態が更新される」純関数中心
- Jestテストgreen

## M3: ストレージ（AsyncStorage）
完了条件:
- Plantの作成・保存・読み込み
- 変異・GPが永続化される

## M4: UI最小（Home/Focus/Detail）
完了条件:
- Homeで個体作成・選択
- Focusでセッション開始→ロック表示→完走で抽選
- DetailでGP/変異が見れる
- 実機で基本導線が動作

## M5: QA・仕上げ
完了条件:
- docs/qa-checklist.md が全てOK
- バグ0（クラッシュ・データ消失なし）
