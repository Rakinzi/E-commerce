import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  Package, 
  Plus, 
  Upload, 
  Download, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { usePageTitle, PAGE_TITLES } from '@/hooks/usePageTitle';
import ProductUploadModal from '@/components/vendor/ProductUploadModal';
import CSVImportModal from '@/components/vendor/CSVImportModal';
import BulkImageUploadModal from '@/components/vendor/BulkImageUploadModal';
import OrdersTab from '@/components/vendor/OrdersTab';
import { vendorAPI, type Product } from '@/lib/api';
import { getFirstImageUrl, hasValidImages } from '@/utils/imageUtils';
import ImageLoader from '@/components/ui/ImageLoader';

interface VendorStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  outOfStockProducts: number;
}

export default function Vendor() {
  usePageTitle('Vendor Dashboard');
  
  const { user, hasPermissionTo, hasRole } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showBulkImageModal, setShowBulkImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Scroll to top when component first mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hasRole('vendor') || hasRole('admin') || hasPermissionTo('products', 'read')) {
      loadDashboardData();
    }
  }, [hasRole, hasPermissionTo, currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, productsData] = await Promise.all([
        vendorAPI.getDashboard(),
        vendorAPI.getProducts({ page: currentPage, limit: productsPerPage })
      ]);
      
      console.log('Dashboard data:', dashboardData);
      console.log('Products data:', productsData);
      
      // Extract stats data properly
      const statsData = dashboardData.data?.data || dashboardData.data;
      console.log('Extracted stats:', statsData);
      setStats(statsData);
      
      // Handle different response structures
      const productsArray = productsData.data?.products || productsData.products || [];
      const paginationData = productsData.data || productsData;
      console.log('Extracted products:', productsArray);
      console.log('Pagination data:', paginationData);
      
      setProducts(productsArray);
      setTotalPages(paginationData.totalPages || 1);
      setTotalCount(paginationData.totalCount || productsArray.length);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductCreated = () => {
    setShowUploadModal(false);
    setSelectedProduct(null);
    loadDashboardData();
  };

  const handleCSVImported = () => {
    setShowCSVModal(false);
    loadDashboardData();
  };

  const handleBulkImageUploaded = () => {
    setShowBulkImageModal(false);
    loadDashboardData();
  };

  const handleViewProduct = (product: Product) => {
    // Navigate to the product page in the same tab
    window.location.href = `/products/${product._id}`;
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowUploadModal(true);
  };

  const handleAddImages = (product: Product) => {
    setSelectedProduct(product);
    setShowBulkImageModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await vendorAPI.deleteProduct(productId);
      loadDashboardData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await vendorAPI.exportProductsCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  if (!hasRole('vendor') && !hasRole('admin') && !hasPermissionTo('products', 'read')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the vendor dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Please contact an administrator to get vendor permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight">
                VENDOR DASHBOARD
              </h1>
              <p className="text-gray-600 font-light">
                Welcome back, {user?.name}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-black text-white hover:bg-gray-800 rounded-none"
                disabled={!hasRole('vendor') && !hasRole('admin')}
              >
                <Plus className="h-4 w-4 mr-2" />
                ADD PRODUCT
              </Button>
              <Button
                onClick={() => setShowCSVModal(true)}
                variant="outline"
                className="border-black text-black hover:bg-gray-50 rounded-none"
                disabled={!hasRole('vendor') && !hasRole('admin')}
              >
                <Upload className="h-4 w-4 mr-2" />
                BULK IMPORT
              </Button>
              <Button
                onClick={() => {
                  setSelectedProduct(null);
                  setShowBulkImageModal(true);
                }}
                variant="outline"
                className="border-black text-black hover:bg-gray-50 rounded-none"
                disabled={!hasRole('vendor') && !hasRole('admin')}
              >
                <Upload className="h-4 w-4 mr-2" />
                BULK IMAGES
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard" className="uppercase tracking-wide font-medium">Dashboard</TabsTrigger>
            <TabsTrigger value="products" className="uppercase tracking-wide font-medium">Products</TabsTrigger>
            <TabsTrigger value="orders" className="uppercase tracking-wide font-medium">Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    TOTAL PRODUCTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-black">{stats?.totalProducts || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    TOTAL ORDERS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-black">{stats?.totalOrders || 0}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    TOTAL REVENUE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-black">{formatPrice(stats?.totalRevenue || 0)}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    ACTIVE PRODUCTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-black">{stats?.activeProducts || 0}</p>
                  {(stats?.outOfStockProducts || 0) > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {stats?.outOfStockProducts || 0} out of stock
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
          </TabsContent>
          
          <TabsContent value="products" className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Actions Bar */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-black">YOUR PRODUCTS</h2>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="border-black text-black hover:bg-gray-50 rounded-none"
              >
                <Download className="h-4 w-4 mr-2" />
                EXPORT CSV
              </Button>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-16 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">No Products Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start by adding your first product to the marketplace.
                  </p>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-black text-white hover:bg-gray-800 rounded-none"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    ADD YOUR FIRST PRODUCT
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product._id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="relative">
                      <ImageLoader
                        src={hasValidImages(product) ? getFirstImageUrl(product.images) : ''}
                        alt={product.name}
                        className="w-full"
                        aspectRatio="square"
                        fallbackIcon={<Package className="h-12 w-12 text-gray-400" />}
                        fallbackText="No Images"
                      />
                      <div className="absolute top-4 right-4 space-y-2">
                        <Badge variant={product.active ? 'default' : 'secondary'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                        {product.stock === 0 && (
                          <Badge variant="destructive" className="block">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-black text-black">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-none"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-none"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-none"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-none border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleAddImages(product)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Add Images ({product.images?.length || 0})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                  >
                    First
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                  >
                    Previous
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={currentPage === pageNum 
                          ? "bg-black text-white" 
                          : "border-black text-black hover:bg-gray-50"
                        }
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400"
                  >
                    Last
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, totalCount)} of {totalCount} products
                </div>
              </div>
            )}
          </motion.div>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-0">
            <OrdersTab onLoadComplete={() => setLoading(false)} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ProductUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedProduct(null);
        }}
        onProductCreated={handleProductCreated}
        product={selectedProduct}
      />
      
      <CSVImportModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onImportComplete={handleCSVImported}
      />

      <BulkImageUploadModal
        isOpen={showBulkImageModal}
        onClose={() => {
          setShowBulkImageModal(false);
          setSelectedProduct(null);
        }}
        onUploadComplete={handleBulkImageUploaded}
        products={products}
        preSelectedProduct={selectedProduct}
      />
    </div>
  );
}