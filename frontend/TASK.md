# FE-02 Frontend Replacement Task (frontend2 -> frontend)

- Owner: `tuanhm`
- Branch: `tuanhm`
- Service path: `frontend` (chính thức) + `frontend-legacy` (bản lưu rollback)

## Scope

- Thay thế frontend hiện tại bằng frontend mới từ thư mục `frontend2`.
- Giữ nguyên nghiệp vụ và tích hợp backend theo đặc tả hiện có (`frontend/frontend-functional-spec.md`).
- Đảm bảo route cốt lõi không bị thiếu, auth/session không bị sai, API contract không bị lệch.
- Cập nhật tài liệu, script, và runbook để team chỉ còn một frontend chính thức.

## Micro Tasks (do in order)

### Phase A - Baseline Audit & Mapping

- [x] R1 - Đọc toàn bộ `frontend/frontend-functional-spec.md` và trích danh sách route/API bắt buộc.
- [x] R2 - Liệt kê đầy đủ route đang có trong `frontend`.
- [x] R3 - Liệt kê đầy đủ route đang có trong `frontend2`.
- [x] R4 - So sánh route `frontend2` với đặc tả để phát hiện route thiếu/thừa.
- [x] R5 - Liệt kê endpoint auth đang được `frontend2` gọi.
- [x] R6 - Liệt kê endpoint catalog đang được `frontend2` gọi.
- [x] R7 - Liệt kê endpoint inventory đang được `frontend2` gọi.
- [x] R8 - Liệt kê endpoint cart/order đang được `frontend2` gọi.
- [x] R9 - Liệt kê endpoint payment đang được `frontend2` gọi.
- [x] R10 - Liệt kê endpoint profile/address đang được `frontend2` gọi.
- [x] R11 - So sánh endpoint của `frontend2` với API Matrix trong spec.
- [x] R12 - Lập danh sách mismatch về path/method/payload/response field.
- [x] R13 - Kiểm tra key token storage hiện tại của `frontend2` có đúng `dam.auth.token`.
- [x] R14 - Kiểm tra luồng bootstrap verify token của `frontend2`.
- [x] R15 - Kiểm tra `x-correlation-id` đã được gửi cho mọi request trong `frontend2`.
- [x] R16 - Kiểm tra error envelope mapping của `frontend2` có lấy `correlationId`.
- [x] R17 - Kiểm tra route protected trong `frontend2` có redirect login với `next`.
- [x] R18 - Kiểm tra logic polling order/payment của `frontend2`.
- [x] R19 - Chốt danh sách gap cần fix trước khi thay thế chính thức.

### Phase B - Contract Alignment in frontend2

- [x] R20 - Chuẩn hóa type API envelope theo contract backend hiện tại.
- [x] R21 - Chuẩn hóa type `ApiError` để chứa `code/message/status/details/correlationId`.
- [x] R22 - Chuẩn hóa model `CatalogArtwork` theo response thực tế từ backend.
- [x] R23 - Chuẩn hóa model `Cart` và `CartItem` theo response thực tế từ backend.
- [x] R24 - Chuẩn hóa model `Order` và `OrderItem` theo response thực tế từ backend.
- [x] R25 - Chuẩn hóa model `Payment` và `PaymentDetail` theo response thực tế từ backend.
- [x] R26 - Chuẩn hóa model `UserProfile` và `UserAddress` theo response thực tế từ backend.
- [x] R27 - Cập nhật `lib/http.ts` để parse lỗi an toàn khi backend trả lỗi HTTP/non-JSON.
- [x] R28 - Chuẩn hóa `BASE_URL` xử lý trailing slash để tránh URL lỗi.
- [x] R29 - Đảm bảo request auth không gửi token khi chưa có token.
- [x] R30 - Đảm bảo request protected fail đúng khi thiếu/expired token.
- [x] R31 - Refactor `catalogApi.listArtworks` về cơ chế chung (giữ được `meta`).
- [x] R32 - Đảm bảo metadata phân trang được map đúng field `page/limit/total/totalPages`.
- [x] R33 - Chuẩn hóa payload `createOrder` theo `shippingAddress` snapshot.
- [x] R34 - Chuẩn hóa payload `createPayment` theo contract payment-service hiện tại.
- [x] R35 - Chuẩn hóa address payload (required/optional fields) theo profile-service.
- [x] R36 - Thêm utility chuẩn hóa hiển thị lỗi user-facing từ `ApiError`.
- [x] R37 - Đảm bảo mọi lỗi API quan trọng đều có hiển thị `correlationId`.

