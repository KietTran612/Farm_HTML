# Kế hoạch triển khai: Bộ nhập Layer Photoshop (PSD) trực tiếp trên trình duyệt

Tích hợp tính năng kéo thả file PSD trực tiếp vào Crop Editor, tự động phân tích cấu trúc layer và thực hiện vector hóa (VTracer) hàng loạt các layer được chọn để ghép thành stage hoàn chỉnh. Đảm bảo giữ nguyên tọa độ tương đối để các bộ phận tự khớp vị trí một cách hoàn hảo mà không làm ảnh hưởng đến luồng vẽ Lasso/Brush truyền thống.

## Đánh giá kỹ thuật & Giải pháp tách biệt (Không lỗi luồng cũ)

1. **Thư viện ag-psd (Client-side)**: 
   - Thư viện này hỗ trợ đọc cấu trúc file Photoshop `.psd` đầy đủ ngay trên trình duyệt dưới dạng `ArrayBuffer`.
   - Mỗi layer sau khi phân tích sẽ có thuộc tính `canvas` (chứa pixel riêng của layer đó) và các tọa độ biên (`left`, `top`, `right`, `bottom`) cùng tên layer (`name`).
   - Giải pháp chạy 100% ở Client-side, không cần cài đặt thêm thư viện xử lý ảnh ở Backend, tái sử dụng API `/api/editor/trace-layer` hiện có.

2. **Bảo toàn Tọa độ (Coordinate Alignment)**:
   - Thay vì gửi ảnh layer đã crop và tính toán ma trận dịch chuyển SVG phức tạp (dễ sai lệch), ta sẽ tạo một canvas tạm có kích thước bằng chính kích thước canvas của file PSD (`psd.width` x `psd.height`).
   - Vẽ hình ảnh của layer đó lên canvas tạm tại tọa độ chính xác `(left, top)`.
   - Xuất canvas tạm này thành mã Base64 PNG và gửi lên API VTracer.
   - Kết quả SVG trả về sẽ có viewBox khớp hoàn toàn với khung hình PSD gốc. Khi ghép lại bằng `composeLayeredSvg`, các layer sẽ tự động khớp vị trí 100% mà không lệch một pixel nào.

3. **Thiết kế giao diện Tích hợp & Tách biệt**:
   - Thêm một thanh chuyển đổi chế độ nhập liệu (Input Mode Switcher) ở đầu bảng điều khiển:
     - **Chế độ A: Vẽ Lasso/Brush (PNG)** (Mặc định - Luồng cũ).
     - **Chế độ B: Nhập Photoshop (PSD)** (Luồng mới).
   - Khi ở chế độ vẽ PNG: Toàn bộ cấu trúc giao diện, canvas vẽ, và các nút thao tác giữ nguyên 100% như hiện tại. Không chạy bất kỳ dòng code PSD nào.
   - Khi ở chế độ nhập PSD:
     - Ẩn dropdown chọn ảnh PNG đơn lẻ và khung vẽ Canvas vẽ mask.
     - Hiển thị khu vực kéo thả file PSD (`#psd-dropzone`).
     - Sau khi tải PSD, hiển thị danh sách layer kèm hình ảnh thu nhỏ (thumbnail), checkbox chọn layer, và ô chỉnh sửa nhãn layer (Label).
     - Nút bấm "Nhập & Vector hóa các layer" sẽ tự động chạy tiến trình gửi API song song/tuần tự và thêm các layer SVG mới vào danh sách stage hiện tại.

---

## Câu hỏi cần làm rõ (Open Questions)

> [!IMPORTANT]
> Vui lòng phản hồi các điểm dưới đây khi phê duyệt kế hoạch:
> 
> 1. **Thứ tự sắp xếp layer**: Photoshop xếp layer từ trên xuống dưới (layer trên cùng hiển thị trước trong danh sách). Tuy nhiên, trong SVG, phần tử viết sau sẽ đè lên phần tử viết trước (hiển thị trên cùng). Kế hoạch đề xuất tự động đảo ngược thứ tự khi import (layer dưới cùng trong PSD sẽ được thêm vào SVG trước, layer trên cùng sẽ được thêm vào sau cùng) để đảm bảo hiển thị đúng như trong Photoshop. Bạn có đồng ý không?
> 2. **Trạng thái ẩn/hiện của Layer**: Có những layer được ẩn đi trong Photoshop (hidden layers). Kế hoạch đề xuất mặc định bỏ chọn (uncheck) các layer bị ẩn này trong danh sách nhập liệu, nhưng vẫn cho phép người dùng tick chọn nếu muốn. Bạn thấy thế nào?
> 3. **Trùng tên nhãn (Label Conflicts)**: Nếu file PSD có các layer trùng tên hoặc trùng với layer đã tồn tại trong stage hiện tại, hệ thống sẽ tự động thêm hậu tố số (ví dụ: `leaf` -> `leaf_1`, `leaf_2`). Phương án này đã tối ưu chưa?

---

## Chi tiết các thay đổi đề xuất

### 1. Cấu trúc Thư mục & Thư viện mới
- Cài đặt thư viện: `npm install ag-psd` (chỉ chạy ở client-side).

