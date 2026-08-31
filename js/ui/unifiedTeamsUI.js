import { store } from '../state.js';

const ACTIONS = [
  ['shot','🎯','Remate','bg-blue-600'],
  ['positive','👍','Positivo','bg-teal-600'],
  ['negative','👎','Negativo','bg-red-800'],
  ['sanction','⚠️','Sanção','bg-yellow-600']
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function team(side){return side==='A'?store.state.gameData.A:store.state.gameData.B;}
function name(side){return side==='A'?store.state.teamAName:store.state.teamBName;}
function getSelected(){return store.state.selectedPlayerForAction||null;}
function setSelected(side,id){store.update(s=>s.selectedPlayerForAction={team:side,id:String(id)}); render();}

function installSelectionData(){
  document.querySelectorAll('[id="player-list-A"],[id="goalkeeper-list-A"]').forEach(host=>{
    host.querySelectorAll('div').forEach(card=>{
      const onclick=[...card.querySelectorAll('button')].find(b=>b.getAttribute('onclick')?.includes("openModal('shot'"));
      if(!onclick)return;
      const m=onclick.getAttribute('onclick').match(/openModal\('shot',\s*'([^']+)'/);
      if(!m)return;
      card.dataset.team='A'; card.dataset.player=m[1]; card.style.cursor='pointer';
      card.addEventListener('click',e=>{if(e.target.closest('button'))return;setSelected('A',m[1]);},{once:false});
    });
  });
}

function ensureUnifiedActionPanel(){
  const timeline=document.getElementById('timeline-list');
  if(!timeline)return;
  let panel=document.getElementById('unified-action-panel');
  if(panel)return panel;
  panel=document.createElement('div');panel.id='unified-action-panel';panel.className='bg-gray-700 p-4 rounded-xl mb-4';
  panel.innerHTML=`<div class="flex items-center justify-between gap-2 mb-3"><div><p class="text-xs text-gray-400">Jogador selecionado</p><p id="selected-action-player" class="font-bold text-white">Nenhum</p></div><button id="clear-action-player" class="text-xs px-3 py-2 rounded bg-gray-600">Limpar</button></div><div id="unified-action-buttons" class="grid grid-cols-4 gap-2"></div>`;
  timeline.parentElement.insertBefore(panel,timeline);
  panel.querySelector('#clear-action-player').onclick=()=>{store.update(s=>s.selectedPlayerForAction=null);render();};
  return panel;
}

function renderActionPanel(){
  const panel=ensureUnifiedActionPanel();if(!panel)return;
  const selected=getSelected();
  const label=panel.querySelector('#selected-action-player');
  const buttons=panel.querySelector('#unified-action-buttons');
  if(!selected){label.textContent='Nenhum';buttons.innerHTML='<div class="col-span-4 text-center text-sm text-gray-400 py-2">Selecione um atleta da Equipa A ou B.</div>';return;}
  const p=(team(selected.team).players||[]).find(x=>String(x.id??x.Numero)===String(selected.id)||String(x.Numero)===String(selected.id));
  label.textContent=p?`${name(selected.team)} · #${p.Numero} ${p.Nome}`:'Atleta não encontrado';
  buttons.innerHTML=ACTIONS.map(([type,icon,text,cls])=>`<button data-action="${type}" class="${cls} text-white px-2 py-3 rounded-lg font-bold">${icon}<span class="block text-[10px] mt-1">${text}</span></button>`).join('');
  buttons.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>dispatchAction(selected,b.dataset.action));
}

function dispatchAction(selected,type){
  if(selected.team==='A'){
    const legacy=window.__legacyOpenModal;
    if(legacy)legacy(type,selected.id);
    else window.openModal(type,selected.id);
    return;
  }
  openAwayAction(selected.id,type);
}

function openAwayAction(id,type){
  const p=(store.state.gameData.B.players||[]).find(x=>String(x.id??x.Numero)===String(id)||String(x.Numero)===String(id));
  if(!p)return;
  if(type==='shot'){
    const outcome=prompt(`Remate de #${p.Numero} ${p.Nome}\n\nEscreve: GOAL, SAVED, MISSED, POST ou BLOCKED`, 'GOAL');
    if(!outcome)return;recordAwayEvent(p,outcome.trim().toUpperCase(),'shot');
  }else if(type==='positive'){
    const action=prompt('Ação positiva: STEAL, INTERCEPTION, RECOVERY, ASSIST, PRE_ASSIST, DEFENSIVE_BLOCK, SEVEN_METER_WON','STEAL');
    if(action)recordAwayEvent(p,action.trim().toUpperCase(),'positive');
  }else if(type==='negative'){
    const action=prompt('Ação negativa: TURNOVER, RECEPTION_ERROR, OFFENSIVE_FOUL, MISSED_SHOT, BLOCKED_SHOT','TURNOVER');
    if(action)recordAwayEvent(p,action.trim().toUpperCase(),'negative');
  }else if(type==='sanction'){
    const action=prompt('Sanção: YELLOW, 2MIN ou RED','2MIN');
    if(action)recordAwayEvent(p,action.trim().toUpperCase(),'sanction');
  }
}

