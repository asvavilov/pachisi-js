import { Board, BoardType } from './board';
import { Chip } from './chip';
import type { Cell } from './cell';

export type PlayerIndex = 0 | 1 | 2 | 3;

export enum PlayerColor {
  yellow = 'yellow',
  blue = 'blue',
  red = 'red',
  green = 'green',
}

/**
 * Данные игрока (без методов) — используется в типах для совместимости с Vue reactivity
 */
export interface PlayerData {
  ind: PlayerIndex;
  color: string;
  ai: boolean;
}

/**
 * игрок
 */
export class Player implements PlayerData {
  ind: PlayerIndex;
  startOffset: number = 4;
  i_begin: number;
  /**
   * расстояние между пользователями
   */
  q: number = 17;
  i_end: number;
  ai: boolean;
  color: string;
  chips: Chip[];
  baseBoard: Board;
  homeBoard: Board;
  constructor(ind: PlayerIndex, ai: boolean, color: string) {
    /**
     * глобальный номер игрока
     */
    this.ind = ind;
    /**
     * номер стартовой для текущего игрока ячейки на общей доске
     */
    this.i_begin = this.q * ind + this.startOffset;
    /**
     * номер конечной для текущего игрока ячейки на общей доске
     */
    this.i_end = (this.q * ind + 63 + this.startOffset) % 68;
    /**
     * компьютер или человек (Artifical Intelligent)
     */
    this.ai = ai;
    /**
     * цвет игрока
     */
    this.color = color;
    /**
     * доски игрока
     */
    this.baseBoard = new Board(BoardType.base, this, 1, undefined, undefined, { 0: 4 });
    this.homeBoard = new Board(BoardType.home, this, 8, undefined, undefined, { 7: 4 });

    /**
     * фишки игрока
     */
    this.chips = [
      new Chip(this, this.baseBoard.cells[0]!, 0),
      new Chip(this, this.baseBoard.cells[0]!, 1),
      new Chip(this, this.baseBoard.cells[0]!, 2),
      new Chip(this, this.baseBoard.cells[0]!, 3),
    ];
  }

  /**
   * Найти фишку, ближайшую к финишу.
   * Приоритет: финишная дорожка > общая дорожка > база.
   * На финишной дорожке — чем дальше, тем ближе.
   * На общей дорожке — чем ближе к точке входа на финиш, тем ближе.
   */
  getClosestToFinishChip(): Chip | null {
    let closest: Chip | null = null;
    let bestScore = -1;

    for (const chip of this.chips) {
      if (chip.finished) continue;
      if (!chip.cell) continue;

      const score = this.getChipProximityScore(chip.cell);
      if (score > bestScore) {
        bestScore = score;
        closest = chip;
      }
    }

    return closest;
  }

  /**
   * Вычислить "близость" фишки к финишу.
   * Чем больше score, тем ближе к финишу.
   */
  getChipProximityScore(cell: Cell): number {
    if (cell.board.type === BoardType.home) {
      // На финишной дорожке — индекс ячейки (0-7)
      const idx = cell.board.cells.indexOf(cell);
      return 1000 + idx;
    }

    if (cell.board.type === BoardType.base) {
      // На базе — самая далёкая позиция
      return 0;
    }

    // На общей дорожке — расстояние до точки входа на финишную дорожку
    const entranceCell = this.homeBoard.cells[0]?.io;
    if (!entranceCell || entranceCell.board.type !== BoardType.main) {
      return 0;
    }

    const mainBoard = entranceCell.board;
    const totalCells = mainBoard.cells.length;
    const currentIdx = mainBoard.cells.indexOf(cell);
    const entranceIdx = mainBoard.cells.indexOf(entranceCell);

    // Расстояние по часовой стрелке до точки входа
    const distance = (entranceIdx - currentIdx + totalCells) % totalCells;

    // Чем меньше расстояние, тем ближе к финишу
    return 100 + (totalCells - distance);
  }
}