### Phase C - Route Behavior Hardening

- [x] R38 - Kiểm tra và sửa `/` để giữ đủ search/filter/pagination.
- [x] R39 - Kiểm tra và sửa `/artworks/[idOrSlug]` để luôn gọi inventory theo `artwork.id`.
- [x] R40 - Kiểm tra và sửa add-to-cart khi chưa login để redirect đúng `next`.
- [x] R41 - Kiểm tra và sửa `/auth/login` redirect `next` sau login.
- [x] R42 - Kiểm tra và sửa `/auth/register` auto-login + redirect chuẩn.
- [x] R43 - Kiểm tra và sửa `/cart` cho update/remove item và tổng tiền chính xác.
- [x] R44 - Kiểm tra và sửa `/checkout` để load đồng thời cart + addresses.
- [x] R45 - Kiểm tra và sửa validate địa chỉ trước khi tạo mới.
- [x] R46 - Kiểm tra và sửa luồng `createOrder -> wait AWAITING_PAYMENT -> createPayment`.
- [x] R47 - Kiểm tra và sửa nhánh fail/cancel trong checkout để điều hướng order detail.
- [x] R48 - Kiểm tra và sửa `/payments/result` lấy đồng thời payment + order.
- [x] R49 - Kiểm tra và sửa polling ở payment result theo điều kiện trạng thái.
- [x] R50 - Kiểm tra và sửa `/orders/me` hiển thị danh sách từ backend thật.
- [x] R51 - Kiểm tra và sửa `/orders/[orderId]` polling khi `PENDING/AWAITING_PAYMENT`.
- [x] R52 - Kiểm tra và sửa `/profile` CRUD profile/address đầy đủ.
- [x] R53 - Kiểm tra và sửa set default address đúng rule backend.
- [x] R54 - Kiểm tra và sửa global loading/error/not-found để không mất fallback.

### Phase D - Replacement Execution (swap frontend2 into frontend)

- [x] R55 - Chốt thời điểm freeze thay đổi ở thư mục `frontend` cũ.
- [x] R56 - Backup snapshot thư mục `frontend` hiện tại thành `frontend-legacy` (hoặc tag commit).
- [x] R57 - Tạo checklist file cần giữ từ `frontend` cũ (nếu có tài liệu/spec).
- [x] R58 - Sao chép source `frontend2` sang `frontend` theo cấu trúc chuẩn.
- [x] R59 - Đảm bảo file môi trường mẫu tồn tại tại `frontend/.env.example`.
- [x] R60 - Đồng bộ `frontend/package.json` scripts chuẩn (`dev/build/start/lint`).
- [x] R61 - Đồng bộ lockfile theo package manager quyết định (npm hoặc pnpm).
- [x] R62 - Xóa/điều chỉnh import alias sai sau khi di chuyển thư mục.
- [x] R63 - Cập nhật tất cả path tham chiếu tài liệu từ `frontend2` về `frontend`.
- [x] R64 - Đảm bảo artifact không cần thiết không đi vào repo (cache/build output).

### Phase E - Docs & Runbook Update

- [x] R65 - Cập nhật `frontend/README.md` theo source mới và lệnh chạy thực tế.
- [x] R66 - Giữ/cập nhật `frontend/frontend-functional-spec.md` khớp implementation mới.
- [x] R67 - Cập nhật root `README.md` bỏ wording “frontend reserved later phase”.
- [x] R68 - Bổ sung mục quickstart frontend mới trong root docs.
- [x] R69 - Cập nhật `TASKS.md` trạng thái FE-02 và liên kết task chi tiết.
- [x] R70 - Cập nhật checklist smoke test có bước chạy frontend mới.
- [x] R71 - Ghi rõ biến môi trường frontend bắt buộc và giá trị local mặc định.

### Phase F - Quality Gates

