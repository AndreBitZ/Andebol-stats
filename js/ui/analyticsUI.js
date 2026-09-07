import { store } from '../state.js';
import { calculateMatchAnalytics } from '../domain/analytics.js';

function pct(value) {
  return value == null || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toFixed(1)}%`;
}

function seconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const m = Math.floor(n / 60).toString().padStart(2, '0');
  const s = Math.floor(n % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function value(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }

function teamCard(name, team) {
  const rows = [
    ['Posses', team.possessions],
    ['Golos', team.goals],
    ['Remates', team.shots],
    ['Defesas GR sofridas', team.saved],
    ['Remates falhados', team.missed],
    ['Postes', team.post],
    ['Remates bloqueados', team.blocked],
    ['Perdas de bola', team.turnovers],
    ['Roubos de bola', team.steals],
    ['Interceções', team.interceptions],
    ['Recuperações', team.recoveries],
    ['7 metros ganhos', team.seven_meter_won],
    ['Transições', team.transition_attacks]
  ];
  return `<div class="bg-gray-900 rounded-xl p-4 border border-gray-700">
    <h4 class="text-xl font-bold text-white mb-4">${name}</h4>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Eficiência ataque</div><div class="text-2xl font-bold text-white">${pct(team.attack_efficiency)}</div></div>
      <div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Eficiência remate</div><div class="text-2xl font-bold text-white">${pct(team.shot_efficiency)}</div></div>
      <div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Duração média ataque</div><div class="text-2xl font-bold text-white">${seconds(team.average_attack_duration_seconds)}</div></div>
      <div class="bg-gray-800 rounded-lg p-3 text-center"><div class="text-xs text-gray-400">Transições</div><div class="text-2xl font-bold text-white">${value(team.transition_attacks)}</div></div>
    </div>
    <div class="space-y-1">${rows.map(([label, v]) => `<div class="flex justify-between border-b border-gray-800 py-1.5 text-sm"><span class="text-gray-400">${label}</span><span class="font-bold text-white">${value(v)}</span></div>`).join('')}</div>
  </div>`;
}

export function renderAnalyticsPanel() {
  const container = document.getElementById('stats-comparison-container');
  if (!container) return;
  const state = store.state;
  const analytics = calculateMatchAnalytics(state);
  const nameA = state.teamAName || 'Equipa A';
  const nameB = state.teamBName || 'Equipa B';
  container.innerHTML = `<div class="mb-4 text-center"><div class="text-sm text-gray-400">Análise em tempo real</div><div class="text-xs text-gray-500">Eventos registados: ${analytics.total_events} · Cronómetro: ${seconds(analytics.updated_at_seconds)}</div></div>
    <div class="grid md:grid-cols-2 gap-4">${teamCard(nameA, analytics.A)}${teamCard(nameB, analytics.B)}</div>`;
}

if (typeof window !== 'undefined' && !window.__handballAnalyticsUIInstalled) {
  window.__handballAnalyticsUIInstalled = true;
  window.addEventListener('handball:state-updated', renderAnalyticsPanel);
  renderAnalyticsPanel();
}
