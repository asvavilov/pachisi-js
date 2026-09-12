import type { Board } from './board';
import type { Chip } from './chip';
import type { PlayerData } from './player';

/**
 * ячейка доски
 */
export class Cell {
  board: Board;
  safe: PlayerData | boolean | undefined;
  io: Cell | undefined;
  size: number;
  places: (Chip | null)[];
  constructor(
    board: Board,
    safe: PlayerData | boolean | undefined,
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
     * места в ячейке (реактивность обеспечивается stores-обёрткой доски)
     */
    this.places = new Array<Chip | null>(this.size).fill(null);
  }
}
