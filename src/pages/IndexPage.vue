<template>
  <q-page class="game-page">
    <StartScreen v-if="game.stateId === GameStateEnum.START" />

    <div v-else class="game-layout">
      <div class="board-area">
        <MainBoard />
      </div>
      <div class="panel-area">
        <GamePanel />
      </div>
    </div>

    <FinishScreen v-if="game.stateId === GameStateEnum.FINISH" />
  </q-page>
</template>

<script setup lang="ts">
import MainBoard from 'src/components/board/MainBoard.vue';
import GamePanel from 'src/components/GamePanel.vue';
import StartScreen from 'src/components/StartScreen.vue';
import FinishScreen from 'src/components/FinishScreen.vue';
import { GameStateEnum } from 'src/lib/GameState';
import { useGameStore } from 'src/stores/game';
import { useAiDriver } from 'src/composables/useAiDriver';

const game = useGameStore();
useAiDriver();
</script>

<style scoped>
/* 9.5: edge-to-edge на Android (targetSdk 36). Capacitor SystemBars прокидывает
   --safe-area-inset-*; на веб-платформе они не заданы — fallback 0px. */
.game-page {
  padding: calc(var(--safe-area-inset-top, 0px) + 8px)
    calc(var(--safe-area-inset-right, 0px) + 8px)
    calc(var(--safe-area-inset-bottom, 0px) + 8px)
    calc(var(--safe-area-inset-left, 0px) + 8px);
}
.game-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
}
.board-area {
  flex: 0 0 auto;
}
.panel-area {
  flex: 1 1 320px;
  min-width: 0;
  max-width: 560px;
}

/* 4.6: портрет телефона — доска сверху, панель снизу */
@media (max-width: 768px) {
  .game-layout {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .panel-area {
    max-width: none;
  }
}

/* 4.6: ландшафт телефона — доска слева (по высоте), панель справа */
@media (orientation: landscape) and (max-height: 560px) {
  .game-layout {
    flex-direction: row;
    align-items: flex-start;
  }
  .panel-area {
    max-width: 420px;
  }
}
</style>
