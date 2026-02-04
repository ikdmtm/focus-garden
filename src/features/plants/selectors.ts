/**
 * セレクター関数
 * Zustandストアから派生データを取得
 */

import { usePlantsStore } from './usePlantsStore';
import { calcGrowthPercentage, isFullyGrown } from '@core/domain/rules';

/**
 * 成長度でソートされた植物リストを取得
 */
export function useSortedPlants() {
  return usePlantsStore(state => 
    [...state.plants].sort((a, b) => b.growthPoints - a.growthPoints)
  );
}

/**
 * アクティブセッションの植物を取得
 */
export function useActivePlant() {
  return usePlantsStore(state => {
    if (!state.activeSession) return null;
    return state.getPlantById(state.activeSession.plantId) || null;
  });
}

/**
 * 植物の成長度を取得
 */
export function usePlantGrowth(plantId: string) {
  return usePlantsStore(state => {
    const plant = state.getPlantById(plantId);
    if (!plant) return { percentage: 0, isFullyGrown: false };
    
    return {
      percentage: calcGrowthPercentage(plant.growthPoints),
      isFullyGrown: isFullyGrown(plant.growthPoints),
    };
  });
}

/**
 * セッション情報を取得
 */
export function useSessionInfo() {
  return usePlantsStore(state => ({
    isActive: state.activeSession?.status === 'active',
    progress: state.getCurrentProgress(),
    remainingTime: state.getRemainingTime(),
    session: state.activeSession,
  }));
}
