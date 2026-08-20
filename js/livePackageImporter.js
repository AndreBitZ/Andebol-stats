const LIVE_PACKAGE_SCHEMA = '1.1.0';
const SUPPORTED_LIVE_PACKAGE_SCHEMAS = new Set(['1.0.0', '1.0.1', '1.1.0']);

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
    return { ...event, id: String(event.id), matchId: String(event.matchId), period: event.period === 2 ? 2 : 1, gameTime: Number(event.gameTime || 0), teamId: event.teamId ? String(event.teamId) : null, playerId: event.playerId ? String(event.playerId) : null, type: String(event.type || 'unknown'), metadata: { ...(event.metadata || {}), shot: event.type === 'shot' ? { shooterId: shot.shooterId ? String(shot.shooterId) : event.playerId ? String(event.playerId) : null, position: normalizePosition(shot.position), zone: shot.zone ?? null, distance: shot.distance ?? null, type: shot.type ?? null, outcome: shot.outcome ?? null, xg: Number.isFinite(Number(shot.xg)) ? Number(shot.xg) : null } : undefined } };
}

export function validateLivePackage(pkg) {
    const errors = [];
    if (!pkg || typeof pkg !== 'object') errors.push('Pacote inválido.');
    if (!SUPPORTED_LIVE_PACKAGE_SCHEMAS.has(String(pkg?.schemaVersion ?? ''))) errors.push(`Schema não suportado: ${pkg?.schemaVersion ?? 'desconhecido'}. Suportados: ${[...SUPPORTED_LIVE_PACKAGE_SCHEMAS].join(', ')}.`);
    if (!pkg?.match?.id) errors.push('Falta match.id.');
    if (!pkg?.teams?.home?.id && !pkg?.match?.homeTeamId) errors.push('Falta equipa da casa.');
    if (!pkg?.teams?.away?.id && !pkg?.match?.awayTeamId) errors.push('Falta equipa visitante.');
    if (!Array.isArray(pkg?.players)) errors.push('Falta a lista de jogadores.');
    if (Array.isArray(pkg?.players)) { const ids = pkg.players.map(p => String(p.id)); if (new Set(ids).size !== ids.length) errors.push('Existem jogadores duplicados no pacote.'); }
    if (Array.isArray(pkg?.events)) { const ids = pkg.events.map(event => String(event?.id ?? '')).filter(Boolean); if (new Set(ids).size !== ids.length) errors.push('Existem eventos duplicados no pacote.'); }
    return { valid: errors.length === 0, errors };
}

export function importLivePackage(pkg) {
    const validation = validateLivePackage(pkg);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    const home = { id: String(pkg.teams?.home?.id || pkg.match.homeTeamId), name: pkg.teams?.home?.name || pkg.match.homeTeamName || 'Casa' };
    const away = { id: String(pkg.teams?.away?.id || pkg.match.awayTeamId), name: pkg.teams?.away?.name || pkg.match.awayTeamName || 'Fora' };
    const players = pkg.players.map(normalizePlayer);
    const roster = Array.isArray(pkg.roster) ? pkg.roster : [];
    const rosterByPlayer = new Map(roster.map(r => [String(r.playerId), r]));
    const events = Array.isArray(pkg.events) ? pkg.events.map(normalizeEvent) : [];
    return { matchId: String(pkg.match.id), teamA: home, teamB: away, teamAName: home.name, teamBName: away.name, players: players.map(player => ({ ...player, ...(rosterByPlayer.get(player.id) || {}), Numero: rosterByPlayer.get(player.id)?.shirtNumber ?? player.Numero, Posicao: normalizePosition(rosterByPlayer.get(player.id)?.position ?? player.Posicao), onCourt: Boolean(rosterByPlayer.get(player.id)?.starter), history: [], positiveActions: [], negativeActions: [], sanctions: { yellow: 0, twoMin: 0, red: 0 } })), events, metadata: { schemaVersion: String(pkg.schemaVersion), seasonId: pkg.match.seasonId || null, competitionId: pkg.match.competitionId || null, date: pkg.match.date || null, venue: pkg.match.venue || null, homeAway: pkg.match.homeAway || null, source: pkg.source || 'handball-performance-os' } };
}

export function loadLivePackageFromFile(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = () => { try { onSuccess(importLivePackage(JSON.parse(String(reader.result)))); } catch (error) { onError(error instanceof Error ? error : new Error('Não foi possível importar o pacote LIVE.')); } };
    reader.onerror = () => onError(new Error('Não foi possível ler o ficheiro.'));
    reader.readAsText(file);
}

export function attachLivePackageImporter({ fileInput, onImported, onError }) {
    if (!fileInput) throw new Error('fileInput é obrigatório.');
    fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (!file) return; loadLivePackageFromFile(file, onImported, onError); fileInput.value = ''; });
}

export const LIVE_PACKAGE_IMPORT_SCHEMA = LIVE_PACKAGE_SCHEMA;
export { SUPPORTED_LIVE_PACKAGE_SCHEMAS };
