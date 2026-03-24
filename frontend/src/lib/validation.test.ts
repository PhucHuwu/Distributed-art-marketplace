import { describe, expect, it } from 'vitest';
import { addressSchema, loginSchema } from './validation';

describe('validation schemas', () => {
  it('validates login payload', () => {
    const parsed = loginSchema.safeParse({
      email: 'demo@example.com',
      password: 'password123',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid login payload', () => {
    const parsed = loginSchema.safeParse({
      email: 'invalid',
      password: '123',
    });

    expect(parsed.success).toBe(false);
  });

  it('validates address payload', () => {
    const parsed = addressSchema.safeParse({
      recipient: 'Nguyen Van A',
      phoneNumber: '0900000000',
      line1: '12 Nguyen Hue',
      ward: 'Ben Nghe',
      district: 'Quan 1',
      city: 'TP HCM',
    });

    expect(parsed.success).toBe(true);
  });
});
