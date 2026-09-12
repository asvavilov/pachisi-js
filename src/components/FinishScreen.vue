<template>
  <q-dialog :model-value="true" persistent>
    <q-card class="finish-card q-pa-lg">
      <div class="text-h5 text-center q-mb-md">Партия завершена</div>

      <div class="places column q-gutter-sm q-mb-lg">
        <div
          v-for="(player, index) in playerStore.places"
          :key="player.ind"
          class="place row items-center q-pa-sm"
          :class="{ winner: index === 0 }"
        >
          <div class="rank text-weight-bold q-mr-md">{{ index + 1 }}</div>
          <div class="dot q-mr-md" :style="{ backgroundColor: player.color }" />
          <div>
            {{ player.ai ? 'ИИ' : 'Вы' }}
            <span class="text-caption text-grey-7">({{ player.color }})</span>
          </div>
        </div>
      </div>

      <div class="row justify-center">
        <q-btn color="primary" label="Новая партия" @click="game.newGame()" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';

const game = useGameStore();
const playerStore = usePlayerStore();
</script>

<style scoped>
.finish-card {
  min-width: 320px;
}
.place {
  border-radius: 8px;
  background: #f5f5f5;
}
.place.winner {
  background: #fff8e1;
}
.rank {
  min-width: 24px;
  text-align: center;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}
</style>
