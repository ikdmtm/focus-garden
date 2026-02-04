/**
 * 乱数生成（テスト時に差し替え可能にするため抽象化）
 */

export interface RNG {
  /**
   * 0以上1未満の乱数を返す
   */
  random(): number;
}

/**
 * デフォルトのRNG実装（Math.randomを使用）
 */
export const defaultRNG: RNG = {
  random: () => Math.random(),
};

/**
 * テスト用の固定値RNG
 */
export function createFixedRNG(value: number): RNG {
  return {
    random: () => value,
  };
}

/**
 * テスト用のシーケンスRNG（指定した値を順番に返す）
 */
export function createSequenceRNG(values: number[]): RNG {
  let index = 0;
  return {
    random: () => {
      const value = values[index % values.length];
      index++;
      return value;
    },
  };
}
