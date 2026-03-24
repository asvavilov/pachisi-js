import { defineStore } from 'pinia';
import { useDiceStore } from './dice';
import { usePlayerStore } from './player';
import type { Cell } from 'src/lib/cell';
import type { Chip } from 'src/lib/chip';
import { Player } from 'src/lib/player';
import { computed, ref } from 'vue';
import { GameStateEnum, GameStateTree } from 'src/lib/GameState';

/**
 * игра
 */
export const useGameStore = defineStore('game', () => {
  const playerStore = usePlayerStore();
  const diceStore = useDiceStore();

  /**
   * ид. текущего состояния игры
   */
  const stateId = ref<GameStateEnum>(GameStateEnum.START);
  /**
   * текущее состояние игры
   */
  const state = computed(() => GameStateTree[stateId.value]);

  const winner = ref<Player | null>(null); // победитель игры, если есть
  const currentBonusSteps = ref<number[]>([]); // бонусные шаги за захват в текущем ходе (10 или 20)

  const initGame = () => {
    // TODO пока пропускаем этап выбора игрока и выбираем первого автоматически
    //stateId.value = GameStateEnum.SELECT_FIRST;
    playerStore.init();
    diceStore.reset();
    stateId.value = GameStateEnum.WAIT_ROLL;
  };

  /*const canRollDice = computed(() => {
    // TODO когда можно бросать кости:
    // - или еще не брошены
    // - или нет доступных ходов или все использованы (и выпали дубли)
    return (
      !diceStore.rolled || ((diceStore.isAllUsed || !hasMovableChips.value) && diceStore.isEquals)
    );
  });*/

  const rollDice = () => {
    prepareRollDice();
    diceStore.roll();

    if (hasMovableChips.value) {
      stateId.value = GameStateEnum.WAIT_STEP;
    } else {
      if (playerStore.canAddon) {
        prepareAddon();
        stateId.value = GameStateEnum.WAIT_ROLL;
      } else {
        //nextPlayer();
        stateId.value = GameStateEnum.WAIT_PLAYER;
      }
    }
  };

  const prepareRollDice = () => {
    // Сбрасываем бонусы текущего хода
    currentBonusSteps.value = [];
    selectedChip.value = null;
  };

  /**
   * подготовка дополнительного броска
   */
  const prepareAddon = () => {
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

    // Находим индекс текущей ячейки на соответствующей доске
    // Для упрощения предположим, что фишка находится на главной доске (board index 1)
    // или на стартовой/конечной доске.
    // Реализуем простой поиск следующей ячейки через steps шагов.
    // Это временная реализация, позже нужно заменить на правильную логику.
    const targetCell = findTargetCell(currentCell, steps, chip.player);
    return targetCell !== null;
  };

  /**
   * Найти целевую ячейку после steps шагов от текущей ячейки
   */
  const findTargetCell = (from: Cell, steps: number, player?: Player): Cell | null => {
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
      if (isCellBlocked(exitCell)) {
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
      if (isCellBlocked(targetCell)) {
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
        if (isCellBlocked(targetCell)) {
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
    if (isCellBlocked(targetCell)) {
      return null;
    }

    // 7. Проверка отключенности ячейки: нельзя остановиться на ячейке, которая занята и безопасна для занимающего игрока
    if (isCellDisabled(targetCell)) {
      return null;
    }

    // 8. Проверка блокировки пути: нельзя пройти через заблокированную ячейку
    const intermediateCells = getIntermediateCells(currentCell, steps);
    for (const cell of intermediateCells) {
      if (isCellBlocked(cell)) {
        return null;
      }
    }

    return targetCell;
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

  /**
   * Получить возможные шаги для конкретной фишки
   */
  const getPossibleStepsForChip = (chip: Chip): number[] => {
    return [...new Set(getAvailableSteps().filter((step) => canMoveChip(chip, step)))];
  };

  /**
   * Получить промежуточные ячейки при движении от startCell на steps шагов по главной доске.
   * Возвращает массив ячеек, через которые проходит фишка (исключая startCell, включая targetCell).
   * Если движение происходит по финишной доске или стартовой, возвращает пустой массив.
   */
  const getIntermediateCells = (startCell: Cell, steps: number): Cell[] => {
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
      const cell = mainBoard.cells[newIdx]!;
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
   * Проверка, является ли ячейка заблокированной (блок)
   * Блок образуют:
   * - две фишки одного цвета на любой ячейке общей дорожки
   * - две фишки разного цвета на безопасной ячейке или на выходе из базы
   */
  const isCellBlocked = (cell: Cell): boolean => {
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
    const isSafe = isSafeCell(cell);
    if (isSafe) {
      return true; // блок из разных цветов на безопасной ячейке
    }
    // Также выход из базы (safe instanceof Player) считается безопасной ячейкой, уже покрыто isSafeCell
    return false;
  };

  /**
   * Переместить фишку на steps шагов с использованием соответствующего кубика
   * @param chip Фишка
   * @param steps Количество шагов (должно соответствовать одному из доступных шагов)
   */
  const moveChip = (chip: Chip, steps: number): boolean => {
    if (!canMoveChip(chip, steps)) {
      return false;
    }
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
    const targetCell = findTargetCell(chip.cell!, steps, chip.player);
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
      const isSafe = isSafeCell(targetCell, chip.player);
      if (!isSafe) {
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
    if (targetCell.board.ind === 2 && targetCell.board.player === chip.player) {
      const finishBoard = targetCell.board;
      const lastCellIndex = finishBoard.cells.length - 1;
      if (finishBoard.cells.indexOf(targetCell) === lastCellIndex) {
        chip.finish();
        // Проверить, не победил ли игрок
        checkWinner();
      }
    }

    return true;
  };

  /**
   * Проверить, есть ли победитель (игрок, все фишки которого финишировали)
   * Устанавливает поле winner, если победитель найден.
   */
  const checkWinner = (): Player | null => {
    if (winner.value) return winner.value; // уже определён
    for (const player of playerStore.players) {
      if (player.chips.every((chip) => chip.finished)) {
        winner.value = player;
        console.log(`🎉 Игрок ${player.color} победил! Все фишки финишировали.`);
        stateId.value = GameStateEnum.FINISH;
        return player;
      }
    }
    return null;
  };

  /**
   * Отправить фишку на стартовую ячейку её игрока
   */
  const sendToStart = (chip: Chip) => {
    const player = chip.player;
    const startBoard = player.boards[0];
    if (startBoard && startBoard.cells.length > 0) {
      const startCell = startBoard.cells[0];
      if (startCell) {
        chip.go(startCell);
      }
    }
  };

  // Шаги для выбранной фишки
  const availableStepsForSelectedChip = computed(() => {
    if (!selectedChip.value) return [];
    return getPossibleStepsForChip(selectedChip.value);
  });

  // Индексы ячеек для подсветки (целевые ячейки для выбранной фишки)
  const highlightedCellIndices = computed(() => {
    const indices: number[] = [];
    if (!selectedChip.value) return indices;
    const board = playerStore.current!.boards[1]; // главная доска
    if (!board) return indices;
    for (const step of availableStepsForSelectedChip.value) {
      const targetCell = findTargetCell(selectedChip.value.cell!, step);
      if (targetCell && targetCell.board === board) {
        const idx = board.cells.indexOf(targetCell);
        if (idx !== -1) indices.push(idx);
      }
    }
    return indices;
  });

  const selectedChip = ref<Chip | null>(null);

  const movableChips = computed(() => getMovableChips());

  const hasMovableChips = computed(() => movableChips.value.length > 0);

  const availableChipIds = computed(() => movableChips.value.map((chip) => chip.id));

  // Обработчик клика на фишку
  const onChipClick = (chip: Chip | null | undefined) => {
    if (chip && isChipAvailable(chip)) {
      selectedChip.value = chip;
    }
  };

  const isChipAvailable = (chip: Chip | null | undefined): boolean => {
    if (!chip) return false;
    return availableChipIds.value.includes(chip.id);
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
