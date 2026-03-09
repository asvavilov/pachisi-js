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
  winner: Player | null = null; // победитель игры, если есть
  currentBonusSteps: number[] = []; // бонусные шаги за захват в текущем ходе (10 или 20)

  constructor(players: Player[]) {
    this.players = players;
    // Инициализация бонусных шагов не требуется, так как они привязаны к текущему ходу
  }

  /**
   * Добавить бонусные шаги текущему игроку (только если это текущий игрок)
   */
  addBonus(player: Player, steps: number) {
    if (player !== this.currentPlayer) {
      console.warn(`Попытка добавить бонус не текущему игроку: ${player.color}`);
      return;
    }
    // Добавляем отдельный бонусный шаг (10 или 20) в массив
    this.currentBonusSteps.push(steps);
    console.log(
      `Игрок ${player.color} получил бонус +${steps} шагов. Теперь бонусы: [${this.currentBonusSteps.join(', ')}]`,
    );
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
    // Бонусные шаги (каждый бонус добавляется как отдельный шаг)
    for (const bonus of this.currentBonusSteps) {
      steps.push(bonus);
    }
    return steps;
  }

  /**
   * Использовать кубик по индексу (0 или 1) или сумму (индекс -1)
   */
  useDice(index: number): boolean {
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
    // Сбрасываем бонусы текущего хода
    this.currentBonusSteps = [];
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
    // Если фишка финишировала, не может двигаться
    if (chip.finished) return false;
    // Если фишка ещё не на доске (в стартовой ячейке)
    if (!chip.cell) return false;

    const currentCell = chip.cell;

    // Находим индекс текущей ячейки на соответствующей доске
    // Для упрощения предположим, что фишка находится на главной доске (board index 1)
    // или на стартовой/конечной доске.
    // Реализуем простой поиск следующей ячейки через steps шагов.
    // Это временная реализация, позже нужно заменить на правильную логику.
    const targetCell = this.findTargetCell(currentCell, steps, chip.player);
    return targetCell !== null;
  }

  /**
   * Получить промежуточные ячейки при движении от startCell на steps шагов по главной доске.
   * Возвращает массив ячеек, через которые проходит фишка (исключая startCell, включая targetCell).
   * Если движение происходит по финишной доске или стартовой, возвращает пустой массив.
   */
  private getIntermediateCells(startCell: Cell, steps: number): Cell[] {
    if (startCell.board.ind !== 1) {
      // Не главная доска - нет промежуточных ячеек (движение по финишной или стартовой доске)
      return [];
    }
    const mainBoard = startCell.board;
    const idx = mainBoard.cells.indexOf(startCell);
    if (idx === -1) return [];
    const totalCells = mainBoard.cells.length;
    const cells: Cell[] = [];
    for (let i = 1; i <= steps; i++) {
      const newIdx = (idx + i) % totalCells;
      cells.push(mainBoard.cells[newIdx]!);
    }
    return cells;
  }

  /**
   * Найти целевую ячейку после steps шагов от текущей ячейки
   */
  findTargetCell(from: Cell, steps: number, player?: Player): Cell | null {
    // Если игрок не передан, движение невозможно (но в вызывающем коде player всегда передаётся)
    if (!player) return null;

    const currentCell = from;
    const remainingSteps = steps;

    // 1. Если фишка на стартовой доске (ind === 0)
    if (currentCell.board.ind === 0) {
      // Выход из базы возможен только при steps === 5 и если выходная ячейка свободна
      if (steps !== 5) {
        return null; // нельзя выйти с другими шагами
      }
      if (!currentCell.io) {
        return null; // нет перехода
      }
      // Проверяем, свободна ли выходная ячейка (не занята другой своей фишкой)
      const exitCell = currentCell.io;
      const isExitFree = exitCell.places.every((p) => p === null);
      if (!isExitFree) {
        return null; // ячейка занята
      }
      // Также проверяем, не заблокирована ли ячейка (блок из двух фишек одного цвета)
      if (this.isCellBlocked(exitCell)) {
        return null;
      }
      return exitCell;
    }

    // 2. Если фишка на финишной доске (ind === 2), двигаемся только по ней
    if (currentCell.board.ind === 2) {
      // Финишная доска принадлежит игроку? Проверим
      if (currentCell.board.player !== player) {
        // Фишка на чужой финишной доске - невозможно
        return null;
      }
      const idx = currentCell.board.cells.indexOf(currentCell);
      if (idx === -1) return null;
      const newIdx = idx + remainingSteps;
      // Нельзя выйти за пределы финишной дорожки
      if (newIdx >= currentCell.board.cells.length) {
        return null;
      }
      const targetCell = currentCell.board.cells[newIdx]!;
      // Проверяем, не заблокирована ли целевая ячейка (на финишной доске блоки возможны?)
      // По правилам блоки на финишной доске не рассматриваются, но для безопасности проверим.
      if (this.isCellBlocked(targetCell)) {
        return null;
      }
      return targetCell;
    }

    // 3. Проверим, является ли текущая ячейка входом на финишную дорожку для данного игрока
    // Если да и steps == 1, фишка переходит на финишную дорожку (первую ячейку)
    if (
      currentCell.io &&
      currentCell.io.board.ind === 2 &&
      currentCell.io.board.player === player
    ) {
      if (remainingSteps === 1) {
        // Переход на финишную дорожку занимает один шаг
        const targetCell = currentCell.io;
        if (this.isCellBlocked(targetCell)) {
          return null;
        }
        return targetCell;
      }
      // Если steps > 1, фишка продолжает движение по основной доске (игнорируем переход)
    }

    // 4. Движение по главной доске
    const mainBoard = currentCell.board;
    if (mainBoard.ind !== 1) {
      // Не главная доска - что-то пошло не так
      return null;
    }
    const idx = mainBoard.cells.indexOf(currentCell);
    if (idx === -1) return null;
    const totalCells = mainBoard.cells.length;
    const newIdx = (idx + remainingSteps) % totalCells;
    let targetCell = mainBoard.cells[newIdx]!;

    // 5. Проверим, является ли целевая ячейка входом на финишную дорожку для player
    // (только если мы точно попали на вход, т.е. не прошли мимо)
    // Поскольку движение циклическое, мы могли пройти вход и продолжить дальше, но если newIdx соответствует ячейке входа,
    // то это означает, что мы точно попали на вход.
    if (targetCell.io && targetCell.io.board.ind === 2 && targetCell.io.board.player === player) {
      // Фишка попадает на вход финишной дорожки. Переходим на финишную дорожку.
      // При этом остаток шагов равен 0, потому что мы уже использовали все шаги для достижения этой ячейки.
      // Фишка просто переходит на первую ячейку финишной дорожки (targetCell.io).
      targetCell = targetCell.io;
    }

    // 6. Проверка блокировки: нельзя остановиться на заблокированной ячейке
    if (this.isCellBlocked(targetCell)) {
      return null;
    }

    // 7. Проверка блокировки пути: нельзя пройти через заблокированную ячейку
    const intermediateCells = this.getIntermediateCells(currentCell, steps);
    for (const cell of intermediateCells) {
      if (this.isCellBlocked(cell)) {
        return null;
      }
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
      if (forPlayer === undefined) {
        // Без указания игрока считаем, что ячейка безопасна (для кого-то)
        return true;
      }
      return safe === forPlayer;
    }
    return false; // не безопасна
  }

  /**
   * Проверка, является ли ячейка заблокированной (блок)
   * Блок образуют:
   * - две фишки одного цвета на любой ячейке общей дорожки
   * - две фишки разного цвета на безопасной ячейке или на выходе из базы
   */
  isCellBlocked(cell: Cell): boolean {
    const places = cell.places.filter((p) => p !== null);
    if (places.length < 2) {
      return false; // меньше двух фишек - не блок
    }
    // Проверяем, все ли фишки одного цвета
    const firstColor = places[0]!.player.color;
    const allSameColor = places.every((p) => p.player.color === firstColor);
    if (allSameColor) {
      return true; // блок из одинаковых цветов
    }
    // Если фишки разного цвета, проверяем, является ли ячейка безопасной или выходом из базы
    const isSafe = this.isSafeCell(cell);
    if (isSafe) {
      return true; // блок из разных цветов на безопасной ячейке
    }
    // Также выход из базы (safe instanceof Player) считается безопасной ячейкой, уже покрыто isSafeCell
    return false;
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
    // Определяем, является ли шаг бонусным (10 или 20)
    const bonusIndex = this.currentBonusSteps.indexOf(steps);
    if (bonusIndex !== -1) {
      // Используем бонусный шаг
      this.currentBonusSteps.splice(bonusIndex, 1);
      console.log(
        `Игрок ${this.currentPlayer.color} использовал бонус +${steps} шагов. Осталось бонусов: ${this.currentBonusSteps.length}`,
      );
    } else {
      // Используем кубик
      if (!this.useDice(dieIndex)) {
        return false;
      }
    }
    const targetCell = this.findTargetCell(chip.cell!, steps, chip.player);
    if (!targetCell) {
      // Откат использования кубика? Пока просто вернём false, но кубик уже использован
      // Для простоты не будем делать откат, т.к. это маловероятно
      // Однако если использовался бонус, нужно вернуть его? Пока не будем.
      return false;
    }

    // Проверка на захват: если в целевой ячейке есть фишка другого игрока и ячейка не безопасна для текущей фишки
    const otherChips = targetCell.places.filter((p) => p && p.player !== chip.player);
    let captured = false;
    if (otherChips.length > 0) {
      const isSafe = this.isSafeCell(targetCell, chip.player);
      if (!isSafe) {
        // Отправляем все чужие фишки на старт
        for (const otherChip of otherChips) {
          if (otherChip) {
            console.log(`Захват! Фишка игрока ${otherChip.player.color} отправлена на старт.`);
            this.sendToStart(otherChip);
            captured = true;
          }
        }
        // Начисляем бонус +20 за захват
        if (captured) {
          this.addBonus(this.currentPlayer, 20);
        }
      }
    }

    // Выполняем перемещение
    console.log(`Игрок ${chip.player.color} переместил фишку на ${steps} шагов.`);
    chip.go(targetCell);

    // Проверка на финиш
    if (targetCell.board.ind === 2 && targetCell.board.player === chip.player) {
      const finishBoard = targetCell.board;
      const lastCellIndex = finishBoard.cells.length - 1;
      if (finishBoard.cells.indexOf(targetCell) === lastCellIndex) {
        chip.finish();
        // Проверить, не победил ли игрок
        this.checkWinner();
      }
    }

    return true;
  }

  /**
   * Проверить, есть ли победитель (игрок, все фишки которого финишировали)
   * Устанавливает поле winner, если победитель найден.
   */
  checkWinner(): Player | null {
    if (this.winner) return this.winner; // уже определён
    for (const player of this.players) {
      if (player.chips.every((chip) => chip.finished)) {
        this.winner = player;
        console.log(`🎉 Игрок ${player.color} победил! Все фишки финишировали.`);
        return player;
      }
    }
    return null;
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
