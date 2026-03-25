'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Plus, Trash2, Star, Pencil, Check, X } from 'lucide-react';
import { profileApi } from '@/lib/api';
import type { UserProfile, UserAddress, AddressPayload } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { useAuth } from '@/context/auth-context';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner, ErrorState, InlineError } from '@/components/ui-states';

// ─── Profile form ─────────────────────────────────────────────────────────────
const profileSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Address form ─────────────────────────────────────────────────────────────
const addressSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  phoneNumber: z.string().min(1, 'Phone is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  ward: z.string().min(1, 'Ward is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});
type AddressFormValues = z.infer<typeof addressSchema>;

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AddressFormValues>;
  onSave: (data: AddressFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial,
  });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="bg-card border border-border p-6 grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="a-recipient" className="text-sm font-medium">
          Recipient *
        </Label>
        <Input id="a-recipient" {...register('recipient')} className="h-11" />
        {errors.recipient && <p className="text-xs text-destructive">{errors.recipient.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="a-phone" className="text-sm font-medium">
          Phone *
        </Label>
        <Input id="a-phone" {...register('phoneNumber')} className="h-11" />
        {errors.phoneNumber && (
          <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
        )}
      </div>
      <div className="sm:col-span-2 flex flex-col gap-2">
        <Label htmlFor="a-line1" className="text-sm font-medium">
          Address line 1 *
        </Label>
        <Input id="a-line1" {...register('line1')} className="h-11" />
        {errors.line1 && <p className="text-xs text-destructive">{errors.line1.message}</p>}
      </div>
      <div className="sm:col-span-2 flex flex-col gap-2">
        <Label htmlFor="a-line2" className="text-sm font-medium">
          Address line 2
        </Label>
        <Input id="a-line2" {...register('line2')} className="h-11" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="a-ward" className="text-sm font-medium">
          Ward *
        </Label>
        <Input id="a-ward" {...register('ward')} className="h-11" />
        {errors.ward && <p className="text-xs text-destructive">{errors.ward.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="a-district" className="text-sm font-medium">
          District *
        </Label>
        <Input id="a-district" {...register('district')} className="h-11" />
        {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="a-city" className="text-sm font-medium">
          City *
        </Label>
        <Input id="a-city" {...register('city')} className="h-11" />
        {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="a-postal" className="text-sm font-medium">
          Postal code
        </Label>
        <Input id="a-postal" {...register('postalCode')} className="h-11" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
        <input
          type="checkbox"
          id="a-default"
          {...register('isDefault')}
          className="w-4 h-4 accent-accent"
        />
        <Label htmlFor="a-default" className="cursor-pointer text-sm">
          Set as default address
        </Label>
      </div>
      <div className="sm:col-span-2 flex gap-3 pt-4 border-t border-border mt-2">
        <Button type="submit" disabled={isSubmitting} className="btn-premium">
          <Check className="w-4 h-4 mr-2" /> {isSubmitting ? 'Saving...' : 'Save Address'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
      </div>
    </form>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(
    null,
  );
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<{
    message: string;
    correlationId?: string | null;
  } | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a] = await Promise.all([profileApi.getMe(), profileApi.listAddresses()]);
      setProfile(p);
      setAddresses(a);
    } catch (err) {
      if (isApiError(err)) setError({ message: err.message, correlationId: err.correlationId });
      else setError({ message: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName ?? '',
        phoneNumber: profile.phoneNumber ?? '',
        avatarUrl: profile.avatarUrl ?? '',
      });
    }
  }, [profile, reset]);

  const onSaveProfile = async (data: ProfileFormValues) => {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const updated = await profileApi.updateMe({
        fullName: data.fullName || undefined,
        phoneNumber: data.phoneNumber || undefined,
        avatarUrl: data.avatarUrl || undefined,
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      if (isApiError(err))
        setProfileError({ message: err.message, correlationId: err.correlationId });
      else setProfileError({ message: 'Failed to update profile.' });
    }
  };

  const onCreateAddress = async (data: AddressFormValues) => {
    const addr = await profileApi.createAddress(data as AddressPayload);
    setAddresses((prev) => [addr, ...prev.filter((item) => item.id !== addr.id)]);
    setShowNewAddress(false);
  };

  const onUpdateAddress = async (addressId: string, data: AddressFormValues) => {
    const updated = await profileApi.updateAddress(addressId, data as Partial<AddressPayload>);
    setAddresses((prev) => prev.map((a) => (a.id === addressId ? updated : a)));
    setEditingAddressId(null);
  };

  const onDeleteAddress = async (addressId: string) => {
    await profileApi.deleteAddress(addressId);
    setAddresses((prev) => prev.filter((a) => a.id !== addressId));
  };

  const onSetDefault = async (addressId: string) => {
    const updated = await profileApi.updateAddress(addressId, { isDefault: true });
    setAddresses((prev) =>
      prev.map((a) => (a.id === addressId ? updated : { ...a, isDefault: false })),
    );
  };

  if (loading)
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );

  if (error)
    return (
      <div className="py-20">
        <ErrorState
          message={error.message}
          correlationId={error.correlationId}
          onRetry={loadData}
        />
      </div>
    );

  return (
    <div className="flex flex-col gap-12 fade-in">
      {/* Profile section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Personal Information
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <span className="ml-auto text-xs uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1.5 font-medium">
            {user?.role}
          </span>
        </div>

        <form
          onSubmit={handleSubmit(onSaveProfile)}
          className="bg-card border border-border p-6 grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Your name"
              className="h-11"
            />
            {profileErrors.fullName && (
              <p className="text-xs text-destructive">{profileErrors.fullName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone number
            </Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber')}
              placeholder="+1 234 567 8900"
              className="h-11"
            />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-2">
            <Label htmlFor="avatarUrl" className="text-sm font-medium">
              Avatar URL
            </Label>
            <Input
              id="avatarUrl"
              {...register('avatarUrl')}
              placeholder="https://..."
              className="h-11"
            />
            {profileErrors.avatarUrl && (
              <p className="text-xs text-destructive">{profileErrors.avatarUrl.message}</p>
            )}
          </div>
          {profileError && (
            <div className="sm:col-span-2">
              <InlineError
                message={profileError.message}
                correlationId={profileError.correlationId}
              />
            </div>
          )}
          {profileSuccess && (
            <div className="sm:col-span-2 flex items-center gap-2 text-accent">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Profile updated successfully.</span>
            </div>
          )}
          <div className="sm:col-span-2 pt-4 border-t border-border mt-2">
            <Button type="submit" disabled={profileSubmitting} className="btn-premium">
              {profileSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </section>

      {/* Addresses section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-foreground">Shipping Addresses</h2>
          </div>
          <Button variant="outline" onClick={() => setShowNewAddress((v) => !v)}>
            <Plus className="w-4 h-4 mr-2" /> {showNewAddress ? 'Cancel' : 'Add Address'}
          </Button>
        </div>

        {showNewAddress && (
          <div className="mb-6">
            <AddressForm onSave={onCreateAddress} onCancel={() => setShowNewAddress(false)} />
          </div>
        )}

        {addresses.length === 0 && !showNewAddress && (
          <div className="bg-secondary/50 p-12 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No addresses saved yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowNewAddress(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Address
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {addresses.map((addr) =>
            editingAddressId === addr.id ? (
              <AddressForm
                key={addr.id}
                initial={{
                  recipient: addr.recipient,
                  phoneNumber: addr.phoneNumber,
                  line1: addr.line1,
                  line2: addr.line2 || undefined,
                  ward: addr.ward,
                  district: addr.district,
                  city: addr.city,
                  postalCode: addr.postalCode || undefined,
                  isDefault: addr.isDefault,
                }}
                onSave={(data) => onUpdateAddress(addr.id, data)}
                onCancel={() => setEditingAddressId(null)}
              />
            ) : (
              <div
                key={addr.id}
                className={`bg-card border p-6 transition-colors ${addr.isDefault ? 'border-accent' : 'border-border hover:border-foreground/20'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-foreground">{addr.recipient}</p>
                      {addr.isDefault && (
                        <span className="text-xs uppercase tracking-wider bg-accent/10 text-accent px-2 py-1 font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{addr.phoneNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}, {addr.ward}, {addr.district},{' '}
                      {addr.city}
                      {addr.postalCode ? ` ${addr.postalCode}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Set as default"
                        onClick={() => onSetDefault(addr.id)}
                        className="text-muted-foreground hover:text-accent"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingAddressId(addr.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteAddress(addr.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RouteGuard>
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-accent mb-2">Account</p>
          <h1 className="text-4xl font-serif font-medium text-foreground">My Profile</h1>
        </div>
        <ProfileContent />
      </div>
    </RouteGuard>
  );
}
