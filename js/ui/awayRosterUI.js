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
  host.innerHTML = `
    <h4 class="text-lg font-bold text-gray-400 mt-6 mb-2 border-b border-gray-700 pb-1">Equipa B</h4>
    <div id="away-goalkeeper-list" class="space-y-2 mb-3"></div>
    <div id="away-player-list" class="space-y-2"></div>
  `;
  const timeline = document.getElementById('timeline-list');
  timeline?.parentElement?.insertBefore(host, timeline);
  return host;
}

function actionButtons(p) {
  const disabled = p.disqualified ? 'disabled' : '';
  const cls = p.disqualified ? 'opacity-30 cursor-not-allowed' : '';
  const id = esc(p.id ?? p.Numero);
  return `<div class="flex items-center gap-1 shrink-0">
    <button ${disabled} class="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded ${cls}" onclick="window.openModal('shot', 'B:${id}')">🎯</button>
    <button ${disabled} class="bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded ${cls}" onclick="window.openModal('positive', 'B:${id}')">👍</button>
    <button ${disabled} class="bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded ${cls}" onclick="window.openModal('negative', 'B:${id}')">👎</button>
    <button ${disabled} class="bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded ${cls}" onclick="window.openModal('sanction', 'B:${id}')">⚠️</button>
  </div>`;
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
    return `<div class="flex justify-between items-center p-2 mb-1 rounded-lg text-sm ${status}">
      <div class="flex items-center gap-2 min-w-0">
        <span class="font-bold text-gray-400 w-7">${esc(p.Numero)}</span>
        <span class="truncate font-medium">${esc(p.Nome)}</span>
        ${p.Posicao ? `<span class="text-xs text-gray-400">${esc(p.Posicao)}</span>` : ''}
      </div>
      ${actionButtons(p)}
    </div>`;
  };

  gk.innerHTML = players.filter(p => String(p.Posicao || '').includes('GR')).map(card).join('');
  field.innerHTML = players.filter(p => !String(p.Posicao || '').includes('GR')).map(card).join('');
  if (!players.length) field.innerHTML = '<div class="text-sm text-gray-500 py-2">Nenhum atleta confirmado para esta equipa.</div>';
}

function install() {
  render();
  if (!store.__awayRosterPatched) {
    const originalUpdate = store.update.bind(store);
    store.update = updater => {
      const result = originalUpdate(updater);
      queueMicrotask(render);
      return result;
    };
    store.__awayRosterPatched = true;
  }
  [250, 750, 1500, 3000].forEach(ms => setTimeout(render, ms));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();

setInterval(render, 1000);
