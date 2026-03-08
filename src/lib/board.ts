import { Cell } from './cell';
import type { Player } from './player';

/**
 * доска
 */
export class Board {
  ind: number;
  player: Player | undefined;
  cells: Cell[];

  constructor(
    ind: number,
    player: Player | undefined,
    len: number,
    safes: Record<number, Player | boolean> | undefined,
    ios: Record<number, Cell> | undefined,
    sizes?: Record<number, number>,
  ) {
    /**
     * глобальный индекс доски
     */
    this.ind = ind;
    /**
     * связь с игроком, если нужно
     */
    this.player = player;
    /**
     * ячейки доски
     */
    this.cells = [];
    /**
     * безопасные ячейки
     */
    safes = safes || {};
    /**
     * переходные ячейки
     */
    ios = ios || {};
    /**
     * размеры ячеек
     */
    sizes = sizes || {};
    for (let i = 0; i < len; i++) {
      this.cells.push(new Cell(this, safes[i], ios[i], sizes[i]));
    }
  }
}
