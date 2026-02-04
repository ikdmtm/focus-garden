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

export default function HomeScreen() {
  const { plants, seeds, maxSlots, loadPlants, loadSeeds, loadMaxSlots, plantSeed } = usePlantsStore();
  
  const [selectSeedModalVisible, setSelectSeedModalVisible] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  useEffect(() => {
    loadPlants();
    loadSeeds();
    loadMaxSlots();
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
      // 植物がある枠をタップ → 詳細表示（将来実装）
      Alert.alert('詳細表示', '植物詳細画面は未実装です');
    }
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
