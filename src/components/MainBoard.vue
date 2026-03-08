<template>
  <ul id="board_cells">
    <li v-for="(cell, idx) of board.cells" :key="idx" :class="{ safe: !!cell.safe }">
      <div v-if="cell.io?.board.ind === 0" class="cell-in">
        <div
          v-for="(cell2, idx2) of cell.io.board.cells"
          :key="idx2"
          class="place-cells"
          :style="{ 'background-color': cell.io.board.player?.color }"
        >
          <div
            v-for="placeNum of cell2.size"
            :key="placeNum"
            class="place"
            :class="{
              [`chip-${cell2.places[placeNum - 1]?.player.color}`]: !!cell2.places[placeNum - 1],
            }"
          ></div>
        </div>
      </div>
      <div class="place-cells">
        <div
          v-for="placeNum of cell.size"
          :key="placeNum"
          class="place"
          :class="{
            [`chip-${cell.places[placeNum - 1]?.player.color}`]: !!cell.places[placeNum - 1],
          }"
        ></div>
      </div>
      <div v-if="cell.io?.board.ind === 2" class="cell-out">
        <div
          v-for="(cell2, idx2) of cell.io.board.cells"
          :key="idx2"
          class="place-cells"
          :style="{ 'background-color': cell.io.board.player?.color }"
        >
          <div
            v-for="placeNum of cell2.size"
            :key="placeNum"
            class="place"
            :class="{
              [`chip-${cell2.places[placeNum - 1]?.player.color}`]: !!cell2.places[placeNum - 1],
            }"
          ></div>
        </div>
      </div>
    </li>
  </ul>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import { Board } from 'src/lib/board';
import { usePlayerStore } from 'src/stores/player';
import { firstElement, lastElement } from 'src/utils/array';

const { items: players } = usePlayerStore();

/**
 * карта ячеек безопасности
 */
const safes = {
  0: players[0]!,
  7: true,
  12: true,
  17: players[1]!,
  24: true,
  29: true,
  34: players[2]!,
  41: true,
  46: true,
  51: players[3]!,
  58: true,
  63: true,
};

/**
 * карта ячеек-переходов
 */
const ios = {
  0: lastElement(players[0]!.boards[0]!.cells)!,
  12: firstElement(players[1]!.boards[2]!.cells)!,
  17: lastElement(players[1]!.boards[0]!.cells)!,
  29: firstElement(players[2]!.boards[2]!.cells)!,
  34: lastElement(players[2]!.boards[0]!.cells)!,
  46: firstElement(players[3]!.boards[2]!.cells)!,
  51: lastElement(players[3]!.boards[0]!.cells)!,
  63: firstElement(players[0]!.boards[2]!.cells)!,
};

/**
 * общая глобальная доска
 */
const board = reactive(new Board(1, undefined, 68, safes, ios));

/**
 * связь игроков с общей доской и связи ячеек-переходов с общей доской
 */
players.forEach(function (player) {
  lastElement(player.boards[0]!.cells)!.io = board.cells[player.i_begin];
  player.boards[1] = board;
  firstElement(player.boards[2]!.cells)!.io = board.cells[player.i_end];
});
</script>
<style>
#board_cells {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#board_cells li {
  margin: 3px;
  padding: 0;
  float: left;
  width: 10px;
  background-color: #eee;
}
#board_cells li.safe {
  background-color: #bbb;
}
#board_cells li div {
  float: left;
}
#board_cells li .cell-in,
#board_cells li .cell-out {
  width: 100%;
  background-color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}
#board_cells li .cell-out {
  height: 340px;
}
#board_cells li .place-cells {
  margin: 5px 0;
  width: 100%;
}
#board_cells li .place-cells div {
  width: 60%;
  height: 10px;
  margin: 2px 20%;
  background-color: #fff;
}
#board_cells li .place-cells div.chip-green {
  border: 1px solid white;
  background-color: green;
}
#board_cells li .place-cells div.chip-yellow {
  border: 1px solid black;
  background-color: #ffcc00;
}
#board_cells li .place-cells div.chip-red {
  border: 1px solid white;
  background-color: red;
}
#board_cells li .place-cells div.chip-blue {
  border: 1px solid white;
  background-color: blue;
}
</style>
