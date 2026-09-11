// Visualização do modal de remate baseada nos SVGs oficiais do campo e da baliza.

const COURT_SRC = './assets/shot-court-zones.svg';
const GOAL_SRC = './assets/shot-goal-zones.svg';

function zoneButton(zone, style, clipPath = '') {
  const clip = clipPath ? `clip-path:polygon(${clipPath});` : '';
  return `<button type="button" class="shot-zone-btn absolute bg-transparent hover:bg-blue-500/20 active:bg-blue-500/30 transition border-0 p-0" data-zone="${zone}" aria-label="Zona ${zone}" style="${style}${clip}"><span class="sr-only">Zona ${zone}</span></button>`;
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

  // Zonas clicáveis seguem a geometria desenhada no campo.
  // A área do guarda-redes não recebe qualquer botão.
  wrapper.insertAdjacentHTML('beforeend', [
    zoneButton(1, 'left:5%;top:10%;width:22%;height:27%;', '0% 0%,100% 0%,91% 72%,38% 100%'),
    zoneButton(5, 'left:73%;top:10%;width:22%;height:27%;', '0% 0%,100% 0%,62% 100%,9% 72%'),
    zoneButton(2, 'left:14%;top:27%;width:28%;height:26%;', '4% 0%,100% 0%,82% 100%,0% 100%'),
    zoneButton(4, 'left:58%;top:27%;width:28%;height:26%;', '0% 0%,96% 0%,100% 100%,18% 100%'),
    zoneButton(3, 'left:40%;top:30%;width:20%;height:23%;', '8% 0%,92% 0%,100% 100%,0% 100%'),
    zoneButton(6, 'left:5%;top:50%;width:30%;height:24%;', '0% 0%,100% 0%,100% 100%,0% 100%'),
    zoneButton(7, 'left:35%;top:50%;width:30%;height:24%;', '0% 0%,100% 0%,100% 100%,0% 100%'),
    zoneButton(8, 'left:65%;top:50%;width:30%;height:24%;', '0% 0%,100% 0%,100% 100%,0% 100%'),
    zoneButton(9, 'left:5%;top:74%;width:90%;height:20%;', '0% 0%,100% 0%,100% 100%,0% 100%')
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
