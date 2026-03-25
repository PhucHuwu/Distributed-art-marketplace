import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div>
        <p className="text-8xl font-serif font-bold text-accent">404</p>
        <h1 className="text-2xl font-semibold text-foreground mt-2">Không tìm thấy trang</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-md">
          Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
        </p>
      </div>
      <Link href="/">
        <Button>Quay về bộ sưu tập</Button>
      </Link>
    </div>
  );
}
