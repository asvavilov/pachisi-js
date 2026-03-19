import { defineStore } from 'pinia';
import { Player, PlayerColor } from 'src/lib/player';
import { ref } from 'vue';

/**
 * массив игроков
 */
export const usePlayerStore = defineStore('player', () => {
  const items = ref<Player[]>([
    new Player(0, false, PlayerColor.yellow),
    new Player(1, true, PlayerColor.blue),
    new Player(2, true, PlayerColor.red),
    new Player(3, true, PlayerColor.green),
  ]);

  return {
    items,
  };
});
