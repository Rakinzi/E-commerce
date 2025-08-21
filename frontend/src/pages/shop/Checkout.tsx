import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ordersAPI } from '@/lib/api';
import { toast } from 'sonner';
import { CreditCard, Truck, Shield } from 'lucide-react';

const checkoutSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  notes: z.string().optional(),
});

// Countries list (focusing on African countries and major global ones)
const COUNTRIES = [
  'Zimbabwe',
  'South Africa',
  'Botswana',
  'Zambia',
  'Mozambique',
  'Tanzania',
  'Kenya',
  'Uganda',
  'Ghana',
  'Nigeria',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'China',
  'India',
  'Brazil',
  'Other'
].sort();

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const { cart, cartTotal, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: '',
      shippingAddress: {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Zimbabwe',
      },
      billingAddress: {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Zimbabwe',
      },
    },
  });

  const createOrderMutation = useMutation(
    (orderData: Parameters<typeof ordersAPI.createOrder>[0]) => ordersAPI.createOrder(orderData),
    {
      onSuccess: (response) => {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${response.data.order._id}`);
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
        toast.error(errorMessage);
      },
    }
  );

  const onSubmit = (data: CheckoutFormData) => {
    console.log('Form submitted with data:', data);
    
    // If not using same billing address, validate billing fields manually
    if (!sameBillingAddress) {
      const billingErrors: any = {};
      if (!data.billingAddress.street) billingErrors.street = 'Street address is required';
      if (!data.billingAddress.city) billingErrors.city = 'City is required';
      if (!data.billingAddress.province) billingErrors.province = 'Province is required';
      if (!data.billingAddress.postalCode) billingErrors.postalCode = 'Postal code is required';
      if (!data.billingAddress.country) billingErrors.country = 'Country is required';
      
      if (Object.keys(billingErrors).length > 0) {
        Object.entries(billingErrors).forEach(([field, message]) => {
          form.setError(`billingAddress.${field}` as any, { message });
        });
        return;
      }
    }
    
    const billingAddress = sameBillingAddress ? data.shippingAddress : data.billingAddress;
    
    console.log('Order data being sent:', {
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      billingAddress,
      notes: data.notes,
    });
    
    createOrderMutation.mutate({
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      billingAddress,
      notes: data.notes,
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <a href="/products">Continue Shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal;
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 10;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-black mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Payment Method */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      onValueChange={(value) => form.setValue('paymentMethod', value)}
                      defaultValue={form.watch('paymentMethod')}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecocash">EcoCash</SelectItem>
                        <SelectItem value="onemoney">OneMoney</SelectItem>
                        <SelectItem value="telecash">TeleCash</SelectItem>
                        <SelectItem value="zipit">ZipIt</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.paymentMethod && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.paymentMethod.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      {...form.register('shippingAddress.street')}
                      placeholder="Street Address"
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                    {form.formState.errors.shippingAddress?.street && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.shippingAddress.street.message}
                      </p>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          {...form.register('shippingAddress.city')}
                          placeholder="City"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        {form.formState.errors.shippingAddress?.city && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.shippingAddress.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Input
                          {...form.register('shippingAddress.province')}
                          placeholder="Province"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        {form.formState.errors.shippingAddress?.province && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.shippingAddress.province.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          {...form.register('shippingAddress.postalCode')}
                          placeholder="Postal Code"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        {form.formState.errors.shippingAddress?.postalCode && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.shippingAddress.postalCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Select 
                          onValueChange={(value) => form.setValue('shippingAddress.country', value)}
                          defaultValue={form.watch('shippingAddress.country') || 'Zimbabwe'}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.shippingAddress?.country && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.shippingAddress.country.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Address */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id="same-billing"
                        checked={sameBillingAddress}
                        onCheckedChange={setSameBillingAddress}
                      />
                      <label htmlFor="same-billing" className="text-sm cursor-pointer">
                        Same as shipping address
                      </label>
                    </div>

                    {!sameBillingAddress && (
                      <div className="space-y-4">
                        <Input
                          {...form.register('billingAddress.street')}
                          placeholder="Street Address"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            {...form.register('billingAddress.city')}
                            placeholder="City"
                            className="border-gray-300 focus:border-black focus:ring-black"
                          />
                          <Input
                            {...form.register('billingAddress.province')}
                            placeholder="Province"
                            className="border-gray-300 focus:border-black focus:ring-black"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            {...form.register('billingAddress.postalCode')}
                            placeholder="Postal Code"
                            className="border-gray-300 focus:border-black focus:ring-black"
                          />
                          <Select 
                            onValueChange={(value) => form.setValue('billingAddress.country', value)}
                            defaultValue={form.watch('billingAddress.country') || 'Zimbabwe'}
                          >
                            <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card className="border-gray-200">
                  <CardContent className="pt-6">
                    <Textarea
                      {...form.register('notes')}
                      placeholder="Order notes (optional)"
                      rows={3}
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                  </CardContent>
                </Card>

                {/* Debug: Show form errors */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                    <p className="text-red-800 font-medium mb-2">Please fix the following errors:</p>
                    <ul className="text-red-700 text-sm space-y-1">
                      {Object.entries(form.formState.errors).map(([key, error]) => (
                        <li key={key}>
                          {key}: {error?.message || 'This field is required'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={createOrderMutation.isLoading}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 text-lg"
                  onClick={() => {
                    console.log('Button clicked, form errors:', form.formState.errors);
                    console.log('Form values:', form.getValues());
                  }}
                >
                  {createOrderMutation.isLoading ? 'Placing Order...' : `Place Order - ${formatPrice(total)}`}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border-gray-200 sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.productId} className="flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-black">{item.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-black">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <hr />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Your payment information is secure and encrypted
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}