import { create } from 'zustand';

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

interface CryptoState {
  prices: Record<string, CryptoPrice>;
  loading: boolean;
  error: string | null;
  selectedCryptoId: string;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Actions
  addOrUpdatePrice: (priceData: Omit<CryptoPrice, 'name'>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (errorMessage: string | null) => void;
  setSelectedCryptoId: (id: string) => void;
  setConnectionStatus: (connected: boolean, connecting: boolean) => void;
}

const coinNames: Record<string, string> = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'SOLUSDT': 'Solana',
  'ADAUSDT': 'Cardano',
  'XRPUSDT': 'Ripple',
};

// Initial stub records to render neat loading placeholders
const initialPrices: Record<string, CryptoPrice> = {
  'BTCUSDT': { symbol: 'BTCUSDT', name: 'Bitcoin', price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0, lastUpdated: 0 },
  'ETHUSDT': { symbol: 'ETHUSDT', name: 'Ethereum', price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0, lastUpdated: 0 },
  'SOLUSDT': { symbol: 'SOLUSDT', name: 'Solana', price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0, lastUpdated: 0 },
  'ADAUSDT': { symbol: 'ADAUSDT', name: 'Cardano', price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0, lastUpdated: 0 },
  'XRPUSDT': { symbol: 'XRPUSDT', name: 'Ripple', price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0, lastUpdated: 0 },
};

export const useCryptoStore = create<CryptoState>((set) => ({
  prices: initialPrices,
  loading: true,
  error: null,
  selectedCryptoId: 'BTCUSDT', // Default selection
  isConnected: false,
  isConnecting: true,

  addOrUpdatePrice: (priceData) =>
    set((state) => {
      const updatedPrice: CryptoPrice = {
        ...priceData,
        name: coinNames[priceData.symbol] || priceData.symbol.replace('USDT', ''),
      };

      // Determine if it was all zeroes initially (first load completed)
      const wasAllZero = Object.values(state.prices).every((p) => p.price === 0);

      // Clean up loading state if we now have active price updates
      const newLoading = wasAllZero ? false : state.loading;

      return {
        prices: {
          ...state.prices,
          [priceData.symbol]: updatedPrice,
        },
        loading: newLoading,
      };
    }),

  setLoading: (isLoading) => set({ loading: isLoading }),
  setError: (errorMessage) => set({ error: errorMessage }),
  setSelectedCryptoId: (id) => set({ selectedCryptoId: id }),
  setConnectionStatus: (connected, connecting) =>
    set((state) => ({
      isConnected: connected,
      isConnecting: connecting,
      // If we are connected, clear top-level connection errors
      error: connected ? null : state.error,
    })),
}));

export default useCryptoStore;
