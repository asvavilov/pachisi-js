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

    <div class="row items-center q-gutter-sm q-mt-sm">
      <q-btn
        color="primary"
        label="Бросить кости"
        :disable="!gameStore.state.canRollDice || gameStore.isAiTurn"
        @click="gameStore.rollDice()"
      />
      <DiceView />
      <span v-if="!diceStore.rolled && gameStore.state.canRollDice">Бросьте кости</span>
      <span v-if="gameStore.currentBonusSteps.length > 0" style="color: green">
        Бонусы доступны: {{ gameStore.currentBonusSteps.map((s) => `+${s}`).join(', ') }}
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
        Следующий дубль вернёт последнюю двинутую фишку на базу (если она не на цветной дорожке)!
      </div>
    </div>

    <!-- 4.7 Легенда индикации доски -->
    <div class="legend text-caption q-mt-md">
      <div class="legend-row"><span class="legend-box safe" /> безопасная клетка</div>
      <div class="legend-row">
        <span class="legend-box barrier" /> барьер (2 фишки одного цвета)
      </div>
      <div class="legend-row"><span class="legend-box current" /> база игрока, чей сейчас ход</div>
      <div class="legend-row">
        <span class="legend-box target" /> доступные ходы выбранной фишки
      </div>
    </div>
  </div>

  <q-card v-if="gameStore.selectedChip" class="q-mt-md selected-chip-panel">
    <q-card-section>
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
          <q-btn
            color="primary"
            size="sm"
            @click="gameStore.moveChip(gameStore.selectedChip, step, targetCell)"
          >
            Двинуть на {{ step }}
            <template v-if="targetCell.board.type === BoardType.home">
              (на финиш, ячейка
              {{ targetCell.board.cells.indexOf(targetCell) + 1 }})
            </template>
            <template v-else> (по основной доске) </template>
          </q-btn>
        </div>
      </div>
      <q-btn
        flat
        color="grey-8"
        label="Отмена"
        class="q-mt-md"
        @click="gameStore.selectedChip = null"
      />
    </q-card-section>
  </q-card>
  <div v-else class="q-mt-md">
    <strong>Доступные фишки:</strong> {{ gameStore.movableChips.length }}
  </div>

  <!-- Ход при отсутствии возможных ходов переходит автоматически (README п.13). -->

  <!-- Debug Panel (только в dev-режиме, 4.6) -->
  <DebugPanel v-if="isDev" />
</template>

<script setup lang="ts">
import { BoardType } from 'src/lib/board';
import { GameStateEnum } from 'src/lib/GameState';
import { useDiceStore } from 'src/stores/dice';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import DebugPanel from './DebugPanel.vue';
import DiceView from './DiceView.vue';

const gameStore = useGameStore();
const diceStore = useDiceStore();
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
.selected-chip-panel {
  background-color: #e8f4fd;
  border: 1px solid #b3d9ff;
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
.legend-box.current {
  border: 3px solid #ffb300;
  box-shadow: 0 0 6px 0 #ffb300;
}
.legend-box.target {
  border: 2px solid #000;
}
</style>
