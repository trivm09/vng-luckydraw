# VNG Lucky Draw

Hệ thống quay số trúng thưởng được xây dựng với Next.js 15, Supabase và shadcn/ui.

## Tính năng

### Trang công khai
- **Đăng ký tham gia** (`/`) - Khách hàng đăng ký với họ tên, số điện thoại và mã vòng tay (hoặc tự động tạo mã 6 số)
- **Trang thành công** (`/success`) - Hiển thị mã số may mắn sau khi đăng ký
- **Trang quay số** (`/draw`) - Màn hình hiển thị quay số fullscreen với realtime sync

### Dashboard Admin (`/dashboard`)
- **Quản lý mã vòng tay** - Import/export danh sách mã, theo dõi trạng thái kích hoạt
- **Quản lý khách hàng** - Xem, tìm kiếm, xóa khách hàng đã đăng ký
- **Điều khiển quay số** - Chọn giải, bắt đầu/dừng quay, xem danh sách trúng thưởng

## Công nghệ

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Link)
- **UI**: shadcn/ui + Tailwind CSS
- **Realtime**: Supabase Realtime

## Cài đặt

### 1. Clone và cài dependencies

```bash
git clone <repo-url>
cd vng-luckydraw
npm install
```

### 2. Cấu hình Supabase

Tạo file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Tạo database tables

Chạy các SQL sau trong Supabase SQL Editor:

```sql
-- Bảng mã vòng tay
CREATE TABLE bracelet_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  is_activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng khách hàng
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  bracelet_code VARCHAR(50) NOT NULL,
  has_existing_code BOOLEAN DEFAULT FALSE,
  has_won BOOLEAN DEFAULT FALSE,
  prize_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng cài đặt quay số
CREATE TABLE draw_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  current_prize VARCHAR(255) DEFAULT '',
  is_spinning BOOLEAN DEFAULT FALSE,
  winning_code VARCHAR(50) DEFAULT '',
  winning_name VARCHAR(255) DEFAULT '',
  show_result BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO draw_settings (current_prize) VALUES ('Giải Đặc Biệt');

-- Thêm UNIQUE constraints (quan trọng để tránh race condition)
ALTER TABLE customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone);
ALTER TABLE customers ADD CONSTRAINT customers_bracelet_code_unique UNIQUE (bracelet_code);
```

### 4. Cấu hình RLS Policies

```sql
-- Enable RLS
ALTER TABLE bracelet_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_settings ENABLE ROW LEVEL SECURITY;

-- Public read/insert cho customers (đăng ký)
CREATE POLICY "Anyone can register" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read customers" ON customers FOR SELECT USING (true);

-- Public read cho bracelet_codes
CREATE POLICY "Anyone can read bracelet_codes" ON bracelet_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can update bracelet_codes" ON bracelet_codes FOR UPDATE USING (true);

-- Public read cho draw_settings
CREATE POLICY "Anyone can read draw_settings" ON draw_settings FOR SELECT USING (true);

-- Authenticated users có full access
CREATE POLICY "Authenticated full access customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access bracelet_codes" ON bracelet_codes
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access draw_settings" ON draw_settings
  FOR ALL USING (auth.role() = 'authenticated');
```

### 5. Bật Realtime

Trong Supabase Dashboard > Database > Replication, bật realtime cho bảng `draw_settings`.

### 6. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Sử dụng

### Đăng nhập Admin

1. Truy cập `/login`
2. Nhập email để nhận magic link
3. Click link trong email để đăng nhập

### Quản lý mã vòng tay

1. Vào Dashboard > Mã vòng tay
2. Thêm mã đơn lẻ hoặc import hàng loạt (mỗi mã 1 dòng)
3. Export danh sách mã chưa kích hoạt để in

### Điều khiển quay số

1. Vào Dashboard > Quay số
2. Mở trang `/draw` trên màn hình lớn (nhấn F để fullscreen)
3. Chọn giải thưởng
4. Nhấn "Bắt đầu quay" để quay số
5. Kết quả sẽ tự động hiển thị trên trang `/draw`

### Tùy chỉnh background

Trên trang `/draw`:
- Nhấn nút hình ảnh để upload background chính
- Nhấn nút gift để upload background popup trúng thưởng
- Background được lưu trong localStorage (tối đa 2MB/ảnh)
- Nhấn H để ẩn/hiện controls

## Cấu trúc thư mục

```
src/
├── app/
│   ├── page.tsx              # Trang đăng ký
│   ├── success/              # Trang thành công
│   ├── draw/                 # Trang quay số (public)
│   ├── login/                # Trang đăng nhập
│   ├── auth/callback/        # Auth callback
│   └── dashboard/
│       ├── page.tsx          # Dashboard home
│       ├── bracelet-codes/   # Quản lý mã vòng tay
│       ├── customers/        # Quản lý khách hàng
│       └── draw-control/     # Điều khiển quay số
├── components/
│   └── ui/                   # shadcn/ui components
├── hooks/
│   └── use-toast.ts          # Toast notifications
└── lib/
    └── supabase/             # Supabase clients
```

## Bảo mật

- XSS protection với input sanitization
- Open redirect protection trong auth callback
- Race condition protection với unique constraints và atomic updates
- RLS policies cho database access control

## License

MIT
