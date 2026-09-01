import { recordAction, currentDefendingGoalkeeper } from '../domain/actionEngine.js';

let selected = null;

function storeRef() { return window.store || null; }
function teamName(side) { const s=storeRef()?.state; return side==='A' ? (s?.teamAName||'Equipa A') : (s?.teamBName||'Equipa B'); }
function findPlayer(side,id) { const s=storeRef()?.state; return (s?.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }

function closePlayerPopup() {
  const popup=document.getElementById('bilateral-action-popup');
  if(popup){ popup.classList.add('hidden'); popup.classList.remove('flex'); popup._selection=null; }
}

function ensureShotPopup() {
  let popup=document.getElementById('bilateral-shot-popup');
  if(popup)return popup;
  popup=document.createElement('div');
  popup.id='bilateral-shot-popup';
  popup.className='fixed inset-0 z-[10000] hidden items-center justify-center bg-black/70 p-4';
  popup.innerHTML=`<div class="w-full max-w-md rounded-2xl bg-gray-800 border border-gray-600 shadow-2xl p-5" role="dialog" aria-modal="true"><div class="flex items-center justify-between gap-3 mb-5"><div><div class="text-xs text-gray-400">Registo de remate</div><div id="bilateral-shot-player" class="font-bold text-white text-lg"></div></div><button id="bilateral-shot-close" type="button" class="px-3 py-2 rounded-lg bg-gray-700 text-white">✕</button></div><div class="grid grid-cols-2 gap-3"><button type="button" data-shot-result="GOAL" class="bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl font-bold">🎯<span class="block text-sm mt-1">GOAL</span></button><button type="button" data-shot-result="SAVED" class="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold">🧤<span class="block text-sm mt-1">SAVED</span></button><button type="button" data-shot-result="MISSED" class="bg-red-700 hover:bg-red-600 text-white p-4 rounded-xl font-bold">❌<span class="block text-sm mt-1">MISSED</span></button><button type="button" data-shot-result="POST" class="bg-yellow-600 hover:bg-yellow-500 text-white p-4 rounded-xl font-bold">🥅<span class="block text-sm mt-1">POST</span></button><button type="button" data-shot-result="BLOCKED" class="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-xl font-bold col-span-2">🧱<span class="block text-sm mt-1">BLOCKED</span></button></div></div>`;
  document.body.appendChild(popup);
  const close=()=>{popup.classList.add('hidden');popup.classList.remove('flex');selected=null;};
  popup.querySelector('#bilateral-shot-close').onclick=close;
  popup.addEventListener('click',e=>{if(e.target===popup)close();});
  popup.querySelectorAll('[data-shot-result]').forEach(btn=>btn.onclick=()=>{
    if(!selected)return;
    const result=btn.dataset.shotResult;
    try {
      const goalkeeper=currentDefendingGoalkeeper(selected.side);
      recordAction({side:selected.side,playerId:selected.playerId,action:'SHOT',shotResult:result,goalkeeperId:goalkeeper?.id??goalkeeper?.Numero??null});
      close();
      window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:'SHOT',result,side:selected.side,playerId:selected.playerId}}));
    } catch(err) { console.error(err); alert(err.message||'Não foi possível registar o remate.'); }
  });
  return popup;
}

function openShot(side, playerId) {
  const p=findPlayer(side,playerId); if(!p)return;
  selected={side,playerId:String(playerId)};
  closePlayerPopup();
  const popup=ensureShotPopup();
  popup.querySelector('#bilateral-shot-player').textContent=`${teamName(side)} · #${p.Numero} ${p.Nome}`;
  popup.classList.remove('hidden');
  popup.classList.add('flex');
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
  window.openBilateralShot=openShot;
  window.getOpposingGoalkeeper=side=>currentDefendingGoalkeeper(side);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setInterval(install,1000);
