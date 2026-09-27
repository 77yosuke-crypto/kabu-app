import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PriceChart } from '../../components/PriceChart';
import { useAppData } from '../../lib/AppData';
import { formatPrice, formatRate, formatSignedYen, formatYen, gainColor } from '../../lib/format';
import { valueHolding } from '../../lib/portfolio';
import type { DailyBar } from '../../lib/types';

export default function StockScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { client, holdings, quotes } = useAppData();
  const [bars, setBars] = useState<DailyBar[] | null>(null);
  const [name, setName] = useState<string | undefined>(holdings.find((h) => h.code === code)?.name);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !code) return;
    const to = new Date();
    const from = new Date(to);
    from.setFullYear(from.getFullYear() - 1);
    client.dailyBars(code, from, to).then(setBars, (e) => setError(String(e?.message ?? e)));
    if (!name) client.companyName(code).then(setName, () => {});
  }, [client, code]); // eslint-disable-line react-hooks/exhaustive-deps

  const holding = holdings.find((h) => h.code === code);
  const valued = holding ? valueHolding(holding, quotes[holding.code]) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: name ? `${name}（${code}）` : code }} />
      <View style={styles.card}>
        {!client ? (
          <Text style={styles.muted}>APIキーを設定するとチャートが表示されます</Text>
        ) : error ? (
          <Text style={styles.warn}>{error}</Text>
        ) : bars ? (
          <PriceChart bars={bars} />
        ) : (
          <ActivityIndicator style={{ paddingVertical: 40 }} />
        )}
      </View>

      {valued && (
        <View style={styles.card}>
          <Row label="保有株数" value={`${valued.shares}株`} />
          <Row label="平均取得単価" value={formatPrice(valued.avgCost)} />
          <Row label="現在値" value={`${formatPrice(valued.price)}${valued.priceDate ? `（${valued.priceDate}）` : ''}`} />
          <Row label="評価額" value={formatYen(valued.marketValue)} />
          <Row
            label="評価損益"
            value={`${formatSignedYen(valued.gain)} ${formatRate(valued.gainRate)}`}
            color={gainColor(valued.gain)}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.value, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  value: { fontSize: 16, fontWeight: '600' },
  muted: { color: '#666' },
  warn: { color: '#b26a00' },
});
