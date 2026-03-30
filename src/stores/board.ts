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
   */
  const ios = {
    0: lastElement(players[0]!.baseBoard.cells)!,
    12: firstElement(players[1]!.homeBoard.cells)!,
    17: lastElement(players[1]!.baseBoard.cells)!,
    29: firstElement(players[2]!.homeBoard.cells)!,
    34: lastElement(players[2]!.baseBoard.cells)!,
    46: firstElement(players[3]!.homeBoard.cells)!,
    51: lastElement(players[3]!.baseBoard.cells)!,
    63: firstElement(players[0]!.homeBoard.cells)!,
  };

  /**
   * общая глобальная доска
   */
  const board = new Board(BoardType.main, undefined, 68, safes, ios);

  /**
   * связь игроков с общей доской и связи ячеек-переходов с общей доской
   */
  players.forEach(function (player) {
    lastElement(player.baseBoard.cells)!.io = board.cells[player.i_begin];
    firstElement(player.homeBoard.cells)!.io = board.cells[player.i_end];
  });

  const finishBoards = computed(() => players.map((p) => p.homeBoard));

  return {
    board,
    finishBoards,
  };
});
