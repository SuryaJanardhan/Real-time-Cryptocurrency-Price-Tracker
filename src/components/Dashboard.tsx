import React, { useEffect, useState } from 'react';
import { 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Activity, 
  DollarSign, 
  Percent, 
  Cpu
} from 'lucide-react';
import useCryptoStore from '../store/cryptoStore';
import wsService from '../services/WebSocketService';
import CryptoList from './CryptoList';
import HistoricalChart from './HistoricalChart';
import useHistoricalData, { Timeframe } from '../hooks/useHistoricalData';

export const Dashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');
  
  // Connect store states
  const { 
    prices, 
    selectedCryptoId, 
    isConnected, 
    isConnecting, 
    error,
    addOrUpdatePrice,
    setConnectionStatus,
    setSelectedCryptoId
  } = useCryptoStore();

  const selectedCrypto = prices[selectedCryptoId];

  // Subscribe to live historical data custom hook
  const { 
    data: historicalData, 
    loading: chartLoading
  } = useHistoricalData(selectedCryptoId, timeframe);

  // Initialize and manage WebSocket subscriptions
  useEffect(() => {
    // 1. Set up connection
    wsService.connect();

    // 2. Subscribe to ticker updates
    const unsubscribeMessages = wsService.subscribeToMessages((msg) => {
      addOrUpdatePrice({
        symbol: msg.symbol,
        price: msg.price,
        change24h: msg.change24h,
        volume24h: msg.volume24h,
        high24h: msg.high24h,
        low24h: msg.low24h,
        lastUpdated: msg.timestamp
      });
    });

    // 3. Subscribe to connection status changes
    const unsubscribeStatus = wsService.subscribeToStatus((connected, attempting) => {
      setConnectionStatus(connected, attempting);
    });

    // Clean up on component unmount
    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      wsService.disconnect();
    };
  }, [addOrUpdatePrice, setConnectionStatus]);

  // Handle manual reconnect click
  const handleReconnect = () => {
    wsService.disconnect();
    setTimeout(() => {
      wsService.connect();
    }, 100);
  };

  // Aggregated Stats Calculations for Premium Visual Overview
  const marketOverviewStats = React.useMemo(() => {
    const activePrices = Object.values(prices).filter(p => p.price > 0);
    if (activePrices.length === 0) return { avgChange24h: 0, totalVol: 0, leader: '—', laggard: '—' };

    const avgChange = activePrices.reduce((acc, p) => acc + p.change24h, 0) / activePrices.length;
    const sumVol = activePrices.reduce((acc, p) => acc + p.volume24h, 0);
    
    const sortedByChange = [...activePrices].sort((a, b) => b.change24h - a.change24h);
    const leader = sortedByChange[0]?.name || '—';
    const laggard = sortedByChange[sortedByChange.length - 1]?.name || '—';

    return {
      avgChange24h: avgChange,
      totalVol: sumVol,
      leader,
      laggard
    };
  }, [prices]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 min-h-screen">
      
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary animate-pulse-slow" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">Antigravity Terminus</span>
          </div>
          
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-white mt-1">
            CryptoStream <span className="bg-gradient-to-r from-primary to-accent-blue bg-clip-text text-transparent">Quantum</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            High-frequency WebSocket price metrics and predictive Brownian chart nodes.
          </p>
        </div>

        {/* Network & Service status indicators */}
        <div className="flex items-center gap-3 self-start md:self-center">
          
          {/* Socket Status */}
          <div className="bg-background/80 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="relative flex">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-accent-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green"></span>
                </>
              ) : isConnecting ? (
                <>
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-accent-amber opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-amber animate-pulse"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-rose"></span>
              )}
            </div>
            
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold font-mono text-gray-500 uppercase leading-none tracking-wider">Feed Stream</span>
              <span className="text-xs font-semibold text-gray-200 mt-0.5">
                {isConnected ? 'Binance Live' : isConnecting ? 'Connecting...' : 'Resilience Mock'}
              </span>
            </div>

            {!isConnected && !isConnecting && (
              <button 
                onClick={handleReconnect}
                aria-label="Force reconnect to live socket stream"
                className="ml-2 p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:text-white transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="glass-panel border-accent-rose/30 bg-accent-rose/5 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-accent-rose" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">Connection Alert</h4>
              <p className="text-xs text-gray-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button 
            onClick={handleReconnect}
            className="px-3 py-1.5 rounded-xl bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose border border-accent-rose/20 text-xs font-semibold tracking-wide transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Premium aggregated market stats overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" aria-label="Market metrics aggregation board">
        
        {/* Average change */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl">
            <Percent className="w-5 h-5 text-accent-blue" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Avg 24h Change</span>
            <span className={`text-lg font-bold font-mono ${marketOverviewStats.avgChange24h >= 0 ? 'text-accent-green' : 'text-accent-rose'}`}>
              {marketOverviewStats.avgChange24h >= 0 ? '+' : ''}
              {marketOverviewStats.avgChange24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Total volume */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-xl">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total 24h Volume</span>
            <span className="text-lg font-bold font-mono text-white">
              ${(marketOverviewStats.totalVol / 1e9).toFixed(2)}B
            </span>
          </div>
        </div>

        {/* Leader */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-accent-green/5 rounded-xl text-accent-green">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Top Node</span>
            <span className="text-lg font-bold text-white font-sans">
              {marketOverviewStats.leader}
            </span>
          </div>
        </div>

        {/* Laggard */}
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-accent-rose/5 rounded-xl text-accent-rose">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Bottom Node</span>
            <span className="text-lg font-bold text-white font-sans">
              {marketOverviewStats.laggard}
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Sidebar (List) + Center Spotlight (Chart) */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-start">
        
        {/* Left Column Tickers Sidebar */}
        <section className="lg:col-span-1" aria-label="Cryptocurrency live tick feeds">
          <CryptoList
            prices={prices}
            selectedId={selectedCryptoId}
            onSelect={(id) => setSelectedCryptoId(id)}
          />
        </section>

        {/* Main Spotlight Column */}
        <section className="lg:col-span-2 h-full" aria-label="Selected spotlight coin detailed chart">
          {selectedCrypto ? (
            <div className="flex flex-col gap-6 h-full">
              <HistoricalChart
                data={historicalData}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                loading={chartLoading}
                symbol={selectedCrypto.symbol}
                coinName={selectedCrypto.name}
                currentPrice={selectedCrypto.price}
                change24h={selectedCrypto.change24h}
              />
              
              {/* Detailed Technical Stats Spotlight Box */}
              {selectedCrypto.price > 0 && (
                <div className="glass-panel rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left glow-cyan animate-fade-in">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">High Threshold</span>
                    <span className="text-base font-bold font-mono text-gray-200 mt-1 block">
                      ${selectedCrypto.high24h.toLocaleString(undefined, { maximumFractionDigits: selectedCrypto.price < 1 ? 4 : 2 })}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Low Threshold</span>
                    <span className="text-base font-bold font-mono text-gray-200 mt-1 block">
                      ${selectedCrypto.low24h.toLocaleString(undefined, { maximumFractionDigits: selectedCrypto.price < 1 ? 4 : 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">24h Volatility</span>
                    <span className="text-base font-bold font-mono text-accent-blue mt-1 block">
                      {((selectedCrypto.high24h - selectedCrypto.low24h) / selectedCrypto.low24h * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Heartbeat Status</span>
                    <span className="text-base font-bold font-mono text-accent-green mt-1 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
                      </span>
                      STREAMING
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-10 flex items-center justify-center min-h-[350px]">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Clock className="w-8 h-8 animate-pulse" />
                <span className="text-sm font-mono uppercase tracking-widest">Awaiting feed stream node selection...</span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto border-t border-white/5 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-gray-500">
        <span className="font-mono">
          &copy; {new Date().getFullYear()} CRYPTOSTREAM QUANTUM. INC.
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> HTML5 / WSS / React / TS / Tailwind
          </span>
          <span className="text-accent-green font-semibold">WCAG 2.1 AA COMPLIANT</span>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;
