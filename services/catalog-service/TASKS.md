# Art Catalog Service - Chi tiết công việc

Schema: `catalog`  
Trách nhiệm: quản lý dữ liệu tranh, tác giả, danh mục, metadata (read-heavy).

## 1) Khởi tạo service

- [ ] CAT-001 Tạo bộ khung service + scripts `dev`, `start`, `lint`, `test`.
- [ ] CAT-002 Cấu trúc thư mục: `src/modules/artwork`, `src/modules/artist`, `src/modules/category`, `src/search`.
- [ ] CAT-003 Thêm endpoint `GET /health`.
- [ ] CAT-004 Cấu hình pagination defaults và max page size.

## 2) Database schema `catalog`

- [ ] CAT-005 Tạo migration `catalog.artists` (id, name, bio, birth_year, country, created_at, updated_at).
- [ ] CAT-006 Tạo migration `catalog.categories` (id, slug unique, name, description).
- [ ] CAT-007 Tạo migration `catalog.artworks` (id, title, slug unique, artist_id FK, category_id FK, description, price, currency, width, height, medium, status, created_at, updated_at).
- [ ] CAT-008 Tạo migration `catalog.artwork_images` (id, artwork_id FK, image_url, sort_order, is_primary).
- [ ] CAT-009 Tạo index cho `slug`, `artist_id`, `category_id`, `status`, `price`.

## 3) API quản trị catalog

- [ ] CAT-010 Implement `POST /admin/artists`.
- [ ] CAT-011 Implement `POST /admin/categories`.
- [ ] CAT-012 Implement `POST /admin/artworks`.
- [ ] CAT-013 Implement `PUT /admin/artworks/:id`.
- [ ] CAT-014 Implement `POST /admin/artworks/:id/images` và sắp xếp thứ tự ảnh.
- [ ] CAT-015 Thêm middleware role `ADMIN` cho tất cả endpoint `/admin/*`.

## 4) API public catalog

- [ ] CAT-016 Implement `GET /artworks` (filter category, artist, price range, sort, pagination).
- [ ] CAT-017 Implement `GET /artworks/:slug` (chi tiết tranh + danh sách ảnh).
- [ ] CAT-018 Implement `GET /artists` và `GET /categories`.
- [ ] CAT-019 Implement full-text search cơ bản theo `title`, `artist name`.
- [ ] CAT-020 Thêm response cache (in-memory/redis) cho endpoint read-heavy.

## 5) Đồng bộ dữ liệu với inventory

- [ ] CAT-021 Consume event `inventory.reserved` để cập nhật trạng thái artwork (tạm khóa bán).
- [ ] CAT-022 Consume event `inventory.released` để mở bán lại artwork.
- [ ] CAT-023 Consume event `order.completed` để đánh dấu artwork đã bán.
- [ ] CAT-024 Đảm bảo update trạng thái idempotent theo `eventId`.

## 6) Event-driven integration

- [ ] CAT-025 Publish event `catalog.artwork_created`.
- [ ] CAT-026 Publish event `catalog.artwork_updated`.
- [ ] CAT-027 Publish event `catalog.artwork_status_changed`.
- [ ] CAT-028 Chuẩn hóa event payload để service khác có thể subscribe dễ dàng.

## 7) Test

- [ ] CAT-029 Unit test cho filter builder và sort parser.
- [ ] CAT-030 Integration test cho CRUD admin.
- [ ] CAT-031 Integration test cho listing public + pagination + filter.
- [ ] CAT-032 Test performance cơ bản cho endpoint `GET /artworks` với dataset lớn.

## 8) Vận hành và tài liệu

- [ ] CAT-033 Tạo Dockerfile.
- [ ] CAT-034 Thêm observability: structured log, metric latency query.
- [ ] CAT-035 Viết API docs cho admin/public endpoints.
- [ ] CAT-036 Viết hướng dẫn import danh mục tranh từ file CSV (nếu cần).

## Definition of Done

- [ ] CAT-037 API read-heavy đáp ứng SLA nội bộ (thời gian phản hồi mục tiêu).
- [ ] CAT-038 Đồng bộ trạng thái artwork với inventory/order chính xác qua event.
- [ ] CAT-039 Test pass và docs đầy đủ cho FE + QA.
