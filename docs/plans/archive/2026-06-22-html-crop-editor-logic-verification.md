# HTML Crop Editor Logic and Verification Plan

Kế hoạch hiện thực hóa logic điều khiển phía client (`src/editor.ts`) và kiểm thử tích hợp (End-to-End) toàn bộ luồng nghiệp vụ của công cụ HTML Crop Art Editor (Task 48, 49).

## User Review Required

> [!IMPORTANT]
> **Vận hành VTracer CLI tự động:** Trình biên dịch VTracer CLI sẽ được gọi song song cho 4 presets mặc định (`gameClean`, `gameDetailed`, `animationCandidate`, `tinyRuntime`) và 1 cấu hình tùy chỉnh (`Custom`) ngay khi lập trình viên chọn một ảnh PNG gốc.
>
> **Tối ưu hóa hiệu năng (Debounce):** Khi bật chế độ "Live Trace", các thay đổi trên thanh kéo (Sliders) sẽ được trì hoãn kích hoạt (debounced) khoảng 350ms để ngăn chặn việc spam gọi tiến trình VTracer đồng thời trên server.
>
> **Lưu trữ thực tế:** Bấm nút **"Save & Apply"** sẽ lưu trực tiếp các file SVG đã chọn và ghi cấu hình `meta.json` vào thư mục `src/assets/crops/<crop_name>`.

## Proposed Changes

### Client Logic

#### [MODIFY] [src/editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts)
- Thay thế scaffolding giả lập bằng logic xử lý nghiệp vụ thực tế:
  - **Khởi động:** Gửi `GET /api/editor/crops` hiển thị danh sách cây trồng lên dropdown `#crop-select`. Gửi request `GET /docs/Crops/vtracer-presets.json` để load động cấu trúc preset.
  - **Chọn cây trồng:** Đọc cấu hình `meta.json` hiện có nếu có (để hiển thị các stage đã được gán) hoặc khởi tạo mặc định (gồm 4 Stage tăng trưởng và 1 Stage Dead). Cập nhật danh sách ảnh PNG nguồn.
  - **Chọn ảnh PNG:** Tự động kích hoạt gọi song song API `POST /api/editor/trace` cho các preset. Hiển thị trạng thái Loading (hiệu ứng xoay tròn) trên từng card ứng viên.
  - **Tinh chỉnh thanh kéo (Sliders):** Lắng nghe sự thay đổi của các tham số. Nếu "Live Trace" được tích hợp, thực hiện debounce 350ms trước khi gửi yêu cầu trace cho card `Custom`.
  - **Gán Stage & Validation:** Theo dõi thay đổi dropdown gán stage trên mỗi card. Kiểm tra trùng lặp:
    - Nếu có từ 2 card trở lên gán cho cùng 1 stage $\rightarrow$ Nổi viền đỏ `.is-duplicate` ở các card đó, hiển thị thông báo lỗi chi tiết ở chân trang và khóa nút lưu.
    - Nếu không trùng lặp $\rightarrow$ Mở khóa nút lưu, cập nhật màu xanh lá cho stage tương ứng ở Sidebar.
  - **Lưu cấu hình:** Khi bấm "Save", đóng gói danh sách mapping gửi lên `POST /api/editor/save`, hiển thị thông báo thành công.

## Verification Plan

### Automated Tests
- Kiểm tra tính hợp lệ của client script bằng lệnh build:
  ```bash
  npm run build
  ```

### Manual Verification
1. Khởi động server: `npm run dev` (hoặc sử dụng tiến trình Vite port 4000 đang chạy).
2. Mở trình duyệt truy cập `http://localhost:4000/crop-editor.html`.
3. Chọn cây trồng: `Corn (Ngô)` và chọn PNG `World_Crop_Corn_Body_Stage00.png`.
4. Quan sát 5 card ứng cử viên hiển thị Loading, sau đó hiển thị đúng hình ảnh SVG vector và các thông số metrics (Bytes, Paths, Groups, Colors).
5. Thử thay đổi các thanh kéo (Color Precision, Filter Speckle...) và quan sát card Custom cập nhật tự động.
6. Thử gán trùng lặp: chọn `Stage 00` cho cả card `gameClean` và `gameDetailed`. Xác nhận cả hai card nổi viền đỏ, hiển thị nhãn cảnh báo trùng lặp và nút lưu chân trang bị vô hiệu hóa.
7. Điều chỉnh lại không trùng lặp và bấm **"Save & Apply"**.
8. Xác nhận trên đĩa xuất hiện các file:
   - `src/assets/crops/corn/stage00.svg`
   - `src/assets/crops/corn/meta.json`
9. Sử dụng `browser_subagent` để tự động hóa kiểm tra toàn bộ luồng E2E trên và chụp ảnh màn hình kết quả lưu file thành công.
