import { store } from '../state.js';

let active = { side: null, shooterId: null, assist: null, imbalance: null };
const getId = p => p?.id ?? p?.Numero ?? p?.number;
const getName = p => `#${p?.Numero ?? p?.number ?? ''} ${p?.Nome ?? p?.name ?? ''}`.trim();

function currentPlayers() {
  return (store.state.gameData?.[active.side]?.players || [])
    .filter(p => p.onCourt && String(getId(p)) !== String(active.shooterId));
}

function playerById(value) {
  return currentPlayers().find(p => String(getId(p)) === String(value));
}

function ensurePanel() {
  const modal = document.getElementById('shotModal');
  if (!modal || modal.classList.contains('hidden') || !active.side) return;
  let panel = modal.querySelector('#shot-attribution-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'shot-attribution-panel';
    panel.className = 'mt-4 rounded-xl bg-gray-900 p-3 border border-gray-700 text-left';
    panel.innerHTML = '<h4 class="font-bold text-white mb-3">Construção da jogada</h4><div class="text-sm font-semibold text-white mb-1">Assistência</div><div id="shot-assist-options" class="grid grid-cols-2 gap-2 mb-3"></div><div class="text-sm font-semibold text-white mb-1">Desequilíbrio</div><div id="shot-imbalance-options" class="grid grid-cols-2 gap-2"></div>';
    const content = modal.querySelector('.bg-gray-800');
    if (content) content.appendChild(panel);
    else modal.appendChild(panel);
  }

  const players = currentPlayers();
  for (const kind of ['assist', 'imbalance']) {
    const box = panel.querySelector(`#shot-${kind}-options`);
    if (!box) continue;
    box.innerHTML = '';
    const options = [[ 'Nenhum', null ], ...players.map(p => [getName(p), String(getId(p))])];
    options.forEach(([text, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.className = 'shot-ui-btn bg-gray-700 text-white rounded p-2 text-sm';
      if (value !== null && String(active[kind]) === String(value)) button.classList.add('shot-zone-selected', 'bg-blue-600');
      button.onclick = () => {
        active[kind] = value;
        if (active.assist && active.assist === active.imbalance) {
          active[kind] = null;
        }
        renderPanel();
      };
      box.appendChild(button);
    });
  }
}

function renderPanel() {
  ensurePanel();
}

function capture(type, value) {
  if (type !== 'shot') return;
  active = {
    side: value === 'OPPONENT' ? 'B' : 'A',
    shooterId: String(value),
    assist: null,
    imbalance: null
  };
  window.__pendingShotAttribution = null;
  setTimeout(renderPanel, 20);
}

function wrapOpenModal() {
  const original = window.openModal;
  if (typeof original !== 'function' || original.__attributionWrapped) return;
  const wrapped = function(type, value, ...rest) {
    capture(type, value);
    const result = original.call(this, type, value, ...rest);
    setTimeout(renderPanel, 30);
    return result;
  };
  wrapped.__attributionWrapped = true;
  window.openModal = wrapped;
}

setInterval(() => {
  wrapOpenModal();
  renderPanel();
}, 200);

window.addEventListener('handball:state-updated', () => {
  const pending = window.__pendingShotAttribution;
  if (!pending || !active.side) return;
  const events = store.state.gameEvents || [];
  const shot = [...events].reverse().find(e => e.event_type === 'SHOT' || e.type === 'shot');
  if (!shot) return;
  shot.metadata = { ...(shot.metadata || {}), ...pending };
  window.__pendingShotAttribution = null;
  active = { side: null, shooterId: null, assist: null, imbalance: null };
});

window.__getShotAttribution = () => ({
  assist_player_id: active.assist,
  assist_player_name: playerById(active.assist) ? getName(playerById(active.assist)) : null,
  imbalance_player_id: active.imbalance,
  imbalance_player_name: playerById(active.imbalance) ? getName(playerById(active.imbalance)) : null,
  construction_label: 'desequilíbrio'
});

window.__prepareShotAttribution = () => {
  const data = window.__getShotAttribution();
  window.__pendingShotAttribution = data;
  return data;
};
