<template>
  <div class="dice-view row items-center q-gutter-sm" :class="{ rolling }">
    <div
      v-for="(die, index) in dice"
      :key="index"
      class="die"
      :class="{ used: die.used, empty: die.value === 0, clickable }"
      :title="clickable ? 'Бросить кости' : undefined"
      @click="roll"
    >
      <span
        v-for="pip in 9"
        :key="pip"
        class="pip"
        :class="{ on: PIP_MAP[die.value]?.includes(pip) }"
      />
    </div>
    <div v-if="diceStore.rolled" class="text-h6 q-ml-sm">= {{ diceStore.sum }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue';
import { useDiceStore } from 'src/stores/dice';
import { useGameStore } from 'src/stores/game';

const diceStore = useDiceStore();
const gameStore = useGameStore();

// 4.5: короткая анимация броска при смене значений костей.
const rolling = ref(false);
let rollTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => diceStore.items.join(','),
  (value) => {
    if (!value) return;
    rolling.value = true;
    if (rollTimer !== null) clearTimeout(rollTimer);
    rollTimer = setTimeout(() => (rolling.value = false), 350);
  },
);
onScopeDispose(() => {
  if (rollTimer !== null) clearTimeout(rollTimer);
});

// 3×3, индексы 1..9 построчно.
const PIP_MAP: Record<number, number[]> = {
  0: [],
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

/** Кости с пометкой использованных (с учётом дублей). */
const dice = computed(() => {
  if (diceStore.items.length === 0) {
    return [
      { value: 0, used: false },
      { value: 0, used: false },
    ];
  }
  const used = [...diceStore.used];
  return diceStore.items.map((value) => {
    const idx = used.indexOf(value);
    if (idx >= 0) used.splice(idx, 1);
    return { value, used: idx >= 0 };
  });
});

/** Можно ли бросать (ход человека). */
const clickable = computed(
  () => gameStore.state.canRollDice && !gameStore.isAiTurn && diceStore.items.length === 0,
);

const roll = () => {
  if (clickable.value) gameStore.rollDice();
};
</script>

<style scoped>
.die {
  width: 40px;
  height: 40px;
  border: 1px solid #bbb;
  border-radius: 6px;
  background: #fff;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 4px;
  gap: 2px;
  box-sizing: border-box;
}
.die.empty {
  background: #f0f0f0;
}
.die.used {
  opacity: 0.35;
}
.die.clickable {
  cursor: pointer;
}
.die.clickable:hover {
  border-color: #1976d2;
}
.dice-view.rolling .die {
  animation: dice-roll 0.35s ease-out;
}

@keyframes dice-roll {
  0% {
    transform: rotate(0deg) scale(0.7);
  }
  50% {
    transform: rotate(180deg) scale(1.15);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
.pip {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: transparent;
}
.pip.on {
  background: #222;
}
</style>
