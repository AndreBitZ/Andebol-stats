// Interface visual do modal de remate — versão nativa e autónoma.
// Não usa SVG/imagens para selecionar zonas.
// UI_VERSION: BUTTONS_V7_FORCE_NATIVE_2026_09_14

function makeZoneButton(zone) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shot-zone-btn w-full min-h-[58px] rounded-xl border border-gray-600 bg-gray-700 text-white font-bold text-lg transition hover:bg-blue-600 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
  button.dataset.zone = String(zone);
  button.textContent = String(zone);
  button.setAttribute('aria-label', `Zona de remate ${zone}`);
  return button;
}

function makeGoalButton(zone) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'goal-zone-btn min-h-[58px] rounded-md border border-gray-500 bg-gray-700 text-white font-bold text-lg transition hover:bg-blue-600 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
  button.dataset.goalZone = String(zone);
  button.textContent = String(zone);
  button.setAttribute('aria-label', `Zona da baliza ${zone}`);
  return button;
}

function installCourt() {
  const container = document.getElementById('shotZoneContainer');
  if (!container) return;

  container.classList.remove('hidden');
  container.innerHTML = '';
  container.style.backgroundImage = 'none';
  container.style.background = 'transparent';
  container.style.height = 'auto';
  container.style.minHeight = '0';

  const heading = document.createElement('p');
  heading.className = 'text-gray-400 text-xs uppercase font-bold tracking-wider mb-2 text-left';
  heading.textContent = '2. Zona de Remate';

  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-500 text-xs mb-3 text-left';
  subtitle.textContent = 'Escolha a zona de origem do remate';

  const grid = document.createElement('div');
  grid.className = 'grid gap-2 w-full';

  const row1 = document.createElement('div');
  row1.className = 'grid grid-cols-5 gap-2 w-full';
  [1, 2, 3, 4, 5].forEach(z => row1.appendChild(makeZoneButton(z)));

  const row2 = document.createElement('div');
  row2.className = 'grid grid-cols-2 gap-2 w-full';
  [6, 7].forEach(z => row2.appendChild(makeZoneButton(z)));

  const row3 = document.createElement('div');
  row3.className = 'grid grid-cols-1 gap-2 w-full';
  row3.appendChild(makeZoneButton(9));

  grid.append(row1, row2, row3);
  container.append(heading, subtitle, grid);
}

function installGoal() {
  const wrapper = document.getElementById('goalSvgWrapper');
  if (!wrapper) return;

  wrapper.querySelectorAll('svg, img, image').forEach(el => el.remove());
  wrapper.style.backgroundImage = 'none';
  wrapper.style.background = 'transparent';
  wrapper.style.height = 'auto';
  wrapper.style.position = 'relative';
  wrapper.className = 'w-full';

  const oldGoal = document.getElementById('goalSvg');
  if (oldGoal) oldGoal.remove();

  const goal = document.createElement('div');
  goal.id = 'goalSvg';
  goal.className = 'grid grid-cols-3 gap-1 p-2 rounded-lg border border-gray-500 bg-gray-900 w-full';
  goal.dataset.selectedZone = '';
  goal.dataset.selectedX = '';
  goal.dataset.selectedY = '';

  for (let z = 1; z <= 9; z++) goal.appendChild(makeGoalButton(z));
  wrapper.insertBefore(goal, wrapper.firstChild);

  goal.addEventListener('click', e => {
    const button = e.target.closest('.goal-zone-btn');
    if (!button) return;

    goal.querySelectorAll('.goal-zone-btn').forEach(b => {
      b.classList.remove('bg-blue-600');
      b.classList.add('bg-gray-700');
    });
    button.classList.remove('bg-gray-700');
    button.classList.add('bg-blue-600');

    const zone = Number(button.dataset.goalZone);
    const col = (zone - 1) % 3;
    const row = Math.floor((zone - 1) / 3);
    const x = ((col + 0.5) / 3) * 100;
    const y = ((row + 0.5) / 3) * 100;

    goal.dataset.selectedZone = String(zone);
    goal.dataset.selectedX = x.toFixed(1);
    goal.dataset.selectedY = y.toFixed(1);

    const marker = document.getElementById('shotMarker');
    if (marker) {
      marker.style.left = `${x}%`;
      marker.style.top = `${y}%`;
      marker.classList.remove('hidden');
    }

    const outcome = document.getElementById('shotOutcomeContainer');
    if (outcome) outcome.classList.remove('hidden');
  });
}

function removeLegacyVisuals(modal) {
  modal.querySelectorAll('svg, img, image').forEach(el => el.remove());
  modal.querySelectorAll('[style*="background-image"]').forEach(el => {
    el.style.backgroundImage = 'none';
  });
}

function isSevenMeter() {
  const selected = document.querySelector('.shot-type-btn.bg-blue-600');
  if (!selected) return false;
  return selected.textContent.trim().toLowerCase().replace(/\s+/g, '') === '7mt';
}

function forceNativeShotUI() {
  const modal = document.getElementById('shotModal');
  if (!modal) return;

  removeLegacyVisuals(modal);

  const zone = document.getElementById('shotZoneContainer');
  const goalWrapper = document.getElementById('goalSvgWrapper');
  const goal = document.getElementById('goalSvg');

  if (isSevenMeter()) {
    // 7 metros não utiliza zonas 1–9.
    if (zone) {
      zone.classList.add('hidden');
      zone.innerHTML = '';
    }
    if (goalWrapper) {
      goalWrapper.classList.add('hidden');
      goalWrapper.innerHTML = '';
    }
    return;
  }

  if (zone && !zone.querySelector('.shot-zone-btn')) installCourt();
  if (goalWrapper && !goalWrapper.querySelector('.goal-zone-btn')) installGoal();
}

export function installShotCourt() {
  installCourt();
}

export function installShotGoal() {
  installGoal();
}

export function initShotVisuals() {
  // Executa imediatamente e também durante a abertura do modal.
  forceNativeShotUI();

  const observer = new MutationObserver(() => {
    window.clearTimeout(window.__shotUiTimer);
    window.__shotUiTimer = window.setTimeout(forceNativeShotUI, 0);
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

  // Segurança contra qualquer código legado que reconstrua o modal depois.
  window.setInterval(forceNativeShotUI, 250);
}
