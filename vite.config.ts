import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist/renderer",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        controller: path.resolve(__dirname, "controller.html"),
      },
    },
  },
});
