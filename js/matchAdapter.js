// js/matchAdapter.js
// Canonical data adapter for the Andebol ecosystem.
// Converts the current Andebol-stats GameStore shape into a versioned Match payload.
// This module is intentionally side-effect free: it does NOT change the live app yet.

const SCHEMA_VERSION = '1.0';

function normalizeId(value, fallback = 'unknown') {
    return String(value ?? fallback)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || fallback;
}

function playerId(player) {
    // Temporary legacy identity. The Performance OS will eventually provide
    // the permanent playerId. Keeping this deterministic prevents duplicates
    // while importing the same legacy roster repeatedly.
    return `legacy-player:${normalizeId(player?.Nome, `number-${player?.Numero ?? 'unknown'}`)}`;
}

function teamId(name, side) {
    return `legacy-team:${side}:${normalizeId(name, side)}`;
}

function mapOutcome(outcome) {
    if (outcome === 'goal') return 'goal';
    if (outcome === 'saved') return 'saved';
    if (outcome === 'miss') return 'missed';
    if (outcome === 'blocked') return 'blocked';
    return outcome || 'unknown';
}

function mapPosition(position) {
    if (!position) return undefined;
    return String(position).trim();
}

function mapPlayer(player, teamIdValue) {
    return {
        id: playerId(player),
        name: player?.Nome || '',
        shirtNumber: player?.Numero ?? null,
        position: mapPosition(player?.Posicao),
        teamId: teamIdValue,
        active: true
    };
}

function mapRoster(state) {
    const teamAId = teamId(state.teamAName, 'A');
    const players = state.gameData?.A?.players || [];

    return players
        .filter(Boolean)
        .map(player => ({
            id: `legacy-roster:${playerId(player)}`,
            playerId: playerId(player),
            teamId: teamAId,
            shirtNumber: player?.Numero ?? null,
            position: mapPosition(player?.Posicao),
            starter: Boolean(player?.onCourt),
            available: !Boolean(player?.disqualified),
            timeOnCourt: Number(player?.timeOnCourt || 0)
        }));
}

function mapShots(state) {
    const events = [];
    const players = state.gameData?.A?.players || [];
    const teamAId = teamId(state.teamAName, 'A');
    const teamBId = teamId(state.teamBName, 'B');

    players.forEach(player => {
        (player.history || []).forEach((shot, index) => {
            events.push({
                id: `legacy-shot:A:${playerId(player)}:${index}:${shot.time ?? 0}`,
                matchId: null,
                period: inferPeriod(state, shot.time),
                gameTime: Number(shot.time || 0),
                teamId: teamAId,
                playerId: playerId(player),
                type: 'shot',
                metadata: {
                    shot: {
                        shooterId: playerId(player),
                        zone: shot.zone ?? null,
                        type: shot.type ?? null,
                        outcome: mapOutcome(shot.outcome),
                        x: toNumberOrNull(shot.coords?.x),
                        y: toNumberOrNull(shot.coords?.y),
                        sevenMeter: isSevenMeter(shot.zone),
                        xg: null
                    },
                    source: 'andebol-stats-legacy'
                }
            });
        });
    });

    (state.gameData?.B?.history || []).forEach((shot, index) => {
        events.push({
            id: `legacy-shot:B:${index}:${shot.time ?? 0}`,
            matchId: null,
            period: inferPeriod(state, shot.time),
            gameTime: Number(shot.time || 0),
            teamId: teamBId,
            playerId: null,
            type: 'shot',
            metadata: {
                shot: {
                    shooterId: null,
                    zone: shot.zone ?? null,
                    type: shot.type ?? null,
                    outcome: mapOutcome(shot.outcome),
                    x: toNumberOrNull(shot.coords?.x),
                    y: toNumberOrNull(shot.coords?.y),
                    sevenMeter: isSevenMeter(shot.zone),
                    xg: null
                },
                source: 'andebol-stats-legacy'
            }
        });
    });

    return events;
}

function mapGenericEvents(state) {
    const teamAId = teamId(state.teamAName, 'A');
    const teamBId = teamId(state.teamBName, 'B');

    return (state.gameEvents || []).map((event, index) => {
        const teamIdValue = event.team === 'B' ? teamBId : teamAId;
        const details = String(event.details || '');

        return {
            id: `legacy-event:${index}:${event.time ?? 0}`,
            matchId: null,
            period: inferPeriod(state, event.time),
            gameTime: Number(event.time || 0),
            teamId: teamIdValue,
            playerId: findPlayerIdFromDetails(state, details),
            type: normalizeEventType(event.type),
            metadata: {
                details,
                source: 'andebol-stats-legacy'
            }
        };
    });
}

function findPlayerIdFromDetails(state, details) {
    const players = state.gameData?.A?.players || [];
    const match = players.find(player => {
        const name = String(player?.Nome || '').trim();
        return name && details.includes(name);
    });
    return match ? playerId(match) : null;
}

