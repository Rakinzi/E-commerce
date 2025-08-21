import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Cart() {
  const { cart, updateCartItem, removeFromCart, clearCart, cartTotal, loading } = useCart();
  const { formatPrice } = useCurrency();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Temporarily disable deduplication to debug cart items disappearing
  const deduplicatedItems = useMemo(() => {
    if (!cart?.items) return [];
    
    console.log('Cart items from backend:', cart.items);
    
    // Just return the items as-is for now to debug the issue
    return cart.items;
    
    /* Original deduplication logic - temporarily disabled
    const itemsMap = new Map();
    cart.items.forEach((item) => {
      const productId = item.productId;
      console.log('Processing item:', item, 'productId:', productId);
      if (itemsMap.has(productId)) {
        // Combine quantities if duplicate found
        const existing = itemsMap.get(productId);
        existing.quantity += item.quantity;
      } else {
        itemsMap.set(productId, { ...item });
      }
    });
    
    const result = Array.from(itemsMap.values());
    console.log('Deduplicated items:', result);
    return result;
    */
  }, [cart?.items]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await updateCartItem(productId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromCart(productId);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading cart...</div>
      </div>
    );
  }

  if (!cart || deduplicatedItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-black mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">
              Start shopping to add items to your cart
            </p>
            <Link to="/products">
              <Button className="bg-black text-white hover:bg-gray-800">
                Browse Products
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">Shopping Cart</h1>
            <Button
              onClick={clearCart}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {deduplicatedItems.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0">
                          {/* Product image would go here */}
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-black mb-1">
                            {item.name}
                          </h3>
                          <p className="text-lg font-bold text-black">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={updatingItems.has(item.productId) || item.quantity <= 1}
                              className="p-2 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              disabled={updatingItems.has(item.productId)}
                              className="p-2 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={updatingItems.has(item.productId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Subtotal: {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-gray-200 sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(cartTotal * 0.08)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{cartTotal > 50 ? 'Free' : formatPrice(10)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {formatPrice(cartTotal + (cartTotal * 0.08) + (cartTotal > 50 ? 0 : 10))}
                    </span>
                  </div>
                  
                  <Link to="/checkout" className="block">
                    <Button className="w-full bg-black text-white hover:bg-gray-800">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  
                  <Link to="/products" className="block">
                    <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}