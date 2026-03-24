import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

export const passwordSchema = z
  .string()
  .regex(
    passwordRegex,
    'Mật khẩu phải từ 8-128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
  );

export const validatePasswordPolicy = (password: string): void => {
  passwordSchema.parse(password);
};
