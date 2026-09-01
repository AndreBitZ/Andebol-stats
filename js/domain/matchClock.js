// Match clock domain: single source of truth for official elapsed match time.
// UI/timer adapters can call tick() while the GameTimer is running.

export const HALF_DURATION = 30 * 60;

export function isClockRunning(state) {
  return state?.isRunning === true;
}

export function canRecordLiveAction(state, side, playerId) {
  if (!isClockRunning(state)) return { ok: false, reason: 'O jogo está parado.' };
  const players = state?.gameData?.[side]?.players || [];
  const player = players.find(p => String(p.id ?? p.Numero) === String(playerId) || String(p.Numero) === String(playerId));
  if (!player) return { ok: false, reason: 'Jogador não encontrado.' };
  if (!player.onCourt) return { ok: false, reason: 'O jogador não está em campo.' };
  if (player.disqualified || player.isSuspended) return { ok: false, reason: 'O jogador não pode participar neste momento.' };
  return { ok: true, player };
}

export function syncOpenStints(state) {
  const time = Number(state.totalSeconds) || 0;
  state.stints = Array.isArray(state.stints) ? state.stints : [];
  for (const side of ['A', 'B']) {
    for (const player of (state.gameData?.[side]?.players || [])) {
      const open = state.stints.find(s => s.side === side && String(s.playerId) === String(player.id ?? player.Numero) && s.endTime == null);
      if (player.onCourt && !open) {
        state.stints.push({ side, playerId: String(player.id ?? player.Numero), startTime: time, endTime: null });
      }
      if (!player.onCourt && open) open.endTime = time;
    }
  }
}

export function closeAllOpenStints(state, time = state.totalSeconds) {
  state.stints = Array.isArray(state.stints) ? state.stints : [];
  for (const stint of state.stints) if (stint.endTime == null) stint.endTime = Number(time) || 0;
}

export function getPlayerSeconds(state, side, playerId) {
  const now = Number(state.totalSeconds) || 0;
  return (state.stints || []).filter(s => s.side === side && String(s.playerId) === String(playerId))
    .reduce((sum, s) => sum + Math.max(0, (s.endTime ?? now) - s.startTime), 0);
}
