import { store } from '../state.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));
}

function playerRow(player) {
  const num = escapeHtml(player.Numero || '-');
  const name = escapeHtml(player.Nome || 'Atleta sem nome');
  const pos = escapeHtml(player.Posicao || '');
  const id = String(player.id ?? player.Numero ?? '');
  const safeId = escapeHtml(id);
  const classes = player.onCourt ? 'bg-green-900/60 border-green-500' : 'bg-gray-700 border-gray-600';
  const disabled = player.disqualified || player.isSuspended ? 'opacity-50 cursor-not-allowed' : '';
  const status = player.disqualified ? ' 🔴' : player.isSuspended ? ` ⏱️ ${formatTime(player.suspensionTimer || 0)}` : '';
  return `<div data-team="A" data-player="${safeId}" data-team-player="A:${safeId}" class="w-full flex items-center justify-between gap-2 p-3 rounded-lg border ${classes} ${disabled}">
    <button type="button" onclick="window.togglePlayer(${JSON.stringify(player.Numero)})" class="flex-1 flex items-center justify-between gap-2 text-left min-w-0" ${player.disqualified || player.isSuspended ? 'disabled' : ''}>
      <span class="font-bold w-8">#${num}</span>
      <span class="font-semibold flex-1 truncate">${name}${status}</span>
      <span class="text-xs text-gray-400 w-10 text-center">${pos}</span>
      <span id="time-p-${num}" class="font-mono text-sm">${formatTime(player.timeOnCourt || 0)}</span>
    </button>
    <div class="flex gap-1 shrink-0">
      <button type="button" class="shot-outcome-btn hidden" data-outcome="goal" aria-label="Golo">🎯</button>
      <button type="button" class="shot-outcome-btn hidden" data-outcome="saved" aria-label="Defesa">🧤</button>
      <button type="button" class="shot-outcome-btn hidden" data-outcome="missed" aria-label="Falhado">❌</button>
      <button type="button" class="shot-outcome-btn hidden" data-outcome="post" aria-label="Poste">🥅</button>
      <button type="button" class="shot-outcome-btn hidden" data-outcome="blocked" aria-label="Bloco">🧱</button>
    </div>
  </div>`;
}

function formatTime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(Math.floor(s % 60)).padStart(2,'0')}`;
}

export function renderHomeRoster() {
  const players = Array.isArray(store.state.gameData?.A?.players) ? store.state.gameData.A.players : [];
  const goalkeeperList = document.getElementById('goalkeeper-list-A');
  const playerList = document.getElementById('player-list-A');
  if (!goalkeeperList && !playerList) return;
  const gks = players.filter(p => String(p.Posicao || '').toUpperCase() === 'GR');
  const field = players.filter(p => String(p.Posicao || '').toUpperCase() !== 'GR');
  if (goalkeeperList) goalkeeperList.innerHTML = gks.map(playerRow).join('');
  if (playerList) playerList.innerHTML = field.map(playerRow).join('');
}

function install() {
  renderHomeRoster();
  window.addEventListener('handball:state-updated', renderHomeRoster);
  setTimeout(renderHomeRoster, 100);
  setTimeout(renderHomeRoster, 500);
  setTimeout(renderHomeRoster, 1500);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
