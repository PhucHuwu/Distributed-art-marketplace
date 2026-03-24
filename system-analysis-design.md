# Tài Liệu Phân Tích & Thiết Kế Hệ Thống

## 1) Thông tin tài liệu

- **Dự án:** Distributed Art Marketplace (Web bán tranh Việt Nam)
- **Vai trò tài liệu:** BA + Solution Design
- **Mục tiêu:** Chuẩn hóa yêu cầu nghiệp vụ, yêu cầu hệ thống và thiết kế chi tiết cho kiến trúc microservices hướng sự kiện
- **Phạm vi hiện tại:** Thiết kế mức Logical/Service/Application và Data Model lõi cho giai đoạn MVP

---

## 2) Bối cảnh & Mục tiêu nghiệp vụ

### 2.1 Bối cảnh

Nền tảng thương mại điện tử chuyên bán tranh tại Việt Nam cần:

- Hiển thị catalogue tranh phong phú, tối ưu SEO.
- Quản trị tồn kho chính xác cho sản phẩm có số lượng giới hạn.
- Xử lý đơn hàng và thanh toán theo luồng rõ ràng, truy vết được.
- Hệ thống đủ linh hoạt để tách dịch vụ, mở rộng theo lưu lượng.

### 2.2 Mục tiêu nghiệp vụ

- Tăng tỷ lệ chuyển đổi từ xem tranh -> đặt mua.
- Hạn chế over-selling bằng cơ chế giữ/trừ tồn kho an toàn.
- Theo dõi đầy đủ hành vi qua audit log phục vụ vận hành và kiểm soát.
- Cho phép mở rộng thêm cổng thanh toán, kênh thông báo, dashboard admin.

### 2.3 KPI đề xuất (MVP)

- Tỷ lệ tạo đơn thành công (không lỗi hệ thống): >= 99.5%.
- Tỷ lệ đơn thất bại do thiếu kho sau khi tạo đơn: < 2%.
- P95 API đọc catalog: < 300ms.
- Thời gian đồng bộ trạng thái đơn (create -> completed/failed): < 10s (P95).
- Tỷ lệ gửi thông báo thành công: >= 98%.

---

## 3) Phạm vi nghiệp vụ

### 3.1 In-scope (MVP)

- Đăng ký/đăng nhập và xác thực JWT.
- Quản lý hồ sơ người dùng và địa chỉ giao hàng.
- Quản lý catalog tranh, tác giả, metadata, hình ảnh.
- Quản lý tồn kho và cơ chế reserve/release khi đặt hàng.
- Quản lý vòng đời đơn hàng.
- Xử lý thanh toán và cập nhật trạng thái đơn.
- Gửi thông báo sau sự kiện quan trọng.
- Ghi audit log tập trung cho admin.

### 3.2 Out-of-scope (MVP)

- Recommendation engine (gợi ý cá nhân hóa nâng cao).
- Quản lý vận chuyển tích hợp hãng vận chuyển ngoài.
- Hoàn tiền tự động/phức tạp nhiều bước.
- Đấu giá tranh (auction).

---

## 4) Các bên liên quan & vai trò

- **Customer (Người mua):** duyệt tranh, đặt hàng, thanh toán, nhận thông báo.
- **Admin vận hành:** theo dõi audit log, tra cứu sự cố, quản lý dữ liệu.
- **CS team:** hỗ trợ khách hàng dựa trên trạng thái đơn/thanhtoán/log.
- **Tech team:** phát triển, vận hành, giám sát dịch vụ.

---

## 5) Yêu cầu chức năng (Functional Requirements)

### FR-01: Quản lý tài khoản & xác thực

- Đăng ký tài khoản bằng email/password.
- Đăng nhập trả về JWT Access Token (và Refresh Token nếu áp dụng).
- Xác thực token tại API Gateway hoặc từng service.

### FR-02: Quản lý hồ sơ người dùng

- Cập nhật họ tên, avatar, số điện thoại.
- Quản lý nhiều địa chỉ giao hàng, chọn địa chỉ mặc định.

### FR-03: Quản lý catalog tranh

- CRUD thông tin tranh: tên, mô tả, giá, tác giả, ảnh, chủ đề.
- Danh sách/chi tiết tranh cho client (read-heavy).
- Tìm kiếm/lọc theo tác giả, mức giá, chủ đề.

