import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="plant/[id]" options={{ title: '植物詳細' }} />
    </Stack>
  );
}
