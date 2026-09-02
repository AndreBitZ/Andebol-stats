// js/timer.js - Cronómetro ligado ao relógio oficial e aos stints
import { store } from './state.js';
import { syncOpenStints, closeAllOpenStints } from './domain/matchClock.js';

function tickSuspensions(state) {
    let changed = false;
    for (const side of ['A', 'B']) {
        const players = state.gameData?.[side]?.players || [];
        for (const player of players) {
            if (!player.isSuspended || player.disqualified) continue;
            const current = Math.max(0, Number(player.suspensionTimer) || 0);
            const remaining = Math.max(0, current - 1);
            if (remaining !== current) changed = true;
            player.suspensionTimer = remaining;
            if (remaining === 0) {
                player.isSuspended = false;
                changed = true;
            }
        }
    }
    return changed;
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
        syncOpenStints(store.state);
        this.startTime = Date.now();
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - this.startTime) / 1000);
            const totalTime = this.elapsedPaused + delta;
            store.state.totalSeconds = totalTime;
            syncOpenStints(store.state);
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
        store.notify();
    }

    finish(currentTotalTime = store.state.totalSeconds) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.elapsedPaused = currentTotalTime;
        store.state.totalSeconds = currentTotalTime;
        closeAllOpenStints(store.state, currentTotalTime);
        store.notify();
    }

    isRunning() {
        return this.intervalId !== null;
    }
}
