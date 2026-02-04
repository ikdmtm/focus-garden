/**
 * ドメインモデル - 型定義
 * ビジネスロジックの中心となる型を定義
 */

// ========================================
// 突然変異の種類（5種固定）
// ========================================
export type MutationId = 
  | 'variegated'      // 斑入り
  | 'tint_shift'      // 色味変化
  | 'leaf_shape'      // 葉形変化
  | 'dwarf'           // 矮性
  | 'growth_form';    // 枝ぶり/成長癖

export const ALL_MUTATION_IDS: readonly MutationId[] = [
  'variegated',
  'tint_shift',
  'leaf_shape',
  'dwarf',
  'growth_form',
] as const;

// ========================================
// セッション時間（10/25/45/60分）
// ========================================
export type SessionMinutes = 10 | 25 | 45 | 60;

export const ALL_SESSION_MINUTES: readonly SessionMinutes[] = [
  10, 25, 45, 60
] as const;

// ========================================
// 植物個体
// ========================================
export interface Plant {
  id: string;                           // 個体ID（UUID等）
  name: string;                         // 個体名（ユーザーが命名）
  growthPoints: number;                 // 成長ポイント（GP）
  mutations: MutationId[];              // 保持している突然変異のリスト
  createdAt: number;                    // 作成日時（UNIX timestamp）
  updatedAt: number;                    // 更新日時（UNIX timestamp）
}

// ========================================
// セッション状態
// ========================================
export type SessionStatus = 
  | 'idle'          // セッション未開始
  | 'active'        // セッション実行中
  | 'completed'     // セッション完走
  | 'interrupted';  // セッション中断

export interface FocusSession {
  id: string;                           // セッションID
  plantId: string;                      // 対象の植物ID
  minutes: SessionMinutes;              // セッション時間
  status: SessionStatus;                // セッション状態
  startedAt: number | null;             // 開始日時（UNIX timestamp）
  endedAt: number | null;               // 終了日時（UNIX timestamp）
  earnedGP: number;                     // 獲得したGP
  newMutation: MutationId | null;       // 獲得した突然変異（なければnull）
}

// ========================================
// セッション結果
// ========================================
export interface SessionResult {
  earnedGP: number;                     // 獲得GP
  newMutation: MutationId | null;       // 獲得した突然変異
  completedSuccessfully: boolean;       // 完走したか
  elapsedMinutes: number;               // 経過時間（分）
}

// ========================================
// 植物作成時のパラメータ
// ========================================
export interface CreatePlantParams {
  name: string;
}

// ========================================
// セッション開始時のパラメータ
// ========================================
export interface StartSessionParams {
  plantId: string;
  minutes: SessionMinutes;
}
