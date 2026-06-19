# VTracer Preset Tuning and SVG Detail Optimization Plan

Bản kế hoạch điều chỉnh cấu hình VTracer CLI để cải thiện chất lượng ảnh SVG đầu ra, khắc phục tình trạng thiếu chi tiết và hình ảnh bị xấu/nham nhở khi chuyển đổi từ PNG.

## Vấn đề hiện tại
- Các preset trong [vtracer-presets.json](file:///d:/soflware/Unity/Source/Farm_HTML/docs/Crops/vtracer-presets.json) hiện tại (`gameClean`, `animationCandidate`, `gameDetailed`) có thông số nén quá mạnh:
  - `color_precision: 6` (chỉ lấy 6 bit màu/kênh) làm biến dạng dải màu.
  - `filter_speckle: 10` làm mất hoàn toàn các chi tiết hạt ngô, râu ngô, vân lá.
  - `gradient_step: 22` hoặc `18` làm giảm dải màu trầm trọng, tạo các vệt phân mảng lớn và thô kệch.
  - Cả 2 preset `gameClean` và `animationCandidate` có thông số trùng nhau dẫn đến kết quả xuất giống hệt nhau mà không mang lại lựa chọn khác biệt.

## Đề xuất điều chỉnh Presets
Chúng ta sẽ cập nhật [vtracer-presets.json](file:///d:/soflware/Unity/Source/Farm_HTML/docs/Crops/vtracer-presets.json) với các cấu hình mới cân bằng hơn giữa độ chi tiết, chất lượng thẩm mỹ và hiệu năng tải:

1. **`gameClean`** (Cân bằng tốt cho runtime thường):
   - `color_precision`: `7`
   - `filter_speckle`: `5` (giữ chi tiết nhỡ)
   - `gradient_step`: `14` (mịn màng hơn)
   - `segment_length`: `4.0`

2. **`gameDetailed`** (Độ chi tiết cực cao, giữ nguyên bản chất lượng của art gốc):
   - `color_precision`: `8` (đầy đủ màu sắc)
   - `filter_speckle`: `3` (giữ tất cả hạt ngô, râu ngô, chấm nhỏ)
   - `gradient_step`: `6` (chuyển màu rất mượt)
   - `segment_length`: `3.5` (bám sát biên dạng tốt nhất)

3. **`animationCandidate`** (Tối ưu để chia layer chuyển động mà không quá nặng):
   - `color_precision`: `7`
   - `filter_speckle`: `6`
   - `gradient_step`: `14`
   - `segment_length`: `4.0`

4. **`tinyRuntime`** (Dành cho các state nhỏ như mầm/hạt hoặc khi cần siêu nhẹ):
   - `color_precision`: `6`
   - `filter_speckle`: `8`
   - `gradient_step`: `20`
   - `segment_length`: `4.5`

---

## Proposed Changes

### Configuration

#### [MODIFY] [vtracer-presets.json](file:///d:/soflware/Unity/Source/Farm_HTML/docs/Crops/vtracer-presets.json)
- Cập nhật các giá trị của `gameClean`, `gameDetailed`, `animationCandidate`, và `tinyRuntime`.

## Verification Plan

### Automated Tests
- Chạy batch convert cho toàn bộ thư mục cây ngô (`Corn`) với các preset mới.
- Chạy cập nhật trang review `review.html`.

### Manual Verification
- Người dùng truy cập trang `review.html` trên local server (`http://127.0.0.1:3000/docs/Crops/Corn/SVG/Generated/review.html`) để trực tiếp so sánh chất lượng ảnh gốc PNG với các ảnh SVG từ các preset `gameClean`, `gameDetailed`, `animationCandidate` và đưa ra quyết định chọn lựa cho từng giai đoạn cây trồng.
