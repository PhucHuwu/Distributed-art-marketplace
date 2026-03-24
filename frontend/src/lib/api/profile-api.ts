import { request } from '@/lib/http-client';
import { UserAddress, UserProfile } from '@/types/user';

export async function getMyProfile(token: string) {
  return request<UserProfile>('/users/me', { token });
}

export async function updateMyProfile(
  token: string,
  payload: {
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  },
) {
  return request<UserProfile>('/users/me', {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function listMyAddresses(token: string) {
  return request<UserAddress[]>('/users/me/addresses', { token });
}

export async function createAddress(
  token: string,
  payload: {
    recipient: string;
    phoneNumber: string;
    line1: string;
    line2?: string;
    ward: string;
    district: string;
    city: string;
    postalCode?: string;
    isDefault?: boolean;
  },
) {
  return request<UserAddress>('/users/me/addresses', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateAddress(
  token: string,
  addressId: string,
  payload: Partial<{
    recipient: string;
    phoneNumber: string;
    line1: string;
    line2: string;
    ward: string;
    district: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
  }>,
) {
  return request<UserAddress>(`/users/me/addresses/${addressId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function deleteAddress(token: string, addressId: string) {
  return request<{ deleted: true }>(`/users/me/addresses/${addressId}`, {
    method: 'DELETE',
    token,
  });
}
