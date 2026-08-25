import { strict as assert } from 'node:assert';
import { importHpoMatch } from './hpoMatchImporter.js';

const fixture = {
  format: 'HPO-MATCH', version: '1.0', direction: 'PERFORMANCE_OS_TO_ANDEBOL_STATS',
  exportedAt: '2026-08-24T18:00:00.000Z',
  match: { id: 'TEST-MATCH-001', homeTeamName: 'Test Home', awayTeamName: 'Test Away' },
  players: [{ id: 'P1', name: 'Player One' }],
  roster: [{ playerId: 'P1' }],
  events: [{ id: 'E1', period: 2, gameTime: 1052, videoTimestampSeconds: 3644 }],
  statistics: { preMatch: { team: { matches: 10 } } },
  timeline: [{ period: 2, gameTime: 0, videoTime: 2642 }],
  video: { anchors: { secondHalfStart: { videoTime: 2642 } }, clips: [{ eventId: 'E1', startSeconds: 3639, endSeconds: 3652 }] },
  metadata: { source: 'handball-performance-os' }
};

const imported = importHpoMatch(fixture);
assert.equal(imported.match.id, 'TEST-MATCH-001');
assert.equal(imported.players[0].id, 'P1');
assert.equal(imported.events[0].videoTimestampSeconds, 3644);
assert.equal(imported.video.clips[0].eventId, 'E1');
assert.equal(imported.video.anchors.secondHalfStart.videoTime, 2642);
console.log('HPO-MATCH importer smoke test: PASS');
