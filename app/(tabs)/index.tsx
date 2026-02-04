import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { usePlantsStore } from '@/features/plants/usePlantsStore';
import { useSortedPlants } from '@/features/plants/selectors';
import { calcGrowthPercentage, isFullyGrown } from '@core/domain/rules';
import { Plant } from '@core/domain/models';
import { getPlantFullName } from '@/features/plants/helpers';
import { PLANT_SPECIES } from '@core/domain/species';

export default function HomeScreen() {
  const plants = useSortedPlants();
  const { loadPlants } = usePlantsStore();

  useEffect(() => {
    loadPlants();
  }, []);

  const renderPlant = ({ item }: { item: Plant }) => {
    const growthPercentage = calcGrowthPercentage(item.growthPoints);
    const fullyGrown = isFullyGrown(item.growthPoints);
    const fullName = getPlantFullName(item);

    return (
      <View style={styles.plantCard}>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{fullName}</Text>
          <Text style={styles.plantGP}>GP: {item.growthPoints}</Text>
          <Text style={styles.plantGrowth}>
            成長度: {growthPercentage.toFixed(1)}%
          </Text>
          {fullyGrown && (
            <Text style={styles.fullyGrownBadge}>🌟 完全成長</Text>
          )}
          {item.mutations.length > 0 && (
            <View style={styles.mutationsContainer}>
              <Text style={styles.mutationsLabel}>突然変異:</Text>
              {item.mutations.map((mutation, index) => (
                <Text key={index} style={styles.mutationBadge}>
                  {mutation}
                </Text>
              ))}
            </View>
          )}
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(100, growthPercentage)}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>育てている植物</Text>
      </View>

      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>まだ植物がありません</Text>
          <Text style={styles.emptySubtext}>
            ガチャで種を入手して植物を育てましょう！
          </Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          renderItem={renderPlant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  addButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  plantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantInfo: {
    marginBottom: 12,
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  plantGP: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  plantGrowth: {
    fontSize: 14,
    color: '#888',
  },
  fullyGrownBadge: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600',
    marginTop: 4,
  },
  mutationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  mutationsLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  mutationBadge: {
    fontSize: 11,
    color: '#9c27b0',
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#4caf50',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
