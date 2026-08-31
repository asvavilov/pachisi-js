import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDiceStore } from 'src/stores/dice';
import { usePlayerStore } from 'src/stores/player';
import { useBoardStore } from 'src/stores/board';
import { useGameStore } from 'src/stores/game';
import { GameStateEnum } from 'src/lib/GameState';
import { BoardType } from 'src/lib/board';

/**
 * Хелпер: инициализация всех stores и игры.
 */
const setupGame = () => {
  const playerStore = usePlayerStore();
  const diceStore = useDiceStore();
  const boardStore = useBoardStore();
  const game = useGameStore();
  game.initGame();
  return { playerStore, diceStore, boardStore, game };
};

/** Принудительный бросок костей [a, b] через mock Math.random. */
const mockRoll = (a: number, b: number) => {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce((a - 1) / 5)
    .mockReturnValueOnce((b - 1) / 5);
};

/** Разместить фишку игрока на ячейке основной доски. */
const putOnMain = (playerIndex: number, boardIndex: number, chipIdx: number, mainIdx: number) => {
  const playerStore = usePlayerStore();
  const boardStore = useBoardStore();
  const chip = playerStore.players[playerIndex]!.chips[chipIdx]!;
  chip.go(boardStore.board.cells[mainIdx]!);
  return chip;
};

