# Hướng Dẫn Sinh Ảnh Cây Trồng (Crop Art AI Generation Guide)

Tài liệu này tổng hợp toàn bộ các loại cây trồng (Crops) hiện có trong dự án, các giai đoạn phát triển (States) của chúng và đặc tả thiết kế mảnh đất đi kèm (Plot) để làm tài liệu yêu cầu hoặc Prompt cho AI sinh ảnh (như Midjourney, DALL-E 3, Stable Diffusion).

---

## 1. Phong Cách Đồ Họa Chung (Universal Art Style)

Để đảm bảo các hình ảnh do AI tạo ra có độ nhất quán cao khi đưa vào game, các prompt cần áp dụng chung một bộ từ khóa phong cách sau:

* **Perspective (Góc nhìn):** `Isometric 2.5D projection, 45-degree angle` (Góc nhìn xéo từ trên xuống dưới).
* **Style (Phong cách):** `Cozy flat vector art, cute toy-like, pastel colors, clean outline, minimalist game asset, 2D vector style, stylized illustration`.
* **Background (Nền):** `Transparent background` (Nền trong suốt - Tiêu chuẩn bắt buộc cho file PNG đầu vào để tránh tạo mảng vector nền dư thừa đè lên game).
* **Lighting (Ánh sáng):** `Soft lighting, gentle shadows, simple flat colors, no complex photorealistic gradients`.

> [!IMPORTANT]
> **Yêu Cầu Bắt Buộc Về Nền Trong Suốt (Transparent Background Requirement):**
> Các file PNG khi nạp vào công cụ Crop Editor để trace sang SVG **bắt buộc phải có nền trong suốt (Transparent)**. Nếu tệp PNG có nền trắng hoặc nền màu, thuật toán VTracer sẽ tự động vẽ thêm một mảng vector khổng lồ bọc bên ngoài để làm nền, gây dư thừa dung lượng và che khuất các ô đất khác trong game.
> 
> *Mẹo quy trình thực hiện:*
> - Khi viết Prompt cho AI (như DALL-E 3 hoặc Midjourney), bạn có thể yêu cầu nền trắng (`solid white background`) hoặc nền trơn để AI dễ dàng cô lập vật thể.
> - **Trước khi tải ảnh vào Crop Editor:** Hãy chạy ảnh qua các công cụ tách nền tự động (như Photoshop Quick Action, Remove.bg, Photoroom, Canva...) để xóa sạch nền và xuất ra file **PNG Transparent** chuẩn.

> [!IMPORTANT]
> **Lưu ý cho việc xuất sang SVG (Trace Quality Optimization):**
> Để quá trình trace tự động từ PNG sang SVG đạt chất lượng nét vẽ sắc sảo và giống ảnh gốc nhất:
> - Cây trồng và đất cần có **đường viền rõ ràng (sharp outlines)**, các mảng màu được phân tách mạch lạc.
> - Tránh các chi tiết đổ bóng mịn quá phức tạp, mờ nhòe (soft gradients) hoặc các hạt nhiễu (noise) vì chúng sẽ làm rối thuật toán vẽ đường vector.
> - Nên ưu tiên phong cách màu phẳng (Flat color hoặc Cel-shading).

---

## 2. Thiết Kế Mảnh Đất Mặc Định (Default Plot - Tạo Riêng)

Mảnh đất mặc định được vẽ độc lập, không có bất kỳ cây trồng nào trên đó, dùng làm nền đất trống khi chưa gieo hạt.

* **Mô tả:** Một ụ đất hình bình hành bo góc 2.5D (Isometric tile), mô phỏng đất nâu tơi xốp, có độ dày (3D rim) ở cạnh trước, bề mặt có vài thớ đất hoặc vết nứt nhỏ tự nhiên.
* **Màu sắc:** Tông màu nâu ấm (`#8b5a37` đến `#b87947`).
* **Prompt mẫu cho AI:**
  > `An isolated isometric 2.5D empty soil plot, raised dirt patch, raised flat-top mound, flat vector art style, cute toy-like game asset, warm brown soil color, soft shadows, transparent background, clean lines --v 6.0`

---

## 3. Quy Tắc Đặt Tên File & Ánh Xạ Trạng Thái (Mapping Table)

Khi bạn sinh ảnh PNG từ AI, hãy lưu các file ảnh PNG với tên gọi theo quy tắc dưới đây trước khi tải vào **Crop Editor** để đảm bảo hệ thống nạp đúng stages của cây trồng:

