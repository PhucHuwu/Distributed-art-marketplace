# Frontend Functional Spec

## 1) Mục tiêu

Tài liệu này mô tả đặc tả chức năng frontend cho dự án Distributed Art Marketplace, dùng để bàn giao cho team triển khai lại frontend với phong cách styles/design khác nhưng vẫn đảm bảo:

- Giữ nguyên các trang cốt lõi và luồng nghiệp vụ.
- Kết nối backend qua API Gateway đúng như source frontend hiện tại.
- Tuân thủ xử lý auth/session, trạng thái order/payment, và error envelope có `correlationId`.

Tài liệu chỉ tập trung vào chức năng, route, API contract và tiêu chí nghiệm thu. Không ràng buộc thiết kế giao diện.

## 2) In-scope / Out-of-scope

### In-scope

- Triển khai đầy đủ các trang nghiệp vụ:
  - Catalog listing, artwork detail.
  - Login, register.
  - Cart, checkout.
  - Payment result.
  - Order history, order detail.
  - User profile + address management.
  - Global loading/error/not-found.
- Tích hợp backend qua base URL từ môi trường `NEXT_PUBLIC_API_BASE_URL`.
- Chuẩn hóa HTTP client dùng chung cho tất cả request.
- Áp dụng JWT auth phía client:
  - Lưu token trong session storage.
  - Verify session khi app khởi động.
  - Bảo vệ route cần đăng nhập.
- Xử lý vòng đời trạng thái order/payment theo contract hiện tại.
- Hiển thị và truyền thông tin `correlationId` trong error/result để phục vụ trace.
- Triển khai trạng thái `loading / empty / error + retry` cho các màn hình dữ liệu.

### Out-of-scope

- Thiết kế visual (màu sắc, typography, spacing, layout style, animation).
- Yêu cầu pixel-perfect so với frontend hiện tại.
- Tối ưu SEO nâng cao, i18n nhiều ngôn ngữ, CMS/editor.
- Thay đổi nghiệp vụ backend hoặc thay đổi schema API.
- Thay đổi chiến lược persistence token (vẫn dùng session storage như hiện tại).

## 3) Technical Rules (bắt buộc giữ tương đương hành vi)

- Biến môi trường bắt buộc:
  - `NEXT_PUBLIC_API_BASE_URL` (local mặc định: `http://localhost/api`).
- Mọi request gửi qua HTTP client chung, kèm:
  - `Content-Type: application/json`
  - `x-correlation-id: <generated-id>`
  - `Authorization: Bearer <token>` cho endpoint cần auth.
- Parse response theo envelope:
  - Success: `{ success: true, data, meta?, correlationId? }`
  - Failure: `{ success: false, error: { code, message, details }, correlationId? }`
- Chuẩn hóa lỗi thành object tương đương `ApiError`:
  - `code`, `message`, `status`, `details`, `correlationId`.
- Các trang protected phải redirect về login với query `next` khi chưa đăng nhập.
- Token lưu trong session storage key `dam.auth.token`.
- App bootstrap phải verify token bằng `/auth/verify` trước khi coi user là authenticated.
- Không dùng mock data cho luồng nghiệp vụ chính.

## 4) Route Matrix

| Route                                  | Loại truy cập | Mục đích          | Chức năng bắt buộc                                                                                         | API chính                                                                                                                                                              |
| -------------------------------------- | ------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                    | Public        | Catalog listing   | Hiển thị danh sách tác phẩm, search, filter, phân trang                                                    | `GET /catalog/artworks`, `GET /catalog/artists`, `GET /catalog/categories`                                                                                             |
| `/artworks/[idOrSlug]`                 | Public        | Artwork detail    | Xem chi tiết tác phẩm, tồn kho, thêm vào giỏ; nếu chưa login thì redirect login kèm `next` khi add-to-cart | `GET /catalog/artworks/:idOrSlug`, `GET /inventory/:artworkId`, `POST /orders/cart/items`                                                                              |
| `/auth/login`                          | Public        | Đăng nhập         | Validate form, login, verify session, redirect `next` hoặc `/`                                             | `POST /auth/login`, `GET /auth/verify`                                                                                                                                 |
| `/auth/register`                       | Public        | Đăng ký           | Validate form, register, verify session, redirect `/`                                                      | `POST /auth/register`, `GET /auth/verify`                                                                                                                              |
| `/cart`                                | Protected     | Giỏ hàng          | Xem giỏ, tăng/giảm số lượng, xóa item, tổng kết giỏ, điều hướng checkout                                   | `GET /orders/cart`, `PUT /orders/cart/items/:itemId`, `DELETE /orders/cart/items/:itemId`                                                                              |
| `/checkout`                            | Protected     | Thanh toán        | Chọn/tạo địa chỉ, tạo order, chờ order sang `AWAITING_PAYMENT`, tạo payment, điều hướng result             | `GET /orders/cart`, `GET /users/me/addresses`, `POST /users/me/addresses`, `POST /orders`, `GET /orders/:orderId`, `POST /payments`                                    |
| `/payments/result?orderId=&paymentId=` | Protected     | Kết quả giao dịch | Tải payment + order, polling trạng thái trung gian, hiển thị lịch sử xử lý payment và `correlationId`      | `GET /payments/:id`, `GET /orders/:orderId`                                                                                                                            |
| `/orders/me`                           | Protected     | Lịch sử đơn       | Danh sách đơn hàng của user hiện tại                                                                       | `GET /orders/me`                                                                                                                                                       |
| `/orders/[orderId]`                    | Protected     | Chi tiết đơn      | Hiển thị trạng thái, item, địa chỉ giao hàng; polling khi trạng thái trung gian                            | `GET /orders/:orderId`                                                                                                                                                 |
| `/profile`                             | Protected     | Hồ sơ người dùng  | Xem/sửa profile, quản lý địa chỉ (list/create/delete/set default)                                          | `GET /users/me`, `PUT /users/me`, `GET /users/me/addresses`, `POST /users/me/addresses`, `PUT /users/me/addresses/:addressId`, `DELETE /users/me/addresses/:addressId` |
| `app/loading`                          | System        | Loading toàn cục  | Fallback loading khi route segment đang khởi tạo                                                           | N/A                                                                                                                                                                    |
| `app/error`                            | System        | Error toàn cục    | Error boundary toàn cục + hành động retry/reset                                                            | N/A                                                                                                                                                                    |
| `app/not-found`                        | System        | 404               | Trang không tìm thấy route                                                                                 | N/A                                                                                                                                                                    |

