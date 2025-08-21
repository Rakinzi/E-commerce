import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { usePageTitle, PAGE_TITLES } from '@/hooks/usePageTitle';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.literal('customer').default('customer'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  usePageTitle(PAGE_TITLES.REGISTER);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser(data.name, data.email, data.password, 'customer');
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      form.setError('root', {
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Image Section - 3/5 (60%) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80"
          alt="Join our premium marketplace"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70"></div>
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
              JOIN THE
              <span className="block text-5xl font-extralight tracking-widest text-white/80">
                ELITE
              </span>
            </h1>
            <p className="text-2xl text-white/90 mb-8 font-light leading-relaxed">
              Become part of an exclusive community of discerning buyers and premium vendors.
            </p>
            <div className="w-24 h-1 bg-white"></div>
          </motion.div>
        </div>
      </div>

      {/* Form Section - 2/5 (40%) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="mb-12">
            <h2 className="text-4xl font-black text-black mb-3 tracking-tight">
              CREATE
            </h2>
            <p className="text-gray-600 font-light">
              Your premium account awaits
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">
                Full Name
              </label>
              <Input
                {...form.register('name')}
                type="text"
                className="w-full px-0 py-4 border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-black focus:ring-0 text-lg"
                placeholder="Your name"
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">
                Email Address
              </label>
              <Input
                {...form.register('email')}
                type="email"
                className="w-full px-0 py-4 border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-black focus:ring-0 text-lg"
                placeholder="your@email.com"
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Customer account type is set by default - no selection needed */}

            <div>
              <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Input
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-0 py-4 pr-10 border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-black focus:ring-0 text-lg"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-3 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  {...form.register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-0 py-4 pr-10 border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-black focus:ring-0 text-lg"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {form.formState.errors.root && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3"
              >
                {form.formState.errors.root.message}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full bg-black text-white py-4 text-lg font-bold uppercase tracking-wide hover:bg-gray-800 rounded-none transform transition-all duration-300 hover:scale-105 disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </Button>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-gray-600 font-light">
                Already a member?{' '}
                <Link
                  to="/login"
                  className="font-bold text-black hover:underline uppercase tracking-wide"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}