import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBoardStore } from 'src/stores/board';
import { usePlayerStore } from 'src/stores/player';
import type { Cell } from 'src/lib/cell';
import type { Chip } from 'src/lib/chip';
import type { Player } from 'src/lib/player';
import { chooseMove, scoreMove, threatScore } from 'src/lib/ai';
import type { AiView, MoveCandidate } from 'src/lib/ai';

describe('lib/ai', () => {
  let players: Player[];
  let main: ReturnType<typeof useBoardStore>['board'];

  beforeEach(() => {
    setActivePinia(createPinia());
    const playerStore = usePlayerStore();
    const boardStore = useBoardStore();
    players = playerStore.players;
    main = boardStore.board;
  });

  const chipOf = (playerIndex: number, chipIndex: number): Chip =>
    players[playerIndex]!.chips[chipIndex]!;

  const moveTo = (chip: Chip, cell: Cell): Chip => {
    chip.go(cell);
    return chip;
  };

  const makeView = (chip: Chip, candidates: MoveCandidate[], opponents: Chip[]): AiView => ({
    candidates,
    opponents,
    isSafeForMe: (cell) =>
      cell.safe === true || (typeof cell.safe === 'object' && cell.safe.ind === chip.player.ind),
  });

  const candidate = (chip: Chip, steps: number, targetCell: Cell): MoveCandidate => ({
    chip,
    steps,
    targetCell,
  });

  describe('chooseMove', () => {
    it('возвращает null, если нет кандидатов', () => {
      const view = makeView(chipOf(0, 0), [], []);
      expect(chooseMove(view)).toBeNull();
    });

    it('предпочитает финишный ход обычному продвижению', () => {
      const finishChip = moveTo(chipOf(0, 0), players[0]!.homeBoard.cells[6]!);
      const progressChip = moveTo(chipOf(0, 1), main.cells[30]!);
      const finish = candidate(finishChip, 1, players[0]!.homeBoard.cells[7]!);
      const progress = candidate(progressChip, 1, main.cells[31]!);

      const result = chooseMove(makeView(finishChip, [progress, finish], []));
      expect(result).toBe(finish);
    });

    it('предпочитает захват обычному продвижению', () => {
      const hunter = moveTo(chipOf(0, 0), main.cells[10]!);
      const runner = moveTo(chipOf(0, 1), main.cells[31]!);
      const victim = moveTo(chipOf(1, 0), main.cells[12]!);
      const capture = candidate(hunter, 2, main.cells[12]!);
      const progress = candidate(runner, 2, main.cells[40]!);

      const result = chooseMove(makeView(hunter, [capture, progress], [victim]));
      expect(result).toBe(capture);
    });

    it('предпочитает выход с базы продвижению', () => {
      const baseChip = chipOf(0, 0);
      const runner = moveTo(chipOf(0, 1), main.cells[30]!);
      const exit = candidate(baseChip, 5, main.cells[4]!);
      const progress = candidate(runner, 1, main.cells[31]!);

      const result = chooseMove(makeView(baseChip, [progress, exit], []));
      expect(result).toBe(exit);
    });

    it('избегает ячейки под ударом соперника', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[24]!);
      const opponent = moveTo(chipOf(1, 0), main.cells[26]!);
      const dangerous = candidate(chip, 3, main.cells[27]!);
      const calm = candidate(chip, 1, main.cells[25]!);

      const result = chooseMove(makeView(chip, [dangerous, calm], [opponent]));
      expect(result).toBe(calm);
    });

    it('детерминирован: повторный вызов возвращает тот же вариант', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[24]!);
      const a = candidate(chip, 1, main.cells[25]!);
      const b = candidate(chip, 2, main.cells[26]!);

      const view = makeView(chip, [a, b], []);
      expect(chooseMove(view)).toBe(chooseMove(view));
    });

    it('при равных очках выбирает фишку с меньшим id', () => {
      const chipA = moveTo(chipOf(0, 0), main.cells[10]!);
      const chipB = moveTo(chipOf(0, 1), main.cells[10]!);
      const viaA = candidate(chipA, 2, main.cells[12]!);
      const viaB = candidate(chipB, 2, main.cells[12]!);

      // chipB идёт первым в списке, но при равенстве должен победить chipA.
      const result = chooseMove(makeView(chipA, [viaB, viaA], []));
      expect(result).toBe(viaA);
    });
  });

  describe('scoreMove', () => {
    it('оценивает двух сбитых соперников выше, чем одного', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[10]!);
      moveTo(chipOf(1, 0), main.cells[12]!);
      const single = candidate(chip, 2, main.cells[12]!);
      const singleScore = scoreMove(single, makeView(chip, [single], []));

      const chip2 = moveTo(chipOf(0, 2), main.cells[10]!);
      moveTo(chipOf(2, 0), main.cells[12]!);
      const double = candidate(chip2, 2, main.cells[12]!);
      const doubleScore = scoreMove(double, makeView(chip2, [double], []));

      expect(doubleScore).toBeGreaterThan(singleScore);
    });
  });

  describe('threatScore', () => {
    it('безопасная для игрока ячейка не даёт угрозы', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[26]!);
      const opponent = moveTo(chipOf(1, 0), main.cells[27]!);

      expect(threatScore(main.cells[28]!, chip, makeView(chip, [], [opponent]))).toBe(0);
    });

    it('своя фишка на целевой ячейке образует барьер — угрозы нет', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[26]!);
      moveTo(chipOf(0, 1), main.cells[28]!);
      const opponent = moveTo(chipOf(1, 0), main.cells[27]!);

      expect(threatScore(main.cells[28]!, chip, makeView(chip, [], [opponent]))).toBe(0);
    });

    it('база и дом вне зоны угрозы', () => {
      const chip = chipOf(0, 0);
      const opponent = moveTo(chipOf(1, 0), main.cells[4]!);
      const view = makeView(chip, [], [opponent]);

      expect(threatScore(players[0]!.homeBoard.cells[0]!, chip, view)).toBe(0);
      expect(threatScore(players[0]!.baseBoard.cells[0]!, chip, view)).toBe(0);
    });

    it('соперник на базе угрожает своей стартовой клетке (выход прямым 5)', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[20]!);
      const opponent = chipOf(1, 0); // остаётся на базе

      const view = makeView(chip, [], [opponent]);
      expect(threatScore(main.cells[21]!, chip, view)).toBe(1);
    });

    it('далёкий соперник (больше 12 шагов) не угрожает', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[40]!);
      const opponent = moveTo(chipOf(1, 0), main.cells[26]!);

      const view = makeView(chip, [], [opponent]);
      expect(threatScore(main.cells[48]!, chip, view)).toBe(0);
    });

    it('соперник на финишной дорожке не угрожает', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[40]!);
      const opponent = moveTo(chipOf(1, 0), players[1]!.homeBoard.cells[2]!);

      const view = makeView(chip, [], [opponent]);
      expect(threatScore(main.cells[48]!, chip, view)).toBe(0);
    });

    it('финишировавший соперник не угрожает', () => {
      const chip = moveTo(chipOf(0, 0), main.cells[24]!);
      const opponent = moveTo(chipOf(1, 0), main.cells[26]!);
      opponent.finish();

      const view = makeView(chip, [], [opponent]);
      expect(threatScore(main.cells[27]!, chip, view)).toBe(0);
    });

    it('вес угрозы падает с расстоянием (дальний бросок слабее)', () => {
      const chipA = moveTo(chipOf(0, 0), main.cells[24]!);
      const nearOpponent = moveTo(chipOf(1, 0), main.cells[26]!);
      const nearView = makeView(chipA, [], [nearOpponent]);

      const chipB = moveTo(chipOf(0, 2), main.cells[24]!);
      const farOpponent = moveTo(chipOf(2, 0), main.cells[20]!);
      const farView = makeView(chipB, [], [farOpponent]);

      // near: 26 → 27 (1 шаг). far: 20 → 29 (9 шагов).
      expect(threatScore(main.cells[27]!, chipA, nearView)).toBe(1);
      expect(threatScore(main.cells[29]!, chipB, farView)).toBeCloseTo(((13 - 9) / 12) * 0.5);
    });
  });
});
