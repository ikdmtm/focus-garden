/**
 * ID生成ユーティリティ
 */

/**
 * ユニークIDを生成（簡易版UUID v4）
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 現在のUNIXタイムスタンプ（ミリ秒）を取得
 */
export function now(): number {
  return Date.now();
}
