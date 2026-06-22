import { defineConfig } from "vite";
import { cropEditorPlugin } from "./scripts/vite-plugins/editorMiddleware";

// Force config reload to pick up middleware updates
export default defineConfig({
  plugins: [cropEditorPlugin()],
  test: {
    environment: "jsdom",
    globals: true
  }
});
