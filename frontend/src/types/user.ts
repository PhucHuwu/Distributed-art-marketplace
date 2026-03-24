export type UserProfile = {
  id: string;
  userId: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserAddress = {
  id: string;
  userId: string;
  profileId: string;
  recipient: string;
  phoneNumber: string;
  line1: string;
  line2: string | null;
  ward: string;
  district: string;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
