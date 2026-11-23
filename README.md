# desafio_teste_campo_minado

Desafio: **Campo Minado 18 x 14 com 40 bombas**. Implementação e casos de teste automatizados escritos em **JavaScript** para testar **JavaScript** usando o executor nativo `node:test`.

## Especificação

- **Dimensões e minas:** Tabuleiro padrão com **14 linhas x 18 colunas** e **40 bombas** distintas (valores padrão do construtor `new Minesweeper()`).
- **Abertura (`reveal(r, c)`):** Abre a célula especificada. Caso possua `0` bombas adjacentes, expande a abertura em cascata até atingir células numeradas. Abrir uma bomba encerra a partida com derrota (`'lost'`); abrir todas as células sem bomba encerra com vitória (`'won'`).
- **Bandeiras (`toggleFlag(r, c)`):** Marca ou desmarca bandeira em células fechadas, bloqueando revelações acidentais. `flagsLeft()` informa o saldo de bandeiras restantes.
- **Determinismo:** Os parâmetros `rng` e `minePositions` são injetáveis no construtor para garantir execução 100% determinística nos testes.

## Como rodar

```bash
npm install
npm test            # executa os 22 casos de teste
npm run coverage    # executa os testes com relatório de cobertura (100% em linhas, branches e funções do código-fonte)
```

Estrutura do repositório: `src/minesweeper.js` (implementação) e `tests/minesweeper.test.js` (suíte de testes).

## Funcionamento dos casos de teste

A suíte contém **22 testes automatizados** executados com `node:test` e asserções locais. Os CT01–CT18 cobrem configuração, contagem de vizinhas, revelação, cascata, bandeiras e fim de partida; os CT19–CT22 ampliam a validação de dimensões, bombas, gerador aleatório, posições fixas e coordenadas. Os cenários usam sementes determinísticas (`seqRng`) ou posições fixas (`minePositions`).

### Especificação Detalhada dos Casos de Teste

---

#### Caso de Teste 1 — Configuração e Inicialização do Tabuleiro (`CT01` a `CT04`)
- **Descrição:** Verificar se o tabuleiro padrão respeita as dimensões 14x18 com 40 bombas distintas, mantém determinismo com a mesma semente e rejeita configurações inválidas.
- **Pré-condições:** Módulo `Minesweeper` importado e ambiente Node/Node.js com `node:test` pronto.
- **Passos:**
  1. Instanciar `new Minesweeper()` sem argumentos e consultar `rows` e `cols`.
  2. Instanciar `new Minesweeper({ rng: seqRng(7) })` e percorrer todas as coordenadas verificando `isMine(r, c)`.
  3. Instanciar duas partidas com a mesma semente `seqRng(3)` e comparar `mineSet`.
  4. Tentar instanciar `new Minesweeper({ rows: 2, cols: 2, mines: 4 })`.
- **Cenários:**
  - **CT01 — Dimensões padrão:** Entrada: `new Minesweeper()` | Resultado Esperado: `rows === 14` e `cols === 18`.
  - **CT02 — Contagem exata de bombas:** Entrada: `rng: seqRng(7)` | Resultado Esperado: exatamente `40` células com mina e `g.mines === 40`.
  - **CT03 — Reprodutibilidade por semente:** Entrada: duas instâncias com `seqRng(3)` | Resultado Esperado: conjuntos `mineSet` ordenados idênticos.
  - **CT04 — Excesso de bombas:** Entrada: tabuleiro `2x2` com `4` bombas | Resultado Esperado: lança exceção (`Error: Bombas demais para o tabuleiro`).

---

#### Caso de Teste 2 — Cálculo de Bombas Vizinhas (`CT05` a `CT07`)
- **Descrição:** Validar a contagem de minas adjacentes no centro do tabuleiro e nos cantos superior esquerdo e inferior direito.
- **Pré-condições:** Tabuleiro instanciado com `minePositions` controlado.
- **Passos:**
  1. Posicionar 8 minas ao redor de `(5, 5)` e consultar `adjacentMines(5, 5)`.
  2. Posicionar 3 minas ao redor de `(0, 0)` e consultar `adjacentMines(0, 0)` e `neighbors(0, 0)`.
  3. Posicionar 1 mina em `(12, 17)` e consultar `adjacentMines(13, 17)`.
- **Cenários:**
  - **CT05 — Célula central cercada:** Dados: minas em `(4,4)..(6,6)` exceto `(5,5)` | Resultado Esperado: `adjacentMines(5, 5) === 8`.
  - **CT06 — Canto superior esquerdo `(0,0)`:** Dados: minas em `(0,1), (1,0), (1,1)` | Resultado Esperado: `3` vizinhas e `adjacentMines(0, 0) === 3`.
  - **CT07 — Canto inferior direito `(13,17)`:** Dados: mina em `(12,17)` | Resultado Esperado: `adjacentMines(13, 17) === 1`.

---

#### Caso de Teste 3 — Revelação de Células, Cascata e Vitória/Derrota (`CT08` a `CT11`, `CT15`)
- **Descrição:** Verificar o comportamento de `reveal(r, c)` ao abrir mina, célula numerada, área vazia (cascata) e célula já aberta.
- **Pré-condições:** Partida em andamento (`status === 'playing'`).
- **Passos:**
  1. Chamar `reveal(r, c)` sobre uma coordenada com mina.
  2. Chamar `reveal(r, c)` em célula adjacente a uma mina.
  3. Chamar `reveal(13, 17)` em tabuleiro com apenas 1 mina em `(0, 0)`.
  4. Chamar `reveal(7, 9)` em tabuleiro com minas em `(0, 0)` e `(13, 17)`.
  5. Chamar `reveal(0, 1)` duas vezes consecutivas.