- [x] R72 - Chạy `npm install` trong `frontend` và fix lỗi dependency.
- [x] R73 - Chạy `npm run lint` trong `frontend` và fix toàn bộ lỗi.
- [x] R74 - Chạy `npm run build` trong `frontend` và fix lỗi build/runtime typing.
- [ ] R75 - Chạy frontend local + backend stack local để test integration thực. (Blocked: Docker daemon unavailable)
- [ ] R76 - Test thủ công flow auth: register/login/verify/logout. (Blocked: backend stack unavailable)
- [ ] R77 - Test thủ công flow catalog -> detail -> add to cart. (Blocked: backend stack unavailable)
- [ ] R78 - Test thủ công flow cart update/remove. (Blocked: backend stack unavailable)
- [ ] R79 - Test thủ công flow checkout -> create order -> create payment. (Blocked: backend stack unavailable)
- [ ] R80 - Test thủ công flow payment result polling. (Blocked: backend stack unavailable)
- [ ] R81 - Test thủ công flow orders/me và order detail polling. (Blocked: backend stack unavailable)
- [ ] R82 - Test thủ công flow profile + address CRUD + default address. (Blocked: backend stack unavailable)
- [ ] R83 - Test các nhánh lỗi chính: unauthorized, payment failed, order failed. (Blocked: backend stack unavailable)
- [ ] R84 - Xác nhận hiển thị `correlationId` khi backend trả lỗi. (Blocked: backend stack unavailable)
- [ ] R85 - Chạy smoke checklist cuối và lưu test evidence. (Blocked: backend stack unavailable)

### Phase G - Decommission & Handover

- [x] R86 - Quyết định trạng thái thư mục `frontend2` (xóa hoặc lưu archive theo chính sách team).
- [x] R87 - Nếu giữ archive, đổi tên rõ mục đích để tránh chạy nhầm.
- [x] R88 - Nếu xóa, xác nhận không còn script/docs nào tham chiếu `frontend2`.
- [x] R89 - Rà soát git diff để chắc chắn không chứa file secret/env local.
- [x] R90 - Chuẩn bị PR note: scope thay thế, rủi ro, rollback plan.
- [x] R91 - Tạo rollback guide nhanh về commit/tag của `frontend` cũ.
- [ ] R92 - Mời review từ owner backend liên quan (auth/order/payment/profile/catalog).
- [ ] R93 - Chốt biên bản nghiệm thu theo Acceptance Checklist.

## Backend Coordination Tasks (mandatory)

- [ ] C1 - Re-validate auth contract với `auth-service` owner (`anhlt`).
- [ ] C2 - Re-validate profile/address contract với `user-profile-service` owner (`anhlt`).
- [ ] C3 - Re-validate catalog + inventory contract với `catalog-service`/`inventory-service` owner (`datlt`).
- [ ] C4 - Re-validate cart/order lifecycle contract với `order-service` owner (`tuanhm`).
- [ ] C5 - Re-validate payment state contract với `payment-service` owner (`vubn`).
- [ ] C6 - Re-check gateway route mapping/CORS với root owner (`phucth`).
- [ ] C7 - Thông báo team trước khi merge nếu có khác biệt payload/response.

## PR Note Draft

- Scope: thay thế toàn bộ storefront từ `frontend` cũ sang source mới (trước đây ở `frontend2`) và chuẩn hóa contract với backend hiện tại.
- Main changes: route/pages giữ theo functional spec; refactor API client/types; đồng bộ auth/session, correlation-id, polling order/payment; cập nhật README/spec/task docs.
- Validation done: `npm run build` và `npm run lint` pass trong `frontend`.
- Known blocked: chưa chạy được smoke/integration E2E do Docker daemon local chưa sẵn sàng (`/var/run/docker.sock` unavailable).
- Rollback plan: dùng thư mục `frontend-legacy` làm baseline khôi phục nhanh nếu cần revert toàn bộ replacement.

## Rollback Guide

1. Đổi tên `frontend` hiện tại sang `frontend-failed`.
2. Đổi tên `frontend-legacy` về `frontend`.
3. Chạy lại `npm install`, `npm run build`, `npm run lint` trong `frontend`.
4. Nếu cần rollback ở mức git, checkout commit ngay trước FE-02 replacement.

## Acceptance Criteria

- Route và luồng nghiệp vụ của frontend mới đạt đầy đủ theo `frontend/frontend-functional-spec.md`.
- Toàn bộ API gọi đúng endpoint/method/auth headers và xử lý envelope chuẩn.
- Auth/session hoạt động ổn định, protected route redirect đúng `next`.
- Order/payment polling chạy đúng điều kiện trạng thái.
- Không dùng mock data cho các flow chính; chạy được với backend local qua gateway.
- Lint và build pass trong thư mục `frontend` sau thay thế.
- Docs và runbook được cập nhật để team chỉ dùng một frontend chính thức.

## Mandatory System Notes

- Không thay đổi backend contract trừ khi có thống nhất liên team và cập nhật docs.
- Không đưa token/secret vào log hoặc commit.
- Mọi thay đổi liên quan route/API phải cập nhật ngay trong tài liệu frontend.
- Nếu cần rollback, phải giữ đường lui rõ ràng về bản `frontend` trước thay thế.
