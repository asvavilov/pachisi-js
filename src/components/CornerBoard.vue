<template>
  <div class="corner" :class="cornerClass" :style="{ backgroundColor: player?.color }">
    <div class="start-cells">
      <div
        v-for="chip in chips"
        :key="chip?.id"
        class="place"
        :class="{
          [`chip-${chip?.player.color}`]: !!chip,
          available: isChipAvailable(chip),
          finished: isChipFinished(chip),
        }"
        @click="onChipClick(chip)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from 'src/lib/player';
import type { Chip } from 'src/lib/chip';

const props = defineProps<{
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  player: Player | null;
  availableChipIds?: number[];
}>();

const emit = defineEmits<{
  chipClick: [chip: Chip];
}>();

const cornerClass = computed(() => `corner-${props.corner}`);

const chips = computed(() => {
  if (!props.player) return [];
  // стартовые ячейки находятся в boards[0].cells[0].places
  return props.player.boards[0]?.cells[0]?.places ?? [];
});

function isChipAvailable(chip: Chip | null | undefined): boolean {
  if (!chip) return false;
  return props.availableChipIds?.includes(chip.id) ?? false;
}

function isChipFinished(chip: Chip | null | undefined): boolean {
  return chip?.finished ?? false;
}

function onChipClick(chip: Chip | null | undefined) {
  if (chip && isChipAvailable(chip)) {
    emit('chipClick', chip);
  }
}
</script>

<style scoped>
.corner {
  width: 100px;
  height: 100px;
  border: 2px solid #333;
  border-radius: 10px;
  opacity: 0.8;
}

.corner-top-left {
  grid-column: 1;
  grid-row: 1;
}

.corner-top-right {
  grid-column: 3;
  grid-row: 1;
}

.corner-bottom-left {
  grid-column: 1;
  grid-row: 3;
}

.corner-bottom-right {
  grid-column: 3;
  grid-row: 3;
}

.start-cells {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 5px;
}

.place {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
}

.place.chip-green {
  border: 1px solid white;
  background-color: green;
}

.place.chip-yellow {
  border: 1px solid black;
  background-color: #ffcc00;
}

.place.chip-red {
  border: 1px solid white;
  background-color: red;
}

.place.chip-blue {
  border: 1px solid white;
  background-color: blue;
}

.place.available {
  box-shadow: 0 0 5px 2px gold;
  border-radius: 2px;
}

.place.finished {
  opacity: 0.5;
  filter: grayscale(70%);
  border: 1px dashed #333;
}
</style>
