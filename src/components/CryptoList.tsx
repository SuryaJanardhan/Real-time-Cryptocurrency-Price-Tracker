import React, { useState, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import CryptoCard from './CryptoCard';
import { CryptoPrice } from '../store/cryptoStore';

interface CryptoListProps {
  prices: Record<string, CryptoPrice>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export const CryptoList: React.FC<CryptoListProps> = ({
  prices,
  selectedId,
  onSelect,
}) => {
  const [search, setSearch] = useState<string>('');

  const cryptoArray = useMemo(() => Object.values(prices), [prices]);

  // Filtered array based on symbol or full name
  const filteredCryptos = useMemo(() => {
    return cryptoArray.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(search.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [cryptoArray, search]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-blue" />
            Live Market Feed
          </h2>
          <span className="text-xs font-mono text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
            5 Active Streams
          </span>
        </div>
        
        {/* Sleek Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search crypto or index..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-background/50 font-sans text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            aria-label="Search cryptocurrency assets"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {filteredCryptos.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-sm text-gray-500 font-mono">No matching streams found</p>
          </div>
        ) : (
          filteredCryptos.map((crypto) => (
            <CryptoCard
              key={crypto.symbol}
              crypto={crypto}
              isSelected={crypto.symbol === selectedId}
              onSelect={() => onSelect(crypto.symbol)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CryptoList;
