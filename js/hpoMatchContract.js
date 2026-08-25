export const HPO_MATCH_FORMAT = 'HPO-MATCH';
export const HPO_MATCH_VERSION = '1.0';

export function validateHpoMatchFile(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.format !== HPO_MATCH_FORMAT || payload.version !== HPO_MATCH_VERSION) return false;
    if (!['PERFORMANCE_OS_TO_ANDEBOL_STATS', 'ANDEBOL_STATS_TO_PERFORMANCE_OS'].includes(payload.direction)) return false;
    if (!payload.match || typeof payload.match !== 'object') return false;
    if (!Array.isArray(payload.players) || !Array.isArray(payload.roster) || !Array.isArray(payload.events)) return false;
    if (!payload.statistics || typeof payload.statistics !== 'object') return false;
    if (!Array.isArray(payload.timeline)) return false;
    if (!payload.video || typeof payload.video !== 'object') return false;
    if (!payload.video.anchors || typeof payload.video.anchors !== 'object') return false;
    if (!Array.isArray(payload.video.clips)) return false;
    if (!payload.metadata || typeof payload.metadata.source !== 'string') return false;
    return true;
}
