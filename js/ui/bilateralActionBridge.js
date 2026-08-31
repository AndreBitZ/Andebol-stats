import { registerBilateralAction, getOpposingGoalkeeper } from '../domain/actionEngine.js';

let selected = null;

function teamName(side) {
  return side === 'A' ? (window.store?.state?.teamAName || 'Equipa A') : (window.store?.state?.teamBName || 'Equipa B');
}

function getStore() {
  return window.store || null;
}

function findPlayer(side, id) {
  const store = getStore();
  return (store?.state?.gameData?.[side]?.players || []).find(p => String(p.id ?? p.Numero) === String(id) || String(p.Numero) === String(id));
}

function openShot(side, playerId) {
  selected = { side, playerId };
  const p = findPlayer(side, playerId);
  if (!p) return;
  const title = document.getElementById('shotPlayerName');
  if (title) title.textContent = `${teamName(side)} · #${p.Numero} ${p.Nome}`;
  document.getElementById('shotModal')?.classList.remove('hidden');
}

function install() {
  const store = getStore();
  if (!store) return;
  document.querySelectorAll('[data-team-player]').forEach(card => {
    if (card.dataset.bilateralBound) return;
    const [side, playerId] = card.dataset.teamPlayer.split(':');
    card.dataset.bilateralBound = '1';
    card.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      selected = { side, playerId };
    });
  });

  document.querySelectorAll('.shot-outcome-btn').forEach(button => {
    if (button.dataset.bilateralBound) return;
    button.dataset.bilateralBound = '1';
    button.addEventListener('click', () => {
      if (!selected) return;
      const resultMap = { goal: 'GOAL', saved: 'SAVED', missed: 'MISSED', post: 'POST', blocked: 'BLOCKED' };
      const result = resultMap[button.dataset.outcome];
      if (!result) return;
      try {
        registerBilateralAction({ side: selected.side, playerId: selected.playerId, type: 'shot', shotResult: result });
        selected = null;
        document.getElementById('shotModal')?.classList.add('hidden');
      } catch (err) {
        console.error(err);
        alert(err.message || 'Não foi possível registar o remate.');
      }
    });
  });

  window.openBilateralShot = openShot;
  window.getOpposingGoalkeeper = side => getOpposingGoalkeeper(side);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
setInterval(install, 1000);
