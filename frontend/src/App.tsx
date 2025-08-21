import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import {
  // Dashboard
  Home,
  // Shopping
  Products,
  ProductDetail,
  Categories,
  Cart,
  Checkout,
  // User
  Profile,
  Orders,
  OrderDetail,
  // Admin
  Admin,
  Vendor,
  ProductEdit,
  // Auth
  Login,
  Register,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  // Other
  NotFound,
} from '@/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Home component now handles both authenticated and non-authenticated users

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <AuthProvider>
            <CartProvider>
              <Router>
              <Routes>
                {/* Routes with Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="categories" element={<Categories />} />
                  
                  {/* Protected Routes */}
                  <Route path="cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="orders" element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } />
                  <Route path="orders/:id" element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="admin" element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="vendor" element={
                    <ProtectedRoute>
                      <Vendor />
                    </ProtectedRoute>
                  } />
                  <Route path="vendor/products/:id/edit" element={
                    <ProtectedRoute>
                      <ProductEdit />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Public routes without Layout */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Login />
                    </PublicOnlyRoute>
                  }
                />
                
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <Register />
                    </PublicOnlyRoute>
                  }
                />
                
                <Route
                  path="/verify-email"
                  element={
                    <PublicOnlyRoute>
                      <VerifyEmail />
                    </PublicOnlyRoute>
                  }
                />
                
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnlyRoute>
                      <ForgotPassword />
                    </PublicOnlyRoute>
                  }
                />
                
                <Route
                  path="/reset-password"
                  element={
                    <PublicOnlyRoute>
                      <ResetPassword />
                    </PublicOnlyRoute>
                  }
                />
                
                {/* 404 Catch-all Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;