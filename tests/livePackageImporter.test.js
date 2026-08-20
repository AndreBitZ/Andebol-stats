import { importLivePackage, validateLivePackage } from '../js/livePackageImporter.js';

const pkg = {
  schemaVersion: '1.0.1',
  source: 'handball-performance-os',
  match: { id:'m1', seasonId:'s1', competitionId:null, date:null, venue:null, homeAway:'HOME' },
  teams: { home:{id:'t1',name:'Casa'}, away:{id:'t2',name:'Fora'} },
  players: [{id:'p1',name:'Ana Teste',displayName:'Ana Teste',shirtNumber:7,position:'CE',teamId:'t1'}],
  roster: [{id:'r1',playerId:'p1',teamId:'t1',shirtNumber:7,position:'CE',starter:true,captain:false,available:true}],
  events: [{id:'e1',matchId:'m1',period:1,gameTime:120,teamId:'t1',playerId:'p1',type:'shot'}]
};

const result = validateLivePackage(pkg);
if (!result.valid) throw new Error(result.errors.join('; '));
const imported = importLivePackage(pkg);
if (imported.matchId !== 'm1') throw new Error('matchId não preservado');
if (imported.players[0].id !== 'p1') throw new Error('playerId não preservado');
if (!imported.players[0].onCourt) throw new Error('starter não preservado');
console.log('livePackageImporter.test.js: OK');
