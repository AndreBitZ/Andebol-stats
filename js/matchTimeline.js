const TIMELINE_SCHEMA_VERSION = '1.0.0';

function asFiniteNumber(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function createTimelineEvent({ id, period, type, gameTime, reason = null, videoTime = null }) {
    if (!id) throw new Error('Timeline event id is required.');
    if (![1, 2].includes(Number(period))) throw new Error('Timeline event period must be 1 or 2.');
    if (!['period_start', 'period_end', 'clock_stop', 'clock_resume'].includes(type)) {
        throw new Error(`Unsupported timeline event type: ${type}`);
    }
    const normalizedGameTime = asFiniteNumber(gameTime);
    if (normalizedGameTime === null || normalizedGameTime < 0) throw new Error('Timeline event gameTime must be >= 0.');
    return {
        id: String(id),
        kind: 'timeline',
        schemaVersion: TIMELINE_SCHEMA_VERSION,
        period: Number(period),
        type,
        gameTime: normalizedGameTime,
        videoTime: asFiniteNumber(videoTime),
        reason: reason ? String(reason) : null
    };
}

export function createClockStopEvent(args) {
    return createTimelineEvent({ ...args, type: 'clock_stop' });
}

export function createClockResumeEvent(args) {
    return createTimelineEvent({ ...args, type: 'clock_resume' });
}

export function validateTimeline(events) {
    const errors = [];
    if (!Array.isArray(events)) return { valid: false, errors: ['Timeline must be an array.'] };
    const ids = new Set();
    const sorted = [...events].sort((a, b) => Number(a.gameTime) - Number(b.gameTime));
    for (const event of sorted) {
        if (ids.has(String(event.id))) errors.push(`Timeline event duplicate id: ${event.id}`);
        ids.add(String(event.id));
        if (event.kind !== 'timeline') errors.push(`Invalid timeline kind for ${event.id}.`);
        if (!['period_start', 'period_end', 'clock_stop', 'clock_resume'].includes(event.type)) errors.push(`Invalid timeline type for ${event.id}.`);
    }
    return { valid: errors.length === 0, errors };
}

export function gameTimeToVideoTime(gameTime, period, anchors, timeline = []) {
    const t = Number(gameTime);
    const p = Number(period);
    if (!Number.isFinite(t) || ![1, 2].includes(p)) return null;

    const relevant = timeline
        .filter(e => Number(e.period) === p && ['clock_stop', 'clock_resume'].includes(e.type))
        .sort((a, b) => Number(a.gameTime) - Number(b.gameTime) || (a.type === 'clock_stop' ? -1 : 1));

    let pausedVideoSeconds = 0;
    let previousStopVideo = null;
    let previousStopGame = null;
    for (const event of relevant) {
        if (event.type === 'clock_stop') {
            previousStopVideo = asFiniteNumber(event.videoTime);
            previousStopGame = asFiniteNumber(event.gameTime);
        } else if (event.type === 'clock_resume' && previousStopVideo !== null && previousStopGame !== null) {
            const resumeVideo = asFiniteNumber(event.videoTime);
            if (resumeVideo !== null) pausedVideoSeconds += Math.max(0, resumeVideo - previousStopVideo);
            previousStopVideo = null;
            previousStopGame = null;
        }
    }

    const anchor = anchors?.[p === 1 ? 'firstHalfStart' : 'secondHalfStart'];
    if (!anchor) return null;
    const videoStart = asFiniteNumber(anchor.videoTime);
    const gameStart = asFiniteNumber(anchor.gameTime, 0);
    if (videoStart === null) return null;

    const offsetBeforeTarget = relevant.reduce((sum, event, index) => {
        if (event.type !== 'clock_stop') return sum;
        const resume = relevant.slice(index + 1).find(e => e.type === 'clock_resume' && Number(e.gameTime) === Number(event.gameTime));
        if (!resume || Number(event.gameTime) >= t) return sum;
        const stopVideo = asFiniteNumber(event.videoTime);
        const resumeVideo = asFiniteNumber(resume.videoTime);
        return stopVideo !== null && resumeVideo !== null ? sum + Math.max(0, resumeVideo - stopVideo) : sum;
    }, 0);

    return videoStart + Math.max(0, t - gameStart) + offsetBeforeTarget;
}

export const MATCH_TIMELINE_SCHEMA_VERSION = TIMELINE_SCHEMA_VERSION;
