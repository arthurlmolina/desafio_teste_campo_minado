class Minesweeper {
  /**
   * Padrão do desafio: 14 linhas x 18 colunas, 40 bombas.
   * rng: função que retorna [0,1) (injetável para testes determinísticos).
   * minePositions: lista [[linha, coluna], ...] para fixar as bombas.
   */
  constructor({ rows = 14, cols = 18, mines = 40, rng = Math.random, minePositions } = {}) {
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) {
      throw new RangeError('Dimensões devem ser inteiros positivos');
    }
    if (!Number.isInteger(mines) || mines < 0 || mines >= rows * cols) {
      throw new RangeError('Quantidade de bombas inválida');
    }
    if (typeof rng !== 'function') throw new TypeError('rng deve ser uma função');
    this.rows = rows;
    this.cols = cols;
    this.status = 'playing';
    this.mineSet = new Set();
    this.revealed = new Set();
    this.flags = new Set();

    if (minePositions !== undefined) {
      if (!Array.isArray(minePositions)) throw new TypeError('minePositions deve ser uma lista');
      for (const position of minePositions) {
        if (!Array.isArray(position) || position.length !== 2) throw new TypeError('Cada bomba deve ter linha e coluna');
        const [r, c] = position;
        this._check(r, c);
        const key = r * cols + c;
        if (this.mineSet.has(key)) throw new Error('Posição de bomba duplicada');
        this.mineSet.add(key);
      }
      if (this.mineSet.size >= rows * cols) throw new Error('Bombas demais para o tabuleiro');
    } else {
      const cells = Array.from({ length: rows * cols }, (_, i) => i);
      for (let i = cells.length - 1; i > 0; i--) {
        const value = rng();
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) {
          throw new RangeError('rng deve retornar um número entre 0 e 1');
        }
        const j = Math.floor(value * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      for (const key of cells.slice(0, mines)) this.mineSet.add(key);
    }
    this.mines = this.mineSet.size;
  }

  _inside(r, c) {
    return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }
  _check(r, c) {
    if (!this._inside(r, c)) throw new RangeError('Posição fora do tabuleiro');
  }
  _active() {
    if (this.status !== 'playing') throw new Error('A partida já terminou');
  }

  isMine(r, c) { this._check(r, c); return this.mineSet.has(r * this.cols + c); }
  isRevealed(r, c) { this._check(r, c); return this.revealed.has(r * this.cols + c); }
  isFlagged(r, c) { this._check(r, c); return this.flags.has(r * this.cols + c); }

  neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if ((dr || dc) && this._inside(r + dr, c + dc)) out.push([r + dr, c + dc]);
    return out;
  }

  adjacentMines(r, c) {
    this._check(r, c);
    return this.neighbors(r, c).filter(([a, b]) => this.isMine(a, b)).length;
  }

  toggleFlag(r, c) {
    this._check(r, c); this._active();
    if (this.isRevealed(r, c)) return false;
    const k = r * this.cols + c;
    this.flags.has(k) ? this.flags.delete(k) : this.flags.add(k);
    return true;
  }

  reveal(r, c) {
    this._check(r, c); this._active();
    if (this.isRevealed(r, c) || this.isFlagged(r, c)) return this.status;
    if (this.isMine(r, c)) {
      this.status = 'lost';
      return this.status;
    }
    const stack = [[r, c]];
    while (stack.length) {
      const [a, b] = stack.pop();
      const k = a * this.cols + b;
      if (this.revealed.has(k) || this.mineSet.has(k)) continue;
      this.revealed.add(k);
      this.flags.delete(k);
      if (this.adjacentMines(a, b) === 0) stack.push(...this.neighbors(a, b));
    }
    if (this.revealed.size === this.rows * this.cols - this.mines) this.status = 'won';
    return this.status;
  }

  flagsLeft() { return this.mines - this.flags.size; }
}
module.exports = { Minesweeper };