### FR-04: Quản lý tồn kho

- Theo dõi số lượng khả dụng theo từng tranh.
- Reserve tồn kho khi có `order.created`.
- Release tồn kho khi thanh toán thất bại/hủy đơn.

### FR-05: Quản lý giỏ hàng & đơn hàng

- Thêm/sửa/xóa item trong giỏ.
- Tạo đơn từ giỏ hàng với trạng thái ban đầu `PENDING`.
- Theo dõi trạng thái đơn hàng theo vòng đời.

### FR-06: Thanh toán

- Tạo giao dịch thanh toán từ đơn hàng hợp lệ.
- Ghi nhận trạng thái `SUCCESS`/`FAILED`.
- Phát event để Order Service cập nhật trạng thái.

### FR-07: Thông báo

- Gửi thông báo sau các sự kiện chính (order completed, payment failed, ...).
- Có khả năng mở rộng đa kênh (email/SMS).

### FR-08: Audit log

- Thu thập event toàn hệ thống, lưu theo chuẩn truy vết.
- Truy vấn theo user, orderId, service, eventType, thời gian.

---

## 6) Yêu cầu phi chức năng (NFR)

### 6.1 Hiệu năng

- Read API catalog cần cache-friendly và scale ngang.
- Các service write-heavy (inventory/order/payment) cần kiểm soát transaction chặt chẽ.

### 6.2 Sẵn sàng & tin cậy

- Mỗi service có health check.
- RabbitMQ bảo đảm at-least-once delivery.
- Thiết kế idempotent cho consumer.

### 6.3 Bảo mật

- JWT ký bằng secret/key quản lý qua biến môi trường.
- Password hash (bcrypt/argon2), không lưu plain text.
- Tách schema DB theo service để giảm blast radius.

### 6.4 Khả năng mở rộng

- Microservices độc lập triển khai.
- Có thể scale riêng catalog/inventory/order theo tải.

### 6.5 Quan sát hệ thống

- Structured logging theo correlationId.
- Metrics cho API, queue length, consumer lag.
- Audit log dành cho vận hành và kiểm toán.

---

## 7) Kiến trúc tổng thể

### 7.1 Mô hình kiến trúc

- **Frontend:** Next.js (SSR/SSG, SEO tốt).
- **Gateway:** NGINX định tuyến request vào service phù hợp.
- **Microservices Node.js:** theo domain/bounded context.
- **Database:** PostgreSQL chung instance, tách **schema theo service**.
- **Message Broker:** RabbitMQ theo mô hình Pub/Sub (Choreography).

### 7.2 Danh sách dịch vụ

1. Auth Service (`auth`)
2. User Profile Service (`users`)
3. Art Catalog Service (`catalog`)
4. Art Inventory Service (`inventory`)
5. Order Service (`orders`)
6. Payment Service (`payments`)
7. Notification Service (không bắt buộc DB)
8. Audit Log Service (`audit_logs`)

### 7.3 Nguyên tắc thiết kế

- Single Responsibility per service.
- Database per service (ở mức schema isolation).
- Event-first cho đồng bộ liên service.
- API sync cho truy vấn trực tiếp cần phản hồi tức thì.

---

## 8) Thiết kế domain & trạng thái nghiệp vụ

### 8.1 Trạng thái đơn hàng đề xuất

- `PENDING`: vừa tạo đơn, chờ reserve tồn kho.
- `AWAITING_PAYMENT`: tồn kho đã reserve, chờ thanh toán.
- `COMPLETED`: thanh toán thành công.
- `FAILED`: lỗi không thể xử lý tiếp (thiếu kho, thanh toán lỗi nặng).
- `CANCELLED`: người dùng/admin hủy hợp lệ.

### 8.2 Trạng thái tồn kho đề xuất

- `AVAILABLE`: sẵn sàng bán.
- `RESERVED`: đã giữ cho đơn (theo orderId).
- `RELEASED`: hoàn trả do fail/cancel/timeout.

### 8.3 Trạng thái thanh toán đề xuất

- `INITIATED`: tạo yêu cầu thanh toán.
- `PROCESSING`: đang xử lý với cổng thanh toán.
- `SUCCESS`: giao dịch thành công.
- `FAILED`: giao dịch thất bại.

---

## 9) Thiết kế dữ liệu (Logical Data Model)

