// Correções de estabilidade do controlo do jogo.
// 1) Retomar um jogo já iniciado não volta a exigir 7 jogadores.
// 2) Corrigir o relógio não deve reconstruir os botões antigos dos jogadores.
import { store } from './state.js';
import { GameTimer } from './timer.js';

const originalStart = GameTimer.prototype.start;
if (!GameTimer.prototype.__handballResumePatched) {
    GameTimer.prototype.start = function (...args) {
        if (typeof window !== 'undefined') window.__handballGameTimer = this;
        return originalStart.apply(this, args);
    };
    GameTimer.prototype.__handballResumePatched = true;
}

function getGameTimer() {
    return typeof window !== 'undefined' ? window.__handballGameTimer : null;
}

function resumeStartedGame(event) {
    const target = event.target?.closest?.('#startBtn');
    if (!target || store.state?.isRunning === true) return;

    const alreadyStarted = store.state?.matchStarted === true ||
        Number(store.state?.totalSeconds) > 0 ||
        (Array.isArray(store.state?.gameEvents) && store.state.gameEvents.length > 0);

    if (!alreadyStarted) return;

    const gameTimer = getGameTimer();
    if (!gameTimer) return;

    // Este jogo já começou: nunca voltar a validar o número inicial de atletas.
    event.preventDefault();
    event.stopImmediatePropagation();
    gameTimer.start();
    store.update(s => {
        s.isRunning = true;
        s.matchStarted = true;
    });

    const editTimerBtn = document.getElementById('editTimerBtn');
    if (editTimerBtn) editTimerBtn.disabled = true;
}

function applyCorrection(event) {
    const target = event.target?.closest?.('#saveCorrectionBtn');
    if (!target) return;
    if (store.state?.isRunning === true) return;

    const minEl = document.getElementById('correctMin');
    const secEl = document.getElementById('correctSec');
    const modal = document.getElementById('correctionModal');
    const min = Math.max(0, parseInt(minEl?.value, 10) || 0);
    const sec = Math.max(0, Math.min(59, parseInt(secEl?.value, 10) || 0));
    const newTotalSeconds = (min * 60) + sec;
    const oldTotalSeconds = Number(store.state.totalSeconds) || 0;
    const diff = newTotalSeconds - oldTotalSeconds;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (diff !== 0) {
        store.update(s => {
            s.totalSeconds = newTotalSeconds;

            for (const side of ['A', 'B']) {
                const team = s.gameData?.[side];
                if (!team) continue;

                for (const player of (team.players || [])) {
                    if (player.onCourt) {
                        player.timeOnCourt = Math.max(0, (Number(player.timeOnCourt) || 0) + diff);
                    }

                    if (player.isSuspended) {
                        const current = Math.max(0, Number(player.suspensionTimer) || 0);
                        player.suspensionTimer = Math.max(0, current - diff);
                        if (player.suspensionTimer === 0) {
                            player.isSuspended = false;
                        }
                    }
                }

                if (team.isTeamSuspended) {
                    const current = Math.max(0, Number(team.teamSuspensionTimer) || 0);
                    team.teamSuspensionTimer = Math.max(0, current - diff);
                    if (team.teamSuspensionTimer === 0) {
                        team.isTeamSuspended = false;
                    }
                }
            }
        });

        const gameTimer = getGameTimer();
        if (gameTimer) {
            gameTimer.elapsedPaused = newTotalSeconds;
            gameTimer.startTime = 0;
        }
    }

    // O store.update já dispara handball:state-updated. Os novos rosters
    // são responsáveis pelo desenho dos jogadores; não chamar renderPlayers().
    document.getElementById('timer')?.dispatchEvent(new CustomEvent('handball:timer-corrected'));
    modal?.classList.add('hidden');
}

function install() {
    if (document.__handballStabilityFixInstalled) return;
    document.__handballStabilityFixInstalled = true;

    // Capture no document acontece antes do listener antigo do main.js no botão.
    document.addEventListener('click', resumeStartedGame, true);
    document.addEventListener('click', applyCorrection, true);
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
        install();
    }
}
