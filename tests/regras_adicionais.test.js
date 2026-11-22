import { expect, test } from '@jest/globals';
import pecas from '../fixtures/pecas.json' with { type: 'json' };
import bloqueio from '../fixtures/bloqueio.json' with { type: 'json' };
import { criarJogo, executarAcao, obterVisao } from '../src/jogo.js';

test('CT-18 — não permitir passar enquanto há peças no monte', () => {
  const estado = structuredClone(bloqueio);
  estado.monte = [[0,4]];
  expect(() => executarAcao(estado, { tipo: 'passar', jogador: 0 })).toThrow(expect.objectContaining({ code: 'COMPRA_OBRIGATORIA' }));
});

test('CT-19 — compras sucessivas preservam a vez e a ordem do monte', () => {
  const estado = {
    maos: [[[6,6]], [[5,5]]], monte: [[1,4],[2,5]],
    mesa: [[0,0],[0,1],[1,1],[1,2],[2,0],[0,3],[3,1],[1,4],[4,0],[0,5],[5,1],[1,6],[6,2],[2,2],[2,3],[3,3],[3,4],[4,2],[2,5],[5,3],[3,6],[6,4],[4,4],[4,5],[5,6],[6,0]],
    turno:0,status:'em_andamento',vencedor:null,motivo:null,passesConsecutivos:0
  };
  const uma = executarAcao(estado, { tipo:'comprar', jogador:0 });
  const duas = executarAcao(uma, { tipo:'comprar', jogador:0 });
  expect(uma.maos[0].at(-1)).toEqual([1,4]);
  expect(duas.maos[0].at(-1)).toEqual([2,5]);
  expect(duas.turno).toBe(0);
  expect(duas.monte).toEqual([]);
});

test('CT-20 — validar conjunto incompleto e não expor referências mutáveis na visão', () => {
  expect(() => criarJogo({ pecas: pecas.slice(0, 27) })).toThrow(RangeError);
  const estado = criarJogo({ pecas });
  const visao = obterVisao(estado, 0);
  visao.mao[0][0] = 6;
  visao.mesa.push([0,0]);
  expect(estado.maos[0][0]).toEqual([0,0]);
  expect(estado.mesa).toEqual([]);
});
