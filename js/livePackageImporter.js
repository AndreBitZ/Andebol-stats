const LIVE_PACKAGE_SCHEMA = '1.2.0';
const SUPPORTED_LIVE_PACKAGE_SCHEMAS = new Set(['1.0.0', '1.0.1', '1.1.0', '1.2.0']);

function normalizePosition(position) {
    if (!position) return '';
    const p = String(position).trim().toUpperCase();
    const map = { GR: 'GR', GK: 'GR', PIV: 'PIV', LE: 'LE', LD: 'LD', PD: 'PD', PE: 'PE', CE: 'CE', CENTRAL: 'CE' };
    return map[p] || String(position).trim();
}
function normalizePlayer(player) {
    return { id: String(player.id), Numero: player.shirtNumber ?? '', Nome: player.name || player.displayName || '', Posicao: normalizePosition(player.position), sourceId: String(player.id) };
}
function normalizeEvent(event) {
    const shot = event?.metadata?.shot || {};
    const knownTime = Number.isFinite(Number(event?.gameTime));
    return { ...event, id: String(event.id), matchId: String(event.matchId), period: event.period === 2 ? 2 : event.period === 1 ? 1 : undefined, gameTime: knownTime ? Number(event.gameTime) : undefined, timestampKnown: event.timestampKnown === true && knownTime, videoTimestampSeconds: Number.isFinite(Number(event.videoTimestampSeconds)) ? Number(event.videoTimestampSeconds) : undefined, videoValidated: event.videoValidated === true, teamId: event.teamId ? String(event.teamId) : null, playerId: event.playerId ? String(event.playerId) : null, type: String(event.type || 'unknown'), source: event.source || null, metadata: { ...(event.metadata || {}), shot: event.type === 'shot' ? { shooterId: shot.shooterId ? String(shot.shooterId) : event.playerId ? String(event.playerId) : null, position: normalizePosition(shot.position), zone: shot.zone ?? null, distance: shot.distance ?? null, type: shot.type ?? null, outcome: shot.outcome ?? null, xg: Number.isFinite(Number(shot.xg)) ? Number(shot.xg) : null } : undefined } };
}
export function validateLivePackage(pkg) {
    const errors = [];
    if (!pkg || typeof pkg !== 'object') errors.push('Pacote inválido.');
    if (!SUPPORTED_LIVE_PACKAGE_SCHEMAS.has(String(pkg?.schemaVersion ?? ''))) errors.push(`Schema não suportado: ${pkg?.schemaVersion ?? 'desconhecido'}. Suportados: ${[...SUPPORTED_LIVE_PACKAGE_SCHEMAS].join(', ')}.`);
    if (!pkg?.match?.id) errors.push('Falta match.id.');
    if (!pkg?.match?.ownTeamId && !pkg?.match?.homeTeamId) errors.push('Falta equipa da nossa equipa.');
    if (!pkg?.match?.awayTeamId && !pkg?.teams?.away?.id) errors.push('Falta equipa adversária.');
    if (!Array.isArray(pkg?.players)) errors.push('Falta a lista de jogadores.');
    if (Array.isArray(pkg?.players)) { const ids = pkg.players.map(p => String(p.id)); if (new Set(ids).size !== ids.length) errors.push('Existem jogadores duplicados no pacote.'); }
    if (Array.isArray(pkg?.events)) { const ids = pkg.events.map(event => String(event?.id ?? '')).filter(Boolean); if (new Set(ids).size !== ids.length) errors.push('Existem eventos duplicados no pacote.'); }
    return { valid: errors.length === 0, errors };
}
export function importLivePackage(pkg) {
    const validation = validateLivePackage(pkg); if (!validation.valid) throw new Error(validation.errors.join(' '));
    const ownId = String(pkg.match.ownTeamId || pkg.teams?.home?.id || pkg.match.homeTeamId);
    const opponentId = String(pkg.match.homeAway === 'AWAY' ? pkg.match.homeTeamId : pkg.match.awayTeamId || pkg.teams?.away?.id);
    const ownName = pkg.match.ownTeamName || (pkg.match.homeAway === 'AWAY' ? pkg.match.awayTeamName : pkg.match.homeTeamName) || 'Minha Equipa';
    const opponentName = pkg.match.homeAway === 'AWAY' ? pkg.match.homeTeamName : pkg.match.awayTeamName || 'Adversário';
    const players = pkg.players.map(normalizePlayer); const roster = Array.isArray(pkg.roster) ? pkg.roster : []; const rosterByPlayer = new Map(roster.map(r => [String(r.playerId), r])); const events = Array.isArray(pkg.events) ? pkg.events.map(normalizeEvent) : [];
    return { matchId: String(pkg.match.id), teamA: { id: ownId, name: ownName }, teamB: { id: opponentId, name: opponentName }, teamAId: ownId, teamBId: opponentId, teamAName: ownName, teamBName: opponentName, players: players.map(player => { const r = rosterByPlayer.get(player.id); return { ...player, Numero: r?.shirtNumber ?? player.Numero, Posicao: normalizePosition(r?.position ?? player.Posicao), onCourt: Boolean(r?.starter), available: r?.available !== false, history: [], positiveActions: [], negativeActions: [], sanctions: { yellow: 0, twoMin: 0, red: 0 } }; }), events, preMatchStats: pkg.preMatchStats ?? null, dataQualityLevel: pkg.dataQualityLevel ?? null, dataSources: Array.isArray(pkg.dataSources) ? pkg.dataSources : [], metadata: { schemaVersion: String(pkg.schemaVersion), seasonId: pkg.match.seasonId || null, competitionId: pkg.match.competitionId || null, date: pkg.match.date || null, venue: pkg.match.venue || null, homeAway: pkg.match.homeAway || 'HOME', source: pkg.source || 'handball-performance-os' } };
}
export function loadLivePackageFromFile(file, onSuccess, onError) { const reader = new FileReader(); reader.onload = () => { try { onSuccess(importLivePackage(JSON.parse(String(reader.result)))); } catch (error) { onError(error instanceof Error ? error : new Error('Não foi possível importar o pacote LIVE.')); } }; reader.onerror = () => onError(new Error('Não foi possível ler o ficheiro.')); reader.readAsText(file); }
export function attachLivePackageImporter({ fileInput, onImported, onError }) { if (!fileInput) throw new Error('fileInput é obrigatório.'); fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (!file) return; loadLivePackageFromFile(file, onImported, onError); fileInput.value = ''; }); }
export const LIVE_PACKAGE_IMPORT_SCHEMA = LIVE_PACKAGE_SCHEMA;
export { SUPPORTED_LIVE_PACKAGE_SCHEMAS };