function normalizeEventType(type) {
    const value = String(type || '').toLowerCase();
    const aliases = {
        '2min': 'sanction',
        'yellow': 'sanction',
        'red': 'sanction',
        'sanction': 'sanction',
        'shot': 'shot',
        'save': 'save',
        'goal': 'shot',
        'turnover': 'turnover',
        'technical_fault': 'technical_fault',
        'assist': 'assist',
        'steal': 'steal',
        'timeout': 'timeout'
    };
    return aliases[value] || value || 'unknown';
}

function inferPeriod(state, seconds) {
    const duration = Number(state.halfDuration || 30) * 60;
    return Number(seconds || 0) >= duration ? 2 : 1;
}

function toNumberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function isSevenMeter(zone) {
    return String(zone || '').toLowerCase().includes('7');
}

function mapStats(state) {
    const teamA = state.gameData?.A?.stats || {};
    const teamB = state.gameData?.B?.stats || {};

    return {
        A: {
            goals: Number(teamA.goals || 0),
            shotsMissed: Number(teamA.misses || 0),
            shotsSaved: Number(teamA.savedShots || 0),
            turnovers: Number(teamA.turnovers || 0),
            technicalFaults: Number(teamA.technical_faults || 0),
            goalkeeperSaves: Number(teamA.gkSaves || 0),
            goalkeeperGoalsAgainst: Number(teamA.gkGoalsAgainst || 0)
        },
        B: {
            goals: Number(teamB.goals || 0),
            shotsMissed: Number(teamB.misses || 0),
            shotsSaved: Number(teamB.savedShots || 0),
            turnovers: Number(teamB.turnovers || 0),
            technicalFaults: Number(teamB.technical_faults || 0),
            goalkeeperSaves: Number(teamB.gkSaves || 0),
            goalkeeperGoalsAgainst: Number(teamB.gkGoalsAgainst || 0)
        }
    };
}

function mapSituations(state) {
    return (state.gameSituationLog || []).map((situation, index) => ({
        id: `legacy-situation:${index}:${situation.startTime ?? 0}`,
        startTime: Number(situation.startTime || 0),
        endTime: situation.endTime == null ? null : Number(situation.endTime),
        teamASituation: situation.situationA || 'equality',
        teamBSituation: situation.situationB || 'equality'
    }));
}

export function createCanonicalMatch(state, options = {}) {
    if (!state || !state.gameData) {
        throw new Error('Estado de jogo inválido.');
    }

    const matchId = options.matchId || `legacy-match:${Date.now()}`;
    const homeTeamId = teamId(state.teamAName, 'A');
    const awayTeamId = teamId(state.teamBName, 'B');

    const shotEvents = mapShots(state).map(event => ({ ...event, matchId }));
    const genericEvents = mapGenericEvents(state).map(event => ({ ...event, matchId }));

    return {
        schemaVersion: SCHEMA_VERSION,
        source: 'andebol-stats',
        match: {
            id: matchId,
            seasonId: options.seasonId || null,
            competitionId: options.competitionId || null,
            date: options.date || null,
            venue: options.venue || null,
            homeTeamId,
            awayTeamId,
            homeTeamName: state.teamAName || '',
            awayTeamName: state.teamBName || '',
            status: state.isRunning ? 'live' : 'finished',
            durationMinutes: Number(state.halfDuration || 30),
            currentPeriod: Number(state.currentGamePart || 1),
            gameTime: Number(state.totalSeconds || 0),
            homeScore: Number(state.gameData.A.stats?.goals || 0),
            awayScore: Number(state.gameData.B.stats?.goals || 0)
        },
        players: (state.gameData.A.players || []).map(player => mapPlayer(player, homeTeamId)),
        roster: mapRoster(state),
        events: [...shotEvents, ...genericEvents].sort((a, b) => a.gameTime - b.gameTime),
        situations: mapSituations(state),
        statistics: mapStats(state),
        legacy: {
            totalSeconds: Number(state.totalSeconds || 0),
            halfDuration: Number(state.halfDuration || 30),
            teamA: state.gameData.A,
            teamB: state.gameData.B
        },
        metadata: {
            adapterVersion: '1.0.0',
            createdAt: new Date().toISOString()
        }
    };
}

export function validateCanonicalMatch(payload) {
    const errors = [];

    if (!payload?.schemaVersion) errors.push('schemaVersion em falta');
    if (!payload?.match?.id) errors.push('match.id em falta');
    if (!payload?.match?.homeTeamId) errors.push('match.homeTeamId em falta');
    if (!payload?.match?.awayTeamId) errors.push('match.awayTeamId em falta');
    if (!Array.isArray(payload?.players)) errors.push('players deve ser um array');
    if (!Array.isArray(payload?.roster)) errors.push('roster deve ser um array');
    if (!Array.isArray(payload?.events)) errors.push('events deve ser um array');
    if (!Array.isArray(payload?.situations)) errors.push('situations deve ser um array');

    return {
        valid: errors.length === 0,
        errors
    };
}

export { SCHEMA_VERSION };
