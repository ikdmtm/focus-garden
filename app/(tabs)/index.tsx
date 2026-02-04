import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { usePlantsStore } from '@/features/plants/usePlantsStore';
import { calcGrowthPercentage, isFullyGrown } from '@core/domain/rules';
import { getPlantFullName } from '@/features/plants/helpers';
import { getSpeciesById } from '@core/domain/species';
import { getPlantCondition, needsWater, needsFertilizer, needsCure } from '@core/engine/careEngine';

export default function HomeScreen() {
  const { 
    plants, 
    seeds, 
    maxSlots, 
    loadPlants, 
    loadSeeds, 
    loadMaxSlots, 
    plantSeed,
    updateAllPlantsState,
    waterPlantById,
    fertilizePlantById,
    curePlantById,
    deletePlant,
  } = usePlantsStore();
  
  const [selectSeedModalVisible, setSelectSeedModalVisible] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedPlantForCare, setSelectedPlantForCare] = useState<string | null>(null);

  useEffect(() => {
    loadPlants();
    loadSeeds();
    loadMaxSlots();
    
    // 状態を定期的に更新
    updateAllPlantsState();
    
    // 1分ごとに状態を更新
    const interval = setInterval(() => {
      updateAllPlantsState();
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSlotPress = (slotIndex: number) => {
    const plant = getPlantForSlot(slotIndex);
    
    if (!plant) {
      // 空き枠をタップ → 種を選択
      if (seeds.length === 0) {
        Alert.alert('種がありません', 'ガチャで種を入手してください');
        return;
      }
      setSelectedSlotIndex(slotIndex);
      setSelectSeedModalVisible(true);
    } else {
      // 植物がある枠をタップ → 世話メニュー表示
      setSelectedPlantForCare(plant.id);
    }
  };

  const handleWater = async () => {
    if (!selectedPlantForCare) return;
    
    try {
      await waterPlantById(selectedPlantForCare);
      Alert.alert('完了', '水をやりました');
      setSelectedPlantForCare(null);
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    }
  };

  const handleFertilize = async () => {
    if (!selectedPlantForCare) return;
    
    try {
      await fertilizePlantById(selectedPlantForCare);
      Alert.alert('完了', '肥料をやりました');
      setSelectedPlantForCare(null);
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    }
  };

  const handleCure = async () => {
    if (!selectedPlantForCare) return;
    
    try {
      await curePlantById(selectedPlantForCare);
      Alert.alert('完了', '治療しました');
      setSelectedPlantForCare(null);
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    }
  };

  const handleRemovePlant = () => {
    if (!selectedPlantForCare) return;
    
    const plant = plants.find(p => p.id === selectedPlantForCare);
    if (!plant) return;
    
    const plantName = getPlantFullName(plant);
    
    Alert.alert(
      '植物を処分',
      `${plantName}を処分しますか？\n\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '処分する',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlant(selectedPlantForCare);
              setSelectedPlantForCare(null);
              Alert.alert('完了', '植物を処分しました');
            } catch (error) {
              Alert.alert('エラー', '処分に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handlePlantSeed = async (seedId: string) => {
    if (selectedSlotIndex === null) return;

    try {
      await plantSeed(seedId, selectedSlotIndex);
      setSelectSeedModalVisible(false);
      setSelectedSlotIndex(null);
      Alert.alert('成功', '種を植えました！');
    } catch (error) {
      Alert.alert('エラー', '種を植えることができませんでした');
    }
  };

  // 枠ごとの植物を取得
  const getPlantForSlot = (slotIndex: number) => {
    return plants.find(p => p.slotIndex === slotIndex);
  };

  const renderSlot = (slotIndex: number) => {
    const plant = getPlantForSlot(slotIndex);

    if (!plant) {
      // 空き枠
      return (
        <TouchableOpacity
          key={slotIndex}
          style={styles.slotCard}
          onPress={() => handleSlotPress(slotIndex)}
        >
          <View style={styles.emptySlot}>
            <Text style={styles.slotNumber}>枠 {slotIndex + 1}</Text>
            <Text style={styles.emptySlotText}>空き枠</Text>
            <Text style={styles.emptySlotSubtext}>タップして種を植える</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // 植物がある枠
    const species = getSpeciesById(plant.speciesId);
    const growthPercentage = calcGrowthPercentage(plant.growthPoints);
    const fullyGrown = isFullyGrown(plant.growthPoints);
    const condition = getPlantCondition(plant);

    return (
      <TouchableOpacity
        key={slotIndex}
        style={styles.slotCard}
        onPress={() => handleSlotPress(slotIndex)}
      >
        <View style={styles.plantSlot}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotNumber}>枠 {slotIndex + 1}</Text>
            {species && (
              <View style={[styles.rarityBadge, styles[`rarity${species.rarity}`]]}>
                <Text style={styles.rarityText}>
                  {species.rarity === 'common' ? 'C' : species.rarity === 'rare' ? 'R' : 'E'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.plantName}>{getPlantFullName(plant)}</Text>
          
          {species && (
            <Text style={styles.plantCategory}>{species.category}</Text>
          )}

          {/* 植物の状態 */}
          <View style={[
            styles.conditionBadge,
            plant.isDead && styles.conditionDead,
            plant.diseaseType && styles.conditionDisease,
            plant.health < 50 && !plant.isDead && !plant.diseaseType && styles.conditionWeak,
          ]}>
            <Text style={styles.conditionText}>{condition}</Text>
          </View>

          {/* 状態バー */}
          {!plant.isDead && (
            <View style={styles.statusBars}>
              <View style={styles.statusBar}>
                <Text style={styles.statusLabel}>💧 {Math.round(plant.waterLevel)}%</Text>
                <View style={styles.statusBarBg}>
                  <View style={[styles.statusBarFill, { width: `${plant.waterLevel}%`, backgroundColor: '#2196f3' }]} />
                </View>
              </View>
              
              <View style={styles.statusBar}>
                <Text style={styles.statusLabel}>🌱 {Math.round(plant.nutritionLevel)}%</Text>
                <View style={styles.statusBarBg}>
                  <View style={[styles.statusBarFill, { width: `${plant.nutritionLevel}%`, backgroundColor: '#8bc34a' }]} />
                </View>
              </View>
              
              <View style={styles.statusBar}>
                <Text style={styles.statusLabel}>❤️ {Math.round(plant.health)}%</Text>
                <View style={styles.statusBarBg}>
                  <View style={[styles.statusBarFill, { width: `${plant.health}%`, backgroundColor: '#f44336' }]} />
                </View>
              </View>
            </View>
          )}

          {/* 成長度 */}
          <View style={styles.growthInfo}>
            <Text style={styles.growthLabel}>成長度</Text>
            <Text style={styles.growthPercentage}>
              {growthPercentage.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, growthPercentage)}%` },
              ]}
            />
          </View>

          {fullyGrown && (
            <View style={styles.fullyGrownBadge}>
              <Text style={styles.fullyGrownText}>🌟 完全成長</Text>
            </View>
          )}

          {plant.mutations.length > 0 && (
            <View style={styles.mutationsContainer}>
              <Text style={styles.mutationsCount}>
                変異 {plant.mutations.length}個
              </Text>
            </View>
          )}

          <Text style={styles.debugGP}>GP: {plant.growthPoints}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const careMenuPlant = plants.find(p => p.id === selectedPlantForCare);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>育成枠</Text>
        <Text style={styles.slotCount}>{plants.length} / {maxSlots}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.slotsContainer}>
        {/* 種インベントリ */}
        <View style={styles.inventorySection}>
          <View style={styles.inventoryHeader}>
            <Text style={styles.inventoryTitle}>🌱 持っている種</Text>
            <Text style={styles.inventoryCount}>{seeds.length}個</Text>
          </View>
          
          {seeds.length === 0 ? (
            <View style={styles.emptyInventory}>
              <Text style={styles.emptyText}>まだ種がありません</Text>
              <Text style={styles.emptySubtext}>ガチャで種を入手しましょう！</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.seedsHorizontalList}
            >
              {seeds.map(seed => {
                const species = getSpeciesById(seed.speciesId);
                if (!species) return null;
                
                return (
                  <View key={seed.id} style={styles.seedCard}>
                    <View style={[styles.rarityBadge, styles[`rarity${species.rarity}`]]}>
                      <Text style={styles.rarityText}>
                        {species.rarity === 'common' ? 'C' : species.rarity === 'rare' ? 'R' : 'E'}
                      </Text>
                    </View>
                    <Text style={styles.seedCardName}>{species.name}</Text>
                    <Text style={styles.seedCardCategory}>{species.category}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 育成枠 */}
        {Array.from({ length: maxSlots }, (_, i) => renderSlot(i))}
      </ScrollView>

      {/* 世話メニューモーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedPlantForCare !== null}
        onRequestClose={() => setSelectedPlantForCare(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {careMenuPlant && (
              <>
                <Text style={styles.modalTitle}>{getPlantFullName(careMenuPlant)}</Text>
                <Text style={styles.careCondition}>{getPlantCondition(careMenuPlant)}</Text>
                
                {!careMenuPlant.isDead ? (
                  <>
                    <TouchableOpacity
                      style={[styles.careButton, !needsWater(careMenuPlant) && styles.careButtonDisabled]}
                      onPress={handleWater}
                      disabled={!needsWater(careMenuPlant)}
                    >
                      <Text style={styles.careButtonText}>
                        💧 水やり {needsWater(careMenuPlant) ? '(必要)' : ''}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.careButton, !needsFertilizer(careMenuPlant) && styles.careButtonDisabled]}
                      onPress={handleFertilize}
                      disabled={!needsFertilizer(careMenuPlant)}
                    >
                      <Text style={styles.careButtonText}>
                        🌱 肥料やり {needsFertilizer(careMenuPlant) ? '(必要)' : ''}
                      </Text>
                    </TouchableOpacity>
                    
                    {needsCure(careMenuPlant) && (
                      <TouchableOpacity
                        style={[styles.careButton, styles.cureButton]}
                        onPress={handleCure}
                      >
                        <Text style={styles.careButtonText}>💊 治療</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={styles.deadMessage}>枯れています...</Text>
                )}
                
                {/* 処分ボタン */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemovePlant}
                >
                  <Text style={styles.removeButtonText}>🗑️ 植物を処分</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectedPlantForCare(null)}
            >
              <Text style={styles.cancelButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 種選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectSeedModalVisible}
        onRequestClose={() => {
          setSelectSeedModalVisible(false);
          setSelectedSlotIndex(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>種を選択</Text>
            
            <ScrollView style={styles.seedsModalList}>
              {seeds.map(seed => {
                const species = getSpeciesById(seed.speciesId);
                if (!species) return null;
                
                return (
                  <TouchableOpacity
                    key={seed.id}
                    style={styles.seedModalItem}
                    onPress={() => handlePlantSeed(seed.id)}
                  >
                    <View style={styles.seedModalInfo}>
                      <Text style={styles.seedModalName}>{species.name}</Text>
                      <Text style={styles.seedModalCategory}>{species.category}</Text>
                    </View>
                    <View style={[styles.rarityBadge, styles[`rarity${species.rarity}`]]}>
                      <Text style={styles.rarityText}>
                        {species.rarity === 'common' ? 'C' : species.rarity === 'rare' ? 'R' : 'E'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setSelectSeedModalVisible(false);
                setSelectedSlotIndex(null);
              }}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  slotCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  slotsContainer: {
    padding: 16,
  },
  inventorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inventoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inventoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  emptyInventory: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#bbb',
  },
  seedsHorizontalList: {
    flexDirection: 'row',
  },
  seedCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  seedCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  seedCardCategory: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  slotCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptySlot: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 12,
  },
  slotNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  emptySlotText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 4,
  },
  emptySlotSubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  plantSlot: {
    padding: 16,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raritycommon: {
    backgroundColor: '#90a4ae',
  },
  rarityrare: {
    backgroundColor: '#5c6bc0',
  },
  rarityepic: {
    backgroundColor: '#ab47bc',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  plantCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  growthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  growthLabel: {
    fontSize: 14,
    color: '#666',
  },
  growthPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  fullyGrownBadge: {
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  fullyGrownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
    textAlign: 'center',
  },
  mutationsContainer: {
    backgroundColor: '#f3e5f5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  mutationsCount: {
    fontSize: 12,
    color: '#9c27b0',
    textAlign: 'center',
  },
  debugGP: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  conditionBadge: {
    backgroundColor: '#4caf50',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  conditionDead: {
    backgroundColor: '#616161',
  },
  conditionDisease: {
    backgroundColor: '#f44336',
  },
  conditionWeak: {
    backgroundColor: '#ff9800',
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusBars: {
    marginBottom: 12,
  },
  statusBar: {
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  statusBarBg: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  careCondition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  careButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  careButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cureButton: {
    backgroundColor: '#9c27b0',
  },
  careButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  deadMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 24,
  },
  removeButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  seedsModalList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  seedModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  seedModalInfo: {
    flex: 1,
  },
  seedModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  seedModalCategory: {
    fontSize: 12,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#999',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
