import { expect, test } from '@jest/globals';
import pecas from '../fixtures/pecas.json' with { type: 'json' };
import bloqueio from '../fixtures/bloqueio.json' with { type: 'json' };
import empate from '../fixtures/empate.json' with { type: 'json' };
import compra from '../fixtures/compra.json' with { type: 'json' };
import batida from '../fixtures/batida.json' with { type: 'json' };
import { criarJogo, executarAcao, obterVisao } from '../src/jogo.js';

const novo = () => criarJogo({ pecas: structuredClone(pecas) });
const jogar = (estado, jogador, peca, lado = 'direita') => executarAcao(estado, { tipo: 'jogar', jogador, peca, lado });
const comprar = (estado, jogador) => executarAcao(estado, { tipo: 'comprar', jogador });
const passar = (estado, jogador) => executarAcao(estado, { tipo: 'passar', jogador });
const falha = (fn, code) => expect(fn).toThrow(expect.objectContaining({ code }));
const canonica = p => p[0] <= p[1] ? `${p[0]}-${p[1]}` : `${p[1]}-${p[0]}`;
function conferirConjuntoCompleto(estado) {
  const todas = [...estado.maos[0], ...estado.maos[1], ...estado.monte, ...estado.mesa];
  expect(todas).toHaveLength(28);
  expect(todas.map(canonica).sort()).toEqual(pecas.map(canonica).sort());
}

test('CT-21 — conjunto duplo-seis contém exatamente uma peça de cada combinação', () => {
  const estado = novo();
  const todas = [...estado.maos[0], ...estado.maos[1], ...estado.monte];
  expect(todas).toHaveLength(28);
  expect(new Set(todas.map(canonica)).size).toBe(28);
  expect(todas.map(canonica).sort()).toEqual(pecas.map(canonica).sort());
});

test('CT-22 — rejeitar peças malformadas, valores fracionários, não numéricos ou fora de 0 a 6', () => {
  for (const peca of [[0], [0,1,2], '0-1', null]) {
    const conjunto = structuredClone(pecas); conjunto[0] = peca;
    expect(() => criarJogo({ pecas: conjunto })).toThrow(TypeError);
  }
  for (const peca of [[-1,2], [0,7]]) {
    const conjunto = structuredClone(pecas); conjunto[0] = peca;
    expect(() => criarJogo({ pecas: conjunto })).toThrow(RangeError);
  }
  const fracionaria = structuredClone(pecas); fracionaria[0] = [0,1.5];
  expect(() => criarJogo({ pecas: fracionaria })).toThrow(TypeError);
  const texto = structuredClone(pecas); texto[0] = ['0',1];
  expect(() => criarJogo({ pecas: texto })).toThrow(TypeError);
});

test('CT-23 — detectar duplicata mesmo quando a peça duplicada está invertida', () => {
  const conjunto = structuredClone(pecas); conjunto[1] = [0,0];
  falha(() => criarJogo({ pecas: conjunto }), 'PECAS_DUPLICADAS');
});

test('CT-24 — validar opções, conjunto completo e jogador inicial', () => {
  expect(() => criarJogo(null)).toThrow(TypeError);
  expect(() => criarJogo({ pecas: '28' })).toThrow(TypeError);
  expect(() => criarJogo({ pecas: pecas.slice(0,27) })).toThrow(RangeError);
  expect(() => criarJogo({ jogadorInicial: '1' })).toThrow(TypeError);
  expect(() => criarJogo({ jogadorInicial: 2 })).toThrow(RangeError);
  expect(criarJogo({ jogadorInicial: 1 }).turno).toBe(1);
});

test('CT-25 — primeiro lance aceita qualquer peça e conserva sua orientação informada', () => {
  const base = structuredClone(pecas), indice = base.findIndex(p=>p[0]===2&&p[1]===6);
  base[indice]=[6,2]; [base[0],base[indice]]=[base[indice],base[0]];
  const a = jogar(criarJogo({pecas:base}), 0, [6,2], 'esquerda');
  expect(a.mesa).toEqual([[6,2]]);
  const canonica = structuredClone(pecas), indiceCanonico=canonica.findIndex(p=>p[0]===2&&p[1]===6);
  [canonica[0],canonica[indiceCanonico]]=[canonica[indiceCanonico],canonica[0]];
  const b = jogar(criarJogo({pecas:canonica}), 0, [2,6], 'direita');
  expect(b.mesa).toEqual([[2,6]]);
});

