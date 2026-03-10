import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@collabwhiteboard/shared': resolve(__dirname, '../shared/types.ts'),
    },
  },
  test: {
    globals: true,
  },
});
