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
    coverage: {
      // Покрываем только тестируемые модули игровой логики (lib/stores/utils).
      include: ['src/lib/**', 'src/stores/**', 'src/utils/**'],
      exclude: [
        'src/**/*.test.ts',
        'src/test-setup.ts',
        // Barrel для Quasar (#q-app/wrappers) не парсится standalone в v8.
        'src/stores/index.ts',
      ],
      reporter: ['text', 'html', 'clover'],
      // Минимально допустимый уровень покрытия. Снижение ниже этих значений
      // приведёт к падению команды npm run test:coverage.
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 96,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
