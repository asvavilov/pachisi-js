import { describe, it, expect } from 'vitest';
import { GameStateEnum, GameStateTree } from 'src/lib/GameState';

describe('GameState', () => {
  it('содержит все 6 состояний', () => {
    expect(Object.values(GameStateEnum)).toEqual([
      'START',
      'SELECT_FIRST',
      'WAIT_ROLL',
      'WAIT_STEP',
      'WAIT_PLAYER',
      'FINISH',
    ]);
  });

  it('START: canRollDice=false, canFinishRoll=false', () => {
    expect(GameStateTree[GameStateEnum.START]).toEqual({
      canRollDice: false,
      canFinishRoll: false,
    });
  });

  it('SELECT_FIRST: canRollDice=true, canFinishRoll=false', () => {
    expect(GameStateTree[GameStateEnum.SELECT_FIRST]).toEqual({
      canRollDice: true,
      canFinishRoll: false,
    });
  });

  it('WAIT_ROLL: canRollDice=true, canFinishRoll=false', () => {
    expect(GameStateTree[GameStateEnum.WAIT_ROLL]).toEqual({
      canRollDice: true,
      canFinishRoll: false,
    });
  });

  it('WAIT_STEP: canRollDice=false, canFinishRoll=false', () => {
    expect(GameStateTree[GameStateEnum.WAIT_STEP]).toEqual({
      canRollDice: false,
      canFinishRoll: false,
    });
  });

  it('WAIT_PLAYER: canRollDice=false, canFinishRoll=true', () => {
    expect(GameStateTree[GameStateEnum.WAIT_PLAYER]).toEqual({
      canRollDice: false,
      canFinishRoll: true,
    });
  });

  it('FINISH: canRollDice=false, canFinishRoll=false', () => {
    expect(GameStateTree[GameStateEnum.FINISH]).toEqual({
      canRollDice: false,
      canFinishRoll: false,
    });
  });
});
