# Auth Service API Docs

Base path: `/auth`

## Error format chuẩn

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu đầu vào không hợp lệ",
  "details": []
}
```

## `GET /health`

- Mô tả: health check endpoint.
- Response `200`:

```json
{
  "status": "ok",
  "service": "auth-service",
  "timestamp": "2026-03-24T00:00:00.000Z"
}
```

## `POST /auth/register`

- Mô tả: tạo tài khoản mới.
- Request:

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass123"
}
```

- Response `201`:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER"
}
```

- Error codes: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`.

## `POST /auth/login`

- Mô tả: đăng nhập và nhận access + refresh token.
- Request:

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass123"
}
```

- Response `200`:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

- Error codes: `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`.

## `POST /auth/refresh`

- Mô tả: refresh access token theo cơ chế rotation refresh token.
- Request:

```json
{
  "refreshToken": "jwt"
}
```

- Response `200`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

- Error codes: `INVALID_REFRESH_TOKEN`, `TOKEN_REVOKED`, `TOKEN_EXPIRED`.

## `POST /auth/logout`

- Mô tả: thu hồi refresh token hiện tại hoặc toàn bộ token của user.
- Header: `Authorization: Bearer <accessToken>`.
- Request:

```json
{
  "refreshToken": "jwt",
  "logoutAll": false
}
```

- Response `204`: no content.
- Error codes: `UNAUTHORIZED`, `MISSING_REFRESH_TOKEN`, `INVALID_REFRESH_TOKEN`.

## `GET /auth/me`

- Mô tả: trả thông tin cơ bản của user đăng nhập.
- Header: `Authorization: Bearer <accessToken>`.
- Response `200`:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER"
}
```

- Error codes: `UNAUTHORIZED`, `USER_NOT_FOUND`.
