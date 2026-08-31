// js/state.js - Gestão de Dados e Undo
export class GameStore {
    constructor() { this.state=this.getInitialState(); this.history=[]; this.maxHistory=20; }
    getInitialState(){return {gameData:{A:{stats:{goals:0,misses:0,savedShots:0,turnovers:0,gkSaves:0,gkGoalsAgainst:0,technical_faults:0},players:[],officials:[],fileLoaded:false,teamYellowCards:0,officialsStats:{yellow:0,twoMin:0,red:0},isTeamSuspended:false,teamSuspensionTimer:0,timeouts:{total:3,part1:0,part2:0,taken:[]}},B:{stats:{goals:0,misses:0,savedShots:0,turnovers:0,technical_faults:0,transition_goals:0,gkSaves:0,gkGoalsAgainst:0},players:[],officials:[],fileLoaded:false,isSuspended:false,suspensionTimer:0,timeouts:{total:3,part1:0,part2:0,taken:[]}}},totalSeconds:0,halfDuration:30,currentGamePart:1,isPassivePlay:false,isOpponent7v6:false,selectedPlayerForAction:null,gameEvents:[],gameSituationLog:[{startTime:0,endTime:null,situationA:'equality',situationB:'equality'}],lastKnownSituations:{A:'equality',B:'equality'},teamAName:'Minha Equipa',teamBName:''};}
    snapshot(){if(this.history.length>=this.maxHistory)this.history.shift();this.history.push(JSON.stringify(this.state));}
    undo(){if(!this.history.length)return null;this.state=JSON.parse(this.history.pop());this.saveToSessionStorage();this.notify();return this.state;}
    update(fn){this.snapshot();fn(this.state);this.saveToSessionStorage();this.notify();}
    loadPlayers(players,officials=[]){this.state.gameData.A.players=Array.isArray(players)?players:[];this.state.gameData.A.officials=Array.isArray(officials)?officials:[];this.state.gameData.A.fileLoaded=true;this.saveToSessionStorage();this.notify();}
    notify(){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('handball:state-updated'));}
    saveToSessionStorage(){try{sessionStorage.setItem('handballGameSession',JSON.stringify(this.state));}catch(e){console.error('Erro a guardar no SessionStorage',e);}}
    loadFromLocalStorage(){const saved=sessionStorage.getItem('handballGameSession');if(!saved)return false;try{this.state=JSON.parse(saved);if(!this.state.gameData.A.officialsStats)this.state.gameData.A.officialsStats={yellow:0,twoMin:0,red:0};if(!Array.isArray(this.state.gameData.A.players))this.state.gameData.A.players=[];if(!Array.isArray(this.state.gameData.B.players))this.state.gameData.B.players=[];if(!Array.isArray(this.state.gameData.B.officials))this.state.gameData.B.officials=[];if(!Object.prototype.hasOwnProperty.call(this.state,'selectedPlayerForAction'))this.state.selectedPlayerForAction=null;this.notify();return true;}catch(e){console.error('Erro a ler dados guardados, a reiniciar...',e);return false;}}
    clearStorage(){sessionStorage.removeItem('handballGameSession');}
}
export const store=new GameStore();
import('./canonicalExport.js').catch(e=>console.warn('[Canonical Match] Export bridge indisponível:',e));
import('./canonicalImport.js').catch(e=>console.warn('[Canonical Match] Import bridge indisponível:',e));
import('./domain/events.js').catch(e=>console.warn('[Domain] events indisponível:',e));
import('./domain/stints.js').catch(e=>console.warn('[Domain] stints indisponível:',e));
import('./domain/analytics.js').catch(e=>console.warn('[Domain] analytics indisponível:',e));
import('./ui/awayRosterUI.js').catch(e=>console.warn('[UI] plantel adversário indisponível:',e));
import('./ui/homeRosterUI.js').catch(e=>console.warn('[UI] plantel casa indisponível:',e));
import('./ui/unifiedTeamsUI.js').catch(e=>console.warn('[UI] fluxo unificado indisponível:',e));
