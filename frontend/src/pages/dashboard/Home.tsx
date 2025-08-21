import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingCart, Users, Heart, Star, TrendingUp, Clock, Shield, Truck, Quote } from 'lucide-react';
import { usePageTitle, PAGE_TITLES } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import Carousel from '@/components/ui/carousel';
import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { productsAPI, type Product } from '@/lib/api';
import { getFirstImageUrl, hasValidImages } from '@/utils/imageUtils';
import ImageLoader from '@/components/ui/ImageLoader';
import { toast } from 'sonner';

export default function Home() {
  const { user, getRoleNames } = useAuth();
  const userRoles = user ? getRoleNames() : [];
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  usePageTitle(user ? PAGE_TITLES.HOME : 'Welcome to E-Commerce');
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 12, minutes: 30, seconds: 45 });

  // Fetch real products from API
  const { data: featuredProductsData } = useQuery(
    'featured-products',
    () => productsAPI.getProducts({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }),
    {
      select: (response) => response.data.products,
    }
  );

  const { data: popularProductsData } = useQuery(
    'popular-products',
    () => productsAPI.getProducts({ limit: 4, sortBy: 'price', sortOrder: 'desc' }),
    {
      select: (response) => response.data.products,
    }
  );

  const { data: specialOffersData } = useQuery(
    'special-offers',
    () => productsAPI.getProducts({ limit: 3, sortBy: 'price', sortOrder: 'asc' }),
    {
      select: (response) => response.data.products,
    }
  );

  // Countdown timer for special offers
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (product: any) => {
    try {
      // Handle both real product data (with _id) and mock data (with id)
      const productId = product._id || product.id;
      
      // Don't try to add mock products to cart if they don't have a real _id
      if (!product._id && product.id) {
        toast.error('This is a demo product. Please view real products to add to cart.', {
          duration: 4000,
          position: 'bottom-right'
        });
        return;
      }
      
      if (!productId) {
        toast.error('Product ID not found. Please try again.', {
          duration: 3000,
          position: 'bottom-right'
        });
        return;
      }
      
      await addToCart(productId, 1);
      
      toast.success(`Added "${product.name}" to cart!`, {
        duration: 3000,
        position: 'bottom-right'
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart. Please try again.', {
        duration: 3000,
        position: 'bottom-right'
      });
    }
  };

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      role: 'Business Owner',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612c777?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      content: 'Exceptional quality and service! The parts I ordered arrived quickly and were exactly what I needed for my project.',
      rating: 5
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      content: 'Great selection of hardware components. The technical specifications are detailed and accurate.',
      rating: 5
    },
    {
      id: 3,
      name: 'Emma Thompson',
      role: 'Contractor',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
      content: 'Reliable supplier with competitive prices. Their customer support team is knowledgeable and helpful.',
      rating: 5
    }
  ];

  const popularItems = [
    {
      id: 1,
      name: 'Premium Paint Set',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop&auto=format&q=80',
      price: 45.99,
      originalPrice: 59.99,
      discount: 23
    },
    {
      id: 2,
      name: 'Steel Brackets Kit',
      image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=300&fit=crop&auto=format&q=80',
      price: 29.99,
      originalPrice: 39.99,
      discount: 25
    },
    {
      id: 3,
      name: 'Professional Tools Set',
      image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop&auto=format&q=80',
      price: 89.99,
      originalPrice: 119.99,
      discount: 25
    },
    {
      id: 4,
      name: 'Roofing Materials',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop&auto=format&q=80',
      price: 199.99,
      originalPrice: 249.99,
      discount: 20
    }
  ];

  const quickActions = user ? [
    {
      icon: ShoppingCart,
      title: 'Your Cart',
      description: 'Review items and checkout when ready',
      link: '/cart'
    },
    {
      icon: Package,
      title: 'Your Orders',
      description: 'Track your purchases and order history',
      link: '/orders'
    },
    {
      icon: Heart,
      title: 'Recommendations',
      description: 'Discover products tailored for you',
      link: '/products'
    },
  ] : [
    {
      icon: Package,
      title: 'Quality Products',
      description: 'Curated selection of premium items from trusted vendors',
      link: '/products'
    },
    {
      icon: ShoppingCart,
      title: 'Simple Shopping',
      description: 'Streamlined checkout process with secure payment options',
      link: '/register'
    },
    {
      icon: Users,
      title: 'Trusted Community',
      description: 'Join thousands of satisfied customers and verified sellers',
      link: '/register'
    },
  ];

  const features = user ? [
    {
      icon: Star,
      title: 'Personalized Experience',
      description: 'Get recommendations based on your preferences and purchase history',
    },
    {
      icon: TrendingUp,
      title: 'Trending Now',
      description: 'Discover what other customers are loving this week',
    },
    userRoles.includes('vendor') ? {
      icon: Package,
      title: 'Your Store Analytics',
      description: 'Track your sales performance and customer engagement',
    } : {
      icon: ShoppingCart,
      title: 'Quick Reorder',
      description: 'Easily reorder your favorite products with one click',
    }
  ] : [
    {
      icon: Star,
      title: 'Premium Quality',
      description: 'Every product is carefully vetted for quality and authenticity',
    },
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: 'Your data and transactions are protected with industry-leading security',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping options to get your items fast',
    },
  ];

  const getCarouselItems = () => {
    if (user) {
      const baseItems = [
        {
          id: '1',
          image: '/images/welcome_back/pexels-rdne-7563568.jpg',
          title: `WELCOME BACK,`,
          subtitle: user?.name?.toUpperCase() || 'VALUED CUSTOMER',
          description: 'Continue exploring our curated collection of premium products.',
          cta: {
            text: 'CONTINUE SHOPPING',
            link: '/products'
          }
        }
      ];

      if (userRoles.includes('vendor')) {
        baseItems.push({
          id: '2',
          image: '/images/manage_your_store/pexels-alexander-isreb-880417-1797428.jpg',
          title: 'MANAGE YOUR',
          subtitle: 'STORE',
          description: 'Add new products, track orders, and grow your business.',
          cta: {
            text: 'VENDOR DASHBOARD',
            link: '/vendor'
          }
        });
      }

      if (userRoles.includes('admin')) {
        baseItems.push({
          id: '3',
          image: '/images/wallet/pexels-goumbik-915915.jpg',
          title: 'PLATFORM',
          subtitle: 'MANAGEMENT',
          description: 'Monitor users, manage content, and oversee operations.',
          cta: {
            text: 'ADMIN DASHBOARD',
            link: '/admin'
          }
        });
      }

      baseItems.push({
        id: '4',
        image: '/images/discover/pexels-lilartsy-1194775.jpg',
        title: 'DISCOVER',
        subtitle: 'NEW ARRIVALS',
        description: 'Explore the latest products from our trusted vendors.',
        cta: {
          text: 'VIEW NEW ITEMS',
          link: '/products?sort=newest'
        }
      });

      return baseItems;
    } else {
      return [
        {
          id: '1',
          image: '/images/welcome_back/pexels-rdne-7563568.jpg',
          title: 'WELCOME TO',
          subtitle: 'PREMIUM MARKETPLACE',
          description: 'Discover curated excellence. Experience uncompromising quality.',
          cta: {
            text: 'START SHOPPING',
            link: '/products'
          }
        },
        {
          id: '2',
          image: '/images/manage_your_store/pexels-alexander-isreb-880417-1797428.jpg',
          title: 'JOIN AS A',
          subtitle: 'CUSTOMER',
          description: 'Connect with quality products worldwide. Start your journey with us.',
          cta: {
            text: 'SIGN UP TODAY',
            link: '/register'
          }
        },
        {
          id: '3',
          image: '/images/wallet/pexels-goumbik-915915.jpg',
          title: 'SECURE &',
          subtitle: 'TRUSTED',
          description: 'Shop with confidence on our secure platform.',
          cta: {
            text: 'LEARN MORE',
            link: '/categories'
          }
        }
      ];
    }
  };

  const carouselItems = getCarouselItems();

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <section className="relative">
        <Carousel 
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={6000}
          className="h-screen"
        />
      </section>

      {/* Special Offers Hero Section */}
      <section className="relative h-screen bg-gradient-to-r from-red-600 to-red-700 text-white overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-8 text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tight leading-none">
              SPECIAL
              <span className="block text-5xl md:text-7xl font-extralight">OFFERS</span>
            </h2>
            <p className="text-2xl md:text-3xl mb-12 max-w-4xl mx-auto font-light">
              Unbeatable deals on premium products. Limited time only!
            </p>

            {/* Countdown Timer */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-12 mb-12 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-8">Offer ends in:</h3>
              <div className="grid grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-black mb-2">{timeLeft.days}</div>
                  <div className="text-lg uppercase tracking-widest">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-black mb-2">{timeLeft.hours}</div>
                  <div className="text-lg uppercase tracking-widest">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-black mb-2">{timeLeft.minutes}</div>
                  <div className="text-lg uppercase tracking-widest">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-black mb-2">{timeLeft.seconds}</div>
                  <div className="text-lg uppercase tracking-widest">Seconds</div>
                </div>
              </div>
            </div>

            <Link to="/products" className="inline-block">
              <Button className="bg-white text-red-600 hover:bg-gray-100 px-16 py-6 text-2xl font-bold rounded-none transform transition-all duration-500 hover:scale-110 hover:shadow-2xl">
                <Clock className="mr-3 h-8 w-8" />
                SHOP OFFERS NOW
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Special Offer Products Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              LIMITED TIME DEALS
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Grab these amazing offers before they're gone forever
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {(specialOffersData && specialOffersData.length > 0 ? specialOffersData.map((product, index) => {
              const originalPrice = product.price * 1.5; // Simulate discount
              const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
              const badges = ['FLASH SALE', 'LIMITED TIME', 'BEST SELLER'];
              return {
                ...product,
                originalPrice,
                discount,
                badge: badges[index] || 'SPECIAL OFFER'
              };
            }) : [
              {
                id: 1,
                name: 'Professional Paint Roller Set',
                image: '/images/paint/pexels-mccutcheon-1212407.jpg',
                price: 24.99,
                originalPrice: 49.99,
                discount: 50,
                badge: 'FLASH SALE'
              },
              {
                id: 2,
                name: 'Premium Drill Bit Collection',
                image: '/images/building_materials/pexels-tima-miroshnichenko-6474201.jpg',
                price: 39.99,
                originalPrice: 79.99,
                discount: 50,
                badge: 'LIMITED TIME'
              },
              {
                id: 3,
                name: 'Heavy Duty Tool Box',
                image: '/images/building_materials/pexels-mikael-blomkvist-8961555.jpg',
                price: 89.99,
                originalPrice: 149.99,
                discount: 40,
                badge: 'BEST SELLER'
              }
            ]).slice(0, 3).map((item, index) => (
              <motion.div
                key={item._id || item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white border-2 border-red-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group relative"
              >
                {/* Special Badge */}
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-sm font-bold rounded-full z-10">
                  {item.badge}
                </div>
                
                <div className="relative overflow-hidden">
                  <ImageLoader
                    src={hasValidImages(item) ? getFirstImageUrl(item.images) : ''}
                    alt={item.name}
                    className="w-full h-64 group-hover:scale-110 transition-transform duration-500"
                    fallbackIcon={<Package className="h-12 w-12 text-gray-400" />}
                    fallbackText="No Image"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 text-lg font-bold rounded-lg">
                    -{item.discount}%
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black mb-4 group-hover:text-gray-700 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-red-600">{formatPrice(item.price)}</span>
                      <span className="text-lg text-gray-500 line-through">{formatPrice(item.originalPrice)}</span>
                    </div>
                    <div className="text-green-600 font-bold">
                      Save {formatPrice(item.originalPrice - item.price)}
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-red-600 text-white hover:bg-red-700 py-3 text-lg font-bold transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View All Offers Button */}
          <div className="text-center mt-12">
            <Link to="/products?filter=special-offers">
              <Button className="bg-red-600 text-white hover:bg-red-700 px-12 py-4 text-xl font-bold rounded-none transform transition-all duration-300 hover:scale-105">
                VIEW ALL SPECIAL OFFERS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              FEATURED CATEGORIES
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our most popular product categories
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Paint & Decoration',
                description: 'Transform your space with premium paints and decoration supplies',
                image: '/images/paint/pexels-greta-hoffman-7859275.jpg',
                href: '/categories',
                itemCount: '500+ items'
              },
              {
                name: 'Building Materials',
                description: 'Quality construction materials for all your building needs',
                image: '/images/building_materials/pexels-mikael-blomkvist-8961555.jpg',
                href: '/categories',
                itemCount: '750+ items'
              },
              {
                name: 'Tools & Equipment',
                description: 'Professional tools and equipment for every trade',
                image: '/images/building_materials/pexels-tima-miroshnichenko-6474201.jpg',
                href: '/categories',
                itemCount: '300+ items'
              }
            ].map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link to={category.href} className="block">
                  <div className="bg-white border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <div className="relative overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="text-sm font-medium">{category.itemCount}</div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-gray-700 transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="relative py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              FEATURED PRODUCTS
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handpicked premium products from our extensive catalog
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {(featuredProductsData && featuredProductsData.length > 0 ? featuredProductsData : [
              {
                id: 1,
                name: 'Professional Paint Brush Set',
                image: '/images/paint/pexels-paduret-1193743.jpg',
                price: 34.99,
                rating: 4.8,
                badge: 'BESTSELLER'
              },
              {
                id: 2,
                name: 'Heavy Duty Hammer',
                image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop&auto=format&q=80',
                price: 28.99,
                rating: 4.9,
                badge: 'TOP RATED'
              },
              {
                id: 3,
                name: 'Premium Interior Paint',
                image: '/images/paint/pexels-oandremoura-3978855.jpg',
                price: 89.99,
                rating: 4.7,
                badge: 'PREMIUM'
              },
              {
                id: 4,
                name: 'Construction Safety Helmet',
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80',
                price: 42.99,
                rating: 4.6,
                badge: 'SAFETY FIRST'
              }
            ]).slice(0, 4).map((product, index) => (
              <motion.div
                key={product._id || product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <ImageLoader
                    src={hasValidImages(product) ? getFirstImageUrl(product.images) : ''}
                    alt={product.name}
                    className="w-full h-48 group-hover:scale-110 transition-transform duration-500"
                    fallbackIcon={<Package className="h-12 w-12 text-gray-400" />}
                    fallbackText="No Image"
                  />
                  <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 text-xs font-bold rounded">
                    {product.badge || 'FEATURED'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-black mb-2 group-hover:text-gray-700 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(product.rating?.average || product.rating || 4.5) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">({product.rating?.average?.toFixed(1) || product.rating || '4.5'})</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-black">{formatPrice(product.price)}</span>
                  </div>
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button className="bg-black text-white hover:bg-gray-800 px-12 py-4 text-xl font-bold rounded-none transform transition-all duration-300 hover:scale-105">
                VIEW ALL PRODUCTS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Most Popular Items Section */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              MOST POPULAR ITEMS
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our best-selling products loved by customers worldwide
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {(popularProductsData && popularProductsData.length > 0 ? popularProductsData : popularItems).slice(0, 4).map((item, index) => (
              <motion.div
                key={item._id || item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="relative overflow-hidden">
                  <ImageLoader
                    src={hasValidImages(item) ? getFirstImageUrl(item.images) : ''}
                    alt={item.name}
                    className="w-full h-48 group-hover:scale-110 transition-transform duration-500"
                    fallbackIcon={<Package className="h-12 w-12 text-gray-400" />}
                    fallbackText="No Image"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 text-sm font-bold rounded">
                    -{item.discount || '25'}%
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-black mb-3 group-hover:text-gray-700 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl font-bold text-black">{formatPrice(item.price)}</span>
                    <span className="text-lg text-gray-500 line-through">{formatPrice(item.originalPrice || item.price * 1.33)}</span>
                  </div>
                  <Button 
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Testimonials Section */}
      <section className="relative py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              WHAT OUR CLIENTS SAY
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real feedback from our satisfied customers around the world
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 border-l-4 border-black hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="text-lg font-bold text-black">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 italic leading-relaxed">
                  <Quote className="h-6 w-6 text-gray-400 mb-2" />
                  "{testimonial.content}"
                </blockquote>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}