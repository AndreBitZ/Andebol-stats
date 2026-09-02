import { store } from '../state.js';

function escapeHtml(value) { return String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch])); }
function formatTime(seconds) { const s=Math.max(0,Number(seconds)||0); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`; }
function findPlayer(side,id){ return (store.state.gameData?.[side]?.players||[]).find(p=>String(p.id??p.Numero)===String(id)||String(p.Numero)===String(id)); }
function togglePlayerOnCourt(side,id){
  const player=findPlayer(side,id);
  if(!player || player.disqualified || player.isSuspended) return;
  const currentCount=(store.state.gameData?.[side]?.players||[]).filter(p=>p.onCourt).length;
  if(!player.onCourt && currentCount>=7){
    alert('⚠️ Uma equipa não pode ter mais de 7 jogadores em campo. Retire primeiro um jogador de campo.');
    return;
  }
  store.update(s=>{
    const p=(s.gameData?.[side]?.players||[]).find(x=>String(x.id??x.Numero)===String(id)||String(x.Numero)===String(id));
    if(p) p.onCourt=!Boolean(p.onCourt);
  });
}
function ensurePopup(){
  let popup=document.getElementById('bilateral-action-popup'); if(popup)return popup;
  popup=document.createElement('div'); popup.id='bilateral-action-popup'; popup.className='fixed inset-0 z-[9999] hidden items-center justify-center bg-black/60 p-4';
  popup.innerHTML=`<div class="w-full max-w-md rounded-2xl bg-gray-800 border border-gray-600 shadow-2xl p-5" role="dialog" aria-modal="true"><div class="flex items-center justify-between gap-3 mb-4"><div><div class="text-xs text-gray-400">Atleta selecionado</div><div id="bilateral-popup-player" class="font-bold text-white text-lg"></div></div><button id="bilateral-popup-close" type="button" class="px-3 py-2 rounded-lg bg-gray-700 text-white">✕</button></div><div class="grid grid-cols-2 gap-3"><button type="button" data-action="shot" class="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold text-lg">🎯<span class="block text-xs mt-1">Remate</span></button><button type="button" data-action="positive" class="bg-teal-600 hover:bg-teal-500 text-white p-4 rounded-xl font-bold text-lg">👍<span class="block text-xs mt-1">Positivo</span></button><button type="button" data-action="negative" class="bg-red-800 hover:bg-red-700 text-white p-4 rounded-xl font-bold text-lg">👎<span class="block text-xs mt-1">Negativo</span></button><button type="button" data-action="sanction" class="bg-yellow-600 hover:bg-yellow-500 text-white p-4 rounded-xl font-bold text-lg">⚠️<span class="block text-xs mt-1">Sanção</span></button></div></div>`;
  document.body.appendChild(popup);
  popup.addEventListener('click',e=>{if(e.target===popup)closePopup();});
  popup.querySelector('#bilateral-popup-close').onclick=closePopup;
  popup.querySelectorAll('[data-action]').forEach(btn=>btn.onclick=()=>{
    const sel=popup._selection;if(!sel)return;
    const action=btn.dataset.action;
    if(action==='shot'&&typeof window.openBilateralShot==='function'){
      closePopup(); window.openBilateralShot(sel.side,sel.playerId);
    } else if((action==='positive'||action==='negative')&&typeof window.openBilateralAction==='function'){
      closePopup(); window.openBilateralAction(sel.side,sel.playerId,action);
    } else if(action==='sanction'&&typeof window.openModal==='function'){
      closePopup(); window.openModal(action,`${sel.side}:${sel.playerId}`);
    }
  });
  return popup;
}
function closePopup(){const p=document.getElementById('bilateral-action-popup');if(p){p.classList.add('hidden');p.classList.remove('flex');p.style.display='none';p._selection=null;}}
function openPopup(side,id){const p=findPlayer(side,id);if(!p||p.disqualified||p.isSuspended)return;const popup=ensurePopup();popup._selection={side,playerId:String(id)};popup.querySelector('#bilateral-popup-player').textContent=`${side==='A'?(store.state.teamAName||'Equipa A'):(store.state.teamBName||'Equipa B')} · #${p.Numero} ${p.Nome}`;popup.style.display='flex';popup.classList.remove('hidden');popup.classList.add('flex');}
window.openBilateralPlayerPopup=openPopup;
window.closeBilateralPlayerPopup=closePopup;
function playerRow(player){
  const num=escapeHtml(player.Numero||'-'),name=escapeHtml(player.Nome||'Atleta sem nome'),pos=escapeHtml(player.Posicao||''),id=escapeHtml(String(player.id??player.Numero??''));
  const classes=player.onCourt?'bg-green-900/60 border-green-500':'bg-gray-700 border-gray-600';
  const disabled=player.disqualified||player.isSuspended?'opacity-50 cursor-not-allowed':'cursor-pointer hover:bg-gray-600';
  const status=player.disqualified?' 🔴':player.isSuspended?` ⏱️ ${formatTime(player.suspensionTimer||0)}`:'';
  const checked=player.onCourt?'checked':'';
  return `<div data-team="A" data-player="${id}" data-team-player="A:${id}" data-player-popup="1" class="w-full flex items-center justify-between gap-2 p-3 rounded-lg border ${classes} ${disabled}">
    <button type="button" data-court-toggle="A:${id}" class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-xs font-bold" aria-label="${player.onCourt?'Retirar':'Colocar'} ${name} ${player.onCourt?'de campo':'em campo'}">
      <input type="checkbox" ${checked} tabindex="-1" class="pointer-events-none w-5 h-5 accent-green-500"><span>${player.onCourt?'EM CAMPO':'BANCO'}</span>
    </button>
    <div class="flex-1 flex items-center justify-between gap-2 text-left min-w-0" data-action-area="1"><span class="font-bold w-8">#${num}</span><span class="font-semibold flex-1 truncate">${name}${status}</span><span class="text-xs text-gray-400 w-10 text-center">${pos}</span><span id="time-p-${num}" class="font-mono text-sm">${formatTime(player.timeOnCourt||0)}</span></div>
  </div>`;
}
export function renderHomeRoster(){
  const players=Array.isArray(store.state.gameData?.A?.players)?store.state.gameData.A.players:[];
  const goalkeeperList=document.getElementById('goalkeeper-list-A'),playerList=document.getElementById('player-list-A'); if(!goalkeeperList&&!playerList)return;
  const gks=players.filter(p=>String(p.Posicao||'').toUpperCase()==='GR'),field=players.filter(p=>String(p.Posicao||'').toUpperCase()!=='GR');
  if(goalkeeperList)goalkeeperList.innerHTML=gks.map(playerRow).join(''); if(playerList)playerList.innerHTML=field.map(playerRow).join('');
  document.querySelectorAll('#player-list-A [data-player-popup], #goalkeeper-list-A [data-player-popup]').forEach(card=>{
    card.onclick=e=>{ if(e.target.closest('[data-court-toggle]')) return; openPopup('A',card.dataset.player); };
  });
  document.querySelectorAll('[data-court-toggle^="A:"]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();togglePlayerOnCourt('A',btn.dataset.courtToggle.split(':')[1]);});
}
function install(){renderHomeRoster();window.addEventListener('handball:state-updated',renderHomeRoster);setTimeout(renderHomeRoster,100);setTimeout(renderHomeRoster,500);setTimeout(renderHomeRoster,1500);}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
