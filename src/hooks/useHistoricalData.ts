import { useState, useEffect } from 'react';
import useCryptoStore from '../store/cryptoStore';
import cryptoApiService, { HistoricalDataPoint } from '../services/CryptoApiService';

export type Timeframe = '1H' | '24H' | '7D';

export function useHistoricalData(symbol: string, timeframe: Timeframe) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtain the current live price from our Zustand store
  const livePrice = useCryptoStore(
    (state) => state.prices[symbol]?.price || 0
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Map timeframes to days
    let days = 1;
    if (timeframe === '1H') {
      days = 0.0416; // 1 / 24
    } else if (timeframe === '7D') {
      days = 7;
    } else {
      days = 1; // 24H
    }

    // Brief debounce of 250ms to throttle high-frequency toggling
    const delayTimer = setTimeout(async () => {
      try {
        const result = await cryptoApiService.fetchHistoricalData(symbol, days, livePrice);
        if (active) {
          setData(result);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to fetch historical chart data.');
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(delayTimer);
    };
  }, [symbol, timeframe, livePrice]); // livePrice is included to dynamically merge ticks on first seed, but debounced

  return { data, loading, error };
}

export default useHistoricalData;
