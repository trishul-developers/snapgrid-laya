import tailwindcss from '@tailwindcss/vite';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'path';
import {defineConfig} from 'vite';

const {version} = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig(() => {
  return {
    plugins: [
      tailwindcss(),
      {
        name: 'app-version',
        transformIndexHtml(html) {
          return html.replaceAll('__APP_VERSION__', version);
        },
        closeBundle() {
          const swPath = path.resolve(import.meta.dirname, 'dist/sw.js');
          if (existsSync(swPath)) {
            let swContent = readFileSync(swPath, 'utf8');
            swContent = swContent.replaceAll('__APP_VERSION__', version);
            writeFileSync(swPath, swContent);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio preview to avoid websocket connection errors in iFrames/reverse proxies
      hmr: false,
      watch: null,
    },
  };
});
