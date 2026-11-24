import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[Sanctuary ErrorBoundary] Captured unhandled exception:", error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div className="surface w-full p-8 sm:p-10">
          <div className="flex items-center justify-center gap-2.5">
            <span
              aria-hidden="true"
              className="signal-dot h-2 w-2 rounded-full bg-ember"
            />
            <p className="label tracking-[0.24em] text-ember">
              SYSTEM EXCEPTION / 00
            </p>
          </div>

          <h2 className="mt-5 font-display text-2xl font-light text-ink sm:text-3xl">
            A disruption occurred in the sanctuary.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-strong">
            The interface encountered an unexpected state. Your notes, letters, and memories remain secure.
          </p>

          {this.state.error && (
            <div className="mt-6 overflow-x-auto border border-line/80 bg-mist/60 p-4 text-left font-mono text-[11px] text-navy/80">
              <p className="font-semibold text-ember">{this.state.error.name}:</p>
              <p className="mt-1 break-words">{this.state.error.message}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-quiet inline-flex min-h-11 items-center gap-2 border border-line px-5 py-2 text-[10px] uppercase tracking-[0.18em]"
            >
              <RotateCcw size={12} strokeWidth={1.5} aria-hidden="true" />
              Attempt Recovery
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="press inline-flex min-h-11 items-center gap-2 border border-navy/70 bg-navy px-5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist hover:border-navy hover:bg-navy/90"
            >
              Reload Interface
            </button>
          </div>
        </div>
      </div>
    );
  }
}
