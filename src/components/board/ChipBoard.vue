<template>
  <div
    class="chip"
    :class="{
      available: gameStore.isChipAvailable(chip),
      selected: gameStore.selectedChip && gameStore.selectedChip === chip,
      finished: isChipFinished(chip),
    }"
    :style="{ '--color': chip.player.color }"
    :data-chip-id="chip.id"
    @click="gameStore.onChipClick(chip)"
  ></div>
</template>

<script setup lang="ts">
import type { Chip } from 'src/lib/chip';
import { useGameStore } from 'src/stores/game';

defineProps<{
  chip: Chip;
}>();

const gameStore = useGameStore();

function isChipFinished(chip: Chip | null | undefined): boolean {
  return chip?.finished ?? false;
}
</script>
<style scoped>
.chip {
  background-color: var(--color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  opacity: 0.5;
}
.chip.available {
  opacity: 1;
}
.chip.selected {
  border: 1px solid black;
}
</style>
