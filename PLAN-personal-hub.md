# KẾ HOẠCH KỸ THUẬT: Website Lưu Trữ Cá Nhân (tên tạm: "MyHub")

> Dự án hoàn toàn mới, độc lập với AI_Platform. Mục tiêu: 1 nơi lưu trữ tài liệu công việc + ghi chú cá nhân + theo dõi phim/game + link tài nguyên, dùng cho bản thân là chính, nhưng có phần public để chia sẻ khi cần.

---

## 1. Tổng quan yêu cầu

| Loại nội dung | Ví dụ | Cần gì đặc biệt |
|---|---|---|
| **Tài liệu công việc** | Giáo án, giáo trình, file dạy học (.docx/.pdf/.xlsx) | Upload file, phân loại theo môn/lớp, tag |
| **Ghi chú cá nhân** | Ý tưởng, note nhanh | Soạn markdown, không cần file đính kèm |
| **Phim/Game** | Review, trạng thái đang xem/chơi, tiến độ, rating | Có field riêng: status, rating, progress, ảnh cover |
| **Link/tài nguyên** | Bài viết, sách nên đọc | URL + mô tả + tag |

**Đặc điểm quan trọng nhất:** mỗi mục nội dung cần cờ `is_public` để tự quyết định cái nào cho người ngoài xem, cái nào chỉ mình xem. Đây là yêu cầu ảnh hưởng lớn nhất đến lựa chọn backend/database (chi tiết ở mục 4).

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────┐
│   Frontend (React + Vite)   │  ← Vercel hosting (free)
│   Tailwind + shadcn/ui      │
└──────────────┬───────────────┘
               │ Supabase JS SDK (gọi trực tiếp, không cần server riêng)
               ▼
┌─────────────────────────────┐
│         Supabase             │  ← 1 project free tier
│  ┌─────────┐ ┌─────────────┐│
│  │  Auth   │ │  Postgres DB ││
│  └─────────┘ │  (RLS bật)   ││
│  ┌─────────┐ └─────────────┘│
│  │ Storage │ (file, ảnh cover) │
│  └─────────┘                 │
└─────────────────────────────┘
```

Điểm mấu chốt: **không cần viết backend Node/Express riêng**. Supabase cung cấp API tự động (qua PostgREST) + Row Level Security (RLS) để tự phân quyền public/private ngay trong database. Việc này giúp giảm 1 tầng phức tạp — phù hợp vì đây là dự án cá nhân, không cần maintain server.

---

## 3. Frontend

### 3.1 Stack
- **React 18 + Vite** — giữ nguyên hệ sinh thái đã quen từ AI_Platform
- **TailwindCSS** + **shadcn/ui** — component có sẵn (form, dialog, tabs, badge cho tag...), đỡ phải tự vẽ UI
- **React Router v6** — phân route public vs admin
- **TanStack Query (React Query)** — fetch/cache data từ Supabase, tự động refetch, xử lý loading/error gọn hơn viết useEffect thủ công
- **Zustand** — lưu state nhẹ (filter đang chọn, session admin)
- Editor ghi chú: dùng **markdown thô trong `<textarea>` + react-markdown để preview** — đơn giản, không cần thư viện WYSIWYG nặng như TipTap (có thể nâng cấp sau nếu cần)

### 3.2 Cấu trúc route

```
/                     → Trang chủ (giới thiệu, mục nào public thì hiện)
/tai-lieu             → Danh sách tài liệu công việc (chỉ public)
/ghi-chu              → Danh sách ghi chú (chỉ public)
/phim-game            → Danh sách phim/game (chỉ public)
/tai-nguyen           → Danh sách link (chỉ public)
/login                → Đăng nhập admin (chỉ Truc)
/admin                → Dashboard quản trị (route được bảo vệ)
  /admin/tai-lieu     → CRUD tài liệu (kể cả private)
  /admin/ghi-chu      → CRUD ghi chú
  /admin/phim-game    → CRUD phim/game
  /admin/tai-nguyen   → CRUD link
```

### 3.3 Cấu trúc thư mục đề xuất

```
src/
  components/
    ui/              (shadcn components)
    ContentCard.jsx
    TagFilter.jsx
    SearchBar.jsx
    PrivacyToggle.jsx
  pages/
    Home.jsx
    DocumentsPublic.jsx
    NotesPublic.jsx
    MediaTracker.jsx
    ResourcesPublic.jsx
    Login.jsx
    admin/
      AdminDashboard.jsx
      AdminDocuments.jsx
      AdminNotes.jsx
      AdminMedia.jsx
      AdminResources.jsx
  lib/
    supabaseClient.js
    queries/         (các hàm gọi Supabase, tách riêng theo content type)
  hooks/
    useAuth.js
  App.jsx
