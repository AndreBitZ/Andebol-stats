import { store } from '../state.js';
import { recordAction, currentDefendingGoalkeeper, ACTION_TYPES } from '../domain/actionEngine.js';

let selected = null;

function teamName(side){ const s=store.state; return side==='A'?(s?.teamAName||'Equipa A'):(s?.teamBName||'Equipa B'); }
function findPlayer(side,id){ const s=store.state; return (s?.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }
function playerLabel(side,id){ const p=findPlayer(side,id); return p?`${teamName(side)} · #${p.Numero} ${p.Nome}`:'Atleta'; }

function close(id){ const p=document.getElementById(id); if(p){p.classList.add('hidden');p.classList.remove('flex');} }
function closeAll(){ close('bilateral-action-popup'); close('bilateral-shot-result-popup'); close('bilateral-generic-action-popup'); selected=null; }

function showError(err){ console.error(err); alert(err?.message||'Não foi possível registar a ação.'); }

function ensureShotPopup(){
  let popup=document.getElementById('bilateral-shot-result-popup');
  if(popup)return popup;
  popup=document.createElement('div'); popup.id='bilateral-shot-result-popup';
  popup.className='fixed inset-0 z-[10000] hidden items-center justify-center bg-black/70 p-4';
  popup.innerHTML=`<div class="w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-600 shadow-2xl p-5" role="dialog" aria-modal="true"><div class="flex items-center justify-between gap-3 mb-4"><div><div class="text-xs text-gray-400">Resultado do remate</div><div id="bilateral-shot-player" class="font-bold text-white"></div></div><button id="bilateral-shot-close" type="button" class="px-3 py-2 rounded-lg bg-gray-700 text-white">✕</button></div><div class="grid grid-cols-1 gap-2">${[['goal','🎯 GOAL'],['saved','🧤 SAVED'],['missed','❌ MISSED'],['post','🥅 POST'],['blocked','🧱 BLOCKED']].map(([k,l])=>`<button type="button" class="shot-result-choice w-full p-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold" data-result="${k}">${l}</button>`).join('')}</div></div>`;
  document.body.appendChild(popup);
  popup.addEventListener('click',e=>{if(e.target===popup)close('bilateral-shot-result-popup');selected=null;});
  popup.querySelector('#bilateral-shot-close').onclick=()=>{close('bilateral-shot-result-popup');selected=null;};
  popup.querySelectorAll('.shot-result-choice').forEach(btn=>btn.onclick=()=>{
    const sel=popup._selection;if(!sel)return;
    const map={goal:'GOAL',saved:'SAVED',missed:'MISSED',post:'POST',blocked:'BLOCKED'};
    const result=map[btn.dataset.result];
    try{
      const goalkeeper=currentDefendingGoalkeeper(sel.side);
      recordAction({side:sel.side,playerId:sel.playerId,action:ACTION_TYPES.SHOT,shotResult:result,goalkeeperId:goalkeeper?.id??goalkeeper?.Numero??null});
      closeAll();
      window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:'SHOT',result,side:sel.side,playerId:sel.playerId}}));
    }catch(err){showError(err);}
  });
  return popup;
}

function openShot(side,id){
  const player=findPlayer(side,id); if(!player)return;
  selected={side,playerId:String(id)};
  close('bilateral-action-popup');
  const popup=ensureShotPopup();
  popup._selection={side,playerId:String(id)};
  popup.querySelector('#bilateral-shot-player').textContent=playerLabel(side,id);
  popup.classList.remove('hidden');popup.classList.add('flex');
}

const GENERIC_ACTIONS={
  positive:[
    {key:'assist',label:'Assistência 🎯',action:ACTION_TYPES.ASSIST},
    {key:'steal',label:'Roubo de Bola ✋',action:ACTION_TYPES.STEAL},
    {key:'7m_provoked',label:'7m Provocado ⚡',action:ACTION_TYPES.SEVEN_METER_WON}
  ],
  negative:[
    {key:'technical_fault',label:'Falta Técnica ❌',action:ACTION_TYPES.TECHNICAL_FAULT},
    {key:'turnover',label:'Perda de Bola 📉',action:ACTION_TYPES.TURNOVER},
    {key:'7m_foul',label:'7m Cometido 🛑',action:ACTION_TYPES.SEVEN_METER_FOUL}
  ]
};

