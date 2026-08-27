import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBoardStore } from 'src/stores/board';
import { usePlayerStore } from 'src/stores/player';
import { BoardType } from 'src/lib/board';

describe('board store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('board.cells.length === 68', () => {
    const store = useBoardStore();
    expect(store.board.cells.length).toBe(68);
  });

  it('board.type === BoardType.main', () => {
    const store = useBoardStore();
    expect(store.board.type).toBe(BoardType.main);
  });

  it('finishBoards.length === 4', () => {
    const store = useBoardStore();
    expect(store.finishBoards.length).toBe(4);
  });

  it('safes[4] === players[0] (стартовая жёлтого)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    const safe = boardStore.board.cells[4]!.safe;
    expect(typeof safe === 'object' && 'ind' in safe && safe.ind).toBe(playerStore.players[0]!.ind);
  });

  it('safes[21] === players[1] (стартовая синего)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    const safe = boardStore.board.cells[21]!.safe;
    expect(typeof safe === 'object' && 'ind' in safe && safe.ind).toBe(playerStore.players[1]!.ind);
  });

  it('safes[38] === players[2] (стартовая красного)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    const safe = boardStore.board.cells[38]!.safe;
    expect(typeof safe === 'object' && 'ind' in safe && safe.ind).toBe(playerStore.players[2]!.ind);
  });

  it('safes[55] === players[3] (стартовая зелёного)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    const safe = boardStore.board.cells[55]!.safe;
    expect(typeof safe === 'object' && 'ind' in safe && safe.ind).toBe(playerStore.players[3]!.ind);
  });

  it('ios[67] === players[0].homeBoard.cells[0] (вход на финиш жёлтого)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    expect(boardStore.board.cells[67]!.io).toBe(playerStore.players[0]!.homeBoard.cells[0]);
  });

  it('ios[16] === players[1].homeBoard.cells[0] (вход на финиш синего)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    expect(boardStore.board.cells[16]!.io).toBe(playerStore.players[1]!.homeBoard.cells[0]);
  });

  it('ios[33] === players[2].homeBoard.cells[0] (вход на финиш красного)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    expect(boardStore.board.cells[33]!.io).toBe(playerStore.players[2]!.homeBoard.cells[0]);
  });

  it('ios[50] === players[3].homeBoard.cells[0] (вход на финиш зелёного)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    expect(boardStore.board.cells[50]!.io).toBe(playerStore.players[3]!.homeBoard.cells[0]);
  });

  it('baseBoard.cells[0].io === board.cells[i_begin] (выход из базы на стартовую)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    for (const p of playerStore.players) {
      expect(p.baseBoard.cells[0]!.io).toBe(boardStore.board.cells[p.i_begin]);
    }
  });

  it('homeBoard.cells[0].io === board.cells[i_end] (вход на финиш с общей дорожки)', () => {
    const boardStore = useBoardStore();
    const playerStore = usePlayerStore();
    for (const p of playerStore.players) {
      expect(p.homeBoard.cells[0]!.io).toBe(boardStore.board.cells[p.i_end]);
    }
  });
});