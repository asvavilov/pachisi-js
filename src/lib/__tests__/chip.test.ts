import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toRaw } from 'vue';
import { Board, BoardType } from 'src/lib/board';
import type { Cell } from 'src/lib/cell';
import { Chip } from 'src/lib/chip';
import { Player, PlayerColor } from 'src/lib/player';

// Cell.places — реактивный массив Vue: при доступе элементы возвращаются
// как reactive-прокси. Поэтому для сравнения по ссылке используем toRaw.
const rawAt = (cell: Cell, i: number) => toRaw(cell.places[i]);

describe('Chip', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player(0, false, PlayerColor.yellow);
  });

  it('создаётся с уникальным id', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chipA = new Chip(player, board.cells[0]!, 0);
    const chipB = new Chip(player, board.cells[0]!, 1);
    expect(chipB.id).toBe(chipA.id + 1);
  });

  it('Chip.player === PlayerData', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chip = new Chip(player, board.cells[0]!, 0);
    expect(chip.player.ind).toBe(player.ind);
    expect(chip.player.color).toBe(player.color);
  });

  it('Chip.cell === переданная ячейка', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const cell = board.cells[0]!;
    const chip = new Chip(player, cell, 0);
    expect(chip.cell).toBe(cell);
  });

  it('Chip.finished === false по умолчанию', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chip = new Chip(player, board.cells[0]!, 0);
    expect(chip.finished).toBe(false);
  });

  it('Chip занимает место в cell.places[placeIndex]', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chip = new Chip(player, board.cells[0]!, 2);
    expect(rawAt(board.cells[0]!, 2)).toBe(chip);
  });

  it('go() перемещает фишку в другую ячейку (старая освобождается, новая занимается)', () => {
    const boardA = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const boardB = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const chip = new Chip(player, boardA.cells[0]!, 0);
    chip.go(boardB.cells[0]!);
    expect(boardA.cells[0]!.places[0]).toBeNull();
    expect(chip.cell).toBe(boardB.cells[0]);
    expect(rawAt(boardB.cells[0]!, 0)).toBe(chip);
  });

  it('go() находит свободное место, если первое занято', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const cell = board.cells[0]!;
    // Занимаем place[0] другой фишкой.
    const blocker = new Chip(player, cell, 0);
    expect(rawAt(cell, 0)).toBe(blocker);
    // Новая фишка на той же клетке должна попасть в place[1].
    const chip = new Chip(
      player,
      new Board(BoardType.base, player, 1, undefined, undefined).cells[0]!,
      0,
    );
    chip.go(cell);
    expect(rawAt(cell, 1)).toBe(chip);
  });

  it('finish() устанавливает finished=true', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chip = new Chip(player, board.cells[0]!, 0);
    chip.finish();
    expect(chip.finished).toBe(true);
  });

  it('finish() не удаляет фишку из ячейки', () => {
    const board = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const cell = board.cells[0]!;
    const chip = new Chip(player, cell, 0);
    chip.finish();
    expect(rawAt(cell, 0)).toBe(chip);
  });

  it('go() когда нет свободных мест — console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const cell = board.cells[0]!; // size=2
    // Заполняем оба места.
    new Chip(player, cell, 0);
    new Chip(player, cell, 1);
    // Третья фишка с другой клетки пытается перейти на заполненную.
    const other = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chip = new Chip(player, other.cells[0]!, 0);
    chip.go(cell);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('go() на клетку с двумя фишками не срабатывает (вместимость 2, README п.5)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const cell = board.cells[0]!; // size=2
    const c1 = new Chip(player, cell, 0);
    const c2 = new Chip(player, cell, 1);
    const other = new Board(BoardType.base, player, 1, undefined, undefined, { 0: 4 });
    const chip = new Chip(player, other.cells[0]!, 0);
    chip.go(cell);
    // Фишка не добавлена в places (оба места заняты прежними фишками).
    expect(rawAt(cell, 0)).toBe(c1);
    expect(rawAt(cell, 1)).toBe(c2);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('go() когда фишки нет в places (idx<0) — всё равно переносит и добавляет', () => {
    const playerLocal = new Player(0, false, PlayerColor.yellow);
    const boardA = new Board(BoardType.base, playerLocal, 1, undefined, undefined, { 0: 4 });
    const boardB = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const chip = new Chip(playerLocal, boardA.cells[0]!, 0);
    // Убираем фишку из places вручную → findIndex вернёт -1 (else-ветка).
    boardA.cells[0]!.places[0] = null;
    chip.go(boardB.cells[0]!);
    expect(chip.cell).toBe(boardB.cells[0]);
    expect(rawAt(boardB.cells[0]!, 0)).toBe(chip);
    // Старая ячейка так и осталась пустой.
    expect(boardA.cells[0]!.places[0]).toBeNull();
  });

  it('go() fallback: находит фишку по id, если toRaw-сравнение не сработало', () => {
    const playerLocal = new Player(0, false, PlayerColor.yellow);
    const boardA = new Board(BoardType.base, playerLocal, 1, undefined, undefined, { 0: 4 });
    const boardB = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const chip = new Chip(playerLocal, boardA.cells[0]!, 0);
    // Симулируем «несовпадение по ссылке»: подменяем место на объект-дубликат с тем же id.
    // Fallback-цикл должен найти фишку по `place.id === this.id` и очистить место.
    const impostor = { id: chip.id };
    boardA.cells[0]!.places[0] = impostor as never;
    chip.go(boardB.cells[0]!);
    expect(boardA.cells[0]!.places[0]).toBeNull();
    expect(chip.cell).toBe(boardB.cells[0]);
    expect(rawAt(boardB.cells[0]!, 0)).toBe(chip);
  });

  it('go() fallback: когда в places есть чужая фишка — она не затирается', () => {
    const playerLocal = new Player(0, false, PlayerColor.yellow);
    const otherPlayer = new Player(1, true, PlayerColor.red);
    const boardA = new Board(BoardType.base, playerLocal, 1, undefined, undefined, { 0: 4 });
    const boardB = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const chip = new Chip(playerLocal, boardA.cells[0]!, 0);
    const stranger = new Chip(otherPlayer, boardA.cells[0]!, 1);
    // Чужая фишка с другим id остаётся на месте после fallback-поиска.
    boardA.cells[0]!.places[0] = null;
    chip.go(boardB.cells[0]!);
    expect(rawAt(boardA.cells[0]!, 1)).toBe(stranger);
    expect(chip.cell).toBe(boardB.cells[0]);
  });
});
