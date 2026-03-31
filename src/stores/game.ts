import { defineStore } from 'pinia';
import { useDiceStore } from './dice';
import { usePlayerStore } from './player';
import type { Cell } from 'src/lib/cell';
import type { Chip } from 'src/lib/chip';
import { Player } from 'src/lib/player';
import { computed, ref } from 'vue';
import { GameStateEnum, GameStateTree } from 'src/lib/GameState';
import { BoardType } from 'src/lib/board';
import { useBoardStore } from './board';

/**
 * игра
 */
export const useGameStore = defineStore('game', () => {
  const playerStore = usePlayerStore();
  const diceStore = useDiceStore();
  const boardStore = useBoardStore();

  /**
   * ид. текущего состояния игры
   */
  const stateId = ref<GameStateEnum>(GameStateEnum.START);
  /**
   * текущее состояние игры
   */
  const state = computed(() => GameStateTree[stateId.value]);

  const selectedChip = ref<Chip | null>(null);

  const currentBonusSteps = ref<number[]>([]); // бонусные шаги за захват в текущем ходе (10 или 20)

  /**
   * Инициализация начала игры.
   */
  const initGame = () => {
    // TODO пока пропускаем этап выбора игрока и выбираем первого автоматически
    //stateId.value = GameStateEnum.SELECT_FIRST;
    playerStore.init();
    diceStore.reset();
    stateId.value = GameStateEnum.WAIT_ROLL;
  };

  /**
   * Бросок кубиков.
   */
  const rollDice = () => {
    prepareRollDice();
    diceStore.roll();

    if (hasMovableChips.value) {
      stateId.value = GameStateEnum.WAIT_STEP;
    } else {
      if (canAddonRollDice.value) {
        prepareAddonRollDice();
        stateId.value = GameStateEnum.WAIT_ROLL;
      } else {
        //nextPlayer();
        stateId.value = GameStateEnum.WAIT_PLAYER;
      }
    }
  };

  /**
   * Сброс всего что нужно перед следующим броском (дополнительным текущего игрока или следующего игрока).
   */
  const prepareRollDice = () => {
    // Сбрасываем бонусы текущего хода
    currentBonusSteps.value = [];
    selectedChip.value = null;
  };

  /**
   * подготовка дополнительного броска
   */
  const prepareAddonRollDice = () => {
    //diceStore.reset();

    prepareRollDice();
  };

  /**
   * переход хода к следующему игроку
   */
  const nextPlayer = () => {
    diceStore.reset();
    playerStore.next();

    prepareRollDice();
    stateId.value = GameStateEnum.WAIT_ROLL;
  };

  /**
   * дополнительный ход:
   * - или когда дубли
   * - или выпало 6 и все на базе
   */
  const canAddonRollDice = computed(() => {
    return diceStore.isEquals || (playerStore.allChipsOnBase && diceStore.hasAddon);
  });

  const movableChips = computed(() => getMovableChips());

  const hasMovableChips = computed(() => movableChips.value.length > 0);

  const availableChipIds = computed(() => movableChips.value.map((chip) => chip.id));

  // Индексы ячеек для подсветки (целевые ячейки для выбранной фишки)
  const highlightedCellIndices = computed(() => {
    const indices: number[] = [];
    if (!selectedChip.value) return indices;
    const board = boardStore.board; // главная доска
    for (const step of availableStepsForSelectedChip.value) {
      const targetCell = findTargetCell(selectedChip.value.cell, step);
      if (targetCell && targetCell.board === board) {
        const idx = board.cells.indexOf(targetCell);
        if (idx !== -1) indices.push(idx);
      }
    }
    return indices;
  });

  const isChipAvailable = (chip: Chip | null | undefined): boolean => {
    if (!chip) return false;
    return availableChipIds.value.includes(chip.id);
  };

  /**
   * Получить список фишек, которые могут быть перемещены на любой из доступных шагов
   */
  const getMovableChips = (): Chip[] => {
    const steps = getAvailableSteps();
    const movable: Chip[] = [];
    for (const step of steps) {
      movable.push(...getMovableChipsForSteps(step));
    }
    // Убрать дубликаты (одна фишка может быть доступна для нескольких шагов)
    return Array.from(new Set(movable));
  };

  // Шаги для выбранной фишки
  const availableStepsForSelectedChip = computed(() => {
    if (!selectedChip.value) return [];
    return getPossibleStepsForChip(selectedChip.value);
  });

  /**
   * Получить возможные шаги для конкретной фишки
   */
  const getPossibleStepsForChip = (chip: Chip): number[] => {
    return [...new Set(getAvailableSteps().filter((step) => canMoveChip(chip, step)))];
  };

  /**
   * Получить доступные варианты шагов (неиспользованные кубики и сумму)
   */
  const getAvailableSteps = (): number[] => {
    const steps: number[] = [];
    if (diceStore.items.length === 0) return steps;
    steps.push(...diceStore.unused);
    // Если оба кубика не использованы, можно предложить сумму
    if (diceStore.unusedSum && !steps.includes(diceStore.unusedSum)) {
      steps.push(diceStore.unusedSum);
    }
    // Бонусные шаги (каждый бонус добавляется как отдельный шаг)
    for (const bonus of currentBonusSteps.value) {
      steps.push(bonus);
    }
    return steps;
  };

  /**
   * Получить список фишек, которые могут быть перемещены на заданное количество шагов
   */
  const getMovableChipsForSteps = (steps: number): Chip[] => {
    const player = usePlayerStore().current!;
    const movable: Chip[] = [];

    for (const chip of player.chips) {
      if (canMoveChip(chip, steps)) {
        movable.push(chip);
      }
    }

    return movable;
  };

  /**
   * Проверка, может ли фишка быть перемещена на заданное количество шагов
   */
  const canMoveChip = (chip: Chip, steps: number): boolean => {
    // Если фишка финишировала, не может двигаться
    if (chip.finished) return false;
    // Если фишка ещё не на доске (в стартовой ячейке)
    if (!chip.cell) return false;

    const currentCell = chip.cell;

    const targetCell = findTargetCell(currentCell, steps);
    return targetCell !== null;
  };

  /**
   * FIXME целевых может быть 2, если возможен поворот на финиш и движение на следующий круг
   *
   * Найти целевую ячейку после steps шагов от текущей ячейки
   */
  const findTargetCell = (from: Cell, steps: number): Cell | null => {
    const currentCell = from;
    const remainingSteps = steps;

    // Если фишка на стартовой доске (ind === 0)
    if (currentCell.board.type === BoardType.base) {
      // Выход из базы возможен только при steps === 5 и если выходная ячейка свободна
      if (!diceStore.isOut(steps)) {
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
      if (isCellBlocked(exitCell)) {
        return null;
      }
      return exitCell;
    }

    // Если фишка на финишной доске (ind === 2), двигаемся только по ней
    if (currentCell.board.type === BoardType.home) {
      const idx = currentCell.board.cells.indexOf(currentCell);
      const newIdx = idx + remainingSteps;
      // Нельзя выйти за пределы финишной дорожки
      if (newIdx >= currentCell.board.cells.length) {
        return null;
      }
      const targetCell = currentCell.board.cells[newIdx]!;
      // FIXME проверять не только целевую ячейку, но и все предыдущие (см. как ниже для основной доски)
      if (isCellBlocked(targetCell)) {
        return null;
      }
      return targetCell;
    }

    // Движение по главной доске
    const mainBoard = currentCell.board;
    const idx = mainBoard.cells.indexOf(currentCell);
    const totalCells = mainBoard.cells.length;
    const newIdx = (idx + remainingSteps) % totalCells;
    const targetCell = mainBoard.cells[newIdx]!;

    // Проверка отключенности ячейки: нельзя остановиться на ячейке, которая занята и безопасна для занимающего игрока
    if (isCellDisabled(targetCell)) {
      return null;
    }

    // Проверка блокировки пути: нельзя пройти через заблокированную ячейку
    const intermediateCells = getIntermediateCells(currentCell, steps);
    for (const cell of intermediateCells) {
      if (isCellBlocked(cell)) {
        return null;
      }
    }

    return targetCell;
  };

  /**
   * FIXME нужны варианты:
   * 1) движение по основной доске, включая заход на следующий круг
   * 2) движение по основной доске, с поворотом на финишную
   * 3) движение по финишной доске
   * для 2 и 3: что если превышает длину? здесь не проверяются блокировки и занятости целевой
   *
   * Получить промежуточные ячейки при движении от startCell на steps шагов.
   * Возвращает массив ячеек, через которые проходит фишка (исключая startCell, включая targetCell).
   */
  const getIntermediateCells = (startCell: Cell, steps: number): Cell[] => {
    if (startCell.board.type === BoardType.base) {
      return [];
    }
    const currentBoard = startCell.board;
    const idx = currentBoard.cells.indexOf(startCell);
    const totalCells = currentBoard.cells.length;
    const cells: Cell[] = [];
    for (let i = 1; i <= steps; i++) {
      const newIdx = (idx + i) % totalCells;
      const cell = currentBoard.cells[newIdx]!;
      cells.push(cell);
    }
    return cells;
  };

  /**
   * Проверка, является ли ячейка безопасной (защищает от захвата) для заданного игрока
   */
  const isSafeCell = (cell: Cell, forPlayer?: Player): boolean => {
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
  };

  const isCellDisabled = (cell: Cell): boolean => {
    // Ячейка считается отключенной, если она занята и является безопасной для игрока, который её занимает
    const places = cell.places.filter((p) => p !== null);
    if (places.length === 0) {
      return false; // ячейка свободна - не отключена
    }
    // Все фишки на ячейке принадлежат одному игроку (по правилам игры)
    const occupyingPlayer = places[0]!.player;
    // Проверяем, безопасна ли ячейка для этого игрока
    return isSafeCell(cell, occupyingPlayer);
  };

  /**
   * TODO еще нужна функция, которая проверяет нет ли на пути заблокированной ячейки
   * Проверка, является ли ячейка заблокированной (блок)
   * Блок образуют:
   * - фишки одного цвета на любой ячейке заняли все места
   */
  const isCellBlocked = (cell: Cell): boolean => cell.places.every((p) => p !== null);

  /**
   * FIXME тут не надо проверок на возможность хода, они должны быть до вызова этого метода
   *
   * Переместить фишку на steps шагов с использованием соответствующего кубика
   * @param chip Фишка
   * @param steps Количество шагов (должно соответствовать одному из доступных шагов)
   */
  const moveChip = (chip: Chip, steps: number): boolean => {
    // Проверяем, что выбранный шаг соответствует доступному кубику
    const availableSteps = getAvailableSteps();
    if (!availableSteps.includes(steps)) {
      return false;
    }
    // Определяем, является ли шаг бонусным (10 или 20)
    const bonusIndex = currentBonusSteps.value.indexOf(steps);
    if (bonusIndex !== -1) {
      // Используем бонусный шаг
      currentBonusSteps.value.splice(bonusIndex, 1);
      console.log(
        `Игрок ${usePlayerStore().current!.color} использовал бонус +${steps} шагов. Осталось бонусов: ${currentBonusSteps.value.length}`,
      );
    } else {
      diceStore.use(steps);
    }
    const targetCell = findTargetCell(chip.cell, steps)!;

    // Проверка на захват: если в целевой ячейке есть фишка другого игрока и ячейка не безопасна для текущей фишки
    const otherChips = targetCell.places.filter((p) => p && p.player !== chip.player);
    let captured = false;
    if (otherChips.length > 0) {
      // Отправляем все чужие фишки на старт
      for (const otherChip of otherChips) {
        if (otherChip) {
          console.log(`Захват! Фишка игрока ${otherChip.player.color} отправлена на старт.`);
          sendToStart(otherChip);
          captured = true;
        }
      }
      // Начисляем бонус +20 за захват
      if (captured) {
        addBonus(20);
      }
    }

    // Выполняем перемещение
    console.log(`Игрок ${chip.player.color} переместил фишку на ${steps} шагов.`);
    chip.go(targetCell);
    selectedChip.value = null;

    stateId.value = hasMovableChips.value
      ? GameStateEnum.WAIT_STEP
      : diceStore.hasAddon || diceStore.isEquals
        ? GameStateEnum.WAIT_ROLL
        : GameStateEnum.WAIT_PLAYER;

    // Проверка на финиш
    if (targetCell.board.type === BoardType.home && targetCell.board.player === chip.player) {
      const finishBoard = targetCell.board;
      const lastCellIndex = finishBoard.cells.length - 1;
      if (finishBoard.cells.indexOf(targetCell) === lastCellIndex) {
        chip.finish();
        checkWinner(chip.player);
      }
    }

    return true;
  };

  /**
   * Добавить бонусные шаги текущему игроку (только если это текущий игрок)
   */
  const addBonus = (steps: number) => {
    // Добавляем отдельный бонусный шаг (10 или 20) в массив
    currentBonusSteps.value.push(steps);
    console.log(
      `Игрок получил бонус +${steps} шагов. Теперь бонусы: [${currentBonusSteps.value.join(', ')}]`,
    );
  };

  const checkWinner = (player: Player) => {
    // Проверить, не победил ли игрок
    const isWinner = playerStore.checkWinner(player);
    if (isWinner === player) {
      // TODO пока только один победитель
      stateId.value = GameStateEnum.FINISH;
    }
  };

  /**
   * Отправить фишку на стартовую ячейку её игрока
   */
  const sendToStart = (chip: Chip) => {
    const player = chip.player;
    const startBoard = player.baseBoard;
    const startCell = startBoard.cells[0]!;
    chip.go(startCell);
  };

  // Обработчик клика на фишку
  const onChipClick = (chip: Chip | null | undefined) => {
    if (chip && isChipAvailable(chip)) {
      selectedChip.value = chip;
    }
  };

  return {
    initGame,
    stateId,
    state,
    //canRollDice,
    rollDice,
    onChipClick,
    //availableChipIds,
    highlightedCellIndices,
    selectedChip,
    moveChip,
    availableStepsForSelectedChip,
    currentBonusSteps,
    movableChips,
    hasMovableChips,
    nextPlayer,
    isChipAvailable,
  };
});
