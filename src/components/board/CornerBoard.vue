<template>
  <div class="corner" :class="cornerClass" :style="{ '--color': playerColor(player.ind) }">
    <div
      v-for="chip in chips"
      :key="chip?.id"
      class="place"
      :class="{
        chip: !!chip,
        available: isChipAvailable(chip),
      }"
      :style="{ '--color': chip?.player.color }"
      @click="onChipClick(chip)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playerColor, type Player } from 'src/lib/player';
import type { Chip } from 'src/lib/chip';

const props = defineProps<{
  player: Player;
  availableChipIds?: number[];
}>();

const emit = defineEmits<{
  chipClick: [chip: Chip];
}>();

const cornerClass = computed(() => `corner-${props.player.ind}`);

const chips = computed(() => {
  if (!props.player) return [];
  // стартовые ячейки находятся в boards[0].cells[0].places
  return props.player.boards[0]?.cells[0]?.places ?? [];
});

function isChipAvailable(chip: Chip | null | undefined): boolean {
  if (!chip) return false;
  return props.availableChipIds?.includes(chip.id) ?? false;
}

function onChipClick(chip: Chip | null | undefined) {
  if (chip && isChipAvailable(chip)) {
    emit('chipClick', chip);
  }
}
</script>
<style scoped>
.corner {
  border: 1px solid var(--color);
}
.chip {
  width: 20px;
  height: 20px;
  border: 1px solid #ccc;
  background-color: var(--color);
}
.chip.available {
  border: 1px solid black;
}
</style>