| Trạng thái trong Game (State) | Mô tả hình ảnh cây | Tên file ảnh PNG khuyên dùng |
|---|---|---|
| **Seeded / Seed** | Mới gieo (Hạt giống nứt nanh hoặc mầm cực nhỏ sát đất) | `stage00.png` |
| **Sprout** | Cây con (Chồi non nhỏ nhú lên từ lòng đất) | `stage01.png` |
| **Grown / Mature** | Đang lớn/Trưởng thành (Cành lá xum xuê, chưa ra quả chín) | `stage02.png` |
| **Harvestable / Ready** | Sẵn sàng thu hoạch (Cây ở độ chín đẹp nhất, trĩu quả/bông) | `stage03.png` |
| **Dead** | Đã chết (Cây héo khô, rũ xuống, màu xám/nâu đen) | `dead.png` |

---

## 4. Đặc Tả Chi Tiết Từng Loại Cây Đi Kèm Mảnh Đất Riêng

Tất cả các ảnh giai đoạn phát triển của cây trồng **bắt buộc phải được vẽ mọc từ mảnh đất đặc trưng của cây đó** để đảm bảo sự hòa quyện tự nhiên.

### 4.1. Cà Rốt (Carrot)

* **Loại đất đi kèm (Plot):** **Ụ đất vun cao (Raised mound plot)**. Đất nâu ẩm được đắp cao lên thành một luống tròn nổi khối ở giữa để củ có thể mọc cắm sâu xuống.
* **Đặc tả các State:**
  * `stage00` (Seed): Ụ đất vun cao có một hạt giống nhỏ màu nâu nằm ở đỉnh hoặc chồi mầm tí hon.
  * `stage01` (Sprout): Một vài cọng lá xanh nhỏ dạng lông chim nhú lên từ đỉnh ụ đất vun.
  * `stage02` (Mature): Bụi lá xanh mọc cao, dày và xum xuê tỏa ra xung quanh.
  * `stage03` (Ready): Bụi lá xanh lớn, phần đầu củ cà rốt màu cam sáng nhô lên một phần khỏi đỉnh ụ đất vun.
  * `dead` (Dead): Bụi lá héo rũ, khô héo chuyển sang màu xám đen, ụ đất xỉn màu.
* **Prompt mẫu cho AI (State Ready):**
  > `An isolated isometric 2.5D carrot crop ready for harvest, growing on a raised mound soil plot, bright orange carrot crown peeking out of the dirt, lush green leafy tops, flat vector art, cute game asset, transparent background --v 6.0`

---

### 4.2. Lúa mì / Lúa nước (Wheat / Rice)

> [!NOTE]
> Trong mã nguồn game chính đang dùng cả hai tên gọi: Lúa nước (`rice` - trong cấu hình dữ liệu) và Lúa mì (`wheat` - trong render). 
> - Nếu bạn chọn **Lúa nước (Rice)**: Đi kèm ruộng nước ngập (wet paddy plot).
> - Nếu bạn chọn **Lúa mì (Wheat)**: Đi kèm luống đất nông nghiệp khô bằng phẳng thông thường.

* **Loại đất đi kèm (Plot - Lúa nước):** **Ruộng nước (Wet paddy plot)**. Có bờ ruộng đất sét bao quanh, bên trong là mặt nước phẳng lặng phản quang màu xám-xanh lam óng ánh.
* **Đặc tả các State:**
  * `stage00` (Seed): Ruộng nước ngập có các hạt lúa nhỏ nổi trên nước bùn.
  * `stage01` (Sprout): Những lá mầm mảnh khảnh màu xanh non nhú lên khỏi mặt ruộng nước.
  * `stage02` (Mature): Các khóm lúa xanh mướt mọc cao thành bụi đứng thẳng giữa ruộng nước.
  * `stage03` (Ready): Khóm lúa uốn cong nhẹ, các bông lúa chín vàng trĩu hạt phản chiếu xuống mặt nước ruộng.
  * `dead` (Dead): Khóm lúa khô héo, gãy rạp, chuyển sang màu nâu xám xơ xác nằm rạp trên ruộng bùn khô cạn nước.
* **Prompt mẫu cho AI (State Ready - Lúa nước):**
  > `An isolated isometric 2.5D golden rice crop ready for harvest, growing in a wet paddy plot with water surface and clay borders, ripe golden stalks bowing gently, flat vector art style, cute game asset, transparent background --v 6.0`

---

### 4.3. Dâu Tây (Strawberry)

