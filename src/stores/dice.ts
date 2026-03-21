import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * кости
 */
export const useDiceStore = defineStore('dice', () => {
  const count: number = 2;
  const startItem: number = 6;
  const addonItem: number = 6;
  const outVariant: number = 5;

  const items = ref<number[]>([]);
  const used = ref<number[]>([]);

  /**
   * Возвращает массив, в котором из массива source удалены вхождения элементов массива toRemove
   * с учётом количества (каждое вхождение toRemove удаляет одно совпадение из source).
   */
  function diffByCount(source: number[], toRemove: number[]): number[] {
    const sourceCounts = new Map<number, number>();
    for (const val of source) {
      sourceCounts.set(val, (sourceCounts.get(val) || 0) + 1);
    }
    for (const val of toRemove) {
      if (sourceCounts.has(val)) {
        const count = sourceCounts.get(val)!;
        if (count === 1) {
          sourceCounts.delete(val);
        } else {
          sourceCounts.set(val, count - 1);
        }
      }
    }
    const result: number[] = [];
    for (const [val, count] of sourceCounts) {
      for (let i = 0; i < count; i++) {
        result.push(val);
      }
    }
    return result;
  }

  const sum = computed(() => items.value.reduce((acc, cur) => acc + cur, 0));
  const unusedSum = computed(() => unused.value.reduce((acc, cur) => acc + cur, 0));

  const roll = () => {
    used.value = [];
    items.value = Array.from({ length: count }, () => Math.round(Math.random() * 5 + 1));
  };

  const use = (value: number) => {
    // Проверяем, есть ли значение среди неиспользованных
    if (unused.value.includes(value)) {
      used.value.push(value);
    } else if (value === unusedSum.value) {
      used.value.push(...unused.value);
    }
  };

  const unused = computed(() => {
    return diffByCount(items.value, used.value);
  });

  const isAllUsed = computed(() => {
    return used.value.length > 0 ? used.value.length === items.value.length : undefined;
  });

  const reset = () => {
    items.value = [];
    used.value = [];
  };

  const hasStart = computed(() => items.value.some((item) => item === startItem));

  const hasAddon = computed(() => items.value.some((item) => item === addonItem));

  const hasOut = computed(
    () =>
      items.value.some((item) => item === outVariant) ||
      items.value.reduce((acc, cur) => acc + cur, 0) === outVariant,
  );

  const isEquals = computed(
    () => items.value.length > 0 && items.value.every((item) => item === items.value[0]),
  );

  const rolled = computed(() => items.value.length > 0);

  return {
    roll,
    reset,
    hasStart,
    hasAddon,
    hasOut,
    isEquals,
    items,
    used,
    use,
    unused,
    isAllUsed,
    sum,
    unusedSum,
    rolled,
  };
});
