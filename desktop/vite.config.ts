import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Politique de sécurité du contenu appliquée au build uniquement (le serveur de dev Vite
// a besoin de scripts inline pour le rechargement à chaud).
const csp: Plugin = {
  name: "aide-csp",
  apply: "build",
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data:",
      "media-src 'self' blob:",
      // Mode navigateur (sans Electron) : appels directs à l'API locale.
      "connect-src 'self' http: https: ws: wss:",
    ].join("; ");
    return html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), csp],
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5173, strictPort: true },
});
