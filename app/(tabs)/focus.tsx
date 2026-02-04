import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { usePlantsStore } from '@/features/plants/usePlantsStore';
import { useSessionInfo, useActivePlants } from '@/features/plants/selectors';
import { SessionMinutes } from '@core/domain/models';
import { calcGrowthPoints } from '@core/domain/rules';
import { getPlantFullName } from '@/features/plants/helpers';

const SESSION_OPTIONS: SessionMinutes[] = [10, 25, 45, 60];

export default function FocusScreen() {
  const { plants, loadPlants, startSession, interruptCurrentSession, checkSessionCompletion, clearSessionResults } = usePlantsStore();
  const { isActive, progress, remainingTime, session, lastSessionResults } = useSessionInfo();
  const activePlants = useActivePlants();

  const [selectedMinutes, setSelectedMinutes] = useState<SessionMinutes>(25);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  useEffect(() => {
    loadPlants();
  }, []);

  // 定期的にセッション完了チェック（1秒ごと）
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      checkSessionCompletion();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // セッション結果があれば自動でモーダル表示（完了時・中断時両方）
  useEffect(() => {
    if (lastSessionResults.length > 0 && !isActive) {
      // 完了時も中断時もモーダル表示
      setResultModalVisible(true);
    }
  }, [lastSessionResults, isActive]);

  const handleStartSession = async () => {
    if (plants.length === 0) {
      Alert.alert('エラー', '育成中の植物がありません。\nホーム画面で植物を作成してください。');
      return;
    }

    try {
      // モーダルを明示的に閉じる
      setResultModalVisible(false);
      // 前回の結果をクリア
      clearSessionResults();
      
      await startSession(selectedMinutes);
      // 開始ダイアログ削除（即座にセッション画面に遷移）
    } catch (error) {
      Alert.alert('エラー', 'セッションの開始に失敗しました');
    }
  };

  const handleInterrupt = () => {
    Alert.alert(
      '中断しますか？',
      'セッションを中断すると、成長ポイントは獲得できません',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '中断する',
          style: 'destructive',
          onPress: async () => {
            try {
              await interruptCurrentSession();
              // 画面遷移後にモーダルを表示（タイミング調整）
              setTimeout(() => {
                setResultModalVisible(true);
              }, 100);
            } catch (error) {
              Alert.alert('エラー', 'セッションの中断に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleCloseResultModal = () => {
    setResultModalVisible(false);
    clearSessionResults(); // バグ修正：モーダルを閉じたら結果をクリア
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // アクティブセッション表示
  if (isActive && session && activePlants.length > 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.activeSessionContainer}>
          <Text style={styles.activeTitle}>セッション実行中</Text>
          <Text style={styles.subtitle}>
            育成中の植物: {activePlants.length}個
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(remainingTime)}</Text>
            <Text style={styles.timerLabel}>残り時間</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarOuter}>
              <View
                style={[
                  styles.progressBarInner,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(progress * 100).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.sessionInfo}>
            <Text style={styles.infoLabel}>予定時間: {session.minutes}分</Text>
            <Text style={styles.infoLabel}>
              各植物の獲得予定GP: {calcGrowthPoints(session.minutes)}
            </Text>
            <Text style={styles.infoLabelSmall}>
              ※ タイマーが0になると自動完了します
            </Text>
          </View>

          {/* 育成中の植物一覧 */}
          <View style={styles.plantsPreview}>
            <Text style={styles.plantsPreviewTitle}>育成中の植物</Text>
            {activePlants.map(plant => (
              <View key={plant.id} style={styles.plantPreviewItem}>
                <Text style={styles.plantPreviewName}>{getPlantFullName(plant)}</Text>
                <Text style={styles.plantPreviewGP}>GP: {plant.growthPoints}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.interruptButton]}
            onPress={handleInterrupt}
          >
            <Text style={styles.buttonText}>✕ 中断</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 結果モーダル */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={resultModalVisible}
          onRequestClose={handleCloseResultModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.resultModal}>
              {lastSessionResults.length === 0 || lastSessionResults.every(r => r.earnedGP === 0) ? (
                <>
                  <Text style={styles.resultTitle}>セッション中断</Text>
                  <Text style={styles.resultText}>
                    成長ポイントは獲得できませんでした
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultTitle}>🎉 完了！</Text>
                  <ScrollView style={styles.resultsList}>
                    {lastSessionResults.map(result => {
                      const plant = plants.find(p => p.id === result.plantId);
                      if (!plant) return null;
                      
                      return (
                        <View key={result.plantId} style={styles.resultItem}>
                          <Text style={styles.resultPlantName}>{getPlantFullName(plant)}</Text>
                          <Text style={styles.resultGP}>+{result.earnedGP} GP</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={handleCloseResultModal}
              >
                <Text style={styles.buttonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // セッション開始画面
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.startContainer}>
        <Text style={styles.title}>フォーカスセッション</Text>

        {plants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>植物がありません</Text>
            <Text style={styles.emptySubtext}>
              ホーム画面で植物を作成してください
            </Text>
          </View>
        ) : (
          <>
            {/* 育成中の植物表示 */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                育成中の植物（{plants.length}個）
              </Text>
              <View style={styles.plantsList}>
                {plants.map(plant => (
                  <View key={plant.id} style={styles.plantItem}>
                    <Text style={styles.plantItemName}>{getPlantFullName(plant)}</Text>
                    <Text style={styles.plantItemGP}>GP: {plant.growthPoints}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.infoLabelSmall}>
                ※ セッション中は全ての植物が同時に育ちます
              </Text>
            </View>

            {/* セッション時間選択 */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>セッション時間</Text>
              <View style={styles.timeOptions}>
                {SESSION_OPTIONS.map(minutes => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.timeOption,
                      selectedMinutes === minutes && styles.timeOptionSelected,
                    ]}
                    onPress={() => setSelectedMinutes(minutes)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        selectedMinutes === minutes &&
                          styles.timeOptionTextSelected,
                      ]}
                    >
                      {minutes}分
                    </Text>
                    <Text
                      style={[
                        styles.timeOptionGP,
                        selectedMinutes === minutes &&
                          styles.timeOptionGPSelected,
                      ]}
                    >
                      +{calcGrowthPoints(minutes)} GP
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 開始ボタン */}
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStartSession}
            >
              <Text style={styles.buttonText}>セッション開始</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  startContainer: {
    padding: 20,
  },
  activeSessionContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 24,
    textAlign: 'center',
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  plantsList: {
    marginBottom: 8,
  },
  plantItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  plantItemGP: {
    fontSize: 14,
    color: '#666',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeOption: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  timeOptionSelected: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e9',
  },
  timeOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timeOptionTextSelected: {
    color: '#2e7d32',
  },
  timeOptionGP: {
    fontSize: 14,
    color: '#666',
  },
  timeOptionGPSelected: {
    color: '#4caf50',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  startButton: {
    backgroundColor: '#4caf50',
    marginTop: 24,
  },
  interruptButton: {
    backgroundColor: '#f44336',
    marginTop: 24,
  },
  closeButton: {
    backgroundColor: '#4caf50',
    marginTop: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBarOuter: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoLabelSmall: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  plantsPreview: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  plantsPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  plantPreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  plantPreviewName: {
    fontSize: 14,
    color: '#333',
  },
  plantPreviewGP: {
    fontSize: 14,
    color: '#666',
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
  resultModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultPlantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultGP: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 8,
  },
  mutationResult: {
    backgroundColor: '#f3e5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  mutationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9c27b0',
    marginBottom: 4,
  },
  mutationName: {
    fontSize: 14,
    color: '#7b1fa2',
  },
});
