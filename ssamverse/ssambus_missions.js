/* =====================================================================
   쌤버스 - 미션 시스템 공용 모듈
   각 맵 페이지(ssambus_map_*.html)에서 pos/TS/PLAYER 등을 정의한 뒤
   이 스크립트를 로드하고, 다음 2곳에서 호출합니다.

     - placePlayer() 안의 broadcastMyPosition() 다음 줄: checkZoneOnMove(pos)
     - 파일 맨 끝 initRealtime() 다음 줄: initMissionSystem('<mapId>')

   미션 데이터는 Supabase의 missions 테이블(room_id, map_id 기준)을
   먼저 조회하고, 없으면 아래 DEMO_MISSIONS로 자동 대체합니다.
   ===================================================================== */

/* ===================== 맵별 미션 구역(zone) 정의 ===================== */
/* r0~r1, c0~c1 은 그리드 좌표(행/열) 기준의 사각 영역 (포함) */
const MISSION_ZONES = {
  classroom: [   // 15열 x 16행 - 2행씩 8개 구역
    {id:'zone_A', label:'칠판·TV 앞',       r0:0,  c0:0, r1:1,  c1:14},
    {id:'zone_B', label:'앞쪽 통로·앞문',    r0:2,  c0:0, r1:3,  c1:14},
    {id:'zone_C', label:'책상 1열',         r0:4,  c0:0, r1:5,  c1:14},
    {id:'zone_D', label:'책상 2열',         r0:6,  c0:0, r1:7,  c1:14},
    {id:'zone_E', label:'책상 3열',         r0:8,  c0:0, r1:9,  c1:14},
    {id:'zone_F', label:'책상 4열',         r0:10, c0:0, r1:11, c1:14},
    {id:'zone_G', label:'책상 5열·뒷문',     r0:12, c0:0, r1:13, c1:14},
    {id:'zone_H', label:'뒤쪽 통로·게시판/사물함', r0:14, c0:0, r1:15, c1:14}
  ],
  library: [   // 15열 x 21행 - 8개 구역
    {id:'zone_A', label:'입구·대출대',      r0:0,  c0:0, r1:2,  c1:14},
    {id:'zone_B', label:'서가 1열',         r0:3,  c0:0, r1:4,  c1:14},
    {id:'zone_C', label:'서가 2열',         r0:5,  c0:0, r1:7,  c1:14},
    {id:'zone_D', label:'중앙 통로',        r0:8,  c0:0, r1:9,  c1:14},
    {id:'zone_E', label:'열람석 1열',       r0:10, c0:0, r1:12, c1:14},
    {id:'zone_F', label:'열람석 2열',       r0:13, c0:0, r1:14, c1:14},
    {id:'zone_G', label:'열람석 3열',       r0:15, c0:0, r1:16, c1:14},
    {id:'zone_H', label:'열람석 4·5열',     r0:17, c0:0, r1:20, c1:14}
  ],
  playground: [   // 32열 x 14행 - 4열씩 8개 구역
    {id:'zone_A', label:'서쪽 펜스·골대',    r0:0, c0:0,  r1:13, c1:3},
    {id:'zone_B', label:'서쪽 놀이기구',     r0:0, c0:4,  r1:13, c1:7},
    {id:'zone_C', label:'서쪽 잔디',        r0:0, c0:8,  r1:13, c1:11},
    {id:'zone_D', label:'중앙 광장(좌)',     r0:0, c0:12, r1:13, c1:15},
    {id:'zone_E', label:'중앙 광장(우)',     r0:0, c0:16, r1:13, c1:19},
    {id:'zone_F', label:'동쪽 잔디',        r0:0, c0:20, r1:13, c1:23},
    {id:'zone_G', label:'동쪽 놀이기구',     r0:0, c0:24, r1:13, c1:27},
    {id:'zone_H', label:'동쪽 펜스·골대',    r0:0, c0:28, r1:13, c1:31}
  ],
  gym: [   // 28열 x 14행 - 8개 구역
    {id:'zone_A', label:'무대·관람석(좌)',   r0:0, c0:0,  r1:13, c1:3},
    {id:'zone_B', label:'코트 좌측1',       r0:0, c0:4,  r1:13, c1:7},
    {id:'zone_C', label:'코트 좌측2',       r0:0, c0:8,  r1:13, c1:10},
    {id:'zone_D', label:'코트 중앙(좌)',     r0:0, c0:11, r1:13, c1:13},
    {id:'zone_E', label:'코트 중앙(우)',     r0:0, c0:14, r1:13, c1:16},
    {id:'zone_F', label:'코트 우측1',       r0:0, c0:17, r1:13, c1:19},
    {id:'zone_G', label:'코트 우측2',       r0:0, c0:20, r1:13, c1:23},
    {id:'zone_H', label:'관람석·보관대(우)', r0:0, c0:24, r1:13, c1:27}
  ],
  city: [   // 28열 x 14행 - 3개 블록(상/하) + 사거리 2곳 = 8개 구역
    {id:'zone_A', label:'블록1 상가(북)',    r0:0, c0:0,  r1:5,  c1:7},
    {id:'zone_B', label:'블록1 상가(남)',    r0:8, c0:0,  r1:13, c1:7},
    {id:'zone_C', label:'블록2 상가(북)',    r0:0, c0:10, r1:5,  c1:17},
    {id:'zone_D', label:'블록2 상가(남)',    r0:8, c0:10, r1:13, c1:17},
    {id:'zone_E', label:'블록3 상가(북)',    r0:0, c0:20, r1:5,  c1:27},
    {id:'zone_F', label:'블록3 상가(남)',    r0:8, c0:20, r1:13, c1:27},
    {id:'zone_G', label:'사거리1(횡단보도)', r0:0, c0:8,  r1:13, c1:9},
    {id:'zone_H', label:'사거리2(횡단보도)', r0:0, c0:18, r1:13, c1:19}
  ],
  forest: [   // 28열 x 14행 - 4x2 격자 8개 구역
    {id:'zone_A', label:'입구·서북쪽 숲',    r0:0, c0:0,  r1:6,  c1:6},
    {id:'zone_B', label:'북쪽 연못가',       r0:0, c0:7,  r1:6,  c1:13},
    {id:'zone_C', label:'북동쪽 숲',        r0:0, c0:14, r1:6,  c1:20},
    {id:'zone_D', label:'동쪽 깊은 숲',      r0:0, c0:21, r1:6,  c1:27},
    {id:'zone_E', label:'서남쪽 숲',        r0:7, c0:0,  r1:13, c1:6},
    {id:'zone_F', label:'남쪽 연못가',       r0:7, c0:7,  r1:13, c1:13},
    {id:'zone_G', label:'남동쪽 숲',        r0:7, c0:14, r1:13, c1:20},
    {id:'zone_H', label:'동남쪽 깊은 숲',    r0:7, c0:21, r1:13, c1:27}
  ]
};

