import { store } from '../state.js';

const shots=()=> (store.state?.gameEvents||[]).filter(e=>e?.event_type==='SHOT');
const val=(e,...keys)=>{for(const k of keys){if(e?.[k]!=null)return e[k];if(e?.metadata?.[k]!=null)return e.metadata[k];if(e?.meta?.[k]!=null)return e.meta[k];}return null;};
const sideOf=e=>{const id=String(val(e,'team_id','teamId')??'');const a=[store.state?.teamAId,store.state?.gameData?.A?.teamId,store.state?.gameData?.A?.id].filter(x=>x!=null).map(String);const b=[store.state?.teamBId,store.state?.gameData?.B?.teamId,store.state?.gameData?.B?.id].filter(x=>x!=null).map(String);if(a.includes(id))return'A';if(b.includes(id))return'B';const h=String(val(e,'home_away')||'').toUpperCase();return h==='AWAY'?'B':'A';};
const distance=e=>{const d=String(val(e,'shot_distance','distance')||'').trim().toLowerCase();if(d.includes('7'))return'7m';if(d==='curta'||d==='média'||d==='longa')return d;return '';};
const zone=e=>String(val(e,'shot_zone','field_shot_zone','zone')||'');
function renderStats(){
 const root=document.getElementById('stats-comparison-container');if(!root)return;
 const d={A:{curta:0,média:0,longa:0,'7m':0,total:0,zones:{}},B:{curta:0,média:0,longa:0,'7m':0,total:0,zones:{}}};
 shots().forEach(e=>{const s=sideOf(e);if(!d[s])return;const di=distance(e),z=zone(e);d[s].total++;if(di)d[s][di]++;if(z)d[s].zones[z]=(d[s].zones[z]||0)+1;});
 let p=document.getElementById('live-zone-distance-panel');if(!p){p=document.createElement('div');p.id='live-zone-distance-panel';p.className='mt-6 rounded-xl border border-gray-700 p-4';root.appendChild(p);}
 p.innerHTML='<h4 class="text-xl font-bold mb-3">Remates por distância</h4>'+['curta','média','longa','7m'].map(r=>`<div class="grid grid-cols-3 gap-2 border-t border-gray-700 py-2"><div>${r}</div><div>${d.A[r]}</div><div>${d.B[r]}</div></div>`).join('')+'<h4 class="text-xl font-bold mt-5 mb-3">Remates por zona</h4>'+Array.from({length:9},(_,i)=>String(i+1)).map(z=>`<div class="grid grid-cols-3 gap-2 border-t border-gray-700 py-2"><div>Z${z}</div><div>${d.A.zones[z]||0}</div><div>${d.B.zones[z]||0}</div></div>`).join('')+`<div class="mt-3 text-xs text-gray-400">Total: ${d.A.total} – ${d.B.total}</div>`;
}
const centers={1:[30,25],2:[90,25],3:[150,25],4:[210,25],5:[270,25],6:[90,100],7:[150,100],8:[210,100],9:[150,165]};
function heat(){
 for(const [id,s] of [['heatmap-points-attack','A'],['heatmap-points-defense','B']]){
  const svg=document.getElementById(id);if(!svg)continue;svg.innerHTML='';
  shots().filter(e=>sideOf(e)===s).forEach(e=>{
   const c=val(e,'shot_coordinates','coordinates'),z=zone(e);let x=c?.x,y=c?.y;
   if((x==null||y==null)&&centers[z]){[x,y]=centers[z];}
   if(x==null||y==null)return;x=Number(x);y=Number(y);if(x<=100)x*=3;if(y<=100)y*=2;
   const n=document.createElementNS('http://www.w3.org/2000/svg','circle');n.setAttribute('cx',x);n.setAttribute('cy',y);n.setAttribute('r','5');n.setAttribute('fill',val(e,'shot_result','result')==='GOAL'?'#22c55e':val(e,'shot_result','result')==='SAVED'?'#3b82f6':'#ef4444');svg.appendChild(n);
  });
 }
}
function refresh(){renderStats();heat();}
window.addEventListener('handball:state-updated',refresh);
window.addEventListener('bilateral-action-recorded',refresh);
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="stats"],[data-tab="heatmap"]'))setTimeout(refresh,0);});
setInterval(refresh,1000);
