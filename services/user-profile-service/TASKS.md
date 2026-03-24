# User Profile Service - Chi tiết công việc

Schema: `users`  
Trách nhiệm: quản lý hồ sơ người dùng, avatar, địa chỉ giao hàng, thông tin liên hệ.

## 1) Khởi tạo service

- [ ] UPS-001 Tạo `package.json` và scripts `dev`, `start`, `lint`, `test`.
- [ ] UPS-002 Tạo cấu trúc thư mục: `src/modules/profile`, `src/modules/address`, `src/shared`.
- [ ] UPS-003 Thêm endpoint `GET /health`.
- [ ] UPS-004 Cấu hình middleware parse JSON + error handler chung.

## 2) Cấu hình và contract

- [ ] UPS-005 Định nghĩa env: `PORT`, `DB_URL`, `JWT_PUBLIC_KEY/JWT_SECRET`, `RABBITMQ_URL`.
- [ ] UPS-006 Thêm middleware xác thực JWT cho tất cả endpoint profile.
- [ ] UPS-007 Chuẩn hóa request id/correlation id trong log.
- [ ] UPS-008 Định nghĩa response schema thống nhất cho lỗi validate.

## 3) Database schema `users`

- [ ] UPS-009 Tạo migration `users.profiles` (user_id PK, full_name, phone, avatar_url, dob, gender, created_at, updated_at).
- [ ] UPS-010 Tạo migration `users.addresses` (id, user_id FK, receiver_name, phone, line1, line2, ward, district, city, province, postal_code, country, is_default).
- [ ] UPS-011 Tạo index cho `user_id`, `is_default`, `city`.
- [ ] UPS-012 Thêm rule chỉ 1 địa chỉ mặc định/user.

## 4) API Profile

- [ ] UPS-013 Implement `GET /profiles/me`.
- [ ] UPS-014 Implement `PUT /profiles/me` cập nhật tên, số điện thoại, ngày sinh.
- [ ] UPS-015 Implement validation format số điện thoại Việt Nam.
- [ ] UPS-016 Implement `PUT /profiles/me/avatar` (nhận URL avatar đã upload).

## 5) API Address

- [ ] UPS-017 Implement `GET /profiles/me/addresses`.
- [ ] UPS-018 Implement `POST /profiles/me/addresses` tạo địa chỉ mới.
- [ ] UPS-019 Implement `PUT /profiles/me/addresses/:id` cập nhật địa chỉ.
- [ ] UPS-020 Implement `DELETE /profiles/me/addresses/:id` xóa địa chỉ.
- [ ] UPS-021 Implement `PATCH /profiles/me/addresses/:id/default` đặt địa chỉ mặc định.
- [ ] UPS-022 Chặn xóa địa chỉ mặc định nếu user chỉ còn 1 địa chỉ.

## 6) Event-driven integration

- [ ] UPS-023 Consume event `user.registered` để tạo profile rỗng ban đầu.
- [ ] UPS-024 Publish event `profile.updated` khi profile thay đổi.
- [ ] UPS-025 Publish event `address.updated` khi địa chỉ thay đổi.
- [ ] UPS-026 Thêm cơ chế idempotency khi consume event trùng lặp.

## 7) Test

- [ ] UPS-027 Unit test validation phone/date/address fields.
- [ ] UPS-028 Integration test CRUD profile.
- [ ] UPS-029 Integration test CRUD address + logic địa chỉ mặc định.
- [ ] UPS-030 Test authorization: user A không được sửa dữ liệu user B.

## 8) Vận hành và tài liệu

- [ ] UPS-031 Tạo Dockerfile.
- [ ] UPS-032 Thêm metrics cơ bản (request count, latency, error rate).
- [ ] UPS-033 Viết API docs cho profile và address.
- [ ] UPS-034 Viết runbook xử lý sự cố khi consume event thất bại.

## Definition of Done

- [ ] UPS-035 Tất cả endpoint profile/address hoạt động qua gateway.
- [ ] UPS-036 Migration schema `users` chạy ổn định local.
- [ ] UPS-037 Test pass và event được audit-log ghi nhận.
