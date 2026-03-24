# Implementation Plan - Notification Service

## 1) Mục tiêu

- Gửi thông báo email/SMS theo các event nghiệp vụ chính.
- Đảm bảo không gửi trùng và có retry/DLQ khi provider lỗi tạm thời.
- Cung cấp endpoint test kênh thông báo cho admin vận hành.

## 2) Phạm vi MVP

- Bao gồm: NOTI-001 -> NOTI-034 trong `TASKS.md`.
- Ưu tiên: consume event chính, template ổn định, reliability pipeline.

## 3) Phụ thuộc và contract

- RabbitMQ để consume event từ Order/Payment.
- Provider email/SMS thông qua adapter pattern.
- Redis (khuyến nghị) cho dedup key tạm thời.
- Gateway/Auth cho endpoint admin test notification.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và provider abstraction

- Task: NOTI-001, NOTI-002, NOTI-003, NOTI-004, NOTI-005, NOTI-006, NOTI-007, NOTI-008.
- Kết quả:
  - Service khởi chạy được, env validation theo kênh bật/tắt.
  - Adapter email/SMS cho khả năng thay provider linh hoạt.

### Phase 1 - Event consumer và template

- Task: NOTI-009, NOTI-010, NOTI-011, NOTI-012, NOTI-013, NOTI-014, NOTI-015, NOTI-016.
- Kết quả:
  - Consume các event chính và validate payload bắt buộc.
  - Template email/SMS hoàn chỉnh cho MVP.

### Phase 2 - Reliability và admin support

- Task: NOTI-017, NOTI-018, NOTI-019, NOTI-020, NOTI-021, NOTI-022, NOTI-023.
- Kết quả:
  - Retry exponential backoff + DLQ.
  - Dedup key chống gửi trùng khi event duplicate.
  - Endpoint test email/SMS chỉ cho `ADMIN`.

### Phase 3 - Test, ops, docs, release

- Task: NOTI-024, NOTI-025, NOTI-026, NOTI-027, NOTI-028, NOTI-029, NOTI-030, NOTI-031, NOTI-032, NOTI-033, NOTI-034.
- Kết quả:
  - Test routing sự kiện, retry/DLQ/dedup đầy đủ.
  - Có metric gửi thành công, retry, DLQ và runbook sự cố provider.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + consumer cơ bản.
- Tuần 2: template + reliability.
- Tuần 3: test + vận hành + docs.

## 6) Rủi ro chính và giảm thiểu

- Gửi trùng thông báo gây trải nghiệm xấu.
  - Giảm thiểu: dedup key theo `eventId + channel + recipient`.
- Tỷ lệ fail cao khi provider gián đoạn.
  - Giảm thiểu: retry backoff, DLQ, cảnh báo theo ngưỡng.
- Payload sự kiện thiếu dữ liệu để render template.
  - Giảm thiểu: schema validation + fallback template + log lỗi rõ nguyên nhân.

## 7) Checklist Go-live

- Event `order.completed`, `payment.failed`, `order.cancelled` đều gửi đúng kênh.
- Không gửi trùng khi replay event.
- Ops có endpoint test và dashboard monitor retry/DLQ.
