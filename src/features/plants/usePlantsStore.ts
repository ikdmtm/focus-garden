/**
 * 植物管理ストア（Zustand）
 * 全植物同時育成対応版
 */

import { create } from 'zustand';
import { Plant, FocusSession, SessionMinutes, CreatePlantParams, PlantSessionResult, Seed } from '@core/domain/models';
import { generateId, now } from '@core/domain/ids';
import { plantRepository, sessionRepository, seedRepository, slotRepository } from '@core/storage/repo.async';
import { getSpeciesById, PLANT_SPECIES } from '@core/domain/species';
import {
  startSession as engineStartSession,
  completeSession,
  interruptSession,
  isSessionCompleted,
  applySessionResults,
  getSessionProgress,
  getSessionRemainingTime,
} from '@core/engine/focusEngine';
import { 
  createDefaultPlantCareState, 
  updatePlantState, 
  waterPlant, 
  fertilizePlant, 
  curePlant 
} from '@core/engine/careEngine';

interface PlantsState {
  // State
  plants: Plant[];
  seeds: Seed[];
  maxSlots: number;
  activeSession: FocusSession | null;
  lastSessionResults: PlantSessionResult[];  // 直前のセッション結果（結果モーダル用）
  loading: boolean;
  error: string | null;

  // Actions
  loadPlants: () => Promise<void>;
  loadSeeds: () => Promise<void>;
  loadMaxSlots: () => Promise<void>;
  createPlant: (params: CreatePlantParams) => Promise<Plant>;
  deletePlant: (id: string) => Promise<void>;
  plantSeed: (seedId: string, slotIndex: number, nickname?: string) => Promise<Plant>;
  
  // Session Actions
  startSession: (minutes: SessionMinutes) => Promise<void>;
  checkSessionCompletion: () => Promise<void>;
  interruptCurrentSession: () => Promise<void>;
  clearSessionResults: () => void;
  
  // Care Actions
  updateAllPlantsState: () => Promise<void>;
  waterPlantById: (plantId: string) => Promise<void>;
  fertilizePlantById: (plantId: string) => Promise<void>;
  curePlantById: (plantId: string) => Promise<void>;
  
  // Helpers
  getPlantById: (id: string) => Plant | undefined;
  getCurrentProgress: () => number;
  getRemainingTime: () => number;
}

