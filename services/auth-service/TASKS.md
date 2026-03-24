# Auth Service - Chi tiết công việc

Schema: `auth`  
Trách nhiệm: quản lý credential, đăng nhập, JWT, phân quyền cơ bản.

## 1) Khởi tạo service

- [ ] AUTH-001 Tạo `package.json` với scripts: `dev`, `start`, `lint`, `test`.
- [ ] AUTH-002 Cấu hình TypeScript/JavaScript theo convention chung monorepo.
- [ ] AUTH-003 Tạo cấu trúc thư mục: `src/config`, `src/modules/auth`, `src/shared`, `src/events`.
- [ ] AUTH-004 Thêm health check endpoint `GET /health`.

## 2) Cấu hình và bảo mật

- [ ] AUTH-005 Định nghĩa biến môi trường: `PORT`, `DB_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`.
- [ ] AUTH-006 Viết module validate env (fail-fast nếu thiếu biến).
- [ ] AUTH-007 Thêm middleware bảo mật header cơ bản (helmet/cors theo policy).
- [ ] AUTH-008 Chuẩn hóa format response lỗi (`code`, `message`, `details`).

## 3) Database schema `auth`

- [ ] AUTH-009 Tạo migration `auth.users_credentials` (id, email unique, password_hash, status, created_at, updated_at).
- [ ] AUTH-010 Tạo migration `auth.refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at).
- [ ] AUTH-011 Tạo index cho `email`, `user_id`, `expires_at`.
- [ ] AUTH-012 Tạo seed account admin/dev test (chỉ cho local).

## 4) API xác thực

- [ ] AUTH-013 Implement `POST /auth/register` (email + password).
- [ ] AUTH-014 Implement validation password policy (độ dài, ký tự đặc biệt, số, chữ hoa).
- [ ] AUTH-015 Hash password bằng bcrypt trước khi lưu DB.
- [ ] AUTH-016 Implement `POST /auth/login` trả về access token + refresh token.
- [ ] AUTH-017 Implement `POST /auth/refresh` để cấp access token mới.
- [ ] AUTH-018 Implement `POST /auth/logout` revoke refresh token.
- [ ] AUTH-019 Implement `GET /auth/me` (verify JWT và trả thông tin cơ bản).

## 5) JWT và phân quyền

- [ ] AUTH-020 Tạo utility sign/verify JWT với claims: `sub`, `email`, `role`.
- [ ] AUTH-021 Thêm middleware `authenticateJWT` dùng lại cho service/gateway.
- [ ] AUTH-022 Thêm middleware `authorizeRole` cho role `USER`, `ADMIN`.
- [ ] AUTH-023 Định nghĩa quy tắc token rotation cho refresh token.

## 6) Event-driven integration

- [ ] AUTH-024 Publish event `user.registered` sau khi tạo tài khoản thành công.
- [ ] AUTH-025 Publish event `user.login_succeeded` phục vụ audit.
- [ ] AUTH-026 Chuẩn hóa event envelope: `eventId`, `eventType`, `occurredAt`, `source`, `payload`.
- [ ] AUTH-027 Thêm retry + dead-letter strategy khi publish thất bại.

## 7) Test

- [ ] AUTH-028 Viết unit test cho password hashing và JWT utilities.
- [ ] AUTH-029 Viết integration test cho luồng register/login/refresh/logout.
- [ ] AUTH-030 Test case bảo mật: sai password, token hết hạn, token revoke.
- [ ] AUTH-031 Test race condition đăng ký cùng email.

## 8) Vận hành và tài liệu

- [ ] AUTH-032 Thêm Dockerfile cho service.
- [ ] AUTH-033 Thêm logging có correlation id cho mỗi request.
- [ ] AUTH-034 Viết API docs (request/response + mã lỗi).
- [ ] AUTH-035 Viết runbook: cách rotate JWT secret, cách thu hồi token khẩn cấp.

## Definition of Done

- [ ] AUTH-036 Toàn bộ endpoint auth hoạt động qua gateway.
- [ ] AUTH-037 Migration chạy thành công trên DB local.
- [ ] AUTH-038 Test pass và có tài liệu sử dụng cho team khác.
