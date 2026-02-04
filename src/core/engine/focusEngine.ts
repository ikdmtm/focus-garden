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
  StartSessionParams,
  SessionMinutes,
  MutationId,
} from '../domain/models';
import { generateId, now } from '../domain/ids';
import { calcGrowthPoints, rollMutation, addMutation, minutesToMs } from '../domain/rules';
import { RNG, defaultRNG } from '../domain/rng';

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
    plantId: params.plantId,
    minutes: params.minutes,
    status: 'active',
    startedAt: currentTime,
    endedAt: null,
    earnedGP: 0,
    newMutation: null,
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
 * セッションを完走させる
 * @param session セッション
 * @param plant 植物個体
 * @param currentTime 現在時刻
 * @param rng 乱数生成器
 * @returns 更新されたセッション
 */
export function completeSession(
  session: FocusSession,
  plant: Plant,
  currentTime: number,
  rng: RNG = defaultRNG
): FocusSession {
  if (session.status !== 'active') {
    throw new Error('Cannot complete non-active session');
  }
  
  const elapsed = calculateElapsed(session, currentTime);
  const earnedGP = calcGrowthPoints(elapsed);
  
  // 突然変異抽選（完走時のみ）
  const newMutation = rollMutation(plant, session.minutes, rng);
  
  return {
    ...session,
    status: 'completed',
    endedAt: currentTime,
    earnedGP,
    newMutation,
  };
}

/**
 * セッションを中断する
 * @param session セッション
 * @param currentTime 現在時刻
 * @returns 更新されたセッション
 */
export function interruptSession(
  session: FocusSession,
  currentTime: number
): FocusSession {
  if (session.status !== 'active') {
    throw new Error('Cannot interrupt non-active session');
  }
  
  const elapsed = calculateElapsed(session, currentTime);
  const earnedGP = calcGrowthPoints(elapsed);
  
  return {
    ...session,
    status: 'interrupted',
    endedAt: currentTime,
    earnedGP,
    newMutation: null, // 中断時は突然変異なし
  };
}

/**
 * セッション結果を取得
 * @param session セッション
 * @returns セッション結果
 */
export function getSessionResult(session: FocusSession): SessionResult {
  if (!session.endedAt || !session.startedAt) {
    throw new Error('Session not ended');
  }
  
  const elapsedMs = session.endedAt - session.startedAt;
  const elapsedMinutes = elapsedMs / 1000 / 60;
  
  return {
    earnedGP: session.earnedGP,
    newMutation: session.newMutation,
    completedSuccessfully: session.status === 'completed',
    elapsedMinutes,
  };
}

// ========================================
// 植物更新
// ========================================

/**
 * セッション結果を植物に適用
 * @param plant 植物個体
 * @param result セッション結果
 * @returns 更新された植物個体
 */
export function applySessionResult(plant: Plant, result: SessionResult): Plant {
  let updated: Plant = {
    ...plant,
    growthPoints: plant.growthPoints + result.earnedGP,
    updatedAt: now(),
  };
  
  // 突然変異を獲得した場合は追加
  if (result.newMutation) {
    updated = addMutation(updated, result.newMutation);
  }
  
  return updated;
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