export const usePlantsStore = create<PlantsState>((set, get) => ({
  // Initial State
  plants: [],
  seeds: [],
  maxSlots: 3,
  activeSession: null,
  lastSessionResults: [],
  loading: false,
  error: null,

  // Load plants from storage
  loadPlants: async () => {
    set({ loading: true, error: null });
    try {
      const rawPlants = await plantRepository.getAllPlants();
      const activeSession = await sessionRepository.getActiveSession();
      const currentTime = now();
      
      // 既存データに欠けているフィールドを補完
      const plants = rawPlants.map(plant => {
        const careState = createDefaultPlantCareState();
        
        // lastCareCheckAtが未定義の場合は現在時刻を設定（過去からの経過時間を計算しない）
        const lastCareCheckAt = plant.lastCareCheckAt !== undefined ? plant.lastCareCheckAt : currentTime;
        
        return {
          ...careState, // デフォルト値
          ...plant,     // 既存の値で上書き
          lastCareCheckAt, // lastCareCheckAtを明示的に設定
        };
      });
      
      set({ plants, activeSession, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Load seeds
  loadSeeds: async () => {
    try {
      const seeds = await seedRepository.getAllSeeds();
      set({ seeds });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Load max slots
  loadMaxSlots: async () => {
    try {
      const maxSlots = await slotRepository.getMaxSlots();
      set({ maxSlots });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Create new plant (一時的に後方互換性のため残す)
  createPlant: async (params: CreatePlantParams) => {
    set({ loading: true, error: null });
    try {
      const careState = createDefaultPlantCareState();
      
      const plant: Plant = {
        id: generateId(),
        speciesId: params.speciesId,
        slotIndex: params.slotIndex,
        nickname: params.nickname || null,
        growthPoints: 0,
        mutations: [],
        plantedAt: now(),
        updatedAt: now(),
        ...careState,
      };
      
      await plantRepository.savePlant(plant);
      
      const plants = [...get().plants, plant];
      set({ plants, loading: false });
      
      return plant;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Plant a seed
  plantSeed: async (seedId: string, slotIndex: number, nickname?: string) => {
    set({ loading: true, error: null });
    try {
      const { seeds, plants, maxSlots } = get();
      
      // 種を探す
      const seed = seeds.find(s => s.id === seedId);
      if (!seed) {
        throw new Error('種が見つかりません');
      }
      
      // 枠のチェック
      if (slotIndex < 0 || slotIndex >= maxSlots) {
        throw new Error('無効な枠です');
      }
      
      // 枠が空いているかチェック
      if (plants.find(p => p.slotIndex === slotIndex)) {
        throw new Error('この枠は既に使用されています');
      }
      
      // 植物の総数チェック
      if (plants.length >= maxSlots) {
        throw new Error('育成枠が満杯です');
      }
      
      // 植物を作成
      const careState = createDefaultPlantCareState();
      
      const plant: Plant = {
        id: generateId(),
        speciesId: seed.speciesId,
        slotIndex,
        nickname: nickname || null,
        growthPoints: 0,
        mutations: [],
        plantedAt: now(),
        updatedAt: now(),
        ...careState,
      };
      
      // 保存
      await plantRepository.savePlant(plant);
      await seedRepository.removeSeed(seedId);
      
      // 状態更新
      const updatedPlants = [...plants, plant];
      const updatedSeeds = seeds.filter(s => s.id !== seedId);
      
      set({ plants: updatedPlants, seeds: updatedSeeds, loading: false });
      
      return plant;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Delete plant
  deletePlant: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await plantRepository.deletePlant(id);
      
      const plants = get().plants.filter(p => p.id !== id);
      set({ plants, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Start new session (全植物対象)
  startSession: async (minutes: SessionMinutes) => {
    set({ loading: true, error: null });
    try {
      const { plants } = get();
      
      if (plants.length === 0) {
        throw new Error('育成中の植物がありません');
      }

      const session = engineStartSession({ minutes });
      
      await sessionRepository.saveSession(session);
      await sessionRepository.setActiveSession(session);
      
      set({ activeSession: session, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Check if session should be completed automatically
  checkSessionCompletion: async () => {
    const { activeSession, plants } = get();
    if (!activeSession || activeSession.status !== 'active') return;

    const currentTime = now();
    if (isSessionCompleted(activeSession, currentTime)) {
      // 自動完了
      set({ loading: true, error: null });
      try {
        // Complete session（全植物処理）
        const { session: completedSession, plantResults } = completeSession(
          activeSession,
          plants,
          currentTime
        );
        
        // Apply results to all plants
        const updatedPlants = applySessionResults(plants, plantResults);
        
        // Save to storage
        await sessionRepository.saveSession(completedSession);
        await sessionRepository.setActiveSession(null);
        
        // Save all updated plants
        for (const plant of updatedPlants) {
          await plantRepository.savePlant(plant);
        }
        
        // Update state
        set({ 
          plants: updatedPlants, 
          activeSession: null,
          lastSessionResults: plantResults,
          loading: false 
        });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
    }
  },

  // Interrupt current session
  interruptCurrentSession: async () => {
    const { activeSession, plants } = get();
    if (!activeSession || activeSession.status !== 'active') return;

    set({ loading: true, error: null });
    try {
      // Interrupt session（全植物処理）
      const currentTime = now();
      const { session: interruptedSession, plantResults } = interruptSession(
        activeSession,
        plants,
        currentTime
      );
      
      // Apply results to all plants
      const updatedPlants = applySessionResults(plants, plantResults);
      
      // Save to storage
      await sessionRepository.saveSession(interruptedSession);
      await sessionRepository.setActiveSession(null);
      
      // Save all updated plants
      for (const plant of updatedPlants) {
        await plantRepository.savePlant(plant);
      }
      
      // Update state
      set({ 
        plants: updatedPlants, 
        activeSession: null,
        lastSessionResults: plantResults,
        loading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Clear session results (モーダルを閉じたときに呼ぶ)
  clearSessionResults: () => {
    set({ lastSessionResults: [] });
  },

  // Update all plants state (時間経過による状態変化)
  updateAllPlantsState: async () => {
    try {
      const { plants } = get();
      const currentTime = now();
      
      const updatedPlants = plants.map(plant => 
        updatePlantState(plant, currentTime)
      );
      
      // Save all updated plants
      for (const plant of updatedPlants) {
        await plantRepository.savePlant(plant);
      }
      
      set({ plants: updatedPlants });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Water a plant
  waterPlantById: async (plantId: string) => {
    try {
      const { plants } = get();
      const plant = plants.find(p => p.id === plantId);
      
      if (!plant) {
        throw new Error('植物が見つかりません');
      }
      
      const updatedPlant = waterPlant(plant);
      await plantRepository.savePlant(updatedPlant);
      
      const updatedPlants = plants.map(p => 
        p.id === plantId ? updatedPlant : p
      );
      
      set({ plants: updatedPlants });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Fertilize a plant
  fertilizePlantById: async (plantId: string) => {
    try {
      const { plants } = get();
      const plant = plants.find(p => p.id === plantId);
      
      if (!plant) {
        throw new Error('植物が見つかりません');
      }
      
      const updatedPlant = fertilizePlant(plant);
      await plantRepository.savePlant(updatedPlant);
      
      const updatedPlants = plants.map(p => 
        p.id === plantId ? updatedPlant : p
      );
      
      set({ plants: updatedPlants });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Cure a plant
  curePlantById: async (plantId: string) => {
    try {
      const { plants } = get();
      const plant = plants.find(p => p.id === plantId);
      
      if (!plant) {
        throw new Error('植物が見つかりません');
      }
      
      const updatedPlant = curePlant(plant);
      await plantRepository.savePlant(updatedPlant);
      
      const updatedPlants = plants.map(p => 
        p.id === plantId ? updatedPlant : p
      );
      
      set({ plants: updatedPlants });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Helper: Get plant by ID
  getPlantById: (id: string) => {
    return get().plants.find(p => p.id === id);
  },

  // Helper: Get current session progress (0.0-1.0)
  getCurrentProgress: () => {
    const { activeSession } = get();
    if (!activeSession || activeSession.status !== 'active') return 0;
    
    return getSessionProgress(activeSession, now());
  },

  // Helper: Get remaining time in milliseconds
  getRemainingTime: () => {
    const { activeSession } = get();
    if (!activeSession || activeSession.status !== 'active') return 0;
    
    return getSessionRemainingTime(activeSession, now());
  },
}));
