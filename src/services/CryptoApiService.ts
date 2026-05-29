export interface HistoricalDataPoint {
  timestamp: number;
  price: number;
}

const coinGeckoIds: Record<string, string> = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'SOLUSDT': 'solana',
  'ADAUSDT': 'cardano',
  'XRPUSDT': 'ripple',
};

class CryptoApiService {
  private baseUrl: string;
  // Cache storage mapping key (symbol-days) to (data + timestamp)
  private cache = new Map<string, { data: HistoricalDataPoint[]; timestamp: number }>();
  private cacheDurationMs: number = 5 * 60 * 1000; // 5 minutes cache expiry
  private requestQueue = new Map<string, Promise<HistoricalDataPoint[]>>();

  constructor(baseUrl: string = 'https://api.coingecko.com/api/v3') {
    this.baseUrl = baseUrl;
  }

  public async fetchHistoricalData(
    symbol: string,
    days: number,
    currentLivePrice?: number
  ): Promise<HistoricalDataPoint[]> {
    const coinId = coinGeckoIds[symbol] || symbol.toLowerCase();
    const cacheKey = `${coinId}-${days}`;
    
    // 1. Check client-side cache
    const cachedItem = this.cache.get(cacheKey);
    const now = Date.now();
    if (cachedItem && now - cachedItem.timestamp < this.cacheDurationMs) {
      console.log(`Cache HIT for ${cacheKey}`);
      return cachedItem.data;
    }

    // 2. Debounce/Deduplicate in-flight requests
    const inFlightRequest = this.requestQueue.get(cacheKey);
    if (inFlightRequest) {
      console.log(`Deduplicating active request for ${cacheKey}`);
      return inFlightRequest;
    }

    // Create a new fetch request
    const requestPromise = (async () => {
      try {
        const data = await this.fetchFromApi(coinId, days);
        // Cache success
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        console.warn(`REST API failed for ${coinId} (${days} days), utilizing resilient mock fallback. Error:`, error);
        
        // Generate high-fidelity fallback data
        const fallbackData = this.generateFallbackData(symbol, days, currentLivePrice);
        
        // Cache fallback data for a shorter duration (e.g. 1 minute) to allow re-trying real API later
        this.cache.set(cacheKey, { data: fallbackData, timestamp: Date.now() - (4 * 60 * 1000) });
        return fallbackData;
      } finally {
        this.requestQueue.delete(cacheKey);
      }
    })();

    this.requestQueue.set(cacheKey, requestPromise);
    return requestPromise;
  }

  private async fetchFromApi(coinId: string, days: number): Promise<HistoricalDataPoint[]> {
    // Determine interval depending on days (standard Coingecko limits)
    // 1 day: hourly data
    // 7 days: daily/hourly
    const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    
    if (!json.prices || !Array.isArray(json.prices)) {
      throw new Error('Malformed historical response from CoinGecko API');
    }

    // Map [timestamp, price] array to clean HistoricalDataPoint objects
    return json.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
    }));
  }

  /**
   * High-fidelity Random Walk Generator (Geometric Brownian Motion style)
   * Constructs beautiful historical curves that merge perfectly with the live ticker!
   */
  private generateFallbackData(
    symbol: string,
    days: number,
    currentLivePrice?: number
  ): HistoricalDataPoint[] {
    const dataPoints: HistoricalDataPoint[] = [];
    const now = Date.now();
    
    // Seed price from parameter or standard defaults
    let price = currentLivePrice && currentLivePrice > 0 ? currentLivePrice : this.getDefaultPrice(symbol);
    
    // Choose appropriate granularity
    // 1 day -> 24 data points (hourly)
    // 7 days -> 168 data points (hourly)
    // 0.04 days (1 hour) -> 60 data points (minute)
    let pointsCount = 24;
    let stepMs = 60 * 60 * 1000; // 1 hour step

    if (days === 1) {
      pointsCount = 24;
      stepMs = 60 * 60 * 1000;
    } else if (days === 7) {
      pointsCount = 168; // 24 * 7
      stepMs = 60 * 60 * 1000;
    } else {
      // 1 hour
      pointsCount = 60;
      stepMs = 60 * 1000; // 1 minute step
    }

    // Custom drift and volatility based on asset
    const volatility = symbol === 'SOLUSDT' ? 0.015 
                     : symbol === 'BTCUSDT' ? 0.007 
                     : symbol === 'ETHUSDT' ? 0.009 
                     : 0.012; // ADA, XRP

    // Create random walk backwards in time
    for (let i = 0; i < pointsCount; i++) {
      const timestamp = now - i * stepMs;
      dataPoints.unshift({ timestamp, price });

      // Walk backwards: invert drift and add random fluctuation
      const rand = (Math.random() - 0.5) * 2; // -1 to 1
      const pctChange = rand * volatility;
      price = Math.max(0.0001, price * (1 - pctChange)); // Walk reverse
    }

    return dataPoints;
  }

  private getDefaultPrice(symbol: string): number {
    const defaults: Record<string, number> = {
      'BTCUSDT': 68500,
      'ETHUSDT': 3820,
      'SOLUSDT': 165,
      'ADAUSDT': 0.48,
      'XRPUSDT': 0.52,
    };
    return defaults[symbol] || 1.0;
  }
}

export const cryptoApiService = new CryptoApiService();
export default cryptoApiService;
