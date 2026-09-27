import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeHoldings, summarize } from '../src/lib/portfolio.ts';

test('同じ銘柄は株数で加重平均してまとめる', () => {
  const merged = mergeHoldings([
    { code: '7203', name: 'トヨタ', shares: 100, avgCost: 2000 },
    { code: '7203', name: 'トヨタ', shares: 300, avgCost: 3000 },
    { code: '9432', name: 'NTT', shares: 1000, avgCost: 150 },
  ]);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0], { code: '7203', name: 'トヨタ', shares: 400, avgCost: 2750 });
});

test('株価のない銘柄は合計から外して件数を返す', () => {
  const s = summarize(
    [
      { code: '7203', name: 'トヨタ', shares: 100, avgCost: 2000 },
      { code: '9432', name: 'NTT', shares: 1000, avgCost: 150 },
    ],
    { '7203': { price: 2500, date: '2026-07-01' } },
  );
  assert.equal(s.totalCost, 200000);
  assert.equal(s.totalMarketValue, 250000);
  assert.equal(s.totalGain, 50000);
  assert.equal(s.totalGainRate, 0.25);
  assert.equal(s.unpricedCount, 1);
  assert.equal(s.items[1].gain, null);
});
