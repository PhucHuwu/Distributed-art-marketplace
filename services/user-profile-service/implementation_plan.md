# Implementation Plan - User Profile Service

## 1) Mục tiêu

- Quản lý profile và địa chỉ giao hàng tách biệt hoàn toàn khỏi Auth.
- Đảm bảo phân quyền dữ liệu: user chỉ truy cập/sửa dữ liệu của chính mình.
- Đồng bộ khởi tạo profile qua event `user.registered` và publish event thay đổi profile/address.

## 2) Phạm vi MVP

- Bao gồm: UPS-001 -> UPS-037 trong `TASKS.md`.
- Tập trung vào API profile/address ổn định, validation chặt và idempotency consume event.

## 3) Phụ thuộc và contract

- PostgreSQL schema `users`.
- JWT từ Auth/Gateway (middleware verify token).
- RabbitMQ để consume `user.registered`, publish `profile.updated`, `address.updated`.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và contract nền tảng

- Task: UPS-001, UPS-002, UPS-003, UPS-004, UPS-005, UPS-006, UPS-007, UPS-008.
- Kết quả:
  - Service boot được với health check.
  - Áp dụng JWT middleware, correlation id, format lỗi validate chuẩn.

### Phase 1 - Data model và API profile/address

- Task: UPS-009, UPS-010, UPS-011, UPS-012, UPS-013, UPS-014, UPS-015, UPS-016, UPS-017, UPS-018, UPS-019, UPS-020, UPS-021, UPS-022.
- Kết quả:
  - Schema `users` đầy đủ profile + addresses và rule 1 default address/user.
  - CRUD profile/address hoạt động đúng business rule.

### Phase 2 - Event-driven integration

- Task: UPS-023, UPS-024, UPS-025, UPS-026.
- Kết quả:
  - Tự tạo profile rỗng khi nhận `user.registered`.
  - Publish event thay đổi profile/address theo envelope chuẩn.
  - Consume idempotent với event duplicate.

### Phase 3 - Test, ops, docs, release

- Task: UPS-027, UPS-028, UPS-029, UPS-030, UPS-031, UPS-032, UPS-033, UPS-034, UPS-035, UPS-036, UPS-037.
- Kết quả:
  - Test authorization và rule địa chỉ mặc định đầy đủ.
  - Dockerfile + metrics cơ bản + runbook consume lỗi.
  - Docs đủ cho FE/QA tích hợp.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + migration + API profile.
- Tuần 2: API address + event integration.
- Tuần 3: test hardening + docs + fix integration.

## 6) Rủi ro chính và giảm thiểu

- Lỗi phân quyền dữ liệu chéo user.
  - Giảm thiểu: mọi query profile/address bắt buộc filter theo `user_id` từ JWT; test UPS-030.
- Trùng địa chỉ mặc định.
  - Giảm thiểu: DB constraint + transaction update default flag.
- Duplicate event `user.registered` tạo dữ liệu lặp.
  - Giảm thiểu: idempotency key/event store cho UPS-026.

## 7) Checklist Go-live

- Endpoint profile/address chạy qua gateway với JWT bắt buộc.
- Rule 1 default address/user được đảm bảo ở DB và service layer.
- Event `profile.updated`/`address.updated` được audit-log ghi nhận.
- Metrics request/latency/error được expose cho monitoring.
