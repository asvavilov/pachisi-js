<template>
  <div
    class="corner"
    :class="[cornerClass, { current: isCurrentPlayer }]"
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

/** 4.7: подсветка базы игрока, чей сейчас ход. */
const isCurrentPlayer = computed(
  () => playerStore.current !== undefined && playerStore.current.ind === props.player.ind,
);

const places = computed(() => {
  if (!props.player) return [];
  // стартовые ячейки находятся в boards[0].cells[0].places
  return props.player.baseBoard.cells[0]?.places ?? [];
});
</script>
<style scoped>
.corner {
  border: 1px solid var(--color);
  /* 4.6: фишки базы — сеткой 2×2, чтобы помещались и выглядели крупнее. */
  display: grid;
  grid-template-columns: 1fr 1fr;
  place-items: center;
}
.corner.current {
  border: 3px solid var(--color);
  box-shadow: 0 0 8px 0 var(--color);
}
.corner :deep(.chip) {
  width: 28px;
  height: 28px;
}
@media (max-width: 768px), (orientation: landscape) and (max-height: 560px) {
  .corner :deep(.chip) {
    width: 20px;
    height: 20px;
  }
}
</style>
