const LIVE_PACKAGE_SCHEMA = '1.0.1';
const SUPPORTED_LIVE_PACKAGE_SCHEMAS = new Set(['1.0.0', '1.0.1']);

function normalizePosition(position) {
    if (!position) return '';
    const p = String(position).trim().toUpperCase();
    const map = { GR: 'GR', GK: 'GR', PIV: 'PIV', LE: 'LE', LD: 'LD', PD: 'PD', PE: 'PE', CE: 'CE', CENTRAL: 'CE' };
    return map[p] || String(position).trim();
}

function normalizePlayer(player) {
    return {
        id: String(player.id),
        Numero: player.shirtNumber ?? '',
        Nome: player.name || player.displayName || '',
        Posicao: normalizePosition(player.position),
        sourceId: String(player.id),
    };
}

export function validateLivePackage(pkg) {
    const errors = [];
    if (!pkg || typeof pkg !== 'object') errors.push('Pacote inválido.');
    if (!SUPPORTED_LIVE_PACKAGE_SCHEMAS.has(String(pkg?.schemaVersion ?? ''))) errors.push(`Schema não suportado: ${pkg?.schemaVersion ?? 'desconhecido'}. Suportados: ${[...SUPPORTED_LIVE_PACKAGE_SCHEMAS].join(', ')}.`);
    if (!pkg?.match?.id) errors.push('Falta match.id.');
    if (!pkg?.teams?.home?.id || !pkg?.teams?.away?.id) errors.push('Faltam as duas equipas.');
    if (!Array.isArray(pkg?.players)) errors.push('Falta a lista de jogadores.');
    if (Array.isArray(pkg?.players)) {
        const ids = pkg.players.map(p => String(p.id));
        if (new Set(ids).size !== ids.length) errors.push('Existem jogadores duplicados no pacote.');
    }
    if (Array.isArray(pkg?.events)) {
        const eventIds = pkg.events.map(event => String(event?.id ?? ''));
        if (eventIds.some(Boolean) && new Set(eventIds.filter(Boolean)).size !== eventIds.filter(Boolean).length) errors.push('Existem eventos duplicados no pacote.');
    }
    return { valid: errors.length === 0, errors };
}

export function importLivePackage(pkg) {
    const validation = validateLivePackage(pkg);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    const home = { id: String(pkg.teams.home.id), name: pkg.teams.home.name || 'Casa' };
    const away = { id: String(pkg.teams.away.id), name: pkg.teams.away.name || 'Fora' };
    const players = pkg.players.map(normalizePlayer);
    const roster = Array.isArray(pkg.roster) ? pkg.roster : [];
    const rosterByPlayer = new Map(roster.map(r => [String(r.playerId), r]));

    return {
        matchId: String(pkg.match.id),
        teamA: home,
        teamB: away,
        teamAName: home.name,
        teamBName: away.name,
        players: players.map(player => ({
            ...player,
            ...(rosterByPlayer.get(player.id) || {}),
            Numero: rosterByPlayer.get(player.id)?.shirtNumber ?? player.Numero,
            Posicao: normalizePosition(rosterByPlayer.get(player.id)?.position ?? player.Posicao),
            onCourt: Boolean(rosterByPlayer.get(player.id)?.starter),
            history: [],
            positiveActions: [],
            negativeActions: [],
            sanctions: { yellow: 0, twoMin: 0, red: 0 },
        })),
        metadata: {
            schemaVersion: String(pkg.schemaVersion),
            seasonId: pkg.match.seasonId || null,
            competitionId: pkg.match.competitionId || null,
            date: pkg.match.date || null,
            venue: pkg.match.venue || null,
            homeAway: pkg.match.homeAway || null,
            source: 'handball-performance-os',
        },
    };
}

export function loadLivePackageFromFile(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const pkg = JSON.parse(String(reader.result));
            onSuccess(importLivePackage(pkg));
        } catch (error) {
            onError(error instanceof Error ? error : new Error('Não foi possível importar o pacote LIVE.'));
        }
    };
    reader.onerror = () => onError(new Error('Não foi possível ler o ficheiro.'));
    reader.readAsText(file);
}

export function attachLivePackageImporter({ fileInput, onImported, onError }) {
    if (!fileInput) throw new Error('fileInput é obrigatório.');
    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        loadLivePackageFromFile(file, onImported, onError);
        fileInput.value = '';
    });
}

export const LIVE_PACKAGE_IMPORT_SCHEMA = LIVE_PACKAGE_SCHEMA;
export { SUPPORTED_LIVE_PACKAGE_SCHEMAS };
