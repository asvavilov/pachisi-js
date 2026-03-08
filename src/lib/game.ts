import { Player } from './player';
import type { Chip } from './chip';
import type { Cell } from './cell';

/**
 * Состояние игры
 */
export class Game {
  players: Player[];
  currentPlayerIndex: number = 0;
  diceValues: number[] = [];
  hasRolled: boolean = false;

  constructor(players: Player[]) {
    this.players = players;
  }

  /**
   * Бросок костей
   */
  rollDice(): number[] {
    this.diceValues = Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1);
    this.hasRolled = true;
    console.log(`Игрок ${this.currentPlayer.color} бросил кости: ${this.diceValues.join(' и ')}`);
    return this.diceValues;
  }

  /**
   * Получить текущего игрока
   */
  get currentPlayer(): Player {
    return this.players[this.currentPlayerIndex]!;
  }

  /**
   * Получить сумму костей
   */
  get diceSum(): number {
    return this.diceValues.reduce((a, b) => a + b, 0);
  }

  /**
   * Переход хода к следующему игроку
   */
  nextTurn() {
    console.log('---');
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.diceValues = [];
    this.hasRolled = false;
  }

  /**
   * Получить список фишек, которые могут быть перемещены на текущий бросок
   */
  getMovableChips(): Chip[] {
    if (!this.hasRolled) return [];
    const player = this.currentPlayer;
    const movable: Chip[] = [];

    for (const chip of player.chips) {
      if (this.canMoveChip(chip, this.diceSum)) {
        movable.push(chip);
      }
    }

    return movable;
  }

  /**
   * Проверка, может ли фишка быть перемещена на заданное количество шагов
   */
  canMoveChip(chip: Chip, steps: number): boolean {
    // Если фишка ещё не на доске (в стартовой ячейке)
    if (!chip.cell) return false;

    const currentCell = chip.cell;

    // Находим индекс текущей ячейки на соответствующей доске
    // Для упрощения предположим, что фишка находится на главной доске (board index 1)
    // или на стартовой/конечной доске.
    // Реализуем простой поиск следующей ячейки через steps шагов.
    // Это временная реализация, позже нужно заменить на правильную логику.
    const targetCell = this.findTargetCell(currentCell, steps);
    return targetCell !== null;
  }

  /**
   * Найти целевую ячейку после steps шагов от текущей ячейки
   */
  findTargetCell(from: Cell, steps: number): Cell | null {
    // Если фишка на стартовой или конечной доске, переводим на главную доску через переход (io)
    let currentBoard = from.board;
    let currentCell = from;
    // Если это не главная доска (index !== 1) и есть переход на главную, используем его без затраты шагов
    if (currentBoard.ind !== 1 && currentCell.io) {
      currentCell = currentCell.io;
      currentBoard = currentCell.board;
    }
    // Теперь currentCell находится на главной доске (или осталась на главной, если уже была)
    if (currentBoard.ind !== 1) {
      // Не удалось перейти на главную доску - движение невозможно
      return null;
    }
    // Находим индекс ячейки на главной доске
    const idx = currentBoard.cells.indexOf(currentCell);
    if (idx === -1) {
      return null;
    }
    // Вычисляем новый индекс с учётом шагов (движение только вперёд)
    const newIdx = (idx + steps) % currentBoard.cells.length;
    const targetCell = currentBoard.cells[newIdx];
    if (!targetCell) {
      return null;
    }
    return targetCell;
  }

  /**
   * Проверка, является ли ячейка безопасной (защищает от захвата) для заданного игрока
   */
  isSafeCell(cell: Cell, forPlayer?: Player): boolean {
    const safe = cell.safe;
    if (safe === true) {
      return true; // общая безопасная ячейка
    }
    if (safe instanceof Player) {
      // стартовая ячейка конкретного игрока
      return safe === forPlayer;
    }
    return false; // не безопасна
  }

  /**
   * Переместить фишку на steps шагов
   */
  moveChip(chip: Chip, steps: number): boolean {
    if (!this.canMoveChip(chip, steps)) {
      return false;
    }
    const targetCell = this.findTargetCell(chip.cell!, steps);
    if (!targetCell) {
      return false;
    }

    // Проверка на захват: если в целевой ячейке есть фишка другого игрока и ячейка не безопасна для текущей фишки
    const otherChips = targetCell.places.filter((p) => p && p.player !== chip.player);
    if (otherChips.length > 0) {
      const isSafe = this.isSafeCell(targetCell, chip.player);
      if (!isSafe) {
        // Отправляем все чужие фишки на старт
        for (const otherChip of otherChips) {
          if (otherChip) {
            console.log(`Захват! Фишка игрока ${otherChip.player.color} отправлена на старт.`);
            this.sendToStart(otherChip);
          }
        }
      }
    }

    // Выполняем перемещение
    console.log(`Игрок ${chip.player.color} переместил фишку на ${steps} шагов.`);
    chip.go(targetCell);
    return true;
  }

  /**
   * Отправить фишку на стартовую ячейку её игрока
   */
  sendToStart(chip: Chip) {
    const player = chip.player;
    const startBoard = player.boards[0];
    if (startBoard && startBoard.cells.length > 0) {
      const startCell = startBoard.cells[0];
      if (startCell) {
        chip.go(startCell);
      }
    }
  }
}
