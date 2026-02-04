import { View, Text, StyleSheet } from 'react-native';

export default function FocusScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>フォーカスモード</Text>
      <Text style={styles.description}>セッション選択画面（実装予定）</Text>
      <Text style={styles.info}>10 / 25 / 45 / 60 分</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1565c0',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: '#999',
  },
});
