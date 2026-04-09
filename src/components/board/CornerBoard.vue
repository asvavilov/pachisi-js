<template>
  <div
    class="corner"
    :class="cornerClass"
    :style="{ '--color': playerStore.players[player.ind]!.color }"
  >
    <div v-for="(chip, placeIndex) in places" :key="placeIndex" class="place">
      <ChipBoard v-if="chip" :chip="chip" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from 'src/stores/player';
import type { Player } from 'src/lib/player';
import ChipBoard from './ChipBoard.vue';

const props = defineProps<{
  player: Player;
}>();

const playerStore = usePlayerStore();

const cornerClass = computed(() => `corner-${props.player.ind}`);

const places = computed(() => {
  if (!props.player) return [];
  // стартовые ячейки находятся в boards[0].cells[0].places
  return props.player.baseBoard.cells[0]?.places ?? [];
});
</script>
<style scoped>
.corner {
  border: 1px solid var(--color);
}
</style>
