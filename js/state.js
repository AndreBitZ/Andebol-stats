// js/state.js - Gestão de Dados e Undo
export class GameStore {
    constructor() { this.state = this.getInitialState(); this.history = []; this.maxHistory = 20; }
    getInitialState() {
        return {
            matchId: null,
            preMatchStats: null,
            gameData: {
                A: { stats: { goals: 0, misses: 0, savedShots: 0, turnovers: 0, gkSaves: 0, gkGoalsAgainst: 0, technical_faults: 0 }, players: [], officials: [], fileLoaded: false, teamYellowCards: 0, officialsStats: { yellow: 0, twoMin: 0, red: 0 }, isTeamSuspended: false, teamSuspensionTimer: 0, timeouts: { total: 3, part1: 0, part2: 0, taken: [] } },
                B: { stats: { goals: 0, misses: 0, savedShots: 0, turnovers: 0, technical_faults: 0, transition_goals: 0, gkSaves: 0, gkGoalsAgainst: 0 }, isSuspended: false, suspensionTimer: 0, timeouts: { total: 3, part1: 0, part2: 0, taken: [] }
            },
            totalSeconds: 0, halfDuration: 30, currentGamePart: 1, isPassivePlay: false, isOpponent7v6: false, isRunning: false,
            videoClockSeconds: null,
            videoClockKnown: false,
            videoAnchors: { firstHalfStart: null, firstHalfEnd: null, secondHalfStart: null, secondHalfEnd: null },
            gameEvents: [], timelineEvents: [], gameSituationLog: [{ startTime: 0, endTime: null, situationA: 'equality', situationB: 'equality' }], lastKnownSituations: { A: 'equality', B: 'equality' }, teamAName: 'Minha Equipa', teamBName: ''
        };
    }
    snapshot() { if (this.history.length >= this.maxHistory) this.history.shift(); this.history.push(JSON.stringify(this.state)); }
    undo() { if (this.history.length === 0) return null; this.state = JSON.parse(this.history.pop()); this.saveToSessionStorage(); return this.state; }
    update(updaterFunction) { this.snapshot(); updaterFunction(this.state); this.saveToSessionStorage(); }
    loadPlayers(players, officials = []) { this.state.gameData.A.players = players; this.state.gameData.A.officials = officials; this.state.gameData.A.fileLoaded = true; this.saveToSessionStorage(); }
    saveToSessionStorage() { try { sessionStorage.setItem('handballGameSession', JSON.stringify(this.state)); } catch (e) { console.error('Erro a guardar dados no SessionStorage', e); } }
    loadFromLocalStorage() {
        const saved = sessionStorage.getItem('handballGameSession');
        if (saved) {
            try {
                this.state = JSON.parse(saved);
                if (!Array.isArray(this.state.timelineEvents)) this.state.timelineEvents = [];
                if (!this.state.gameData.A.officialsStats) this.state.gameData.A.officialsStats = { yellow: 0, twoMin: 0, red: 0 };
                if (!('preMatchStats' in this.state)) this.state.preMatchStats = null;
                if (!('videoClockSeconds' in this.state)) this.state.videoClockSeconds = null;
                if (!('videoClockKnown' in this.state)) this.state.videoClockKnown = false;
                if (!this.state.videoAnchors || typeof this.state.videoAnchors !== 'object') this.state.videoAnchors = { firstHalfStart: null, firstHalfEnd: null, secondHalfStart: null, secondHalfEnd: null };
                for (const key of ['firstHalfStart', 'firstHalfEnd', 'secondHalfStart', 'secondHalfEnd']) if (!(key in this.state.videoAnchors)) this.state.videoAnchors[key] = null;
                return true;
            } catch (e) { console.error('Erro a ler dados guardados, a reiniciar...', e); return false; }
        }
        return false;
    }
    clearStorage() { sessionStorage.removeItem('handballGameSession'); }
}

export const store = new GameStore();
import('./canonicalExport.js').catch(error => console.warn('[Canonical Match] Export bridge indisponível:', error));
import('./canonicalImport.js').catch(error => console.warn('[Canonical Match] Import bridge indisponível:', error));
import('./clockTimelineRuntime.js').catch(error => console.warn('[Clock Timeline] Runtime indisponível:', error));
import('./preMatchStatsView.js').catch(error => console.warn('[Pré-jogo] Painel indisponível:', error));