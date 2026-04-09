<template>
  <div class="board">
    <CornerBoard v-for="player of playerStore.players" :key="player.ind" :player="player" />

    <CellBoard
      v-for="(cell, cellIndex) of boardStore.board.cells"
      :key="cellIndex"
      :cell="cell"
      :cell-index="cellIndex"
    />

    <template v-for="finishBoard in boardStore.finishBoards">
      <CellBoard
        v-for="(cell, cellIndex) of finishBoard.cells"
        :key="cellIndex"
        :cell="cell"
        :cell-index="cellIndex"
        :player-index="finishBoard.player?.ind!"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import CellBoard from './CellBoard.vue';
import CornerBoard from './CornerBoard.vue';
import { useBoardStore } from 'src/stores/board';
import { usePlayerStore } from 'src/stores/player';

const boardStore = useBoardStore();
const playerStore = usePlayerStore();
</script>
<style scoped>
.board {
  width: 600px;
  height: 600px;
  display: grid;
  grid-template-columns: repeat(22, 1fr);
  grid-template-rows: repeat(22, 1fr);
  grid-column-gap: 0px;
  grid-row-gap: 0px;
}

.corner-0 {
  grid-area: 15 / 15 / 23 / 23;
}
.corner-1 {
  grid-area: 1 / 15 / 9 / 23;
}
.corner-2 {
  grid-area: 1 / 1 / 9 / 9;
}
.corner-3 {
  grid-area: 15 / 1 / 23 / 9;
}

.cell.board-main-cell {
  position: relative;
}
.cell.board-main-cell.cell-0 {
  counter-reset: cell;
}
.cell.board-main-cell::after {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 10px;
  line-height: 100%;
  pointer-events: none;
  content: counter(cell);
  counter-increment: cell;
}

.board-main-cell.cell-0 {
  grid-area: 22 / 13 / 23 / 15;
}
.board-main-cell.cell-1 {
  grid-area: 21 / 13 / 22 / 15;
}
.board-main-cell.cell-2 {
  grid-area: 20 / 13 / 21 / 15;
}
.board-main-cell.cell-3 {
  grid-area: 19 / 13 / 20 / 15;
}
.board-main-cell.cell-4 {
  grid-area: 18 / 13 / 19 / 15;
}
.board-main-cell.cell-5 {
  grid-area: 17 / 13 / 18 / 15;
}
.board-main-cell.cell-6 {
  grid-area: 16 / 13 / 17 / 15;
}
.board-main-cell.cell-7 {
  grid-area: 15 / 13 / 16 / 15;
}

.board-main-cell.cell-8 {
  grid-area: 13 / 15 / 15 / 16;
}
.board-main-cell.cell-9 {
  grid-area: 13 / 16 / 15 / 17;
}
.board-main-cell.cell-10 {
  grid-area: 13 / 17 / 15 / 18;
}
.board-main-cell.cell-11 {
  grid-area: 13 / 18 / 15 / 19;
}
.board-main-cell.cell-12 {
  grid-area: 13 / 19 / 15 / 20;
}
.board-main-cell.cell-13 {
  grid-area: 13 / 20 / 15 / 21;
}
.board-main-cell.cell-14 {
  grid-area: 13 / 21 / 15 / 22;
}
.board-main-cell.cell-15 {
  grid-area: 13 / 22 / 15 / 23;
}

.board-main-cell.cell-16 {
  grid-area: 11 / 22 / 13 / 23;
}

.board-main-cell.cell-17 {
  grid-area: 9 / 22 / 11 / 23;
}
.board-main-cell.cell-18 {
  grid-area: 9 / 21 / 11 / 22;
}
.board-main-cell.cell-19 {
  grid-area: 9 / 20 / 11 / 21;
}
.board-main-cell.cell-20 {
  grid-area: 9 / 19 / 11 / 20;
}
.board-main-cell.cell-21 {
  grid-area: 9 / 18 / 11 / 19;
}
.board-main-cell.cell-22 {
  grid-area: 9 / 17 / 11 / 18;
}
.board-main-cell.cell-23 {
  grid-area: 9 / 16 / 11 / 17;
}
.board-main-cell.cell-24 {
  grid-area: 9 / 15 / 11 / 16;
}

