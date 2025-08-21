import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminAPI, productsAPI, type User, type Product } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RequirePermission } from '@/components/guards/PermissionGuard';
import { toast } from 'sonner';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Search,
  Edit,
  Trash2
} from 'lucide-react';
import { DashboardCardSkeleton, TableRowSkeleton, LineSkeleton } from '@/components/ui/skeleton';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['admin-users', searchTerm],
    () => adminAPI.getUsers({ search: searchTerm || undefined }),
    {
      select: (response) => response.data.users,
      enabled: activeTab === 'users',
    }
  );

  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['admin-products', searchTerm],
    () => productsAPI.getProducts({ search: searchTerm || undefined }),
    {
      select: (response) => response.data.products,
      enabled: activeTab === 'products',
    }
  );

  const updateUserMutation = useMutation(
    ({ userId, role }: { userId: string; role: string }) =>
      adminAPI.updateUserRole(userId, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-users']);
        toast.success('User role updated successfully');
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
        toast.error(errorMessage);
      },
    }
  );

  const deleteProductMutation = useMutation(
    (productId: string) => productsAPI.deleteProduct(productId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-products']);
        toast.success('Product deleted successfully');
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
        toast.error(errorMessage);
      },
    }
  );

  const handleUserRoleChange = (userId: string, newRole: string) => {
    updateUserMutation.mutate({
      userId,
      role: newRole
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
  ];

  if (!hasPermission('view-dashboard')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Access denied. Dashboard permissions required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-black mb-8">Admin Dashboard</h1>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'users' | 'products')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-black">1,234</p>
                    </div>
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-black">567</p>
                    </div>
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-black">890</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-black">$45,678</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            </TabsContent>
            
            <TabsContent value="users" className="mt-0">
            <RequirePermission permission="view-users" fallback={
              <div className="text-center py-8">
                <p className="text-red-600">You don't have permission to view users.</p>
              </div>
            }>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
              </div>

              {/* Users Table */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Users Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <TableRowSkeleton key={index} columns={5} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersData?.map((user: User) => (
                            <tr key={user._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{user.name}</td>
                              <td className="py-3 px-4">{user.email}</td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.map(role => (
                                    <span
                                      key={role._id}
                                      className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
                                    >
                                      {role.name}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.isActive
                                      ? 'bg-green-50 text-green-600'
                                      : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <RequirePermission permission="manage-roles" fallback={
                                  <span className="text-gray-400 text-sm">No permission</span>
                                }>
                                  <Select
                                    onValueChange={(value) => handleUserRoleChange(user._id, value)}
                                  >
                                    <SelectTrigger className="w-32 border-gray-300">
                                      <SelectValue placeholder="Change role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="customer">Customer</SelectItem>
                                      <SelectItem value="vendor">Vendor</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </RequirePermission>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </RequirePermission>
            </TabsContent>
            
            <TabsContent value="products" className="mt-0">
            <RequirePermission permission="view-products" fallback={
              <div className="text-center py-8">
                <p className="text-red-600">You don't have permission to view products.</p>
              </div>
            }>
            <div>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
              </div>

              {/* Products Table */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Products Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <TableRowSkeleton key={index} columns={6} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productsData?.map((product: Product) => (
                            <tr key={product._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{product.name}</td>
                              <td className="py-3 px-4">{product.category}</td>
                              <td className="py-3 px-4">${product.price.toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    product.stock > 0
                                      ? 'bg-green-50 text-green-600'
                                      : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {product.stock}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    product.isActive
                                      ? 'bg-green-50 text-green-600'
                                      : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </RequirePermission>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}