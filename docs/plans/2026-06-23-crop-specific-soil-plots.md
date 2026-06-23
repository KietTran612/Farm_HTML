# Crop-Specific Soil Plots Implementation Plan

Tích hợp tính năng hiển thị mảnh đất riêng cho từng loại cây trồng (Crop-Specific Soil Plots) vào game chính sử dụng tính năng nạp tĩnh tự động của Vite (`import.meta.glob`).

## User Review Required

> [!NOTE]
> Mảnh đất riêng sẽ tự động thay đổi màu sắc và trạng thái (khô, ẩm, có sâu) thông qua các lớp CSS (`crop-soil--dry`, `crop-soil--watered`) được bao bọc bởi hàm render, giúp giữ nguyên cơ chế hoạt động của hệ thống SCSS hiện tại.

## Proposed Changes

### Assets Component

#### [NEW] [default.svg](file:///d:/soflware/Unity/Source/Farm_HTML/src/assets/plots/default.svg)
Tạo tệp đất mặc định chứa các element ụ đất 2.5D hiện tại (lấy ra từ `soilPatch.ts`).

#### [NEW] [wheat.svg](file:///d:/soflware/Unity/Source/Farm_HTML/src/assets/plots/wheat.svg)
Tạo tệp đất riêng cho lúa mì (ruộng nước). Sử dụng các path SVG vẽ bờ ruộng bao quanh và mặt nước ngập ở giữa.

#### [NEW] [carrot.svg](file:///d:/soflware/Unity/Source/Farm_HTML/src/assets/plots/carrot.svg)
Tạo tệp đất riêng cho cà rốt. Vẽ ụ đất vun cao ở trung tâm để mô phỏng rễ củ cắm sâu.

---

### Crop Art UI Component

#### [MODIFY] [soilPatch.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/ui/crop-art/soilPatch.ts)
- Thay đổi hàm `renderSoilPatch(state: SoilPatchState, cropId?: string): string`.
- Sử dụng `import.meta.glob` của Vite để nạp tự động toàn bộ file SVG đất trong thư mục `src/assets/plots/`.
- Lấy SVG tương ứng với `cropId` (nếu không có hoặc ô đất trống thì fallback về `default.svg`).
- Bọc nội dung SVG đó bằng thẻ `<g class="crop-soil crop-soil--${state}" aria-hidden="true">`.

#### [MODIFY] [cropArt.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/ui/crop-art/cropArt.ts)
Cập nhật dòng render đất thành `renderSoilPatch(soilState, input.cropId)` để truyền loại cây sang bộ định tuyến đất.

---

## Verification Plan

### Automated Tests
- Chạy các test case của crop art: `npx vitest run src/ui/crop-art/cropArt.test.ts` để đảm bảo hệ thống render không bị lỗi cú pháp.

### Manual Verification
- Khởi chạy dev server: `npm run dev` (hoặc kiểm tra terminal dev server đang chạy).
- Mở game chính `http://localhost:4000/` trên trình duyệt.
- Xác nhận:
  - Khi ô đất trống: Hiển thị ụ đất mặc định (`default.svg`).
  - Gieo hạt cà rốt: Ụ đất chuyển sang dạng vun cao của cà rốt (`carrot.svg`).
  - Gieo lúa mì: Ụ đất chuyển sang dạng ruộng nước của lúa (`wheat.svg`).
  - Tưới nước hoặc để đất khô: Trạng thái màu sắc của đất vẫn hoạt động bình thường qua các class SCSS.
