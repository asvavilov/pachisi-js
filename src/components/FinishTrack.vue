<template>
  <div class="finish-track" :style="{ '--player-color': playerColor }">
    <div
      v-for="(cell, cellIdx) in finishBoard.cells"
      :key="cellIdx"
      class="finish-cell"
      :class="{ available: isChipAvailable(cell.places[0]) }"
      @click="onChipClick(cell.places[0])"
    >
      <div
        v-for="placeNum in cell.size"
        :key="placeNum"
        class="place"
        :class="{
          [`chip-${cell.places[placeNum - 1]?.player.color}`]: !!cell.places[placeNum - 1],
          available: isChipAvailable(cell.places[placeNum - 1]),
          finished: isChipFinished(cell.places[placeNum - 1]),
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Board } from 'src/lib/board';
import type { Chip } from 'src/lib/chip';

const props = defineProps<{
  finishBoard: Board;
  playerColor: string;
  availableChipIds?: number[];
}>();

const emit = defineEmits<{
  chipClick: [chip: Chip];
}>();

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
.finish-track {
  position: absolute;
  display: flex;
  pointer-events: auto;
  background-color: color-mix(in srgb, var(--player-color, gray) 15%, white);
  border-radius: 4px;
  padding: 2px;
}

.finish-cell {
  width: 30px;
  height: 30px;
  margin: 2px;
  background-color: color-mix(in srgb, var(--player-color, #ccc) 10%, white);
  border: 1px solid var(--player-color, #ccc);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.finish-cell .place {
  width: 10px;
  height: 10px;
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
