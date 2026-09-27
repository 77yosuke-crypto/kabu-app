import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseCsv, parseRakutenHoldings, RakutenCsvError } from '../src/lib/rakutenCsv.ts';

// 実物の列構成は未確認。見出し名で列を探す動きを確かめるための想定データ。
const sample = [
  '"■資産合計欄"',
  '"資産合計","1,234,567"',
  '',
  '"■ 特定口座・一般口座・NISA口座の合計"',
  '"種別","銘柄コード・ティッカー","銘柄","口座","保有数量","［単位］","平均取得価額","［単位］","現在値","［単位］"',
  '"国内株式","7203","トヨタ自動車","特定","100","株","2,000.5","円","2,500","円"',
  '"国内株式","7203","トヨタ自動車","NISA成長投資枠","300","株","3,000","円","2,500","円"',
  '"国内株式","130A","Veritas In Silico","特定","200","株","1,000","円","900","円"',
  '"米国株式","AAPL","APPLE INC","特定","10","株","150","USD","200","USD"',
  '"投資信託","","eMAXIS Slim","NISA","10,000","口","15,000","円","20,000","円"',
].join('\r\n');

test('CSVの引用符とカンマ入りの数値を扱える', () => {
  assert.deepEqual(parseCsv('"a","1,000"\r\n"b ""x""",2'), [
    ['a', '1,000'],
    ['b "x"', '2'],
  ]);
});

test('国内株式の行だけを取り出す', () => {
  const holdings = parseRakutenHoldings('﻿' + sample);
  assert.deepEqual(holdings, [
    { code: '7203', name: 'トヨタ自動車', shares: 100, avgCost: 2000.5 },
    { code: '7203', name: 'トヨタ自動車', shares: 300, avgCost: 3000 },
    { code: '130A', name: 'Veritas In Silico', shares: 200, avgCost: 1000 },
  ]);
});

test('見出しが見つからなければ分かるエラーにする', () => {
  assert.throws(() => parseRakutenHoldings('a,b,c\n1,2,3'), RakutenCsvError);
});
