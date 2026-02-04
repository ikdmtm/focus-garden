/**
 * セッションエンジン - セッション状態を管理
 * 
 * 時刻入力で状態遷移を計算する純関数的なエンジン
 * UI非依存で、テスト可能
 */

import {
  Plant,
  FocusSession,
  SessionStatus,
  SessionResult,
  PlantSessionResult,
  StartSessionParams,
  SessionMinutes,
  MutationId,
} from '../domain/models';
import { generateId, now } from '../domain/ids';
import { calcGrowthPoints, rollMutation, addMutation, minutesToMs } from '../domain/rules';
import { RNG, defaultRNG } from '../domain/rng';

// ========================================
// ヘルパー関数
// ========================================

/**
 * 植物の状態に応じたGP獲得倍率を計算
 * @param plant 植物
 * @returns GP倍率（0.0-1.0）
 */
function calculateCareMultiplier(plant: Plant): number {
  // 枯れている場合は0
  if (plant.isDead) {
    return 0;
  }
  
  let multiplier = 1.0;
  
  // 水分が低い場合、倍率を下げる
  if (plant.waterLevel < 30) {
    multiplier *= 0.3; // 70%減
  } else if (plant.waterLevel < 50) {
    multiplier *= 0.7; // 30%減
  }
  
  // 栄養が低い場合、倍率を下げる
  if (plant.nutritionLevel < 20) {
    multiplier *= 0.3; // 70%減
  } else if (plant.nutritionLevel < 40) {
    multiplier *= 0.7; // 30%減
  }
  
  // 病気の場合、倍率を下げる
  if (plant.diseaseType) {
    multiplier *= 0.5; // 50%減
  }
  
  // 健康度が低い場合、倍率を下げる
  if (plant.health < 30) {
    multiplier *= 0.2; // 80%減
  } else if (plant.health < 60) {
    multiplier *= 0.6; // 40%減
  }
  
  return multiplier;
}

// ========================================
// セッション作成
// ========================================

/**
 * 新しいセッションを開始
 * @param params セッション開始パラメータ
 * @param currentTime 現在時刻（デフォルトは現在）
 * @returns 新しいセッション
 */
export function startSession(
  params: StartSessionParams,
  currentTime: number = now()
): FocusSession {
  return {
    id: generateId(),
    minutes: params.minutes,
    status: 'active',
    startedAt: currentTime,
    endedAt: null,
  };
}

// ========================================
// セッション更新
// ========================================

/**
 * セッションの経過時間を計算
 * @param session セッション
 * @param currentTime 現在時刻
 * @returns 経過時間（ミリ秒）
 */
function calculateElapsed(session: FocusSession, currentTime: number): number {
  if (!session.startedAt) return 0;
  return currentTime - session.startedAt;
}

/**
 * セッションが完了しているか判定
 * @param session セッション
 * @param currentTime 現在時刻
 * @returns 完了していればtrue
 */
export function isSessionCompleted(session: FocusSession, currentTime: number): boolean {
  if (session.status !== 'active') return false;
  
  const elapsed = calculateElapsed(session, currentTime);
  const duration = minutesToMs(session.minutes);
  return elapsed >= duration;
}

/**
 * セッションを完走させる（全植物対応）
 * @param session セッション
 * @param plants 育成中の全植物
 * @param currentTime 現在時刻
 * @param rng 乱数生成器
 * @returns 更新されたセッションと植物の結果
 */
export function completeSession(
  session: FocusSession,
  plants: Plant[],
  currentTime: number,
  rng: RNG = defaultRNG
): { session: FocusSession; plantResults: PlantSessionResult[] } {
  if (session.status !== 'active') {
    throw new Error('Cannot complete non-active session');
  }
  
  // 各植物の結果を計算
  const plantResults: PlantSessionResult[] = plants.map(plant => {
    const baseGP = calcGrowthPoints(session.minutes);
    
    // 植物の状態に応じてGPを調整
    const careMultiplier = calculateCareMultiplier(plant);
    const earnedGP = Math.floor(baseGP * careMultiplier);
    
    const newMutation = rollMutation(plant, session.minutes, rng);
    
    return {
      plantId: plant.id,
      earnedGP,
      newMutation,
    };
  });
  
  const updatedSession: FocusSession = {
    ...session,
    status: 'completed',
    endedAt: currentTime,
  };
  
  return {
    session: updatedSession,
    plantResults,
  };
}

