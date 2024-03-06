import { Connect, PluginOption, defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const crossOriginIsolationMiddleware: Connect.NextHandleFunction = function (
  _,
  response,
  next
) {
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
};

// Plugin credits: https://github.com/vitejs/vite/issues/9864#issuecomment-1232047847
const crossOriginIsolation: PluginOption = {
  name: "cross-origin-isolation",
  configureServer: (server) => {
    server.middlewares.use(crossOriginIsolationMiddleware);
  },
  configurePreviewServer: (server) => {
    server.middlewares.use(crossOriginIsolationMiddleware);
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crossOriginIsolation],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
