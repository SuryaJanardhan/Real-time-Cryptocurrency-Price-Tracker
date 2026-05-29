import { describe, it, expect, beforeEach } from 'vitest';
import useCryptoStore from '../store/cryptoStore';

describe('useCryptoStore Zustand Store', () => {
  beforeEach(() => {
    // Reset state before each test if needed
    const store = useCryptoStore.getState();
    store.setSelectedCryptoId('BTCUSDT');
    store.setLoading(true);
    store.setError(null);
    store.setConnectionStatus(false, true);
  });

  it('should initialize with correct default state', () => {
    const state = useCryptoStore.getState();
    expect(state.selectedCryptoId).toBe('BTCUSDT');
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isConnecting).toBe(true);
    expect(state.prices['BTCUSDT']).toBeDefined();
    expect(state.prices['BTCUSDT'].price).toBe(0);
  });

  it('should allow setting the selected crypto asset ID', () => {
    const store = useCryptoStore.getState();
    store.setSelectedCryptoId('ETHUSDT');
    expect(useCryptoStore.getState().selectedCryptoId).toBe('ETHUSDT');
  });

  it('should update connection status correctly', () => {
    const store = useCryptoStore.getState();
    store.setConnectionStatus(true, false);
    
    const state = useCryptoStore.getState();
    expect(state.isConnected).toBe(true);
    expect(state.isConnecting).toBe(false);
  });

  it('should add or update price metrics and toggle loading correctly', () => {
    const store = useCryptoStore.getState();
    
    // Add a real tick
    store.addOrUpdatePrice({
      symbol: 'BTCUSDT',
      price: 68500.5,
      change24h: 3.5,
      volume24h: 1500000,
      high24h: 69000,
      low24h: 67500,
      lastUpdated: 1700000000,
    });

    const state = useCryptoStore.getState();
    expect(state.prices['BTCUSDT'].price).toBe(68500.5);
    expect(state.prices['BTCUSDT'].name).toBe('Bitcoin');
    expect(state.prices['BTCUSDT'].change24h).toBe(3.5);
    expect(state.loading).toBe(false); // Loading toggled off upon receiving price ticks
  });
});
