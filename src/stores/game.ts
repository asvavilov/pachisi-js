import { defineStore } from 'pinia';
import { useDiceStore } from './dice';
import { usePlayerStore } from './player';
import type { Cell } from 'src/lib/cell';
import type { Chip } from 'src/lib/chip';
import type { Player } from 'src/lib/player';
import { computed, ref, reactive } from 'vue';
import { GameStateEnum, GameStateTree } from 'src/lib/GameState';
import type { Board } from 'src/lib/board';
import { BoardType } from 'src/lib/board';
import type { PlayerIndex, PlayerData } from 'src/lib/player';
import { useBoardStore } from './board';

/**
 * Запись в логе отладки
 */
export interface DebugEntry {
  timestamp: number;
  function: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

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

  // ---- Debug логирование ----
  const debug = reactive({
    log: [] as DebugEntry[],
    enabled: true,
  });

  const debugLogPush = (
    fn: string,
    message: string,
    type: DebugEntry['type'] = 'info',
    data?: Record<string, unknown>,
  ) => {
    if (!debug.enabled) return;
    const entry: DebugEntry = {
      timestamp: Date.now(),
      function: fn,
      message,
      type,
    };
    if (data !== undefined) {
      entry.data = data;
    }
    debug.log.push(entry);
    if (debug.log.length > 500) {
      debug.log.splice(0, debug.log.length - 500);
    }
  };

  const clearDebugLog = () => {
    debug.log.splice(0, debug.log.length);
  };
  // ---- /Debug логирование ----

  /**
   * Текущий индекс игрока (для этапа SELECT_FIRST)
   */
  const currentIndex = computed({
    get: () => playerStore.currentIndex,
    set: (val: PlayerIndex | undefined) => {
      if (val !== undefined) {
        playerStore.init(val);
      }
    },
  });

  /**
   * Этап выбора первого игрока: индекс игрока, чья очередь бросать
   */
  const firstRollPlayerIndex = ref<PlayerIndex>(0);
  /**
   * Результаты бросков на этапе выбора первого игрока
   */
  const firstRollResults = ref<Record<PlayerIndex, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  /**
   * Счётчик дублей подряд
   */
  const doublesCount = ref(0);

  /**
   * Инициализация начала игры.
   */
  const initGame = () => {
    playerStore.init();
    diceStore.reset();
    firstRollPlayerIndex.value = 0;
    firstRollResults.value = { 0: 0, 1: 0, 2: 0, 3: 0 };
    doublesCount.value = 0;
    currentIndex.value = 0;
    stateId.value = GameStateEnum.SELECT_FIRST;
    clearDebugLog();
    debugLogPush('initGame', 'Игра инициализирована, состояние: SELECT_FIRST', 'info');
  };

  /**
   * Бросок кубиков.
   */
  const rollDice = () => {
    prepareRollDice();
    diceStore.roll();
    debugLogPush('rollDice', `Выпало: [${diceStore.items.join(', ')}] = ${diceStore.sum}`, 'info', {
      items: [...diceStore.items],
      sum: diceStore.sum,
    });

    // 1.1 Этап выбора первого игрока
    if (stateId.value === GameStateEnum.SELECT_FIRST) {
      handleSelectFirstRoll();
      return;
    }

    // 1.3 Отслеживание дублей
    if (diceStore.isEquals) {
      doublesCount.value++;
      debugLogPush('rollDice', `Дубль! Счётчик: ${doublesCount.value}/3`, 'warning', {
        doublesCount: doublesCount.value,
      });
      if (doublesCount.value >= 3) {
        handleThreeDoubles();
        doublesCount.value = 0;
      }
    } else {
      doublesCount.value = 0;
    }

    if (hasMovableChips.value) {
      debugLogPush(
        'rollDice',
        `Есть доступные ходы (${movableChips.value.length} фишек) → WAIT_STEP`,
        'success',
      );
      stateId.value = GameStateEnum.WAIT_STEP;
    } else {
      if (canAddonRollDice.value) {
        debugLogPush('rollDice', 'Нет ходов, но есть доп. бросок → WAIT_ROLL', 'warning');
        prepareAddonRollDice();
        stateId.value = GameStateEnum.WAIT_ROLL;
      } else {
        debugLogPush('rollDice', 'Нет ходов → WAIT_PLAYER', 'warning');
        //nextPlayer();
        stateId.value = GameStateEnum.WAIT_PLAYER;
      }
    }
  };

