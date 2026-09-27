import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';

import type { Holding } from './types';

const HOLDINGS_KEY = 'holdings.v1';
const WATCHLIST_KEY = 'watchlist.v1';
const API_KEY_KEY = 'jquants.apiKey';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await Storage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const loadHoldings = () => readJson<Holding[]>(HOLDINGS_KEY, []);
export const saveHoldings = (holdings: Holding[]) => Storage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));

export const loadWatchlist = () => readJson<string[]>(WATCHLIST_KEY, []);
export const saveWatchlist = (codes: string[]) => Storage.setItem(WATCHLIST_KEY, JSON.stringify(codes));

/** APIキーは端末の安全な保存領域（iOSはKeychain、AndroidはKeystore）に置く */
export const loadApiKey = () => SecureStore.getItemAsync(API_KEY_KEY);
export const saveApiKey = (key: string) =>
  key ? SecureStore.setItemAsync(API_KEY_KEY, key) : SecureStore.deleteItemAsync(API_KEY_KEY);
