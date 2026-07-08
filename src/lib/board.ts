import { Cell } from './cell';
import type { PlayerData } from './player';

export enum BoardType {
  base = 'base',
  main = 'main',
  home = 'home',
}

/**
 * доска
 */
export class Board {
  type: BoardType;
  player: PlayerData | undefined;
  cells: Cell[];

  constructor(
    type: BoardType,
    player: PlayerData | undefined,
    len: number,
    safes: Record<number, PlayerData | boolean> | undefined,
    ios: Record<number, Cell> | undefined,
    sizes?: Record<number, number>,
  ) {
    /**
     * глобальный индекс доски
     */
    this.type = type;
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
