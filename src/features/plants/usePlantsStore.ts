/**
 * 植物管理ストア（Zustand）
 * 全植物同時育成対応版
 */

import { create } from 'zustand';
import { Plant, FocusSession, SessionMinutes, CreatePlantParams, PlantSessionResult } from '@core/domain/models';
import { generateId, now } from '@core/domain/ids';
import { plantRepository, sessionRepository } from '@core/storage/repo.async';
import {
  startSession as engineStartSession,
  completeSession,
  interruptSession,
  isSessionCompleted,
  applySessionResults,
  getSessionProgress,
  getSessionRemainingTime,
} from '@core/engine/focusEngine';

interface PlantsState {
  // State
  plants: Plant[];
  activeSession: FocusSession | null;
  lastSessionResults: PlantSessionResult[];  // 直前のセッション結果（結果モーダル用）
  loading: boolean;
  error: string | null;

  // Actions
  loadPlants: () => Promise<void>;
  createPlant: (params: CreatePlantParams) => Promise<Plant>;
  deletePlant: (id: string) => Promise<void>;
  
  // Session Actions
  startSession: (minutes: SessionMinutes) => Promise<void>;
  checkSessionCompletion: () => Promise<void>;
  interruptCurrentSession: () => Promise<void>;
  clearSessionResults: () => void;
  
  // Helpers
  getPlantById: (id: string) => Plant | undefined;
  getCurrentProgress: () => number;
  getRemainingTime: () => number;
}

export const usePlantsStore = create<PlantsState>((set, get) => ({
  // Initial State
  plants: [],
  activeSession: null,
  lastSessionResults: [],
  loading: false,
  error: null,

  // Load plants from storage
  loadPlants: async () => {
    set({ loading: true, error: null });
    try {
      const plants = await plantRepository.getAllPlants();
      const activeSession = await sessionRepository.getActiveSession();
      set({ plants, activeSession, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Create new plant
  createPlant: async (params: CreatePlantParams) => {
    set({ loading: true, error: null });
    try {
      const plant: Plant = {
        id: generateId(),
        name: params.name,
        growthPoints: 0,
        mutations: [],
        createdAt: now(),
        updatedAt: now(),
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
