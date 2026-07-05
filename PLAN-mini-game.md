# KẾ HOẠCH: Trang "Mini game" — công cụ hỗ trợ giảng dạy

> Thay thế hoàn toàn tính năng "Ghi chú" (notes) cũ. Trang này sẽ là thư viện công cụ/trò chơi hỗ trợ giáo viên tương tác với học sinh trong lớp, phân loại theo mục đích sử dụng.

---

## 1. Phân loại (taxonomy)

| Icon | Danh mục (key) | Mô tả |
|---|---|---|
| 🎲 | `random_picker` — Gọi tên ngẫu nhiên | Chọn học sinh ngẫu nhiên trả lời/lên bảng |
| ❓ | `quiz` — Đố vui / Quiz | Câu hỏi nhanh, trò chơi kiến thức |
| 🏆 | `team_competition` — Thi đua nhóm | Chia đội, chấm điểm, bảng xếp hạng |
| ⏱ | `timer` — Đồng hồ đếm giờ | Đếm ngược thời gian làm bài/hoạt động |
| 📂 | `other` — Khác | Dự phòng cho trò chưa xếp loại được |

Phẳng (không lồng cấp như Tài liệu) — mỗi game thuộc đúng 1 danh mục.

## 2. Mỗi mini game có 1 trong 3 dạng nội dung (`delivery_type`)

| Dạng | Ý nghĩa | Payload lưu trữ |
|---|---|---|
| `web_tool` | Công cụ chạy trực tiếp trên trang MyHub | `tool_key` — khoá để tra registry component (Giai đoạn 2 mới có tool thật) |
| `downloadable` | File tải về (game tự làm dạng PPT, file chạy được...) | `file_url`, `file_type` — giống cơ chế Tài liệu |
| `external_link` | Link tới công cụ có sẵn bên ngoài (Wheel of Names, Kahoot...) | `external_url` — giống cơ chế Tài nguyên |

## 3. Bảng dữ liệu `mini_games` (thay thế bảng `notes`)

