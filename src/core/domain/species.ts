/**
 * 植物種データ
 */

export type Rarity = 'common' | 'rare' | 'epic';

export interface PlantSpecies {
  id: string;
  name: string;
  nameEn: string;
  rarity: Rarity;
  category: string;
  description: string;
  growthRateMultiplier: number;  // 成長速度補正（1.0が基準）
}

/**
 * 植物種マスターデータ
 */
export const PLANT_SPECIES: readonly PlantSpecies[] = [
  // ========================================
  // Common（普通）- 70%
  // ========================================
  
  // 多肉植物・サボテン
  {
    id: 'echeveria',
    name: 'エケベリア',
    nameEn: 'Echeveria',
    rarity: 'common',
    category: '多肉植物',
    description: 'ロゼット状の葉が美しい多肉植物',
    growthRateMultiplier: 0.8,
  },
  {
    id: 'sedum',
    name: 'セダム',
    nameEn: 'Sedum',
    rarity: 'common',
    category: '多肉植物',
    description: '小さな葉が密集する丈夫な多肉植物',
    growthRateMultiplier: 1.2,
  },
  {
    id: 'aloe',
    name: 'アロエ',
    nameEn: 'Aloe',
    rarity: 'common',
    category: '多肉植物',
    description: '肉厚な葉を持つ健康的な植物',
    growthRateMultiplier: 0.9,
  },
  {
    id: 'haworthia',
    name: 'ハオルチア',
    nameEn: 'Haworthia',
    rarity: 'common',
    category: '多肉植物',
    description: '透明感のある葉が特徴的',
    growthRateMultiplier: 0.7,
  },
  {
    id: 'crassula',
    name: 'クラッスラ',
    nameEn: 'Crassula',
    rarity: 'common',
    category: '多肉植物',
    description: '丸みを帯びた葉が可愛らしい',
    growthRateMultiplier: 1.0,
  },
  
  // 観葉植物
  {
    id: 'pothos',
    name: 'ポトス',
    nameEn: 'Pothos',
    rarity: 'common',
    category: '観葉植物',
    description: 'つる性で育てやすい定番の観葉植物',
    growthRateMultiplier: 1.3,
  },
  {
    id: 'sansevieria',
    name: 'サンスベリア',
    nameEn: 'Sansevieria',
    rarity: 'common',
    category: '観葉植物',
    description: '剣のような葉が力強い',
    growthRateMultiplier: 0.6,
  },
  {
    id: 'pachira',
    name: 'パキラ',
    nameEn: 'Pachira',
    rarity: 'common',
    category: '観葉植物',
    description: '編み込まれた幹が特徴的',
    growthRateMultiplier: 1.1,
  },
  {
    id: 'ficus',
    name: 'フィカス',
    nameEn: 'Ficus',
    rarity: 'common',
    category: '観葉植物',
    description: '光沢のある葉が美しい',
    growthRateMultiplier: 1.0,
  },
  {
    id: 'monstera',
    name: 'モンステラ',
    nameEn: 'Monstera',
    rarity: 'common',
    category: '観葉植物',
    description: '切れ込みの入った大きな葉',
    growthRateMultiplier: 1.2,
  },
  
  // ハーブ
  {
    id: 'basil',
    name: 'バジル',
    nameEn: 'Basil',
    rarity: 'common',
    category: 'ハーブ',
    description: '香り高いイタリア料理の定番',
    growthRateMultiplier: 1.5,
  },
  {
    id: 'mint',
    name: 'ミント',
    nameEn: 'Mint',
    rarity: 'common',
    category: 'ハーブ',
    description: '爽やかな香りで人気のハーブ',
    growthRateMultiplier: 1.6,
  },
  {
    id: 'rosemary',
    name: 'ローズマリー',
    nameEn: 'Rosemary',
    rarity: 'common',
    category: 'ハーブ',
    description: '針のような葉を持つ香り高いハーブ',
    growthRateMultiplier: 0.9,
  },
  {
    id: 'thyme',
    name: 'タイム',
    nameEn: 'Thyme',
    rarity: 'common',
    category: 'ハーブ',
    description: '小さな葉が密集する這性ハーブ',
    growthRateMultiplier: 1.0,
  },
  {
    id: 'lavender',
    name: 'ラベンダー',
    nameEn: 'Lavender',
    rarity: 'common',
    category: 'ハーブ',
    description: '紫の花と優雅な香りが魅力',
    growthRateMultiplier: 1.1,
  },
  
  // 野菜
  {
    id: 'tomato',
    name: 'ミニトマト',
    nameEn: 'Cherry Tomato',
    rarity: 'common',
    category: '野菜',
    description: '赤く実る可愛らしいトマト',
    growthRateMultiplier: 1.4,
  },
  {
    id: 'lettuce',
    name: 'レタス',
    nameEn: 'Lettuce',
    rarity: 'common',
    category: '野菜',
    description: '葉が広がる食べられる植物',
    growthRateMultiplier: 1.3,
  },
  {
    id: 'radish',
    name: 'ラディッシュ',
    nameEn: 'Radish',
    rarity: 'common',
    category: '野菜',
    description: '丸くて赤い小さなカブ',
    growthRateMultiplier: 1.8,
  },
  
  // 花
  {
    id: 'sunflower',
    name: 'ヒマワリ',
    nameEn: 'Sunflower',
    rarity: 'common',
    category: '花',
    description: '太陽に向かって咲く大きな花',
    growthRateMultiplier: 1.5,
  },
  {
    id: 'marigold',
    name: 'マリーゴールド',
    nameEn: 'Marigold',
    rarity: 'common',
    category: '花',
    description: 'オレンジ色の元気な花',
    growthRateMultiplier: 1.2,
  },
  
  // ========================================
  // Rare（レア）- 25%
  // ========================================
  
  // 多肉植物・サボテン
  {
    id: 'lithops',
    name: 'リトープス',
    nameEn: 'Lithops',
    rarity: 'rare',
    category: '多肉植物',
    description: '石のような姿の珍しい多肉植物',
    growthRateMultiplier: 0.5,
  },
  {
    id: 'adenium',
    name: 'アデニウム',
    nameEn: 'Adenium',
    rarity: 'rare',
    category: '多肉植物',
    description: '砂漠のバラとも呼ばれる美しい植物',
    growthRateMultiplier: 0.7,
  },
  {
    id: 'euphorbia_obesa',
    name: 'ユーフォルビア・オベサ',
    nameEn: 'Euphorbia Obesa',
    rarity: 'rare',
    category: '多肉植物',
    description: '球体の不思議な形の多肉植物',
    growthRateMultiplier: 0.6,
  },
  
  // 観葉植物
  {
    id: 'alocasia',
    name: 'アロカシア',
    nameEn: 'Alocasia',
    rarity: 'rare',
    category: '観葉植物',
    description: '矢じりのような大きな葉が印象的',
    growthRateMultiplier: 1.0,
  },
  {
    id: 'calathea',
    name: 'カラテア',
    nameEn: 'Calathea',
    rarity: 'rare',
    category: '観葉植物',
    description: '模様の美しい葉を持つ',
    growthRateMultiplier: 0.9,
  },
  {
    id: 'anthurium',
    name: 'アンスリウム',
    nameEn: 'Anthurium',
    rarity: 'rare',
    category: '観葉植物',
    description: 'ハート型の赤い花が美しい',
    growthRateMultiplier: 1.1,
  },
  {
    id: 'philodendron',
    name: 'フィロデンドロン',
    nameEn: 'Philodendron',
    rarity: 'rare',
    category: '観葉植物',
    description: '深い切れ込みの葉が特徴',
    growthRateMultiplier: 1.2,
  },
  
  // 花
  {
    id: 'orchid',
    name: 'ラン',
    nameEn: 'Orchid',
    rarity: 'rare',
    category: '花',
    description: '優雅で高貴な花',
    growthRateMultiplier: 0.8,
  },
  {
    id: 'rose',
    name: 'バラ',
    nameEn: 'Rose',
    rarity: 'rare',
    category: '花',
    description: '花の女王と呼ばれる美しい花',
    growthRateMultiplier: 1.0,
  },
  {
    id: 'carnation',
    name: 'カーネーション',
    nameEn: 'Carnation',
    rarity: 'rare',
    category: '花',
    description: 'フリルのような花びらが可愛い',
    growthRateMultiplier: 1.1,
  },
  
  // 樹木
  {
    id: 'bonsai_pine',
    name: '松の盆栽',
    nameEn: 'Pine Bonsai',
    rarity: 'rare',
    category: '盆栽',
    description: '風格のある松の小木',
    growthRateMultiplier: 0.5,
  },
  {
    id: 'bonsai_maple',
    name: 'もみじの盆栽',
    nameEn: 'Maple Bonsai',
    rarity: 'rare',
    category: '盆栽',
    description: '紅葉が美しい小木',
    growthRateMultiplier: 0.7,
  },
  
  // ========================================
  // Epic（激レア）- 5%
  // ========================================
  
  {
    id: 'monstera_albo',
    name: 'モンステラ・アルボ',
    nameEn: 'Monstera Albo',
    rarity: 'epic',
    category: '観葉植物',
    description: '白い斑入りの超希少なモンステラ',
    growthRateMultiplier: 0.8,
  },
  {
    id: 'philodendron_pink',
    name: 'ピンクプリンセス',
    nameEn: 'Pink Princess',
    rarity: 'epic',
    category: '観葉植物',
    description: 'ピンクの斑が入る美しいフィロデンドロン',
    growthRateMultiplier: 0.7,
  },
  {
    id: 'variegated_aloe',
    name: '斑入りアロエ',
    nameEn: 'Variegated Aloe',
    rarity: 'epic',
    category: '多肉植物',
    description: '白と緑のコントラストが美しいアロエ',
    growthRateMultiplier: 0.6,
  },
  {
    id: 'conophytum',
    name: 'コノフィツム',
    nameEn: 'Conophytum',
    rarity: 'epic',
    category: '多肉植物',
    description: '宝石のような姿の希少多肉植物',
    growthRateMultiplier: 0.4,
  },
  {
    id: 'aeonium_black',
    name: '黒法師',
    nameEn: 'Black Aeonium',
    rarity: 'epic',
    category: '多肉植物',
    description: '黒紫色のロゼットが神秘的',
    growthRateMultiplier: 0.6,
  },
  {
    id: 'bonsai_wisteria',
    name: '藤の盆栽',
    nameEn: 'Wisteria Bonsai',
    rarity: 'epic',
    category: '盆栽',
    description: '紫の花が垂れ下がる幻想的な盆栽',
    growthRateMultiplier: 0.5,
  },
  {
    id: 'bonsai_cherry',
    name: '桜の盆栽',
    nameEn: 'Cherry Blossom Bonsai',
    rarity: 'epic',
    category: '盆栽',
    description: 'ピンクの花が咲き誇る美しい盆栽',
    growthRateMultiplier: 0.6,
  },
  {
    id: 'blue_rose',
    name: '青いバラ',
    nameEn: 'Blue Rose',
    rarity: 'epic',
    category: '花',
    description: '不可能を可能にした奇跡のバラ',
    growthRateMultiplier: 0.7,
  },
] as const;

/**
 * IDから植物種を取得
 */
export function getSpeciesById(id: string): PlantSpecies | undefined {
  return PLANT_SPECIES.find(s => s.id === id);
}

/**
 * レア度で植物種をフィルタ
 */
export function getSpeciesByRarity(rarity: Rarity): PlantSpecies[] {
  return PLANT_SPECIES.filter(s => s.rarity === rarity);
}

/**
 * カテゴリで植物種をフィルタ
 */
export function getSpeciesByCategory(category: string): PlantSpecies[] {
  return PLANT_SPECIES.filter(s => s.category === category);
}
