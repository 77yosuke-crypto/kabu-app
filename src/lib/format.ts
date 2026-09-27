const yen = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 });
const price = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });

export const formatYen = (n: number | null) => (n === null ? '—' : `${yen.format(n)}円`);
export const formatPrice = (n: number | null) => (n === null ? '—' : price.format(n));
export const formatSignedYen = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${yen.format(n)}円`);
export const formatRate = (r: number | null) => (r === null ? '' : `${r > 0 ? '+' : ''}${(r * 100).toFixed(2)}%`);

/** 日本の慣習に合わせ、上昇は赤・下落は緑 */
export const gainColor = (n: number | null) => (n === null || n === 0 ? '#555' : n > 0 ? '#d32f2f' : '#2e7d32');