/* ===================== 맵 간 이동(출입구) 설정 ===================== */
/* 맵별 출입구(문/게이트) 칸 - 미션 완료 후 이 칸에 들어가면 다음 맵으로 자동 이동 */
const EXIT_ZONES = {
  classroom: [
    {r0:3,  c0:14, r1:3,  c1:14},  // 앞문
    {r0:13, c0:14, r1:13, c1:14}   // 뒷문
  ],
  library: [
    {r0:0, c0:6, r1:0, c1:8}       // 입구
  ],
  playground: [
    {r0:13, c0:15, r1:13, c1:16}   // 정문 게이트
  ],
  gym: [
    {r0:3, c0:27, r1:4,  c1:27},   // 앞문
    {r0:9, c0:27, r1:10, c1:27}    // 뒷문
  ],
  city: [
    {r0:0,  c0:8,  r1:0,  c1:9},   // 상단 도로 입구
    {r0:0,  c0:18, r1:0,  c1:19},
    {r0:13, c0:8,  r1:13, c1:9},   // 하단 도로 입구
    {r0:13, c0:18, r1:13, c1:19}
  ],
  forest: [
    {r0:1, c0:0, r1:1, c1:0}       // 좌측 입구(흙길)
  ]
};

/* 학생용 맵 파일 경로 / 표시 이름 (교사 대시보드의 MAP_FILES, MAPS와 동일) */
const MAP_FILES = {
  classroom:'ssambus_map_classroom.html',
  library:'ssambus_map_library.html',
  playground:'ssambus_map_playground.html',
  gym:'ssambus_map_gym.html',
  city:'ssambus_map_city.html',
  forest:'ssambus_map_forest.html'
};
const MAP_LABELS = {
  classroom:'일반교실', library:'도서관', playground:'운동장',
  gym:'체육관', city:'현대도시', forest:'자연숲'
};

/* 교사가 순서를 설정하지 않았을 때 사용할 기본 맵 순서 */
const MAP_ORDER_DEFAULT = ['classroom','library','playground','gym','city','forest'];

/* ===================== 데모 미션 (Supabase 미설정/데이터 없을 때 대체) ===================== */
const __MS_DEMO_VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const DEMO_MISSIONS = {
  classroom: [
    {id:'demo_classroom_1', zone_id:'zone_A', order:1, required:true, title:'수업 안내 영상 시청',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_classroom_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 교실 예절',
      type:'quiz', quiz:{question:'친구가 발표할 때 가장 알맞은 태도는 무엇일까요?',
        options:['딴짓을 한다','발표자를 바라보며 경청한다','옆 친구와 이야기한다','자리에서 일어나 돌아다닌다'], answer:1}}
  ],
  library: [
    {id:'demo_library_1', zone_id:'zone_A', order:1, required:true, title:'도서관 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_library_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 도서관 예절',
      type:'quiz', quiz:{question:'도서관에서 책을 다 읽은 후 가장 알맞은 행동은?',
        options:['아무 곳에나 두고 나간다','제자리에 정리한다','다른 칸에 숨겨둔다','바닥에 쌓아둔다'], answer:1}}
  ],
  playground: [
    {id:'demo_playground_1', zone_id:'zone_A', order:1, required:true, title:'운동장 안전 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_playground_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 운동장 안전',
      type:'quiz', quiz:{question:'축구공이 다른 친구 쪽으로 빠르게 날아갈 때 가장 먼저 해야 할 일은?',
        options:['소리쳐서 알려준다','모른 척한다','더 세게 찬다','뛰어가서 잡는다'], answer:0}}
  ],
  gym: [
    {id:'demo_gym_1', zone_id:'zone_A', order:1, required:true, title:'체육관 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_gym_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 체육 안전 수칙',
      type:'quiz', quiz:{question:'체육 활동을 시작하기 전에 가장 먼저 해야 할 일은?',
        options:['바로 전속력으로 달리기','준비 운동(스트레칭)','물 마시기 생략','신발 벗고 활동하기'], answer:1}}
  ],
  city: [
    {id:'demo_city_1', zone_id:'zone_A', order:1, required:true, title:'교통안전 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_city_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 횡단보도 안전',
      type:'quiz', quiz:{question:'횡단보도를 건널 때 가장 알맞은 행동은?',
        options:['좌우를 살피지 않고 빠르게 건넌다','초록불이 켜지면 좌우를 살피고 건넌다','빨간불에도 차가 없으면 건넌다','휴대폰을 보며 건넌다'], answer:1}}
  ],
  forest: [
    {id:'demo_forest_1', zone_id:'zone_A', order:1, required:true, title:'자연 생태 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_forest_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 자연 보호',
      type:'quiz', quiz:{question:'숲에서 가져온 쓰레기는 어떻게 처리해야 할까요?',
        options:['숲 속에 묻는다','연못에 버린다','집까지 가져가 분리배출한다','나무 위에 걸어둔다'], answer:2}}
  ]
};

/* ===================== 내부 상태 ===================== */
let __msMapId = null;
let __msRoomId = null;
let __msStudentId = null;
let __msMissions = null;  // null = 아직 로드 전
let __msDone = new Set();
let __msCurrentZone;       // undefined = 아직 판정 전
let __msQueue = [];
let __msMapOrder = null;        // 교사가 설정한(또는 기본) 맵 순서
let __msMapsWithMissions = null; // 이 수업(room)에 미션이 등록된 맵 id 집합
let __msTransitioning = false;   // 다음 맵으로 이동 처리 중 중복 방지
let __msAllDoneShown = false;    // 이 맵의 "전체 완료" 축하 팝업을 이미 보여줬는지

function __msEscHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function __msParam(name, fallback){
  if(typeof __rtGetParam === 'function') return __rtGetParam(name, fallback);
  try{
    const v = new URLSearchParams(window.location.search).get(name);
    return v || fallback;
  }catch(e){ return fallback; }
}

