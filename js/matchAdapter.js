// js/matchAdapter.js
// Canonical data adapter for the Andebol ecosystem.
// Converts the current Andebol-stats GameStore shape into the versioned Match payload.

import { calculatePlayerHpi } from './hpi.js';

const SCHEMA_VERSION = '1.2.0';

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
    return String(player?.sourceId || player?.id || `legacy-player:${normalizeId(player?.Nome, `number-${player?.Numero ?? 'unknown'}`)}`);
}

function teamId(team, side) {
    return String(team?.id || `legacy-team:${side}:${normalizeId(team?.name, side)}`);
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
    const hpi = calculatePlayerHpi(player);
    return {
        id: playerId(player),
        name: player?.Nome || '',
        shirtNumber: player?.Numero ?? null,
        position: mapPosition(player?.Posicao),
        teamId: teamIdValue,
        active: true,
        hpi: {
            score: hpi.score,
            positivePoints: hpi.positivePoints,
            negativePoints: hpi.negativePoints,
            positiveActions: hpi.positiveActions,
            negativeActions: hpi.negativeActions,
            shots: hpi.shots,
            ratePer60: hpi.ratePer60,
            version: hpi.version,
            source: 'ANDEBOL_STATS',
            sampleSize: hpi.sampleSize,
            updatedAt: new Date().toISOString()
        }
    };
}

function mapRoster(state, teamAId) {
    const players = state.gameData?.A?.players || [];
    return players.filter(Boolean).map(player => ({
        id: `roster:${playerId(player)}`,
        playerId: playerId(player),
        teamId: teamAId,
        shirtNumber: player?.Numero ?? null,
        position: mapPosition(player?.Posicao),
        starter: Boolean(player?.onCourt),
        available: !Boolean(player?.disqualified),
        timeOnCourt: Number(player?.timeOnCourt || 0)
    }));
}

function mapShotHistory(history, teamIdValue, playerIdValue, prefix) {
    return (history || []).map((shot, index) => ({
        id: `${prefix}:${playerIdValue || 'team'}:${index}:${shot.time ?? 0}`,
        matchId: null,
        period: inferPeriodFromTime(shot.time, 30),
        gameTime: Number(shot.time || 0),
        teamId: teamIdValue,
        playerId: playerIdValue,
        type: 'shot',
        metadata: {
            shot: {
                shooterId: playerIdValue,
                position: shot.position ?? null,
                zone: shot.zone ?? null,
                distance: shot.distance ?? null,
                type: shot.type ?? null,
                outcome: mapOutcome(shot.outcome),
                x: toNumberOrNull(shot.coords?.x),
                y: toNumberOrNull(shot.coords?.y),
                sevenMeter: isSevenMeter(shot.zone),
                xg: toNumberOrNull(shot.xg)
            },
            source: 'andebol-stats'
        }
    }));
}

function mapShots(state, teamAId, teamBId) {
    const players = state.gameData?.A?.players || [];
    const events = [];
    players.forEach(player => events.push(...mapShotHistory(player.history, teamAId, playerId(player), 'shot:A')));
    events.push(...mapShotHistory(state.gameData?.B?.history, teamBId, null, 'shot:B'));
    return events;
}

function mapGenericEvents(state, teamAId, teamBId) {
    return (state.gameEvents || [])
        .filter(event => normalizeEventType(event.type) !== 'shot')
        .map((event, index) => {
            const teamIdValue = event.team === 'B' ? teamBId : teamAId;
            const details = String(event.details || '');
            const playerIdValue = findPlayerIdFromDetails(state, details);
            return {
                id: `event:${index}:${event.time ?? 0}`,
                matchId: null,
                period: inferPeriod(state, event.time),
                gameTime: Number(event.time || 0),
                teamId: teamIdValue,
                playerId: playerIdValue,
                type: normalizeEventType(event.type),
                metadata: { details, action: normalizeAction(event.type, details), source: 'andebol-stats' }
            };
        });
}

function normalizeAction(type, details) {
    const raw = String(type || '').toLowerCase();
    if (raw === 'sanction') {
        const match = String(details || '').match(/:\s*(yellow|2min|red)\b/i);
        return match ? match[1].toLowerCase() : null;
    }
    return ['assist', 'steal', 'technical_fault', 'turnover'].includes(raw) ? raw : null;
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

function inferPeriodFromTime(seconds, halfDurationMinutes) {
    const duration = Number(halfDurationMinutes || 30) * 60;
    return Number(seconds || 0) >= duration ? 2 : 1;
}

function inferPeriod(state, seconds) {
    return inferPeriodFromTime(seconds, state.halfDuration || 30);
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
        id: `situation:${index}:${situation.startTime ?? 0}`,
        startTime: Number(situation.startTime || 0),
        endTime: situation.endTime == null ? null : Number(situation.endTime),
        teamASituation: situation.situationA || 'equality',
        teamBSituation: situation.situationB || 'equality'
    }));
}

