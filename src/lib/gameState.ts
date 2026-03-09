// TODO см. как использовать

import type { Player } from './player';

/**
 * Состояние игры (иммутабельное)
 */
export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValues: number[];
  hasRolled: boolean;
  usedDice: boolean[]; // два кубика
  // победители по местам
  winners: Player[];
  // бонусные очки, которые можно использовать
  bonusSteps: number[];
}

/**
 * Действия, которые могут изменять состояние игры
 */
export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'USE_DICE'; index: number }
  | { type: 'MOVE_CHIP'; chipId: number; steps: number; dieIndex: number }
  | { type: 'NEXT_TURN' }
  | { type: 'ADD_BONUS'; bonus: number }
  | { type: 'USE_BONUS'; bonusIndex: number; chipId: number; steps: number };

/**
 * Создание начального состояния игры
 */
export function createInitialState(players: Player[]): GameState {
  return {
    players,
    currentPlayerIndex: 0,
    diceValues: [],
    hasRolled: false,
    usedDice: [false, false],
    winners: [],
    bonusSteps: [],
  };
}

/**
 * Редьюсер игры: принимает состояние и действие, возвращает новое состояние
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE': {
      const diceValues = Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1);
      return {
        ...state,
        diceValues,
        hasRolled: true,
        usedDice: [false, false],
      };
    }
    case 'USE_DICE': {
      const { index } = action;
      const usedDice = [...state.usedDice];
      if (index === -1) {
        // использование суммы
        if (usedDice[0] || usedDice[1]) return state; // нельзя использовать
        usedDice[0] = true;
        usedDice[1] = true;
      } else if (index >= 0 && index < usedDice.length) {
        if (usedDice[index]) return state;
        usedDice[index] = true;
      }
      return { ...state, usedDice };
    }
    case 'NEXT_TURN': {
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        diceValues: [],
        hasRolled: false,
        usedDice: [false, false],
        bonusSteps: [], // бонусы сгорают при переходе хода? Пока да
      };
    }
    case 'ADD_BONUS': {
      return {
        ...state,
        bonusSteps: [...state.bonusSteps, action.bonus],
      };
    }
    case 'USE_BONUS': {
      // Пока заглушка
      return state;
    }
    case 'MOVE_CHIP': {
      // Пока заглушка, позже реализуем
      return state;
    }
    default:
      return state;
  }
}

/**
 * Вспомогательные функции для работы с состоянием
 */

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]!;
}

export function getAvailableSteps(state: GameState): number[] {
  const steps: number[] = [];
  if (state.diceValues.length === 0) return steps;
  if (state.diceValues.length >= 1 && !state.usedDice[0]) steps.push(state.diceValues[0]!);
  if (state.diceValues.length >= 2 && !state.usedDice[1]) steps.push(state.diceValues[1]!);
  if (!state.usedDice[0] && !state.usedDice[1]) {
    steps.push(state.diceValues.reduce((a, b) => a + b, 0));
  }
  // Добавляем бонусные шаги как отдельные доступные шаги
  steps.push(...state.bonusSteps);
  return steps;
}

export function isAllDiceUsed(state: GameState): boolean {
  return state.usedDice.every((used) => used);
}
