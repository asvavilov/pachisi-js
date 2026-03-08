import type { Cell } from './cell';
import type { Player } from './player';

/**
 * фишка
 */
export class Chip {
  player: Player;
  cell: Cell | null;
  go: (to_cell: Cell) => void;
  constructor(player: Player) {
    /**
     * связь с игроком
     */
    this.player = player;
    /**
     * связь с ячейкой
     */
    this.cell = null;
    /**
     * переход фишки к ячейке
     * FIXME проверки на возможность перехода должны осуществляться ранее
     */
    this.go = (to_cell) => {
      if (this.cell) {
        for (let i = 0; i < this.cell.places.length; i++) {
          if (this.cell.places[i] == this) {
            this.cell.places[i] = null;
            break;
          }
        }
      }
      this.cell = to_cell;
      for (let i = 0; i < this.cell.places.length; i++) {
        if (!this.cell.places[i]) {
          this.cell.places[i] = this;
          break;
        }
      }
    };
  }
}
