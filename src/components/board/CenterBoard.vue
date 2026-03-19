<template>
  <div class="center">
    <div
      v-for="player in players"
      :key="player.color"
      class="home-area"
      :class="{ [`home-area-${player.ind}`]: true }"
      :style="{ '--color': playerColor(player.ind) }"
    >
      <!-- дома игроков (пустые) -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { playerColor } from 'src/lib/player';
import { usePlayerStore } from 'src/stores/player';

const { items: players } = usePlayerStore();
</script>
<style scoped>
.center {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}
.home-area {
  border: 1px solid var(--color);
}
.home-area-0 {
  grid-area: 3 / 2 / 4 / 3;
}
.home-area-1 {
  grid-area: 2 / 3 / 3 / 4;
}
.home-area-2 {
  grid-area: 1 / 2 / 2 / 3;
}
.home-area-3 {
  grid-area: 2 / 1 / 3 / 2;
}
</style>
