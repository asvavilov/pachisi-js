import type { Cell } from './cell';
import type { Player, PlayerData } from './player';

let chipIdCounter = 0;

/**
 * фишка
 */
export class Chip {
  player: PlayerData;
  cell: Cell;
  readonly id: number;
  finished: boolean;

  constructor(player: Player, cell: Cell, placeIndex: number) {
    /**
     * связь с игроком
     */
    this.player = player as PlayerData;
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
  }

  /**
   * Механический переход фишки к ячейке (без проверки правил игры —
   * их выполняет вызывающий код: `stores/game.ts`).
   * Возвращает `false` и не меняет положение, если в целевой ячейке нет места.
   *
   * Обычный метод (не стрелка): при вызове на reactive-прокси `this` — это прокси,
   * поэтому изменения ячеек отслеживаются Vue без импорта реактивности в `lib/`.
   */
  go(to_cell: Cell): boolean {
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

    // Освобождаем текущее место. Фишка уникальна по `id`, поэтому поиск по id
    // работает и когда ячейка обёрнута в reactive-прокси (без `toRaw`).
    const idx = this.cell.places.findIndex((p) => p !== null && p.id === this.id);
    if (idx >= 0) {
      this.cell.places[idx] = null;
    }

    this.cell = to_cell;
    this.cell.places[targetIndex] = this;
    return true;
  }

  /**
   * Пометить фишку как финишировавшую (достигла конечной ячейки)
   */
  finish() {
    this.finished = true;
    // Оставляем фишку на текущей ячейке, но больше не может двигаться
  }
}
