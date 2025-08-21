import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  
  usePageTitle('Verify Email');

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.verifyEmail(email, otp);
      
      toast.success('Email verified successfully!');
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.error || 'Verification failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    
    try {
      await authAPI.resendOTP(email, 'email_verification');
      toast.success('Verification code sent!');
      setTimeLeft(60);
      setCanResend(false);
    } catch (error: any) {
      console.error('Resend error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to resend code. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

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
              VERIFY YOUR EMAIL
            </CardTitle>
            <p className="text-gray-600 font-light">
              We've sent a 6-digit verification code to
              <span className="block font-medium text-black mt-1">{email}</span>
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-black uppercase tracking-wide">
                  Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest border-gray-300 focus:border-black focus:ring-black rounded-none h-12"
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 text-lg font-bold rounded-none transform transition-all duration-300 hover:scale-105"
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY EMAIL'}
              </Button>
            </form>

            {/* Resend Section */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the code?
              </p>
              
              {canResend ? (
                <Button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  variant="outline"
                  className="border-black text-black hover:bg-gray-50 rounded-none"
                >
                  {isResending ? 'SENDING...' : 'RESEND CODE'}
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend available in {timeLeft}s
                </p>
              )}
            </div>

            {/* Back to Register */}
            <div className="text-center pt-2">
              <Link
                to="/register"
                className="inline-flex items-center text-sm text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Registration
              </Link>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 p-4 rounded text-xs text-gray-600 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Secure Verification</span>
              </div>
              <p>This code expires in 15 minutes for your security</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}