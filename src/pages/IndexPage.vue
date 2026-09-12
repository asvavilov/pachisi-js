<template>
  <q-page class="q-pa-md">
    <StartScreen v-if="game.stateId === GameStateEnum.START" />

    <div v-else class="row">
      <div class="col-auto">
        <MainBoard />
      </div>
      <div class="col">
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

<style scoped></style>
