<template>
  <div
    class="corner"
    :class="[cornerClass, { current: isCurrentPlayer }]"
    :style="{ '--color': playerStore.players[player.ind]!.color }"
  >
    <div v-for="(chip, placeIndex) in places" :key="placeIndex" class="place">
      <ChipBoard v-if="chip" :chip="chip" />
    </div>

    <!-- 4.7: кости/кнопка броска текущего игрока — на его базе (экономия места в панели). -->
    <div v-if="isCurrentPlayer" class="base-dice">
      <BoardDice />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from 'src/stores/player';
import type { Player } from 'src/lib/player';
import ChipBoard from './ChipBoard.vue';
import BoardDice from './BoardDice.vue';

const props = defineProps<{
  player: Player;
}>();

const playerStore = usePlayerStore();

const cornerClass = computed(() => `corner-${props.player.ind}`);

/** 4.7: подсветка базы игрока, чей сейчас ход. */
const isCurrentPlayer = computed(
  () => playerStore.current !== undefined && playerStore.current.ind === props.player.ind,
);

const places = computed(() => {
  if (!props.player) return [];
  // стартовые ячейки находятся в boards[0].cells[0].places
  return props.player.baseBoard.cells[0]?.places ?? [];
});
</script>
<style scoped>
.corner {
  border: 1px solid var(--color);
  position: relative;
  /* 4.6: фишки базы — по углам сетки 2×2, центр свободен под кости/бонусы. */
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  padding: 2px;
  box-sizing: border-box;
}
.place:nth-child(1) {
  justify-self: start;
  align-self: start;
}
.place:nth-child(2) {
  justify-self: end;
  align-self: start;
}
.place:nth-child(3) {
  justify-self: start;
  align-self: end;
}
.place:nth-child(4) {
  justify-self: end;
  align-self: end;
}
.base-dice {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  /* Оверлей не должен перехватывать тапы — иначе нельзя выбрать фишки базы. */
  pointer-events: none;
}
/* Кликабельной оставляем только кнопку броска. */
.base-dice :deep(.q-btn) {
  pointer-events: auto;
}
.base-dice :deep(.die) {
  width: 28px;
  height: 28px;
  padding: 3px;
}
.base-dice :deep(.text-h6) {
  font-size: 0.9rem;
}
.corner.current {
  border: 3px solid var(--color);
  box-shadow: 0 0 8px 0 var(--color);
}
.corner :deep(.chip) {
  width: 28px;
  height: 28px;
}
@media (max-width: 768px), (orientation: landscape) and (max-height: 560px) {
  .corner :deep(.chip) {
    width: 20px;
    height: 20px;
  }
}
</style>
