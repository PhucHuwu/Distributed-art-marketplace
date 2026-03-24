# Auth Service Runbook

## 1) Rotate JWT secret

1. Sinh secret mới (>= 32 ký tự).
2. Cập nhật biến môi trường `JWT_SECRET` cho môi trường tương ứng.
3. Restart auth-service theo quy trình deploy.
4. Verify endpoint `/health` và luồng login/refresh hoạt động bình thường.

Lưu ý: sau khi rotate secret, toàn bộ JWT cũ sẽ invalid do verify bằng secret mới.

## 2) Thu hồi token khẩn cấp

### Trường hợp cần thu hồi toàn bộ token của một user

1. Xác định `user_id` cần thu hồi.
2. Chạy SQL:

```sql
UPDATE auth.refresh_tokens
SET revoked_at = NOW()
WHERE user_id = '<USER_ID>' AND revoked_at IS NULL;
```

3. Yêu cầu user login lại để nhận token mới.

### Trường hợp cần thu hồi toàn cục

1. Rotate `JWT_SECRET` để vô hiệu hóa toàn bộ access/refresh JWT hiện tại.
2. Thu hồi các refresh token còn active:

```sql
UPDATE auth.refresh_tokens
SET revoked_at = NOW()
WHERE revoked_at IS NULL;
```

## 3) Kiểm tra nhanh sau sự cố

- Kiểm tra service sống: `GET /health`.
- Kiểm tra migration Prisma: `npm run db:migrate --workspace services/auth-service`.
- Nếu môi trường dev cần tạo migration mới: `npm run db:migrate:dev --workspace services/auth-service`.
- Nếu cần seed admin local: `npm run db:seed --workspace services/auth-service`.
- Kiểm tra test hồi quy: `npm run test --workspace services/auth-service`.
- Kiểm tra log theo `requestId` để trace request lỗi.
