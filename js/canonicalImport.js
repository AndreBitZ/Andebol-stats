import { store } from './state.js';
import { importLivePackage, validateLivePackage } from './livePackageImporter.js';

function installImportUI() {
    if (document.getElementById('importCanonicalMatchBtn')) return;

    const exportButton = document.getElementById('exportCanonicalMatchBtn');
    const excelButton = document.getElementById('exportExcelBtn');
    const anchor = exportButton || excelButton;
    if (!anchor?.parentElement) return;

    const input = document.createElement('input');
    input.id = 'importCanonicalMatchInput';
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    document.body.appendChild(input);

    const button = document.createElement('button');
    button.id = 'importCanonicalMatchBtn';
    button.type = 'button';
    button.className = 'flex-1 bg-indigo-700 hover:bg-indigo-600 text-white py-2 rounded-lg font-bold';
    button.textContent = '📥 Importar Match';
    button.title = 'Importar um jogo preparado no Handball Performance OS';
    button.addEventListener('click', () => input.click());

    anchor.parentElement.insertBefore(button, anchor);

    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        try {
            const payload = JSON.parse(await file.text());
            const validation = validateLivePackage(payload);
            if (!validation.valid) {
                alert(`Não foi possível importar o jogo.\n\n${validation.errors.join('\n')}`);
                return;
            }

            if ((payload.events || []).length > 0) {
                alert('Este Match JSON já contém eventos. O importador de pré-jogo aceita apenas o pacote inicial, sem eventos, para impedir a substituição acidental de um jogo LIVE.');
                return;
            }

            const imported = importLivePackage(payload);
            const nextState = store.getInitialState();
            nextState.matchId = imported.matchId;
            nextState.teamAName = imported.teamAName;
            nextState.teamBName = imported.teamBName;
            nextState.halfDuration = Number(payload.match.durationMinutes || 30);
            nextState.currentGamePart = 1;
            nextState.totalSeconds = 0;
            nextState.isRunning = false;
            nextState.gameEvents = [];
            nextState.gameSituationLog = [{ startTime: 0, endTime: null, situationA: 'equality', situationB: 'equality' }];
            nextState.lastKnownSituations = { A: 'equality', B: 'equality' };
            nextState.gameData.A.players = imported.players.map(player => ({
                ...player,
                id: String(player.id),
                sourceId: String(player.sourceId || player.id),
                Numero: player.Numero ?? '',
                Nome: player.Nome || '',
                Posicao: player.Posicao || '',
                onCourt: false,
                timeOnCourt: 0,
                history: [],
                positiveActions: [],
                negativeActions: [],
                sanctions: { yellow: 0, twoMin: 0, red: 0 }
            }));
            nextState.gameData.A.officials = [];
            nextState.gameData.A.fileLoaded = true;
            nextState.gameData.A.stats.goals = 0;
            nextState.gameData.A.stats.misses = 0;
            nextState.gameData.A.stats.savedShots = 0;
            nextState.gameData.A.stats.turnovers = 0;
            nextState.gameData.A.stats.gkSaves = 0;
            nextState.gameData.A.stats.gkGoalsAgainst = 0;
            nextState.gameData.A.stats.technical_faults = 0;
            nextState.gameData.B.stats.goals = 0;
            nextState.gameData.B.stats.misses = 0;
            nextState.gameData.B.stats.savedShots = 0;
            nextState.gameData.B.stats.turnovers = 0;
            nextState.gameData.B.stats.technical_faults = 0;
            nextState.gameData.B.history = [];

            sessionStorage.setItem('handballGameSession', JSON.stringify(nextState));

            const orientation = payload.match.homeAway === 'AWAY' ? 'Fora' : payload.match.homeAway === 'NEUTRAL' ? 'Neutro' : 'Casa';
            const confirmed = confirm(`Jogo preparado para importação:\n\n${imported.teamAName} vs ${imported.teamBName}\nLocalização: ${orientation}\nJogadores: ${nextState.gameData.A.players.length}\nDuração: ${nextState.halfDuration} min\n\nAbrir este jogo agora?`);
            if (confirmed) window.location.reload();
        } catch (error) {
            console.error('[Canonical Match] Erro na importação:', error);
            alert(`Erro ao importar o Match JSON:\n\n${error instanceof Error ? error.message : 'Ficheiro inválido.'}`);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installImportUI, { once: true });
} else {
    installImportUI();
}

setTimeout(installImportUI, 500);
