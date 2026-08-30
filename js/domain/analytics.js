/* Safe analytical primitives. All metrics return null when their denominator is invalid. */
export function safeRate(numerator, denominator) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  return d > 0 ? (n / d) * 100 : null;
}

export function shotMetrics({ goals=0, saved=0, missed=0, post=0, blocked=0 } = {}) {
  const total = goals + saved + missed + post + blocked;
  return {
    total_shots: total,
    shot_efficiency: safeRate(goals, total),
    on_target_rate: safeRate(goals + saved, total),
    on_target_conversion: safeRate(goals, goals + saved),
    blocked_shot_rate: safeRate(blocked, total),
    technical_miss_rate: safeRate(missed + post, total)
  };
}

export function saveRate(saves=0, goalsConceded=0) {
  return safeRate(saves, saves + goalsConceded);
}

export function per10Min(value, minutes) {
  const m = Number(minutes) || 0;
  return m > 0 ? (Number(value) || 0) / m * 10 : null;
}

export function per5Min(value, minutes) {
  const m = Number(minutes) || 0;
  return m > 0 ? (Number(value) || 0) / m * 5 : null;
}

export function possessionEfficiency(goals=0, possessions=0) {
  return safeRate(goals, possessions);
}