- **Cenários:**
  - **CT08 — Revelar bomba:** Dados: mina em `(3, 3)`, ação `reveal(3, 3)` | Resultado Esperado: retorna `'lost'`.
  - **CT09 — Célula numerada isolada:** Dados: mina em `(0, 0)`, ação `reveal(0, 1)` | Resultado Esperado: `revealed.size === 1` e `status === 'playing'`.
  - **CT10 — Cascata completa com vitória:** Dados: mina em `(0, 0)`, ação `reveal(13, 17)` | Resultado Esperado: abre todas as `251` células seguras e retorna `'won'`.
  - **CT11 — Limite da cascata nas bordas numeradas:** Dados: minas em `(0, 0)` e `(13, 17)`, ação `reveal(7, 9)` | Resultado Esperado: `(0, 1)` é revelada (`true`) e a bomba `(0, 0)` permanece fechada (`false`).
  - **CT15 — Revelação idempotente:** Dados: `reveal(0, 1)` repetido | Resultado Esperado: mantém `'playing'` e `revealed.size === 1`.

---

#### Caso de Teste 4 — Marcação e Desmarcação de Bandeiras (`CT12` a `CT14`, `CT18`)
- **Descrição:** Validar o ciclo de vida das bandeiras, bloqueio de revelação, atualização do contador e retorno booleano de `toggleFlag`.
- **Pré-condições:** Partida ativa com células fechadas e reveladas.
- **Passos:**
  1. Marcar bandeira em `(3, 3)` (com bomba) e tentar executar `reveal(3, 3)`.
  2. Marcar e desmarcar bandeira em `(0, 0)` observando `flagsLeft()`.
  3. Revelar `(0, 1)` e tentar executar `toggleFlag(0, 1)`.
  4. Marcar e desmarcar célula fechada `(1, 1)` verificando o valor booleano retornado.
- **Cenários:**
  - **CT12 — Proteção contra revelação:** Dados: `toggleFlag(3, 3)` seguido de `reveal(3, 3)` | Resultado Esperado: retorna `'playing'` e `isRevealed(3, 3) === false`.
  - **CT13 — Contador de bandeiras restantes:** Dados: tabuleiro com 40 bombas, `toggleFlag(0, 0)` duas vezes | Resultado Esperado: `flagsLeft()` vai para `39` e volta para `40`.
  - **CT14 — Bloqueio em célula já aberta:** Dados: `reveal(0, 1)` seguido de `toggleFlag(0, 1)` | Resultado Esperado: retorna `false`.
  - **CT18 — Retorno booleano de alternância:** Dados: `toggleFlag(1, 1)` aplicado duas vezes em célula fechada | Resultado Esperado: retorna `true` nas duas chamadas e alterna `isFlagged(1, 1)` entre `true` e `false`.

---

#### Caso de Teste 5 — Validações de Fronteira e Pós-Jogo (`CT16` e `CT17`)
- **Descrição:** Garantir que coordenadas fora dos limites e ações após o encerramento da partida sejam bloqueadas com exceções.
- **Pré-condições:** Instância de `Minesweeper` criada.
- **Passos:**
  1. Chamar `reveal` com coordenadas `(14, 0)`, `(0, 18)` e `(-1, 0)`.
  2. Encerrar a partida revelando a mina em `(3, 3)` e tentar chamar `reveal(0, 0)` e `toggleFlag(0, 0)`.
- **Cenários:**
  - **CT16 — Coordenadas inválidas:** Dados: `(14, 0)`, `(0, 18)`, `(-1, 0)` | Resultado Esperado: lança `RangeError`.
  - **CT17 — Ações após fim de jogo:** Dados: partida com `status === 'lost'` | Resultado Esperado: `reveal` e `toggleFlag` lançam erro contendo `'terminou'`.

## Execução e cobertura de código

Os testes usam o executor nativo `node:test`, incluído no Node.js, sem dependências externas. Execute `npm test` para rodar a suíte e `npm run coverage` para medir o código-fonte em `src/`. O comando de cobertura exige 100% de linhas, decisões (branches) e funções; se algum desses limites não for atingido, o comando termina com falha. Os arquivos auxiliares de teste não entram no cálculo, pois a métrica solicitada é a cobertura da implementação do desafio.

A suíte contém **22 testes automatizados**. Além dos cenários CT numerados, foram acrescentadas verificações de entradas inválidas, limites e fluxos alternativos.

### Testes complementares de robustez

Além dos cenários detalhados acima, foram adicionados: CT19–CT22: dimensões e quantidade de bombas inválidas, gerador aleatório fora do intervalo, posições fixas duplicadas ou malformadas, tabuleiro totalmente ocupado por bombas e consultas fora dos limites.

A cobertura é calculada somente sobre os arquivos de implementação em `src/`, não sobre o próprio código auxiliar usado pelos testes. O comando de cobertura exige simultaneamente **100% de linhas, 100% de branches e 100% de funções**; qualquer percentual abaixo disso faz o comando falhar.

## Colaboradores

| Nome | RA |
|---|---|
| Arthur Lavagnolli Molina | 24031565-2 |
| Gustavo dos Santos Guimarães | 24000191-2 |
