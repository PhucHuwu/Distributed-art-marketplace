# Implementation Plan - Order Service

## 1) Mục tiêu

- Quản lý giỏ hàng, tạo đơn, theo dõi vòng đời đơn hàng theo state machine rõ ràng.
- Điều phối luồng nghiệp vụ qua event với Inventory và Payment.
- Đảm bảo không có transition trạng thái trái quy tắc.

## 2) Phạm vi MVP

- Bao gồm: ORD-001 -> ORD-043 trong `TASKS.md`.
- Ưu tiên: cart/order API ổn định, state machine chuẩn, event reliability đầy đủ.

## 3) Phụ thuộc và contract

- PostgreSQL schema `orders`.
- JWT auth cho endpoint user và RBAC cho `/admin/*`.
- RabbitMQ publish `order.created`, `order.completed`; consume inventory/payment events.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và schema

- Task: ORD-001, ORD-002, ORD-003, ORD-004, ORD-005, ORD-006, ORD-007, ORD-008, ORD-009.
- Kết quả:
  - Service và schema order/cart/history sẵn sàng.
  - Middleware auth chuẩn cho endpoint user.

### Phase 1 - API giỏ hàng và tạo đơn

- Task: ORD-010, ORD-011, ORD-012, ORD-013, ORD-014, ORD-015, ORD-016, ORD-017, ORD-018, ORD-019, ORD-020.
- Kết quả:
  - Cart CRUD và tạo đơn từ giỏ hoạt động.
  - `order.created` được publish sau create order thành công.

### Phase 2 - State machine theo event

- Task: ORD-021, ORD-022, ORD-023, ORD-024, ORD-025, ORD-026.
- Kết quả:
  - Chuyển trạng thái theo event inventory/payment đúng rule.
  - Lưu lịch sử trạng thái đầy đủ để audit/tracking.

### Phase 3 - Admin APIs và reliability

- Task: ORD-027, ORD-028, ORD-029, ORD-030, ORD-031, ORD-032.
- Kết quả:
  - Admin query/operate đơn hàng theo bộ lọc.
  - Outbox + idempotency + guard state transition hoàn chỉnh.

### Phase 4 - Test, ops, docs, release

- Task: ORD-033, ORD-034, ORD-035, ORD-036, ORD-037, ORD-038, ORD-039, ORD-040, ORD-041, ORD-042, ORD-043.
- Kết quả:
  - Test state machine, cancel rules, và flow hoàn tất end-to-end pass.
  - Có runbook xử lý order treo và logs trace theo `order_id`.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + cart APIs.
- Tuần 2: order APIs + event consumers.
- Tuần 3: admin/reliability + test integration.
- Tuần 4: hardening + docs + fix cross-service.

## 6) Rủi ro chính và giảm thiểu

- Nhảy trạng thái sai do event đến trễ/duplicate.
  - Giảm thiểu: state transition table cứng + idempotency store.
- Order bị treo tại `PENDING`/`AWAITING_PAYMENT`.
  - Giảm thiểu: job theo dõi aging + runbook ORD-040 + cảnh báo.
- Sai lệch dữ liệu giá tại thời điểm checkout.
  - Giảm thiểu: snapshot `unit_price` vào order_items khi tạo đơn.

## 7) Checklist Go-live

- Không có transition trái rule trong test và staging.
- Luồng cart -> order -> inventory -> payment -> completed chạy ổn định.
- Admin có thể tra cứu và can thiệp trạng thái theo policy vận hành cho phép.