> Ghi chú: đây là mô hình logic. Triển khai thực tế bằng Prisma, mỗi service quản lý migration riêng trong schema của mình.

### 9.1 Schema `auth`

- `credentials`
  - `id` (uuid, pk)
  - `email` (unique)
  - `password_hash`
  - `status` (active/locked)
  - `created_at`, `updated_at`
- `refresh_tokens` (nếu dùng)
  - `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`

### 9.2 Schema `users`

- `user_profiles`
  - `user_id` (uuid, pk, tham chiếu logic sang auth)
  - `full_name`, `avatar_url`, `phone`
  - `created_at`, `updated_at`
- `user_addresses`
  - `id`, `user_id`, `receiver_name`, `phone`
  - `line1`, `ward`, `district`, `city`, `postal_code`
  - `is_default`

### 9.3 Schema `catalog`

- `artists`
  - `id`, `name`, `bio`, `avatar_url`
- `artworks`
  - `id`, `title`, `slug`, `description`
  - `artist_id`, `price`, `currency`
  - `thumbnail_url`, `status`, `created_at`
- `artwork_images`
  - `id`, `artwork_id`, `image_url`, `sort_order`
- `categories`, `artwork_categories` (n-n)

### 9.4 Schema `inventory`

- `stock_items`
  - `artwork_id` (pk)
  - `on_hand_qty`, `reserved_qty`, `updated_at`
- `stock_reservations`
  - `id`, `order_id`, `artwork_id`, `qty`, `status`
  - `expires_at`, `created_at`
- Ràng buộc nghiệp vụ: `on_hand_qty - reserved_qty >= 0`

### 9.5 Schema `orders`

- `carts`
  - `id`, `user_id`, `status`, `updated_at`
- `cart_items`
  - `id`, `cart_id`, `artwork_id`, `qty`, `unit_price`
- `orders`
  - `id`, `user_id`, `status`, `total_amount`, `currency`
  - `shipping_address_snapshot` (jsonb)
  - `created_at`, `updated_at`
- `order_items`
  - `id`, `order_id`, `artwork_id`, `qty`, `unit_price`
- `order_status_histories`
  - `id`, `order_id`, `from_status`, `to_status`, `reason`, `created_at`

### 9.6 Schema `payments`

- `payments`
  - `id`, `order_id`, `provider`, `amount`, `currency`
  - `status`, `provider_txn_id`, `failure_reason`
  - `created_at`, `updated_at`

### 9.7 Schema `audit_logs`

- `event_logs`
  - `id`, `event_id`, `event_type`, `service_name`
  - `aggregate_id`, `user_id`, `payload` (jsonb)
  - `occurred_at`, `received_at`, `correlation_id`

---

## 10) Thiết kế API mức nghiệp vụ (High-level)

### 10.1 Auth Service

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/verify`

### 10.2 User Profile Service

- `GET /users/me`
- `PUT /users/me`
- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PUT /users/me/addresses/{id}`
- `DELETE /users/me/addresses/{id}`

### 10.3 Catalog Service

- `GET /catalog/artworks`
- `GET /catalog/artworks/{idOrSlug}`
- `GET /catalog/artists`
- `POST /catalog/artworks` (admin)
- `PUT /catalog/artworks/{id}` (admin)

### 10.4 Inventory Service

- `GET /inventory/{artworkId}`
- `POST /inventory/reserve` (nội bộ)
- `POST /inventory/release` (nội bộ)
- `POST /inventory/adjust` (admin)

### 10.5 Order Service

- `GET /orders/cart`
- `POST /orders/cart/items`
- `PUT /orders/cart/items/{id}`
- `DELETE /orders/cart/items/{id}`
- `POST /orders`
- `GET /orders/{orderId}`
- `GET /orders/me`

### 10.6 Payment Service

- `POST /payments`
- `GET /payments/{id}`
- `POST /payments/webhook/{provider}`

### 10.7 Audit/Admin Service

- `GET /admin/audit-logs`
- `GET /admin/audit-logs/{eventId}`

---

## 11) Thiết kế sự kiện (Event Contract)

### 11.1 Danh sách event chính

- `order.created`
- `inventory.reserved`
- `inventory.failed`
- `payment.initiated`
- `payment.success`
- `payment.failed`
- `order.completed`
- `order.failed`
- `order.cancelled`

### 11.2 Cấu trúc message chuẩn đề xuất

