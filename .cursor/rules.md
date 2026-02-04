# Cursor Single-Agent Rules（必読）

## 絶対ルール
1. 変更前に docs/spec.md と該当マイルストーンを読む
2. 変更は最小（不要なリファクタ禁止）
3. coreロジックは純関数優先、必ずJestで担保
4. 1マイルストーン＝1つのまとまりで完結させる
5. 追加した仕様は docs/decisions.md に記録

## 作業手順（毎回）
- Plan: 何を/どのファイルを/なぜ、を箇条書き
- Implement: コード変更
- Test: `npm test` `npm run typecheck` `npm run lint`
- Review: 差分を自己レビューし、危険箇所（時間/保存/乱数）を再点検
