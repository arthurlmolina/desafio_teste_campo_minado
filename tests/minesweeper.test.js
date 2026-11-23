require('./test-helpers');
const { Minesweeper } = require('../src');

const seqRng = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

describe('Configuração do tabuleiro 18 x 14 com 40 bombas', () => {
  test('CT01 - tabuleiro padrão tem 14 linhas e 18 colunas', () => {
    const g = new Minesweeper();
    expect([g.rows, g.cols]).toEqual([14, 18]);
  });
  test('CT02 - tabuleiro padrão tem exatamente 40 bombas distintas', () => {
    const g = new Minesweeper({ rng: seqRng(7) });
    let total = 0;
    for (let r = 0; r < 14; r++) for (let c = 0; c < 18; c++) if (g.isMine(r, c)) total++;
    expect(total).toBe(40);
    expect(g.mines).toBe(40);
  });
  test('CT03 - mesma semente gera mesmo tabuleiro', () => {
    const a = new Minesweeper({ rng: seqRng(3) });
    const b = new Minesweeper({ rng: seqRng(3) });
    expect([...a.mineSet].sort()).toEqual([...b.mineSet].sort());
  });
  test('CT04 - bombas demais lançam erro', () => {
    expect(() => new Minesweeper({ rows: 2, cols: 2, mines: 4 })).toThrow();
  });
});

describe('Contagem de bombas vizinhas', () => {
  test('CT05 - célula no meio conta as 8 vizinhas', () => {
    const pos = [[4,4],[4,5],[4,6],[5,4],[5,6],[6,4],[6,5],[6,6]];
    const g = new Minesweeper({ minePositions: pos });
    expect(g.adjacentMines(5, 5)).toBe(8);
  });
  test('CT06 - canto só tem 3 vizinhas', () => {
    const g = new Minesweeper({ minePositions: [[0,1],[1,0],[1,1]] });
    expect(g.adjacentMines(0, 0)).toBe(3);
    expect(g.neighbors(0, 0)).toHaveLength(3);
  });
  test('CT07 - canto oposto (13,17) funciona', () => {
    const g = new Minesweeper({ minePositions: [[12,17]] });
    expect(g.adjacentMines(13, 17)).toBe(1);
  });
});

describe('Jogadas', () => {
  test('CT08 - revelar bomba perde o jogo', () => {
    const g = new Minesweeper({ minePositions: [[3, 3]] });
    expect(g.reveal(3, 3)).toBe('lost');
  });
  test('CT09 - revelar célula com número revela só ela', () => {
    const g = new Minesweeper({ minePositions: [[0, 0]] });
    g.reveal(0, 1);
    expect(g.revealed.size).toBe(1);
    expect(g.status).toBe('playing');
  });
  test('CT10 - célula sem bombas vizinhas abre em cascata e pode vencer', () => {
    const g = new Minesweeper({ minePositions: [[0, 0]] });
    expect(g.reveal(13, 17)).toBe('won');
    expect(g.revealed.size).toBe(14 * 18 - 1);
  });
  test('CT11 - cascata para nas células numeradas', () => {
    const g = new Minesweeper({ minePositions: [[0, 0], [13, 17]] });
    g.reveal(7, 9);
    expect(g.isRevealed(0, 1)).toBe(true);   // borda numerada é aberta
    expect(g.isRevealed(0, 0)).toBe(false);  // bomba nunca é aberta
  });
  test('CT12 - bandeira bloqueia a revelação', () => {
    const g = new Minesweeper({ minePositions: [[3, 3]] });
    g.toggleFlag(3, 3);
    expect(g.reveal(3, 3)).toBe('playing');
    expect(g.isRevealed(3, 3)).toBe(false);
  });
  test('CT13 - bandeira pode ser removida e contador de bandeiras restantes atualiza', () => {
    const g = new Minesweeper({ rng: seqRng(5) });
    g.toggleFlag(0, 0);
    expect(g.flagsLeft()).toBe(39);
    g.toggleFlag(0, 0);
    expect(g.flagsLeft()).toBe(40);
  });
  test('CT14 - não é possível marcar célula já revelada', () => {
    const g = new Minesweeper({ minePositions: [[0, 0]] });
    g.reveal(0, 1);
    expect(g.toggleFlag(0, 1)).toBe(false);
  });
  test('CT15 - revelar célula repetida não altera estado', () => {
    const g = new Minesweeper({ minePositions: [[0, 0]] });
    g.reveal(0, 1);
    expect(g.reveal(0, 1)).toBe('playing');
    expect(g.revealed.size).toBe(1);
  });
});

describe('Validações', () => {
  test('CT16 - posição fora do tabuleiro lança RangeError', () => {
    const g = new Minesweeper();
    expect(() => g.reveal(14, 0)).toThrow(RangeError);
    expect(() => g.reveal(0, 18)).toThrow(RangeError);
    expect(() => g.reveal(-1, 0)).toThrow(RangeError);
  });
  test('CT17 - jogar após o fim lança erro', () => {
    const g = new Minesweeper({ minePositions: [[3, 3]] });
    g.reveal(3, 3);
    expect(() => g.reveal(0, 0)).toThrow('terminou');
    expect(() => g.toggleFlag(0, 0)).toThrow('terminou');
  });
});

describe('Retorno de toggleFlag', () => {
  test('CT18 - marcar e desmarcar célula fechada retorna true', () => {
    const g = new Minesweeper({ minePositions: [[0, 0]] });
    expect(g.toggleFlag(1, 1)).toBe(true);
    expect(g.isFlagged(1, 1)).toBe(true);
    expect(g.toggleFlag(1, 1)).toBe(true);
    expect(g.isFlagged(1, 1)).toBe(false);
  });
});


describe('Validações adicionais de configuração', () => {
  test('CT19 - rejeita dimensões e quantidade de bombas inválidas', () => {
    expect(() => new Minesweeper({ rows: 0 })).toThrow(RangeError);
    expect(() => new Minesweeper({ cols: 2.5 })).toThrow(RangeError);
    expect(() => new Minesweeper({ rows: 2, cols: 2, mines: -1 })).toThrow(RangeError);
    expect(() => new Minesweeper({ rows: 2, cols: 2, mines: 4 })).toThrow(RangeError);
  });
  test('CT20 - valida rng e lista de posições fixas', () => {
    expect(() => new Minesweeper({ rng: 10 })).toThrow(TypeError);
    expect(() => new Minesweeper({ rows: 2, cols: 2, mines: 1, rng: () => 1 })).toThrow(RangeError);
    expect(() => new Minesweeper({ minePositions: 'inválido' })).toThrow(TypeError);
    expect(() => new Minesweeper({ minePositions: [[0, 0], [0, 0]] })).toThrow('duplicada');
    expect(() => new Minesweeper({ minePositions: [[0]] })).toThrow(TypeError);
  });
  test('CT21 - consultas de estado também validam coordenadas', () => {
    const g = new Minesweeper({ minePositions: [[0, 0]] });
    expect(() => g.isRevealed(14, 0)).toThrow(RangeError);
    expect(() => g.isFlagged(0, 18)).toThrow(RangeError);
  });
});


test('CT22 - rejeita posições fixas que ocupam o tabuleiro inteiro', () => {
  expect(() => new Minesweeper({ rows: 2, cols: 2, mines: 0, minePositions: [[0,0],[0,1],[1,0],[1,1]] })).toThrow('Bombas demais');
});
