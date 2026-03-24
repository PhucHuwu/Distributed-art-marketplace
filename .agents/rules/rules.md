# Dự Án Web Bán Tranh Việt Nam (Hệ Thống Phân Tán)

## 1. Ngôn ngữ & Giao tiếp

- Luôn phản hồi lập trình viên bằng **tiếng Việt**.
- Chú ý không được sai lỗi tiếng Việt không dấu trong source code.
- **TUYỆT ĐỐI KHÔNG BAO GIỜ** được điền hay thêm Emoji vào trong Code.

## 2. Commit Message

- Nếu viết commit message thì hãy viết bằng **tiếng Anh một cách chuyên nghiệp** (Professional English Commit Convention). Ví dụ: `feat: add new authentication module`, `fix: resolve login bug`.

## 3. Gitflow & Roles

- Hệ thống Git có hai nhánh chính: `main` (Production) và `develop` (Staging/Integration).
- Nhánh `develop` được chia ra 5 nhánh nhánh phụ tương ứng cho 5 thành viên (developer): `phucth`, `anhlt`, `datlt`, `vubn`, `tuanhm`. Mỗi người sẽ phát triển module của mình trên nhánh mang tên mình.

## 4. Linting & Hooks (Code Quality)

- Mỗi khi commt code, hệ thống Husky sẽ tự động gọi kịch bản cấu hình trong `lint-staged`.
- `eslint --fix` và `prettier` sẽ tự động kích hoạt kiểm tra và sửa đổi code. Cần đảm bảo code vượt qua được bài kiểm tra Lint trước khi Push.

## 5. Security (Private Repo)

- Vì đây là private repos không quá quan trọng, việc **lộ key** hoặc API key là KHÔNG ảnh hưởng.
- **Sẽ commit luôn các tệp biến môi trường (`.env`, `.env.local`,... )** lên Git repository để các thành viên dễ dàng sync config, tuyệt đối không đặt chúng vào `.gitignore` (đã bỏ quy tắc chặn).
