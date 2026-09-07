/* Live numerical situation and its duration log. */
import { store } from '../state.js';

function effectiveOnCourt(state, side) {
  return (state?.gameData?.[side]?.players || []).filter(p =>
    p.onCourt && !p.disqualified && !p.isSuspended
  ).length;
}

export function getNumericalSituation(state, side) {
  const players = state?.gameData?.[side]?.players || [];
  const onCourt = players.filter(p => p.onCourt && !p.disqualified && !p.isSuspended).length;
  const suspended = players.filter(p => p.isSuspended && !p.disqualified).length;
  const disqualified = players.filter(p => p.disqualified).length;
  return { onCourt, suspended, disqualified };
}

export function getNumericalContext(state, attackingSide) {
  const own = effectiveOnCourt(state, attackingSide);
  const otherSide = attackingSide === 'A' ? 'B' : 'A';
  const other = effectiveOnCourt(state, otherSide);

  if (own === other) return `EVEN_${own}V${other}`;
  if (own > other) return `POWERPLAY_${own}V${other}`;
  return `SHORTHANDED_${own}V${other}`;
}

export function getMatchNumericalSituation(state) {
  return { A: getNumericalSituation(state, 'A'), B: getNumericalSituation(state, 'B') };
}

export function syncNumericalSituationLog(state) {
  const now = Math.max(0, Number(state?.totalSeconds) || 0);
  if (!Array.isArray(state.gameSituationLog) || state.gameSituationLog.length === 0) {
    state.gameSituationLog = [{ startTime: now, endTime: null, situationA: '7V7', situationB: '7V7' }];
  }

  const situationA = `${effectiveOnCourt(state, 'A')}V${effectiveOnCourt(state, 'B')}`;
  const situationB = `${effectiveOnCourt(state, 'B')}V${effectiveOnCourt(state, 'A')}`;
  const last = state.gameSituationLog[state.gameSituationLog.length - 1];

  if (!last || last.situationA !== situationA || last.situationB !== situationB) {
    if (last && last.endTime == null && now >= Number(last.startTime || 0)) last.endTime = now;
    state.gameSituationLog.push({ startTime: now, endTime: null, situationA, situationB });
    state.lastKnownSituations = { A: situationA, B: situationB };
    return true;
  }
  return false;
}

function escape(value) { return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }

export function renderNumericalSituation(state, container) {
  if (!container) return;
  const { A, B } = getMatchNumericalSituation(state);
  const labelA = escape(state?.teamAName || 'Equipa A');
  const labelB = escape(state?.teamBName || 'Equipa B');
  const tone = (n) => n < 7 ? 'text-yellow-300' : n === 7 ? 'text-green-300' : 'text-red-300';
  const detailA = A.suspended > 0 ? ` · ${A.suspended} suspensão(ões)` : '';
  const detailB = B.suspended > 0 ? ` · ${B.suspended} suspensão(ões)` : '';
  container.innerHTML = `<div class="rounded-xl bg-gray-900 px-4 py-3 border border-gray-700"><div class="flex items-center justify-center gap-4"><div class="text-right min-w-0"><div class="text-[11px] text-gray-400 truncate">${labelA}${escape(detailA)}</div><div class="text-2xl font-black ${tone(A.onCourt)}">${A.onCourt}</div></div><div class="text-gray-500 font-bold">×</div><div class="text-left min-w-0"><div class="text-[11px] text-gray-400 truncate">${labelB}${escape(detailB)}</div><div class="text-2xl font-black ${tone(B.onCourt)}">${B.onCourt}</div></div></div><div class="text-center text-[11px] text-gray-500 mt-1">SITUAÇÃO NUMÉRICA</div></div>`;
}

function ensureContainer() {
  const timer = document.getElementById('timer');
  if (!timer?.parentElement?.parentElement) return null;
  let container = document.getElementById('numerical-situation-live');
  if (container) return container;
  container = document.createElement('div');
  container.id = 'numerical-situation-live';
  container.className = 'mt-3';
  timer.parentElement.parentElement.insertBefore(container, timer.parentElement.nextSibling);
  return container;
}

function install() {
  const render = () => {
    syncNumericalSituationLog(store.state);
    renderNumericalSituation(store.state, ensureContainer());
  };
  render();
  window.addEventListener('handball:state-updated', render);
  setTimeout(render, 250);
  setTimeout(render, 1000);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
