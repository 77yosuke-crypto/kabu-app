import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { formatPrice } from '../lib/format';
import type { DailyBar } from '../lib/types';

const HEIGHT = 200;

/** 終値の折れ線チャート */
export function PriceChart({ bars }: { bars: DailyBar[] }) {
  const [width, setWidth] = useState(0);
  const points = bars.filter((b): b is DailyBar & { close: number } => b.close !== null);

  if (points.length < 2) {
    return <Text style={styles.empty}>チャートを表示できるデータがありません</Text>;
  }

  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const pad = 8;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = pad + (1 - (p.close - min) / range) * (HEIGHT - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const up = points[points.length - 1].close >= points[0].close;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.axis}>
        <Text style={styles.axisText}>高値 {formatPrice(max)}</Text>
        <Text style={styles.axisText}>安値 {formatPrice(min)}</Text>
      </View>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <Line x1={0} x2={width} y1={HEIGHT - 1} y2={HEIGHT - 1} stroke="#ddd" />
          <Polyline points={coords} fill="none" stroke={up ? '#d32f2f' : '#2e7d32'} strokeWidth={2} />
        </Svg>
      )}
      <View style={styles.axis}>
        <Text style={styles.axisText}>{points[0].date}</Text>
        <Text style={styles.axisText}>{points[points.length - 1].date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888', textAlign: 'center', paddingVertical: 40 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  axisText: { color: '#888', fontSize: 12 },
});
