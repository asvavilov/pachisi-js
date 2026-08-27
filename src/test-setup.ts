import { beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Создаём свежий Pinia перед каждым тестом, чтобы stores были изолированы.
beforeEach(() => {
  setActivePinia(createPinia());
});