/**
 * セッションを中断する（全植物対応）
 * @param session セッション
 * @param plants 育成中の全植物
 * @param currentTime 現在時刻
 * @returns 更新されたセッションと植物の結果
 */
export function interruptSession(
  session: FocusSession,
  plants: Plant[],
  currentTime: number
): { session: FocusSession; plantResults: PlantSessionResult[] } {
  if (session.status !== 'active') {
    throw new Error('Cannot interrupt non-active session');
  }
  
  // 中断時はGP獲得なし（仕様変更）
  const plantResults: PlantSessionResult[] = plants.map(plant => {
    return {
      plantId: plant.id,
      earnedGP: 0, // 中断時はGPゼロ
      newMutation: null, // 中断時は突然変異なし
    };
  });
  
  const updatedSession: FocusSession = {
    ...session,
    status: 'interrupted',
    endedAt: currentTime,
  };
  
  return {
    session: updatedSession,
    plantResults,
  };
}

/**
 * セッション結果を取得
 * @param session セッション
 * @param plantResults 植物の結果
 * @returns セッション結果
 */
export function getSessionResult(
  session: FocusSession,
  plantResults: PlantSessionResult[]
): SessionResult {
  if (!session.endedAt || !session.startedAt) {
    throw new Error('Session not ended');
  }
  
  const elapsedMs = session.endedAt - session.startedAt;
  const elapsedMinutes = elapsedMs / 1000 / 60;
  
  return {
    completedSuccessfully: session.status === 'completed',
    elapsedMinutes,
    plantResults,
  };
}

// ========================================
// 植物更新
// ========================================

/**
 * 植物の結果を植物に適用
 * @param plant 植物個体
 * @param plantResult 植物の結果
 * @returns 更新された植物個体
 */
export function applyPlantResult(plant: Plant, plantResult: PlantSessionResult): Plant {
  let updated: Plant = {
    ...plant,
    growthPoints: plant.growthPoints + plantResult.earnedGP,
    updatedAt: now(),
  };
  
  // 突然変異を獲得した場合は追加
  if (plantResult.newMutation) {
    updated = addMutation(updated, plantResult.newMutation);
  }
  
  return updated;
}

/**
 * 複数の植物に結果を適用
 * @param plants 植物リスト
 * @param plantResults 植物の結果リスト
 * @returns 更新された植物リスト
 */
export function applySessionResults(
  plants: Plant[],
  plantResults: PlantSessionResult[]
): Plant[] {
  return plants.map(plant => {
    const result = plantResults.find(r => r.plantId === plant.id);
    if (!result) return plant;
    return applyPlantResult(plant, result);
  });
}

// ========================================
// セッション進行管理
// ========================================

/**
 * セッション進行状況を取得
 * @param session セッション
 * @param currentTime 現在時刻
 * @returns 進行状況（0.0-1.0）
 */
export function getSessionProgress(session: FocusSession, currentTime: number): number {
  if (session.status !== 'active' || !session.startedAt) {
    return 0;
  }
  
  const elapsed = calculateElapsed(session, currentTime);
  const duration = minutesToMs(session.minutes);
  const progress = elapsed / duration;
  
  return Math.min(1.0, Math.max(0, progress));
}

/**
 * セッション残り時間を取得（ミリ秒）
 * @param session セッション
 * @param currentTime 現在時刻
 * @returns 残り時間（ミリ秒）
 */
export function getSessionRemainingTime(session: FocusSession, currentTime: number): number {
  if (session.status !== 'active' || !session.startedAt) {
    return 0;
  }
  
  const elapsed = calculateElapsed(session, currentTime);
  const duration = minutesToMs(session.minutes);
  const remaining = duration - elapsed;
  
  return Math.max(0, remaining);
}
