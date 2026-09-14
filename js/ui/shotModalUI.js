import { store } from '../state.js';
import { recordAction, currentDefendingGoalkeeper, ACTION_TYPES } from '../domain/actionEngine.js';

const ZONES = [
  { id:'1', distance:'curta' }, { id:'2', distance:'curta/média' }, { id:'3', distance:'curta/média' },
  { id:'4', distance:'curta/média' }, { id:'5', distance:'curta' }, { id:'6', distance:'longa' },
  { id:'7', distance:'longa' }, { id:'8', distance:'longa' }, { id:'9', distance:'longa' }
];
const RESULTS = [['GOAL','⚽ Golo'],['SAVED','🧤 Defesa GR'],['MISSED','❌ Falhado'],['POST','🥅 Poste'],['BLOCKED','🧱 Bloqueado']];
let selection = null;

function player(side,id){
  return (store.state.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id));
}
function goalkeeper(side){ return currentDefendingGoalkeeper(side); }
function close(){
  const el=document.getElementById('professional-shot-modal');
  const distanceModal=document.getElementById('shot-distance-modal');
  if(distanceModal) distanceModal.remove();
  if(el){el.classList.add('hidden');el.classList.remove('flex');}
  selection=null;
}

function makeButton(text, attrs, extra=''){
  const entries=Object.entries(attrs).map(([k,v])=>` ${k}=\"${v}\"`).join('');
  return `<button type=\"button\"${entries} class=\"shot-ui-btn ${extra}\">${text}</button>`;
}

