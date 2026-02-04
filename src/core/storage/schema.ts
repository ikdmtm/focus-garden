/**
 * ストレージスキーマ - AsyncStorageのキー定義
 */

export const STORAGE_KEYS = {
  PLANTS: '@focus-garden/plants',
  SESSIONS: '@focus-garden/sessions',
  ACTIVE_SESSION: '@focus-garden/active-session',
  SEEDS: '@focus-garden/seeds',
  MAX_SLOTS: '@focus-garden/max-slots',
  GACHA_FREE_COUNT: '@focus-garden/gacha-free-count',
  GACHA_LAST_RESET: '@focus-garden/gacha-last-reset',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
