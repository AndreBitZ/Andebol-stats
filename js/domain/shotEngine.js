/* Bilateral shot engine: one shot event updates attacker, defender and the active goalkeeper. */
import { createEvent } from './events.js';

function findPlayer(team, id) {
  return (team?.players || []).find(p => String(p.id ?? p.Numero) === String(id) || String(p.Numero) === String(id)) || null;
}

export function activeGoalkeeper(team) {
  return (team?.players || []).find(p => (p.Posicao === 'GR' || p.position === 'GR' || p.position === 'GK') && p.onCourt !== false && !p.disqualified) || null;
}

export function registerShot(state, { attackingSide, shooterId, result, goalkeeperId = null, ...meta }) {
  const attackSide = attackingSide === 'B' ? 'B' : 'A';
  const defendSide = attackSide === 'A' ? 'B' : 'A';
  const attack = state.gameData[attackSide];
  const defend = state.gameData[defendSide];
  const shooter = findPlayer(attack, shooterId);
  const goalkeeper = goalkeeperId ? findPlayer(defend, goalkeeperId) : activeGoalkeeper(defend);
  if (!shooter) throw new Error('Atleta rematador não encontrado.');
  const shot = createEvent({
    match_id: state.matchId,
    timestamp_seconds: state.totalSeconds,
    team_id: attack.teamId ?? (attackSide === 'A' ? state.teamAId : state.teamBId),
    player_id: shooter.id,
    goalkeeper_id: goalkeeper?.id ?? null,
    event_type: 'SHOT',
    shot_result: result,
    score_for_before: attack.stats?.goals ?? 0,
    score_against_before: defend.stats?.goals ?? 0,
    home_away: attackSide === 'A' ? 'HOME' : 'AWAY',
    ...meta
  });
  state.gameEvents = state.gameEvents || [];
  state.gameEvents.push(shot);
  attack.stats = attack.stats || {};
  defend.stats = defend.stats || {};
  attack.stats.shots = (attack.stats.shots || 0) + 1;
  if (result === 'GOAL') {
    attack.stats.goals = (attack.stats.goals || 0) + 1;
    shooter.goals = (shooter.goals || 0) + 1;
    if (goalkeeper) goalkeeper.goalsConceded = (goalkeeper.goalsConceded || 0) + 1;
  } else if (result === 'SAVED') {
    attack.stats.savedShots = (attack.stats.savedShots || 0) + 1;
    if (goalkeeper) goalkeeper.saves = (goalkeeper.saves || 0) + 1;
  } else if (result === 'MISSED' || result === 'POST') {
    attack.stats.misses = (attack.stats.misses || 0) + 1;
  } else if (result === 'BLOCKED') {
    attack.stats.blocked = (attack.stats.blocked || 0) + 1;
  }
  return { shot, goalkeeper };
}
