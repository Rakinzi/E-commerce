import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  title?: string;
  message?: string;
  statusCode?: number;
  showRetry?: boolean;
  onRetry?: () => void;
  showGoBack?: boolean;
  showGoHome?: boolean;
}

export default function ErrorPage({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  statusCode,
  showRetry = true,
  onRetry,
  showGoBack = true,
  showGoHome = true
}: ErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-lg w-full"
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
              {statusCode && (
                <div className="text-6xl font-black text-black mb-2 tracking-tighter">
                  {statusCode}
                </div>
              )}
            </motion.div>
            
            <CardTitle className="text-2xl font-black text-black mb-2 tracking-tight uppercase">
              {title}
            </CardTitle>
            <p className="text-gray-600 font-light leading-relaxed">
              {message}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col gap-3"
            >
              {showRetry && (
                <Button
                  onClick={handleRetry}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-none transform transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  TRY AGAIN
                </Button>
              )}

              <div className="flex gap-3">
                {showGoBack && (
                  <Button
                    onClick={handleGoBack}
                    variant="outline"
                    className="flex-1 border-black text-black hover:bg-gray-50 py-3 rounded-none"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    GO BACK
                  </Button>
                )}

                {showGoHome && (
                  <Link to="/" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-black text-black hover:bg-gray-50 py-3 rounded-none"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      GO HOME
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}