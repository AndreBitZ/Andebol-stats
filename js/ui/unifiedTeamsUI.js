import { store } from '../state.js';

function hideLegacy() {
  ['goalOpponentBtn','saveOpponentBtn','missOpponentBtn','twoMinOpponentBtn','opponent7v6Btn'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.querySelectorAll('#tab-data .bg-gray-700').forEach(box => {
    const text = box.textContent || '';
    if (text.includes('Registo de Ações') && text.includes('Remate')) box.classList.add('hidden');
  });
}

function markIdentity() {
  document.querySelectorAll('[data-team-player]').forEach(card => {
    if (card.dataset.unifiedIdentityBound) return;
    const team = card.dataset.team;
    const player = card.dataset.player;
    if (!team || !player) return;
    card.dataset.teamPlayer = `${team}:${player}`;
    card.dataset.unifiedIdentityBound = '1';
  });
}

function render() {
  hideLegacy();
  markIdentity();
}

function install() {
  render();
  window.addEventListener('handball:state-updated', render);
  [250, 750, 1500, 3000].forEach(ms => setTimeout(render, ms));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}

setInterval(render, 1000);
