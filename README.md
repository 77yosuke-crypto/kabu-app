# 株アプリ（kabu-app）

自分用の日本株ポートフォリオアプリです。楽天証券の保有銘柄CSVを読み込み、J-Quants APIの株価で評価損益を表示します。

## できること

- ホーム：評価額合計・評価損益と、保有銘柄の一覧（下に引っぱると株価を更新）
- 銘柄詳細：直近1年の終値チャート、保有株数・取得単価・損益
- ウォッチリスト：銘柄コードで追加
- 設定：楽天証券CSVの読み込み、J-QuantsのAPIキー

データはすべてスマホの中に保存します。APIキーは端末の安全な保存領域（Keychain / Keystore）に入ります。

## 準備

1. [J-Quants](https://jpx-jquants.com/) に登録し、ダッシュボードでAPIキーを発行します。無料プランは株価が約12週間遅れです。
2. スマホに「Expo Go」アプリを入れます。

## 動かし方

```bash
npm install
npm start
```

表示されたQRコードをスマホで読み取ると、Expo Goでアプリが開きます。PCとスマホは同じWi-Fiにつないでください。

## 楽天証券CSVの取り込み

楽天証券のWebサイトで「口座管理 → 保有商品一覧」からCSVをダウンロードし、アプリの設定タブで選びます。国内株式の行だけを取り込み、同じ銘柄が複数の口座（特定・NISAなど）にあれば1つにまとめます。

CSVの列は見出しの名前（銘柄コード・保有数量・平均取得価額など）で探しています。実物のCSVで読み込めない場合は `src/lib/rakutenCsv.ts` の見出し候補を調整してください。

## 開発

```bash
npm test           # 計算・CSV・APIクライアントのテスト
npm run typecheck  # 型チェック
```

| 場所 | 内容 |
| --- | --- |
| `src/app/` | 画面（Expo Router） |
| `src/lib/jquants.ts` | J-Quants API V2 クライアント |
| `src/lib/rakutenCsv.ts` | 楽天証券CSVの読み取り |
| `src/lib/portfolio.ts` | 評価額・損益の計算 |
| `src/lib/AppData.tsx` | アプリ全体のデータと保存 |
