import { describe, it, expect } from 'vitest';
import { Board, BoardType } from 'src/lib/board';
import { Player, PlayerColor } from 'src/lib/player';

describe('Player', () => {
  it('создаётся с 4 фишками', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    expect(player.chips.length).toBe(4);
  });

  it('baseBoard.cells[0] имеет size=4', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    expect(player.baseBoard.cells[0]!.size).toBe(4);
  });

  it('homeBoard.cells.length === 8', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    expect(player.homeBoard.cells.length).toBe(8);
  });

  it('homeBoard.cells[7] имеет size=4', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    expect(player.homeBoard.cells[7]!.size).toBe(4);
  });

  it('i_begin вычисляется правильно (ind→4,21,38,55)', () => {
    expect(new Player(0, false, PlayerColor.yellow).i_begin).toBe(4);
    expect(new Player(1, true, PlayerColor.blue).i_begin).toBe(21);
    expect(new Player(2, true, PlayerColor.red).i_begin).toBe(38);
    expect(new Player(3, true, PlayerColor.green).i_begin).toBe(55);
  });

  it('i_end вычисляется правильно (ind→67,16,33,50)', () => {
    expect(new Player(0, false, PlayerColor.yellow).i_end).toBe(67);
    expect(new Player(1, true, PlayerColor.blue).i_end).toBe(16);
    expect(new Player(2, true, PlayerColor.red).i_end).toBe(33);
    expect(new Player(3, true, PlayerColor.green).i_end).toBe(50);
  });

  it('color соответствует переданному', () => {
    expect(new Player(0, false, PlayerColor.yellow).color).toBe('yellow');
    expect(new Player(2, true, PlayerColor.red).color).toBe('red');
  });

  it('ai соответствует переданному', () => {
    expect(new Player(0, false, PlayerColor.yellow).ai).toBe(false);
    expect(new Player(1, true, PlayerColor.blue).ai).toBe(true);
  });

  it('getClosestToFinishChip() возвращает null, если все finished', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    player.chips.forEach((c) => c.finish());
    expect(player.getClosestToFinishChip()).toBeNull();
  });

  it('getClosestToFinishChip() возвращает фишку на homeBoard (приоритет home > main > base)', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    // Переместить одну фишку на финишную дорожку.
    player.chips[0]!.go(player.homeBoard.cells[3]!);
    expect(player.getClosestToFinishChip()).toBe(player.chips[0]);
  });

  it('getClosestToFinishChip() возвращает фишку на mainBoard (если нет на home)', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    // Связываем финишную дорожку с основной доской (точка входа).
    const main = new Board(BoardType.main, undefined, 68, undefined, undefined);
    player.homeBoard.cells[0]!.io = main.cells[67]!;
    // Размещаем фишку на основной доске.
    player.chips[0]!.go(main.cells[10]!);
    expect(player.getClosestToFinishChip()).toBe(player.chips[0]);
  });

  it('getClosestToFinishChip() возвращает фишку на base (если только на base)', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    const closest = player.getClosestToFinishChip();
    expect(closest).not.toBeNull();
    expect(player.chips).toContain(closest);
  });

  it('getChipProximityScore() home: 1000 + index', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    expect(player.getChipProximityScore(player.homeBoard.cells[5]!)).toBe(1005);
  });

  it('getChipProximityScore() base: 0', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    expect(player.getChipProximityScore(player.baseBoard.cells[0]!)).toBe(0);
  });

  it('getChipProximityScore() main: 100 + (total - distance)', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    const main = new Board(BoardType.main, undefined, 68, undefined, undefined);
    player.homeBoard.cells[0]!.io = main.cells[67]!; // точка входа
    // Фишка на cell 60: distance = (67 - 60 + 68) % 68 = 7; score = 100 + (68 - 7) = 161
    expect(player.getChipProximityScore(main.cells[60]!)).toBe(161);
  });

  it('Крайний случай: getClosestToFinishChip() пропускает finished фишки', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    // Финишим фишку, которая на home (была бы ближайшей), — она должна пропуститься.
    player.chips[0]!.go(player.homeBoard.cells[3]!);
    player.chips[0]!.finish();
    const closest = player.getClosestToFinishChip();
    expect(closest).not.toBe(player.chips[0]);
  });

  it('Крайний случай: getClosestToFinishChip() при chip.cell === null', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    // Эмулируем фишку без ячейки.
    player.chips[0]!.cell = null as never;
    const closest = player.getClosestToFinishChip();
    expect(closest).not.toBe(player.chips[0]);
  });

  it('Крайний случай: getChipProximityScore() при отсутствии entranceCell → 0', () => {
    const player = new Player(0, false, PlayerColor.yellow);
    const main = new Board(BoardType.main, undefined, 68, undefined, undefined);
    // homeBoard.cells[0].io не задан → entranceCell отсутствует.
    expect(player.getChipProximityScore(main.cells[10]!)).toBe(0);
  });
});
