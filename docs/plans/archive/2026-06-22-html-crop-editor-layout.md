# HTML Crop Editor UI Layout Implementation Plan

Kế hoạch xây dựng giao diện HTML (`crop-editor.html`) và phong cách SCSS (`src/styles/editor.scss`) cho công cụ HTML Crop Art Editor với cấu trúc responsive, thiết kế hiện đại, bảng điều khiển cấu hình trực quan và hiển thị cảnh báo thông minh.

## User Review Required

> [!IMPORTANT]
> **Aesthetic Design:** Giao diện sẽ sử dụng phong cách Farm Green tươi mới, hiện đại kết hợp với phong cách thẻ (Card-based layout) và Glassmorphism (làm mờ hậu cảnh) giúp lập trình viên thao tác một cách trơn tru và dễ nhìn.
>
> **Responsive Grid:** Bố cục sử dụng CSS Grid/Flexbox phân tách Sidebar quản lý Stage bên trái và Workspace tinh chỉnh, so sánh SVGs bên phải. Bố cục sẽ tự động co giãn tối ưu cho màn hình Desktop (bố cục 2 cột) và Mobile (dọc 1 cột).

## Proposed Changes

### Giao diện HTML

#### [NEW] [crop-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-editor.html)
- Khai báo cấu trúc HTML5 chuẩn SEO và khả năng truy cập (Accessibility).
- Chứa các thành phần chính:
  - **Header:** Tiêu đề, Dropdown chọn loại cây trồng (Corn, Carrot...).
  - **Sidebar (Target Stages):** Bộ đếm quản lý danh sách Stage của cây trồng (`Stage 0`, `Stage 1`..., `Dead`) với các nút tăng/giảm số lượng.
  - **Workspace:**
    - Khu vực chọn ảnh PNG nguồn để Trace.
    - Khu vực Sliders chứa bộ tinh chỉnh tham số VTracer (Color Precision, Filter Speckle, Gradient Step...).
    - Khu vực Candidates Grid hiển thị các ảnh SVG ứng viên thu được từ các preset (`gameClean`, `gameDetailed`, `animationCandidate`, `tinyRuntime`) và cấu hình Custom. Mỗi ứng viên có thẻ hiển thị metrics (Size, Paths) và Dropdown chọn Stage gán cho nó.
  - **Footer:** Chứa nút "Save & Apply Config" lưu dữ liệu xuống server.

### Phong cách SCSS

#### [NEW] [src/styles/editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/editor.scss)
- Viết SCSS chuyên biệt cho trang Editor (không ảnh hưởng tới giao diện game chính):
  - Thiết kế bảng màu Farm-Green tươi mát: nền phụ kem nhạt `#fdfbf7`, màu chủ đạo lục thẫm `#1e5c2d`, màu nhấn `#4b9243`, màu lỗi `#d32f2f`.
  - Styling chi tiết cho Sliders, Form Controls, Dropdowns.
  - Tạo các Class trạng thái lỗi trùng lặp (`is-duplicate`) tô viền đỏ nổi bật và vô hiệu hóa nút lưu.
  - Styling responsive tự động tối ưu hóa hiển thị khi thu nhỏ chiều rộng màn hình.

### Client-side Script (Scaffolding)

#### [NEW] [src/editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts)
- Khởi tạo script `/src/editor.ts` để:
  - Nhập file SCSS (`import "./styles/editor.scss"`).
  - Tạo cấu trúc khung rỗng đón nhận dữ liệu từ API và xử lý sự kiện client-side đơn giản (như hiển thị thay đổi slider, thay đổi số lượng stage).
  - Việc tích hợp đầy đủ API và Validation logic sẽ được thực hiện ở Task 48.

## Verification Plan

### Automated Tests
- Kiểm tra tính hợp lệ của cú pháp HTML và CSS/SCSS bằng lệnh build:
  ```bash
  npm run build
  ```

### Manual Verification
- Chạy Vite Dev Server: `npm run dev`.
- Truy cập địa chỉ `http://localhost:3000/crop-editor.html` để kiểm tra trực quan giao diện:
  - Bố cục 2 cột hiển thị đầy đủ thông tin.
  - Các slider hoạt động trơn tru.
  - Sidebar hiển thị danh sách stage rõ ràng.