function ensure(){
  let modal=document.getElementById('professional-shot-modal');
  if(modal)return modal;

  modal=document.createElement('div');
  modal.id='professional-shot-modal';
  modal.className='fixed inset-0 z-[10010] hidden items-center justify-center bg-black/75 p-2 sm:p-5';
  modal.innerHTML=`<style>
    #professional-shot-modal .shot-panel{width:100%;max-width:1180px;max-height:95vh;overflow-y:auto;border-radius:18px;background:#111827;border:1px solid #374151;box-shadow:0 25px 70px rgba(0,0,0,.55)}
    #professional-shot-modal .shot-ui-btn{border:1px solid #4b5563;background:#374151;color:#fff;font-weight:800;border-radius:12px;min-height:58px;padding:12px 8px;transition:.12s;cursor:pointer}
    #professional-shot-modal .shot-ui-btn:hover{background:#2563eb;border-color:#60a5fa}
    #professional-shot-modal .shot-ui-btn:active{transform:scale(.98)}
    #professional-shot-modal .shot-ui-btn.shot-zone-selected{background:#2563eb;border-color:#93c5fd;box-shadow:inset 0 0 0 2px #bfdbfe}
    #professional-shot-modal .shot-ui-btn.shot-goal-selected{background:#2563eb;border-color:#facc15;box-shadow:inset 0 0 0 3px #facc15}
    #professional-shot-modal .shot-ui-btn.shot-result-selected{background:#166534;border-color:#4ade80;box-shadow:inset 0 0 0 2px #4ade80}
    #professional-shot-modal .shot-ui-btn.shot-distance-selected{background:#2563eb;border-color:#93c5fd;box-shadow:inset 0 0 0 2px #bfdbfe}
    #professional-shot-modal .shot-seven-selected{background:#4c1d95!important;border-color:#c084fc!important;box-shadow:inset 0 0 0 3px #c084fc}
    #professional-shot-modal .shot-zone-grid{display:grid;gap:8px;width:100%}
    #professional-shot-modal .shot-row-5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    #professional-shot-modal .shot-row-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    #professional-shot-modal .shot-row-1{display:grid;grid-template-columns:1fr;gap:8px}
    #professional-shot-modal .shot-goal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%}
    #professional-shot-modal .shot-zone-number,#professional-shot-modal .shot-goal-number{font-size:20px;line-height:1;font-weight:900}
  </style>
  <div class=\"shot-panel\" role=\"dialog\" aria-modal=\"true\">
    <div class=\"sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-gray-900/95 backdrop-blur border-b border-gray-700\">
      <div><div class=\"text-2xl font-bold text-white\">🎯 Remate</div><div id=\"shot-subtitle\" class=\"text-sm text-gray-400\"></div></div>
      <button id=\"shot-close\" type=\"button\" class=\"px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white\">✕</button>
    </div>
    <div class=\"p-4 sm:p-5\">
      <div class=\"grid lg:grid-cols-[1.25fr_.75fr] gap-5\">
        <section class=\"rounded-2xl bg-gray-800 p-4 border border-gray-700\">
          <div class=\"flex items-center justify-between mb-3\"><div><h3 class=\"text-lg font-bold text-white\">Zona do campo</h3><p id=\"shot-zone-help\" class=\"text-xs text-gray-400\">Escolha a zona de origem do remate.</p></div><span class=\"text-xs text-gray-500\">ZONAS</span></div>
          <div id=\"shot-zone-container\" class=\"shot-zone-grid\">
            <div class=\"shot-row-5\">
              ${[1,2,3,4,5].map(z=>makeButton(`<span class=\"shot-zone-number\">${z}</span>`,{'data-zone':z},'shot-zone-btn')).join('')}
            </div>
            <div class=\"shot-row-3\">
              ${[6,7,8].map(z=>makeButton(`<span class=\"shot-zone-number\">${z}</span>`,{'data-zone':z},'shot-zone-btn')).join('')}
            </div>
            <div class=\"shot-row-1\">
              ${makeButton('<span class=\"shot-zone-number\">9</span>',{'data-zone':'9'},'shot-zone-btn')}
            </div>
          </div>
          <div class=\"mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-400\"><div>1 e 5 · curta</div><div>2–4 · curta ou média</div><div>6–9 · longa</div></div>
          <div id=\"selected-shot-zone\" class=\"mt-3 rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-center text-sm text-gray-300\">Zona selecionada: <strong class=\"text-white\">—</strong></div>
          <button id=\"seven-meter-toggle\" data-distance=\"7m\" type=\"button\" class=\"shot-ui-btn mt-4 w-full text-left\"><span class=\"block text-lg font-black\">🟣 7 metros</span><span class=\"text-xs text-gray-400\">Remate de 7m · não usa a zona de campo 1–9</span></button>
        </section>
        <section class=\"space-y-5\">
          <div class=\"rounded-2xl bg-gray-800 p-4 border border-gray-700\">
            <h3 class=\"text-lg font-bold text-white mb-1\">Local do remate na baliza</h3>
            <p class=\"text-xs text-gray-400 mb-3\">Baliza dividida em 9 partes iguais.</p>
            <div id=\"shot-goal-container\" class=\"shot-goal-grid\">
              ${Array.from({length:9},(_,i)=>i+1).map(z=>makeButton(`<span class=\"shot-goal-number\">${z}</span>`,{'data-goal-cell':z},'shot-goal-btn')).join('')}
            </div>
            <div class=\"mt-3 text-xs text-gray-400\">Zona de baliza selecionada: <strong id=\"goal-cell-label\" class=\"text-white\">—</strong></div>
          </div>
          <div class=\"rounded-2xl bg-gray-800 p-4 border border-gray-700\"><h3 class=\"text-lg font-bold text-white mb-3\">Resultado do remate</h3><div class=\"grid grid-cols-2 gap-2\">${RESULTS.map(([k,l])=>makeButton(l,{'data-result':k},'shot-result-btn')).join('')}</div></div>
          <div class=\"rounded-2xl bg-gray-800 p-4 border border-gray-700\"><div class=\"grid sm:grid-cols-2 gap-3\"><div><div class=\"text-xs text-gray-400 mb-1\">Jogador que remata</div><div id=\"shot-player\" class=\"font-bold text-white bg-gray-900 rounded-lg p-3\"></div></div><div><div class=\"text-xs text-gray-400 mb-1\">Guarda-redes adversário</div><div id=\"shot-gk\" class=\"font-bold text-white bg-gray-900 rounded-lg p-3\"></div></div></div></div>
        </section>
      </div>
      <div class=\"flex gap-2 mt-5\"><button id=\"shot-cancel\" type=\"button\" class=\"flex-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold p-3\">Cancelar</button><button id=\"shot-save\" type=\"button\" disabled class=\"flex-1 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-bold p-3\">Guardar Remate</button></div>
    </div>
  </div>`;

  document.body.appendChild(modal);
  modal.querySelector('#shot-close').onclick=close;
  modal.querySelector('#shot-cancel').onclick=close;
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  modal.querySelectorAll('[data-zone]').forEach(btn=>btn.onclick=()=>selectZone(String(btn.dataset.zone),modal));
  modal.querySelector('#seven-meter-toggle').onclick=()=>{selection.zone=null;selection.distance='7m';selection.isSevenMeter=true;update(modal);};
  modal.querySelectorAll('[data-goal-cell]').forEach(btn=>btn.onclick=()=>{selection.goalCell=String(btn.dataset.goalCell);update(modal);});
  modal.querySelectorAll('[data-result]').forEach(btn=>btn.onclick=()=>{selection.result=btn.dataset.result;update(modal);});
  modal.querySelector('#shot-save').onclick=save;
  return modal;
}

function selectZone(zone,modal){
  if(['2','3','4'].includes(zone)){
    showDistanceChoice(zone,modal);
    return;
  }
  selection.zone=zone;
  selection.distance=ZONES.find(z=>z.id===zone)?.distance||null;
  selection.isSevenMeter=false;
  update(modal);
}

function showDistanceChoice(zone,modal){
  const existing=document.getElementById('shot-distance-modal');
  if(existing)existing.remove();

  const overlay=document.createElement('div');
  overlay.id='shot-distance-modal';
  overlay.className='fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 p-4';
  overlay.innerHTML=`<div class=\"w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-5\">
    <div class=\"text-xl font-bold text-white mb-1\">Distância do remate</div>
    <div class=\"text-sm text-gray-400 mb-5\">Zona ${zone}: escolha a categoria de distância.</div>
    <div class=\"grid grid-cols-2 gap-3\">
      <button type=\"button\" data-distance-choice=\"curta\" class=\"shot-ui-btn shot-distance-choice\"><span class=\"block text-lg\">📍 Curta distância</span><span class=\"block text-xs text-gray-400 mt-1\">Até 9 metros</span></button>
      <button type=\"button\" data-distance-choice=\"média\" class=\"shot-ui-btn shot-distance-choice\"><span class=\"block text-lg\">📍 Média distância</span><span class=\"block text-xs text-gray-400 mt-1\">Entre curta e 9m</span></button>
    </div>
    <button type=\"button\" data-distance-cancel class=\"w-full mt-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold p-3\">Cancelar</button>
  </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('[data-distance-cancel]').onclick=()=>overlay.remove();
  overlay.querySelectorAll('[data-distance-choice]').forEach(btn=>btn.onclick=()=>{
    selection.zone=zone;
    selection.distance=btn.dataset.distance;
    selection.isSevenMeter=false;
    overlay.remove();
    update(modal);
  });
}

