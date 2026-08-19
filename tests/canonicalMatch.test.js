import { createCanonicalMatch, validateCanonicalMatch } from '../js/matchAdapter.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function buildState() {
    return {
        teamAName: 'Casa',
        teamBName: 'Fora',
        totalSeconds: 120,
        currentPeriod: 1,
        gameData: {
            A: {
                fileLoaded: true,
                players: [{ Numero: '8', Nome: 'Jogador 8', Posicao: 'Central', onCourt: true, history: [
                    { type: 'Ataque', zone: '6', coords: { x: 10, y: 20 }, outcome: 'goal', time: 100 }
                ], positiveActions: [], negativeActions: [], sanctions: { yellow: 0, twoMin: 0, red: 0 } }],
                officials: [],
                stats: { goals: 1, misses: 0, savedShots: 0, technical_faults: 0, turnovers: 0 },
                history: []
            },
            B: {
                players: [],
                officials: [],
                stats: { goals: 0, misses: 1, savedShots: 1, technical_faults: 0, turnovers: 0 },
                history: [{ type: 'Ponta', zone: '1', coords: { x: 50, y: 50 }, outcome: 'saved', time: 90 }]
            }
        },
        gameEvents: [
            { time: 80, team: 'A', type: 'assist', details: 'Jogador 8' },
            { time: 90, team: 'B', type: 'shot', details: 'legacy duplicate candidate' }
        ],
        gameSituationLog: []
    };
}

const payload = createCanonicalMatch(buildState());
const validation = validateCanonicalMatch(payload);

assert(validation.valid, `Payload inválido: ${validation.errors.join('; ')}`);
assert(payload.schemaVersion === '1.0.1', 'Schema version inesperada');
assert(payload.events.length === 3, `Esperava 3 eventos, obtive ${payload.events.length}`);
assert(payload.events.filter(e => e.type === 'shot').length === 2, 'Esperava exatamente 2 remates');
assert(new Set(payload.events.map(e => e.id)).size === payload.events.length, 'Existem IDs de eventos duplicados');
assert(payload.players.length === 1, 'Esperava 1 jogador');

const invalid = structuredClone(payload);
invalid.events.push(structuredClone(invalid.events[0]));
const invalidResult = validateCanonicalMatch(invalid);
assert(!invalidResult.valid, 'A validação deveria rejeitar IDs de eventos duplicados');

console.log('canonicalMatch.test.js: OK');
