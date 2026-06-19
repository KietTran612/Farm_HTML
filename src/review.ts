import "./styles/main.scss";
import { renderCropArt } from "./ui/crop-art/cropArt";
import type { CropArtInput } from "./ui/crop-art/cropArtTypes";

const crops = [
  { id: "carrot", name: "Cà rốt" },
  { id: "corn", name: "Ngô" },
  { id: "potato", name: "Khoai tây" },
  { id: "pumpkin", name: "Bí ngô" },
  { id: "strawberry", name: "Dâu tây" },
  { id: "tomato", name: "Cà chua" },
  { id: "wheat", name: "Lúa mì" }
];

const states: { name: string; desc: string; input: Partial<CropArtInput> }[] = [
  {
    name: "Hạt giống (Seed)",
    desc: "Giai đoạn mới gieo hạt",
    input: { growthState: "seeded", isDead: false, isDry: false, soilLevel: 1, hasPest: false }
  },
  {
    name: "Mầm non (Sprout)",
    desc: "Cây con mới nhô khỏi đất",
    input: { growthState: "sprout", isDead: false, isDry: false, soilLevel: 1, hasPest: false }
  },
  {
    name: "Trưởng thành (Mature)",
    desc: "Cây lớn và xum xuê lá",
    input: { growthState: "grown", isDead: false, isDry: false, soilLevel: 1, hasPest: false }
  },
  {
    name: "Sẵn sàng (Ready)",
    desc: "Thu hoạch tươi ngon",
    input: { growthState: "harvestable", isDead: false, isDry: false, soilLevel: 1, hasPest: false }
  },
  {
    name: "Héo úa (Dead)",
    desc: "Quá hạn tưới nước bị chết khô",
    input: { growthState: "dead", isDead: true, isDry: false, soilLevel: 1, hasPest: false }
  },
  {
    name: "Đất khô (Dry Soil)",
    desc: "Đất bạc màu xám, cây thiếu nước",
    input: { growthState: "harvestable", isDead: false, isDry: true, soilLevel: 1, hasPest: false }
  },
  {
    name: "Đất nâng cấp (Upgraded)",
    desc: "Đất cấp 2 màu mỡ sẫm hơn",
    input: { growthState: "harvestable", isDead: false, isDry: false, soilLevel: 2, hasPest: false }
  },
  {
    name: "Bị sâu bệnh (Pest)",
    desc: "Có sâu bọ cắn phá (hiệu ứng bóng đỏ)",
    input: { growthState: "harvestable", isDead: false, isDry: false, soilLevel: 1, hasPest: true }
  }
];

function initReview() {
  const container = document.getElementById("review-container");
  if (!container) return;

  crops.forEach((crop) => {
    // Tạo crop section
    const section = document.createElement("div");
    section.className = "crop-section";

    const title = document.createElement("div");
    title.className = "crop-title";
    title.innerText = `${crop.name} (${crop.id})`;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "grid-states";

    states.forEach((state, index) => {
      const card = document.createElement("div");
      card.className = "state-card";

      const wrapper = document.createElement("div");
      wrapper.className = "crop-preview-wrapper";

      // Render SVG Crop Art
      const cropArtInput: CropArtInput = {
        instanceId: `review-${crop.id}-${index}`,
        cropId: crop.id,
        cropName: crop.name,
        growthState: state.input.growthState ?? "seeded",
        soilLevel: state.input.soilLevel ?? 1,
        isDry: state.input.isDry ?? false,
        hasPest: state.input.hasPest ?? false,
        isDead: state.input.isDead ?? false
      };

      wrapper.innerHTML = renderCropArt(cropArtInput);
      card.appendChild(wrapper);

      const stateName = document.createElement("div");
      stateName.className = "state-name";
      stateName.innerText = state.name;
      card.appendChild(stateName);

      const stateDesc = document.createElement("div");
      stateDesc.className = "state-desc";
      stateDesc.innerText = state.desc;
      card.appendChild(stateDesc);

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  // Xử lý bật tắt animation đung đưa
  const toggleSwayBtn = document.getElementById("toggle-sway");
  if (toggleSwayBtn) {
    toggleSwayBtn.addEventListener("click", () => {
      const active = toggleSwayBtn.classList.toggle("active");
      const plants = document.querySelectorAll(".crop-plant, .carrot-layer, .corn-ear, .potato-tuber, .pumpkin-rib, .strawberry-berry, .tomato-fruit");
      
      if (active) {
        toggleSwayBtn.innerText = "Bật/Tắt Animation Đung Đưa";
        // Khôi phục animation bằng cách xóa style đè
        plants.forEach((p) => {
          (p as HTMLElement).style.animation = "";
        });
      } else {
        toggleSwayBtn.innerText = "Đã Tắt Animation (Tĩnh)";
        // Đè animation thành none để dừng chuyển động
        plants.forEach((p) => {
          (p as HTMLElement).style.animation = "none";
        });
      }
    });
  }
}

initReview();
