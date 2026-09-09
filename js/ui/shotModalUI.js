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
  modal.querySelectorAll('[data-zone]').forEach(b=>b.classList.remove('ring-2','ring-blue-400','bg-blue-700'));
  modal.querySelectorAll('[data-goal-cell]').forEach(b=>b.classList.remove('ring-2','ring-yellow-300','bg-blue-600'));
  modal.querySelectorAll('[data-result]').forEach(b=>b.classList.remove('ring-2','ring-green-300','bg-green-700'));
  modal.querySelector('[data-distance="7m"]')?.classList.remove('ring-2','ring-purple-300');
}
function ensure(){
  let modal=document.getElementById('professional-shot-modal'); if(modal)return modal;
  modal=document.createElement('div'); modal.id='professional-shot-modal'; modal.className='fixed inset-0 z-[10010] hidden items-center justify-center bg-black/75 p-3 sm:p-5';
  modal.innerHTML=`<div class="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl" role="dialog" aria-modal="true">
    <div class="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-gray-900/95 backdrop-blur border-b border-gray-700">
      <div><div class="text-2xl font-bold text-white">🎯 Remate</div><div id="shot-subtitle" class="text-sm text-gray-400"></div></div>
      <button id="shot-close" class="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white">✕</button>
    </div>
    <div class="p-4 sm:p-5 grid lg:grid-cols-[1.15fr_.85fr] gap-5">
      <section class="rounded-2xl bg-gray-800 p-4 border border-gray-700">
        <div class="flex items-center justify-between mb-3"><div><h3 class="text-lg font-bold text-white">Zona do campo</h3><p id="shot-zone-help" class="text-xs text-gray-400">Escolha a zona onde o remate foi efetuado.</p></div><span class="text-xs text-gray-500">1–9</span></div>
        <div class="grid grid-cols-3 gap-2 mb-4">${ZONES.map(z=>`<button data-zone="${z.id}" class="rounded-xl p-3 bg-gray-700 hover:bg-gray-600 text-left transition"><span class="block text-lg font-black text-white">${z.id}</span><span class="block text-[11px] text-gray-300">${z.distance}</span></button>`).join('')}</div>
        <div class="relative overflow-hidden rounded-xl border border-gray-600 bg-gray-950 p-2">
          <svg viewBox="0 0 900 620" class="w-full h-auto"><rect x="8" y="8" width="884" height="604" fill="none" stroke="#6b7280" stroke-width="5"/><path d="M160 8V190 M740 8V190 M160 190 Q450 420 740 190" fill="none" stroke="#9ca3af" stroke-width="5"/><path d="M255 190 Q450 350 645 190" fill="none" stroke="#9ca3af" stroke-width="4" stroke-dasharray="12 10"/><line x1="300" y1="350" x2="300" y2="612" stroke="#6b7280" stroke-width="4"/><line x1="600" y1="350" x2="600" y2="612" stroke="#6b7280" stroke-width="4"/><line x1="300" y1="350" x2="600" y2="350" stroke="#6b7280" stroke-width="4"/>${ZONES.map((z,i)=>{const pos=[['140','120'],['250','270'],['450','285'],['650','270'],['760','120'],['145','475'],['450','475'],['755','475'],['450','575']][i];return `<text x="${pos[0]}" y="${pos[1]}" fill="white" font-size="48" font-weight="800" text-anchor="middle">${z.id}</text>`}).join('')}</svg>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-400"><div>1 e 5 · curta</div><div>2–4 · curta/média</div><div>6–9 · longa</div></div>
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
  if(selection.zone) modal.querySelector(`[data-zone="${selection.zone}"]`).classList.add('ring-2','ring-blue-400','bg-blue-700');
  if(selection.isSevenMeter) modal.querySelector('#seven-meter-toggle').classList.add('ring-2','ring-purple-300');
  if(selection.goalCell){const b=modal.querySelector(`[data-goal-cell="${selection.goalCell}"]`);b.classList.add('ring-2','ring-yellow-300','bg-blue-600');modal.querySelector('#goal-cell-label').textContent=selection.goalCell;}
  if(selection.result) modal.querySelector(`[data-result="${selection.result}"]`).classList.add('ring-2','ring-green-300','bg-green-700');
  modal.querySelector('#shot-zone-help').textContent=selection.isSevenMeter?'7 metros selecionado — a zona de campo 1–9 fica desativada.':(selection.zone?`Zona ${selection.zone} · ${ZONES.find(z=>z.id===selection.zone)?.distance}`:'Escolha a zona onde o remate foi efetuado.');
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
