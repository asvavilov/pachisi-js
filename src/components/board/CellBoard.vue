<template>
  <div
    class="cell"
    :class="{
      [`player-${playerIndex}-cell`]: playerIndex !== undefined,
      [`board-${cell.board.type}-cell`]: cell.board.type !== undefined,
      [`cell-${cellIndex}`]: true,
      safe: !!cell.safe,
      highlighted: isCellHighlighted(cell),
    }"
    :style="{
      '--color':
        playerIndex !== undefined
          ? playerStore.players[playerIndex]!.color
          : cell.safe instanceof Player
            ? cell.safe.color
            : '#ccc',
    }"
    @click="onCellClick"
  >
    <template v-for="placeNum in cell.size" :key="placeNum">
      <ChipBoard v-if="cell.places[placeNum - 1]" :chip="cell.places[placeNum - 1]!" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Cell } from 'src/lib/cell';
import { Player, type PlayerIndex } from 'src/lib/player';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import ChipBoard from './ChipBoard.vue';

const props = defineProps<{
  cell: Cell;
  cellIndex: number;
  playerIndex?: PlayerIndex;
}>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

function isCellHighlighted(cell: Cell): boolean {
  // Store отдаёт целевые Cell — достаточно проверить вхождение.
  return gameStore.highlightedCells.includes(cell);
}

/**
 * 4.8: клик по подсвеченной ячейке — ход выбранной фишкой.
 */
function onCellClick() {
  if (isCellHighlighted(props.cell)) {
    gameStore.moveSelectedChipToCell(props.cell);
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
  cursor: pointer;
}
</style>
