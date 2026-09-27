import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createJQuantsClient, type JQuantsClient } from './jquants';
import * as storage from './storage';
import type { Holding } from './types';

type Quote = { price: number; date: string };

type AppData = {
  loaded: boolean;
  holdings: Holding[];
  watchlist: string[];
  apiKey: string | null;
  client: JQuantsClient | null;
  quotes: Record<string, Quote | undefined>;
  refreshing: boolean;
  error: string | null;
  setHoldings: (h: Holding[]) => Promise<void>;
  setWatchlist: (codes: string[]) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  refreshQuotes: () => Promise<void>;
};

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [holdings, setHoldingsState] = useState<Holding[]>([]);
  const [watchlist, setWatchlistState] = useState<string[]>([]);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote | undefined>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([storage.loadHoldings(), storage.loadWatchlist(), storage.loadApiKey()]).then(([h, w, k]) => {
      setHoldingsState(h);
      setWatchlistState(w);
      setApiKeyState(k);
      setLoaded(true);
    });
  }, []);

  const client = useMemo(() => (apiKey ? createJQuantsClient(apiKey) : null), [apiKey]);

  const refreshQuotes = useCallback(async () => {
    if (!client) return;
    setRefreshing(true);
    setError(null);
    try {
      const codes = [...new Set([...holdings.map((h) => h.code), ...watchlist])];
      const next: Record<string, Quote | undefined> = {};
      // 無料プランのレート制限に配慮して1銘柄ずつ取得する
      for (const code of codes) {
        next[code] = await client.latestClose(code);
      }
      setQuotes(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, [client, holdings, watchlist]);

  useEffect(() => {
    if (loaded) refreshQuotes();
    // 起動時とAPIキー設定時だけ自動更新する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, client]);

  const value: AppData = {
    loaded,
    holdings,
    watchlist,
    apiKey,
    client,
    quotes,
    refreshing,
    error,
    setHoldings: async (h) => {
      setHoldingsState(h);
      await storage.saveHoldings(h);
    },
    setWatchlist: async (codes) => {
      setWatchlistState(codes);
      await storage.saveWatchlist(codes);
    },
    setApiKey: async (key) => {
      const trimmed = key.trim();
      await storage.saveApiKey(trimmed);
      setApiKeyState(trimmed || null);
    },
    refreshQuotes,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData must be used inside AppDataProvider');
  return v;
}
