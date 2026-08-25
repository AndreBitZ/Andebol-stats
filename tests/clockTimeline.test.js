import { describe, expect, it } from 'vitest';
import { createClockResumeEvent, createClockStopEvent, createTimelineEvent, gameTimeToVideoTime } from '../js/matchTimeline.js';

describe('official game clock vs video clock', () => {
  it('keeps pause/resume game time independent from video time', () => {
    const timeline = [
      createTimelineEvent({ id: 'start', period: 1, type: 'period_start', gameTime: 0, videoTime: 120 }),
      createClockStopEvent({ id: 'stop', period: 1, gameTime: 1052, videoTime: 1307 }),
      createClockResumeEvent({ id: 'resume', period: 1, gameTime: 1052, videoTime: 1351 })
    ];
    expect(timeline[1].gameTime).toBe(1052);
    expect(timeline[2].gameTime).toBe(1052);
    expect(timeline[1].videoTime).toBe(1307);
    expect(timeline[2].videoTime).toBe(1351);
    expect(gameTimeToVideoTime(1053, 1, { firstHalfStart: { gameTime: 0, videoTime: 120 } }, timeline)).toBe(1217);
  });
});
