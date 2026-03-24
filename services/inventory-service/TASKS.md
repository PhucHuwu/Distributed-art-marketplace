# Art Inventory Service - Chi tiết công việc

Schema: `inventory`  
Trách nhiệm: quản lý tồn kho thực tế, reserve/release kho an toàn (write-heavy).

## 1) Khởi tạo service

- [ ] INV-001 Tạo bộ khung service + scripts `dev`, `start`, `lint`, `test`.
- [ ] INV-002 Cấu trúc thư mục: `src/modules/stock`, `src/modules/reservation`, `src/events`.
- [ ] INV-003 Thêm endpoint `GET /health`.
- [ ] INV-004 Cấu hình logger và trace id.

## 2) Database schema `inventory`

- [ ] INV-005 Tạo migration `inventory.stocks` (artwork_id PK, available_qty, reserved_qty, sold_qty, updated_at).
- [ ] INV-006 Tạo migration `inventory.reservations` (id, order_id, artwork_id, qty, status, expires_at, created_at).
- [ ] INV-007 Tạo unique index cho (`order_id`, `artwork_id`) để tránh reserve trùng.
- [ ] INV-008 Tạo index cho `status`, `expires_at`.

## 3) API quản trị kho

- [ ] INV-009 Implement `POST /admin/stocks/import` (bulk cập nhật tồn kho).
- [ ] INV-010 Implement `PUT /admin/stocks/:artworkId` cập nhật số lượng tồn.
- [ ] INV-011 Implement `GET /admin/stocks` xem tồn kho + filter.
- [ ] INV-012 Chặn cập nhật tồn kho âm (validation).

## 4) Xử lý reserve/release theo event

- [ ] INV-013 Consume event `order.created`.
- [ ] INV-014 Implement transaction reserve kho với row-level lock (`FOR UPDATE`).
- [ ] INV-015 Nếu đủ hàng -> publish `inventory.reserved`.
- [ ] INV-016 Nếu thiếu hàng -> publish `inventory.failed`.
- [ ] INV-017 Consume `payment.success` để chuyển reserved -> sold.
- [ ] INV-018 Consume `payment.failed`/`order.cancelled` để release kho.

## 5) Cơ chế timeout reservation

- [ ] INV-019 Tạo worker quét reservation hết hạn.
- [ ] INV-020 Release reservation hết hạn về `available_qty`.
- [ ] INV-021 Publish event `inventory.released` khi release do timeout.
- [ ] INV-022 Tránh race condition giữa worker timeout và event payment.

## 6) Event reliability

- [ ] INV-023 Dùng outbox pattern cho event publish quan trọng.
- [ ] INV-024 Thêm idempotency store khi consume event.
- [ ] INV-025 Cấu hình retry, DLQ, và cảnh báo khi event fail liên tiếp.

## 7) Test

- [ ] INV-026 Unit test logic reserve/release/sell.
- [ ] INV-027 Integration test transaction khi nhiều order đặt cùng 1 artwork.
- [ ] INV-028 Test event idempotency khi nhận duplicate `order.created`.
- [ ] INV-029 Test worker timeout reservation.

## 8) Vận hành và tài liệu

- [ ] INV-030 Tạo Dockerfile.
- [ ] INV-031 Thêm metric: stock conflicts, reserve success rate, reserve latency.
- [ ] INV-032 Viết runbook xử lý over-sell và reconciliation dữ liệu.
- [ ] INV-033 Viết tài liệu contract event với order/payment/catalog.

## Definition of Done

- [ ] INV-034 Không xảy ra over-sell trong test đồng thời.
- [ ] INV-035 Luồng reserve->payment->sold/release ổn định qua event.
- [ ] INV-036 Test pass và có dashboard metric cơ bản.
