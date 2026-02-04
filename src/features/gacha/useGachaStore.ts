/**
 * ガチャストア（Zustand）
 */

import { create } from 'zustand';
import { Seed } from '@core/domain/models';
import { executeGacha, getFreeGachaRemaining, shouldResetFreeGacha } from '@core/engine/gachaEngine';
import { seedRepository, gachaRepository } from '@core/storage/repo.async';
import { now } from '@core/domain/ids';

interface GachaState {
  // State
  freeGachaRemaining: number;
  lastGachaResult: Seed | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadGachaStatus: () => Promise<void>;
  executeGacha: (isFree: boolean) => Promise<Seed>;
  clearLastResult: () => void;
}

export const useGachaStore = create<GachaState>((set, get) => ({
  // Initial State
  freeGachaRemaining: 5,
  lastGachaResult: null,
  loading: false,
  error: null,

  // Load gacha status
  loadGachaStatus: async () => {
    try {
      const lastResetDate = await gachaRepository.getLastResetDate();
      const usedCount = await gachaRepository.getFreeGachaCount();
      const currentTime = now();
      
      // リセットが必要かチェック
      if (shouldResetFreeGacha(lastResetDate, currentTime)) {
        await gachaRepository.resetFreeGachaCount();
        await gachaRepository.setLastResetDate(currentTime);
        set({ freeGachaRemaining: 5 });
      } else {
        const remaining = getFreeGachaRemaining(lastResetDate, usedCount, currentTime);
        set({ freeGachaRemaining: remaining });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Execute gacha
  executeGacha: async (isFree: boolean) => {
    set({ loading: true, error: null });
    try {
      const { freeGachaRemaining } = get();
      
      // 無料ガチャの残り回数チェック
      if (isFree && freeGachaRemaining <= 0) {
        throw new Error('無料ガチャの回数が残っていません');
      }
      
      // ガチャ実行
      const seed = executeGacha(isFree);
      
      // 種を保存
      await seedRepository.addSeed(seed);
      
      // 無料ガチャの場合は回数を消費
      if (isFree) {
        await gachaRepository.incrementFreeGachaCount();
        set({ freeGachaRemaining: freeGachaRemaining - 1 });
      }
      
      set({ lastGachaResult: seed, loading: false });
      return seed;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Clear last result
  clearLastResult: () => {
    set({ lastGachaResult: null });
  },
}));
