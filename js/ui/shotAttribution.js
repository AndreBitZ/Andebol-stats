import { store } from '../state.js';

let active = { side: 'A', shooterId: null, assist: null, imbalance: null };
const id = p => p?.id ?? p?.Numero ?? p?.number;
const label = p => `#${p?.Numero ?? p?.number ?? ''} ${p?.Nome ?? p?.name ?? ''}`.trim();

function players() {
  const list = store.state?.gameData?.A?.players || [];
  const onCourt = list.filter(p => p.onCourt === true || p.emCampo === true || p.inCourt === true);
  return (onCourt.length ? onCourt : list).filter(p => String(id(p)) !== String(active.shooterId));
}

function modal() {
  const el = document.getElementById('shotModal');
  return el && !el.classList.contains('hidden') ? el : null;
}

function render() {
  const m = modal();
  if (!m) return;
  let panel = m.querySelector('#shot-attribution-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'shot-attribution-panel';
    panel.className = 'mt-4 rounded-xl bg-gray-900 p-3 border-2 border-blue-500 text-left';
    panel.innerHTML = '<h4 class="font-bold text-white mb-3">Construção da jogada</h4><div class="font-semibold text-white mb-1">Assistência</div><div id="shot-assist-options" class="grid grid-cols-2 gap-2 mb-3"></div><div class="font-semibold text-white mb-1">Desequilíbrio</div><div id="shot-imbalance-options" class="grid grid-cols-2 gap-2"></div>';
    (m.firstElementChild || m).appendChild(panel);
  }
  for (const kind of ['assist', 'imbalance']) {
    const box = panel.querySelector(`#shot-${kind}-options`);
    box.replaceChildren();
    [['Nenhum', null], ...players().map(p => [label(p), String(id(p))])].forEach(([text, value]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = text;
      b.className = 'bg-gray-700 hover:bg-blue-600 text-white rounded p-2 text-xs';
      if (value !== null && String(active[kind]) === value) b.classList.add('bg-blue-600');
      b.onclick = () => { active[kind] = value; if (active.assist !== null && active.assist === active.imbalance) active[kind] = null; window.__pendingShotAttribution = window.__getShotAttribution(); render(); };
      box.appendChild(b);
    });
  }
}

function detect() {
  const m = modal();
  if (!m) return;
  const title = m.querySelector('#shotPlayerName')?.textContent || '';
  active.side = /advers[aá]rio/i.test(title) ? 'B' : 'A';
  const found = (store.state?.gameData?.A?.players || []).find(p => title.includes(String(p.Nome ?? p.name ?? '')) || title.includes(String(p.Numero ?? p.number ?? '')));
  active.shooterId = found ? String(id(found)) : (/advers[aá]rio/i.test(title) ? 'OPPONENT' : null);
  render();
}

if (typeof MutationObserver !== 'undefined') new MutationObserver(detect).observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true, characterData: true });
setInterval(detect, 100);

window.__getShotAttribution = () => ({ assist_player_id: active.assist, imbalance_player_id: active.imbalance, construction_label: 'desequilíbrio' });
window.__prepareShotAttribution = () => { const data = window.__getShotAttribution(); window.__pendingShotAttribution = data; return data; };
