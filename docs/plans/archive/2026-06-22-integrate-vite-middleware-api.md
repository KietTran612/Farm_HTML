# Integrate Vite Middleware API Implementation Plan

Kế hoạch tích hợp các API trung gian (Middleware) vào Vite Dev Server phục vụ cho công cụ HTML Crop Art Editor.

## User Review Required

> [!IMPORTANT]
> **VTracer CLI Execution:** Middleware này sẽ gọi trực tiếp file thực thi VTracer CLI (`vtracer.exe` hoặc `vtracer`) trên máy của lập trình viên. Để đảm bảo an toàn, đường dẫn sẽ được tìm kiếm tự động thông qua các vị trí phổ biến (như `D:/bin/vtracer.exe`, `d:/bin/vtracer.exe`, `scripts/vtracer/bin/vtracer.exe`, hoặc biến môi trường `VTRACER_BIN`).
>
> **Tệp tin đầu ra chính thức:** Khi thực hiện lưu (`/api/editor/save`), dữ liệu SVG chính thức sẽ được ghi vào `src/assets/crops/<crop_name>/<stage_name>.svg` và file cấu hình metadata sẽ được tạo/cập nhật tại `src/assets/crops/<crop_name>/meta.json`.

## Proposed Changes

### Build and Config

#### [MODIFY] [vite.config.ts](file:///d:/soflware/Unity/Source/Farm_HTML/vite.config.ts)
- Import và đăng ký plugin `cropEditorPlugin` vào cấu hình Vite.

### Core Middleware Logic

#### [NEW] [editorMiddleware.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/tools/vtracer/editorMiddleware.ts)
- Viết Vite plugin `cropEditorPlugin` sử dụng Hook `configureServer`.
- Định nghĩa hàm middleware bắt các request bắt đầu bằng `/api/editor/`:
  - `GET /api/editor/crops`:
    - Đọc thư mục `docs/Crops`.
    - Lọc ra các thư mục con (ví dụ: `Corn`, `Carrot`, `Potato`...).
    - Với mỗi thư mục con, quét các file ảnh có đuôi `.png` (các stage PNG gốc của cây trồng).
    - Trả về danh sách JSON chứa thông tin các cây trồng và danh sách file PNG tương đối của chúng.
  - `POST /api/editor/trace`:
    - Nhận body dạng JSON: `{ "inputPath": "docs/Crops/Corn/...", "params": { ... } }`.
    - Chạy VTracer CLI với các tham số nhận được, ghi ra tệp SVG tạm thời.
    - Đọc tệp SVG tạm, tối ưu hóa bằng SVGO, và tính toán metrics (dung lượng, số path, số nhóm, v.v.).
    - Xóa tệp SVG tạm thời.
    - Trả về JSON chứa nội dung SVG thô, SVG tối ưu và các metrics tương ứng.
  - `POST /api/editor/save`:
    - Nhận body dạng JSON chứa thông tin mapping: `{ "cropName": "corn", "stages": { "stage00": "<svg>...</svg>", "dead": "<svg>...</svg>" } }`.
    - Tạo thư mục đích: `src/assets/crops/<cropName>/` nếu chưa có.
    - Với mỗi stage trong map, lưu file SVG tối ưu tương ứng vào `src/assets/crops/<cropName>/<stageName>.svg`.
    - Ghi file cấu hình `src/assets/crops/<cropName>/meta.json` lưu giữ cấu trúc mapping và số lượng stage để ứng dụng game chính đọc được.

### Verification Plan

#### Automated Tests
- Tạo file kiểm thử [editorMiddleware.test.ts](file:///d:/soflware/Unity/Source/Farm_HTML/src/tools/vtracer/editorMiddleware.test.ts) để chạy các bài test độc lập thông qua Vitest:
  - Kiểm tra API `GET /api/editor/crops` trả về danh sách thư mục và file PNG đúng định dạng.
  - Kiểm tra API `POST /api/editor/trace` với tham số mockup hoặc thực tế để đảm bảo gọi CLI chuẩn và trả về SVG hợp lệ.
  - Kiểm tra API `POST /api/editor/save` tạo đúng thư mục, ghi đúng file SVG và file `meta.json`.
- Chạy lệnh test:
  ```bash
  npx vitest run src/tools/vtracer/editorMiddleware.test.ts
  ```

#### Manual Verification
- Chạy dev server bằng `npm run dev`.
- Dùng `curl` hoặc công cụ HTTP client gửi request đến:
  - `GET http://localhost:3000/api/editor/crops`
  - `POST http://localhost:3000/api/editor/trace`
  - `POST http://localhost:3000/api/editor/save`
- Kiểm tra kết quả phản hồi của API và sự xuất hiện của các file mới trong `src/assets/crops/`.
