import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Конфигурация Vitest для проекта «Парcis».
// Тесты — только чистые TS-модули (lib/stores/utils), без монтирования .vue-компонентов,
// поэтому @vitejs/plugin-vue не требуется. Vitest сам обрабатывает TypeScript.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
