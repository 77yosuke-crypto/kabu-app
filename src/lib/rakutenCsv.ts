import type { Holding } from './types';

/**
 * 楽天証券の「保有商品一覧」CSVから国内株式の保有を取り出す。
 *
 * 実ファイルの列構成はまだ確認していないため、列の位置ではなく見出しの名前で探す。
 * 見出しの候補は実物のCSVで確認したうえで調整すること。
 */

const CODE_HEADERS = ['銘柄コード・ティッカー', '銘柄コード', 'コード'];
const NAME_HEADERS = ['銘柄名', '銘柄'];
const SHARES_HEADERS = ['保有数量', '数量', '保有株数'];
const AVG_COST_HEADERS = ['平均取得価額', '平均取得単価', '取得単価'];
const KIND_HEADERS = ['種別', '商品'];

/** 国内株式の銘柄コード（4桁の数字、または2024年以降の英字入りコード。末尾に0が付く5桁も許容） */
const JP_CODE = /^[0-9][0-9A-Z]{2}[0-9A-Z]0?$/;

export class RakutenCsvError extends Error {}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toNumber(s: string | undefined): number | null {
  if (s === undefined) return null;
  const cleaned = s.replace(/[,，\s円株口]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function findColumn(header: string[], candidates: string[]): number {
  const cells = header.map((h) => h.trim());
  for (const name of candidates) {
    const idx = cells.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** 1ファイルの中に見出し行が複数ある（商品ごとの表が続く）場合にも対応する。 */
export function parseRakutenHoldings(text: string): Holding[] {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  const holdings: Holding[] = [];
  let cols: { code: number; name: number; shares: number; avgCost: number; kind: number } | null = null;
  let sawHeader = false;

  for (const row of rows) {
    const code = findColumn(row, CODE_HEADERS);
    const shares = findColumn(row, SHARES_HEADERS);
    const avgCost = findColumn(row, AVG_COST_HEADERS);
    if (code !== -1 && shares !== -1 && avgCost !== -1) {
      cols = { code, shares, avgCost, name: findColumn(row, NAME_HEADERS), kind: findColumn(row, KIND_HEADERS) };
      sawHeader = true;
      continue;
    }
    if (!cols) continue;

    const rawCode = (row[cols.code] ?? '').trim().toUpperCase();
    if (!JP_CODE.test(rawCode)) continue;
    if (cols.kind !== -1) {
      const kind = row[cols.kind] ?? '';
      if (kind && !kind.includes('国内株式')) continue;
    }
    const n = toNumber(row[cols.shares]);
    const cost = toNumber(row[cols.avgCost]);
    if (n === null || cost === null || n <= 0) continue;

    holdings.push({
      code: rawCode.slice(0, 4),
      name: cols.name !== -1 ? (row[cols.name] ?? '').trim() : '',
      shares: n,
      avgCost: cost,
    });
  }

  if (!sawHeader) {
    throw new RakutenCsvError('保有数量・平均取得価額の列が見つかりませんでした。楽天証券の「保有商品一覧」CSVか確認してください。');
  }
  return holdings;
}
