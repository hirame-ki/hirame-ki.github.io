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
  classroom: [   // 60×60 맵 기준 - 8행 간격으로 8개 구역
    {id:'zone_A', label:'칠판·TV 앞·교사 책상',  r0:1,  c0:2, r1:5,  c1:57},
    {id:'zone_B', label:'앞쪽 통로·앞문',         r0:7,  c0:2, r1:11, c1:57},
    {id:'zone_C', label:'책상 1열',              r0:12, c0:2, r1:16, c1:57},
    {id:'zone_D', label:'책상 2열',              r0:20, c0:2, r1:24, c1:57},
    {id:'zone_E', label:'책상 3열',              r0:28, c0:2, r1:32, c1:57},
    {id:'zone_F', label:'책상 4열',              r0:36, c0:2, r1:40, c1:57},
    {id:'zone_G', label:'책상 5열',              r0:44, c0:2, r1:48, c1:57},
    {id:'zone_H', label:'뒤쪽 통로·게시판/사물함', r0:52, c0:2, r1:58, c1:57}
  ],
  library: [   // 30열 x 36행 - 4칸 서가 그룹, 4칸 폭 통로
    {id:'zone_A', label:'입구·대출대',      r0:0,  c0:1, r1:3,  c1:28},
    {id:'zone_B', label:'서가 1열 통로',    r0:4,  c0:1, r1:5,  c1:28},
    {id:'zone_C', label:'서가 2열 통로',    r0:8,  c0:1, r1:9,  c1:28},
    {id:'zone_D', label:'서가 3열 통로',    r0:12, c0:1, r1:13, c1:28},
    {id:'zone_E', label:'서가 4열 통로',    r0:16, c0:1, r1:17, c1:28},
    {id:'zone_F', label:'서가 5열 통로',    r0:20, c0:1, r1:21, c1:28},
    {id:'zone_G', label:'서가 6열 통로',    r0:24, c0:1, r1:25, c1:28},
    {id:'zone_H', label:'열람실',           r0:28, c0:1, r1:34, c1:28}
  ],
  playground: [   // 32열 x 14행 - 열 단위 구역 (4열 간격 + 2열 완충)
    {id:'zone_A', label:'서쪽 펜스·골대',   r0:2, c0:0,  r1:11, c1:2},
    {id:'zone_B', label:'서쪽 놀이기구',    r0:2, c0:4,  r1:11, c1:6},
    {id:'zone_C', label:'서쪽 잔디',        r0:2, c0:8,  r1:11, c1:10},
    {id:'zone_D', label:'중앙 광장(좌)',    r0:2, c0:12, r1:11, c1:14},
    {id:'zone_E', label:'중앙 광장(우)',    r0:2, c0:17, r1:11, c1:19},
    {id:'zone_F', label:'동쪽 잔디',        r0:2, c0:21, r1:11, c1:23},
    {id:'zone_G', label:'동쪽 놀이기구',    r0:2, c0:25, r1:11, c1:27},
    {id:'zone_H', label:'동쪽 펜스·골대',   r0:2, c0:29, r1:11, c1:31}
  ],
  gym: [   // 28열 x 14행 - 3열 간격 구역
    {id:'zone_A', label:'무대·관람석(좌)',   r0:2, c0:0,  r1:11, c1:2},
    {id:'zone_B', label:'코트 좌측1',       r0:2, c0:4,  r1:11, c1:6},
    {id:'zone_C', label:'코트 좌측2',       r0:2, c0:8,  r1:11, c1:9},
    {id:'zone_D', label:'코트 중앙(좌)',     r0:2, c0:11, r1:11, c1:12},
    {id:'zone_E', label:'코트 중앙(우)',     r0:2, c0:15, r1:11, c1:16},
    {id:'zone_F', label:'코트 우측1',       r0:2, c0:18, r1:11, c1:19},
    {id:'zone_G', label:'코트 우측2',       r0:2, c0:21, r1:11, c1:22},
    {id:'zone_H', label:'관람석·보관대(우)', r0:2, c0:25, r1:11, c1:27}
  ],
  forest: [   // 28열 x 14행 - 구역 중심부만 (테두리 제외)
    {id:'zone_A', label:'입구·서북쪽 숲',   r0:1, c0:1,  r1:5,  c1:5},
    {id:'zone_B', label:'북쪽 연못가',      r0:1, c0:8,  r1:5,  c1:12},
    {id:'zone_C', label:'북동쪽 숲',        r0:1, c0:15, r1:5,  c1:19},
    {id:'zone_D', label:'북동쪽 깊은 숲',    r0:1, c0:22, r1:5,  c1:26},
    {id:'zone_E', label:'서남쪽 숲',        r0:8, c0:1,  r1:12, c1:5},
    {id:'zone_F', label:'남쪽 연못가',      r0:8, c0:8,  r1:12, c1:12},
    {id:'zone_G', label:'남동쪽 숲',        r0:8, c0:15, r1:12, c1:19},
    {id:'zone_H', label:'동남쪽 깊은 숲',   r0:8, c0:22, r1:12, c1:26}
  ],
  music: [   // 60×55 - 무대+악기+악보대+창고
    {id:'zone_A', label:'무대',             r0:1,  c0:2, r1:6,  c1:57},
    {id:'zone_B', label:'대형악기 구역',     r0:8,  c0:2, r1:14, c1:57},
    {id:'zone_C', label:'악보대 1열',       r0:15, c0:2, r1:23, c1:57},
    {id:'zone_D', label:'악보대 2열',       r0:24, c0:2, r1:32, c1:57},
    {id:'zone_E', label:'악보대 3열',       r0:33, c0:2, r1:41, c1:57},
    {id:'zone_F', label:'뒷자리',           r0:42, c0:2, r1:44, c1:57},
    {id:'zone_G', label:'창고 앞쪽',        r0:47, c0:2, r1:50, c1:57},
    {id:'zone_H', label:'창고 안쪽',        r0:51, c0:2, r1:53, c1:57}
  ],
  artroom: [   // 60×60 - 이젤+선반+작업대
    {id:'zone_A', label:'앞쪽 이젤 구역',   r0:1,  c0:2, r1:10, c1:57},
    {id:'zone_B', label:'이젤 2구역',       r0:11, c0:2, r1:21, c1:57},
    {id:'zone_C', label:'이젤 3구역',       r0:22, c0:2, r1:31, c1:57},
    {id:'zone_D', label:'이젤 4구역',       r0:32, c0:2, r1:36, c1:57},
    {id:'zone_E', label:'선반 구역',        r0:37, c0:2, r1:42, c1:57},
    {id:'zone_F', label:'의자·작업대',      r0:43, c0:2, r1:47, c1:57},
    {id:'zone_G', label:'하단 통로',        r0:48, c0:19, r1:56, c1:57},
    {id:'zone_H', label:'준비실',           r0:57, c0:2,  r1:59, c1:57}
  ],
  computer: [   // 60×60 - PC열+전산실
    {id:'zone_A', label:'교탁·칠판 앞',     r0:1,  c0:2, r1:6,  c1:43},
    {id:'zone_B', label:'PC 1열',          r0:7,  c0:2, r1:15, c1:43},
    {id:'zone_C', label:'PC 2열',          r0:16, c0:2, r1:24, c1:43},
    {id:'zone_D', label:'PC 3열',          r0:25, c0:2, r1:33, c1:43},
    {id:'zone_E', label:'PC 4열',          r0:34, c0:2, r1:42, c1:43},
    {id:'zone_F', label:'PC 5열',          r0:43, c0:2, r1:46, c1:43},
    {id:'zone_G', label:'전산실 앞',        r0:1,  c0:44, r1:46, c1:57},
    {id:'zone_H', label:'전산실 내부',      r0:47, c0:44, r1:58, c1:57}
  ],
  science: [   // 60×60 - 실험대+준비실
    {id:'zone_A', label:'교사 책상·전시대', r0:1,  c0:2, r1:4,  c1:38},
    {id:'zone_B', label:'실험대 1열',       r0:5,  c0:2, r1:14, c1:38},
    {id:'zone_C', label:'실험대 2열',       r0:15, c0:2, r1:24, c1:38},
    {id:'zone_D', label:'실험대 3열',       r0:25, c0:2, r1:36, c1:38},
    {id:'zone_E', label:'관찰·시약 구역',   r0:1,  c0:39, r1:36, c1:57},
    {id:'zone_F', label:'준비실 입구',      r0:37, c0:39, r1:39, c1:57},
    {id:'zone_G', label:'준비실 앞쪽',      r0:40, c0:39, r1:49, c1:57},
    {id:'zone_H', label:'준비실 안쪽',      r0:50, c0:39, r1:58, c1:57}
  ],
  cafeteria: [   // 60×60 - 주방+배식창구+식탁
    {id:'zone_A', label:'주방',             r0:1,  c0:2, r1:18, c1:57},
    {id:'zone_B', label:'배식 창구',        r0:19, c0:2, r1:23, c1:57},
    {id:'zone_C', label:'식탁 앞줄',        r0:24, c0:2, r1:33, c1:57},
    {id:'zone_D', label:'식탁 중간',        r0:34, c0:2, r1:43, c1:57},
    {id:'zone_E', label:'식탁 뒷줄',        r0:44, c0:2, r1:53, c1:57},
    {id:'zone_F', label:'출구 앞',          r0:54, c0:2, r1:58, c1:57},
    {id:'zone_G', label:'주방 좌측',        r0:4,  c0:2, r1:10, c1:19},
    {id:'zone_H', label:'주방 우측',        r0:4,  c0:38, r1:10, c1:57}
  ],
  health: [   // 40×40 - 보건교사구역+침대구역
    {id:'zone_A', label:'보건교사 구역(상)', r0:1,  c0:2,  r1:7,  c1:12},
    {id:'zone_B', label:'보건교사 구역(중)', r0:9,  c0:2,  r1:24, c1:12},
    {id:'zone_C', label:'침대 구역(상)',    r0:2,  c0:14, r1:12, c1:38},
    {id:'zone_D', label:'침대 구역(중)',    r0:13, c0:14, r1:24, c1:38},
    {id:'zone_E', label:'침대 구역(하)',    r0:25, c0:14, r1:38, c1:38},
    {id:'zone_F', label:'보건교사 구역(하)', r0:26, c0:2,  r1:37, c1:12},
    {id:'zone_G', label:'상단 출구',        r0:0,  c0:5,  r1:1,  c1:9},
    {id:'zone_H', label:'하단 출구',        r0:38, c0:5,  r1:39, c1:9}
  ],
  maze: [   // 60×60 - 미로 전체를 8구역으로 균등 분할
    {id:'zone_A', label:'미로 구역 A (왼쪽 상단)',   r0:1,  c0:1,  r1:19, c1:19},
    {id:'zone_B', label:'미로 구역 B (중앙 상단)',   r0:1,  c0:20, r1:19, c1:38},
    {id:'zone_C', label:'미로 구역 C (오른쪽 상단)', r0:1,  c0:39, r1:19, c1:57},
    {id:'zone_D', label:'미로 구역 D (왼쪽 중앙)',   r0:20, c0:1,  r1:37, c1:19},
    {id:'zone_E', label:'미로 구역 E (중앙)',        r0:20, c0:20, r1:37, c1:38},
    {id:'zone_F', label:'미로 구역 F (오른쪽 중앙)', r0:20, c0:39, r1:37, c1:57},
    {id:'zone_G', label:'미로 구역 G (왼쪽 하단)',   r0:38, c0:1,  r1:57, c1:28},
    {id:'zone_H', label:'미로 구역 H (오른쪽 하단)', r0:38, c0:29, r1:57, c1:57}
  ],
  race: [   // 40×120 경주 트랙 (S자 사행 코스, 4칸 폭) - 게이트 8개 각각 1구역
    {id:'zone_A', label:'게이트 1 (중앙 직선)',   r0:105,c0:18, r1:107,c1:21},
    {id:'zone_B', label:'게이트 2 (우측 직선)',   r0:90, c0:32, r1:92, c1:35},
    {id:'zone_C', label:'게이트 3 (좌측 직선)',   r0:75, c0:3,  r1:77, c1:6},
    {id:'zone_D', label:'게이트 4 (중앙 직선)',   r0:60, c0:18, r1:62, c1:21},
    {id:'zone_E', label:'게이트 5 (좌측 직선)',   r0:45, c0:3,  r1:47, c1:6},
    {id:'zone_F', label:'게이트 6 (우측 직선)',   r0:30, c0:32, r1:32, c1:35},
    {id:'zone_G', label:'게이트 7 (중앙 직선)',   r0:15, c0:18, r1:17, c1:21},
    {id:'zone_H', label:'게이트 8 (결승선 직전)', r0:3,  c0:32, r1:5,  c1:35}
  ]
};

