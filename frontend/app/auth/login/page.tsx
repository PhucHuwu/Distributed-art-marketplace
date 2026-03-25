'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { isApiError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineError } from '@/components/ui-states';

const schema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const redirectAfterAuth = next.startsWith('/auth') ? '/' : next;

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
      router.replace(redirectAfterAuth);
    }
  }, [loading, user, router, redirectAfterAuth]);

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
      await login(data.email, data.password);
      router.replace(redirectAfterAuth);
    } catch (err) {
      if (isApiError(err)) {
        setApiError({ message: err.message, correlationId: err.correlationId });
      } else {
        setApiError({ message: 'Đăng nhập thất bại. Vui lòng thử lại.' });
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <Link href="/" className="inline-flex items-center gap-3 mb-12">
            <img src="/logo-hon-tranh-viet-mark.svg" alt="Logo Hồn Tranh Việt" className="h-12 w-12" />
            <span className="font-serif text-3xl tracking-tight">Hồn Tranh Việt</span>
          </Link>
          <h2 className="text-4xl font-serif font-medium leading-tight mb-6">
            Chào mừng bạn quay lại
            <br />
            với bộ sưu tập của bạn
          </h2>
          <p className="text-background/70 text-lg leading-relaxed max-w-md">
            Đăng nhập để tiếp tục khám phá tác phẩm nghệ thuật và quản lý bộ sưu tập của bạn.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md fade-in">
          <div className="mb-10">
            <Link href="/" className="lg:hidden inline-flex items-center gap-3 mb-8">
              <img src="/logo-hon-tranh-viet-mark.svg" alt="Logo Hồn Tranh Việt" className="h-10 w-10" />
              <span className="font-serif text-2xl tracking-tight">Hồn Tranh Việt</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground">Đăng nhập</h1>
            <p className="text-muted-foreground mt-3">
              Nhập thông tin để truy cập tài khoản của bạn
            </p>
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
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="h-12"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
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
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-8">
            {'Bạn chưa có tài khoản? '}
            <Link
              href="/auth/register"
              className="text-foreground font-medium hover:text-accent transition-colors link-underline"
            >
              Tạo tài khoản
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
