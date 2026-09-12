<template>
  <div class="start-screen column items-center q-pa-xl">
    <div class="text-h3 q-mb-sm">Парчис</div>
    <div class="text-subtitle1 text-grey-8 q-mb-xl">1 человек против 3 ИИ</div>

    <div class="row q-gutter-md q-mb-xl">
      <div
        v-for="player in playerStore.players"
        :key="player.ind"
        class="player-card column items-center q-pa-md"
        :style="{ borderColor: player.color }"
      >
        <div class="dot" :style="{ backgroundColor: player.color }" />
        <div class="text-weight-medium q-mt-sm">{{ player.ai ? 'ИИ' : 'Вы' }}</div>
        <div class="text-caption text-grey-7">{{ player.color }}</div>
      </div>
    </div>

    <q-btn color="primary" size="lg" label="Начать игру" @click="game.initGame()" />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';

const game = useGameStore();
const playerStore = usePlayerStore();
</script>

<style scoped>
.player-card {
  min-width: 96px;
  border: 2px solid;
  border-radius: 8px;
  background: #fafafa;
}
.dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
</style>
