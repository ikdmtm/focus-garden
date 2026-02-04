/**
 * セッションエンジンのテスト
 */

import {
  startSession,
  completeSession,
  interruptSession,
  isSessionCompleted,
  getSessionResult,
  applySessionResult,
  getSessionProgress,
  getSessionRemainingTime,
} from '../engine/focusEngine';
import { Plant, FocusSession } from '../domain/models';
import { createFixedRNG, createSequenceRNG } from '../domain/rng';
import { minutesToMs } from '../domain/rules';

describe('セッションエンジン', () => {
  const mockPlant: Plant = {
    id: 'plant-1',
    name: 'テスト植物',
    growthPoints: 10,
    mutations: [],
    createdAt: 1000,
    updatedAt: 1000,
  };

  const startTime = 10000;
  
  describe('セッション開始', () => {
    test('新しいセッションを作成', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      expect(session.plantId).toBe('plant-1');
      expect(session.minutes).toBe(10);
      expect(session.status).toBe('active');
      expect(session.startedAt).toBe(startTime);
      expect(session.endedAt).toBeNull();
      expect(session.earnedGP).toBe(0);
      expect(session.newMutation).toBeNull();
    });
  });

  describe('セッション完走', () => {
    test('10分経過で完走', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      const endTime = startTime + minutesToMs(10);
      const rng = createFixedRNG(0.99); // 外れ
      
      const completed = completeSession(session, mockPlant, endTime, rng);
      
      expect(completed.status).toBe('completed');
      expect(completed.endedAt).toBe(endTime);
      expect(completed.earnedGP).toBe(1); // 10分 = 1 GP
      expect(completed.newMutation).toBeNull();
    });

    test('完走時に突然変異を獲得', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      const endTime = startTime + minutesToMs(10);
      // 当たり（0.001 < 0.005）、変異選択で最初の要素
      const rng = createSequenceRNG([0.001, 0.0]);
      
      const completed = completeSession(session, mockPlant, endTime, rng);
      
      expect(completed.status).toBe('completed');
      expect(completed.newMutation).toBe('variegated');
    });

    test('非activeセッションは完走できない', () => {
      const session: FocusSession = {
        id: 'session-1',
        plantId: 'plant-1',
        minutes: 10,
        status: 'completed',
        startedAt: startTime,
        endedAt: null,
        earnedGP: 0,
        newMutation: null,
      };
      
      expect(() => {
        completeSession(session, mockPlant, startTime + 1000);
      }).toThrow('Cannot complete non-active session');
    });
  });

  describe('セッション中断', () => {
    test('中断時は突然変異なし', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      const interruptTime = startTime + minutesToMs(5);
      const interrupted = interruptSession(session, interruptTime);
      
      expect(interrupted.status).toBe('interrupted');
      expect(interrupted.endedAt).toBe(interruptTime);
      expect(interrupted.earnedGP).toBe(0); // 5分では0 GP
      expect(interrupted.newMutation).toBeNull();
    });

    test('中断でも経過したGPは加算される', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 60 },
        startTime
      );
      
      const interruptTime = startTime + minutesToMs(25);
      const interrupted = interruptSession(session, interruptTime);
      
      expect(interrupted.earnedGP).toBe(2); // 25分 = 2 GP
    });

    test('非activeセッションは中断できない', () => {
      const session: FocusSession = {
        id: 'session-1',
        plantId: 'plant-1',
        minutes: 10,
        status: 'completed',
        startedAt: startTime,
        endedAt: null,
        earnedGP: 0,
        newMutation: null,
      };
      
      expect(() => {
        interruptSession(session, startTime + 1000);
      }).toThrow('Cannot interrupt non-active session');
    });
  });

  describe('セッション完了判定', () => {
    test('時間が経過していれば完了', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      const checkTime = startTime + minutesToMs(10);
      expect(isSessionCompleted(session, checkTime)).toBe(true);
    });

    test('時間が経過していなければ未完了', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      const checkTime = startTime + minutesToMs(5);
      expect(isSessionCompleted(session, checkTime)).toBe(false);
    });

    test('非activeセッションは完了判定しない', () => {
      const session: FocusSession = {
        id: 'session-1',
        plantId: 'plant-1',
        minutes: 10,
        status: 'completed',
        startedAt: startTime,
        endedAt: startTime + minutesToMs(10),
        earnedGP: 1,
        newMutation: null,
      };
      
      expect(isSessionCompleted(session, startTime + minutesToMs(20))).toBe(false);
    });
  });

  describe('セッション結果取得', () => {
    test('完走時の結果を取得', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 25 },
        startTime
      );
      
      const endTime = startTime + minutesToMs(25);
      const rng = createSequenceRNG([0.001, 0.2]); // 当たり、tint_shift
      const completed = completeSession(session, mockPlant, endTime, rng);
      
      const result = getSessionResult(completed);
      
      expect(result.earnedGP).toBe(2); // 25分 = 2 GP
      expect(result.newMutation).toBe('tint_shift');
      expect(result.completedSuccessfully).toBe(true);
      expect(result.elapsedMinutes).toBe(25);
    });

    test('中断時の結果を取得', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 60 },
        startTime
      );
      
      const interruptTime = startTime + minutesToMs(30);
      const interrupted = interruptSession(session, interruptTime);
      
      const result = getSessionResult(interrupted);
      
      expect(result.earnedGP).toBe(3); // 30分 = 3 GP
      expect(result.newMutation).toBeNull();
      expect(result.completedSuccessfully).toBe(false);
      expect(result.elapsedMinutes).toBe(30);
    });

    test('終了していないセッションはエラー', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      expect(() => {
        getSessionResult(session);
      }).toThrow('Session not ended');
    });
  });

  describe('植物更新', () => {
    test('セッション結果をGPに適用', () => {
      const result = {
        earnedGP: 5,
        newMutation: null,
        completedSuccessfully: true,
        elapsedMinutes: 50,
      };
      
      const updated = applySessionResult(mockPlant, result);
      
      expect(updated.growthPoints).toBe(15); // 10 + 5
      expect(updated.mutations).toEqual([]);
    });

    test('突然変異も適用', () => {
      const result = {
        earnedGP: 2,
        newMutation: 'variegated' as const,
        completedSuccessfully: true,
        elapsedMinutes: 25,
      };
      
      const updated = applySessionResult(mockPlant, result);
      
      expect(updated.growthPoints).toBe(12); // 10 + 2
      expect(updated.mutations).toEqual(['variegated']);
    });
  });

  describe('セッション進行状況', () => {
    test('進行状況を取得（0.0-1.0）', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      // 5分経過 = 50%
      const halfway = startTime + minutesToMs(5);
      expect(getSessionProgress(session, halfway)).toBe(0.5);
      
      // 10分経過 = 100%
      const end = startTime + minutesToMs(10);
      expect(getSessionProgress(session, end)).toBe(1.0);
      
      // 超過しても100%
      const over = startTime + minutesToMs(15);
      expect(getSessionProgress(session, over)).toBe(1.0);
    });

    test('残り時間を取得', () => {
      const session = startSession(
        { plantId: 'plant-1', minutes: 10 },
        startTime
      );
      
      // 5分経過 = 5分残り
      const halfway = startTime + minutesToMs(5);
      expect(getSessionRemainingTime(session, halfway)).toBe(minutesToMs(5));
      
      // 10分経過 = 0分残り
      const end = startTime + minutesToMs(10);
      expect(getSessionRemainingTime(session, end)).toBe(0);
      
      // 超過しても0
      const over = startTime + minutesToMs(15);
      expect(getSessionRemainingTime(session, over)).toBe(0);
    });
  });
});
