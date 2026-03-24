# Implementation Plan - Catalog Service

## 1) Mục tiêu

- Quản lý danh mục tranh (artists, categories, artworks, images) cho cả admin và public.
- Tối ưu workload read-heavy với filter/sort/pagination/search và cache.
- Đồng bộ trạng thái artwork theo event từ Inventory/Order.

## 2) Phạm vi MVP

- Bao gồm: CAT-001 -> CAT-039 trong `TASKS.md`.
- Ưu tiên: public listing ổn định, admin CRUD đầy đủ, đồng bộ trạng thái chính xác theo event.

## 3) Phụ thuộc và contract

- PostgreSQL schema `catalog`.
- Auth/Gateway cho RBAC endpoint `/admin/*`.
- RabbitMQ để consume `inventory.reserved`, `inventory.released`, `order.completed`; publish event catalog.

## 4) Kế hoạch triển khai theo phase

### Phase 0 - Bootstrap và baseline read API

- Task: CAT-001, CAT-002, CAT-003, CAT-004.
- Kết quả:
  - Service có cấu trúc module rõ ràng và pagination config chuẩn.
  - Health endpoint sẵn cho monitoring.

### Phase 1 - Schema và admin CRUD

- Task: CAT-005, CAT-006, CAT-007, CAT-008, CAT-009, CAT-010, CAT-011, CAT-012, CAT-013, CAT-014, CAT-015.
- Kết quả:
  - Schema catalog đầy đủ, index đúng cho truy vấn chính.
  - Admin CRUD artist/category/artwork/images đã có RBAC.

### Phase 2 - Public APIs và tối ưu read-heavy

- Task: CAT-016, CAT-017, CAT-018, CAT-019, CAT-020.
- Kết quả:
  - Public listing hỗ trợ filter/sort/pagination/search.
  - Cache cho endpoint trọng điểm `GET /artworks`.

### Phase 3 - Event sync, reliability, test, docs

- Task: CAT-021, CAT-022, CAT-023, CAT-024, CAT-025, CAT-026, CAT-027, CAT-028, CAT-029, CAT-030, CAT-031, CAT-032, CAT-033, CAT-034, CAT-035, CAT-036, CAT-037, CAT-038, CAT-039.
- Kết quả:
  - Trạng thái artwork đồng bộ đúng theo event lifecycle.
  - Publish contract event catalog rõ ràng, dễ subscribe.
  - Có test hiệu năng cơ bản và tài liệu import danh mục.

## 5) Mốc thực thi đề xuất

- Tuần 1: Phase 0 + schema + admin CRUD cơ bản.
- Tuần 2: hoàn thiện public APIs + search/cache.
- Tuần 3: event sync + test performance + docs.

## 6) Rủi ro chính và giảm thiểu

- Query listing chậm khi dataset lớn.
  - Giảm thiểu: index đúng cột lọc, cache theo query key, giới hạn max page size.
- Sai lệch trạng thái artwork so với inventory.
  - Giảm thiểu: cập nhật idempotent theo `eventId`, job reconciliation định kỳ.
- Contract event khó dùng cho service khác.
  - Giảm thiểu: chuẩn hóa payload versioned ngay từ CAT-028.

## 7) Checklist Go-live

- SLA nội bộ endpoint đọc chính đạt mục tiêu.
- Luồng cập nhật trạng thái artwork qua event đã test đủ case reserve/release/sold.
- API docs admin/public và contract event sẵn cho FE + QA + integrations.
