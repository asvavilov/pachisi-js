import { defineStore } from 'pinia';
import { Board, BoardType } from 'src/lib/board';
import { lastElement, firstElement } from 'src/utils/array';
import { computed } from 'vue';
import { usePlayerStore } from './player';

/**
 * доски (основная и финишные для игроков)
 */
export const useBoardStore = defineStore('board', () => {
  const playerStore = usePlayerStore();
  const players = playerStore.players;

  /**
   * карта ячеек безопасности
   */
  const safes = {
    4: players[0]!,
    11: true,
    16: true,
    21: players[1]!,
    28: true,
    33: true,
    38: players[2]!,
    45: true,
    50: true,
    55: players[3]!,
    62: true,
    67: true,
  };

  /**
   * карта ячеек-переходов
   * i_end для каждого игрока: (q * ind + 63 + startOffset) % 68
   *   Player 0 (yellow): (0 + 63 + 4) % 68 = 67
   *   Player 1 (blue):   (17 + 63 + 4) % 68 = 16
   *   Player 2 (red):    (34 + 63 + 4) % 68 = 33
   *   Player 3 (green):  (51 + 63 + 4) % 68 = 50
   */
  const ios = {
    0: lastElement(players[0]!.baseBoard.cells)!,
    16: firstElement(players[1]!.homeBoard.cells)!,
    17: lastElement(players[1]!.baseBoard.cells)!,
    33: firstElement(players[2]!.homeBoard.cells)!,
    34: lastElement(players[2]!.baseBoard.cells)!,
    50: firstElement(players[3]!.homeBoard.cells)!,
    51: lastElement(players[3]!.baseBoard.cells)!,
    67: firstElement(players[0]!.homeBoard.cells)!,
  };

  /**
   * общая глобальная доска
   */
  const board = new Board(BoardType.main, undefined, 68, safes, ios);

  /**
   * связь игроков с общей доской
   */
  players.forEach(function (player) {
    // Базовая доска → основная доска
    lastElement(player.baseBoard.cells)!.io = board.cells[player.i_begin];
    // Финишная доска → основная доска (точка входа на финиш)
    // Находим индекс точки входа из ios (обратный поиск)
    for (const [idx, cell] of Object.entries(ios)) {
      if (cell === firstElement(player.homeBoard.cells)) {
        firstElement(player.homeBoard.cells)!.io = board.cells[Number(idx)];
        break;
      }
    }
  });

  const finishBoards = computed(() => players.map((p) => p.homeBoard));

  return {
    board,
    finishBoards,
  };
});
