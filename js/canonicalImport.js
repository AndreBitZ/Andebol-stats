import { store } from './state.js';
import { importLivePackage, validateLivePackage } from './livePackageImporter.js';

function buildImportedState(payload, imported) {
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
    nextState.gameData.A.stats = { goals: 0, misses: 0, savedShots: 0, turnovers: 0, gkSaves: 0, gkGoalsAgainst: 0, technical_faults: 0 };
    nextState.gameData.B.stats = { goals: 0, misses: 0, savedShots: 0, turnovers: 0, gkSaves: 0, gkGoalsAgainst: 0, technical_faults: 0 };
    nextState.gameData.B.history = [];
    return nextState;
}

async function importMatchFile(file) {
    const payload = JSON.parse(await file.text());
    if (payload?.source !== 'handball-performance-os') {
        throw new Error('Ficheiro recusado: o jogo tem de ser exportado pelo Handball Performance OS.');
    }
    const validation = validateLivePackage(payload);
    if (!validation.valid) throw new Error(validation.errors.join('\n'));
    if ((payload.events || []).length > 0) {
        throw new Error('Este ficheiro já contém eventos. Para preparar um jogo novo, importa apenas o Match JSON inicial do Performance OS.');
    }

    const imported = importLivePackage(payload);
    const nextState = buildImportedState(payload, imported);
    const orientation = payload.match.homeAway === 'AWAY' ? 'Fora' : payload.match.homeAway === 'NEUTRAL' ? 'Neutro' : 'Casa';
    const confirmed = confirm(`JOGO DO PERFORMANCE OS\n\n${imported.teamAName} vs ${imported.teamBName}\nLocalização: ${orientation}\nJogadores: ${nextState.gameData.A.players.length}\nDuração: ${nextState.halfDuration} min\nEstado inicial: 0-0\n\nConfirmar importação?`);
    if (!confirmed) return false;

    sessionStorage.setItem('handballGameSession', JSON.stringify(nextState));
    window.location.reload();
    return true;
}

function createInput() {
    let input = document.getElementById('importPerformanceOSInput');
    if (input) return input;
    input = document.createElement('input');
    input.id = 'importPerformanceOSInput';
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        try {
            await importMatchFile(file);
        } catch (error) {
            console.error('[Performance OS Import] Erro:', error);
            alert(`Não foi possível importar o jogo.\n\n${error instanceof Error ? error.message : 'Ficheiro inválido.'}`);
        }
    });
    return input;
}

function addButton(parent, id, text) {
    let button = document.getElementById(id);
    if (button) return button;
    button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2';
    button.textContent = text;
    parent.appendChild(button);
    return button;
}

function installWelcomeLoader() {
    const modal = document.getElementById('welcomeModal');
    if (!modal) return;
    const input = createInput();
    const legacyFile = document.getElementById('welcome-file-input-A');
    const legacyName = document.getElementById('file-name-A');
    const legacyOpponent = document.getElementById('welcome-team-b-name');
    const legacyStart = document.getElementById('startGameBtn');
    const durationBlock = document.querySelector('#welcomeModal input[name="gameDuration"]')?.closest('.bg-gray-700');

    legacyFile?.closest('div')?.parentElement?.classList.add('hidden');
    legacyName?.classList.add('hidden');
    legacyOpponent?.classList.add('hidden');
    legacyStart?.classList.add('hidden');
    durationBlock?.classList.add('hidden');

    const container = modal.querySelector('.space-y-4');
    if (!container) return;
    const title = modal.querySelector('h2');
    if (title) title.textContent = 'Importar Jogo';
    if (!document.getElementById('performanceOSImportHint')) {
        const subtitle = document.createElement('p');
        subtitle.id = 'performanceOSImportHint';
        subtitle.className = 'text-sm text-gray-300 mb-4';
        subtitle.textContent = 'O jogo é criado no Performance OS. O Andebol-Stats recebe apenas o Match JSON preparado por essa aplicação.';
        container.prepend(subtitle);
    }
    const button = addButton(container, 'importPerformanceOSBtn', '📥 Importar jogo do Performance OS');
    button.onclick = () => input.click();
}

function installMainLoader() {
    const exportButton = document.getElementById('exportCanonicalMatchBtn');
    const excelButton = document.getElementById('exportExcelBtn');
    const anchor = exportButton || excelButton;
    if (!anchor?.parentElement) return;
    const input = createInput();
    const button = addButton(anchor.parentElement, 'importCanonicalMatchBtn', '📥 Importar Performance OS');
    button.className = 'flex-1 bg-indigo-700 hover:bg-indigo-600 text-white py-2 rounded-lg font-bold';
    button.onclick = () => input.click();
}

function installImportUI() {
    installWelcomeLoader();
    installMainLoader();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installImportUI, { once: true });
} else {
    installImportUI();
}

setTimeout(installImportUI, 500);
setTimeout(installImportUI, 1500);
