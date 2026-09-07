/* Liga ações consecutivas em sequências/posses para análise posterior. */
import { createEvent } from './events.js';

const POSSESSION_END = new Set([
  'SHOT','TURNOVER','RECEPTION_ERROR','OFFENSIVE_FOUL','PASSIVE_TURNOVER','SEVEN_METER_FOUL'
]);
const NEW_POSSESSION = new Set(['STEAL','INTERCEPTION','RECOVERY']);

function eventSide(event, state) {
  if (!event) return null;
  if (event.team_id && event.team_id === state?.teamAId) return 'A';
  if (event.team_id && event.team_id === state?.teamBId) return 'B';
  const a = state?.gameData?.A?.players || [];
  const b = state?.gameData?.B?.players || [];
  if (a.some(p => String(p.id ?? p.Numero) === String(event.player_id))) return 'A';
  if (b.some(p => String(p.id ?? p.Numero) === String(event.player_id))) return 'B';
  return null;
}

function sequenceEnded(previous, side) {
  if (!previous) return true;
  const previousSide = previous.possession_side || null;
  if (POSSESSION_END.has(previous.event_type)) return true;
  if (previousSide && previousSide !== side && NEW_POSSESSION.has(previous.event_type)) return true;
  if (previousSide && previousSide !== side) return true;
  return false;
}

export function buildSequenceMeta(state, side, action, shotResult = null) {
  const events = Array.isArray(state?.gameEvents) ? state.gameEvents : [];
  const previous = events.length ? events[events.length - 1] : null;
  const previousSide = previous ? (previous.possession_side || eventSide(previous, state)) : null;
  const startsNew = sequenceEnded(previous, side);
  const sequenceId = startsNew
    ? `SEQ_${String(state?.matchId || 'MATCH')}_${events.length + 1}`
    : previous.sequence_id;
  const sequenceIndex = startsNew ? 1 : (Number(previous.sequence_index) || 0) + 1;

  let sequenceType = 'POSSESSION';
  if (action === 'STEAL' || action === 'INTERCEPTION' || action === 'RECOVERY') sequenceType = 'TRANSITION';
  if (action === 'SHOT' && shotResult === 'GOAL') sequenceType = 'ATTACK_GOAL';
  if (action === 'TURNOVER' || action === 'RECEPTION_ERROR' || action === 'PASSIVE_TURNOVER') sequenceType = 'ATTACK_TURNOVER';

  return {
    sequence_id: sequenceId,
    sequence_index: sequenceIndex,
    previous_event_id: previous?.event_id ?? null,
    possession_side: side,
    sequence_type: sequenceType,
    possession_changed: startsNew,
    previous_possession_side: previousSide
  };
}

export function enrichEventWithSequence(event, sequenceMeta) {
  if (!event) return event;
  return Object.assign(event, sequenceMeta || {});
}

export function summarizeSequences(events = []) {
  const groups = new Map();
  for (const event of events) {
    if (!event?.sequence_id) continue;
    if (!groups.has(event.sequence_id)) groups.set(event.sequence_id, []);
    groups.get(event.sequence_id).push(event);
  }
  return [...groups.entries()].map(([sequence_id, items]) => ({
    sequence_id,
    possession_side: items[0]?.possession_side ?? null,
    start_time: items[0]?.timestamp_seconds ?? 0,
    end_time: items[items.length - 1]?.timestamp_seconds ?? 0,
    duration_seconds: Math.max(0, (items[items.length - 1]?.timestamp_seconds ?? 0) - (items[0]?.timestamp_seconds ?? 0)),
    event_count: items.length,
    events: items.map(e => e.event_type),
    outcome: items.some(e => e.event_type === 'SHOT' && e.shot_result === 'GOAL') ? 'GOAL' :
      items.some(e => ['TURNOVER','RECEPTION_ERROR','PASSIVE_TURNOVER'].includes(e.event_type)) ? 'TURNOVER' : 'OTHER'
  }));
}
