import { store } from './state.js';

const getId = p => p?.id ?? p?.Numero ?? p?.number;
const getName = p => `#${p?.Numero ?? p?.number ?? ''} ${p?.Nome ?? p?.name ?? ''}`.trim();

function allPlayers(side) {
  return store.state?.gameData?.[side]?.players || [];
}

function activeSide() {
  const modal = getModal();
  const text = modal?.querySelector('#shot-player')?.textContent?.trim() || '';
  for (const side of ['A', 'B']) {
    const found = allPlayers(side).some(p => {
      const number = String(p?.Numero ?? p?.number ?? '');
      const name = String(p?.Nome ?? p?.name ?? '');
      return (number && text.includes(number)) || (name && text.toLowerCase().includes(name.toLowerCase()));
    });
    if (found) return side;
  }
  const subtitle = modal?.querySelector('#shot-subtitle')?.textContent?.toLowerCase() || '';
  if (subtitle.includes('equipa b') || subtitle.includes('team b') || subtitle.includes('advers')) return 'B';
  return 'A';
}

function getPlayers() {
  const side = activeSide();
  const list = allPlayers(side);
  const modal = getModal();
  const shooterText = modal?.querySelector('#shot-player')?.textContent?.trim() || '';
  const onCourt = list.filter(p => p.onCourt === true || p.emCampo === true || p.inCourt === true);
  const candidates = onCourt.length ? onCourt : list;
  return candidates.filter(p => {
    const number = String(p?.Numero ?? p?.number ?? '');
    const name = String(p?.Nome ?? p?.name ?? '');
    return !((number && shooterText.includes(number)) || (name && shooterText.toLowerCase().includes(name.toLowerCase())));
  });
}

function getModal() {
  const professional = document.getElementById('professional-shot-modal');
  if (professional && !professional.classList.contains('hidden')) return professional;
  const legacy = document.getElementById('shotModal');
  if (legacy && !legacy.classList.contains('hidden')) return legacy;
  return null;
}

function ensureConstructionSection() {
  const modal = getModal();
  if (!modal) return;

  let panel = modal.querySelector('#shot-attribution-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'shot-attribution-panel';
    panel.className = 'shot-construction-panel mt-5 rounded-2xl bg-gray-900 p-4 border-2 border-blue-500 text-left';
    panel.innerHTML = `
      <h3 class="text-lg font-bold text-white mb-3">🏗️ Construção da jogada</h3>
      <div class="text-sm font-bold text-white mb-2">Assistência</div>
      <div id="shot-assist-options" class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4"></div>
      <div class="text-sm font-bold text-white mb-2">Desequilíbrio</div>
      <div id="shot-imbalance-options" class="grid grid-cols-2 sm:grid-cols-3 gap-2"></div>`;

    const professionalHost = modal.querySelector('.shot-panel .p-4') || modal.querySelector('.shot-panel') || modal.firstElementChild || modal;
    professionalHost.appendChild(panel);
  }

  const players = getPlayers();
  for (const type of ['assist', 'imbalance']) {
    const box = panel.querySelector(`#shot-${type}-options`);
    if (!box) continue;
    box.replaceChildren();
    const options = [['Nenhum', '']].concat(players.map(p => [getName(p), String(getId(p))]));
    options.forEach(([text, value]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.className = 'shot-ui-btn bg-gray-700 hover:bg-blue-600 text-white rounded-xl p-2 text-sm';
      button.dataset.constructionType = type;
      button.dataset.playerId = value;
      button.addEventListener('click', () => {
        box.querySelectorAll('button').forEach(b => b.classList.remove('bg-blue-600'));
        button.classList.add('bg-blue-600');
        window.__pendingShotAttribution = {
          ...(window.__pendingShotAttribution || {}),
          [type === 'assist' ? 'assist_player_id' : 'imbalance_player_id']: value || null
        };
      });
      box.appendChild(button);
    });
    box.dataset.ready = 'true';
  }
}

export function installShotCourt() {}
export function installShotGoal() {}
export function initShotVisuals() {
  const run = () => ensureConstructionSection();
  run();
  if (typeof MutationObserver !== 'undefined' && document.body) {
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  setInterval(run, 200);
}
