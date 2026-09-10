import { store } from '../state.js';
import { recordAction, currentDefendingGoalkeeper, ACTION_TYPES } from '../domain/actionEngine.js';

const ZONES = [
  { id:'1', distance:'curta' }, { id:'2', distance:'curta/média' }, { id:'3', distance:'curta/média' },
  { id:'4', distance:'curta/média' }, { id:'5', distance:'curta' }, { id:'6', distance:'longa' },
  { id:'7', distance:'longa' }, { id:'8', distance:'longa' }, { id:'9', distance:'longa' }
];
const RESULTS = [['GOAL','⚽ Golo'],['SAVED','🧤 Defesa GR'],['MISSED','❌ Falhado'],['POST','🥅 Poste'],['BLOCKED','🧱 Bloqueado']];
let selection = null;

function player(side,id){ return (store.state.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }
function goalkeeper(side){ return currentDefendingGoalkeeper(side); }
function close(){ const el=document.getElementById('professional-shot-modal'); if(el){el.classList.add('hidden');el.classList.remove('flex');} selection=null; }
function resetVisual(modal){
  modal.querySelectorAll('[data-zone]').forEach(b=>b.classList.remove('shot-zone-selected'));
  modal.querySelectorAll('[data-goal-cell]').forEach(b=>b.classList.remove('shot-goal-selected'));
  modal.querySelectorAll('[data-result]').forEach(b=>b.classList.remove('shot-result-selected'));
  modal.querySelector('[data-distance="7m"]')?.classList.remove('shot-seven-selected');
}
function ensure(){
  let modal=document.getElementById('professional-shot-modal'); if(modal)return modal;
  modal=document.createElement('div'); modal.id='professional-shot-modal'; modal.className='fixed inset-0 z-[10010] hidden items-center justify-center bg-black/75 p-2 sm:p-5';
  modal.innerHTML=`<style>
    #professional-shot-modal .shot-panel{width:100%;max-width:1180px;max-height:95vh;overflow-y:auto;border-radius:18px;background:#111827;border:1px solid #374151;box-shadow:0 25px 70px rgba(0,0,0,.55)}
    #professional-shot-modal .shot-court-wrap,#professional-shot-modal .shot-goal-wrap{position:relative;width:100%;line-height:0;overflow:hidden;border-radius:12px;background:#fff;border:1px solid #4b5563}
    #professional-shot-modal .shot-court-image,#professional-shot-modal .shot-goal-image{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
    #professional-shot-modal .shot-overlay{position:absolute;inset:0;width:100%;height:100%;}
    #professional-shot-modal .shot-hit{fill:rgba(37,99,235,.001);stroke:transparent;stroke-width:3;cursor:pointer;transition:.12s}
    #professional-shot-modal .shot-hit:hover{fill:rgba(37,99,235,.12);stroke:rgba(37,99,235,.55)}
    #professional-shot-modal .shot-hit.shot-zone-selected{fill:rgba(37,99,235,.27);stroke:#2563eb;stroke-width:5}
    #professional-shot-modal .goal-hit{fill:rgba(37,99,235,.001);stroke:transparent;stroke-width:4;cursor:pointer;transition:.12s}
    #professional-shot-modal .goal-hit:hover{fill:rgba(37,99,235,.15);stroke:rgba(37,99,235,.7)}
    #professional-shot-modal .goal-hit.shot-goal-selected{fill:rgba(37,99,235,.42);stroke:#facc15;stroke-width:7}
    #professional-shot-modal .shot-seven-selected{box-shadow:inset 0 0 0 3px #c084fc;background:#4c1d95!important}
    #professional-shot-modal .shot-result-selected{box-shadow:inset 0 0 0 3px #4ade80;background:#166534!important}
  </style>
  <div class="shot-panel" role="dialog" aria-modal="true">
    <div class="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-gray-900/95 backdrop-blur border-b border-gray-700">
      <div><div class="text-2xl font-bold text-white">🎯 Remate</div><div id="shot-subtitle" class="text-sm text-gray-400"></div></div>
      <button id="shot-close" class="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white">✕</button>
    </div>
    <div class="p-4 sm:p-5">
      <div class="grid lg:grid-cols-[1.25fr_.75fr] gap-5">
        <section class="rounded-2xl bg-gray-800 p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-3"><div><h3 class="text-lg font-bold text-white">Zona do campo</h3><p id="shot-zone-help" class="text-xs text-gray-400">A área do guarda-redes não pertence a nenhuma zona.</p></div><span class="text-xs text-gray-500">1–9</span></div>
          <div class="shot-court-wrap">
            <img class="shot-court-image" src="/assets/shot-court-zones.svg" alt="Campo de andebol com zonas 1 a 9; área do guarda-redes sem zona" draggable="false">
            <svg class="shot-overlay" viewBox="0 0 1024 1024" preserveAspectRatio="none" aria-hidden="true">
              <!-- Zona 1: corredor lateral entre a linha dos 6m e a linha dos 9m -->
              <polygon data-zone="1" class="shot-hit" points="52,69 211,69 211,145 130,359 52,359"/>
              <!-- Zona 2: setor esquerdo entre 6m e 9m -->
              <polygon data-zone="2" class="shot-hit" points="211,145 512,145 343,505 130,359"/>
              <!-- Zona 3: setor central entre 6m e 9m -->
              <polygon data-zone="3" class="shot-hit" points="512,145 813,145 681,505 343,505"/>
              <!-- Zona 4: setor direito entre 6m e 9m -->
              <polygon data-zone="4" class="shot-hit" points="813,145 894,359 681,505 512,145"/>
              <!-- Zona 5: corredor lateral direito -->
              <polygon data-zone="5" class="shot-hit" points="813,69 972,69 972,359 894,359 813,145"/>
              <!-- Zona 6: setor exterior esquerdo -->
              <polygon data-zone="6" class="shot-hit" points="52,359 130,359 343,505 343,973 52,973"/>
              <!-- Zona 7: setor exterior central -->
              <polygon data-zone="7" class="shot-hit" points="343,505 681,505 681,973 343,973"/>
              <!-- Zona 8: setor exterior direito -->
              <polygon data-zone="8" class="shot-hit" points="681,505 894,359 972,359 972,973 681,973"/>
              <!-- Zona 9: fundo -->
              <polygon data-zone="9" class="shot-hit" points="52,973 972,973 972,1024 52,1024"/>
            </svg>
          </div>
          <div class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-400"><div>1 e 5 · curta</div><div>2–4 · curta/média</div><div>6–9 · longa</div></div>
          <div id="selected-shot-zone" class="mt-3 rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-center text-sm text-gray-300">Zona selecionada: <strong class="text-white">—</strong></div>
          <button id="seven-meter-toggle" data-distance="7m" class="mt-4 w-full rounded-xl border border-purple-500/50 bg-gray-900 hover:bg-purple-950 p-4 text-left transition"><span class="block text-lg font-black text-white">🟣 7 metros</span><span class="text-xs text-gray-400">Remate de 7m · não usa a zona 1–9</span></button>
        </section>
        <section class="space-y-5">
          <div class="rounded-2xl bg-gray-800 p-4 border border-gray-700"><h3 class="text-lg font-bold text-white mb-1">Local do remate na baliza</h3><p class="text-xs text-gray-400 mb-3">Baliza dividida em 9 partes iguais.</p>
            <div class="shot-goal-wrap">
              <img class="shot-goal-image" src="/assets/shot-goal-zones.svg" alt="Baliza dividida em 9 zonas iguais" draggable="false">
              <svg class="shot-overlay" viewBox="0 0 900 620" preserveAspectRatio="none" aria-hidden="true">
                <rect data-goal-cell="1" class="goal-hit" x="110" y="75" width="226.666" height="143.333"/>
                <rect data-goal-cell="2" class="goal-hit" x="336.666" y="75" width="226.667" height="143.333"/>
                <rect data-goal-cell="3" class="goal-hit" x="563.333" y="75" width="226.667" height="143.333"/>
                <rect data-goal-cell="4" class="goal-hit" x="110" y="218.333" width="226.666" height="143.333"/>
                <rect data-goal-cell="5" class="goal-hit" x="336.666" y="218.333" width="226.667" height="143.333"/>
                <rect data-goal-cell="6" class="goal-hit" x="563.333" y="218.333" width="226.667" height="143.333"/>
                <rect data-goal-cell="7" class="goal-hit" x="110" y="361.666" width="226.666" height="143.334"/>
                <rect data-goal-cell="8" class="goal-hit" x="336.666" y="361.666" width="226.667" height="143.334"/>
                <rect data-goal-cell="9" class="goal-hit" x="563.333" y="361.666" width="226.667" height="143.334"/>
              </svg>
            </div>
            <div class="mt-3 text-xs text-gray-400">Zona de baliza selecionada: <strong id="goal-cell-label" class="text-white">—</strong></div>
          </div>
          <div class="rounded-2xl bg-gray-800 p-4 border border-gray-700"><h3 class="text-lg font-bold text-white mb-3">Resultado do remate</h3><div class="grid grid-cols-2 gap-2">${RESULTS.map(([k,l])=>`<button data-result="${k}" class="rounded-xl p-3 bg-gray-700 hover:bg-gray-600 text-white font-bold">${l}</button>`).join('')}</div></div>
          <div class="rounded-2xl bg-gray-800 p-4 border border-gray-700"><div class="grid sm:grid-cols-2 gap-3"><div><div class="text-xs text-gray-400 mb-1">Jogador que remata</div><div id="shot-player" class="font-bold text-white bg-gray-900 rounded-lg p-3"></div></div><div><div class="text-xs text-gray-400 mb-1">Guarda-redes adversário</div><div id="shot-gk" class="font-bold text-white bg-gray-900 rounded-lg p-3"></div></div></div></div>
        </section>
      </div>
      <div class="flex gap-2 mt-5"><button id="shot-cancel" class="flex-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold p-3">Cancelar</button><button id="shot-save" disabled class="flex-1 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-bold p-3">Guardar Remate</button></div>
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
  if(selection.zone) modal.querySelector(`[data-zone="${selection.zone}"]`)?.classList.add('shot-zone-selected');
  if(selection.isSevenMeter) modal.querySelector('#seven-meter-toggle').classList.add('shot-seven-selected');
  if(selection.goalCell){const b=modal.querySelector(`[data-goal-cell="${selection.goalCell}"]`);b?.classList.add('shot-goal-selected');modal.querySelector('#goal-cell-label').textContent=selection.goalCell;}
  if(selection.result) modal.querySelector(`[data-result="${selection.result}"]`)?.classList.add('shot-result-selected');
  const zone=selection.zone?ZONES.find(z=>z.id===selection.zone):null;
  modal.querySelector('#shot-zone-help').textContent=selection.isSevenMeter?'7 metros selecionado — a zona de campo 1–9 fica desativada.':'A área do guarda-redes não pertence a nenhuma zona.';
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