function ensureGenericPopup(){
  let popup=document.getElementById('bilateral-generic-action-popup');
  if(popup)return popup;
  popup=document.createElement('div');popup.id='bilateral-generic-action-popup';
  popup.className='fixed inset-0 z-[10001] hidden items-center justify-center bg-black/70 p-4';
  popup.innerHTML=`<div class="w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-600 shadow-2xl p-5" role="dialog" aria-modal="true"><div class="flex items-center justify-between gap-3 mb-4"><div><div id="bilateral-generic-title" class="text-xl font-bold text-white"></div><div id="bilateral-generic-player" class="text-sm text-gray-400"></div></div><button id="bilateral-generic-close" type="button" class="px-3 py-2 rounded-lg bg-gray-700 text-white">✕</button></div><div id="bilateral-generic-options" class="grid grid-cols-1 gap-2"></div></div>`;
  document.body.appendChild(popup);
  popup.addEventListener('click',e=>{if(e.target===popup){close('bilateral-generic-action-popup');selected=null;}});
  popup.querySelector('#bilateral-generic-close').onclick=()=>{close('bilateral-generic-action-popup');selected=null;};
  return popup;
}

function openGeneric(side,id,category){
  const player=findPlayer(side,id);if(!player)return;
  selected={side,playerId:String(id)};
  close('bilateral-action-popup');
  const popup=ensureGenericPopup();
  popup._selection={side,playerId:String(id)};
  popup.querySelector('#bilateral-generic-title').textContent=category==='positive'?'Ação Positiva':'Ação Negativa';
  popup.querySelector('#bilateral-generic-player').textContent=playerLabel(side,id);
  const options=popup.querySelector('#bilateral-generic-options');
  options.innerHTML=GENERIC_ACTIONS[category].map(o=>`<button type="button" class="generic-action-choice w-full p-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold" data-action="${o.action}">${o.label}</button>`).join('');
  options.querySelectorAll('.generic-action-choice').forEach(btn=>btn.onclick=()=>{
    const sel=popup._selection;if(!sel)return;
    try{
      recordAction({side:sel.side,playerId:sel.playerId,action:btn.dataset.action,metadata:{ui_category:category}});
      closeAll();
      window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:btn.dataset.action,side:sel.side,playerId:sel.playerId}}));
    }catch(err){showError(err);}
  });
  popup.classList.remove('hidden');popup.classList.add('flex');
}

function installGameControls(){
  const startBtn=document.getElementById('startBtn');
  const pauseBtn=document.getElementById('pauseBtn');
  const exportBtn=document.getElementById('exportExcelBtn');
  if(!startBtn)return;

  // O botão antigo de pausa deixa de fazer parte da interface; fica disponível
  // apenas internamente para preservar o motor de pausa existente.
  if(pauseBtn)pauseBtn.classList.add('hidden');
  if(exportBtn)exportBtn.remove();

  const updateLabel=()=>{
    const running=store.state?.isRunning===true;
    startBtn.textContent=running?'⏸️ Pausar':'▶️ Iniciar';
    startBtn.setAttribute('aria-label',running?'Pausar jogo':'Iniciar jogo');
    startBtn.setAttribute('aria-pressed',String(running));
    startBtn.classList.toggle('bg-green-600',!running);
    startBtn.classList.toggle('bg-yellow-600',running);
  };

  // Quando o jogo já está a correr, interceptamos o clique e usamos o motor
  // de pausa existente. Quando está parado, deixamos o listener original de
  // main.js executar a validação e o arranque.
  startBtn.addEventListener('click',(event)=>{
    if(store.state?.isRunning!==true)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(pauseBtn)pauseBtn.click();
    updateLabel();
  },true);

  document.addEventListener('handball:state-updated',updateLabel);
  window.addEventListener('bilateral-action-recorded',updateLabel);
  updateLabel();
}

function install(){
  window.openBilateralShot=openShot;
  window.openBilateralAction=openGeneric;
  window.getOpposingGoalkeeper=side=>currentDefendingGoalkeeper(side);
  installGameControls();
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}