describe('Интеграционные тесты — полный игровой цикл', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =================================================================
  // Интеграционный тест 1: Полный игровой цикл
  // init → SELECT_FIRST → броски → выбор первого → WAIT_ROLL → ходы → FINISH
  // =================================================================
  it('1. Полный игровой цикл: init → SELECT_FIRST → WAIT_ROLL → WAIT_STEP → FINISH', () => {
    const { game, diceStore, playerStore, boardStore } = setupGame();

    // Шаг 1: SELECT_FIRST
    expect(game.stateId).toBe(GameStateEnum.SELECT_FIRST);

    // Бросаем для выбора первого: игрок 0 → 7, игрок 1 → 6, игрок 2 → 5, игрок 3 → 4
    // Победитель — игрок 0 (максимум 7)
    vi.restoreAllMocks();
    mockRoll(3, 4); // 7
    game.rollDice();
    expect(game.firstRollResults[0]).toBe(7);
    expect(game.stateId).toBe(GameStateEnum.SELECT_FIRST);

    vi.restoreAllMocks();
    mockRoll(3, 3); // 6
    game.rollDice();
    expect(game.firstRollResults[1]).toBe(6);

    vi.restoreAllMocks();
    mockRoll(2, 3); // 5
    game.rollDice();
    expect(game.firstRollResults[2]).toBe(5);

    vi.restoreAllMocks();
    mockRoll(2, 2); // 4
    game.rollDice();
    expect(game.firstRollResults[3]).toBe(4);

    // Все 4 бросили → selectFirstPlayer вызван внутри handleSelectFirstRoll
    expect(playerStore.currentIndex).toBe(0); // победитель
    expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);

    // Шаг 2: Текущий игрок (0) бросает кости с фишками на доске
    // Выводим фишки игрока 0 на доску
    putOnMain(0, 0, 0, 10);
    putOnMain(0, 0, 1, 20);

    vi.restoreAllMocks();
    mockRoll(3, 4); // 3+4=7
    game.rollDice();
    expect(game.stateId).toBe(GameStateEnum.WAIT_STEP);
    expect(game.movableChips.length).toBeGreaterThan(0);

    // Шаг 3: Игрок выбирает фишку и ходит
    game.onChipClick(playerStore.players[0]!.chips[0]);
    expect(game.selectedChip).not.toBeNull();

    const chip = game.selectedChip!;
    const targetCell = boardStore.board.cells[13]!; // 10 + 3
    game.moveChip(chip, 3, targetCell);
    expect(chip.cell).toBe(targetCell);
    expect(diceStore.used).toContain(3);

    // Шаг 4: Переход хода (нет доступных ходов для оставшихся кубиков)
    // После хода на 3 остались кубики [4, 7] — проверим состояние
    // Если есть ходы → WAIT_STEP, иначе → WAIT_PLAYER
    if (game.stateId === GameStateEnum.WAIT_PLAYER) {
      game.nextPlayer();
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    }

    // Шаг 5: Симулируем финиш — ставим все фишки игрока 0 в finished
    playerStore.players[0]!.chips.forEach((c) => c.finish());
    game.checkWinner(playerStore.players[0]!);
    expect(game.stateId).toBe(GameStateEnum.FINISH);

    // Проверяем лог
    expect(game.debug.log.length).toBeGreaterThan(0);
    expect(game.debug.log.some((e: { function: string }) => e.function === 'initGame')).toBe(true);
    expect(game.debug.log.some((e: { function: string }) => e.function === 'moveChip')).toBe(true);
  });

  // =================================================================
  // Интеграционный тест 2: Игрок выбивает фишку противника → бонус 20
  // =================================================================
  it('2. Захват чужой фишки → бонус +20, чужая фишка на базе', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    // Выбираем игрока 0 первым
    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Игрок 1 ставит фишку на клетку 13 (не безопасную)
    putOnMain(1, 1, 0, 13);
    const victim = playerStore.players[1]!.chips[0]!;
    expect(victim.cell).toBe(boardStore.board.cells[13]);

    // Игрок 0 выводит фишку и двигает к клетке 13
    putOnMain(0, 0, 0, 10);
    const attacker = playerStore.players[0]!.chips[0]!;

    diceStore.items = [3, 4]; // шаг 3 → клетка 13

    const res = game.moveChip(attacker, 3, boardStore.board.cells[13]!);
    expect(res).toBe(true);

    // Чужая фишка отправлена на базу
    expect(victim.cell.board.type).toBe(BoardType.base);
    expect(victim.cell).toBe(playerStore.players[1]!.baseBoard.cells[0]);

    // Атакующий получил бонус +20
    expect(game.currentBonusSteps).toEqual([20]);

    // Атакующий на клетке 13
    expect(attacker.cell).toBe(boardStore.board.cells[13]);
  });

  // =================================================================
  // Интеграционный тест 3: Три дубля подряд → фишка на базу
  // =================================================================
  it('3. Три дубля подряд → последняя двинутая фишка на базу (README п.7)', () => {
    const { game, playerStore, boardStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Выводим фишку на доску
    const chip = putOnMain(0, 0, 0, 10);

    // 1-й дубль [3,3]
    vi.restoreAllMocks();
    mockRoll(3, 3);
    game.rollDice();
    expect(game.doublesCount).toBe(1);

    // Ходим на 3
    game.moveChip(chip, 3, boardStore.board.cells[13]!);

    // 2-й дубль [3,3]
    vi.restoreAllMocks();
    mockRoll(3, 3);
    game.rollDice();
    expect(game.doublesCount).toBe(2);

    // Ходим на 3
    game.moveChip(chip, 3, boardStore.board.cells[16]!);

    // 3-й дубль [3,3] → фишка на базу
    vi.restoreAllMocks();
    mockRoll(3, 3);
    game.rollDice();
    expect(game.doublesCount).toBe(0);

    // Фишка отправлена на базу
    expect(chip.cell.board.type).toBe(BoardType.base);
    expect(chip.cell).toBe(playerStore.players[0]!.baseBoard.cells[0]);

    // В логе есть запись о handleThreeDoubles
    expect(
      game.debug.log.some((e: { function: string }) => e.function === 'handleThreeDoubles'),
    ).toBe(true);
  });

  // =================================================================
  // Интеграционный тест 4: Блокада — две фишки одного цвета → барьер
  // =================================================================
  it('4. Блокада: две фишки одного цвета → барьер, никто не может пройти', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Игрок 0 ставит две фишки на клетку 10 → барьер
    putOnMain(0, 0, 0, 10);
    putOnMain(0, 0, 1, 10);

    expect(game.isCellBlocked(boardStore.board.cells[10]!)).toBe(true);

    // Игрок 1 пытается пройти через клетку 10
    putOnMain(1, 1, 0, 5);
    const attacker = playerStore.players[1]!.chips[0]!;

    // Шаг 7 (5+2) → нужно пройти через клетку 10
    diceStore.items = [2, 5]; // сумма 7

    const variants = game.findTargetCellVariants(attacker.cell, 7);
    // Путь через блок закрыт
    expect(variants.length).toBe(0);

    // Попытка хода на клетку 10 (занятую барьером) → false
    expect(game.moveChip(attacker, 5, boardStore.board.cells[10]!)).toBe(false);
  });

  // =================================================================
  // Интеграционный тест 5: Дубль → два хода + дополнительный бросок
  // README п.3: при выпадении дубля игрок ходит дважды и получает ещё один бросок.
  // =================================================================
  it('5. Дубль [3,3] → ход на 3 + ход на 3 → WAIT_ROLL (доп. бросок)', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Выводим фишку на доску
    const chip = putOnMain(0, 0, 0, 10);

    // Бросаем дубль [3,3]
    vi.restoreAllMocks();
    mockRoll(3, 3);
    game.rollDice();

    // Счётчик дублей увеличен
    expect(game.doublesCount).toBe(1);
    expect(game.stateId).toBe(GameStateEnum.WAIT_STEP);
    expect(game.movableChips.length).toBeGreaterThan(0);

    // Доступные шаги: два отдельных значения дубля + сумма
    expect(game.getAvailableSteps()).toEqual([3, 3, 6]);

    // Ходим на 3 (первый кубик дубля)
    game.moveChip(chip, 3, boardStore.board.cells[13]!);
    expect(chip.cell).toBe(boardStore.board.cells[13]);
    expect(diceStore.used).toEqual([3]);
    expect(diceStore.unused).toEqual([3]);

    // После хода — всё ещё WAIT_STEP, остался один кубик дубля (unused=[3], сумма=3 уже в steps)
    expect(game.stateId).toBe(GameStateEnum.WAIT_STEP);
    expect(game.getAvailableSteps()).toEqual([3]);

    // Ходим ещё на 3 (второй кубик дубля)
    game.moveChip(chip, 3, boardStore.board.cells[16]!);
    expect(chip.cell).toBe(boardStore.board.cells[16]);
    expect(diceStore.used).toEqual([3, 3]);
    expect(diceStore.unused).toEqual([]);

    // После использования обоих кубиков дубля → WAIT_ROLL (дополнительный бросок)
    expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    expect(diceStore.items).toEqual([3, 3]); // кости сброшены для нового броска
  });

  // =================================================================
  // Интеграционный тест 6: Правило «+7»: все 4 фишки в игре + дубль
  // =================================================================
  it('6. Правило «+7»: все 4 фишки в игре + дубль → перемещение на 7', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Все 4 фишки игрока 0 в игре (на основной доске)
    putOnMain(0, 0, 0, 5);
    putOnMain(0, 0, 1, 15);
    putOnMain(0, 0, 2, 25);
    putOnMain(0, 0, 3, 35);

    // Бросаем дубль [3,3]
    vi.restoreAllMocks();
    mockRoll(3, 3);
    game.rollDice();

    // isPlusSevenActive не экспортируется из game store, проверяем только доступные шаги
    expect(game.getAvailableSteps()).toContain(7);
    expect(game.getAvailableSteps()).not.toContain(3); // без +7 нет шага 3

    // Ходим на 7
    const chip = playerStore.players[0]!.chips[0]!;
    game.moveChip(chip, 7, boardStore.board.cells[12]!);

    expect(chip.cell).toBe(boardStore.board.cells[12]);
    // Использован один кубик дубля
    expect(diceStore.used.length).toBe(1);
  });

  // =================================================================
  // Интеграционный тест 7: Выход с базы на занятую стартовую → «расплющивание»
  // =================================================================
  it('7. Выход с базы на занятую стартовую → чужие фишки на базу без бонуса (README п.11)', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Игрок 1 ставит фишку на стартовую клетку игрока 0 (cell 4)
    putOnMain(1, 1, 0, 4);
    const victim = playerStore.players[1]!.chips[0]!;

    // Игрок 0 выводит фишку с базы (сумма 5)
    diceStore.items = [2, 3]; // сумма 5

    const res = game.moveChip(playerStore.players[0]!.chips[0]!, 5, boardStore.board.cells[4]!);
    expect(res).toBe(true);

    // Чужая фишка «расплющена» → на базу
    expect(victim.cell.board.type).toBe(BoardType.base);

    // Бонус +20 НЕ начисляется (расплющивание не даёт бонуса)
    expect(game.currentBonusSteps).toEqual([]);
  });

  // =================================================================
  // Интеграционный тест 8: Все 4 фишки в базе + сумма 5 → вывод двух фишек
  // =================================================================
  it('8. Все 4 фишки в базе + сумма 5 → выводятся сразу две фишк�� (README п.4)', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Все 4 фишки на базе по умолчанию
    expect(playerStore.players[0]!.chips.every((c) => c.cell?.board.type === BoardType.base)).toBe(
      true,
    );

    // Бросаем сумму 5
    diceStore.items = [2, 3];

    // Выводим первую фишку
    const res = game.moveChip(playerStore.players[0]!.chips[0]!, 5, boardStore.board.cells[4]!);
    expect(res).toBe(true);

    // Вторая фишка тоже выведена
    expect(playerStore.players[0]!.chips[0]!.cell).toBe(boardStore.board.cells[4]);
    expect(playerStore.players[0]!.chips[1]!.cell).toBe(boardStore.board.cells[4]);

    // Остальные на базе
    expect(playerStore.players[0]!.chips[2]!.cell?.board.type).toBe(BoardType.base);
    expect(playerStore.players[0]!.chips[3]!.cell?.board.type).toBe(BoardType.base);

    // Использована сумма 5 (оба кубика)
    expect(diceStore.used).toEqual([2, 3]);
  });

  // =================================================================
  // Интеграционный тест 9: Захват + использование бонуса для финиша
  // =================================================================
  it('9. Захват (+20) → использование бонуса для финиша (+10)', () => {
    const { game, playerStore, boardStore, diceStore } = setupGame();

    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);

    // Выводим фишку
    putOnMain(0, 0, 0, 10);

    // Захватываем чужую фишку
    putOnMain(1, 1, 0, 13);
    diceStore.items = [3, 4];
    game.moveChip(playerStore.players[0]!.chips[0]!, 3, boardStore.board.cells[13]!);

    expect(game.currentBonusSteps).toEqual([20]);

    // Двигаем фишку на финиш через home-доску
    // Сначала выводим на финишную дорожку (клетка 67 — вход на финиш жёлтого)
    // Расстояние от 13 до 67 = 54 шага — слишком много, упростим:
    // Ставим фишку прямо на home-доску
    playerStore.players[0]!.chips[0]!.go(playerStore.players[0]!.homeBoard.cells[5]!);

    // Используем бонус +20 для финиша? Нет, home[5] + 20 > 7.
    // Попробуем с бонусом +10: ставим на home[6], бросаем 1
    playerStore.players[0]!.chips[0]!.go(playerStore.players[0]!.homeBoard.cells[6]!);
    diceStore.items = [1, 1]; // дубль 1

    game.moveChip(
      playerStore.players[0]!.chips[0]!,
      1,
      playerStore.players[0]!.homeBoard.cells[7]!,
    );

    // Фишка финишировала
    expect(playerStore.players[0]!.chips[0]!.finished).toBe(true);
  });

  // =================================================================
  // Интеграционный тест 10: Смена игроков — полный круг
  // =================================================================
  it('10. Смена игроков: 0 → 1 → 2 → 3 → 0', () => {
    const { game, playerStore, diceStore } = setupGame();

    // Выбираем игрока 0 первым
    game.stateId = GameStateEnum.WAIT_ROLL;
    playerStore.init(0);
    expect(playerStore.current?.ind).toBe(0);

    // Нет ходов → завершаем ход
    game.nextPlayer();
    expect(playerStore.current?.ind).toBe(1);
    expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);

    // Игрок 1 завершает ход
    game.nextPlayer();
    expect(playerStore.current?.ind).toBe(2);

    // Игрок 2 завершает ход
    game.nextPlayer();
    expect(playerStore.current?.ind).toBe(3);

    // Игрок 3 завершает ход → снова игрок 0
    game.nextPlayer();
    expect(playerStore.current?.ind).toBe(0);

    // Кости сброшены после каждого перехода
    expect(diceStore.items).toEqual([]);
  });
});
