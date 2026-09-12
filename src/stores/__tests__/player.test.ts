import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayerStore } from 'src/stores/player';
import { useBoardStore } from 'src/stores/board';
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

  // ---- README п.14: места и завершение игры ----

  it('next() пропускает игроков, завершивших партию', () => {
    const store = usePlayerStore();
    store.init(0);
    store.players[1]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[1]!); // игрок 1 — winner
    store.next();
    expect(store.currentIndex).toBe(2);
  });

  it('next() возвращается к первому, если победителей несколько', () => {
    const store = usePlayerStore();
    store.init(2);
    store.players[3]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[3]!);
    store.players[0]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[0]!);
    store.next();
    expect(store.currentIndex).toBe(1);
  });

  it('activePlayers не содержит победителей', () => {
    const store = usePlayerStore();
    store.init();
    store.players[0]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[0]!);
    expect(store.activePlayers.map((p) => p.ind)).toEqual([1, 2, 3]);
  });

  it('isGameOver === false до появления победителя', () => {
    const store = usePlayerStore();
    store.init();
    expect(store.isGameOver).toBe(false);
  });

  it('isGameOver === true, если остались только ИИ', () => {
    const store = usePlayerStore();
    store.init();
    store.players[0]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[0]!);
    expect(store.isGameOver).toBe(true);
  });

  it('isGameOver === false, пока играет человек', () => {
    const store = usePlayerStore();
    store.init();
    store.players[1]!.chips.forEach((c) => c.finish());
    store.checkWinner(store.players[1]!);
    expect(store.isGameOver).toBe(false);
  });

  it('isGameOver === true, когда завершили все, кроме одного', () => {
    const store = usePlayerStore();
    store.init();
    for (const idx of [1, 2, 3] as const) {
      store.players[idx]!.chips.forEach((c) => c.finish());
      store.checkWinner(store.players[idx]!);
    }
    expect(store.isGameOver).toBe(true);
  });

  it('places — победители в порядке финиша, затем последний игрок', () => {
    const store = usePlayerStore();
    store.init();
    for (const idx of [2, 0, 3] as const) {
      store.players[idx]!.chips.forEach((c) => c.finish());
      store.checkWinner(store.players[idx]!);
    }
    expect(store.places.map((p) => p.ind)).toEqual([2, 0, 3, 1]);
  });

  it('reset() возвращает фишки на базу, снимает finished и очищает доску', () => {
    const store = usePlayerStore();
    const boardStore = useBoardStore();
    store.init();
    const chip = store.players[0]!.chips[0]!;
    chip.go(boardStore.board.cells[10]!);
    chip.finish();

    store.reset();

    expect(chip.cell).toBe(store.players[0]!.baseBoard.cells[0]);
    expect(chip.finished).toBe(false);
    expect(boardStore.board.cells[10]!.places).toEqual([null, null]);
    expect(store.winners).toEqual([]);
    expect(store.currentIndex).toBeUndefined();
  });

  it('reset() очищает и финишную дорожку', () => {
    const store = usePlayerStore();
    store.init();
    const chip = store.players[2]!.chips[1]!;
    chip.go(store.players[2]!.homeBoard.cells[7]!);
    chip.finish();

    store.reset();

    expect(store.players[2]!.homeBoard.cells[7]!.places).toEqual([null, null, null, null]);
    expect(chip.cell).toBe(store.players[2]!.baseBoard.cells[0]);
  });
});
