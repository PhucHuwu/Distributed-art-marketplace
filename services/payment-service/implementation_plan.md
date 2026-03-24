# Implementation Plan - Payment Service

## 1) Mục tiêu

- Quản lý vòng đời giao dịch thanh toán từ initiate đến webhook/reconciliation.
- Đồng bộ trạng thái thanh toán sang Order/Inventory qua event.
- Đảm bảo an toàn webhook (signature verification) và idempotency callback.

## 2) Phạm vi MVP

- Bao gồm: PAY-001 -> PAY-033 trong `TASKS.md`.
- Ưu tiên: initiate + webhook + mapping trạng thái + event publish đáng tin cậy.

## 3) Phụ thuộc và contract

- PostgreSQL schema `payments`.
- Payment provider (sandbox trước, production sau).
- RabbitMQ publish `payment.success`, `payment.failed`.
- Gateway route endpoint `/payments/*` và bảo vệ endpoint phù hợp.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và security baseline

- Task: PAY-001, PAY-002, PAY-003, PAY-004, PAY-005, PAY-006, PAY-007.
- Kết quả:
  - Service khởi chạy với env fail-fast.
  - Middleware verify chữ ký webhook sẵn sàng.
  - Log không lộ secret/token.

### Phase 1 - Data model và API thanh toán

- Task: PAY-008, PAY-009, PAY-010, PAY-011, PAY-012, PAY-013, PAY-014, PAY-015.
- Kết quả:
  - Schema transactions/webhook_logs hoàn chỉnh.
  - API initiate/status/webhook hoạt động với provider sandbox.

### Phase 2 - Mapping trạng thái và publish event

- Task: PAY-016, PAY-017, PAY-018, PAY-019.
- Kết quả:
  - Mapping provider -> nội bộ thống nhất.
  - Callback duplicate không gây cập nhật trạng thái sai.
  - Event thanh toán được publish đúng và nhất quán.

### Phase 3 - Reconciliation, test, ops, docs

- Task: PAY-020, PAY-021, PAY-022, PAY-023, PAY-024, PAY-025, PAY-026, PAY-027, PAY-028, PAY-029, PAY-030, PAY-031, PAY-032, PAY-033.
- Kết quả:
  - Job đối soát xử lý giao dịch `PENDING` quá hạn.
  - Test callback hợp lệ/sai chữ ký/duplicate đầy đủ.
  - Metric thanh toán và runbook provider down sẵn sàng.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + schema + initiate API.
- Tuần 2: webhook + mapping + idempotency.
- Tuần 3: reconciliation + integration test + docs.

## 6) Rủi ro chính và giảm thiểu

- Webhook giả mạo hoặc replay.
  - Giảm thiểu: verify signature + giới hạn thời gian replay + idempotency key.
- Provider callback chậm/mất.
  - Giảm thiểu: reconciliation job định kỳ và timeout policy.
- Không đồng bộ trạng thái giữa Payment và Order.
  - Giảm thiểu: event contract rõ ràng + monitoring mismatch theo `order_id`.

## 7) Checklist Go-live

- Webhook an toàn, idempotent, có log truy vết transaction.
- Trạng thái payment đồng bộ đúng qua event với Order và Inventory.
- Dashboard có metrics: success rate, callback latency, pending aging.
