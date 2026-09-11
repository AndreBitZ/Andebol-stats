// Interface visual do modal de remate usando apenas botões HTML.
// Não depende de SVG para selecionar as zonas.

function makeZoneButton(zone, label = `Zona ${zone}`) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shot-zone-btn w-full min-h-[58px] rounded-xl border border-gray-600 bg-gray-700 text-white font-bold text-lg transition hover:bg-blue-600 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
  button.dataset.zone = String(zone);
  button.setAttribute('aria-label', label);
  button.textContent = String(zone);
  return button;
}

function installCourt() {
  const container = document.getElementById('shotZoneContainer');
  if (!container) return;

  const heading = document.createElement('p');
  heading.className = 'text-gray-400 text-xs uppercase font-bold tracking-wider mb-2 text-left';
  heading.textContent = '2. Zona de Remate';

  const subtitle = document.createElement('p');
  subtitle.className = 'text-gray-500 text-xs mb-3';
  subtitle.textContent = 'Escolha a zona de origem do remate';

  const grid = document.createElement('div');
  grid.className = 'grid gap-2 w-full';

  // 1ª linha: zonas 1 a 5.
  const row1 = document.createElement('div');
  row1.className = 'grid grid-cols-5 gap-2 w-full';
  [1, 2, 3, 4, 5].forEach(zone => row1.appendChild(makeZoneButton(zone)));

  // 2ª linha: zonas 6 e 7, ocupando toda a largura da primeira linha.
  const row2 = document.createElement('div');
  row2.className = 'grid grid-cols-2 gap-2 w-full';
  [6, 7].forEach(zone => row2.appendChild(makeZoneButton(zone)));

  // 3ª linha: zona 9, ocupando toda a largura.
  const row3 = document.createElement('div');
  row3.className = 'grid grid-cols-1 gap-2 w-full';
  row3.appendChild(makeZoneButton(9));

  grid.append(row1, row2, row3);

  container.replaceChildren(heading, subtitle, grid);
}

function makeGoalButton(zone) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'goal-zone-btn min-h-[58px] rounded-md border border-gray-500 bg-gray-700 text-white font-bold text-lg transition hover:bg-blue-600 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
  button.dataset.goalZone = String(zone);
  button.setAttribute('aria-label', `Zona da baliza ${zone}`);
  button.textContent = String(zone);
  return button;
}

function installGoal() {
  const wrapper = document.getElementById('goalSvgWrapper');
  const oldGoal = document.getElementById('goalSvg');
  if (!wrapper || !oldGoal) return;

  // Mantemos o id #goalSvg porque o main.js usa esse elemento para calcular
  // a posição selecionada. Agora é um painel HTML 3x3, não uma imagem SVG.
  const goal = document.createElement('div');
  goal.id = 'goalSvg';
  goal.className = 'grid grid-cols-3 gap-1 p-2 rounded-lg border border-gray-500 bg-gray-900 w-full';
  goal.setAttribute('role', 'grid');
  goal.setAttribute('aria-label', 'Baliza dividida em 9 zonas');

  for (let zone = 1; zone <= 9; zone++) {
    goal.appendChild(makeGoalButton(zone));
  }

  oldGoal.replaceWith(goal);
}

function handleGoalZoneSelection() {
  const goal = document.getElementById('goalSvg');
  if (!goal) return;

  // O main.js continua a receber o clique através do #goalSvg.
  // Este listener apenas destaca visualmente a célula 3x3 escolhida.
  goal.addEventListener('click', event => {
    const button = event.target.closest('.goal-zone-btn');
    if (!button) return;
    goal.querySelectorAll('.goal-zone-btn').forEach(b => {
      b.classList.remove('bg-blue-600');
      b.classList.add('bg-gray-700');
    });
    button.classList.remove('bg-gray-700');
    button.classList.add('bg-blue-600');
  });
}

function handleSevenMetersAfterMain() {
  document.querySelectorAll('.shot-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isSeven = btn.textContent.trim().toLowerCase() === '7mt';
      window.setTimeout(() => {
        const zone = document.getElementById('shotZoneContainer');
        const goal = document.getElementById('shotGoalContainer');
        if (!zone || !goal) return;
        if (isSeven) {
          zone.classList.add('hidden');
          goal.classList.remove('hidden');
        }
      }, 0);
    });
  });
}

function initShotVisuals() {
  installCourt();
  installGoal();
  handleGoalZoneSelection();
  handleSevenMetersAfterMain();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShotVisuals, { once: true });
} else {
  initShotVisuals();
}
