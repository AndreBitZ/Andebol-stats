import { store } from '../state.js';

function esc(value) { return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function formatTime(seconds) { const s=Math.max(0,Number(seconds)||0); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`; }
function findPlayer(id){ return (store.state.gameData?.B?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }
function togglePlayerOnCourt(id){
  const player=findPlayer(id);
  if(!player || player.disqualified || player.isSuspended) return;
  const currentCount=(store.state.gameData?.B?.players||[]).filter(p=>p.onCourt).length;
  if(!player.onCourt && currentCount>=7){
    alert('⚠️ Uma equipa não pode ter mais de 7 jogadores em campo. Retire primeiro um jogador de campo.');
    return;
  }
  store.update(s=>{
    const p=(s.gameData?.B?.players||[]).find(x=>String(x.id??x.Numero)===String(id)||String(x.Numero)===String(id));
    if(p) p.onCourt=!Boolean(p.onCourt);
  });
}
function ensureContainer() {
  const main = document.getElementById('main-app');
  if (!main) return null;
  let host = document.getElementById('away-roster-live');
  if (host) return host;
  const opponentPanel = document.querySelector('#timeline-list')?.closest('.bg-gray-800');
  if (!opponentPanel) return null;
  host = document.createElement('div'); host.id='away-roster-live'; host.className='mb-4';
  host.innerHTML='<h4 class="text-lg font-bold text-gray-400 mt-6 mb-2 border-b border-gray-700 pb-1">Equipa B</h4><div id="away-goalkeeper-list" class="space-y-2 mb-3"></div><div id="away-player-list" class="space-y-2"></div>';
  document.getElementById('timeline-list')?.parentElement?.insertBefore(host, document.getElementById('timeline-list'));
  return host;
}
function render() {
  const host=ensureContainer(); if(!host)return;
  const players=Array.isArray(store.state?.gameData?.B?.players)?store.state.gameData.B.players:[];
  const gk=host.querySelector('#away-goalkeeper-list'),field=host.querySelector('#away-player-list'); if(!gk||!field)return;
  const card=p=>{
    const suspended=p.isSuspended,disqualified=p.disqualified;
    const status=disqualified?'bg-red-950 opacity-50':suspended?'bg-red-900/50 opacity-75':p.onCourt?'bg-green-900/60 border border-green-500':'bg-gray-700';
    const id=esc(p.id??p.Numero), blocked=disqualified||suspended?'cursor-not-allowed':'cursor-pointer hover:bg-gray-600',checked=p.onCourt?'checked':'';
    return `<div data-team="B" data-player="${id}" data-team-player="B:${id}" data-player-popup="1" class="flex justify-between items-center gap-2 p-3 mb-1 rounded-lg text-sm ${status} ${blocked}"><button type="button" data-court-toggle="B:${id}" class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-xs font-bold"><input type="checkbox" ${checked} tabindex="-1" class="pointer-events-none w-5 h-5 accent-green-500"><span>${p.onCourt?'EM CAMPO':'BANCO'}</span></button><div class="flex items-center gap-2 min-w-0 flex-1"><span class="font-bold text-gray-400 w-7">${esc(p.Numero)}</span><span class="truncate font-medium">${esc(p.Nome)}</span>${p.Posicao?`<span class="text-xs text-gray-400">${esc(p.Posicao)}</span>`:''}</div><span data-court-time="B:${id}" class="font-mono text-sm text-gray-300 w-12 text-right">${formatTime(p.timeOnCourt||0)}</span></div>`;
  };
  gk.innerHTML=players.filter(p=>String(p.Posicao||'').includes('GR')).map(card).join('');
  field.innerHTML=players.filter(p=>!String(p.Posicao||'').includes('GR')).map(card).join('');
  if(!players.length)field.innerHTML='<div class="text-sm text-gray-500 py-2">Nenhum atleta confirmado para esta equipa.</div>';
  host.querySelectorAll('[data-player-popup]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-court-toggle]'))return;if(card.classList.contains('cursor-not-allowed'))return;if(typeof window.openBilateralPlayerPopup==='function')window.openBilateralPlayerPopup('B',card.dataset.player);});
  host.querySelectorAll('[data-court-toggle^="B:"]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();togglePlayerOnCourt(btn.dataset.courtToggle.split(':')[1]);});
}
function install(){render();if(!store.__awayRosterPatched){const originalUpdate=store.update.bind(store);store.update=updater=>{const result=originalUpdate(updater);queueMicrotask(render);return result;};store.__awayRosterPatched=true;}[250,750,1500,3000].forEach(ms=>setTimeout(render,ms));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setInterval(render,1000);