/**
 * AsyncStorage実装
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, FocusSession } from '../domain/models';
import { PlantRepository, SessionRepository } from './repo';
import { STORAGE_KEYS } from './schema';

// ========================================
// PlantRepository実装
// ========================================

export class AsyncStoragePlantRepository implements PlantRepository {
  async getAllPlants(): Promise<Plant[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLANTS);
      if (!data) return [];
      return JSON.parse(data) as Plant[];
    } catch (error) {
      console.error('Failed to get plants:', error);
      return [];
    }
  }

  async getPlantById(id: string): Promise<Plant | null> {
    const plants = await this.getAllPlants();
    return plants.find(p => p.id === id) || null;
  }

  async savePlant(plant: Plant): Promise<void> {
    try {
      const plants = await this.getAllPlants();
      const index = plants.findIndex(p => p.id === plant.id);
      
      if (index >= 0) {
        // 更新
        plants[index] = plant;
      } else {
        // 新規追加
        plants.push(plant);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
    } catch (error) {
      console.error('Failed to save plant:', error);
      throw error;
    }
  }

  async deletePlant(id: string): Promise<void> {
    try {
      const plants = await this.getAllPlants();
      const filtered = plants.filter(p => p.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete plant:', error);
      throw error;
    }
  }
}

// ========================================
// SessionRepository実装
// ========================================

export class AsyncStorageSessionRepository implements SessionRepository {
  async getAllSessions(): Promise<FocusSession[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) return [];
      return JSON.parse(data) as FocusSession[];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  async getSessionsByPlantId(plantId: string): Promise<FocusSession[]> {
    // 全植物対応版では植物IDでの絞り込みは廃止
    // 互換性のため空配列を返す
    return [];
  }

  async getActiveSession(): Promise<FocusSession | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (!data) return null;
      return JSON.parse(data) as FocusSession;
    } catch (error) {
      console.error('Failed to get active session:', error);
      return null;
    }
  }

  async saveSession(session: FocusSession): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        // 更新
        sessions[index] = session;
      } else {
        // 新規追加
        sessions.push(session);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  async setActiveSession(session: FocusSession | null): Promise<void> {
    try {
      if (session === null) {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Failed to set active session:', error);
      throw error;
    }
  }
}

// ========================================
// デフォルトインスタンス
// ========================================

export const plantRepository = new AsyncStoragePlantRepository();
export const sessionRepository = new AsyncStorageSessionRepository();
