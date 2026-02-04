/**
 * ビジネスルール - 純関数
 * テスト可能なビジネスロジック
 */

import { MutationId, ALL_MUTATION_IDS, SessionMinutes, Plant } from './models';
import { RNG, defaultRNG } from './rng';

// ========================================
// 定数
// ========================================

/** 10分あたり1GP */
const GP_PER_10_MINUTES = 1;

/** 完全成長までに必要なGP */
export const FULL_GROWTH_GP = 120;

/** 突然変異の抽選確率（0.5% = 0.005） */
const MUTATION_CHANCE = 0.005;

/** セッション時間ごとの抽選回数 */
const ROLLS_TABLE: Record<SessionMinutes, number> = {
  10: 1,
  25: 2,
  45: 3,
  60: 4,
};

// ========================================
// 成長ポイント計算
// ========================================

/**
 * 経過時間（ミリ秒）から獲得GPを計算
 * @param elapsedMs 経過時間（ミリ秒）
 * @returns 獲得GP
 */
export function calcGrowthPoints(elapsedMs: number): number {
  const elapsedMinutes = elapsedMs / 1000 / 60;
  const gp = Math.floor(elapsedMinutes / 10) * GP_PER_10_MINUTES;
  return Math.max(0, gp);
}

/**
 * 成長度（パーセント）を計算
 * @param currentGP 現在のGP
 * @returns 成長度（0-100%）
 */
export function calcGrowthPercentage(currentGP: number): number {
  const percentage = (currentGP / FULL_GROWTH_GP) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * 完全成長しているか判定
 * @param currentGP 現在のGP
 * @returns 完全成長していればtrue
 */
export function isFullyGrown(currentGP: number): boolean {
  return currentGP >= FULL_GROWTH_GP;
}

// ========================================
// 突然変異抽選
// ========================================

/**
 * セッション時間から抽選回数を取得
 * @param minutes セッション時間
 * @returns 抽選回数
 */
export function rollsForSession(minutes: SessionMinutes): number {
  return ROLLS_TABLE[minutes];
}

/**
 * 突然変異抽選を実行（1回）
 * @param rng 乱数生成器
 * @returns 当選したらtrue
 */
function rollOnce(rng: RNG): boolean {
  return rng.random() < MUTATION_CHANCE;
}

/**
 * ランダムな突然変異IDを選択
 * @param rng 乱数生成器
 * @returns 突然変異ID
 */
function pickRandomMutation(rng: RNG): MutationId {
  const index = Math.floor(rng.random() * ALL_MUTATION_IDS.length);
  return ALL_MUTATION_IDS[index];
}

/**
 * 突然変異抽選（複数回）を実行
 * 
 * ルール:
 * - 当たりが出たら即終了（最大1当選/セッション）
 * - すでに保持している変異が当たった場合は何も起きない
 * 
 * @param plant 植物個体
 * @param minutes セッション時間
 * @param rng 乱数生成器（デフォルトはMath.random）
 * @returns 新しく獲得した突然変異ID（なければnull）
 */
export function rollMutation(
  plant: Plant,
  minutes: SessionMinutes,
  rng: RNG = defaultRNG
): MutationId | null {
  const rolls = rollsForSession(minutes);
  
  for (let i = 0; i < rolls; i++) {
    // 抽選実行
    if (rollOnce(rng)) {
      // 当選！突然変異を選択
      const mutation = pickRandomMutation(rng);
      
      // すでに保持している場合は何も起きない
      if (plant.mutations.includes(mutation)) {
        return null;
      }
      
      // 新しい突然変異を獲得
      return mutation;
    }
  }
  
  // すべて外れ
  return null;
}

/**
 * 突然変異を植物に追加
 * @param plant 植物個体
 * @param mutation 突然変異ID
 * @returns 更新された植物個体
 */
export function addMutation(plant: Plant, mutation: MutationId): Plant {
  // すでに保持している場合は何もしない
  if (plant.mutations.includes(mutation)) {
    return plant;
  }
  
  return {
    ...plant,
    mutations: [...plant.mutations, mutation],
    updatedAt: Date.now(),
  };
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 分をミリ秒に変換
 * @param minutes 分
 * @returns ミリ秒
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * ミリ秒を分に変換
 * @param ms ミリ秒
 * @returns 分
 */
export function msToMinutes(ms: number): number {
  return ms / 1000 / 60;
}
