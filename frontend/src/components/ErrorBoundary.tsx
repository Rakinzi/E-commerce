import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RotateCcw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    // In a real app, you'd send this to your error reporting service
    console.log('Error reported:', this.state.error);
    alert('Error report sent. Thank you for helping us improve!');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl w-full"
          >
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-4"
                >
                  <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                </motion.div>
                
                <CardTitle className="text-3xl font-black text-black mb-2 tracking-tight">
                  SOMETHING WENT WRONG
                </CardTitle>
                <p className="text-gray-600 text-lg font-light">
                  We encountered an unexpected error. Don't worry - we're on it!
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <details className="bg-red-50 border border-red-200 rounded p-4">
                      <summary className="cursor-pointer font-medium text-red-800 mb-2">
                        Error Details (Development Mode)
                      </summary>
                      <div className="text-sm text-red-700 space-y-2">
                        <p><strong>Error:</strong> {this.state.error.message}</p>
                        {this.state.errorInfo && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="whitespace-pre-wrap text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Button
                    onClick={this.handleReload}
                    className="flex-1 bg-black text-white hover:bg-gray-800 py-3 rounded-none transform transition-all duration-300 hover:scale-105"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    RELOAD PAGE
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1 border-black text-black hover:bg-gray-50 py-3 rounded-none transform transition-all duration-300 hover:scale-105"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    GO HOME
                  </Button>
                </motion.div>

                {/* Report Error */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-center pt-4 border-t border-gray-200"
                >
                  <p className="text-sm text-gray-500 mb-3">
                    Help us improve by reporting this error
                  </p>
                  <Button
                    onClick={this.handleReportError}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-black rounded-none"
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    Report Error
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-8 text-center"
            >
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <span className="text-xs uppercase tracking-wide">Error ID: {Date.now()}</span>
                <div className="w-8 h-0.5 bg-gray-300"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;