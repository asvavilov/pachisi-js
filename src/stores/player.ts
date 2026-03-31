import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { PlayerIndex } from 'src/lib/player';
import { Player, PlayerColor } from 'src/lib/player';
import { BoardType } from 'src/lib/board';

/**
 * массив игроков и текущий игрок
 */
export const usePlayerStore = defineStore('player', () => {
  const players = ref<Player[]>([
    new Player(0, false, PlayerColor.yellow),
    new Player(1, true, PlayerColor.blue),
    new Player(2, true, PlayerColor.red),
    new Player(3, true, PlayerColor.green),
  ]);

  const currentIndex = ref<PlayerIndex>();
  const winners = ref<Player[]>([]); // победитель игры, если есть

  const init = () => {
    currentIndex.value = 0;
    winners.value = [];
  };

  const next = () => {
    if (currentIndex.value !== undefined) {
      currentIndex.value = ((currentIndex.value + 1) % players.value.length) as PlayerIndex;
    }
  };

  const current = computed(() =>
    currentIndex.value !== undefined ? players.value[currentIndex.value] : undefined,
  );

  const allChipsOnBase = computed(() =>
    current.value
      ? current.value.chips.every((chip) => chip.cell?.board.type === BoardType.base)
      : undefined,
  );

  /**
   * Проверить игрока на победителя (игрок, все фишки которого финишировали).
   * Если только что был добавлен победитель, то вернёт player,
   * иначе возвращает true (если найден в списке) или false (если не победитель).
   */
  const checkWinner = (player: Player) => {
    if (winners.value.includes(player)) {
      return true;
    }

    if (player.chips.every((chip) => chip.finished)) {
      winners.value.push(player);
      console.log(
        `🎉 Игрок ${player.color} занял ${winners.value.length} место! Все фишки финишировали.`,
      );
      return player;
    }

    return false;
  };

  return {
    players,
    winners,
    init,
    next,
    current,
    allChipsOnBase,
    checkWinner,
  };
});
