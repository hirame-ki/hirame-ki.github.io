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

function initRealtime(mapId){
  __rtMapId = mapId || null;
  __rtTeacherView = __rtGetParam('teacherView', '') === '1';

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
  __rtNickname = __rtGetParam('nickname', '학생' + Math.floor(1000 + Math.random()*9000));

  __rtClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  __rtConnect();
}

let __rtLastSendAt = 0;
let __rtPendingTimer = null;
const __rtSendInterval = 150; // 최소 전송 간격(ms) - 너무 자주 보내면 Realtime 전송 제한에 걸려 연결이 끊김

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
    if(!el){
      el = document.createElement('div');
      el.className = 'remote-player';
      el.dataset.student = key;
      el.innerHTML = '<svg viewBox="0 0 32 48"><g></g></svg><span class="nick"></span>';
      container.appendChild(el);
    }

    const g = el.querySelector('g');
    g.innerHTML = renderCharacterSVG(s);

    el.classList.toggle('flip', s.dir === 'right');
    el.style.left = (s.c * TS) + 'px';
    el.style.top  = (s.r * TS - 24) + 'px';
    el.querySelector('.nick').textContent = s.nickname || '';
  });

  // 더 이상 존재하지 않는 학생의 캐릭터 제거
  container.querySelectorAll('[data-student]').forEach(el => {
    if(!seen.has(el.dataset.student)) el.remove();
  });
}
