import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlantsStore } from '@/features/plants/usePlantsStore';
import { useGachaStore } from '@/features/gacha/useGachaStore';

export default function SettingsScreen() {
  const { loadPlants, loadSeeds, loadMaxSlots } = usePlantsStore();
  const { loadGachaStatus } = useGachaStore();

  const handleResetAllData = () => {
    Alert.alert(
      'データを削除',
      '全てのデータを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('完了', 'データを削除しました');
              // データを再読み込み
              await loadPlants();
              await loadSeeds();
              await loadMaxSlots();
              await loadGachaStatus();
            } catch (error) {
              Alert.alert('エラー', 'データの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>設定</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetAllData}
          >
            <Text style={styles.dangerButtonText}>全データを削除</Text>
          </TouchableOpacity>
          
          <Text style={styles.warningText}>
            ※ 全ての植物、種、セッションデータが削除されます
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#2e7d32',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
  },
});
