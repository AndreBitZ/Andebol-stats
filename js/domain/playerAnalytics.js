/* Individual player analytics derived from canonical events + on-court stints. */
import { stintDurationSeconds } from './stints.js';
import { safeRate, per10Min } from './analytics.js';

const TURNOVERS = new Set(['TURNOVER','RECEPTION_ERROR','OFFENSIVE_FOUL','PASSIVE_TURNOVER']);

function playerKey(player) { return String(player?.id ?? player?.Numero ?? ''); }
function eventBelongsToPlayer(event, player) { return String(event?.player_id ?? '') === playerKey(player); }

function minutesForPlayer(state, side, player) {
  const id = playerKey(player);
  const teamId = side === 'A' ? state.teamAId : state.teamBId;
  const stints = Array.isArray(state.stints) ? state.stints.filter(stint => {
    const samePlayer = String(stint.playerId ?? stint.player_id ?? '') === id;
    const sameSide = !stint.side || stint.side === side;
    const sameTeam = !stint.team_id || stint.team_id === teamId;
    return samePlayer && sameSide && sameTeam;
  }) : [];
  let seconds = stints.reduce((sum, stint) => sum + stintDurationSeconds({
    start_timestamp: stint.startTime ?? stint.start_timestamp,
    end_timestamp: stint.endTime ?? stint.end_timestamp
  }, Number(state.totalSeconds) || 0), 0);
  if (!seconds) seconds = Number(player.timeOnCourt) || 0;
  return seconds / 60;
}

export function calculatePlayerAnalytics(state = {}, side) {
  const players = state.gameData?.[side]?.players || [];
  const events = Array.isArray(state.gameEvents) ? state.gameEvents : [];
  return players.map(player => {
    const mine = events.filter(e => eventBelongsToPlayer(e, player));
    const shots = mine.filter(e => e.event_type === 'SHOT');
    const goals = shots.filter(e => e.shot_result === 'GOAL').length;
    const saved = shots.filter(e => e.shot_result === 'SAVED').length;
    const missed = shots.filter(e => e.shot_result === 'MISSED').length;
    const post = shots.filter(e => e.shot_result === 'POST').length;
    const blocked = shots.filter(e => e.shot_result === 'BLOCKED').length;
    const turnovers = mine.filter(e => TURNOVERS.has(e.event_type)).length;
    const sanctions = player.sanctions || {};
    const minutes = minutesForPlayer(state, side, player);
    const positive = Array.isArray(player.positiveActions) ? player.positiveActions.length : 0;
    const negative = Array.isArray(player.negativeActions) ? player.negativeActions.length : 0;

    // A saved shot belongs to the goalkeeper defending that shot, not to the shooter.
    // GOALKEEPER_SAVE is also supported for manually recorded goalkeeper actions.
    const goalkeeperSaves = events.filter(e =>
      (e.event_type === 'SHOT' && e.shot_result === 'SAVED' && String(e.goalkeeper_id ?? '') === playerKey(player)) ||
      (e.event_type === 'GOALKEEPER_SAVE' && String(e.player_id ?? '') === playerKey(player))
    ).length;
    const goalkeeperDistributionSuccess = mine.filter(e => e.event_type === 'GOALKEEPER_DISTRIBUTION_SUCCESS').length;
    const goalkeeperDistributionError = mine.filter(e => e.event_type === 'GOALKEEPER_DISTRIBUTION_ERROR').length;
    const assists = mine.filter(e => e.event_type === 'ASSIST').length;
    const steals = mine.filter(e => e.event_type === 'STEAL').length;
    const interceptions = mine.filter(e => e.event_type === 'INTERCEPTION').length;
    const recoveries = mine.filter(e => e.event_type === 'RECOVERY').length;
    const sevenMeterWon = mine.filter(e => e.event_type === 'SEVEN_METER_WON').length;
    return {
      id: playerKey(player), number: player.Numero ?? player.number ?? '', name: player.Nome ?? player.name ?? `Jogador ${playerKey(player)}`,
      minutes, shots: shots.length, goals, saved, missed, post, blocked,
      shotEfficiency: safeRate(goals, shots.length), turnovers, assists, steals, interceptions, recoveries, sevenMeterWon,
      positive, negative, yellow: Number(sanctions.yellow) || 0, twoMin: Number(sanctions.twoMin) || 0, red: Number(sanctions.red) || 0,
      goalkeeperSaves, goalkeeperDistributionSuccess, goalkeeperDistributionError,
      goalsPer10: per10Min(goals, minutes), shotsPer10: per10Min(shots.length, minutes), turnoversPer10: per10Min(turnovers, minutes)
    };
  });
}

export function calculateAllPlayerAnalytics(state = {}) {
  return { A: calculatePlayerAnalytics(state, 'A'), B: calculatePlayerAnalytics(state, 'B') };
}