function recordAwayEvent(p,action,kind){
  store.update(s=>{
    const b=s.gameData.B,a=s.gameData.A;
    if(kind==='shot'){
      b.stats.shots=(b.stats.shots||0)+1;
      if(action==='GOAL'){b.stats.goals++;a.stats.gkGoalsAgainst=(a.stats.gkGoalsAgainst||0)+1;p.goals=(p.goals||0)+1;}
      else if(action==='SAVED'){b.stats.savedShots++;a.stats.gkSaves=(a.stats.gkSaves||0)+1;}
      else if(action==='MISSED'||action==='POST'){b.stats.misses++;}
      else if(action==='BLOCKED'){b.stats.blocked=(b.stats.blocked||0)+1;}
    }else if(kind==='positive'){
      p.positiveActions=p.positiveActions||[];p.positiveActions.push({action,time:s.totalSeconds});
    }else if(kind==='negative'){
      p.negativeActions=p.negativeActions||[];p.negativeActions.push({action,time:s.totalSeconds});b.stats.turnovers=(b.stats.turnovers||0)+(action==='TURNOVER'?1:0);
    }else if(kind==='sanction'){
      p.sanctions=p.sanctions||{yellow:0,twoMin:0,red:0};
      if(action==='YELLOW')p.sanctions.yellow++;
      if(action==='2MIN'){p.sanctions.twoMin++;p.isSuspended=true;p.suspensionTimer=120;p.onCourt=false;}
      if(action==='RED'){p.sanctions.red++;p.disqualified=true;p.onCourt=false;}
    }
    s.gameEvents.push({event_id:crypto.randomUUID(),match_id:s.matchId||null,timestamp_seconds:s.totalSeconds,team:'B',team_id:s.teamBId||null,player_id:p.id,event_type:kind==='shot'?'SHOT':action,details:`${p.Nome}: ${action}`});
  });
  render();
}

function renderAwaySelectable(){
  const host=document.getElementById('away-roster-live');if(!host)return;
  host.querySelectorAll('#away-player-list > div,#away-goalkeeper-list > div').forEach(card=>{
    if(card.dataset.bound)return;card.dataset.bound='1';
    const text=card.querySelector('.truncate');const num=card.querySelector('.w-7');
    const id=num?.textContent?.trim();if(!id)return;
    card.dataset.team='B';card.dataset.player=id;card.style.cursor='pointer';
    card.addEventListener('click',e=>{if(e.target.closest('button'))return;setSelected('B',id);});
  });
}

function normalizeLabels(){
  const a=document.querySelector('#tab-data h3.text-blue-400');if(a)a.textContent=store.state.teamAName||'Equipa A';
  const b=document.querySelector('#tab-data h3.text-orange-400');if(b)b.textContent=store.state.teamBName||'Equipa B';
  const opponentPanel=document.querySelector('#timeline-list')?.closest('.bg-gray-800');
  opponentPanel?.querySelectorAll('p').forEach(p=>{if(p.textContent?.trim()==='Registo de Ações')p.textContent='Ações do jogador selecionado';});
  ['goalOpponentBtn','saveOpponentBtn','missOpponentBtn','twoMinOpponentBtn','opponent7v6Btn'].forEach(id=>document.getElementById(id)?.closest('div')?.classList.add('hidden'));
  document.querySelectorAll('#tab-data .bg-gray-700').forEach(x=>{if(x.querySelector('#unified-action-panel'))return;});
}

function render(){normalizeLabels();renderActionPanel();installSelectionData();renderAwaySelectable();}

function patchLegacy(){
  if(window.__unifiedTeamsPatched)return;
  if(typeof window.openModal==='function'){
    window.__legacyOpenModal=window.openModal;
  }
  window.__unifiedTeamsPatched=true;
}

function install(){patchLegacy();render();[300,1000,2000,4000].forEach(ms=>setTimeout(render,ms));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setInterval(render,1500);
