import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toRaw } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useDiceStore } from 'src/stores/dice';
import { usePlayerStore } from 'src/stores/player';
import { useBoardStore } from 'src/stores/board';
import { useGameStore } from 'src/stores/game';
import { GameStateEnum } from 'src/lib/GameState';
import type { Player } from 'src/lib/player';
import { BoardType, type Board } from 'src/lib/board';

/**
 * Хелперы игрового store-теста.
 * Каждый тест получает свежий Pinia (setActivePinia в beforeEach),
 * initGame() приводит игру в состояние SELECT_FIRST.
 */
const setupGame = () => {
  const playerStore = usePlayerStore();
  const diceStore = useDiceStore();
  const boardStore = useBoardStore();
  const game = useGameStore();
  game.initGame();
  return { playerStore, diceStore, boardStore, game };
};

/** Принудительный бросок костей [a, b] (Math.round((v-1)/5*5+1) = v). */
const mockRoll = (a: number, b: number) => {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce((a - 1) / 5)
    .mockReturnValueOnce((b - 1) / 5);
};

/** Разместить фишку игрока на ячейке основной доски. */
const putOnMain = (player: Player, board: Board, chipIdx: number, mainIdx: number) => {
  const chip = player.chips[chipIdx]!;
  chip.go(board.cells[mainIdx]!);
  return chip;
};

