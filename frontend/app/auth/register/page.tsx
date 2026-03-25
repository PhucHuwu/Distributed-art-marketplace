'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { isApiError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineError } from '@/components/ui-states';
import { Check } from 'lucide-react';

const schema = z
  .object({
    email: z.string().email('Vui lòng nhập email hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

const BENEFITS = [
  'Tiếp cận tác phẩm tuyển chọn',
  'Gợi ý phù hợp gu thẩm mỹ',
  'Giao dịch an toàn',
  'Giao hàng toàn quốc',
];

export default function RegisterPage() {
  const { user, loading, register: registerUser } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState<{
    message: string;
    correlationId?: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    try {
      await registerUser(data.email, data.password);
      router.replace('/');
    } catch (err) {
      if (isApiError(err)) {
        setApiError({ message: err.message, correlationId: err.correlationId });
      } else {
        setApiError({ message: 'Đăng ký thất bại. Vui lòng thử lại.' });
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 order-2 lg:order-1">
        <div className="w-full max-w-md fade-in">
          <div className="mb-10">
            <Link href="/" className="lg:hidden inline-flex items-center gap-3 mb-8">
              <img src="/logo-hon-tranh-viet-mark.svg" alt="Logo Hồn Tranh Việt" className="h-10 w-10" />
              <span className="font-serif text-2xl tracking-tight">Hồn Tranh Việt</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
               Tạo tài khoản
            </h1>
            <p className="text-muted-foreground mt-3">Tham gia cộng đồng yêu nghệ thuật Việt</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Địa chỉ email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className="h-12"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Xác nhận mật khẩu
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                className="h-12"
                {...register('confirmPassword')}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {apiError && (
              <InlineError message={apiError.message} correlationId={apiError.correlationId} />
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base tracking-wide btn-premium"
            >
              {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-8">
            Bạn đã có tài khoản?{' '}
            <Link
              href="/auth/login"
              className="text-foreground font-medium hover:text-accent transition-colors link-underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background relative overflow-hidden order-1 lg:order-2">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <Link href="/" className="inline-flex items-center gap-3 mb-12">
            <img src="/logo-hon-tranh-viet-mark.svg" alt="Logo Hồn Tranh Việt" className="h-12 w-12" />
            <span className="font-serif text-3xl tracking-tight">Hồn Tranh Việt</span>
          </Link>
          <h2 className="text-4xl font-serif font-medium leading-tight mb-6">
            Bắt đầu hành trình
            <br />
            sưu tầm tranh ngay
          </h2>
          <p className="text-background/70 text-lg leading-relaxed max-w-md mb-10">
            Khám phá những tác phẩm đặc sắc từ các hoạ sĩ tài năng và xây dựng bộ sưu tập mang dấu
            ấn riêng của bạn.
          </p>

          {/* Benefits list */}
          <ul className="space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-background/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-background/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