function resetVisual(modal){
  modal.querySelectorAll('[data-zone]').forEach(b=>b.classList.remove('shot-zone-selected'));
  modal.querySelectorAll('[data-goal-cell]').forEach(b=>b.classList.remove('shot-goal-selected'));
  modal.querySelectorAll('[data-result]').forEach(b=>b.classList.remove('shot-result-selected'));
  modal.querySelector('#seven-meter-toggle')?.classList.remove('shot-seven-selected');
}

function update(modal){
  resetVisual(modal);
  if(selection.zone) modal.querySelector(`[data-zone=\"${selection.zone}\"]`)?.classList.add('shot-zone-selected');
  if(selection.isSevenMeter) modal.querySelector('#seven-meter-toggle')?.classList.add('shot-seven-selected');
  if(selection.goalCell){
    modal.querySelector(`[data-goal-cell=\"${selection.goalCell}\"]`)?.classList.add('shot-goal-selected');
    modal.querySelector('#goal-cell-label').textContent=selection.goalCell;
  } else modal.querySelector('#goal-cell-label').textContent='—';
  if(selection.result) modal.querySelector(`[data-result=\"${selection.result}\"]`)?.classList.add('shot-result-selected');
  const zone=selection.zone?ZONES.find(z=>z.id===selection.zone):null;
  modal.querySelector('#shot-zone-help').textContent=selection.isSevenMeter?'7 metros selecionado — a zona de campo 1–9 fica desativada.':(selection.distance?`Zona ${selection.zone} selecionada · ${selection.distance} distância.`:'Escolha a zona de origem do remate.');
  modal.querySelector('#selected-shot-zone strong').textContent=selection.isSevenMeter?'7 metros':(zone?`Zona ${zone.id} · ${selection.distance||zone.distance}`:'—');
  modal.querySelector('#shot-zone-container').classList.toggle('opacity-40',!!selection.isSevenMeter);
  modal.querySelector('#shot-zone-container').classList.toggle('pointer-events-none',!!selection.isSevenMeter);
  modal.querySelector('#shot-save').disabled=!(selection.goalCell&&selection.result&&(selection.zone||selection.isSevenMeter));
}

