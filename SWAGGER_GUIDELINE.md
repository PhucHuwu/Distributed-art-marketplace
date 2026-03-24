# Swagger / OpenAPI Guideline (Backend Phase)

## 1) Mục tiêu

- Chuẩn hóa tài liệu API cho toàn bộ backend microservices.
- Đảm bảo dev/test có thể test API nhanh bằng giao diện Swagger UI.
- Giảm sai lệch contract giữa các service.

## 2) Phạm vi áp dụng

- Áp dụng cho tất cả backend services trong `services/*`.
- Không áp dụng cho frontend trong phase hiện tại.

## 3) Chuẩn endpoint tài liệu API

- Swagger UI route: `GET /docs`
- OpenAPI JSON route: `GET /openapi.json`
- Healthcheck route: `GET /health`

Yêu cầu:

- `GET /docs` phải hiển thị được toàn bộ endpoint public/internal của service.
- `GET /openapi.json` phải hợp lệ theo OpenAPI `3.0.x` hoặc `3.1.x`.

## 4) Metadata bắt buộc trong OpenAPI

Mỗi service phải khai báo tối thiểu:

- `openapi`: `3.0.3` (khuyến nghị)
- `info.title`: `<service-name> API`
- `info.version`: `v1`
- `info.description`: mô tả ngắn mục tiêu service
- `servers`: local base URL của service
- `tags`: theo nhóm domain endpoint

Ví dụ `info.title`:

- `Auth Service API`
- `Order Service API`

## 5) Chuẩn bảo mật trong Swagger

- Dùng Bearer JWT cho endpoint cần xác thực.
- Khai báo security scheme thống nhất:
  - `type: http`
  - `scheme: bearer`
  - `bearerFormat: JWT`
- Endpoint public không yêu cầu token phải ghi rõ trong mô tả.

## 6) Chuẩn response dùng chung

Khuyến nghị response thành công:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Khuyến nghị response lỗi:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  },
  "correlationId": "uuid"
}
```

HTTP status tối thiểu cần document cho mỗi endpoint:

- `200` / `201` thành công
- `400` request không hợp lệ
- `401` chưa xác thực
- `403` không đủ quyền (nếu có)
- `404` không tìm thấy
- `409` conflict (nếu có)
- `500` lỗi hệ thống

## 7) Chuẩn đặt tag

Đề xuất tag theo domain để tài liệu dễ đọc:

- Auth Service: `Auth`
- User Profile Service: `Users`, `Addresses`
- Catalog Service: `Catalog`, `Artists`, `Categories`, `Admin`
- Inventory Service: `Inventory`
- Order Service: `Cart`, `Orders`
- Payment Service: `Payments`, `Webhook`
- Notification Service: `Notifications` (internal/debug APIs)
- Audit Log Service: `Admin Audit`

## 8) Chuẩn versioning API

- Giữ version logic ở OpenAPI `info.version: v1`.
- Khi breaking change:
  - Tạo version mới (`v2`) trong docs.
  - Không xóa ngay endpoint cũ nếu chưa có kế hoạch migration.

## 9) Yêu cầu mô tả event-driven trong Swagger

Với service có publish/consume event, cần thêm mục mô tả trong docs:

- Danh sách event publish
- Danh sách event consume
- Payload mẫu chính
- Quy tắc idempotency theo `eventId`

Lưu ý: OpenAPI chủ yếu mô tả HTTP API; phần event có thể đặt trong:

- `description` của endpoint liên quan, hoặc
- section riêng trong README của service (bắt buộc có link từ docs).

## 10) Checklist hoàn thành cho mỗi service

- [ ] Có `GET /docs` và truy cập được local.
- [ ] Có `GET /openapi.json` và hợp lệ chuẩn OpenAPI.
- [ ] Tất cả endpoint hiện có đều được khai báo trong docs.
- [ ] Endpoint cần auth đã khai báo Bearer JWT.
- [ ] Có ví dụ request/response cho các API chính.
- [ ] Có mã lỗi chính và schema lỗi chuẩn.
- [ ] Có mô tả event publish/consume (nếu service dùng event).

## 11) Trách nhiệm theo team

- Mỗi owner service chịu trách nhiệm Swagger của service mình.
- Leader (`phucth`) review tính nhất quán trước khi merge vào `develop`.
- Thay đổi contract phải cập nhật cả OpenAPI docs trong cùng PR.
