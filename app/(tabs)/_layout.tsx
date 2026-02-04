import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'ホーム',
          tabBarLabel: 'ホーム',
        }} 
      />
      <Tabs.Screen 
        name="focus" 
        options={{ 
          title: 'フォーカス',
          tabBarLabel: 'フォーカス',
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: '設定',
          tabBarLabel: '設定',
        }} 
      />
    </Tabs>
  );
}
