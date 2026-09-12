import { BoardType } from './board';
import type { Cell } from './cell';
import type { Chip } from './chip';
import type { PlayerData } from './player';

/**
 * Вариант хода ИИ: конкретная фишка, число шагов и целевая ячейка.
 * Все варианты формируются вызывающим кодом (`stores/game.ts`) и уже прошли
 * проверку правил, поэтому ИИ выбирает только из легальных ходов.
 */
export interface MoveCandidate {
  chip: Chip;
  steps: number;
  targetCell: Cell;
}

/**
 * Взгляд ИИ на игру: кандидаты хода, активные фишки соперников и проверка
 * безопасности ячейки. Позволяет держать выбор хода чистой функцией.
 */
export interface AiView {
  candidates: MoveCandidate[];
  /** Фишки соперников, ещё находящиеся в игре (база, дорожка, дом). */
  opponents: Chip[];
  /** Защищена ли ячейка от захвата для ходащего игрока. */
  isSafeForMe: (cell: Cell) => boolean;
}

/**
 * Веса эвристик. Захват и финиш — ключевые цели, угроза штрафуется.
 */
const SCORE = {
  finish: 1000,
  capture: 500,
  baseExit: 200,
  progress: 0.5,
  steps: 1,
  threat: 400,
} as const;

/** Ход приводит фишку в последнюю ячейку своей финишной дорожки. */
const isFinishingMove = (chip: Chip, target: Cell): boolean =>
  target.board.type === BoardType.home &&
  target.board.player?.ind === chip.player.ind &&
  target.board.cells.indexOf(target) === target.board.cells.length - 1;

/** Чужие фишки, которые будут сбиты ходом в целевую ячейку. */
const capturingChips = (chip: Chip, target: Cell): Chip[] =>
  target.places.filter((p): p is Chip => p !== null && p.player.ind !== chip.player.ind);

/**
 * «Близость» ячейки к финишу для игрока (по аналогии с `Player.getChipProximityScore`).
 * Чем больше значение, тем ближе фишка к завершению.
 */
const proximityScore = (cell: Cell, player: PlayerData): number => {
  if (cell.board.type === BoardType.home) {
    return 1000 + cell.board.cells.indexOf(cell);
  }
  if (cell.board.type === BoardType.base) {
    return 0;
  }

  const mainBoard = cell.board;
  const total = mainBoard.cells.length;
  const entranceIndex = mainBoard.cells.findIndex((c) => c.io?.board.player?.ind === player.ind);
  if (entranceIndex < 0) return 0;

  const currentIndex = mainBoard.cells.indexOf(cell);
  const distance = (entranceIndex - currentIndex + total) % total;
  return 100 + (total - distance);
};

/**
 * Оценка угрозы для фишки после хода в целевую ячейку (0 — безопасно, 1 — максимальный риск).
 * Учитываются только соперники, способные добраться до ячейки одним броском (1–6) или
 * двумя (до 12); прямой выход соперника с базы (5) угрожает его стартовой клетке.
 */
export const threatScore = (target: Cell, chip: Chip, view: AiView): number => {
  // База и дом недосягаемы для соперников.
  if (target.board.type === BoardType.base || target.board.type === BoardType.home) {
    return 0;
  }
  // Своя фишка рядом образует барьер — сбить такую пару нельзя.
  if (target.places.some((p) => p !== null && p.player.ind === chip.player.ind)) {
    return 0;
  }
  // Безопасная для ходащего игрока ячейка защищает от захвата.
  if (view.isSafeForMe(target)) {
    return 0;
  }

  const mainBoard = target.board;
  const total = mainBoard.cells.length;
  const targetIndex = mainBoard.cells.indexOf(target);
  let maxThreat = 0;

  for (const opponent of view.opponents) {
    if (opponent.finished || opponent.player.ind === chip.player.ind) continue;
    const cell = opponent.cell;
    if (!cell) continue;
    if (cell.board.type === BoardType.home) continue;

    if (cell.board.type === BoardType.base) {
      // README п.11: выход с базы на стартовую клетку «расплющивает» стоящую там фишку.
      const startCell = mainBoard.cells.find(
        (c) => c.safe && typeof c.safe === 'object' && c.safe.ind === opponent.player.ind,
      );
      if (startCell === target) {
        maxThreat = Math.max(maxThreat, 1);
      }
      continue;
    }

    // Соперник на общей дорожке: считаем расстояние вперёд до целевой ячейки.
    if (cell.board !== mainBoard) continue;
    const opponentIndex = mainBoard.cells.indexOf(cell);
    const distance = (targetIndex - opponentIndex + total) % total;
    if (distance < 1 || distance > 12) continue;

    // Дальность броска: 1–6 — один кубик (вероятнее), 7–12 — сумма двух.
    const weight = distance <= 6 ? (7 - distance) / 6 : ((13 - distance) / 12) * 0.5;
    maxThreat = Math.max(maxThreat, weight);
  }

  return maxThreat;
};

/**
 * Оценка варианта хода. Больше — лучше.
 */
export const scoreMove = (candidate: MoveCandidate, view: AiView): number => {
  const { chip, steps, targetCell } = candidate;
  let score = 0;

  if (isFinishingMove(chip, targetCell)) score += SCORE.finish;
  score += capturingChips(chip, targetCell).length * SCORE.capture;
  if (chip.cell.board.type === BoardType.base && targetCell.board.type === BoardType.main) {
    score += SCORE.baseExit;
  }

  score += proximityScore(targetCell, chip.player) * SCORE.progress;
  score += steps * SCORE.steps;
  score -= threatScore(targetCell, chip, view) * SCORE.threat;

  return score;
};

/**
 * Детерминированный тай-брейк при равных очках: больше шагов → меньше id фишки →
 * меньший индекс целевой ячейки. Отрицательное значение — кандидат `a` предпочтительнее.
 */
const tieBreak = (a: MoveCandidate, b: MoveCandidate): number => {
  if (a.steps !== b.steps) return b.steps - a.steps;
  if (a.chip.id !== b.chip.id) return a.chip.id - b.chip.id;
  return (
    a.targetCell.board.cells.indexOf(a.targetCell) - b.targetCell.board.cells.indexOf(b.targetCell)
  );
};

/**
 * Выбрать лучший ход из легальных кандидатов. Возвращает `null`, если ходов нет.
 */
export const chooseMove = (view: AiView): MoveCandidate | null => {
  if (view.candidates.length === 0) return null;

  let best = view.candidates[0]!;
  let bestScore = scoreMove(best, view);

  for (let i = 1; i < view.candidates.length; i++) {
    const candidate = view.candidates[i]!;
    const score = scoreMove(candidate, view);
    if (score > bestScore || (score === bestScore && tieBreak(candidate, best) < 0)) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
};
