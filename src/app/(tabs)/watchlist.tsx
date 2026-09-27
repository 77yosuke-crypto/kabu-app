import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppData } from '../../lib/AppData';
import { formatPrice } from '../../lib/format';

export default function WatchlistScreen() {
  const { watchlist, setWatchlist, quotes, refreshQuotes } = useAppData();
  const [input, setInput] = useState('');

  const add = async () => {
    const code = input.trim().toUpperCase();
    if (!/^[0-9][0-9A-Z]{3}$/.test(code) || watchlist.includes(code)) return;
    await setWatchlist([...watchlist, code]);
    setInput('');
    refreshQuotes();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="銘柄コード（例: 7203）"
          autoCapitalize="characters"
          maxLength={4}
        />
        <Button title="追加" onPress={add} />
      </View>
      <FlatList
        data={watchlist}
        keyExtractor={(c) => c}
        ListEmptyComponent={<Text style={styles.empty}>気になる銘柄のコードを追加してください</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Link href={{ pathname: '/stock/[code]', params: { code: item } }} asChild>
              <Pressable style={{ flex: 1 }}>
                <Text style={styles.code}>{item}</Text>
                <Text style={styles.sub}>
                  {formatPrice(quotes[item]?.price ?? null)} {quotes[item] ? `(${quotes[item]?.date})` : ''}
                </Text>
              </Pressable>
            </Link>
            <Button title="削除" color="#999" onPress={() => setWatchlist(watchlist.filter((c) => c !== item))} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  code: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 2 },
});
