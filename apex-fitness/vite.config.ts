import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Les bibliothèques 3D sont isolées dans un chunk séparé, chargé à la demande
// (le texte du hero s'affiche avant que three.js ne soit téléchargé).
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // seuls les modules 3D vont dans le chunk « three » (React reste dans le chunk principal)
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) return 'react'; // évite que le helper tire three.js au démarrage
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return 'react';
          if (/node_modules\/(three|@react-three|three-stdlib|troika-[^/]+|maath|zustand|suspend-react|its-fine)\//.test(id)) return 'three';
        },
      },
    },
  },
});
