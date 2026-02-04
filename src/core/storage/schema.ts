/**
 * ストレージスキーマ - AsyncStorageのキー定義
 */

export const STORAGE_KEYS = {
  PLANTS: '@focus-garden/plants',
  SESSIONS: '@focus-garden/sessions',
  ACTIVE_SESSION: '@focus-garden/active-session',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
