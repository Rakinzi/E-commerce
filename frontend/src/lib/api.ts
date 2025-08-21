import axios from 'axios';
import { env, debugLog } from '@/config/env';

export interface APIResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  error?: string;
}

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: env.API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    debugLog(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    debugLog('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    debugLog(`API Response: ${response.status} ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  (error) => {
    debugLog('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const protectedPaths = ['/cart', '/checkout', '/orders', '/profile', '/admin', '/vendor'];
      const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));
      
      if (isProtectedPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isDefault: boolean;
  isActive: boolean;
}

export interface Permission {
  _id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  directPermissions: Permission[];
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  images: string[];
  sku: string;
  vendor: string;
  active: boolean;
  tags: string[];
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  status: 'active' | 'abandoned' | 'converted';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  products: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    sku: string;
  }[];
  totalAmount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role: string = 'customer') =>
    api.post('/auth/register', { name, email, password, role }),
  
  verifyEmail: (email: string, otp: string) =>
    api.post('/auth/verify-email', { email, otp }),
  
  resendOTP: (email: string, type: 'email_verification' | 'password_reset') =>
    api.post('/auth/resend-otp', { email, type }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get<{ user: User }>('/auth/profile'),
  
  updateProfile: (name: string) =>
    api.patch('/auth/profile', { name }),
};

// Products API
export const productsAPI = {
  getProducts: (params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }>('/products', { params }),
  
  getProduct: (id: string) => api.get<{ product: Product }>(`/products/${id}`),
  
  getCategories: () => api.get<{ categories: string[] }>('/products/categories'),
  
  createProduct: (productData: Partial<Product>) =>
    api.post<{ product: Product }>('/products', productData),
  
  updateProduct: (id: string, productData: Partial<Product>) =>
    api.put<{ product: Product }>(`/products/${id}`, productData),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get<{ cart: Cart }>('/cart'),
  
  addToCart: (productId: string, quantity: number) =>
    api.post<{ cart: Cart }>('/cart/add', { productId, quantity }),
  
  updateCartItem: (productId: string, quantity: number) =>
    api.put<{ cart: Cart }>(`/cart/item/${productId}`, { quantity }),
  
  removeFromCart: (productId: string) =>
    api.delete<{ cart: Cart }>(`/cart/item/${productId}`),
  
  clearCart: () => api.delete<{ cart: Cart }>('/cart/clear'),
  
  validateCart: () => api.get<{
    valid: boolean;
    issues: string[];
    cart: Cart;
  }>('/cart/validate'),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData: {
    paymentMethod: string;
    shippingAddress: Order['shippingAddress'];
    billingAddress: Order['billingAddress'];
    notes?: string;
  }) => api.post<{ order: Order }>('/orders', orderData),
  
  // Customer orders (requires orders:read permission)
  getMyOrders: (params?: {
    page?: number;
    limit?: number;
    orderStatus?: string;
    paymentStatus?: string;
  }) => api.get<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }>('/orders/my', { params }),
  
  // Admin/Vendor orders (requires orders:manage permission)
  getOrders: (params?: {
    page?: number;
    limit?: number;
    orderStatus?: string;
    paymentStatus?: string;
  }) => api.get<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }>('/orders', { params }),
  
  getOrder: (id: string) => api.get<{ order: Order }>(`/orders/${id}`),
  
  cancelOrder: (id: string) => api.patch<{ order: Order }>(`/orders/${id}/cancel`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get<{ users: User[]; totalPages: number; currentPage: number; totalUsers: number }>('/admin/users', { params }),
  
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  
  getProductStats: () => api.get('/admin/products/stats'),
  
  getSystemLogs: (params?: {
    page?: number;
    limit?: number;
    level?: string;
  }) => api.get('/admin/logs', { params }),
};

