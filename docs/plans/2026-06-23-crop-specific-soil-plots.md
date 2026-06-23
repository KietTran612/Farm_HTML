# Crop-Specific Soil Plots Implementation Plan

Tích hợp tính năng hiển thị mảnh đất riêng cho từng loại cây trồng (Crop-Specific Soil Plots) vào game chính sử dụng tính năng nạp tĩnh tự động của Vite (`import.meta.glob`). Kế hoạch chia làm 2 giai đoạn: Xây dựng nền tảng đất trong game chính (Giai đoạn 1) và Xây dựng công cụ Plot Editor trực quan trên Web (Giai đoạn 2).

## User Review Required

> [!IMPORTANT]
> **Điểm lưu ý kỹ thuật (Vite Glob Compilation):**
> Trước khi thêm khai báo `import.meta.glob` vào file `soilPatch.ts`, bắt buộc phải tạo thư mục `src/assets/plots/` và thêm ít nhất một file (ví dụ `default.svg`). Nếu không, Vite Compiler sẽ báo lỗi khi không tìm thấy bất kỳ file nào khớp với glob pattern.

> [!NOTE]
> - Mảnh đất riêng sẽ tự động thay đổi màu sắc và trạng thái (khô, ẩm, có sâu, đất héo úa) thông qua các lớp CSS (`crop-soil--dry`, `crop-soil--watered`) được bao bọc bởi hàm render, giúp giữ nguyên cơ chế hoạt động của hệ thống SCSS hiện tại.
> - Plot Editor sẽ sử dụng chung API `/api/editor/trace-layer` để trace hình ảnh đất PNG sang SVG vector mà không cần lập trình lại lõi vector hóa.

## Proposed Changes

### Giai đoạn 1: Nền tảng Đất riêng trong Game chính

#### [NEW] [default.svg](file:///d:/soflware/Unity/Source/Farm_HTML/src/assets/plots/default.svg)
Tạo tệp đất mặc định chứa các element ụ đất 2.5D hiện tại (lấy ra từ `soilPatch.ts`, loại bỏ thẻ `<g>` bọc ngoài để bọc động).

#### [NEW] [wheat.svg](file:///d:/soflware/Unity/Source/Farm_HTML/src/assets/plots/wheat.svg)
Tạo tệp đất riêng phác thảo (mock asset) cho lúa mì (ruộng nước). Sử dụng bờ ruộng bao quanh và mặt nước ngập ở giữa.

#### [NEW] [carrot.svg](file:///d:/soflware/Unity/Source/Farm_HTML/src/assets/plots/carrot.svg)
Tạo tệp đất riêng phác thảo (mock asset) cho cà rốt. Vẽ ụ đất vun cao ở trung tâm để mô phỏng củ cắm sâu.

#### [MODIFY] [soilPatch.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/ui/crop-art/soilPatch.ts)
- Thay đổi hàm `renderSoilPatch(state: SoilPatchState, cropId?: string): string`.
- Sử dụng `import.meta.glob` của Vite để nạp tự động toàn bộ file SVG đất trong thư mục `src/assets/plots/` dưới dạng thô (`?raw` và `eager: true`).
- Lấy SVG tương ứng với `cropId` (nếu không có hoặc ô đất trống thì fallback về `default.svg`).
- Bọc nội dung SVG đó bằng thẻ `<g class="crop-soil crop-soil--${state}" aria-hidden="true">`.

#### [MODIFY] [cropArt.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/ui/crop-art/cropArt.ts)
Cập nhật dòng render đất thành `renderSoilPatch(soilState, input.cropId)` để truyền loại cây sang bộ định tuyến đất.

#### [MODIFY] [render.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/ui/render.ts)
**Đồng bộ giao diện đất trống:**
Cập nhật hàm `plotContent` khi đất trống (`!plot.cropId`) để render ụ đất SVG mặc định thông qua `renderSoilPatch("normal", undefined)` thay vì hiển thị nút bấm phẳng dùng CSS gradient như trước, giúp toàn bộ board đất đồng bộ 100% hình ảnh 2.5D.

#### [MODIFY] [package.json](file:///d:/soflware/Unity/Source/Farm_HTML/package.json)
Thêm NPM script phím tắt để trace đất nhanh bằng dòng lệnh:
`"crop:vtracer:plot": "node scripts/vtracer/convert-crop.mjs --outDir src/assets/plots --preset gameClean --input"`

---

### Giai đoạn 2: Xây dựng Plot Editor trực quan

#### [NEW] [plot-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/plot-editor.html)
Tạo trang Web UI cho Plot Editor. Gồm:
- Khu vực tải file PNG đất (kéo thả hoặc chọn file).
- Bộ thanh trượt thông số trace VTracer (Color Precision, Corner Threshold, Filter Speckle...).
- Khu vực Preview so sánh ảnh PNG gốc và SVG vector kết quả.
- Ô nhập tên đất (ví dụ: `wheat`, `carrot`, `strawberry`...) và nút **"Save Plot"**.

#### [NEW] [plot-editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/plot-editor.ts)
Viết logic điều khiển cho Plot Editor:
- Xử lý nạp file PNG và chuyển thành base64 DataURL.
- Gửi yêu cầu trace đến endpoint `/api/editor/trace-layer` để nhận về SVG kết quả.
- Gửi yêu cầu lưu đất đến endpoint mới `/api/editor/save-plot`.

#### [MODIFY] [editorMiddleware.ts](file:///d:/soflware/Unity/Source/Farm_HTML/scripts/vite-plugins/editorMiddleware.ts)
Thêm endpoint API mới `POST /api/editor/save-plot` để:
- Nhận payload chứa `{ plotId, svgContent }`.
- Lưu file SVG trực tiếp vào thư mục `src/assets/plots/${plotId.toLowerCase()}.svg`.

---

## Verification Plan

### Automated Tests
- Chạy các test case của crop art: `npx vitest run src/ui/crop-art/cropArt.test.ts` để đảm bảo hệ thống render không bị lỗi cú pháp.

### Manual Verification
- Khởi chạy dev server và mở `http://localhost:4000/` trên trình duyệt.
- Xác nhận đất trống hiển thị ụ đất mặc định 2.5D dạng SVG.
- Xác nhận đất riêng của lúa mì và cà rốt hiển thị chính xác theo mock asset ngay khi gieo hạt.
- Mở `http://localhost:4000/plot-editor.html`. Tải thử một tệp ảnh đất PNG, nhấn trace để kiểm tra preview, đặt tên đất và nhấn lưu. Kiểm chứng file đất mới được tạo thành công trong thư mục `src/assets/plots/`.
