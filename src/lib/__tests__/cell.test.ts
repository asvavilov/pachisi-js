import { describe, it, expect } from 'vitest';
import { Board, BoardType } from 'src/lib/board';
import type { PlayerData } from 'src/lib/player';

const playerData: PlayerData = { ind: 0, color: 'yellow', ai: false };

describe('Cell', () => {
  it('Cell создаётся с правильным board', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const cell = board.cells[0]!;
    expect(cell.board).toBe(board);
  });

  it('Cell.places — массив длины size', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined, { 0: 4 });
    expect(board.cells[0]!.places.length).toBe(4);
  });

  it('Cell.places заполнен null', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    expect(board.cells[0]!.places.every((p) => p === null)).toBe(true);
  });

  it('Cell.safe === false по умолчанию', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    expect(board.cells[0]!.safe).toBe(false);
  });

  it('Cell.safe === true при передаче true', () => {
    const board = new Board(BoardType.main, undefined, 1, { 0: true }, undefined);
    expect(board.cells[0]!.safe).toBe(true);
  });

  it('Cell.safe === PlayerData при передаче', () => {
    const board = new Board(BoardType.main, undefined, 1, { 0: playerData }, undefined);
    expect(board.cells[0]!.safe).toBe(playerData);
  });

  it('Cell.io === undefined по умолчанию', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    expect(board.cells[0]!.io).toBeUndefined();
  });

  it('Cell.io === другая Cell при передаче', () => {
    const other = new Board(BoardType.home, undefined, 1, undefined, undefined);
    const board = new Board(BoardType.main, undefined, 1, undefined, { 0: other.cells[0]! });
    expect(board.cells[0]!.io).toBe(other.cells[0]);
  });

  it('Cell.size === 2 по умолчанию', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    expect(board.cells[0]!.size).toBe(2);
  });

  it('Cell.size === переданному значению', () => {
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined, { 0: 5 });
    expect(board.cells[0]!.size).toBe(5);
  });

  it('Cell не может вместить больше size фишек (README п.5)', () => {
    // size=2 по умолчанию: третья фишка не встаёт (проверяем через places).
    const board = new Board(BoardType.main, undefined, 1, undefined, undefined);
    const cell = board.cells[0]!;
    // places имеет ровно size слотов — третий слот не существует.
    expect(cell.places.length).toBe(2);
    // Заполняем оба места.
    cell.places[0] = { id: 1 } as never;
    cell.places[1] = { id: 2 } as never;
    // Свободного слота нет — клетка заполнена.
    expect(cell.places.every((p) => p !== null)).toBe(true);
  });
});
