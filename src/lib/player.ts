import { Board, BoardType } from './board';
import { Chip } from './chip';

export type PlayerIndex = 0 | 1 | 2 | 3;

export enum PlayerColor {
  yellow = 'yellow',
  blue = 'blue',
  red = 'red',
  green = 'green',
}

/**
 * игрок
 */
export class Player {
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
    this.i_end = this.q * ind + 63 + this.startOffset;
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
}