function __msStorageKey(){
  return 'ssambus_missions_done_' + __msRoomId + '_' + __msStudentId;
}

function __msAllDoneKey(){
  return 'ssambus_alldone_' + __msRoomId + '_' + __msStudentId + '_' + __msMapId;
}

function __msGetClient(){
  if(typeof __rtClient !== 'undefined' && __rtClient) return __rtClient;
  if(typeof __rtIsConfigured === 'function' && __rtIsConfigured()){
    try{ return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
    catch(e){ return null; }
  }
  return null;
}

async function __msLoadMissions(mapId){
  const client = __msGetClient();
  if(client){
    try{
      const { data, error } = await client
        .from('missions')
        .select('*')
        .eq('room_id', __msRoomId)
        .eq('map_id', mapId)
        .order('order', { ascending: true });
      if(!error && data && data.length) return data;
    }catch(e){
      console.warn('[쌤버스] 미션 로드 실패 - 데모 미션을 사용합니다.', e);
    }
  }
  return (DEMO_MISSIONS[mapId] || []).map(m => Object.assign({}, m));
}

/* 교사가 대시보드에서 설정한 맵 이동 순서 (없으면 기본 순서) */
async function __msLoadMapOrder(){
  const client = __msGetClient();
  if(client){
    try{
      const { data, error } = await client
        .from('room_settings')
        .select('map_order')
        .eq('room_id', __msRoomId)
        .maybeSingle();
      if(!error && data && Array.isArray(data.map_order) && data.map_order.length){
        return data.map_order;
      }
    }catch(e){ /* room_settings 미설정 시 기본 순서 사용 */ }
  }
  return MAP_ORDER_DEFAULT.slice();
}

/* 이 수업(room)에 실제로 미션이 등록된 맵 id 집합 (데모 미션은 포함하지 않음) */
async function __msLoadMapsWithMissions(){
  const set = new Set();
  const client = __msGetClient();
  if(client){
    try{
      const { data, error } = await client
        .from('missions')
        .select('map_id')
        .eq('room_id', __msRoomId);
      if(!error && data) data.forEach(row => set.add(row.map_id));
    }catch(e){ /* 조회 실패 시 빈 집합 - 자동 이동 없음 */ }
  }
  return set;
}

/* ===================== 구역 판정 ===================== */
function __msZoneAt(pos){
  const zones = MISSION_ZONES[__msMapId] || [];
  for(const z of zones){
    if(pos.r >= z.r0 && pos.r <= z.r1 && pos.c >= z.c0 && pos.c <= z.c1) return z;
  }
  return null;
}

function checkZoneOnMove(pos){
  if(__msMissions === null) return; // 미션 로드 전에는 판정하지 않음
  __msCheckExit(pos);

  // ── 1. 타일 직접 지정 트리거 우선 확인 ──────────────────────────────
  const tileMission = __msMissions.find(m =>
    !__msDone.has(m.id) &&
    Array.isArray(m.trigger_tiles) && m.trigger_tiles.length > 0 &&
    m.trigger_tiles.some(t => t.r === pos.r && t.c === pos.c)
  );
  if(tileMission){
    const synth = '__tile_' + tileMission.id;
    if(__msCurrentZone !== synth){
      __msCurrentZone = synth;
      __msOpenMission([tileMission]);
    }
    return;
  }
  if(typeof __msCurrentZone === 'string' && __msCurrentZone.startsWith('__tile_')){
    __msCurrentZone = null; // 타일에서 벗어남
  }

  // ── 2. 기존 구역(zone) 판정 ────────────────────────────────────────
  const zone = __msZoneAt(pos);
  const zoneId = zone ? zone.id : null;
  if(zoneId === __msCurrentZone) return;
  __msCurrentZone = zoneId;
  if(!zoneId) return;

  // trigger_tiles 가 설정된 미션은 구역 판정에서 제외
  const pending = __msMissions.filter(m =>
    m.zone_id === zoneId &&
    !__msDone.has(m.id) &&
    (!Array.isArray(m.trigger_tiles) || m.trigger_tiles.length === 0)
  );
  if(pending.length) __msOpenMission(pending);
}

/* ===================== 맵 간 자동 이동(출입구) ===================== */
function __msAllRequiredDone(){
  return __msMissions.every(m => !m.required || __msDone.has(m.id));
}

function __msNextMap(){
  if(!__msMapOrder || !__msMapsWithMissions) return null;
  const idx = __msMapOrder.indexOf(__msMapId);
  if(idx === -1) return null;
  for(let i = idx + 1; i < __msMapOrder.length; i++){
    const m = __msMapOrder[i];
    if(__msMapsWithMissions.has(m)) return m;
  }
  return null;
}

let __msBlockNoticeShown = false;
function __msShowBlockedNotice(){
  if(__msBlockNoticeShown) return;
  __msBlockNoticeShown = true;
  __msInjectStyle();
  const banner = document.createElement('div');
  banner.id = 'ms-block-banner';
  banner.textContent = '🔒 이 맵의 미션을 모두 완료해야 출입구를 통과할 수 있어요!';
  document.body.appendChild(banner);
  setTimeout(() => { banner.remove(); __msBlockNoticeShown = false; }, 1500);
}

/* 맵 페이지(move())에서 이동 직전 호출: 출입구 칸인데 필수 미션을 다 마치지 못했으면 true(이동 차단) */
function __msBlockExit(r, c){
  if(__msMissions === null) return false;            // 미션 로드 전에는 막지 않음
  if(!__msMapsWithMissions || !__msMapsWithMissions.has(__msMapId)) return false; // 이 맵에 미션이 없으면 잠금 없음
  const exits = EXIT_ZONES[__msMapId] || [];
  const inExit = exits.some(z => r >= z.r0 && r <= z.r1 && c >= z.c0 && c <= z.c1);
  if(!inExit) return false;
  return !__msAllRequiredDone();
}

function __msCheckExit(pos){
  if(__msTransitioning) return;
  if(!__msMapOrder || !__msMapsWithMissions) return; // 아직 로드 전
  if(!__msMapsWithMissions.has(__msMapId)) return;   // 이 맵에 등록된 미션이 없으면 자동 이동 없음
  if(!__msMissions.length || !__msAllRequiredDone()) return;

  const exits = EXIT_ZONES[__msMapId] || [];
  const inExit = exits.some(z => pos.r >= z.r0 && pos.r <= z.r1 && pos.c >= z.c0 && pos.c <= z.c1);
  if(!inExit) return;

  const next = __msNextMap();
  if(!next) return;

  __msTransitioning = true;
  __msGoToMap(next);
}

function __msGoToMap(mapId){
  const file = MAP_FILES[mapId];
  if(!file){ __msTransitioning = false; return; }
  const url = new URL(file, window.location.href);
  url.searchParams.set('room', __msRoomId);
  const nickname = __msParam('nickname', null);
  if(nickname) url.searchParams.set('nickname', nickname);
  __msShowExitNotice(mapId, () => { window.location.href = url.href; });
}

function __msShowExitNotice(mapId, cb){
  __msInjectStyle();
  const banner = document.createElement('div');
  banner.id = 'ms-exit-banner';
  banner.textContent = `🎉 미션 완료! "${MAP_LABELS[mapId] || mapId}" 맵으로 이동합니다...`;
  document.body.appendChild(banner);
  setTimeout(cb, 1500);
}

/* ===================== 전체 미션 완료 축하 팝업 ===================== */
function __msSpawnConfetti(){
  const colors = ['#e74c3c','#f1c40f','#2ecc71','#3498db','#9b59b6','#e67e22'];
  const confetti = document.createElement('div');
  confetti.id = 'ms-confetti';
  for(let i = 0; i < 40; i++){
    const piece = document.createElement('div');
    piece.className = 'ms-confetti-piece';
    piece.style.left = (Math.random() * 100) + '%';
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    confetti.appendChild(piece);
  }
  document.body.appendChild(confetti);
  setTimeout(() => confetti.remove(), 4000);
}

function __msShowAllDoneCelebration(){
  __msInjectStyle();
  __msSpawnConfetti();

  const hasNext = !!__msNextMap();
  const message = hasNext
    ? '이 맵의 모든 미션을 완료했어요!<br>출입구(문/게이트)를 찾아 다음 장소로 이동해보세요.'
    : '모든 미션을 완료했어요!<br>오늘 활동 수고 많았어요 👏';

  const bg = document.createElement('div');
  bg.id = 'ms-celebrate-bg';
  bg.innerHTML = `
    <div id="ms-celebrate">
      <div class="ms-emoji">🎉</div>
      <h3>미션 완료!</h3>
      <p>${message}</p>
      <button id="ms-celebrate-close">확인</button>
    </div>
  `;
  document.body.appendChild(bg);
  bg.querySelector('#ms-celebrate-close').addEventListener('click', () => bg.remove());
}

/* ===================== UI: 진행률 바 / 미션 모달 ===================== */
function __msInjectStyle(){
  if(document.getElementById('ms-style')) return;
  const style = document.createElement('style');
  style.id = 'ms-style';
  style.textContent = `
    #ms-progress{position:fixed;top:10px;right:10px;background:rgba(74,55,40,.9);color:#fff;
      font-size:13px;padding:6px 12px;border-radius:20px;z-index:50;
      box-shadow:0 2px 6px rgba(0,0,0,.2);font-family:sans-serif}
    #ms-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;
      align-items:center;justify-content:center;z-index:100;padding:16px}
    #ms-overlay.hidden{display:none}
    #ms-card{background:#fffaf0;border:4px solid #4a3728;border-radius:10px;max-width:420px;
      width:100%;max-height:90vh;overflow:auto;padding:18px;font-family:sans-serif;
      box-shadow:0 6px 20px rgba(0,0,0,.3)}
    #ms-card h3{margin:0 0 10px;color:#4a3728;font-size:17px}
    #ms-card .ms-body{font-size:14px;color:#333;line-height:1.5;margin-bottom:12px}
    #ms-card iframe{width:100%;border:0;border-radius:6px;background:#000;display:block;margin-bottom:8px}
    #ms-card .ms-quiz label{display:block;background:#f3ecdf;border:1px solid #d9c19a;
      border-radius:6px;padding:8px 10px;margin-bottom:6px;cursor:pointer;font-size:14px}
    #ms-card .ms-quiz label:hover{background:#ecdcc0}
    #ms-card .ms-feedback{margin:8px 0;font-weight:bold;min-height:1.2em}
    #ms-card .ms-feedback.ok{color:#2e7d32}
    #ms-card .ms-feedback.bad{color:#c0392b}
    #ms-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
    #ms-actions button{font-size:14px;padding:8px 16px;border-radius:6px;border:1px solid #bbb;
      background:#fff;cursor:pointer}
    #ms-actions button.primary{background:#4a3728;color:#fff;border-color:#4a3728}
    #ms-actions button:disabled{opacity:.5;cursor:not-allowed}
    #ms-card .ms-link-btn{display:inline-block;margin-bottom:10px;padding:8px 14px;
      background:#4a3728;color:#fff;border-radius:6px;text-decoration:none;font-size:14px}
    #ms-exit-banner{position:fixed;top:50px;right:10px;background:rgba(46,125,50,.95);color:#fff;
      font-size:13px;padding:10px 16px;border-radius:10px;z-index:55;max-width:240px;text-align:center;
      box-shadow:0 2px 6px rgba(0,0,0,.25);font-family:sans-serif}
    #ms-block-banner{position:fixed;top:50px;left:50%;transform:translateX(-50%);background:rgba(192,57,43,.95);
      color:#fff;font-size:13px;padding:10px 16px;border-radius:10px;z-index:55;max-width:280px;text-align:center;
      box-shadow:0 2px 6px rgba(0,0,0,.25);font-family:sans-serif}
    #ms-celebrate-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;
      align-items:center;justify-content:center;z-index:120;padding:16px;font-family:sans-serif}
    #ms-celebrate{background:#fff;border-radius:16px;padding:28px 24px;text-align:center;
      max-width:340px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.3);animation:ms-pop .35s ease}
    #ms-celebrate .ms-emoji{font-size:54px;display:inline-block;animation:ms-bounce 1s ease infinite}
    #ms-celebrate h3{margin:10px 0 6px;color:#2c3e50;font-size:18px}
    #ms-celebrate p{margin:0 0 18px;font-size:13.5px;color:#666;line-height:1.6}
    #ms-celebrate button{padding:10px 22px;border:none;border-radius:8px;background:#2c3e50;
      color:#fff;font-size:14px;font-weight:600;cursor:pointer}
    #ms-celebrate button:hover{background:#1a252f}
    #ms-confetti{position:fixed;inset:0;pointer-events:none;z-index:121;overflow:hidden}
    .ms-confetti-piece{position:absolute;top:-20px;width:8px;height:14px;opacity:.9;
      animation:ms-fall linear forwards}
    @keyframes ms-pop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes ms-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes ms-fall{to{transform:translateY(110vh) rotate(360deg)}}
  `;
  document.head.appendChild(style);
}

function __msBuildUI(){
  __msInjectStyle();
  if(!document.getElementById('ms-progress')){
    const bar = document.createElement('div');
    bar.id = 'ms-progress';
    document.body.appendChild(bar);
  }
  if(!document.getElementById('ms-overlay')){
    const overlay = document.createElement('div');
    overlay.id = 'ms-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML = '<div id="ms-card"></div>';
    document.body.appendChild(overlay);
  }
}

function __msUpdateProgress(){
  const bar = document.getElementById('ms-progress');
  if(!bar || !__msMissions) return;
  const total = __msMissions.length;
  const done = __msMissions.filter(m => __msDone.has(m.id)).length;
  bar.textContent = `🎯 미션 진행률 ${done} / ${total}`;
}

function __msYoutubeId(url){
  if(!url) return '';
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : '';
}

function __msFormEmbedUrl(url){
  if(!url) return '';
  return url.includes('?') ? (url + '&embedded=true') : (url + '?embedded=true');
}

function __msRenderMission(m){
  const icon = { youtube:'🎬', quiz:'❓', google_form:'📝', link:'🔗',
    image_quiz:'🖼️', short_answer:'✏️', discussion:'💬', ox_quiz:'⭕' }[m.type] || '📌';
  let body = '';
  let completeDisabled = '';

  if(m.type === 'youtube'){
    const vid = __msYoutubeId(m.content);
    body = vid
      ? `<iframe height="220" src="https://www.youtube.com/embed/${vid}" allowfullscreen></iframe>`
      : `<div class="ms-body">영상 주소를 확인해주세요.</div>`;
  } else if(m.type === 'quiz'){
    const q = m.quiz || {};
    const opts = (q.options || []).map((opt, i) => `
      <label><input type="radio" name="ms-quiz" value="${i}"> ${__msEscHtml(opt)}</label>
    `).join('');
    body = `<div class="ms-body">${__msEscHtml(q.question || '')}</div>
      <div class="ms-quiz">${opts}</div>
      <div class="ms-feedback" id="ms-feedback"></div>`;
    completeDisabled = 'disabled';
  } else if(m.type === 'image_quiz'){
    const q = m.quiz || {};
    const opts = (q.options || []).map((opt, i) => `
      <label><input type="radio" name="ms-quiz" value="${i}"> ${__msEscHtml(opt)}</label>
    `).join('');
    body = `<div style="text-align:center;margin-bottom:8px">
        <img src="${__msEscHtml(q.image_url || '')}" alt="미션 이미지"
          style="max-width:100%;max-height:200px;border-radius:6px;border:1px solid #ddd;object-fit:contain">
      </div>
      ${q.question ? `<div class="ms-body">${__msEscHtml(q.question)}</div>` : ''}
      <div class="ms-quiz">${opts}</div>
      <div class="ms-feedback" id="ms-feedback"></div>`;
    completeDisabled = 'disabled';
  } else if(m.type === 'short_answer'){
    const q = m.quiz || {};
    body = `<div class="ms-body">${__msEscHtml(q.question || '')}</div>
      <textarea id="ms-sa-input" placeholder="답을 입력하세요"
        style="width:100%;min-height:80px;padding:8px 10px;border:1px solid #ccc;border-radius:6px;
          font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box;margin-bottom:4px"></textarea>
      <div class="ms-feedback" id="ms-feedback" style="display:none"></div>`;
    completeDisabled = 'disabled';
  } else if(m.type === 'discussion'){
    const q = m.quiz || {};
    const guides = (q.guides || []).filter(Boolean)
      .map(g => `<li>${__msEscHtml(g)}</li>`).join('');
    body = `<div class="ms-body"><strong>📢 토론 주제</strong><br>${__msEscHtml(q.topic || '')}</div>
      ${guides ? `<div class="ms-body"><strong>생각해볼 질문</strong><ul style="margin:4px 0;padding-left:20px">${guides}</ul></div>` : ''}
      <div class="ms-body" style="background:#e8f4fd;border-radius:6px;padding:8px 10px;font-size:13px;color:#1a6fa0">
        💬 맵 하단 채팅창으로 친구들과 자유롭게 토론해보세요!<br>토론을 마쳤으면 아래 완료를 눌러주세요.
      </div>`;
  } else if(m.type === 'ox_quiz'){
    const q = m.quiz || {};
    body = `<div class="ms-body">${__msEscHtml(q.question || '')}</div>
      <div id="ms-ox-btns" style="display:flex;gap:16px;justify-content:center;margin:12px 0">
        <button class="ms-ox-btn" data-val="O"
          style="font-size:32px;width:80px;height:80px;border-radius:50%;border:3px solid #ddd;background:#fff;cursor:pointer">⭕</button>
        <button class="ms-ox-btn" data-val="X"
          style="font-size:32px;width:80px;height:80px;border-radius:50%;border:3px solid #ddd;background:#fff;cursor:pointer">❌</button>
      </div>
      <div class="ms-feedback" id="ms-feedback"></div>`;
    completeDisabled = 'disabled';
  } else if(m.type === 'google_form'){
    const src = __msFormEmbedUrl(m.content);
    body = `<iframe height="320" src="${src}"></iframe>
      <a class="ms-link-btn" href="${m.content}" target="_blank" rel="noopener">새 창에서 열기</a>`;
  } else if(m.type === 'link'){
    body = `<div class="ms-body">아래 버튼을 눌러 활동 페이지로 이동한 뒤, 완료를 눌러주세요.</div>
      <a class="ms-link-btn" href="${m.content}" target="_blank" rel="noopener">열기</a>`;
  }

  const skipBtn = m.required ? '' : `<button id="ms-skip">나중에</button>`;

  return `
    <h3>${icon} ${__msEscHtml(m.title)}</h3>
    ${body}
    <div id="ms-actions">
      ${skipBtn}
      <button id="ms-complete" class="primary" ${completeDisabled}>완료</button>
    </div>
  `;
}

function __msBindMission(m, card){
  let customComplete = false; // true 이면 아래 공통 complete 리스너를 붙이지 않음

  if(m.type === 'quiz' || m.type === 'image_quiz'){
    const q = m.quiz || {};
    card.querySelectorAll('input[name="ms-quiz"]').forEach(input => {
      input.addEventListener('change', () => {
        const val = Number(input.value);
        const fb = card.querySelector('#ms-feedback');
        const completeBtn = card.querySelector('#ms-complete');
        if(val === q.answer){
          fb.textContent = '정답입니다! 완료를 눌러주세요.';
          fb.className = 'ms-feedback ok';
          completeBtn.disabled = false;
        } else {
          fb.textContent = '다시 한 번 생각해볼까요?';
          fb.className = 'ms-feedback bad';
          completeBtn.disabled = true;
        }
      });
    });

  } else if(m.type === 'short_answer'){
    const q = m.quiz || {};
    const input = card.querySelector('#ms-sa-input');
    const completeBtn = card.querySelector('#ms-complete');
    const fb = card.querySelector('#ms-feedback');

    if(input) input.addEventListener('input', () => {
      if(completeBtn) completeBtn.disabled = !input.value.trim();
    });

    if(completeBtn) completeBtn.addEventListener('click', () => {
      const answer = input ? input.value.trim() : '';
      if(!answer) return;

      if(q.model_answer){
        if(input) input.disabled = true;
        fb.innerHTML = `✅ 제출 완료!&nbsp;&nbsp;<strong>예시 답안:</strong> ${__msEscHtml(q.model_answer)}`;
        fb.style.display = 'block';
        fb.className = 'ms-feedback ok';
        completeBtn.textContent = '닫기';
        // 리스너 교체(기존 클릭 제거)
        const newBtn = completeBtn.cloneNode(true);
        completeBtn.replaceWith(newBtn);
        newBtn.addEventListener('click', () => __msComplete(m.id, answer));
      } else {
        __msComplete(m.id, answer);
      }
    });
    customComplete = true;

  } else if(m.type === 'ox_quiz'){
    const q = m.quiz || {};
    card.querySelectorAll('.ms-ox-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val;
        const fb = card.querySelector('#ms-feedback');
        const completeBtn = card.querySelector('#ms-complete');
        card.querySelectorAll('.ms-ox-btn').forEach(b => {
          b.style.background = '#fff';
          b.style.borderColor = '#ddd';
        });
        btn.style.background = '#e8f0fd';
        btn.style.borderColor = '#2980b9';
        if(val === q.answer){
          fb.textContent = '정답입니다! 완료를 눌러주세요.';
          fb.className = 'ms-feedback ok';
          if(completeBtn) completeBtn.disabled = false;
        } else {
          fb.textContent = '다시 한 번 생각해볼까요?';
          fb.className = 'ms-feedback bad';
          if(completeBtn) completeBtn.disabled = true;
        }
      });
    });
  }

  if(!customComplete){
    const completeBtn = card.querySelector('#ms-complete');
    if(completeBtn) completeBtn.addEventListener('click', () => __msComplete(m.id));
  }
  const skipBtn = card.querySelector('#ms-skip');
  if(skipBtn) skipBtn.addEventListener('click', () => {
    __msQueue.shift();
    __msShowNext();
  });
}

