import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
// Special config for GitHub Pages deployment
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://noesisvision.github.io',
  base: '/noesis-landing-page/',
  build: {
    assets: 'assets'
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      }
    }
  }
}); 