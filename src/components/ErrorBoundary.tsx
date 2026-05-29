import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-gray-200 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-8 flex flex-col items-center text-center shadow-glass glow-rose border-accent-rose/20 animate-fade-in">
            <div className="p-4 bg-accent-rose/10 text-accent-rose rounded-2xl mb-6">
              <AlertOctagon className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-bold font-sans tracking-tight text-white mb-2">
              System Disturbance
            </h1>
            <p className="text-xs text-gray-400 font-sans mb-6">
              The application engine encountered an unexpected runtime exception. Live feeds have been suspended to prevent stack corruption.
            </p>

            <div className="w-full bg-background/50 border border-white/5 rounded-xl p-4 mb-6 text-left">
              <span className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-widest block mb-1">Error Diagnostic</span>
              <code className="text-xs font-mono text-accent-rose break-words block max-h-24 overflow-y-auto pr-1">
                {this.state.error?.message || 'Unknown Exception'}
              </code>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm tracking-wide transition-all shadow flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Quantum Feed
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
