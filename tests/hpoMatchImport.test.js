import { hpoToLivePackage, isHpoMatch } from '../js/canonicalImport.js';

const hpi = { score: 18, positivePoints: 26, negativePoints: -8, positiveActions: 4, negativeActions: 2, shots: 7, ratePer60: 36, version: 'ANDSTATS-POINTS-1.0', source: 'ANDEBOL_STATS', sampleSize: 1, updatedAt: new Date().toISOString() };
const payload = {
  format: 'HPO-MATCH', version: '1.0', direction: 'PERFORMANCE_OS_TO_ANDEBOL_STATS', exportedAt: new Date().toISOString(),
  match: { id: 'm1', seasonId: 's1', competitionId: 'c1', date: '2026-08-26', venue: null, homeTeamId: 't1', awayTeamId: 't2', homeTeamName: 'Casa', awayTeamName: 'Fora', ownTeamId: 't1', ownTeamName: 'Casa', homeAway: 'HOME', status: 'planned', durationMinutes: 30, currentPeriod: 1, gameTime: 0, homeScore: 0, awayScore: 0 },
  players: [{ id: 'p1', name: 'Ana Teste', shirtNumber: 7, position: 'CE', teamId: 't1', active: true, hpi }],
  roster: [{ id: 'r1', playerId: 'p1', teamId: 't1', shirtNumber: 7, position: 'CE', starter: true, available: true }],
  events: [], statistics: { preMatch: null, match: { hpi: [{ playerId: 'p1', hpi }] } }, timeline: [], video: { anchors: {}, clips: [] }, metadata: { source: 'handball-performance-os', sourceVersion: 'HPO-MATCH-1.0' }
};

if (!isHpoMatch(payload)) throw new Error('HPO-MATCH válido foi rejeitado');
const live = hpoToLivePackage(payload);
if (live.schemaVersion !== '1.1.0') throw new Error('Schema LIVE de compatibilidade incorreto');
if (live.match.id !== 'm1') throw new Error('matchId não preservado');
if (live.match.ownTeamId !== 't1') throw new Error('ownTeamId não preservado');
if (live.players[0].hpi.score !== 18) throw new Error('HPI não preservado');
if (live.roster[0].playerId !== 'p1') throw new Error('Roster não preservado');
console.log('hpoMatchImport.test.js: OK');
