<template>
  <div
    class="cell"
    :class="{
      [`player-${playerIndex}-cell`]: playerIndex !== undefined,
      [`board-${boardIndex}-cell`]: boardIndex !== undefined,
      [`cell-${cellIndex}`]: true,
      safe: !!cell.safe,
      highlighted: isCellHighlighted(cellIndex),
    }"
    :style="{
      '--color':
        playerIndex !== undefined
          ? playerColor(playerIndex)
          : cell.safe instanceof Player
            ? cell.safe.color
            : '#ccc',
    }"
  >
    <div
      v-for="placeNum in cell.size"
      :key="placeNum"
      class="place"
      :class="{
        chip: !!cell.places[placeNum - 1],
        available: isChipAvailable(cell.places[placeNum - 1]),
        finished: isChipFinished(cell.places[placeNum - 1]),
      }"
      :style="{ '--color': cell.places[placeNum - 1]?.player.color }"
      :data-chip-id="cell.places[placeNum - 1]?.id"
      @click="onChipClick(cell.places[placeNum - 1])"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { Cell } from 'src/lib/cell';
import type { Chip } from 'src/lib/chip';
import { Player, playerColor, type PlayerIndex } from 'src/lib/player';

const props = defineProps<{
  cell: Cell;
  cellIndex: number;
  boardIndex?: number;
  playerIndex?: PlayerIndex;
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
.cell {
  border: 1px solid var(--color);
}
.cell.safe {
  background-color: #ccc;
  border-color: var(--color);
}
.chip {
  background-color: var(--color);
  width: 20px;
  height: 20px;
}
.chip.available {
  border: 1px solid black;
}
</style>
