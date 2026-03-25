'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Check, Loader2, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { cartApi, ordersApi, paymentsApi, profileApi } from '@/lib/api';
import type { Cart, UserAddress, Order } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { useAuth } from '@/context/auth-context';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner, InlineError, ErrorState } from '@/components/ui-states';

const addressSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  ward: z.string().min(1, 'Ward is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const POLL_INTERVAL = 2000;
const POLL_MAX = 30;

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

function computeCartTotal(cart: Cart | null): number {
  if (!cart) {
    return 0;
  }

  return cart.items.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
}

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<{
    message: string;
    correlationId?: string | null;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<{
    message: string;
    correlationId?: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });

  const loadInit = useCallback(async () => {
    setLoadingInit(true);
    setInitError(null);
    try {
      const [cartData, addrData] = await Promise.all([
        cartApi.getCart(),
        profileApi.listAddresses(),
      ]);
      setCart(cartData);
      setAddresses(addrData);
      const def = addrData.find((a) => a.isDefault);
      setSelectedAddressId(def?.id || addrData[0]?.id || null);
    } catch (err) {
      if (isApiError(err)) {
        setInitError({ message: err.message, correlationId: err.correlationId });
      } else {
        setInitError({ message: 'Failed to load checkout data.' });
      }
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => {
    loadInit();
  }, [loadInit]);

  const pollOrder = async (orderId: string): Promise<Order> => {
    let attempts = 0;
    while (attempts < POLL_MAX) {
      const order = await ordersApi.getOrder(orderId);
      if (
        order.status === 'AWAITING_PAYMENT' ||
        order.status === 'FAILED' ||
        order.status === 'CANCELLED'
      ) {
        return order;
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      attempts++;
    }
    throw new Error('Order status timed out. Please check your orders page.');
  };

  const saveAndSelectNewAddress = async (data: AddressFormValues) => {
    const addr = await profileApi.createAddress({ ...data, isDefault: false });
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (!addr) {
      setCheckoutError({ message: 'Please select or create a shipping address.' });
      return;
    }

    try {
      setProcessingStep('Creating order...');
      const order = await ordersApi.createOrder({
        recipient: addr.recipient,
        phoneNumber: addr.phoneNumber,
        line1: addr.line1,
        line2: addr.line2 || undefined,
        ward: addr.ward,
        district: addr.district,
        city: addr.city,
        postalCode: addr.postalCode || undefined,
      });

      setProcessingStep('Confirming order...');
      const confirmedOrder = await pollOrder(order.id);

      if (confirmedOrder.status === 'FAILED' || confirmedOrder.status === 'CANCELLED') {
        router.push(`/orders/${confirmedOrder.id}`);
        return;
      }

      setProcessingStep('Initiating payment...');
      const orderTotal = Number(confirmedOrder.totalAmount);
      const payment = await paymentsApi.createPayment({
        orderId: confirmedOrder.id,
        amount: orderTotal,
        currency: confirmedOrder.currency,
        provider: 'default',
        userId: user?.userId,
      });

      router.push(`/payments/result?orderId=${confirmedOrder.id}&paymentId=${payment.id}`);
    } catch (err) {
      setProcessingStep(null);
      if (isApiError(err)) {
        setCheckoutError({ message: err.message, correlationId: err.correlationId });
      } else if (err instanceof Error) {
        setCheckoutError({ message: err.message });
      } else {
        setCheckoutError({ message: 'Checkout failed. Please try again.' });
      }
    }
  };

  if (loadingInit)
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );

  if (initError)
    return (
      <div className="py-20">
        <ErrorState
          message={initError.message}
          correlationId={initError.correlationId}
          onRetry={loadInit}
        />
      </div>
    );

  const items = cart?.items ?? [];
  const currency = 'VND';
  const total = computeCartTotal(cart);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 fade-in">
      {/* Left: Shipping */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl font-medium text-foreground">Shipping Address</h2>
          </div>

          {addresses.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setShowNewAddressForm(false);
                  }}
                  className={`text-left p-5 border transition-all ${
                    selectedAddressId === addr.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-card hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground mb-1">{addr.recipient}</p>
                      <p className="text-sm text-muted-foreground">{addr.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}, {addr.ward}, {addr.district},{' '}
                        {addr.city}
                      </p>
                      {addr.isDefault && (
                        <span className="inline-block text-xs text-accent font-medium mt-2 uppercase tracking-wide">
                          Default
                        </span>
                      )}
                    </div>
                    {selectedAddressId === addr.id && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-4 h-4 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setShowNewAddressForm((v) => !v)}>
            <Plus className="w-4 h-4 mr-2" />
            {showNewAddressForm ? 'Cancel' : 'Add New Address'}
          </Button>

          {showNewAddressForm && (
            <form
              onSubmit={handleSubmit(saveAndSelectNewAddress)}
              className="mt-6 bg-card border border-border p-6 grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="recipient" className="text-sm font-medium">
                  Recipient *
                </Label>
                <Input id="recipient" {...register('recipient')} className="h-11" />
                {errors.recipient && (
                  <p className="text-xs text-destructive">{errors.recipient.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone *
                </Label>
                <Input id="phoneNumber" {...register('phoneNumber')} className="h-11" />
                {errors.phoneNumber && (
                  <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="line1" className="text-sm font-medium">
                  Address line 1 *
                </Label>
                <Input id="line1" {...register('line1')} className="h-11" />
                {errors.line1 && <p className="text-xs text-destructive">{errors.line1.message}</p>}
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="line2" className="text-sm font-medium">
                  Address line 2
                </Label>
                <Input id="line2" {...register('line2')} className="h-11" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ward" className="text-sm font-medium">
                  Ward *
                </Label>
                <Input id="ward" {...register('ward')} className="h-11" />
                {errors.ward && <p className="text-xs text-destructive">{errors.ward.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="district" className="text-sm font-medium">
                  District *
                </Label>
                <Input id="district" {...register('district')} className="h-11" />
                {errors.district && (
                  <p className="text-xs text-destructive">{errors.district.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City *
                </Label>
                <Input id="city" {...register('city')} className="h-11" />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="postalCode" className="text-sm font-medium">
                  Postal code
                </Label>
                <Input id="postalCode" {...register('postalCode')} className="h-11" />
              </div>
              <div className="sm:col-span-2 pt-4 border-t border-border mt-2">
                <Button type="submit" disabled={formSubmitting} className="btn-premium">
                  {formSubmitting ? 'Saving...' : 'Save Address'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Right: Summary + checkout */}
      <div>
        <div className="bg-secondary/50 p-8 sticky top-24">
          <h2 className="font-serif text-xl font-medium text-foreground mb-6">Order Summary</h2>

          <div className="flex flex-col gap-3 text-sm border-b border-border pb-6 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground truncate max-w-[60%]">
                  Artwork #{item.artworkId.slice(0, 8)}{' '}
                  <span className="text-foreground/50">x{item.quantity}</span>
                </span>
                <span className="text-foreground">
                  {formatPrice(Number(item.unitPrice) * item.quantity, currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-sm border-b border-border pb-6 mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground">{formatPrice(total, currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="text-accent">Free</span>
            </div>
          </div>

          <div className="flex justify-between font-medium text-lg mb-8">
            <span className="font-serif">Total</span>
            <span className="font-serif">{formatPrice(total, currency)}</span>
          </div>

          {checkoutError && (
            <div className="mb-6">
              <InlineError
                message={checkoutError.message}
                correlationId={checkoutError.correlationId}
              />
            </div>
          )}

          {processingStep && (
            <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground bg-secondary p-4">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{processingStep}</span>
            </div>
          )}

          <Button
            className="w-full h-14 text-base tracking-wide btn-premium"
            disabled={!!processingStep || !selectedAddressId}
            onClick={handleCheckout}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {processingStep ? 'Processing...' : 'Place Order'}
          </Button>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Free worldwide shipping</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RouteGuard>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">Secure Checkout</p>
          <h1 className="text-4xl font-serif font-medium text-foreground">Complete Your Order</h1>
        </div>
        <CheckoutContent />
      </div>
    </RouteGuard>
  );
}
