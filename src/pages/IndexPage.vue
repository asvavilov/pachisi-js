<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-gutter-md">
      <button @click="rollAndMove">Сделать ход</button>
      <button @click="nextPlayer" :disabled="game.hasRolled">Пропустить ход</button>
      <span v-if="game.diceValues.length" class="q-ml-md">
        Кости: {{ game.diceValues }} (сумма: {{ game.diceSum }})
      </span>
    </div>
    <div class="info-panel q-pa-md q-mb-md" style="background-color: #f0f0f0; border-radius: 8px">
      <div class="text-h6">Ход игры</div>
      <div class="row items-center q-gutter-lg">
        <div>
          <strong>Текущий игрок:</strong>
          <span class="q-ml-sm" :style="{ color: currentPlayerColor }">
            {{ currentPlayerColor }} (игрок {{ currentPlayerIndex + 1 }})
          </span>
        </div>
        <div v-if="game.diceValues.length">
          <strong>Выпало:</strong>
          <span class="q-ml-sm dice-values">
            {{ game.diceValues.join(' и ') }} = сумма {{ game.diceSum }}
          </span>
        </div>
        <div v-else>
          <strong>Бросьте кости</strong>
        </div>
      </div>
    </div>

    <div class="q-mt-md">
      <strong>Доступные фишки:</strong> {{ movableChips.length }}
      <ul v-if="movableChips.length">
        <li v-for="(chip, idx) in movableChips" :key="idx">
          Фишка {{ idx + 1 }} (позиция: {{ chip.cell?.board.ind }})
          <button @click="moveChip(chip)">Выбрать</button>
        </li>
      </ul>
      <span v-else>Нет доступных ходов</span>
    </div>

    <MainBoard />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import MainBoard from 'src/components/MainBoard.vue';
import { useDiceStore } from 'src/stores/dice';
import { usePlayerStore } from 'src/stores/player';
import { Game } from 'src/lib/game';
import type { Chip } from 'src/lib/chip';

const diceStore = useDiceStore();
const { items: players } = usePlayerStore();

const game = ref<Game>(new Game(players));

const currentPlayerIndex = computed(() => game.value.currentPlayerIndex);
const currentPlayerColor = computed(() => game.value.currentPlayer.color);
const movableChips = computed(() => game.value.getMovableChips());

// Синхронизация костей с игрой
function syncDice() {
  if (diceStore.items.length > 0) {
    game.value.diceValues = [...diceStore.items];
    game.value.hasRolled = true;
  }
}

// Бросить кости и подготовить ход
function rollAndMove() {
  if (!game.value.hasRolled) {
    diceStore.drop();
    syncDice();
  }
  // Если есть доступные фишки, двигаем первую
  if (movableChips.value.length > 0) {
    const chip = movableChips.value[0]!;
    moveChip(chip);
  } else {
    // Нет доступных ходов - пропускаем ход
    game.value.nextTurn();
    diceStore.reset();
  }
}

// Переместить конкретную фишку
function moveChip(chip: Chip) {
  const success = game.value.moveChip(chip, game.value.diceSum);
  if (success) {
    // После успешного хода переходим к следующему игроку
    game.value.nextTurn();
    diceStore.reset();
  }
}

// Принудительно перейти к следующему игроку
function nextPlayer() {
  game.value.nextTurn();
  diceStore.reset();
}

// Инициализация
onMounted(() => {
  syncDice();
});
</script>

<style scoped>
button {
  margin: 4px;
  padding: 8px 12px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
