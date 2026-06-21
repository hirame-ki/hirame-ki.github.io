/* =====================================================================
   쌤버스 - Supabase Realtime 멀티플레이어 공용 모듈
   각 맵 페이지(ssambus_map_*.html)에서 캐릭터 렌더링 함수(drawHair/drawFace/
   drawNeck/drawBody/dk/li)와 이동 상태(pos, PLAYER, TS)를 정의한 뒤
   이 스크립트를 마지막에 로드합니다.

   사용법:
     - placePlayer() 끝에서 broadcastMyPosition() 호출
     - 페이지 로드 마지막에 initRealtime() 호출
   ===================================================================== */

let __rtChannel = null;
let __rtStudentId = null;
let __rtNickname = null;
let __rtRoomId = null;
let __rtMapId = null;
let __rtTeacherView = false;
let __rtChatMode = 'all'; // 'all' | 'proximity' | 'disabled'  (교사 대시보드에서 broadcast로 업데이트됨)
const __rtProximityThreshold = 5; // 근접 판정 타일 거리 (유클리드)

function __rtIsConfigured(){
  return typeof SUPABASE_URL === 'string'
    && typeof SUPABASE_ANON_KEY === 'string'
    && !SUPABASE_URL.includes('YOUR-PROJECT')
    && !SUPABASE_ANON_KEY.includes('YOUR-ANON-KEY')
    && typeof window.supabase !== 'undefined';
}

function __rtGetParam(name, fallback){
  try{
    const v = new URLSearchParams(window.location.search).get(name);
    return v || fallback;
  }catch(e){ return fallback; }
}

function __rtMyState(){
  return {
    r: pos.r,
    c: pos.c,
    dir: PLAYER.dir,
    type: PLAYER.type,
    skin: PLAYER.skin,
    hcolor: PLAYER.hcolor,
    hair: PLAYER.hair,
    ccolor: PLAYER.ccolor,
    cloth: PLAYER.cloth,
    gender: PLAYER.gender,
    acc: PLAYER.acc,
    nickname: __rtNickname,
    map: __rtMapId
  };
}

let __rtClient = null;
let __rtReconnectTimer = null;

function __rtConnect(){
  try{
    if(__rtChannel){
      __rtClient.removeChannel(__rtChannel);
      __rtChannel = null;
    }

    __rtChannel = __rtClient.channel('room:' + __rtRoomId, {
      config: { presence: { key: __rtStudentId } }
    });

    __rtChannel.on('presence', { event: 'sync' }, () => {
      try{ renderRemotePlayers(__rtChannel.presenceState()); }
      catch(e){ console.warn('[쌤버스] 원격 캐릭터 렌더링 실패', e); }
    });

    __rtChannel.on('broadcast', { event: 'chat_setting' }, ({ payload }) => {
      if(payload && payload.mode){
        __rtChatMode = payload.mode;
        __rtApplyChatMode();
      }
    });

    __rtChannel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if(!payload || payload.id === __rtStudentId) return;
      // 교사 뷰(모니터링)는 항상 전체 채팅 표시
      if(!__rtTeacherView && __rtChatMode === 'proximity' && !__rtIsNearby(payload.id)) return;
      __rtShowBubble(payload.id, payload.text);
    });

    __rtChannel.subscribe((status, err) => {
      if(status === 'SUBSCRIBED'){
        if(!__rtTeacherView) __rtChannel.track(__rtMyState());
      } else if(status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
        console.warn('[쌤버스] Realtime 연결 끊김 - 재연결 시도:', status, err || '');
        if(!__rtReconnectTimer){
          __rtReconnectTimer = setTimeout(() => {
            __rtReconnectTimer = null;
            __rtConnect();
          }, 1000);
        }
      }
    });
  }catch(e){
    console.warn('[쌤버스] Supabase 연결 실패 - 멀티플레이어 없이 진행합니다.', e);
    __rtChannel = null;
  }
}

let __rtTeacherParticipant = false; // 교사가 맵 참가하기로 입장 시 채팅 금지 면제

