import fs from "fs";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import icon from "astro-icon";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import rehypeExternalLinks from "rehype-external-links";
import { siteConfig } from "./src/site.config";
import webmanifest from "astro-webmanifest";

import vtbot from "astro-vtbot";

import alpinejs from "@astrojs/alpinejs";

export default defineConfig({
  site: siteConfig.site,
  devToolbar: {
    enabled: false,
  },
  i18n: {
    locales: siteConfig.langs,
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
    plugins: [
      svgr({
        svgrOptions: {
          icon: true,
        },
      }),
      tailwindcss(),
      visualizer({
        emitFile: true,
        filename: "package_analyze.html",
      }),
      rawFonts([".ttf", ".woff"]),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
    server: {
      watch: {
        ignored: ["**/.git/**", "**/website/**", "**/dist/**"],
      },
    },
  },
  integrations: [
    sitemap(),
    react(),
    icon(),
    vtbot(),
    webmanifest({
      name: siteConfig.title,
      short_name: "Anas Photo",
      description: siteConfig.description,
      lang: siteConfig.lang,
      icon: "public/favicon/favicon-512x512.png",
      icons: [
        {
          src: "public/favicon/favicon-180x180.png",
          sizes: "180x180",
          type: "image/png",
        },
        {
          src: "public/favicon/favicon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "public/favicon/favicon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      start_url: "/",
      theme_color: "#fdfaf6",
      background_color: "#fdfaf6",
      display: "standalone",
    }),
    alpinejs(),
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          content: { type: "text", value: " 🔗" },
        },
      ],
    ],
  },
});

function rawFonts(ext) {
  return {
    name: "vite-plugin-raw-fonts",
    transform(_, id) {
      if (ext.some((e) => id.endsWith(e))) {
        const buffer = fs.readFileSync(id);
        return {
          code: `export default ${JSON.stringify(buffer)}`,
          map: null,
        };
      }
    },
  };
}
