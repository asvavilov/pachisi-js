<template>
  <div class="info-panel q-pa-md q-mb-md" style="background-color: #f0f0f0; border-radius: 8px">
    <div class="text-h6">Ход игры</div>
    <div>{{ gameStore.stateId }}</div>

    <!-- 1.1 Этап выбора первого игрока -->
    <div v-if="gameStore.stateId === GameStateEnum.SELECT_FIRST" class="q-mt-md">
      <div class="text-subtitle2 q-mb-sm">Выбор первого игрока:</div>
      <div class="q-mb-sm">
        Бросает игрок {{ gameStore.firstRollPlayerIndex }} ({{
          playerStore.players[gameStore.firstRollPlayerIndex]?.color
        }})
      </div>
      <div class="q-mb-sm">
        <div v-for="i in 4" :key="i" class="q-mb-xs">
          Игрок {{ i - 1 }}: {{ (gameStore.firstRollResults as any)[i - 1] || '—' }}
        </div>
      </div>
      <div
        v-if="
          gameStore.firstRollResults[0] &&
          gameStore.firstRollResults[1] &&
          gameStore.firstRollResults[2] &&
          gameStore.firstRollResults[3]
        "
      >
        Победитель выбора: игрок {{ getFirstPlayerIndex() }} ({{
          playerStore.players[getFirstPlayerIndex()]?.color
        }})
      </div>
    </div>

    <!-- Текущий игрок (не показываем на этапе SELECT_FIRST) -->
    <div
      v-if="gameStore.stateId !== GameStateEnum.SELECT_FIRST"
      class="row items-center q-gutter-lg"
    >
      <div v-if="playerStore.current">
        <strong>Текущий игрок:</strong>
        <span class="q-ml-sm" :style="{ color: playerStore.current.color }">
          {{ playerStore.current.color }} (игрок {{ playerStore.current.ind }})
        </span>
      </div>
    </div>

    <div>
      <button @click="gameStore.rollDice()" :disabled="!gameStore.state.canRollDice">
        Бросить кости
      </button>
      <span class="q-ml-md">
        <template v-if="diceStore.rolled">
          <input
            v-if="diceStore.items[0] !== undefined"
            type="number"
            min="1"
            max="6"
            v-model="diceStore.items[0]"
          />
          <input
            v-if="diceStore.items[1] !== undefined"
            type="number"
            min="1"
            max="6"
            v-model="diceStore.items[1]"
          />
          <!--{{ diceStore.items.join(' + ') }} = -->{{ diceStore.sum }}
          <span v-if="diceStore.used.length > 0"> (использовано: {{ usedDiceText }})</span>
          <span v-if="gameStore.currentBonusSteps.length > 0" class="q-ml-md" style="color: green">
            Бонусы доступны: {{ gameStore.currentBonusSteps.map((s) => `+${s}`).join(', ') }}
          </span>
        </template>
        <template v-else-if="gameStore.state.canRollDice">Бросьте кости</template>
      </span>
    </div>

    <!-- 1.3 Отображение счётчика дублей -->
    <div
      v-if="gameStore.doublesCount > 0 && gameStore.stateId !== GameStateEnum.SELECT_FIRST"
      class="q-mt-md"
      style="color: orange; font-weight: bold"
    >
      ⚠️ Дубли подряд: {{ gameStore.doublesCount }}/3
      <div v-if="gameStore.doublesCount >= 2" style="font-size: 0.85em; color: red">
        Следующий дубль вернёт ближайшую к финишу фишку на базу!
      </div>
    </div>
  </div>

  <div v-if="gameStore.selectedChip" class="q-mt-md selected-chip-panel">
    <strong>Выбрана фишка</strong> (доска: {{ gameStore.selectedChip.cell?.board.type }})
    <div
      v-for="step in gameStore.getPossibleStepsForChip(gameStore.selectedChip)"
      :key="step"
      class="q-mt-md"
    >
      <div class="text-subtitle2 q-mb-xs">Ход на {{ step }}:</div>
      <div
        v-for="(targetCell, idx) in gameStore.findTargetCellVariants(
          gameStore.selectedChip.cell,
          step,
        )"
        :key="idx"
        class="q-mt-xs"
      >
        <button @click="gameStore.moveChip(gameStore.selectedChip, step, targetCell)">
          Двинуть на {{ step }}
          <template v-if="targetCell.board.type === BoardType.home">
            (на финиш, ячейка
            {{ targetCell.board.cells.indexOf(targetCell) + 1 }})
          </template>
          <template v-else> (по основной доске) </template>
        </button>
      </div>
    </div>
    <button @click="gameStore.selectedChip = null">Отмена</button>
  </div>
  <div v-else class="q-mt-md">
    <strong>Доступные фишки:</strong> {{ gameStore.movableChips.length }}
  </div>

  <div v-if="gameStore.state.canFinishRoll" class="q-mt-md">
    <strong>Нет доступных шагов.</strong>
    <button @click="gameStore.nextPlayer">Завершить ход</button>
  </div>
</template>

<script setup lang="ts">
import { BoardType } from 'src/lib/board';
import { GameStateEnum } from 'src/lib/GameState';
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

/**
 * 1.1 Получить индекс первого игрока (с минимальным броском)
 */
const getFirstPlayerIndex = (): number => {
  const results = gameStore.firstRollResults;
  if (!results[0] && !results[1] && !results[2] && !results[3]) return -1;
  const values = [results[0], results[1], results[2], results[3]];
  const minVal = Math.min(...values);
  for (let i = 0; i < 4; i++) {
    if (values[i] === minVal) return i;
  }
  return -1;
};
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
