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
import { chooseMove } from 'src/lib/ai';
import type { AiView, MoveCandidate } from 'src/lib/ai';

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
   * Кандидаты на бросок/переброс на этапе выбора первого игрока.
   * Изначально — все 4 игрока; при ничье сужается до игроков с максимальной суммой.
   */
  const firstRollCandidates = ref<PlayerIndex[]>([0, 1, 2, 3]);

  /**
   * Счётчик дублей подряд
   */
  const doublesCount = ref(0);

  /**
   * README п.7: использовал ли игрок второй дубль для хода.
   * Третий дубль отправляет фишку в базу только если второй дубль был использован для хода.
   */
  const secondDoubleUsedForMove = ref(false);

  /**
   * README п.7: последняя двинутая фишка (для правила трёх дублей).
   */
  const lastMovedChip = ref<Chip | null>(null);

  /**
   * Сброс изменяемого состояния партии (без расстановки фишек).
   */
  const resetMatchState = () => {
    playerStore.init();
    diceStore.reset();
    firstRollPlayerIndex.value = 0;
    firstRollResults.value = { 0: 0, 1: 0, 2: 0, 3: 0 };
    firstRollCandidates.value = [0, 1, 2, 3];
    doublesCount.value = 0;
    secondDoubleUsedForMove.value = false;
    lastMovedChip.value = null;
    currentBonusSteps.value = [];
    selectedChip.value = null;
    clearDebugLog();
  };

  /**
   * Инициализация начала игры (со стартового экрана).
   */
  const initGame = () => {
    resetMatchState();
    currentIndex.value = 0;
    stateId.value = GameStateEnum.SELECT_FIRST;
    debugLogPush('initGame', 'Игра инициализирована, состояние: SELECT_FIRST', 'info');
  };

  /**
   * Новая партия: фишки возвращаются на базу, игра возвращается на стартовый экран.
   */
  const newGame = () => {
    resetMatchState();
    playerStore.reset();
    stateId.value = GameStateEnum.START;
    debugLogPush('newGame', 'Новая партия — возврат на стартовый экран', 'info');
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
      // README п.7: третий дубль срабатывает только если второй дубль был использован для хода.
      if (doublesCount.value === 2) {
        // Выпал второй дубль — сбрасываем флаг использования его для хода
        secondDoubleUsedForMove.value = false;
        lastMovedChip.value = null;
      }
      if (doublesCount.value >= 3) {
        handleThreeDoubles();
        doublesCount.value = 0;
        secondDoubleUsedForMove.value = false;
        lastMovedChip.value = null;
      }
    } else {
      doublesCount.value = 0;
      secondDoubleUsedForMove.value = false;
      lastMovedChip.value = null;
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
        // README п.13: если ни одно значение кубиков не даёт допустимого хода,
        // игрок ничего не делает и ход автоматически переходит к следующему.
        debugLogPush(
          'rollDice',
          'Нет ходов → автопереход к следующему игроку (README п.13)',
          'warning',
        );
        nextPlayer();
      }
    }
  };

  /**
   * 1.1 Обработка броска на этапе выбора первого игрока.
   * Бросают только текущие кандидаты (firstRollCandidates):
   * при ничьей на предыдущем круге — только игроки с максимальной суммой.
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

    // Переход к следующему кандидату на бросок
    const candidates = firstRollCandidates.value;
    const curPos = candidates.indexOf(idx);
    const nextIdx = candidates[(curPos + 1) % candidates.length]!;

    // Если вернулись к первому кандидату — все кандидаты бросили
    if (nextIdx === candidates[0]) {
      selectFirstPlayer();
    } else {
      firstRollPlayerIndex.value = nextIdx;
      debugLogPush('handleSelectFirstRoll', `Очередь броска: игрок ${nextIdx}`, 'info');
    }
  };

  /**
   * 1.1 Выбор первого игрока по наибольшему броску (README п.2).
   * При равенстве максимальной суммы — перебрасывают только игроки с этим максимумом.
   */
  const selectFirstPlayer = () => {
    const results = firstRollResults.value;
    const candidates = firstRollCandidates.value;

    // README п.2: начинает тот, у кого наибольшая сумма; при равенстве — переброс.
    const candidateValues = candidates.map((c) => results[c]);
    const maxVal = Math.max(...candidateValues);

    // Находим всех кандидатов с максимальным значением
    const tieCandidates: PlayerIndex[] = candidates.filter((c) => results[c] === maxVal);

    if (tieCandidates.length === 1) {
      // Один победитель — устанавливаем его первым
      const winner = tieCandidates[0]!;
      playerStore.init(winner);
      doublesCount.value = 0;
      firstRollCandidates.value = [0, 1, 2, 3];
      stateId.value = GameStateEnum.WAIT_ROLL;
      debugLogPush(
        'selectFirstPlayer',
        `Первый игрок: ${winner} (${playerStore.players[winner]?.color}), результаты: [${Object.values(results).join(', ')}]`,
        'success',
        { winner, values: Object.values(results) },
      );
    } else {
      // Ничья — перебрасываются только игроки с максимальным значением
      debugLogPush(
        'selectFirstPlayer',
        `Ничья между игроками [${tieCandidates.join(', ')}] со значением ${maxVal}, переброс`,
        'warning',
        { candidates: tieCandidates, maxVal },
      );
      firstRollResults.value = { 0: 0, 1: 0, 2: 0, 3: 0 };
      firstRollCandidates.value = tieCandidates;
      firstRollPlayerIndex.value = tieCandidates[0]!;
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

    // README п.7: третий дубль отправляет фишку в базу только если второй дубль был использован для хода.
    if (!secondDoubleUsedForMove.value) {
      debugLogPush(
        'handleThreeDoubles',
        '3 дубля подряд, но второй дубль не был использован для хода — фишка не отправляется на базу',
        'warning',
      );
      return;
    }

    // README п.7: отправляем последнюю двинутую фишку (если она есть), иначе ближайшую к финишу.
    const chip = lastMovedChip.value ?? player.getClosestToFinishChip();
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
   * README п.7: дополнительный бросок даёт только дубль.
   */
  const canAddonRollDice = computed(() => diceStore.isEquals);

  /**
   * README п.6: правило «+7».
   * Активно, когда у текущего игрока нет ни одной фишки на базе (все 4 в игре)
   * и выпал дубль. В этом случае каждое значение кубика соответствует перемещению
   * на 7 клеток (аналог «6» в классическом варианте с одним кубиком).
   */
  const isPlusSevenActive = computed(
    () =>
      diceStore.isEquals &&
      !!playerStore.current &&
      playerStore.current.chips.every((chip) => chip.cell?.board.type !== BoardType.base),
  );

  const movableChips = computed(() => getMovableChips());

  const hasMovableChips = computed(() => movableChips.value.length > 0);

  const availableChipIds = computed(() => movableChips.value.map((chip) => chip.id));

  // Целевые ячейки для подсветки (для выбранной фишки).
  // Отдаём сами Cell, чтобы отображение просто проверяло вхождение
  // и не знало о кодировании индексов/досок.
  const highlightedCells = computed<Cell[]>(() => {
    if (!selectedChip.value) return [];
    const cells: Cell[] = [];
    for (const step of getPossibleStepsForChip(selectedChip.value)) {
      cells.push(...findTargetCellVariants(selectedChip.value.cell, step));
    }
    return cells;
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
    const unique = Array.from(new Set(movable));
    // README п.8: при дубле и наличии барьера игрок обязан сдвинуть фишку барьера,
    // если такое передвижение возможно. Иначе — обычные правила.
    if (isBarrierMoveRequired.value) {
      const barrier = new Set(getBarrierChips(playerStore.current!));
      const barrierMoves = unique.filter((chip) => barrier.has(chip));
      if (barrierMoves.length > 0) return barrierMoves;
    }
    return unique;
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

    // README п.6: правило «+7» — дубль при всех 4 фишках в игре.
    // Каждое значение кубика соответствует перемещению на 7 клеток (аналог «6» в классике).
    if (isPlusSevenActive.value) {
      if (diceStore.unused.length > 0 && !steps.includes(7)) {
        steps.push(7);
      }
    } else {
      steps.push(...diceStore.unused);
      // Если оба кубика не использованы, можно предложить сумму
      if (diceStore.unusedSum && !steps.includes(diceStore.unusedSum)) {
        steps.push(diceStore.unusedSum);
      }
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
      // Если выходная ячейка полностью занята (барьер или мост) — выйти нельзя,
      // т.к. на мост/барьер нельзя встать (README п.9).
      if (exitCell.places.every((p) => p !== null)) {
        return variants;
      }
      const player = currentCell.board.player;
      const ownChipsOnExit = exitCell.places.filter(
        (p) => p && player && p.player.ind === player.ind,
      );
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

    // Проверка отключенности ячейки: нельзя остановиться на ячейке, которая занята и безопасна для занимающего игрока.
    // README п.5: на остальных (кроме базы и дома) клетках не более двух фишек — нельзя встать на полностью занятую ячейку
    // (ни на барьер, ни на мост, см. п.8 и п.9).
    if (!isCellDisabled(targetCellMain) && targetCellMain.places.some((p) => p === null)) {
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
    // Ячейка «отключена» (нельзя встать) только для СВОЕГО игрока, когда её занимает
    // его же фишка на собственной стартовой клетке.
    // README п.9: на стартовых и безопасных клетках могут стоять фишки разных цветов,
    // поэтому для чужака (и на общей безопасной клетке) ячейка НЕ отключена —
    // можно встать, если есть место.
    const mover = playerStore.current;
    if (!mover) {
      return false; // нет ходящего игрока — ячейка не отключена
    }
    const places = cell.places.filter((p) => p !== null);
    if (places.length === 0) {
      return false; // ячейка свободна - не отключена
    }
    // Все фишки на ячейке принадлежат одному игроку (по правилам игры)
    const occupyingPlayer = places[0]!.player;
    // Отключена только своя стартовая клетка (safe = PlayerData своего игрока),
    // занятая собственной фишкой; общая безопасная клетка (safe === true) не блокирует.
    return (
      occupyingPlayer.ind === mover.ind && cell.safe !== true && isSafeCell(cell, occupyingPlayer)
    );
  };

  /**
   * Проверка, является ли ячейка заблокированной (барьер).
   * README п.9: барьер образуют две фишки ОДНОГО цвета на одной клетке — через него
   * нельзя ни пройти, ни встать. Две фишки РАЗНЫХ цветов образуют «мост» —
   * через мост можно пройти (но нельзя встать), поэтому он НЕ считается блоком.
   */
  const isCellBlocked = (cell: Cell): boolean => {
    const places = cell.places;
    // Если есть свободные места — это не барьер
    if (!places.every((p) => p !== null)) {
      return false;
    }
    // Ячейка полностью занята: барьер только при фишках одного цвета
    const firstColor = places[0]!.player;
    return places.every((p) => p.player.ind === firstColor.ind);
  };

  /**
   * Найти фишки игрока, образующие барьер (README п.8): две фишки одного цвета
   * на одной клетке, полностью занимающие её. База и дом не считаются барьером.
   */
  const getBarrierChips = (player: Player): Chip[] => {
    const chips: Chip[] = [];
    for (const chip of player.chips) {
      const cell = chip.cell;
      if (!cell || chip.finished) continue;
      if (cell.board.type === BoardType.base || cell.board.type === BoardType.home) continue;
      const occupied = cell.places.filter((p): p is Chip => p !== null);
      if (occupied.length < 2 || occupied.length !== cell.places.length) continue;
      if (!occupied.every((p) => p.player.ind === chip.player.ind)) continue;
      chips.push(chip);
    }
    return chips;
  };

  /**
   * README п.8: при дубле игрок обязан сдвинуть одну из фишек барьера,
   * если такое передвижение возможно.
   */
  const isBarrierMoveRequired = computed(() => {
    const player = playerStore.current;
    if (!player || !diceStore.isEquals) return false;
    return getBarrierChips(player).length > 0;
  });

  /**
   * Завершить текущий ход после перемещения:
   * - если ещё есть доступные ходы — WAIT_STEP;
   * - если есть право на дополнительный бросок (дубль) — WAIT_ROLL;
   * - иначе — автоматический переход хода (README п.13).
   */
  const advanceTurnAfterMove = () => {
    if (hasMovableChips.value) {
      stateId.value = GameStateEnum.WAIT_STEP;
    } else if (diceStore.isEquals) {
      prepareAddonRollDice();
      stateId.value = GameStateEnum.WAIT_ROLL;
    } else {
      debugLogPush('moveChip', 'Нет ходов → автопереход к следующему игроку (README п.13)', 'info');
      nextPlayer();
    }
  };

  /**
   * Результат проверки допустимости хода.
   */
  type MoveCheck = { ok: true } | { ok: false; reason: string };

  /**
   * Проверка допустимости хода вынесена из `moveChip`: UI может вызвать её заранее,
   * а `moveChip` использует как защитную проверку перед изменением состояния.
   */
  const checkMove = (chip: Chip, steps: number, targetCell: Cell): MoveCheck => {
    if (!getAvailableSteps().includes(steps)) {
      return { ok: false, reason: `Шаг ${steps} недоступен для фишки #${chip.id}` };
    }
    // README п.5: на остальных (кроме базы и дома) клетках не более двух фишек.
    // Нельзя поставить фишку на полностью занятую целевую ячейку (на барьер или мост).
    if (!targetCell.places.some((p) => p === null)) {
      return {
        ok: false,
        reason: `Нельзя встать на полностью занятую ячейку (README п.5) для фишки #${chip.id}`,
      };
    }
    return { ok: true };
  };

  /**
   * Списать использованный шаг.
   * Если шаг совпадает и с бонусом (+10/+20), и с суммой кубиков, приоритет отдаётся
   * кубикам — бонус сохраняется, чтобы его можно было применить отдельно.
   */
  const consumeStep = (steps: number) => {
    const unused = diceStore.unused;
    const matchesDice = unused.includes(steps);
    const matchesDiceSum = unused.length >= 2 && diceStore.unusedSum === steps;
    const bonusIndex = currentBonusSteps.value.indexOf(steps);

    if (bonusIndex !== -1 && !matchesDice && !matchesDiceSum) {
      // Используем бонусный шаг
      currentBonusSteps.value.splice(bonusIndex, 1);
      debugLogPush('moveChip', `Использован бонусный шаг +${steps}`, 'success', {
        steps,
        bonusType: steps === 20 ? 'capture' : 'finish',
      });
      return;
    }
    if (isPlusSevenActive.value && steps === 7) {
      // README п.6: шаг «+7» соответствует одному кубику дубля (используем его напрямую)
      const dieValue = diceStore.unused[0];
      if (dieValue !== undefined) {
        diceStore.used.push(dieValue);
      }
      debugLogPush('moveChip', `Использован кубик ${steps} (правило «+7»)`, 'info', { steps });
      return;
    }
    diceStore.use(steps);
    debugLogPush('moveChip', `Использован кубик ${steps}`, 'info', { steps });
  };

  /**
   * Переместить фишку на steps шагов с использованием соответствующего кубика.
   * Проверка хода — в `checkMove()`, списание шага — в `consumeStep()`.
   * @param chip Фишка
   * @param steps Количество шагов (должно соответствовать одному из доступных шагов)
   * @param targetCell Целевая ячейка
   */
  const moveChip = (chip: Chip, steps: number, targetCell: Cell): boolean => {
    const validation = checkMove(chip, steps, targetCell);
    if (!validation.ok) {
      debugLogPush('moveChip', validation.reason, 'error', {
        chipId: chip.id,
        steps,
        targetBoardType: targetCell.board.type,
      });
      return false;
    }
    // Списываем использованный шаг (кубик / сумма / бонус)
    consumeStep(steps);

    const target = targetCell;

    // README п.11: выход с базы на занятую стартовую клетку — «расплющивание»
    // (сбитые фишки уходят в базу, но бонус +20 не начисляется).
    const isBaseExit =
      chip.cell?.board.type === BoardType.base && target.board.type === BoardType.main;

    // Проверка на захват: если в целевой ячейке есть фишка другого игрока.
    // README п.9,10: съесть можно только одиночную фишку на НЕбезопасной клетке.
    // Безопасная клетка (общая или стартовая) защищает стоящую на ней фишку от захвата,
    // а клетка с несколькими фишками (мост/барьер) — полная, поэтому сюда не попадает
    // (проверка заполненности выше возвращает false до захвата).
    const otherChips = target.places.filter((p) => p && p.player.ind !== chip.player.ind);
    if (otherChips.length > 0) {
      const victim = otherChips[0]!;
      const captureAllowed = !isSafeCell(target, victim.player);
      if (captureAllowed) {
        // Отправляем чужие фишки на старт
        for (const otherChip of otherChips) {
          if (otherChip) {
            debugLogPush(
              'moveChip',
              `Захват! Фишка #${otherChip.id} (${otherChip.player.color}) отправлена на базу`,
              'success',
              { capturedChipId: otherChip.id, capturedColor: otherChip.player.color },
            );
            sendToStart(otherChip);
          }
        }
        // Бонус +20 за обычное сбивание, но НЕ за «расплющивание» (README п.11)
        if (isBaseExit) {
          debugLogPush(
            'moveChip',
            'Расплющивание при выходе с базы — бонус +20 не начисляется (README п.11)',
            'warning',
          );
        } else {
          addBonus(20);
          debugLogPush('moveChip', 'Бонус +20 за захват', 'success');
        }
      } else {
        debugLogPush(
          'moveChip',
          'Захват на безопасной ячейке не происходит (README п.9,10)',
          'warning',
        );
      }
    }

    // README п.4: если все 4 фишки игрока в базе и сумма кубиков равна 5,
    // выводятся сразу две фишки на стартовую клетку.
    const isBaseExitMove =
      chip.cell?.board.type === BoardType.base &&
      steps === 5 &&
      target.board.type === BoardType.main;
    const allChipsOnBaseBeforeMove =
      isBaseExitMove &&
      playerStore.players[chip.player.ind]!.chips.every(
        (c) => c.cell?.board.type === BoardType.base,
      );

    // Выполняем перемещение
    chip.go(target);

    // README п.4: при всех 4 фишках в базе и сумме 5 автоматически выводится вторая фишка.
    if (allChipsOnBaseBeforeMove) {
      const player = playerStore.players[chip.player.ind]!;
      const secondChip = player.chips.find(
        (c) => c !== chip && c.cell?.board.type === BoardType.base,
      );
      if (secondChip) {
        secondChip.go(target);
        debugLogPush(
          'moveChip',
          `README п.4: все 4 фишки в базе + сумма 5 — выведена вторая фишка #${secondChip.id}`,
          'success',
        );
      }
    }

    selectedChip.value = null;

    // README п.7: фиксируем использование дубля для хода (для правила трёх дублей).
    if (doublesCount.value >= 2) {
      secondDoubleUsedForMove.value = true;
      lastMovedChip.value = chip;
    }

    // Проверка на финиш
    let justFinished = false;
    if (target.board.type === BoardType.home && target.board.player?.ind === chip.player.ind) {
      const finishBoard = target.board;
      const lastCellIndex = finishBoard.cells.length - 1;
      if (finishBoard.cells.indexOf(target) === lastCellIndex) {
        chip.finish();
        justFinished = true;
        // 1.2 Бонус +10 за попадание в дом
        addBonus(10);
        debugLogPush('moveChip', `Фишка #${chip.id} финишировала! Бонус +10`, 'success', {
          chipId: chip.id,
        });
        checkWinner(chip.player);
      }
    }

    // README п.14: если игрок завершил все свои фишки, его ход заканчивается.
    if (stateId.value !== GameStateEnum.FINISH) {
      if (justFinished && playerStore.players[chip.player.ind]!.chips.every((c) => c.finished)) {
        nextPlayer();
      } else {
        advanceTurnAfterMove();
      }
    }

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
    // Проверить, не победил ли игрок (пополняет список winners в порядке финиша)
    const isWinner = playerStore.checkWinner(player as Player);
    if (isWinner === player) {
      debugLogPush(
        'checkWinner',
        `Игрок ${player.ind} (${player.color}) завершил партию, место: ${playerStore.winners.length}`,
        'success',
        { playerIndex: player.ind, place: playerStore.winners.length },
      );
      // README п.14: партия заканчивается, когда места распределены
      // (остался один игрок) или когда продолжают только ИИ.
      if (playerStore.isGameOver) {
        stateId.value = GameStateEnum.FINISH;
        debugLogPush(
          'checkWinner',
          `Партия завершена. Места: ${playerStore.places.map((p) => p.color).join(' > ')}`,
          'success',
        );
      }
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

  /**
   * Все легальные варианты хода текущего игрока.
   * Единый источник и для UI, и для ИИ — правила уже применены.
   */
  const getCandidateMoves = (): MoveCandidate[] => {
    const moves: MoveCandidate[] = [];
    for (const chip of getMovableChips()) {
      for (const steps of getPossibleStepsForChip(chip)) {
        for (const targetCell of findTargetCellVariants(chip.cell, steps)) {
          moves.push({ chip, steps, targetCell });
        }
      }
    }
    return moves;
  };

  /**
   * Данные для выбора хода ИИ: кандидаты, фишки соперников и проверка безопасности.
   */
  const buildAiView = (): AiView => {
    const player = playerStore.current!;
    const opponents = playerStore.activePlayers
      .filter((p) => p !== playerStore.current)
      .flatMap((p) => p.chips)
      .filter((chip) => !chip.finished);
    return {
      candidates: getCandidateMoves(),
      opponents,
      isSafeForMe: (cell) => isSafeCell(cell, player),
    };
  };

  /**
   * Игрок, который сейчас должен действовать (бросать кости или ходить).
   * На этапе SELECT_FIRST очередь определяется `firstRollPlayerIndex`, а не `currentIndex`.
   */
  const actingPlayerIndex = computed<PlayerIndex | undefined>(() =>
    stateId.value === GameStateEnum.SELECT_FIRST
      ? firstRollPlayerIndex.value
      : playerStore.currentIndex,
  );

  const actingPlayer = computed(() => {
    const index = actingPlayerIndex.value;
    return index === undefined ? undefined : playerStore.players[index];
  });

  /** Сейчас действует ИИ? */
  const isAiTurn = computed(() => actingPlayer.value?.ai === true);

  /**
   * Один шаг ИИ. Возвращает `true`, если действие выполнено (драйвер должен продолжить).
   * Выбор хода делегируется чистой функции `chooseMove`.
   */
  const aiActOnce = (): boolean => {
    if (stateId.value === GameStateEnum.FINISH) return false;
    const actor = actingPlayer.value;
    if (!actor?.ai) return false;

    if (stateId.value === GameStateEnum.SELECT_FIRST || stateId.value === GameStateEnum.WAIT_ROLL) {
      rollDice();
      return true;
    }

    if (stateId.value === GameStateEnum.WAIT_STEP) {
      const move = chooseMove(buildAiView());
      if (!move) {
        debugLogPush('aiActOnce', 'ИИ: нет доступных ходов — пропуск', 'warning');
        return false;
      }
      debugLogPush(
        'aiActOnce',
        `ИИ (${actor.color}): фишка #${move.chip.id} → ${move.steps} шаг(ов)`,
        'info',
      );
      if (!moveChip(move.chip, move.steps, move.targetCell)) {
        debugLogPush('aiActOnce', 'ИИ: ход отклонён правилами — пропуск', 'error');
        return false;
      }
      return true;
    }

    return false;
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
    newGame,
    stateId,
    state,
    //canRollDice,
    rollDice,
    onChipClick,
    //availableChipIds,
    highlightedCells,
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
    firstRollCandidates,
    // 1.3 Счётчик дублей
    doublesCount,
    // Debug
    debug,
    debugLogPush,
    clearDebugLog,
    // Внутренние функции, экспортированные для тестирования
    handleSelectFirstRoll,
    selectFirstPlayer,
    handleThreeDoubles,
    getAvailableSteps,
    getMovableChips,
    getMovableChipsForSteps,
    canMoveChip,
    isSafeCell,
    isCellBlocked,
    isCellDisabled,
    getBarrierChips,
    isBarrierMoveRequired,
    sendToStart,
    addBonus,
    checkWinner,
    canAddonRollDice,
    // ИИ
    getCandidateMoves,
    buildAiView,
    actingPlayerIndex,
    actingPlayer,
    isAiTurn,
    aiActOnce,
  };
});
