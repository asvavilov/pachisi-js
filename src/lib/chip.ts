import type { Cell } from './cell';
import type { Player, PlayerData } from './player';
import { toRaw } from 'vue';

let chipIdCounter = 0;

/**
 * фишка
 */
export class Chip {
  player: PlayerData;
  cell: Cell;
  go: (to_cell: Cell) => void;
  readonly id: number;
  finished: boolean;

  constructor(player: Player, cell: Cell, placeIndex: number) {
    /**
     * связь с игроком
     */
    this.player = toRaw(player) as PlayerData;
    /**
     * связь с ячейкой
     */
    this.cell = cell;
    this.cell.places[placeIndex] = this;
    /**
     * уникальный идентификатор для отладки
     */
    this.id = ++chipIdCounter;
    /**
     * финишировала ли фишка (достигла последней ячейки финишной дорожки)
     */
    this.finished = false;

    /**
     * переход фишки к ячейке
     * FIXME проверки на возможность перехода должны осуществляться ранее
     */
    this.go = (to_cell) => {
      const idx = this.cell.places.findIndex((p) => toRaw(p) === this);
      if (idx >= 0) {
        this.cell.places[idx] = null;
      } else {
        // Резервный поиск по id (на случай, если toRaw не сработал)
        for (let i = 0; i < this.cell.places.length; i++) {
          const place = this.cell.places[i];
          if (place && (toRaw(place) === this || place.id === this.id)) {
            this.cell.places[i] = null;
            break;
          }
        }
      }
      this.cell = to_cell;
      let added = false;
      for (let i = 0; i < this.cell.places.length; i++) {
        if (!this.cell.places[i]) {
          this.cell.places[i] = this;
          added = true;
          break;
        }
      }
      if (!added) {
        console.warn(`[фишка ${this.id}] Нет свободных мест в ячейке!`);
      }
    };
  }

  /**
   * Пометить фишку как финишировавшую (достигла конечной ячейки)
   */
  finish() {
    this.finished = true;
    // Оставляем фишку на текущей ячейке, но больше не может двигаться
  }
}