/* ===================== 맵 간 이동(출입구) 설정 ===================== */
/* 맵별 출입구(문/게이트) 칸 - 미션 완료 후 이 칸에 들어가면 다음 맵으로 자동 이동 */
const EXIT_ZONES = {
  classroom: [
    {r0:10, c0:58, r1:10, c1:59},  // 앞문 (60x60)
    {r0:48, c0:58, r1:48, c1:59}   // 뒷문 (60x60)
  ],
  library: [
    {r0:0, c0:13, r1:0, c1:15}     // 입구 (30x36, 중앙 3칸 출입구)
  ],
  playground: [
    {r0:0, c0:27, r1:1, c1:28}     // 정문 게이트 (56x24)
  ],
  gym: [
    {r0:0, c0:10, r1:1, c1:11}     // 출입구 (48x24)
  ],
  forest: [
    {r0:0, c0:23, r1:1, c1:24},    // 북쪽 출구 (48x24)
    {r0:22, c0:23, r1:23, c1:24},  // 남쪽 출구
    {r0:11, c0:0, r1:12, c1:1},    // 서쪽 출구
    {r0:11, c0:46, r1:12, c1:47}   // 동쪽 출구
  ],
  music: [
    {r0:6,  c0:59, r1:6,  c1:59},   // 우측 출구 (무대 옆)
    {r0:45, c0:59, r1:45, c1:59}    // 우측 출구 (본실 뒤)
  ],
  artroom: [
    {r0:5,  c0:59, r1:5,  c1:59},   // 우측 출구 (상단)
    {r0:55, c0:59, r1:55, c1:59},   // 우측 출구 (하단)
    {r0:57, c0:28, r1:57, c1:29}    // 하단 문
  ],
  computer: [
    {r0:5,  c0:59, r1:5,  c1:59},   // 우측 출구 (상단)
    {r0:44, c0:59, r1:44, c1:59}    // 우측 출구 (하단)
  ],
  science: [
    {r0:5,  c0:59, r1:5,  c1:59},   // 우측 출구 (주실 상단)
    {r0:36, c0:59, r1:36, c1:59}    // 우측 출구 (준비실 앞)
  ],
  cafeteria: [
    {r0:0,  c0:10, r1:0,  c1:10},   // 주방 상단 출구 1
    {r0:0,  c0:30, r1:0,  c1:30},   // 주방 상단 출구 2
    {r0:0,  c0:50, r1:0,  c1:50},   // 주방 상단 출구 3
    {r0:59, c0:10, r1:59, c1:10},   // 하단 출구 1
    {r0:59, c0:30, r1:59, c1:30},   // 하단 출구 2
    {r0:59, c0:50, r1:59, c1:50}    // 하단 출구 3
  ],
  health: [
    {r0:0,  c0:7, r1:0,  c1:7},     // 상단 출구
    {r0:39, c0:7, r1:39, c1:7}      // 하단 출구
  ],
  maze: [
    {r0:28, c0:57, r1:29, c1:57}    // 오른쪽 출구 (col57 EXIT 타일)
  ],
  race: [
    {r0:0, c0:32, r1:3, c1:35}      // 결승선 구역 (40×120 S자 코스, 4칸 폭)
  ]
};

/* 학생용 맵 파일 경로 / 표시 이름 (교사 대시보드의 MAP_FILES, MAPS와 동일) */
const MAP_FILES = {
  classroom:'ssambus_map_classroom.html',
  library:'ssambus_map_library.html',
  playground:'ssambus_map_playground.html',
  gym:'ssambus_map_gym.html',
  forest:'ssambus_map_forest.html',
  music:'ssambus_map_music.html',
  artroom:'ssambus_map_artroom.html',
  computer:'ssambus_map_computer.html',
  science:'ssambus_map_science.html',
  cafeteria:'ssambus_map_cafeteria.html',
  health:'ssambus_map_health.html',
  maze:'ssambus_map_maze.html',
  race:'ssambus_map_race.html',
  modum_classroom:'ssambus_map_modum_classroom.html',
  classroom3d:'ssamverse3d/classroom3d.html',   // 3D 맵 (ssamverse3d/ 하위 폴더)
  forest3d:'ssamverse3d/ssamverse-3d-forest.html',
  playground3d:'ssamverse3d/playground3d.html',
  gym3d:'ssamverse3d/ssamverse-gym3d.html',
  science3d:'ssamverse3d/ssamverse-science-lab-3d.html',
  health3d:'ssamverse3d/health-room-3d.html',
  computer3d:'ssamverse3d/ssamverse-3d-lab.html'
};
const MAP_LABELS = {
  classroom:'일반교실', library:'도서관', playground:'운동장',
  gym:'체육관', forest:'자연숲',
  music:'음악실', artroom:'미술실', computer:'컴퓨터실',
  science:'과학실', cafeteria:'급식실', health:'보건실', maze:'미로', race:'경주 트랙', modum_classroom:'모둠교실',
  classroom3d:'3D 교실', forest3d:'3D 자연숲', playground3d:'3D 운동장',
  gym3d:'3D 체육관', science3d:'3D 과학실',
  health3d:'3D 보건실', computer3d:'3D 컴퓨터실'
};

/* 교사가 순서를 설정하지 않았을 때 사용할 기본 맵 순서 */
const MAP_ORDER_DEFAULT = ['classroom','library','playground','gym','forest','music','artroom','computer','science','cafeteria','health'];

/* ===================== 데모 미션 (Supabase 미설정/데이터 없을 때 대체) ===================== */
const __MS_DEMO_VIDEO = 'https://www.youtube.com/watch?v=v66yDEGA9nk';
const __MS_DEMO_INSTA = {id_suffix:'_3', zone_id:'zone_C', order:3, required:true,
  title:'쌤버스 인스타그램 방문하기', type:'link', content:'https://www.instagram.com/hirame.ki/'};

/* 데모 이미지 퀴즈용 SVG (복도 에티켓) - 자체 생성 data URL */
const __MS_DEMO_IMG = (()=>{
  const s='<svg xmlns="http://www.w3.org/2000/svg" width="380" height="200">'
    +'<rect width="380" height="200" fill="#EEF2FF" rx="8"/>'
    +'<text x="190" y="24" font-family="sans-serif" font-size="15" font-weight="bold" fill="#2C3E50" text-anchor="middle">학교 복도 통행 규칙</text>'
    +'<rect x="10" y="33" width="170" height="157" fill="#FFE8E8" rx="8"/>'
    +'<text x="95" y="52" font-family="sans-serif" font-size="13" fill="#C0392B" text-anchor="middle" font-weight="bold">X 잘못된 행동</text>'
    +'<circle cx="95" cy="83" r="13" fill="#F4A261"/>'
    +'<line x1="95" y1="96" x2="87" y2="116" stroke="#444" stroke-width="4"/>'
    +'<line x1="87" y1="116" x2="74" y2="137" stroke="#444" stroke-width="3"/>'
    +'<line x1="87" y1="116" x2="103" y2="132" stroke="#444" stroke-width="3"/>'
    +'<line x1="95" y1="103" x2="77" y2="111" stroke="#444" stroke-width="3"/>'
    +'<line x1="95" y1="103" x2="113" y2="108" stroke="#444" stroke-width="3"/>'
    +'<line x1="40" y1="90" x2="65" y2="88" stroke="#E74C3C" stroke-width="2.5"/>'
    +'<line x1="36" y1="98" x2="62" y2="96" stroke="#E74C3C" stroke-width="2.5"/>'
    +'<text x="95" y="175" font-family="sans-serif" font-size="12" fill="#C0392B" text-anchor="middle">복도에서 뛰기</text>'
    +'<rect x="200" y="33" width="170" height="157" fill="#E8FFED" rx="8"/>'
    +'<text x="285" y="52" font-family="sans-serif" font-size="13" fill="#27AE60" text-anchor="middle" font-weight="bold">O 올바른 행동</text>'
    +'<circle cx="285" cy="83" r="13" fill="#F4A261"/>'
    +'<line x1="285" y1="96" x2="285" y2="120" stroke="#444" stroke-width="4"/>'
    +'<line x1="285" y1="120" x2="274" y2="142" stroke="#444" stroke-width="3"/>'
    +'<line x1="285" y1="120" x2="296" y2="142" stroke="#444" stroke-width="3"/>'
    +'<line x1="285" y1="105" x2="270" y2="116" stroke="#444" stroke-width="3"/>'
    +'<line x1="285" y1="105" x2="300" y2="116" stroke="#444" stroke-width="3"/>'
    +'<text x="285" y="175" font-family="sans-serif" font-size="12" fill="#27AE60" text-anchor="middle">오른쪽으로 걷기</text>'
    +'</svg>';
  try{return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s)));}catch(e){return '';}
})();

/* 데모 구글 설문지 URL - Chrome 확장 미연결로 직접 생성 불가, 아래 URL을 실제 폼 주소로 교체 */
const __MS_DEMO_FORM_URL = 'https://forms.gle/VTwB8SzrN7YH212e9';

/* 데모 이미지 퀴즈 공통 객체 */
const __MS_DEMO_IQ = {
  image_url: __MS_DEMO_IMG,
  question: '위 그림을 보고, 학교 복도에서 올바른 행동을 고르세요.',
  options: ['빠르게 뛰어다닌다','오른쪽으로 조용히 걷는다','친구와 큰 소리로 떠든다','장난을 치며 걸어다닌다'],
  answer: 1
};