```json
{
  "eventId": "uuid",
  "eventType": "order.created",
  "occurredAt": "2026-03-24T10:00:00Z",
  "producer": "order-service",
  "correlationId": "uuid",
  "version": "v1",
  "payload": {
    "orderId": "uuid",
    "userId": "uuid"
  }
}
```

### 11.3 Quy tắc message bus

- Consumer xử lý idempotent theo `eventId`.
- Retry có backoff; quá ngưỡng thì đẩy DLQ.
- Payload không chứa dữ liệu nhạy cảm (password/token thô).
- Quản lý version event để tương thích ngược.

---

## 12) Luồng nghiệp vụ trọng yếu (Sequence)

### 12.1 Luồng đặt hàng thành công

1. User tạo đơn tại Order Service -> `orders.status=PENDING`, publish `order.created`.
2. Inventory Service consume `order.created`, reserve tồn kho thành công -> publish `inventory.reserved`.
3. Order Service consume `inventory.reserved` -> cập nhật `AWAITING_PAYMENT`.
4. User thanh toán qua Payment Service -> `payment.success`.
5. Order Service consume `payment.success` -> cập nhật `COMPLETED`, publish `order.completed`.
6. Notification Service consume `order.completed` -> gửi email/SMS.
7. Audit Log Service consume toàn bộ event và lưu vết.

### 12.2 Luồng thiếu tồn kho

1. Order tạo thành công (`PENDING`) và publish `order.created`.
2. Inventory không đủ hàng -> publish `inventory.failed`.
3. Order consume `inventory.failed` -> cập nhật `FAILED`, publish `order.failed`.
4. Notification gửi thông báo thất bại cho user.

### 12.3 Luồng thanh toán thất bại

1. Order đã `AWAITING_PAYMENT`.
2. Payment publish `payment.failed`.
3. Order cập nhật `FAILED` (hoặc quay lại chờ thanh toán theo policy).
4. Inventory release reservation (nếu policy yêu cầu), publish `inventory.released`.

---

## 13) Giao dịch phân tán & nhất quán dữ liệu

### 13.1 Pattern khuyến nghị

- Dùng **Saga Choreography** cho vòng đời order/inventory/payment.
- Mỗi bước local transaction + publish event kế tiếp.
- Có bước bù trừ (compensation) khi thất bại.

### 13.2 Outbox pattern (khuyến nghị mạnh)

- Mỗi service ghi event vào bảng outbox trong cùng transaction DB.
- Worker outbox publish lên RabbitMQ, tránh mất event khi crash giữa chừng.

### 13.3 Idempotency

- API tạo payment/order hỗ trợ `Idempotency-Key`.
- Consumer lưu `processed_events` để bỏ qua xử lý trùng.

---

## 14) Bảo mật & phân quyền

### 14.1 Xác thực

- JWT Access Token có TTL ngắn (15-30 phút).
- Refresh token TTL dài hơn, lưu hash trong DB.

### 14.2 Phân quyền (RBAC cơ bản)

- `CUSTOMER`: thao tác profile/cart/order/payment của chính mình.
- `ADMIN`: quản trị catalog, inventory adjustment, audit log.

### 14.3 Kiểm soát an toàn

- Rate limiting tại Gateway cho auth endpoints.
- Validate input tập trung (schema validation).
- Mask thông tin nhạy cảm trong logs.

---

## 15) Thiết kế triển khai & hạ tầng

### 15.1 Môi trường

- `local`: Docker Compose (postgres, rabbitmq, services, gateway, frontend).
- `staging`: môi trường test tích hợp và UAT.
- `production`: tách cluster/service theo nhu cầu tải.

### 15.2 Thành phần triển khai

- NGINX Gateway.
- Các Node.js services độc lập.
- PostgreSQL (1 instance, multi-schema).
- RabbitMQ (exchange, queue, DLQ).
- Optional Redis cho cache hoặc dedup nhanh.

### 15.3 Quan sát & cảnh báo

- Health endpoint `/health` từng service.
- Centralized log (ELK/EFK hoặc tương đương).
- Alert khi queue backlog tăng, payment fail tăng đột biến.

---

## 16) Chất lượng dữ liệu & quy tắc nghiệp vụ

