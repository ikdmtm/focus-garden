import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { usePlantsStore } from '@/features/plants/usePlantsStore';
import { calcGrowthPercentage, isFullyGrown } from '@core/domain/rules';
import { getPlantFullName } from '@/features/plants/helpers';
import { getSpeciesById } from '@core/domain/species';

export default function HomeScreen() {
  const { plants, maxSlots, loadPlants, loadMaxSlots } = usePlantsStore();

  useEffect(() => {
    loadPlants();
    loadMaxSlots();
  }, []);

  // 枠ごとの植物を取得
  const getPlantForSlot = (slotIndex: number) => {
    return plants.find(p => p.slotIndex === slotIndex);
  };

  const renderSlot = (slotIndex: number) => {
    const plant = getPlantForSlot(slotIndex);

    if (!plant) {
      // 空き枠
      return (
        <View key={slotIndex} style={styles.slotCard}>
          <View style={styles.emptySlot}>
            <Text style={styles.slotNumber}>枠 {slotIndex + 1}</Text>
            <Text style={styles.emptySlotText}>空き枠</Text>
            <Text style={styles.emptySlotSubtext}>種を植えて育てよう</Text>
          </View>
        </View>
      );
    }

    // 植物がある枠
    const species = getSpeciesById(plant.speciesId);
    const growthPercentage = calcGrowthPercentage(plant.growthPoints);
    const fullyGrown = isFullyGrown(plant.growthPoints);

    return (
      <View key={slotIndex} style={styles.slotCard}>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>育成枠</Text>
        <Text style={styles.slotCount}>{plants.length} / {maxSlots}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.slotsContainer}>
        {Array.from({ length: maxSlots }, (_, i) => renderSlot(i))}
      </ScrollView>
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
});
