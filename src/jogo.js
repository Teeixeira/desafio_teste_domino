const falha = (code, mensagem = code) => Object.assign(new Error(mensagem), { code });
const copiar = valor => structuredClone(valor);
const jogadores = j => {
  if (!Number.isInteger(j)) throw new TypeError('jogador deve ser inteiro');
  if (j !== 0 && j !== 1) throw new RangeError('jogador fora do intervalo');
};
function validarPeca(p) {
  if (!Array.isArray(p) || p.length !== 2) throw new TypeError('peça deve ter dois lados');
  for (const lado of p) {
    if (!Number.isInteger(lado)) throw new TypeError('lado deve ser inteiro');
    if (lado < 0 || lado > 6) throw new RangeError('lado fora do intervalo');
  }
}
function validarPecas(pecas) {
  if (!Array.isArray(pecas)) throw new TypeError('peças devem ser um array');
  if (pecas.length !== 28) throw new RangeError('conjunto deve conter 28 peças');
  const vistas = new Set();
  for (const p of pecas) {
    validarPeca(p);
    const k = `${Math.min(...p)},${Math.max(...p)}`;
    if (vistas.has(k)) throw falha('PECAS_DUPLICADAS');
    vistas.add(k);
  }
  if (vistas.size !== 28) throw new RangeError('conjunto incompleto');
}
export function criarJogo(opcoes = {}) {
  if (!opcoes || typeof opcoes !== 'object' || Array.isArray(opcoes)) throw new TypeError('opções devem ser objeto');
  const pecas = opcoes.pecas ?? Array.from({length:7}, (_,a) => Array.from({length:7-a}, (_,b) => [a,a+b])).flat();
  validarPecas(pecas);
  const inicial = opcoes.jogadorInicial ?? 0; jogadores(inicial);
  const lista = copiar(pecas);
  return { maos: [lista.slice(0,7), lista.slice(7,14)], monte: lista.slice(14), mesa: [], turno: inicial, status:'em_andamento', vencedor:null, motivo:null, passesConsecutivos:0 };
}
function pontuacao(mao) { return mao.reduce((s,p)=>s+p[0]+p[1],0); }
function podeJogar(estado, jogador) {
  if (!estado.mesa.length) return estado.maos[jogador].length > 0;
  const esq=estado.mesa[0][0], dir=estado.mesa.at(-1)[1];
  return estado.maos[jogador].some(([a,b])=>a===esq||b===esq||a===dir||b===dir);
}
export function executarAcao(estado, acao) {
  if (!estado || typeof estado !== 'object' || !acao || typeof acao !== 'object') throw new TypeError('estado e ação são obrigatórios');
  if (estado.status === 'encerrado') throw falha('JOGO_ENCERRADO');
  const e=copiar(estado);
  if (!['jogar','comprar','passar'].includes(acao.tipo)) throw falha('ACAO_DESCONHECIDA');
  jogadores(acao.jogador);
  if (acao.jogador !== e.turno) throw falha('FORA_DA_VEZ');
  const j=acao.jogador;
  if (acao.tipo==='jogar') {
    validarPeca(acao.peca);
    if (acao.lado !== 'esquerda' && acao.lado !== 'direita') throw new RangeError('lado inválido');
    const idx=e.maos[j].findIndex(p=>p[0]===acao.peca[0]&&p[1]===acao.peca[1] || p[0]===acao.peca[1]&&p[1]===acao.peca[0]);
    if(idx<0) throw falha('PECA_AUSENTE');
    let [a,b]=e.maos[j][idx];
    if(e.mesa.length) {
      const ponta=acao.lado==='esquerda'?e.mesa[0][0]:e.mesa.at(-1)[1];
      if(a!==ponta&&b!==ponta) throw falha('ENCAIXE_INVALIDO');
      if(acao.lado==='esquerda') { if(a===ponta) [a,b]=[b,a]; }
      else if(b===ponta) [a,b]=[b,a];
    }
    e.maos[j].splice(idx,1);
    if(acao.lado==='esquerda') e.mesa.unshift([a,b]); else e.mesa.push([a,b]);
    e.passesConsecutivos=0;
    if(!e.maos[j].length) { e.status='encerrado'; e.vencedor=j; e.motivo='batida'; }
    else e.turno=1-j;
    return e;
  }
  if (podeJogar(e,j)) throw falha('JOGADA_DISPONIVEL');
  if(acao.tipo==='comprar') {
    if(!e.monte.length) throw falha('MONTE_VAZIO');
    e.maos[j].push(e.monte.shift()); return e;
  }
  if(e.monte.length) throw falha('COMPRA_OBRIGATORIA');
  e.passesConsecutivos++;
  if(e.passesConsecutivos===2) {
    e.status='encerrado'; e.motivo='bloqueio';
    const a=pontuacao(e.maos[0]), b=pontuacao(e.maos[1]); e.vencedor=a===b?null:a<b?0:1;
    if(e.vencedor===null) e.turno=1-j;
    else e.turno=e.vencedor;
  } else e.turno=1-j;
  return e;
}
export function obterVisao(estado,jogador) {
  jogadores(jogador);
  if(!estado||typeof estado!=='object') throw new TypeError('estado obrigatório');
  return { mao:copiar(estado.maos[jogador]), quantidadeAdversario:estado.maos[1-jogador].length, quantidadeMonte:estado.monte.length, mesa:copiar(estado.mesa), turno:estado.turno, status:estado.status, vencedor:estado.vencedor, motivo:estado.motivo, passesConsecutivos:estado.passesConsecutivos };
}