/* 이동 쿨다운 패치: 키 입력 속도를 CSS 트랜지션과 동기화해 부드러운 슬라이드 보장 */
function __rtPatchMoveWithCooldown(){
  if(window.__rtMovePatchApplied) return;
  const _orig = window.move;
  if(typeof _orig !== 'function') return;
  window.__rtMovePatchApplied = true;
  let _lock = false;
  window.move = function(dir){
    if(_lock) return;
    _lock = true;
    setTimeout(function(){ _lock = false; }, 125); // 120ms 트랜지션보다 약간 길게
    _orig(dir);
  };
}

function initRealtime(mapId){
  __rtMapId = mapId || null;
  __rtTeacherView = __rtGetParam('teacherView', '') === '1';
  __rtTeacherParticipant = __rtGetParam('teacherMode', '') === '1';

  // Supabase 연결 여부와 무관하게 이동 부드럽기 적용
  if(!__rtTeacherView) __rtPatchMoveWithCooldown();

  if(!__rtIsConfigured()){
    console.info('[쌤버스] Supabase가 설정되지 않아 멀티플레이어가 비활성화됩니다. ssambus_supabase_config.js를 확인하세요.');
    return;
  }
  __rtRoomId = __rtGetParam('room', 'demo');
  __rtStudentId = sessionStorage.getItem('ssambus_student_id');
  if(!__rtStudentId){
    __rtStudentId = 'stu_' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('ssambus_student_id', __rtStudentId);
  }
  if(__rtTeacherView) __rtStudentId = 'teacher_' + Math.random().toString(36).slice(2, 10);
  __rtNickname = __rtGetParam('nickname', null)
    || sessionStorage.getItem('ssambus_nickname')
    || ('학생' + Math.floor(1000 + Math.random()*9000));
  if(__rtNickname) sessionStorage.setItem('ssambus_nickname', __rtNickname);

  __rtClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  __rtConnect();
  __rtLoadChatMode();

  if(!__rtTeacherView){
    __rtBuildChatUI();
    __rtInjectNickStyle();
    __rtInjectLocalNick();
  }
}

function __rtInjectNickStyle(){
  if(document.getElementById('rt-nick-style')) return;
  const s = document.createElement('style');
  s.id = 'rt-nick-style';
  s.textContent = `
    #player .nick, .remote-player .nick {
      position:absolute !important;
      top:-20px !important;
      left:50% !important;
      transform:translateX(-50%) !important;
      font-size:11px !important;
      font-weight:600 !important;
      font-family:sans-serif !important;
      background:rgba(255,255,255,.95) !important;
      border:1px solid rgba(0,0,0,.12) !important;
      padding:1px 6px !important;
      border-radius:4px !important;
      white-space:nowrap !important;
      pointer-events:none !important;
      z-index:10 !important;
      color:#222 !important;
      box-shadow:0 1px 3px rgba(0,0,0,.18) !important;
    }
    .stage { transition: transform .12s linear !important; }
    #player { transition: left .12s linear, top .12s linear !important; }
    .remote-player { transition: left .22s ease-out, top .22s ease-out !important; }
  `;
  document.head.appendChild(s);
}

function __rtInjectLocalNick(){
  const player = document.getElementById('player');
  if(!player) return;
  let nick = player.querySelector('.nick');
  if(!nick){
    nick = document.createElement('span');
    nick.className = 'nick';
    player.appendChild(nick);
  }
  nick.textContent = __rtNickname || '';
}

let __rtLastSendAt = 0;
let __rtPendingTimer = null;
const __rtSendInterval = 100; // 최소 전송 간격(ms) - 이동 쿨다운(125ms)과 맞춰 모든 이동이 전송되도록

function __rtTrackNow(){
  if(!__rtChannel) return;
  __rtLastSendAt = Date.now();
  try{ __rtChannel.track(__rtMyState()); }
  catch(e){ /* 연결이 끊긴 경우 조용히 무시 */ }
}

function broadcastMyPosition(){
  if(!__rtChannel) return;
  const elapsed = Date.now() - __rtLastSendAt;
  if(elapsed >= __rtSendInterval){
    __rtTrackNow();
  } else if(!__rtPendingTimer){
    __rtPendingTimer = setTimeout(() => {
      __rtPendingTimer = null;
      __rtTrackNow();
    }, __rtSendInterval - elapsed);
  }
}

