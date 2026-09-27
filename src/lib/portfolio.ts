import type { Holding, HoldingValuation, PortfolioSummary } from './types';

/** 同じ銘柄コードの保有（特定口座とNISAなど）を1行にまとめる。取得単価は株数で加重平均する。 */
export function mergeHoldings(holdings: Holding[]): Holding[] {
  const byCode = new Map<string, Holding>();
  for (const h of holdings) {
    const prev = byCode.get(h.code);
    if (!prev) {
      byCode.set(h.code, { ...h });
      continue;
    }
    const shares = prev.shares + h.shares;
    const avgCost = shares === 0 ? 0 : (prev.avgCost * prev.shares + h.avgCost * h.shares) / shares;
    byCode.set(h.code, { ...prev, shares, avgCost });
  }
  return [...byCode.values()];
}

export function valueHolding(
  holding: Holding,
  quote: { price: number; date: string } | undefined,
): HoldingValuation {
  const cost = holding.avgCost * holding.shares;
  if (!quote) {
    return { ...holding, price: null, priceDate: null, marketValue: null, cost, gain: null, gainRate: null };
  }
  const marketValue = quote.price * holding.shares;
  const gain = marketValue - cost;
  return {
    ...holding,
    price: quote.price,
    priceDate: quote.date,
    marketValue,
    cost,
    gain,
    gainRate: cost === 0 ? null : gain / cost,
  };
}

/** 株価が取れた銘柄だけで合計を出す。取れなかった銘柄数は unpricedCount で返す。 */
export function summarize(
  holdings: Holding[],
  quotes: Record<string, { price: number; date: string } | undefined>,
): PortfolioSummary {
  const items = holdings.map((h) => valueHolding(h, quotes[h.code]));
  let totalCost = 0;
  let totalMarketValue = 0;
  let unpricedCount = 0;
  for (const item of items) {
    if (item.marketValue === null) {
      unpricedCount++;
      continue;
    }
    totalCost += item.cost;
    totalMarketValue += item.marketValue;
  }
  const totalGain = totalMarketValue - totalCost;
  return {
    items,
    totalCost,
    totalMarketValue,
    totalGain,
    totalGainRate: totalCost === 0 ? null : totalGain / totalCost,
    unpricedCount,
  };
}
