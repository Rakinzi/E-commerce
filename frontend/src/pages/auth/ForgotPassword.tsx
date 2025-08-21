import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const navigate = useNavigate();
  usePageTitle('Forgot Password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('Password reset code sent!');
        // Navigate to reset password page with email
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to send reset code');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-4"
              >
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              <CardTitle className="text-2xl font-black text-black mb-2 tracking-tight">
                CHECK YOUR EMAIL
              </CardTitle>
              <p className="text-gray-600 font-light">
                We've sent a password reset code to
                <span className="block font-medium text-black mt-1">{email}</span>
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 text-center">
                <p className="mb-2">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-left space-y-1">
                  <li>1. Check your email inbox</li>
                  <li>2. Look for the 6-digit reset code</li>
                  <li>3. Enter the code on the next page</li>
                </ol>
              </div>
              
              <div className="text-center">
                <Button
                  onClick={() => navigate('/reset-password', { state: { email } })}
                  className="bg-black text-white hover:bg-gray-800 rounded-none"
                >
                  I HAVE THE CODE
                </Button>
              </div>
              
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-black transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            
            <CardTitle className="text-2xl font-black text-black mb-2 tracking-tight">
              FORGOT PASSWORD
            </CardTitle>
            <p className="text-gray-600 font-light">
              Enter your email address and we'll send you a code to reset your password.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-black uppercase tracking-wide">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 focus:border-black focus:ring-black rounded-none"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 text-lg font-bold rounded-none transform transition-all duration-300 hover:scale-105"
              >
                {isLoading ? 'SENDING...' : 'SEND RESET CODE'}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Remember your password?
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-black font-medium hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 p-4 rounded text-xs text-gray-600 text-center">
              <p>
                <strong>Security Notice:</strong> Reset codes expire in 15 minutes. 
                If you don't receive an email, check your spam folder.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}