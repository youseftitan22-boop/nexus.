import React, { StrictMode, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any stale service workers in development / preview to prevent stale cache lockups
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

// Global Crash-Proof Error Fallback Renderer
function renderBootError(message: string, stack?: string) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <main style="min-height: 100vh; background-color: #0B1613; color: #F5F1E8; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 540px; width: 100%; background-color: #16241F; border: 1px solid rgba(193, 85, 59, 0.5); border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background-color: rgba(193, 85, 59, 0.2); color: #C1553B; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">!</div>
            <h1 style="font-size: 18px; font-weight: 700; color: #F5F1E8; margin: 0;">Boot failed: ${message}</h1>
          </div>
          <p style="font-size: 13px; color: #7FA894; line-height: 1.6; margin: 0 0 20px 0;">
            The app encountered an exception during boot. Telemetry state has been preserved. You can refresh or reset local cache safely.
          </p>
          ${
            stack
              ? `<pre style="background-color: #0B1613; border: 1px solid rgba(127, 168, 148, 0.2); border-radius: 12px; padding: 12px; font-size: 11px; color: #E8B04B; overflow-x: auto; max-height: 160px; margin-bottom: 20px; font-family: monospace;">${stack}</pre>`
              : ''
          }
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button onclick="window.location.reload()" style="background-color: #E8B04B; color: #0B1613; border: none; font-weight: 700; font-size: 13px; padding: 10px 18px; border-radius: 12px; cursor: pointer;">
              Reload Nexus
            </button>
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" style="background-color: transparent; color: #7FA894; border: 1px solid rgba(127, 168, 148, 0.4); font-size: 13px; padding: 10px 18px; border-radius: 12px; cursor: pointer;">
              Clear Cache & Reset
            </button>
          </div>
        </div>
      </main>
    `;
  }
}

// Global window error listener for unhandled boot crashes
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Ignore benign ResizeObserver loop notifications as per W3C specification
    if (
      event.message &&
      (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.stopImmediatePropagation();
      return;
    }

    const root = document.getElementById('root');
    // Only render boot card if app failed to mount anything
    if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
      renderBootError(event.message || 'Unknown runtime error', event.error?.stack);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const root = document.getElementById('root');
    if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
      renderBootError(event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection');
    }
  });
}

// React Error Boundary Wrapper
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Nexus Root Error Boundary caught error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#0B1613] text-[#F5F1E8] flex items-center justify-center p-6 font-['IBM_Plex_Sans',sans-serif]">
          <div className="max-w-lg w-full bg-[#16241F] border border-[#C1553B]/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C1553B]/20 text-[#C1553B] flex items-center justify-center font-bold text-lg">
                !
              </div>
              <h1 className="text-base font-bold text-[#F5F1E8]">
                Boot failed: {this.state.error?.message || 'Application Error'}
              </h1>
            </div>
            <p className="text-xs text-[#7FA894] leading-relaxed">
              An unhandled rendering exception occurred. Local state was preserved.
            </p>
            {this.state.error?.stack && (
              <pre className="bg-[#0B1613] border border-[#7FA894]/20 rounded-xl p-3 text-[11px] text-[#E8B04B] overflow-x-auto max-h-36 font-['IBM_Plex_Mono',monospace]">
                {this.state.error.stack}
              </pre>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#E8B04B] text-[#0B1613] text-xs font-bold rounded-xl cursor-pointer hover:bg-[#E8B04B]/90 transition-colors"
              >
                Reload Nexus
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 border border-[#7FA894]/40 text-[#7FA894] text-xs rounded-xl cursor-pointer hover:text-[#F5F1E8] transition-colors"
              >
                Clear Local Vault & Restart
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root HTML element (#root) not found in DOM');
  }

  if (typeof window !== 'undefined') {
    (window as any).__nexus_booted = true;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
} catch (err: any) {
  console.error('Fatal boot exception:', err);
  renderBootError(err?.message || 'Failed to initialize React root', err?.stack);
}
