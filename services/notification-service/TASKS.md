# Notification Service - Chi tiết công việc

DB: không bắt buộc (có thể dùng Redis cache nếu cần)  
Trách nhiệm: lắng nghe event và gửi thông báo Email/SMS/in-app.

## 1) Khởi tạo service

- [ ] NOTI-001 Tạo bộ khung service + scripts `dev`, `start`, `lint`, `test`.
- [ ] NOTI-002 Cấu trúc thư mục: `src/consumers`, `src/channels/email`, `src/channels/sms`, `src/templates`.
- [ ] NOTI-003 Thêm endpoint `GET /health`.
- [ ] NOTI-004 Cấu hình logger + correlation id.

## 2) Cấu hình và provider

- [ ] NOTI-005 Định nghĩa env: `RABBITMQ_URL`, `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `SMS_PROVIDER`, `SMS_API_KEY`, `DEFAULT_FROM_EMAIL`.
- [ ] NOTI-006 Validate env theo từng kênh được bật.
- [ ] NOTI-007 Implement adapter pattern cho email provider để dễ thay thế.
- [ ] NOTI-008 Implement adapter pattern cho SMS provider.

## 3) Event consumers

- [ ] NOTI-009 Consume event `order.completed` để gửi xác nhận đơn hàng.
- [ ] NOTI-010 Consume event `payment.failed` để thông báo thanh toán thất bại.
- [ ] NOTI-011 Consume event `order.cancelled` để thông báo hủy đơn.
- [ ] NOTI-012 Validate payload bắt buộc trước khi gửi thông báo.

## 4) Mẫu nội dung thông báo

- [ ] NOTI-013 Tạo template email `order_completed` (VN).
- [ ] NOTI-014 Tạo template email `payment_failed`.
- [ ] NOTI-015 Tạo template SMS ngắn gọn cho sự kiện quan trọng.
- [ ] NOTI-016 Thêm utility render template với fallback data.

## 5) Retry và độ tin cậy

- [ ] NOTI-017 Cấu hình retry gửi thông báo theo exponential backoff.
- [ ] NOTI-018 Thêm DLQ cho message không gửi được sau N lần.
- [ ] NOTI-019 Lưu dedup key tạm thời (Redis) để tránh gửi trùng.
- [ ] NOTI-020 Tách lỗi provider tạm thời vs lỗi payload để xử lý đúng cách.

## 6) API hỗ trợ (nếu cần)

- [ ] NOTI-021 Implement `POST /admin/notifications/test-email`.
- [ ] NOTI-022 Implement `POST /admin/notifications/test-sms`.
- [ ] NOTI-023 Bảo vệ endpoint admin bằng role `ADMIN`.

## 7) Test

- [ ] NOTI-024 Unit test render template.
- [ ] NOTI-025 Unit test routing sự kiện -> đúng kênh thông báo.
- [ ] NOTI-026 Integration test consume event `order.completed`.
- [ ] NOTI-027 Test retry + DLQ + dedup.

## 8) Vận hành và tài liệu

- [ ] NOTI-028 Tạo Dockerfile.
- [ ] NOTI-029 Thêm metric: send success rate, retry count, DLQ count.
- [ ] NOTI-030 Viết runbook xử lý sự cố email/SMS provider.
- [ ] NOTI-031 Viết tài liệu mapping event -> template -> channel.

## Definition of Done

- [ ] NOTI-032 Gửi thông báo thành công cho các event chính.
- [ ] NOTI-033 Không gửi trùng khi event duplicate.
- [ ] NOTI-034 Test pass và có quy trình monitor cảnh báo.
