// rules.test.ts - ビジネスルールの単体テスト

describe('rules', () => {
  describe('成長ポイント計算', () => {
    test('10分 = 1 GP', () => {
      // TODO: calcGrowthPoints を実装後に追加
      expect(true).toBe(true);
    });
  });

  describe('突然変異抽選', () => {
    test('抽選回数テーブルが正しい', () => {
      // 10分=1回, 25分=2回, 45分=3回, 60分=4回
      // TODO: rollsForSession を実装後に追加
      expect(true).toBe(true);
    });

    test('当たりが出たら打ち切り', () => {
      // TODO: rollMutation を実装後に追加
      expect(true).toBe(true);
    });

    test('既存変異は何も起きない', () => {
      // TODO: rollMutation を実装後に追加
      expect(true).toBe(true);
    });
  });
});