function __msShowNext(){
  const overlay = document.getElementById('ms-overlay');
  if(!overlay) return;
  if(!__msQueue.length){
    overlay.classList.add('hidden');
    return;
  }
  const m = __msQueue[0];
  const card = document.getElementById('ms-card');
  card.innerHTML = __msRenderMission(m);
  overlay.classList.remove('hidden');
  __msBindMission(m, card);
}

function __msOpenMission(pending){
  __msQueue = pending.slice();
  __msShowNext();
}

function __msComplete(id, answer = null){
  __msDone.add(id);
  try{ localStorage.setItem(__msStorageKey(), JSON.stringify(Array.from(__msDone))); }
  catch(e){ /* 저장 실패 시 진행은 계속 가능 */ }
  __msUpdateProgress();
  const mission = __msMissions.find(m => m.id === id);
  if(mission) __msRecordProgress(mission, answer);
  __msQueue.shift();
  __msShowNext();
  if(!__msQueue.length) checkZoneOnMove(pos); // 마지막 미션 완료 시 출입구 위치라면 즉시 이동 판정

  if(__msMissions.length && __msAllRequiredDone() && !__msAllDoneShown){
    __msAllDoneShown = true;
    try{ localStorage.setItem(__msAllDoneKey(), '1'); }catch(e){ /* 무시 */ }
    setTimeout(__msShowAllDoneCelebration, __msQueue.length ? 0 : 300);
  }
}

