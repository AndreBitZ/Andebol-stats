import { store } from './state.js';
import { createClockResumeEvent, createClockStopEvent, createTimelineEvent } from './matchTimeline.js';

let started = false;
let lastRunning = false;
let lastPeriod = 1;
let sequence = 0;

function nextId(type) {
    sequence += 1;
    return `timeline:${type}:${Date.now()}:${sequence}`;
}

function append(event) {
    const events = Array.isArray(store.state.timelineEvents) ? store.state.timelineEvents : [];
    if (events.some(existing => existing.id === event.id)) return;
    events.push(event);
    events.sort((a, b) => Number(a.gameTime) - Number(b.gameTime));
    store.state.timelineEvents = events;
    store.saveToSessionStorage();
}

function syncPeriod() {
    const period = Number(store.state.currentGamePart) === 2 ? 2 : 1;
    if (period === lastPeriod) return;
    const previous = lastPeriod;
    const previousEnd = Number(store.state.totalSeconds || 0);
    append(createTimelineEvent({ id: nextId('period_end'), period: previous, type: 'period_end', gameTime: previousEnd }));
    append(createTimelineEvent({ id: nextId('period_start'), period, type: 'period_start', gameTime: Number(store.state.totalSeconds || 0) }));
    lastPeriod = period;
}

function observe() {
    syncPeriod();
    const running = Boolean(store.state.isRunning);
    if (running !== lastRunning) {
        const period = Number(store.state.currentGamePart) === 2 ? 2 : 1;
        const gameTime = Number(store.state.totalSeconds || 0);
        if (running) {
            if (!started) {
                append(createTimelineEvent({ id: nextId('period_start'), period, type: 'period_start', gameTime }));
                started = true;
            } else {
                append(createClockResumeEvent({ id: nextId('clock_resume'), period, gameTime }));
            }
        } else if (started) {
            append(createClockStopEvent({ id: nextId('clock_stop'), period, gameTime }));
        }
        lastRunning = running;
    }
}

function install() {
    if (document.documentElement.dataset.clockTimelineInstalled === '1') return;
    document.documentElement.dataset.clockTimelineInstalled = '1';
    lastRunning = Boolean(store.state.isRunning);
    lastPeriod = Number(store.state.currentGamePart) === 2 ? 2 : 1;
    setInterval(observe, 250);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
