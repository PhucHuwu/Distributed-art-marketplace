# Payment Service - Chi tiết công việc

Schema: `payments`  
Trách nhiệm: xử lý giao dịch thanh toán, trạng thái dòng tiền, callback kết quả.

## 1) Khởi tạo service

- [ ] PAY-001 Tạo bộ khung service + scripts `dev`, `start`, `lint`, `test`.
- [ ] PAY-002 Cấu trúc thư mục: `src/modules/payment`, `src/modules/provider`, `src/events`.
- [ ] PAY-003 Thêm endpoint `GET /health`.
- [ ] PAY-004 Thêm middleware verify chữ ký callback từ payment provider.

## 2) Cấu hình và bảo mật

- [ ] PAY-005 Định nghĩa env: `PORT`, `DB_URL`, `PAYMENT_PROVIDER`, `PROVIDER_API_KEY`, `PROVIDER_SECRET`, `RETURN_URL`, `WEBHOOK_SECRET`.
- [ ] PAY-006 Validate env fail-fast khi thiếu key bắt buộc.
- [ ] PAY-007 Mã hóa/bảo vệ thông tin nhạy cảm trong log (mask token/secret).

## 3) Database schema `payments`

- [ ] PAY-008 Tạo migration `payments.transactions` (id, order_id unique, user_id, amount, currency, method, status, provider, provider_txn_id, created_at, updated_at).
- [ ] PAY-009 Tạo migration `payments.webhook_logs` (id, provider, event_type, payload_json, signature, received_at, processed_at, status).
- [ ] PAY-010 Tạo index cho `order_id`, `provider_txn_id`, `status`.

## 4) API thanh toán

- [ ] PAY-011 Implement `POST /payments/initiate` (nhận `order_id`, amount) để tạo giao dịch.
- [ ] PAY-012 Tạo payment link/session với provider và trả URL cho frontend.
- [ ] PAY-013 Implement `GET /payments/:orderId/status`.
- [ ] PAY-014 Implement `POST /payments/webhook` nhận callback provider.
- [ ] PAY-015 Xác thực signature webhook trước khi xử lý.

## 5) Xử lý trạng thái giao dịch

- [ ] PAY-016 Mapping trạng thái provider -> trạng thái nội bộ (`PENDING`, `SUCCESS`, `FAILED`).
- [ ] PAY-017 Publish `payment.success` khi giao dịch thành công.
- [ ] PAY-018 Publish `payment.failed` khi giao dịch thất bại/hết hạn.
- [ ] PAY-019 Đảm bảo webhook xử lý idempotent (duplicate callback không gây lỗi).

## 6) Reconciliation và timeout

- [ ] PAY-020 Tạo job đối soát giao dịch `PENDING` qua API provider.
- [ ] PAY-021 Đánh dấu `FAILED_TIMEOUT` cho giao dịch quá hạn.
- [ ] PAY-022 Publish event tương ứng sau khi đối soát thay đổi trạng thái.

## 7) Test

- [ ] PAY-023 Unit test mapping trạng thái provider.
- [ ] PAY-024 Integration test `initiate` và webhook callback hợp lệ.
- [ ] PAY-025 Test webhook signature sai/phát lại duplicate.
- [ ] PAY-026 Test flow thanh toán thành công/thất bại với order service.

## 8) Vận hành và tài liệu

- [ ] PAY-027 Tạo Dockerfile.
- [ ] PAY-028 Thêm metric: payment success rate, callback latency, pending aging.
- [ ] PAY-029 Viết API docs + webhook contract.
- [ ] PAY-030 Viết runbook xử lý sự cố provider down/chậm callback.

## Definition of Done

- [ ] PAY-031 Trạng thái thanh toán đồng bộ đúng với order và inventory qua event.
- [ ] PAY-032 Webhook an toàn, idempotent, có log truy vết đầy đủ.
- [ ] PAY-033 Test pass, docs đầy đủ cho FE/ops.
