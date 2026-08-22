import { importLivePackage } from './livePackageImporter.js';

const pkg = {
  schemaVersion: '1.2.0',
  source: 'handball-performance-os',
  match: { id: 'm1', ownTeamId: 't1', awayTeamId: 't2', homeAway: 'HOME', date: '2026-08-22' },
  players: [{ id: 'p1', displayName: 'Jogador A', shirtNumber: 7, position: 'CE' }],
  roster: [{ playerId: 'p1', shirtNumber: 7, position: 'CE', starter: true, available: true }],
  events: [
    { id: 'e1', matchId: 'm1', type: 'goal', playerId: 'p1', source: 'MATCH_SHEET', timestampKnown: false },
    { id: 'e2', matchId: 'm1', type: 'goal', playerId: 'p1', source: 'MANUAL_STATS', timestampKnown: false }
  ],
  preMatchStats: { players: [{ playerId: 'p1', goals: 6, shots: 10, assists: null, turnovers: null, saves: null }] },
  dataQualityLevel: 1,
  dataSources: ['MATCH_SHEET', 'MANUAL_STATS']
};

const imported = importLivePackage(pkg);
if (imported.preMatchStats.players[0].goals !== 6) throw new Error('Pré-jogo duplicou golos: esperado 6.');
if (imported.preMatchStats.players[0].shots !== 10) throw new Error('Remates não importados corretamente.');
if (imported.preMatchStats.players[0].assists !== null) throw new Error('Métrica desconhecida deixou de ser desconhecida.');
if (imported.dataQualityLevel !== 1) throw new Error('Qualidade do jogo incorreta.');
if (!imported.dataSources.includes('MATCH_SHEET') || !imported.dataSources.includes('MANUAL_STATS')) throw new Error('Fontes do jogo incompletas.');

export default true;
