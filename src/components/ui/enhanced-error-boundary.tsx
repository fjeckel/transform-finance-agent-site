import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryState>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

export class EnhancedErrorBoundary extends React.Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...this.state} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Etwas ist schief gelaufen</CardTitle>
              <CardDescription>
                Es tut uns leid, aber es ist ein unerwarteter Fehler aufgetreten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.props.showDetails && this.state.error && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Erneut versuchen
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Zur Startseite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Section-specific error boundary for smaller components
export const SectionErrorBoundary: React.FC<{
  children: React.ReactNode;
  sectionName?: string;
}> = ({ children, sectionName = 'Abschnitt' }) => {
  return (
    <EnhancedErrorBoundary
      fallback={({ error }) => (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h3 className="mb-2 font-semibold text-destructive">
            Fehler beim Laden von {sectionName}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Dieser Bereich konnte nicht geladen werden. Bitte versuchen Sie es später erneut.
          </p>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Seite neu laden
          </Button>
        </div>
      )}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};