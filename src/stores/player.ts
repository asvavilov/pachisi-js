import { defineStore } from 'pinia';
import { computed, ref, toRaw } from 'vue';
import type { PlayerIndex } from 'src/lib/player';
import { Player, PlayerColor } from 'src/lib/player';
import { BoardType } from 'src/lib/board';

/**
 * массив игроков и текущий игрок
 */
export const usePlayerStore = defineStore('player', () => {
  const players = ref<Player[]>([
    new Player(0, false, PlayerColor.yellow),
    new Player(1, true, PlayerColor.blue),
    new Player(2, true, PlayerColor.red),
    new Player(3, true, PlayerColor.green),
  ]);

  const currentIndex = ref<PlayerIndex>();
  const winners = ref<Player[]>([]); // победитель игры, если есть

  const init = (startIndex?: PlayerIndex) => {
    currentIndex.value = startIndex ?? 0;
    winners.value = [];
  };

  /**
   * Полный сброс фишек для новой партии: все фишки возвращаются на свою базу,
   * очищаются все занятые ими ячейки, снимается флаг `finished`, сбрасываются победители.
   */
  const reset = () => {
    // Освобождаем все ячейки, где сейчас стоят фишки.
    for (const player of players.value) {
      for (const chip of player.chips) {
        const places = chip.cell.places;
        const idx = places.findIndex((p) => p !== null && (toRaw(p) === chip || p.id === chip.id));
        if (idx >= 0) places[idx] = null;
      }
    }
    // Возвращаем каждую фишку на своё место в базе.
    for (const player of players.value) {
      const base = player.baseBoard.cells[0]!;
      player.chips.forEach((chip, i) => {
        chip.cell = base;
        base.places[i] = chip;
        chip.finished = false;
      });
    }
    winners.value = [];
    currentIndex.value = undefined;
  };

  /**
   * Перейти к следующему игроку. Игроки, уже завершившие партию (winners),
   * пропускаются — их фишки все в доме (README п.14).
   */
  const next = () => {
    if (currentIndex.value === undefined) return;
    const total = players.value.length;
    for (let step = 1; step <= total; step++) {
      const idx = ((currentIndex.value + step) % total) as PlayerIndex;
      if (!winners.value.includes(players.value[idx]!)) {
        currentIndex.value = idx;
        return;
      }
    }
  };

  const current = computed(() =>
    currentIndex.value !== undefined ? players.value[currentIndex.value] : undefined,
  );

  /**
   * Игроки, ещё не завершившие партию (не попавшие в winners).
   */
  const activePlayers = computed(() => players.value.filter((p) => !winners.value.includes(p)));

  /**
   * README п.14: партия завершена, когда завершили все, кроме одного
   * (последний занимает последнее место), либо когда остались только ИИ
   * (людям не с кем играть).
   */
  const isGameOver = computed(() => {
    if (winners.value.length === 0) return false;
    const active = activePlayers.value;
    if (active.length <= 1) return true;
    return active.every((p) => p.ai);
  });

  /**
   * README п.14: итоговые места — в порядке финиша (winners),
   * затем оставшиеся игроки. До завершения партии порядок активных игроков
   * не является итоговым.
   */
  const places = computed(() => [...winners.value, ...activePlayers.value]);

  const allChipsOnBase = computed(() =>
    current.value
      ? current.value.chips.every((chip) => chip.cell?.board.type === BoardType.base)
      : undefined,
  );

  /**
   * Проверить игрока на победителя (игрок, все фишки которого финишировали).
   * Если только что был добавлен победитель, то вернёт player,
   * иначе возвращает true (если найден в списке) или false (если не победитель).
   */
  const checkWinner = (player: Player) => {
    if (winners.value.includes(player)) {
      return true;
    }

    if (player.chips.every((chip) => chip.finished)) {
      winners.value.push(player);
      return player;
    }

    return false;
  };

  return {
    players,
    winners,
    currentIndex,
    init,
    reset,
    next,
    current,
    allChipsOnBase,
    checkWinner,
    activePlayers,
    isGameOver,
    places,
  };
});
