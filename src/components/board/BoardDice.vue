<template>
  <div class="board-dice column items-center">
    <!-- 4.7 вариант 2: пока нужен бросок ходящего человека — кнопка вместо костей.
         Как только кости брошены (WAIT_STEP) — показываем кости. -->
    <q-btn
      v-if="showRollButton"
      color="primary"
      dense
      size="sm"
      label="Бросить"
      @click="gameStore.rollDice()"
    />
    <DiceView v-else />

    <!-- 1.2/1.3 бонусы текущего хода (+10/+20) — под костями на базе -->
    <div v-if="bonusText" class="bonus text-caption">{{ bonusText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from 'src/stores/game';
import DiceView from '../DiceView.vue';

const gameStore = useGameStore();

/** Бросок доступен ходящему человеку (SELECT_FIRST / WAIT_ROLL, README п.2, 3). */
const showRollButton = computed(() => gameStore.state.canRollDice && !gameStore.isAiTurn);

/** Бонусные шаги текущего хода (за захват +20 и за вход в дом +10). */
const bonusText = computed(() =>
  gameStore.currentBonusSteps.length > 0
    ? `+ ${gameStore.currentBonusSteps.join(', ')}`
    : '',
);
</script>

<style scoped>
.board-dice {
  gap: 2px;
  max-width: 100%;
}
.bonus {
  color: #2e7d32;
  font-weight: 600;
  text-align: center;
  line-height: 1.1;
  max-width: 100%;
  overflow-wrap: anywhere;
}
</style>
