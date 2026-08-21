import { createClockResumeEvent, createClockStopEvent, gameTimeToVideoTime } from '../js/matchTimeline.js';

const stop = createClockStopEvent({ id: 'tl-stop', period: 1, gameTime: 1112, videoTime: 2487, reason: 'medical' });
const resume = createClockResumeEvent({ id: 'tl-resume', period: 1, gameTime: 1112, videoTime: 2571, reason: 'medical' });
const anchors = { firstHalfStart: { gameTime: 0, videoTime: 42 }, secondHalfStart: null };
const before = gameTimeToVideoTime(1100, 1, anchors, [stop, resume]);
const after = gameTimeToVideoTime(1120, 1, anchors, [stop, resume]);
if (before !== 1142) throw new Error(`Before stop expected 1142, got ${before}`);
if (after !== 1304) throw new Error(`After stop expected 1304, got ${after}`);
console.log('matchTimeline.test.js: OK');
