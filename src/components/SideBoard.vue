<template>
  <div class="side" :class="side">
    <div
      v-for="idx in indices"
      :key="idx"
      class="cell"
      :class="{ safe: !!board.cells[idx]?.safe, highlighted: isCellHighlighted(idx) }"
    >
      <div class="cell-content">
        <div class="place-cells">
          <div
            v-for="placeNum in board.cells[idx]?.size"
            :key="placeNum"
            class="place"
            :class="{
              [`chip-${board.cells[idx]?.places[placeNum - 1]?.player.color}`]:
                !!board.cells[idx]?.places[placeNum - 1],
              available: isChipAvailable(board.cells[idx]?.places[placeNum - 1]),
              finished: isChipFinished(board.cells[idx]?.places[placeNum - 1]),
            }"
            :data-chip-id="board.cells[idx]?.places[placeNum - 1]?.id"
            @click="onChipClick(board.cells[idx]?.places[placeNum - 1])"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Board } from 'src/lib/board';
import type { Chip } from 'src/lib/chip';

const props = defineProps<{
  side: 'top' | 'right' | 'bottom' | 'left';
  indices: number[];
  board: Board;
  availableChipIds?: number[];
  highlightedCells?: number[];
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

function isCellHighlighted(index: number): boolean {
  return props.highlightedCells?.includes(index) ?? false;
}

function onChipClick(chip: Chip | null | undefined) {
  if (chip && isChipAvailable(chip)) {
    emit('chipClick', chip);
  }
}
</script>

<style scoped>
.side {
  display: flex;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.side.top {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.side.right {
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.side.bottom {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.side.left {
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.cell {
  width: 40px;
  height: 40px;
  margin: 2px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.cell:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

.cell.safe {
  background-color: #a0d8ff;
  border-color: #007acc;
}

.cell.highlighted {
  background-color: #ffeb3b;
  box-shadow: 0 0 8px 3px orange;
  border-color: #ff9800;
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.place-cells {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  margin: 2px 0;
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
