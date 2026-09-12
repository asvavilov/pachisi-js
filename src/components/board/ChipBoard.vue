<template>
  <div
    class="chip"
    :class="{
      available: gameStore.isChipAvailable(chip),
      selected: gameStore.selectedChip && gameStore.selectedChip === chip,
      finished: isChipFinished(chip),
      captured: isCaptured,
    }"
    :style="{ '--color': chip.player.color }"
    :data-chip-id="chip.id"
    @click="gameStore.onChipClick(chip)"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Chip } from 'src/lib/chip';
import { useGameStore } from 'src/stores/game';

const props = defineProps<{
  chip: Chip;
}>();

const gameStore = useGameStore();

function isChipFinished(chip: Chip | null | undefined): boolean {
  return chip?.finished ?? false;
}

/** 4.5: фишка, которую только что сбили (для анимации). */
const isCaptured = computed(() => gameStore.lastCapturedChipId === props.chip.id);
</script>
<style scoped>
.chip {
  background-color: var(--color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  opacity: 0.5;
  animation: chip-appear 0.25s ease-out;
}
.chip.captured {
  animation: chip-capture 0.7s ease-out;
}

@keyframes chip-appear {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
  }
}

@media (max-width: 768px), (orientation: landscape) and (max-height: 560px) {
  .chip {
    width: 13px;
    height: 13px;
  }
}

@keyframes chip-capture {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.9);
  }
  40% {
    transform: scale(1.35);
    box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.5);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
  }
}
.chip.available {
  opacity: 1;
}
.chip.selected {
  border: 1px solid black;
}
</style>
