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
const __rtProximityThreshold = 7; // 근접 판정 타일 거리 (유클리드)

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
    preset: PLAYER.preset,
    skin: PLAYER.skin,
    hcolor: PLAYER.hcolor,
    hair: PLAYER.hair,
    ccolor: PLAYER.ccolor,
    cloth: PLAYER.cloth,
    gender: PLAYER.gender,
    acc: PLAYER.acc,
    nickname: __rtNickname,
    map: __rtMapId,
    mDone: (typeof __msDone !== 'undefined') ? __msDone.size : 0,
    mTotal: (typeof __msMissions !== 'undefined' && __msMissions)
      ? __msMissions.filter(function(m){ return m.required; }).length : 0
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
      try{ __rtUpdateProgressPanel(__rtChannel.presenceState()); }catch(e){}
    });

    __rtChannel.on('broadcast', { event: 'bad_words_update' }, ({ payload }) => {
      if(payload && Array.isArray(payload.words)) __rtApplyCustomBadWords(payload.words);
    });

    __rtChannel.on('broadcast', { event: 'char_unlock_update' }, ({ payload }) => {
      if(!payload) return;
      const threshold = Number(payload.threshold) || 0;
      try{ localStorage.setItem('ssambus_anime_threshold_' + __rtRoomId, String(threshold)); }catch(e){}
      if(typeof __msCheckAnimeUnlock === 'function') __msCheckAnimeUnlock(threshold);
    });

    __rtChannel.on('broadcast', { event: 'chat_setting' }, ({ payload }) => {
      if(payload && payload.mode){
        __rtChatMode = payload.mode;
        __rtApplyChatMode();
      }
    });

    __rtChannel.on('broadcast', { event: 'map_reload' }, () => {
      setTimeout(__rtReloadOverlays, 400);
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
  __rtStudentId = localStorage.getItem('ssambus_student_id');
  if(!__rtStudentId){
    __rtStudentId = 'stu_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('ssambus_student_id', __rtStudentId);
  }
  if(__rtTeacherView) __rtStudentId = 'teacher_' + Math.random().toString(36).slice(2, 10);
  __rtNickname = __rtGetParam('nickname', null)
    || sessionStorage.getItem('ssambus_nickname')
    || ('학생' + Math.floor(1000 + Math.random()*9000));
  if(__rtNickname) sessionStorage.setItem('ssambus_nickname', __rtNickname);

  __rtClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  __rtConnect();
  __rtLoadChatMode();
  __rtLoadCustomBadWords();

  if(!__rtTeacherView){
    __rtBuildChatUI();
    __rtInjectNickStyle();
    __rtInjectLocalNick();
    __rtInitProgressPanel();
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
    #rt-chat-bar input{flex:1;min-width:0;padding:8px 10px;border:1px solid #ccc;border-radius:20px;font-size:16px}
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

  /* ── 모바일 키보드 표시 시 레이아웃 고정 ──────────────────────
     iOS : font-size≥16px 설정으로 자동 줌 방지됨(위 CSS 참조)
     Android : 키보드 등장 시 viewport 높이 축소 → stage-wrap 수축
               → 카메라 재계산 오류 → focus 시 높이 픽셀로 고정,
                  blur 후 복원 + resize 이벤트로 카메라 재정렬     */
  // 레이아웃 안정 후 초기 높이 저장 (키보드 등장 전 기준값)
  setTimeout(() => {
    const sw = document.querySelector('.stage-wrap');
    if(sw) window.__rtStableH = Math.round(sw.getBoundingClientRect().height);
  }, 300);

  function __rtLockStageH(){
    const sw = document.querySelector('.stage-wrap');
    if(!sw) return;
    const h = window.__rtStableH || Math.round(sw.getBoundingClientRect().height);
    window.__rtStableH = h;
    sw.style.height = h + 'px';
    sw.style.minHeight = h + 'px';
  }
  function __rtUnlockStageH(){
    const sw = document.querySelector('.stage-wrap');
    if(!sw) return;
    sw.style.height = '';
    sw.style.minHeight = '';
    // 키보드 완전 사라진 뒤 카메라 재정렬
    setTimeout(() => {
      const h = Math.round(sw.getBoundingClientRect().height);
      if(h > 50) window.__rtStableH = h;
      if(typeof updateCamera === 'function') updateCamera();
    }, 350);
  }
  input.addEventListener('focus', __rtLockStageH);
  input.addEventListener('blur',  __rtUnlockStageH);
  // 화면 회전 시 안정 높이 갱신
  window.addEventListener('orientationchange', () => {
    const sw = document.querySelector('.stage-wrap');
    if(sw) { sw.style.height = ''; sw.style.minHeight = ''; }
    setTimeout(() => {
      if(sw) window.__rtStableH = Math.round(sw.getBoundingClientRect().height);
      if(typeof updateCamera === 'function') updateCamera();
    }, 500);
  });

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

/* ── 욕설 필터 ── */
const __rtBadWords = [
  // 한국어
  '씨발','씨팔','씨바','쉬발','ㅅㅂ','개새끼','새끼','병신','ㅂㅅ','미친놈','미친년',
  '지랄','ㅈㄹ','꺼져','죽어라','보지','자지','창녀','잡년','개년','개놈','개같은',
  '좆','존나','ㅈㄴ','빠구리','섹스','강간','성폭행',
  // 영어
  'fuck','shit','bitch','bastard','cunt','asshole','dick','pussy','cock',
  'faggot','nigger','nigga','retard','whore','slut','motherfucker'
];
function __rtContainsBadWord(text){
  const norm = text.toLowerCase().replace(/\s+/g, '');
  return __rtBadWords.some(function(w){ return norm.includes(w.replace(/\s+/g, '')); });
}
function __rtShowFilterWarn(){
  let w = document.getElementById('rt-filter-warn');
  if(!w){
    w = document.createElement('div');
    w.id = 'rt-filter-warn';
    w.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);' +
      'background:rgba(192,57,43,.95);color:#fff;font-size:13px;padding:10px 18px;' +
      'border-radius:10px;z-index:70;max-width:300px;text-align:center;' +
      'box-shadow:0 2px 6px rgba(0,0,0,.25);font-family:sans-serif;display:none';
    document.body.appendChild(w);
  }
  w.textContent = '🚫 부적절한 표현이 포함된 메시지는 전송할 수 없어요.';
  w.style.display = 'block';
  clearTimeout(w._t);
  w._t = setTimeout(function(){ w.style.display = 'none'; }, 2500);
}

function __rtSendChat(text){
  if(__rtChatMode === 'disabled' && !__rtTeacherParticipant) return; // 교사가 채팅 금지 중 (교사 참가자는 면제)
  if(!__rtTeacherParticipant && __rtContainsBadWord(text)){ __rtShowFilterWarn(); return; }
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

/* 커스텀 금지 단어 로드 */
async function __rtLoadCustomBadWords(){
  try{
    const cl = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await cl
      .from('room_settings')
      .select('custom_bad_words')
      .eq('room_id', __rtRoomId)
      .maybeSingle();
    if(data && Array.isArray(data.custom_bad_words)) __rtApplyCustomBadWords(data.custom_bad_words);
  }catch(e){ /* 설정 미존재 시 기본 필터만 사용 */ }
}
function __rtApplyCustomBadWords(words){
  words.forEach(function(w){
    if(w && !__rtBadWords.includes(w.toLowerCase())) __rtBadWords.push(w.toLowerCase());
  });
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
let __rtMapOverlays = {}; // { 'r,c': tileType } — 앵커 셀만 저장
let __rtOvMapId = null, __rtOvCtx = null, __rtOvTs = null;

// 타일별 w×h 풋프린트 (기본 1×1, ALL_EDIT_TILES와 동기화)
const __RT_TILE_SPANS = {
  20:{w:2,h:1}, 22:{w:3,h:1}, 23:{w:1,h:2}, 30:{w:2,h:1}, 32:{w:2,h:2},
  34:{w:3,h:2}, 35:{w:2,h:2}, 38:{w:3,h:1}, 39:{w:2,h:1}, 40:{w:2,h:1},
  41:{w:3,h:1}, 44:{w:2,h:1}, 45:{w:1,h:2}, 46:{w:2,h:1}, 48:{w:2,h:3},
  49:{w:2,h:3}, 50:{w:3,h:3}, 52:{w:3,h:1}, 53:{w:4,h:2}, 56:{w:2,h:1},
  57:{w:5,h:1}, 58:{w:2,h:1}, 59:{w:3,h:1}, 61:{w:2,h:1}, 62:{w:3,h:3},
  63:{w:3,h:3}, 66:{w:2,h:2}, 67:{w:3,h:1}, 68:{w:3,h:2}, 69:{w:1,h:2},
  70:{w:2,h:2}, 71:{w:1,h:2}, 72:{w:3,h:1}, 73:{w:1,h:2}, 74:{w:2,h:2},
  76:{w:2,h:1}, 77:{w:3,h:2}, 78:{w:2,h:2}, 80:{w:2,h:2}, 81:{w:2,h:1},
  83:{w:3,h:2}, 86:{w:2,h:1}, 87:{w:2,h:2}, 88:{w:4,h:2}, 89:{w:4,h:1},
  90:{w:2,h:2}, 91:{w:2,h:2}, 92:{w:2,h:1}, 93:{w:2,h:4}, 96:{w:3,h:1}
};
function __tsW(t){ return (__RT_TILE_SPANS[t]||{}).w||1; }
function __tsH(t){ return (__RT_TILE_SPANS[t]||{}).h||1; }

function __rtIsOverlayBlocked(r, c){
  const direct = __rtMapOverlays[`${r},${c}`];
  if(direct && direct !== 0) return true;
  // 멀티타일 앵커의 확장 영역인지 확인
  for(let dr = -5; dr <= 0; dr++){
    for(let dc = -5; dc <= 0; dc++){
      if(dr===0 && dc===0) continue;
      const ak = `${r+dr},${c+dc}`;
      const av = __rtMapOverlays[ak];
      if(!av || av===0) continue;
      const aw=__tsW(av), ah=__tsH(av);
      if((r+dr)+ah>r && (r+dr)<=r && (c+dc)+aw>c && (c+dc)<=c) return true;
    }
  }
  return false;
}

async function loadMapOverlays(mapId, ctx, ts){
  if(!__rtClient || !__rtRoomId) return;
  __rtOvMapId = mapId; __rtOvCtx = ctx; __rtOvTs = ts;
  try{
    const { data } = await __rtClient
      .from('room_settings')
      .select('map_tiles')
      .eq('room_id', __rtRoomId)
      .maybeSingle();
    if(data && data.map_tiles && data.map_tiles[mapId]){
      __rtMapOverlays = data.map_tiles[mapId];
      // type 98 = 장애물: 이동 차단 목록 저장 + 맵 렌더루프 후크 등록
      window.__rtCustomBlockers = {};
      Object.entries(__rtMapOverlays).forEach(([key, type]) => {
        if(!type || type === 0) return;
        const [r, c] = key.split(',').map(Number);
        if(type === 98){
          window.__rtCustomBlockers[key] = true;
        } else {
          __rtDrawOverlayTile(ctx, c*ts, r*ts, ts, type);
        }
      });
      // 애니메이션 맵(race)용 사후 렌더 훅
      window.__rtPostDrawHook = function(){
        Object.keys(window.__rtCustomBlockers||{}).forEach(function(key){
          const [r,c]=key.split(',').map(Number);
          __rtDrawOverlayTile(ctx,c*ts,r*ts,ts,98);
        });
      };
    }
  }catch(e){ console.warn('[쌤버스] 맵 오버레이 로드 실패:', e); }
}

async function __rtReloadOverlays(){
  if(!__rtOvCtx || !__rtOvMapId || !__rtOvTs) return;
  __rtMapOverlays = {};
  if(typeof window.drawMap === 'function') window.drawMap();
  try{
    const { data } = await __rtClient.from('room_settings').select('map_tiles').eq('room_id',__rtRoomId).maybeSingle();
    if(data && data.map_tiles && data.map_tiles[__rtOvMapId]){
      __rtMapOverlays = data.map_tiles[__rtOvMapId];
      window.__rtCustomBlockers = {};
      Object.entries(__rtMapOverlays).forEach(([key, type]) => {
        if(!type || type === 0) return;
        const [r, c] = key.split(',').map(Number);
        if(type === 98){ window.__rtCustomBlockers[key] = true; }
        else { __rtDrawOverlayTile(__rtOvCtx, c*__rtOvTs, r*__rtOvTs, __rtOvTs, type); }
      });
    }
  }catch(e){ console.warn('[쌤버스] 맵 오버레이 리로드 실패:', e); }
}

function __rtDrawOverlayTile(ctx, x, y, ts, type){
  const tw=__tsW(type), th=__tsH(type);
  if(tw===1 && th===1){
    __rtDrawOverlayRaw(ctx,x,y,ts,type);
  } else {
    const off=document.createElement('canvas');
    off.width=ts; off.height=ts;
    __rtDrawOverlayRaw(off.getContext('2d'),0,0,ts,type,true);
    ctx.shadowColor='rgba(0,0,0,0.45)';ctx.shadowBlur=0;ctx.shadowOffsetX=5;ctx.shadowOffsetY=5;
    ctx.drawImage(off,x,y,tw*ts,th*ts);
    ctx.shadowColor='transparent';
  }
}
function __rtDrawOverlayRaw(ctx, x, y, ts, type, noShadow){
  if(!noShadow){ctx.shadowColor='rgba(0,0,0,0.45)';ctx.shadowBlur=0;ctx.shadowOffsetX=5;ctx.shadowOffsetY=5;}
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
    case 38: __rtCT38(ctx,x,y,ts); break;
    case 39: __rtCT39(ctx,x,y,ts); break;
    case 40: __rtCT40(ctx,x,y,ts); break;
    case 41: __rtCT41(ctx,x,y,ts); break;
    case 42: __rtCT42(ctx,x,y,ts); break;
    case 43: __rtCT43(ctx,x,y,ts); break;
    case 44: __rtCT44(ctx,x,y,ts); break;
    case 45: __rtCT45(ctx,x,y,ts); break;
    case 46: __rtCT46(ctx,x,y,ts); break;
    case 47: __rtCT47(ctx,x,y,ts); break;
    case 48: __rtCT48(ctx,x,y,ts); break;
    case 49: __rtCT49(ctx,x,y,ts); break;
    case 50: __rtCT50(ctx,x,y,ts); break;
    case 51: __rtCT51(ctx,x,y,ts); break;
    case 52: __rtCT52(ctx,x,y,ts); break;
    case 53: __rtCT53(ctx,x,y,ts); break;
    case 54: __rtCT54(ctx,x,y,ts); break;
    case 55: __rtCT55(ctx,x,y,ts); break;
    case 56: __rtCT56(ctx,x,y,ts); break;
    case 57: __rtCT57(ctx,x,y,ts); break;
    case 58: __rtCT58(ctx,x,y,ts); break;
    case 59: __rtCT59(ctx,x,y,ts); break;
    case 60: __rtCT60(ctx,x,y,ts); break;
    case 61: __rtCT61(ctx,x,y,ts); break;
    case 62: __rtCT62(ctx,x,y,ts); break;
    case 63: __rtCT63(ctx,x,y,ts); break;
    case 64: __rtCT64(ctx,x,y,ts); break;
    case 65: __rtCT65(ctx,x,y,ts); break;
    case 66: __rtCT66(ctx,x,y,ts); break;
    case 67: __rtCT67(ctx,x,y,ts); break;
    case 68: __rtCT68(ctx,x,y,ts); break;
    case 69: __rtCT69(ctx,x,y,ts); break;
    case 70: __rtCT70(ctx,x,y,ts); break;
    case 71: __rtCT71(ctx,x,y,ts); break;
    case 72: __rtCT72(ctx,x,y,ts); break;
    case 73: __rtCT73(ctx,x,y,ts); break;
    case 74: __rtCT74(ctx,x,y,ts); break;
    case 75: __rtCT75(ctx,x,y,ts); break;
    case 76: __rtCT76(ctx,x,y,ts); break;
    case 77: __rtCT77(ctx,x,y,ts); break;
    case 78: __rtCT78(ctx,x,y,ts); break;
    case 79: __rtCT79(ctx,x,y,ts); break;
    case 80: __rtCT80(ctx,x,y,ts); break;
    case 81: __rtCT81(ctx,x,y,ts); break;
    case 82: __rtCT82(ctx,x,y,ts); break;
    case 83: __rtCT83(ctx,x,y,ts); break;
    case 84: __rtCT84(ctx,x,y,ts); break;
    case 85: __rtCT85(ctx,x,y,ts); break;
    case 86: __rtCT86(ctx,x,y,ts); break;
    case 87: __rtCT87(ctx,x,y,ts); break;
    case 88: __rtCT88(ctx,x,y,ts); break;
    case 89: __rtCT89(ctx,x,y,ts); break;
    case 90: __rtCT90(ctx,x,y,ts); break;
    case 91: __rtCT91(ctx,x,y,ts); break;
    case 92: __rtCT92(ctx,x,y,ts); break;
    case 93: __rtCT93(ctx,x,y,ts); break;
    case 94: __rtCT94(ctx,x,y,ts); break;
    case 95: __rtCT95(ctx,x,y,ts); break;
    case 96: __rtCT96(ctx,x,y,ts); break;
    case 97: __rtCT97(ctx,x,y,ts); break;
    case 98: __rtCT98(ctx,x,y,ts); break;
  }
  if(!noShadow) ctx.shadowColor='transparent';
}
function __rtCT98(ctx,x,y,ts){
  ctx.fillStyle='#c0392b';
  ctx.fillRect(x+2,y+2,ts-4,ts-4);
  ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(2,Math.round(ts*0.08));
  ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(x+6,y+6);ctx.lineTo(x+ts-6,y+ts-6);
  ctx.moveTo(x+ts-6,y+6);ctx.lineTo(x+6,y+ts-6);
  ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1;
  ctx.strokeRect(x+1,y+1,ts-2,ts-2);
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

function __rtCT38(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#6b3a1f'; ctx.fillRect(x+r(.05),y+r(.25),r(.1),r(.6));
  ctx.fillRect(x+r(.85),y+r(.25),r(.1),r(.6));
  ctx.fillRect(x+r(.15),y+r(.2),r(.7),r(.28));
  ctx.fillStyle='#a06030'; ctx.fillRect(x+r(.05),y+r(.52),r(.9),r(.33));
  ctx.fillStyle='#c88050'; ctx.fillRect(x+r(.05),y+r(.52),r(.9),r(.06));
  ctx.fillStyle='#3a1f0a';
  ctx.fillRect(x+r(.12),y+r(.83),r(.08),r(.1)); ctx.fillRect(x+r(.8),y+r(.83),r(.08),r(.1));
}
/* 39 – TV/모니터 */
function __rtCT39(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#444'; ctx.fillRect(x+r(.06),y+r(.05),r(.88),r(.7));
  ctx.fillStyle='#111'; ctx.fillRect(x+r(.1),y+r(.09),r(.8),r(.62));
  ctx.fillStyle='rgba(80,150,220,.25)'; ctx.fillRect(x+r(.12),y+r(.11),r(.25),r(.12));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.4),y+r(.73),r(.2),r(.12));
  ctx.fillStyle='#333'; ctx.fillRect(x+r(.22),y+r(.84),r(.56),r(.1));
}
/* 40 – 사물함 */
function __rtCT40(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#7888a0'; ctx.fillRect(x+r(.08),y+r(.04),r(.84),r(.92));
  ctx.fillStyle='#5a6a7a'; ctx.fillRect(x+r(.08),y+r(.5),r(.84),r(.02));
  ctx.fillStyle='#c0c8d0'; ctx.fillRect(x+r(.68),y+r(.22),r(.08),r(.05));
  ctx.fillRect(x+r(.68),y+r(.66),r(.08),r(.05));
  ctx.fillStyle='#3a4a5a';
  for(let i=0;i<4;i++) ctx.fillRect(x+r(.1),y+r(.18)+i*r(.08),r(.4),r(.01));
}
/* 41 – 게시판 */
function __rtCT41(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#5a3a1f'; ctx.fillRect(x+r(.04),y+r(.06),r(.92),r(.88));
  ctx.fillStyle='#c8a46e'; ctx.fillRect(x+r(.08),y+r(.1),r(.84),r(.8));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.12),y+r(.14),r(.32),r(.22));
  ctx.fillRect(x+r(.52),y+r(.14),r(.32),r(.28));
  ctx.fillRect(x+r(.12),y+r(.5),r(.32),r(.3));
  ctx.fillStyle='#fffdd0'; ctx.fillRect(x+r(.52),y+r(.54),r(.32),r(.26));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.14),y+r(.13),r(.04),r(.04));
  ctx.fillRect(x+r(.54),y+r(.13),r(.04),r(.04));
  ctx.fillRect(x+r(.14),y+r(.49),r(.04),r(.04));
}
/* 42 – 선풍기 */
function __rtCT42(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#666'; ctx.fillRect(cx-r(.06),y+r(.55),r(.12),r(.34));
  ctx.fillStyle='#555'; ctx.fillRect(cx-r(.18),y+r(.86),r(.36),r(.08));
  ctx.fillStyle='#8a9096';
  ctx.beginPath(); ctx.arc(cx,y+r(.35),r(.3),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#b0b8bc';
  ctx.beginPath(); ctx.arc(cx,y+r(.35),r(.22),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#444';
  ctx.beginPath(); ctx.arc(cx,y+r(.35),r(.07),0,Math.PI*2); ctx.fill();
}
/* 43 – 독서 램프 */
function __rtCT43(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.28),y+r(.88),r(.44),r(.08));
  ctx.fillRect(x+r(.44),y+r(.42),r(.1),r(.48));
  ctx.fillStyle='#f4c430';
  ctx.beginPath();
  ctx.moveTo(x+r(.06),y+r(.5)); ctx.lineTo(x+r(.88),y+r(.5));
  ctx.lineTo(x+r(.7),y+r(.2)); ctx.lineTo(x+r(.24),y+r(.2)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#e8a820';
  ctx.beginPath();
  ctx.moveTo(x+r(.18),y+r(.46)); ctx.lineTo(x+r(.82),y+r(.46));
  ctx.lineTo(x+r(.66),y+r(.22)); ctx.lineTo(x+r(.28),y+r(.22)); ctx.closePath(); ctx.fill();
}
/* 44 – 복사기 */
function __rtCT44(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#909090'; ctx.fillRect(x+r(.06),y+r(.24),r(.88),r(.7));
  ctx.fillStyle='#b8c8d8'; ctx.fillRect(x+r(.08),y+r(.1),r(.84),r(.16));
  ctx.fillStyle='#a0a0a0'; ctx.fillRect(x+r(.52),y+r(.34),r(.38),r(.22));
  ctx.fillStyle='#3498db'; ctx.fillRect(x+r(.56),y+r(.38),r(.06),r(.06));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.64),y+r(.38),r(.06),r(.06));
  ctx.fillStyle='#2ecc71'; ctx.fillRect(x+r(.72),y+r(.38),r(.06),r(.06));
  ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+r(.1),y+r(.56),r(.34),r(.18));
  ctx.fillRect(x+r(.1),y+r(.84),r(.34),r(.06));
}
/* 45 – 잡지 꽂이 */
function __rtCT45(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#8B6914'; ctx.fillRect(x+r(.06),y+r(.14),r(.08),r(.76));
  ctx.fillRect(x+r(.86),y+r(.14),r(.08),r(.76));
  ctx.fillRect(x+r(.06),y+r(.82),r(.88),r(.08));
  const cols=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6'];
  const bw=r(.13);
  for(let i=0;i<5;i++){
    ctx.fillStyle=cols[i];
    ctx.fillRect(x+r(.14)+i*(bw+r(.02)),y+r(.18),bw,r(.64));
  }
}
/* 46 – 수조 */
function __rtCT46(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.04),y+r(.08),r(.92),r(.84));
  ctx.fillStyle='#2980b9'; ctx.fillRect(x+r(.08),y+r(.12),r(.84),r(.76));
  ctx.fillStyle='#1f6698'; ctx.fillRect(x+r(.08),y+r(.74),r(.84),r(.14));
  ctx.fillStyle='#c8a06e'; ctx.fillRect(x+r(.08),y+r(.82),r(.84),r(.06));
  ctx.fillStyle='#27ae60'; ctx.fillRect(x+r(.12),y+r(.6),r(.06),r(.18));
  ctx.fillRect(x+r(.76),y+r(.54),r(.06),r(.24));
  ctx.fillStyle='#e67e22'; ctx.fillRect(x+r(.3),y+r(.4),r(.1),r(.06));
  ctx.fillRect(x+r(.58),y+r(.52),r(.08),r(.05));
}
/* 47 – 방석 */
function __rtCT47(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5),cy=y+r(.52);
  ctx.fillStyle='#d080a8';
  ctx.beginPath(); ctx.ellipse(cx,cy,r(.4),r(.32),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#e8a0c0';
  ctx.beginPath(); ctx.ellipse(cx,cy,r(.34),r(.26),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c06080';
  ctx.fillRect(cx-r(.02),cy-r(.26),r(.04),r(.52));
  ctx.fillRect(cx-r(.34),cy-r(.02),r(.68),r(.04));
}

/* 48 – 미끄럼틀 */
function __rtCT48(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.06),y+r(.08),r(.06),r(.86));
  ctx.fillRect(x+r(.7),y+r(.08),r(.06),r(.4));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.62),y+r(.06),r(.3),r(.2));
  ctx.fillStyle='#f1c40f';
  ctx.beginPath();
  ctx.moveTo(x+r(.62),y+r(.26)); ctx.lineTo(x+r(.92),y+r(.26));
  ctx.lineTo(x+r(.2),y+r(.88)); ctx.lineTo(x+r(.08),y+r(.82)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.06),y+r(.88),r(.9),r(.06));
}
/* 49 – 그네 */
function __rtCT49(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.06),y+r(.06),r(.08),r(.88));
  ctx.fillRect(x+r(.86),y+r(.06),r(.08),r(.88));
  ctx.fillRect(x+r(.06),y+r(.06),r(.88),r(.07));
  ctx.fillStyle='#aaa';
  ctx.fillRect(x+r(.26),y+r(.14),r(.04),r(.58));
  ctx.fillRect(x+r(.7),y+r(.14),r(.04),r(.58));
  ctx.fillStyle='#a07830'; ctx.fillRect(x+r(.22),y+r(.7),r(.56),r(.1));
}
/* 50 – 모래놀이 */
function __rtCT50(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#8B6914'; ctx.fillRect(x+r(.06),y+r(.2),r(.88),r(.64));
  ctx.fillStyle='#F5DEB3'; ctx.fillRect(x+r(.1),y+r(.24),r(.8),r(.56));
  ctx.fillStyle='#DEB887'; ctx.fillRect(x+r(.18),y+r(.5),r(.22),r(.2));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.52),y+r(.36),r(.06),r(.14));
  ctx.fillRect(x+r(.46),y+r(.36),r(.18),r(.05));
}
/* 51 – 음수대 */
function __rtCT51(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#4a5a8a'; ctx.fillRect(cx-r(.14),y+r(.46),r(.28),r(.46));
  ctx.fillStyle='#6678aa'; ctx.fillRect(cx-r(.22),y+r(.34),r(.44),r(.14));
  ctx.fillRect(cx-r(.18),y+r(.3),r(.36),r(.08));
  ctx.fillStyle='#aab8cc'; ctx.fillRect(cx+r(.08),y+r(.32),r(.08),r(.04));
  ctx.fillStyle='#87ceeb'; ctx.fillRect(cx+r(.1),y+r(.36),r(.02),r(.06));
  ctx.fillStyle='#333'; ctx.fillRect(cx-r(.1),y+r(.88),r(.2),r(.08));
}
/* 52 – 철봉 */
function __rtCT52(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#6a7480'; ctx.fillRect(x+r(.06),y+r(.18),r(.1),r(.74));
  ctx.fillRect(x+r(.84),y+r(.18),r(.1),r(.74));
  ctx.fillStyle='#8a9096'; ctx.fillRect(x+r(.06),y+r(.18),r(.88),r(.1));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.04),y+r(.86),r(.14),r(.08));
  ctx.fillRect(x+r(.82),y+r(.86),r(.14),r(.08));
}
/* 53 – 탁구대 */
function __rtCT53(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#1a6b2e'; ctx.fillRect(x+r(.06),y+r(.14),r(.88),r(.64));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.06),y+r(.44),r(.88),r(.02));
  ctx.fillRect(x+r(.06),y+r(.14),r(.88),r(.03));
  ctx.fillStyle='#555';
  ctx.fillRect(x+r(.1),y+r(.76),r(.06),r(.16)); ctx.fillRect(x+r(.84),y+r(.76),r(.06),r(.16));
  ctx.fillRect(x+r(.26),y+r(.76),r(.06),r(.14)); ctx.fillRect(x+r(.68),y+r(.76),r(.06),r(.14));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.49),y+r(.22),r(.02),r(.24));
}
/* 54 – 훌라후프 */
function __rtCT54(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5),cy=y+r(.5);
  ctx.strokeStyle='#e74c3c'; ctx.lineWidth=r(.14);
  ctx.beginPath(); ctx.arc(cx,cy,r(.36),0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='#c0392b'; ctx.lineWidth=r(.04);
  ctx.beginPath(); ctx.arc(cx,cy,r(.36),0,Math.PI*2); ctx.stroke();
  ctx.lineWidth=1;
}
/* 55 – 체중계 */
function __rtCT55(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#ccc'; ctx.fillRect(x+r(.1),y+r(.1),r(.8),r(.55));
  ctx.fillStyle='#e8e8e8';
  ctx.beginPath(); ctx.ellipse(cx,y+r(.36),r(.3),r(.22),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#888';
  ctx.beginPath(); ctx.arc(cx,y+r(.36),r(.04),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#e74c3c'; ctx.fillRect(cx-r(.02),y+r(.16),r(.04),r(.18));
  ctx.fillStyle='#3a3a3a'; ctx.fillRect(x+r(.08),y+r(.62),r(.84),r(.28));
}
/* 56 – 거울 */
function __rtCT56(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#a08030'; ctx.fillRect(x+r(.08),y+r(.04),r(.84),r(.92));
  ctx.fillStyle='#c8dff0'; ctx.fillRect(x+r(.14),y+r(.08),r(.72),r(.84));
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x+r(.16),y+r(.1),r(.2),r(.6));
  ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x+r(.38),y+r(.1),r(.08),r(.25));
}
/* 57 – 배드민턴 네트 */
function __rtCT57(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#666'; ctx.fillRect(x+r(.04),y+r(.08),r(.08),r(.84));
  ctx.fillRect(x+r(.88),y+r(.08),r(.08),r(.84));
  ctx.fillRect(x+r(.04),y+r(.86),r(.92),r(.06));
  ctx.fillStyle='#ddd'; ctx.fillRect(x+r(.12),y+r(.2),r(.76),r(.02));
  ctx.fillRect(x+r(.12),y+r(.34),r(.76),r(.02));
  ctx.fillRect(x+r(.12),y+r(.48),r(.76),r(.02));
  ctx.fillRect(x+r(.12),y+r(.62),r(.76),r(.02));
  for(let i=0;i<7;i++) ctx.fillRect(x+r(.12)+i*r(.12),y+r(.2),r(.02),r(.46));
}
/* 58 – 버스정류장 */
function __rtCT58(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#2c5fab'; ctx.fillRect(x+r(.04),y+r(.04),r(.92),r(.12));
  ctx.fillStyle='#444'; ctx.fillRect(cx-r(.04),y+r(.14),r(.08),r(.8));
  ctx.fillStyle='#f1c40f'; ctx.fillRect(cx-r(.24),y+r(.2),r(.48),r(.24));
  ctx.fillStyle='#1a3a7a'; ctx.fillRect(cx-r(.2),y+r(.22),r(.4),r(.2));
  ctx.fillStyle='#333'; ctx.fillRect(cx-r(.04),y+r(.9),r(.08),r(.06));
}
/* 59 – 자전거 거치대 */
function __rtCT59(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#8a9096';
  ctx.fillRect(x+r(.12),y+r(.3),r(.1),r(.6));
  ctx.fillRect(x+r(.78),y+r(.3),r(.1),r(.6));
  ctx.fillRect(x+r(.12),y+r(.3),r(.76),r(.08));
  ctx.fillRect(x+r(.44),y+r(.3),r(.12),r(.08));
  ctx.fillRect(x+r(.12),y+r(.84),r(.76),r(.06));
}
/* 60 – 가로등 */
function __rtCT60(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(cx-r(.04),y+r(.18),r(.08),r(.76));
  ctx.fillRect(cx-r(.04),y+r(.12),r(.3),r(.06));
  ctx.fillRect(cx+r(.22),y+r(.06),r(.1),r(.12));
  ctx.fillStyle='#f9e06e'; ctx.fillRect(cx+r(.18),y+r(.04),r(.18),r(.1));
  ctx.fillStyle='#f1c40f'; ctx.fillRect(cx+r(.2),y+r(.05),r(.14),r(.06));
  ctx.fillStyle='#444'; ctx.fillRect(cx-r(.1),y+r(.9),r(.2),r(.08));
}
/* 61 – 자판기 */
function __rtCT61(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.08),y+r(.04),r(.84),r(.92));
  ctx.fillStyle='#1a252f'; ctx.fillRect(x+r(.12),y+r(.08),r(.76),r(.48));
  const pc=['#e74c3c','#3498db','#f1c40f','#2ecc71','#e67e22','#9b59b6'];
  const pw=r(.22),ph=r(.14);
  for(let r2=0;r2<2;r2++) for(let c2=0;c2<3;c2++){
    ctx.fillStyle=pc[r2*3+c2];
    ctx.fillRect(x+r(.14)+c2*(pw+r(.02)),y+r(.1)+r2*(ph+r(.02)),pw,ph);
  }
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.14),y+r(.6),r(.72),r(.16));
  ctx.fillStyle='#222'; ctx.fillRect(x+r(.18),y+r(.8),r(.64),r(.1));
}
/* 62 – 분수대 */
function __rtCT62(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#778899'; ctx.fillRect(x+r(.08),y+r(.54),r(.84),r(.34));
  ctx.fillStyle='#2980b9'; ctx.fillRect(x+r(.12),y+r(.58),r(.76),r(.26));
  ctx.fillStyle='#5566aa'; ctx.fillRect(cx-r(.06),y+r(.34),r(.12),r(.22));
  ctx.fillStyle='#87ceeb';
  ctx.fillRect(cx-r(.02),y+r(.1),r(.04),r(.26));
  ctx.fillRect(cx-r(.12),y+r(.16),r(.06),r(.06));
  ctx.fillRect(cx+r(.06),y+r(.16),r(.06),r(.06));
}
/* 63 – 텐트 */
function __rtCT63(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#e67e22';
  ctx.beginPath();
  ctx.moveTo(x+r(.5),y+r(.06)); ctx.lineTo(x+r(.96),y+r(.88));
  ctx.lineTo(x+r(.04),y+r(.88)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#c0602a'; ctx.fillRect(x+r(.04),y+r(.88),r(.92),r(.06));
  ctx.fillStyle='#2c1a06';
  ctx.beginPath();
  ctx.moveTo(x+r(.5),y+r(.3)); ctx.lineTo(x+r(.62),y+r(.88));
  ctx.lineTo(x+r(.38),y+r(.88)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,200,80,.2)'; ctx.fillRect(x+r(.1),y+r(.5),r(.3),r(.3));
}
/* 64 – 모닥불 */
function __rtCT64(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#6b3a1f'; ctx.fillRect(cx-r(.3),y+r(.7),r(.6),r(.08));
  ctx.fillRect(cx-r(.1),y+r(.58),r(.2),r(.2));
  ctx.fillStyle='#ffd700'; ctx.fillRect(cx-r(.18),y+r(.52),r(.36),r(.2));
  ctx.fillStyle='#f39c12';
  ctx.beginPath();
  ctx.moveTo(cx,y+r(.2)); ctx.lineTo(cx+r(.2),y+r(.56)); ctx.lineTo(cx-r(.2),y+r(.56)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#e74c3c';
  ctx.beginPath();
  ctx.moveTo(cx,y+r(.3)); ctx.lineTo(cx+r(.14),y+r(.56)); ctx.lineTo(cx-r(.14),y+r(.56)); ctx.closePath(); ctx.fill();
}
/* 65 – 새집 */
function __rtCT65(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#8B6914'; ctx.fillRect(cx-r(.04),y+r(.56),r(.08),r(.38));
  ctx.fillStyle='#c8a06e'; ctx.fillRect(cx-r(.26),y+r(.38),r(.52),r(.22));
  ctx.fillStyle='#6b4914';
  ctx.beginPath();
  ctx.moveTo(cx,y+r(.18)); ctx.lineTo(cx+r(.3),y+r(.4)); ctx.lineTo(cx-r(.3),y+r(.4)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.arc(cx,y+r(.48),r(.07),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#8B6914'; ctx.fillRect(cx-r(.06),y+r(.54),r(.12),r(.03));
}
/* 66 – 덤불 */
function __rtCT66(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#1a7a38';
  ctx.beginPath(); ctx.arc(x+r(.3),y+r(.55),r(.28),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.7),y+r(.55),r(.28),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.5),y+r(.38),r(.28),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#27ae60';
  ctx.beginPath(); ctx.arc(x+r(.3),y+r(.52),r(.2),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.7),y+r(.52),r(.2),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.5),y+r(.36),r(.2),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2ecc71';
  ctx.beginPath(); ctx.arc(x+r(.34),y+r(.48),r(.1),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.64),y+r(.5),r(.1),0,Math.PI*2); ctx.fill();
}
/* 67 – 통나무 */
function __rtCT67(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#8B4513'; ctx.fillRect(x+r(.14),y+r(.32),r(.72),r(.36));
  ctx.fillStyle='#654321';
  ctx.beginPath(); ctx.ellipse(x+r(.18),y+r(.5),r(.08),r(.18),0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+r(.82),y+r(.5),r(.08),r(.18),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#a05020';
  for(let i=1;i<4;i++) ctx.fillRect(x+r(.14),y+r(.32)+i*r(.09),r(.72),r(.02));
  ctx.fillStyle='#5a2e0a'; ctx.fillRect(x+r(.14),y+r(.32),r(.02),r(.36));
  ctx.fillRect(x+r(.84),y+r(.32),r(.02),r(.36));
}

/* 68 – 피아노 */
function __rtCT68(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+r(.06),y+r(.04),r(.88),r(.88));
  ctx.fillStyle='#333'; ctx.fillRect(x+r(.06),y+r(.04),r(.09),r(.88));
  ctx.fillRect(x+r(.85),y+r(.04),r(.09),r(.88));
  ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+r(.1),y+r(.72),r(.8),r(.16));
  ctx.fillStyle='#111';
  for(var i=0;i<5;i++) ctx.fillRect(x+r(.14)+i*r(.14),y+r(.72),r(.08),r(.1));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.18),y+r(.16),r(.64),r(.26));
  ctx.fillStyle='#aaa';
  for(var i=0;i<5;i++) ctx.fillRect(x+r(.2),y+r(.2)+i*r(.04),r(.6),r(.01));
}
/* 69 – 악보대 */
function __rtCT69(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.45),y+r(.52),r(.1),r(.4));
  ctx.fillRect(x+r(.18),y+r(.88),r(.64),r(.06));
  ctx.fillStyle='#bbb'; ctx.fillRect(x+r(.1),y+r(.5),r(.8),r(.06));
  ctx.fillStyle='#ddd'; ctx.fillRect(x+r(.1),y+r(.18),r(.8),r(.34));
  ctx.fillStyle='#333';
  for(var i=0;i<5;i++) ctx.fillRect(x+r(.13),y+r(.22)+i*r(.05),r(.74),r(.01));
}
/* 70 – 드럼 */
function __rtCT70(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5),cy=y+r(.6);
  ctx.fillStyle='#a0291a';
  ctx.beginPath(); ctx.ellipse(cx,cy,r(.26),r(.18),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#e74c3c';
  ctx.beginPath(); ctx.ellipse(cx,cy,r(.2),r(.13),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8a06e';
  ctx.beginPath(); ctx.ellipse(x+r(.28),cy-r(.14),r(.14),r(.09),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8b820';
  ctx.beginPath(); ctx.ellipse(x+r(.76),y+r(.28),r(.18),r(.05),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3498db';
  ctx.beginPath(); ctx.ellipse(cx,y+r(.32),r(.14),r(.09),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8a060'; ctx.fillRect(cx-r(.02),y+r(.16),r(.06),r(.26));
}
/* 71 – 기타 */
function __rtCT71(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#8B4010';
  ctx.beginPath(); ctx.ellipse(cx,y+r(.72),r(.22),r(.2),0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx,y+r(.48),r(.15),r(.15),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6a300a';
  ctx.beginPath(); ctx.arc(cx,y+r(.6),r(.08),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c8a060'; ctx.fillRect(cx-r(.04),y+r(.04),r(.08),r(.46));
  ctx.fillStyle='#a07040'; ctx.fillRect(cx-r(.08),y+r(.02),r(.16),r(.07));
  ctx.fillStyle='rgba(200,200,200,.7)';
  for(var i=0;i<3;i++) ctx.fillRect(cx-r(.02)+i*r(.02),y+r(.04),r(.01),r(.88));
}
/* 72 – 신시사이저 */
function __rtCT72(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#222'; ctx.fillRect(x+r(.04),y+r(.28),r(.92),r(.64));
  ctx.fillStyle='#00aa44'; ctx.fillRect(x+r(.08),y+r(.32),r(.28),r(.2));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.4),y+r(.34),r(.06),r(.06));
  ctx.fillStyle='#3498db'; ctx.fillRect(x+r(.48),y+r(.34),r(.06),r(.06));
  ctx.fillStyle='#f1c40f'; ctx.fillRect(x+r(.56),y+r(.34),r(.06),r(.06));
  ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+r(.08),y+r(.58),r(.84),r(.22));
  ctx.fillStyle='#333';
  for(var i=0;i<7;i++) ctx.fillRect(x+r(.1)+i*r(.1),y+r(.58),r(.055),r(.14));
  ctx.fillStyle='#555';
  ctx.fillRect(x+r(.1),y+r(.88),r(.08),r(.1)); ctx.fillRect(x+r(.82),y+r(.88),r(.08),r(.1));
}
/* 73 – 이젤 */
function __rtCT73(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#d4a06e'; ctx.fillRect(x+r(.14),y+r(.06),r(.72),r(.56));
  ctx.fillStyle='#87ceeb'; ctx.fillRect(x+r(.18),y+r(.1),r(.64),r(.2));
  ctx.fillStyle='#228b22'; ctx.fillRect(x+r(.18),y+r(.3),r(.64),r(.28));
  ctx.fillStyle='#c0392b'; ctx.fillRect(x+r(.3),y+r(.22),r(.16),r(.18));
  ctx.fillStyle='#8B6914';
  ctx.fillRect(x+r(.28),y+r(.6),r(.06),r(.38)); ctx.fillRect(x+r(.66),y+r(.6),r(.06),r(.38));
  ctx.fillRect(x+r(.16),y+r(.88),r(.18),r(.06)); ctx.fillRect(x+r(.66),y+r(.88),r(.18),r(.06));
  ctx.fillRect(x+r(.28),y+r(.72),r(.44),r(.04));
}
/* 74 – 조각대 */
function __rtCT74(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.3),y+r(.7),r(.4),r(.24));
  ctx.fillStyle='#aaa'; ctx.fillRect(x+r(.38),y+r(.32),r(.24),r(.4));
  ctx.fillStyle='#c8a06e';
  ctx.beginPath(); ctx.ellipse(cx,y+r(.27),r(.22),r(.18),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#deb887';
  ctx.beginPath(); ctx.ellipse(cx-r(.06),y+r(.22),r(.12),r(.1),0,0,Math.PI*2); ctx.fill();
}
/* 75 – 물감 팔레트 */
function __rtCT75(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5),cy=y+r(.55);
  ctx.fillStyle='#d4a06e';
  ctx.beginPath(); ctx.ellipse(cx,cy,r(.44),r(.34),0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#c0602a';
  ctx.beginPath(); ctx.arc(x+r(.22),cy-r(.04),r(.1),0,Math.PI*2); ctx.fill();
  const pc=['#e74c3c','#3498db','#f1c40f','#2ecc71','#e67e22','#9b59b6'];
  const bp=[[.42,.28],[.64,.28],[.78,.42],[.78,.64],[.64,.76],[.42,.76]];
  for(var i=0;i<6;i++){
    ctx.fillStyle=pc[i];
    ctx.beginPath(); ctx.arc(x+r(bp[i][0]),y+r(bp[i][1]),r(.06),0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle='#8B6914'; ctx.fillRect(x+r(.08),y+r(.08),r(.06),r(.38));
  ctx.fillStyle='#e74c3c';
  ctx.beginPath();
  ctx.moveTo(x+r(.08),y+r(.44)); ctx.lineTo(x+r(.14),y+r(.44)); ctx.lineTo(x+r(.11),y+r(.5)); ctx.closePath(); ctx.fill();
}
/* 76 – 전시대 */
function __rtCT76(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.06),y+r(.04),r(.88),r(.72));
  ctx.fillStyle='#f5f5f5'; ctx.fillRect(x+r(.1),y+r(.08),r(.8),r(.64));
  ctx.fillStyle='#87ceeb'; ctx.fillRect(x+r(.12),y+r(.1),r(.76),r(.28));
  ctx.fillStyle='#228b22'; ctx.fillRect(x+r(.12),y+r(.38),r(.76),r(.28));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.3),y+r(.28),r(.22),r(.2));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.42),y+r(.74),r(.16),r(.14));
  ctx.fillRect(x+r(.3),y+r(.86),r(.4),r(.06));
}
/* 77 – 긴 작업 테이블 */
function __rtCT77(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#5a3010'; ctx.fillRect(x+r(.04),y+r(.14),r(.92),r(.48));
  ctx.fillStyle='#c8a06e'; ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.4));
  ctx.fillStyle='#dfc09a'; ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.06));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.1),y+r(.22),r(.12),r(.14));
  ctx.fillStyle='#f1c40f'; ctx.fillRect(x+r(.26),y+r(.25),r(.03),r(.1));
  ctx.fillStyle='#3498db'; ctx.fillRect(x+r(.5),y+r(.22),r(.12),r(.14));
  ctx.fillStyle='#4a2508';
  ctx.fillRect(x+r(.08),y+r(.58),r(.08),r(.34)); ctx.fillRect(x+r(.84),y+r(.58),r(.08),r(.34));
  ctx.fillRect(x+r(.3),y+r(.58),r(.06),r(.3)); ctx.fillRect(x+r(.64),y+r(.58),r(.06),r(.3));
}
/* 78 – PC 데스크탑 */
function __rtCT78(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#333'; ctx.fillRect(x+r(.08),y+r(.04),r(.64),r(.5));
  ctx.fillStyle='#2040aa'; ctx.fillRect(x+r(.11),y+r(.07),r(.58),r(.44));
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(x+r(.13),y+r(.09),r(.18),r(.1));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.34),y+r(.52),r(.14),r(.08));
  ctx.fillRect(x+r(.26),y+r(.58),r(.3),r(.04));
  ctx.fillStyle='#4a4a4a'; ctx.fillRect(x+r(.78),y+r(.14),r(.16),r(.7));
  ctx.fillStyle='#00ff88';
  ctx.beginPath(); ctx.arc(x+r(.84),y+r(.72),r(.03),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3a3a3a'; ctx.fillRect(x+r(.06),y+r(.64),r(.6),r(.16));
  ctx.fillStyle='#555';
  for(var i=0;i<9;i++) ctx.fillRect(x+r(.08)+i*r(.06),y+r(.66),r(.045),r(.05));
}
/* 79 – 노트북 */
function __rtCT79(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2a2a2a';
  ctx.beginPath();
  ctx.moveTo(x+r(.08),y+r(.08)); ctx.lineTo(x+r(.92),y+r(.08));
  ctx.lineTo(x+r(.82),y+r(.5)); ctx.lineTo(x+r(.18),y+r(.5)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#1a90c0';
  ctx.beginPath();
  ctx.moveTo(x+r(.1),y+r(.1)); ctx.lineTo(x+r(.9),y+r(.1));
  ctx.lineTo(x+r(.81),y+r(.47)); ctx.lineTo(x+r(.19),y+r(.47)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(x+r(.12),y+r(.12),r(.2),r(.1));
  ctx.fillStyle='#3a3a3a'; ctx.fillRect(x+r(.06),y+r(.5),r(.88),r(.36));
  ctx.fillStyle='#555';
  for(var i=0;i<9;i++) ctx.fillRect(x+r(.1)+i*r(.085),y+r(.54),r(.07),r(.07));
  ctx.fillStyle='#444'; ctx.fillRect(x+r(.28),y+r(.72),r(.44),r(.1));
}
/* 80 – 서버랙 */
function __rtCT80(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+r(.1),y+r(.04),r(.8),r(.92));
  ctx.fillStyle='#2a2a2a'; ctx.fillRect(x+r(.13),y+r(.07),r(.74),r(.86));
  for(var i=0;i<7;i++){
    ctx.fillStyle=i%2===0?'#333':'#3a3a3a';
    ctx.fillRect(x+r(.14),y+r(.09)+i*r(.12),r(.72),r(.1));
    ctx.fillStyle='#00ff44'; ctx.fillRect(x+r(.16),y+r(.12)+i*r(.12),r(.04),r(.04));
    ctx.fillStyle='#ff8800'; ctx.fillRect(x+r(.22),y+r(.12)+i*r(.12),r(.04),r(.04));
    ctx.fillStyle='#444';
    for(var j=0;j<4;j++) ctx.fillRect(x+r(.3)+j*r(.1),y+r(.1)+i*r(.12),r(.08),r(.08));
  }
}
/* 81 – 프린터 */
function __rtCT81(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#c8c8c8'; ctx.fillRect(x+r(.08),y+r(.24),r(.84),r(.6));
  ctx.fillStyle='#b8b8b8'; ctx.fillRect(x+r(.08),y+r(.2),r(.84),r(.08));
  ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+r(.1),y+r(.12),r(.8),r(.1));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.16),y+r(.06),r(.68),r(.08));
  ctx.fillStyle='#a0a0a0'; ctx.fillRect(x+r(.7),y+r(.3),r(.18),r(.18));
  ctx.fillStyle='#2ecc71'; ctx.fillRect(x+r(.74),y+r(.34),r(.06),r(.06));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.74),y+r(.42),r(.06),r(.06));
  ctx.fillStyle='#e0e0e0'; ctx.fillRect(x+r(.14),y+r(.3),r(.48),r(.1));
}
/* 82 – 공유기 */
function __rtCT82(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#f0f0f0'; ctx.fillRect(x+r(.06),y+r(.4),r(.88),r(.28));
  ctx.fillStyle='#e0e0e0'; ctx.fillRect(x+r(.06),y+r(.38),r(.88),r(.04));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.2),y+r(.12),r(.04),r(.28));
  ctx.fillRect(x+r(.76),y+r(.12),r(.04),r(.28));
  ctx.fillStyle='#00ff44';
  for(var i=0;i<5;i++) ctx.fillRect(x+r(.12)+i*r(.16),y+r(.44),r(.07),r(.04));
  ctx.fillStyle='#aaa';
  for(var i=0;i<5;i++) ctx.fillRect(x+r(.12)+i*r(.14),y+r(.6),r(.08),r(.05));
  ctx.fillStyle='#ccc'; ctx.fillRect(x+r(.28),y+r(.46),r(.44),r(.06));
}
/* 83 – 실험대 */
function __rtCT83(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3333'; ctx.fillRect(x+r(.04),y+r(.14),r(.92),r(.48));
  ctx.fillStyle='#333d3d'; ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.4));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.1),y+r(.22),r(.04),r(.12));
  ctx.fillStyle='#c0392b';
  ctx.beginPath(); ctx.arc(x+r(.12),y+r(.22),r(.04),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#aaa'; ctx.fillRect(x+r(.7),y+r(.22),r(.18),r(.12));
  ctx.fillStyle='#ccc'; ctx.fillRect(x+r(.72),y+r(.24),r(.14),r(.08));
  ctx.fillStyle='rgba(200,230,255,.7)'; ctx.fillRect(x+r(.24),y+r(.2),r(.07),r(.12));
  ctx.fillStyle='rgba(255,200,200,.7)'; ctx.fillRect(x+r(.36),y+r(.22),r(.07),r(.1));
  ctx.fillStyle='#1a2222';
  ctx.fillRect(x+r(.08),y+r(.58),r(.08),r(.38)); ctx.fillRect(x+r(.84),y+r(.58),r(.08),r(.38));
  ctx.fillRect(x+r(.3),y+r(.58),r(.06),r(.34)); ctx.fillRect(x+r(.64),y+r(.58),r(.06),r(.34));
}
/* 84 – 비커 세트 */
function __rtCT84(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='rgba(180,220,255,.8)';
  ctx.beginPath();
  ctx.moveTo(x+r(.1),y+r(.82)); ctx.lineTo(x+r(.38),y+r(.82));
  ctx.lineTo(x+r(.46),y+r(.6)); ctx.lineTo(x+r(.36),y+r(.24));
  ctx.lineTo(x+r(.26),y+r(.24)); ctx.lineTo(x+r(.16),y+r(.6)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(100,150,220,.5)'; ctx.fillRect(x+r(.12),y+r(.64),r(.22),r(.16));
  ctx.fillStyle='rgba(200,255,200,.8)'; ctx.fillRect(x+r(.46),y+r(.24),r(.1),r(.44));
  ctx.beginPath(); ctx.arc(x+r(.51),y+r(.68),r(.05),0,Math.PI,false); ctx.fill();
  ctx.fillStyle='rgba(255,200,180,.8)'; ctx.fillRect(x+r(.62),y+r(.3),r(.26),r(.48));
  ctx.fillRect(x+r(.58),y+r(.28),r(.34),r(.04));
  ctx.fillStyle='rgba(220,100,80,.5)'; ctx.fillRect(x+r(.64),y+r(.54),r(.22),r(.22));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.64),y+r(.36),r(.14),r(.08));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.04),y+r(.14),r(.02),r(.72));
}
/* 85 – 현미경 */
function __rtCT85(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.2),y+r(.82),r(.6),r(.12));
  ctx.fillRect(x+r(.38),y+r(.62),r(.24),r(.22));
  ctx.fillRect(x+r(.44),y+r(.2),r(.12),r(.54));
  ctx.fillRect(x+r(.44),y+r(.2),r(.38),r(.1));
  ctx.fillStyle='#3a3a3a'; ctx.fillRect(x+r(.46),y+r(.08),r(.08),r(.14));
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.arc(x+r(.5),y+r(.08),r(.07),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#555';
  ctx.fillRect(x+r(.6),y+r(.26),r(.06),r(.16)); ctx.fillRect(x+r(.68),y+r(.28),r(.06),r(.12));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.3),y+r(.52),r(.32),r(.08));
  ctx.fillStyle='rgba(200,230,255,.6)'; ctx.fillRect(x+r(.34),y+r(.5),r(.24),r(.04));
  ctx.fillStyle='#666';
  ctx.beginPath(); ctx.arc(x+r(.4),y+r(.38),r(.06),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.4),y+r(.5),r(.06),0,Math.PI*2); ctx.fill();
}
/* 86 – 시약장 */
function __rtCT86(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.06),y+r(.04),r(.88),r(.92));
  ctx.fillStyle='rgba(180,210,230,.35)';
  ctx.fillRect(x+r(.1),y+r(.08),r(.37),r(.84));
  ctx.fillRect(x+r(.53),y+r(.08),r(.37),r(.84));
  ctx.fillStyle='#1a252f'; ctx.fillRect(x+r(.47),y+r(.08),r(.06),r(.84));
  ctx.fillStyle='rgba(50,80,100,.5)';
  ctx.fillRect(x+r(.1),y+r(.32),r(.8),r(.02));
  ctx.fillRect(x+r(.1),y+r(.56),r(.8),r(.02));
  ctx.fillRect(x+r(.1),y+r(.78),r(.8),r(.02));
  const bc=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e67e22'];
  for(var row=0;row<3;row++)
    for(var bt=0;bt<6;bt++){
      ctx.fillStyle=bc[bt];
      ctx.fillRect(x+r(.12)+bt*r(.13),y+r(.12)+row*r(.24),r(.07),r(.18));
    }
  ctx.fillStyle='#aaa';
  ctx.fillRect(x+r(.44),y+r(.44),r(.02),r(.08)); ctx.fillRect(x+r(.54),y+r(.44),r(.02),r(.08));
}
/* 87 – 천체망원경 */
function __rtCT87(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5),cy=y+r(.58);
  ctx.fillStyle='#555';
  ctx.fillRect(cx-r(.04),cy,r(.08),r(.36));
  ctx.fillRect(x+r(.08),cy+r(.28),r(.36),r(.04));
  ctx.fillRect(cx+r(.06),cy+r(.28),r(.36),r(.04));
  ctx.fillRect(x+r(.06),cy,r(.06),r(.3));
  ctx.fillRect(x+r(.88),cy,r(.06),r(.3));
  ctx.fillStyle='#666';
  ctx.beginPath(); ctx.arc(cx,cy,r(.07),0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(cx,cy-r(.02)); ctx.rotate(-Math.PI*.3);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(-r(.05),-r(.44),r(.1),r(.48));
  ctx.fillStyle='#3d5060'; ctx.fillRect(-r(.05),-r(.44),r(.1),r(.06));
  ctx.fillStyle='#444'; ctx.fillRect(-r(.04),r(.02),r(.08),r(.08));
  ctx.restore();
}
/* 88 – 식판 테이블 */
function __rtCT88(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#6b4914'; ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.5));
  ctx.fillStyle='#c8a06e'; ctx.fillRect(x+r(.04),y+r(.22),r(.92),r(.42));
  ctx.fillStyle='#dfc09a'; ctx.fillRect(x+r(.04),y+r(.22),r(.92),r(.06));
  ctx.fillStyle='#b89040';
  ctx.fillRect(x+r(.1),y+r(.26),r(.24),r(.18));
  ctx.fillRect(x+r(.38),y+r(.26),r(.24),r(.18));
  ctx.fillRect(x+r(.66),y+r(.26),r(.24),r(.18));
  ctx.fillStyle='#e8c860'; ctx.fillRect(x+r(.12),y+r(.28),r(.1),r(.08));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.22),y+r(.28),r(.1),r(.08));
  ctx.fillStyle='#4a2508';
  ctx.fillRect(x+r(.1),y+r(.68),r(.08),r(.28)); ctx.fillRect(x+r(.82),y+r(.68),r(.08),r(.28));
  ctx.fillRect(x+r(.3),y+r(.68),r(.06),r(.24)); ctx.fillRect(x+r(.64),y+r(.68),r(.06),r(.24));
}
/* 89 – 배식대 */
function __rtCT89(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.04),y+r(.26),r(.92),r(.66));
  ctx.fillStyle='#aaa'; ctx.fillRect(x+r(.04),y+r(.2),r(.92),r(.1));
  const fc=['#e8c860','#e74c3c','#27ae60','#e67e22'];
  for(var i=0;i<4;i++){
    ctx.fillStyle='#e8e8e8'; ctx.fillRect(x+r(.06)+i*r(.22),y+r(.3),r(.2),r(.2));
    ctx.fillStyle=fc[i]; ctx.fillRect(x+r(.08)+i*r(.22),y+r(.32),r(.16),r(.16));
  }
  ctx.fillStyle='rgba(200,220,240,.3)'; ctx.fillRect(x+r(.04),y+r(.06),r(.92),r(.16));
  ctx.fillStyle='#aaa';
  ctx.fillRect(x+r(.04),y+r(.04),r(.04),r(.18)); ctx.fillRect(x+r(.92),y+r(.04),r(.04),r(.18));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.1),y+r(.56),r(.04),r(.2));
  ctx.fillStyle='#aaa';
  ctx.beginPath(); ctx.arc(x+r(.12),y+r(.76),r(.07),0,Math.PI*2); ctx.fill();
}
/* 90 – 가스레인지 */
function __rtCT90(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#444'; ctx.fillRect(x+r(.06),y+r(.22),r(.88),r(.7));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.06),y+r(.18),r(.88),r(.08));
  for(var bi=0;bi<4;bi++){
    var bx=x+r(.12)+(bi%2)*r(.42), by=y+r(.34)+Math.floor(bi/2)*r(.28);
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(bx+r(.12),by+r(.1),r(.14),0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#555'; ctx.beginPath(); ctx.arc(bx+r(.12),by+r(.1),r(.09),0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.1),y+r(.24),r(.3),r(.16));
  ctx.fillStyle='#e74c3c';
  ctx.beginPath(); ctx.arc(x+r(.2),y+r(.2),r(.03),0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+r(.28),y+r(.16),r(.03),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#888';
  for(var i=0;i<4;i++) ctx.beginPath(),ctx.arc(x+r(.14)+i*r(.2),y+r(.8),r(.05),0,Math.PI*2),ctx.fill();
}
/* 91 – 냉장고 */
function __rtCT91(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#c8c8c8'; ctx.fillRect(x+r(.1),y+r(.04),r(.8),r(.92));
  ctx.fillStyle='#b8b8b8'; ctx.fillRect(x+r(.1),y+r(.04),r(.8),r(.3));
  ctx.fillStyle='#aaa'; ctx.fillRect(x+r(.1),y+r(.34),r(.8),r(.02));
  ctx.fillStyle='#888';
  ctx.fillRect(x+r(.8),y+r(.1),r(.04),r(.16)); ctx.fillRect(x+r(.8),y+r(.5),r(.04),r(.3));
  ctx.fillStyle='#999';
  ctx.fillRect(x+r(.12),y+r(.07),r(.04),r(.06)); ctx.fillRect(x+r(.12),y+r(.25),r(.04),r(.06));
  ctx.fillRect(x+r(.12),y+r(.4),r(.04),r(.06)); ctx.fillRect(x+r(.12),y+r(.82),r(.04),r(.06));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.22),y+r(.1),r(.5),r(.06));
  ctx.fillStyle='#00ff88'; ctx.fillRect(x+r(.22),y+r(.2),r(.14),r(.04));
}
/* 92 – 식기 선반 */
function __rtCT92(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#c0c0c0'; ctx.fillRect(x+r(.04),y+r(.36),r(.92),r(.08));
  ctx.fillStyle='#e0e0e0'; ctx.fillRect(x+r(.04),y+r(.34),r(.92),r(.04));
  ctx.fillStyle='#aaa';
  for(var i=0;i<5;i++) ctx.fillRect(x+r(.1)+i*r(.18),y+r(.42),r(.06),r(.32));
  ctx.fillStyle='#d4a06e'; ctx.fillRect(x+r(.2),y+r(.28),r(.3),r(.1));
  ctx.fillStyle='#e8c070'; ctx.fillRect(x+r(.22),y+r(.3),r(.1),r(.06));
  ctx.fillStyle='#aaa';
  ctx.beginPath();
  ctx.moveTo(x+r(.84),y+r(.3)); ctx.lineTo(x+r(.92),y+r(.38)); ctx.lineTo(x+r(.84),y+r(.46)); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.54),y+r(.36),r(.3),r(.04));
}
/* 93 – 침대 */
function __rtCT93(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#9090a0'; ctx.fillRect(x+r(.04),y+r(.12),r(.92),r(.08));
  ctx.fillRect(x+r(.04),y+r(.84),r(.92),r(.08));
  ctx.fillStyle='#c0c0c8'; ctx.fillRect(x+r(.06),y+r(.2),r(.88),r(.66));
  ctx.fillStyle='#e8f0f8'; ctx.fillRect(x+r(.1),y+r(.24),r(.8),r(.58));
  ctx.fillStyle='#fff'; ctx.fillRect(x+r(.12),y+r(.26),r(.2),r(.2));
  ctx.fillStyle='#a8c8e8'; ctx.fillRect(x+r(.1),y+r(.5),r(.8),r(.28));
  ctx.fillStyle='#9ab8d8'; ctx.fillRect(x+r(.1),y+r(.5),r(.8),r(.04));
  ctx.fillStyle='#666';
  ctx.fillRect(x+r(.08),y+r(.9),r(.06),r(.06)); ctx.fillRect(x+r(.86),y+r(.9),r(.06),r(.06));
}
/* 94 – 세면대 */
function __rtCT94(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.12),y+r(.02),r(.76),r(.22));
  ctx.fillStyle='#b8d4e8'; ctx.fillRect(x+r(.14),y+r(.04),r(.72),r(.18));
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(x+r(.16),y+r(.06),r(.16),r(.12));
  ctx.fillStyle='#c0c0c0'; ctx.fillRect(x+r(.12),y+r(.42),r(.76),r(.36));
  ctx.fillStyle='#e0e0e0'; ctx.fillRect(x+r(.16),y+r(.46),r(.68),r(.28));
  ctx.fillStyle='#888';
  ctx.beginPath(); ctx.arc(x+r(.5),y+r(.68),r(.05),0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#aaa'; ctx.fillRect(x+r(.44),y+r(.28),r(.12),r(.16));
  ctx.fillRect(x+r(.4),y+r(.26),r(.2),r(.06));
  ctx.fillRect(x+r(.34),y+r(.28),r(.08),r(.05)); ctx.fillRect(x+r(.58),y+r(.28),r(.08),r(.05));
}
/* 95 – 혈압측정기 */
function __rtCT95(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#d0d0d0'; ctx.fillRect(x+r(.12),y+r(.1),r(.76),r(.26));
  ctx.fillStyle='#c0c0c0'; ctx.fillRect(x+r(.14),y+r(.12),r(.72),r(.22));
  ctx.fillStyle='#aaa';
  for(var i=0;i<6;i++) ctx.fillRect(x+r(.16)+i*r(.1),y+r(.3),r(.06),r(.04));
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.2),y+r(.4),r(.6),r(.46));
  ctx.fillStyle='#1a9632'; ctx.fillRect(x+r(.24),y+r(.44),r(.52),r(.24));
  ctx.fillStyle='#00ff44'; ctx.fillRect(x+r(.28),y+r(.48),r(.18),r(.08));
  ctx.fillRect(x+r(.28),y+r(.58),r(.18),r(.08));
  ctx.fillStyle='#00cc33'; ctx.fillRect(x+r(.5),y+r(.5),r(.2),r(.16));
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.28),y+r(.84),r(.44),r(.08));
}
/* 96 – 커튼 칸막이 */
function __rtCT96(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#888'; ctx.fillRect(x+r(.06),y+r(.06),r(.88),r(.06));
  ctx.fillStyle='#aaa';
  for(var i=0;i<7;i++) ctx.beginPath(),ctx.arc(x+r(.1)+i*r(.12),y+r(.09),r(.03),0,Math.PI*2),ctx.fill();
  ctx.fillStyle='#d8c8f0'; ctx.fillRect(x+r(.06),y+r(.12),r(.4),r(.82));
  ctx.fillStyle='#c8b8e0';
  for(var i=0;i<4;i++) ctx.fillRect(x+r(.1)+i*r(.08),y+r(.12),r(.02),r(.82));
  ctx.fillStyle='#d8c8f0'; ctx.fillRect(x+r(.54),y+r(.12),r(.4),r(.82));
  ctx.fillStyle='#c8b8e0';
  for(var i=0;i<4;i++) ctx.fillRect(x+r(.56)+i*r(.08),y+r(.12),r(.02),r(.82));
  ctx.fillStyle='rgba(0,0,0,.12)'; ctx.fillRect(x+r(.46),y+r(.12),r(.08),r(.82));
}
/* 97 – 구급함 */
function __rtCT97(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#e8e8e8'; ctx.fillRect(x+r(.12),y+r(.18),r(.76),r(.64));
  ctx.fillStyle='#d0d0d0'; ctx.fillRect(x+r(.12),y+r(.14),r(.76),r(.08));
  ctx.fillStyle='#e74c3c';
  ctx.fillRect(x+r(.44),y+r(.26),r(.12),r(.38));
  ctx.fillRect(x+r(.3),y+r(.38),r(.4),r(.14));
  ctx.fillStyle='#888';
  ctx.fillRect(x+r(.44),y+r(.2),r(.12),r(.04));
  ctx.fillRect(x+r(.34),y+r(.06),r(.32),r(.1));
  ctx.fillStyle='#bbb';
  ctx.fillRect(x+r(.12),y+r(.14),r(.06),r(.06)); ctx.fillRect(x+r(.82),y+r(.14),r(.06),r(.06));
  ctx.fillRect(x+r(.12),y+r(.76),r(.06),r(.06)); ctx.fillRect(x+r(.82),y+r(.76),r(.06),r(.06));
}

