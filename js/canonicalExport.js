// js/canonicalExport.js
// LIVE export bridge: converts the current GameStore into the canonical Match JSON.
// It is intentionally independent from the existing Excel export.

import { store } from './state.js';
import { createCanonicalMatch, validateCanonicalMatch, SCHEMA_VERSION } from './matchAdapter.js';
import { validateTimeline } from './matchTimeline.js';

function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildFilename(match) {
    const home = String(match?.homeTeamName || 'equipa-a').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const away = String(match?.awayTeamName || 'equipa-b').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    return `match-${home}-vs-${away}-${Date.now()}.json`;
}

export function exportCanonicalMatch(options = {}) {
    try {
        const payload = createCanonicalMatch(store.state, options);
        payload.timeline = Array.isArray(store.state.timelineEvents) ? [...store.state.timelineEvents] : [];
        payload.videoAnchors = store.state.videoAnchors ? JSON.parse(JSON.stringify(store.state.videoAnchors)) : { firstHalfStart: null, firstHalfEnd: null, secondHalfStart: null, secondHalfEnd: null };
        const timelineValidation = validateTimeline(payload.timeline);
        if (!timelineValidation.valid) throw new Error(`Timeline inválida: ${timelineValidation.errors.join('; ')}`);
        const validation = validateCanonicalMatch(payload);
        if (!validation.valid) {
            console.error('[Canonical Match] Payload inválido:', validation.errors);
            alert(`Não foi possível exportar o jogo.\n\n${validation.errors.join('\n')}`);
            return null;
        }
        downloadJson(payload, buildFilename(payload.match));
        console.info('[Canonical Match] Exportação concluída', { schemaVersion: SCHEMA_VERSION, matchId: payload.match.id, events: payload.events.length, timeline: payload.timeline.length, players: payload.players.length, videoAnchors: payload.videoAnchors });
        return payload;
    } catch (error) {
        console.error('[Canonical Match] Erro na exportação:', error);
        alert(`Erro ao gerar o Match JSON:\n\n${error.message}`);
        return null;
    }
}

window.exportCanonicalMatch = exportCanonicalMatch;

function installExportButton() {
    if (document.getElementById('exportCanonicalMatchBtn')) return;
    const excelButton = document.getElementById('exportExcelBtn');
    if (!excelButton?.parentElement) return;
    const button = document.createElement('button');
    button.id = 'exportCanonicalMatchBtn';
    button.type = 'button';
    button.className = 'flex-1 bg-purple-700 hover:bg-purple-600 text-white py-2 rounded-lg font-bold';
    button.textContent = '🧩 Match JSON';
    button.title = 'Exportar os dados do jogo no formato canónico do Andebol Performance OS';
    button.addEventListener('click', () => exportCanonicalMatch());
    excelButton.parentElement.insertBefore(button, excelButton.nextSibling);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installExportButton, { once: true });
else installExportButton();
setTimeout(installExportButton, 500);