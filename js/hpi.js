import { POINT_SYSTEM } from './constants.js';

export const HPI_VERSION = 'ANDSTATS-POINTS-1.0';

function isGoalkeeper(player) {
    return String(player?.Posicao || '').trim().toUpperCase() === 'GR';
}

function shotPoints(player, shot) {
    const system = isGoalkeeper(player) ? POINT_SYSTEM.goalkeeper : POINT_SYSTEM.field_player;
    const type = String(shot?.type || 'Default');
    const outcome = shot?.outcome === 'goal' ? 'goal' : 'fail';
    const rules = system.shot?.[type] ?? system.shot?.Default ?? system.shot;
    return Number(rules?.[outcome] ?? 0);
}

function actionPoints(player, type, action) {
    const system = isGoalkeeper(player) ? POINT_SYSTEM.goalkeeper : POINT_SYSTEM.field_player;
    return Number(system?.[`${type}_actions`]?.[action] ?? 0);
}

function sanctionPoints(player) {
    const system = isGoalkeeper(player) ? POINT_SYSTEM.goalkeeper : POINT_SYSTEM.field_player;
    const sanctions = player?.sanctions || {};
    return {
        yellow: Number(system.negative_actions?.sanction_yellow ?? 0) * Number(sanctions.yellow || 0),
        twoMin: Number(system.negative_actions?.sanction_2min ?? 0) * Number(sanctions.twoMin || 0),
        red: Number(system.negative_actions?.sanction_red ?? 0) * Number(sanctions.red || 0)
    };
}

export function calculatePlayerHpi(player) {
    const positiveActions = Array.isArray(player?.positiveActions) ? player.positiveActions : [];
    const negativeActions = Array.isArray(player?.negativeActions) ? player.negativeActions : [];
    const history = Array.isArray(player?.history) ? player.history : [];

    let shotScore = 0;
    let positivePoints = 0;
    let negativePoints = 0;

    history.forEach(shot => {
        const points = shotPoints(player, shot);
        shotScore += points;
        if (points >= 0) positivePoints += points;
        else negativePoints += points;
    });

    positiveActions.forEach(item => {
        const points = actionPoints(player, 'positive', item?.action);
        positivePoints += points;
    });

    negativeActions.forEach(item => {
        const points = actionPoints(player, 'negative', item?.action);
        negativePoints += points;
    });

    const sanctions = sanctionPoints(player);
    negativePoints += sanctions.yellow + sanctions.twoMin + sanctions.red;

    const score = positivePoints + negativePoints;
    const minutes = Number(player?.timeOnCourt || 0) / 60;
    const ratePer60 = minutes > 0 ? (score / minutes) : null;

    return {
        score,
        positivePoints,
        negativePoints,
        ratePer60,
        positiveActions: positiveActions.length,
        negativeActions: negativeActions.length,
        shots: history.length,
        sampleSize: 1,
        version: HPI_VERSION
    };
}

export function calculateRosterHpi(players = []) {
    return players.map(player => ({ player, hpi: calculatePlayerHpi(player) }));
}
