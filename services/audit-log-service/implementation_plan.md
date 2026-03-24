# Implementation Plan - Audit Log Service

## 1) Mục tiêu

- Ghi nhận tập trung toàn bộ event hệ thống để phục vụ truy vết và quản trị.
- Cung cấp API tra cứu audit cho admin với filter/pagination hiệu quả.
- Đảm bảo idempotency và retention policy để vận hành dài hạn.

## 2) Phạm vi MVP

- Bao gồm: AUD-001 -> AUD-034 trong `TASKS.md`.
- Ưu tiên ingest ổn định, API tra cứu nhanh, monitoring consume lỗi.

## 3) Phụ thuộc và contract

- PostgreSQL schema `audit_logs`.
- RabbitMQ subscribe event từ tất cả services.
- Gateway/Auth cho RBAC endpoint `/admin/audit-logs*`.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và data foundation

- Task: AUD-001, AUD-002, AUD-003, AUD-004, AUD-005, AUD-006, AUD-007, AUD-008.
- Kết quả:
  - Service có cấu trúc consumer + query module rõ ràng.
  - Schema events/errors có index cho truy vấn chính.
  - Đánh giá partition theo tháng nếu tốc độ ingest cao.

### Phase 1 - Ingest pipeline và idempotency

- Task: AUD-009, AUD-010, AUD-011, AUD-012.
- Kết quả:
  - Subscribe đầy đủ event từ các service lõi.
  - Validate envelope và lưu chuẩn hóa vào `audit_logs.events`.
  - Idempotent theo `event_id`.

### Phase 2 - Admin query APIs

- Task: AUD-013, AUD-014, AUD-015, AUD-016.
- Kết quả:
  - API filter theo `event_type`, `source_service`, `date_range`, `actor_id`.
  - Pagination + sort `occurred_at desc`.
  - RBAC `ADMIN` cho toàn bộ endpoint.

### Phase 3 - Reliability, retention, test, docs

- Task: AUD-017, AUD-018, AUD-019, AUD-020, AUD-021, AUD-022, AUD-023, AUD-024, AUD-025, AUD-026, AUD-027, AUD-028, AUD-029, AUD-030, AUD-031, AUD-032, AUD-033, AUD-034.
- Kết quả:
  - Retry consume, DLQ và bảng `processing_errors` hoạt động.
  - Chính sách retention + archive/delete được triển khai.
  - Metric ingest/lag/error và runbook truy vết event chain đầy đủ.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + ingest cơ bản.
- Tuần 2: admin query APIs + hardening idempotency.
- Tuần 3: retention/compliance + test + docs + monitor.

## 6) Rủi ro chính và giảm thiểu

- Tăng trưởng dữ liệu nhanh làm chậm query admin.
  - Giảm thiểu: index đúng, partition theo tháng, retention rõ ràng.
- Lưu payload chứa dữ liệu nhạy cảm.
  - Giảm thiểu: sanitize/mask trước khi persist, review compliance định kỳ.
- Mất khả năng truy vết khi consumer lag lớn.
  - Giảm thiểu: metric lag + alert threshold + runbook scale consumer.

## 7) Checklist Go-live

- Ghi nhận đủ event chính trong luồng order end-to-end.
- Admin filter tra cứu nhanh, chính xác và phân quyền đúng.
- Retention policy và monitoring ingest/error đã vận hành được.
