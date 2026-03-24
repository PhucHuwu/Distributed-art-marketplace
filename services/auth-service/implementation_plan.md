# Implementation Plan - Auth Service

## 1) Mục tiêu

- Cung cấp nền tảng xác thực tập trung cho toàn hệ thống: register, login, refresh, logout, me.
- Chuẩn hóa JWT claims (`sub`, `email`, `role`) và cơ chế phân quyền `USER`/`ADMIN`.
- Phát sự kiện `user.registered`, `user.login_succeeded` theo event envelope chuẩn để service khác subscribe.

## 2) Phạm vi MVP

- Bao gồm: AUTH-001 -> AUTH-038 trong `TASKS.md`.
- Ưu tiên production baseline: bảo mật cơ bản, migration ổn định, auth flow hoàn chỉnh, test pass.

## 3) Phụ thuộc và contract

- PostgreSQL schema `auth`.
- RabbitMQ cho publish event.
- Gateway cần tích hợp verify JWT và route các endpoint `/auth/*`.
- User Profile Service consume `user.registered` để tạo profile rỗng.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và guardrails

- Task: AUTH-001, AUTH-002, AUTH-003, AUTH-004, AUTH-005, AUTH-006, AUTH-007, AUTH-008.
- Kết quả:
  - Service chạy local với `GET /health`.
  - Env validation fail-fast.
  - Error format thống nhất (`code`, `message`, `details`).

### Phase 1 - Data model và auth core

- Task: AUTH-009, AUTH-010, AUTH-011, AUTH-012, AUTH-013, AUTH-014, AUTH-015, AUTH-016, AUTH-017, AUTH-018, AUTH-019.
- Kết quả:
  - Migration schema `auth` chạy ổn định.
  - Flow register/login/refresh/logout/me end-to-end qua DB.
  - Password policy và bcrypt được áp dụng thống nhất.

### Phase 2 - JWT/RBAC và event integration

- Task: AUTH-020, AUTH-021, AUTH-022, AUTH-023, AUTH-024, AUTH-025, AUTH-026, AUTH-027.
- Kết quả:
  - Utility sign/verify JWT dùng chung cho gateway/service.
  - Refresh token rotation hoạt động đúng rule.
  - Publish event có retry + DLQ strategy.

### Phase 3 - Test, vận hành, tài liệu, release

- Task: AUTH-028, AUTH-029, AUTH-030, AUTH-031, AUTH-032, AUTH-033, AUTH-034, AUTH-035, AUTH-036, AUTH-037, AUTH-038.
- Kết quả:
  - Unit/integration/security/race-condition test pass.
  - Dockerfile, logging correlation id, API docs, runbook hoàn chỉnh.
  - Sẵn sàng tích hợp liên service qua gateway.

## 5) Mốc thực thi đề xuất

- Tuần 1: hoàn thành Phase 0 + phần đầu Phase 1 (migrations, register/login).
- Tuần 2: hoàn thành Phase 1 + Phase 2.
- Tuần 3: hoàn thành Phase 3, fix bug tích hợp, chốt docs.

## 6) Rủi ro chính và giảm thiểu

- Rò rỉ thông tin nhạy cảm trong log.
  - Giảm thiểu: mask token/password, review logger middleware trước khi release.
- Race condition khi đăng ký cùng email.
  - Giảm thiểu: unique index + xử lý lỗi conflict chuẩn + test AUTH-031.
- Refresh token replay.
  - Giảm thiểu: rotation + revoke cũ + kiểm soát `revoked_at`.

## 7) Checklist Go-live

- Migration `auth` đã chạy sạch trên local/staging.
- Toàn bộ endpoint `/auth/*` chạy qua gateway.
- Event `user.registered` và `user.login_succeeded` xuất hiện trong audit logs.
- Runbook rotate secret và thu hồi token đã được review bởi team vận hành.
