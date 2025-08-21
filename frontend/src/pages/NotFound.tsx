import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, Package } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Page Not Found');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-[180px] md:text-[240px] font-black text-black leading-none tracking-tighter">
              404
            </h1>
            <div className="w-32 h-1 bg-black mx-auto"></div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              PAGE NOT FOUND
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed font-light">
              The page you're looking for doesn't exist or has been moved.
              <span className="block mt-2">
                Let's get you back on track.
              </span>
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link to="/">
              <Button className="bg-black text-white hover:bg-gray-800 px-8 py-4 text-lg font-bold rounded-none transform transition-all duration-300 hover:scale-105">
                <Home className="mr-2 h-5 w-5" />
                GO HOME
              </Button>
            </Link>
            
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-black text-black hover:bg-gray-50 px-8 py-4 text-lg font-bold rounded-none transform transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              GO BACK
            </Button>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <p className="text-sm text-gray-500 mb-6 uppercase tracking-wide font-medium">
              Or try these popular sections:
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <Link 
                to="/products" 
                className="group flex items-center text-gray-600 hover:text-black transition-colors"
              >
                <Package className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Products</span>
              </Link>
              
              <Link 
                to="/categories" 
                className="group flex items-center text-gray-600 hover:text-black transition-colors"
              >
                <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Categories</span>
              </Link>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-16 relative"
          >
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-black opacity-30 transform rotate-45"></div>
            <div className="absolute top-8 right-1/3 w-3 h-3 bg-gray-400 opacity-20"></div>
            <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-black opacity-40"></div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}