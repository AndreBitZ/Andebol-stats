import { store } from './state.js';

function pct(value, total) { return total ? `${((value / total) * 100).toFixed(1)}%` : '0.0%'; }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

function renderPanel(stats) {
    const existing = document.getElementById('preMatchStatsModal'); existing?.remove();
    const overlay = document.createElement('div'); overlay.id = 'preMatchStatsModal'; overlay.className = 'fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4';
    const team = stats.team;
    const rows = stats.players.map(player => `<tr class="border-b border-gray-700"><td class="py-2 pr-3 font-semibold">${esc(player.shirtNumber ?? '')} ${esc(player.name)}</td><td>${esc(player.position || '-')}</td><td>${player.seasonMatches}</td><td>${player.goals}</td><td>${player.shots}</td><td>${pct(player.shotGoals, player.shots)}</td><td>${player.assists}</td><td>${player.turnovers}</td><td>${player.last5.goals}</td></tr>`).join('');
    overlay.innerHTML = `<div class="bg-gray-900 text-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto p-5 shadow-2xl"><div class="flex justify-between items-center gap-4 mb-5"><div><p class="text-xs uppercase tracking-wider text-gray-400">CONSULTA PRÉ-JOGO</p><h2 class="text-2xl font-bold">${esc(stats.scope.teamId)} · histórico disponível</h2><p class="text-sm text-gray-400">Gerado ${new Date(stats.generatedAt).toLocaleString('pt-PT')}</p></div><button id="closePreMatchStats" class="px-3 py-2 rounded bg-gray-700">Fechar</button></div><div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6"><div class="bg-gray-800 p-3 rounded"><small>Jogos</small><strong class="block text-xl">${team.matches}</strong></div><div class="bg-gray-800 p-3 rounded"><small>GM/jogo</small><strong class="block text-xl">${team.goalsForPerMatch.toFixed(1)}</strong></div><div class="bg-gray-800 p-3 rounded"><small>GS/jogo</small><strong class="block text-xl">${team.goalsAgainstPerMatch.toFixed(1)}</strong></div><div class="bg-gray-800 p-3 rounded"><small>Golos</small><strong class="block text-xl">${team.goals}</strong></div><div class="bg-gray-800 p-3 rounded"><small>Assistências</small><strong class="block text-xl">${team.assists}</strong></div><div class="bg-gray-800 p-3 rounded"><small>Perdas</small><strong class="block text-xl">${team.turnovers}</strong></div></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-gray-400"><th class="pb-2">Atleta</th><th>Pos.</th><th>Jogos</th><th>Golos</th><th>Remates</th><th>Ef.</th><th>Assist.</th><th>Perdas</th><th>Últimos 5 G</th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="py-5 text-gray-400">Ainda não existem estatísticas históricas para os convocados.</td></tr>'}</tbody></table></div><p class="text-xs text-gray-500 mt-5">Estes dados são apoio à decisão pré-jogo. Não alteram os dados LIVE nem substituem a análise de vídeo posterior.</p></div>`;
    document.body.appendChild(overlay); document.getElementById('closePreMatchStats')?.addEventListener('click', () => overlay.remove()); overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
}

function install() {
    if (document.getElementById('preMatchStatsBtn')) return;
    if (!store.state.preMatchStats) return;
    const anchor = document.getElementById('exportCanonicalMatchBtn') || document.getElementById('exportExcelBtn');
    if (!anchor?.parentElement) return;
    const button = document.createElement('button'); button.id = 'preMatchStatsBtn'; button.type = 'button'; button.className = 'flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold'; button.textContent = '📊 Pré-jogo'; button.title = 'Consultar estatísticas históricas dos atletas e da equipa'; button.onclick = () => renderPanel(store.state.preMatchStats); anchor.parentElement.insertBefore(button, anchor);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install();
setTimeout(install, 700); setTimeout(install, 1600);
