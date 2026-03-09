<template>
  <div class="board-wrapper">
    <div class="board">
      <!-- Угол top-left -->
      <CornerBoard
        corner="top-left"
        :player="players[0] ?? null"
        :available-chip-ids="availableChipIdsArray"
        @chip-click="onChipClick"
      />
      <!-- Сторона top -->
      <SideBoard
        side="top"
        :indices="topIndices"
        :board="board"
        :available-chip-ids="availableChipIdsArray"
        :highlighted-cells="highlightedCellsArray"
        @chip-click="onChipClick"
      />
      <!-- Угол top-right -->
      <CornerBoard
        corner="top-right"
        :player="players[1] ?? null"
        :available-chip-ids="availableChipIdsArray"
        @chip-click="onChipClick"
      />
      <!-- Сторона left -->
      <SideBoard
        side="left"
        :indices="leftIndices"
        :board="board"
        :available-chip-ids="availableChipIdsArray"
        :highlighted-cells="highlightedCellsArray"
        @chip-click="onChipClick"
      />
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
          <FinishTrack
            v-for="(finishBoard, idx) in finishBoards"
            :key="idx"
            :finish-board="finishBoard"
            :player-color="players[idx]?.color ?? ''"
            :available-chip-ids="availableChipIdsArray"
            @chip-click="onChipClick"
          />
        </div>
      </div>
      <!-- Сторона right -->
      <SideBoard
        side="right"
        :indices="rightIndices"
        :board="board"
        :available-chip-ids="availableChipIdsArray"
        :highlighted-cells="highlightedCellsArray"
        @chip-click="onChipClick"
      />
      <!-- Угол bottom-left -->
      <CornerBoard
        corner="bottom-left"
        :player="players[3] ?? null"
        :available-chip-ids="availableChipIdsArray"
        @chip-click="onChipClick"
      />
      <!-- Сторона bottom -->
      <SideBoard
        side="bottom"
        :indices="bottomIndices"
        :board="board"
        :available-chip-ids="availableChipIdsArray"
        :highlighted-cells="highlightedCellsArray"
        @chip-click="onChipClick"
      />
      <!-- Угол bottom-right -->
      <CornerBoard
        corner="bottom-right"
        :player="players[2] ?? null"
        :available-chip-ids="availableChipIdsArray"
        @chip-click="onChipClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { Board } from 'src/lib/board';
import { usePlayerStore } from 'src/stores/player';
import { firstElement, lastElement } from 'src/utils/array';
import type { Chip } from 'src/lib/chip';
import SideBoard from './SideBoard.vue';
import CornerBoard from './CornerBoard.vue';
import FinishTrack from './FinishTrack.vue';

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

const availableChipIdsArray = computed(() => props.availableChipIds ?? []);
const highlightedCellsArray = computed(() => props.highlightedCells ?? []);

function onChipClick(chip: Chip) {
  if (chip && props.availableChipIds?.includes(chip.id)) {
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
</style>