describe('game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =================================================================
  // 4.4.1 Инициализация
  // =================================================================
  describe('initGame', () => {
    it('устанавливает stateId=SELECT_FIRST', () => {
      const { game } = setupGame();
      expect(game.stateId).toBe(GameStateEnum.SELECT_FIRST);
    });

    it('сбрасывает dice', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [3, 4];
      game.initGame();
      expect(diceStore.items).toEqual([]);
    });

    it('сбрасывает doublesCount', () => {
      const { game } = setupGame();
      game.doublesCount = 3;
      game.initGame();
      expect(game.doublesCount).toBe(0);
    });

    it('сбрасывает firstRollResults', () => {
      const { game } = setupGame();
      game.firstRollResults = { 0: 1, 1: 2, 2: 3, 3: 4 };
      game.initGame();
      expect(game.firstRollResults).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
    });
  });

  // =================================================================
  // 4.4.2 Выбор первого игрока (SELECT_FIRST)
  // =================================================================
  describe('SELECT_FIRST', () => {
    it('rollDice() в SELECT_FIRST обрабатывает выбор первого (handleSelectFirstRoll)', () => {
      const { game } = setupGame();
      mockRoll(3, 4); // сумма 7
      game.rollDice();
      expect(game.firstRollResults[0]).toBe(7);
    });

    it('handleSelectFirstRoll() сохраняет результат броска', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [2, 3]; // сумма 5
      game.handleSelectFirstRoll();
      expect(game.firstRollResults[0]).toBe(5);
    });

    it('handleSelectFirstRoll() переключает на следующего игрока', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [2, 3];
      game.handleSelectFirstRoll();
      expect(game.firstRollPlayerIndex).toBe(1);
    });

    it('selectFirstPlayer() выбирает игрока с наибольшим броском (README п.2)', () => {
      const { game, playerStore } = setupGame();
      game.firstRollResults = { 0: 3, 1: 7, 2: 5, 3: 4 };
      game.selectFirstPlayer();
      expect(playerStore.currentIndex).toBe(1);
    });

    it('selectFirstPlayer() переходит в WAIT_ROLL', () => {
      const { game } = setupGame();
      game.firstRollResults = { 0: 3, 1: 7, 2: 5, 3: 4 };
      game.selectFirstPlayer();
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });

    it('Крайний случай: все 4 игрока выбросили одинаково — переброс всех', () => {
      const { game } = setupGame();
      game.firstRollResults = { 0: 2, 1: 2, 2: 2, 3: 2 };
      game.selectFirstPlayer();
      expect(game.stateId).toBe(GameStateEnum.SELECT_FIRST);
      expect(game.firstRollResults).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
      expect(game.firstRollPlayerIndex).toBe(0);
    });

    it('при ничье — перебрасывают только кандидатов', () => {
      const { game, playerStore, diceStore } = setupGame();
      // После первого круга ничья между игроками 1 и 2
      game.firstRollResults = { 0: 5, 1: 7, 2: 7, 3: 4 };
      game.selectFirstPlayer();
      expect(game.stateId).toBe(GameStateEnum.SELECT_FIRST);
      expect(game.firstRollCandidates).toEqual([1, 2]);
      expect(game.firstRollPlayerIndex).toBe(1);

      // Игрок 1 перебрасывает (сумма 8)
      diceStore.items = [5, 3];
      game.handleSelectFirstRoll();
      expect(game.firstRollResults[1]).toBe(8);
      // Следующий — игрок 2 (не 0 и не 3)
      expect(game.firstRollPlayerIndex).toBe(2);

      // Игрок 2 перебрасывает (сумма 3)
      diceStore.items = [1, 2];
      game.handleSelectFirstRoll();
      expect(game.firstRollResults[2]).toBe(3);
      // Победитель — игрок 1
      expect(playerStore.currentIndex).toBe(1);
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });

    it('2 игрока выбросили максимум — перебрасывают только их', () => {
      const { game, playerStore, diceStore } = setupGame();
      game.firstRollResults = { 0: 4, 1: 7, 2: 7, 3: 3 };
      game.selectFirstPlayer();
      expect(game.stateId).toBe(GameStateEnum.SELECT_FIRST);
      // Перебрасывают только игроков 1 и 2
      expect(game.firstRollCandidates).toEqual([1, 2]);
      expect(game.firstRollPlayerIndex).toBe(1);

      // Игрок 1 перебрасывает (сумма 9)
      diceStore.items = [4, 5];
      game.handleSelectFirstRoll();
      expect(game.firstRollResults[1]).toBe(9);
      // Следующий — игрок 2, а не 0/3
      expect(game.firstRollPlayerIndex).toBe(2);

      // Игрок 2 перебрасывает (сумма 4)
      diceStore.items = [2, 2];
      game.handleSelectFirstRoll();
      // Победитель — игрок 1
      expect(playerStore.currentIndex).toBe(1);
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });
  });

  // =================================================================
  // 4.4.3 Бросок костей и дубли
  // =================================================================
  describe('rollDice и дубли', () => {
    it('rollDice() в WAIT_ROLL обновляет dice', () => {
      const { game, diceStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      mockRoll(3, 4);
      game.rollDice();
      expect(diceStore.items.length).toBe(2);
      expect(diceStore.items.every((v) => v >= 1 && v <= 6)).toBe(true);
    });

    it('rollDice() при дубле увеличивает doublesCount', () => {
      const { game } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      mockRoll(3, 3);
      game.rollDice();
      expect(game.doublesCount).toBe(1);
    });

    it('rollDice() при 3 дублях подряд — срабатывает handleThreeDoubles', () => {
      const { game } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      mockRoll(3, 3);
      game.rollDice();
      expect(game.doublesCount).toBe(1);
      vi.restoreAllMocks();
      mockRoll(3, 3);
      game.rollDice();
      expect(game.doublesCount).toBe(2);
      vi.restoreAllMocks();
      mockRoll(3, 3);
      game.rollDice();
      // Третий дубль обработан, счётчик сброшен
      expect(game.doublesCount).toBe(0);
      expect(
        game.debug.log.some((e: { function: string }) => e.function === 'handleThreeDoubles'),
      ).toBe(true);
    });

    it('rollDice() при дубле и hasMovableChips → WAIT_STEP', () => {
      const { game, playerStore, boardStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      mockRoll(3, 3);
      game.rollDice();
      expect(game.stateId).toBe(GameStateEnum.WAIT_STEP);
    });

    it('rollDice() при дубле и !hasMovableChips → WAIT_ROLL (доп. бросок)', () => {
      const { game } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      mockRoll(3, 3);
      game.rollDice();
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });

    it('rollDice() без дубля и hasMovableChips → WAIT_STEP', () => {
      const { game, playerStore, boardStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      mockRoll(3, 4);
      game.rollDice();
      expect(game.stateId).toBe(GameStateEnum.WAIT_STEP);
    });

    it('rollDice() без дубля и !hasMovableChips → WAIT_PLAYER', () => {
      const { game } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      mockRoll(3, 4);
      game.rollDice();
      expect(game.stateId).toBe(GameStateEnum.WAIT_PLAYER);
    });

    it('Крайний случай: 3 дубля подряд, но нет фишек для отправки — не падает', () => {
      const { game, playerStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      playerStore.players[0]!.chips.forEach((c) => c.finish());
      expect(() => {
        for (let i = 0; i < 3; i++) {
          vi.restoreAllMocks();
          mockRoll(3, 3);
          game.rollDice();
        }
      }).not.toThrow();
      expect(game.doublesCount).toBe(0);
    });

    it('Крайний случай: дубль, но нет доступных ходов → WAIT_ROLL', () => {
      const { game } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      mockRoll(3, 3);
      game.rollDice();
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });

    it('Крайний случай: 3 дубля подряд, но второй НЕ использован для хода → фишка в базу НЕ отправляется (README п.7)', () => {
      const { game, playerStore, boardStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);

      // Первый дубль → используется для хода (не считается как «второй дубль»)
      vi.restoreAllMocks();
      mockRoll(3, 3);
      game.rollDice();
      expect(game.doublesCount).toBe(1);
      game.moveChip(chip, 3, boardStore.board.cells[13]!);
      const posAfterFirstMove = chip.cell;

      // Второй дубль выпал, но НЕ используется для хода
      vi.restoreAllMocks();
      mockRoll(3, 3);
      game.rollDice();
      expect(game.doublesCount).toBe(2);

      // Третий дубль: т.к. второй не был использован для хода, фишка в базу НЕ отправляется (README п.7)
      vi.restoreAllMocks();
      mockRoll(3, 3);
      game.rollDice();
      expect(game.doublesCount).toBe(0);
      expect(chip.cell).toBe(posAfterFirstMove);
      expect(chip.cell).not.toBe(playerStore.players[0]!.baseBoard.cells[0]);
      expect(
        game.debug.log.some(
          (e: { function: string; message: string }) =>
            e.function === 'handleThreeDoubles' &&
            e.message.includes('не был использован для хода'),
        ),
      ).toBe(true);
    });
  });

  // =================================================================
  // 4.4.4 Доступные ходы (getAvailableSteps, getMovableChips)
  // =================================================================
  describe('getAvailableSteps / getMovableChips', () => {
    it('getAvailableSteps() возвращает unused кубики', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [3, 4];
      const steps = game.getAvailableSteps();
      expect(steps).toContain(3);
      expect(steps).toContain(4);
    });

    it('getAvailableSteps() включает сумму если оба не использованы', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [3, 4];
      expect(game.getAvailableSteps()).toContain(7);
    });

    it('getAvailableSteps() включает бонусы', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [3, 4];
      game.currentBonusSteps = [10];
      expect(game.getAvailableSteps()).toContain(10);
    });

    it('getAvailableSteps() пустой если нет кубиков', () => {
      const { game } = setupGame();
      expect(game.getAvailableSteps()).toEqual([]);
    });

    it('getMovableChips() возвращает фишки, которые могут ходить', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      const movable = game.getMovableChips();
      expect(movable).toContain(playerStore.players[0]!.chips[0]);
    });

    it('getMovableChips() не дублирует фишки', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      const movable = game.getMovableChips();
      expect(movable.filter((c) => c === playerStore.players[0]!.chips[0]).length).toBe(1);
    });

    it('getPossibleStepsForChip() возвращает шаги для фишки', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      const steps = game.getPossibleStepsForChip(playerStore.players[0]!.chips[0]!);
      expect(steps).toEqual([3, 4, 7]);
    });

    it('Крайний случай: [3,4] → steps=[3,4,7]', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [3, 4];
      expect(game.getAvailableSteps()).toEqual([3, 4, 7]);
    });

    it('Крайний случай: с бонусом 10 → steps=[3,4,7,10]', () => {
      const { game, diceStore } = setupGame();
      diceStore.items = [3, 4];
      game.currentBonusSteps = [10];
      expect(game.getAvailableSteps()).toEqual([3, 4, 7, 10]);
    });

    it('правило «+7»: все 4 фишки в игре + дубль → шаг 7 (README п.6)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      // Все 4 фишки текущего игрока (0) в игре — на основной доске
      for (let i = 0; i < 4; i++) {
        putOnMain(playerStore.players[0]!, boardStore.board, i, 10 + i * 5);
      }
      diceStore.items = [3, 3]; // дубль
      expect(game.getAvailableSteps()).toContain(7);
    });

    it('без «+7»: в базе есть фишка → дубль даёт свои значения (README п.6)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      // Только 3 фишки в игре, четвёртая остаётся на базе → правило «+7» не действует
      for (let i = 0; i < 3; i++) {
        putOnMain(playerStore.players[0]!, boardStore.board, i, 10 + i * 5);
      }
      diceStore.items = [3, 3];
      // Дубль без правила «+7» даёт свои значения (каждый кубик + сумма)
      expect(game.getAvailableSteps()).toEqual([3, 3, 6]);
    });
  });

  // =================================================================
  // 4.4.5 Движение по доске (findTargetCellVariants)
  // =================================================================
  describe('findTargetCellVariants', () => {
    it('из base с steps=5 → выходная ячейка', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      const baseCell = playerStore.players[0]!.baseBoard.cells[0]!;
      const variants = game.findTargetCellVariants(baseCell, 5);
      expect(variants).toContain(boardStore.board.cells[4]);
    });

    it('из base с steps≠5 → пусто', () => {
      const { game, playerStore } = setupGame();
      playerStore.init(0);
      const baseCell = playerStore.players[0]!.baseBoard.cells[0]!;
      expect(game.findTargetCellVariants(baseCell, 3)).toEqual([]);
    });

    it('из base когда выход заблокирован → пусто', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      // Барьер из 2 фишек игрока 1 на стартовой ячейке игрока 0
      putOnMain(playerStore.players[1]!, boardStore.board, 0, 4);
      putOnMain(playerStore.players[1]!, boardStore.board, 1, 4);
      const baseCell = playerStore.players[0]!.baseBoard.cells[0]!;
      expect(game.findTargetCellVariants(baseCell, 5)).toEqual([]);
    });

    it('из base когда выход занят своей фишкой → пусто', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 1, 4);
      const baseCell = playerStore.players[0]!.baseBoard.cells[0]!;
      expect(game.findTargetCellVariants(baseCell, 5)).toEqual([]);
    });

    it('по main доске — обычное движение', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 3);
      expect(variants).toContain(boardStore.board.cells[13]);
    });

    it('по main — остановка на пустой безопасной/стартовой клетке → возможно (README п.9)', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 8);
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 3);
      expect(variants).toContain(boardStore.board.cells[11]);
    });

    it('по main — проход через блок → пусто', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 8);
      putOnMain(playerStore.players[1]!, boardStore.board, 0, 11);
      putOnMain(playerStore.players[1]!, boardStore.board, 1, 11);
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 3);
      expect(variants.length).toBe(0);
    });

    it('по main — поворот на home (с точки входа)', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 67); // вход на финиш жёлтого
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 4);
      expect(variants).toContain(playerStore.players[0]!.homeBoard.cells[3]);
    });

    it('по home — движение внутри', () => {
      const { game, playerStore } = setupGame();
      const chip = playerStore.players[0]!.chips[0]!;
      chip.go(playerStore.players[0]!.homeBoard.cells[2]!);
      const variants = game.findTargetCellVariants(chip.cell, 2);
      expect(variants).toContain(playerStore.players[0]!.homeBoard.cells[4]);
    });

    it('по home — выход за пределы → пусто', () => {
      const { game, playerStore } = setupGame();
      const chip = playerStore.players[0]!.chips[0]!;
      chip.go(playerStore.players[0]!.homeBoard.cells[6]!);
      expect(game.findTargetCellVariants(chip.cell, 5)).toEqual([]);
    });

    it('по home — блок на пути → пусто', () => {
      const { game, playerStore } = setupGame();
      playerStore.init(0);
      const home = playerStore.players[0]!.homeBoard;
      // Барьер на cell[2] финишной дорожки
      playerStore.players[0]!.chips[1]!.go(home.cells[2]!);
      playerStore.players[0]!.chips[2]!.go(home.cells[2]!);
      playerStore.players[0]!.chips[0]!.go(home.cells[0]!);
      const variants = game.findTargetCellVariants(home.cells[0]!, 4);
      expect(variants.length).toBe(0);
    });

    it('с точки входа на home (шаги от входа)', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 67);
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 2);
      expect(variants).toContain(playerStore.players[0]!.homeBoard.cells[1]);
    });

    it('Крайний случай: движение через всю доску (зацикливание)', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 65);
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 5);
      expect(variants).toContain(boardStore.board.cells[2]);
    });

    it('Крайний случай: steps=0 → пусто или текущая ячейка', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      const cell = playerStore.players[0]!.chips[0]!.cell;
      const variants = game.findTargetCellVariants(cell, 0);
      expect(variants.length === 0 || variants.includes(cell)).toBe(true);
    });

    it('Крайний случай: steps > totalCells — корректный modulo', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 70);
      expect(variants).toContain(boardStore.board.cells[12]);
    });

    it('движение от i_begin к i_end по возрастанию индексов (против часовой стрелки)', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 4); // i_begin жёлтого
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 17);
      expect(variants).toContain(boardStore.board.cells[21]);
    });

    it('проход через мост (2 фишки разных цветов, не барьер) → возможно (README п.9)', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 8);
      // Мост: две фишки РАЗНЫХ цветов на безопасной клетке 11 (не барьер)
      putOnMain(playerStore.players[1]!, boardStore.board, 0, 11);
      putOnMain(playerStore.players[2]!, boardStore.board, 0, 11);
      // Шаг 5 с клетки 8 → цель 13; клетка 11 — промежуточная (через неё проходит путь)
      const variants = game.findTargetCellVariants(playerStore.players[0]!.chips[0]!.cell, 5);
      expect(variants).toContain(boardStore.board.cells[13]);
    });
    it('из base при всех 4 фишках в базе и сумме 5 → вывод двух фишек (README п.4)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const player = playerStore.players[0]!;
      // По умолчанию все 4 фишки игрока 0 находятся в базе
      expect(player.chips.every((c) => c.cell?.board.type === BoardType.base)).toBe(true);

      diceStore.items = [2, 3]; // сумма 5 → выход с базы
      const baseCell = player.baseBoard.cells[0]!;
      const exitCell = boardStore.board.cells[4]!; // стартовая ячейка игрока 0

      // Выходная ячейка доступна из базы (можно вывести фишку)
      expect(game.findTargetCellVariants(baseCell, 5)).toContain(exitCell);

      // Ход по сумме 5 при всех 4 фишках в базе выводит СРАЗУ две фишки на стартовую
      const res = game.moveChip(player.chips[0]!, 5, exitCell);
      expect(res).toBe(true);
      expect(player.chips[0]!.cell).toBe(exitCell);
      expect(player.chips[1]!.cell).toBe(exitCell);
      // Остальные фишки остаются в базе
      expect(player.chips[2]!.cell?.board.type).toBe(BoardType.base);
      expect(player.chips[3]!.cell?.board.type).toBe(BoardType.base);
      // Использована сумма 5 (оба кубика [2,3])
      expect(diceStore.used).toEqual([2, 3]);
    });
  });

  // =================================================================
  // 4.4.6 Перемещение фишки (moveChip)
  // =================================================================
  describe('moveChip', () => {
    it('использует соответствующий кубик', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      const res = game.moveChip(playerStore.players[0]!.chips[0]!, 3, boardStore.board.cells[13]!);
      expect(res).toBe(true);
      expect(diceStore.used).toEqual([3]);
    });

    it('использует бонусный шаг', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      game.currentBonusSteps = [10];
      const res = game.moveChip(playerStore.players[0]!.chips[0]!, 10, boardStore.board.cells[20]!);
      expect(res).toBe(true);
      expect(game.currentBonusSteps).toEqual([]);
    });

    it('захватывает чужую фишку → sendToStart + бонус 20', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      const victim = putOnMain(playerStore.players[1]!, boardStore.board, 0, 13);
      diceStore.items = [3, 4];
      const res = game.moveChip(chip, 3, boardStore.board.cells[13]!);
      expect(res).toBe(true);
      expect(victim.cell).toBe(playerStore.players[1]!.baseBoard.cells[0]);
      expect(game.currentBonusSteps).toEqual([20]);
    });

    it('попадание в последнюю ячейку home → finish + бонус 10', () => {
      const { game, playerStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = playerStore.players[0]!.chips[0]!;
      chip.go(playerStore.players[0]!.homeBoard.cells[6]!);
      diceStore.items = [1, 4];
      const res = game.moveChip(chip, 1, playerStore.players[0]!.homeBoard.cells[7]!);
      expect(res).toBe(true);
      expect(chip.finished).toBe(true);
      expect(game.currentBonusSteps).toEqual([10]);
    });

    it('после хода с доступными ходами → WAIT_STEP', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      game.moveChip(chip, 3, boardStore.board.cells[13]!);
      expect(game.stateId).toBe(GameStateEnum.WAIT_STEP);
    });

    it('после хода с дублем (без оставшихся ходов) → WAIT_ROLL', () => {
      const { game, playerStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = playerStore.players[0]!.chips[0]!;
      chip.go(playerStore.players[0]!.homeBoard.cells[4]!);
      diceStore.items = [3, 3];
      game.moveChip(chip, 3, playerStore.players[0]!.homeBoard.cells[7]!);
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });

    it('после хода без доп. ходов → WAIT_PLAYER', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      // Ход на сумму 7 использует оба кубика
      game.moveChip(chip, 7, boardStore.board.cells[17]!);
      expect(game.stateId).toBe(GameStateEnum.WAIT_PLAYER);
    });

    it('с недоступным steps → false', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      expect(game.moveChip(chip, 5, boardStore.board.cells[15]!)).toBe(false);
    });

    it('финиш не в последнюю ячейку home — без бонуса', () => {
      const { game, playerStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = playerStore.players[0]!.chips[0]!;
      chip.go(playerStore.players[0]!.homeBoard.cells[3]!);
      diceStore.items = [2, 5];
      game.moveChip(chip, 2, playerStore.players[0]!.homeBoard.cells[5]!);
      expect(chip.finished).toBe(false);
      expect(game.currentBonusSteps).toEqual([]);
    });

    it('выход на занятую стартовую («расплющивание») → фишки на базу БЕЗ бонуса +20 (README п.11)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      // Одна фишка уже в игре, чтобы НЕ сработало правило п.4 (вывод двух фишек)
      putOnMain(playerStore.players[0]!, boardStore.board, 1, 30);
      // На стартовой клетке игрока 0 (cell 4) стоит чужая фишка
      const victim = putOnMain(playerStore.players[1]!, boardStore.board, 0, 4);
      const exitCell = boardStore.board.cells[4]!;
      diceStore.items = [2, 3]; // сумма 5 → выход с базы

      const res = game.moveChip(playerStore.players[0]!.chips[0]!, 5, exitCell);
      expect(res).toBe(true);
      // Чужая фишка «расплющена» → на базу
      expect(victim.cell).toBe(playerStore.players[1]!.baseBoard.cells[0]);
      // Бонус +20 НЕ начисляется
      expect(game.currentBonusSteps).toEqual([]);
      expect(playerStore.players[0]!.chips[0]!.cell).toBe(exitCell);
    });

    it('несколько фишек на ячейке (мост/барьер) → захват не происходит (README п.10)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      // Две фишки разных цветов на клетке 13 → мост (клетка полная)
      const victimA = putOnMain(playerStore.players[1]!, boardStore.board, 0, 13);
      const victimB = putOnMain(playerStore.players[2]!, boardStore.board, 0, 13);
      diceStore.items = [3, 4];

      expect(game.moveChip(chip, 3, boardStore.board.cells[13]!)).toBe(false);
      // Фишка не сдвинута, кубик не потрачен
      expect(chip.cell).toBe(boardStore.board.cells[10]);
      expect(diceStore.used).toEqual([]);
      // Захвата не произошло — обе чужие фишки остаются на месте
      expect(victimA.cell).toBe(boardStore.board.cells[13]);
      expect(victimB.cell).toBe(boardStore.board.cells[13]);
      expect(game.currentBonusSteps).toEqual([]);
    });

    it('захват на безопасной ячейке не происходит (README п.9,10)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 8);
      // Общая безопасная клетка 11 занята чужой фишкой
      const victim = putOnMain(playerStore.players[1]!, boardStore.board, 0, 11);
      diceStore.items = [3, 4];

      const res = game.moveChip(chip, 3, boardStore.board.cells[11]!);
      expect(res).toBe(true);
      // Фишка встала на безопасную клетку, но чужая не съедена
      expect(chip.cell).toBe(boardStore.board.cells[11]);
      expect(victim.cell).toBe(boardStore.board.cells[11]);
      expect(game.currentBonusSteps).toEqual([]);
    });

    it('обязательный ход: доступен только один вариант → он используется (README п.3)', () => {
      const { game, playerStore, diceStore } = setupGame();
      playerStore.init(0);
      const chip = playerStore.players[0]!.chips[0]!;
      // С home[6] только шаг 1 приводит к home[7] (финиш); 4 и 5 выходят за пределы
      chip.go(playerStore.players[0]!.homeBoard.cells[6]!);
      diceStore.items = [1, 4];

      // Доступен единственный вариант хода
      expect(game.getPossibleStepsForChip(chip)).toEqual([1]);

      const res = game.moveChip(chip, 1, playerStore.players[0]!.homeBoard.cells[7]!);
      expect(res).toBe(true);
      expect(chip.finished).toBe(true);
    });
    it('«+7»: дубль при всех фишках в игре → перемещение на 7 (README п.6)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      // Все 4 фишки в игре → правило «+7» активно
      for (let i = 0; i < 4; i++) {
        putOnMain(playerStore.players[0]!, boardStore.board, i, 10 + i * 5);
      }
      const chip = playerStore.players[0]!.chips[0]!;
      diceStore.items = [3, 3]; // дубль
      const res = game.moveChip(chip, 7, boardStore.board.cells[17]!);
      expect(res).toBe(true);
      expect(chip.cell).toBe(boardStore.board.cells[17]);
      // Использован один кубик дубля
      expect(diceStore.used.length).toBe(1);
    });
    it('третья фишка на клетку с двумя фишками → false (README п.5)', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      playerStore.init(0);
      // Две фишки текущего игрока уже на клетке 13
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 13);
      putOnMain(playerStore.players[0]!, boardStore.board, 1, 13);
      // Третья фишка ходит с клетки 10 на клетку 13 (шаг 3)
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 2, 10);
      diceStore.items = [3, 4];
      expect(game.moveChip(chip, 3, boardStore.board.cells[13]!)).toBe(false);
      // Кубик не потрачен, фишка не перемещена
      expect(diceStore.used).toEqual([]);
      expect(chip.cell).toBe(boardStore.board.cells[10]);
    });
  });

  // =================================================================
  // 4.4.7 Проверки безопасности и блоков
  // =================================================================
  describe('isSafeCell / isCellBlocked / isCellDisabled', () => {
    it('isSafeCell() с safe=true → true', () => {
      const { game, boardStore } = setupGame();
      expect(game.isSafeCell(boardStore.board.cells[11]!)).toBe(true);
    });

    it('isSafeCell() с safe=PlayerData для своего игрока → true', () => {
      const { game, boardStore, playerStore } = setupGame();
      playerStore.init(0);
      expect(game.isSafeCell(boardStore.board.cells[4]!, playerStore.players[0] as never)).toBe(
        true,
      );
    });

    it('isSafeCell() с safe=PlayerData для чужого игрока → false', () => {
      const { game, boardStore, playerStore } = setupGame();
      playerStore.init(0);
      expect(game.isSafeCell(boardStore.board.cells[4]!, playerStore.players[1] as never)).toBe(
        false,
      );
    });

    it('isSafeCell() с safe=false → false', () => {
      const { game, boardStore, playerStore } = setupGame();
      playerStore.init(0);
      expect(game.isSafeCell(boardStore.board.cells[5]!, playerStore.players[0] as never)).toBe(
        false,
      );
    });

    it('isCellBlocked() все места заняты → true', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 5);
      putOnMain(playerStore.players[0]!, boardStore.board, 1, 5);
      expect(game.isCellBlocked(boardStore.board.cells[5]!)).toBe(true);
    });

    it('isCellBlocked() не все места заняты → false', () => {
      const { game, playerStore, boardStore } = setupGame();
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 5);
      expect(game.isCellBlocked(boardStore.board.cells[5]!)).toBe(false);
    });

    it('isCellDisabled() ячейка свободна → false', () => {
      const { game, boardStore } = setupGame();
      expect(game.isCellDisabled(boardStore.board.cells[5]!)).toBe(false);
    });

    it('isCellDisabled() занята безопасная для владельца → true', () => {
      const { game, boardStore, playerStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 4);
      expect(game.isCellDisabled(boardStore.board.cells[4]!)).toBe(true);
    });

    it('isCellDisabled() занята небезопасная → false', () => {
      const { game, boardStore, playerStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 5);
      expect(game.isCellDisabled(boardStore.board.cells[5]!)).toBe(false);
    });

    it('isCellDisabled() чужая стартовая клетка, занятая владельцем, для чужака → false (README п.9)', () => {
      const { game, playerStore, boardStore } = setupGame();
      // Текущий игрок — чужак (1), стартовая клетка принадлежит игроку 0 и занята его фишкой
      playerStore.init(1);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 4);
      expect(game.isCellDisabled(boardStore.board.cells[4]!)).toBe(false);
    });

    it('isCellDisabled() общая безопасная клетка (safe=true), занятая одним цветом → false (README п.9)', () => {
      const { game, playerStore, boardStore } = setupGame();
      playerStore.init(0);
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 11);
      expect(game.isCellDisabled(boardStore.board.cells[11]!)).toBe(false);
    });
  });

  // =================================================================
  // 4.4.8 sendToStart
  // =================================================================
  describe('sendToStart', () => {
    it('отправляет фишку на baseBoard.cells[0]', () => {
      const { game, playerStore, boardStore } = setupGame();
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      game.sendToStart(chip);
      expect(chip.cell).toBe(playerStore.players[0]!.baseBoard.cells[0]);
    });

    it('освобождает старую ячейку', () => {
      const { game, playerStore, boardStore } = setupGame();
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      game.sendToStart(chip);
      const occupied = boardStore.board.cells[10]!.places.filter(
        (p) => p !== null && toRaw(p) === chip,
      );
      expect(occupied.length).toBe(0);
    });

    it('Крайний случай: фишка уже на базе — не падает', () => {
      const { game, playerStore } = setupGame();
      const chip = playerStore.players[0]!.chips[0]!;
      expect(() => game.sendToStart(chip)).not.toThrow();
      expect(chip.cell).toBe(playerStore.players[0]!.baseBoard.cells[0]);
    });
  });

  // =================================================================
  // 4.4.9 Проверка победителя
  // =================================================================
  describe('checkWinner', () => {
    it('при всех finished → FINISH', () => {
      const { game, playerStore } = setupGame();
      playerStore.players[0]!.chips.forEach((c) => c.finish());
      game.checkWinner(playerStore.players[0]!);
      expect(game.stateId).toBe(GameStateEnum.FINISH);
    });

    it('не при всех finished → ничего', () => {
      const { game, playerStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      game.checkWinner(playerStore.players[0]!);
      expect(game.stateId).toBe(GameStateEnum.WAIT_ROLL);
    });

    it('Крайний случай: для ИИ-игрока', () => {
      const { game, playerStore } = setupGame();
      playerStore.players[1]!.chips.forEach((c) => c.finish());
      game.checkWinner(playerStore.players[1]!);
      expect(game.stateId).toBe(GameStateEnum.FINISH);
    });
  });

  // =================================================================
  // 4.4.10 onChipClick
  // =================================================================
  describe('onChipClick', () => {
    it('в SELECT_FIRST — игнорируется', () => {
      const { game, playerStore } = setupGame();
      game.onChipClick(playerStore.players[0]!.chips[0]);
      expect(game.selectedChip).toBeNull();
    });

    it('с доступной фишкой — selectedChip устанавливается', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      const chip = putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      diceStore.items = [3, 4];
      game.onChipClick(chip);
      expect(game.selectedChip).toBe(chip);
    });

    it('с недоступной фишкой — игнорируется', () => {
      const { game, playerStore, boardStore, diceStore } = setupGame();
      game.stateId = GameStateEnum.WAIT_ROLL;
      putOnMain(playerStore.players[0]!, boardStore.board, 0, 10);
      const chipOnBase = playerStore.players[0]!.chips[1]!;
      diceStore.items = [3, 4];
      game.onChipClick(chipOnBase);
      expect(game.selectedChip).toBeNull();
    });

    it('с null — игнорируется', () => {
      const { game } = setupGame();
      game.onChipClick(null);
      expect(game.selectedChip).toBeNull();
    });
  });
});
