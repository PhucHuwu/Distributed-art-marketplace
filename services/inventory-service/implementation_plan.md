# Implementation Plan - Inventory Service

## 1) Mục tiêu

- Đảm bảo tính đúng đắn tồn kho (không over-sell) trong môi trường cạnh tranh cao.
- Xử lý reserve/release/sold theo event từ Order/Payment với tính nhất quán cao.
- Triển khai reliability đầy đủ: outbox, idempotency, retry, DLQ.

## 2) Phạm vi MVP

- Bao gồm: INV-001 -> INV-036 trong `TASKS.md`.
- Đây là service critical path của luồng đặt hàng, ưu tiên tính đúng trước hiệu năng.

## 3) Phụ thuộc và contract

- PostgreSQL schema `inventory`.
- RabbitMQ consume `order.created`, `payment.success`, `payment.failed`, `order.cancelled`.
- Publish `inventory.reserved`, `inventory.failed`, `inventory.released`.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và data foundation

- Task: INV-001, INV-002, INV-003, INV-004, INV-005, INV-006, INV-007, INV-008.
- Kết quả:
  - Schema stocks/reservations hoàn chỉnh, có unique/index phục vụ reserve workflow.
  - Service có logging + trace id để truy vết.

### Phase 1 - API quản trị kho

- Task: INV-009, INV-010, INV-011, INV-012.
- Kết quả:
  - Admin có thể import/update/view tồn kho với validation chống giá trị âm.

### Phase 2 - Reserve/release/sold theo event

- Task: INV-013, INV-014, INV-015, INV-016, INV-017, INV-018.
- Kết quả:
  - Reserve dùng transaction + `FOR UPDATE`.
  - Luồng đủ hàng/thiếu hàng và hậu thanh toán hoạt động chuẩn.

### Phase 3 - Timeout worker và reliability

- Task: INV-019, INV-020, INV-021, INV-022, INV-023, INV-024, INV-025.
- Kết quả:
  - Reservation hết hạn được release tự động, có event phản hồi.
  - Kiểm soát race giữa timeout worker và callback payment.
  - Outbox + idempotency + retry/DLQ hoàn chỉnh.

### Phase 4 - Test, ops, docs, release

- Task: INV-026, INV-027, INV-028, INV-029, INV-030, INV-031, INV-032, INV-033, INV-034, INV-035, INV-036.
- Kết quả:
  - Test concurrency chứng minh không over-sell.
  - Có metric vận hành (conflict/success/latency) và runbook reconciliation.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + Phase 1.
- Tuần 2: Phase 2.
- Tuần 3: Phase 3.
- Tuần 4: Phase 4 + hardening tích hợp.

## 6) Rủi ro chính và giảm thiểu

- Deadlock/lock contention khi reserve đồng thời cao.
  - Giảm thiểu: thứ tự lock nhất quán, transaction ngắn, metric conflict rate.
- Race timeout vs payment callback.
  - Giảm thiểu: kiểm tra state trước update và dùng optimistic guard/version check.
- Mất event khi publish thất bại.
  - Giảm thiểu: outbox + retry worker + DLQ cảnh báo.

## 7) Checklist Go-live

- Không over-sell trong test đồng thời (INV-034).
- Luồng `order.created` -> reserve -> payment -> sold/release chạy ổn định end-to-end.
- Dashboard metric inventory đã có cảnh báo cho conflict, fail publish, DLQ tăng.
