import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 text-3xl mb-4 shadow-lg shadow-rose-500/10 animate-pulse">
            ⚠️
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-xs text-gray-400 max-w-md mb-4 font-mono bg-black/60 p-3 rounded-xl border border-[#333] break-all">
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow active:scale-95 transition-all"
            >
              Reload Application
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="bg-[#222] hover:bg-[#333] text-gray-300 px-4 py-2.5 rounded-xl font-semibold text-xs cursor-pointer border border-[#444]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
