/* Live numerical situation: derives players currently available on court from match state. */

export function getNumericalSituation(state, side) {
  const players = state?.gameData?.[side]?.players || [];
  const onCourt = players.filter(p => p.onCourt && !p.disqualified && !p.isSuspended).length;
  const suspended = players.filter(p => p.isSuspended && !p.disqualified).length;
  const disqualified = players.filter(p => p.disqualified).length;
  return { onCourt, suspended, disqualified };
}

export function getMatchNumericalSituation(state) {
  return { A: getNumericalSituation(state, 'A'), B: getNumericalSituation(state, 'B') };
}

export function renderNumericalSituation(state, container) {
  if (!container) return;
  const { A, B } = getMatchNumericalSituation(state);
  const labelA = state?.teamAName || 'Equipa A';
  const labelB = state?.teamBName || 'Equipa B';
  const tone = (n) => n < 7 ? 'text-yellow-300' : n === 7 ? 'text-green-300' : 'text-red-300';
  container.innerHTML = `<div class="flex items-center justify-center gap-3 rounded-xl bg-gray-900 px-4 py-3 border border-gray-700"><div class="text-right min-w-0"><div class="text-[11px] text-gray-400 truncate">${labelA}</div><div class="text-2xl font-black ${tone(A.onCourt)}">${A.onCourt}</div></div><div class="text-gray-500 font-bold">×</div><div class="text-left min-w-0"><div class="text-[11px] text-gray-400 truncate">${labelB}</div><div class="text-2xl font-black ${tone(B.onCourt)}">${B.onCourt}</div></div><div class="hidden sm:block text-[11px] text-gray-500 ml-2">EM CAMPO</div></div>`;
}