* **Loại đất đi kèm (Plot):** **Luống phủ bạt nông nghiệp (Plastic mulched plot)**. Luống đất dài được phủ một lớp bạt màng nilon màu đen/xám sáng bóng, có khoét một lỗ tròn ở giữa để gốc cây mọc lên.
* **Đặc tả các State:**
  * `stage00` (Seed): Lỗ tròn trên bạt nilon có chứa đất ẩm và hạt mầm dâu nhỏ.
  * `stage01` (Sprout): Cây con với 3-4 lá dâu răng cưa nhỏ mọc ra từ lỗ khoét trên bạt nilon.
  * `stage02` (Mature): Bụi dâu phát triển rộng, có nhiều lá xanh xum xuê phủ lên màng bạt.
  * `stage03` (Ready): Bụi dâu sum suê, lấp ló các bông hoa trắng nhụy vàng và nhiều quả dâu tây đỏ mọng nằm trên lớp bạt đen.
  * `dead` (Dead): Cành lá khô héo, chuyển sang màu nâu xám úa tàn trên lớp bạt đen cũ kỹ.
* **Prompt mẫu cho AI (State Ready):**
  > `An isolated isometric 2.5D strawberry bush ready for harvest, growing from a black plastic sheet mulched soil plot, ripe red strawberries and small white flowers resting on the sheet, green jagged leaves, flat vector art, cute game asset, transparent background --v 6.0`

---

### 4.4. Ngô / Bắp (Corn)

* **Loại đất đi kèm (Plot):** **Ụ đất nâu ẩm có cọc tre cắm đỡ (Staked brown soil plot)**. Đất nâu ẩm có một chiếc cọc tre nhỏ cắm thẳng đứng kế bên để hỗ trợ cây thân cao.
* **Đặc tả các State:**
  * `stage00` (Seed): Ụ đất có cọc tre cắm sẵn, dưới chân cọc là hạt ngô nhỏ mới nhú mầm.
  * `stage01` (Sprout): Thân cây ngô non mảnh khảnh cao khoảng gang tay mọc cạnh chiếc cọc tre nhỏ.
  * `stage02` (Mature): Cây ngô mọc cao thẳng đứng bám sát cọc tre, các bẹ lá dài to bản đâm ngang rộng rủ xuống.
  * `stage03` (Ready): Cây ngô cao, ở các nách lá mọc ra các bắp ngô bọc bẹ xanh, lấp ló hạt ngô vàng và râu ngô màu nâu đỏ.
  * `dead` (Dead): Thân ngô khô gãy, lá héo úa chuyển sang màu rơm vàng xám, chiếc cọc tre bị nghiêng.
* **Prompt mẫu cho AI (State Ready):**
  > `An isolated isometric 2.5D corn plant ready for harvest, growing next to a small wooden support stake on a brown soil plot, green corn husks with yellow kernels and reddish silk peeking out, tall stalks, flat vector art, cute game asset, transparent background --v 6.0`

---

### 4.5. Khoai Tây (Potato)

* **Loại đất đi kèm (Plot):** **Ụ đất vun luống phẳng rộng (Flat-top raised mound plot)**. Ụ đất nâu tơi xốp được vun rộng và bằng phẳng trên bề mặt.
* **Đặc tả các State:**
  * `stage00` (Seed): Đỉnh ụ đất phẳng có mầm khoai tây nhỏ màu tím/xanh nhú lên.
  * `stage01` (Sprout): Mầm khoai tây xanh mập mạp nhú lên khỏi ụ đất rộng.
  * `stage02` (Mature): Bụi cây khoai tây nhiều nhánh lá xanh thẫm mọc thấp gần mặt đất.
  * `stage03` (Ready): Lá cây bắt đầu ngả vàng nhẹ trên ngọn, dưới gốc ụ đất hơi nứt ra lộ ra một vài củ khoai tây màu vàng đất tròn trịa.
  * `dead` (Dead): Toàn bộ bụi lá trên mặt đất héo rũ, khô héo hoàn toàn thành màu nâu đen đen.
* **Prompt mẫu cho AI (State Ready):**
  > `An isolated isometric 2.5D potato crop, growing on a flat-top raised dirt plot, small green plant starting to yellow at the tips, rounded potatoes visible peeking out of cracks in the brown soil, flat vector art, cute game asset, transparent background --v 6.0`

---

### 4.6. Bí Ngô (Pumpkin)

