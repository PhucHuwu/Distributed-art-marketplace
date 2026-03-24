# Yêu Cầu Hệ Thống: Web Bán Tranh Việt Nam (Hệ Thống Phân Tán)

## 1. Tổng quan dự án

- **Mục tiêu:** Xây dựng một ứng dụng web thương mại điện tử chuyên về mua bán tranh nghệ thuật tại Việt Nam.
- **Kiến trúc tổng thể:** Áp dụng kiến trúc Microservices (Hệ thống phân tán) tập trung vào giao tiếp hướng sự kiện (Event-Driven).

## 2. Kiến trúc & Công nghệ (Tech Stack)

- **Frontend:** Next.js (Phù hợp cho SEO và render linh hoạt SSR/SSG).
- **Backend (Microservices):** Node.js.
- **Cơ sở dữ liệu:** PostgreSQL (Sử dụng chung một instance DB nhưng **chia Schema riêng biệt** cho mỗi microservice).
- **Message Broker:** RabbitMQ.
- **API Gateway:** NGINX (Điều hướng requests từ client đến đúng service backend).
- **Xác thực/Phân quyền:** JWT (JSON Web Tokens).

## 3. Thiết kế Microservices (Chia nhỏ/Granular)

Hệ thống được chia nhỏ thành các cụm dịch vụ chuyên biệt (Single Responsibility Principle) để dễ mở rộng và bảo trì:

1. **Auth Service** (Schema: `auth`): Chuyên trách quản lý credential, đăng nhập gốc, băm mật khẩu và cấp phát/xác thực JWT.
2. **User Profile Service** (Schema: `users`): Quản lý hồ sơ người dùng (tên, avatar, địa chỉ giao hàng) - tách biệt hoàn toàn khỏi Auth.
3. **Art Catalog Service** (Schema: `catalog`): Quản lý thông tin danh mục, tác giả, hình ảnh và metadata của các bức tranh (Read-heavy).
4. **Art Inventory Service** (Schema: `inventory`): Quản trị số lượng tồn kho thực tế, xử lý bài toán trừ/cộng kho an toàn (Write-heavy).
5. **Order Service** (Schema: `orders`): Quản lý giỏ hàng, tạo và theo dõi vòng đời đơn đặt hàng.
6. **Payment Service** (Schema: `payments`): Quản lý các giao dịch thanh toán và trạng thái dòng tiền.
7. **Notification Service** (Không Database / Redis cache nếu cần): Consumer thuần túy chuyên lắng nghe event để gửi Email/SMS thông báo hệ thống.
8. **Audit Log Service (Admin)** (Schema: `audit_logs`): Dịch vụ dành cho Admin. Đóng vai trò là Consumer trung tâm lắng nghe toàn bộ các event trên hệ thống, lưu vết lịch sử mọi hành động (Audit trail) phục vụ việc tra cứu, tracking lỗi và dashboard quản trị.

## 4. Cơ chế đồng bộ trạng thái (Event-Driven)

Áp dụng mô hình **Pub/Sub (Publish/Subscribe)** thông qua RabbitMQ bằng giao thức Choreography.

**Kịch bản thực tiễn khi đặt hàng:**

1. **Tạo đơn:** Người dùng gửi request qua NGINX vào `Order Service`. `Order Service` tạo bản ghi ở schema `orders` với trạng thái `PENDING` và bắn event `order.created`.
2. **Ghi Log:** `Audit Log Service` âm thầm lắng nghe event này và ghi nhận hành vi order vào DB logs.
3. **Handle Event:** `Art Inventory Service` nhận được `order.created` và tiến hành trừ đi số lượng tồn kho.
   - Nếu đủ hàng: Gửi sự kiện `inventory.reserved`.
   - Nếu không đủ: Gửi sự kiện `inventory.failed`.
4. **Thanh toán:** Khi kho đáp ứng, trạng thái đơn chuyển sang chờ thanh toán. Sau khi user thanh toán thành công, `Payment Service` bắn event `payment.success`.
5. **Hoàn tất:** `Order Service` nhận event thanh toán thành công, đổi trạng thái thành `COMPLETED`. `Notification Service` nhận event `order.completed` và gửi email cho người mua. `Audit Log Service` lưu vết toàn bộ chu trình này cho Admin.

## 5. Tổ chức mã nguồn (Monorepo)

Dự án được tổ chức theo cấu trúc thư mục chứa các vi dịch vụ nhỏ độc lập:

- `/frontend` (Next.js web)
- `/services/auth-service` (Node.js)
- `/services/user-profile-service` (Node.js)
- `/services/catalog-service` (Node.js)
- `/services/inventory-service` (Node.js)
- `/services/order-service` (Node.js)
- `/services/payment-service` (Node.js)
- `/services/notification-service` (Node.js)
- `/services/audit-log-service` (Node.js - Dành cho Admin/Logs)
- `/gateway` (Cấu hình NGINX)
- `/infra` (Chứa `docker-compose.yml` và scripts khởi tạo DB schema chung)
