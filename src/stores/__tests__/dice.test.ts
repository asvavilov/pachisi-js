import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDiceStore } from 'src/stores/dice';

describe('dice store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('roll() генерирует 2 значения от 1 до 6', () => {
    const dice = useDiceStore();
    vi.spyOn(Math, 'random').mockReturnValue(0.4); // round(0.4*5+1) = 3
    dice.roll();
    expect(dice.items.length).toBe(2);
    expect(dice.items.every((v) => v >= 1 && v <= 6)).toBe(true);
    vi.restoreAllMocks();
  });

  it('reset() очищает items и used', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.used = [3];
    dice.reset();
    expect(dice.items).toEqual([]);
    expect(dice.used).toEqual([]);
  });

  it('sum — сумма двух костей', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    expect(dice.sum).toBe(7);
  });

  it('isEquals — true при дубле', () => {
    const dice = useDiceStore();
    dice.items = [3, 3];
    expect(dice.isEquals).toBe(true);
    dice.items = [3, 4];
    expect(dice.isEquals).toBe(false);
  });

  it('isEquals — false при пустом массиве', () => {
    const dice = useDiceStore();
    expect(dice.isEquals).toBe(false);
  });

  it('hasStart — true при сумме костей = 5 (выход с базы)', () => {
    const dice = useDiceStore();
    dice.items = [2, 3];
    expect(dice.hasStart).toBe(true);
    dice.items = [3, 4];
    expect(dice.hasStart).toBe(false);
  });

  it('hasAddon — true при дубле (доп. бросок)', () => {
    const dice = useDiceStore();
    dice.items = [3, 3];
    expect(dice.hasAddon).toBe(true);
    dice.items = [3, 4];
    expect(dice.hasAddon).toBe(false);
  });

  it('hasOut — true при сумме костей = 5 (выход возможен)', () => {
    const dice = useDiceStore();
    dice.items = [2, 3];
    expect(dice.hasOut).toBe(true);
    dice.items = [1, 4];
    expect(dice.hasOut).toBe(true);
    dice.items = [3, 4];
    expect(dice.hasOut).toBe(false);
    dice.items = [5, 1];
    expect(dice.hasOut).toBe(false);
  });

  it('isOut(5) — true', () => {
    const dice = useDiceStore();
    expect(dice.isOut(5)).toBe(true);
  });

  it('isOut(4) — false', () => {
    const dice = useDiceStore();
    expect(dice.isOut(4)).toBe(false);
  });

  it('use(item) — добавляет в used', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.use(3);
    expect(dice.used).toEqual([3]);
  });

  it('use(item) — не добавляет если нет в unused', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.use(5);
    expect(dice.used).toEqual([]);
  });

  it('use(unusedSum) — использует сумму', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.use(7);
    expect(dice.used).toEqual([3, 4]);
  });

  it('unused — разница items и used', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.use(3);
    expect(dice.unused).toEqual([4]);
  });

  it('isAllUsed — undefined если used пуст', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    expect(dice.isAllUsed).toBeUndefined();
  });

  it('isAllUsed — true если все использованы', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.use(3);
    dice.use(4);
    expect(dice.isAllUsed).toBe(true);
  });

  it('isAllUsed — false если не все', () => {
    const dice = useDiceStore();
    dice.items = [3, 4];
    dice.use(3);
    expect(dice.isAllUsed).toBe(false);
  });

  it('rolled — false после reset', () => {
    const dice = useDiceStore();
    dice.reset();
    expect(dice.rolled).toBe(false);
  });

  it('rolled — true после roll', () => {
    const dice = useDiceStore();
    vi.spyOn(Math, 'random').mockReturnValue(0.4);
    dice.roll();
    expect(dice.rolled).toBe(true);
    vi.restoreAllMocks();
  });

  it('Крайний случай: diffByCount удаляет одно вхождение', () => {
    const dice = useDiceStore();
    dice.items = [3, 3, 4];
    dice.used = [3];
    expect(dice.unused).toEqual([3, 4]);
  });

  it('Крайний случай: diffByCount удаляет несколько вхождений', () => {
    const dice = useDiceStore();
    dice.items = [3, 3, 4];
    dice.used = [3, 3];
    expect(dice.unused).toEqual([4]);
  });

  it('Крайний случай: diffByCount пустой результат', () => {
    const dice = useDiceStore();
    dice.items = [3, 3];
    dice.used = [3, 3];
    expect(dice.unused).toEqual([]);
  });

  it('Крайний случай: use() с одинаковыми значениями на костях', () => {
    const dice = useDiceStore();
    dice.items = [3, 3];
    dice.use(3);
    expect(dice.used).toEqual([3]);
    expect(dice.unused).toEqual([3]);
  });
});
