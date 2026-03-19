<template>
  <div class="info-panel q-pa-md q-mb-md" style="background-color: #f0f0f0; border-radius: 8px">
    <div class="text-h6">Ход игры</div>
    <div class="row items-center q-gutter-lg">
      <div v-if="playerStore.current">
        <strong>Текущий игрок:</strong>
        <span class="q-ml-sm" :style="{ color: playerStore.current.color }">
          {{ playerStore.current.color }} (игрок {{ playerStore.current.ind }})
        </span>
      </div>
    </div>
  </div>

  <div>
    <button @click="gameStore.rollDice()" :disabled="!gameStore.canRollDice">Бросить кости</button>
    <span class="q-ml-md">
      <template v-if="diceStore.rolled">
        {{ diceStore.items.join(' + ') }} = {{ diceStore.sum }}
        <span v-if="diceStore.used.length > 0"> (использовано: {{ usedDiceText }})</span>
        <span v-if="gameStore.currentBonusSteps.length > 0" class="q-ml-md" style="color: green">
          Бонусы доступны: {{ gameStore.currentBonusSteps.map((s) => `+${s}`).join(', ') }}
        </span>
      </template>
      <template v-else-if="gameStore.canRollDice">Бросьте кости</template>
    </span>
  </div>

  <div v-if="gameStore.selectedChip" class="q-mt-md selected-chip-panel">
    <strong>Выбрана фишка</strong> (позиция: {{ gameStore.selectedChip.cell?.board.ind }})
    <div v-for="step in gameStore.availableStepsForSelectedChip" :key="step" class="q-mt-xs">
      <button @click="gameStore.moveChip(gameStore.selectedChip, step)">
        Двинуть на {{ step }}
      </button>
    </div>
    <button @click="gameStore.selectedChip = null">Отмена</button>
  </div>
  <div v-else class="q-mt-md">
    <strong>Доступные фишки:</strong> {{ gameStore.movableChips.length }}
    <span v-if="gameStore.movableChips.length === 0">Нет доступных ходов</span>
  </div>

  <div
    v-if="diceStore.rolled && (gameStore.movableChips.length === 0 || diceStore.isAllUsed === true)"
    class="q-mt-md"
  >
    <strong>Все кубики использованы. Ход завершён.</strong>
    <button @click="gameStore.nextPlayer">Завершить ход</button>
  </div>
</template>

<script setup lang="ts">
import { useDiceStore } from 'src/stores/dice';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import { computed } from 'vue';

const gameStore = useGameStore();
const diceStore = useDiceStore();
const playerStore = usePlayerStore();

const usedDiceText = computed(() => {
  return diceStore.used.join(', ') || 'нет';
});
</script>

<style scoped>
button {
  margin: 4px;
  padding: 8px 12px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.selected-chip-panel {
  background-color: #e8f4fd;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #b3d9ff;
}
</style>
