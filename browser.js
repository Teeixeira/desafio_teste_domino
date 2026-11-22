import { criarJogo, executarAcao, obterVisao } from './src/jogo.js';

const $ = id => document.getElementById(id);
let state, player = 0, selected = null, awaiting = false, toastTimer;
const pipPositions = {1:[[50,50]],2:[[27,27],[73,73]],3:[[27,27],[50,50],[73,73]],4:[[27,27],[73,27],[27,73],[73,73]],5:[[27,27],[73,27],[50,50],[27,73],[73,73]],6:[[27,25],[73,25],[27,50],[73,50],[27,75],[73,75]]};
function shuffledSet() {
  const pieces=Array.from({length:7},(_,a)=>Array.from({length:7-a},(_,b)=>[a,a+b])).flat();
  for(let i=pieces.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
  return pieces;
}
function start() { state=criarJogo({pecas:shuffledSet()}); player=state.turno; selected=null; awaiting=false; render(); }
function pip(value) { return `<span class="pips">${(pipPositions[value]||[]).map(([x,y])=>`<i style="left:${x}%;top:${y}%"></i>`).join('')}</span>`; }
function pieceHTML(piece, extra='') { return `<span class="piece ${extra}"><span class="half">${pip(piece[0])}</span><span class="divider"></span><span class="half">${pip(piece[1])}</span></span>`; }
function playable(piece) {
  if(!state.mesa.length) return true;
  const l=state.mesa[0][0], r=state.mesa.at(-1)[1];
  return piece.includes(l)||piece.includes(r);
}
function toast(message) { const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300); }
function render() {
  const ended=state.status==='encerrado', view=obterVisao(state,player), canPlay=view.mao.some(playable);
  $('status-icon').textContent=ended?'✓':String(player+1);
  $('status-title').textContent=ended?(state.vencedor===null?'Partida empatada':`Jogador ${state.vencedor+1} venceu`):`Vez do Jogador ${player+1}`;
  $('status-message').textContent=ended?(state.motivo==='batida'?'Batida! Todas as peças foram jogadas.':'Jogo bloqueado. Venceu quem ficou com menos pontos.'):(canPlay?'Escolha uma peça e o lado da mesa.':state.monte.length?'Sem encaixe. Compre uma peça do monte.':'Sem jogada disponível. Passe a vez.');
  $('headline').textContent=ended?(state.vencedor===null?'Deu empate.':`Jogador ${state.vencedor+1} venceu!`):'Uma peça de cada vez.';
  $('subhead').textContent=ended?`Partida encerrada por ${state.motivo==='batida'?'batida':'bloqueio'}.`:'Encaixe os números iguais e seja o primeiro a ficar sem peças.';
  $('phase-label').textContent=ended?'PARTIDA ENCERRADA':'DUPLO-SEIS — PARTIDA LOCAL';
  $('hand-title').textContent=`Jogador ${player+1}`;$('hand-count').textContent=`${view.mao.length} ${view.mao.length===1?'peça':'peças'}`;
  $('hand').innerHTML=view.mao.map((piece,i)=>`<button type="button" class="hand-piece${selected===i?' selected':''}${canPlay&&playable(piece)?' playable':''}" data-index="${i}" aria-label="Peça ${piece[0]} e ${piece[1]}" ${ended||!playable(piece)?'disabled':''}>${pieceHTML(piece)}</button>`).join('');
  $('hand').querySelectorAll('[data-index]').forEach(btn=>btn.addEventListener('click',()=>{selected=Number(btn.dataset.index);render();}));
  $('hand-note').textContent=canPlay?'Selecione uma peça e depois escolha em qual ponta encaixar.':state.monte.length?'Não há encaixe. Compre do monte para tentar jogar.':'Não há encaixe e o monte acabou.';
  $('table').innerHTML=state.mesa.length?state.mesa.map(p=>pieceHTML(p)).join(''):'<div class="empty-table"><span>◈</span><strong>A mesa está vazia</strong><small>Jogador 1 começa com qualquer peça.</small></div>';
  $('table-count').textContent=`${state.mesa.length} ${state.mesa.length===1?'peça':'peças'}`;
  $('left-end').textContent=`ESQUERDA · ${state.mesa.length?state.mesa[0][0]:'—'}`;$('right-end').textContent=`DIREITA · ${state.mesa.length?state.mesa.at(-1)[1]:'—'}`;
  $('stock-count').textContent=`${state.monte.length} ${state.monte.length===1?'peça':'peças'}`;$('opponent-count').textContent=`Jogador ${2-player}: ${state.maos[1-player].length} peças`;
  $('draw-button').disabled=ended||canPlay||!state.monte.length;$('pass-button').disabled=ended||canPlay||state.monte.length>0;
  $('draw-button').innerHTML=state.monte.length?'Comprar peça <span>↓</span>':'Monte vazio';
  $('pass-button').textContent=state.monte.length?'Passar':'Passar';
  $('rules-note').textContent=ended?state.motivo==='batida'?'Batida · partida finalizada':'Bloqueio · vence a menor soma de pontos':'Sem jogada? Compre do monte. Sem peças no monte? Passe.';
  $('handoff').classList.toggle('hidden',!awaiting||ended);
  if(awaiting){$('handoff-title').textContent=`Passe ao Jogador ${player+1}.`;$('handoff-copy').textContent='Entregue o dispositivo sem mostrar as peças do outro jogador.';}
}
function act(action) { try { state=executarAcao(state,action);selected=null;player=state.turno;awaiting=state.status!=='encerrado';render(); } catch(error) { toast(error.message); } }
$('table').addEventListener('click',event=>{
  const end=event.target.closest('[data-end]')?.dataset.end;
  if(end===undefined||selected===null)return;
  const p=state.maos[player][selected];act({tipo:'jogar',jogador:player,peca:p,lado:end});
});
// The ends are rendered as explicit controls so placement is easy on touch screens.
function addEnds() {
  const ends=document.createElement('div');ends.className='end-actions';ends.innerHTML='<button type="button" data-end="esquerda">＋ encaixar à esquerda</button><button type="button" data-end="direita">encaixar à direita ＋</button>';
  $('table').after(ends);
  ends.addEventListener('click',event=>{const side=event.target.closest('[data-end]')?.dataset.end;if(side===undefined||selected===null)return;const p=state.maos[player][selected];act({tipo:'jogar',jogador:player,peca:p,lado:side});});
}
$('draw-button').addEventListener('click',()=>act({tipo:'comprar',jogador:player}));
$('pass-button').addEventListener('click',()=>act({tipo:'passar',jogador:player}));
$('new-button').addEventListener('click',start);
$('handoff-button').addEventListener('click',()=>{awaiting=false;render();});
addEnds();start();
