import React, { useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ScriptableContext
} from 'chart.js';
import { format } from 'date-fns';
import { HistoricalDataPoint } from '../services/CryptoApiService';
import { Timeframe } from '../hooks/useHistoricalData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface HistoricalChartProps {
  data: HistoricalDataPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  loading: boolean;
  symbol: string;
  coinName: string;
  currentPrice: number;
  change24h: number;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  timeframe,
  setTimeframe,
  loading,
  symbol,
  coinName,
  currentPrice,
  change24h
}) => {
  const chartRef = useRef<any>(null);

  const formattedSymbol = symbol.replace('USDT', '');
  const isPositive = change24h >= 0;
  
  // Custom theme colors matching our style system
  const themeColor = isPositive ? 'rgba(16, 185, 129, 1)' : 'rgba(244, 63, 94, 1)';
  const themeColorLight = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

  // Format labels and prices for plotting
  const chartData = useMemo(() => {
    const labels = data.map(point => {
      try {
        if (timeframe === '1H') {
          return format(point.timestamp, 'HH:mm:ss');
        } else if (timeframe === '24H') {
          return format(point.timestamp, 'HH:mm');
        } else {
          return format(point.timestamp, 'MMM dd');
        }
      } catch {
        return '';
      }
    });

    const prices = data.map(point => point.price);

    return {
      labels,
      datasets: [
        {
          label: `${formattedSymbol} Price (USD)`,
          data: prices,
          borderColor: themeColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: themeColor,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 1.5,
          fill: true,
          tension: 0.15,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'transparent';
            
            // Create a gorgeous vertical gradient
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, themeColorLight);
            gradient.addColorStop(1, 'rgba(9, 10, 15, 0.02)');
            return gradient;
          },
        },
      ],
    };
  }, [data, timeframe, themeColor, themeColorLight, formattedSymbol]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#121420',
          titleFont: {
            family: 'Outfit',
            size: 13,
            weight: 'bold' as const,
          },
          bodyFont: {
            family: 'Inter',
            size: 12,
          },
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y;
              return ` Price: $${value.toLocaleString(undefined, {
                minimumFractionDigits: value < 1 ? 4 : 2,
                maximumFractionDigits: value < 1 ? 4 : 2,
              })}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.4)',
            font: {
              family: 'Inter',
              size: 10,
            },
            maxTicksLimit: timeframe === '1H' ? 6 : timeframe === '24H' ? 8 : 7,
          },
          border: {
            display: false,
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.4)',
            font: {
              family: 'Inter',
              size: 10,
            },
            callback: (value: any) => {
              return '$' + value.toLocaleString(undefined, {
                maximumFractionDigits: value < 1 ? 3 : 0,
              });
            },
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [timeframe]);

  const timeframeButtons: { value: Timeframe; label: string }[] = [
    { value: '1H', label: '1 Hour' },
    { value: '24H', label: '24 Hours' },
    { value: '7D', label: '7 Days' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full glow-cyan animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Spotlight Chart</span>
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-accent-blue animate-pulse' : 'bg-accent-green'}`} />
          </div>
          
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white flex items-baseline gap-2 mt-1">
            {coinName}
            <span className="text-sm font-mono text-gray-500 font-normal">{formattedSymbol}/USD</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center bg-background/60 p-1 rounded-xl border border-white/5">
          {timeframeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setTimeframe(btn.value)}
              aria-label={`Show ${btn.label} historical chart`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                timeframe === btn.value
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {btn.value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
          ${currentPrice.toLocaleString(undefined, {
            minimumFractionDigits: currentPrice < 1 ? 4 : 2,
            maximumFractionDigits: currentPrice < 1 ? 4 : 2,
          })}
        </span>
        <span
          className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
            isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-rose/10 text-accent-rose'
          }`}
        >
          {isPositive ? '+' : ''}
          {change24h.toFixed(2)}%
        </span>
      </div>

      <div className="relative flex-grow min-h-[220px] h-[300px] w-full">
        {loading && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex items-center justify-center rounded-xl z-10 transition-opacity duration-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">Fetching Historical Data...</span>
            </div>
          </div>
        )}
        
        {data.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-background/25">
            <span className="text-sm text-gray-400 font-mono">No Historical Data Available</span>
          </div>
        ) : (
          <Line ref={chartRef} data={chartData} options={options as any} />
        )}
      </div>
    </div>
  );
};

export default HistoricalChart;
