# Testes do jogo Dominó

Projeto de jogo local para exatamente dois jogadores, com conjunto duplo-seis, distribuição de sete peças por jogador e compra sequencial do monte.

## Participantes do grupo

| Nome | RA |
|---|---|
| Leonardo Teixeira de Carvalho | 24159859-2 |
| Matheus Eduardo Polizelli | 24129411-2 |

## Contrato das regras

- O conjunto contém exatamente 28 combinações únicas de 0–0 a 6–6. A ordem fornecida é preservada para que distribuição e compra sejam reproduzíveis: as primeiras sete peças vão ao Jogador 1, as sete seguintes ao Jogador 2 e as 14 restantes formam o monte. A interface embaralha antes de criar a partida.
- O jogador inicial padrão é o Jogador 1 (índice `0`); pode ser configurado como índice `0` ou `1`. A primeira peça pode ser qualquer peça da mão inicial.
- A cadeia cresce pelas pontas esquerda e direita. Uma peça só pode ser jogada se um de seus lados combinar com a ponta escolhida; a orientação é ajustada automaticamente. Carroças seguem a mesma regra.
- Na sua vez, se houver alguma jogada legal, o jogador deve jogar e não pode comprar nem passar. Sem jogada e com peças no monte, compra a peça do topo, mantém a vez e continua comprando até poder jogar ou o monte acabar. Quando uma peça comprada permite uma jogada, deve jogá-la antes de comprar outra.
- Sem jogada e com o monte vazio, o jogador passa a vez. Dois passes consecutivos encerram a partida por bloqueio; vence a mão com menor soma de pontos, ou há empate se as somas forem iguais. Uma jogada zera a contagem de passes.
- A partida também termina por batida quando um jogador joga sua última peça. Ações posteriores ao encerramento são rejeitadas.
- A visão de um jogador mostra sua mão, a quantidade de peças do adversário, o tamanho do monte e a mesa, sem revelar a mão adversária ou a ordem do monte. Entradas e visões são cópias independentes do estado.

## Requisitos e execução

Requer Node.js 22 e npm. Execute `npm install` e depois `npm test` na pasta do projeto.

## Organização

- `src/jogo.js`: criação, ações e visão privada da partida.
- `tests/domino.test.js`, `tests/integracao.test.js` e `tests/regras_completas.test.js`: casos sequenciais identificados como CT-XX, incluindo validações, cenários de borda, bloqueio, batida, privacidade e conservação das 28 peças durante uma partida simulada.
- `tests/apoio.js`: auxiliares de teste; não implementa regras.
- `fixtures/`: conjuntos e estados preparados para compra, bloqueio, empate, passe e batida.

As peças são mantidas na ordem recebida para preparar a partida de forma reproduzível. O jogo não embaralha por conta própria.