/* 교사 대시보드의 미션 진행현황 엑셀 다운로드용 기록 (실패해도 학생 진행에는 영향 없음) */
async function __msRecordProgress(mission, answer = null){
  const client = __msGetClient();
  if(!client) return;
  try{
    const row = {
      room_id: __msRoomId,
      student_id: __msStudentId,
      nickname: __msParam('nickname', null),
      map_id: __msMapId,
      mission_id: mission.id,
      mission_title: mission.title,
      required: !!mission.required,
      completed_at: new Date().toISOString()
    };
    if(answer !== null) row.student_answer = answer;
    await client.from('mission_progress').upsert(row, { onConflict: 'room_id,student_id,mission_id' });
  }catch(e){
    console.warn('[쌤버스] 미션 진행도 기록 실패', e);
  }
}

/* ===================== 초기화 ===================== */
async function initMissionSystem(mapId){
  __msMapId = mapId;
  __msRoomId = __msParam('room', 'demo');

  __msStudentId = sessionStorage.getItem('ssambus_student_id');
  if(!__msStudentId){
    __msStudentId = 'stu_' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('ssambus_student_id', __msStudentId);
  }

  try{
    __msDone = new Set(JSON.parse(localStorage.getItem(__msStorageKey()) || '[]'));
  }catch(e){
    __msDone = new Set();
  }

  try{
    __msAllDoneShown = localStorage.getItem(__msAllDoneKey()) === '1';
  }catch(e){
    __msAllDoneShown = false;
  }

  __msBuildUI();
  __msMissions = await __msLoadMissions(mapId);
  __msMapOrder = await __msLoadMapOrder();
  __msMapsWithMissions = await __msLoadMapsWithMissions();
  __msUpdateProgress();
  await __msLoadAndApplyOverlays(mapId);
  checkZoneOnMove(pos);
}