## 5) API Matrix

Ghi chú chung:

- Base URL: `${NEXT_PUBLIC_API_BASE_URL}`.
- Tất cả request gửi `x-correlation-id`.
- Endpoint protected yêu cầu header `Authorization: Bearer <token>`.

| Domain    | Method | Endpoint                         | Auth | Payload tối thiểu                                                                          | Response data chính (tóm tắt)                                    | Nghiệp vụ FE                                    |
| --------- | ------ | -------------------------------- | ---- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| Auth      | POST   | `/auth/register`                 | No   | `{ email, password }`                                                                      | `{ token, tokenType }`                                           | Tạo tài khoản, lưu token, verify session        |
| Auth      | POST   | `/auth/login`                    | No   | `{ email, password }`                                                                      | `{ token, tokenType }`                                           | Đăng nhập, lưu token, verify session            |
| Auth      | GET    | `/auth/verify`                   | Yes  | N/A                                                                                        | `{ userId, email, role, iat?, exp? }`                            | Build session user khi bootstrap/login/register |
| Catalog   | GET    | `/catalog/artworks`              | No   | Query: `page, limit, q, artist, category, minPrice, maxPrice`                              | `CatalogArtwork[]` + `meta` phân trang/filter                    | Dữ liệu trang catalog                           |
| Catalog   | GET    | `/catalog/artworks/:idOrSlug`    | No   | Path param                                                                                 | `CatalogArtwork`                                                 | Dữ liệu trang chi tiết tác phẩm                 |
| Catalog   | GET    | `/catalog/artists`               | No   | N/A                                                                                        | `CatalogArtist[]`                                                | Danh sách filter artist                         |
| Catalog   | GET    | `/catalog/categories`            | No   | N/A                                                                                        | `CatalogCategory[]`                                              | Danh sách filter category                       |
| Inventory | GET    | `/inventory/:artworkId`          | No   | Path param                                                                                 | `{ artworkId, onHandQty, reservedQty, availableQty, updatedAt }` | Hiển thị trạng thái tồn kho artwork             |
| Cart      | GET    | `/orders/cart`                   | Yes  | N/A                                                                                        | `Cart`                                                           | Tải giỏ hàng hiện tại                           |
| Cart      | POST   | `/orders/cart/items`             | Yes  | `{ artworkId, quantity, unitPrice }`                                                       | `Cart`                                                           | Thêm item vào giỏ                               |
| Cart      | PUT    | `/orders/cart/items/:itemId`     | Yes  | `{ quantity }`                                                                             | `Cart`                                                           | Cập nhật số lượng item                          |
| Cart      | DELETE | `/orders/cart/items/:itemId`     | Yes  | N/A                                                                                        | `Cart`                                                           | Xóa item khỏi giỏ                               |
| Order     | POST   | `/orders`                        | Yes  | `{ shippingAddress }`                                                                      | `Order`                                                          | Tạo đơn từ giỏ trong checkout                   |
| Order     | GET    | `/orders/me`                     | Yes  | N/A                                                                                        | `Order[]`                                                        | Lấy lịch sử đơn của user                        |
| Order     | GET    | `/orders/:orderId`               | Yes  | Path param                                                                                 | `Order`                                                          | Chi tiết đơn + polling trạng thái               |
| Payment   | POST   | `/payments`                      | Yes  | `{ orderId, amount, currency, provider, userId?, processingResult? }`                      | `Payment`                                                        | Khởi tạo giao dịch thanh toán                   |
| Payment   | GET    | `/payments/:id`                  | Yes  | Path param                                                                                 | `PaymentDetail` (`payment`, `history[]`)                         | Đồng bộ và hiển thị kết quả thanh toán          |
| Profile   | GET    | `/users/me`                      | Yes  | N/A                                                                                        | `UserProfile`                                                    | Tải thông tin hồ sơ                             |
| Profile   | PUT    | `/users/me`                      | Yes  | `{ fullName?, phoneNumber?, avatarUrl? }`                                                  | `UserProfile`                                                    | Cập nhật hồ sơ                                  |
| Address   | GET    | `/users/me/addresses`            | Yes  | N/A                                                                                        | `UserAddress[]`                                                  | Tải sổ địa chỉ                                  |
| Address   | POST   | `/users/me/addresses`            | Yes  | `{ recipient, phoneNumber, line1, line2?, ward, district, city, postalCode?, isDefault? }` | `UserAddress`                                                    | Tạo địa chỉ mới                                 |
| Address   | PUT    | `/users/me/addresses/:addressId` | Yes  | Partial address payload                                                                    | `UserAddress`                                                    | Sửa địa chỉ/đặt mặc định                        |
| Address   | DELETE | `/users/me/addresses/:addressId` | Yes  | N/A                                                                                        | `{ deleted: true }`                                              | Xóa địa chỉ                                     |