```

---

## 4. Backend & Database

### 4.1 So sánh 2 lựa chọn chính

| | **Supabase** (đề xuất) | **Firebase** (đã quen từ AI_Platform) |
|---|---|---|
| Database | Postgres (SQL thật, query mạnh) | Firestore (NoSQL) |
| Phân quyền public/private | **Row Level Security** — viết policy SQL rất tự nhiên cho đúng nhu cầu "vừa cá nhân vừa public" | Firestore Rules — làm được nhưng cú pháp rules kém trực quan hơn khi logic phức tạp |
| Full-text search | Có sẵn (Postgres `tsvector`) | Không có sẵn, phải dùng dịch vụ ngoài (Algolia...) |
| Storage file | Supabase Storage, bucket public/private | Firebase Storage |
| Free tier | 500MB DB + 1GB storage, đủ dùng nhiều năm cho use case này | Tương tự |
| Độ quen thuộc | Chưa dùng | Đã dùng ở AI_Platform |

**Đề xuất: Supabase.** Lý do chính là yêu cầu "vừa cá nhân vừa public 1 phần" — với Postgres + RLS, mình viết 1 policy duy nhất `is_public = true OR auth.uid() = admin` là xử lý được toàn bộ 4 loại nội dung, thay vì phải lặp lại rule cho từng collection như Firestore. Ngoài ra sau này nếu cần search full-text (ví dụ tìm ghi chú theo từ khóa) thì Postgres có sẵn, không cần thêm dịch vụ.

Nếu muốn giữ 1 hệ sinh thái với AI_Platform (đỡ học thêm công cụ mới) thì Firebase vẫn hoàn toàn khả thi — mình có thể làm bản thiết kế Firestore tương đương nếu bạn muốn ưu tiên sự quen thuộc hơn.

### 4.2 Schema database (Postgres/Supabase)

```sql
-- Bảng tài liệu công việc
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,           -- 'giao_an' | 'giao_trinh' | 'khac'
  subject text,            -- 'C++', 'AI', ...
  grade_level text,
  file_url text,           -- link file trong Storage
  file_type text,          -- 'docx' | 'pdf' | 'xlsx'
  tags text[],
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bảng ghi chú
create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,             -- markdown
  tags text[],
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bảng phim/game
create table media_tracker (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text,                 -- 'movie' | 'game'
  status text,                -- 'backlog' | 'in_progress' | 'completed' | 'dropped'
  rating numeric,              -- 1-10
  review text,
  progress text,               -- vd: "Chapter 5" hoặc "60%"
  cover_url text,
  genre text[],
  is_public boolean default false,
  started_at date,
  finished_at date,
  created_at timestamptz default now()
);

-- Bảng link/tài nguyên
create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  category text,
  tags text[],
  is_public boolean default false,
  created_at timestamptz default now()
);
```

### 4.3 Row Level Security (áp dụng chung logic cho cả 4 bảng)

```sql
alter table documents enable row level security;
alter table notes enable row level security;
alter table media_tracker enable row level security;
alter table resources enable row level security;

-- Ai cũng đọc được nếu is_public = true
create policy "public_read" on documents
  for select using (is_public = true);

-- Chỉ admin (Truc) mới đọc được private + được ghi/sửa/xóa
create policy "admin_full_access" on documents
  for all using (auth.uid() = 'UUID_CUA_TRUC');
```
(Lặp lại policy tương tự cho 3 bảng còn lại — đổi tên bảng.)

### 4.4 Storage (file)

- Bucket `documents` — chứa file giáo án/giáo trình. Mặc định private, sinh signed URL khi cần chia sẻ; nếu tài liệu đánh dấu public thì set bucket policy cho public đọc theo path đó.
- Bucket `covers` — ảnh cover phim/game, public đọc thoải mái vì không nhạy cảm.

### 4.5 Auth

Chỉ cần 1 tài khoản admin duy nhất (Truc). Dùng Supabase Auth email/password, tắt tính năng tự đăng ký (sign-up) để không ai tạo tài khoản mới được.

---

## 5. Tìm kiếm & lọc

- Lọc theo tag: dùng cú pháp Postgres array (`tags && ARRAY['C++']`)
- Tìm theo từ khóa: bắt đầu đơn giản với `ilike '%keyword%'`, nâng cấp lên full-text search (`tsvector` + `GIN index`) ở Phase 3 nếu số lượng nội dung nhiều lên.

---

## 6. Deploy

| Phần | Nơi deploy | Chi phí |
|---|---|---|
| Frontend | Vercel (auto deploy từ GitHub) | Free |
| Backend/DB/Storage | Supabase Cloud | Free tier |
| Domain (tuỳ chọn) | Gắn domain riêng qua Vercel | ~200-300k/năm nếu mua domain .com/.vn |

---

## 7. Roadmap theo giai đoạn (giống pattern 3 tầng bạn đã dùng ở AI_Platform)

**Phase 1 — MVP (1 cuối tuần):**
- Khởi tạo Vite + React + Tailwind, project Supabase, tạo bảng `notes` và `resources` (2 loại đơn giản nhất)
- Trang public đọc + trang admin CRUD cơ bản
- Deploy lên Vercel

**Phase 2 — Mở rộng nội dung:**
- Thêm `media_tracker` (phim/game) với cover image upload
- Thêm `documents` với upload file lên Storage
- Thêm hệ thống tag + filter

**Phase 3 — Hoàn thiện:**
- Full-text search
- Polish UI (dark mode, trang chủ tổng hợp đẹp hơn)
- (Tuỳ chọn) PWA để dùng offline khi ở phòng máy không có mạng ổn định

---

## 8. Việc cần quyết định thêm
- [x] Đặt tên chính thức cho trang → giữ **"MyHub"**
- [x] Domain → dùng subdomain Vercel miễn phí trước ở Phase 1, mua domain riêng sau nếu cần
- [x] Backend/DB → **Supabase** (theo đề xuất mục 4.1)
