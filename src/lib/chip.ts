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
  go: (to_cell: Cell) => boolean;
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
     * Механический переход фишки к ячейке (без проверки правил игры —
     * их выполняет вызывающий код: `stores/game.ts`).
     * Возвращает `false` и не меняет положение, если в целевой ячейке нет места.
     */
    this.go = (to_cell) => {
      // Перенос в ту же ячейку — ничего не делаем.
      if (to_cell === this.cell) {
        return true;
      }

      // Сначала проверяем вместимость целевой ячейки, чтобы не удалять фишку
      // из текущей ячейки при неудаче (иначе фишка «повиснет» без места).
      const targetIndex = to_cell.places.findIndex((p) => p === null);
      if (targetIndex === -1) {
        console.warn(`[фишка ${this.id}] Нет свободных мест в ячейке!`);
        return false;
      }

      // Освобождаем текущее место (с резервным поиском по id).
      const idx = this.cell.places.findIndex((p) => toRaw(p) === this);
      if (idx >= 0) {
        this.cell.places[idx] = null;
      } else {
        for (let i = 0; i < this.cell.places.length; i++) {
          const place = this.cell.places[i];
          if (place && (toRaw(place) === this || place.id === this.id)) {
            this.cell.places[i] = null;
            break;
          }
        }
      }

      this.cell = to_cell;
      this.cell.places[targetIndex] = this;
      return true;
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
