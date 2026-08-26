<template>
  <div class="debug-panel">
    <div class="debug-header" @click="expanded = !expanded">
      <span>🔧 Debug Panel</span>
      <span class="debug-toggle">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <div v-if="expanded" class="debug-body">
      <!-- Секция: Позиции фишек -->
      <div class="debug-section">
        <div class="debug-section-title" @click="showChips = !showChips">
          🎯 Позиции фишек {{ showChips ? '▼' : '▶' }}
        </div>
        <div v-if="showChips" class="debug-section-body">
          <div v-for="player in playerStore.players" :key="player.ind" class="debug-player-group">
            <div class="debug-player-label" :style="{ color: player.color }">
              Игрок {{ player.ind }} ({{ player.color }})
            </div>
            <div v-for="chip in player.chips" :key="chip.id" class="debug-chip-row">
              <span class="debug-chip-label">Фишка #{{ chip.id }}:</span>
              <select
                :value="getChipLocationKey(chip)"
                @change="moveChipToLocation(chip, ($event.target as HTMLSelectElement).value)"
                class="debug-select"
              >
                <optgroup label="База">
                  <option :value="`base:0`">База</option>
                </optgroup>
                <optgroup label="Основная доска">
                  <option v-for="i in 68" :key="'main-' + i" :value="`main:${i - 1}`">
                    main[{{ i - 1 }}]
                  </option>
                </optgroup>
                <optgroup :label="`Финиш (${player.color})`">
                  <option v-for="i in 8" :key="'home-' + i" :value="`home:${i - 1}:${player.ind}`">
                    home[{{ i - 1 }}]
                  </option>
                </optgroup>
              </select>
              <span class="debug-chip-status" :class="{ finished: chip.finished }">
                {{ chip.finished ? '✅' : chip.cell?.board.type === 'base' ? '🏠' : '🎲' }}
              </span>
            </div>
          </div>
          <button class="debug-btn" @click="applyChipPositions">Применить позиции</button>
        </div>
      </div>

      <!-- Секция: Кости -->
      <div class="debug-section">
        <div class="debug-section-title" @click="showDice = !showDice">
          🎲 Кости {{ showDice ? '▼' : '▶' }}
        </div>
        <div v-if="showDice" class="debug-section-body">
          <div class="debug-row">
            <label>Кубик 1:</label>
            <input
              type="number"
              min="1"
              max="6"
              v-model.number="debugDice[0]"
              class="debug-input"
            />
            <label>Кубик 2:</label>
            <input
              type="number"
              min="1"
              max="6"
              v-model.number="debugDice[1]"
              class="debug-input"
            />
          </div>
          <div class="debug-row">
            <label>Использовано:</label>
            <input
              type="text"
              v-model="debugUsedText"
              class="debug-input debug-input-wide"
              placeholder="например: 3,5"
            />
          </div>
          <div class="debug-row">
            <label>Бонусы:</label>
            <input
              type="text"
              v-model="debugBonusText"
              class="debug-input debug-input-wide"
              placeholder="например: 10,20"
            />
          </div>
          <div class="debug-row">
            <label>Счётчик дублей:</label>
            <input
              type="number"
              min="0"
              max="3"
              v-model.number="debugDoublesCount"
              class="debug-input"
            />
          </div>
          <div class="debug-row">
            <label>Состояние:</label>
            <select v-model="debugStateId" class="debug-select">
              <option v-for="s in gameStates" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div class="debug-actions">
            <button class="debug-btn" @click="applyDiceState">Применить кости</button>
            <button class="debug-btn" @click="resetDiceState">Сбросить</button>
          </div>
        </div>
      </div>

      <!-- Секция: JSON -->
      <div class="debug-section">
        <div class="debug-section-title" @click="showJson = !showJson">
          📋 JSON {{ showJson ? '▼' : '▶' }}
        </div>
        <div v-if="showJson" class="debug-section-body">
          <textarea
            v-model="debugJson"
            class="debug-textarea"
            rows="8"
            placeholder='{"state":"WAIT_STEP","currentPlayer":0,"dice":[5,3],...}'
          ></textarea>
          <div class="debug-actions">
            <button class="debug-btn" @click="applyJson">Применить JSON</button>
            <button class="debug-btn" @click="copyJson">Копировать текущее состояние</button>
          </div>
        </div>
      </div>

      <!-- Секция: Лог -->
      <div class="debug-section">
        <div class="debug-section-title" @click="showLog = !showLog">
          📜 Лог вычислений {{ showLog ? '▼' : '▶' }}
          <span class="debug-log-count">({{ gameStore.debug.log.length }})</span>
        </div>
        <div v-if="showLog" class="debug-section-body">
          <div class="debug-log-controls">
            <label>
              <input type="checkbox" v-model="gameStore.debug.enabled" />
              Включить лог
            </label>
            <label>
              <input type="checkbox" v-model="logAutoScroll" />
              Автоскролл
            </label>
            <button class="debug-btn debug-btn-sm" @click="gameStore.clearDebugLog()">
              Очистить
            </button>
          </div>
          <div ref="logContainer" class="debug-log-container">
            <div
              v-for="(entry, idx) in gameStore.debug.log"
              :key="idx"
              class="debug-log-entry"
              :class="'debug-log-' + entry.type"
            >
              <span class="debug-log-icon">{{ logIcon(entry.type) }}</span>
              <span class="debug-log-fn">{{ entry.function }}</span>
              <span class="debug-log-msg">{{ entry.message }}</span>
              <span v-if="entry.data" class="debug-log-data">{{ JSON.stringify(entry.data) }}</span>
            </div>
            <div v-if="gameStore.debug.log.length === 0" class="debug-log-empty">
              Лог пуст. Сделайте ход, чтобы увидеть записи.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { useGameStore } from 'src/stores/game';