function renderRemotePlayers(presenceState){
  const container = document.getElementById('remote-players');
  if(!container) return;

  const seen = new Set();

  Object.keys(presenceState).forEach(key => {
    if(key === __rtStudentId) return; // 자기 자신은 #player로 이미 표시됨
    const presences = presenceState[key];
    if(!presences || !presences.length) return;
    const s = presences[presences.length - 1];
    if(s.map && __rtMapId && s.map !== __rtMapId) return; // 다른 맵에 있는 학생은 표시하지 않음
    seen.add(key);

    let el = container.querySelector('[data-student="' + key + '"]');
    const isNew = !el;
    if(isNew){
      el = document.createElement('div');
      el.className = 'remote-player';
      el.dataset.student = key;
      el.innerHTML = '<svg viewBox="0 0 60 76"><g></g></svg><span class="nick"></span>';
      // 최초 등장 시 트랜지션 없이 즉시 배치 (코너에서 슬라이드 인 방지)
      el.style.transition = 'none';
      container.appendChild(el);
    }

    const g = el.querySelector('g');
    g.innerHTML = renderCharacterSVG(s);

    el.classList.toggle('flip', s.dir === 'right');
    el.style.left = (s.c * TS) + 'px';
    el.style.top  = (s.r * TS - 24) + 'px';
    el.querySelector('.nick').textContent = s.nickname || '';

    // 최초 배치 후 다음 프레임부터 트랜지션 복원
    if(isNew) requestAnimationFrame(() => { el.style.transition = ''; });
  });

  // 더 이상 존재하지 않는 학생의 캐릭터 제거
  container.querySelectorAll('[data-student]').forEach(el => {
    if(!seen.has(el.dataset.student)) el.remove();
  });
}

/* ===================== 맵 채팅 (말풍선) ===================== */
function __rtInjectChatStyle(){
  if(document.getElementById('rt-chat-style')) return;
  const style = document.createElement('style');
  style.id = 'rt-chat-style';
  style.textContent = `
    .chat-bubble{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);
      background:#fff;border:1px solid #ccc;border-radius:10px;padding:5px 9px;margin-bottom:6px;
      font-size:12px;line-height:1.45;font-family:sans-serif;color:#333;
      width:max-content;max-width:160px;text-align:center;word-break:break-word;white-space:normal;
      box-shadow:0 2px 6px rgba(0,0,0,.18);z-index:30;pointer-events:none;
      animation:rt-bubble-in .15s ease}
    .chat-bubble:after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);
      border:5px solid transparent;border-top-color:#fff}
    @keyframes rt-bubble-in{from{opacity:0;transform:translate(-50%,4px)}to{opacity:1;transform:translateX(-50%)}}
    #rt-chat-bar{position:fixed;left:0;right:0;bottom:0;display:flex;gap:6px;padding:8px;
      background:rgba(255,255,255,.95);border-top:1px solid #ddd;z-index:60;font-family:sans-serif}
    #rt-chat-bar input{flex:1;min-width:0;padding:8px 10px;border:1px solid #ccc;border-radius:20px;font-size:14px}
    #rt-chat-bar button{padding:8px 16px;border:none;border-radius:20px;background:#2c3e50;color:#fff;font-size:14px;cursor:pointer}
    #rt-chat-bar button:hover{background:#1a252f}
  `;
  document.head.appendChild(style);
}

