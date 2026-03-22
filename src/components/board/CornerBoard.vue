<template>
  <div
    class="corner"
    :class="cornerClass"
    :style="{ '--color': playerStore.players[player.ind]!.color }"
  >
    <div
      v-for="chip in places"
      :key="chip?.id"
      class="place"
      :class="{
        chip: !!chip,
        available: gameStore.isChipAvailable(chip),
        selected: gameStore.selectedChip && gameStore.selectedChip === chip,
      }"
      :style="{ '--color': chip?.player.color }"
      @click="gameStore.onChipClick(chip)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from 'src/stores/player';
import type { Player } from 'src/lib/player';
import { useGameStore } from 'src/stores/game';

const props = defineProps<{
  player: Player;
}>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

const cornerClass = computed(() => `corner-${props.player.ind}`);

const places = computed(() => {
  if (!props.player) return [];
  // стартовые ячейки находятся в boards[0].cells[0].places
  return props.player.boards[0]?.cells[0]?.places ?? [];
});
</script>
<style scoped>
.corner {
  border: 1px solid var(--color);
}
.chip {
  width: 20px;
  height: 20px;
  border: 1px solid #ccc;
  border-radius: 50%;
  background-color: var(--color);
  opacity: 0.5;
}
.chip.available {
  opacity: 1;
}
.chip.selected {
  border: 1px solid black;
}
</style>
