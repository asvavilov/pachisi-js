import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayerStore } from 'src/stores/player';
import { BoardType } from 'src/lib/board';

describe('player store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('players.length === 4', () => {
    const store = usePlayerStore();
    expect(store.players.length).toBe(4);
  });

  it('players[0].ai === false (жёлтый — человек)', () => {
    const store = usePlayerStore();
    expect(store.players[0]!.ai).toBe(false);
  });

  it('players[1-3].ai === true (остальные — ИИ)', () => {
    const store = usePlayerStore();
    expect(store.players[1]!.ai).toBe(true);
    expect(store.players[2]!.ai).toBe(true);
    expect(store.players[3]!.ai).toBe(true);
  });

  it('currentIndex === undefined до init()', () => {
    const store = usePlayerStore();
    expect(store.currentIndex).toBeUndefined();
  });

  it('init() устанавливает currentIndex', () => {
    const store = usePlayerStore();
    store.init();
    expect(store.currentIndex).toBe(0);
  });

  it('init(2) устанавливает currentIndex=2', () => {
    const store = usePlayerStore();
    store.init(2);
    expect(store.currentIndex).toBe(2);
  });

  it('next() переключает на следующего (0→1→2→3→0)', () => {
    const store = usePlayerStore();
    store.init();
    store.next();
    expect(store.currentIndex).toBe(1);
    store.next();
    expect(store.currentIndex).toBe(2);
    store.next();
    expect(store.currentIndex).toBe(3);
  });

  it('current — текущий игрок', () => {
    const store = usePlayerStore();
    store.init(1);
    expect(store.current).toBe(store.players[1]);
  });

  it('current — undefined если не инициализирован', () => {
    const store = usePlayerStore();
    expect(store.current).toBeUndefined();
  });

  it('allChipsOnBase — true если все фишки на базе', () => {
    const store = usePlayerStore();
    store.init();
    expect(store.allChipsOnBase).toBe(true);
  });

  it('allChipsOnBase — false если не все', () => {
    const store = usePlayerStore();
    store.init();
    store.players[0]!.chips[0]!.go(store.players[0]!.homeBoard.cells[0]!);
    expect(store.allChipsOnBase).toBe(false);
  });

  it('allChipsOnBase — undefined если не инициализирован', () => {
    const store = usePlayerStore();
    expect(store.allChipsOnBase).toBeUndefined();
  });

  it('checkWinner() — false если не все фишки finished', () => {
    const store = usePlayerStore();
    store.init();
    expect(store.checkWinner(store.players[0]!)).toBe(false);
  });

  it('checkWinner() — возвращает player если все finished', () => {
    const store = usePlayerStore();
    store.init();
    store.players[0]!.chips.forEach((c) => c.finish());
    expect(store.checkWinner(store.players[0]!)).toBe(store.players[0]);
  });

  it('checkWinner() — true если уже в winners', () => {
    const store = usePlayerStore();
    store.init();
    store.players[0]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[0]!);
    expect(store.checkWinner(store.players[0]!)).toBe(true);
  });

  it('winners — пустой массив после init()', () => {
    const store = usePlayerStore();
    store.winners = [store.players[0]!];
    store.init();
    expect(store.winners).toEqual([]);
  });

  it('Крайний случай: next() при currentIndex=3 → 0', () => {
    const store = usePlayerStore();
    store.init(3);
    store.next();
    expect(store.currentIndex).toBe(0);
  });

  it('Крайний случай: checkWinner() добавляет в winners', () => {
    const store = usePlayerStore();
    store.init();
    store.players[2]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[2]!);
    expect(store.winners).toContain(store.players[2]);
  });

  it('allChipsOnBase проверяет тип доски базы', () => {
    const store = usePlayerStore();
    store.init();
    expect(store.players[0]!.chips.every((c) => c.cell?.board.type === BoardType.base)).toBe(true);
  });
});