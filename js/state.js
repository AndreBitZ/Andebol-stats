// js/state.js - Gestão de Dados e Undo
export class GameStore {
    constructor() { this.state=this.getInitialState(); this.history=[]; this.maxHistory=20; }

    getInitialState(){return {gameData:{A:{stats:{goals:0,misses:0,savedShots:0,turnovers:0,gkSaves:0,gkGoalsAgainst:0,technical_faults:0},players:[],officials:[],fileLoaded:false,teamYellowCards:0,officialsStats:{yellow:0,twoMin:0,red:0},isTeamSuspended:false,teamSuspensionTimer:0,timeouts:{total:3,part1:0,part2:0,taken:[]}},B:{stats:{goals:0,misses:0,savedShots:0,turnovers:0,gkSaves:0,gkGoalsAgainst:0,technical_faults:0,transition_goals:0},players:[],officials:[],fileLoaded:false,teamYellowCards:0,officialsStats:{yellow:0,twoMin:0,red:0},isTeamSuspended:false,teamSuspensionTimer:0,isSuspended:false,suspensionTimer:0,timeouts:{total:3,part1:0,part2:0,taken:[]}}},totalSeconds:0,halfDuration:30,currentGamePart:1,isPassivePlay:false,isOpponent7v6:false,selectedPlayerForAction:null,gameEvents:[],gameSituationLog:[{startTime:0,endTime:null,situationA:'equality',situationB:'equality'}],lastKnownSituations:{A:'equality',B:'equality'},teamAName:'Minha Equipa',teamBName:''};}

    snapshot(){if(this.history.length>=this.maxHistory)this.history.shift();this.history.push(JSON.stringify(this.state));}

    undo(){if(!this.history.length)return null;this.state=JSON.parse(this.history.pop());this.saveToSessionStorage();this.notify();return this.state;}

    update(fn){this.snapshot();fn(this.state);this.saveToSessionStorage();this.notify();}

    loadPlayers(players,officials=[]){this.state.gameData.A.players=Array.isArray(players)?players:[];this.state.gameData.A.officials=Array.isArray(officials)?officials:[];this.state.gameData.A.fileLoaded=true;this.saveToSessionStorage();this.notify();}

    notify(){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('handball:state-updated'));}

    saveToSessionStorage(){try{sessionStorage.setItem('handballGameSession',JSON.stringify(this.state));}catch(e){console.error('Erro a guardar no SessionStorage',e);}}

    loadFromLocalStorage(){
        const saved=sessionStorage.getItem('handballGameSession');
        if(!saved)return false;
        try{
            const parsed=JSON.parse(saved);
            if(!parsed || typeof parsed!=='object' || !parsed.gameData || typeof parsed.gameData!=='object') throw new Error('Sessão inválida.');

            const defaults=this.getInitialState();
            const merge=(base,value)=>{
                if(Array.isArray(base)) return Array.isArray(value)?value:base;
                if(base && typeof base==='object'){
                    const result={...base};
                    if(value && typeof value==='object' && !Array.isArray(value)){
                        Object.keys(value).forEach(key=>{result[key]=key in base?merge(base[key],value[key]):value[key];});
                    }
                    return result;
                }
                return value===undefined?base:value;
            };

            this.state=merge(defaults,parsed);

            for(const side of ['A','B']){
                const team=this.state.gameData[side];
                if(!team)continue;
                if(!Array.isArray(team.players))team.players=[];
                if(!Array.isArray(team.officials))team.officials=[];
                if(typeof team.teamYellowCards!=='number')team.teamYellowCards=0;
                if(!team.officialsStats || typeof team.officialsStats!=='object')team.officialsStats={yellow:0,twoMin:0,red:0};
                if(typeof team.officialsStats.yellow!=='number')team.officialsStats.yellow=0;
                if(typeof team.officialsStats.twoMin!=='number')team.officialsStats.twoMin=0;
                if(typeof team.officialsStats.red!=='number')team.officialsStats.red=0;
                if(typeof team.isTeamSuspended!=='boolean')team.isTeamSuspended=false;
                if(typeof team.teamSuspensionTimer!=='number')team.teamSuspensionTimer=0;
                team.players.forEach(player=>{
                    if(!player.sanctions || typeof player.sanctions!=='object')player.sanctions={yellow:0,twoMin:0,red:0};
                    if(typeof player.sanctions.yellow!=='number')player.sanctions.yellow=0;
                    if(typeof player.sanctions.twoMin!=='number')player.sanctions.twoMin=0;
                    if(typeof player.sanctions.red!=='number')player.sanctions.red=0;
                    if(typeof player.onCourt!=='boolean')player.onCourt=false;
                    if(typeof player.isSuspended!=='boolean')player.isSuspended=false;
                    if(typeof player.disqualified!=='boolean')player.disqualified=false;
                    if(typeof player.suspensionTimer!=='number')player.suspensionTimer=0;
                    if(typeof player.timeOnCourt!=='number')player.timeOnCourt=0;
                    if(!Array.isArray(player.history))player.history=[];
                    if(!Array.isArray(player.positiveActions))player.positiveActions=[];
                    if(!Array.isArray(player.negativeActions))player.negativeActions=[];
                });
            }

            if(!Array.isArray(this.state.gameEvents))this.state.gameEvents=[];
            if(!Array.isArray(this.state.gameSituationLog))this.state.gameSituationLog=defaults.gameSituationLog;
            if(!this.state.lastKnownSituations)this.state.lastKnownSituations={A:'equality',B:'equality'};
            if(this.state.selectedPlayerForAction===undefined)this.state.selectedPlayerForAction=null;

            // Importante: não emitir state-updated durante o bootstrap.
            // Os módulos UI ainda podem não ter terminado de inicializar.
            this.saveToSessionStorage();
            return true;
        }catch(e){
            console.error('Erro a ler dados guardados:',e);
            sessionStorage.removeItem('handballGameSession');
            return false;
        }
    }

    clearStorage(){sessionStorage.removeItem('handballGameSession');}
}

export const store=new GameStore();
import('./canonicalExport.js').catch(e=>console.warn('[Canonical Match] Export bridge indisponível:',e));
import('./canonicalImport.js').catch(e=>console.warn('[Canonical Match] Import bridge indisponível:',e));
import('./domain/events.js').catch(e=>console.warn('[Domain] events indisponível:',e));
import('./domain/stints.js').catch(e=>console.warn('[Domain] stints indisponível:',e));
import('./domain/analytics.js').catch(e=>console.warn('[Domain] analytics indisponível:',e));
import('./domain/numericalSituation.js').catch(e=>console.warn('[Domain] situação numérica indisponível:',e));
import('./ui/awayRosterUI.js').catch(e=>console.warn('[UI] plantel adversário indisponível:',e));
import('./ui/homeRosterUI.js').catch(e=>console.warn('[UI] plantel casa indisponível:',e));
import('./ui/unifiedTeamsUI.js').catch(e=>console.warn('[UI] fluxo unificado indisponível:',e));
import('./ui/bilateralActionBridge.js').catch(e=>console.warn('[UI] ações bilaterais indisponíveis:',e));