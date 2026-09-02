// Match clock domain: single source of truth for official elapsed match time.
import { store } from '../state.js';

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

export function getRequiredPlayers(state, side) {
  const duration = Number(state?.halfDuration) || 30;
  const baseRequired = duration === 25 ? 6 : 7;
  const team = state?.gameData?.[side];
  const players = team?.players || [];
  const suspendedCount = players.filter(p => p.isSuspended).length;
  const teamSuspensionActive = team?.isTeamSuspended ? 1 : 0;
  return Math.max(0, baseRequired - suspendedCount - teamSuspensionActive);
}

export function validateStartingFormation(state, side) {
  const team = state?.gameData?.[side];
  const players = team?.players || [];
  const onCourt = players.filter(p => p.onCourt).length;
  const required = getRequiredPlayers(state, side);
  return { ok: onCourt === required, side, onCourt, required };
}

function installBilateralStartGuard() {
  if (typeof document === 'undefined') return;
  const guard = (event) => {
    const button = event.target?.closest?.('#startBtn');
    if (!button) return;
    const state = store.state;
    const resultA = validateStartingFormation(state, 'A');
    const resultB = validateStartingFormation(state, 'B');
    if (resultA.ok && resultB.ok) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const messages = [];
    if (!resultA.ok) messages.push(`Equipa A: ${resultA.onCourt}/${resultA.required} jogadores em campo.`);
    if (!resultB.ok) messages.push(`Equipa B: ${resultB.onCourt}/${resultB.required} jogadores em campo.`);
    alert(`⚠️ Não é possível iniciar o jogo.\n\n${messages.join('\n')}`);
  };
  document.addEventListener('click', guard, true);
}

installBilateralStartGuard();

export function syncOpenStints(state) {
  const time = Number(state.totalSeconds) || 0;
  state.stints = Array.isArray(state.stints) ? state.stints : [];
  for (const side of ['A', 'B']) {
    for (const player of (state.gameData?.[side]?.players || [])) {
      const open = state.stints.find(s => s.side === side && String(s.playerId) === String(player.id ?? player.Numero) && s.endTime == null);
      if (player.onCourt && !open) state.stints.push({ side, playerId: String(player.id ?? player.Numero), startTime: time, endTime: null });
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

// Sanções temporárias são contadas em tempo oficial de jogo.
// Um vermelho direto mantém o atleta desqualificado, mas a equipa só fica
// reduzida durante os 2 minutos; terminado esse período, pode repor outro atleta.
export function syncSuspensions(state) {
  const now = Number(state?.totalSeconds) || 0;
  let changed = false;
  for (const side of ['A', 'B']) {
    for (const player of (state.gameData?.[side]?.players || [])) {
      if (!player.isSuspended || player.suspensionEndTime == null) continue;
      const remaining = Math.max(0, Number(player.suspensionEndTime) - now);
      if (Number(player.suspensionTimer) !== remaining) {
        player.suspensionTimer = remaining;
        changed = true;
      }
      if (remaining <= 0) {
        player.isSuspended = false;
        player.suspensionTimer = 0;
        changed = true;
      }
    }
  }
  return changed;
}

export function getTeamActiveSuspensions(state, side) {
  return (state?.gameData?.[side]?.players || []).filter(p => p.isSuspended).length;
}

export function getNumericSituation(state) {
  return {
    A: (state.gameData?.A?.players || []).filter(p => p.onCourt).length,
    B: (state.gameData?.B?.players || []).filter(p => p.onCourt).length
  };
}
