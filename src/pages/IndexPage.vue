<template>
  <q-page>
    <DiceBox></DiceBox>
    <button @click="step">step</button>
    <MainBoard></MainBoard>
  </q-page>
</template>

<script setup lang="ts">
import DiceBox from 'src/components/DiceBox.vue';
import MainBoard from 'src/components/MainBoard.vue';
import { useDiceStore } from 'src/stores/dice';
import { usePlayerStore } from 'src/stores/player';

const diceStore = useDiceStore();

const { items: players } = usePlayerStore();

const step = () => {
  // FIXME temporary test
  const pos = players[0].boards[1].cells.indexOf(players[0].chips[0].cell);
  console.log(pos);
  const cell = players[0].boards[1].cells[diceStore.items[0] + diceStore.items[1] + pos];
  players[0].chips[0].go(cell);
};
</script>
