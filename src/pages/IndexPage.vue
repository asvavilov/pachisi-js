<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-gutter-md">
      <button @click="rollDice" :disabled="!canRollDice">Бросить кости</button>
      <span v-if="game.diceValues.length" class="q-ml-md">
        Кости: {{ game.diceValues }} (сумма: {{ game.diceSum }})
        <span v-if="!game.allDiceUsed"> (использовано: {{ usedDiceText }})</span>
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

    <div v-if="selectedChip" class="q-mt-md selected-chip-panel">
      <strong>Выбрана фишка</strong> (позиция: {{ selectedChip.cell?.board.ind }})
      <div v-for="step in availableStepsForSelectedChip" :key="step" class="q-mt-xs">
        <button @click="moveChip(selectedChip, step)">Двинуть на {{ step }}</button>
      </div>
      <button @click="selectedChip = null">Отмена</button>
    </div>

    <div v-else class="q-mt-md">
      <strong>Доступные фишки:</strong> {{ movableChips.length }}
      <span v-if="movableChips.length === 0">Нет доступных ходов</span>
    </div>

    <div v-if="game.allDiceUsed && game.diceValues.length" class="q-mt-md">
      <strong>Все кубики использованы. Ход завершён.</strong>
      <button @click="finishTurn">Завершить ход</button>
    </div>

    <MainBoard
      :available-chip-ids="availableChipIds"
      :highlighted-cells="highlightedCellIndices"
      @chip-click="onChipClick"
    />
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
const selectedChip = ref<Chip | null>(null);

const currentPlayerIndex = computed(() => game.value.currentPlayerIndex);
const currentPlayerColor = computed(() => game.value.currentPlayer.color);
const movableChips = computed(() => game.value.getMovableChips());
const availableChipIds = computed(() => movableChips.value.map((chip) => chip.id));
const usedDiceText = computed(() => {
  const used = game.value.usedDice;
  const dice = game.value.diceValues;
  const parts = [];
  if (used[0]) parts.push(`первый (${dice[0]})`);
  if (used[1]) parts.push(`второй (${dice[1]})`);
  return parts.join(', ') || 'нет';
});

// Можно ли бросить кости
const canRollDice = computed(() => !game.value.hasRolled);

// Шаги для выбранной фишки
const availableStepsForSelectedChip = computed(() => {
  if (!selectedChip.value) return [];
  return game.value.getPossibleStepsForChip(selectedChip.value);
});

// Индексы ячеек для подсветки (целевые ячейки для выбранной фишки)
const highlightedCellIndices = computed(() => {
  const indices: number[] = [];
  if (!selectedChip.value) return indices;
  const board = game.value.currentPlayer.boards[1]; // главная доска
  if (!board) return indices;
  for (const step of availableStepsForSelectedChip.value) {
    const targetCell = game.value.findTargetCell(selectedChip.value.cell!, step);
    if (targetCell && targetCell.board === board) {
      const idx = board.cells.indexOf(targetCell);
      if (idx !== -1) indices.push(idx);
    }
  }
  return indices;
});

// Обработчик клика на фишку
function onChipClick(chip: Chip) {
  if (availableChipIds.value.includes(chip.id)) {
    selectedChip.value = chip;
  }
}

// Синхронизация костей с игрой
function syncDice() {
  if (diceStore.items.length > 0) {
    game.value.diceValues = [...diceStore.items];
    game.value.hasRolled = true;
    game.value.usedDice = [false, false];
  }
}

// Бросить кости
function rollDice() {
  diceStore.drop();
  syncDice();
  selectedChip.value = null;
}

// Переместить конкретную фишку на заданное количество шагов
function moveChip(chip: Chip, steps: number) {
  // Определяем индекс кубика по значению шага
  let dieIndex = -1;
  if (steps === game.value.diceValues[0] && !game.value.usedDice[0]) {
    dieIndex = 0;
  } else if (steps === game.value.diceValues[1] && !game.value.usedDice[1]) {
    dieIndex = 1;
  } else if (steps === game.value.diceSum && !game.value.usedDice[0] && !game.value.usedDice[1]) {
    dieIndex = -1;
  } else {
    // Шаг не соответствует доступным кубикам
    console.error('Недопустимый шаг');
    return;
  }
  const success = game.value.moveChip(chip, steps, dieIndex);
  if (success) {
    selectedChip.value = null;
    // После успешного хода проверяем, все ли кубики использованы
    if (game.value.allDiceUsed) {
      finishTurn();
    }
  }
}

// Завершить ход и перейти к следующему игроку
function finishTurn() {
  game.value.nextTurn();
  diceStore.reset();
  selectedChip.value = null;
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
.selected-chip-panel {
  background-color: #e8f4fd;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #b3d9ff;
}
</style>
