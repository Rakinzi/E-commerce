import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingCart, Users, Star, Shield, Truck } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import Carousel from '@/components/ui/carousel';

export default function Welcome() {
  usePageTitle('Welcome to E-Commerce');

  const features = [
    {
      icon: Package,
      title: 'Quality Products',
      description: 'Curated selection of premium items from trusted vendors worldwide',
    },
    {
      icon: ShoppingCart,
      title: 'Simple Shopping',
      description: 'Streamlined checkout process with secure payment options',
    },
    {
      icon: Users,
      title: 'Trusted Community',
      description: 'Join thousands of satisfied customers and verified sellers',
    },
  ];

  const benefits = [
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

  const carouselItems = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop&crop=entropy&auto=format&q=80',
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
      image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1600&h=900&fit=crop&crop=entropy&auto=format&q=80',
      title: 'JOIN AS A',
      subtitle: 'VENDOR',
      description: 'Connect with customers worldwide. Grow your business with us.',
      cta: {
        text: 'BECOME A VENDOR',
        link: '/register'
      }
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&h=900&fit=crop&crop=entropy&auto=format&q=80',
      title: 'SECURE &',
      subtitle: 'TRUSTED',
      description: 'Shop with confidence on our secure platform.',
      cta: {
        text: 'LEARN MORE',
        link: '/categories'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel */}
      <section className="relative">
        <Carousel 
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={5000}
          className="h-[80vh] md:h-[90vh]"
        />
      </section>

      {/* Welcome Message */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6">
              Your Premium Shopping Destination
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join thousands of customers who trust us for quality products, 
              excellent service, and an exceptional shopping experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg font-bold rounded-none transform transition-all duration-300 hover:scale-105">
                  GET STARTED
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="border-black text-black hover:bg-gray-50 px-8 py-3 text-lg font-bold rounded-none">
                  BROWSE PRODUCTS
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to providing the best shopping experience with these core values
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-800 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 p-6 bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black mb-2">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Create your account today and discover premium products from trusted vendors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-bold rounded-none">
                  SIGN UP NOW
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg font-bold rounded-none">
                  SIGN IN
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}