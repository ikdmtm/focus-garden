/**
 * 世話エンジン
 * 植物の状態管理と世話のロジック
 */

import { Plant, DiseaseType } from '../domain/models';
import { RNG, defaultRNG } from '../domain/rng';
import { now } from '../domain/ids';

// ========================================
// 定数
// ========================================

/** 1時間あたりの水分減少量 */
const WATER_DECAY_PER_HOUR = 3;

/** 1時間あたりの栄養減少量 */
const NUTRITION_DECAY_PER_HOUR = 1;

/** 水分が低い閾値（これ以下で健康度が減少） */
const WATER_LOW_THRESHOLD = 30;

/** 栄養が低い閾値（これ以下で健康度が減少） */
const NUTRITION_LOW_THRESHOLD = 20;

/** 水分が高すぎる閾値（これ以上で根腐れリスク） */
const WATER_HIGH_THRESHOLD = 90;

/** 健康度が低い閾値（これ以下で枯れるリスク） */
const HEALTH_CRITICAL_THRESHOLD = 20;

/** 病気発生確率（1時間あたり） */
const DISEASE_CHANCE_PER_HOUR = 0.01; // 1%

/** 根腐れ発生確率（水やりすぎ時、1時間あたり） */
const ROOT_ROT_CHANCE_PER_HOUR = 0.05; // 5%

/** 水やり1回あたりの水分回復量 */
const WATER_RESTORE_AMOUNT = 40;

/** 肥料やり1回あたりの栄養回復量 */
const NUTRITION_RESTORE_AMOUNT = 50;

/** 治療1回あたりの健康度回復量 */
const CURE_HEALTH_RESTORE = 30;

// ========================================
// 時間経過による状態変化
// ========================================

/**
 * 時間経過による植物の状態を更新
 * @param plant 植物
 * @param currentTime 現在時刻
 * @param rng 乱数生成器
 * @returns 更新された植物
 */
export function updatePlantState(
  plant: Plant,
  currentTime: number = now(),
  rng: RNG = defaultRNG
): Plant {
  // 死んでいる場合は何もしない
  if (plant.isDead) {
    return plant;
  }

  // 経過時間を計算（時間単位）
  const elapsedMs = currentTime - plant.lastCareCheckAt;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // 状態を更新
  let waterLevel = Math.max(0, plant.waterLevel - WATER_DECAY_PER_HOUR * elapsedHours);
  let nutritionLevel = Math.max(0, plant.nutritionLevel - NUTRITION_DECAY_PER_HOUR * elapsedHours);
  let health = plant.health;
  let diseaseType = plant.diseaseType;

  // 水分が低い場合、健康度が減少
  if (waterLevel < WATER_LOW_THRESHOLD) {
    const healthDecay = (WATER_LOW_THRESHOLD - waterLevel) * 0.1 * elapsedHours;
    health = Math.max(0, health - healthDecay);
  }

  // 栄養が低い場合、健康度が減少
  if (nutritionLevel < NUTRITION_LOW_THRESHOLD) {
    const healthDecay = (NUTRITION_LOW_THRESHOLD - nutritionLevel) * 0.05 * elapsedHours;
    health = Math.max(0, health - healthDecay);
  }

  // 水分が高すぎる場合、根腐れのリスク
  if (waterLevel > WATER_HIGH_THRESHOLD && !diseaseType) {
    const rootRotChance = ROOT_ROT_CHANCE_PER_HOUR * elapsedHours;
    if (rng.random() < rootRotChance) {
      diseaseType = 'root_rot';
      health = Math.max(0, health - 20);
    }
  }

  // 病気がない場合、低確率で病気発生
  if (!diseaseType && health > 0) {
    const diseaseChance = DISEASE_CHANCE_PER_HOUR * elapsedHours;
    if (rng.random() < diseaseChance) {
      // ランダムに病気を選択
      const diseases: DiseaseType[] = ['pest', 'fungus', 'nutrient_def'];
      const diseaseIndex = Math.floor(rng.random() * diseases.length);
      diseaseType = diseases[diseaseIndex];
      health = Math.max(0, health - 15);
    }
  }

  // 病気がある場合、健康度が徐々に減少
  if (diseaseType) {
    const diseaseDecay = 5 * elapsedHours;
    health = Math.max(0, health - diseaseDecay);
  }

  // 健康度が0になったら死亡
  const isDead = health <= 0;

  return {
    ...plant,
    waterLevel: Math.min(100, waterLevel),
    nutritionLevel: Math.min(100, nutritionLevel),
    health: Math.min(100, health),
    diseaseType,
    lastCareCheckAt: currentTime,
    isDead,
    updatedAt: currentTime,
  };
}

