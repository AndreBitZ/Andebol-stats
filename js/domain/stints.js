/* Canonical player on-court stint model. */

export function createStint(input = {}) {
  return {
    stint_id: input.stint_id ?? crypto.randomUUID(),
    match_id: input.match_id ?? null,
    player_id: input.player_id ?? null,
    team_id: input.team_id ?? null,
    position_played: input.position_played ?? null,
    start_timestamp: Number(input.start_timestamp ?? 0) || 0,
    end_timestamp: input.end_timestamp == null ? null : Number(input.end_timestamp),
  };
}

export function stintDurationSeconds(stint, matchDurationSeconds = Infinity) {
  const start = Math.max(0, Number(stint?.start_timestamp) || 0);
  const end = Math.min(matchDurationSeconds, Number(stint?.end_timestamp ?? matchDurationSeconds));
  return Math.max(0, end - start);
}

export function overlapSeconds(stint, blockStart, blockEnd) {
  const start = Math.max(Number(stint.start_timestamp) || 0, blockStart);
  const end = Math.min(Number(stint.end_timestamp ?? blockEnd) || blockEnd, blockEnd);
  return Math.max(0, end - start);
}

export function minutesPlayed(stints, matchDurationSeconds = Infinity) {
  return (stints || []).reduce((sum, stint) => sum + stintDurationSeconds(stint, matchDurationSeconds), 0) / 60;
}

export function minutesPlayedInBlock(stints, blockIndex) {
  const start = blockIndex * 300;
  const end = start + 300;
  return (stints || []).reduce((sum, stint) => sum + overlapSeconds(stint, start, end), 0) / 60;
}

export function actionsPer10Min(actions, minutes) {
  return minutes > 0 ? (Number(actions) || 0) / minutes * 10 : null;
}

export function actionsPer5Min(actions, minutes) {
  return minutes > 0 ? (Number(actions) || 0) / minutes * 5 : null;
}
