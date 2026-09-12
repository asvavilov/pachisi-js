<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-auto">
        <MainBoard />
      </div>
      <div class="col">
        <GamePanel />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import MainBoard from 'src/components/board/MainBoard.vue';
import GamePanel from 'src/components/GamePanel.vue';
import { useGameStore } from 'src/stores/game';
import { useAiDriver } from 'src/composables/useAiDriver';

useAiDriver();

onMounted(() => {
  const game = useGameStore();
  game.initGame();
});
</script>

<style scoped></style>
