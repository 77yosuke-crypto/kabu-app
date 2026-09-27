import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppDataProvider } from '../lib/AppData';

export default function RootLayout() {
  return (
    <AppDataProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="stock/[code]" options={{ title: '銘柄詳細' }} />
      </Stack>
    </AppDataProvider>
  );
}
