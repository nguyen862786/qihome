# 🏡 Hệ Thống Số Hóa Vận Hành & Bán Hàng Nội Thất - QiHome.vn

Đây là hệ thống Số hóa Vận hành & Bán hàng Nội thất thông minh (MVP), được phát triển dành riêng cho dự án hoàn thiện căn hộ mẫu tại các phân khu **Vinhomes Hậu Nghĩa**, **Vinhomes Hóc Môn** và **Vinhomes Cần Giờ** hợp tác giữa **Qi Holding / Qi Prime** và **Vingroup**.

Hệ thống được thiết kế dạng Web-App Responsive tối ưu trên thiết bị di động, tự động kết nối dữ liệu giữa 6 bên trong chuỗi cung ứng: **Khách hàng/Sales Affiliate -> Thợ thi công -> Giám sát QC -> Thủ kho -> Kế toán dự án -> Ban Giám đốc (Chủ tịch Nguyễn Duy Quang)**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

1.  **Frontend/Backend:** [Next.js 16 (App Router)](https://nextjs.org) với Turbopack biên dịch siêu tốc.
2.  **Cơ sở dữ liệu & Bảo mật:** [Supabase (PostgreSQL)](https://supabase.com) tích hợp Row Level Security (RLS) bảo vệ thông tin cư dân.
3.  **Core AI Engine:** Replicate API chạy mô hình **Stable Diffusion XL (SDXL)** phối cảnh nội thất 3D & tự động bóc tách BOQ sản phẩm thật.
4.  **Logistics:** Mã QR JWT mã hoá bằng thư viện `jose` giới hạn thời gian sống 60 phút chống gian lận xuất kho.
5.  **Styling:** Vanilla CSS và Tailwind CSS v4 tối ưu giao diện tối sang trọng (Dark mode) kết hợp Glassmorphism.

---

## 📂 Danh Sách Thư Mục & File Nghiệp Vụ Chính

*   `/supabase/migrations/`: Chứa các file SQL khởi tạo bảng, quan hệ và ma trận bảo mật RLS.
    *   `20260712000000_init.sql`: Cấu trúc cốt lõi dự án (`projects`, `profiles`, `material_requests`, `site_reports`...).
    *   `20260712000001_vendor_evaluations.sql`: Bảng đánh giá năng lực thầu phụ/nhà cung cấp.
    *   `20260712000002_materials_catalog.sql`: Danh mục vật tư e-commerce.
*   `/supabase/seed.sql`: Bộ dữ liệu mẫu sandbox (50 căn hộ mẫu, 5 tài khoản test nhân sự, vật tư mẫu).
*   `/src/lib/`:
    *   `supabase.js`: Khởi tạo kết nối Supabase Client (standard & admin bypass RLS).
    *   `qrToken.js`: Logic sinh và xác thực mã QR bảo mật bằng JWT.
    *   `dbService.js`: Các API query database dùng chung.
*   `/src/app/`:
    *   `page.js`: Trang chủ thương mại điện tử, giỏ hàng tự trừ 6% tài trợ Vin, liên kết Techcombank.
    *   `login/page.js`: Đăng nhập OTP & thanh Sandbox Login chuyển nhanh giữa 5 vai trò thi công.
    *   `ai-studio/`: Trình thiết kế AI sinh ảnh 3D và tự bóc tách BOQ chèn vào database.
    *   `warehouse/`: Màn hình quét mã QR của thủ kho.
    *   `dashboard/`: Chứa các dashboard nghiệp vụ chuyên biệt của Thợ thi công, Giám sát, Sales, Kế toán và Chủ tịch.

---

## 🚀 Hướng Dẫn Khởi Chạy & Cấu Hình

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Chạy lệnh sau tại thư mục gốc của dự án:
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env.local` tại thư mục gốc và điền các thông tin kết nối Supabase & Replicate của bạn:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-bypass-key
REPLICATE_API_TOKEN=your-replicate-api-token
JWT_SECRET_KEY=your-jwt-secret-key-for-qr-logistics-minimum-32-chars
```
*(Nếu chưa điền các biến trên, hệ thống sẽ tự động chạy ở chế độ **Sandbox Mock** kết hợp bộ nhớ đệm cục bộ giúp bạn demo ngay lập tức mà không gặp bất kỳ lỗi kết nối nào).*

### 3. Thiết lập Cơ sở dữ liệu Supabase
1. Truy cập vào Supabase Dashboard dự án của bạn.
2. Mở mục **SQL Editor**.
3. Copy và chạy lần lượt các file SQL trong thư mục `/supabase/migrations/` để thiết lập bảng và RLS.
4. Copy và chạy file `/supabase/seed.sql` để nạp dữ liệu mẫu chạy thử nghiệm.

### 4. Khởi chạy Server cục bộ (Local Development)
Khởi động dự án trên môi trường phát triển:
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn.

---

## 🔑 Tài Khoản Thử Nghiệm Sandbox (Demo Bypass)

Tại màn hình Đăng nhập ([http://localhost:3000/login](http://localhost:3000/login)), bạn không cần nhận mã OTP qua SMS thật. Chỉ cần sử dụng thanh **Sandbox Developer Login** ở chân trang để click đăng nhập trực tiếp vào tài khoản demo của bất kỳ vai trò nào:
*   **Chủ Tịch (Admin):** Nguyễn Duy Quang (Theo dõi dòng tiền, duyệt cấp phát vượt hạn mức BOM, chấm điểm KPI).
*   **Kế Toán (Accounting):** Lê Kế Toán (Đối soát công nợ thầu phụ, hoa hồng sales, đề xuất chi tuần).
*   **Giám Sát (Site Manager):** Trần Giám Sát (Chấm checklist QC gỗ/sơn/điện, ký tên điện tử phê duyệt).
*   **Thợ Thi Công (Subcontractor):** Thầu Phụ Hùng Vương (Báo cáo GPS hiện trường, chụp ảnh tiến độ, yêu cầu vật tư sinh mã QR).
*   **Cộng Tác Viên (Sales Affiliate):** Phạm Hoàng Nam (Lấy link chia sẻ giới thiệu cư dân, xem hoa hồng 2% thực tế).
*   **Thủ Kho (Warehouse Manager):** Quét nhận mã QR nhận hàng tại [/warehouse](http://localhost:3000/warehouse).
