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
          ? playerStore.players[playerIndex]!.color
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
        available: gameStore.isChipAvailable(cell.places[placeNum - 1]),
        selected: gameStore.selectedChip && gameStore.selectedChip === cell.places[placeNum - 1],
        finished: isChipFinished(cell.places[placeNum - 1]),
      }"
      :style="{ '--color': cell.places[placeNum - 1]?.player.color }"
      :data-chip-id="cell.places[placeNum - 1]?.id"
      @click="gameStore.onChipClick(cell.places[placeNum - 1])"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { Cell } from 'src/lib/cell';
import type { Chip } from 'src/lib/chip';
import { Player, type PlayerIndex } from 'src/lib/player';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';

defineProps<{
  cell: Cell;
  cellIndex: number;
  boardIndex?: number;
  playerIndex?: PlayerIndex;
}>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

function isChipFinished(chip: Chip | null | undefined): boolean {
  return chip?.finished ?? false;
}

function isCellHighlighted(index: number): boolean {
  return gameStore.highlightedCellIndices.includes(index);
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
  opacity: 0.5;
}
.chip.available {
  opacity: 1;
}
.chip.selected {
  border: 1px solid black;
}
</style>
