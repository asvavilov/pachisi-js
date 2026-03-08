<template>
  <button @click="diceDrop">Dice:Drop</button>
  {{ diceStore.items }}
</template>

<script setup lang="ts">
import { useDiceStore } from 'src/stores/dice';

const diceStore = useDiceStore();

const diceDrop = () => {
  diceStore.drop();
  console.log(diceStore.items);
};
</script>
