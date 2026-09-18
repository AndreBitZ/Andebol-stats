import { store } from '../state.js';

let active = { assist: null, imbalance: null, side: null, shooterId: null };

function label(p) { return `#${p.Numero ?? p.number ?? ''} ${p.Nome ?? p.name ?? ''}`.trim(); }
function onCourt(side, shooterId) {
  return (store.state.gameData?.[side]?.players || []).filter(p => p.onCourt && String(p.id ?? p.Numero) !== String(shooterId));
}
function inject(modal) {
  if (modal.querySelector('#shot-attribution-panel')) return;
  const panel = document.createElement('section');
  panel.id = 'shot-attribution-panel';
  panel.className = 'rounded-2xl bg-gray-800 p-4 border border-gray-700 mt-5';
  panel.innerHTML = `<h3 class="text-lg font-bold text-white mb-3">🤝 Construção da jogada</h3>
    <div class="mb-4"><div class="text-sm font-bold text-white mb-2">Assistência</div><div id="shot-assist-options" class="grid grid-cols-2 sm:grid-cols-3 gap-2"></div></div>
    <div><div class="text-sm font-bold text-white mb-2">Desequilíbrio</div><div id="shot-imbalance-options" class="grid grid-cols-2 sm:grid-cols-3 gap-2"></div></div>`;
  const target = modal.querySelector('.shot-panel > div:last-child');
  (target || modal.querySelector('.shot-panel')).prepend(panel);
  render(modal);
}
function render(modal) {
  const side = active.side, players = onCourt(side, active.shooterId);
  for (const [kind, id] of [['assist','shot-assist-options'],['imbalance','shot-imbalance-options']]) {
    const box = modal.querySelector(`#${id}`); if (!box) continue;
    box.innerHTML = `<button type="button" data-none="${kind}" class="shot-ui-btn">Nenhum</button>` + players.map(p => `<button type="button" data-${kind}="${p.id ?? p.Numero}" class="shot-ui-btn">${label(p)}</button>`).join('');
    box.querySelector(`[data-none="${kind}"]`).onclick = () => { active[kind] = null; renderSelection(modal, kind); };
    box.querySelectorAll(`[data-${kind}]`).forEach(btn => btn.onclick = () => { active[kind] = String(btn.dataset[kind]); if (kind === 'assist' && active.imbalance === active.assist) active.imbalance = null; if (kind === 'imbalance' && active.assist === active.imbalance) active.assist = null; renderSelection(modal, kind); });
  }
  renderSelection(modal);
}
function renderSelection(modal) {
  for (const kind of ['assist','imbalance']) {
    modal.querySelectorAll(`[data-${kind}]`).forEach(b => b.classList.toggle('shot-zone-selected', String(b.dataset[kind]) === String(active[kind])));
  }
}
function findPlayer(side, id) { return (store.state.gameData?.[side]?.players || []).find(p => String(p.id ?? p.Numero) === String(id)); }
function name(side, id) { const p = findPlayer(side, id); return p ? label(p) : null; }

window.addEventListener('bilateral-action-recorded', e => {
  if (e.detail?.type !== 'SHOT') return;
  const events = store.state.gameEvents || [];
  const shot = [...events].reverse().find(x => x.event_type === 'SHOT' && String(x.player_id ?? x.playerId) === String(e.detail.playerId));
  if (!shot) return;
  shot.metadata = { ...(shot.metadata || {}), assist_player_id: active.assist, assist_player_name: name(active.side, active.assist), imbalance_player_id: active.imbalance, imbalance_player_name: name(active.side, active.imbalance), construction_label: 'desequilíbrio' };
  active = { assist: null, imbalance: null, side: null, shooterId: null };
});

const observer = new MutationObserver(() => {
  const modal = document.getElementById('professional-shot-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  if (!active.side) return;
  inject(modal);
});
function hook() {
  const original = window.openBilateralShot;
  if (!original || original.__attributionWrapped) return;
  const wrapped = function(side, id) { active = { assist:null, imbalance:null, side, shooterId:String(id) }; const result = original(side,id); setTimeout(() => { const modal=document.getElementById('professional-shot-modal'); if(modal) inject(modal); }, 0); return result; };
  wrapped.__attributionWrapped = true;
  window.openBilateralShot = wrapped;
}
setInterval(hook, 250);
if (typeof document !== 'undefined') { const observerStart = () => observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class']}); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observerStart, {once:true}); else observerStart(); }
