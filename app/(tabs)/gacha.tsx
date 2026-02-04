import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useGachaStore } from '@/features/gacha/useGachaStore';
import { usePlantsStore } from '@/features/plants/usePlantsStore';
import { getSpeciesById } from '@core/domain/species';

export default function GachaScreen() {
  const { freeGachaRemaining, lastGachaResult, loading, loadGachaStatus, executeGacha: execGacha, clearLastResult } = useGachaStore();
  const { seeds, loadSeeds } = usePlantsStore();
  
  const [resultModalVisible, setResultModalVisible] = useState(false);

  useEffect(() => {
    loadGachaStatus();
    loadSeeds();
  }, []);

  // ガチャ結果があればモーダル表示
  useEffect(() => {
    if (lastGachaResult) {
      setResultModalVisible(true);
    }
  }, [lastGachaResult]);

  const handleFreeGacha = async () => {
    if (freeGachaRemaining <= 0) {
      Alert.alert('無料回数なし', '無料ガチャの回数を使い切りました');
      return;
    }

    try {
      await execGacha(true);
      await loadSeeds(); // 種リストを更新
    } catch (error) {
      Alert.alert('エラー', 'ガチャの実行に失敗しました');
    }
  };

  const handlePaidGacha = () => {
    Alert.alert('有料ガチャ', '有料ガチャは未実装です（Phase 4で実装予定）');
  };

  const handleCloseResultModal = () => {
    setResultModalVisible(false);
    clearLastResult();
  };

  const resultSpecies = lastGachaResult ? getSpeciesById(lastGachaResult.speciesId) : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ガチャ</Text>

        {/* 無料ガチャ */}
        <View style={styles.gachaCard}>
          <View style={styles.gachaHeader}>
            <Text style={styles.gachaTitle}>無料ガチャ</Text>
            <View style={styles.remainingBadge}>
              <Text style={styles.remainingText}>残り {freeGachaRemaining}回</Text>
            </View>
          </View>
          
          <View style={styles.rateInfo}>
            <Text style={styles.rateLabel}>排出率</Text>
            <View style={styles.rateRow}>
              <Text style={styles.rateItem}>Common: 70%</Text>
              <Text style={styles.rateItem}>Rare: 25%</Text>
              <Text style={styles.rateItem}>Epic: 5%</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.gachaButton,
              styles.freeGachaButton,
              freeGachaRemaining === 0 && styles.gachaButtonDisabled,
            ]}
            onPress={handleFreeGacha}
            disabled={freeGachaRemaining === 0 || loading}
          >
            <Text style={styles.gachaButtonText}>
              {loading ? 'ガチャ中...' : '無料ガチャを引く'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 有料ガチャ */}
        <View style={styles.gachaCard}>
          <View style={styles.gachaHeader}>
            <Text style={styles.gachaTitle}>有料ガチャ</Text>
            <View style={[styles.remainingBadge, styles.paidBadge]}>
              <Text style={styles.remainingText}>100円</Text>
            </View>
          </View>
          
          <View style={styles.rateInfo}>
            <Text style={styles.rateLabel}>排出率（確率アップ！）</Text>
            <View style={styles.rateRow}>
              <Text style={styles.rateItem}>Common: 50%</Text>
              <Text style={styles.rateItem}>Rare: 35%</Text>
              <Text style={[styles.rateItem, styles.epicHighlight]}>Epic: 15%</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.gachaButton, styles.paidGachaButton]}
            onPress={handlePaidGacha}
          >
            <Text style={styles.gachaButtonText}>有料ガチャを引く</Text>
          </TouchableOpacity>
        </View>

        {/* 種インベントリ */}
        <View style={styles.inventoryCard}>
          <Text style={styles.inventoryTitle}>持っている種</Text>
          <Text style={styles.inventoryCount}>{seeds.length}個</Text>
          
          {seeds.length === 0 ? (
            <View style={styles.emptyInventory}>
              <Text style={styles.emptyText}>まだ種がありません</Text>
              <Text style={styles.emptySubtext}>ガチャを引いて種を入手しよう！</Text>
            </View>
          ) : (
            <ScrollView style={styles.seedsList}>
              {seeds.map(seed => {
                const species = getSpeciesById(seed.speciesId);
                if (!species) return null;
                
                return (
                  <View key={seed.id} style={styles.seedItem}>
                    <View style={styles.seedInfo}>
                      <Text style={styles.seedName}>{species.name}</Text>
                      <Text style={styles.seedCategory}>{species.category}</Text>
                    </View>
                    <View style={[styles.rarityBadge, styles[`rarity${species.rarity}`]]}>
                      <Text style={styles.rarityText}>
                        {species.rarity === 'common' ? 'C' : species.rarity === 'rare' ? 'R' : 'E'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* ガチャ結果モーダル */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={resultModalVisible}
        onRequestClose={handleCloseResultModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModal}>
            {resultSpecies && (
              <>
                <Text style={styles.resultTitle}>
                  {resultSpecies.rarity === 'epic' ? '✨✨✨' : resultSpecies.rarity === 'rare' ? '✨✨' : '✨'}
                </Text>
                
                <View style={[styles.resultRarityBadge, styles[`rarity${resultSpecies.rarity}`]]}>
                  <Text style={styles.resultRarityText}>
                    {resultSpecies.rarity === 'common' ? 'Common' : 
                     resultSpecies.rarity === 'rare' ? 'Rare' : 'Epic'}
                  </Text>
                </View>

                <Text style={styles.resultSpeciesName}>{resultSpecies.name}</Text>
                <Text style={styles.resultCategory}>{resultSpecies.category}</Text>
                <Text style={styles.resultDescription}>{resultSpecies.description}</Text>

                <View style={styles.resultInfo}>
                  <Text style={styles.resultInfoText}>
                    種インベントリに追加されました！
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseResultModal}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 24,
    textAlign: 'center',
  },
  gachaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gachaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gachaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  remainingBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: '#ff9800',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rateInfo: {
    marginBottom: 16,
  },
  rateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rateItem: {
    fontSize: 13,
    color: '#888',
  },
  epicHighlight: {
    color: '#ab47bc',
    fontWeight: '600',
  },
  gachaButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  freeGachaButton: {
    backgroundColor: '#4caf50',
  },
  paidGachaButton: {
    backgroundColor: '#ff9800',
  },
  gachaButtonDisabled: {
    backgroundColor: '#ccc',
  },
  gachaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inventoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inventoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inventoryCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyInventory: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  seedsList: {
    maxHeight: 300,
  },
  seedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  seedInfo: {
    flex: 1,
  },
  seedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  seedCategory: {
    fontSize: 12,
    color: '#666',
  },
  rarityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultRarityBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  resultRarityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultSpeciesName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  resultDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  resultInfo: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  resultInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
