/**
 * ErrorBoundary — Catches unhandled React errors and shows a fallback UI.
 * Prevents white screen of death in production.
 * Does NOT expose stack traces or internal details to the user.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging (no PII exposed)
    console.error('[ErrorBoundary] Uncaught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-medium text-ink mb-2">Terjadi Kesalahan</h1>
            <p className="text-sm text-ink-mute mb-6">
              Aplikasi mengalami masalah yang tidak terduga. Silakan muat ulang halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-ink text-sm font-medium rounded-sm hover:bg-primary-deep transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
