import { store } from '../state.js';
import { calculateMatchAnalytics } from '../domain/analytics.js';
import { calculateAllPlayerAnalytics } from '../domain/playerAnalytics.js';

function pct(value) { return value == null || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toFixed(1)}%`; }
function seconds(value) { const n=Number(value); if(!Number.isFinite(n)) return '—'; return `${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`; }
function value(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }

function teamCard(name, team) {
  const rows=[['Posses',team.possessions],['Golos',team.goals],['Remates',team.shots],['Defesas GR',team.saves],['Golos sofridos',team.goals_conceded],['Remates falhados',team.missed],['Postes',team.post],['Remates bloqueados',team.blocked],['Perdas de bola',team.turnovers],['Roubos de bola',team.steals],['Interceções',team.interceptions],['Recuperações',team.recoveries],['7 metros ganhos',team.seven_meter_won]];
  return `<div class="bg-gray-900 rounded-xl p-4 border border-gray-700"><h4 class="text-xl font-bold text-white mb-4">${name}</h4><div class="grid md:grid-cols-2 gap-3 mb-4"><div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Eficiência ataque</div><div class="text-2xl font-bold text-white">${pct(team.attack_efficiency)}</div></div><div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Eficiência remate</div><div class="text-2xl font-bold text-white">${pct(team.shot_efficiency)}</div></div><div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Eficácia GR</div><div class="text-2xl font-bold text-white">${pct(team.goalkeeper_save_efficiency)}</div></div><div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Duração média ataque</div><div class="text-2xl font-bold text-white">${seconds(team.average_attack_duration_seconds)}</div></div><div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Transições</div><div class="text-2xl font-bold text-white">${value(team.transition_attacks)}</div></div></div><div class="space-y-1">${rows.map(([label,v])=>`<div class="flex justify-between border-b border-gray-800 py-1.5 text-sm"><span class="text-gray-400">${label}</span><span class="font-bold text-white">${value(v)}</span></div>`).join('')}</div></div>`;
}

function playerTable(name, players) {
  if (!players.length) return '';
  const rows=players.map(p=>`<tr class="border-b border-gray-800"><td class="px-2 py-2 text-white font-semibold whitespace-nowrap">${p.number || '—'} · ${p.name}</td><td class="px-2 py-2 text-center">${p.minutes.toFixed(1)}</td><td class="px-2 py-2 text-center">${p.shots}</td><td class="px-2 py-2 text-center font-bold">${p.goals}</td><td class="px-2 py-2 text-center">${pct(p.shotEfficiency)}</td><td class="px-2 py-2 text-center">${p.goalkeeperSaves}</td><td class="px-2 py-2 text-center">${p.missed}</td><td class="px-2 py-2 text-center">${p.post}</td><td class="px-2 py-2 text-center">${p.blocked}</td><td class="px-2 py-2 text-center">${p.turnovers}</td><td class="px-2 py-2 text-center">${p.assists}</td><td class="px-2 py-2 text-center">${p.steals}</td><td class="px-2 py-2 text-center">${p.interceptions}</td><td class="px-2 py-2 text-center">${p.positive}</td><td class="px-2 py-2 text-center">${p.negative}</td><td class="px-2 py-2 text-center">${p.yellow}</td><td class="px-2 py-2 text-center">${p.twoMin}</td><td class="px-2 py-2 text-center">${p.red}</td></tr>`).join('');
  return `<div class="bg-gray-900 rounded-xl p-4 border border-gray-700 mt-4"><h4 class="text-lg font-bold text-white mb-3">${name} · Jogadores</h4><div class="overflow-x-auto"><table class="w-full text-xs text-gray-300"><thead><tr class="border-b border-gray-700 text-gray-400"><th class="px-2 py-2 text-left">Jogador</th><th class="px-2 py-2">Min</th><th class="px-2 py-2">R</th><th class="px-2 py-2">G</th><th class="px-2 py-2">Efic. R</th><th class="px-2 py-2">Def GR</th><th class="px-2 py-2">Falh.</th><th class="px-2 py-2">Postes</th><th class="px-2 py-2">Bloq.</th><th class="px-2 py-2">Perdas</th><th class="px-2 py-2">Ass.</th><th class="px-2 py-2">Roubos</th><th class="px-2 py-2">Interc.</th><th class="px-2 py-2">Pos.</th><th class="px-2 py-2">Neg.</th><th class="px-2 py-2">🟨</th><th class="px-2 py-2">2'</th><th class="px-2 py-2">🟥</th></tr></thead><tbody>${rows}</tbody></table></div><div class="text-xs text-gray-500 mt-2">Min = minutos em campo · R = remates · G = golos · Efic. R = eficácia de remate · Def GR = defesas da GR · Pos./Neg. = ações positivas/negativas</div></div>`;
}

export function renderAnalyticsPanel() {
  const container=document.getElementById('stats-comparison-container'); if(!container) return;
  const state=store.state; const analytics=calculateMatchAnalytics(state); const players=calculateAllPlayerAnalytics(state);
  const nameA=state.teamAName||'Equipa A', nameB=state.teamBName||'Equipa B';
  container.dataset.analyticsPanel='active';
  container.innerHTML=`<div class="mb-4 text-center"><div class="text-sm text-gray-400">Análise em tempo real</div><div class="text-xs text-gray-500">Eventos registados: ${analytics.total_events} · Cronómetro: ${seconds(analytics.updated_at_seconds)}</div></div><div class="grid md:grid-cols-2 gap-4">${teamCard(nameA,analytics.A)}${teamCard(nameB,analytics.B)}</div>${playerTable(nameA,players.A)}${playerTable(nameB,players.B)}`;
}

if(typeof window!=='undefined'&&!window.__handballAnalyticsUIInstalled){
  window.__handballAnalyticsUIInstalled=true; let observer=null,rendering=false,scheduled=false;
  const renderSafely=()=>{if(scheduled)return; scheduled=true; window.setTimeout(()=>{scheduled=false;if(rendering)return;const c=document.getElementById('stats-comparison-container');if(!c)return;rendering=true;if(observer)observer.disconnect();try{renderAnalyticsPanel();}finally{rendering=false;if(observer)observer.observe(c,{childList:true,subtree:true});}},0);};
  window.addEventListener('handball:state-updated',renderSafely);
  document.addEventListener('click',event=>{const button=event.target.closest?.('.tab-link');if(button?.dataset?.tab==='stats')renderSafely();},true);
  const installObserver=()=>{const c=document.getElementById('stats-comparison-container');if(!c){window.setTimeout(installObserver,100);return;}observer=new MutationObserver(()=>{if(!rendering)renderSafely();});observer.observe(c,{childList:true,subtree:true});renderSafely();};
  installObserver();
}
