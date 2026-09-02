/* One bilateral action pipeline for both teams. */
import { store } from '../state.js';
import { createEvent, SHOT_RESULTS } from './events.js';
import { activeGoalkeeper, registerShot } from './shotEngine.js';
import { canRecordLiveAction } from './matchClock.js';

export const ACTION_TYPES = Object.freeze({
  SHOT: 'SHOT', ASSIST: 'ASSIST', PRE_ASSIST: 'PRE_ASSIST', TURNOVER: 'TURNOVER',
  RECEPTION_ERROR: 'RECEPTION_ERROR', OFFENSIVE_FOUL: 'OFFENSIVE_FOUL', STEAL: 'STEAL',
  INTERCEPTION: 'INTERCEPTION', RECOVERY: 'RECOVERY', DEFENSIVE_BLOCK: 'DEFENSIVE_BLOCK',
  SEVEN_METER_WON: 'SEVEN_METER_WON', SEVEN_METER_CONCEDED: 'SEVEN_METER_CONCEDED',
  TWO_MIN_RECEIVED: 'TWO_MIN_RECEIVED', TWO_MIN_DRAWN: 'TWO_MIN_DRAWN', PASSIVE_WARNING: 'PASSIVE_WARNING',
  PASSIVE_TURNOVER: 'PASSIVE_TURNOVER', GOALKEEPER_SAVE: 'GOALKEEPER_SAVE',
  GOALKEEPER_DISTRIBUTION_SUCCESS: 'GOALKEEPER_DISTRIBUTION_SUCCESS',
  GOALKEEPER_DISTRIBUTION_ERROR: 'GOALKEEPER_DISTRIBUTION_ERROR', GOALKEEPER_ASSIST: 'GOALKEEPER_ASSIST'
});

function player(side, id) {
  return (store.state.gameData[side]?.players || []).find(p => String(p.id ?? p.Numero) === String(id) || String(p.Numero) === String(id));
}

export function recordAction({ side, playerId, action, shotResult = null, goalkeeperId = null, metadata = {} }) {
  const s = store.state;
  const attacking = side === 'B' ? 'B' : 'A';
  const defending = attacking === 'A' ? 'B' : 'A';
  const live = canRecordLiveAction(s, attacking, playerId);
  if (!live.ok) throw new Error(live.reason);
  const p = player(attacking, playerId);
  if (!p) throw new Error('Atleta não encontrado.');

  if (action === ACTION_TYPES.SHOT) {
    if (!SHOT_RESULTS.includes(shotResult)) throw new Error('Resultado de remate inválido.');
    return store.update(next => registerShot(next, {
      attackingSide: attacking, shooterId: p.id, result: shotResult,
      goalkeeperId, ...metadata
    }));
  }

  return store.update(next => {
    const event = createEvent({
      match_id: next.matchId,
      timestamp_seconds: next.totalSeconds,
      team_id: attacking === 'A' ? next.teamAId : next.teamBId,
      player_id: p.id,
      event_type: action,
      score_for_before: next.gameData[attacking]?.stats?.goals || 0,
      score_against_before: next.gameData[defending]?.stats?.goals || 0,
      home_away: attacking === 'A' ? 'HOME' : 'AWAY',
      metadata
    });
    next.gameEvents = next.gameEvents || [];
    next.gameEvents.push(event);
    p[action] = (p[action] || 0) + 1;
    return event;
  });
}

export function currentDefendingGoalkeeper(attackingSide) {
  const defending = attackingSide === 'A' ? 'B' : 'A';
  return activeGoalkeeper(store.state.gameData[defending]);
}
