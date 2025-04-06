import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryImpl extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });
    
    // Log error to console
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Card className="w-full max-w-md mx-auto mt-8 border-red-300">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-red-600 dark:text-red-400">Application Error</CardTitle>
            <CardDescription>
              An unexpected error has occurred
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || this.state.error?.toString() || 'Unknown error'}
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[300px]">
              {this.state.errorInfo && (
                <details open>
                  <summary className="cursor-pointer font-medium mb-2">Component Stack</summary>
                  <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 justify-between">
            <div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('Full error details:', { 
                    error: this.state.error, 
                    info: this.state.errorInfo 
                  });
                }}
              >
                Log to Console
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button onClick={this.handleReload}>
                Reload App
              </Button>
            </div>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for ErrorBoundary
function ErrorBoundary(props: ErrorBoundaryProps) {
  // This key change forces remounting of the error boundary when needed
  const [key, setKey] = useState(0);
  
  // Reset the error boundary when the children prop changes
  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [props.children]);
  
  return <ErrorBoundaryImpl key={key} {...props} />;
}

// HOC to wrap components with ErrorBoundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
};

export default ErrorBoundary;