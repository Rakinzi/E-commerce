import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ordersAPI, type Order } from '@/lib/api';
import { Package, Calendar, DollarSign, Eye } from 'lucide-react';
import { OrderCardSkeleton } from '@/components/ui/skeleton';

export default function Orders() {
  const { data: ordersData, isLoading, error } = useQuery(
    'my-orders',
    () => ordersAPI.getMyOrders(),
    {
      select: (response) => response.data.orders,
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'shipped':
        return 'text-purple-600 bg-purple-50';
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Failed to load orders</p>
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-black mb-8">My Orders</h1>

          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <OrderCardSkeleton key={index} />
              ))}
            </div>
          ) : ordersData?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-4">No orders found</p>
              <Button
                asChild
                className="bg-black text-white hover:bg-gray-800"
              >
                <a href="/products">Start Shopping</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {ordersData?.map((order: Order, index: number) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Order #{order.orderNumber}
                        </CardTitle>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            ${order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-black mb-3">Items</h4>
                        <div className="space-y-2">
                          {order.products.map((item) => (
                            <div key={`${order._id}-${item.productId}`} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-black">{item.name}</p>
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-medium text-black">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-black mb-2">Shipping Address</h4>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.street}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                          {order.shippingAddress.country}
                        </p>
                      </div>


                      <div className="border-t pt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Payment Method</p>
                          <p className="font-medium text-black capitalize">
                            {order.paymentMethod.replace('_', ' ')}
                          </p>
                        </div>
                        <Link to={`/orders/${order._id}`}>
                          <Button
                            variant="outline"
                            className="border-black text-black hover:bg-gray-50"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}