.board-main-cell.cell-25 {
  grid-area: 8 / 13 / 9 / 15;
}
.board-main-cell.cell-26 {
  grid-area: 7 / 13 / 8 / 15;
}
.board-main-cell.cell-27 {
  grid-area: 6 / 13 / 7 / 15;
}
.board-main-cell.cell-28 {
  grid-area: 5 / 13 / 6 / 15;
}
.board-main-cell.cell-29 {
  grid-area: 4 / 13 / 5 / 15;
}
.board-main-cell.cell-30 {
  grid-area: 3 / 13 / 4 / 15;
}
.board-main-cell.cell-31 {
  grid-area: 2 / 13 / 3 / 15;
}
.board-main-cell.cell-32 {
  grid-area: 1 / 13 / 2 / 15;
}

.board-main-cell.cell-33 {
  grid-area: 1 / 11 / 2 / 13;
}

.board-main-cell.cell-34 {
  grid-area: 1 / 9 / 2 / 11;
}
.board-main-cell.cell-35 {
  grid-area: 2 / 9 / 3 / 11;
}
.board-main-cell.cell-36 {
  grid-area: 3 / 9 / 4 / 11;
}
.board-main-cell.cell-37 {
  grid-area: 4 / 9 / 5 / 11;
}
.board-main-cell.cell-38 {
  grid-area: 5 / 9 / 6 / 11;
}
.board-main-cell.cell-39 {
  grid-area: 6 / 9 / 7 / 11;
}
.board-main-cell.cell-40 {
  grid-area: 7 / 9 / 8 / 11;
}
.board-main-cell.cell-41 {
  grid-area: 8 / 9 / 9 / 11;
}

.board-main-cell.cell-42 {
  grid-area: 9 / 8 / 11 / 9;
}
.board-main-cell.cell-43 {
  grid-area: 9 / 7 / 11 / 8;
}
.board-main-cell.cell-44 {
  grid-area: 9 / 6 / 11 / 7;
}
.board-main-cell.cell-45 {
  grid-area: 9 / 5 / 11 / 6;
}
.board-main-cell.cell-46 {
  grid-area: 9 / 4 / 11 / 5;
}
.board-main-cell.cell-47 {
  grid-area: 9 / 3 / 11 / 4;
}
.board-main-cell.cell-48 {
  grid-area: 9 / 2 / 11 / 3;
}
.board-main-cell.cell-49 {
  grid-area: 9 / 1 / 11 / 2;
}

.board-main-cell.cell-50 {
  grid-area: 11 / 1 / 13 / 2;
}

.board-main-cell.cell-51 {
  grid-area: 13 / 1 / 15 / 2;
}
.board-main-cell.cell-52 {
  grid-area: 13 / 2 / 15 / 3;
}
.board-main-cell.cell-53 {
  grid-area: 13 / 3 / 15 / 4;
}
.board-main-cell.cell-54 {
  grid-area: 13 / 4 / 15 / 5;
}
.board-main-cell.cell-55 {
  grid-area: 13 / 5 / 15 / 6;
}
.board-main-cell.cell-56 {
  grid-area: 13 / 6 / 15 / 7;
}
.board-main-cell.cell-57 {
  grid-area: 13 / 7 / 15 / 8;
}
.board-main-cell.cell-58 {
  grid-area: 13 / 8 / 15 / 9;
}

