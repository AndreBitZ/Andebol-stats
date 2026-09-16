/* Analytical layer: safe primitives + match/possession + shot analytics. */
export function safeRate(numerator, denominator) {
  const n = Number(numerator) || 0; const d = Number(denominator) || 0;
  return d > 0 ? (n / d) * 100 : null;
}
export function shotMetrics({ goals=0, saved=0, missed=0, post=0, blocked=0 } = {}) {
  const total=goals+saved+missed+post+blocked;
  return {total_shots:total,shot_efficiency:safeRate(goals,total),on_target_rate:safeRate(goals+saved,total),on_target_conversion:safeRate(goals,goals+saved),blocked_shot_rate:safeRate(blocked,total),technical_miss_rate:safeRate(missed+post,total)};
}
export function saveRate(saves=0,goalsConceded=0){return safeRate(saves,saves+goalsConceded);}
export function per10Min(value,minutes){const m=Number(minutes)||0;return m>0?(Number(value)||0)/m*10:null;}
export function per5Min(value,minutes){const m=Number(minutes)||0;return m>0?(Number(value)||0)/m*5:null;}
export function possessionEfficiency(goals=0,possessions=0){return safeRate(goals,possessions);}
const SHOT_RESULTS=['GOAL','SAVED','MISSED','POST','BLOCKED'];
const TURNOVERS=['TURNOVER','RECEPTION_ERROR','OFFENSIVE_FOUL','PASSIVE_TURNOVER'];
function emptyTeam(){return{possessions:0,goals:0,shots:0,saved:0,missed:0,post:0,blocked:0,saves:0,goals_conceded:0,turnovers:0,steals:0,interceptions:0,recoveries:0,seven_meter_won:0,attack_efficiency:null,shot_efficiency:null,goalkeeper_save_efficiency:null,average_attack_duration_seconds:null,transition_attacks:0};}
function teamFromId(state,teamId){if(teamId&&teamId===state?.teamAId)return'A';if(teamId&&teamId===state?.teamBId)return'B';return null;}
function emptyShotBucket(){return{shots:0,goals:0,saved:0,missed:0,post:0,blocked:0,efficiency:null};}
function addShot(bucket,result){bucket.shots+=1;if(SHOT_RESULTS.includes(result))bucket[result.toLowerCase()]+=1;bucket.efficiency=safeRate(bucket.goals,bucket.shots);}
function bucketMap(keys){return Object.fromEntries(keys.map(key=>[String(key),emptyShotBucket()]));}
export function calculateShotAnalytics(state={},side=null){
 const events=Array.isArray(state.gameEvents)?state.gameEvents:[];const sides=side==='A'||side==='B'?[side]:['A','B'];const result={};
 for(const s of sides)result[s]={by_zone:bucketMap(['1','2','3','4','5','6','7','8','9']),by_distance:bucketMap(['curta','curta/média','média','longa','7m']),by_goal:bucketMap(['1','2','3','4','5','6','7','8','9']),by_zone_distance:{}};
 for(const event of events){if(event.event_type!=='SHOT')continue;const s=teamFromId(state,event.team_id);if(!result[s])continue;const zone=event.shot_zone!=null?String(event.shot_zone):null;const distance=event.shot_distance!=null?String(event.shot_distance):null;const goal=event.goal_zone_3x3!=null?String(event.goal_zone_3x3):event.goal_location!=null?String(event.goal_location):null;if(zone&&result[s].by_zone[zone])addShot(result[s].by_zone[zone],event.shot_result);if(distance&&result[s].by_distance[distance])addShot(result[s].by_distance[distance],event.shot_result);if(goal&&result[s].by_goal[goal])addShot(result[s].by_goal[goal],event.shot_result);if(zone&&distance){const key=`${zone}::${distance}`;if(!result[s].by_zone_distance[key])result[s].by_zone_distance[key]=emptyShotBucket();addShot(result[s].by_zone_distance[key],event.shot_result);}}
 return result;
}
export function calculateMatchAnalytics(state={}){
 const events=Array.isArray(state.gameEvents)?state.gameEvents:[];const sequences=Array.isArray(state.gameSequences)?state.gameSequences:[];const result={A:emptyTeam(),B:emptyTeam(),total_events:events.length,updated_at_seconds:Number(state.totalSeconds)||0};
 for(const sequence of sequences){const side=sequence.possession_side;if(!result[side])continue;result[side].possessions+=1;if(sequence.outcome==='GOAL')result[side].goals+=1;if(sequence.sequence_type==='TRANSITION')result[side].transition_attacks+=1;const duration=Number(sequence.duration_seconds);if(Number.isFinite(duration)&&duration>=0){const old=result[side].average_attack_duration_seconds;const n=result[side].possessions;result[side].average_attack_duration_seconds=old==null?duration:((old*(n-1))+duration)/n;}}
 for(const event of events){const side=teamFromId(state,event.team_id);if(!side)continue;if(event.event_type==='SHOT'){result[side].shots+=1;if(SHOT_RESULTS.includes(event.shot_result))result[side][event.shot_result.toLowerCase()]+=1;const defendingSide=side==='A'?'B':'A';if(event.shot_result==='SAVED')result[defendingSide].saves+=1;if(event.shot_result==='GOAL')result[defendingSide].goals_conceded+=1;}if(TURNOVERS.includes(event.event_type))result[side].turnovers+=1;if(event.event_type==='STEAL')result[side].steals+=1;if(event.event_type==='INTERCEPTION')result[side].interceptions+=1;if(event.event_type==='RECOVERY')result[side].recoveries+=1;if(event.event_type==='SEVEN_METER_WON')result[side].seven_meter_won+=1;}
 for(const side of ['A','B']){const t=result[side];t.attack_efficiency=possessionEfficiency(t.goals,t.possessions);t.shot_efficiency=safeRate(t.goals,t.shots);t.goalkeeper_save_efficiency=saveRate(t.saves,t.goals_conceded);}
 result.shots=calculateShotAnalytics(state);return result;
}
export function installAnalytics(store){if(!store||typeof window==='undefined'||window.__handballAnalyticsInstalled)return;window.__handballAnalyticsInstalled=true;const rebuild=()=>{store.state.matchAnalytics=calculateMatchAnalytics(store.state);try{store.saveToSessionStorage();}catch(e){console.warn('[Analytics] sessão indisponível:',e);}};window.addEventListener('handball:state-updated',rebuild);rebuild();}
