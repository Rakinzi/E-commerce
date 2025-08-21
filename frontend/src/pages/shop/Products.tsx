import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productsAPI, type Product } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Search, ShoppingCart, Star, Heart, Package } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { usePageTitle, PAGE_TITLES } from '@/hooks/usePageTitle';
import Carousel from '@/components/ui/carousel';
import { getFirstImageUrl, hasValidImages } from '@/utils/imageUtils';
import ImageLoader from '@/components/ui/ImageLoader';


// Product category carousel items  
const getCarouselItems = (categories?: string[]) => {
  const baseItems = [
    {
      id: '1',
      image: '/images/discover/pexels-katie-mukhina-975382726-33492439.jpg',
      title: 'DISCOVER',
      subtitle: 'AMAZING PRODUCTS',
      description: 'Explore our curated collection of premium products from trusted vendors worldwide.',
      cta: {
        text: 'Shop Now',
        link: '#filters'
      }
    },
    {
      id: '2', 
      image: '/images/accessories/pexels-shivam-31367058.jpg',
      title: 'ELECTRONICS',
      subtitle: 'LATEST TECHNOLOGY',
      description: 'From smartphones to laptops, find the latest tech gadgets at unbeatable prices.',
      cta: {
        text: 'Browse Electronics', 
        link: '#filters?category=Electronics'
      }
    },
    {
      id: '3',
      image: '/images/clothes/pexels-anastasia-shuraeva-5705490.jpg',
      title: 'FASHION',
      subtitle: 'TRENDING STYLES',
      description: 'Stay stylish with our collection of clothing and accessories for every occasion.',
      cta: {
        text: 'Explore Fashion',
        link: '#filters?category=Clothing'
      }
    }
  ];

  if (categories && categories.length > 0) {
    const categoryImages = [
      '/images/accessories/pexels-gentcreate-9826162.jpg',
      '/images/building_materials/pexels-mikael-blomkvist-8961555.jpg',
      '/images/discover/pexels-lilartsy-1194775.jpg'
    ];
    
    const categoryItems = categories.slice(0, 3).map((category, index) => ({
      id: `category-${index}`,
      image: categoryImages[index % categoryImages.length],
      title: category.toUpperCase(),
      subtitle: 'PREMIUM COLLECTION',
      description: `Discover our hand-picked selection of ${category.toLowerCase()} products.`,
      cta: {
        text: `Shop ${category}`,
        link: `#filters?category=${encodeURIComponent(category)}`
      }
    }));
    return [...baseItems.slice(0, 1), ...categoryItems];
  }

  return baseItems;
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { currency, formatPrice } = useCurrency();

  // Dynamic title based on category and search
  const dynamicTitle = selectedCategory 
    ? `${selectedCategory} Products`
    : searchTerm 
    ? `Search: ${searchTerm}`
    : PAGE_TITLES.PRODUCTS;
  
  usePageTitle(dynamicTitle);

  const { data: categoriesData } = useQuery(
    'categories',
    () => productsAPI.getCategories(),
    {
      select: (response) => response.data.categories,
    }
  );

  const { data: productsData, isLoading, error } = useQuery(
    ['products', { searchTerm, selectedCategory, sortBy, sortOrder, page }],
    () => productsAPI.getProducts({
      search: searchTerm || undefined,
      category: selectedCategory || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 12,
    }),
    {
      select: (response) => response.data,
      keepPreviousData: true,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // Handle smooth scrolling and category filtering for carousel CTA clicks
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#filters')) {
        // Parse category from URL
        const url = new URL(window.location.href);
        const categoryParam = url.hash.includes('?') 
          ? new URLSearchParams(url.hash.split('?')[1]).get('category')
          : null;
        
        // Set category if specified
        if (categoryParam && categoryParam !== selectedCategory) {
          setSelectedCategory(categoryParam);
          setPage(1);
        }
        
        // Scroll to filters section
        const element = document.getElementById('filters');
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
  }, [selectedCategory]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const carouselItems = getCarouselItems(categoriesData);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Failed to load products</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-black text-white hover:bg-gray-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel */}
      <section className="relative">
        <Carousel 
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={7000}
          className="h-[70vh] md:h-[80vh]"
        />
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Filters */}
        <div id="filters" className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
            <Button 
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
            >
              Search
            </Button>
          </form>

          {/* Category Filter */}
          <Select value={selectedCategory || 'all'} onValueChange={(value) => {
            setSelectedCategory(value === 'all' ? '' : value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[200px] border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesData?.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('-');
            setSortBy(newSortBy);
            setSortOrder(newSortOrder as 'asc' | 'desc');
            setPage(1);
          }}>
            <SelectTrigger className="w-[200px] border-gray-300 focus:border-black focus:ring-black">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <>
            {productsData?.products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No products found</p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setPage(1);
                  }}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {productsData?.products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden bg-white">
                      <div className="relative overflow-hidden">
                        <ImageLoader
                          src={hasValidImages(product) ? getFirstImageUrl(product.images) : ''}
                          alt={product.name}
                          className="w-full h-64 group-hover:scale-110 transition-transform duration-700"
                          fallbackIcon={<Package className="h-12 w-12 text-gray-400" />}
                          fallbackText="No Image"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Wishlist Button */}
                        <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110">
                          <Heart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
                        </button>
                        
                        {/* Stock Status */}
                        {product.stock === 0 ? (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                              Out of Stock
                            </div>
                          </div>
                        ) : product.stock < 5 ? (
                          <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Only {product.stock} left
                          </div>
                        ) : null}
                        
                        {/* Quick View */}
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                          <Link to={`/products/${product._id}`}>
                            <Button className="w-full bg-white text-black hover:bg-gray-100 font-semibold rounded-full">
                              Quick View
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-black mb-1 group-hover:text-gray-700 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">
                              {product.category}
                            </p>
                          </div>
                          {product.rating.count > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-yellow-600">
                                {product.rating.average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-black">
                              {formatPrice(product.price)}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {product.stock} available
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(product.rating.average)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                              ({product.rating.count})
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-6 pt-0">
                        {user ? (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="w-full bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black disabled:from-gray-300 disabled:to-gray-300 py-3 rounded-full font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:transform-none"
                          >
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                        ) : (
                          <Button
                            asChild
                            className="w-full bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 py-3 rounded-full font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <a href="/login">Sign In to Buy</a>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {productsData && productsData.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, productsData.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        variant={page === pageNum ? "default" : "outline"}
                        className={page === pageNum 
                          ? "bg-black text-white" 
                          : "border-black text-black hover:bg-gray-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === productsData.totalPages}
                  variant="outline"
                  className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}