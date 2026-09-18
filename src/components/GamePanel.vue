<template>
  <div class="info-panel q-pa-md q-mb-md" style="background-color: #f0f0f0; border-radius: 8px">
    <div class="text-subtitle2"><strong>Ход игры:</strong> {{ gameStore.stateId }}</div>

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

    <!-- 4.7: доступные фишки — компактно, вместо отдельного низа панели -->
    <div v-else class="q-mt-xs">
      Доступные фишки: <strong>{{ gameStore.movableChips.length }}</strong>
    </div>

    <!-- 1.3 Отображение счётчика дублей -->
    <div
      v-if="gameStore.doublesCount > 0 && gameStore.stateId !== GameStateEnum.SELECT_FIRST"
      class="q-mt-md"
      style="color: orange; font-weight: bold"
    >
      ⚠️ Дубли подряд: {{ gameStore.doublesCount }}/3
      <div v-if="gameStore.doublesCount >= 2" style="font-size: 0.85em; color: red">
        Следующий дубль вернёт последнюю двинутую фишку на базу (если она не на цветной дорожке)!
      </div>
    </div>

    <!-- 4.7 Легенда индикации доски -->
    <div class="legend text-caption q-mt-md">
      <div class="legend-row"><span class="legend-box safe" /> безопасная клетка</div>
      <div class="legend-row">
        <span class="legend-box barrier" /> барьер (2 фишки одного цвета)
      </div>
      <div class="legend-row">
        <span class="legend-box target" /> доступные ходы выбранной фишки
      </div>
    </div>
  </div>

  <!-- Ход при отсутствии возможных ходов переходит автоматически (README п.13). -->

  <!-- Debug Panel (только в dev-режиме, 4.6) -->
  <DebugPanel v-if="isDev" />
</template>

<script setup lang="ts">
import { GameStateEnum } from 'src/lib/GameState';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import DebugPanel from './DebugPanel.vue';

const gameStore = useGameStore();
const playerStore = usePlayerStore();

/** 4.6: debug-панель нужна только при разработке. */
const isDev = import.meta.env.DEV;

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
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend-box {
  width: 14px;
  height: 14px;
  display: inline-block;
  border: 1px solid #999;
}
.legend-box.safe {
  background-color: #ccc;
}
.legend-box.barrier {
  border: 2px solid #b71c1c;
}
.legend-box.target {
  border: 2px solid #000;
}
</style>
