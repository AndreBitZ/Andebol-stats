import { store } from '../state.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function ensureContainer() {
  const main = document.getElementById('main-app');
  if (!main) return null;
  let host = document.getElementById('away-roster-live');
  if (host) return host;
  const opponentPanel = document.querySelector('#timeline-list')?.closest('.bg-gray-800');
  if (!opponentPanel) return null;
  host = document.createElement('div');
  host.id = 'away-roster-live';
  host.className = 'mb-4';
  host.innerHTML = `<h4 class="text-lg font-bold text-gray-400 mt-6 mb-2 border-b border-gray-700 pb-1">Equipa B</h4><div id="away-goalkeeper-list" class="space-y-2 mb-3"></div><div id="away-player-list" class="space-y-2"></div>`;
  const timeline = document.getElementById('timeline-list');
  timeline?.parentElement?.insertBefore(host, timeline);
  return host;
}

function render() {
  const host = ensureContainer();
  if (!host) return;
  const players = Array.isArray(store.state?.gameData?.B?.players) ? store.state.gameData.B.players : [];
  const gk = host.querySelector('#away-goalkeeper-list');
  const field = host.querySelector('#away-player-list');
  if (!gk || !field) return;

  const card = p => {
    const suspended = p.isSuspended;
    const disqualified = p.disqualified;
    const status = disqualified ? 'bg-red-950 opacity-50' : suspended ? 'bg-red-900/50 opacity-75' : 'bg-gray-700';
    const id = esc(p.id ?? p.Numero);
    const blocked = disqualified || suspended ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-600';
    return `<div data-team="B" data-player="${id}" data-team-player="B:${id}" data-player-popup="1" class="flex justify-between items-center p-3 mb-1 rounded-lg text-sm ${status} ${blocked}"><div class="flex items-center gap-2 min-w-0"><span class="font-bold text-gray-400 w-7">${esc(p.Numero)}</span><span class="truncate font-medium">${esc(p.Nome)}</span>${p.Posicao ? `<span class="text-xs text-gray-400">${esc(p.Posicao)}</span>` : ''}</div></div>`;
  };
  gk.innerHTML = players.filter(p => String(p.Posicao || '').includes('GR')).map(card).join('');
  field.innerHTML = players.filter(p => !String(p.Posicao || '').includes('GR')).map(card).join('');
  if (!players.length) field.innerHTML = '<div class="text-sm text-gray-500 py-2">Nenhum atleta confirmado para esta equipa.</div>';
  host.querySelectorAll('[data-player-popup]').forEach(card=>{
    card.onclick=()=>{if(card.classList.contains('cursor-not-allowed'))return;if(typeof window.openBilateralPlayerPopup==='function')window.openBilateralPlayerPopup('B',card.dataset.player);};
  });
}

function install() {
  render();
  if (!store.__awayRosterPatched) {
    const originalUpdate = store.update.bind(store);
    store.update = updater => { const result = originalUpdate(updater); queueMicrotask(render); return result; };
    store.__awayRosterPatched = true;
  }
  [250, 750, 1500, 3000].forEach(ms => setTimeout(render, ms));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
setInterval(render, 1000);
