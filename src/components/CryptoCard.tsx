import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';
import { CryptoPrice } from '../store/cryptoStore';

interface CryptoCardProps {
  crypto: CryptoPrice;
  isSelected: boolean;
  onSelect: () => void;
}

export const CryptoCard: React.FC<CryptoCardProps> = ({
  crypto,
  isSelected,
  onSelect,
}) => {
  const { symbol, name, price, change24h, volume24h, high24h, low24h } = crypto;
  
  const [flashClass, setFlashClass] = useState<string>('');
  const prevPriceRef = useRef<number>(price);

  const formattedSymbol = symbol.replace('USDT', '');
  const isPositive = change24h >= 0;

  // Handle flash highlight animation on live price changes
  useEffect(() => {
    if (price === 0) return; // Ignore uninitialized states
    
    const prevPrice = prevPriceRef.current;
    
    if (prevPrice !== 0 && price !== prevPrice) {
      if (price > prevPrice) {
        setFlashClass('bg-accent-green/10 border-accent-green/30 glow-green');
      } else {
        setFlashClass('bg-accent-rose/10 border-accent-rose/30 glow-rose');
      }
      
      const timer = setTimeout(() => {
        setFlashClass('');
      }, 800);

      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
    
    if (prevPrice === 0) {
      prevPriceRef.current = price;
    }
  }, [price]);

  // Handle keyboard activation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
      aria-label={`Select ${name} real-time dashboard. Current price is $${price.toLocaleString()}`}
      className={`glass-panel rounded-2xl p-5 cursor-pointer flex flex-col justify-between transition-all duration-300 border ${
        isSelected
          ? 'border-primary/50 bg-primary/5 shadow-glass-hover glow-cyan scale-[1.01]'
          : 'hover:border-white/10 hover:bg-white/5'
      } ${flashClass}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold font-sans tracking-tight text-white">{name}</h3>
          <span className="text-xs font-mono text-gray-500 font-semibold uppercase">{formattedSymbol} / USD</span>
        </div>
        
        <div className={`p-2 rounded-xl ${isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-rose/10 text-accent-rose'}`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-5 h-5" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="my-5">
        {price === 0 ? (
          <div className="flex items-center gap-2 text-gray-500 font-mono text-xl animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>CONNECTING...</span>
          </div>
        ) : (
          <div 
            className="text-2xl font-extrabold font-mono tracking-tight text-white transition-all"
            aria-live="polite"
          >
            ${price.toLocaleString(undefined, {
              minimumFractionDigits: price < 1 ? 4 : 2,
              maximumFractionDigits: price < 1 ? 4 : 2,
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-gray-500 font-semibold tracking-wider uppercase text-[9px]">24h Change</span>
          <span className={`font-bold font-mono ${isPositive ? 'text-accent-green' : 'text-accent-rose'}`}>
            {price === 0 ? '—' : `${isPositive ? '+' : ''}${change24h.toFixed(2)}%`}
          </span>
        </div>

        <div className="flex flex-col gap-1 items-end">
          <span className="text-gray-500 font-semibold tracking-wider uppercase text-[9px] flex items-center gap-1">
            <BarChart2 className="w-3 h-3" />
            24h Volume
          </span>
          <span className="font-semibold font-mono text-gray-300">
            {price === 0 ? '—' : `$${(volume24h / 1e6).toFixed(2)}M`}
          </span>
        </div>
      </div>

      {price > 0 && (
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-3 pt-2 border-t border-dashed border-white/5">
          <span>Low: ${low24h.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 4 : 2 })}</span>
          <span>High: ${high24h.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 4 : 2 })}</span>
        </div>
      )}
    </div>
  );
};

export default CryptoCard;
