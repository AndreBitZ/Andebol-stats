import { store } from '../state.js';
import { recordAction, currentDefendingGoalkeeper, ACTION_TYPES } from '../domain/actionEngine.js';

const ZONES = [
  { id:'1', distance:'curta' }, { id:'2', distance:'curta/média' }, { id:'3', distance:'curta/média' },
  { id:'4', distance:'curta/média' }, { id:'5', distance:'curta' }, { id:'6', distance:'longa' },
  { id:'7', distance:'longa' }, { id:'8', distance:'longa' }, { id:'9', distance:'longa' }
];
const GOAL_CELLS = [1,2,3,4,5,6,7,8,9];
const RESULTS = [['GOAL','⚽ Golo'],['SAVED','🧤 Defesa GR'],['MISSED','❌ Falhado'],['POST','🥅 Poste'],['BLOCKED','🧱 Bloqueado']];
let selection = null;

function player(side,id){ return (store.state.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }
function goalkeeper(side){ return currentDefendingGoalkeeper(side); }
function close(){ const el=document.getElementById('professional-shot-modal'); if(el){el.classList.add('hidden');el.classList.remove('flex');} selection=null; }
function resetVisual(modal){
  modal.querySelectorAll('[data-zone]').forEach(b=>b.classList.remove('shot-zone-selected'));
  modal.querySelectorAll('[data-goal-cell]').forEach(b=>b.classList.remove('ring-2','ring-yellow-300','bg-blue-600'));
  modal.querySelectorAll('[data-result]').forEach(b=>b.classList.remove('ring-2','ring-green-300','bg-green-700'));
  modal.querySelector('[data-distance="7m"]')?.classList.remove('ring-2','ring-purple-300');
}
function ensure(){
  let modal=document.getElementById('professional-shot-modal'); if(modal)return modal;
  modal=document.createElement('div'); modal.id='professional-shot-modal'; modal.className='fixed inset-0 z-[10010] hidden items-center justify-center bg-black/75 p-3 sm:p-5';
  modal.innerHTML=`<style>
    #professional-shot-modal .shot-court-wrap{position:relative;width:100%;max-width:760px;margin:0 auto;line-height:0;overflow:hidden;border-radius:14px;background:#fff;border:1px solid #4b5563;}
    #professional-shot-modal .shot-court-image{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none;}
    #professional-shot-modal .shot-court-overlay{position:absolute;inset:0;width:100%;height:100%;}
    #professional-shot-modal .shot-zone-hit{fill:rgba(59,130,246,.001);stroke:transparent;stroke-width:3;cursor:pointer;transition:fill .15s,stroke .15s;}
    #professional-shot-modal .shot-zone-hit:hover{fill:rgba(59,130,246,.12);stroke:rgba(59,130,246,.55);}
    #professional-shot-modal .shot-zone-hit.shot-zone-selected{fill:rgba(37,99,235,.24);stroke:#2563eb;stroke-width:5;}
  </style>
  <div class="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl" role="dialog" aria-modal="true">
    <div class="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-gray-900/95 backdrop-blur border-b border-gray-700">
      <div><div class="text-2xl font-bold text-white">🎯 Remate</div><div id="shot-subtitle" class="text-sm text-gray-400"></div></div>
      <button id="shot-close" class="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white">✕</button>
    </div>
    <div class="p-4 sm:p-5 grid lg:grid-cols-[1.15fr_.85fr] gap-5">
      <section class="rounded-2xl bg-gray-800 p-4 border border-gray-700">
        <div class="flex items-center justify-between mb-3"><div><h3 class="text-lg font-bold text-white">Zona do campo</h3><p id="shot-zone-help" class="text-xs text-gray-400">Toque diretamente na zona do campo onde o remate foi efetuado.</p></div><span class="text-xs text-gray-500">1–9</span></div>
        <div class="shot-court-wrap">
          <img class="shot-court-image" src="/assets/shot-court-zones.svg" alt="Campo de andebol dividido em 9 zonas de remate" draggable="false">
          <svg class="shot-court-overlay" viewBox="0 0 1024 1024" aria-hidden="true" preserveAspectRatio="none">
            <polygon data-zone="1" class="shot-zone-hit" points="52,69 211,69 211,214 267,359 130,359 52,110" />
            <polygon data-zone="2" class="shot-zone-hit" points="211,214 267,359 405,505 343,505 130,359" />
            <polygon data-zone="3" class="shot-zone-hit" points="267,359 405,505 619,505 757,359" />
            <polygon data-zone="4" class="shot-zone-hit" points="757,359 619,505 681,505 894,359" />
            <polygon data-zone="5" class="shot-zone-hit" points="813,69 972,69 972,110 894,359 757,359 813,214" />
            <polygon data-zone="6" class="shot-zone-hit" points="52,359 130,359 343,505 343,755 52,755" />
            <polygon data-zone="7" class="shot-zone-hit" points="343,505 681,505 681,755 343,755" />
            <polygon data-zone="8" class="shot-zone-hit" points="681,505 894,359 972,359 972,755 681,755" />
            <polygon data-zone="9" class="shot-zone-hit" points="52,755 972,755 972,973 52,973" />
          </svg>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-400"><div>1 e 5 · curta</div><div>2–4 · curta/média</div><div>6–9 · longa</div></div>
        <div id="selected-shot-zone" class="mt-3 rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-center text-sm text-gray-300">Zona selecionada: <strong class="text-white">—</strong></div>
        <button id="seven-meter-toggle" data-distance="7m" class="mt-4 w-full rounded-xl border border-purple-500/50 bg-gray-800 hover:bg-gray-700 p-4 text-left transition"><span class="block text-lg font-black text-white">🟣 7 metros</span><span class="text-xs text-gray-400">Remate de 7m · não usa a zona 1–9</span></button>
      </section>
      <section class="space-y-5">
        <div class="rounded-2xl bg-gray-800 p-4 border border-gray-700"><h3 class="text-lg font-bold text-white mb-1">Local do remate na baliza</h3><p class="text-xs text-gray-400 mb-3">Selecione uma das 9 zonas.</p><div class="grid grid-cols-3 gap-1 rounded-xl overflow-hidden border border-gray-500 bg-gray-950">${GOAL_CELLS.map(n=>`<button data-goal-cell="${n}" class="aspect-square bg-gray-800 hover:bg-blue-700 text-white font-black text-xl border border-gray-700">${n}</button>`).join('')}</div><div class="mt-3 text-xs text-gray-400">Zona de baliza selecionada: <strong id="goal-cell-label" class="text-white">—</strong></div></div>
        <div class="rounded-2xl bg-gray-800 p-4 border border-gray-700"><h3 class="text-lg font-bold text-white mb-3">Resultado</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${RESULTS.map(([k,l])=>`<button data-result="${k}" class="rounded-xl p-3 bg-gray-700 hover:bg-gray-600 text-white font-bold">${l}</button>`).join('')}</div></div>
        <div class="rounded-2xl bg-gray-800 p-4 border border-gray-700"><div class="grid sm:grid-cols-2 gap-3"><div><div class="text-xs text-gray-400 mb-1">Jogador que remata</div><div id="shot-player" class="font-bold text-white bg-gray-900 rounded-lg p-3"></div></div><div><div class="text-xs text-gray-400 mb-1">Guarda-redes adversário</div><div id="shot-gk" class="font-bold text-white bg-gray-900 rounded-lg p-3"></div></div></div></div>
        <div class="flex gap-2"><button id="shot-cancel" class="flex-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold p-3">Cancelar</button><button id="shot-save" disabled class="flex-1 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-bold p-3">Guardar Remate</button></div>
      </section>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#shot-close').onclick=close; modal.querySelector('#shot-cancel').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  modal.querySelectorAll('[data-zone]').forEach(btn=>btn.onclick=()=>{selection.zone=btn.dataset.zone;selection.isSevenMeter=false;update(modal);});
  modal.querySelector('#seven-meter-toggle').onclick=()=>{selection.zone=null;selection.isSevenMeter=true;update(modal);};
  modal.querySelectorAll('[data-goal-cell]').forEach(btn=>btn.onclick=()=>{selection.goalCell=btn.dataset.goalCell;update(modal);});
  modal.querySelectorAll('[data-result]').forEach(btn=>btn.onclick=()=>{selection.result=btn.dataset.result;update(modal);});
  modal.querySelector('#shot-save').onclick=save;
  return modal;
}
function update(modal){
  resetVisual(modal);
  if(selection.zone){const zoneButton=modal.querySelector(`[data-zone="${selection.zone}"]`);zoneButton?.classList.add('shot-zone-selected');}
  if(selection.isSevenMeter) modal.querySelector('#seven-meter-toggle').classList.add('ring-2','ring-purple-300');
  if(selection.goalCell){const b=modal.querySelector(`[data-goal-cell="${selection.goalCell}"]`);b.classList.add('ring-2','ring-yellow-300','bg-blue-600');modal.querySelector('#goal-cell-label').textContent=selection.goalCell;}
  if(selection.result) modal.querySelector(`[data-result="${selection.result}"]`).classList.add('ring-2','ring-green-300','bg-green-700');
  const zone=selection.zone?ZONES.find(z=>z.id===selection.zone):null;
  modal.querySelector('#shot-zone-help').textContent=selection.isSevenMeter?'7 metros selecionado — a zona de campo 1–9 fica desativada.':(zone?`Zona ${zone.id} · distância ${zone.distance}`:'Toque diretamente na zona do campo onde o remate foi efetuado.');
  modal.querySelector('#selected-shot-zone strong').textContent=selection.isSevenMeter?'7 metros':(zone?`Zona ${zone.id} · ${zone.distance}`:'—');
  modal.querySelector('#shot-save').disabled=!(selection.goalCell&&selection.result&&(selection.zone||selection.isSevenMeter));
}
function save(){
  if(!selection?.side||!selection?.playerId||!selection?.result)return;
  try{
    const p=player(selection.side,selection.playerId); if(!p)throw new Error('Atleta não encontrado.');
    const gk=goalkeeper(selection.side); if(!gk)throw new Error('Não existe guarda-redes adversário em campo.');
    const cell=Number(selection.goalCell); const x=((cell-1)%3+0.5)*33.3333333333; const y=(Math.floor((cell-1)/3)+0.5)*33.3333333333;
    recordAction({side:selection.side,playerId:selection.playerId,action:ACTION_TYPES.SHOT,shotResult:selection.result,goalkeeperId:gk.id??gk.Numero??null,metadata:{shot_type:selection.isSevenMeter?'7M':'FIELD',shot_zone:selection.isSevenMeter?'7M':selection.zone,shot_distance:selection.isSevenMeter?'7m':ZONES.find(z=>z.id===selection.zone)?.distance,goal_location:selection.goalCell,goal_zone_3x3:selection.goalCell,shot_coordinates:{x:x.toFixed(1),y:y.toFixed(1)}}});
    close(); window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:'SHOT',result:selection.result,side:selection.side,playerId:selection.playerId,shot_type:selection.isSevenMeter?'7M':'FIELD'}}));
  }catch(err){console.error(err);alert(err?.message||'Não foi possível registar o remate.');}
}
function open(side,id){const p=player(side,id);if(!p)return;const modal=ensure();selection={side,playerId:String(id),zone:null,isSevenMeter:false,goalCell:null,result:null};modal.querySelector('#shot-subtitle').textContent=`${side==='A'?(store.state.teamAName||'Equipa A'):(store.state.teamBName||'Equipa B')} · #${p.Numero} ${p.Nome}`;modal.querySelector('#shot-player').textContent=`#${p.Numero} ${p.Nome}`;const gk=goalkeeper(side);modal.querySelector('#shot-gk').textContent=gk?`#${gk.Numero} ${gk.Nome}`:'Sem GR em campo';update(modal);modal.classList.remove('hidden');modal.classList.add('flex');}
function install(){window.openBilateralShot=open;setTimeout(()=>window.openBilateralShot=open,0);setTimeout(()=>window.openBilateralShot=open,300);}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