  /**
   * 1.1 Обработка броска на этапе выбора первого игрока
   */
  const handleSelectFirstRoll = () => {
    const idx = firstRollPlayerIndex.value;
    firstRollResults.value[idx] = diceStore.sum;
    debugLogPush(
      'handleSelectFirstRoll',
      `Игрок ${idx} (${playerStore.players[idx]?.color}) выбросил ${diceStore.sum}`,
      'info',
      { playerIndex: idx, sum: diceStore.sum },
    );

    // Обновляем текущего игрока для отображения
    currentIndex.value = idx;

    // Переход к следующему игроку
    const nextIdx = ((idx + 1) % 4) as PlayerIndex;

    // Если все 4 игрока бросили
    if (nextIdx === 0) {
      selectFirstPlayer();
    } else {
      firstRollPlayerIndex.value = nextIdx;
      debugLogPush('handleSelectFirstRoll', `Очередь броска: игрок ${nextIdx}`, 'info');
    }
  };

  /**
   * 1.1 Выбор первого игрока по минимальному броску
   */
  const selectFirstPlayer = () => {
    const results = firstRollResults.value;
    const values = [results[0], results[1], results[2], results[3]];

    // Находим минимальное значение
    const minVal = Math.min(...values);

    // Находим всех игроков с минимальным значением
    const candidates: PlayerIndex[] = [];
    for (let i = 0; i < 4; i++) {
      if (values[i] === minVal) {
        candidates.push(i as PlayerIndex);
      }
    }

    if (candidates.length === 1) {
      // Один победитель — устанавливаем его первым
      const winner = candidates[0]!;
      playerStore.init(winner);
      doublesCount.value = 0;
      stateId.value = GameStateEnum.WAIT_ROLL;
      debugLogPush(
        'selectFirstPlayer',
        `Первый игрок: ${winner} (${playerStore.players[winner]?.color}), результаты: [${values.join(', ')}]`,
        'success',
        { winner, values },
      );
    } else {
      // Ничья — перебрасываются только игроки с минимальным значением
      debugLogPush(
        'selectFirstPlayer',
        `Ничья между игроками [${candidates.join(', ')}] со значением ${minVal}, переброс`,
        'warning',
        { candidates, minVal },
      );
      firstRollResults.value = { 0: 0, 1: 0, 2: 0, 3: 0 };
      firstRollPlayerIndex.value = candidates[0]!;
      // Состояние остаётся SELECT_FIRST
    }
  };

