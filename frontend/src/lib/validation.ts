import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(8, 'Mat khau toi thieu 8 ky tu'),
});

export const addressSchema = z.object({
  recipient: z.string().min(1, 'Nhap nguoi nhan'),
  phoneNumber: z.string().min(1, 'Nhap so dien thoai'),
  line1: z.string().min(1, 'Nhap dia chi'),
  line2: z.string().optional(),
  ward: z.string().min(1, 'Nhap phuong xa'),
  district: z.string().min(1, 'Nhap quan huyen'),
  city: z.string().min(1, 'Nhap tinh thanh'),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export function getFirstError(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message || 'Du lieu khong hop le';
}
