/** 保有銘柄（1銘柄・1口座ごと） */
export type Holding = {
  /** 4桁または5桁の銘柄コード（例: "7203"） */
  code: string;
  name: string;
  shares: number;
  /** 1株あたりの平均取得単価（円） */
  avgCost: number;
};

/** 日足の株価 */
export type DailyBar = {
  /** YYYY-MM-DD */
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type HoldingValuation = Holding & {
  price: number | null;
  priceDate: string | null;
  marketValue: number | null;
  cost: number;
  gain: number | null;
  gainRate: number | null;
};

export type PortfolioSummary = {
  items: HoldingValuation[];
  totalCost: number;
  totalMarketValue: number;
  totalGain: number;
  totalGainRate: number | null;
  /** 株価が取れず合計に含めていない銘柄数 */
  unpricedCount: number;
};
