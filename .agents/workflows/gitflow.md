---
description: Quy chuẩn Git Commit vào dự án Distributed Art Marketplace
---

# Hướng dẫn Workflow cho Git Commit

1. **Step 1:** Kiểm tra bạn đang ở đúng nhánh của mình (`phucth`, `anhlt`, `datlt`, `vubn`, `tuanhm`).

```bash
git branch
```

2. **Step 2:** Cập nhật code và viết Commit message bằng tiếng Anh chuyên nghiệp (KHÔNG CHỨA EMOJI, không sai chính tả).

```bash
git add .
git commit -m "feat: complete initial setup for auth service"
```

3. **Step 3:** Tại thời điểm Commit, Git Hook (Husky) sẽ ép buộc tự động chạy `eslint --fix` và `prettier --write` đối với các file đã được stagging.
   - Nếu có lỗi ESLint không thể tư sửa được (ví dụ `no-unused-vars` không thể xóa mà không bị hỏng logic), tiến trình sẽ huỷ. Bạn phải tự sửa tay rồi Commit lại.

4. **Step 4:** Đồng ý đẩy luôn cả `.env` lên nhánh từ xa (nếu chưa có).

```bash
git push origin <tên_nhánh_của_bạn>
```

5. **Step 5:** Tạo Merge Request (MR) vào nhánh `develop`. Code từ `develop` sẽ đồng bộ vào `main` khi release.
