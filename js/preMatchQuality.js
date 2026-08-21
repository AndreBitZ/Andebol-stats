export function metricAvailability(value) {
  return value === null || value === undefined ? 'UNKNOWN' : 'KNOWN';
}

export function formatMetric(value) {
  return metricAvailability(value) === 'UNKNOWN' ? '—' : String(value);
}

export function describeDataQuality(level) {
  return ({ 0: 'Ficha de jogo', 1: 'Estatística manual', 2: 'Andebol-Stats', 3: 'Vídeo' })[Number(level)] || 'Desconhecido';
}
