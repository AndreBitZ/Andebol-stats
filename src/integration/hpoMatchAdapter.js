import { HPO_MATCH_FORMAT, HPO_MATCH_VERSION, validateHpoMatchFile } from './hpoMatchContract.js';

export function fromAndebolStats(match, options = {}) {
  const payload = {
    format: HPO_MATCH_FORMAT,
    version: HPO_MATCH_VERSION,
    direction: 'ANDEBOL_STATS_TO_PERFORMANCE_OS',
    exportedAt: new Date().toISOString(),
    match: match?.match ?? match ?? {},
    players: match?.players ?? [],
    roster: match?.roster ?? [],
    events: match?.events ?? [],
    statistics: match?.statistics ?? {},
    timeline: match?.timeline ?? [],
    video: { anchors: match?.video?.anchors ?? {}, clips: match?.video?.clips ?? [] },
    metadata: { source: 'andebol-stats', sourceVersion: options.sourceVersion, dataSources: options.dataSources ?? ['andebol-stats'] }
  };
  return payload;
}

export function toAndebolStats(payload) {
  if (!validateHpoMatchFile(payload)) throw new Error('INVALID_HPO_MATCH_FILE');
  return { match: payload.match, players: payload.players, roster: payload.roster, events: payload.events, statistics: payload.statistics, timeline: payload.timeline, video: payload.video };
}

export function validateAdapterPayload(payload) {
  return validateHpoMatchFile(payload);
}
