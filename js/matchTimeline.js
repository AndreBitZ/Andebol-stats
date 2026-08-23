const TIMELINE_SCHEMA_VERSION = '1.1.0';

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
        id: String(id), kind: 'timeline', schemaVersion: TIMELINE_SCHEMA_VERSION,
        period: Number(period), type, gameTime: normalizedGameTime,
        videoTime: asFiniteNumber(videoTime), reason: reason ? String(reason) : null
    };
}
export function createClockStopEvent(args) { return createTimelineEvent({ ...args, type: 'clock_stop' }); }
export function createClockResumeEvent(args) { return createTimelineEvent({ ...args, type: 'clock_resume' }); }

export function validateTimeline(events) {
    const errors = [];
    if (!Array.isArray(events)) return { valid: false, errors: ['Timeline must be an array.'] };
    const ids = new Set();
    for (const event of events) {
        if (ids.has(String(event.id))) errors.push(`Timeline event duplicate id: ${event.id}`);
        ids.add(String(event.id));
        if (event.kind !== 'timeline') errors.push(`Invalid timeline kind for ${event.id}.`);
        if (![1, 2].includes(Number(event.period))) errors.push(`Invalid timeline period for ${event.id}.`);
        if (!['period_start', 'period_end', 'clock_stop', 'clock_resume'].includes(event.type)) errors.push(`Invalid timeline type for ${event.id}.`);
        if (event.videoTime !== null && event.videoTime !== undefined && (!Number.isFinite(Number(event.videoTime)) || Number(event.videoTime) < 0)) errors.push(`Invalid videoTime for ${event.id}.`);
    }
    return { valid: errors.length === 0, errors };
}

export function gameTimeToVideoTime(gameTime, period, anchors, timeline = []) {
    const t = Number(gameTime); const p = Number(period);
    if (!Number.isFinite(t) || ![1, 2].includes(p)) return null;
    const anchor = anchors?.[p === 1 ? 'firstHalfStart' : 'secondHalfStart'];
    if (!anchor) return null;
    const videoStart = asFiniteNumber(anchor.videoTime); const gameStart = asFiniteNumber(anchor.gameTime, 0);
    if (videoStart === null) return null;
    const relevant = timeline.filter(e => Number(e.period) === p && ['clock_stop', 'clock_resume'].includes(e.type)).sort((a, b) => Number(a.gameTime) - Number(b.gameTime));
    let pausedVideoSeconds = 0;
    let stop = null;
    for (const event of relevant) {
        if (event.type === 'clock_stop') stop = event;
        else if (event.type === 'clock_resume' && stop && Number(stop.gameTime) < t) {
            const stopVideo = asFiniteNumber(stop.videoTime); const resumeVideo = asFiniteNumber(event.videoTime);
            if (stopVideo !== null && resumeVideo !== null) pausedVideoSeconds += Math.max(0, resumeVideo - stopVideo);
            stop = null;
        }
    }
    return videoStart + Math.max(0, t - gameStart) + pausedVideoSeconds;
}

export const MATCH_TIMELINE_SCHEMA_VERSION = TIMELINE_SCHEMA_VERSION;