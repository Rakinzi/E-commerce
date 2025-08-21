import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { productsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ArrowLeft, ShoppingCart, Star, Package, Truck, Shield, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { processImageUrls, hasValidImages } from '@/utils/imageUtils';
import ImageLoader, { ThumbnailSkeleton } from '@/components/ui/ImageLoader';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: productData, isLoading, error } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id!),
    {
      enabled: !!id,
      select: (response) => response.data.product,
    }
  );
  
  // Process product images when product data changes
  const processedImages = productData && hasValidImages(productData) 
    ? processImageUrls(productData.images) 
    : [];

  if (!id) {
    navigate('/products');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading product...</div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Product not found</p>
          <Button onClick={() => navigate('/products')} className="bg-black text-white hover:bg-gray-800">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const product = productData;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product._id, quantity);
      toast.success(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart`);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/products')}
          variant="outline"
          className="mb-8 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4">
                <ImageLoader
                  src={processedImages.length > 0 ? processedImages[selectedImage] : ''}
                  alt={product.name}
                  className="w-full rounded-lg"
                  aspectRatio="square"
                  fallbackIcon={<Package className="h-16 w-16 text-gray-400" />}
                  fallbackText="No Image"
                />
              </div>

              {/* Image Thumbnails */}
              {processedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {processedImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 rounded-lg border-2 transition-colors ${
                        selectedImage === index ? 'border-black' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ImageLoader
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full rounded-lg"
                        fallbackIcon={<Package className="h-6 w-6 text-gray-400" />}
                        fallbackText=""
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Product Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Product Title & Price */}
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">{product.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-black">${product.price.toFixed(2)}</span>
                  {product.rating.count > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating.average)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({product.rating.count} reviews)</span>
                    </div>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mb-4">
                  {isOutOfStock ? (
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  ) : product.stock <= 5 ? (
                    <span className="text-orange-600 font-medium">Only {product.stock} left in stock</span>
                  ) : (
                    <span className="text-green-600 font-medium">In Stock</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-black mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-black">SKU</span>
                    </div>
                    <span className="text-sm text-gray-600">{product.sku}</span>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-black">Category</span>
                    </div>
                    <span className="text-sm text-gray-600">{product.category}</span>
                  </CardContent>
                </Card>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Quantity</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="border-gray-300"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="border-gray-300"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 bg-black text-white hover:bg-gray-800 py-3 text-lg font-bold"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50 px-6"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Truck className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Free Shipping</span>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
                <div className="text-center">
                  <Package className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Easy Returns</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}