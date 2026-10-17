import tailwindcss from '@tailwindcss/vite';
import {readFileSync} from 'node:fs';
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
