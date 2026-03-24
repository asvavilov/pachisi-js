/**
 * Состояния игры
 */
export enum GameStateEnum {
  /**
   * начало игры
   * не все инициализировано и не все готово
   */
  START = 'START',
  /**
   * ожидание выбора кто начинает игру
   * нужно будет поочередно бросать кости (у кого меньше, тот и начинает игру)
   */
  SELECT_FIRST = 'SELECT_FIRST',
  /**
   * ожидание броска костей от текущего игрока
   */
  WAIT_ROLL = 'WAIT_ROLL',
  /**
   * ожидание хода (если есть доступные ходы)
   * после броска костей или после предыдущего хода
   */
  WAIT_STEP = 'WAIT_STEP',
  /**
   * ожидание перехода к следующему игроку
   *  когда нет доступных ходов
   */
  WAIT_PLAYER = 'WAIT_PLAYER',
  /**
   * конец игры
   * есть победитель или все места распределены
   */
  FINISH = 'FINISH',
}

/**
 * Настройка состояния игры
 */
interface GameStateSettings {
  /**
   * можно ли бросать кости
   */
  canRollDice: boolean;
  /**
   * можно ли завершить ход
   */
  canFinishRoll: boolean;
}

/**
 * Настройки состояний игры
 */
export const GameStateTree: Record<GameStateEnum, GameStateSettings> = {
  [GameStateEnum.START]: {
    canRollDice: false,
    canFinishRoll: false,
  },
  [GameStateEnum.SELECT_FIRST]: {
    canRollDice: true,
    canFinishRoll: false,
  },
  [GameStateEnum.WAIT_ROLL]: {
    canRollDice: true,
    canFinishRoll: false,
  },
  [GameStateEnum.WAIT_STEP]: {
    canRollDice: false,
    canFinishRoll: false,
  },
  [GameStateEnum.WAIT_PLAYER]: {
    canRollDice: false,
    canFinishRoll: true,
  },
  [GameStateEnum.FINISH]: {
    canRollDice: false,
    canFinishRoll: false,
  },
};
