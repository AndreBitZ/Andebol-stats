// js/timer.js - Cronómetro ligado ao relógio oficial e aos stints
import { store } from './state.js';
import { syncOpenStints, closeAllOpenStints } from './domain/matchClock.js';

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
            this.onTick(totalTime);
        }, 1000);
    }

    pause(currentTotalTime) {
        if (!this.intervalId) return;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.elapsedPaused = currentTotalTime;
        store.state.totalSeconds = currentTotalTime;
    }

    finish(currentTotalTime = store.state.totalSeconds) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.elapsedPaused = currentTotalTime;
        store.state.totalSeconds = currentTotalTime;
        closeAllOpenStints(store.state, currentTotalTime);
    }

    isRunning() {
        return this.intervalId !== null;
    }
}
