// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Set SITE_URL (for example https://rhinovate.com) to get canonical URLs, absolute Open Graph images and a sitemap. */
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  integrations: site ? [sitemap()] : [],
  build: { inlineStylesheets: 'auto' },
  /* The 3D workspace bundles three.js (about 135 kB gzipped). It loads only on pages that show it. */
  vite: { build: { chunkSizeWarningLimit: 700 } }
});
