import { Board } from './board';
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
  boards: (Board | null)[];
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
     * фишки игрока
     */
    this.chips = [new Chip(this), new Chip(this), new Chip(this), new Chip(this)];
    /**
     * доски игрока
     */
    this.boards = [
      new Board(0, this, 1, undefined, undefined, { 0: 4 }),
      null,
      new Board(2, this, 7, undefined, undefined, { 7: 4 }),
    ];
    // расставляем фишки
    this.chips.forEach((ch) => {
      ch.go(this.boards[0]!.cells[0]!);
    });
  }
}
