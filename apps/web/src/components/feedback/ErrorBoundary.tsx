import { Component, type ErrorInfo, type ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button-styles";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    console.error("Astatine interface error:", error, errorInfo.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="The interface encountered an unexpected error"
          description="No data was uploaded. Reload the page to start a clean session, or return to the overview."
          actions={
            <>
              <Button
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reload page
              </Button>
              <a href="/" className={buttonStyles({ variant: "secondary" })}>
                Go to overview
              </a>
            </>
          }
        />
      );
    }

    return this.props.children;
  }
}
