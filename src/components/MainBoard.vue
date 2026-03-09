<template>
  <div class="board-wrapper">
    <div class="board">
      <!-- Угол top-left -->
      <div class="corner corner-top-left" :style="{ backgroundColor: players[0]?.color }">
        <div class="start-cells">
          <div
            v-for="chip in players[0]?.boards[0]?.cells[0]?.places"
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
      <!-- Сторона top -->
      <div class="side top">
        <div
          v-for="idx in topIndices"
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
      <!-- Угол top-right -->
      <div class="corner corner-top-right" :style="{ backgroundColor: players[1]?.color }">
        <div class="start-cells">
          <div
            v-for="chip in players[1]?.boards[0]?.cells[0]?.places"
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
      <!-- Сторона left -->
      <div class="side left">
        <div
          v-for="idx in leftIndices"
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
      <!-- Центр -->
      <div class="center">
        <div class="home-areas">
          <div
            v-for="player in homeAreasOrdered"
            :key="player.color"
            class="home-area"
            :style="{ backgroundColor: player.color }"
          >
            <!-- дома игроков (пустые) -->
          </div>
        </div>
        <!-- Финишные дорожки -->
        <div class="finish-tracks">
          <div
            v-for="(finishBoard, idx) in finishBoards"
            :key="idx"
            class="finish-track"
            :style="{ '--player-color': players[idx]?.color }"
          >
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
        </div>
      </div>
      <!-- Сторона right -->
      <div class="side right">
        <div
          v-for="idx in rightIndices"
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
      <!-- Угол bottom-left -->
      <div class="corner corner-bottom-left" :style="{ backgroundColor: players[3]?.color }">
        <div class="start-cells">
          <div
            v-for="chip in players[3]?.boards[0]?.cells[0]?.places"
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
      <!-- Сторона bottom -->
      <div class="side bottom">
        <div
          v-for="idx in bottomIndices"
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
      <!-- Угол bottom-right -->
      <div class="corner corner-bottom-right" :style="{ backgroundColor: players[2]?.color }">
        <div class="start-cells">
          <div
            v-for="chip in players[2]?.boards[0]?.cells[0]?.places"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { Board } from 'src/lib/board';
import { usePlayerStore } from 'src/stores/player';
import { firstElement, lastElement } from 'src/utils/array';
import type { Chip } from 'src/lib/chip';

const { items: players } = usePlayerStore();

const props = defineProps<{
  availableChipIds?: number[];
  highlightedCells?: number[]; // индексы ячеек главной доски для подсветки
}>();

const emit = defineEmits<{
  chipClick: [chip: Chip];
}>();

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

const topIndices = computed(() => Array.from({ length: 17 }, (_, i) => i)); // 0-16
const rightIndices = computed(() => Array.from({ length: 17 }, (_, i) => i + 17)); // 17-33
const bottomIndices = computed(() => Array.from({ length: 17 }, (_, i) => i + 34).reverse()); // 34-50 справа налево
const leftIndices = computed(() => Array.from({ length: 17 }, (_, i) => i + 51).reverse()); // 51-67 снизу вверх

const finishBoards = computed(() => players.map((p) => p.boards[2]!));

const homeAreasOrdered = computed(() => [
  players[0]!, // green -> top-left
  players[1]!, // yellow -> top-right
  players[3]!, // blue -> bottom-left
  players[2]!, // red -> bottom-right
]);

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
.board-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.board {
  display: grid;
  grid-template-columns: 100px 1fr 100px;
  grid-template-rows: 100px 1fr 100px;
  width: 800px;
  height: 800px;
  gap: 2px;
  position: relative;
}

.side {
  display: flex;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.side.top {
  grid-column: 2;
  grid-row: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.side.right {
  grid-column: 3;
  grid-row: 2;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 60px;
}

.side.bottom {
  grid-column: 2;
  grid-row: 3;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.side.left {
  grid-column: 1;
  grid-row: 2;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 60px;
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
.center {
  grid-column: 2;
  grid-row: 2;
  background-color: #fff;
  border: 2px solid #333;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.home-areas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  width: 80%;
  height: 80%;
}

.home-area {
  border-radius: 10px;
  opacity: 0.7;
}
.start-cells {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 5px;
}

.finish-tracks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.finish-track {
  position: absolute;
  display: flex;
  pointer-events: auto;
  background-color: color-mix(in srgb, var(--player-color, gray) 15%, white);
  border-radius: 4px;
  padding: 2px;
}

/* green - left side, horizontal track to the right */
.finish-track:nth-child(1) {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: row;
}

/* yellow - top side, vertical track down */
.finish-track:nth-child(2) {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column;
}

/* red - right side, horizontal track to the left */
.finish-track:nth-child(3) {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: row-reverse;
}

/* blue - bottom side, vertical track up */
.finish-track:nth-child(4) {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  flex-direction: column-reverse;
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
</style>