test('CT-26 — encaixar na ponta direita com ambas as ordens da peça', () => {
  for (const peca of [[1,6],[6,1]]) {
    const inicial = jogar(novo(), 0, [0,6]);
    const final = jogar(inicial, 1, peca, 'direita');
    expect(final.mesa).toEqual([[0,6],[6,1]]);
  }
});

test('CT-27 — encaixar na ponta esquerda com ambas as ordens da peça', () => {
  for (const peca of [[0,2],[2,0]]) {
    const estado = { maos:[[[5,5]],[peca]], monte:[], mesa:[[0,6]], turno:1, status:'em_andamento', vencedor:null, motivo:null, passesConsecutivos:0 };
    const final = jogar(estado, 1, peca, 'esquerda');
    expect(final.mesa).toEqual([[2,0],[0,6]]);
  }
});

test('CT-28 — peça que liga as duas pontas pode ser jogada em qualquer lado', () => {
  const mesa = [[1,2],[2,3]];
  const base = { maos:[[[1,3]],[[6,6]]], monte:[], mesa, turno:0, status:'em_andamento', vencedor:null, motivo:null, passesConsecutivos:0 };
  expect(jogar(base,0,[1,3],'esquerda').mesa).toEqual([[3,1],[1,2],[2,3]]);
  expect(jogar(base,0,[1,3],'direita').mesa).toEqual([[1,2],[2,3],[3,1]]);
});

test('CT-29 — carroças encaixam pelo número e preservam os dois lados iguais', () => {
  const e = jogar(jogar(novo(),0,[0,1]),1,[1,1]);
  expect(e.mesa).toEqual([[0,1],[1,1]]);
  expect(e.maos[1]).not.toContainEqual([1,1]);
});

test('CT-30 — rejeitar peça ausente, encaixe inválido e lado desconhecido sem mutação', () => {
  const estado = jogar(novo(),0,[0,6]);
  const antes = structuredClone(estado);
  falha(() => jogar(estado,1,[1,2]), 'ENCAIXE_INVALIDO');
  falha(() => jogar(estado,0,[0,5]), 'FORA_DA_VEZ');
  expect(estado).toEqual(antes);
  const daVez = structuredClone(estado); daVez.turno=1;
  expect(() => jogar(daVez,1,[6,1],'centro')).toThrow(RangeError);
});

test('CT-31 — compra a primeira peça do monte, mantém o turno e não altera a entrada', () => {
  const estado = structuredClone(compra), antes = structuredClone(estado);
  const e = comprar(estado,0);
  expect(estado).toEqual(antes);
  expect(e.maos[0].at(-1)).toEqual([0,6]);
  expect(e.monte).toEqual([]);
  expect(e.turno).toBe(0);
});

test('CT-32 — compra enquanto não há encaixe e exige jogar assim que a peça comprada encaixa', () => {
  const e = comprar(structuredClone(compra),0);
  falha(() => comprar(e,0), 'JOGADA_DISPONIVEL');
  expect(jogar(e,0,[0,6]).mesa.at(-1)).toEqual([6,0]);
});

test('CT-33 — passe só é válido sem jogada e com monte vazio; passa a vez e conta passes', () => {
  const e = passar(structuredClone(bloqueio),0);
  expect(e.turno).toBe(1);
  expect(e.passesConsecutivos).toBe(1);
  falha(() => comprar(e,1), 'MONTE_VAZIO');
});

test('CT-34 — jogada após um passe zera o contador de passes', () => {
  const mesa = [[0,6]];
  const estado = { maos:[[[6,6],[0,5]],[[0,1]]], monte:[], mesa, turno:0, status:'em_andamento', vencedor:null, motivo:null, passesConsecutivos:1 };
  const e = jogar(estado,0,[6,6]);
  expect(e.passesConsecutivos).toBe(0);
  expect(e.turno).toBe(1);
});

test('CT-35 — bloquear após dois passes consecutivos e escolher menor soma de pontos', () => {
  const e = passar(passar(structuredClone(bloqueio),0),1);
  expect(e).toMatchObject({ status:'encerrado', motivo:'bloqueio', vencedor:1, passesConsecutivos:2, turno:1 });
});