export function createCanonicalMatch(state, options = {}) {
    if (!state || !state.gameData) throw new Error('Estado de jogo inválido.');

    const matchId = options.matchId || state.matchId || `legacy-match:${Date.now()}`;
    const teamAId = teamId(state.teamA, 'A');
    const teamBId = teamId(state.teamB, 'B');
    const homeAway = state.metadata?.homeAway === 'AWAY' ? 'AWAY' : state.metadata?.homeAway === 'NEUTRAL' ? 'NEUTRAL' : 'HOME';
    const homeTeamId = homeAway === 'AWAY' ? teamBId : teamAId;
    const awayTeamId = homeAway === 'AWAY' ? teamAId : teamBId;
    const homeTeamName = homeAway === 'AWAY' ? state.teamBName || 'Adversário' : state.teamAName || 'Minha Equipa';
    const awayTeamName = homeAway === 'AWAY' ? state.teamAName || 'Minha Equipa' : state.teamBName || 'Adversário';

    const shotEvents = mapShots(state, teamAId, teamBId).map(event => ({ ...event, matchId }));
    const genericEvents = mapGenericEvents(state, teamAId, teamBId).map(event => ({ ...event, matchId }));

    return {
        schemaVersion: SCHEMA_VERSION,
        source: 'andebol-stats',
        match: {
            id: matchId,
            seasonId: options.seasonId || state.metadata?.seasonId || '',
            competitionId: options.competitionId || state.metadata?.competitionId || null,
            date: options.date || state.metadata?.date || new Date().toISOString(),
            venue: options.venue || state.metadata?.venue || null,
            homeTeamId,
            awayTeamId,
            homeTeamName,
            awayTeamName,
            ownTeamId: teamAId,
            ownTeamName: state.teamAName || 'Minha Equipa',
            homeAway,
            status: state.isRunning ? 'live' : 'finished',
            durationMinutes: Number(state.halfDuration || 30),
            currentPeriod: Number(state.currentGamePart || 1) === 2 ? 2 : 1,
            gameTime: Number(state.totalSeconds || 0),
            homeScore: homeAway === 'AWAY' ? Number(state.gameData.B.stats?.goals || 0) : Number(state.gameData.A.stats?.goals || 0),
            awayScore: homeAway === 'AWAY' ? Number(state.gameData.A.stats?.goals || 0) : Number(state.gameData.B.stats?.goals || 0)
        },
        players: (state.gameData.A.players || []).map(player => mapPlayer(player, teamAId)),
        roster: mapRoster(state, teamAId),
        events: [...shotEvents, ...genericEvents].sort((a, b) => a.gameTime - b.gameTime),
        situations: mapSituations(state),
        statistics: {
            A: mapStats(state).A,
            B: mapStats(state).B,
            hpi: (state.gameData.A.players || []).map(player => ({ playerId: playerId(player), ...calculatePlayerHpi(player) }))
        },
        legacy: { totalSeconds: Number(state.totalSeconds || 0), halfDuration: Number(state.halfDuration || 30) },
        metadata: { adapterVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString() }
    };
}

export function validateCanonicalMatch(payload) {
    const errors = [];
    if (payload?.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion inválido: ${payload?.schemaVersion || 'em falta'}`);
    if (!payload?.source) errors.push('source em falta');
    if (!payload?.match?.id) errors.push('match.id em falta');
    if (!payload?.match?.homeTeamId) errors.push('match.homeTeamId em falta');
    if (!payload?.match?.awayTeamId) errors.push('match.awayTeamId em falta');
    if (!payload?.match?.ownTeamId) errors.push('match.ownTeamId em falta');
    if (!payload?.match?.homeAway) errors.push('match.homeAway em falta');
    if (!Array.isArray(payload?.players)) errors.push('players deve ser um array');
    if (!Array.isArray(payload?.roster)) errors.push('roster deve ser um array');
    if (!Array.isArray(payload?.events)) errors.push('events deve ser um array');
    if (!Array.isArray(payload?.situations)) errors.push('situations deve ser um array');
    if (!Array.isArray(payload?.statistics?.hpi)) errors.push('statistics.hpi deve ser um array');

    const eventIds = new Set();
    (payload?.events || []).forEach((event, index) => {
        if (!event?.id) errors.push(`events[${index}].id em falta`);
        else if (eventIds.has(event.id)) errors.push(`ID de evento duplicado: ${event.id}`);
        else eventIds.add(event.id);
        if (!event?.type) errors.push(`events[${index}].type em falta`);
        if (!event?.teamId) errors.push(`events[${index}].teamId em falta`);
        if (!Number.isFinite(Number(event?.gameTime))) errors.push(`events[${index}].gameTime inválido`);
    });

    const playerIds = new Set();
    (payload?.players || []).forEach((player, index) => {
        if (!player?.id) errors.push(`players[${index}].id em falta`);
        else if (playerIds.has(player.id)) errors.push(`ID de jogador duplicado: ${player.id}`);
        else playerIds.add(player.id);
        if (!Number.isFinite(Number(player?.hpi?.score))) errors.push(`players[${index}].hpi.score inválido`);
    });

    return { valid: errors.length === 0, errors };
}

export { SCHEMA_VERSION };