/* ===================== 맵 타일 오버레이 (가구 배치 – 픽셀 아트) ===================== */

async function __msLoadAndApplyOverlays(mapId){
  const client = __msGetClient();
  if(!client) return;
  try{
    const { data } = await client
      .from('room_settings')
      .select('map_tiles')
      .eq('room_id', __msRoomId)
      .maybeSingle();
    if(!data || !data.map_tiles) return;
    const overlays = data.map_tiles[mapId];
    if(!overlays || !Object.keys(overlays).length) return;

    const ts  = (typeof TS === 'number') ? TS : 48;
    const cv  = document.getElementById('map');
    const ctx2 = cv ? cv.getContext('2d') : null;

    // 혹시 남아있는 이전 방식 div 정리
    document.querySelectorAll('.ssambus-ctile').forEach(el => el.remove());

    Object.entries(overlays).forEach(([key, type]) => {
      const [r, c] = key.split(',').map(Number);
      // 충돌 블록 (99 = 어떤 맵의 WALKABLE에도 없는 값)
      if(typeof grid !== 'undefined' && grid[r] && grid[r][c] !== undefined){
        grid[r][c] = 99;
      }
      // 캔버스에 직접 픽셀 아트로 그리기
      if(ctx2) __msCTile(ctx2, c * ts, r * ts, ts, type);
    });
  }catch(e){
    console.warn('[쌤버스] 맵 타일 오버레이 로드 실패', e);
  }
}

