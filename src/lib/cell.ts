import type { Board } from './board';
import type { Chip } from './chip';
import type { Player } from './player';

/**
 * ячейка доски
 */
export class Cell {
  board: Board;
  safe: Player | boolean | undefined;
  io: Cell | undefined;
  size: number | undefined;
  places: (Chip | null)[];
  constructor(
    board: Board,
    safe: Player | boolean | undefined,
    io: Cell | undefined,
    size: number | undefined,
  ) {
    /**
     * связь с доской
     */
    this.board = board;
    /**
     * флаг островка безопасности
     */
    this.safe = safe || false;
    /**
     * связанная ячейка перехода (input/output)
     */
    this.io = io;
    /**
     * кол-во мест в ячейке
     */
    this.size = size || 2;
    /**
     * места в ячейке
     */
    this.places = [];
    for (let i = 0; i < this.size; i++) {
      this.places.push(null);
    }
  }
}
