import { defineConfig } from "vite";
import { cropEditorPlugin } from "./scripts/vite-plugins/editorMiddleware";

export default defineConfig({
  plugins: [cropEditorPlugin()],
  test: {
    environment: "jsdom",
    globals: true
  }
});