import { usePlayerStore } from 'src/stores/player';
import { useDiceStore } from 'src/stores/dice';
import { useBoardStore } from 'src/stores/board';
import { GameStateEnum } from 'src/lib/GameState';
import { BoardType } from 'src/lib/board';
import type { Chip } from 'src/lib/chip';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const diceStore = useDiceStore();
const boardStore = useBoardStore();

// Состояние панели
const expanded = ref(false);
const showChips = ref(true);
const showDice = ref(true);
const showJson = ref(false);
const showLog = ref(true);
const logAutoScroll = ref(true);
const logContainer = ref<HTMLElement | null>(null);

// Данные для редактирования
const debugDice = ref<[number, number]>([1, 1]);
const debugUsedText = ref('');
const debugBonusText = ref('');
const debugDoublesCount = ref(0);
const debugStateId = ref<GameStateEnum>(GameStateEnum.WAIT_ROLL);
const debugJson = ref('');

// Временные позиции фишек (ключ -> location)
const chipPositions = ref<Record<number, string>>({});

const gameStates = [
  { value: GameStateEnum.START, label: 'START' },
  { value: GameStateEnum.SELECT_FIRST, label: 'SELECT_FIRST' },
  { value: GameStateEnum.WAIT_ROLL, label: 'WAIT_ROLL' },
  { value: GameStateEnum.WAIT_STEP, label: 'WAIT_STEP' },
  { value: GameStateEnum.WAIT_PLAYER, label: 'WAIT_PLAYER' },
  { value: GameStateEnum.FINISH, label: 'FINISH' },
];

// ---- Утилиты ----

const getChipLocationKey = (chip: Chip): string => {
  if (!chip.cell) return 'base:0';
  const board = chip.cell.board;
  if (board.type === BoardType.base) return 'base:0';
  if (board.type === BoardType.home) {
    const idx = board.cells.indexOf(chip.cell);
    return `home:${idx}:${board.player?.ind ?? 0}`;
  }
  // main
  const idx = boardStore.board.cells.indexOf(chip.cell);
  return `main:${idx}`;
};

const moveChipToLocation = (chip: Chip, location: string) => {
  chipPositions.value[chip.id] = location;
};

