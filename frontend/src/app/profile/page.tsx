'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageShell } from '@/components/page-shell';
import { ProtectedRoute } from '@/components/protected-route';
import { ErrorNotice, LoadingBlock } from '@/components/ui-states';
import { useAuth } from '@/components/auth-provider';
import {
  createAddress,
  deleteAddress,
  getMyProfile,
  listMyAddresses,
  updateAddress,
  updateMyProfile,
} from '@/lib/api/profile-api';
import { addressSchema, getFirstError } from '@/lib/validation';
import { UserAddress } from '@/types/user';

export default function ProfilePage() {
  const auth = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
    avatarUrl: '',
  });
  const [addressForm, setAddressForm] = useState({
    recipient: '',
    phoneNumber: '',
    line1: '',
    line2: '',
    ward: '',
    district: '',
    city: '',
    postalCode: '',
    isDefault: false,
  });
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    if (!auth.session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextProfile, nextAddresses] = await Promise.all([
        getMyProfile(auth.session.token),
        listMyAddresses(auth.session.token),
      ]);
      setAddresses(nextAddresses);
      setProfileForm({
        fullName: nextProfile.fullName || '',
        phoneNumber: nextProfile.phoneNumber || '',
        avatarUrl: nextProfile.avatarUrl || '',
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [auth.session]);

  useEffect(() => {
    if (auth.session) {
      void fetchData();
    }
  }, [auth.session, fetchData]);

  async function saveProfile() {
    if (!auth.session) {
      return;
    }
    setSavingProfile(true);
    setFormError('');
    try {
      const updated = await updateMyProfile(auth.session.token, {
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
        avatarUrl: profileForm.avatarUrl,
      });
      setProfileForm({
        fullName: updated.fullName || '',
        phoneNumber: updated.phoneNumber || '',
        avatarUrl: updated.avatarUrl || '',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  }

  async function addAddress() {
    if (!auth.session) {
      return;
    }
    setSavingAddress(true);
    setFormError('');
    const parsed = addressSchema.safeParse(addressForm);
    if (!parsed.success) {
      setFormError(getFirstError(parsed.error));
      setSavingAddress(false);
      return;
    }

    try {
      const created = await createAddress(auth.session.token, parsed.data);
      setAddresses((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setAddressForm({
        recipient: '',
        phoneNumber: '',
        line1: '',
        line2: '',
        ward: '',
        district: '',
        city: '',
        postalCode: '',
        isDefault: false,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể thêm địa chỉ');
    } finally {
      setSavingAddress(false);
    }
  }

  async function markDefault(address: UserAddress) {
    if (!auth.session) {
      return;
    }
    try {
      await updateAddress(auth.session.token, address.id, { isDefault: true });
      const fresh = await listMyAddresses(auth.session.token);
      setAddresses(fresh);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể đổi địa chỉ mặc định');
    }
  }

  async function removeAddress(address: UserAddress) {
    if (!auth.session) {
      return;
    }
    try {
      await deleteAddress(auth.session.token, address.id);
      const fresh = await listMyAddresses(auth.session.token);
      setAddresses(fresh);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể xóa địa chỉ');
    }
  }

  return (
    <ProtectedRoute>
      <PageShell>
        <h1 style={{ marginBottom: 12 }}>Tài khoản của tôi</h1>
        {loading ? <LoadingBlock label="Đang tải thông tin hồ sơ" /> : null}
        {!loading && error ? <ErrorNotice error={error} onRetry={() => void fetchData()} /> : null}

        {!loading && !error ? (
          <div className="grid" style={{ gap: 16 }}>
            <section className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 10 }}>Thông tin cá nhân</h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <label className="field">
                  Họ tên
                  <input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </label>
                <label className="field">
                  Số điện thoại
                  <input
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </label>
                <label className="field" style={{ gridColumn: '1 / -1' }}>
                  Avatar URL
                  <input
                    value={profileForm.avatarUrl}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                  />
                </label>
              </div>
              <button className="btn btn-primary" disabled={savingProfile} onClick={() => void saveProfile()}>
                {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </section>

            <section className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 10 }}>Sổ địa chỉ</h2>
              <div className="grid" style={{ gap: 10, marginBottom: 12 }}>
                {addresses.map((address) => (
                  <article key={address.id} className="card" style={{ padding: 10 }}>
                    <p style={{ margin: 0 }}>
                      <strong>{address.recipient}</strong> - {address.phoneNumber}{' '}
                      {address.isDefault ? <span className="muted">(Mặc định)</span> : null}
                    </p>
                    <p className="muted" style={{ marginBottom: 8 }}>
                      {address.line1}, {address.ward}, {address.district}, {address.city}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {!address.isDefault ? (
                        <button className="btn btn-ghost" onClick={() => void markDefault(address)}>
                          Đặt mặc định
                        </button>
                      ) : null}
                      <button className="btn btn-ghost" onClick={() => void removeAddress(address)}>
                        Xóa
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <h3 style={{ marginBottom: 10 }}>Thêm địa chỉ mới</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label className="field">
                  Người nhận
                  <input
                    value={addressForm.recipient}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, recipient: e.target.value }))}
                  />
                </label>
                <label className="field">
                  Số điện thoại
                  <input
                    value={addressForm.phoneNumber}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </label>
                <label className="field" style={{ gridColumn: '1 / -1' }}>
                  Địa chỉ
                  <input
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
                  />
                </label>
                <label className="field">
                  Phường/Xã
                  <input
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, ward: e.target.value }))}
                  />
                </label>
                <label className="field">
                  Quận/Huyện
                  <input
                    value={addressForm.district}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                  />
                </label>
                <label className="field">
                  Tỉnh/Thành
                  <input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </label>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                />
                Đặt làm địa chỉ mặc định
              </label>

              {formError ? <p className="error-text">{formError}</p> : null}
              <button className="btn btn-primary" disabled={savingAddress} onClick={() => void addAddress()}>
                {savingAddress ? 'Đang thêm...' : 'Thêm địa chỉ'}
              </button>
            </section>
          </div>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