/* ── 가구 픽셀 아트 디스패처 ── */
function __msCTile(ctx, x, y, ts, type){
  switch(type){
    case 20: __msCT20(ctx,x,y,ts); break; // 책상/가구
    case 21: __msCT21(ctx,x,y,ts); break; // 화분
    case 22: __msCT22(ctx,x,y,ts); break; // 책장
    case 23: __msCT23(ctx,x,y,ts); break; // 칸막이
    case 30: __msCT30(ctx,x,y,ts); break; // 벤치
    case 31: __msCT31(ctx,x,y,ts); break; // 나무/가로수
    case 32: __msCT32(ctx,x,y,ts); break; // 바위
    case 33: __msCT33(ctx,x,y,ts); break; // 꽃밭
    case 34: __msCT34(ctx,x,y,ts); break; // 운동 매트
    case 35: __msCT35(ctx,x,y,ts); break; // 운동기구(덤벨)
    case 36: __msCT36(ctx,x,y,ts); break; // 쓰레기통
    case 37: __msCT37(ctx,x,y,ts); break; // 버섯
  }
}

/* 20 – 추가 책상 */
function __msCT20(ctx,x,y,ts){
  // 의자 등받이
  ctx.fillStyle='#7a8a96'; ctx.fillRect(x+9,y+6,ts-18,9);
  ctx.fillStyle='#65757f'; ctx.fillRect(x+11,y+14,ts-22,3);
  // 상판
  ctx.fillStyle='#c8a06e'; ctx.fillRect(x+4,y+18,ts-8,ts-24);
  ctx.fillStyle='#dfc09a'; ctx.fillRect(x+4,y+18,ts-8,4);
  // 다리
  ctx.fillStyle='#7a5230';
  ctx.fillRect(x+5,y+ts-5,4,5); ctx.fillRect(x+ts-9,y+ts-5,4,5);
}

/* 21 – 화분 */
function __msCT21(ctx,x,y,ts){
  const cx=x+ts/2;
  // 줄기
  ctx.fillStyle='#1e6e3e'; ctx.fillRect(cx-1,y+ts-26,2,11);
  // 잎
  ctx.fillStyle='#1a8a44'; ctx.fillRect(cx-9,y+ts-36,9,10);
  ctx.fillStyle='#2ecc71'; ctx.fillRect(cx, y+ts-34,9,8);
  ctx.fillStyle='#27ae60'; ctx.fillRect(cx-5,y+ts-42,10,9);
  // 화분 테두리
  ctx.fillStyle='#b03a22'; ctx.fillRect(cx-9,y+ts-17,18,3);
  // 화분 몸통
  ctx.fillStyle='#c84b2c'; ctx.fillRect(cx-8,y+ts-14,16,10);
  // 흙
  ctx.fillStyle='#5a3a1a'; ctx.fillRect(cx-7,y+ts-14,14,3);
}

/* 22 – 책장 */
function __msCT22(ctx,x,y,ts){
  // 프레임
  ctx.fillStyle='#6b3a1f'; ctx.fillRect(x+2,y+1,ts-4,ts-2);
  // 선반
  ctx.fillStyle='#9c6d44';
  ctx.fillRect(x+2,y+1,ts-4,3);
  ctx.fillRect(x+2,y+ts/2-1,ts-4,2);
  ctx.fillRect(x+2,y+ts-4,ts-4,3);
  // 위칸 책
  const c1=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6'];
  const bw=Math.floor((ts-8)/5);
  for(let i=0;i<5;i++){
    ctx.fillStyle=c1[i]; ctx.fillRect(x+3+i*bw,y+4,bw-1,Math.floor(ts/2)-7);
    ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x+3+i*bw,y+4,1,Math.floor(ts/2)-7);
  }
  // 아래칸 책
  const c2=['#1abc9c','#e67e22','#34495e','#c0392b','#8e44ad'];
  for(let i=0;i<5;i++){
    ctx.fillStyle=c2[i]; ctx.fillRect(x+3+i*bw,y+ts/2+1,bw-1,Math.floor(ts/2)-6);
    ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x+3+i*bw,y+ts/2+1,1,Math.floor(ts/2)-6);
  }
}

/* 23 – 칸막이 */
function __msCT23(ctx,x,y,ts){
  const px=x+ts/2-5;
  ctx.fillStyle='#a0a7ac'; ctx.fillRect(px,y+3,10,ts-6);
  ctx.fillStyle='#c0c8cc'; ctx.fillRect(px+1,y+4,8,ts-8);
  ctx.fillStyle='#b0b8bc';
  for(let i=0;i<3;i++) ctx.fillRect(px+1,y+10+i*12,8,2);
  ctx.fillStyle='#888';
  ctx.fillRect(x+ts/2-9,y+ts-5,18,4);
  ctx.fillRect(x+ts/2-7,y+ts-8,14,4);
}