/* ===================== Q3: 실시간 진행현황 패널 (학생 화면) ===================== */
let __rtProgressPanelOpen = false;

function __rtInitProgressPanel(){
  if(__rtMapId === 'race') return; // 경주 트랙은 자체 순위판 보유
  if(document.getElementById('rt-prog-toggle')) return;

  const style = document.createElement('style');
  style.textContent = [
    '#rt-prog-toggle{position:fixed;bottom:68px;right:10px;z-index:1000;background:rgba(52,112,212,.85);',
    'color:#fff;border:none;border-radius:50%;width:38px;height:38px;font-size:17px;cursor:pointer;',
    'box-shadow:0 2px 8px rgba(0,0,0,.35);backdrop-filter:blur(6px);display:flex;align-items:center;',
    'justify-content:center;padding:0;transition:transform .15s}',
    '#rt-prog-toggle:hover{transform:scale(1.1)}',
    '#rt-prog-panel{position:fixed;bottom:112px;right:10px;z-index:999;background:rgba(15,20,40,.9);',
    'backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:12px;width:210px;',
    'max-height:280px;overflow-y:auto;padding:10px 12px;display:none;',
    'box-shadow:0 4px 24px rgba(0,0,0,.5);font-family:"Noto Sans KR",sans-serif}',
    '#rt-prog-panel.show{display:block}',
    '.rt-prog-title{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.06em;',
    'margin-bottom:8px;text-align:center}',
    '.rt-prog-row{display:flex;align-items:center;gap:6px;margin-bottom:5px}',
    '.rt-prog-nick{flex:1;font-size:11px;color:#ecf0f1;white-space:nowrap;overflow:hidden;',
    'text-overflow:ellipsis;font-weight:500}',
    '.rt-prog-me{color:#f39c12!important;font-weight:700!important}',
    '.rt-prog-bar-wrap{width:54px;height:5px;background:rgba(255,255,255,.12);border-radius:3px;flex-shrink:0}',
    '.rt-prog-bar{height:5px;border-radius:3px;background:linear-gradient(90deg,#3498db,#2ecc71);transition:width .4s}',
    '.rt-prog-num{font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;min-width:26px;text-align:right}'
  ].join('');
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'rt-prog-toggle';
  btn.title = '진행현황 보기';
  btn.innerHTML = '📊';
  btn.addEventListener('click', function(){
    __rtProgressPanelOpen = !__rtProgressPanelOpen;
    document.getElementById('rt-prog-panel').classList.toggle('show', __rtProgressPanelOpen);
    if(__rtProgressPanelOpen && __rtChannel) __rtUpdateProgressPanel(__rtChannel.presenceState());
  });
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'rt-prog-panel';
  panel.innerHTML = '<div class="rt-prog-title">📊 실시간 진행현황</div><div id="rt-prog-rows"></div>';
  document.body.appendChild(panel);
}