  /**
   * 1.3 Три дубля подряд — ближайшая к финишу фишка на базу
   */
  const handleThreeDoubles = () => {
    const player = playerStore.current;
    if (!player) {
      debugLogPush('handleThreeDoubles', 'Нет текущего игрока', 'error');
      return;
    }

    const chip = player.getClosestToFinishChip();
    if (chip) {
      debugLogPush(
        'handleThreeDoubles',
        `3 дубля подряд! Фишка #${chip.id} (${chip.player.color}) отправляется на базу`,
        'error',
        { chipId: chip.id, playerColor: chip.player.color },
      );
      sendToStart(chip);
    } else {
      debugLogPush('handleThreeDoubles', '3 дубля подряд, но нет фишек для отправки', 'warning');
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
    const prevPlayer = playerStore.current?.color;
    diceStore.reset();
    playerStore.next();
    const nextPlayerColor = playerStore.current?.color;

    prepareRollDice();
    stateId.value = GameStateEnum.WAIT_ROLL;
    debugLogPush('nextPlayer', `Ход перешёл от ${prevPlayer} к ${nextPlayerColor}`, 'info', {
      from: prevPlayer,
      to: nextPlayerColor,
    });
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
    for (const step of getPossibleStepsForChip(selectedChip.value)) {
      const targetCells = findTargetCellVariants(selectedChip.value.cell, step);
      for (const targetCell of targetCells) {
        if (targetCell.board === board) {
          const idx = board.cells.indexOf(targetCell);
          if (idx !== -1) indices.push(idx);
        } else if (targetCell.board.type === BoardType.home) {
          // Подсвечиваем ячейки на финишной доске
          const idx = targetCell.board.cells.indexOf(targetCell);
          if (idx !== -1) {
            // Добавляем смещение для уникальности (используем отрицательные индексы или большое смещение)
            indices.push(1000 + idx);
          }
        }
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

    const targetCells = findTargetCellVariants(chip.cell, steps);
    return targetCells.length > 0;
  };

  /**
   * Найти все возможные целевые ячейки после steps шагов от текущей ячейки.
   * Возвращает массив вариантов:
   * - [ячейка основной доски] - если движение только по основной доске
   * - [ячейка финишной доски] - если возможен поворот на финиш
   */
  const findTargetCellVariants = (from: Cell, steps: number): Cell[] => {
    const variants: Cell[] = [];
    const currentCell = from;

    // Если фишка на стартовой доске
    if (currentCell.board.type === BoardType.base) {
      // Выход из базы возможен только при steps === 5 и если выходная ячейка свободна
      if (!diceStore.isOut(steps)) {
        return variants; // нельзя выйти с другими шагами
      }
      if (!currentCell.io) {
        return variants; // нет перехода
      }
      // Выходная ячейка безопасна только для своего цвета.
      // Проверяем, не занята ли ячейка своей же фишкой
      const exitCell = currentCell.io;
      // Если ячейка заблокирована (две фишки одного цвета) — выход невозможен
      if (isCellBlocked(exitCell)) {
        return variants;
      }
      const player = currentCell.board.player;
      const ownChipsOnExit = exitCell.places.filter((p) => p && player && p.player === player);
      if (ownChipsOnExit.length > 0) {
        return variants; // ячейка занята своей фишкой
      }
      variants.push(exitCell);
      return variants;
    }

    // Если фишка на финишной доске, двигаемся только по ней
    if (currentCell.board.type === BoardType.home) {
      const idx = currentCell.board.cells.indexOf(currentCell);
      const newIdx = idx + steps;
      // Нельзя выйти за пределы финишной дорожки
      if (newIdx >= currentCell.board.cells.length) {
        return variants;
      }
      const targetCell = currentCell.board.cells[newIdx]!;
      if (isCellBlocked(targetCell)) {
        return variants;
      }
      // Проверяем промежуточные ячейки на финишной дорожке — нельзя пройти сквозь блок
      let pathBlocked = false;
      for (let i = idx + 1; i < newIdx; i++) {
        const cell = currentCell.board.cells[i]!;
        if (isCellBlocked(cell)) {
          pathBlocked = true;
          break;
        }
      }
      if (!pathBlocked) {
        variants.push(targetCell);
      }
      return variants;
    }

    // Движение по главной доске - вариант 1: движение дальше по основной доске
    const mainBoard = currentCell.board;
    const idx = mainBoard.cells.indexOf(currentCell);
    const totalCells = mainBoard.cells.length;
    const newIdx = (idx + steps) % totalCells;
    const targetCellMain = mainBoard.cells[newIdx]!;

    // Проверка отключенности ячейки: нельзя остановиться на ячейке, которая занята и безопасна для занимающего игрока
    if (!isCellDisabled(targetCellMain)) {
      // Проверка блокировки пути: нельзя пройти через заблокированную ячейку
      const intermediateCellsMain = getIntermediateCellsOnBoard(currentCell, steps, mainBoard);
      let pathBlocked = false;
      for (const cell of intermediateCellsMain) {
        if (isCellBlocked(cell)) {
          pathBlocked = true;
          break;
        }
      }
      if (!pathBlocked) {
        variants.push(targetCellMain);
      }
    }

    // Вариант 2: проверка возможности поворота на финишную доску
    // Определяем игрока по текущей ячейке (фишка принадлежит какому-то игроку)
    // Но у нас нет прямой ссылки, поэтому используем playerStore.current
    const player = playerStore.current!;
    const homeBoard = player.homeBoard;

    // Находим ячейку входа на финишную доску
    // Это ячейка основной доски, связанная с первой ячейкой финишной доски
    const entranceCell = homeBoard.cells[0]!.io;
    if (!entranceCell || entranceCell.board.type !== BoardType.main) {
      return variants; // нет входа на финиш
    }
    const entranceIndex = mainBoard.cells.indexOf(entranceCell);

    // Если вход на финишную дорожку заблокирован (2 фишки одного цвета),
    // то поворот невозможен — нельзя пройти сквозь блок
    if (isCellBlocked(entranceCell)) {
      return variants;
    }

    // Проверяем, проходит ли путь через точку входа на финиш
    const pathToEntrance = getIntermediateCellsOnBoard(currentCell, steps, mainBoard);
    const passesThroughEntrance = pathToEntrance.some((cell) => cell === entranceCell);

    // Также проверяем, не является ли сама целевая ячейка точкой входа
    const targetIdxOnMain = (idx + steps) % totalCells;
    const targetIsEntrance = targetIdxOnMain === entranceIndex;

    // Проверяем вариант поворота на финишную доску
    // Если фишка уже стоит на точке входа
    if (currentCell === entranceCell) {
      // Можно перейти на homeBoard[steps - 1] (переход = 1 шаг, остальное по финишной доске)
      if (steps >= 1 && steps <= homeBoard.cells.length) {
        const targetCellHome = homeBoard.cells[steps - 1]!;
        if (!isCellBlocked(targetCellHome)) {
          variants.push(targetCellHome);
        }
      }
    }

    if (passesThroughEntrance || targetIsEntrance) {
      // Вычисляем, сколько шагов до точки входа
      const stepsToEntrance = (entranceIndex - idx + totalCells) % totalCells;

      // Если точка входа совпадает с текущей позицией, обработано выше
      if (stepsToEntrance === 0) {
        return variants;
      }

      // Для перехода на финишную доску нужен дополнительный шаг:
      // homeBoard[0] — это ячейка ПОСЛЕ точки входа (переход через io = 1 шаг)
      const remainingStepsOnHome = steps - stepsToEntrance - 1;

      if (remainingStepsOnHome >= 0 && remainingStepsOnHome < homeBoard.cells.length) {
        const targetCellHome = homeBoard.cells[remainingStepsOnHome]!;
        if (!isCellBlocked(targetCellHome)) {
          // Проверяем путь до точки входа на основной доске
          let pathToEntranceBlocked = false;
          for (let i = 1; i <= stepsToEntrance; i++) {
            const cellIdx = (idx + i) % totalCells;
            const cell = mainBoard.cells[cellIdx]!;
            if (isCellBlocked(cell)) {
              pathToEntranceBlocked = true;
              break;
            }
          }
          if (!pathToEntranceBlocked) {
            variants.push(targetCellHome);
          }
        }
      }
    }

    return variants;
  };

  /**
   * Получить промежуточные ячейки при движении на steps шагов в рамках одной доски.
   */
  const getIntermediateCellsOnBoard = (startCell: Cell, steps: number, board: Board): Cell[] => {
    const idx = board.cells.indexOf(startCell);
    const totalCells = board.cells.length;
    const cells: Cell[] = [];
    for (let i = 1; i <= steps; i++) {
      const newIdx = (idx + i) % totalCells;
      const cell = board.cells[newIdx]!;
      cells.push(cell);
    }
    return cells;
  };

  /**
   * Проверка, является ли ячейка безопасной (защищает от захвата) для заданного игрока
   */
  const isSafeCell = (cell: Cell, forPlayer?: PlayerData): boolean => {
    const safe = cell.safe;
    if (safe === true) {
      return true; // общая безопасная ячейка
    }
    if (safe && typeof safe === 'object' && 'ind' in safe) {
      // стартовая ячейка конкретного игрока
      if (forPlayer === undefined) {
        // Без указания игрока считаем, что ячейка безопасна (для кого-то)
        return true;
      }
      return safe.ind === forPlayer.ind;
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
   * - фишки одного цвета на любой ячейке заняли все места
   */
  const isCellBlocked = (cell: Cell): boolean => cell.places.every((p) => p !== null);

  /**
   * FIXME тут не надо проверок на возможность хода, они должны быть до вызова этого метода
   * FIXME бонус может совпадать с суммой кубиков, надо как-то отличать, чтобы правильно отмечать использование
   *
   * Переместить фишку на steps шагов с использованием соответствующего кубика
   * @param chip Фишка
   * @param steps Количество шагов (должно соответствовать одному из доступных шагов)
   * @param targetCell Целевая ячейка (если не указана, используется первый вариант из findTargetCellVariants)
   */
  const moveChip = (chip: Chip, steps: number, targetCell: Cell): boolean => {
    // Проверяем, что выбранный шаг соответствует доступному кубику
    const availableSteps = getAvailableSteps();
    if (!availableSteps.includes(steps)) {
      debugLogPush('moveChip', `Шаг ${steps} недоступен для фишки #${chip.id}`, 'error', {
        chipId: chip.id,
        steps,
        availableSteps,
      });
      return false;
    }
    // Определяем, является ли шаг бонусным (10 или 20)
    const bonusIndex = currentBonusSteps.value.indexOf(steps);
    if (bonusIndex !== -1) {
      // Используем бонусный шаг
      currentBonusSteps.value.splice(bonusIndex, 1);
      debugLogPush('moveChip', `Использован бонусный шаг +${steps}`, 'success', {
        steps,
        bonusType: steps === 20 ? 'capture' : 'finish',
      });
    } else {
      diceStore.use(steps);
      debugLogPush('moveChip', `Использован кубик ${steps}`, 'info', { steps });
    }

    // Если целевая ячейка не указана, используем первый вариант
    const target = targetCell;

    // Проверка на захват: если в целевой ячейке есть фишка другого игрока и ячейка не безопасна для текущей фишки
    const otherChips = target.places.filter((p) => p && p.player !== chip.player);
    let captured = false;
    if (otherChips.length > 0) {
      // Отправляем все чужие фишки на старт
      for (const otherChip of otherChips) {
        if (otherChip) {
          debugLogPush(
            'moveChip',
            `Захват! Фишка #${otherChip.id} (${otherChip.player.color}) отправлена на базу`,
            'success',
            { capturedChipId: otherChip.id, capturedColor: otherChip.player.color },
          );
          sendToStart(otherChip);
          captured = true;
        }
      }
      // Начисляем бонус +20 за захват
      if (captured) {
        addBonus(20);
        debugLogPush('moveChip', 'Бонус +20 за захват', 'success');
      }
    }

    // Выполняем перемещение
    chip.go(target);
    selectedChip.value = null;

    stateId.value = hasMovableChips.value
      ? GameStateEnum.WAIT_STEP
      : diceStore.hasAddon || diceStore.isEquals
        ? GameStateEnum.WAIT_ROLL
        : GameStateEnum.WAIT_PLAYER;

    debugLogPush(
      'moveChip',
      `Фишка #${chip.id} → ${target.board.type === BoardType.home ? `home[${target.board.cells.indexOf(target)}]` : `main[${target.board.cells.indexOf(target)}]`}, состояние: ${stateId.value}`,
      'success',
      {
        chipId: chip.id,
        targetBoardType: target.board.type,
        targetIdx: target.board.cells.indexOf(target),
        newState: stateId.value,
      },
    );

    // Проверка на финиш
    if (target.board.type === BoardType.home && target.board.player === chip.player) {
      const finishBoard = target.board;
      const lastCellIndex = finishBoard.cells.length - 1;
      if (finishBoard.cells.indexOf(target) === lastCellIndex) {
        chip.finish();
        // 1.2 Бонус +10 за попадание в дом
        addBonus(10);
        debugLogPush('moveChip', `Фишка #${chip.id} финишировала! Бонус +10`, 'success', {
          chipId: chip.id,
        });
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
  };

  const checkWinner = (player: PlayerData) => {
    // Проверить, не победил ли игрок
    const isWinner = playerStore.checkWinner(player as Player);
    if (isWinner === player) {
      // TODO пока только один победитель
      stateId.value = GameStateEnum.FINISH;
    }
  };

  /**
   * Отправить фишку на стартовую ячейку её игрока
   */
  const sendToStart = (chip: Chip) => {
    const playerIndex = chip.player.ind;
    const player = playerStore.players[playerIndex];
    if (!player) {
      debugLogPush('sendToStart', `Игрок ${playerIndex} не найден`, 'error', { playerIndex });
      return;
    }
    const startBoard = player.baseBoard;
    const startCell = startBoard.cells[0]!;
    chip.go(startCell);
    debugLogPush(
      'sendToStart',
      `Фишка #${chip.id} (${chip.player.color}) отправлена на базу`,
      'warning',
      { chipId: chip.id, playerColor: chip.player.color },
    );
  };

  // Обработчик клика на фишку
  const onChipClick = (chip: Chip | null | undefined) => {
    // Блокируем выбор фишек на этапе выбора первого игрока
    if (stateId.value === GameStateEnum.SELECT_FIRST) return;
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
    getPossibleStepsForChip,
    findTargetCellVariants,
    currentBonusSteps,
    movableChips,
    hasMovableChips,
    nextPlayer,
    isChipAvailable,
    // 1.1 Этап выбора первого игрока
    firstRollPlayerIndex,
    firstRollResults,
    // 1.3 Счётчик дублей
    doublesCount,
    // Debug
    debug,
    debugLogPush,
    clearDebugLog,
  };
});
