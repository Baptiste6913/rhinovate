// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Set SITE_URL (for example https://rhinovate.com) to get canonical URLs, absolute Open Graph images and a sitemap. */
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  integrations: site ? [sitemap()] : [],
  /* Styles and scripts stay in files, never in the page: the content security policy in vercel.json allows nothing inline. */
  build: { inlineStylesheets: 'never' },
  vite: {
    /* three.js (about 135 kB gzipped) loads only on pages that show the 3D demo, and inside a worker where the browser can draw from one. */
    build: { chunkSizeWarningLimit: 700, assetsInlineLimit: 0 },
    /* The worker loads the renderer on demand, which needs a module worker. */
    worker: { format: 'es' }
  }
});
