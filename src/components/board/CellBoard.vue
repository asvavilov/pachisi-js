<template>
  <div
    class="cell"
    :class="{
      [`player-${playerIndex}-cell`]: playerIndex !== undefined,
      [`board-${cell.board.type}-cell`]: cell.board.type !== undefined,
      [`cell-${cellIndex}`]: true,
      safe: !!cell.safe,
      highlighted: isCellHighlighted(cellIndex, cell),
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
import type { Cell } from 'src/lib/cell';
import { BoardType } from 'src/lib/board';
import { Player, type PlayerIndex } from 'src/lib/player';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import ChipBoard from './ChipBoard.vue';

defineProps<{
  cell: Cell;
  cellIndex: number;
  playerIndex?: PlayerIndex;
}>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

function isCellHighlighted(index: number, cell: Cell): boolean {
  const isHomeBoard = cell.board.type === BoardType.home;
  const highlightedIndices = gameStore.highlightedCellIndices;

  if (isHomeBoard) {
    // Для финишной доски проверяем индексы вида 1000 + localIndex
    return highlightedIndices.includes(1000 + index);
  } else {
    // Для основной доски проверяем обычные индексы
    return highlightedIndices.includes(index);
  }
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

.cell.highlighted {
  border-color: #000;
}
</style>
