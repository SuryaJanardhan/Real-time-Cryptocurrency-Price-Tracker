export interface CryptoMessage {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

type MessageCallback = (data: CryptoMessage) => void;
type StatusCallback = (connected: boolean, attempting: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private baseReconnectIntervalMs: number = 1000;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private listeners: Set<MessageCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  private mockIntervalId: ReturnType<typeof setInterval> | null = null;
  private activeMockPrices: Record<string, number> = {
    'BTCUSDT': 68500,
    'ETHUSDT': 3820,
    'SOLUSDT': 165,
    'ADAUSDT': 0.48,
    'XRPUSDT': 0.52
  };

  // Supported trading pairs
  private targetSymbols = new Set(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT']);

  constructor(url: string = 'wss://stream.binance.com:9443/ws/!miniTicker@arr') {
    this.url = url;
  }

  public connect(): void {
    if (this.isConnected || this.isConnecting) return;

    this.isConnecting = true;
    this.emitStatus();

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.attemptReconnect();
    }
  }

  public disconnect(): void {
    this.clearTimers();
    if (this.ws) {
      // Remove event listeners before closing to prevent close handlers triggering reconnects
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.emitStatus();
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.stopMockTicker();
      this.emitStatus();
      console.log('WebSocket successfully connected to Binance feed.');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          data.forEach((item) => {
            const rawSymbol = item.s;
            if (this.targetSymbols.has(rawSymbol)) {
              const price = parseFloat(item.c);
              const open = parseFloat(item.o);
              const change24h = open > 0 ? ((price - open) / open) * 100 : 0;
              const volume24h = parseFloat(item.q); // Volume in Quote asset (USDT)
              const high24h = parseFloat(item.h);
              const low24h = parseFloat(item.l);

              const parsedMessage: CryptoMessage = {
                symbol: rawSymbol,
                price,
                change24h,
                volume24h,
                high24h,
                low24h,
                timestamp: Date.now()
              };

              // Keep mock tracked prices in sync so if connection drops, mock continues from last known values
              this.activeMockPrices[rawSymbol] = price;

              this.listeners.forEach((callback) => callback(parsedMessage));
            }
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error encountered:', error);
      // Let onclose handle reconnection
    };

    this.ws.onclose = (event) => {
      console.warn(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
      this.isConnected = false;
      this.isConnecting = false;
      this.emitStatus();
      this.attemptReconnect();
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached. Switching to offline mock feed.');
      this.startMockTicker();
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff with a cap at 30 seconds
    const delay = Math.min(
      this.baseReconnectIntervalMs * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(`Reconnecting to WebSocket in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.emitStatus();

    this.reconnectTimerId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public subscribeToMessages(callback: MessageCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeToStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    // Emit initial state
    callback(this.isConnected, this.isConnecting || (this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts));
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private emitStatus(): void {
    const isAttempting = this.isConnecting || (this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts);
    this.statusListeners.forEach((callback) => callback(this.isConnected, isAttempting));
  }

  private clearTimers(): void {
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    this.stopMockTicker();
  }

  /* Resilience Tickers: Triggered when WebSocket cannot connect */
  private startMockTicker(): void {
    if (this.mockIntervalId) return;

    console.log('Resilient mock price ticks activated.');
    this.mockIntervalId = setInterval(() => {
      Array.from(this.targetSymbols).forEach((symbol) => {
        const currentVal = this.activeMockPrices[symbol];
        // Introduce small random fluctuations: +/- 0.05% to 0.15%
        const volatility = 0.0015;
        const changePercent = (Math.random() - 0.5) * volatility;
        const newPrice = Math.max(0.0001, currentVal * (1 + changePercent));
        
        this.activeMockPrices[symbol] = newPrice;

        // Mock 24h parameters if offline
        const mockChange24h = symbol === 'BTCUSDT' ? 2.34 
                            : symbol === 'ETHUSDT' ? -1.12 
                            : symbol === 'SOLUSDT' ? 5.87 
                            : symbol === 'ADAUSDT' ? -0.45 
                            : 0.18; // XRP
        
        const mockVolume = symbol === 'BTCUSDT' ? 2843920381
                         : symbol === 'ETHUSDT' ? 1493029281
                         : symbol === 'SOLUSDT' ? 682948293
                         : symbol === 'ADAUSDT' ? 98203847
                         : 194829302;

        const mockHigh = currentVal * 1.05;
        const mockLow = currentVal * 0.95;

        const mockMsg: CryptoMessage = {
          symbol,
          price: newPrice,
          change24h: mockChange24h + (changePercent * 100),
          volume24h: mockVolume,
          high24h: mockHigh,
          low24h: mockLow,
          timestamp: Date.now()
        };

        this.listeners.forEach((callback) => callback(mockMsg));
      });
    }, 1000);
  }

  private stopMockTicker(): void {
    if (this.mockIntervalId) {
      clearInterval(this.mockIntervalId);
      this.mockIntervalId = null;
      console.log('Resilient mock price ticks deactivated.');
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
