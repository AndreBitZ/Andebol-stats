/* Canonical event domain model for Andebol-Stats. */

export const EVENT_TYPES = Object.freeze([
  'SHOT','GOAL','ASSIST','PRE_ASSIST','TURNOVER','RECEPTION_ERROR','OFFENSIVE_FOUL',
  'STEAL','INTERCEPTION','RECOVERY','DEFENSIVE_BLOCK','SEVEN_METER_WON','SEVEN_METER_CONCEDED',
  'TECHNICAL_FAULT','SEVEN_METER_FOUL',
  'TWO_MIN_RECEIVED','TWO_MIN_DRAWN','PASSIVE_WARNING','PASSIVE_TURNOVER',
  'SUBSTITUTION_IN','SUBSTITUTION_OUT',
  'GOALKEEPER_SAVE','GOALKEEPER_DISTRIBUTION_SUCCESS','GOALKEEPER_DISTRIBUTION_ERROR','GOALKEEPER_ASSIST'
]);

export const SHOT_RESULTS = Object.freeze(['GOAL','SAVED','MISSED','POST','BLOCKED']);
export const NUMERICAL_CONTEXTS = Object.freeze([
  'EVEN_6V6','POWERPLAY_6V5','POWERPLAY_6V4','SHORTHANDED_5V6','SHORTHANDED_4V6',
  'EMPTY_GOAL_7V6','EMPTY_GOAL_7V5','OTHER','UNKNOWN'
]);
export const GAME_STATES = Object.freeze(['LEADING','DRAWING','TRAILING']);

export function fiveMinuteBlock(timestampSeconds = 0) {
  const seconds = Math.max(0, Number(timestampSeconds) || 0);
  return Math.floor(seconds / 300);
}

export function halfForTimestamp(timestampSeconds = 0) {
  return (Number(timestampSeconds) || 0) < 1800 ? 'FIRST_HALF' : 'SECOND_HALF';
}

export function createEvent(input = {}) {
  const timestamp = Math.max(0, Number(input.timestamp_seconds ?? input.timestamp ?? 0) || 0);
  const scoreFor = Number(input.score_for_before ?? 0) || 0;
  const scoreAgainst = Number(input.score_against_before ?? 0) || 0;
  const difference = scoreFor - scoreAgainst;
  return {
    event_id: input.event_id ?? crypto.randomUUID(),
    match_id: input.match_id ?? null,
    timestamp_seconds: timestamp,
    period: input.period ?? (timestamp < 1800 ? 1 : 2),
    five_minute_block_index: fiveMinuteBlock(timestamp),
    five_minute_block: fiveMinuteBlockCode(timestamp),
    team_id: input.team_id ?? null,
    player_id: input.player_id ?? null,
    goalkeeper_id: input.goalkeeper_id ?? null,
    event_type: input.event_type ?? null,
    score_for_before: scoreFor,
    score_against_before: scoreAgainst,
    score_difference_before: difference,
    game_state: difference > 0 ? 'LEADING' : difference < 0 ? 'TRAILING' : 'DRAWING',
    numerical_context: input.numerical_context ?? 'UNKNOWN',
    passive_context: input.passive_context ?? 'NO_PASSIVE',
    home_away: input.home_away ?? 'NEUTRAL',
    field_shot_zone: input.field_shot_zone ?? null,
    goal_target_zone: input.goal_target_zone ?? null,
    shot_result: input.shot_result ?? null,
    shot_type: input.shot_type ?? null,
    shot_hand: input.shot_hand ?? null,
    attack_context: input.attack_context ?? null,
    opposition_level: input.opposition_level ?? null,
    metadata: input.metadata ?? {}
  };
}

export function fiveMinuteBlockCode(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const half = s < 1800 ? 'P1' : 'P2';
  const start = Math.floor((s % 1800) / 300) * 5 + (half === 'P2' ? 30 : 0);
  const end = start + 5;
  return `${half}_${String(start).padStart(2,'0')}_${String(end).padStart(2,'0')}`;
}

export function isCrunchTime(event) {
  return Number(event.timestamp_seconds) >= 3000 && Math.abs(Number(event.score_difference_before) || 0) <= 2;
}
