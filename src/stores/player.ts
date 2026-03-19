import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDiceStore } from './dice';
import type { PlayerIndex } from 'src/lib/player';
import { Player, PlayerColor } from 'src/lib/player';

/**
 * массив игроков и текущий игрок
 */
export const usePlayerStore = defineStore('player', () => {
  const diceStore = useDiceStore();

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
    current.value ? current.value.chips.every((chip) => chip.cell?.board.ind === 0) : undefined,
  );

  /**
   * дополнительный ход:
   * - или когда дубли
   * - или выпало 6 и все на базе
   */
  const canAddon = computed(() => {
    return diceStore.isEquals || (allChipsOnBase.value && diceStore.hasAddon);
  });

  return {
    players,
    init,
    next,
    current,
    canAddon,
  };
});
