<template>
  <div
    class="cell"
    :class="{
      [`player-${playerIndex}-cell`]: playerIndex !== undefined,
      [`board-${boardType}-cell`]: boardType !== undefined,
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
    <template v-for="placeNum in cell.size" :key="placeNum">
      <ChipBoard v-if="cell.places[placeNum - 1]" :chip="cell.places[placeNum - 1]!" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BoardType } from 'src/lib/board';
import type { Cell } from 'src/lib/cell';
import { Player, type PlayerIndex } from 'src/lib/player';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import ChipBoard from './ChipBoard.vue';

defineProps<{
  cell: Cell;
  cellIndex: number;
  boardType?: BoardType;
  playerIndex?: PlayerIndex;
}>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

function isCellHighlighted(index: number): boolean {
  return gameStore.highlightedCellIndices.includes(index);
}
</script>
<style scoped>
.cell {
  border: 1px solid var(--color);

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-around;
}
.cell.safe {
  background-color: #ccc;
  border-color: var(--color);
}

.board-main-cell.highlighted {
  border-color: #000;
}
</style>
