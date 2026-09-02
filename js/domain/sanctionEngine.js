/* Canonical live sanction engine. Bilateral, clock-aware and stint-safe. */
import { store } from '../state.js';
import { createEvent } from './events.js';

export const SANCTION_TYPES = Object.freeze({
  YELLOW: 'YELLOW_CARD',
  TWO_MIN: 'TWO_MIN_RECEIVED',
  RED: 'RED_CARD',
  DISQUALIFICATION: 'DISQUALIFICATION'
});

function getPlayer(state, side, playerId) {
  return (state.gameData?.[side]?.players || []).find(p =>
    String(p.id ?? p.Numero) === String(playerId) || String(p.Numero) === String(playerId)
  );
}

function ensurePlayerSanctions(player) {
  if (!player.sanctions) player.sanctions = { yellow: 0, twoMin: 0, red: 0 };
  player.sanctions.yellow = Number(player.sanctions.yellow) || 0;
  player.sanctions.twoMin = Number(player.sanctions.twoMin) || 0;
  player.sanctions.red = Number(player.sanctions.red) || 0;
}

function scoreForSide(state, side) {
  const own = Number(state.gameData?.[side]?.stats?.goals) || 0;
  const other = Number(state.gameData?.[side === 'A' ? 'B' : 'A']?.stats?.goals) || 0;
  return { scoreFor: own, scoreAgainst: other };
}

function closePlayerStint(state, side, playerId, timestamp) {
  const stints = Array.isArray(state.stints) ? state.stints : (state.stints = []);
  const open = stints.find(s => s.side === side && String(s.playerId) === String(playerId) && s.endTime == null);
  if (open) open.endTime = timestamp;
}

export function getSanctionAvailability(state, side, playerId) {
  const player = getPlayer(state, side, playerId);
  if (!player) return { ok: false, reason: 'Jogador não encontrado.' };
  ensurePlayerSanctions(player);
  return {
    ok: true,
    yellow: !player.disqualified && player.sanctions.yellow < 1,
    twoMin: !player.disqualified,
    red: !player.disqualified,
    twoMinCount: player.sanctions.twoMin,
    disqualified: Boolean(player.disqualified),
    suspended: Boolean(player.isSuspended)
  };
}

export function recordSanction({ side, playerId, sanction }) {
  if (!['A', 'B'].includes(side)) throw new Error('Equipa inválida.');
  if (!store.state.isRunning) throw new Error('O jogo está parado.');

  const timestamp = Number(store.state.totalSeconds) || 0;
  let createdEvent = null;

  store.update(state => {
    const player = getPlayer(state, side, playerId);
    if (!player) throw new Error('Jogador não encontrado.');
    ensurePlayerSanctions(player);
    if (player.disqualified) throw new Error('Jogador já desqualificado.');

    const { scoreFor, scoreAgainst } = scoreForSide(state, side);
    const actualPlayerId = String(player.id ?? player.Numero);
    const commonMetadata = {
      sanction,
      team_side: side,
      player_number: player.Numero,
      player_name: player.Nome
    };

    if (sanction === 'yellow') {
      if (player.sanctions.yellow >= 1) throw new Error('Este jogador já recebeu cartão amarelo.');
      player.sanctions.yellow++;
      state.gameData[side].teamYellowCards = (Number(state.gameData[side].teamYellowCards) || 0) + 1;
      createdEvent = createEvent({
        match_id: state.matchId ?? null, timestamp_seconds: timestamp, period: state.currentGamePart,
        team_id: side, player_id: actualPlayerId, event_type: SANCTION_TYPES.YELLOW,
        score_for_before: scoreFor, score_against_before: scoreAgainst,
        home_away: side === 'A' ? 'HOME' : 'AWAY', metadata: commonMetadata
      });
    } else if (sanction === '2min') {
      player.sanctions.twoMin++;
      player.onCourt = false;
      player.isSuspended = true;
      player.suspensionTimer = 120;
      player.suspensionEndTime = timestamp + 120;
      closePlayerStint(state, side, actualPlayerId, timestamp);

      const third = player.sanctions.twoMin >= 3;
      if (third) {
        player.disqualified = true;
        player.sanctions.red++;
      }

      createdEvent = createEvent({
        match_id: state.matchId ?? null, timestamp_seconds: timestamp, period: state.currentGamePart,
        team_id: side, player_id: actualPlayerId,
        event_type: third ? SANCTION_TYPES.DISQUALIFICATION : SANCTION_TYPES.TWO_MIN,
        score_for_before: scoreFor, score_against_before: scoreAgainst,
        home_away: side === 'A' ? 'HOME' : 'AWAY',
        metadata: { ...commonMetadata, two_min_number: player.sanctions.twoMin, automatic_disqualification: third, suspension_end_time: timestamp + 120 }
      });
    } else if (sanction === 'red') {
      player.sanctions.red++;
      player.disqualified = true;
      player.onCourt = false;
      player.isSuspended = true;
      player.suspensionTimer = 120;
      player.suspensionEndTime = timestamp + 120;
      closePlayerStint(state, side, actualPlayerId, timestamp);

      createdEvent = createEvent({
        match_id: state.matchId ?? null, timestamp_seconds: timestamp, period: state.currentGamePart,
        team_id: side, player_id: actualPlayerId, event_type: SANCTION_TYPES.RED,
        score_for_before: scoreFor, score_against_before: scoreAgainst,
        home_away: side === 'A' ? 'HOME' : 'AWAY', metadata: commonMetadata
      });
    } else {
      throw new Error('Sanção inválida.');
    }

    if (!Array.isArray(state.gameEvents)) state.gameEvents = [];
    state.gameEvents.push(createdEvent);
  });

  window.dispatchEvent(new CustomEvent('bilateral-action-recorded', {
    detail: { type: createdEvent.event_type, side, playerId: String(playerId), timestamp }
  }));
  return createdEvent;
}