function __rtBuildChatUI(){
  if(document.getElementById('rt-chat-bar')) return;
  __rtInjectChatStyle();

  const bar = document.createElement('div');
  bar.id = 'rt-chat-bar';
  bar.innerHTML = '<input id="rt-chat-input" type="text" placeholder="채팅을 입력하세요" maxlength="60">'
    + '<button id="rt-chat-send">전송</button>';
  document.body.appendChild(bar);

  const cs = getComputedStyle(document.body);
  document.body.style.paddingBottom = (parseFloat(cs.paddingBottom) || 0) + 54 + 'px';

  const input = bar.querySelector('#rt-chat-input');
  const send = () => {
    const text = input.value.trim();
    if(!text) return;
    __rtSendChat(text);
    input.value = '';
  };
  bar.querySelector('#rt-chat-send').addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      input.blur(); // 포커스 해제 후 방향키를 맵 이동 핸들러로 통과
      return;
    }
    e.stopPropagation();
    if(e.key === 'Enter'){ send(); input.blur(); }
  });

  // 채팅창 밖에서 글자 키를 누르면 자동으로 입력창에 포커스
  // e.preventDefault()로 첫 키를 차단해야 한글 IME 문제 방지
  // (차단하지 않으면 IME 미활성 상태에서 첫 글자가 영문 raw key로 찍힘)
  document.addEventListener('keydown', e => {
    if(document.activeElement === input) return;
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if(e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey){
      e.preventDefault(); // 잘못된 첫 글자 입력 차단
      input.focus();      // 포커스 이동 후 사용자가 다시 타이핑하면 정상 입력
    }
  });
}

function __rtSendChat(text){
  if(__rtChatMode === 'disabled' && !__rtTeacherParticipant) return; // 교사가 채팅 금지 중 (교사 참가자는 면제)
  __rtShowBubble(__rtStudentId, text);
  if(!__rtChannel) return;
  try{
    __rtChannel.send({
      type: 'broadcast',
      event: 'chat',
      payload: { id: __rtStudentId, nickname: __rtNickname, text: text }
    });
  }catch(e){ /* 연결이 끊긴 경우 조용히 무시 */ }
}

function __rtShowBubble(id, text){
  __rtInjectChatStyle();

  let target;
  if(id === __rtStudentId){
    target = document.getElementById('player');
  } else {
    const container = document.getElementById('remote-players');
    target = container && container.querySelector('[data-student="' + id + '"]');
    if(target && container) container.appendChild(target); // 가장 최근 발화자를 DOM 끝으로 이동 → 위에 표시
  }
  if(!target) return;

  let bubble = target.querySelector('.chat-bubble');
  if(!bubble){
    bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    target.appendChild(bubble);
  }
  bubble.textContent = text;
  clearTimeout(bubble.__rtTimer);
  bubble.__rtTimer = setTimeout(() => bubble.remove(), 4000);
}

/* 해당 타일에 다른 학생이 이미 있는지 확인 */
function __rtIsTileOccupied(r, c){
  if(!__rtChannel) return false;
  const state = __rtChannel.presenceState();
  return Object.keys(state).some(key => {
    if(key === __rtStudentId) return false;
    const presences = state[key];
    if(!presences || !presences.length) return false;
    const s = presences[presences.length - 1];
    if(s.map && __rtMapId && s.map !== __rtMapId) return false;
    return s.r === r && s.c === c;
  });
}

/* 발신자가 나와 근접 타일 안에 있는지 확인 */
function __rtIsNearby(senderId){
  if(!__rtChannel) return true;
  const state = __rtChannel.presenceState();
  const presences = state[senderId];
  if(!presences || !presences.length) return true; // 위치 미확인 시 표시
  const s = presences[presences.length - 1];
  if(s.r === undefined || s.c === undefined) return true;
  const dr = s.r - pos.r;
  const dc = s.c - pos.c;
  return Math.sqrt(dr * dr + dc * dc) <= __rtProximityThreshold;
}

/* 최초 로드 시 room_settings에서 채팅 모드 읽기 */
async function __rtLoadChatMode(){
  try{
    const cl = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await cl
      .from('room_settings')
      .select('chat_mode')
      .eq('room_id', __rtRoomId)
      .maybeSingle();
    if(data && data.chat_mode) __rtChatMode = data.chat_mode;
  }catch(e){ /* 설정 미존재 시 기본값('all') 유지 */ }
  __rtApplyChatMode();
}

