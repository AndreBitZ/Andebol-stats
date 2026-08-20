import { importLivePackage, validateLivePackage } from '../js/livePackageImporter.js';

const pkg = {
  schemaVersion: '1.1.0',
  source: 'handball-performance-os',
  match: {
    id:'m1', seasonId:'s1', competitionId:null, date:null, venue:null,
    homeTeamId:'t2', awayTeamId:'t1', homeTeamName:'Fora', awayTeamName:'Casa',
    ownTeamId:'t1', ownTeamName:'Casa', homeAway:'AWAY', status:'planned',
    durationMinutes:30, currentPeriod:1, gameTime:0, homeScore:0, awayScore:0
  },
  players: [{id:'p1',name:'Ana Teste',displayName:'Ana Teste',shirtNumber:7,position:'CE',teamId:'t1'}],
  roster: [{id:'r1',playerId:'p1',teamId:'t1',shirtNumber:7,position:'CE',starter:true,captain:false,available:true}],
  events: [{id:'e1',matchId:'m1',period:1,gameTime:120,teamId:'t1',playerId:'p1',type:'shot'}],
  situations: [],
  statistics: {},
  metadata: { adapterVersion:'1.1.0', exportedAt:new Date().toISOString() }
};

const result = validateLivePackage(pkg);
if (!result.valid) throw new Error(result.errors.join('; '));
const imported = importLivePackage(pkg);
if (imported.matchId !== 'm1') throw new Error('matchId não preservado');
if (imported.teamAId !== 't1') throw new Error('ID da nossa equipa não preservado');
if (imported.teamBId !== 't2') throw new Error('ID do adversário não preservado');
if (imported.teamAName !== 'Casa') throw new Error('Nome da nossa equipa não preservado');
if (imported.teamBName !== 'Fora') throw new Error('Nome do adversário não preservado');
if (imported.players[0].id !== 'p1') throw new Error('playerId não preservado');
if (!imported.players[0].onCourt) throw new Error('starter não preservado');
if (imported.metadata.homeAway !== 'AWAY') throw new Error('Orientação casa/fora não preservada');
console.log('livePackageImporter.test.js: OK');
