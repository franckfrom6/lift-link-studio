import React from "react";
import i18next from "i18next";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const t = i18next.t.bind(i18next);
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">
              {t("common:error_occurred")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message || t("common:error")}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              {t("common:back")}
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
