/**
 * 植物管理ストア（Zustand）
 */

import { create } from 'zustand';
import { Plant, FocusSession, SessionMinutes, CreatePlantParams } from '@core/domain/models';
import { generateId, now } from '@core/domain/ids';
import { plantRepository, sessionRepository } from '@core/storage/repo.async';
import {
  startSession as engineStartSession,
  completeSession,
  interruptSession,
  isSessionCompleted,
  applySessionResult,
  getSessionResult,
  getSessionProgress,
  getSessionRemainingTime,
} from '@core/engine/focusEngine';

interface PlantsState {
  // State
  plants: Plant[];
  activeSession: FocusSession | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadPlants: () => Promise<void>;
  createPlant: (params: CreatePlantParams) => Promise<Plant>;
  deletePlant: (id: string) => Promise<void>;
  
  // Session Actions
  startSession: (plantId: string, minutes: SessionMinutes) => Promise<void>;
  checkSessionCompletion: () => Promise<void>;
  completeCurrentSession: () => Promise<void>;
  interruptCurrentSession: () => Promise<void>;
  
  // Helpers
  getPlantById: (id: string) => Plant | undefined;
  getCurrentProgress: () => number;
  getRemainingTime: () => number;
}

export const usePlantsStore = create<PlantsState>((set, get) => ({
  // Initial State
  plants: [],
  activeSession: null,
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

  // Start new session
  startSession: async (plantId: string, minutes: SessionMinutes) => {
    set({ loading: true, error: null });
    try {
      const plant = get().plants.find(p => p.id === plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      const session = engineStartSession({ plantId, minutes });
      
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
    const { activeSession } = get();
    if (!activeSession || activeSession.status !== 'active') return;

    const currentTime = now();
    if (isSessionCompleted(activeSession, currentTime)) {
      await get().completeCurrentSession();
    }
  },

  // Complete current session
  completeCurrentSession: async () => {
    const { activeSession, plants } = get();
    if (!activeSession || activeSession.status !== 'active') return;

    set({ loading: true, error: null });
    try {
      const plant = plants.find(p => p.id === activeSession.plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      // Complete session
      const currentTime = now();
      const completedSession = completeSession(activeSession, plant, currentTime);
      
      // Apply result to plant
      const result = getSessionResult(completedSession);
      const updatedPlant = applySessionResult(plant, result);
      
      // Save to storage
      await sessionRepository.saveSession(completedSession);
      await sessionRepository.setActiveSession(null);
      await plantRepository.savePlant(updatedPlant);
      
      // Update state
      const updatedPlants = plants.map(p => 
        p.id === updatedPlant.id ? updatedPlant : p
      );
      
      set({ 
        plants: updatedPlants, 
        activeSession: null, 
        loading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Interrupt current session
  interruptCurrentSession: async () => {
    const { activeSession, plants } = get();
    if (!activeSession || activeSession.status !== 'active') return;

    set({ loading: true, error: null });
    try {
      const plant = plants.find(p => p.id === activeSession.plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      // Interrupt session
      const currentTime = now();
      const interruptedSession = interruptSession(activeSession, currentTime);
      
      // Apply result to plant
      const result = getSessionResult(interruptedSession);
      const updatedPlant = applySessionResult(plant, result);
      
      // Save to storage
      await sessionRepository.saveSession(interruptedSession);
      await sessionRepository.setActiveSession(null);
      await plantRepository.savePlant(updatedPlant);
      
      // Update state
      const updatedPlants = plants.map(p => 
        p.id === updatedPlant.id ? updatedPlant : p
      );
      
      set({ 
        plants: updatedPlants, 
        activeSession: null, 
        loading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
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
