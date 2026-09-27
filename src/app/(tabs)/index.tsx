import { Link } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAppData } from '../../lib/AppData';
import { formatPrice, formatRate, formatSignedYen, formatYen, gainColor } from '../../lib/format';
import { summarize } from '../../lib/portfolio';

export default function HomeScreen() {
  const { holdings, quotes, refreshing, refreshQuotes, apiKey, error } = useAppData();
  const summary = summarize(holdings, quotes);
  const latestDate = summary.items.map((i) => i.priceDate).filter(Boolean).sort().at(-1);

  return (
    <FlatList
      data={summary.items}
      keyExtractor={(item) => item.code}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshQuotes} />}
      ListHeaderComponent={
        <View style={styles.summary}>
          <Text style={styles.label}>評価額合計</Text>
          <Text style={styles.total}>{formatYen(summary.totalMarketValue)}</Text>
          <Text style={[styles.gain, { color: gainColor(summary.totalGain) }]}>
            {formatSignedYen(summary.totalGain)} {formatRate(summary.totalGainRate)}
          </Text>
          {latestDate && <Text style={styles.note}>株価は{latestDate}時点（無料プランは約12週遅れ）</Text>}
          {summary.unpricedCount > 0 && (
            <Text style={styles.note}>{summary.unpricedCount}銘柄は株価が取れず合計に含めていません</Text>
          )}
          {!apiKey && <Text style={styles.warn}>設定タブでJ-QuantsのAPIキーを入力してください</Text>}
          {error && <Text style={styles.warn}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>設定タブから楽天証券のCSVを読み込んでください</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/stock/[code]', params: { code: item.code } }} asChild>
          <Pressable style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || item.code}</Text>
              <Text style={styles.sub}>
                {item.code}・{item.shares}株・取得 {formatPrice(item.avgCost)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.name}>{formatPrice(item.price)}</Text>
              <Text style={[styles.sub, { color: gainColor(item.gain) }]}>
                {formatSignedYen(item.gain)} {formatRate(item.gainRate)}
              </Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  summary: { padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  label: { color: '#666' },
  total: { fontSize: 28, fontWeight: '700', marginVertical: 4 },
  gain: { fontSize: 16, fontWeight: '600' },
  note: { color: '#888', fontSize: 12, marginTop: 6 },
  warn: { color: '#b26a00', marginTop: 8 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  row: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 2 },
});
