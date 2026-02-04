/**
 * リポジトリインターフェース
 * ストレージ実装を抽象化（AsyncStorage, SQLite等に差し替え可能）
 */

import { Plant, FocusSession, Seed } from '../domain/models';

export interface PlantRepository {
  /**
   * すべての植物を取得
   */
  getAllPlants(): Promise<Plant[]>;

  /**
   * IDで植物を取得
   */
  getPlantById(id: string): Promise<Plant | null>;

  /**
   * 植物を保存（作成または更新）
   */
  savePlant(plant: Plant): Promise<void>;

  /**
   * 植物を削除
   */
  deletePlant(id: string): Promise<void>;
}

export interface SessionRepository {
  /**
   * すべてのセッションを取得
   */
  getAllSessions(): Promise<FocusSession[]>;

  /**
   * 植物IDでセッションを取得
   */
  getSessionsByPlantId(plantId: string): Promise<FocusSession[]>;

  /**
   * アクティブなセッションを取得
   */
  getActiveSession(): Promise<FocusSession | null>;

  /**
   * セッションを保存（作成または更新）
   */
  saveSession(session: FocusSession): Promise<void>;

  /**
   * アクティブなセッションを設定
   */
  setActiveSession(session: FocusSession | null): Promise<void>;
}

export interface SeedRepository {
  /**
   * すべての種を取得
   */
  getAllSeeds(): Promise<Seed[]>;

  /**
   * 種を追加
   */
  addSeed(seed: Seed): Promise<void>;

  /**
   * 種を削除（植えたとき）
   */
  removeSeed(seedId: string): Promise<void>;
}

export interface SlotRepository {
  /**
   * 最大枠数を取得
   */
  getMaxSlots(): Promise<number>;

  /**
   * 最大枠数を設定（課金拡張時）
   */
  setMaxSlots(slots: number): Promise<void>;
}

export interface GachaRepository {
  /**
   * 無料ガチャの使用回数を取得
   */
  getFreeGachaCount(): Promise<number>;

  /**
   * 無料ガチャの使用回数を増やす
   */
  incrementFreeGachaCount(): Promise<void>;

  /**
   * 無料ガチャの使用回数をリセット
   */
  resetFreeGachaCount(): Promise<void>;

  /**
   * 最後にリセットした日付を取得
   */
  getLastResetDate(): Promise<number>;

  /**
   * 最後にリセットした日付を設定
   */
  setLastResetDate(date: number): Promise<void>;
}
