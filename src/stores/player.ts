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

  const init = () => {
    currentIndex.value = 0;
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

  return {
    players,
    init,
    next,
    current,
    allChipsOnBase,
  };
});
