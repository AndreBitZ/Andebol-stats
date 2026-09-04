// Permite retomar um jogo já iniciado sem exigir novamente 7 jogadores.
// A validação do número inicial de jogadores continua no fluxo normal de início.
import { store } from './state.js';
import { GameTimer } from './timer.js';

const originalStart = GameTimer.prototype.start;
if (!GameTimer.prototype.__handballResumePatched) {
    GameTimer.prototype.start = function (...args) {
        if (typeof window !== 'undefined') window.__handballGameTimer = this;
        store.state.matchStarted = true;
        return originalStart.apply(this, args);
    };
    GameTimer.prototype.__handballResumePatched = true;
}

function installResumeHandler() {
    const startBtn = document.getElementById('startBtn');
    if (!startBtn || startBtn.__resumeHandlerInstalled) return;
    startBtn.__resumeHandlerInstalled = true;

    startBtn.addEventListener('click', (event) => {
        if (store.state?.matchStarted !== true || store.state?.isRunning === true) return;

        const gameTimer = window.__handballGameTimer;
        if (!gameTimer) return;

        // O jogo já começou: retomar NÃO depende do número atual de jogadores.
        event.preventDefault();
        event.stopImmediatePropagation();
        gameTimer.start();
        store.update(s => s.isRunning = true);

        const editTimerBtn = document.getElementById('editTimerBtn');
        if (editTimerBtn) editTimerBtn.disabled = true;
    }, true);
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installResumeHandler, { once: true });
    else installResumeHandler();
}
