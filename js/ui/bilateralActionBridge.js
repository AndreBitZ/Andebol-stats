import { store } from '../state.js';
import { registerShot } from '../domain/shotEngine.js';

let selected = null;

function teamName(side) {
  return side === 'A' ? (store.state.teamAName || 'Equipa A') : (store.state.teamBName || 'Equipa B');
}

function findPlayer(side, id) {
  return (store.state.gameData?.[side]?.players || []).find(p => String(p.id ?? p.Numero) === String(id) || String(p.Numero) === String(id));
}

function removeLegacyOpponentActions() {
  const timeline = document.getElementById('timeline-list');
  const panel = timeline?.closest('.bg-gray-800');
  if (!panel) return;
  const title = [...panel.querySelectorAll('h3,h4,p')].find(el => el.textContent?.trim() === 'Registo de Ações');
  if (title) title.closest('.bg-gray-700')?.remove();
  const heading = [...panel.querySelectorAll('h3,h4')].find(el => el.textContent?.trim() === 'Adversário');
  if (heading) heading.textContent = teamName('B');
  const homeHeading = [...document.querySelectorAll('#tab-data h3')].find(el => el.textContent?.trim() === 'Nossa Equipa');
  if (homeHeading) homeHeading.textContent = teamName('A');
}

function installOutcomeBridge() {
  document.querySelectorAll('.shot-outcome-btn').forEach(old => {
    if (old.dataset.bilateralBound) return;
    const fresh = old.cloneNode(true);
    fresh.dataset.bilateralBound = '1';
    old.replaceWith(fresh);
    fresh.addEventListener('click', () => {
      if (!selected) return;
      const result = fresh.dataset.outcome === 'goal' ? 'GOAL' : fresh.dataset.outcome === 'saved' ? 'SAVED' : 'MISSED';
      const typeButton = document.querySelector('.shot-type-btn.bg-blue-600');
      const zoneButton = document.querySelector('.shot-zone-btn.bg-blue-600');
      const marker = document.getElementById('shotMarker');
      let coords = null;
      if (marker && !marker.classList.contains('hidden')) {
        const x = parseFloat(marker.style.left);
        const y = parseFloat(marker.style.top);
        const svg = document.getElementById('goalSvg');
        if (svg && Number.isFinite(x) && Number.isFinite(y)) {
          coords = { x: ((x / svg.clientWidth) * 100).toFixed(1), y: ((y / svg.clientHeight) * 100).toFixed(1) };
        }
      }
      try {
        registerShot(store.state, {
          attackingSide: selected.side,
          shooterId: selected.playerId,
          result,
          field_shot_zone: zoneButton?.dataset.zone ? `Z${zoneButton.dataset.zone}` : null,
          shot_type: typeButton?.textContent?.trim() || null,
          metadata: { goal_target_coords: coords }
        });
        store.update(s => { s.lastBilateralShot = Date.now(); });
        document.getElementById('shotModal')?.classList.add('hidden');
        selected = null;
      } catch (error) {
        console.error(error);
        alert(error.message || 'Não foi possível registar o remate.');
      }
    });
  });
}

function wrapOpenModal() {
  if (!window.openModal || window.openModal.__bilateralWrapped) return;
  const original = window.openModal;
  const wrapped = (type, id) => {
    const raw = String(id ?? '');
    if (raw.startsWith('B:')) {
      const playerId = raw.slice(2);
      const player = findPlayer('B', playerId);
      if (!player || player.disqualified) return;
      selected = { side: 'B', playerId: player.id ?? player.Numero };
      const title = document.getElementById('shotPlayerName');
      if (title) title.textContent = `${teamName('B')} · #${player.Numero} ${player.Nome}`;
      if (type === 'shot') {
        document.getElementById('shotModal')?.classList.remove('hidden');
        document.getElementById('shotZoneContainer')?.classList.add('hidden');
        document.getElementById('shotGoalContainer')?.classList.add('hidden');
        document.getElementById('shotOutcomeContainer')?.classList.add('hidden');
      } else {
        // As ações não-remate da equipa B serão migradas para o mesmo motor na próxima etapa.
        alert('O registo bilateral desta ação será disponibilizado pelo motor de eventos.');
      }
      installOutcomeBridge();
      return;
    }
    selected = { side: 'A', playerId: id };
    return original(type, id);
  };
  wrapped.__bilateralWrapped = true;
  window.openModal = wrapped;
}

function install() {
  removeLegacyOpponentActions();
  wrapOpenModal();
  installOutcomeBridge();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
setInterval(install, 1000);
