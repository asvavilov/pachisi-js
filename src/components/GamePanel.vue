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
        Третий дубль вернёт последнюю двинутую фишку на базу — но только если второй дубль
        использован для хода и фишка не на цветной дорожке (п.7).
      </div>
    </div>

    <!-- Подсказки правил (README) -->
    <div v-if="hints.length" class="q-mt-sm">
      <div v-for="(hint, i) in hints" :key="i" class="hint-row" :style="{ color: hint.color }">
        {{ hint.text }}
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
import { computed } from 'vue';
import { GameStateEnum } from 'src/lib/GameState';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import DebugPanel from './DebugPanel.vue';

const gameStore = useGameStore();
const playerStore = usePlayerStore();

/** 4.6: debug-панель нужна только при разработке. */
const isDev = import.meta.env.DEV;

/**
 * Подсказки правил по текущему состоянию (README п.4, 6, 7, 8, 10, 12).
 * Показываются только в игровых состояниях, а не на старте/выборе первого/финише.
 */
interface RuleHint {
  text: string;
  color: string;
}

const hints = computed<RuleHint[]>(() => {
  const state = gameStore.stateId;
  if (
    state === GameStateEnum.START ||
    state === GameStateEnum.SELECT_FIRST ||
    state === GameStateEnum.FINISH
  ) {
    return [];
  }

  // Дубль, но ходов нет — снова доступен бросок (доп. бросок за дубль, README п.7).
  if (gameStore.noMovesAddonRoll) {
    return [
      {
        text: '🎲 Ходов нет. Дубль даёт дополнительный бросок — бросайте ещё раз (п.7).',
        color: '#ef6c00',
      },
    ];
  }

  const list: RuleHint[] = [];

  if (state === GameStateEnum.WAIT_STEP) {
    // README п.6: правило «+7».
    if (gameStore.isPlusSevenActive) {
      list.push({
        text: '7️⃣ Все 4 фишки в игре + дубль → ход = 7, отсюда «семёрка» вместо значения кубика (п.6).',
        color: '#6a1b9a',
      });
    }
    // README п.8: барьер + дубль — обязательный ход фишкой барьера.
    if (gameStore.isBarrierMoveRequired) {
      list.push({
        text: '🚧 Есть барьер и выпал дубль — обязаны сдвинуть фишку барьера (п.8).',
        color: '#c62828',
      });
    }
    // README п.4: выход с базы по сумме 5.
    if (gameStore.baseExitAvailable) {
      list.push({
        text: '🚪 Сумма 5 — можно вывести фишку с базы; при всех 4 в базе выходят сразу две (п.4).',
        color: '#1565c0',
      });
    }
    // README п.10, 12: бонусные шаги +20 / +10.
    if (gameStore.currentBonusSteps.length > 0) {
      const bonuses = [...new Set(gameStore.currentBonusSteps)].map((b) => `+${b}`).join(', ');
      list.push({
        text: `➕ Доступен бонус ${bonuses} (сбивание / вход в дом) — продвиньте любую свою фишку (п.10, 12).`,
        color: '#2e7d32',
      });
    }
    // README п.7: дубль — после хода будет ещё один бросок.
    if (gameStore.canAddonRollDice) {
      list.push({
        text: '🎲 Дубль — после хода будет дополнительный бросок (п.7).',
        color: '#ef6c00',
      });
    }
  }

  return list;
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
.hint-row {
  font-size: 0.9em;
  line-height: 1.3;
}
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
