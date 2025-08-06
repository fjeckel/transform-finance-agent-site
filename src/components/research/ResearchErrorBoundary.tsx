import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Bug, Wifi, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ResearchError, ResearchErrorType } from '@/types/research';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  retryCount: number;
}

class ResearchErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    errorId: '',
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Research component error:', error, errorInfo);
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
    
    // Track error for analytics (in a real app)
    this.trackError(error, errorInfo);
    
    this.setState({ errorInfo });
  }

  private trackError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real implementation, this would send error data to analytics
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('Error tracked:', errorData);
  };

  private classifyError = (error: Error): ResearchErrorType => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('rate limit')) {
      return 'rate_limit';
    }
    if (message.includes('api') || message.includes('400') || message.includes('500')) {
      return 'api_error';
    }
    if (message.includes('credits') || message.includes('insufficient')) {
      return 'insufficient_credits';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'invalid_input';
    }
    
    return 'unknown';
  };

  private getErrorDetails = (errorType: ResearchErrorType) => {
    switch (errorType) {
      case 'network_error':
        return {
          icon: Wifi,
          title: 'Network Connection Issue',
          description: 'Unable to connect to AI services. Please check your internet connection.',
          suggestion: 'Check your network connection and try again.',
          recoverable: true
        };
      case 'timeout':
        return {
          icon: Clock,
          title: 'Request Timeout',
          description: 'The AI processing took too long and timed out.',
          suggestion: 'Try reducing your topic complexity or retry with a shorter prompt.',
          recoverable: true
        };
      case 'rate_limit':
        return {
          icon: AlertTriangle,
          title: 'Rate Limit Exceeded',
          description: 'Too many requests have been made. Please wait before trying again.',
          suggestion: 'Wait a few minutes before starting a new research session.',
          recoverable: true
        };
      case 'api_error':
        return {
          icon: Bug,
          title: 'API Service Error',
          description: 'There was an issue with the AI service API.',
          suggestion: 'This is usually temporary. Please try again in a moment.',
          recoverable: true
        };
      case 'insufficient_credits':
        return {
          icon: AlertTriangle,
          title: 'Insufficient Credits',
          description: 'Not enough credits available for this research request.',
          suggestion: 'Please add more credits to your account or reduce the scope.',
          recoverable: false
        };
      case 'invalid_input':
        return {
          icon: AlertTriangle,
          title: 'Invalid Input',
          description: 'The research topic or configuration is invalid.',
          suggestion: 'Please go back and check your research topic and settings.',
          recoverable: true
        };
      default:
        return {
          icon: Bug,
          title: 'Unexpected Error',
          description: 'An unexpected error occurred during the research process.',
          suggestion: 'Please try again or contact support if the issue persists.',
          recoverable: true
        };
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= 3) {
      return; // Max retries reached
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));

    this.props.onRetry?.();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
      retryCount: 0
    });

    this.props.onReset?.();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleReportError = () => {
    const subject = encodeURIComponent(`Research Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(
      `Error ID: ${this.state.errorId}\n` +
      `Error: ${this.state.error?.message}\n` +
      `Stack: ${this.state.error?.stack}\n` +
      `Component Stack: ${this.state.errorInfo?.componentStack}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `User Agent: ${navigator.userAgent}\n` +
      `URL: ${window.location.href}`
    );
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  private renderErrorDetails = () => {
    if (!this.state.error) return null;

    const errorType = this.classifyError(this.state.error);
    const errorDetails = this.getErrorDetails(errorType);
    const ErrorIcon = errorDetails.icon;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ErrorIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {errorDetails.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {errorDetails.description}
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">What can you do?</p>
              <p className="text-sm">{errorDetails.suggestion}</p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Error Information</h4>
            <Badge variant="outline" className="text-xs">
              ID: {this.state.errorId}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{errorType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Retry Attempts:</span>
              <span className="font-medium">{this.state.retryCount}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recoverable:</span>
              <span className="font-medium">
                {errorDetails.recoverable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="bg-gray-100 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-sm mb-2">
              Technical Details (Development Mode)
            </summary>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Error Message:</strong>
                <pre className="mt-1 text-red-600 bg-white p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </div>
              {this.state.error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-red-600 bg-white p-2 rounded overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
              {this.state.errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 text-red-600 bg-white p-2 rounded overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    );
  };

  private renderActions = () => {
    if (!this.state.error) return null;

    const errorType = this.classifyError(this.state.error);
    const errorDetails = this.getErrorDetails(errorType);
    const canRetry = errorDetails.recoverable && this.state.retryCount < 3;

    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {canRetry && (
          <Button
            onClick={this.handleRetry}
            className="flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry ({3 - this.state.retryCount} attempts left)
          </Button>
        )}
        
        <Button
          onClick={this.handleReset}
          variant="outline"
          className="flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>
        
        <Button
          onClick={this.handleGoBack}
          variant="ghost"
          className="flex items-center justify-center"
        >
          Go Back
        </Button>
        
        <Button
          onClick={this.handleReportError}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          Report Error
        </Button>
      </div>
    );
  };

  public render() {
    if (this.state.hasError) {
      // Check if a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render the default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">AI Research Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {this.renderErrorDetails()}
              {this.renderActions()}
              
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-gray-500">
                  If this error persists, please contact our support team with error ID: {this.state.errorId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
}

// Hook for functional components to handle research errors
export const useResearchErrorHandler = () => {
  const handleError = React.useCallback((error: ResearchError) => {
    console.error('Research error:', error);
    
    // In a real implementation, this would:
    // 1. Track the error in analytics
    // 2. Show appropriate user feedback
    // 3. Attempt automatic recovery if possible
    // 4. Update the application state
    
  }, []);

  return { handleError };
};

// Error boundary wrapper component for specific research components
export const withResearchErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ResearchErrorBoundary 
      fallback={options?.fallback}
      onError={options?.onError}
    >
      <Component {...props} ref={ref} />
    </ResearchErrorBoundary>
  ));

  WrappedComponent.displayName = `withResearchErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ResearchErrorBoundary;