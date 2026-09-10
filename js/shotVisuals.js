// Visualização do modal de remate baseada nos SVGs oficiais do campo e da baliza.

const COURT_SRC = './assets/shot-court-zones.svg';
const GOAL_SRC = './assets/shot-goal-zones.svg';

function zoneButton(zone, style) {
  return `<button type="button" class="shot-zone-btn absolute bg-transparent hover:bg-blue-500/20 active:bg-blue-500/30 rounded-lg transition border-2 border-transparent hover:border-blue-400/50" data-zone="${zone}" aria-label="Zona ${zone}" style="${style}"><span class="sr-only">Zona ${zone}</span></button>`;
}

function installCourt() {
  const container = document.getElementById('shotZoneContainer');
  if (!container) return;

  const heading = container.querySelector('p');
  container.innerHTML = '';
  if (heading) {
    heading.textContent = '2. Zona de Remate';
    heading.className = 'text-gray-400 text-xs uppercase font-bold tracking-wider mb-2 text-left';
    container.appendChild(heading);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'relative w-full overflow-hidden rounded-lg bg-white border border-gray-600';
  wrapper.style.aspectRatio = '1 / 1';

  const img = document.createElement('img');
  img.src = COURT_SRC;
  img.alt = 'Campo de andebol dividido nas zonas de remate 1 a 9';
  img.className = 'block w-full h-full object-contain select-none';
  img.draggable = false;
  wrapper.appendChild(img);

  // Coordenadas em percentagem do viewBox 1024x1024.
  // A área do GR não recebe qualquer botão.
  wrapper.insertAdjacentHTML('beforeend', [
    zoneButton(1, 'left:5%;top:10%;width:22%;height:24%;'),
    zoneButton(5, 'right:5%;top:10%;width:22%;height:24%;'),
    zoneButton(2, 'left:15%;top:28%;width:28%;height:25%;'),
    zoneButton(4, 'right:15%;top:28%;width:28%;height:25%;'),
    zoneButton(3, 'left:39%;top:30%;width:22%;height:23%;'),
    zoneButton(6, 'left:5%;top:49%;width:30%;height:25%;'),
    zoneButton(7, 'left:35%;top:49%;width:30%;height:25%;'),
    zoneButton(8, 'right:5%;top:49%;width:30%;height:25%;'),
    zoneButton(9, 'left:5%;top:74%;width:90%;height:20%;')
  ].join(''));

  const hint = document.createElement('p');
  hint.className = 'text-xs text-gray-500 mt-1';
  hint.textContent = 'Toque diretamente na zona do campo';

  container.appendChild(wrapper);
  container.appendChild(hint);
}

function installGoal() {
  const wrapper = document.getElementById('goalSvgWrapper');
  if (!wrapper) return;

  const oldSvg = document.getElementById('goalSvg');
  if (!oldSvg) return;

  const img = document.createElement('img');
  img.id = 'goalSvg';
  img.src = GOAL_SRC;
  img.alt = 'Baliza de andebol dividida em 9 zonas';
  img.className = 'w-full h-full object-contain pointer-events-auto select-none';
  img.draggable = false;
  oldSvg.replaceWith(img);
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
  handleSevenMetersAfterMain();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShotVisuals, { once: true });
} else {
  initShotVisuals();
}
