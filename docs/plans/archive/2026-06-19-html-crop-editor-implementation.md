# HTML Crop Art Editor Implementation Plan

Kế hoạch xây dựng công cụ giao diện web (HTML Editor) tích hợp trực tiếp vào dự án giúp tự động hóa và trực quan hóa quy trình chuyển đổi hình ảnh PNG sang SVG (VTracer), tinh chỉnh thông số, review animation và quản lý gán giai đoạn (stages) cho toàn bộ cây trồng trong game.

## Kiến trúc hệ thống

Hệ thống hoạt động theo cơ chế Client-Server siêu nhẹ tích hợp trực tiếp vào **Vite Dev Server** đang chạy của dự án:
- **Client (HTML Editor UI):** Giao diện web được xây dựng bằng HTML, Vanilla CSS (SCSS) và Javascript. Chạy tại URL localhost của dự án (ví dụ: `http://localhost:3000/crop-editor.html`).
- **Server (Vite Dev Server Middleware):** Tích hợp trực tiếp vào `vite.config.ts` để đón nhận các API nội bộ từ giao diện gửi lên, gọi VTracer CLI trên máy local, thực hiện SVGO tối ưu và thao tác trực tiếp với các tệp tin trên ổ đĩa.

---

## Tính năng chi tiết của Editor

1. **Chọn Crop (Sidebar/Dropdown):**
   - Quét thư mục `docs/Crops/` và trả về danh sách các cây trồng hiện có (`Corn`, `Carrot`...).
   
2. **Quản lý Stage (Target Stages Panel - Bên trái):**
   - Nút tăng `[+]` và giảm `[-]` số lượng Stage mong muốn cho cây trồng đang chọn (Ví dụ: 4 stages thì hiển thị: `Stage 1`, `Stage 2`, `Stage 3`, `Stage 4`, và mặc định có thêm 1 state đặc biệt là `Dead`).
   
3. **Trace & So sánh chi tiết (Bên phải):**
   - Hiển thị danh sách các ảnh PNG gốc của cây trồng.
   - Với mỗi PNG, cho phép sinh ra các ứng cử viên SVG tương ứng với các preset (`gameClean`, `gameDetailed`, `animationCandidate`, `tinyRuntime`).
   - Cung cấp bộ kéo (Sliders) tinh chỉnh thông số VTracer thủ công: *Color Precision (1-8)*, *Filter Speckle (1-15)*, *Gradient Step (2-40)*, *Segment Length (3.5-10)*.
   - Bấm nút **"Trace"** để chạy VTracer thời gian thực và cập nhật ảnh SVG tại chỗ.
   
4. **Gán Stage & Cảnh báo trùng lặp (Option Dropdown & Validation):**
   - Dưới mỗi ảnh SVG candidate được sinh ra, có một Dropdown lựa chọn gán cho Stage: `None`, `Stage 1`, `Stage 2`... hoặc `Dead`.
   - Nếu có từ 2 ảnh khác nhau trở lên cùng chọn chung 1 stage (bị trùng lặp), giao diện lập tức **tô màu đỏ** viền/nền của các khối ảnh đó để cảnh báo người dùng.
   - Chỉ khi không có lỗi trùng lặp, nút **"Save & Apply"** mới được kích hoạt.
   
5. **Lưu & Thay thế (Save & Replace):**
   - Khi bấm **"Save & Apply"**, server sẽ tự động copy file SVG được chọn sang thư mục chính thức:
     `src/assets/crops/<crop_name>/<stage_name>.svg`
     *(Ví dụ: `src/assets/crops/corn/stage3.svg` hoặc `dead.svg`)*.
   - Nếu tệp tin đã tồn tại, hệ thống tự động ghi đè (replace) hình ảnh mới.
   - Đồng thời, tạo file cấu hình `src/assets/crops/<crop_name>/meta.json` lưu giữ thông tin số lượng stage và mapping file SVG tương ứng của cây trồng đó phục vụ cho code game đọc động.

---

## Proposed Changes

### Backend (Vite Middleware)

#### [MODIFY] [vite.config.ts](file:///d:/soflware/Unity/Source/Farm_HTML/vite.config.ts)
- Viết thêm một Vite plugin middleware (`cropEditorPlugin`) đón nhận các request:
  - `GET /api/editor/crops`: Liệt kê các thư mục cây trong `docs/Crops/` và các ảnh PNG bên trong.
  - `POST /api/editor/trace`: Nhận đường dẫn ảnh PNG và bộ tham số vtracer, thực hiện chạy VTracer CLI (`D:/bin/vtracer.exe`), tối ưu hóa bằng SVGO và trả về nội dung SVG cùng metrics.
  - `POST /api/editor/save`: Nhận danh sách mapping từ client (ví dụ: gán ảnh X cho stage Y). Thực hiện tạo thư mục `src/assets/crops/<crop_name>/`, copy/ghi đè file SVG tương ứng, và lưu cấu hình `meta.json`.

### Giao diện Editor

#### [NEW] [crop-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-editor.html)
- File giao diện chính chứa khung layout, Target Stages Panel (bên trái), Candidate Tracing Grid (bên phải), bộ sliders tùy chỉnh thông số và dropdown gán stage.

#### [NEW] [src/editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts)
- Script client xử lý logic kéo thả, chọn dropdown, kiểm tra trùng lặp (nổi đỏ cảnh báo), gửi request API đến server và render động các SVG kết quả.

#### [NEW] [src/styles/editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/editor.scss)
- Style SCSS riêng biệt cho trang editor với thiết kế hiện đại, responsive, và hiệu ứng nổi bật (warning red) khi trùng lặp gán stage.

---

## Verification Plan

### Automated Checks
- Unit test cho hàm xử lý lưu file, ghi cấu hình `meta.json`.
- Kiểm tra build dự án thành công (`npm run build`).

### Manual Verification
- Khởi chạy Vite dev server, truy cập `http://localhost:3000/crop-editor.html`.
- Thử tăng/giảm stage, chọn cây ngô (`Corn`), thử gán trùng stage cho 2 ảnh để xem viền đỏ cảnh báo.
- Chỉnh lại không trùng và bấm Save, xác nhận file SVG chính thức được ghi đè vào `src/assets/crops/corn/stageX.svg`.
