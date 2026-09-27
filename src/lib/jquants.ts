import type { DailyBar } from './types';

/**
 * J-Quants API V2 のクライアント。
 * 認証はダッシュボードで発行したAPIキーを x-api-key ヘッダーで渡す。
 * 仕様: https://jpx-jquants.com/ja/spec/quickstart
 */

export const JQUANTS_BASE_URL = 'https://api.jquants.com/v2';

type Fetch = typeof fetch;

export class JQuantsError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

type RawBar = {
  Date: string;
  Code: string;
  O: number | null;
  H: number | null;
  L: number | null;
  C: number | null;
  Vo: number | null;
  AdjO?: number | null;
  AdjH?: number | null;
  AdjL?: number | null;
  AdjC?: number | null;
  AdjVo?: number | null;
};

type RawMaster = { Code: string; CoName: string };

type Page<T> = { data?: T[]; pagination_key?: string; message?: string };

/** YYYY-MM-DD / YYYYMMDD を YYYY-MM-DD にそろえる */
export function normalizeDate(s: string): string {
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s;
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** 株式分割でチャートが途切れないよう、調整後の値があればそちらを使う */
export function toDailyBar(raw: RawBar): DailyBar {
  return {
    date: normalizeDate(raw.Date),
    open: raw.AdjO ?? raw.O,
    high: raw.AdjH ?? raw.H,
    low: raw.AdjL ?? raw.L,
    close: raw.AdjC ?? raw.C,
    volume: raw.AdjVo ?? raw.Vo,
  };
}

export function createJQuantsClient(apiKey: string, fetchImpl: Fetch = fetch) {
  async function getAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const out: T[] = [];
    let paginationKey: string | undefined;
    do {
      const query = new URLSearchParams(params);
      if (paginationKey) query.set('pagination_key', paginationKey);
      const res = await fetchImpl(`${JQUANTS_BASE_URL}${path}?${query}`, {
        headers: { 'x-api-key': apiKey },
      });
      const body = (await res.json().catch(() => ({}))) as Page<T>;
      if (!res.ok) {
        throw new JQuantsError(body.message ?? `J-Quants APIの呼び出しに失敗しました (${res.status})`, res.status);
      }
      out.push(...(body.data ?? []));
      paginationKey = body.pagination_key;
    } while (paginationKey);
    return out;
  }

  return {
    /** 期間内の日足。from/to は Date または YYYYMMDD */
    async dailyBars(code: string, from: Date | string, to: Date | string): Promise<DailyBar[]> {
      const raw = await getAll<RawBar>('/equities/bars/daily', {
        code,
        from: typeof from === 'string' ? from : toYmd(from),
        to: typeof to === 'string' ? to : toYmd(to),
      });
      return raw.map(toDailyBar).sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * 取得できる最新の終値。無料プランは約12週間遅れのため、直近20週を取りに行って最後の値を使う。
     */
    async latestClose(code: string, now = new Date()): Promise<{ price: number; date: string } | undefined> {
      const from = new Date(now);
      from.setDate(from.getDate() - 7 * 20);
      const bars = await this.dailyBars(code, from, now);
      for (let i = bars.length - 1; i >= 0; i--) {
        const close = bars[i].close;
        if (close !== null) return { price: close, date: bars[i].date };
      }
      return undefined;
    },

    async companyName(code: string): Promise<string | undefined> {
      const rows = await getAll<RawMaster>('/equities/master', { code });
      return rows[0]?.CoName;
    },
  };
}

export type JQuantsClient = ReturnType<typeof createJQuantsClient>;
