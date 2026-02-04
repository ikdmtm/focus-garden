/**
 * ガチャエンジン
 * ガチャの抽選ロジック
 */

import { Seed } from '../domain/models';
import { Rarity, PLANT_SPECIES, getSpeciesByRarity } from '../domain/species';
import { RNG, defaultRNG } from '../domain/rng';
import { generateId, now } from '../domain/ids';

/**
 * レア度抽選（無料ガチャ）
 * @param rng 乱数生成器
 * @returns レア度
 */
export function rollRarityFree(rng: RNG = defaultRNG): Rarity {
  const roll = rng.random();
  
  // Common: 85%
  if (roll < 0.85) return 'common';
  
  // Rare: 13%
  if (roll < 0.98) return 'rare';
  
  // Epic: 2%
  return 'epic';
}

/**
 * レア度抽選（有料ガチャ）
 * @param rng 乱数生成器
 * @returns レア度
 */
export function rollRarityPaid(rng: RNG = defaultRNG): Rarity {
  const roll = rng.random();
  
  // Common: 70%
  if (roll < 0.70) return 'common';
  
  // Rare: 25%
  if (roll < 0.95) return 'rare';
  
  // Epic: 5%
  return 'epic';
}

/**
 * レア度から植物種を選択
 * @param rarity レア度
 * @param rng 乱数生成器
 * @returns 植物種ID
 */
export function selectSpeciesByRarity(rarity: Rarity, rng: RNG = defaultRNG): string {
  const candidates = getSpeciesByRarity(rarity);
  
  if (candidates.length === 0) {
    throw new Error(`No species found for rarity: ${rarity}`);
  }
  
  const index = Math.floor(rng.random() * candidates.length);
  return candidates[index].id;
}

/**
 * ガチャ実行
 * @param isFree 無料ガチャかどうか
 * @param rng 乱数生成器
 * @returns 入手した種
 */
export function executeGacha(isFree: boolean, rng: RNG = defaultRNG): Seed {
  // レア度抽選
  const rarity = isFree ? rollRarityFree(rng) : rollRarityPaid(rng);
  
  // 植物種選択
  const speciesId = selectSpeciesByRarity(rarity, rng);
  
  // 種を生成
  return {
    id: generateId(),
    speciesId,
    obtainedAt: now(),
  };
}

/**
 * 無料ガチャの残り回数を取得
 * @param lastResetDate 最後にリセットした日付（UNIX timestamp）
 * @param usedCount 使用回数
 * @param currentTime 現在時刻
 * @returns 残り回数（0-5）
 */
export function getFreeGachaRemaining(
  lastResetDate: number,
  usedCount: number,
  currentTime: number = now()
): number {
  // 日付が変わっているかチェック
  const lastDate = new Date(lastResetDate);
  const currentDate = new Date(currentTime);
  
  // 日付が違う場合はリセット
  if (
    lastDate.getFullYear() !== currentDate.getFullYear() ||
    lastDate.getMonth() !== currentDate.getMonth() ||
    lastDate.getDate() !== currentDate.getDate()
  ) {
    return 5; // リセット
  }
  
  // 同じ日付の場合は残り回数を計算
  return Math.max(0, 5 - usedCount);
}

/**
 * 無料ガチャをリセットすべきか判定
 * @param lastResetDate 最後にリセットした日付
 * @param currentTime 現在時刻
 * @returns リセットすべきならtrue
 */
export function shouldResetFreeGacha(
  lastResetDate: number,
  currentTime: number = now()
): boolean {
  return getFreeGachaRemaining(lastResetDate, 0, currentTime) === 5;
}