function save(){
  if(!selection?.side||!selection?.playerId||!selection?.result)return;
  try{
    const savedSelection={...selection};
    const p=player(savedSelection.side,savedSelection.playerId); if(!p)throw new Error('Atleta não encontrado.');
    const gk=goalkeeper(savedSelection.side); if(!gk)throw new Error('Não existe guarda-redes adversário em campo.');
    const cell=Number(savedSelection.goalCell);
    const x=((cell-1)%3+0.5)*33.3333333333;
    const y=(Math.floor((cell-1)/3)+0.5)*33.3333333333;
    const distance=savedSelection.isSevenMeter?'7m':savedSelection.distance||ZONES.find(z=>z.id===savedSelection.zone)?.distance||null;
    if(!savedSelection.isSevenMeter && !distance) throw new Error('Escolha a distância do remate.');
    recordAction({side:savedSelection.side,playerId:savedSelection.playerId,action:ACTION_TYPES.SHOT,shotResult:savedSelection.result,goalkeeperId:gk.id??gk.Numero??null,metadata:{shot_type:savedSelection.isSevenMeter?'7M':'FIELD',shot_zone:savedSelection.isSevenMeter?'7M':savedSelection.zone,shot_distance:distance,goal_location:savedSelection.goalCell,goal_zone_3x3:savedSelection.goalCell,shot_coordinates:{x:x.toFixed(1),y:y.toFixed(1)}}});
    window.dispatchEvent(new CustomEvent('bilateral-action-recorded',{detail:{type:'SHOT',result:savedSelection.result,side:savedSelection.side,playerId:savedSelection.playerId,shot_type:savedSelection.isSevenMeter?'7M':'FIELD',shot_zone:savedSelection.isSevenMeter?'7M':savedSelection.zone,shot_distance:distance,goal_location:savedSelection.goalCell,goal_zone_3x3:savedSelection.goalCell}}));
    close();
  }catch(err){console.error(err);alert(err?.message||'Não foi possível registar o remate.');}
}

function open(side,id){
  const p=player(side,id); if(!p)return;
  const modal=ensure();
  selection={side,playerId:String(id),zone:null,distance:null,isSevenMeter:false,goalCell:null,result:null};
  modal.querySelector('#shot-subtitle').textContent=`${side==='A'?(store.state.teamAName||'Equipa A'):(store.state.teamBName||'Equipa B')} · #${p.Numero} ${p.Nome}`;
  modal.querySelector('#shot-player').textContent=`#${p.Numero} ${p.Nome}`;
  const gk=goalkeeper(side);
  modal.querySelector('#shot-gk').textContent=gk?`#${gk.Numero} ${gk.Nome}`:'Sem GR em campo';
  update(modal);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function install(){
  window.openBilateralShot=open;
  setTimeout(()=>window.openBilateralShot=open,0);
  setTimeout(()=>window.openBilateralShot=open,300);
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
}