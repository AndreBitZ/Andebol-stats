import './ui/shotAttribution.js';
import './ui/liveShotAnalytics.js';

function cleanPositiveActions(root = document) {
  root.querySelectorAll('button').forEach(button => {
    const text = (button.textContent || '').trim().toLowerCase();
    if (text.includes('pré-assistência') || text.includes('pre-assistência') || text.includes('pré-assistencia') || text.includes('pre-assistencia') || text === 'assistência 🎯' || text.startsWith('assistência 🎯')) button.remove();
  });
}

function ensureConstructionSection() {
  const modal = document.getElementById('shotModal');
  if (!modal || modal.classList.contains('hidden')) return;
  if (modal.querySelector('#shot-attribution-panel')) return;
  const host = modal.querySelector(':scope > div') || modal;
  const panel = document.createElement('section');
  panel.id = 'shot-attribution-panel';
  panel.className = 'mt-4 rounded-xl bg-gray-900 p-3 border-2 border-blue-500 text-left';
  panel.innerHTML = `
    <h4 class="font-bold text-white mb-3">Construção da jogada</h4>
    <div class="font-semibold text-white mb-1">Assistência</div>
    <div id="shot-assist-options" class="grid grid-cols-2 gap-2 mb-3"></div>
    <div class="font-semibold text-white mb-1">Desequilíbrio</div>
    <div id="shot-imbalance-options" class="grid grid-cols-2 gap-2"></div>`;
  host.appendChild(panel);
}

export function installShotCourt() {}
export function installShotGoal() {}
export function initShotVisuals() {
  const run = () => { cleanPositiveActions(); ensureConstructionSection(); };
  run();
  if (typeof MutationObserver !== 'undefined' && document.body) {
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  setInterval(run, 150);
}
