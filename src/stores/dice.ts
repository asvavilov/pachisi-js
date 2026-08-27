import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * кости
 */
export const useDiceStore = defineStore('dice', () => {
  const count: number = 2;
  const outItem: number = 5;

  const items = ref<number[]>([]);
  const used = ref<number[]>([]);

  /**
   * Возвращает массив, в котором из массива source удалены вхождения элементов массива toRemove
   * с учётом количества (каждое вхождение toRemove удаляет одно совпадение из source).
   */
  const diffByCount = (source: number[], toRemove: number[]) => {
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
  };

  const sum = computed(() => items.value.reduce((acc, cur) => acc + cur, 0));
  const unusedSum = computed(() => unused.value.reduce((acc, cur) => acc + cur, 0));

  const roll = () => {
    used.value = [];
    items.value = Array.from({ length: count }, () => Math.round(Math.random() * 5 + 1));
  };

  const use = (item: number) => {
    // Проверяем, есть ли значение среди неиспользованных
    if (unused.value.includes(item)) {
      used.value.push(item);
    } else if (item === unusedSum.value) {
      used.value.push(...unused.value);
    }
  };

  const unused = computed(() => diffByCount(items.value, used.value));

  const isAllUsed = computed(() => {
    return used.value.length > 0 ? used.value.length === items.value.length : undefined;
  });

  const reset = () => {
    items.value = [];
    used.value = [];
  };

  // README п.4: выход с базы — по сумме двух кубиков, равной 5 (а не по «6»).
  const hasStart = computed(() => sum.value === outItem);

  // README п.7 + адаптация: дополнительный бросок даёт дубль (а не «6»).
  const hasAddon = computed(() => isEquals.value);

  // README п.4: выход возможен, когда сумма двух кубиков равна 5.
  const hasOut = computed(() => sum.value === outItem);

  const isOut = (steps: number) => steps === outItem;

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
    isOut,
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
