import { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { cartAPI, type Cart } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartItemsCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Debug user state changes
  useEffect(() => {
    console.log('CartContext: User state changed:', user);
  }, [user]);

  const { data: cart, isLoading: loading } = useQuery(
    ['cart', user?._id],
    () => {
      console.log('CartContext: Making cart API call, user:', user);
      return cartAPI.getCart().then(response => {
        console.log('CartContext: API call successful, response:', response);
        return response;
      }).catch(error => {
        console.error('CartContext: API call failed:', error);
        console.error('CartContext: Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        throw error;
      });
    },
    {
      enabled: !!user,
      select: (response) => {
        console.log('CartContext: Full response received:', response);
        console.log('CartContext: Response type:', typeof response);
        console.log('CartContext: Response keys:', response ? Object.keys(response) : 'null');
        
        if (!response || !response.data) {
          console.log('CartContext: No response or data - response:', response);
          return null;
        }
        console.log('CartContext: Raw response.data:', response.data);
        console.log('CartContext: response.data type:', typeof response.data);
        console.log('CartContext: response.data keys:', Object.keys(response.data));
        
        const cart = response.data.cart || null;
        console.log('CartContext: Selected cart:', cart);
        return cart;
      },
      onError: (error: unknown) => {
        console.error('Cart query error:', error);
        console.error('Cart query error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          response: (error as any)?.response?.data,
          status: (error as any)?.response?.status
        });
        // Don't show error toast for initial load failures
      },
      retry: false, // Don't retry failed cart requests
      refetchOnWindowFocus: false,
    }
  );

  const addToCartMutation = useMutation(
    ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartAPI.addToCart(productId, quantity),
    {
      onSuccess: (response) => {
        if (response && response.data) {
          queryClient.setQueryData(['cart', user?._id], response);
          toast.success('Added to cart');
        }
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart';
        toast.error(errorMessage);
      },
    }
  );

  const updateCartItemMutation = useMutation(
    ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartAPI.updateCartItem(productId, quantity),
    {
      onSuccess: (response) => {
        if (response && response.data) {
          queryClient.setQueryData(['cart', user?._id], response);
          toast.success('Cart updated');
        }
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update cart';
        toast.error(errorMessage);
      },
    }
  );

  const removeFromCartMutation = useMutation(
    (productId: string) => cartAPI.removeFromCart(productId),
    {
      onSuccess: (response) => {
        if (response && response.data) {
          queryClient.setQueryData(['cart', user?._id], response);
          toast.success('Removed from cart');
        }
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove from cart';
        toast.error(errorMessage);
      },
    }
  );

  const clearCartMutation = useMutation(
    () => cartAPI.clearCart(),
    {
      onSuccess: (response) => {
        if (response && response.data) {
          queryClient.setQueryData(['cart', user?._id], response);
          toast.success('Cart cleared');
        }
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart';
        toast.error(errorMessage);
      },
    }
  );

  const addToCart = async (productId: string, quantity: number) => {
    await addToCartMutation.mutateAsync({ productId, quantity });
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    await updateCartItemMutation.mutateAsync({ productId, quantity });
  };

  const removeFromCart = async (productId: string) => {
    await removeFromCartMutation.mutateAsync(productId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  const cartItemsCount = cart?.totalItems || 0;
  const cartTotal = cart?.totalPrice || 0;

  // Clear cart data when user logs out
  useEffect(() => {
    if (!user) {
      queryClient.removeQueries(['cart']);
    }
  }, [user, queryClient]);

  return (
    <CartContext.Provider value={{
      cart: cart || null,
      loading,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      cartItemsCount,
      cartTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}