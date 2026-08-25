import { HPO_MATCH_FORMAT, HPO_MATCH_VERSION, validateHpoMatchFile } from './hpoMatchContract.js';

export function importHpoMatch(payload) {
  if (!validateHpoMatchFile(payload)) {
    throw new Error(`Ficheiro incompatível: esperado ${HPO_MATCH_FORMAT} v${HPO_MATCH_VERSION}.`);
  }
  return {
    match: structuredClone(payload.match),
    players: structuredClone(payload.players),
    roster: structuredClone(payload.roster),
    events: structuredClone(payload.events),
    statistics: structuredClone(payload.statistics),
    timeline: structuredClone(payload.timeline),
    video: structuredClone(payload.video),
    metadata: structuredClone(payload.metadata),
    importedFrom: { format: payload.format, version: payload.version, direction: payload.direction },
  };
}

export async function importHpoMatchFile(file) {
  if (!file || typeof file.text !== 'function') throw new Error('Ficheiro inválido.');
  const payload = JSON.parse(await file.text());
  return importHpoMatch(payload);
}
