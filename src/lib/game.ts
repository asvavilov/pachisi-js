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
  usedDice: boolean[] = [false, false]; // отслеживание использованных кубиков

  constructor(players: Player[]) {
    this.players = players;
  }

  /**
   * Бросок костей
   */
  rollDice(): number[] {
    this.diceValues = Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1);
    this.hasRolled = true;
    this.usedDice = [false, false];
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
   * Получить доступные варианты шагов (неиспользованные кубики и сумму)
   */
  getAvailableSteps(): number[] {
    const steps: number[] = [];
    if (this.diceValues.length === 0) return steps;
    if (this.diceValues.length >= 1 && !this.usedDice[0]) steps.push(this.diceValues[0]!);
    if (this.diceValues.length >= 2 && !this.usedDice[1]) steps.push(this.diceValues[1]!);
    // Если оба кубика не использованы, можно предложить сумму
    if (!this.usedDice[0] && !this.usedDice[1]) {
      steps.push(this.diceSum);
    }
    return steps;
  }

  /**
   * Использовать кубик по индексу (0 или 1) или сумму (индекс -1)
   */
  useDie(index: number): boolean {
    if (index === -1) {
      // использование суммы означает использование обоих кубиков
      if (this.usedDice[0] || this.usedDice[1]) return false;
      this.usedDice[0] = true;
      this.usedDice[1] = true;
      return true;
    }
    if (index < 0 || index >= this.diceValues.length) return false;
    if (this.usedDice[index]) return false;
    this.usedDice[index] = true;
    return true;
  }

  /**
   * Проверка, все ли кубики использованы
   */
  get allDiceUsed(): boolean {
    return this.usedDice.every((used) => used);
  }

  /**
   * Переход хода к следующему игроку
   */
  nextTurn() {
    console.log('---');
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.diceValues = [];
    this.hasRolled = false;
    this.usedDice = [false, false];
  }

  /**
   * Получить список фишек, которые могут быть перемещены на заданное количество шагов
   */
  getMovableChipsForSteps(steps: number): Chip[] {
    if (!this.hasRolled) return [];
    const player = this.currentPlayer;
    const movable: Chip[] = [];

    for (const chip of player.chips) {
      if (this.canMoveChip(chip, steps)) {
        movable.push(chip);
      }
    }

    return movable;
  }

  /**
   * Получить список фишек, которые могут быть перемещены на любой из доступных шагов
   */
  getMovableChips(): Chip[] {
    const steps = this.getAvailableSteps();
    const movable: Chip[] = [];
    for (const step of steps) {
      movable.push(...this.getMovableChipsForSteps(step));
    }
    // Убрать дубликаты (одна фишка может быть доступна для нескольких шагов)
    return Array.from(new Set(movable));
  }

  /**
   * Получить возможные шаги для конкретной фишки
   */
  getPossibleStepsForChip(chip: Chip): number[] {
    return this.getAvailableSteps().filter((step) => this.canMoveChip(chip, step));
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
   * Переместить фишку на steps шагов с использованием соответствующего кубика
   * @param chip Фишка
   * @param steps Количество шагов (должно соответствовать одному из доступных шагов)
   * @param dieIndex Индекс кубика (0,1) или -1 для суммы
   */
  moveChip(chip: Chip, steps: number, dieIndex: number): boolean {
    if (!this.canMoveChip(chip, steps)) {
      return false;
    }
    // Проверяем, что выбранный шаг соответствует доступному кубику
    const availableSteps = this.getAvailableSteps();
    if (!availableSteps.includes(steps)) {
      return false;
    }
    // Используем кубик
    if (!this.useDie(dieIndex)) {
      return false;
    }
    const targetCell = this.findTargetCell(chip.cell!, steps);
    if (!targetCell) {
      // Откат использования кубика? Пока просто вернём false, но кубик уже использован
      // Для простоты не будем делать откат, т.к. это маловероятно
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