// ========================================
// 世話アクション
// ========================================

/**
 * 水やり
 * @param plant 植物
 * @param currentTime 現在時刻
 * @returns 更新された植物
 */
export function waterPlant(
  plant: Plant,
  currentTime: number = now()
): Plant {
  if (plant.isDead) {
    throw new Error('枯れた植物には水をやれません');
  }

  const newWaterLevel = Math.min(100, plant.waterLevel + WATER_RESTORE_AMOUNT);

  return {
    ...plant,
    waterLevel: newWaterLevel,
    lastWateredAt: currentTime,
    updatedAt: currentTime,
  };
}

/**
 * 肥料やり
 * @param plant 植物
 * @param currentTime 現在時刻
 * @returns 更新された植物
 */
export function fertilizePlant(
  plant: Plant,
  currentTime: number = now()
): Plant {
  if (plant.isDead) {
    throw new Error('枯れた植物には肥料をやれません');
  }

  const newNutritionLevel = Math.min(100, plant.nutritionLevel + NUTRITION_RESTORE_AMOUNT);

  return {
    ...plant,
    nutritionLevel: newNutritionLevel,
    lastFertilizedAt: currentTime,
    updatedAt: currentTime,
  };
}

/**
 * 治療（病気を治す）
 * @param plant 植物
 * @param currentTime 現在時刻
 * @returns 更新された植物
 */
export function curePlant(
  plant: Plant,
  currentTime: number = now()
): Plant {
  if (plant.isDead) {
    throw new Error('枯れた植物は治療できません');
  }

  if (!plant.diseaseType) {
    throw new Error('病気になっていません');
  }

  const newHealth = Math.min(100, plant.health + CURE_HEALTH_RESTORE);

  return {
    ...plant,
    health: newHealth,
    diseaseType: null,
    updatedAt: currentTime,
  };
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 植物の状態を取得（人間が読める形式）
 * @param plant 植物
 * @returns 状態の説明
 */
export function getPlantCondition(plant: Plant): string {
  if (plant.isDead) {
    return '枯れている';
  }

  if (plant.diseaseType) {
    const diseaseNames: Record<DiseaseType, string> = {
      root_rot: '根腐れ',
      pest: '害虫',
      fungus: 'カビ',
      nutrient_def: '栄養不足',
    };
    return `病気: ${diseaseNames[plant.diseaseType]}`;
  }

  if (plant.health < HEALTH_CRITICAL_THRESHOLD) {
    return '危篤';
  }

  if (plant.waterLevel < WATER_LOW_THRESHOLD) {
    return '水不足';
  }

  if (plant.nutritionLevel < NUTRITION_LOW_THRESHOLD) {
    return '栄養不足';
  }

  if (plant.health < 50) {
    return '元気がない';
  }

  if (plant.health < 80) {
    return '普通';
  }

  return '元気';
}

/**
 * 水やりが必要かどうか
 * @param plant 植物
 * @returns 必要ならtrue
 */
export function needsWater(plant: Plant): boolean {
  return !plant.isDead && plant.waterLevel < 50;
}

/**
 * 肥料やりが必要かどうか
 * @param plant 植物
 * @returns 必要ならtrue
 */
export function needsFertilizer(plant: Plant): boolean {
  return !plant.isDead && plant.nutritionLevel < 30;
}

/**
 * 治療が必要かどうか
 * @param plant 植物
 * @returns 必要ならtrue
 */
export function needsCure(plant: Plant): boolean {
  return !plant.isDead && plant.diseaseType !== null;
}

/**
 * 新しい植物のデフォルト状態を作成
 * @returns デフォルト状態
 */
export function createDefaultPlantCareState() {
  return {
    waterLevel: 70,
    nutritionLevel: 70,
    health: 100,
    diseaseType: null as DiseaseType | null,
    lastWateredAt: null as number | null,
    lastFertilizedAt: null as number | null,
    lastCareCheckAt: now(),
    isDead: false,
  };
}
