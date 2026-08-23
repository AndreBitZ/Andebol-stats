const TIMELINE_SCHEMA_VERSION = '1.2.0';

function asFiniteNumber(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function createTimelineEvent({ id, period, type, gameTime, reason = null, videoTime = null }) {
    if (!id) throw new Error('Timeline event id is required.');
    if (![1, 2].includes(Number(period))) throw new Error('Timeline event period must be 1 or 2.');
    if (!['period_start', 'period_end', 'clock_stop', 'clock_resume'].includes(type)) throw new Error(`Unsupported timeline event type: ${type}`);
    const normalizedGameTime = asFiniteNumber(gameTime);
    if (normalizedGameTime === null || normalizedGameTime < 0) throw new Error('Timeline event gameTime must be >= 0.');
    return { id: String(id), kind: 'timeline', schemaVersion: TIMELINE_SCHEMA_VERSION, period: Number(period), type, gameTime: normalizedGameTime, videoTime: asFiniteNumber(videoTime), reason: reason ? String(reason) : null };
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

function normalizedAnchors(anchors, period) {
    const key = period === 1 ? 'firstHalfStart' : 'secondHalfStart';
    const anchor = anchors?.[key];
    if (!anchor) return null;
    const videoStart = asFiniteNumber(anchor.videoTime); const gameStart = asFiniteNumber(anchor.gameTime, 0);
    return videoStart === null ? null : { videoStart, gameStart };
}

export function gameTimeToVideoTime(gameTime, period, anchors, timeline = []) {
    const t = Number(gameTime); const p = Number(period);
    if (!Number.isFinite(t) || ![1, 2].includes(p)) return null;
    const anchor = normalizedAnchors(anchors, p);
    if (!anchor) return null;
    const relevant = timeline.filter(e => Number(e.period) === p && ['clock_stop', 'clock_resume'].includes(e.type) && Number.isFinite(Number(e.gameTime))).sort((a, b) => Number(a.gameTime) - Number(b.gameTime));
    let pausedVideoSeconds = 0;
    let stop = null;
    for (const event of relevant) {
        const eventGameTime = Number(event.gameTime);
        if (event.type === 'clock_stop' && eventGameTime <= t) stop = event;
        else if (event.type === 'clock_resume' && stop) {
            const stopVideo = asFiniteNumber(stop.videoTime); const resumeVideo = asFiniteNumber(event.videoTime);
            if (stopVideo !== null && resumeVideo !== null) pausedVideoSeconds += Math.max(0, resumeVideo - stopVideo);
            stop = null;
        }
    }
    return anchor.videoStart + Math.max(0, t - anchor.gameStart) + pausedVideoSeconds;
}

export function eventToVideoTime(event, anchors, timeline = []) {
    if (!event) return null;
    const explicit = asFiniteNumber(event.videoTimestampSeconds ?? event.videoTime);
    if (explicit !== null && event.timestampKnown !== false) return explicit;
    return gameTimeToVideoTime(event.gameTime, event.period, anchors, timeline);
}

export function createVideoClipForEvent(event, { anchors, timeline = [], preSeconds = 5, postSeconds = 8 } = {}) {
    const center = eventToVideoTime(event, anchors, timeline);
    if (center === null) return null;
    const pre = Math.max(0, Number(preSeconds) || 0); const post = Math.max(0, Number(postSeconds) || 0);
    return { eventId: String(event.id), period: Number(event.period), gameTime: asFiniteNumber(event.gameTime), videoCenterSeconds: center, startSeconds: Math.max(0, center - pre), endSeconds: center + post, preSeconds: pre, postSeconds: post, source: 'GAME_TIME_TO_VIDEO' };
}

export const MATCH_TIMELINE_SCHEMA_VERSION = TIMELINE_SCHEMA_VERSION;