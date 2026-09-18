import { store } from '../state.js';

const shots = () => (store.state.gameEvents || []).filter(e => e.event_type === 'SHOT');
const meta = e => e.metadata || e.meta || e;
const sideOf = e => String(e.team_id ?? e.teamId) === String(store.state.gameData?.A?.teamId ?? store.state.teamAId) || e.home_away === 'HOME' ? 'A' : 'B';
function renderStats() {
  const root = document.getElementById('stats-comparison-container'); if (!root) return;
  const data = { A:{curta:0,média:0,longa:0,'7m':0,total:0}, B:{curta:0,média:0,longa:0,'7m':0,total:0} };
  shots().forEach(e => { const m=meta(e); const side=sideOf(e); const d=m.shot_distance ?? m.distance ?? e.shot_distance; if (d in data[side]) data[side][d]++; data[side].total++; });
  let panel=document.getElementById('live-zone-distance-panel');
  if(!panel){panel=document.createElement('div');panel.id='live-zone-distance-panel';panel.className='mt-6 rounded-xl border border-gray-700 p-4';root.appendChild(panel);}
  const rows=['curta','média','longa','7m'];
  panel.innerHTML='<h4 class="text-xl font-bold text-white mb-3">Remates por distância</h4><div class="grid grid-cols-3 gap-2 text-sm font-bold text-gray-300 mb-2"><div>Distância</div><div>Equipa A</div><div>Equipa B</div></div>'+rows.map(r=>`<div class="grid grid-cols-3 gap-2 text-sm border-t border-gray-700 py-2"><div>${r}</div><div>${data.A[r]}</div><div>${data.B[r]}</div></div>`).join('')+`<div class="mt-3 text-xs text-gray-400">Total de remates: ${data.A.total} – ${data.B.total}</div>`;
}
function point(svg,e) {
  const m=meta(e); const c=m.shot_coordinates || m.coordinates; if(!c)return;
  const x=Number(c.x), y=Number(c.y); if(!Number.isFinite(x)||!Number.isFinite(y))return;
  const node=document.createElementNS('http://www.w3.org/2000/svg','circle'); node.setAttribute('cx',x*3); node.setAttribute('cy',y*2); node.setAttribute('r','4'); node.setAttribute('fill',e.shot_result==='GOAL'?'#22c55e':e.shot_result==='SAVED'?'#3b82f6':'#ef4444'); svg.appendChild(node);
}
function renderHeatmap(){
  for(const [id,side] of [['heatmap-points-attack','A'],['heatmap-points-defense','B']]){const svg=document.getElementById(id);if(!svg)continue;svg.innerHTML='';shots().filter(e=>sideOf(e)===side).forEach(e=>point(svg,e));}
}
function refresh(){renderStats();renderHeatmap();}
window.addEventListener('bilateral-action-recorded',refresh);
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="stats"],[data-tab="heatmap"]'))setTimeout(refresh,0);});
setInterval(refresh,1000);