/* 채팅 모드에 따라 채팅바 UI 적용 */
function __rtApplyChatMode(){
  const bar = document.getElementById('rt-chat-bar');
  if(!bar) return; // 교사 뷰나 채팅바 미생성 시 무시

  if(__rtChatMode === 'disabled' && !__rtTeacherParticipant){
    bar.style.display = 'none';
    // 금지 안내 배너 표시
    let notice = document.getElementById('rt-chat-notice');
    if(!notice){
      notice = document.createElement('div');
      notice.id = 'rt-chat-notice';
      notice.style.cssText = 'position:fixed;left:0;right:0;bottom:0;background:rgba(192,57,43,.92);'
        + 'color:#fff;text-align:center;padding:10px 16px;font-size:13px;font-family:sans-serif;z-index:60';
      document.body.appendChild(notice);
    }
    notice.textContent = '🚫 선생님이 채팅을 일시 중지했습니다.';
    notice.style.display = 'block';
  } else {
    bar.style.display = '';
    const notice = document.getElementById('rt-chat-notice');
    if(notice) notice.style.display = 'none';
  }
}

/* ── 맵 오버레이 (가구/장애물) ─────────────────────────────────── */
let __rtMapOverlays = {}; // { 'r,c': tileType }

function __rtIsOverlayBlocked(r, c){
  const v = __rtMapOverlays[`${r},${c}`];
  return !!(v && v !== 0);
}

async function loadMapOverlays(mapId, ctx, ts){
  if(!__rtClient || !__rtRoomId) return;
  try{
    const { data } = await __rtClient
      .from('room_settings')
      .select('map_tiles')
      .eq('room_id', __rtRoomId)
      .maybeSingle();
    if(data && data.map_tiles && data.map_tiles[mapId]){
      __rtMapOverlays = data.map_tiles[mapId];
      Object.entries(__rtMapOverlays).forEach(([key, type]) => {
        if(!type || type === 0) return;
        const [r, c] = key.split(',').map(Number);
        __rtDrawOverlayTile(ctx, c*ts, r*ts, ts, type);
      });
    }
  }catch(e){ console.warn('[쌤버스] 맵 오버레이 로드 실패:', e); }
}

function __rtDrawOverlayTile(ctx, x, y, ts, type){
  switch(type){
    case 20: __rtCT20(ctx,x,y,ts); break;
    case 21: __rtCT21(ctx,x,y,ts); break;
    case 22: __rtCT22(ctx,x,y,ts); break;
    case 23: __rtCT23(ctx,x,y,ts); break;
    case 30: __rtCT30(ctx,x,y,ts); break;
    case 31: __rtCT31(ctx,x,y,ts); break;
    case 32: __rtCT32(ctx,x,y,ts); break;
    case 33: __rtCT33(ctx,x,y,ts); break;
    case 34: __rtCT34(ctx,x,y,ts); break;
    case 35: __rtCT35(ctx,x,y,ts); break;
    case 36: __rtCT36(ctx,x,y,ts); break;
    case 37: __rtCT37(ctx,x,y,ts); break;
  }
}