.board-main-cell.cell-59 {
  grid-area: 15 / 9 / 16 / 11;
}
.board-main-cell.cell-60 {
  grid-area: 16 / 9 / 17 / 11;
}
.board-main-cell.cell-61 {
  grid-area: 17 / 9 / 18 / 11;
}
.board-main-cell.cell-62 {
  grid-area: 18 / 9 / 19 / 11;
}
.board-main-cell.cell-63 {
  grid-area: 19 / 9 / 20 / 11;
}
.board-main-cell.cell-64 {
  grid-area: 20 / 9 / 21 / 11;
}
.board-main-cell.cell-65 {
  grid-area: 21 / 9 / 22 / 11;
}
.board-main-cell.cell-66 {
  grid-area: 22 / 9 / 23 / 11;
}

.board-main-cell.cell-67 {
  grid-area: 22 / 11 / 23 / 13;
}

.player-0-cell.cell-0 {
  grid-area: 21 / 11 / 22 / 13;
}
.player-0-cell.cell-1 {
  grid-area: 20 / 11 / 21 / 13;
}
.player-0-cell.cell-2 {
  grid-area: 19 / 11 / 20 / 13;
}
.player-0-cell.cell-3 {
  grid-area: 18 / 11 / 19 / 13;
}
.player-0-cell.cell-4 {
  grid-area: 17 / 11 / 18 / 13;
}
.player-0-cell.cell-5 {
  grid-area: 16 / 11 / 17 / 13;
}
.player-0-cell.cell-6 {
  grid-area: 15 / 11 / 16 / 13;
}
.player-0-cell.cell-7 {
  grid-area: 13 / 11 / 15 / 13;
}

.player-1-cell.cell-0 {
  grid-area: 11 / 21 / 13 / 22;
}
.player-1-cell.cell-1 {
  grid-area: 11 / 20 / 13 / 21;
}
.player-1-cell.cell-2 {
  grid-area: 11 / 19 / 13 / 20;
}
.player-1-cell.cell-3 {
  grid-area: 11 / 18 / 13 / 19;
}
.player-1-cell.cell-4 {
  grid-area: 11 / 17 / 13 / 18;
}
.player-1-cell.cell-5 {
  grid-area: 11 / 16 / 13 / 17;
}
.player-1-cell.cell-6 {
  grid-area: 11 / 15 / 13 / 16;
}
.player-1-cell.cell-7 {
  grid-area: 11 / 13 / 13 / 15;
}

.player-2-cell.cell-0 {
  grid-area: 2 / 11 / 3 / 13;
}
.player-2-cell.cell-1 {
  grid-area: 3 / 11 / 4 / 13;
}
.player-2-cell.cell-2 {
  grid-area: 4 / 11 / 5 / 13;
}
.player-2-cell.cell-3 {
  grid-area: 5 / 11 / 6 / 13;
}
.player-2-cell.cell-4 {
  grid-area: 6 / 11 / 7 / 13;
}
.player-2-cell.cell-5 {
  grid-area: 7 / 11 / 8 / 13;
}
.player-2-cell.cell-6 {
  grid-area: 8 / 11 / 9 / 13;
}
.player-2-cell.cell-7 {
  grid-area: 9 / 11 / 11 / 13;
}

.player-3-cell.cell-0 {
  grid-area: 11 / 2 / 13 / 3;
}
.player-3-cell.cell-1 {
  grid-area: 11 / 3 / 13 / 4;
}
.player-3-cell.cell-2 {
  grid-area: 11 / 4 / 13 / 5;
}
.player-3-cell.cell-3 {
  grid-area: 11 / 5 / 13 / 6;
}
.player-3-cell.cell-4 {
  grid-area: 11 / 6 / 13 / 7;
}
.player-3-cell.cell-5 {
  grid-area: 11 / 7 / 13 / 8;
}
.player-3-cell.cell-6 {
  grid-area: 11 / 8 / 13 / 9;
}
.player-3-cell.cell-7 {
  grid-area: 11 / 9 / 13 / 11;
}

.center {
  grid-area: 9 / 9 / 15 / 15;
}
</style>
