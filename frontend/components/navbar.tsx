'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, LogOut, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_LINKS = [
  { href: '/', label: 'Bộ sưu tập' },
  { href: '/orders/me', label: 'Đơn hàng của tôi' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass border-b border-border/50 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <img
              src="/logo-hon-tranh-viet-mark.svg"
              alt="Logo Hồn Tranh Việt"
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="font-serif text-2xl tracking-tight text-foreground hidden sm:block">
              Hồn Tranh Việt
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-12">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm tracking-wide uppercase font-medium transition-colors link-underline ${
                  pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 w-full h-px bg-accent" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/cart" aria-label="Giỏ hàng">
              <Button
                variant="ghost"
                size="icon"
                className="relative w-10 h-10 rounded-full hover:bg-secondary transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-secondary transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Đăng nhập với
                    </p>
                    <p className="text-sm font-medium truncate mt-0.5">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer">
                    <Link href="/profile">
                      <User className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer">
                    <Link href="/orders/me">
                      <Package className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span>Lịch sử đơn hàng</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="py-2.5 px-3 text-destructive cursor-pointer focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-sm font-medium tracking-wide">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="text-sm font-medium tracking-wide btn-premium">
                    Tạo tài khoản
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-foreground hover:bg-secondary rounded-full transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass border-t border-border/50 px-6 py-6 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-base font-medium tracking-wide py-2 transition-colors ${
                pathname === link.href
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            onClick={() => setMobileOpen(false)}
            className="text-base font-medium text-muted-foreground py-2 hover:text-foreground transition-colors"
          >
            Giỏ hàng
          </Link>

          <div className="h-px bg-border my-2" />

          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-muted-foreground py-2 hover:text-foreground transition-colors"
              >
                Hồ sơ
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="text-left text-base font-medium text-destructive py-2"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Tạo tài khoản</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