function __rtCT20(ctx,x,y,ts){
  ctx.fillStyle='#7a8a96'; ctx.fillRect(x+Math.round(ts*.19),y+Math.round(ts*.13),Math.round(ts*.62),Math.round(ts*.19));
  ctx.fillStyle='#65757f'; ctx.fillRect(x+Math.round(ts*.23),y+Math.round(ts*.29),Math.round(ts*.54),Math.round(ts*.06));
  ctx.fillStyle='#c8a06e'; ctx.fillRect(x+Math.round(ts*.08),y+Math.round(ts*.38),Math.round(ts*.84),Math.round(ts*.46));
  ctx.fillStyle='#dfc09a'; ctx.fillRect(x+Math.round(ts*.08),y+Math.round(ts*.38),Math.round(ts*.84),Math.round(ts*.08));
  ctx.fillStyle='#7a5230';
  ctx.fillRect(x+Math.round(ts*.1),y+Math.round(ts*.88),Math.round(ts*.12),Math.round(ts*.1));
  ctx.fillRect(x+Math.round(ts*.78),y+Math.round(ts*.88),Math.round(ts*.12),Math.round(ts*.1));
}
function __rtCT21(ctx,x,y,ts){
  const cx=x+ts/2;
  ctx.fillStyle='#1e6e3e'; ctx.fillRect(cx-1,y+Math.round(ts*.46),2,Math.round(ts*.22));
  ctx.fillStyle='#1a8a44'; ctx.fillRect(cx-Math.round(ts*.19),y+Math.round(ts*.26),Math.round(ts*.19),Math.round(ts*.2));
  ctx.fillStyle='#2ecc71'; ctx.fillRect(cx,y+Math.round(ts*.3),Math.round(ts*.19),Math.round(ts*.17));
  ctx.fillStyle='#27ae60'; ctx.fillRect(cx-Math.round(ts*.1),y+Math.round(ts*.15),Math.round(ts*.2),Math.round(ts*.18));
  ctx.fillStyle='#b03a22'; ctx.fillRect(cx-Math.round(ts*.19),y+Math.round(ts*.66),Math.round(ts*.38),Math.round(ts*.06));
  ctx.fillStyle='#c84b2c'; ctx.fillRect(cx-Math.round(ts*.17),y+Math.round(ts*.71),Math.round(ts*.34),Math.round(ts*.21));
  ctx.fillStyle='#5a3a1a'; ctx.fillRect(cx-Math.round(ts*.15),y+Math.round(ts*.71),Math.round(ts*.3),Math.round(ts*.06));
}
function __rtCT22(ctx,x,y,ts){
  ctx.fillStyle='#6b3a1f'; ctx.fillRect(x+Math.round(ts*.04),y+Math.round(ts*.02),Math.round(ts*.92),Math.round(ts*.96));
  ctx.fillStyle='#9c6d44';
  ctx.fillRect(x+Math.round(ts*.04),y+Math.round(ts*.02),Math.round(ts*.92),Math.round(ts*.06));
  ctx.fillRect(x+Math.round(ts*.04),y+ts/2-1,Math.round(ts*.92),Math.round(ts*.04));
  ctx.fillRect(x+Math.round(ts*.04),y+Math.round(ts*.92),Math.round(ts*.92),Math.round(ts*.06));
  const c1=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6'];
  const c2=['#1abc9c','#e67e22','#34495e','#c0392b','#8e44ad'];
  const bw=Math.max(2,Math.floor(ts*.17));
  for(let i=0;i<5;i++){
    const ox=Math.round(ts*.06)+i*(bw+1);
    ctx.fillStyle=c1[i]; ctx.fillRect(x+ox,y+Math.round(ts*.08),bw,Math.round(ts*.4));
    ctx.fillStyle=c2[i]; ctx.fillRect(x+ox,y+ts/2+Math.round(ts*.04),bw,Math.round(ts*.4));
  }
}
function __rtCT23(ctx,x,y,ts){
  const px=Math.round(x+ts/2-ts*.1);
  ctx.fillStyle='#a0a7ac'; ctx.fillRect(px,y+Math.round(ts*.06),Math.round(ts*.2),Math.round(ts*.88));
  ctx.fillStyle='#c0c8cc'; ctx.fillRect(px+Math.round(ts*.02),y+Math.round(ts*.08),Math.round(ts*.16),Math.round(ts*.84));
  ctx.fillStyle='#b0b8bc';
  for(let i=0;i<3;i++) ctx.fillRect(px+Math.round(ts*.02),y+Math.round(ts*.22+i*.25*ts),Math.round(ts*.16),Math.round(ts*.04));
  ctx.fillStyle='#888';
  ctx.fillRect(x+Math.round(ts*.17),y+Math.round(ts*.9),Math.round(ts*.66),Math.round(ts*.08));
  ctx.fillRect(x+Math.round(ts*.22),y+Math.round(ts*.84),Math.round(ts*.56),Math.round(ts*.07));
}
function __rtCT30(ctx,x,y,ts){
  ctx.fillStyle='#7a5230'; ctx.fillRect(x+Math.round(ts*.1),y+Math.round(ts*.38),Math.round(ts*.8),Math.round(ts*.1));
  ctx.fillStyle='#9c6d44'; ctx.fillRect(x+Math.round(ts*.1),y+Math.round(ts*.38),Math.round(ts*.8),Math.round(ts*.04));
  ctx.fillStyle='#a07830'; ctx.fillRect(x+Math.round(ts*.1),y+Math.round(ts*.52),Math.round(ts*.8),Math.round(ts*.12));
  ctx.fillStyle='#c09848'; ctx.fillRect(x+Math.round(ts*.1),y+Math.round(ts*.52),Math.round(ts*.8),Math.round(ts*.04));
  ctx.fillStyle='#666';
  ctx.fillRect(x+Math.round(ts*.16),y+Math.round(ts*.63),Math.round(ts*.1),Math.round(ts*.28));
  ctx.fillRect(x+Math.round(ts*.74),y+Math.round(ts*.63),Math.round(ts*.1),Math.round(ts*.28));
  ctx.fillRect(x+Math.round(ts*.16),y+Math.round(ts*.85),Math.round(ts*.68),Math.round(ts*.06));
}
function __rtCT31(ctx,x,y,ts){
  const cx=Math.round(x+ts/2);
  ctx.fillStyle='#6b3a1f'; ctx.fillRect(cx-Math.round(ts*.08),y+Math.round(ts*.52),Math.round(ts*.16),Math.round(ts*.44));
  ctx.fillStyle='#1a8a44';
  ctx.beginPath(); ctx.arc(cx,y+Math.round(ts*.45),Math.round(ts*.38),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#27ae60';
  ctx.beginPath(); ctx.arc(cx-Math.round(ts*.08),y+Math.round(ts*.38),Math.round(ts*.28),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2ecc71';
  ctx.beginPath(); ctx.arc(cx+Math.round(ts*.08),y+Math.round(ts*.34),Math.round(ts*.22),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.1)';
  ctx.beginPath(); ctx.arc(cx-Math.round(ts*.06),y+Math.round(ts*.32),Math.round(ts*.14),0,Math.PI*2); ctx.fill();
}
function __rtCT32(ctx,x,y,ts){
  ctx.fillStyle='rgba(0,0,0,.1)'; ctx.fillRect(x+Math.round(ts*.17),y+Math.round(ts*.54),Math.round(ts*.7),Math.round(ts*.38));
  ctx.fillStyle='#7a8085'; ctx.fillRect(x+Math.round(ts*.12),y+Math.round(ts*.42),Math.round(ts*.76),Math.round(ts*.5));
  ctx.fillStyle='#8e9499'; ctx.fillRect(x+Math.round(ts*.17),y+Math.round(ts*.3),Math.round(ts*.66),Math.round(ts*.25));
  ctx.fillStyle='#9aa0a5'; ctx.fillRect(x+Math.round(ts*.25),y+Math.round(ts*.21),Math.round(ts*.5),Math.round(ts*.2));
  ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(x+Math.round(ts*.27),y+Math.round(ts*.23),Math.round(ts*.15),Math.round(ts*.06));
}
function __rtCT33(ctx,x,y,ts){
  ctx.fillStyle='#2e8b57';
  const st=[[-ts*.18,ts*.18],[0,ts*.1],[ts*.18,ts*.22]];
  st.forEach(([dx,dy])=>{ ctx.fillRect(Math.round(x+ts/2+dx-1),Math.round(y+ts-dy-ts*.25),2,Math.round(ts*.25)); });
  const fc=['#ff69b4','#ff6347','#ffd700'];
  st.forEach(([dx,dy],i)=>{
    const cx2=Math.round(x+ts/2+dx), cy2=Math.round(y+ts-dy-ts*.27);
    ctx.fillStyle=fc[i]; ctx.beginPath(); ctx.arc(cx2,cy2,Math.max(2,Math.round(ts*.1)),0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(cx2,cy2,Math.max(1,Math.round(ts*.04)),0,Math.PI*2); ctx.fill();
  });
}
function __rtCT34(ctx,x,y,ts){
  ctx.fillStyle='#2c82c9'; ctx.fillRect(x+Math.round(ts*.06),y+Math.round(ts*.13),Math.round(ts*.88),Math.round(ts*.74));
  ctx.fillStyle='#3498db'; ctx.fillRect(x+Math.round(ts*.06),y+Math.round(ts*.13),Math.round(ts*.88),Math.round(ts*.08));
  ctx.fillStyle='#1a5c99'; ctx.fillRect(x+Math.round(ts*.06),y+Math.round(ts*.79),Math.round(ts*.88),Math.round(ts*.08));
  ctx.fillStyle='rgba(255,255,255,.12)';
  const sw=Math.max(2,Math.round(ts*.24));
  for(let i=0;i<3;i++) ctx.fillRect(x+Math.round(ts*.1)+i*(sw+2),y+Math.round(ts*.18),sw,Math.round(ts*.6));
  ctx.strokeStyle='#1a5c99'; ctx.lineWidth=Math.max(1,ts*.03);
  ctx.strokeRect(x+Math.round(ts*.06),y+Math.round(ts*.13),Math.round(ts*.88),Math.round(ts*.74));
}
function __rtCT35(ctx,x,y,ts){
  const cx=Math.round(x+ts/2), cy=Math.round(y+ts/2);
  ctx.fillStyle='#888'; ctx.fillRect(cx-Math.round(ts*.25),cy-Math.round(ts*.04),Math.round(ts*.5),Math.round(ts*.08));
  ctx.fillStyle='#555';
  ctx.fillRect(cx-Math.round(ts*.31),cy-Math.round(ts*.13),Math.round(ts*.08),Math.round(ts*.25));
  ctx.fillRect(cx+Math.round(ts*.23),cy-Math.round(ts*.13),Math.round(ts*.08),Math.round(ts*.25));
  ctx.fillStyle='#444';
  ctx.fillRect(cx-Math.round(ts*.38),cy-Math.round(ts*.15),Math.round(ts*.07),Math.round(ts*.29));
  ctx.fillRect(cx+Math.round(ts*.31),cy-Math.round(ts*.15),Math.round(ts*.07),Math.round(ts*.29));
  ctx.fillStyle='#aaa'; ctx.fillRect(cx-Math.round(ts*.17),cy-Math.round(ts*.02),Math.round(ts*.33),Math.round(ts*.04));
}
function __rtCT36(ctx,x,y,ts){
  const cx=Math.round(x+ts/2);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(cx-Math.round(ts*.15),y+Math.round(ts*.42),Math.round(ts*.29),Math.round(ts*.38));
  ctx.fillStyle='#34495e'; ctx.fillRect(cx-Math.round(ts*.17),y+Math.round(ts*.29),Math.round(ts*.33),Math.round(ts*.15));
  ctx.fillStyle='#7f8c8d'; ctx.fillRect(cx-Math.round(ts*.04),y+Math.round(ts*.21),Math.round(ts*.08),Math.round(ts*.08));
  ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(cx-Math.round(ts*.1),y+Math.round(ts*.44),Math.round(ts*.05),Math.round(ts*.3));
}
function __rtCT37(ctx,x,y,ts){
  const cx=Math.round(x+ts/2);
  ctx.fillStyle='#f5f0e8'; ctx.fillRect(cx-Math.round(ts*.08),y+Math.round(ts*.67),Math.round(ts*.17),Math.round(ts*.21));
  ctx.fillStyle='#e8e0d0'; ctx.fillRect(cx-Math.round(ts*.08),y+Math.round(ts*.6),Math.round(ts*.17),Math.round(ts*.08));
  ctx.fillStyle='#c0392b';
  ctx.fillRect(cx-Math.round(ts*.23),y+Math.round(ts*.43),Math.round(ts*.46),Math.round(ts*.19));
  ctx.fillRect(cx-Math.round(ts*.17),y+Math.round(ts*.29),Math.round(ts*.33),Math.round(ts*.17));
  ctx.fillRect(cx-Math.round(ts*.1),y+Math.round(ts*.21),Math.round(ts*.21),Math.round(ts*.12));
  ctx.fillStyle='rgba(255,255,255,.85)';
  ctx.fillRect(cx-Math.round(ts*.06),y+Math.round(ts*.31),Math.round(ts*.06),Math.round(ts*.06));
  ctx.fillRect(cx+Math.round(ts*.06),y+Math.round(ts*.45),Math.round(ts*.04),Math.round(ts*.04));
  ctx.fillRect(cx-Math.round(ts*.12),y+Math.round(ts*.48),Math.round(ts*.04),Math.round(ts*.04));
}
