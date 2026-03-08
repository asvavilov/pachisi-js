import { defineStore } from 'pinia';
import { Player } from 'src/lib/player';
import { ref } from 'vue';

/**
 * массив игроков
 */
export const usePlayerStore = defineStore('player', () => {
  const items = ref<Player[]>([
    new Player(0, false, 'green'),
    new Player(1, true, 'yellow'),
    new Player(2, true, 'red'),
    new Player(3, true, 'blue'),
  ]);

  return {
    items,
  };
});
