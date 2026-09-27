import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import Encoding from 'encoding-japanese';

import { mergeHoldings } from './portfolio';
import { parseRakutenHoldings } from './rakutenCsv';
import type { Holding } from './types';

/** 楽天証券のCSVはShift_JISのことが多いので、文字コードを判定してから読む */
export function decodeCsvBytes(bytes: Uint8Array): string {
  const detected = Encoding.detect(bytes);
  const from = detected === 'UTF8' || detected === 'ASCII' ? 'UTF8' : 'SJIS';
  return Encoding.convert(bytes, { to: 'UNICODE', from, type: 'string' });
}

/** ファイルを選んでもらい、保有銘柄を返す。キャンセルされたら null */
export async function pickRakutenCsv(): Promise<Holding[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const bytes = await new File(result.assets[0].uri).bytes();
  return mergeHoldings(parseRakutenHoldings(decodeCsvBytes(bytes)));
}
