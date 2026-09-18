import { store } from '../state.js';

let active = { side: null, shooterId: null, assist: null, imbalance: null };
const modalId = 'shotModal';

const playerId = p => p?.id ?? p?.Numero ?? p?.number;
const playerName = p => `#${p?.Numero ?? p?.number ?? ''} ${p?.Nome ?? p?.name ?? ''}`.trim();
const playersOnCourt = () => (store.state.gameData?.[active.side]?.players || []).filter(p => p.onCourt && String(playerId(p)) !== String(active.shooterId));
const findPlayer = id => playersOnCourt().find(p => String(playerId(p)) === String(id));

function panel(modal) {
  let root = modal.querySelector('#shot-attribution-panel');
  if (root) return root;
  root = document.createElement('section');
  root.id = 'shot-attribution-panel';
  root.className = 'mt-4 rounded-xl bg-gray-900 p-3 border border-gray-700 text-left';
  root.innerHTML = '<h4 class="font-bold text-white mb-3">Construção da jogada</h4><div class="text-sm font-semibold mb-1">Assistência</div><div id="shot-assist-options" class="grid grid-cols-2 gap-2 mb-3"></div><div class="text-sm font-semibold mb-1">Desequilíbrio</div><div id="shot-imbalance-options" class="grid grid-cols-2 gap-2"></div>';
  const container = modal.querySelector('#shotOutcomeContainer') || modal.querySelector('.bg-gray-800');
  if (container) container.appendChild(root); else modal.appendChild(root);
  return root;
}

function render() {
  const modal = document.getElementById(modalId);
  if (!modal || modal.classList.contains('hidden') || !active.side) return;
  panel(modal);
  const players = playersOnCourt();
  for (const kind of ['assist', 'imbalance']) {
    const box = modal.querySelector(`#shot-${kind}-options`);
    if (!box) continue;
    box.innerHTML = '';
    const none = document.createElement('button');
    none.type = 'button'; none.textContent = 'Nenhum'; none.className = 'shot-ui-btn';
    none.onclick = () => { active[kind] = null; render(); };
    box.appendChild(none);
    players.forEach(p => {
      const id = String(playerId(p));
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = playerName(p); b.className = 'shot-ui-btn';
      if (String(active[kind]) === id) b.classList.add('shot-zone-selected');
      b.onclick = () => { active[kind] = id; if (active.assist && active.assist === active.imbalance) active[kind] = null; render(); };
      box.appendChild(b);
    });
  }
}

function detectSide(id) {
  for (const side of ['A', 'B']) {
    if ((store.state.gameData?.[side]?.players || []).some(p => String(playerId(p)) === String(id) || String(p.Numero) === String(id))) return side;
  }
  return id === 'OPPONENT' ? 'B' : 'A';
}

function capture(side, id) {
  active = { side: side === 'OPPONENT' ? 'B' : (side || detectSide(id)), shooterId: String(id), assist: null, imbalance: null };
  setTimeout(render, 0);
}

function wrap(name) {
  const original = window[name];
  if (typeof original !== 'function' || original.__attributionWrapped) return;
  const wrapped = function(side, id, ...rest) { capture(side, id); return original.call(this, side, id, ...rest); };
  wrapped.__attributionWrapped = true;
  window[name] = wrapped;
}

setInterval(() => { wrap('openModal'); wrap('openBilateralShot'); render(); }, 200);
window.addEventListener('handball:state-updated', () => {
  const events = store.state.gameEvents || [];
  const shot = [...events].reverse().find(e => e.event_type === 'SHOT' && !e.attributionApplied);
  if (!shot || !active.side || String(shot.player_id) !== String(active.shooterId)) return;
  const assistPlayer = findPlayer(active.assist);
  const imbalancePlayer = findPlayer(active.imbalance);
  shot.assist_player_id = active.assist;
  shot.assist_player_name = assistPlayer ? playerName(assistPlayer) : null;
  shot.imbalance_player_id = active.imbalance;
  shot.imbalance_player_name = imbalancePlayer ? playerName(imbalancePlayer) : null;
  shot.construction_label = 'desequilíbrio';
  shot.attributionApplied = true;
  active = { side: null, shooterId: null, assist: null, imbalance: null };
});
