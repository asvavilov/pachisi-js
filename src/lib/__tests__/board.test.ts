import { describe, it, expect } from 'vitest';
import { Board, BoardType } from 'src/lib/board';
import { Cell } from 'src/lib/cell';

describe('Board', () => {
  it('BoardType содержит base, main, home', () => {
    expect(BoardType.base).toBe('base');
    expect(BoardType.main).toBe('main');
    expect(BoardType.home).toBe('home');
  });

  it('Board создаёт ячейки правильной длины (main=68, base=1, home=8)', () => {
    const main = new Board(BoardType.main, undefined, 68, undefined, undefined);
    const base = new Board(BoardType.base, undefined, 1, undefined, undefined);
    const home = new Board(BoardType.home, undefined, 8, undefined, undefined);
    expect(main.cells.length).toBe(68);
    expect(base.cells.length).toBe(1);
    expect(home.cells.length).toBe(8);
  });

  it('Board.cells содержит Cell экземпляры', () => {
    const board = new Board(BoardType.main, undefined, 5, undefined, undefined);
    expect(board.cells.every((c) => c instanceof Cell)).toBe(true);
  });

  it('Board с safes создаёт безопасные ячейки', () => {
    const board = new Board(BoardType.main, undefined, 5, { 2: true }, undefined);
    expect(board.cells[2]!.safe).toBe(true);
    expect(board.cells[0]!.safe).toBe(false);
  });

  it('Board с ios создаёт переходные ячейки', () => {
    const other = new Board(BoardType.home, undefined, 1, undefined, undefined);
    const board = new Board(BoardType.main, undefined, 5, undefined, { 3: other.cells[0]! });
    expect(board.cells[3]!.io).toBe(other.cells[0]);
    expect(board.cells[0]!.io).toBeUndefined();
  });

  it('Board с sizes создаёт ячейки с размерами', () => {
    const board = new Board(BoardType.main, undefined, 3, undefined, undefined, { 1: 4 });
    expect(board.cells[1]!.size).toBe(4);
  });

  it('Board без safes — все ячейки не безопасны', () => {
    const board = new Board(BoardType.main, undefined, 3, undefined, undefined);
    expect(board.cells.every((c) => c.safe === false)).toBe(true);
  });

  it('Board без ios — все io === undefined', () => {
    const board = new Board(BoardType.main, undefined, 3, undefined, undefined);
    expect(board.cells.every((c) => c.io === undefined)).toBe(true);
  });

  it('Board без sizes — размер по умолчанию 2', () => {
    const board = new Board(BoardType.main, undefined, 3, undefined, undefined);
    expect(board.cells.every((c) => c.size === 2)).toBe(true);
  });
});
