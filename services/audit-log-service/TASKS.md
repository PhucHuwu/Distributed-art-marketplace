# Audit Log Service - Chi tiết công việc

Schema: `audit_logs`  
Trách nhiệm: consumer trung tâm ghi nhận toàn bộ sự kiện hệ thống cho admin.

## 1) Khởi tạo service

- [ ] AUD-001 Tạo bộ khung service + scripts `dev`, `start`, `lint`, `test`.
- [ ] AUD-002 Cấu trúc thư mục: `src/consumers`, `src/modules/audit-log`, `src/modules/admin-query`.
- [ ] AUD-003 Thêm endpoint `GET /health`.
- [ ] AUD-004 Cấu hình logger và trace id.

## 2) Database schema `audit_logs`

- [ ] AUD-005 Tạo migration `audit_logs.events` (id, event_id unique, event_type, source_service, actor_id, actor_type, entity_id, entity_type, payload_json, occurred_at, received_at).
- [ ] AUD-006 Tạo migration `audit_logs.processing_errors` (id, event_id, reason, payload_json, failed_at, retry_count).
- [ ] AUD-007 Tạo index cho `event_type`, `source_service`, `occurred_at`, `actor_id`.
- [ ] AUD-008 Xem xét partition theo tháng cho bảng logs (nếu dữ liệu lớn).

## 3) Consume event hệ thống

- [ ] AUD-009 Subscribe các event từ auth/user/catalog/inventory/order/payment/notification.
- [ ] AUD-010 Validate event envelope trước khi lưu.
- [ ] AUD-011 Lưu event vào `audit_logs.events` theo format thống nhất.
- [ ] AUD-012 Đảm bảo idempotency theo `event_id`.

## 4) API tra cứu cho Admin

- [ ] AUD-013 Implement `GET /admin/audit-logs` filter theo `event_type`, `source_service`, `date_range`, `actor_id`.
- [ ] AUD-014 Implement `GET /admin/audit-logs/:id` xem chi tiết payload.
- [ ] AUD-015 Implement pagination + sort `occurred_at desc`.
- [ ] AUD-016 Bảo vệ endpoint bằng role `ADMIN`.

## 5) Xử lý lỗi và reliability

- [ ] AUD-017 Retry consume khi DB tạm thời lỗi.
- [ ] AUD-018 Đẩy message lỗi nghiêm trọng vào DLQ.
- [ ] AUD-019 Ghi `processing_errors` khi payload sai format.
- [ ] AUD-020 Thêm cảnh báo khi tỉ lệ consume lỗi vượt ngưỡng.

## 6) Data retention và compliance

- [ ] AUD-021 Định nghĩa chính sách retention (ví dụ 12-24 tháng).
- [ ] AUD-022 Tạo job archive/xóa logs quá hạn theo policy.
- [ ] AUD-023 Đảm bảo payload không lưu secret/PII quá mức cần thiết.

## 7) Test

- [ ] AUD-024 Unit test parser event envelope.
- [ ] AUD-025 Integration test consume nhiều loại event.
- [ ] AUD-026 Integration test API filter/pagination.
- [ ] AUD-027 Test idempotency khi event duplicate.

## 8) Vận hành và tài liệu

- [ ] AUD-028 Tạo Dockerfile.
- [ ] AUD-029 Thêm metric: ingest throughput, lag, error rate.
- [ ] AUD-030 Viết runbook truy vết sự cố theo event chain.
- [ ] AUD-031 Viết tài liệu schema và query mẫu cho team admin/ops.

## Definition of Done

- [ ] AUD-032 Ghi nhận đầy đủ event chính trong luồng đặt hàng.
- [ ] AUD-033 Admin tra cứu nhanh và chính xác theo bộ lọc.
- [ ] AUD-034 Test pass và có cơ chế retention/monitoring.
