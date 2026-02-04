/**
 * AsyncStorage実装
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, FocusSession, Seed } from '../domain/models';
import { PlantRepository, SessionRepository, SeedRepository, SlotRepository, GachaRepository } from './repo';
import { STORAGE_KEYS } from './schema';
import { now } from '../domain/ids';

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
// SeedRepository実装
// ========================================

export class AsyncStorageSeedRepository implements SeedRepository {
  async getAllSeeds(): Promise<Seed[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SEEDS);
      if (!data) return [];
      return JSON.parse(data) as Seed[];
    } catch (error) {
      console.error('Failed to get seeds:', error);
      return [];
    }
  }

  async addSeed(seed: Seed): Promise<void> {
    try {
      const seeds = await this.getAllSeeds();
      seeds.push(seed);
      await AsyncStorage.setItem(STORAGE_KEYS.SEEDS, JSON.stringify(seeds));
    } catch (error) {
      console.error('Failed to add seed:', error);
      throw error;
    }
  }

  async removeSeed(seedId: string): Promise<void> {
    try {
      const seeds = await this.getAllSeeds();
      const filtered = seeds.filter(s => s.id !== seedId);
      await AsyncStorage.setItem(STORAGE_KEYS.SEEDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove seed:', error);
      throw error;
    }
  }
}

// ========================================
// SlotRepository実装
// ========================================

export class AsyncStorageSlotRepository implements SlotRepository {
  async getMaxSlots(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MAX_SLOTS);
      if (!data) return 3; // デフォルト3枠
      return parseInt(data, 10);
    } catch (error) {
      console.error('Failed to get max slots:', error);
      return 3;
    }
  }

  async setMaxSlots(slots: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAX_SLOTS, slots.toString());
    } catch (error) {
      console.error('Failed to set max slots:', error);
      throw error;
    }
  }
}

// ========================================
// GachaRepository実装
// ========================================

export class AsyncStorageGachaRepository implements GachaRepository {
  async getFreeGachaCount(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GACHA_FREE_COUNT);
      if (!data) return 0;
      return parseInt(data, 10);
    } catch (error) {
      console.error('Failed to get free gacha count:', error);
      return 0;
    }
  }

  async incrementFreeGachaCount(): Promise<void> {
    try {
      const count = await this.getFreeGachaCount();
      await AsyncStorage.setItem(STORAGE_KEYS.GACHA_FREE_COUNT, (count + 1).toString());
    } catch (error) {
      console.error('Failed to increment free gacha count:', error);
      throw error;
    }
  }

  async resetFreeGachaCount(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GACHA_FREE_COUNT, '0');
    } catch (error) {
      console.error('Failed to reset free gacha count:', error);
      throw error;
    }
  }

  async getLastResetDate(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GACHA_LAST_RESET);
      if (!data) return now(); // 初回は現在時刻
      return parseInt(data, 10);
    } catch (error) {
      console.error('Failed to get last reset date:', error);
      return now();
    }
  }

  async setLastResetDate(date: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GACHA_LAST_RESET, date.toString());
    } catch (error) {
      console.error('Failed to set last reset date:', error);
      throw error;
    }
  }
}

// ========================================
// デフォルトインスタンス
// ========================================

export const plantRepository = new AsyncStoragePlantRepository();
export const sessionRepository = new AsyncStorageSessionRepository();
export const seedRepository = new AsyncStorageSeedRepository();
export const slotRepository = new AsyncStorageSlotRepository();
export const gachaRepository = new AsyncStorageGachaRepository();
