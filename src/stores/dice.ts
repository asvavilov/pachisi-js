import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * кости
 */
export const useDiceStore = defineStore('dice', () => {
  const count: number = 2;
  const special: number = 6;

  const items = ref<number[]>([]);

  const drop = () => {
    items.value = Array.from({ length: count }, () => Math.round(Math.random() * 5 + 1));
  };

  const reset = () => {
    items.value = [];
  };

  const hasSpecial = computed(() => items.value.some((item) => item === special));

  const isEquals = computed(() => items.value.every((item) => item === items.value[0]));

  return {
    drop,
    reset,
    hasSpecial,
    isEquals,
    items,
  };
});
