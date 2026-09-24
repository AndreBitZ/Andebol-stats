import { store } from './state.js';

const getId = p => p?.id ?? p?.Numero ?? p?.number;
const getName = p => `#${p?.Numero ?? p?.number ?? ''} ${p?.Nome ?? p?.name ?? ''}`.trim();
let lastSignature = '';
let running = false;

function allPlayers(side) { return store.state?.gameData?.[side]?.players || []; }
function getModal() {
  const professional=document.getElementById('professional-shot-modal');
  if(professional && !professional.classList.contains('hidden')) return professional;
  const legacy=document.getElementById('shotModal');
  if(legacy && !legacy.classList.contains('hidden')) return legacy;
  return null;
}
function activeSide(modal) {
  const text=modal?.querySelector('#shot-player')?.textContent?.trim()||'';
  for(const side of ['A','B']) {
    if(allPlayers(side).some(p=>{
      const n=String(p?.Numero??p?.number??''), name=String(p?.Nome??p?.name??'');
      return (n&&text.includes(n)) || (name&&text.toLowerCase().includes(name.toLowerCase()));
    })) return side;
  }
  const sub=modal?.querySelector('#shot-subtitle')?.textContent?.toLowerCase()||'';
  return sub.includes('equipa b')||sub.includes('team b')||sub.includes('advers')?'B':'A';
}
function getPlayers(modal) {
  const side=activeSide(modal), list=allPlayers(side), shooterText=modal?.querySelector('#shot-player')?.textContent?.trim()||'';
  const onCourt=list.filter(p=>p.onCourt===true||p.emCampo===true||p.inCourt===true);
  const candidates=onCourt.length?onCourt:list;
  return candidates.filter(p=>{
    const n=String(p?.Numero??p?.number??''), name=String(p?.Nome??p?.name??'');
    return !((n&&shooterText.includes(n))||(name&&shooterText.toLowerCase().includes(name.toLowerCase())));
  });
}
function ensureConstructionSection() {
  if(running)return;
  const modal=getModal(); if(!modal)return;
  running=true;
  try {
    let panel=modal.querySelector('#shot-attribution-panel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='shot-attribution-panel';
      panel.className='shot-construction-panel mt-5 rounded-2xl bg-gray-900 p-4 border-2 border-blue-500 text-left';
      panel.innerHTML='<h3 class="text-lg font-bold text-white mb-3">🏗️ Construção da jogada</h3><div class="text-sm font-bold text-white mb-2">Assistência</div><div id="shot-assist-options" class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4"></div><div class="text-sm font-bold text-white mb-2">Desequilíbrio</div><div id="shot-imbalance-options" class="grid grid-cols-2 sm:grid-cols-3 gap-2"></div>';
      (modal.querySelector('.shot-panel .p-4')||modal.querySelector('.shot-panel')||modal.firstElementChild||modal).appendChild(panel);
    }
    const players=getPlayers(modal);
    const signature=`${activeSide(modal)}|${modal.querySelector('#shot-player')?.textContent||''}|${players.map(p=>String(getId(p))).join(',')}`;
    if(signature===lastSignature)return;
    lastSignature=signature;
    for(const type of ['assist','imbalance']){
      const box=panel.querySelector(`#shot-${type}-options`); if(!box)continue;
      box.replaceChildren();
      [['Nenhum',''],...players.map(p=>[getName(p),String(getId(p))])].forEach(([text,value])=>{
        const button=document.createElement('button');
        button.type='button'; button.textContent=text;
        button.className='shot-ui-btn bg-gray-700 hover:bg-blue-600 text-white rounded-xl p-2 text-sm';
        button.dataset.constructionType=type; button.dataset.playerId=value;
        button.addEventListener('click',()=>{
          box.querySelectorAll('button').forEach(b=>b.classList.remove('bg-blue-600'));
          button.classList.add('bg-blue-600');
          const prefix=type==='assist'?'assist':'imbalance';
          const p=players.find(x=>String(getId(x))===String(value));
          const idKey=type==='assist'?'assist_player_id':'imbalance_player_id';
          const nameKey=type==='assist'?'assist_player_name':'imbalance_player_name';
          window.__pendingShotAttribution={...(window.__pendingShotAttribution||{}),[idKey]:value||null,[nameKey]:p?getName(p):null,construction_label:'desequilíbrio'};
        });
        box.appendChild(button);
      });
    }
  } finally { running=false; }
}
function normaliseLatestShot() {
  const events=store.state?.gameEvents||[];
  const shot=[...events].reverse().find(e=>e?.event_type==='SHOT');
  if(!shot)return;
  const side=shot.home_away==='AWAY'?'B':'A';
  const teamId=shot.team_id??(side==='A'?store.state.teamAId:store.state.teamBId);
  const meta=shot.metadata||{};
  const zone=shot.shot_zone??shot.field_shot_zone??meta.shot_zone??meta.zone??null;
  const distance=shot.shot_distance??meta.shot_distance??meta.distance??null;
  const goal=shot.goal_zone_3x3??shot.goal_location??shot.goal_target_zone??meta.goal_zone_3x3??meta.goal_location??null;
  const coords=shot.shot_coordinates??shot.coordinates??meta.shot_coordinates??meta.coordinates??null;
  const assistId=shot.assist_player_id??meta.assist_player_id??null;
  const imbalanceId=shot.imbalance_player_id??meta.imbalance_player_id??null;
  const assistName=shot.assist_player_name??meta.assist_player_name??null;
  const imbalanceName=shot.imbalance_player_name??meta.imbalance_player_name??null;
  shot.team_id=teamId;
  if(zone!=null)shot.shot_zone=String(zone);
  if(distance!=null)shot.shot_distance=String(distance).toLowerCase();
  if(goal!=null){shot.goal_location=String(goal);shot.goal_zone_3x3=String(goal);}
  if(coords)shot.shot_coordinates=coords;
  shot.metadata={...meta,shot_zone:shot.shot_zone??meta.shot_zone??null,shot_distance:shot.shot_distance??meta.shot_distance??null,goal_location:shot.goal_location??meta.goal_location??null,goal_zone_3x3:shot.goal_zone_3x3??meta.goal_zone_3x3??null,shot_coordinates:shot.shot_coordinates??meta.shot_coordinates??null,assist_player_id:assistId,assist_player_name:assistName,imbalance_player_id:imbalanceId,imbalance_player_name:imbalanceName,construction_label:'desequilíbrio'};
}
function refreshHeatmap() {
  const events=store.state?.gameEvents||[];
  const sideOf=e=>{const id=String(e?.team_id??'');const a=[store.state.teamAId,store.state.gameData?.A?.teamId].filter(x=>x!=null).map(String),b=[store.state.teamBId,store.state.gameData?.B?.teamId].filter(x=>x!=null).map(String);if(a.includes(id))return'A';if(b.includes(id))return'B';return e?.home_away==='AWAY'?'B':'A';};
  const val=(e,...keys)=>{for(const k of keys){if(e?.[k]!=null)return e[k];if(e?.metadata?.[k]!=null)return e.metadata[k];}};
  const centers={1:[30,25],2:[90,25],3:[150,25],4:[210,25],5:[270,25],6:[90,100],7:[150,100],8:[210,100],9:[150,165]};
  for(const [id,side] of [['heatmap-points-attack','A'],['heatmap-points-defense','B']]){
    const svg=document.getElementById(id); if(!svg)continue; svg.innerHTML='';
    events.filter(e=>e?.event_type==='SHOT'&&sideOf(e)===side).forEach(e=>{
      const c=val(e,'shot_coordinates','coordinates'); let x=c?.x,y=c?.y; const z=Number(val(e,'shot_zone','field_shot_zone','zone'));
      if((x==null||y==null)&&centers[z]){[x,y]=centers[z];}
      if(x==null||y==null)return; x=Number(x);y=Number(y); if(x<=100)x*=3; if(y<=100)y*=2;
      const n=document.createElementNS('http://www.w3.org/2000/svg','circle'); n.setAttribute('cx',x);n.setAttribute('cy',y);n.setAttribute('r','5');
      n.setAttribute('fill',e.shot_result==='GOAL'?'#22c55e':e.shot_result==='SAVED'?'#3b82f6':'#ef4444');svg.appendChild(n);
    });
  }
}
function onShotRecorded(e) {
  if(e?.detail?.type!=='SHOT')return;
  try { normaliseLatestShot(); refreshHeatmap(); } catch(err) { console.error('Shot analytics normalisation:',err); }
}
export function installShotCourt(){}
export function installShotGoal(){}
export function initShotVisuals(){
  const run=()=>{try{ensureConstructionSection();}catch(err){console.error('Construção da jogada:',err);}};
  run();
  window.addEventListener('bilateral-action-recorded',onShotRecorded);
  window.addEventListener('handball:state-updated',()=>{try{refreshHeatmap();}catch(e){}});
  if(typeof MutationObserver!=='undefined'&&document.body){
    let scheduled=false; const schedule=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;run();},80)};
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  setInterval(run,500);
}
