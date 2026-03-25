# Frontend - Distributed Art Marketplace

Frontend storefront cho người dùng cuối: catalog, giỏ hàng, checkout, kết quả thanh toán, hồ sơ cá nhân, lịch sử đơn hàng.

## Stack

- Next.js App Router + TypeScript
- React 19
- Tailwind CSS v4
- React Hook Form + Zod

## Environment

Tạo file `.env.local` từ mẫu:

```bash
cp .env.example .env.local
```

Biến môi trường bắt buộc:

- `NEXT_PUBLIC_API_BASE_URL` (mặc định local: `http://localhost/api`)

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

## API integration flow

Frontend gọi qua gateway theo các route:

- Auth: `/auth/register`, `/auth/login`, `/auth/verify`
- Catalog: `/catalog/artworks`, `/catalog/artworks/:idOrSlug`, `/catalog/artists`, `/catalog/categories`
- Inventory: `/inventory/:artworkId`
- Cart/Order: `/orders/cart`, `/orders/cart/items`, `/orders`, `/orders/me`, `/orders/:orderId`
- Payment: `/payments`, `/payments/:id`
- Profile/Address: `/users/me`, `/users/me/addresses`

Mọi request gửi `x-correlation-id`. Nếu backend trả `correlationId`, UI hiển thị để hỗ trợ trace lỗi.

## Core pages

- `/`: catalog listing + search/filter/pagination
- `/artworks/[idOrSlug]`: chi tiết tác phẩm + tồn kho + thêm giỏ
- `/auth/login`, `/auth/register`
- `/cart`
- `/checkout`
- `/payments/result`
- `/orders/me`, `/orders/[orderId]`
- `/profile`

## Session and security notes

- JWT lưu trong `sessionStorage` key `dam.auth.token`.
- Route cần đăng nhập được bảo vệ bằng `RouteGuard`.
- Không log token/secret trên UI.

## Smoke scenario (manual)

1. Đăng ký / đăng nhập.
2. Vào catalog, mở chi tiết tác phẩm, thêm vào giỏ.
3. Vào checkout, tạo/chọn địa chỉ.
4. Tạo đơn + tạo payment.
5. Theo dõi trạng thái tại trang payment result và order detail.

## Integration checklist

Trước khi chạy smoke end-to-end:

1. Khởi động backend stack ở root repo: `npm run compose:up`.
2. Kiểm tra gateway/service health: `npm run smoke:local`.
3. Chạy frontend local (`npm run dev`) và thực hiện lại 5 bước smoke scenario.

Nếu `npm run compose:up` lỗi Docker daemon (`/var/run/docker.sock`), cần bật Docker Desktop/daemon trước khi test integration.
