/**
 * ビジネスルールのテスト
 */

import {
  calcGrowthPoints,
  calcGrowthPercentage,
  isFullyGrown,
  rollsForSession,
  rollMutation,
  addMutation,
  minutesToMs,
  msToMinutes,
  FULL_GROWTH_GP,
} from '../domain/rules';
import { Plant, MutationId } from '../domain/models';
import { createFixedRNG, createSequenceRNG } from '../domain/rng';

describe('成長ポイント計算', () => {
  test('10分 = 1 GP', () => {
    const tenMinutesMs = 10 * 60 * 1000;
    expect(calcGrowthPoints(tenMinutesMs)).toBe(1);
  });

  test('20分 = 2 GP', () => {
    const twentyMinutesMs = 20 * 60 * 1000;
    expect(calcGrowthPoints(twentyMinutesMs)).toBe(2);
  });

  test('5分 = 0 GP（10分未満は切り捨て）', () => {
    const fiveMinutesMs = 5 * 60 * 1000;
    expect(calcGrowthPoints(fiveMinutesMs)).toBe(0);
  });

  test('15分 = 1 GP（10分単位で切り捨て）', () => {
    const fifteenMinutesMs = 15 * 60 * 1000;
    expect(calcGrowthPoints(fifteenMinutesMs)).toBe(1);
  });

  test('負の時間 = 0 GP', () => {
    expect(calcGrowthPoints(-1000)).toBe(0);
  });
});

describe('成長度計算', () => {
  test('0 GP = 0%', () => {
    expect(calcGrowthPercentage(0)).toBe(0);
  });

  test('60 GP = 50%', () => {
    expect(calcGrowthPercentage(60)).toBe(50);
  });

  test('120 GP = 100%', () => {
    expect(calcGrowthPercentage(120)).toBe(100);
  });

  test('240 GP = 100%（上限）', () => {
    expect(calcGrowthPercentage(240)).toBe(100);
  });
});

describe('完全成長判定', () => {
  test('120 GP以上で完全成長', () => {
    expect(isFullyGrown(120)).toBe(true);
    expect(isFullyGrown(121)).toBe(true);
  });

  test('119 GP以下は未成長', () => {
    expect(isFullyGrown(119)).toBe(false);
    expect(isFullyGrown(0)).toBe(false);
  });
});

describe('突然変異抽選回数', () => {
  test('抽選回数テーブルが正しい', () => {
    expect(rollsForSession(10)).toBe(1);
    expect(rollsForSession(25)).toBe(2);
    expect(rollsForSession(45)).toBe(3);
    expect(rollsForSession(60)).toBe(4);
  });
});

describe('突然変異抽選', () => {
  const mockPlant: Plant = {
    id: 'test-plant',
    speciesId: 'echeveria',
    slotIndex: 0,
    nickname: 'テスト植物',
    growthPoints: 50,
    mutations: [],
    plantedAt: Date.now(),
    updatedAt: Date.now(),
  };

  test('確率0%で外れ', () => {
    const rng = createFixedRNG(0.99); // 0.005より大きい = 外れ
    const result = rollMutation(mockPlant, 10, rng);
    expect(result).toBeNull();
  });

  test('確率100%で当たり', () => {
    // 最初の抽選で当たり（0.001 < 0.005）、変異抽選で最初の要素を選択
    const rng = createSequenceRNG([0.001, 0.0]);
    const result = rollMutation(mockPlant, 10, rng);
    expect(result).toBe('variegated'); // ALL_MUTATION_IDS[0]
  });

  test('当たりが出たら打ち切り（複数回抽選でも最大1個）', () => {
    // 1回目: 当たり、2回目以降は実行されない
    const rng = createSequenceRNG([0.001, 0.0, 0.001, 0.0]);
    const result = rollMutation(mockPlant, 60, rng); // 60分=4回抽選
    expect(result).toBe('variegated');
    // 2回目以降の抽選は実行されないので、シーケンスの3番目の値は使われない
  });

  test('既存変異は何も起きない（no-op）', () => {
    const plantWithMutation: Plant = {
      ...mockPlant,
      mutations: ['variegated'],
    };
    
    // 当たりで variegated を選択
    const rng = createSequenceRNG([0.001, 0.0]);
    const result = rollMutation(plantWithMutation, 10, rng);
    expect(result).toBeNull();
  });

  test('複数回抽選で2回目に当たる', () => {
    // 1回目: 外れ、2回目: 当たり
    const rng = createSequenceRNG([0.99, 0.001, 0.2]); // 0.2 -> index 1 = tint_shift
    const result = rollMutation(mockPlant, 25, rng); // 25分=2回抽選
    expect(result).toBe('tint_shift');
  });
});

describe('突然変異追加', () => {
  const mockPlant: Plant = {
    id: 'test-plant',
    speciesId: 'echeveria',
    slotIndex: 0,
    nickname: 'テスト植物',
    growthPoints: 50,
    mutations: [],
    plantedAt: 1000,
    updatedAt: 1000,
  };

  test('新しい突然変異を追加', () => {
    const updated = addMutation(mockPlant, 'variegated');
    expect(updated.mutations).toEqual(['variegated']);
    expect(updated.updatedAt).toBeGreaterThan(mockPlant.updatedAt);
  });

  test('すでに保持している突然変異は追加しない', () => {
    const plantWithMutation: Plant = {
      ...mockPlant,
      mutations: ['variegated'],
    };
    const updated = addMutation(plantWithMutation, 'variegated');
    expect(updated).toBe(plantWithMutation); // 同じオブジェクト
  });

  test('複数の突然変異を保持できる', () => {
    let plant = mockPlant;
    plant = addMutation(plant, 'variegated');
    plant = addMutation(plant, 'tint_shift');
    expect(plant.mutations).toEqual(['variegated', 'tint_shift']);
  });
});

describe('時間変換ヘルパー', () => {
  test('分をミリ秒に変換', () => {
    expect(minutesToMs(1)).toBe(60000);
    expect(minutesToMs(10)).toBe(600000);
  });

  test('ミリ秒を分に変換', () => {
    expect(msToMinutes(60000)).toBe(1);
    expect(msToMinutes(600000)).toBe(10);
  });
});