## 6) Domain State Requirements

### Order status

- `PENDING`
- `AWAITING_PAYMENT`
- `COMPLETED`
- `FAILED`
- `CANCELLED`

### Payment status

- `INITIATED`
- `PROCESSING`
- `SUCCESS`
- `FAILED`

### FE behavior bắt buộc theo trạng thái

- Checkout sau khi tạo order phải chờ order sang `AWAITING_PAYMENT` trước khi tạo payment.
- Nếu order chuyển `FAILED` hoặc `CANCELLED` thì dừng checkout flow và chuyển sang order detail.
- Payment result phải polling định kỳ khi payment còn `PROCESSING` hoặc order còn `AWAITING_PAYMENT`.
- Order detail phải polling khi order còn `PENDING` hoặc `AWAITING_PAYMENT`.

## 7) Validation Requirements

- Login/Register:
  - `email` phải đúng định dạng email.
  - `password` tối thiểu 8 ký tự.
- Address form:
  - Bắt buộc: `recipient`, `phoneNumber`, `line1`, `ward`, `district`, `city`.
  - Optional: `line2`, `postalCode`, `isDefault`.
- Validation fail phải chặn submit và hiển thị message lỗi rõ ràng.

## 8) Acceptance Checklist

### A. Routing và screen coverage

- [ ] Có đầy đủ tất cả route trong Route Matrix.
- [ ] Trang protected đều có guard và redirect login đúng query `next`.
- [ ] Có global loading/error/not-found hoạt động.

### B. API integration correctness

- [ ] Tất cả endpoint gọi đúng path/method như API Matrix.
- [ ] Dùng base URL từ `NEXT_PUBLIC_API_BASE_URL`, không hardcode host khác.
- [ ] Request protected gửi Bearer token đầy đủ.
- [ ] Mọi request gửi `x-correlation-id`.
- [ ] Parse đúng success/failure envelope; map lỗi thành object chuẩn.

### C. Auth/session correctness

- [ ] Token lưu bằng session storage key `dam.auth.token`.
- [ ] App bootstrap verify token qua `/auth/verify`.
- [ ] Verify fail phải clear token và reset session.
- [ ] Login/register success phải thiết lập session ngay.

### D. Business flow correctness

- [ ] Happy path chạy end-to-end: login/register -> catalog -> detail -> add cart -> checkout -> payment result -> orders.
- [ ] Checkout xử lý đúng luồng order-before-payment.
- [ ] Polling trạng thái hoạt động đúng trên payment result và order detail.
- [ ] Profile/address CRUD hoạt động đầy đủ.

### E. Error handling and observability

- [ ] Màn hình dữ liệu có loading/empty/error + retry.
- [ ] Lỗi API hiển thị message phù hợp cho người dùng.
- [ ] Khi backend trả `correlationId`, frontend hiển thị để trace/support.
- [ ] Không log token hoặc dữ liệu nhạy cảm ở client.

### F. Data source and contract fidelity

- [ ] Không dùng mock data cho các luồng nghiệp vụ chính.
- [ ] Dữ liệu và trạng thái hiển thị bám theo response backend thực tế.
- [ ] Không tự ý đổi tên status/order of operations làm sai contract.

---

## 9) Handover Note cho team triển khai lại

Team có toàn quyền thay đổi styles/design/component library và tổ chức UI, miễn là:

- Không phá vỡ phạm vi chức năng trong tài liệu này.
- Không thay đổi route public/protected cốt lõi.
- Không thay đổi API contract integration behavior.
- Đảm bảo toàn bộ Acceptance Checklist đạt trước khi bàn giao.
