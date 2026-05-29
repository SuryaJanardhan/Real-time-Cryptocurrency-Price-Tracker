import { describe, it, expect, vi, beforeEach } from 'vitest';
import cryptoApiService from '../services/CryptoApiService';

describe('CryptoApiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate realistic random walk historical data as fallback when API fails', async () => {
    const symbol = 'SOLUSDT';
    const livePrice = 150.0;
    
    // Mock fetch to reject, simulating a network or rate limit failure
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Rate Limit Exceeded'));
    
    const data = await cryptoApiService.fetchHistoricalData(symbol, 1, livePrice);
    
    expect(fetchSpy).toHaveBeenCalled();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(24); // 24 points for 1 day view in mock fallback
    
    const lastPoint = data[data.length - 1];
    expect(lastPoint.price).toBeCloseTo(livePrice, 1);
    expect(lastPoint.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('should generate correct number of points depending on timeframe in fallback mode', async () => {
    // Mock fetch to fail
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Offline'));

    // 7 Days view
    const data7d = await cryptoApiService.fetchHistoricalData('BTCUSDT', 7, 65000);
    expect(data7d.length).toBe(168); // 168 hours for 7 days

    // 1 Hour view
    const data1h = await cryptoApiService.fetchHistoricalData('BTCUSDT', 0.0416, 65000);
    expect(data1h.length).toBe(60); // 60 points for 1 hour
  });

  it('should cache identical requests and return cached results instantly', async () => {
    // Mock fetch to return a static valid price dataset
    const mockPrices = [
      [1700000000000, 3000.0],
      [1700001000000, 3010.0]
    ];
    
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ prices: mockPrices })
    } as any);
    
    // Execute request once (clearing key ethically by selecting a new symbol variant 'XRPUSDT' or new timeframe to bypass dirty caches)
    const data1 = await cryptoApiService.fetchHistoricalData('XRPUSDT', 7, 0.50);
    
    // Execute identical request
    const data2 = await cryptoApiService.fetchHistoricalData('XRPUSDT', 7, 0.50);
    
    // Both datasets should be identical
    expect(data1).toEqual(data2);
    
    // Global fetch should only have been called ONCE due to caching!
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    
    // The dataset contents should match our static mocked API return
    expect(data1.length).toBe(2);
    expect(data1[0].price).toBe(3000.0);
  });
});
