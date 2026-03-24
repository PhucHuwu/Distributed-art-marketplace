# Order Service - Chi tiết công việc

Schema: `orders`  
Trách nhiệm: giỏ hàng, tạo đơn, quản lý vòng đời đơn hàng.

## 1) Khởi tạo service

- [ ] ORD-001 Tạo bộ khung service + scripts `dev`, `start`, `lint`, `test`.
- [ ] ORD-002 Cấu trúc thư mục: `src/modules/cart`, `src/modules/order`, `src/events`.
- [ ] ORD-003 Thêm endpoint `GET /health`.
- [ ] ORD-004 Cấu hình middleware auth bắt buộc cho endpoint user.

## 2) Database schema `orders`

- [ ] ORD-005 Tạo migration `orders.carts` (id, user_id, status, created_at, updated_at).
- [ ] ORD-006 Tạo migration `orders.cart_items` (id, cart_id, artwork_id, qty, unit_price, created_at).
- [ ] ORD-007 Tạo migration `orders.orders` (id, user_id, order_code unique, status, subtotal, shipping_fee, total_amount, currency, shipping_address_json, created_at, updated_at).
- [ ] ORD-008 Tạo migration `orders.order_items` (id, order_id, artwork_id, qty, unit_price, item_total).
- [ ] ORD-009 Tạo migration `orders.order_status_history` (id, order_id, from_status, to_status, reason, changed_at).

## 3) API giỏ hàng

- [ ] ORD-010 Implement `GET /cart`.
- [ ] ORD-011 Implement `POST /cart/items` thêm artwork vào giỏ.
- [ ] ORD-012 Implement `PUT /cart/items/:itemId` cập nhật số lượng.
- [ ] ORD-013 Implement `DELETE /cart/items/:itemId`.
- [ ] ORD-014 Validate qty tối thiểu/tối đa và artwork hợp lệ.

## 4) API đặt hàng

- [ ] ORD-015 Implement `POST /orders` tạo đơn từ giỏ hàng.
- [ ] ORD-016 Đặt trạng thái ban đầu `PENDING`.
- [ ] ORD-017 Publish event `order.created` sau khi tạo đơn.
- [ ] ORD-018 Implement `GET /orders` (danh sách đơn của user).
- [ ] ORD-019 Implement `GET /orders/:orderId` (chi tiết đơn).
- [ ] ORD-020 Implement `POST /orders/:orderId/cancel` với rule trạng thái cho phép hủy.

## 5) Xử lý trạng thái đơn qua event

- [ ] ORD-021 Consume `inventory.reserved` -> update status `AWAITING_PAYMENT`.
- [ ] ORD-022 Consume `inventory.failed` -> update status `FAILED_OUT_OF_STOCK`.
- [ ] ORD-023 Consume `payment.success` -> update status `COMPLETED`.
- [ ] ORD-024 Consume `payment.failed` -> update status `PAYMENT_FAILED`.
- [ ] ORD-025 Publish `order.completed` khi đơn hoàn tất.
- [ ] ORD-026 Lưu lịch sử thay đổi status vào `order_status_history`.

## 6) Admin API đơn hàng

- [ ] ORD-027 Implement `GET /admin/orders` filter theo status/date/user.
- [ ] ORD-028 Implement `GET /admin/orders/:orderId`.
- [ ] ORD-029 Implement `PATCH /admin/orders/:orderId/status` cho các trạng thái vận hành được phép.

## 7) Event reliability và nhất quán

- [ ] ORD-030 Dùng outbox pattern khi publish event.
- [ ] ORD-031 Thêm idempotency key cho consume event duplicate.
- [ ] ORD-032 Đảm bảo state machine đơn hàng không bị nhảy trạng thái sai.

## 8) Test

- [ ] ORD-033 Unit test state machine đơn hàng.
- [ ] ORD-034 Integration test flow cart -> order.created.
- [ ] ORD-035 Integration test event-driven flow đến `COMPLETED`.
- [ ] ORD-036 Test cancel order ở từng mốc trạng thái.

## 9) Vận hành và tài liệu

- [ ] ORD-037 Tạo Dockerfile.
- [ ] ORD-038 Thêm logs có order_id và user_id để trace.
- [ ] ORD-039 Viết API docs cho cart/order/admin.
- [ ] ORD-040 Viết runbook xử lý order treo ở `PENDING`/`AWAITING_PAYMENT`.

## Definition of Done

- [ ] ORD-041 Luồng đặt hàng event-driven hoạt động ổn định với inventory/payment.
- [ ] ORD-042 Không có transition trạng thái trái quy tắc.
- [ ] ORD-043 Test pass và docs đầy đủ cho FE/QA/ops.