- Giá tranh > 0, số lượng > 0.
- Đơn hàng phải có ít nhất 1 item.
- Snapshot địa chỉ giao hàng tại thời điểm đặt đơn.
- Không cho cập nhật order item sau khi qua `AWAITING_PAYMENT`.
- Mọi chuyển trạng thái order phải ghi lịch sử trạng thái.

---

## 17) Kịch bản lỗi & xử lý ngoại lệ

- **Duplicate event:** bỏ qua nhờ idempotency.
- **Service down tạm thời:** retry + DLQ.
- **Payment success nhưng order chưa cập nhật:** cơ chế replay event từ DLQ/outbox.
- **Mất đồng bộ tồn kho:** job reconciliation định kỳ giữa `stock_items` và reservation/đơn hàng.

---

## 18) Kiểm thử & tiêu chí chấp nhận

### 18.1 Kiểm thử

- Unit test cho domain rules từng service.
- Integration test cho DB + broker.
- Contract test cho event schema và API.
- E2E test cho luồng đặt hàng thành công/thất bại.

### 18.2 Acceptance Criteria mẫu

- AC-01: Khi tạo đơn với tồn kho đủ, đơn chuyển `PENDING -> AWAITING_PAYMENT` trong <= 5s (P95).
- AC-02: Khi thiếu kho, đơn chuyển `PENDING -> FAILED` và không tạo payment.
- AC-03: Khi nhận `payment.success`, đơn phải thành `COMPLETED`, notification được tạo.
- AC-04: Mỗi event chính đều xuất hiện trong audit log với correlationId.

---

## 19) Rủi ro & biện pháp giảm thiểu

- **Rủi ro nhất quán cuối cùng gây UX khó hiểu:** hiển thị trạng thái trung gian rõ ràng trên UI.
- **Rủi ro duplicate message:** bắt buộc idempotency key + processed event store.
- **Rủi ro single DB instance:** thiết kế backup/replication và kế hoạch tách DB khi scale.
- **Rủi ro phụ thuộc cổng thanh toán:** abstraction provider + timeout/circuit breaker.

---

## 20) Lộ trình triển khai đề xuất

### Giai đoạn 1 (MVP Core)

- Auth, User Profile, Catalog, Inventory, Order, Payment cơ bản.
- RabbitMQ event cơ bản + Audit log + Notification email.
- E2E cho create order -> payment -> complete.

### Giai đoạn 2 (Stability)

- Outbox pattern, DLQ dashboard, idempotency hoàn chỉnh.
- Tối ưu query catalog + cache + phân trang.
- Bổ sung admin APIs cho audit tra cứu.

### Giai đoạn 3 (Scale & Product)

- Mở rộng cổng thanh toán, multi-channel notification.
- Dashboard vận hành/kinh doanh.
- Hardening bảo mật, performance tuning.

---

## 21) Giả định & phụ thuộc

- Có sẵn cổng thanh toán tích hợp qua API/webhook.
- Team có năng lực vận hành RabbitMQ/PostgreSQL production.
- Nhu cầu ban đầu phù hợp single-region deployment.
- Ảnh tranh lưu tại object storage/CDN (không lưu nhị phân trong DB).

---

## 22) Danh sách quyết định kiến trúc (ADR tóm tắt)

- ADR-01: Chọn microservices + event-driven choreography.
- ADR-02: Chọn PostgreSQL multi-schema thay vì multi-database ở MVP.
- ADR-03: Chọn RabbitMQ cho bất đồng bộ liên service.
- ADR-04: Chọn Next.js để tối ưu SEO/catalog read flow.

---

## 23) Backlog BA/SA cần làm tiếp

- Đặc tả chi tiết OpenAPI cho từng service.
- Đặc tả JSON Schema/AsyncAPI cho toàn bộ event.
- Ma trận phân quyền chi tiết theo endpoint.
- Đặc tả UI flow và trạng thái hiển thị theo vòng đời đơn.
- Thiết kế dashboard admin cho audit và vận hành.

---

## 24) Kết luận

Thiết kế hiện tại bám sát mục tiêu nghiệp vụ của sàn bán tranh: phân tách domain rõ ràng, giảm coupling bằng event-driven và vẫn đảm bảo tính kiểm soát thông qua audit log tập trung. Mô hình multi-schema giúp triển khai MVP nhanh, đồng thời vẫn giữ nền tảng để nâng cấp dần (outbox, DLQ, scaling độc lập) khi lưu lượng tăng.
