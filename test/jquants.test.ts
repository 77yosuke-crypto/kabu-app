import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createJQuantsClient, JQuantsError } from '../src/lib/jquants.ts';

function fakeFetch(pages: object[], status = 200) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const impl = (async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });
    const body = pages[calls.length - 1];
    return { ok: status < 400, status, json: async () => body };
  }) as unknown as typeof fetch;
  return { impl, calls };
}

test('APIキーをヘッダーで送り、ページを最後まで読んで日付順に並べる', async () => {
  const { impl, calls } = fakeFetch([
    { data: [{ Date: '2026-06-02', Code: '72030', O: 1, H: 1, L: 1, C: 110, Vo: 5, AdjC: 110 }], pagination_key: 'k1' },
    { data: [{ Date: '2026-06-01', Code: '72030', O: 1, H: 1, L: 1, C: 100, Vo: 5 }] },
  ]);
  const client = createJQuantsClient('secret', impl);
  const bars = await client.dailyBars('7203', '20260601', '20260602');

  assert.equal(calls.length, 2);
  assert.equal(calls[0].headers['x-api-key'], 'secret');
  assert.match(calls[0].url, /^https:\/\/api\.jquants\.com\/v2\/equities\/bars\/daily\?code=7203&from=20260601&to=20260602$/);
  assert.match(calls[1].url, /pagination_key=k1/);
  assert.deepEqual(bars.map((b) => [b.date, b.close]), [
    ['2026-06-01', 100],
    ['2026-06-02', 110],
  ]);
});

test('最新の終値は値がある最後の日を使う', async () => {
  const { impl } = fakeFetch([
    {
      data: [
        { Date: '2026-06-01', Code: '72030', O: 1, H: 1, L: 1, C: 100, Vo: 5 },
        { Date: '2026-06-02', Code: '72030', O: null, H: null, L: null, C: null, Vo: 0 },
      ],
    },
  ]);
  const q = await createJQuantsClient('k', impl).latestClose('7203', new Date(2026, 8, 27));
  assert.deepEqual(q, { price: 100, date: '2026-06-01' });
});

test('エラー時はAPIのメッセージを返す', async () => {
  const { impl } = fakeFetch([{ message: 'Invalid API key' }], 401);
  await assert.rejects(createJQuantsClient('bad', impl).dailyBars('7203', '20260601', '20260602'), (e: unknown) => {
    return e instanceof JQuantsError && e.status === 401 && e.message === 'Invalid API key';
  });
});