const DEMO_MISSIONS = {
  classroom: [
    {id:'demo_classroom_1', zone_id:'zone_A', order:1, required:true, title:'수업 안내 영상 시청',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_classroom_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 교실 예절',
      type:'quiz', quiz:{question:'친구가 발표할 때 가장 알맞은 태도는 무엇일까요?',
        options:['딴짓을 한다','발표자를 바라보며 경청한다','옆 친구와 이야기한다','자리에서 일어나 돌아다닌다'], answer:1}},
    {id:'demo_classroom_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_classroom_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  library: [
    {id:'demo_library_1', zone_id:'zone_A', order:1, required:true, title:'도서관 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_library_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 도서관 예절',
      type:'quiz', quiz:{question:'도서관에서 책을 다 읽은 후 가장 알맞은 행동은?',
        options:['아무 곳에나 두고 나간다','제자리에 정리한다','다른 칸에 숨겨둔다','바닥에 쌓아둔다'], answer:1}},
    {id:'demo_library_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_library_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL,
      trigger_tiles:[{r:0,c:13},{r:0,c:14},{r:0,c:15}]}
  ],
  playground: [
    {id:'demo_playground_1', zone_id:'zone_A', order:1, required:true, title:'운동장 안전 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_playground_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 운동장 안전',
      type:'quiz', quiz:{question:'축구공이 다른 친구 쪽으로 빠르게 날아갈 때 가장 먼저 해야 할 일은?',
        options:['소리쳐서 알려준다','모른 척한다','더 세게 찬다','뛰어가서 잡는다'], answer:0}},
    {id:'demo_playground_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_playground_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  gym: [
    {id:'demo_gym_1', zone_id:'zone_A', order:1, required:true, title:'체육관 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_gym_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 체육 안전 수칙',
      type:'quiz', quiz:{question:'체육 활동을 시작하기 전에 가장 먼저 해야 할 일은?',
        options:['바로 전속력으로 달리기','준비 운동(스트레칭)','물 마시기 생략','신발 벗고 활동하기'], answer:1}},
    {id:'demo_gym_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_gym_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  forest: [
    {id:'demo_forest_1', zone_id:'zone_A', order:1, required:true, title:'자연 생태 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_forest_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 자연 보호',
      type:'quiz', quiz:{question:'숲에서 가져온 쓰레기는 어떻게 처리해야 할까요?',
        options:['숲 속에 묻는다','연못에 버린다','집까지 가져가 분리배출한다','나무 위에 걸어둔다'], answer:2}},
    {id:'demo_forest_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_forest_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  music: [
    {id:'demo_music_1', zone_id:'zone_A', order:1, required:true, title:'음악실 소개 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_music_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 악기 예절',
      type:'quiz', quiz:{question:'음악 시간에 악기를 연주하기 전 가장 먼저 해야 할 일은?',
        options:['바로 힘껏 두드린다','선생님의 지도를 듣고 조용히 기다린다','친구의 악기를 먼저 빌린다','큰 소리로 자유롭게 연주한다'], answer:1}},
    {id:'demo_music_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_music_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  artroom: [
    {id:'demo_artroom_1', zone_id:'zone_A', order:1, required:true, title:'미술실 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_artroom_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 미술 재료 정리',
      type:'quiz', quiz:{question:'미술 시간이 끝난 후 팔레트를 정리하는 올바른 방법은?',
        options:['물감이 묻은 채로 그냥 둔다','물로 깨끗이 씻어 건조시킨다','다른 사람 자리에 밀어 놓는다','바닥에 내려놓는다'], answer:1}},
    {id:'demo_artroom_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_artroom_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  computer: [
    {id:'demo_computer_1', zone_id:'zone_A', order:1, required:true, title:'컴퓨터실 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_computer_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 인터넷 예절',
      type:'quiz', quiz:{question:'인터넷에서 타인의 개인 정보를 발견했을 때 가장 알맞은 행동은?',
        options:['친구에게 공유한다','그냥 지나친다','SNS에 올린다','관계 기관에 신고한다'], answer:3}},
    {id:'demo_computer_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_computer_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  science: [
    {id:'demo_science_1', zone_id:'zone_A', order:1, required:true, title:'과학 실험 안전 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_science_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 실험 안전 수칙',
      type:'quiz', quiz:{question:'과학 실험 중 화학 약품이 눈에 들어갔을 때 가장 먼저 해야 할 일은?',
        options:['손으로 비빈다','깨끗한 물로 즉시 세척하고 선생님께 알린다','그냥 참는다','친구에게 물어본다'], answer:1}},
    {id:'demo_science_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_science_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  cafeteria: [
    {id:'demo_cafeteria_1', zone_id:'zone_A', order:1, required:true, title:'급식 예절 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_cafeteria_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 급식 예절',
      type:'quiz', quiz:{question:'급식 줄에서 친구가 새치기를 했을 때 가장 알맞은 행동은?',
        options:['함께 새치기한다','아무말도 안 한다','정중하게 줄을 서달라고 말한다','줄에서 나와버린다'], answer:2}},
    {id:'demo_cafeteria_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_cafeteria_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ],
  health: [
    {id:'demo_health_1', zone_id:'zone_A', order:1, required:true, title:'보건실 이용 안내 영상',
      type:'youtube', content:__MS_DEMO_VIDEO},
    {id:'demo_health_2', zone_id:'zone_B', order:2, required:true, title:'퀴즈: 응급 처치',
      type:'quiz', quiz:{question:'친구가 갑자기 코피를 흘릴 때 가장 먼저 해야 할 일은?',
        options:['고개를 뒤로 젖히게 한다','고개를 앞으로 숙이고 코를 살짝 막는다','바닥에 눕힌다','코를 세게 풀게 한다'], answer:1}},
    {id:'demo_health_3', zone_id:'zone_C', order:3, required:true, title:'이미지 퀴즈: 복도 에티켓',
      type:'image_quiz', quiz:__MS_DEMO_IQ},
    {id:'demo_health_4', zone_id:'zone_D', order:4, required:true, title:'쌤버스 체험 설문지',
      type:'google_form', content:__MS_DEMO_FORM_URL}
  ]
};

/* ===================== 내부 상태 ===================== */
let __msMapId = null;
let __msRoomId = null;
let __msStudentId = null;
let __msMissions = null;  // null = 아직 로드 전
let __msDone = new Set();
let __msCharUnlockThreshold = 5;
let __msCurrentZone;       // undefined = 아직 판정 전
let __msQueue = [];
let __msMapOrder = null;        // 교사가 설정한(또는 기본) 맵 순서
let __msMapsWithMissions = null; // 이 수업(room)에 미션이 등록된 맵 id 집합
let __msTransitioning = false;   // 다음 맵으로 이동 처리 중 중복 방지
let __msAllDoneShown = false;    // 이 맵의 "전체 완료" 축하 팝업을 이미 보여줬는지
let __msEntryTime = null;        // 맵 입장 시각 (ms)
let __msTimerInterval = null;    // 경과 시간 표시용 인터벌 ID

function __msEscHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* 주관식 채점용 정규화: 공백/대소문자/일부 문장부호 차이만 무시 (경주 트랙과 동일 기준) */
function __msNormalizeAnswer(s){
  return String(s || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[.,!?~·˙'"()\[\]]/g, '');
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

/* 닉네임 기반으로 student_id를 고정 생성 — 같은 방에 다른 기기로 같은 닉네임을 입력하면
   동일한 student_id가 되어 mission_progress 기록을 그대로 이어받을 수 있다. */
function __msDeriveStudentId(nickname){
  return 'nick_' + nickname.trim();
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
  if(__msRoomId === 'demo') return (DEMO_MISSIONS[mapId] || []).map(m => Object.assign({}, m));
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
      console.warn('[쌤버스] 미션 로드 실패', e);
    }
  }
  return [];
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

/* 이 수업(room) 전체(모든 맵)의 필수 미션 총 개수 — 진행현황 진행바의 분모로 사용.
   __msLoadMapsWithMissions에서 함께 집계한다. (0 = 아직 로드 전/집계 실패) */
let __msRoomTotalRequired = 0;

/* 이 수업(room)에 실제로 미션이 등록된 맵 id 집합 (데모 미션은 포함하지 않음) */
async function __msLoadMapsWithMissions(){
  const set = new Set();
  __msRoomTotalRequired = 0;
  const client = __msGetClient();
  if(client){
    try{
      const { data, error } = await client
        .from('missions')
        .select('map_id, required')
        .eq('room_id', __msRoomId);
      if(!error && data){
        data.forEach(row => {
          set.add(row.map_id);
          if(row.required !== false) __msRoomTotalRequired++; // 수업 전체 필수 미션 수
        });
      }
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

/* ===================== 3D 맵 전용: 좌표 기반 근접 판정 ===================== */
/* trigger_point:{x,z,r} 를 가진 미션 중 플레이어(x,z)와 가장 가까운 미완료 미션을 반환.
   미션 로드 전(__msMissions===null)이거나 근처에 없으면 null. 교사 참가자는 발동 대상에서 제외. */
function checkMission3D(x, z){
  if(__msMissions === null) return null;
  if(window.__rtTeacherParticipant) return null;
  let best = null, bestDist = Infinity;
  for(const m of __msMissions){
    if(__msDone.has(m.id) || !m.trigger_point) continue;
    const dx = x - m.trigger_point.x, dz = z - m.trigger_point.z;
    const rad = m.trigger_point.r || 2.2;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if(dist <= rad && dist < bestDist){ best = m; bestDist = dist; }
  }
  return best;
}

/* 3D 맵 전용: 문(출구)에 도달했을 때 다음 맵으로 이동을 시도한다.
   2D의 __msCheckExit는 그리드 EXIT_ZONES 기반이라 월드 좌표 3D 맵엔 맞지 않으므로 별도 경로.
   3D 맵(classroom3d.html 등)이 매 프레임 "문 근처인지" 판정해 이 함수를 호출한다.
   반환값:
     'go'            - 필수 미션 완료 + 다음 맵 존재 → 이동 시작(배너 후 페이지 전환)
     'incomplete'    - 필수 미션이 남아 이동 불가
     'no_next'       - 이 맵 뒤에 미션 있는 맵이 없음(마지막 맵)
     'no_missions'   - 이 맵에 등록된 미션이 없음 / 아직 로드 전
     'transitioning' - 이미 이동 진행 중 */
function requestMapExit3D(){
  if(__msTransitioning) return 'transitioning';
  if(__msMissions === null) return 'no_missions';
  if(!__msMapsWithMissions || !__msMapsWithMissions.has(__msMapId)) return 'no_missions';
  const teacher = !!window.__rtTeacherParticipant;
  if(!teacher && !__msAllRequiredDone3D()) return 'incomplete';
  const next = __msNextMap();
  if(!next) return 'no_next';
  __msTransitioning = true;
  __msGoToMap(next);
  return 'go';
}

/* 3D 맵에서는 발동 좌표(trigger_point)가 있는 미션만 실제로 수행할 수 있다.
   좌표가 없는 미션(구역만 지정했거나 예전 테스트로 남은 미션 등)은 3D에서 마커도 안 생기고
   발동도 되지 않으므로 출구 통과 조건에서 제외한다. 그렇지 않으면 수행 불가능한 미션 하나 때문에
   나머지를 다 완료해도 문이 영구히 막힌다. (2D 맵의 __msAllRequiredDone과 의도적으로 분리) */
function __msAllRequiredDone3D(){
  return __msMissions.every(m => !m.required || !m.trigger_point || __msDone.has(m.id));
}

function checkZoneOnMove(pos){
  if(__msMissions === null) return; // 미션 로드 전에는 판정하지 않음
  __msCheckExit(pos);
  if(window.__rtTeacherParticipant) return; // 교사 참가자는 미션 발동 없음

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
  if(window.__rtTeacherParticipant) return false;    // 교사 참가자는 출구 차단 없음
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
  if(!__msMissions.length || (!__msAllRequiredDone() && !window.__rtTeacherParticipant)) return;

  const exits = EXIT_ZONES[__msMapId] || [];
  const inExit = exits.some(z => pos.r >= z.r0 && pos.r <= z.r1 && pos.c >= z.c0 && pos.c <= z.c1);
  if(!inExit) return;

  const next = __msNextMap();
  if(!next) return;

  __msTransitioning = true;
  __msGoToMap(next);
}

/* MAP_FILES 경로는 저장소 루트 기준(2D 맵은 루트, 3D 맵은 ssamverse3d/ 하위).
   현재 페이지가 ssamverse3d/ 하위(3D 맵)면 루트로 한 단계 올라가야 경로가 맞는다.
   예: 3D 교실(.../ssamverse3d/classroom3d.html) → 2D 도서관은 '../ssambus_map_library.html' */
function __msRepoBase(){
  return /\/ssamverse3d\//.test(window.location.pathname) ? '../' : './';
}

function __msGoToMap(mapId){
  const file = MAP_FILES[mapId];
  if(!file){ __msTransitioning = false; return; }
  const url = new URL(__msRepoBase() + file, window.location.href);
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

/* ===================== 토의토론 답변 저장 ===================== */
async function __msSaveDiscussionAnswer(missionId, answer){
  const client = __msGetClient();
  if(!client) return;
  const nickname = __msParam('nickname', null)
    || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ssambus_nickname'))
    || '익명';
  try{
    await client.from('mission_answers').insert({
      room_id: __msRoomId,
      mission_id: missionId,
      nickname: nickname,
      answer: answer
    });
  }catch(e){
    console.warn('토의 답변 저장 실패:', e);
  }
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
    ? '이 맵의 모든 미션을 완료했어요!<br>출입구(문/게이지)를 찾아 다음 장소로 이동해보세요.'
    : '모든 미션을 완료했어요!<br>오늘 활동 수고 많았어요 👏';

  const reflectionHtml = !hasNext ? `
    <div style="margin:4px 0 10px;text-align:left">
      <label style="font-size:13px;font-weight:600;color:#4a3728">✏️ 오늘 수업 소감을 남겨보세요 <span style="font-weight:400;color:#aaa">(선택)</span></label>
      <textarea id="ms-reflection-input" placeholder="오늘 배운 것, 느낀 점을 자유롭게 써보세요"
        style="display:block;width:100%;min-height:76px;margin-top:6px;padding:8px 10px;
        border:1.5px solid #d9c19a;border-radius:8px;font-size:13px;font-family:inherit;
        resize:vertical;box-sizing:border-box;background:#fffdf6;color:#333;line-height:1.5"></textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button id="ms-celebrate-skip" style="padding:9px 16px;border:1px solid #ccc;border-radius:8px;
        background:#fff;color:#888;font-size:13px;font-weight:500;cursor:pointer">건너뛰기</button>
      <button id="ms-celebrate-close">제출하고 닫기</button>
    </div>
  ` : `<button id="ms-celebrate-close">확인</button>`;

  const bg = document.createElement('div');
  bg.id = 'ms-celebrate-bg';
  bg.innerHTML = `
    <div id="ms-celebrate">
      <div class="ms-emoji">🎉</div>
      <h3>미션 완료!</h3>
      <p>${message}</p>
      ${reflectionHtml}
    </div>
  `;
  document.body.appendChild(bg);

  if(!hasNext){
    bg.querySelector('#ms-celebrate-close').addEventListener('click', () => {
      const text = (bg.querySelector('#ms-reflection-input')?.value || '').trim();
      if(text) __msSaveReflection(text);
      bg.remove();
    });
    bg.querySelector('#ms-celebrate-skip').addEventListener('click', () => bg.remove());
  } else {
    bg.querySelector('#ms-celebrate-close').addEventListener('click', () => bg.remove());
  }
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
    #ms-card{position:relative;background:#fffaf0;border:4px solid #4a3728;border-radius:10px;max-width:420px;
      width:100%;max-height:90vh;overflow:auto;padding:18px;font-family:sans-serif;
      box-shadow:0 6px 20px rgba(0,0,0,.3)}
    #ms-card h3{margin:0 0 10px;color:#4a3728;font-size:17px;padding-right:28px}
    #ms-close-btn{position:absolute;top:10px;right:10px;background:none;border:none;
      font-size:18px;line-height:1;cursor:pointer;color:#aaa;padding:2px 6px;border-radius:4px}
    #ms-close-btn:hover{background:#ecdcc0;color:#4a3728}
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
      max-width:440px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.3);animation:ms-pop .35s ease}
    #ms-celebrate .ms-emoji{font-size:54px;display:inline-block;animation:ms-bounce 1s ease infinite}
    #ms-celebrate h3{margin:10px 0 6px;color:#2c3e50;font-size:18px}
    #ms-celebrate p{margin:0 0 14px;font-size:13.5px;color:#666;line-height:1.6}
    #ms-celebrate button#ms-celebrate-close{padding:10px 22px;border:none;border-radius:8px;background:#2c3e50;
      color:#fff;font-size:14px;font-weight:600;cursor:pointer}
    #ms-celebrate button#ms-celebrate-close:hover{background:#1a252f}
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

function __msFormatElapsed(){
  if(!__msEntryTime) return '';
  const s = Math.floor((Date.now() - __msEntryTime) / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  if(m >= 60){
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
    return ` | ⏱ ${h}:${mm}:${ss}`;
  }
  return ` | ⏱ ${m}:${ss}`;
}

function __msUpdateProgress(){
  const bar = document.getElementById('ms-progress');
  if(!bar || !__msMissions) return;
  const total = __msMissions.length;
  const done = __msMissions.filter(m => __msDone.has(m.id)).length;
  bar.textContent = `🎯 미션 진행률 ${done} / ${total}${__msFormatElapsed()}`;
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
    const hasAnswer = !!(q.model_answer && q.model_answer.trim());
    body = `<div class="ms-body">${__msEscHtml(q.question || '')}</div>
      <textarea id="ms-sa-input" placeholder="답을 입력하세요"
        style="width:100%;min-height:80px;padding:8px 10px;border:1px solid #ccc;border-radius:6px;
          font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box;margin-bottom:4px"></textarea>
      ${hasAnswer ? `<button id="ms-sa-check" type="button" style="margin-bottom:6px;padding:6px 14px;border:1px solid #2980b9;background:#eaf3fc;color:#2980b9;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer">정답 확인</button>` : ''}
      <div class="ms-feedback" id="ms-feedback" style="display:none"></div>`;
    completeDisabled = hasAnswer ? 'disabled' : '';
  } else if(m.type === 'discussion'){
    const q = m.quiz || {};
    const guides = (q.guides || []).filter(Boolean)
      .map(g => `<li>${__msEscHtml(g)}</li>`).join('');
    body = `<div class="ms-body"><strong>📢 토론 주제</strong><br>${__msEscHtml(q.topic || '')}</div>
      ${guides ? `<div class="ms-body"><strong>생각해볼 질문</strong><ul style="margin:4px 0;padding-left:20px">${guides}</ul></div>` : ''}
      <div class="ms-body" style="background:#e8f4fd;border-radius:6px;padding:8px 10px;font-size:13px;color:#1a6fa0">
        💬 X 버튼으로 나가서 팀원들과 채팅으로 토의해보세요!<br>결론이 정해지면 다시 미션으로 돌아와 아래에 작성하세요.
      </div>
      <div class="ms-body">
        <label style="font-size:13px;font-weight:600;margin-bottom:6px;display:block">📝 우리 모둠의 결론 (필수, 10자 이상)</label>
        <textarea id="ms-disc-answer" placeholder="팀원들과 토의한 결론을 작성해주세요."
          style="width:100%;min-height:80px;padding:8px 10px;border:1px solid #ccc;border-radius:6px;
            font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box"></textarea>
        <div class="ms-feedback" id="ms-feedback" style="display:none"></div>
      </div>`;
    completeDisabled = 'disabled';
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
    if(!m.content){
      body = `<div class="ms-body" style="text-align:center;padding:24px 12px">
        <div style="font-size:44px;margin-bottom:12px">📋</div>
        <div style="font-size:14px;line-height:1.8;color:#555">
          <strong>쌤버스 체험 설문지</strong><br>
          실제 수업에서는 선생님께서 설문지를 연결합니다.<br>
          <span style="color:#27ae60;font-weight:600">완료 버튼을 눌러 다음 미션으로 진행하세요!</span>
        </div>
      </div>`;
    } else {
      const src = __msFormEmbedUrl(m.content);
      body = `<iframe height="320" src="${src}"></iframe>
        <a class="ms-link-btn" href="${m.content}" target="_blank" rel="noopener">새 창에서 열기</a>`;
    }
  } else if(m.type === 'link'){
    body = `<div class="ms-body">아래 버튼을 눌러 활동 페이지로 이동한 뒤, 완료를 눌러주세요.</div>
      <a class="ms-link-btn" href="${m.content}" target="_blank" rel="noopener">열기</a>`;
  }

  const skipBtn = m.required ? '' : `<button id="ms-skip">나중에</button>`;

  return `
    <button id="ms-close-btn" onclick="__msDismissOverlay()" title="닫기">✕</button>
    <h3>${icon} ${__msEscHtml(m.title)}</h3>
    ${body}
    <div id="ms-actions">
      ${skipBtn}
      <button id="ms-complete" class="primary" ${completeDisabled}>완료</button>
    </div>
  `;
}

function __msDismissOverlay(){
  const overlay = document.getElementById('ms-overlay');
  if(overlay) overlay.classList.add('hidden');
  __msQueue = [];
  // __msCurrentZone 유지: 닫은 직후 같은 구역 내 이동 시 즉시 재발동 방지
  // 구역을 완전히 벗어났다가 재진입하면 자연스럽게 다시 발동됨
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
    const checkBtn = card.querySelector('#ms-sa-check');
    const completeBtn = card.querySelector('#ms-complete');
    const fb = card.querySelector('#ms-feedback');
    const hasAnswer = !!(q.model_answer && q.model_answer.trim());

    if(hasAnswer){
      // 예시 답안이 있으면 실제로 채점: 정답 확인을 눌러 맞아야 완료 버튼이 활성화됨
      if(input) input.addEventListener('input', () => {
        if(completeBtn) completeBtn.disabled = true;
        if(fb) fb.style.display = 'none';
      });
      if(checkBtn) checkBtn.addEventListener('click', () => {
        const val = input ? input.value.trim() : '';
        if(!val) return;
        const correct = __msNormalizeAnswer(val) === __msNormalizeAnswer(q.model_answer);
        if(fb){
          fb.style.display = 'block';
          fb.textContent = correct ? '정답입니다! 완료를 눌러주세요.' : '다시 한 번 생각해볼까요?';
          fb.className = correct ? 'ms-feedback ok' : 'ms-feedback bad';
        }
        if(completeBtn) completeBtn.disabled = !correct;
      });
    } else {
      // 예시 답안이 없으면 채점 없이 입력만 하면 완료 (기존 방식 유지)
      if(input) input.addEventListener('input', () => {
        if(completeBtn) completeBtn.disabled = !input.value.trim();
      });
    }

    if(completeBtn) completeBtn.addEventListener('click', () => {
      const answer = input ? input.value.trim() : '';
      if(!answer) return;
      __msComplete(m.id, answer);
    });
    customComplete = true;

  } else if(m.type === 'discussion'){
    const textarea = card.querySelector('#ms-disc-answer');
    const completeBtn = card.querySelector('#ms-complete');
    const fb = card.querySelector('#ms-feedback');
    const MIN_LEN = 10;

    if(textarea) textarea.addEventListener('input', () => {
      if(completeBtn) completeBtn.disabled = textarea.value.trim().length < MIN_LEN;
    });

    if(completeBtn) completeBtn.addEventListener('click', () => {
      const answer = textarea ? textarea.value.trim() : '';
      if(answer.length < MIN_LEN) return;
      if(textarea) textarea.disabled = true;
      if(fb){
        fb.textContent = '✅ 제출 완료!';
        fb.style.display = 'block';
        fb.className = 'ms-feedback ok';
      }
      completeBtn.textContent = '닫기';
      __msSaveDiscussionAnswer(m.id, answer);
      const newBtn = completeBtn.cloneNode(true);
      completeBtn.replaceWith(newBtn);
      newBtn.addEventListener('click', () => __msComplete(m.id, answer));
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
  // 교사 진행현황 패널에 즉시 반영되도록 presence 상태 재전송
  if(typeof __rtChannel !== 'undefined' && __rtChannel && typeof __rtMyState === 'function'){
    try{ __rtChannel.track(__rtMyState()); }catch(e){ /* 무시 */ }
  }
  const mission = __msMissions.find(m => m.id === id);
  if(mission) __msRecordProgress(mission, answer);
  __msQueue.shift();
  __msShowNext();
  if(!__msQueue.length) checkZoneOnMove(pos); // 마지막 미션 완료 시 출입구 위치라면 즉시 이동 판정

  __msCheckAnimeUnlock();

  if(__msMissions.length && __msAllRequiredDone() && !__msAllDoneShown){
    __msAllDoneShown = true;
    if(__msTimerInterval){ clearInterval(__msTimerInterval); __msTimerInterval = null; }
    __msSaveCompletionTime();
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

/* 기기 간 이어풀기: room_id + student_id 기준으로 서버에 기록된 완료 미션을 불러와
   localStorage 기반 __msDone에 병합한다. (다른 기기에서도 같은 닉네임이면 이어서 진행) */
async function __msLoadDoneFromServer(){
  const client = __msGetClient();
  if(!client) return;
  try{
    const { data, error } = await client
      .from('mission_progress')
      .select('mission_id')
      .eq('room_id', __msRoomId)
      .eq('student_id', __msStudentId);
    if(error || !data) return;
    data.forEach(row => {
      const mid = row.mission_id;
      if(!mid.startsWith('__completion_') && mid !== '__total__' && mid !== '__reflection__'){
        __msDone.add(mid);
      }
    });
    try{ localStorage.setItem(__msStorageKey(), JSON.stringify(Array.from(__msDone))); }
    catch(e){ /* 저장 실패 시 진행은 계속 가능 */ }
  }catch(e){
    console.warn('[쌤버스] 진행도 서버 조회 실패', e);
  }
}

/* 전체 필수 미션 완료 시 소요 시간 기록 (맵별 + 세션 누적) */
async function __msSaveCompletionTime(){
  if(!__msEntryTime) return;
  const client = __msGetClient();
  if(!client) return;
  const now = Date.now();
  const elapsed_ms = now - __msEntryTime;
  const nickname = __msParam('nickname', null)
    || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ssambus_nickname'))
    || '익명';

  // 세션 전체 시작 시간 (첫 번째 맵 입장 시각)
  let sessionStart = __msEntryTime;
  try{
    const _sk = 'ssambus_session_start_' + __msRoomId + '_' + __msStudentId;
    const saved = sessionStorage.getItem(_sk);
    if(saved) sessionStart = Number(saved);
  }catch(e){ /* 무시 */ }
  const total_elapsed_ms = now - sessionStart;

  try{
    await Promise.all([
      // 맵별 소요 시간
      client.from('mission_progress').upsert({
        room_id: __msRoomId,
        student_id: __msStudentId,
        nickname: nickname,
        map_id: __msMapId,
        mission_id: '__completion_' + __msMapId,
        mission_title: '완료 시간 (' + __msMapId + ')',
        required: false,
        completed_at: new Date(now).toISOString(),
        student_answer: String(elapsed_ms)
      }, { onConflict: 'room_id,student_id,mission_id' }),
      // 세션 전체 누적 시간 (맵 이동마다 갱신)
      client.from('mission_progress').upsert({
        room_id: __msRoomId,
        student_id: __msStudentId,
        nickname: nickname,
        map_id: __msMapId,
        mission_id: '__total__',
        mission_title: '전체 합산 완료 시간',
        required: false,
        completed_at: new Date(now).toISOString(),
        student_answer: String(total_elapsed_ms)
      }, { onConflict: 'room_id,student_id,mission_id' })
    ]);
  }catch(e){
    console.warn('[쌤버스] 완료 시간 기록 실패', e);
  }
}

async function __msSaveReflection(text){
  const client = __msGetClient();
  if(!client) return;
  const nickname = __msParam('nickname', null)
    || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ssambus_nickname'))
    || '익명';
  try{
    await client.from('mission_progress').upsert({
      room_id:        __msRoomId,
      student_id:     __msStudentId,
      nickname:       nickname,
      map_id:         __msMapId,
      mission_id:     '__reflection__',
      mission_title:  '소감',
      required:       false,
      completed_at:   new Date().toISOString(),
      student_answer: text
    }, { onConflict: 'room_id,student_id,mission_id' });
  }catch(e){
    console.warn('[쌤버스] 소감 저장 실패', e);
  }
}

/* ===================== 초기화 ===================== */
async function initMissionSystem(mapId){
  __msMapId = mapId;
  __msRoomId = __msParam('room', 'demo');

  const __msNickname = __msParam('nickname', null)
    || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ssambus_nickname'));
  if(__msNickname){
    __msStudentId = __msDeriveStudentId(__msNickname);
  } else {
    // 닉네임 없이 접속한 경우(구버전 링크 등) 기기별 임의 ID로 폴백
    __msStudentId = localStorage.getItem('ssambus_student_id');
    if(!__msStudentId){
      __msStudentId = 'stu_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('ssambus_student_id', __msStudentId);
    }
  }

  try{
    __msDone = new Set(JSON.parse(localStorage.getItem(__msStorageKey()) || '[]'));
  }catch(e){
    __msDone = new Set();
  }
  await __msLoadDoneFromServer(); // 기기 간 이어풀기: 서버 기록을 병합

  try{
    __msAllDoneShown = localStorage.getItem(__msAllDoneKey()) === '1';
  }catch(e){
    __msAllDoneShown = false;
  }

  __msBuildUI();
  __msEntryTime = Date.now();
  // 세션 전체 시작 시간 - 첫 번째 맵 입장 시각만 기록, 이후 맵 이동 시 유지
  try{
    const _sk = 'ssambus_session_start_' + __msRoomId + '_' + __msStudentId;
    if(!sessionStorage.getItem(_sk)) sessionStorage.setItem(_sk, String(__msEntryTime));
  }catch(e){ /* 무시 */ }
  if(__msTimerInterval) clearInterval(__msTimerInterval);
  __msTimerInterval = setInterval(__msUpdateProgress, 1000);
  __msMissions = await __msLoadMissions(mapId);
  __msMapOrder = await __msLoadMapOrder();
  __msMapsWithMissions = await __msLoadMapsWithMissions();
  await __msLoadCharUnlockThreshold();
  __msCheckAnimeUnlock(); // 이미 충분한 미션을 완료한 상태라면 즉시 해금
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
    case 38: __msCT38(ctx,x,y,ts); break; // 소파
    case 39: __msCT39(ctx,x,y,ts); break; // TV
    case 40: __msCT40(ctx,x,y,ts); break; // 사물함
    case 41: __msCT41(ctx,x,y,ts); break; // 게시판
    case 42: __msCT42(ctx,x,y,ts); break; // 선풍기
    case 43: __msCT43(ctx,x,y,ts); break; // 독서램프
    case 44: __msCT44(ctx,x,y,ts); break; // 복사기
    case 45: __msCT45(ctx,x,y,ts); break; // 잡지꽂이
    case 46: __msCT46(ctx,x,y,ts); break; // 수조
    case 47: __msCT47(ctx,x,y,ts); break; // 방석
    case 48: __msCT48(ctx,x,y,ts); break; // 미끄럼틀
    case 49: __msCT49(ctx,x,y,ts); break; // 그네
    case 50: __msCT50(ctx,x,y,ts); break; // 모래놀이
    case 51: __msCT51(ctx,x,y,ts); break; // 음수대
    case 52: __msCT52(ctx,x,y,ts); break; // 철봉
    case 53: __msCT53(ctx,x,y,ts); break; // 탁구대
    case 54: __msCT54(ctx,x,y,ts); break; // 훌라후프
    case 55: __msCT55(ctx,x,y,ts); break; // 체중계
    case 56: __msCT56(ctx,x,y,ts); break; // 거울
    case 57: __msCT57(ctx,x,y,ts); break; // 배드민턴네트
    case 58: __msCT58(ctx,x,y,ts); break; // 버스정류장
    case 59: __msCT59(ctx,x,y,ts); break; // 자전거거치대
    case 60: __msCT60(ctx,x,y,ts); break; // 가로등
    case 61: __msCT61(ctx,x,y,ts); break; // 자판기
    case 62: __msCT62(ctx,x,y,ts); break; // 분수대
    case 63: __msCT63(ctx,x,y,ts); break; // 텐트
    case 64: __msCT64(ctx,x,y,ts); break; // 모닥불
    case 65: __msCT65(ctx,x,y,ts); break; // 새집
    case 66: __msCT66(ctx,x,y,ts); break; // 덤불
    case 67: __msCT67(ctx,x,y,ts); break; // 통나무
    case 68: __msCT68(ctx,x,y,ts); break; // 피아노
    case 69: __msCT69(ctx,x,y,ts); break; // 악보대
    case 70: __msCT70(ctx,x,y,ts); break; // 드럼
    case 71: __msCT71(ctx,x,y,ts); break; // 기타
    case 72: __msCT72(ctx,x,y,ts); break; // 신시사이저
    case 73: __msCT73(ctx,x,y,ts); break; // 이젤
    case 74: __msCT74(ctx,x,y,ts); break; // 조각대
    case 75: __msCT75(ctx,x,y,ts); break; // 물감팔레트
    case 76: __msCT76(ctx,x,y,ts); break; // 전시대
    case 77: __msCT77(ctx,x,y,ts); break; // 작업테이블
    case 78: __msCT78(ctx,x,y,ts); break; // PC
    case 79: __msCT79(ctx,x,y,ts); break; // 노트북
    case 80: __msCT80(ctx,x,y,ts); break; // 서버랙
    case 81: __msCT81(ctx,x,y,ts); break; // 프린터
    case 82: __msCT82(ctx,x,y,ts); break; // 공유기
    case 83: __msCT83(ctx,x,y,ts); break; // 실험대
    case 84: __msCT84(ctx,x,y,ts); break; // 비커세트
    case 85: __msCT85(ctx,x,y,ts); break; // 현미경
    case 86: __msCT86(ctx,x,y,ts); break; // 시약장
    case 87: __msCT87(ctx,x,y,ts); break; // 천체망원경
    case 88: __msCT88(ctx,x,y,ts); break; // 식판테이블
    case 89: __msCT89(ctx,x,y,ts); break; // 배식대
    case 90: __msCT90(ctx,x,y,ts); break; // 가스레인지
    case 91: __msCT91(ctx,x,y,ts); break; // 냉장고
    case 92: __msCT92(ctx,x,y,ts); break; // 식기선반
    case 93: __msCT93(ctx,x,y,ts); break; // 침대
    case 94: __msCT94(ctx,x,y,ts); break; // 세면대
    case 95: __msCT95(ctx,x,y,ts); break; // 혈압측정기
    case 96: __msCT96(ctx,x,y,ts); break; // 커튼칸막이
    case 97: __msCT97(ctx,x,y,ts); break; // 구급함
    case 98: // 장애물 (미로/경주 트랙 맵 에디터 배치)
      ctx.fillStyle='#c0392b';ctx.fillRect(x+2,y+2,ts-4,ts-4);
      ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(2,Math.round(ts*0.08));ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(x+6,y+6);ctx.lineTo(x+ts-6,y+ts-6);
      ctx.moveTo(x+ts-6,y+6);ctx.lineTo(x+6,y+ts-6);ctx.stroke();
      break;
  }
}
/* 68-97: 음악실·미술실·컴퓨터실·과학실·급식실·보건실 가구 */
function __msCT68(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#1a1a1a';ctx.fillRect(x+r(.06),y+r(.04),r(.88),r(.88));ctx.fillStyle='#333';ctx.fillRect(x+r(.06),y+r(.04),r(.09),r(.88));ctx.fillRect(x+r(.85),y+r(.04),r(.09),r(.88));ctx.fillStyle='#f0f0f0';ctx.fillRect(x+r(.1),y+r(.72),r(.8),r(.16));ctx.fillStyle='#111';for(var i=0;i<5;i++)ctx.fillRect(x+r(.14)+i*r(.14),y+r(.72),r(.08),r(.1));ctx.fillStyle='#fff';ctx.fillRect(x+r(.18),y+r(.16),r(.64),r(.26));ctx.fillStyle='#aaa';for(var i=0;i<5;i++)ctx.fillRect(x+r(.2),y+r(.2)+i*r(.04),r(.6),r(.01));}
function __msCT69(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#888';ctx.fillRect(x+r(.45),y+r(.52),r(.1),r(.4));ctx.fillRect(x+r(.18),y+r(.88),r(.64),r(.06));ctx.fillStyle='#bbb';ctx.fillRect(x+r(.1),y+r(.5),r(.8),r(.06));ctx.fillStyle='#ddd';ctx.fillRect(x+r(.1),y+r(.18),r(.8),r(.34));ctx.fillStyle='#333';for(var i=0;i<5;i++)ctx.fillRect(x+r(.13),y+r(.22)+i*r(.05),r(.74),r(.01));}
function __msCT70(ctx,x,y,ts){const r=v=>Math.round(ts*v);const cx=x+r(.5),cy=y+r(.6);ctx.fillStyle='#a0291a';ctx.beginPath();ctx.ellipse(cx,cy,r(.26),r(.18),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.ellipse(cx,cy,r(.2),r(.13),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c8a06e';ctx.beginPath();ctx.ellipse(x+r(.28),cy-r(.14),r(.14),r(.09),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c8b820';ctx.beginPath();ctx.ellipse(x+r(.76),y+r(.28),r(.18),r(.05),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3498db';ctx.beginPath();ctx.ellipse(cx,y+r(.32),r(.14),r(.09),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c8a060';ctx.fillRect(cx-r(.02),y+r(.16),r(.06),r(.26));}
function __msCT71(ctx,x,y,ts){const r=v=>Math.round(ts*v);const cx=x+r(.5);ctx.fillStyle='#8B4010';ctx.beginPath();ctx.ellipse(cx,y+r(.72),r(.22),r(.2),0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(cx,y+r(.48),r(.15),r(.15),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6a300a';ctx.beginPath();ctx.arc(cx,y+r(.6),r(.08),0,Math.PI*2);ctx.fill();ctx.fillStyle='#c8a060';ctx.fillRect(cx-r(.04),y+r(.04),r(.08),r(.46));ctx.fillStyle='#a07040';ctx.fillRect(cx-r(.08),y+r(.02),r(.16),r(.07));ctx.fillStyle='rgba(200,200,200,.7)';for(var i=0;i<3;i++)ctx.fillRect(cx-r(.02)+i*r(.02),y+r(.04),r(.01),r(.88));}
function __msCT72(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#222';ctx.fillRect(x+r(.04),y+r(.28),r(.92),r(.64));ctx.fillStyle='#00aa44';ctx.fillRect(x+r(.08),y+r(.32),r(.28),r(.2));ctx.fillStyle='#e74c3c';ctx.fillRect(x+r(.4),y+r(.34),r(.06),r(.06));ctx.fillStyle='#3498db';ctx.fillRect(x+r(.48),y+r(.34),r(.06),r(.06));ctx.fillStyle='#f1c40f';ctx.fillRect(x+r(.56),y+r(.34),r(.06),r(.06));ctx.fillStyle='#f0f0f0';ctx.fillRect(x+r(.08),y+r(.58),r(.84),r(.22));ctx.fillStyle='#333';for(var i=0;i<7;i++)ctx.fillRect(x+r(.1)+i*r(.1),y+r(.58),r(.055),r(.14));ctx.fillStyle='#555';ctx.fillRect(x+r(.1),y+r(.88),r(.08),r(.1));ctx.fillRect(x+r(.82),y+r(.88),r(.08),r(.1));}
function __msCT73(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#d4a06e';ctx.fillRect(x+r(.14),y+r(.06),r(.72),r(.56));ctx.fillStyle='#87ceeb';ctx.fillRect(x+r(.18),y+r(.1),r(.64),r(.2));ctx.fillStyle='#228b22';ctx.fillRect(x+r(.18),y+r(.3),r(.64),r(.28));ctx.fillStyle='#c0392b';ctx.fillRect(x+r(.3),y+r(.22),r(.16),r(.18));ctx.fillStyle='#8B6914';ctx.fillRect(x+r(.28),y+r(.6),r(.06),r(.38));ctx.fillRect(x+r(.66),y+r(.6),r(.06),r(.38));ctx.fillRect(x+r(.16),y+r(.88),r(.18),r(.06));ctx.fillRect(x+r(.66),y+r(.88),r(.18),r(.06));ctx.fillRect(x+r(.28),y+r(.72),r(.44),r(.04));}
function __msCT74(ctx,x,y,ts){const r=v=>Math.round(ts*v);const cx=x+r(.5);ctx.fillStyle='#888';ctx.fillRect(x+r(.3),y+r(.7),r(.4),r(.24));ctx.fillStyle='#aaa';ctx.fillRect(x+r(.38),y+r(.32),r(.24),r(.4));ctx.fillStyle='#c8a06e';ctx.beginPath();ctx.ellipse(cx,y+r(.27),r(.22),r(.18),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#deb887';ctx.beginPath();ctx.ellipse(cx-r(.06),y+r(.22),r(.12),r(.1),0,0,Math.PI*2);ctx.fill();}
function __msCT75(ctx,x,y,ts){const r=v=>Math.round(ts*v);const cx=x+r(.5),cy=y+r(.55);ctx.fillStyle='#d4a06e';ctx.beginPath();ctx.ellipse(cx,cy,r(.44),r(.34),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c0602a';ctx.beginPath();ctx.arc(x+r(.22),cy-r(.04),r(.1),0,Math.PI*2);ctx.fill();const pc=['#e74c3c','#3498db','#f1c40f','#2ecc71','#e67e22','#9b59b6'],bp=[[.42,.28],[.64,.28],[.78,.42],[.78,.64],[.64,.76],[.42,.76]];for(var i=0;i<6;i++){ctx.fillStyle=pc[i];ctx.beginPath();ctx.arc(x+r(bp[i][0]),y+r(bp[i][1]),r(.06),0,Math.PI*2);ctx.fill();}ctx.fillStyle='#8B6914';ctx.fillRect(x+r(.08),y+r(.08),r(.06),r(.38));ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.moveTo(x+r(.08),y+r(.44));ctx.lineTo(x+r(.14),y+r(.44));ctx.lineTo(x+r(.11),y+r(.5));ctx.closePath();ctx.fill();}
function __msCT76(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#2c3e50';ctx.fillRect(x+r(.06),y+r(.04),r(.88),r(.72));ctx.fillStyle='#f5f5f5';ctx.fillRect(x+r(.1),y+r(.08),r(.8),r(.64));ctx.fillStyle='#87ceeb';ctx.fillRect(x+r(.12),y+r(.1),r(.76),r(.28));ctx.fillStyle='#228b22';ctx.fillRect(x+r(.12),y+r(.38),r(.76),r(.28));ctx.fillStyle='#e74c3c';ctx.fillRect(x+r(.3),y+r(.28),r(.22),r(.2));ctx.fillStyle='#555';ctx.fillRect(x+r(.42),y+r(.74),r(.16),r(.14));ctx.fillRect(x+r(.3),y+r(.86),r(.4),r(.06));}
function __msCT77(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#5a3010';ctx.fillRect(x+r(.04),y+r(.14),r(.92),r(.48));ctx.fillStyle='#c8a06e';ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.4));ctx.fillStyle='#dfc09a';ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.06));ctx.fillStyle='#e74c3c';ctx.fillRect(x+r(.1),y+r(.22),r(.12),r(.14));ctx.fillStyle='#f1c40f';ctx.fillRect(x+r(.26),y+r(.25),r(.03),r(.1));ctx.fillStyle='#3498db';ctx.fillRect(x+r(.5),y+r(.22),r(.12),r(.14));ctx.fillStyle='#4a2508';ctx.fillRect(x+r(.08),y+r(.58),r(.08),r(.34));ctx.fillRect(x+r(.84),y+r(.58),r(.08),r(.34));ctx.fillRect(x+r(.3),y+r(.58),r(.06),r(.3));ctx.fillRect(x+r(.64),y+r(.58),r(.06),r(.3));}
function __msCT78(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#333';ctx.fillRect(x+r(.08),y+r(.04),r(.64),r(.5));ctx.fillStyle='#2040aa';ctx.fillRect(x+r(.11),y+r(.07),r(.58),r(.44));ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(x+r(.13),y+r(.09),r(.18),r(.1));ctx.fillStyle='#555';ctx.fillRect(x+r(.34),y+r(.52),r(.14),r(.08));ctx.fillRect(x+r(.26),y+r(.58),r(.3),r(.04));ctx.fillStyle='#4a4a4a';ctx.fillRect(x+r(.78),y+r(.14),r(.16),r(.7));ctx.fillStyle='#00ff88';ctx.beginPath();ctx.arc(x+r(.84),y+r(.72),r(.03),0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a3a3a';ctx.fillRect(x+r(.06),y+r(.64),r(.6),r(.16));ctx.fillStyle='#555';for(var i=0;i<9;i++)ctx.fillRect(x+r(.08)+i*r(.06),y+r(.66),r(.045),r(.05));}
function __msCT79(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.moveTo(x+r(.08),y+r(.08));ctx.lineTo(x+r(.92),y+r(.08));ctx.lineTo(x+r(.82),y+r(.5));ctx.lineTo(x+r(.18),y+r(.5));ctx.closePath();ctx.fill();ctx.fillStyle='#1a90c0';ctx.beginPath();ctx.moveTo(x+r(.1),y+r(.1));ctx.lineTo(x+r(.9),y+r(.1));ctx.lineTo(x+r(.81),y+r(.47));ctx.lineTo(x+r(.19),y+r(.47));ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(x+r(.12),y+r(.12),r(.2),r(.1));ctx.fillStyle='#3a3a3a';ctx.fillRect(x+r(.06),y+r(.5),r(.88),r(.36));ctx.fillStyle='#555';for(var i=0;i<9;i++)ctx.fillRect(x+r(.1)+i*r(.085),y+r(.54),r(.07),r(.07));ctx.fillStyle='#444';ctx.fillRect(x+r(.28),y+r(.72),r(.44),r(.1));}
function __msCT80(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#1a1a1a';ctx.fillRect(x+r(.1),y+r(.04),r(.8),r(.92));ctx.fillStyle='#2a2a2a';ctx.fillRect(x+r(.13),y+r(.07),r(.74),r(.86));for(var i=0;i<7;i++){ctx.fillStyle=i%2===0?'#333':'#3a3a3a';ctx.fillRect(x+r(.14),y+r(.09)+i*r(.12),r(.72),r(.1));ctx.fillStyle='#00ff44';ctx.fillRect(x+r(.16),y+r(.12)+i*r(.12),r(.04),r(.04));ctx.fillStyle='#ff8800';ctx.fillRect(x+r(.22),y+r(.12)+i*r(.12),r(.04),r(.04));ctx.fillStyle='#444';for(var j=0;j<4;j++)ctx.fillRect(x+r(.3)+j*r(.1),y+r(.1)+i*r(.12),r(.08),r(.08));}}
function __msCT81(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#c8c8c8';ctx.fillRect(x+r(.08),y+r(.24),r(.84),r(.6));ctx.fillStyle='#b8b8b8';ctx.fillRect(x+r(.08),y+r(.2),r(.84),r(.08));ctx.fillStyle='#f0f0f0';ctx.fillRect(x+r(.1),y+r(.12),r(.8),r(.1));ctx.fillStyle='#fff';ctx.fillRect(x+r(.16),y+r(.06),r(.68),r(.08));ctx.fillStyle='#a0a0a0';ctx.fillRect(x+r(.7),y+r(.3),r(.18),r(.18));ctx.fillStyle='#2ecc71';ctx.fillRect(x+r(.74),y+r(.34),r(.06),r(.06));ctx.fillStyle='#e74c3c';ctx.fillRect(x+r(.74),y+r(.42),r(.06),r(.06));ctx.fillStyle='#e0e0e0';ctx.fillRect(x+r(.14),y+r(.3),r(.48),r(.1));}
function __msCT82(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#f0f0f0';ctx.fillRect(x+r(.06),y+r(.4),r(.88),r(.28));ctx.fillStyle='#e0e0e0';ctx.fillRect(x+r(.06),y+r(.38),r(.88),r(.04));ctx.fillStyle='#888';ctx.fillRect(x+r(.2),y+r(.12),r(.04),r(.28));ctx.fillRect(x+r(.76),y+r(.12),r(.04),r(.28));ctx.fillStyle='#00ff44';for(var i=0;i<5;i++)ctx.fillRect(x+r(.12)+i*r(.16),y+r(.44),r(.07),r(.04));ctx.fillStyle='#aaa';for(var i=0;i<5;i++)ctx.fillRect(x+r(.12)+i*r(.14),y+r(.6),r(.08),r(.05));ctx.fillStyle='#ccc';ctx.fillRect(x+r(.28),y+r(.46),r(.44),r(.06));}
function __msCT83(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#2c3333';ctx.fillRect(x+r(.04),y+r(.14),r(.92),r(.48));ctx.fillStyle='#333d3d';ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.4));ctx.fillStyle='#888';ctx.fillRect(x+r(.1),y+r(.22),r(.04),r(.12));ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(x+r(.12),y+r(.22),r(.04),0,Math.PI*2);ctx.fill();ctx.fillStyle='#aaa';ctx.fillRect(x+r(.7),y+r(.22),r(.18),r(.12));ctx.fillStyle='#ccc';ctx.fillRect(x+r(.72),y+r(.24),r(.14),r(.08));ctx.fillStyle='rgba(200,230,255,.7)';ctx.fillRect(x+r(.24),y+r(.2),r(.07),r(.12));ctx.fillStyle='rgba(255,200,200,.7)';ctx.fillRect(x+r(.36),y+r(.22),r(.07),r(.1));ctx.fillStyle='#1a2222';ctx.fillRect(x+r(.08),y+r(.58),r(.08),r(.38));ctx.fillRect(x+r(.84),y+r(.58),r(.08),r(.38));ctx.fillRect(x+r(.3),y+r(.58),r(.06),r(.34));ctx.fillRect(x+r(.64),y+r(.58),r(.06),r(.34));}
function __msCT84(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='rgba(180,220,255,.8)';ctx.beginPath();ctx.moveTo(x+r(.1),y+r(.82));ctx.lineTo(x+r(.38),y+r(.82));ctx.lineTo(x+r(.46),y+r(.6));ctx.lineTo(x+r(.36),y+r(.24));ctx.lineTo(x+r(.26),y+r(.24));ctx.lineTo(x+r(.16),y+r(.6));ctx.closePath();ctx.fill();ctx.fillStyle='rgba(100,150,220,.5)';ctx.fillRect(x+r(.12),y+r(.64),r(.22),r(.16));ctx.fillStyle='rgba(200,255,200,.8)';ctx.fillRect(x+r(.46),y+r(.24),r(.1),r(.44));ctx.beginPath();ctx.arc(x+r(.51),y+r(.68),r(.05),0,Math.PI,false);ctx.fill();ctx.fillStyle='rgba(255,200,180,.8)';ctx.fillRect(x+r(.62),y+r(.3),r(.26),r(.48));ctx.fillRect(x+r(.58),y+r(.28),r(.34),r(.04));ctx.fillStyle='rgba(220,100,80,.5)';ctx.fillRect(x+r(.64),y+r(.54),r(.22),r(.22));}
function __msCT85(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#2c3e50';ctx.fillRect(x+r(.2),y+r(.82),r(.6),r(.12));ctx.fillRect(x+r(.38),y+r(.62),r(.24),r(.22));ctx.fillRect(x+r(.44),y+r(.2),r(.12),r(.54));ctx.fillRect(x+r(.44),y+r(.2),r(.38),r(.1));ctx.fillStyle='#3a3a3a';ctx.fillRect(x+r(.46),y+r(.08),r(.08),r(.14));ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(x+r(.5),y+r(.08),r(.07),0,Math.PI*2);ctx.fill();ctx.fillStyle='#555';ctx.fillRect(x+r(.6),y+r(.26),r(.06),r(.16));ctx.fillRect(x+r(.68),y+r(.28),r(.06),r(.12));ctx.fillStyle='#888';ctx.fillRect(x+r(.3),y+r(.52),r(.32),r(.08));ctx.fillStyle='rgba(200,230,255,.6)';ctx.fillRect(x+r(.34),y+r(.5),r(.24),r(.04));ctx.fillStyle='#666';ctx.beginPath();ctx.arc(x+r(.4),y+r(.38),r(.06),0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+r(.4),y+r(.5),r(.06),0,Math.PI*2);ctx.fill();}
function __msCT86(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#2c3e50';ctx.fillRect(x+r(.06),y+r(.04),r(.88),r(.92));ctx.fillStyle='rgba(180,210,230,.35)';ctx.fillRect(x+r(.1),y+r(.08),r(.37),r(.84));ctx.fillRect(x+r(.53),y+r(.08),r(.37),r(.84));ctx.fillStyle='#1a252f';ctx.fillRect(x+r(.47),y+r(.08),r(.06),r(.84));ctx.fillStyle='rgba(50,80,100,.5)';ctx.fillRect(x+r(.1),y+r(.32),r(.8),r(.02));ctx.fillRect(x+r(.1),y+r(.56),r(.8),r(.02));ctx.fillRect(x+r(.1),y+r(.78),r(.8),r(.02));const bc=['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e67e22'];for(var row=0;row<3;row++)for(var bt=0;bt<6;bt++){ctx.fillStyle=bc[bt];ctx.fillRect(x+r(.12)+bt*r(.13),y+r(.12)+row*r(.24),r(.07),r(.18));}ctx.fillStyle='#aaa';ctx.fillRect(x+r(.44),y+r(.44),r(.02),r(.08));ctx.fillRect(x+r(.54),y+r(.44),r(.02),r(.08));}
function __msCT87(ctx,x,y,ts){const r=v=>Math.round(ts*v);const cx=x+r(.5),cy=y+r(.58);ctx.fillStyle='#555';ctx.fillRect(cx-r(.04),cy,r(.08),r(.36));ctx.fillRect(x+r(.08),cy+r(.28),r(.36),r(.04));ctx.fillRect(cx+r(.06),cy+r(.28),r(.36),r(.04));ctx.fillRect(x+r(.06),cy,r(.06),r(.3));ctx.fillRect(x+r(.88),cy,r(.06),r(.3));ctx.fillStyle='#666';ctx.beginPath();ctx.arc(cx,cy,r(.07),0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(cx,cy-r(.02));ctx.rotate(-Math.PI*.3);ctx.fillStyle='#2c3e50';ctx.fillRect(-r(.05),-r(.44),r(.1),r(.48));ctx.fillStyle='#3d5060';ctx.fillRect(-r(.05),-r(.44),r(.1),r(.06));ctx.fillStyle='#444';ctx.fillRect(-r(.04),r(.02),r(.08),r(.08));ctx.restore();}
function __msCT88(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#6b4914';ctx.fillRect(x+r(.04),y+r(.18),r(.92),r(.5));ctx.fillStyle='#c8a06e';ctx.fillRect(x+r(.04),y+r(.22),r(.92),r(.42));ctx.fillStyle='#dfc09a';ctx.fillRect(x+r(.04),y+r(.22),r(.92),r(.06));ctx.fillStyle='#b89040';ctx.fillRect(x+r(.1),y+r(.26),r(.24),r(.18));ctx.fillRect(x+r(.38),y+r(.26),r(.24),r(.18));ctx.fillRect(x+r(.66),y+r(.26),r(.24),r(.18));ctx.fillStyle='#e8c860';ctx.fillRect(x+r(.12),y+r(.28),r(.1),r(.08));ctx.fillStyle='#e74c3c';ctx.fillRect(x+r(.22),y+r(.28),r(.1),r(.08));ctx.fillStyle='#4a2508';ctx.fillRect(x+r(.1),y+r(.68),r(.08),r(.28));ctx.fillRect(x+r(.82),y+r(.68),r(.08),r(.28));ctx.fillRect(x+r(.3),y+r(.68),r(.06),r(.24));ctx.fillRect(x+r(.64),y+r(.68),r(.06),r(.24));}
function __msCT89(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#888';ctx.fillRect(x+r(.04),y+r(.26),r(.92),r(.66));ctx.fillStyle='#aaa';ctx.fillRect(x+r(.04),y+r(.2),r(.92),r(.1));const fc=['#e8c860','#e74c3c','#27ae60','#e67e22'];for(var i=0;i<4;i++){ctx.fillStyle='#e8e8e8';ctx.fillRect(x+r(.06)+i*r(.22),y+r(.3),r(.2),r(.2));ctx.fillStyle=fc[i];ctx.fillRect(x+r(.08)+i*r(.22),y+r(.32),r(.16),r(.16));}ctx.fillStyle='rgba(200,220,240,.3)';ctx.fillRect(x+r(.04),y+r(.06),r(.92),r(.16));ctx.fillStyle='#aaa';ctx.fillRect(x+r(.04),y+r(.04),r(.04),r(.18));ctx.fillRect(x+r(.92),y+r(.04),r(.04),r(.18));}
function __msCT90(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#444';ctx.fillRect(x+r(.06),y+r(.22),r(.88),r(.7));ctx.fillStyle='#555';ctx.fillRect(x+r(.06),y+r(.18),r(.88),r(.08));for(var bi=0;bi<4;bi++){var bx=x+r(.12)+(bi%2)*r(.42),by=y+r(.34)+Math.floor(bi/2)*r(.28);ctx.fillStyle='#333';ctx.beginPath();ctx.arc(bx+r(.12),by+r(.1),r(.14),0,Math.PI*2);ctx.fill();ctx.fillStyle='#555';ctx.beginPath();ctx.arc(bx+r(.12),by+r(.1),r(.09),0,Math.PI*2);ctx.fill();}ctx.fillStyle='#2c3e50';ctx.fillRect(x+r(.1),y+r(.24),r(.3),r(.16));ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(x+r(.2),y+r(.2),r(.03),0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x+r(.28),y+r(.16),r(.03),0,Math.PI*2);ctx.fill();}
function __msCT91(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#c8c8c8';ctx.fillRect(x+r(.1),y+r(.04),r(.8),r(.92));ctx.fillStyle='#b8b8b8';ctx.fillRect(x+r(.1),y+r(.04),r(.8),r(.3));ctx.fillStyle='#aaa';ctx.fillRect(x+r(.1),y+r(.34),r(.8),r(.02));ctx.fillStyle='#888';ctx.fillRect(x+r(.8),y+r(.1),r(.04),r(.16));ctx.fillRect(x+r(.8),y+r(.5),r(.04),r(.3));ctx.fillStyle='#999';ctx.fillRect(x+r(.12),y+r(.07),r(.04),r(.06));ctx.fillRect(x+r(.12),y+r(.25),r(.04),r(.06));ctx.fillRect(x+r(.12),y+r(.4),r(.04),r(.06));ctx.fillRect(x+r(.12),y+r(.82),r(.04),r(.06));ctx.fillStyle='#00ff88';ctx.fillRect(x+r(.22),y+r(.2),r(.14),r(.04));}
function __msCT92(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#c0c0c0';ctx.fillRect(x+r(.04),y+r(.36),r(.92),r(.08));ctx.fillStyle='#e0e0e0';ctx.fillRect(x+r(.04),y+r(.34),r(.92),r(.04));ctx.fillStyle='#aaa';for(var i=0;i<5;i++)ctx.fillRect(x+r(.1)+i*r(.18),y+r(.42),r(.06),r(.32));ctx.fillStyle='#d4a06e';ctx.fillRect(x+r(.2),y+r(.28),r(.3),r(.1));ctx.fillStyle='#e8c070';ctx.fillRect(x+r(.22),y+r(.3),r(.1),r(.06));ctx.fillStyle='#aaa';ctx.beginPath();ctx.moveTo(x+r(.84),y+r(.3));ctx.lineTo(x+r(.92),y+r(.38));ctx.lineTo(x+r(.84),y+r(.46));ctx.closePath();ctx.fill();}
function __msCT93(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#9090a0';ctx.fillRect(x+r(.04),y+r(.12),r(.92),r(.08));ctx.fillRect(x+r(.04),y+r(.84),r(.92),r(.08));ctx.fillStyle='#c0c0c8';ctx.fillRect(x+r(.06),y+r(.2),r(.88),r(.66));ctx.fillStyle='#e8f0f8';ctx.fillRect(x+r(.1),y+r(.24),r(.8),r(.58));ctx.fillStyle='#fff';ctx.fillRect(x+r(.12),y+r(.26),r(.2),r(.2));ctx.fillStyle='#a8c8e8';ctx.fillRect(x+r(.1),y+r(.5),r(.8),r(.28));ctx.fillStyle='#9ab8d8';ctx.fillRect(x+r(.1),y+r(.5),r(.8),r(.04));ctx.fillStyle='#666';ctx.fillRect(x+r(.08),y+r(.9),r(.06),r(.06));ctx.fillRect(x+r(.86),y+r(.9),r(.06),r(.06));}
function __msCT94(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#888';ctx.fillRect(x+r(.12),y+r(.02),r(.76),r(.22));ctx.fillStyle='#b8d4e8';ctx.fillRect(x+r(.14),y+r(.04),r(.72),r(.18));ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(x+r(.16),y+r(.06),r(.16),r(.12));ctx.fillStyle='#c0c0c0';ctx.fillRect(x+r(.12),y+r(.42),r(.76),r(.36));ctx.fillStyle='#e0e0e0';ctx.fillRect(x+r(.16),y+r(.46),r(.68),r(.28));ctx.fillStyle='#888';ctx.beginPath();ctx.arc(x+r(.5),y+r(.68),r(.05),0,Math.PI*2);ctx.fill();ctx.fillStyle='#aaa';ctx.fillRect(x+r(.44),y+r(.28),r(.12),r(.16));ctx.fillRect(x+r(.4),y+r(.26),r(.2),r(.06));ctx.fillRect(x+r(.34),y+r(.28),r(.08),r(.05));ctx.fillRect(x+r(.58),y+r(.28),r(.08),r(.05));}
function __msCT95(ctx,x,y,ts){const r=v=>Math.round(ts*v);const cx=x+r(.5);ctx.fillStyle='#d0d0d0';ctx.fillRect(x+r(.12),y+r(.1),r(.76),r(.26));ctx.fillStyle='#c0c0c0';ctx.fillRect(x+r(.14),y+r(.12),r(.72),r(.22));ctx.fillStyle='#aaa';for(var i=0;i<6;i++)ctx.fillRect(x+r(.16)+i*r(.1),y+r(.3),r(.06),r(.04));ctx.fillStyle='#2c3e50';ctx.fillRect(x+r(.2),y+r(.4),r(.6),r(.46));ctx.fillStyle='#1a9632';ctx.fillRect(x+r(.24),y+r(.44),r(.52),r(.24));ctx.fillStyle='#00ff44';ctx.fillRect(x+r(.28),y+r(.48),r(.18),r(.08));ctx.fillRect(x+r(.28),y+r(.58),r(.18),r(.08));ctx.fillStyle='#00cc33';ctx.fillRect(x+r(.5),y+r(.5),r(.2),r(.16));ctx.fillStyle='#888';ctx.fillRect(x+r(.28),y+r(.84),r(.44),r(.08));}
function __msCT96(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#888';ctx.fillRect(x+r(.06),y+r(.06),r(.88),r(.06));ctx.fillStyle='#aaa';for(var i=0;i<7;i++){ctx.beginPath();ctx.arc(x+r(.1)+i*r(.12),y+r(.09),r(.03),0,Math.PI*2);ctx.fill();}ctx.fillStyle='#d8c8f0';ctx.fillRect(x+r(.06),y+r(.12),r(.4),r(.82));ctx.fillStyle='#c8b8e0';for(var i=0;i<4;i++)ctx.fillRect(x+r(.1)+i*r(.08),y+r(.12),r(.02),r(.82));ctx.fillStyle='#d8c8f0';ctx.fillRect(x+r(.54),y+r(.12),r(.4),r(.82));ctx.fillStyle='#c8b8e0';for(var i=0;i<4;i++)ctx.fillRect(x+r(.56)+i*r(.08),y+r(.12),r(.02),r(.82));ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x+r(.46),y+r(.12),r(.08),r(.82));}
function __msCT97(ctx,x,y,ts){const r=v=>Math.round(ts*v);ctx.fillStyle='#e8e8e8';ctx.fillRect(x+r(.12),y+r(.18),r(.76),r(.64));ctx.fillStyle='#d0d0d0';ctx.fillRect(x+r(.12),y+r(.14),r(.76),r(.08));ctx.fillStyle='#e74c3c';ctx.fillRect(x+r(.44),y+r(.26),r(.12),r(.38));ctx.fillRect(x+r(.3),y+r(.38),r(.4),r(.14));ctx.fillStyle='#888';ctx.fillRect(x+r(.44),y+r(.2),r(.12),r(.04));ctx.fillRect(x+r(.34),y+r(.06),r(.32),r(.1));ctx.fillStyle='#bbb';ctx.fillRect(x+r(.12),y+r(.14),r(.06),r(.06));ctx.fillRect(x+r(.82),y+r(.14),r(.06),r(.06));ctx.fillRect(x+r(.12),y+r(.76),r(.06),r(.06));ctx.fillRect(x+r(.82),y+r(.76),r(.06),r(.06));}
/* 38 – 소파 */
function __msCT38(ctx,x,y,ts){
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
function __msCT39(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#444'; ctx.fillRect(x+r(.06),y+r(.05),r(.88),r(.7));
  ctx.fillStyle='#111'; ctx.fillRect(x+r(.1),y+r(.09),r(.8),r(.62));
  ctx.fillStyle='rgba(80,150,220,.25)'; ctx.fillRect(x+r(.12),y+r(.11),r(.25),r(.12));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.4),y+r(.73),r(.2),r(.12));
  ctx.fillStyle='#333'; ctx.fillRect(x+r(.22),y+r(.84),r(.56),r(.1));
}
/* 40 – 사물함 */
function __msCT40(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#7888a0'; ctx.fillRect(x+r(.08),y+r(.04),r(.84),r(.92));
  ctx.fillStyle='#5a6a7a'; ctx.fillRect(x+r(.08),y+r(.5),r(.84),r(.02));
  ctx.fillStyle='#c0c8d0'; ctx.fillRect(x+r(.68),y+r(.22),r(.08),r(.05));
  ctx.fillRect(x+r(.68),y+r(.66),r(.08),r(.05));
  ctx.fillStyle='#3a4a5a';
  for(let i=0;i<4;i++) ctx.fillRect(x+r(.1),y+r(.18)+i*r(.08),r(.4),r(.01));
}
/* 41 – 게시판 */
function __msCT41(ctx,x,y,ts){
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
function __msCT42(ctx,x,y,ts){
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
function __msCT43(ctx,x,y,ts){
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
function __msCT44(ctx,x,y,ts){
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
function __msCT45(ctx,x,y,ts){
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
function __msCT46(ctx,x,y,ts){
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
function __msCT47(ctx,x,y,ts){
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
function __msCT48(ctx,x,y,ts){
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
function __msCT49(ctx,x,y,ts){
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
function __msCT50(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#8B6914'; ctx.fillRect(x+r(.06),y+r(.2),r(.88),r(.64));
  ctx.fillStyle='#F5DEB3'; ctx.fillRect(x+r(.1),y+r(.24),r(.8),r(.56));
  ctx.fillStyle='#DEB887'; ctx.fillRect(x+r(.18),y+r(.5),r(.22),r(.2));
  ctx.fillStyle='#e74c3c'; ctx.fillRect(x+r(.52),y+r(.36),r(.06),r(.14));
  ctx.fillRect(x+r(.46),y+r(.36),r(.18),r(.05));
}
/* 51 – 음수대 */
function __msCT51(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#4a5a8a'; ctx.fillRect(cx-r(.14),y+r(.46),r(.28),r(.46));
  ctx.fillStyle='#6678aa'; ctx.fillRect(cx-r(.22),y+r(.34),r(.44),r(.14));
  ctx.fillRect(cx-r(.18),y+r(.3),r(.36),r(.08));
  ctx.fillStyle='#aab8cc'; ctx.fillRect(cx+r(.08),y+r(.32),r(.08),r(.04));
  ctx.fillStyle='#87ceeb'; ctx.fillRect(cx+r(.1),y+r(.36),r(.02),r(.06));
  ctx.fillStyle='#333'; ctx.fillRect(cx-r(.1),y+r(.88),r(.2),r(.08));
}
/* 52 – 철봉 */
function __msCT52(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#6a7480'; ctx.fillRect(x+r(.06),y+r(.18),r(.1),r(.74));
  ctx.fillRect(x+r(.84),y+r(.18),r(.1),r(.74));
  ctx.fillStyle='#8a9096'; ctx.fillRect(x+r(.06),y+r(.18),r(.88),r(.1));
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.04),y+r(.86),r(.14),r(.08));
  ctx.fillRect(x+r(.82),y+r(.86),r(.14),r(.08));
}
/* 53 – 탁구대 */
function __msCT53(ctx,x,y,ts){
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
function __msCT54(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5),cy=y+r(.5);
  ctx.strokeStyle='#e74c3c'; ctx.lineWidth=r(.14);
  ctx.beginPath(); ctx.arc(cx,cy,r(.36),0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='#c0392b'; ctx.lineWidth=r(.04);
  ctx.beginPath(); ctx.arc(cx,cy,r(.36),0,Math.PI*2); ctx.stroke();
  ctx.lineWidth=1;
}
/* 55 – 체중계 */
function __msCT55(ctx,x,y,ts){
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
function __msCT56(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#a08030'; ctx.fillRect(x+r(.08),y+r(.04),r(.84),r(.92));
  ctx.fillStyle='#c8dff0'; ctx.fillRect(x+r(.14),y+r(.08),r(.72),r(.84));
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x+r(.16),y+r(.1),r(.2),r(.6));
  ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x+r(.38),y+r(.1),r(.08),r(.25));
}
/* 57 – 배드민턴 네트 */
function __msCT57(ctx,x,y,ts){
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
function __msCT58(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#2c5fab'; ctx.fillRect(x+r(.04),y+r(.04),r(.92),r(.12));
  ctx.fillStyle='#444'; ctx.fillRect(cx-r(.04),y+r(.14),r(.08),r(.8));
  ctx.fillStyle='#f1c40f'; ctx.fillRect(cx-r(.24),y+r(.2),r(.48),r(.24));
  ctx.fillStyle='#1a3a7a'; ctx.fillRect(cx-r(.2),y+r(.22),r(.4),r(.2));
  ctx.fillStyle='#333'; ctx.fillRect(cx-r(.04),y+r(.9),r(.08),r(.06));
}
/* 59 – 자전거 거치대 */
function __msCT59(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#8a9096';
  ctx.fillRect(x+r(.12),y+r(.3),r(.1),r(.6));
  ctx.fillRect(x+r(.78),y+r(.3),r(.1),r(.6));
  ctx.fillRect(x+r(.12),y+r(.3),r(.76),r(.08));
  ctx.fillRect(x+r(.44),y+r(.3),r(.12),r(.08));
  ctx.fillRect(x+r(.12),y+r(.84),r(.76),r(.06));
}
/* 60 – 가로등 */
function __msCT60(ctx,x,y,ts){
  const r=v=>Math.round(ts*v); const cx=x+r(.5);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(cx-r(.04),y+r(.18),r(.08),r(.76));
  ctx.fillRect(cx-r(.04),y+r(.12),r(.3),r(.06));
  ctx.fillRect(cx+r(.22),y+r(.06),r(.1),r(.12));
  ctx.fillStyle='#f9e06e'; ctx.fillRect(cx+r(.18),y+r(.04),r(.18),r(.1));
  ctx.fillStyle='#f1c40f'; ctx.fillRect(cx+r(.2),y+r(.05),r(.14),r(.06));
  ctx.fillStyle='#444'; ctx.fillRect(cx-r(.1),y+r(.9),r(.2),r(.08));
}
/* 61 – 자판기 */
function __msCT61(ctx,x,y,ts){
  const r=v=>Math.round(ts*v);
  ctx.fillStyle='#2c3e50'; ctx.fillRect(x+r(.08),y+r(.04),r(.84),r(.92));
  ctx.fillStyle='#1a252f'; ctx.fillRect(x+r(.12),y+r(.08),r(.76),r(.48));
  const pc=['#e74c3c','#3498db','#f1c40f','#2ecc71','#e67e22','#9b59b6'];
  const bw=r(.22),ph=r(.14);
  for(let row=0;row<2;row++) for(let col=0;col<3;col++){
    ctx.fillStyle=pc[row*3+col];
    ctx.fillRect(x+r(.14)+col*(bw+r(.02)),y+r(.1)+row*(ph+r(.02)),bw,ph);
  }
  ctx.fillStyle='#555'; ctx.fillRect(x+r(.14),y+r(.6),r(.72),r(.16));
  ctx.fillStyle='#222'; ctx.fillRect(x+r(.18),y+r(.8),r(.64),r(.1));
}
/* 62 – 분수대 */
function __msCT62(ctx,x,y,ts){
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
function __msCT63(ctx,x,y,ts){
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
function __msCT64(ctx,x,y,ts){
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
function __msCT65(ctx,x,y,ts){
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
function __msCT66(ctx,x,y,ts){
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
function __msCT67(ctx,x,y,ts){
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

/* ===================== Q4: 애니 캐릭터 해금 시스템 ===================== */

async function __msLoadCharUnlockThreshold(){
  if(__msRoomId === 'demo') return;
  const client = __msGetClient();
  if(!client) return;
  try{
    const { data } = await client
      .from('room_settings')
      .select('char_unlock_threshold')
      .eq('room_id', __msRoomId)
      .maybeSingle();
    const t = (data && data.char_unlock_threshold != null) ? Number(data.char_unlock_threshold) : 5;
    __msCharUnlockThreshold = t;
    try{ localStorage.setItem('ssambus_anime_threshold_' + __msRoomId, String(t)); }catch(e){}
  }catch(e){ /* 컬럼 미존재 시 항상 해금 상태로 유지 */ }
}

function __msCheckAnimeUnlock(threshold){
  if(threshold === undefined) threshold = __msCharUnlockThreshold;
  if(threshold <= 0) return;
  const unlockKey = 'ssambus_anime_unlocked_' + __msRoomId;
  try{
    if(localStorage.getItem(unlockKey)) return;
    if(__msDone.size >= threshold){
      localStorage.setItem(unlockKey, '1');
      setTimeout(__msShowAnimeUnlockNotification, 400);
    }
  }catch(e){}
}

function __msShowAnimeUnlockNotification(){
  if(!document.getElementById('ms-anime-unlock-style')){
    const s = document.createElement('style');
    s.id = 'ms-anime-unlock-style';
    s.textContent = '@keyframes msPopIn{from{transform:scale(.65);opacity:0}to{transform:scale(1);opacity:1}}';
    document.head.appendChild(s);
  }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:10001;'
    + 'display:flex;align-items:center;justify-content:center;font-family:"Noto Sans KR",sans-serif';
  overlay.innerHTML = '<div style="background:#fff;border-radius:22px;padding:36px 32px;text-align:center;'
    + 'max-width:300px;box-shadow:0 10px 48px rgba(0,0,0,.45);animation:msPopIn .3s ease">'
    + '<div style="font-size:56px;margin-bottom:10px">🎉</div>'
    + '<div style="font-size:21px;font-weight:800;color:#2c3e50;margin-bottom:8px">애니 캐릭터 해금!</div>'
    + '<div style="font-size:13.5px;color:#7f8c8d;line-height:1.6;margin-bottom:22px">'
    + '미션을 충분히 완료했어요!<br>왼쪽 상단 <b>캐릭터 변경</b> 버튼을 눌러<br>애니 캐릭터를 선택해보세요 ✨</div>'
    + '<button onclick="this.closest(\'[data-ms-unlock]\').remove()" '
    + 'style="background:linear-gradient(135deg,#3498db,#2ecc71);color:#fff;border:none;'
    + 'border-radius:12px;padding:12px 32px;font-size:15px;font-weight:700;cursor:pointer;'
    + 'font-family:inherit">확인</button></div>';
  overlay.setAttribute('data-ms-unlock', '1');
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
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

