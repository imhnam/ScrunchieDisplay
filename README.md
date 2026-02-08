# Tiệm Scrunchie - Admin Panel & Website

Website hiển thị bộ sưu tập Scrunchie với giao diện Admin quản lý nội dung động qua Supabase.

## Tính năng

-   **Frontend:** HTML, Tailwind CSS, Vanilla JS.
-   **Backend:** Supabase (Database, Auth, Storage).
-   **Admin Panel:** Thêm/sửa/xóa bộ sưu tập và ảnh, cài đặt thông tin trang chủ.
-   **Hiệu ứng:** Swiper.js cho gallery, Scroll Reveal animations.

## Cài đặt & Chạy Local

1.  Clone repo về máy.
2.  Mở file `index.html` bằng Live Server hoặc mở trực tiếp.
3.  Để vào trang Admin: truy cập `/admin.html`.

## Triển khai (Deployment)

Dự án này là Static HTML/JS nên có thể deploy dễ dàng lên:
-   **Vercel / Netlify:** Kéo thả folder hoặc kết nối Git repo.
-   **GitHub Pages:** Push lên branch `gh-pages` hoặc main.

## Cấu hình Supabase

Thông tin cấu hình nằm trong `supabase-config.js`. Đảm bảo bạn đã thiết lập đúng URL và Anon Key.

**Lưu ý bảo mật:**
-   File `migrate-to-supabase.js` chứa Service Role Key (quyền admin cao nhất) nên **KHÔNG** được commit lên Git.
-   Chỉ commit `supabase-config.js` chứa Anon Key (công khai).

## Cấu trúc thư mục

-   `index.html`: Trang chủ.
-   `admin.html`: Trang quản trị.
-   `script.js`: Logic trang chủ (fetch dữ liệu Supabase, hiệu ứng).
-   `admin.js`: Logic trang admin.
-   `library/`: Chứa ảnh gốc (fallback).
