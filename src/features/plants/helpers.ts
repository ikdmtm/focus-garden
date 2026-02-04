/**
 * 植物関連のヘルパー関数
 */

import { Plant } from '@core/domain/models';
import { getSpeciesById } from '@core/domain/species';

/**
 * 植物の表示名を取得
 * ニックネームがあればニックネーム、なければ植物種名
 */
export function getPlantDisplayName(plant: Plant): string {
  if (plant.nickname) {
    return plant.nickname;
  }
  
  const species = getSpeciesById(plant.speciesId);
  return species?.name || '不明な植物';
}

/**
 * 植物の完全名を取得（植物種名 + ニックネーム）
 */
export function getPlantFullName(plant: Plant): string {
  const species = getSpeciesById(plant.speciesId);
  const speciesName = species?.name || '不明な植物';
  
  if (plant.nickname) {
    return `${speciesName}（${plant.nickname}）`;
  }
  
  return speciesName;
}
