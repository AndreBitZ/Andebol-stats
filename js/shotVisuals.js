import './ui/shotAttribution.js';

// Camada de compatibilidade e pequenos ajustes de interface.
// Mantém o modal profissional intacto e remove ações de assistência do menu
// genérico, porque passam a ser selecionadas dentro do registo do remate.

function cleanPositiveActions(root = document) {
  const buttons = root.querySelectorAll('button');
  buttons.forEach(button => {
    const text = (button.textContent || '').trim().toLowerCase();
    if (text.includes('pré-assistência') || text.includes('pre-assistência') || text.includes('pré-assistencia') || text.includes('pre-assistencia') || text === 'assistência 🎯' || text.startsWith('assistência 🎯')) {
      button.remove();
    }
    if (text.includes('pré-assistência') || text.includes('pre-assistência')) {
      button.textContent = button.textContent.replace(/pré-assistência|pre-assistência/ig, 'Desequilíbrio');
    }
  });
}

export function installShotCourt() {}
export function installShotGoal() {}
export function initShotVisuals() {
  cleanPositiveActions();
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => cleanPositiveActions());
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
