// Domínio canónico do jogo. Mantemos JavaScript ES Modules para não quebrar a app atual,
// mas usamos contratos explícitos e funções puras para preparar uma migração gradual para TypeScript.

export const TEAM_SIDE = Object.freeze({ HOME: 'HOME', AWAY: 'AWAY' });

export function normalizeTeamId(value) {
  return value == null ? '' : String(value).trim();
}

export function normalizePlayerRecord(player, fallbackTeamId = '') {
  const teamId = normalizeTeamId(player?.teamId || fallbackTeamId);
  return {
    id: String(player?.id ?? crypto.randomUUID()),
    sourceId: String(player?.sourceId ?? player?.id ?? ''),
    teamId,
    Numero: player?.Numero ?? player?.shirtNumber ?? '',
    Nome: String(player?.Nome ?? player?.name ?? player?.displayName ?? '').trim(),
    Posicao: String(player?.Posicao ?? player?.position ?? '').trim(),
    onCourt: Boolean(player?.onCourt),
    available: player?.available !== false,
    performanceScore: Number(player?.performanceScore ?? player?.hpi?.score ?? 0),
    hpi: player?.hpi ?? null,
    history: Array.isArray(player?.history) ? player.history : [],
    positiveActions: Array.isArray(player?.positiveActions) ? player.positiveActions : [],
    negativeActions: Array.isArray(player?.negativeActions) ? player.negativeActions : [],
    sanctions: player?.sanctions ?? { yellow: 0, twoMin: 0, red: 0 }
  };
}

export function splitPlayersByTeam(players, homeTeamId, awayTeamId) {
  const homeId = normalizeTeamId(homeTeamId);
  const awayId = normalizeTeamId(awayTeamId);
  const home = [];
  const away = [];
  const invalid = [];

  for (const raw of Array.isArray(players) ? players : []) {
    const player = normalizePlayerRecord(raw);
    if (player.teamId === homeId) home.push(player);
    else if (player.teamId === awayId) away.push(player);
    else invalid.push(player);
  }

  return { home, away, invalid };
}

export function createMatchRoster(players, homeTeamId, awayTeamId) {
  const split = splitPlayersByTeam(players, homeTeamId, awayTeamId);
  if (split.invalid.length) {
    throw new Error(`Existem ${split.invalid.length} atleta(s) sem uma equipa válida neste jogo.`);
  }
  return split;
}
