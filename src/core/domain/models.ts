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
  speciesId: string;                    // 植物種のID
  slotIndex: number;                    // 育成枠のインデックス（0-8）
  nickname: string | null;              // ニックネーム（ユーザーが命名、オプション）
  growthPoints: number;                 // 成長ポイント（GP）
  mutations: MutationId[];              // 保持している突然変異のリスト
  plantedAt: number;                    // 植えた日時（UNIX timestamp）
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
  minutes: SessionMinutes;              // セッション時間
  status: SessionStatus;                // セッション状態
  startedAt: number | null;             // 開始日時（UNIX timestamp）
  endedAt: number | null;               // 終了日時（UNIX timestamp）
}

// ========================================
// セッション結果
// ========================================
export interface PlantSessionResult {
  plantId: string;                      // 植物ID
  earnedGP: number;                     // 獲得GP
  newMutation: MutationId | null;       // 獲得した突然変異
}

export interface SessionResult {
  completedSuccessfully: boolean;       // 完走したか
  elapsedMinutes: number;               // 経過時間（分）
  plantResults: PlantSessionResult[];   // 各植物の結果
}

// ========================================
// 種（Seed）
// ========================================
export interface Seed {
  id: string;                           // 種のID
  speciesId: string;                    // 植物種のID
  obtainedAt: number;                   // 入手日時（UNIX timestamp）
}

// ========================================
// 植物作成時のパラメータ
// ========================================
export interface CreatePlantParams {
  speciesId: string;                    // 植物種のID
  slotIndex: number;                    // 植える枠のインデックス
  nickname?: string;                    // ニックネーム（オプション）
}

// ========================================
// セッション開始時のパラメータ
// ========================================
export interface StartSessionParams {
  minutes: SessionMinutes;
}
