// js/timer.js - Cronómetro ligado ao relógio oficial e aos stints
import { store } from './state.js';
import { syncOpenStints, closeAllOpenStints, getPlayerSeconds } from './domain/matchClock.js';

function reconcileSuspensions(state) {
    const now = Number(state.totalSeconds) || 0;
    for (const side of ['A', 'B']) {
        const players = state.gameData?.[side]?.players || [];
        for (const player of players) {
            if (!player.isSuspended) continue;
            let end = Number(player.suspensionEndTime);
            if (!Number.isFinite(end)) {
                const legacyRemaining = Math.max(0, Number(player.suspensionTimer) || 0);
                end = now + legacyRemaining;
                player.suspensionEndTime = end;
            }
            const remaining = Math.max(0, Math.ceil(end - now));
            player.suspensionTimer = remaining;
            if (remaining === 0) {
                // Vermelho direto/desqualificação é permanente: o jogador continua fora,
                // mas deixa de ocupar a vaga de exclusão de 2 minutos.
                player.isSuspended = false;
                if (player.disqualified) player.onCourt = false;
            }
        }
    }
}

function syncPlayerTimeOnCourt(state) {
    // Os stints são a fonte canónica dos minutos. O campo timeOnCourt é mantido
    // sincronizado para a UI atual e para compatibilidade com os restantes módulos.
    for (const side of ['A', 'B']) {
        for (const player of (state.gameData?.[side]?.players || [])) {
            player.timeOnCourt = Math.floor(getPlayerSeconds(state, side, player.id ?? player.Numero));
        }
    }
}

function tickSuspensions(state) {
    reconcileSuspensions(state);
}

export class GameTimer {
    constructor(onTickCallback) {
        this.startTime = 0;
        this.elapsedPaused = 0;
        this.intervalId = null;
        this.onTick = onTickCallback;
    }

    start() {
        if (this.intervalId) return;
        reconcileSuspensions(store.state);
        syncOpenStints(store.state);
        syncPlayerTimeOnCourt(store.state);
        this.startTime = Date.now();
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - this.startTime) / 1000);
            const totalTime = this.elapsedPaused + delta;
            store.state.totalSeconds = totalTime;
            syncOpenStints(store.state);
            syncPlayerTimeOnCourt(store.state);
            tickSuspensions(store.state);
            store.notify();
            this.onTick(totalTime);
        }, 1000);
    }

    pause(currentTotalTime) {
        if (!this.intervalId) return;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.elapsedPaused = currentTotalTime;
        store.state.totalSeconds = currentTotalTime;
        syncOpenStints(store.state);
        syncPlayerTimeOnCourt(store.state);
        reconcileSuspensions(store.state);
        store.notify();
    }

    finish(currentTotalTime = store.state.totalSeconds) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.elapsedPaused = currentTotalTime;
        store.state.totalSeconds = currentTotalTime;
        syncOpenStints(store.state);
        syncPlayerTimeOnCourt(store.state);
        reconcileSuspensions(store.state);
        closeAllOpenStints(store.state, currentTotalTime);
        syncPlayerTimeOnCourt(store.state);
        store.notify();
    }

    isRunning() {
        return this.intervalId !== null;
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('handball:state-updated', () => {
        reconcileSuspensions(store.state);
        syncPlayerTimeOnCourt(store.state);
    });
}
