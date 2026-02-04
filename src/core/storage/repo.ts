/**
 * リポジトリインターフェース
 * ストレージ実装を抽象化（AsyncStorage, SQLite等に差し替え可能）
 */

import { Plant, FocusSession } from '../domain/models';

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
