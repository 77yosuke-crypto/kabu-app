import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppData } from '../../lib/AppData';
import { pickRakutenCsv } from '../../lib/importCsv';

export default function SettingsScreen() {
  const { apiKey, setApiKey, holdings, setHoldings, refreshQuotes } = useAppData();
  const [keyInput, setKeyInput] = useState(apiKey ?? '');

  useEffect(() => setKeyInput(apiKey ?? ''), [apiKey]);

  const importCsv = async () => {
    try {
      const imported = await pickRakutenCsv();
      if (!imported) return;
      await setHoldings(imported);
      Alert.alert('読み込みました', `${imported.length}銘柄を登録しました`);
      refreshQuotes();
    } catch (e) {
      Alert.alert('読み込めませんでした', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>楽天証券の保有銘柄</Text>
        <Text style={styles.body}>
          楽天証券のWebサイトで「口座管理 → 保有商品一覧」からCSVをダウンロードし、ここで選んでください。読み込むたびに保有銘柄を置き換えます。
        </Text>
        <Text style={styles.body}>現在 {holdings.length} 銘柄を登録済み</Text>
        <Button title="CSVを読み込む" onPress={importCsv} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>J-Quants APIキー</Text>
        <Text style={styles.body}>J-Quantsのダッシュボードで発行したAPIキーを入力してください。キーはこの端末の安全な領域にだけ保存されます。</Text>
        <TextInput
          style={styles.input}
          value={keyInput}
          onChangeText={setKeyInput}
          placeholder="APIキー"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Button title="保存" onPress={() => setApiKey(keyInput)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { color: '#555', lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
});
