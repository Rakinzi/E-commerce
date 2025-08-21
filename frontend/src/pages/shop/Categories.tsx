import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { productsAPI } from '@/lib/api';
import { Package, Shirt, Home, Smartphone, HeartHandshake, Gamepad2 } from 'lucide-react';
import { CategoryCardSkeleton } from '@/components/ui/skeleton';
import { usePageTitle, PAGE_TITLES } from '@/hooks/usePageTitle';
import Carousel from '@/components/ui/carousel';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Electronics': Smartphone,
  'Clothing': Shirt,
  'Home & Garden': Home,
  'Health & Beauty': HeartHandshake,
  'Sports & Outdoors': Gamepad2,
  'Books': Package,
};

const categoryImages: Record<string, string> = {
  'Paint & Decoration': '/images/paint/pexels-greta-hoffman-7859275.jpg',
  'Building Materials': '/images/building_materials/pexels-mikael-blomkvist-8961555.jpg',
  'Tools & Equipment': '/images/building_materials/pexels-tima-miroshnichenko-6474201.jpg',
  'Electronics': '/images/accessories/pexels-gentcreate-9826162.jpg',
  'Clothing': '/images/clothes/clothing.jpg',
  'Home & Garden': '/images/paint/pexels-oandremoura-3978855.jpg',
  'Health & Beauty': '/images/accessories/pexels-gentcreate-9826162.jpg',
  'Sports & Outdoors': '/images/clothes/pexels-ivan-samkov-7671168.jpg',
  'Books': '/images/discover/pexels-lilartsy-1194775.jpg',
};

// Hero carousel images for categories
const categoryCarouselImages: Record<string, string> = {
  'Paint & Decoration': '/images/paint/pexels-paduret-1193743.jpg',
  'Building Materials': '/images/building_materials/pexels-tima-miroshnichenko-6790761.jpg',
  'Tools & Equipment': '/images/building_materials/pexels-tima-miroshnichenko-6474201.jpg',
  'Electronics': '/images/accessories/pexels-gentcreate-9826162.jpg',
  'Clothing': '/images/clothes/pexels-anastasia-shuraeva-5705490.jpg',
  'Home & Garden': '/images/paint/pexels-mccutcheon-1212407.jpg',
  'Health & Beauty': '/images/accessories/pexels-gentcreate-9826162.jpg',
  'Sports & Outdoors': '/images/clothes/pexels-ivan-samkov-7671168.jpg',
  'Books': '/images/discover/pexels-lilartsy-1194775.jpg',
};

// Generate carousel items for categories
const getCategoryCarouselItems = (categories?: string[], productCounts?: Record<string, number>) => {
  const baseItems = [
    {
      id: 'welcome',
      image: '/images/discover/pexels-katie-mukhina-975382726-33492439.jpg',
      title: 'DISCOVER',
      subtitle: 'EVERY CATEGORY',
      description: 'Explore our diverse collection of products across multiple categories, each carefully curated for quality and value.',
      cta: {
        text: 'Browse All',
        link: '#categories'
      }
    }
  ];

  if (categories && categories.length > 0) {
    const categoryItems = categories.slice(0, 4).map((category, index) => {
      const count = productCounts?.[category] || 0;
      return {
        id: `category-${category}`,
        image: categoryCarouselImages[category] || categoryCarouselImages['Electronics'],
        title: category.toUpperCase(),
        subtitle: `${count} ${count === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE`,
        description: `Discover our premium ${category.toLowerCase()} collection featuring top brands and quality products.`,
        cta: {
          text: `Shop ${category}`,
          link: `/products?category=${encodeURIComponent(category)}`
        }
      };
    });
    return [...baseItems, ...categoryItems];
  }

  return baseItems;
};

export default function Categories() {
  usePageTitle(PAGE_TITLES.CATEGORIES);

  const { data: categoriesData, isLoading, error } = useQuery(
    'categories',
    () => productsAPI.getCategories(),
    {
      select: (response) => response.data.categories,
    }
  );

  const { data: productsData } = useQuery(
    'products-by-category',
    () => productsAPI.getProducts({ limit: 100 }),
    {
      select: (response) => {
        const products = response.data.products;
        const categoryStats: Record<string, number> = {};
        
        products.forEach(product => {
          categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
        });
        
        return categoryStats;
      },
    }
  );

  // Handle smooth scrolling for carousel CTA clicks
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash === '#categories') {
        const element = document.getElementById('categories');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    // Handle initial hash on page load
    handleHashScroll();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashScroll);
    
    return () => {
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Carousel Skeleton */}
        <section className="relative">
          <div className="h-[70vh] md:h-[80vh] bg-gray-200 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 bg-gray-300 rounded-lg mx-auto mb-6 w-64"></div>
                <div className="h-6 bg-gray-300 rounded-lg mx-auto w-48"></div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <CategoryCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !categoriesData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Failed to load categories</p>
        </div>
      </div>
    );
  }

  const carouselItems = getCategoryCarouselItems(categoriesData, productsData);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel */}
      <section className="relative">
        <Carousel 
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={6000}
          className="h-[70vh] md:h-[80vh]"
        />
      </section>

      <div id="categories" className="max-w-7xl mx-auto px-4 py-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Browse All Categories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find exactly what you're looking for in our organized product categories
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoriesData.map((category, index) => {
            const IconComponent = categoryIcons[category] || Package;
            const productCount = productsData?.[category] || 0;
            const categoryImage = categoryImages[category] || categoryImages['Electronics'];
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
              >
                <Link to={`/products?category=${encodeURIComponent(category)}`} className="group block">
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:scale-105 overflow-hidden bg-white">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={categoryImage}
                        alt={category}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-500"></div>
                      
                      {/* Floating Icon */}
                      <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                        <IconComponent className="h-6 w-6 text-black" />
                      </div>
                      
                      {/* Product Count Badge */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-sm font-medium text-black">
                          {productCount} {productCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-gray-700 transition-colors duration-300">
                        {category}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        Explore our premium collection of {category.toLowerCase()} from trusted vendors worldwide
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-black font-semibold group-hover:text-gray-700 transition-colors duration-300">
                          Browse Collection
                        </div>
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center group-hover:bg-gray-700 transition-all duration-300 group-hover:scale-110">
                          <svg className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {categoriesData.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">No categories found</h2>
            <p className="text-gray-600">
              Categories will appear here once products are added to the store
            </p>
          </div>
        )}
      </div>
    </div>
  );
}