* **Loại đất đi kèm (Plot):** **Mảnh đất bằng phẳng lót rơm khô (Flat soil plot with straw bed)**. Đất phẳng được rải một lớp rơm rạ màu vàng nhạt xung quanh để lót quả.
* **Đặc tả các State:**
  * `stage00` (Seed): Mảnh đất phẳng lót rơm có hạt mầm bí ngô mới nhú.
  * `stage01` (Sprout): Dây bí ngô non nhú lên khỏi đất với hai lá mầm to tròn.
  * `stage02` (Mature): Dây leo bí ngô bò lan ra mép đất cùng các lá răng cưa to bản màu xanh lục.
  * `stage03` (Ready): Dây leo bò rộng, trên lớp rơm khô xuất hiện quả bí ngô khổng lồ màu cam tròn trịa, có múi rõ ràng.
  * `dead` (Dead): Dây leo và lá héo úa xơ xác chuyển màu xám đen, quả bí ngô cũ kỹ xỉn màu nằm trên lớp rơm khô.
* **Prompt mẫu cho AI (State Ready):**
  > `An isolated isometric 2.5D giant orange pumpkin, resting on a bed of dry yellow straw on a flat soil plot, thick green vines and large green leaves crawling on the ground, flat vector art, cute game asset, transparent background --v 6.0`

---

### 4.7. Cà Chua (Tomato)

* **Loại đất đi kèm (Plot):** **Đất có giàn cọc chữ A (Trellis support plot)**. Ụ đất có cắm các cọc tre đan chéo/chữ A để cây leo bám thẳng đứng.
* **Đặc tả các State:**
  * `stage00` (Seed): Ụ đất dưới chân giàn cọc có hạt giống mầm cà chua nhỏ nhú lên.
  * `stage01` (Sprout): Cây cà chua non xanh mướt mọc lên sát chân cọc tre.
  * `stage02` (Mature): Thân cây leo bám cao lên giàn cọc tre, có nhiều lá xanh xum xuê và một vài nụ hoa nhỏ màu vàng.
  * `stage03` (Ready): Cây cà chua phủ đầy lá xanh leo kín giàn cọc, treo lủng lẳng các chùm quả cà chua tròn mọng đỏ tươi (xen lẫn một vài quả xanh).
  * `dead` (Dead): Thân leo và lá héo rũ, khô cháy màu nâu xám bám trên giàn cọc tre xơ xác.
* **Prompt mẫu cho AI (State Ready):**
  > `An isolated isometric 2.5D tomato plant ready for harvest, climbing a bamboo trellis on a soil plot, red ripe tomatoes hanging in clusters among green leaves, flat vector art, cute game asset, transparent background --v 6.0`

---

## 5. Mẹo Tinh Chỉnh Để Giữ Nhất Quán Hình Ảnh Với AI (AI Consistency Tips)

Khi làm việc với AI tạo ảnh như Midjourney, việc giữ cho hình dáng của **Mảnh đất (Plot)** không bị biến đổi khi đổi trạng thái cây là một thách thức lớn. Hãy áp dụng các mẹo sau:

1. **Sử dụng Seed chung (Midjourney):**
   Khi tạo ra được bức ảnh đầu tiên ưng ý (ví dụ `stage03` của Cà rốt), hãy lấy số seed của ảnh đó (thả biểu tượng thư ✉️ vào ảnh để bot gửi seed) và thêm `--seed <số_seed>` vào tất cả các prompt tạo stage tiếp theo của Cà rốt.
2. **Sử dụng kỹ thuật Image-to-Image / Pan / Vary:**
   Sử dụng ảnh đất trống hoặc ảnh stage trước làm ảnh tham chiếu (Image Prompt) để sinh ảnh stage sau, giữ mức độ ảnh hưởng trung bình (trong Midjourney dùng `--iw 1.0` đến `--iw 1.5`).
3. **Mô tả cố định Mảnh đất trong Prompt:**
   Giữ nguyên 100% vế mô tả mảnh đất trong prompt, chỉ thay đổi vế mô tả cây ở phía trước. 
   *(Ví dụ: Đoạn tả đất `"...growing on a flat-top raised dirt plot, flat vector art, cute game asset, transparent background"` luôn được giữ nguyên ở mọi stage).*
4. **Vary (Region) - Tách nền trước khi ghép:**
   Nếu bạn đã có ảnh ụ đất đẹp và chỉ muốn mọc thêm mầm cây nhỏ, hãy dùng tính năng **Vary (Region)** để tô đen vùng đỉnh đất rồi gõ thêm mô tả mầm cây nhú lên, AI sẽ chỉ vẽ thêm mầm cây mà giữ nguyên 100% hình dạng ụ đất xung quanh.
