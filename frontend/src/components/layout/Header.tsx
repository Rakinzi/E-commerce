import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import MegaMenu from '@/components/ui/mega-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Package, 
  Settings,
  Menu,
  X,
  Heart,
  Phone,
  Mail,
  Globe,
  MapPin
} from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const { cartItemsCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const navItems = [
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
  ];

  const megaMenuCategories = [
    {
      name: 'Paint & Decoration',
      href: '#',
      description: 'Transform your space with our premium paint and decoration products',
      subcategories: [
        {
          name: 'Interior Paint',
          href: '#',
          description: 'Premium interior paints from leading brands like Dulux, Plascon, and Astra'
        },
        {
          name: 'Exterior Paint',
          href: '#',
          description: 'Weather-resistant exterior paints for long-lasting protection'
        },
        {
          name: 'Paint Accessories',
          href: '#',
          description: 'Brushes, rollers, thinners, and all painting essentials'
        },
        {
          name: 'Ceiling Paints',
          href: '#',
          description: 'Specialized paints for ceiling applications'
        },
        {
          name: 'Gloss Paints',
          href: '#',
          description: 'High-gloss finishes for doors, windows, and trim'
        },
        {
          name: 'Primers & Undercoats',
          href: '#',
          description: 'Essential base coats for professional results'
        }
      ]
    },
    {
      name: 'Building Materials',
      href: '#',
      description: 'Complete range of construction and building supplies',
      subcategories: [
        {
          name: 'Cement',
          href: '#',
          description: 'Quality cement from Lafarge and PPC for all construction needs'
        },
        {
          name: 'Reinforcements',
          href: '#',
          description: 'Steel reinforcement bars, mesh wire, and structural support'
        },
        {
          name: 'Doors',
          href: '#',
          description: 'Interior, exterior, garage, and security doors'
        },
        {
          name: 'Roofing & Ceiling',
          href: '#',
          description: 'Roofing sheets, ceiling materials, and accessories'
        },
        {
          name: 'Timber',
          href: '#',
          description: 'Quality timber for construction and carpentry'
        },
        {
          name: 'Insulation',
          href: '#',
          description: 'Thermal and acoustic insulation materials'
        }
      ]
    },
    {
      name: 'Tools & Equipment',
      href: '#',
      description: 'Professional tools and equipment for every trade',
      subcategories: [
        {
          name: 'Power Tools',
          href: '#',
          description: 'Electric and battery-powered tools for professional use'
        },
        {
          name: 'Hand Tools',
          href: '#',
          description: 'Essential hand tools for construction and repair'
        },
        {
          name: 'Measuring Tools',
          href: '#',
          description: 'Precision measuring and marking instruments'
        },
        {
          name: 'Safety Equipment',
          href: '#',
          description: 'Personal protective equipment and safety gear'
        },
        {
          name: 'Garden Tools',
          href: '#',
          description: 'Tools for landscaping and garden maintenance'
        },
        {
          name: 'Tool Storage',
          href: '#',
          description: 'Toolboxes, cabinets, and organization solutions'
        }
      ]
    }
  ];

  const userMenuItems = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Orders', href: '/orders', icon: Package },
    ...(user && hasRole('admin') ? [{ name: 'Admin', href: '/admin', icon: Settings }] : []),
    ...(user && hasAnyRole(['admin', 'vendor']) ? [{ name: 'Dashboard', href: '/vendor', icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top Navigation Bar */}
      <div className="bg-gray-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+263 78 668 0563</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>sales@rakinzi.co.zw</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'ZWG')}
                  className="bg-transparent text-white border-none text-sm focus:outline-none"
                >
                  <option value="USD" className="text-black">USD ($)</option>
                  <option value="ZWG" className="text-black">ZWG (ZW$)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span>English</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <select className="bg-transparent text-white border-none text-sm focus:outline-none">
                  <option value="harare">Harare</option>
                  <option value="mutare">Mutare</option>
                  <option value="bulawayo">Bulawayo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <span className="font-bold text-xl text-black">Commerce</span>
            </Link>

            {/* Desktop Navigation with Mega Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <MegaMenu categories={megaMenuCategories} />
              <Link
                to="/products"
                className="text-gray-900 hover:text-gray-600 font-medium transition-colors"
              >
                All Products
              </Link>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Wishlist Icon */}
                  <Link
                    to="/wishlist"
                    className="relative p-2 text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  
                  {/* Cart Icon */}
                  <Link
                    to="/cart"
                    className="relative p-2 text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200"
                      >
                        <div className="py-1">
                          {userMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Icon className="mr-3 h-4 w-4" />
                                {item.name}
                              </Link>
                            );
                          })}
                          <hr className="my-1" />
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button 
                      variant="outline" 
                      className="border-black text-black hover:bg-gray-50"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-black text-white hover:bg-gray-800">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-900 hover:text-gray-600 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden border-t border-gray-200"
              >
                <div className="py-4 space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-gray-900 hover:text-gray-600 font-medium transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}