const applyChipPositions = () => {
  for (const player of playerStore.players) {
    for (const chip of player.chips) {
      const loc = chipPositions.value[chip.id];
      if (!loc) continue;
      const parts = loc.split(':');
      const type = parts[0];
      const idx = parseInt(parts[1]!, 10);

      let targetCell = null;
      if (type === 'base') {
        targetCell = player.baseBoard.cells[0]!;
      } else if (type === 'main') {
        targetCell = boardStore.board.cells[idx]!;
      } else if (type === 'home') {
        targetCell = player.homeBoard.cells[idx]!;
      }

      if (targetCell && targetCell !== chip.cell) {
        chip.go(targetCell);
        gameStore.debugLogPush('applyChipPositions', `Фишка #${chip.id} → ${type}[${idx}]`, 'info');
      }
    }
  }
  // Сбросить выделение
  gameStore.selectedChip = null;
};

// ---- Управление костями ----

const applyDiceState = () => {
  // Устанавливаем значения костей напрямую
  diceStore.items.splice(0, diceStore.items.length, debugDice.value[0], debugDice.value[1]);
  // Сбрасываем used
  diceStore.used.splice(0, diceStore.used.length);
  // Устанавливаем used из текста
  if (debugUsedText.value.trim()) {
    const usedValues = debugUsedText.value
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    for (const v of usedValues) {
      diceStore.use(v);
    }
  }
  // Устанавливаем бонусы
  gameStore.currentBonusSteps.splice(0, gameStore.currentBonusSteps.length);
  if (debugBonusText.value.trim()) {
    const bonusValues = debugBonusText.value
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    for (const v of bonusValues) {
      gameStore.currentBonusSteps.push(v);
    }
  }
  // Устанавливаем счётчик дублей
  gameStore.doublesCount = debugDoublesCount.value;
  // Устанавливаем состояние
  gameStore.stateId = debugStateId.value;

  gameStore.debugLogPush(
    'applyDiceState',
    `Кости: [${debugDice.value.join(', ')}], used: [${debugUsedText.value}], бонусы: [${debugBonusText.value}], состояние: ${debugStateId.value}`,
    'info',
  );
};

const resetDiceState = () => {
  debugDice.value = [1, 1];
  debugUsedText.value = '';
  debugBonusText.value = '';
  debugDoublesCount.value = 0;
  debugStateId.value = GameStateEnum.WAIT_ROLL;
  diceStore.reset();
  gameStore.currentBonusSteps.splice(0, gameStore.currentBonusSteps.length);
  gameStore.doublesCount = 0;
  gameStore.debugLogPush('resetDiceState', 'Кости сброшены', 'info');
};

// ---- JSON ----

const getCurrentStateJson = (): string => {
  const chips = playerStore.players.flatMap((player) =>
    player.chips.map((chip) => {
      let cellType = 'base';
      let cellIndex = 0;
      if (chip.cell) {
        if (chip.cell.board.type === BoardType.main) {
          cellType = 'main';
          cellIndex = boardStore.board.cells.indexOf(chip.cell);
        } else if (chip.cell.board.type === BoardType.home) {
          cellType = 'home';
          cellIndex = chip.cell.board.cells.indexOf(chip.cell);
        }
      }
      return {
        player: player.ind,
        chipIndex: player.chips.indexOf(chip),
        cellType,
        cellIndex,
        finished: chip.finished,
      };
    }),
  );

  const state = {
    state: gameStore.stateId,
    currentPlayer: playerStore.currentIndex,
    dice: [...diceStore.items],
    usedDice: [...diceStore.used],
    bonusSteps: [...gameStore.currentBonusSteps],
    doublesCount: gameStore.doublesCount,
    chips,
  };

  return JSON.stringify(state, null, 2);
};

