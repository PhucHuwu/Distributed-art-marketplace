# Frontend - Distributed Art Marketplace

Next.js storefront cho người dùng cuối: catalog, giỏ hàng, checkout, thanh toán, profile, lịch sử đơn hàng.

## Stack

- Next.js App Router + TypeScript
- React 19
- Zod (client validation)
- Vitest + Testing Library

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
npm run test
npm run build
```

## API integration flow

Frontend gọi qua gateway theo các route:

- Auth: `/auth/register`, `/auth/login`, `/auth/verify`
- Catalog: `/catalog/artworks`, `/catalog/artworks/:idOrSlug`, `/catalog/artists`, `/catalog/categories`
- Inventory: `/inventory/:artworkId`
- Cart/Order: `/orders/cart`, `/orders/cart/items`, `/orders`, `/orders/me`, `/orders/:orderId`
- Payment: `/payments`, `/payments/:id`
- Profile/Address: `/users/me`, `/users/me/addresses`

Tất cả request GUI đều gửi `x-correlation-id`. Nếu backend trả về lỗi có `correlationId`, UI hiển thị để trace.

## Core pages

- `/`: catalog listing + search/filter/pagination
- `/artworks/[idOrSlug]`: chi tiết tranh + tồn kho + thêm giỏ
- `/auth/login`, `/auth/register`
- `/cart`
- `/checkout`
- `/payments/result`
- `/orders/me`, `/orders/[orderId]`
- `/profile`

## Wording glossary

Sử dụng thống nhất các thuật ngữ sau trên UI, tài liệu và test cases:

- `Tác phẩm`: đơn vị sản phẩm nghệ thuật (thay cho "Artwork" hoặc "Sản phẩm" trong ngữ cảnh marketplace tranh).
- `Giỏ hàng`: nơi tạm giữ tác phẩm trước khi thanh toán (thay cho "Cart").
- `Đơn hàng`: thực thể mua hàng của người dùng (thay cho "Order").
- `Giao dịch`: bản ghi thanh toán cho đơn hàng (thay cho "Payment").
- `Hồ sơ`: thông tin tài khoản cá nhân của người dùng (thay cho "Profile").
- `Địa chỉ`: thông tin giao nhận thuộc hồ sơ người dùng (thay cho "Address").

Nguyên tắc viết:

- Ưu tiên tiếng Việt có dấu, tránh trộn Anh - Việt trên cùng màn hình.
- Dùng cùng một thuật ngữ cho cùng một khái niệm ở mọi trang.
- Chỉ giữ tiếng Anh cho mã kỹ thuật như `correlationId`, route API, tên biến hoặc status code.

## Session and security notes

- JWT lưu trong `sessionStorage` để hạn chế persistent storage không cần thiết.
- Route cần đăng nhập được bảo vệ bằng `ProtectedRoute`.
- Không log token/secret trên UI.

## Smoke scenario (manual)

1. Đăng ký/ đăng nhập.
2. Vào catalog, mở chi tiết tranh, thêm vào giỏ.
3. Vào checkout, tạo/chọn địa chỉ.
4. Tạo đơn + tạo payment.
5. Theo dõi trạng thái tại trang payment result và order detail.
