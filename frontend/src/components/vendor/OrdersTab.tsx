import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Eye,
  Filter
} from 'lucide-react';
import { vendorAPI } from '@/lib/api';

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      vendor: string;
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

interface OrdersTabProps {
  onLoadComplete?: () => void;
}

export default function OrdersTab({ onLoadComplete }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getOrders({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        page,
        limit: 10
      });
      
      console.log('Vendor orders API response:', response);
      console.log('Orders data:', response.data);
      console.log('Orders array:', response.data?.data?.orders);
      console.log('Total orders:', response.data?.data?.totalOrders);
      
      setOrders(response.data?.data?.orders || []);
      setTotalOrders(response.data?.data?.totalOrders || 0);
    } catch (error) {
      console.error('Failed to load orders:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
      onLoadComplete?.();
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await vendorAPI.updateOrderStatus(orderId, status);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: status as any, updatedAt: new Date().toISOString() }
            : order
        )
      );
      
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-black">YOUR ORDERS</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedStatus} onValueChange={(value) => {
              setSelectedStatus(value || 'all');
              setPage(1);
            }}>
              <SelectTrigger className="w-[180px] border-gray-300 focus:border-black focus:ring-black rounded-none">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {(orders?.length || 0) === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {selectedStatus 
                ? `No ${selectedStatus} orders found.`
                : "You haven't received any orders yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(orders || []).map((order) => {
            const StatusIcon = statusIcons[order.status];
            const vendorItems = order.items.filter(item => item.product.vendor);
            const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-black">
                          #{order.orderNumber}
                        </h3>
                        <Badge className={`${statusColors[order.status]} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-black">
                          {formatCurrency(vendorTotal)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-medium text-black mb-2">Customer</h4>
                        <p className="text-gray-700">{order.user.name}</p>
                        <p className="text-gray-500 text-sm">{order.user.email}</p>
                        
                        <h4 className="font-medium text-black mt-4 mb-2">Shipping Address</h4>
                        <div className="text-gray-600 text-sm">
                          <p>{order.shippingAddress.street}</p>
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div>
                        <h4 className="font-medium text-black mb-2">
                          Your Items ({vendorItems.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {vendorItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 line-clamp-1">
                                  {item.product.name}
                                </p>
                                <p className="text-gray-500">
                                  Qty: {item.quantity} × {formatCurrency(item.price)}
                                </p>
                              </div>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="outline"
                        size="sm"
                        className="border-black text-black hover:bg-gray-50 rounded-none"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              onClick={() => updateOrderStatus(order._id, 'processing')}
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700 rounded-none"
                            >
                              Mark Processing
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              onClick={() => updateOrderStatus(order._id, 'shipped')}
                              size="sm"
                              className="bg-purple-600 text-white hover:bg-purple-700 rounded-none"
                            >
                              Mark Shipped
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              onClick={() => updateOrderStatus(order._id, 'delivered')}
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700 rounded-none"
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {Math.ceil(totalOrders / 10) > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            variant="outline"
            className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 rounded-none"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, Math.ceil(totalOrders / 10)) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  variant={page === pageNum ? "default" : "outline"}
                  className={page === pageNum 
                    ? "bg-black text-white rounded-none" 
                    : "border-black text-black hover:bg-gray-50 rounded-none"
                  }
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page === Math.ceil(totalOrders / 10)}
            variant="outline"
            className="border-black text-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 rounded-none"
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Details Modal - Implementation would go here */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-none">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-black">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <Button
                  onClick={() => setSelectedOrder(null)}
                  variant="ghost"
                  size="sm"
                  className="rounded-none"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                Detailed order view would be implemented here with complete order information, 
                tracking details, and advanced management options.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}