const applyJson = () => {
  try {
    const state = JSON.parse(debugJson.value);
    gameStore.debugLogPush('applyJson', 'Загрузка состояния из JSON', 'info');

    // Устанавливаем состояние
    if (state.state) gameStore.stateId = state.state;
    if (state.currentPlayer !== undefined) playerStore.init(state.currentPlayer);

    // Устанавливаем кости
    if (state.dice) {
      diceStore.items.splice(0, diceStore.items.length, ...state.dice);
    }
    if (state.usedDice) {
      diceStore.used.splice(0, diceStore.used.length, ...state.usedDice);
    }
    if (state.bonusSteps) {
      gameStore.currentBonusSteps.splice(
        0,
        gameStore.currentBonusSteps.length,
        ...state.bonusSteps,
      );
    }
    if (state.doublesCount !== undefined) gameStore.doublesCount = state.doublesCount;

    // Устанавливаем позиции фишек
    if (state.chips) {
      for (const chipState of state.chips) {
        const player = playerStore.players[chipState.player];
        if (!player) continue;
        const chip = player.chips[chipState.chipIndex];
        if (!chip) continue;

        let targetCell = null;
        if (chipState.cellType === 'base') {
          targetCell = player.baseBoard.cells[0]!;
        } else if (chipState.cellType === 'main') {
          targetCell = boardStore.board.cells[chipState.cellIndex]!;
        } else if (chipState.cellType === 'home') {
          targetCell = player.homeBoard.cells[chipState.cellIndex]!;
        }

        if (targetCell && targetCell !== chip.cell) {
          chip.go(targetCell);
        }
        if (chipState.finished) {
          chip.finished = true;
        } else {
          chip.finished = false;
        }
      }
    }

    gameStore.debugLogPush('applyJson', 'Состояние загружено успешно', 'success');
  } catch (e) {
    gameStore.debugLogPush('applyJson', `Ошибка загрузки JSON: ${String(e)}`, 'error');
  }
};

const copyJson = () => {
  debugJson.value = getCurrentStateJson();
  gameStore.debugLogPush('copyJson', 'Текущее состояние скопировано в JSON', 'info');
};

// ---- Лог ----

const logIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'error':
      return '🔴';
    default:
      return '🔵';
  }
};

// Автоскролл лога
watch(
  () => gameStore.debug.log.length,
  async () => {
    if (logAutoScroll.value && logContainer.value) {
      await nextTick();
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  },
);
</script>

<style scoped>
.debug-panel {
  margin-top: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  font-family: monospace;
  font-size: 12px;
}

.debug-header {
  background: #2c3e50;
  color: white;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.debug-toggle {
  font-size: 10px;
}

.debug-body {
  background: #f8f9fa;
  padding: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
}

.debug-section-title {
  background: #e9ecef;
  padding: 6px 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-section-body {
  padding: 8px;
}

.debug-player-group {
  margin-bottom: 8px;
  padding: 4px;
  border-left: 3px solid #ccc;
}

.debug-player-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.debug-chip-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 2px 0;
}

.debug-chip-label {
  min-width: 80px;
}

.debug-chip-status.finished {
  color: green;
}

.debug-select {
  padding: 2px 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
  flex: 1;
}

.debug-input {
  width: 50px;
  padding: 2px 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
}

.debug-input-wide {
  width: 120px;
}

.debug-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
}

.debug-row label {
  min-width: 80px;
  font-size: 11px;
}

.debug-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.debug-btn {
  padding: 4px 8px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  font-family: monospace;
}

.debug-btn:hover {
  background: #1565c0;
}

.debug-btn-sm {
  padding: 2px 6px;
  font-size: 10px;
}

.debug-textarea {
  width: 100%;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
  resize: vertical;
  box-sizing: border-box;
}

.debug-log-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 11px;
}

.debug-log-container {
  max-height: 200px;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 6px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
}

.debug-log-entry {
  padding: 2px 4px;
  border-bottom: 1px solid #333;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.debug-log-icon {
  flex-shrink: 0;
}

.debug-log-fn {
  color: #569cd6;
  flex-shrink: 0;
}

.debug-log-msg {
  flex: 1;
}

.debug-log-data {
  color: #888;
  width: 100%;
  padding-left: 16px;
  font-size: 9px;
}

.debug-log-success {
  border-left: 2px solid #4caf50;
}

.debug-log-warning {
  border-left: 2px solid #ff9800;
}

.debug-log-error {
  border-left: 2px solid #f44336;
}

.debug-log-info {
  border-left: 2px solid #2196f3;
}

.debug-log-empty {
  color: #666;
  text-align: center;
  padding: 12px;
}

.debug-log-count {
  font-weight: normal;
  font-size: 11px;
  color: #666;
}
</style>
