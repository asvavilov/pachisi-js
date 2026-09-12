import { onScopeDispose, ref, watch } from 'vue';
import { useGameStore } from 'src/stores/game';

export interface AiDriverOptions {
  /** Задержка между действиями ИИ (мс), чтобы ходы были наглядны. */
  delayMs?: number;
}

/**
 * Драйвер ходов ИИ: следит за сменой состояния/игрока и выполняет за ботов
 * броски и ходы с небольшой задержкой. Вся логика выбора хода живёт в
 * `game.aiActOnce()` / `lib/ai.ts`, здесь только тайминг.
 */
export function useAiDriver(options: AiDriverOptions = {}) {
  const delayMs = options.delayMs ?? 700;
  const game = useGameStore();

  const busy = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    // Защита от повторного входа: пока цепочка ИИ не завершилась, не начинаем новую.
    if (busy.value) return;
    busy.value = true;

    const run = () => {
      timer = null;
      if (!game.aiActOnce()) {
        busy.value = false;
        return;
      }
      // ИИ продолжает действовать (несколько ботов подряд / не все кубики разыграны).
      timer = setTimeout(run, delayMs);
    };

    timer = setTimeout(run, delayMs);
  };

  watch(
    () => [game.stateId, game.actingPlayerIndex, game.firstRollPlayerIndex],
    () => schedule(),
    { immediate: true },
  );

  onScopeDispose(() => {
    clearTimer();
    busy.value = false;
  });

  return { schedule, isBusy: busy };
}