// Role Management API
export const roleAPI = {
  getRoles: () => api.get<{ roles: Role[] }>('/roles'),
  
  getRole: (roleId: string) => api.get<{ role: Role }>(`/roles/${roleId}`),
  
  getRolesByIds: (roleIds: string[]) => api.post<{ roles: Role[] }>('/roles/batch', { roleIds }),
  
  createRole: (roleData: {
    name: string;
    description?: string;
    permissions: string[];
  }) => api.post<{ role: Role }>('/roles', roleData),
  
  updateRole: (roleId: string, updates: {
    name?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
  }) => api.put<{ role: Role }>(`/roles/${roleId}`, updates),
  
  deleteRole: (roleId: string) => api.delete(`/roles/${roleId}`),
  
  assignRole: (roleId: string, userId: string) =>
    api.post(`/roles/${roleId}/assign/${userId}`),
  
  removeRole: (roleId: string, userId: string) =>
    api.delete(`/roles/${roleId}/remove/${userId}`),
};

// Permission Management API
export const permissionAPI = {
  getPermissions: (params?: {
    resource?: string;
    action?: string;
  }) => api.get<{ 
    permissions: Permission[]; 
    groupedPermissions: Record<string, Permission[]>;
    total: number;
  }>('/permissions', { params }),
  
  getPermission: (permissionId: string) => api.get<{ permission: Permission }>(`/permissions/${permissionId}`),
  
  createPermission: (permissionData: {
    name: string;
    description?: string;
    resource: string;
    action: string;
    conditions?: Record<string, unknown>;
  }) => api.post<{ permission: Permission }>('/permissions', permissionData),
  
  updatePermission: (permissionId: string, updates: {
    name?: string;
    description?: string;
    resource?: string;
    action?: string;
    conditions?: Record<string, unknown>;
  }) => api.put<{ permission: Permission }>(`/permissions/${permissionId}`, updates),
  
  deletePermission: (permissionId: string) => api.delete(`/permissions/${permissionId}`),
  
  getResources: () => api.get<{ resources: string[] }>('/permissions/resources/list'),
  
  grantPermission: (permissionId: string, userId: string) =>
    api.post(`/permissions/${permissionId}/grant/${userId}`),
  
  revokePermission: (permissionId: string, userId: string) =>
    api.delete(`/permissions/${permissionId}/revoke/${userId}`),
};

// Vendor API endpoints
export const vendorAPI = {
  // Dashboard
  getDashboard: (): Promise<APIResponse<any>> =>
    api.get('/vendor/dashboard'),
  
  getStats: (period = '7d'): Promise<APIResponse<any>> =>
    api.get(`/vendor/stats?period=${period}`),

  // Products
  getProducts: (params?: any): Promise<APIResponse<{ products: Product[]; totalCount: number; totalPages: number; currentPage: number }>> =>
    api.get('/vendor/products', { params }),
  
  getProduct: (id: string): Promise<APIResponse<{ product: Product }>> =>
    api.get(`/vendor/products/${id}`),
  
  createProduct: (data: FormData): Promise<APIResponse<Product>> =>
    api.post('/vendor/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  updateProduct: (id: string, data: FormData): Promise<APIResponse<Product>> =>
    api.put(`/vendor/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteProduct: (id: string): Promise<APIResponse<void>> =>
    api.delete(`/vendor/products/${id}`),

  // Image management
  addProductImages: (productId: string, data: FormData): Promise<APIResponse<Product>> =>
    api.post(`/vendor/products/${productId}/images`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  uploadProductImage: (data: FormData): Promise<APIResponse<any>> =>
    api.post('/vendor/products/upload-image', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  removeProductImage: (productId: string, imageIndex: number): Promise<APIResponse<Product>> =>
    api.delete(`/vendor/products/${productId}/images/${imageIndex}`),

  // CSV operations
  importProductsCSV: (data: FormData): Promise<APIResponse<any>> =>
    api.post('/vendor/products/import-csv', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  exportProductsCSV: (): Promise<any> =>
    api.get('/vendor/products/export-csv', { responseType: 'blob' }),
  
  downloadCSVTemplate: (): Promise<any> =>
    api.get('/vendor/products/csv-template', { responseType: 'blob' }),

  // Orders
  getOrders: (params?: any): Promise<APIResponse<any>> =>
    api.get('/vendor/orders', { params }),
  
  updateOrderStatus: (orderId: string, status: string): Promise<APIResponse<any>> =>
    api.put(`/vendor/orders/${orderId}/status`, { status }),
};