import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  assetsInclude: ['**/*.png'],
  build: {
    sourcemap: true,
  },
  define: {
    // Expor MAPS_KEY (sem prefixo) como VITE_MAPS_KEY para o client
    'import.meta.env.VITE_MAPS_KEY': JSON.stringify(process.env.MAPS_KEY || ''),
  },
  resolve: {
    alias: {
      '~': '/app',
    },
  },
  server: {
    // Ignora solicitações para arquivos específicos do Chrome DevTools
    fs: {
      deny: ['.well-known/appspecific/**'],
    },
  },
});