test('CT-36 — bloqueio declara vitória para o jogador 0 quando sua soma é menor', () => {
  const estado = structuredClone(bloqueio);
  estado.maos = [[[1,1]],[[6,6]]];
  const e = passar(passar(estado,0),1);
  expect(e).toMatchObject({ status:'encerrado', motivo:'bloqueio', vencedor:0, turno:0 });
});

test('CT-37 — bloqueio empata quando as somas das mãos são iguais', () => {
  const e = passar(passar(structuredClone(empate),0),1);
  expect(e).toMatchObject({ status:'encerrado', motivo:'bloqueio', vencedor:null, passesConsecutivos:2 });
});

test('CT-38 — batida encerra a partida imediatamente e registra vencedor e motivo', () => {
  const e = jogar(structuredClone(batida),0,[6,0],'esquerda');
  expect(e.maos[0]).toEqual([]);
  expect(e).toMatchObject({ status:'encerrado', vencedor:0, motivo:'batida', turno:0, passesConsecutivos:0 });
});

test('CT-39 — impedir qualquer ação depois de batida ou bloqueio', () => {
  const batidaFinal = jogar(structuredClone(batida),0,[6,0],'esquerda');
  const bloqueioFinal = passar(passar(structuredClone(bloqueio),0),1);
  for (const estado of [batidaFinal,bloqueioFinal]) {
    for (const acao of [{tipo:'jogar',jogador:0,peca:[6,6],lado:'direita'},{tipo:'comprar',jogador:0},{tipo:'passar',jogador:0}])
      falha(() => executarAcao(estado,acao), 'JOGO_ENCERRADO');
  }
});

test('CT-40 — validar jogador, ação desconhecida e erros de tipo/faixa da peça jogada', () => {
  const estado = novo();
  expect(() => executarAcao(estado,null)).toThrow(TypeError);
  falha(() => executarAcao(estado,{tipo:'embaralhar',jogador:0}),'ACAO_DESCONHECIDA');
  expect(() => jogar(estado,0,['0',1])).toThrow(TypeError);
  expect(() => jogar(estado,0,[0,7])).toThrow(RangeError);
  expect(() => executarAcao(estado,{tipo:'jogar',jogador:2,peca:[0,1],lado:'direita'})).toThrow(RangeError);
  expect(() => obterVisao(estado,'0')).toThrow(TypeError);
  expect(() => obterVisao(estado,2)).toThrow(RangeError);
});

test('CT-41 — visão não revela mão adversária, devolve quantidades e é cópia independente', () => {
  const estado = novo(), visao = obterVisao(estado,0);
  expect(Object.keys(visao)).toEqual(['mao','quantidadeAdversario','quantidadeMonte','mesa','turno','status','vencedor','motivo','passesConsecutivos']);
  expect(visao).toMatchObject({ quantidadeAdversario:7, quantidadeMonte:14, turno:0, status:'em_andamento', vencedor:null, motivo:null, passesConsecutivos:0 });
  expect(visao).not.toHaveProperty('maos');
  visao.mao[0][0]=6; visao.mesa.push([0,0]);
  expect(estado.maos[0][0]).toEqual(pecas[0]);
  expect(estado.mesa).toEqual([]);
});

test('CT-42 — sequência de jogadas e compras nunca perde nem duplica peça', () => {
  let e=criarJogo({pecas:structuredClone(pecas).reverse()});
  let seed=7321;
  const rand=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
  for(let rodada=0;rodada<300&&e.status!=='encerrado';rodada++){
    const j=e.turno, mao=e.maos[j], jogaveis=mao.filter(playable=>{
      if(!e.mesa.length)return true;
      return playable.includes(e.mesa[0][0])||playable.includes(e.mesa.at(-1)[1]);
    });
    if(jogaveis.length){
      const p=jogaveis[Math.floor(rand()*jogaveis.length)];
      const lados=!e.mesa.length?['direita']:[...(p.includes(e.mesa[0][0])?['esquerda']:[]),...(p.includes(e.mesa.at(-1)[1])?['direita']:[])];
      e=jogar(e,j,p,lados[Math.floor(rand()*lados.length)]);
    } else if(e.monte.length) e=comprar(e,j);
    else e=passar(e,j);
    conferirConjuntoCompleto(e);
  }
  expect(e.status).toBe('encerrado');
});