/* 30 – 벤치 */
function __msCT30(ctx,x,y,ts){
  // 등받이
  ctx.fillStyle='#7a5230'; ctx.fillRect(x+5,y+ts/2-3,ts-10,5);
  ctx.fillStyle='#9c6d44'; ctx.fillRect(x+5,y+ts/2-3,ts-10,2);
  // 좌판
  ctx.fillStyle='#a07830'; ctx.fillRect(x+5,y+ts/2+5,ts-10,6);
  ctx.fillStyle='#c09848'; ctx.fillRect(x+5,y+ts/2+5,ts-10,2);
  // 다리+연결바
  ctx.fillStyle='#666';
  ctx.fillRect(x+8,y+ts/2+10,4,ts/2-12);
  ctx.fillRect(x+ts-12,y+ts/2+10,4,ts/2-12);
  ctx.fillRect(x+8,y+ts-10,ts-16,3);
}

/* 31 – 나무/가로수 */
function __msCT31(ctx,x,y,ts){
  const cx=x+ts/2;
  // 기둥
  ctx.fillStyle='#6b3a1f'; ctx.fillRect(cx-4,y+ts/2+2,8,ts/2-4);
  // 잎 레이어
  ctx.fillStyle='#1a8a44';
  ctx.beginPath(); ctx.arc(cx,y+ts/2-2,ts/2-6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#27ae60';
  ctx.beginPath(); ctx.arc(cx-4,y+ts/2-6,ts/2-10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2ecc71';
  ctx.beginPath(); ctx.arc(cx+3,y+ts/2-8,ts/2-12,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.1)';
  ctx.beginPath(); ctx.arc(cx-3,y+ts/2-8,ts/2-16,0,Math.PI*2); ctx.fill();
}

/* 32 – 바위 */
function __msCT32(ctx,x,y,ts){
  ctx.fillStyle='rgba(0,0,0,.1)'; ctx.fillRect(x+8,y+ts/2+2,ts-12,ts/2-6);
  ctx.fillStyle='#7a8085'; ctx.fillRect(x+6,y+ts/2-4,ts-12,ts/2+2);
  ctx.fillStyle='#8e9499'; ctx.fillRect(x+8,y+ts/2-10,ts-16,12);
  ctx.fillStyle='#9aa0a5'; ctx.fillRect(x+12,y+ts/2-14,ts-22,10);
  ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(x+13,y+ts/2-12,7,3);
}

/* 33 – 꽃밭 */
function __msCT33(ctx,x,y,ts){
  ctx.fillStyle='#2e8b57';
  const st=[[ts/2-9,ts-9],[ts/2,ts-11],[ts/2+9,ts-8]];
  st.forEach(([sx,sy])=>{ ctx.fillRect(x+sx-1,y+sy-10,2,10); });
  const fc=['#ff69b4','#ff6347','#ffd700'];
  st.forEach(([sx,sy],i)=>{
    ctx.fillStyle=fc[i];
    ctx.beginPath(); ctx.arc(x+sx,y+sy-12,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(x+sx,y+sy-12,2,0,Math.PI*2); ctx.fill();
  });
}

/* 34 – 운동 매트 */
function __msCT34(ctx,x,y,ts){
  ctx.fillStyle='#2c82c9'; ctx.fillRect(x+3,y+6,ts-6,ts-12);
  ctx.fillStyle='#3498db'; ctx.fillRect(x+3,y+6,ts-6,4);
  ctx.fillStyle='#1a5c99'; ctx.fillRect(x+3,y+ts-10,ts-6,4);
  ctx.fillStyle='rgba(255,255,255,.12)';
  const sw=Math.floor((ts-10)/3);
  for(let i=0;i<3;i++) ctx.fillRect(x+5+i*sw,y+8,sw-2,ts-20);
  ctx.strokeStyle='#1a5c99'; ctx.lineWidth=1.5;
  ctx.strokeRect(x+3,y+6,ts-6,ts-12);
}

/* 35 – 운동기구(덤벨) */
function __msCT35(ctx,x,y,ts){
  const cx=x+ts/2, cy=y+ts/2;
  ctx.fillStyle='#888'; ctx.fillRect(cx-12,cy-2,24,4);
  ctx.fillStyle='#555'; ctx.fillRect(cx-15,cy-6,4,12); ctx.fillRect(cx+11,cy-6,4,12);
  ctx.fillStyle='#444'; ctx.fillRect(cx-18,cy-7,3,14); ctx.fillRect(cx+15,cy-7,3,14);
  ctx.fillStyle='#aaa'; ctx.fillRect(cx-8,cy-1,16,2);
}

/* 36 – 쓰레기통 */
function __msCT36(ctx,x,y,ts){
  const cx=x+ts/2;
  ctx.fillStyle='#2c3e50'; ctx.fillRect(cx-7,y+ts/2-2,14,18);
  ctx.fillStyle='#34495e'; ctx.fillRect(cx-8,y+ts/2-6,16,5);
  ctx.fillStyle='#7f8c8d'; ctx.fillRect(cx-2,y+ts/2-8,4,3);
  ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(cx-5,y+ts/2,3,14);
}

/* 37 – 버섯 */
function __msCT37(ctx,x,y,ts){
  const cx=x+ts/2;
  // 줄기
  ctx.fillStyle='#f5f0e8'; ctx.fillRect(cx-4,y+ts-16,8,10);
  ctx.fillStyle='#e8e0d0'; ctx.fillRect(cx-4,y+ts-18,8,4);
  // 갓
  ctx.fillStyle='#c0392b';
  ctx.fillRect(cx-11,y+ts-24,22,9);
  ctx.fillRect(cx-8, y+ts-30,16,8);
  ctx.fillRect(cx-5, y+ts-34,10,6);
  // 흰 점
  ctx.fillStyle='rgba(255,255,255,.85)';
  ctx.fillRect(cx-3,y+ts-29,3,3); ctx.fillRect(cx+3,y+ts-25,2,2); ctx.fillRect(cx-6,y+ts-22,2,2);
}

