import { recordAction, currentDefendingGoalkeeper } from '../domain/actionEngine.js';

let selected = null;

function storeRef(){ return window.store || null; }
function teamName(side){ const s=storeRef()?.state; return side==='A'?(s?.teamAName||'Equipa A'):(s?.teamBName||'Equipa B'); }
function findPlayer(side,id){ const s=storeRef()?.state; return (s?.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }
function playerLabel(side,id){ const p=findPlayer(side,id); return p?`${teamName(side)} · #${p.Numero} ${p.Nome}`:'Atleta'; }

function closePlayerPopup(){
  const p=document.getElementById('bilateral-action-popup');
  if(p){ p.classList.add('hidden'); p.classList.remove('flex'); p._selection=null; }
}
function closeShotPopup(){
  const p=document.getElementById('bilateral-shot-result-popup');
  if(p){ p.classList.add('hidden'); p.classList.remove('flex'); p._selection=null; }
}
function openShot(side,id){
  selected={side,playerId:String(id)};
  closePlayerPopup();
  let popup=document.getElementById('bilateral-shot-result-popup');
  if(!popup){
    popup=document.createElement('div');
    popup.id='bilateral-shot-result-popup';
    popup.className='fixed inset-0 z-[10000] hidden items-center justify-center bg-black/70 p-4';
    popup.innerHTML=`<div class="w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-600 shadow-2xl p-5" role="dialog" aria-modal="true"><div class="flex items-center justify-between gap-3 mb-4"><div><div class="text-xs text-gray-400">Resultado do remate</div><div id="bilateral-shot-player" class="font-bold text-white"></div></div><button id="bilateral-shot-close" type="button" class="px-3 py-2 rounded-lg bg-gray-700 text-white">✕</button></div><div class="grid grid-cols-1 gap-2">${[['goal','🎯 GOAL'],['saved','🧤 SAVED'],['missed','❌ MISSED'],['post','🥅 POST'],['blocked','🧱 BLOCKED']].map(([k,l])=>`<button type="button" class="shot-result-choice w-full p-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold" data-result="${k}">${l}</button>`).join('')}</div></div>`;
    document.body.appendChild(popup);
    popup.addEventListener('click',e=>{if(e.target===popup)closeShotPopup();});
    popup.querySelector('#bilateral-shot-close').onclick=closeShotPopup;
    popup.querySelectorAll('.shot-result-choice').forEach(btn=>btn.onclick=()=>{
      const sel=popup._selection; if(!sel)return;
      const map={goal:'GOAL',saved:'SAVED',missed:'MISSED',post:'POST',blocked:'BLOCKED'};
      const result=map[btn.dataset.result]; if(!result)return;
      try{
        const goalkeeper=currentDefendingGoalkeeper(sel.side);
        recordAction({side:sel.side,playerId:sel.playerId,action:'SHOT',shotResult:result,goalkeeperId:goalkeeper?.id??goalkeeper?.Numero??null});
        selected=null; closeShotPopup();
        window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:'SHOT',result}}));
      }catch(err){console.error(err);alert(err.message||'Não foi possível registar o remate.');}
    });
  }
  popup._selection={side,playerId:String(id)};
  popup.querySelector('#bilateral-shot-player').textContent=playerLabel(side,id);
  popup.classList.remove('hidden'); popup.classList.add('flex');
}

function install(){
  const s=storeRef(); if(!s)return;
  window.openBilateralShot=openShot;
  window.getOpposingGoalkeeper=side=>currentDefendingGoalkeeper(side);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setInterval(install,1000);
