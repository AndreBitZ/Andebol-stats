import { recordAction, currentDefendingGoalkeeper } from '../domain/actionEngine.js';

let selected = null;

function storeRef() { return window.store || null; }
function teamName(side) { const s=storeRef()?.state; return side==='A' ? (s?.teamAName||'Equipa A') : (s?.teamBName||'Equipa B'); }
function findPlayer(side,id) { const s=storeRef()?.state; return (s?.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }

function closePlayerPopup() {
  const popup=document.getElementById('bilateral-action-popup');
  if(popup){ popup.classList.add('hidden'); popup.classList.remove('flex'); popup._selection=null; }
}

function openShot(side, playerId) {
  selected={side,playerId:String(playerId)};
  const p=findPlayer(side,playerId); if(!p)return;
  closePlayerPopup();
  const title=document.getElementById('shotPlayerName');
  if(title)title.textContent=`${teamName(side)} · #${p.Numero} ${p.Nome}`;
  document.getElementById('shotModal')?.classList.remove('hidden');
}

function install() {
  if(!storeRef())return;
  document.querySelectorAll('[data-team-player]').forEach(card=>{
    if(card.dataset.bilateralBound)return;
    const parts=(card.dataset.teamPlayer||'').split(':');
    if(parts.length!==2)return;
    card.dataset.bilateralBound='1';
    card.addEventListener('click',e=>{if(e.target.closest('button'))return;selected={side:parts[0],playerId:parts[1]};});
  });

  document.querySelectorAll('.shot-outcome-btn').forEach(button=>{
    if(button.dataset.bilateralBound)return;
    button.dataset.bilateralBound='1';
    button.addEventListener('click',()=>{
      if(!selected)return;
      const resultMap={goal:'GOAL',saved:'SAVED',missed:'MISSED',post:'POST',blocked:'BLOCKED'};
      const result=resultMap[button.dataset.outcome]; if(!result)return;
      try {
        const goalkeeper=currentDefendingGoalkeeper(selected.side);
        recordAction({side:selected.side,playerId:selected.playerId,action:'SHOT',shotResult:result,goalkeeperId:goalkeeper?.id??goalkeeper?.Numero??null});
        selected=null;
        document.getElementById('shotModal')?.classList.add('hidden');
        window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:'SHOT',result}}));
      } catch(err) {
        console.error(err); alert(err.message||'Não foi possível registar o remate.');
      }
    });
  });

  window.openBilateralShot=openShot;
  window.getOpposingGoalkeeper=side=>currentDefendingGoalkeeper(side);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setInterval(install,1000);