### 2. Giao diện Người dùng
#### [MODIFY] [crop-editor.html](file:///d:/soflware/Unity/Source/Farm_HTML/crop-editor.html)
- Thêm tab switcher chọn giữa "Ảnh PNG đơn lẻ" và "Photoshop PSD".
- Thêm vùng `#psd-upload-container` chứa:
  - Khung kéo thả file `.psd` (`#psd-dropzone`).
  - Danh sách cấu trúc layer (`#psd-layers-list`) với giao diện hiển thị:
    - Checkbox chọn nhập.
    - Hình ảnh Thumbnail nhỏ đại diện cho layer.
    - Tên layer gốc và ô Input để thay đổi nhãn (Label) khi trace.
    - Trạng thái VTracer của từng layer (Chờ / Đang trace / Thành công / Thất bại).
  - Nút bấm hành động: "Nhập & Trace PSD" (`#psd-import-btn`) và thanh tiến trình tổng thể (`#psd-progress-bar`).

### 3. CSS / SCSS Styling
#### [MODIFY] [editor.scss](file:///d:/soflware/Unity/Source/Farm_HTML/src/styles/editor.scss)
- Style cho bộ chọn chế độ nhập (Tab switcher).
- Thiết kế vùng kéo thả PSD chuyên nghiệp: viền đứt nét, hiệu ứng hover đổi màu, kính mờ (glassmorphism) đồng bộ với giao diện hiện tại.
- Định dạng danh sách layer PSD dưới dạng lưới (grid/flex) trực quan, hiển thị ảnh preview thu nhỏ bo góc tinh tế.
- Thêm hiệu ứng micro-animation khi trạng thái trace thay đổi (loading spinner xoay nhẹ, icon check xanh lá mượt mà).

### 4. Logic phân tích PSD (TypeScript)
#### [NEW] [psdParser.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/layer-trace/psdParser.ts)
- Hàm `parsePsdFile(buffer: ArrayBuffer)`: Đọc và giải nén file PSD bằng `ag-psd`.
- Hàm `flattenPsdLayers(psd: any)`: Duyệt đệ quy cây thư mục layer để trích xuất danh sách phẳng các layer chứa pixel vẽ được (bỏ qua group folder trống nhưng giữ lại tên cha nếu cần làm tiền tố).
- Hàm `createFullSizeLayerPng(layer: any, psdWidth: number, psdHeight: number)`: Tạo canvas tạm, vẽ ảnh layer lên đúng tọa độ và xuất ra chuỗi Base64 PNG phục vụ trace.

#### [NEW] [psdParser.test.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/layer-trace/psdParser.test.ts)
- Viết các test case TDD để xác thực:
  - Hàm làm phẳng layer duyệt chính xác cấu trúc cây.
  - Tên layer được lọc và chuyển hóa thành định dạng nhãn an toàn (chỉ chứa chữ thường, số, dấu gạch ngang).
  - Tọa độ vẽ được bảo toàn đúng vị trí.

### 5. Điều phối chính
#### [MODIFY] [editor.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/editor.ts)
- Tích hợp thêm các biến trạng thái: `activeInputMode` (`"png" | "psd"`), `loadedPsd` (đối tượng PSD đã parse).
- Bổ sung hàm lắng nghe sự kiện kéo thả file PSD hoặc chọn file qua input truyền thống.
- Hàm `handlePsdFileLoad(file: File)`: Đọc file dưới dạng `ArrayBuffer`, parse bằng thư viện, trích xuất layer và render danh sách trực quan lên UI.
- Hàm `handleBatchPsdTrace()`:
  - Lấy danh sách các layer được chọn.
  - Gửi tuần tự hoặc song song tối đa 2 request trace layer cùng lúc để không làm nghẽn VTracer API.
  - Khi nhận được SVG kết quả, tự động tạo đối tượng `SvgLayerInput` với `groupId` và `label` tương ứng rồi thêm vào danh sách `layerTraceLayers` của stage đang chọn.
  - Cập nhật composite preview và danh sách layer bên phải ngay lập tức.
- Giữ nguyên toàn bộ logic vẽ Lasso/Brush khi chế độ là `"png"`.

---

## Kế hoạch Kiểm thử & Xác thực (Verification Plan)

### Kiểm thử Tự động (Automated Tests)
- Chạy toàn bộ test suite để đảm bảo không lỗi regression: `npx vitest run`.
- Chạy riêng bộ kiểm thử PSD mới: `npx vitest run src/layer-trace/psdParser.test.ts`.
- Đảm bảo kiểm tra kiểu tĩnh thành công: `npx tsc --noEmit`.
- Đảm bảo build production bình thường: `npm run build`.

### Xác thực thủ công (Manual Verification)
1. **Kiểm tra luồng cũ**:
   - Ở chế độ mặc định "Lasso Mask (PNG)", tiến hành nạp ảnh PNG, dùng cọ vẽ Brush mask và khoanh Lasso. Nhấn "Trace Layer" và kiểm tra xem layer SVG tạo ra có chính xác và lưu thành công không.
2. **Kiểm tra luồng PSD mới**:
   - Chuyển sang chế độ "Photoshop PSD". Kéo thả một file `.psd` mẫu.
   - Xác nhận danh sách layer hiển thị đúng tên, có ảnh thumbnail preview nhỏ.
   - Chọn 2-3 layer chính, bấm "Nhập & Trace PSD".
   - Quan sát hiệu ứng tiến trình trace từng layer hoạt động.
   - Xác nhận sau khi trace xong, các layer tự động được thêm vào danh sách layer bên phải của Crop Editor, và ảnh preview ghép (composite) hiển thị các bộ phận khớp khít khịt vào nhau mà không bị lệch vị trí.
   - Thực hiện nhấn "Save" để lưu stage mới và kiểm tra cấu trúc SVG được tạo ra.