```sql
create table mini_games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,        -- random_picker | quiz | team_competition | timer | other
  delivery_type text not null,   -- web_tool | downloadable | external_link
  tool_key text,
  file_url text,
  file_type text,
  external_url text,
  tags text[],
  is_public boolean default false,
  is_locked boolean default false,
  sort_order int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Áp dụng nguyên mẫu 3-tầng hiển thị (Public / Khoá / Ẩn) và RLS/view/RPC giống các bảng khác đã có (`documents`, `resources`...). Khi `is_locked = true`, view public sẽ ẩn payload (`file_url`/`external_url`/`tool_key`) và trả lại qua RPC `get_locked_mini_game_payload(id, password)` sau khi xác minh mật khẩu tải xuống chung của site.

Bảng `notes` cũ và toàn bộ view/RPC/policy liên quan (`notes_public_view`, `get_locked_note_content`) sẽ bị **xoá hẳn** — đã xác nhận không có ghi chú thật nào cần giữ lại.

## 4. Thiết kế trang public `/mini-game`

- **Trang gốc**: lưới 5 ô danh mục (giống kiểu FolderGrid ở trang Tài liệu), mỗi ô hiện icon + tên + số lượng game công khai.
- **Trong 1 danh mục**: danh sách game dạng card (SearchBar + TagFilter như các trang khác), mỗi card có:
  - Huy hiệu loại nội dung: 🌐 Web / ⬇ Tải về / 🔗 Link ngoài
  - Nút hành động tương ứng: "Chơi ngay" / "Tải xuống" / "Mở link"
  - Nếu `web_tool` mà `tool_key` chưa có component thật (Giai đoạn 2 chưa làm tới) → nút hiện "Sắp ra mắt" (disabled)
  - Nếu bị khoá (`is_locked`) → yêu cầu mật khẩu trước khi lộ file/link/tool

## 5. Trang Admin `/admin/mini-game`

Form thêm/sửa: tiêu đề, mô tả, chọn **danh mục**, chọn **dạng nội dung** → hiện đúng ô nhập tương ứng:
- `web_tool` → dropdown chọn `tool_key` từ registry (rỗng ở Giai đoạn 1, sẽ có khi Giai đoạn 2 code xong từng tool)
- `downloadable` → input file (tái dùng cơ chế upload/signed URL của Tài liệu)
- `external_link` → input URL (tái dùng cơ chế của Tài nguyên)

Cộng thêm: tags, thứ tự hiển thị (`sort_order`), mức hiển thị (Công khai/Khoá/Ẩn).

## 6. Registry công cụ web (`src/lib/miniGameTools.js`)

```js
export const MINI_GAME_TOOLS = {
  // 'random_picker_wheel': { label: 'Bánh xe quay tên', component: RandomPickerWheel },
  // 'countdown_timer': { label: 'Đồng hồ đếm giờ', component: CountdownTimer },
}
```

Ban đầu rỗng. Giai đoạn 2, mỗi khi lập trình xong 1 công cụ tương tác thật, chỉ cần thêm 1 dòng vào registry này — không cần đổi lại schema hay trang admin.

## 7. Lộ trình

**Giai đoạn 1 — Phân loại + hạ tầng (đang làm):**
- Tạo bảng `mini_games`, xoá bảng `notes`
- Trang public: lưới danh mục + danh sách game rỗng
- Trang admin: CRUD đầy đủ cho 2 dạng `downloadable` và `external_link`
- Dạng `web_tool` đã có sẵn trong danh mục nhưng chưa có công cụ thật nào để chạy

**Giai đoạn 2 — Xây từng công cụ (sau này, theo yêu cầu):**
- Lập trình từng widget tương tác thật (quay tên ngẫu nhiên, đếm giờ, bảng điểm thi đua...)
- Đăng ký vào `MINI_GAME_TOOLS`, tạo entry `web_tool` tương ứng trong Admin

## 8. Việc đã xác nhận
- [x] Danh mục: 5 mục như mục 1
- [x] Không có ghi chú thật cần giữ lại → xoá bảng `notes`
- [x] Tạo bảng dữ liệu riêng thay vì tái dùng bảng `notes`

---

## 9. Giai đoạn 2 — Chi tiết công cụ: Gọi tên ngẫu nhiên

Tách thành **2 công cụ con** riêng biệt (2 `tool_key` khác nhau, cùng thuộc danh mục `random_picker`):

### 9.1 Nguồn danh sách học sinh (dùng chung cho cả 2 công cụ)

2 chế độ nhập:
- **Nhập thủ công** — gõ từng tên vào ô nhập, thêm/xoá dòng tuỳ ý.
- **Import** — dán 1 danh sách nhiều tên cùng lúc (mỗi tên 1 dòng) để nhập nhanh cả lớp.

Cả 2 chế độ đều **lưu lại được** thành "danh sách lớp" (roster) để dùng lại các lần sau, không phải nhập lại mỗi lần — lưu trên Supabase để dùng được từ nhiều thiết bị/máy tính khác nhau.

**Câu hỏi cần bạn xác nhận:**
- Cho phép lưu **nhiều danh sách lớp** khác nhau (VD: "8A1", "8A2", "Lớp CLB Tin học"...) để chọn nhanh mỗi lần dùng, hay chỉ cần **1 danh sách dùng chung** duy nhất?
- Chế độ "Import" là **dán danh sách text** (mỗi dòng 1 tên, đơn giản, làm nhanh được) hay cần **upload file Excel/CSV**?

### 9.2 Công cụ 1 — Gọi tên cá nhân
- Bấm nút quay → chọn ngẫu nhiên 1 tên trong danh sách, có hiệu ứng động (quay/xáo tên) trước khi dừng ở kết quả.
- Tuỳ chọn của GV (bật/tắt được): **"Loại tên đã gọi"** — nếu bật, tên vừa gọi bị loại khỏi lượt quay tiếp theo, tới khi hết danh sách thì tự động reset; nếu tắt, tên nào cũng có thể được gọi lại bất kỳ lúc nào.
- Nút "Reset" để làm mới danh sách đã loại bất kỳ lúc nào (không cần đợi quay hết).

### 9.3 Công cụ 2 — Chia nhóm
- GV chọn 1 trong 2 cách chia: nhập **số nhóm** (VD: 4 nhóm) hoặc nhập **số người/nhóm** (VD: 5 người/nhóm).
- Bấm "Chia nhóm" → xáo ngẫu nhiên danh sách, chia đều vào các nhóm, hiển thị kết quả từng nhóm.
- Nút "Chia lại" để random lại nếu muốn kết quả khác.
