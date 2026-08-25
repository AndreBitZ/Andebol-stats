import { validateHpoMatchFile } from './hpoMatchContract.js';

function normalizePosition(position) {
    if (!position) return '';
    const p = String(position).trim().toUpperCase();
    return ({ GR: 'GR', GK: 'GR', PIV: 'PIV', LE: 'LE', LD: 'LD', PD: 'PD', PE: 'PE', CE: 'CE', CENTRAL: 'CE' })[p] || String(position).trim();
}
function normalizePlayer(player, rosterByPlayer) {
    const roster = rosterByPlayer.get(String(player.id));
    return { id: String(player.id), sourceId: String(player.id), Numero: roster?.shirtNumber ?? player.shirtNumber ?? '', Nome: player.name || player.displayName || '', Posicao: normalizePosition(roster?.position ?? player.position), onCourt: Boolean(roster?.starter), available: roster?.available !== false, timeOnCourt: 0, history: [], positiveActions: [], negativeActions: [], sanctions: { yellow: 0, twoMin: 0, red: 0 } };
}
function normalizeEvent(event) {
    const gameTime = Number(event?.gameTime);
    return { ...event, id: String(event.id), matchId: String(event.matchId), period: event.period === 2 ? 2 : event.period === 1 ? 1 : undefined, gameTime: Number.isFinite(gameTime) ? gameTime : undefined, timestampKnown: event.timestampKnown === true && Number.isFinite(gameTime), videoTimestampSeconds: Number.isFinite(Number(event.videoTimestampSeconds)) ? Number(event.videoTimestampSeconds) : undefined, videoValidated: event.videoValidated === true, playerId: event.playerId ? String(event.playerId) : null, teamId: event.teamId ? String(event.teamId) : null, type: String(event.type || 'unknown') };
}
export function importHpoMatch(payload) {
    if (!validateHpoMatchFile(payload)) throw new Error('Ficheiro HPO-MATCH inválido ou incompatível.');
    const ownId = String(payload.match.ownTeamId || payload.match.homeTeamId || '');
    const opponentId = String(payload.match.homeAway === 'AWAY' ? payload.match.homeTeamId : payload.match.awayTeamId || '');
    const ownName = String(payload.match.ownTeamName || payload.match.homeTeamName || 'Minha Equipa');
    const opponentName = String(payload.match.homeAway === 'AWAY' ? payload.match.homeTeamName : payload.match.awayTeamName || 'Adversário');
    const roster = Array.isArray(payload.roster) ? payload.roster : [];
    const rosterByPlayer = new Map(roster.map(item => [String(item.playerId), item]));
    const statistics = payload.statistics && typeof payload.statistics === 'object' ? payload.statistics : {};
    return { matchId: String(payload.match.id), teamAId: ownId, teamBId: opponentId, teamAName: ownName, teamBName: opponentName, players: payload.players.map(player => normalizePlayer(player, rosterByPlayer)), events: payload.events.map(normalizeEvent), timelineEvents: Array.isArray(payload.timeline) ? payload.timeline : [], videoAnchors: payload.video.anchors || {}, videoClips: payload.video.clips || [], preMatchStats: payload.preMatchStats ?? statistics.preMatch ?? null, metadata: payload.metadata, halfDuration: Number(payload.match.durationMinutes || 30), currentGamePart: payload.match.currentPeriod === 2 ? 2 : 1, totalSeconds: Number(payload.match.gameTime || 0) };
}
export async function loadHpoMatchFile(file) {
    if (!file) throw new Error('Nenhum ficheiro selecionado.');
    let payload; try { payload = JSON.parse(await file.text()); } catch { throw new Error('O ficheiro HPO-MATCH não contém JSON válido.'); }
    return importHpoMatch(payload);
}