function __rtUpdateProgressPanel(state){
  if(!__rtProgressPanelOpen) return;
  const container = document.getElementById('rt-prog-rows');
  if(!container) return;

  const rows = [];
  Object.keys(state).forEach(function(key){
    if(key.startsWith('teacher_') || key.startsWith('dash_')) return;
    const presences = state[key];
    if(!presences || !presences.length) return;
    const s = presences[presences.length - 1];
    if(!s.nickname) return;
    rows.push({ nickname: s.nickname, mDone: s.mDone || 0, mTotal: s.mTotal || 0 });
  });

  rows.sort(function(a, b){
    if(b.mDone !== a.mDone) return b.mDone - a.mDone;
    return (a.nickname||'').localeCompare(b.nickname||'');
  });

  if(!rows.length){
    container.innerHTML = '<div style="color:rgba(255,255,255,.35);font-size:11px;text-align:center;padding:6px 0">접속 중인 학생 없음</div>';
    return;
  }

  container.innerHTML = rows.map(function(r){
    const pct = r.mTotal ? Math.round(r.mDone / r.mTotal * 100) : 0;
    const isMe = r.nickname === __rtNickname;
    return '<div class="rt-prog-row">'
      + '<span class="rt-prog-nick' + (isMe ? ' rt-prog-me' : '') + '">'
      + (isMe ? '★ ' : '') + r.nickname + '</span>'
      + '<div class="rt-prog-bar-wrap"><div class="rt-prog-bar" style="width:' + pct + '%"></div></div>'
      + '<span class="rt-prog-num">' + r.mDone + '/' + r.mTotal + '</span>'
      + '</div>';
  }).join('');
}
