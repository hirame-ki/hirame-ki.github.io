/**
 * 방과후 한눈에 — 서버 코드 (Google Apps Script)
 * 시트 구조 정의 · 데이터 읽기/쓰기 · 권한 확인 · 웹앱 API
 */

var APP_NAME = '방과후 한눈에';
var APP_VERSION = '1.2.0';          // tools/release.js가 자동으로 바꿉니다.
var SCHEMA_VERSION = 2;             // 시트 구조 버전 (열·탭이 바뀌면 올리고 Cycle.gs의 migrate_에 반영)
// 업데이트를 받아 올 곳: hirame-ki.github.io 저장소의 after/ 폴더 (raw 주소 = 올린 파일 그대로).
// 안내 페이지는 https://hirame-ki.github.io/after/ . [설정] 탭의 '업데이트주소'로 바꿀 수 있습니다.
var UPDATE_BASE = 'https://raw.githubusercontent.com/hirame-ki/hirame-ki.github.io/main/after/';
var UPDATE_PAGE = 'https://hirame-ki.github.io/after/';
var TZ = 'Asia/Seoul';

var SH = {
  MANUAL: '사용설명서',
  SETTINGS: '설정',
  SLOTS: '시간대',
  ROOMS: '장소',
  HOLIDAYS: '휴일',
  STUDENTS: '학생',
  TEACHERS: '교사',
  COURSES: '강좌',
  ENROLL: '수강신청',
  CHANGES: '일정변경',
  CYCLES: '주기',
  LOG: '변경이력'
};

// [코드에서 쓰는 이름, 시트 머리글]
var SCHEMA = {};
SCHEMA[SH.SLOTS] = [['name', '시간대명'], ['start', '시작'], ['end', '종료']];
SCHEMA[SH.ROOMS] = [['name', '장소명'], ['capacity', '수용인원'], ['note', '비고']];
SCHEMA[SH.HOLIDAYS] = [['date', '날짜'], ['reason', '사유']];
SCHEMA[SH.STUDENTS] = [['grade', '학년'], ['cls', '반'], ['no', '번호'], ['name', '이름'], ['code', '확인코드'], ['note', '비고']];
SCHEMA[SH.TEACHERS] = [['name', '이름'], ['dept', '소속/교과'], ['phone', '연락처']];
SCHEMA[SH.COURSES] = [
  ['id', '강좌ID'], ['name', '강좌명'], ['area', '영역'], ['teacher', '담당'], ['grades', '대상학년'],
  ['days', '요일'], ['start', '시작시각'], ['end', '종료시각'], ['startDate', '시작일'], ['endDate', '종료일'],
  ['room', '장소'], ['cap', '정원'], ['min', '최소인원'], ['fee', '수강료'], ['material', '재료비'],
  ['desc', '강좌소개'], ['status', '상태'], ['reason', '반려사유'], ['updated', '수정일시'], ['cycle', '주기']
];
SCHEMA[SH.ENROLL] = [
  ['id', '신청ID'], ['courseId', '강좌ID'], ['sid', '학번'], ['name', '이름'], ['status', '상태'],
  ['source', '경로'], ['time', '신청시각'], ['wait', '대기순번'], ['note', '비고'], ['cycle', '주기']
];
SCHEMA[SH.CHANGES] = [
  ['id', '변경ID'], ['date', '날짜'], ['courseId', '강좌ID'], ['type', '유형'], ['room', '장소'],
  ['start', '시작시각'], ['end', '종료시각'], ['reason', '사유'], ['by', '등록자'], ['at', '등록일시'], ['cycle', '주기']
];
// 방과후 운영 주기(학기·분기·방학 등). 강좌·신청·일정변경은 '주기' 열로 구분해 지난 기록을 그대로 남깁니다.
SCHEMA[SH.CYCLES] = [
  ['id', '주기ID'], ['name', '이름'], ['year', '학년도'], ['term', '학기'], ['opStart', '운영시작일'], ['opEnd', '운영종료일'],
  ['applyStart', '신청시작'], ['applyEnd', '신청마감'], ['method', '선발방식'], ['maxCount', '최대신청개수'],
  ['status', '상태'], ['started', '시작일시'], ['closed', '마감일시'], ['courses', '강좌수'], ['students', '수강학생수'],
  ['enrolls', '선정건수'], ['note', '메모']
];
var CYCLE_TABLES = {};
CYCLE_TABLES[SH.COURSES] = true; CYCLE_TABLES[SH.ENROLL] = true; CYCLE_TABLES[SH.CHANGES] = true;
SCHEMA[SH.LOG] = [['at', '시각'], ['by', '작업자'], ['action', '작업'], ['target', '대상'], ['detail', '내용']];

// [코드 이름, 시트 항목명, 설명, 기본값]
var SETTING_DEFS = [
  ['schoolName', '학교명', '학교 이름 (예: 예시중학교)', ''],
  ['level', '학교급', '초등학교 / 중학교 / 고등학교 중 하나', ''],
  ['year', '학년도', '예: 2026', ''],
  ['term', '학기', '예: 2학기, 여름방학, 1분기', ''],
  ['programName', '프로그램명칭', '화면과 가정통신문에 쓰는 이름 (비우면 학교급에 맞춰 자동)', ''],
  ['teacherLabel', '교사명칭', '강좌 담당자를 부르는 말 (비우면 학교급에 맞춰 자동)', ''],
  ['dept', '담당부서', '가정통신문 문의처', ''],
  ['manager', '담당자', '가정통신문 문의처', ''],
  ['phone', '연락처', '가정통신문 문의처', ''],
  ['opStart', '운영시작일', '강좌 기간 기본값 (예: 2026-03-09)', ''],
  ['opEnd', '운영종료일', '강좌 기간 기본값 (예: 2026-07-17)', ''],
  ['applyStart', '신청시작', '학생 온라인 신청 시작 (예: 2026-03-02 09:00, 비우면 제한 없음)', ''],
  ['applyEnd', '신청마감', '학생 온라인 신청 마감 (예: 2026-03-06 18:00, 비우면 제한 없음)', ''],
  ['stage', '진행단계', '준비중 / 신청접수 / 신청마감 / 운영중 (웹 관리자 화면에서 바꾸는 것을 권장)', '준비중'],
  ['method', '선발방식', '선착순 / 추첨 / 담당자선정', '추첨'],
  ['maxCount', '최대신청개수', '학생 1명이 신청할 수 있는 강좌 수 (0 = 제한 없음)', '3'],
  ['feeUse', '수강료표시', '사용 / 사용안함 (결제 기능 없이 금액만 표시)', '사용안함'],
  ['feeUnit', '수강료기준', '금액 옆에 붙는 기준 (예: 3개월, 월, 학기)', '3개월'],
  ['adminPw', '관리자비밀번호', '관리자 화면 접속용 (4자 이상)', ''],
  ['teacherPw', '교사비밀번호', '교사·강사 공용 접속용 (4자 이상)', ''],
  ['webUrl', '웹앱주소', '배포 후 자동으로 채워집니다. 안 채워지면 웹 앱 URL을 붙여넣으세요.', ''],
  ['shortApply', '짧은주소_학생신청', 'QR코드에 쓰는 짧은 주소. 관리자 화면 [짧은 주소 만들기]로 자동 생성 (다른 단축 서비스 주소를 직접 넣어도 됩니다)', ''],
  ['shortBoard', '짧은주소_현황판', '현황판 짧은 주소', ''],
  ['shortAdmin', '짧은주소_관리자', '관리자·교사 화면 짧은 주소', ''],
  ['shortBase', '짧은주소_기준', '짧은 주소를 만들 때의 웹앱 주소 (자동). 웹앱 주소가 바뀌면 짧은 주소는 쓰지 않습니다.', ''],
  ['cycle', '현재주기', '지금 운영 중인 주기ID (자동). 관리자 화면 [주기 관리]에서 바꿉니다.', ''],
  ['updateBase', '업데이트주소', '새 버전을 받아 올 주소 (비우면 기본 GitHub 저장소)', ''],
  ['latestVersion', '최신버전', '마지막으로 확인한 최신 버전 (자동)', ''],
  ['schemaVer', '구조버전', '시트 구조 버전 (자동, 고치지 마세요)', '']
];

var LEVELS = {
  '초등학교': {
    short: '초', grades: 6, programName: '늘봄학교 방과후 프로그램', teacherLabel: '강사',
    slots: [['1부', '13:50', '14:30'], ['2부', '14:40', '15:20'], ['3부', '15:30', '16:10'], ['4부', '16:20', '17:00']],
    rooms: ['늘봄교실 1', '늘봄교실 2', '늘봄교실 3', '컴퓨터실', '과학실', '음악실', '미술실', '도서실', '체육관', '강당', '운동장', '다목적실']
  },
  '중학교': {
    short: '중', grades: 3, programName: '방과후학교', teacherLabel: '담당 교사',
    slots: [['1타임', '15:40', '16:25'], ['2타임', '16:35', '17:20'], ['3타임', '17:30', '18:15']],
    rooms: ['1-1 교실', '1-2 교실', '2-1 교실', '2-2 교실', '3-1 교실', '3-2 교실', '컴퓨터실', '과학실', '음악실', '미술실', '도서실', '체육관', '운동장', '다목적실', '시청각실']
  },
  '고등학교': {
    short: '고', grades: 3, programName: '방과후학교', teacherLabel: '담당 교사',
    slots: [['8교시', '16:40', '17:30'], ['9교시', '17:40', '18:30'], ['야간1', '19:00', '19:50'], ['야간2', '20:00', '20:50']],
    rooms: ['1-1 교실', '1-2 교실', '2-1 교실', '2-2 교실', '3-1 교실', '3-2 교실', '컴퓨터실', '과학실', '음악실', '미술실', '도서실', '체육관', '운동장', '세미나실', '시청각실']
  }
};

var COURSE_STATUS = ['작성중', '제출', '승인', '반려', '폐강'];
var ENROLL_STATUS = ['신청', '선정', '대기', '취소'];
var ACTIVE = { '신청': true, '선정': true, '대기': true };
var STAGES = ['준비중', '신청접수', '신청마감', '운영중'];
var CHANGE_TYPES = ['휴강', '보강', '장소변경', '시간변경'];

/* ───────────────────────── 시트 읽기·쓰기 ───────────────────────── */

function ss_() { return SpreadsheetApp.getActive(); }

function sheet_(name) {
  var s = ss_().getSheetByName(name);
  if (!s) throw new Error("'" + name + "' 시트가 없습니다. 시트 메뉴 [방과후 관리] → [① 처음 설정하기]를 먼저 실행하세요.");
  return s;
}

/** 표 읽기. 강좌·수강신청·일정변경은 기본으로 '현재 주기'만 돌려주고, all=true면 모든 주기를 돌려줍니다. */
function readTable_(name, all) {
  var rows = readAllRows_(name);
  if (!CYCLE_TABLES[name] || all) return rows;
  var cur = currentCycle_();
  return rows.filter(function (r) { return (r.cycle || '') === cur; });
}

function readAllRows_(name) {
  var cols = SCHEMA[name], sh = sheet_(name), last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, cols.length).getDisplayValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var r = vals[i];
    if (r.join('').trim() === '') continue;
    var o = { _row: i + 2 };
    for (var j = 0; j < cols.length; j++) o[cols[j][0]] = String(r[j] == null ? '' : r[j]).trim();
    out.push(o);
  }
  return out;
}

function toRow_(name, o) {
  return SCHEMA[name].map(function (c) { var v = o[c[0]]; return v == null ? '' : String(v); });
}

function appendRows_(name, objs) {
  if (!objs.length) return;
  var sh = sheet_(name), start = sh.getLastRow() + 1, n = SCHEMA[name].length;
  if (CYCLE_TABLES[name]) objs.forEach(function (o) { if (o.cycle == null || o.cycle === '') o.cycle = currentCycle_(); });
  sh.getRange(start, 1, objs.length, n).setNumberFormat('@')
    .setValues(objs.map(function (o) { return toRow_(name, o); }));
  objs.forEach(function (o, i) { o._row = start + i; });
}

function updateRows_(name, objs) {
  if (!objs.length) return;
  var sh = sheet_(name), n = SCHEMA[name].length;
  if (objs.length <= 8) {
    objs.forEach(function (o) { sh.getRange(o._row, 1, 1, n).setNumberFormat('@').setValues([toRow_(name, o)]); });
    return;
  }
  // 여러 줄은 한 번에 읽어서 고친 뒤 한 번에 씁니다.
  var last = sh.getLastRow();
  var range = sh.getRange(2, 1, last - 1, n);
  var vals = range.getDisplayValues();
  objs.forEach(function (o) { vals[o._row - 2] = toRow_(name, o); });
  range.setNumberFormat('@').setValues(vals);
}

function deleteRow_(name, row) { sheet_(name).deleteRow(row); }

var CUR_CYCLE_ = null; // 한 번 실행되는 동안 현재 주기ID를 기억

function currentCycle_() {
  if (CUR_CYCLE_ === null) readSettings_();
  return CUR_CYCLE_ || '';
}

function readSettings_() {
  var sh = sheet_(SH.SETTINGS), last = sh.getLastRow(), map = {};
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, 2).getDisplayValues().forEach(function (r) {
      map[String(r[0]).trim()] = String(r[1]).trim();
    });
  }
  var s = {};
  SETTING_DEFS.forEach(function (d) {
    var v = map[d[1]];
    s[d[0]] = (v != null && v !== '') ? v : d[3];
  });
  CUR_CYCLE_ = s.cycle || '';
  return s;
}

function writeSettings_(obj) {
  var sh = sheet_(SH.SETTINGS), last = sh.getLastRow();
  var keys = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getDisplayValues().map(function (r) { return String(r[0]).trim(); }) : [];
  SETTING_DEFS.forEach(function (d) {
    if (!(d[0] in obj)) return;
    var idx = keys.indexOf(d[1]);
    if (idx >= 0) {
      sh.getRange(idx + 2, 2).setNumberFormat('@').setValue(String(obj[d[0]]));
    } else {
      var row = sh.getLastRow() + 1;
      sh.getRange(row, 1, 1, 3).setNumberFormat('@').setValues([[d[1], String(obj[d[0]]), d[2]]]);
      keys.push(d[1]);
    }
  });
  if ('cycle' in obj) CUR_CYCLE_ = String(obj.cycle);
}

function log_(ctx, action, target, detail) {
  appendRows_(SH.LOG, [{ at: nowStr_(), by: ctx ? (ctx.role === 'student' ? '학생 ' + ctx.st.sid : ctx.name) : '시스템', action: action, target: target || '', detail: detail || '' }]);
}

function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function nowStr_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }

function labels_(s) {
  var lv = LEVELS[s.level] || LEVELS['중학교'];
  return {
    short: lv.short,
    grades: lv.grades,
    programName: s.programName || lv.programName,
    teacherLabel: s.teacherLabel || lv.teacherLabel,
    configured: !!(s.schoolName && LEVELS[s.level])
  };
}

function readStudents_() {
  return readTable_(SH.STUDENTS).map(function (r) {
    var g = int_(r.grade), c = int_(r.cls), n = int_(r.no);
    return { _row: r._row, sid: makeSid_(g, c, n), grade: g, cls: c, no: n, name: r.name, code: r.code, note: r.note };
  }).filter(function (st) { return st.grade && st.cls && st.no && st.name; });
}

function loadAll_(s) {
  var maxGrade = labels_(s).grades;
  var db = {
    slots: readTable_(SH.SLOTS).map(function (x) { return { name: x.name, start: normTime_(x.start), end: normTime_(x.end) }; }),
    rooms: readTable_(SH.ROOMS).map(function (x) { return { name: x.name, capacity: x.capacity, note: x.note }; }),
    holidays: readTable_(SH.HOLIDAYS).map(function (x) { return { date: normDate_(x.date), reason: x.reason }; }).filter(function (x) { return x.date; }),
    teachers: readTable_(SH.TEACHERS).map(function (x) { return { name: x.name, dept: x.dept }; }).filter(function (x) { return x.name; }),
    students: readStudents_(),
    courses: readTable_(SH.COURSES).map(function (c) { return prepCourse_(c, s, maxGrade); }),
    enroll: readTable_(SH.ENROLL),
    changes: readTable_(SH.CHANGES).map(function (x) {
      x.date = normDate_(x.date); x.start = normTime_(x.start); x.end = normTime_(x.end); return x;
    })
  };
  db.holidayMap = {};
  db.holidays.forEach(function (h) { db.holidayMap[h.date] = h.reason || '휴일'; });
  return db;
}

/** 배포된 웹앱 주소. 편집자 전용 테스트 주소(/dev)는 학생이 열 수 없으므로 쓰지 않습니다. */
function webUrl_() {
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  return /\/dev$/.test(url) ? '' : url;
}

/** 화면별 접속 주소. 짧은 주소가 있으면 QR코드에 그것을 씁니다. */
function links_(s) {
  var base = webUrl_() || s.webUrl || '';
  var valid = !s.shortBase || s.shortBase === base;
  var mk = function (query, short) {
    var long = base ? base + query : '';
    var sh = valid ? String(short || '') : '';
    return { long: long, short: sh, url: sh || long };
  };
  return { base: base, apply: mk('?page=apply', s.shortApply), board: mk('?page=board', s.shortBoard), admin: mk('', s.shortAdmin) };
}

/** 무료 단축 서비스로 주소를 줄입니다. (is.gd → 실패하면 TinyURL) */
function shorten_(url) {
  var services = ['https://is.gd/create.php?format=simple&url=', 'https://tinyurl.com/api-create.php?url='];
  var lastErr = '';
  for (var i = 0; i < services.length; i++) {
    try {
      var r = UrlFetchApp.fetch(services[i] + encodeURIComponent(url), { muteHttpExceptions: true, followRedirects: true });
      var t = String(r.getContentText() || '').trim();
      if (r.getResponseCode() === 200 && /^https?:\/\/\S+$/.test(t)) return t.replace(/^http:/, 'https:');
      lastErr = t.slice(0, 120);
    } catch (e) {
      lastErr = String(e.message || e);
      if (/permission|권한|authoriz/i.test(lastErr)) {
        throw new Error('외부 접속 권한 승인이 한 번 필요합니다. 구글 시트 메뉴 [🏫 방과후 관리] → [② 접속 주소·QR 보기]에서 [짧은 주소 만들기]를 눌러 승인해 주세요.');
      }
    }
  }
  throw new Error('짧은 주소를 만들지 못했습니다. 잠시 후 다시 시도하세요. (' + lastErr + ')');
}

function shortenAll_(s) {
  var L = links_(s);
  if (!L.base) throw new Error('웹앱 주소를 알 수 없습니다. 먼저 웹앱으로 배포하세요. (사용설명서 4단계)');
  var out = { shortApply: shorten_(L.apply.long), shortBoard: shorten_(L.board.long), shortAdmin: shorten_(L.admin.long), shortBase: L.base };
  writeSettings_(out);
  return out;
}

/** 시간대 목록 확인·정리 (처음 설정 창과 관리자 설정에서 같이 씀) */
function cleanSlots_(arr) {
  var list = (arr || []).map(function (x) {
    return { name: String(x.name || '').trim(), start: normTime_(x.start), end: normTime_(x.end) };
  }).filter(function (x) { return x.name || x.start || x.end; });
  var names = {};
  list.forEach(function (x) {
    if (!x.name) throw new Error('시간대 이름을 입력하세요. (예: 1부, 8교시)');
    if (!x.start || !x.end || x.start >= x.end) throw new Error('「' + x.name + '」의 시작·종료 시각을 확인하세요. (예: 15:40 ~ 16:25)');
    if (names[x.name]) throw new Error('시간대 이름 「' + x.name + '」이(가) 두 번 있습니다.');
    names[x.name] = true;
  });
  return list.sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
}

function presetSlots_(level) {
  var lv = LEVELS[level] || LEVELS['중학교'];
  return lv.slots.map(function (x) { return { name: x[0], start: x[1], end: x[2] }; });
}

/* ───────────────────────── 웹앱 진입점 ───────────────────────── */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var page = p.page === 'apply' ? 'Apply' : p.page === 'board' ? 'Board' : 'Index';
  var t = HtmlService.createTemplateFromFile(page);
  var url = webUrl_();
  try {
    ensureSchema_();
    var s = readSettings_();
    if (url && s.webUrl !== url) writeSettings_({ webUrl: url });
    if (!url) url = s.webUrl;
  } catch (err) { /* 시트가 아직 없으면 화면에서 안내 */ }
  t.bootJson = JSON.stringify({ url: url, page: p.page || 'admin', params: p }).replace(/</g, '\\u003c');
  var titles = { Apply: '수강 신청', Board: '오늘의 방과후', Index: '방과후 관리' };
  return t.evaluate()
    .setTitle(titles[page] + ' · ' + APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

/* ───────────────────────── API ───────────────────────── */

// 다른 파일(Cycle.gs, Update.gs)의 함수도 쓰므로, 파일 읽는 순서와 상관없도록 호출할 때 목록을 만듭니다.
function actions_() { return {
  info: { role: 'public', fn: actInfo_ },
  board: { role: 'public', fn: actBoard_ },
  boardMonth: { role: 'public', fn: actBoardMonth_ },
  stuLogin: { role: 'student', fn: actStuState_ },
  stuApply: { role: 'student', write: true, fn: actStuApply_ },
  stuCancel: { role: 'student', write: true, fn: actStuCancel_ },
  login: { role: 'staff', fn: actState_ },
  state: { role: 'staff', fn: actState_ },
  saveCourse: { role: 'staff', write: true, fn: actSaveCourse_ },
  courseStatus: { role: 'staff', write: true, fn: actCourseStatus_ },
  deleteCourse: { role: 'staff', write: true, fn: actDeleteCourse_ },
  rosterParse: { role: 'staff', fn: actRosterParse_ },
  rosterAdd: { role: 'staff', write: true, fn: actRosterAdd_ },
  enrollStatus: { role: 'staff', write: true, fn: actEnrollStatus_ },
  saveChange: { role: 'staff', write: true, fn: actSaveChange_ },
  deleteChange: { role: 'staff', write: true, fn: actDeleteChange_ },
  sessions: { role: 'staff', fn: actSessions_ },
  saveSettings: { role: 'admin', write: true, fn: actSaveSettings_ },
  saveSlots: { role: 'admin', write: true, fn: actSaveSlots_ },
  shorten: { role: 'admin', write: true, fn: actShorten_ },
  setStage: { role: 'admin', write: true, fn: actSetStage_ },
  runSelection: { role: 'admin', write: true, fn: actRunSelection_ },
  promote: { role: 'admin', write: true, fn: actPromote_ },
  codes: { role: 'admin', fn: actCodes_ },
  genCodes: { role: 'admin', write: true, fn: actGenCodes_ },
  logs: { role: 'admin', fn: actLogs_ },
  cycles: { role: 'admin', fn: actCycles_ },
  cycleDetail: { role: 'admin', fn: actCycleDetail_ },
  startCycle: { role: 'admin', write: true, fn: actStartCycle_ },
  importCycle: { role: 'admin', write: true, fn: actImportCycle_ },
  checkUpdate: { role: 'admin', fn: actCheckUpdate_ },
  runUpdate: { role: 'admin', write: true, fn: actRunUpdate_ }
}; }

/** 웹 화면에서 부르는 단 하나의 함수 */
function api(req) {
  req = req || {};
  try {
    var h = actions_()[req.action];
    if (!h) throw new Error('알 수 없는 요청입니다: ' + req.action);
    ensureSchema_();
    var lock = null;
    if (h.write) { lock = LockService.getScriptLock(); lock.waitLock(25000); }
    try {
      var ctx = auth_(req.auth || {}, h.role);
      return { ok: true, data: h.fn(req.data || {}, ctx) };
    } finally {
      if (lock) lock.releaseLock();
    }
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

function guard_(key, ok, failMsg) {
  var cache = CacheService.getScriptCache(), k = 'fail_' + Utilities.base64EncodeWebSafe(key).slice(0, 200);
  var n = Number(cache.get(k) || 0);
  if (n >= 5) throw new Error('여러 번 틀려서 10분 동안 잠겼습니다. 잠시 후 다시 시도하세요.');
  if (!ok) {
    cache.put(k, String(n + 1), 600);
    throw new Error(failMsg);
  }
}

function auth_(a, need) {
  if (need === 'public') return { role: 'public' };
  var s = readSettings_();
  if (need === 'student') {
    var sid = String(a.sid || '').trim(), name = String(a.name || '').trim(), code = String(a.code || '').trim();
    var st = null;
    readStudents_().some(function (x) { if (x.sid === sid) { st = x; return true; } return false; });
    guard_('stu:' + sid, !!st && st.name === name, '학년·반·번호와 이름을 다시 확인하세요.');
    if (!st.code) throw new Error('확인코드가 아직 발급되지 않았습니다. 담임 선생님께 문의하세요.');
    guard_('stu:' + sid, st.code === code, '확인코드가 맞지 않습니다.');
    return { role: 'student', st: st, s: s, name: st.name };
  }
  if (a.role === 'admin') {
    if (!s.adminPw) throw new Error('관리자 비밀번호가 정해지지 않았습니다. 시트의 [설정] 탭에서 정해 주세요.');
    guard_('admin', String(a.pw || '') === s.adminPw, '비밀번호가 맞지 않습니다.');
    return { role: 'admin', name: '관리자', s: s };
  }
  if (need === 'admin') throw new Error('관리자만 할 수 있는 작업입니다.');
  if (a.role === 'teacher') {
    if (!s.teacherPw) throw new Error('교사 비밀번호가 정해지지 않았습니다. 관리자에게 문의하세요.');
    var tname = String(a.name || '').trim();
    var exists = readTable_(SH.TEACHERS).some(function (t) { return t.name === tname; });
    if (!exists) throw new Error('[교사] 명단에 없는 이름입니다. 관리자에게 등록을 요청하세요.');
    guard_('t:' + tname, String(a.pw || '') === s.teacherPw, '비밀번호가 맞지 않습니다.');
    return { role: 'teacher', name: tname, s: s };
  }
  throw new Error('로그인이 필요합니다.');
}

/* ───────────── 공개(로그인 없음) ───────────── */

function actInfo_() {
  var s = readSettings_();
  var teachers = [];
  try { teachers = readTable_(SH.TEACHERS).map(function (t) { return t.name; }).filter(String); } catch (e) { }
  return {
    schoolName: s.schoolName, level: s.level, year: s.year, term: s.term, stage: s.stage,
    labels: labels_(s), teachers: teachers, method: s.method, maxCount: s.maxCount,
    applyStart: s.applyStart, applyEnd: s.applyEnd, feeUse: s.feeUse, today: today_()
  };
}

function actBoard_(d) {
  var s = readSettings_(), db = loadAll_(s);
  var date = normDate_(d.date) || today_();
  var counts = courseCounts_(db.enroll);
  var list = sessionsOnDate_(db.courses, date, db.holidayMap, db.changes).map(function (x) {
    var c = counts[x.courseId] || {};
    x.count = (c['선정'] || 0) + (c['신청'] || 0);
    return x;
  });
  return {
    date: date, dow: dayName_(date), holiday: db.holidayMap[date] || '', sessions: list, slots: db.slots,
    schoolName: s.schoolName, labels: labels_(s), today: today_(), now: nowStr_()
  };
}

function actBoardMonth_(d) {
  var s = readSettings_(), db = loadAll_(s);
  var ym = /^\d{4}-\d{2}$/.test(d.month || '') ? d.month : today_().slice(0, 7);
  var first = ym + '-01', days = [];
  for (var cur = first; cur.slice(0, 7) === ym; cur = addDays_(cur, 1)) {
    var list = sessionsOnDate_(db.courses, cur, db.holidayMap, db.changes);
    days.push({ date: cur, count: list.filter(function (x) { return x.state !== '휴강'; }).length, holiday: db.holidayMap[cur] || '' });
  }
  return { month: ym, days: days, schoolName: s.schoolName, labels: labels_(s), today: today_() };
}

/* ───────────── 학생 ───────────── */

function applyWindow_(s) {
  var now = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
  var a = normDateTime_(s.applyStart, '00:00'), b = normDateTime_(s.applyEnd, '23:59');
  if (s.stage !== '신청접수') {
    var why = { '준비중': '아직 신청 기간이 아닙니다.', '신청마감': '신청이 마감되었습니다. 선발 결과는 확정 후 안내됩니다.', '운영중': '수강 확정이 끝났습니다. 아래에서 결과를 확인하세요.' };
    return { open: false, reason: why[s.stage] || '지금은 신청할 수 없습니다.' };
  }
  if (a && now < a) return { open: false, reason: '신청은 ' + a + '부터 시작합니다.' };
  if (b && now > b) return { open: false, reason: '신청 기간(' + b + ' 마감)이 지났습니다.' };
  return { open: true, reason: '' };
}

function actStuState_(d, ctx) {
  var s = ctx.s, db = loadAll_(s), st = ctx.st;
  var counts = courseCounts_(db.enroll);
  var courses = db.courses.filter(function (c) {
    return c.status === '승인' && c.gradeList.indexOf(st.grade) >= 0;
  }).map(function (c) { return publicCourse_(c, counts[c.id]); });
  var mine = db.enroll.filter(function (e) { return e.sid === st.sid && ACTIVE[e.status]; })
    .map(function (e) { return { courseId: e.courseId, status: e.status, wait: e.wait, time: e.time }; });
  var cmap = {};
  db.courses.forEach(function (c) { cmap[c.id] = c; });
  mine.forEach(function (m) {
    if (!courses.some(function (c) { return c.id === m.courseId; }) && cmap[m.courseId]) courses.push(publicCourse_(cmap[m.courseId], counts[m.courseId]));
  });
  return {
    student: { sid: st.sid, name: st.name, grade: st.grade, cls: st.cls, no: st.no },
    schoolName: s.schoolName, labels: labels_(s), stage: s.stage, method: s.method,
    maxCount: int_(s.maxCount), feeUse: s.feeUse === '사용', feeUnit: s.feeUnit,
    applyStart: s.applyStart, applyEnd: s.applyEnd, window: applyWindow_(s),
    courses: courses, mine: mine, holidays: db.holidays
  };
}

function actStuApply_(d, ctx) {
  var s = ctx.s, st = ctx.st, win = applyWindow_(s);
  if (!win.open) throw new Error(win.reason);
  var db = loadAll_(s);
  var c = null;
  db.courses.some(function (x) { if (x.id === d.courseId) { c = x; return true; } return false; });
  if (!c || c.status !== '승인') throw new Error('신청할 수 없는 강좌입니다.');
  if (c.gradeList.indexOf(st.grade) < 0) throw new Error('이 강좌는 ' + st.grade + '학년 대상이 아닙니다.');
  var cmap = {};
  db.courses.forEach(function (x) { cmap[x.id] = x; });
  var mine = db.enroll.filter(function (e) { return e.sid === st.sid && ACTIVE[e.status]; });
  if (mine.some(function (e) { return e.courseId === c.id; })) throw new Error('이미 신청한 강좌입니다.');
  var max = int_(s.maxCount);
  if (max > 0 && mine.length >= max) throw new Error('최대 ' + max + '개까지 신청할 수 있습니다. 다른 강좌를 취소한 뒤 신청하세요.');
  mine.forEach(function (e) {
    var o = cmap[e.courseId] && coursesOverlap_(c, cmap[e.courseId]);
    if (o) throw new Error('이미 신청한 「' + cmap[e.courseId].name + '」 강좌와 시간이 겹칩니다 (' + o.join('·') + ').');
  });
  var cnt = courseCounts_(db.enroll)[c.id] || {};
  var taken = (cnt['선정'] || 0) + (cnt['신청'] || 0);
  var status = '신청', wait = '', msg = '신청했습니다. 선발 결과는 마감 후 안내됩니다.';
  if (s.method === '선착순') {
    if (taken < c.capNum) { status = '선정'; msg = '선착순 접수가 완료되었습니다. (선정)'; }
    else { status = '대기'; wait = String((cnt['대기'] || 0) + 1); msg = '정원이 다 차서 대기 ' + wait + '번으로 접수했습니다.'; }
  }
  var old = null;
  db.enroll.some(function (e) { if (e.sid === st.sid && e.courseId === c.id && e.status === '취소') { old = e; return true; } return false; });
  var stamp = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm:ss.SSS");
  if (old) {
    old.status = status; old.source = '학생'; old.time = stamp; old.wait = wait; old.name = st.name;
    updateRows_(SH.ENROLL, [old]);
  } else {
    appendRows_(SH.ENROLL, [{ id: newId_('E'), courseId: c.id, sid: st.sid, name: st.name, status: status, source: '학생', time: stamp, wait: wait, note: '' }]);
  }
  log_(ctx, '학생 신청', c.name, status + (wait ? ' ' + wait + '번' : ''));
  var res = actStuState_(d, ctx);
  res.msg = msg;
  return res;
}

function actStuCancel_(d, ctx) {
  var s = ctx.s, st = ctx.st, win = applyWindow_(s);
  if (!win.open) throw new Error('신청 기간에만 취소할 수 있습니다. 담당 선생님께 문의하세요.');
  var all = readTable_(SH.ENROLL), target = null;
  all.some(function (e) { if (e.sid === st.sid && e.courseId === d.courseId && ACTIVE[e.status]) { target = e; return true; } return false; });
  if (!target) throw new Error('신청 내역이 없습니다.');
  var wasSelected = target.status === '선정';
  target.status = '취소'; target.wait = '';
  var changed = [target];
  if (s.method === '선착순' && wasSelected) changed = changed.concat(promoteIn_(all, d.courseId, 1));
  updateRows_(SH.ENROLL, changed);
  log_(ctx, '학생 취소', d.courseId, '');
  var res = actStuState_(d, ctx);
  res.msg = '신청을 취소했습니다.';
  return res;
}

/* ───────────── 교사·관리자 ───────────── */

function publicCourse_(c, cnt) {
  cnt = cnt || {};
  var o = {};
  SCHEMA[SH.COURSES].forEach(function (k) { o[k[0]] = c[k[0]]; });
  o.dayList = c.dayList; o.gradeList = c.gradeList; o.s = c.s; o.e = c.e; o.d1 = c.d1; o.d2 = c.d2;
  o.capNum = c.capNum; o.minNum = c.minNum; o.feeNum = c.feeNum; o.materialNum = c.materialNum;
  o.selected = cnt['선정'] || 0; o.applied = cnt['신청'] || 0; o.waiting = cnt['대기'] || 0;
  o.active = o.selected + o.applied;
  return o;
}

function actState_(d, ctx) {
  var s = ctx.s || readSettings_(), db = loadAll_(s);
  var counts = courseCounts_(db.enroll);
  var settings = {};
  Object.keys(s).forEach(function (k) { if (k !== 'adminPw' && k !== 'teacherPw') settings[k] = s[k]; });
  var res = {
    me: { role: ctx.role, name: ctx.name },
    settings: settings, labels: labels_(s), today: today_(),
    slots: db.slots, rooms: db.rooms, holidays: db.holidays, teachers: db.teachers,
    students: db.students.map(function (st) { return { sid: st.sid, grade: st.grade, cls: st.cls, no: st.no, name: st.name }; }),
    courses: db.courses.map(function (c) { return publicCourse_(c, counts[c.id]); }),
    enroll: db.enroll.filter(function (e) { return e.status !== '취소'; }),
    changes: db.changes,
    review: buildReview_(db, s),
    webUrl: webUrl_() || s.webUrl,
    links: links_(s),
    cycle: currentCycleInfo_(s),
    appVersion: APP_VERSION
  };
  if (ctx.role === 'admin') {
    res.presetSlots = presetSlots_(s.level);
    res.update = { current: APP_VERSION, latest: s.latestVersion || '', newer: isNewer_(s.latestVersion, APP_VERSION) };
    res.sheetUrl = ss_().getUrl();
    res.missingCodes = db.students.filter(function (st) { return !st.code; }).length;
    res.pwSet = { admin: !!s.adminPw, teacher: !!s.teacherPw };
  }
  return res;
}

function withState_(ctx, extra) {
  var r = { state: actState_({}, ctx) };
  Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
  return r;
}

function canEditRoster_(ctx, course) {
  if (ctx.role === 'admin') return;
  if (course.teacher !== ctx.name) throw new Error('본인이 담당하는 강좌만 수정할 수 있습니다.');
  if (ctx.s.stage === '운영중') throw new Error('수강이 확정된 뒤에는 관리자만 명단을 바꿀 수 있습니다.');
}

function findCourse_(id) {
  var c = null;
  readTable_(SH.COURSES).some(function (x) { if (x.id === id) { c = x; return true; } return false; });
  if (!c) throw new Error('강좌를 찾을 수 없습니다.');
  return c;
}

function actSaveCourse_(d, ctx) {
  var s = ctx.s, maxGrade = labels_(s).grades, c = d.course || {};
  var name = String(c.name || '').trim();
  if (!name) throw new Error('강좌명을 입력하세요.');
  var days = normDays_(c.days);
  if (!days.length) throw new Error('요일을 하나 이상 고르세요.');
  var st = normTime_(c.start), et = normTime_(c.end);
  if (!st || !et || st >= et) throw new Error('시작·종료 시각을 확인하세요. (예: 15:40 ~ 16:25)');
  var d1 = normDate_(c.startDate) || normDate_(s.opStart), d2 = normDate_(c.endDate) || normDate_(s.opEnd);
  if (!d1 || !d2 || d1 > d2) throw new Error('운영 기간(시작일·종료일)을 확인하세요.');
  var cap = int_(c.cap);
  if (cap <= 0) throw new Error('정원을 1명 이상으로 입력하세요.');
  var grades = normGrades_(c.grades, maxGrade);
  if (!grades.length) throw new Error('대상 학년을 고르세요.');

  var all = readTable_(SH.COURSES), existing = null, everyCycle = readTable_(SH.COURSES, true);
  if (c.id) all.some(function (x) { if (x.id === c.id) { existing = x; return true; } return false; });
  if (c.id && !existing) throw new Error('강좌를 찾을 수 없습니다. 새로고침 후 다시 시도하세요.');
  var teacher = String(c.teacher || '').trim();
  if (ctx.role === 'teacher') {
    if (existing && existing.teacher !== ctx.name) throw new Error('본인이 담당하는 강좌만 수정할 수 있습니다.');
    if (existing && (existing.status === '승인' || existing.status === '폐강')) throw new Error('승인된 강좌는 관리자에게 수정을 요청하세요.');
    teacher = ctx.name;
  }
  if (!teacher) throw new Error('담당자를 고르세요.');

  var o = existing || { id: nextCourseId_(everyCycle) };
  o.name = name; o.area = String(c.area || '').trim(); o.teacher = teacher;
  o.grades = grades.length === maxGrade ? '전체' : grades.join(',');
  o.days = days.join(','); o.start = st; o.end = et; o.startDate = d1; o.endDate = d2;
  o.room = String(c.room || '').trim(); o.cap = String(cap); o.min = String(int_(c.min) || '');
  o.fee = String(int_(c.fee) || ''); o.material = String(int_(c.material) || '');
  o.desc = String(c.desc || '').trim(); o.updated = nowStr_();
  if (!existing) o.status = ctx.role === 'admin' ? '승인' : (d.submit ? '제출' : '작성중');
  else if (ctx.role === 'teacher') o.status = d.submit ? '제출' : (existing.status === '반려' ? '작성중' : existing.status);
  if (o.status !== '반려') o.reason = o.reason && ctx.role === 'admin' ? o.reason : '';

  if (existing) updateRows_(SH.COURSES, [o]); else appendRows_(SH.COURSES, [o]);
  log_(ctx, existing ? '강좌 수정' : '강좌 등록', o.id + ' ' + o.name, o.status);

  var prepped = prepCourse_(o, s, maxGrade), warnings = [];
  all.forEach(function (x) {
    if (x.id === o.id || x.status === '폐강' || x.status === '반려') return;
    var px = prepCourse_(x, s, maxGrade), ov = coursesOverlap_(prepped, px);
    if (!ov) return;
    if (px.room && px.room === prepped.room) warnings.push('장소 겹침: 「' + px.name + '」도 ' + ov.join('·') + ' 같은 시간에 ' + px.room + '을(를) 씁니다.');
    if (px.teacher === prepped.teacher) warnings.push('담당 겹침: ' + px.teacher + '님이 「' + px.name + '」와 시간이 겹칩니다.');
  });
  return withState_(ctx, { msg: o.status === '제출' ? '저장하고 승인을 요청했습니다.' : '저장했습니다.', warnings: warnings, id: o.id });
}

function actCourseStatus_(d, ctx) {
  var c = findCourse_(d.id), to = d.status;
  if (COURSE_STATUS.indexOf(to) < 0) throw new Error('잘못된 상태입니다.');
  if (ctx.role === 'teacher') {
    if (c.teacher !== ctx.name) throw new Error('본인 강좌만 바꿀 수 있습니다.');
    if (['작성중', '제출'].indexOf(to) < 0 || ['작성중', '제출', '반려'].indexOf(c.status) < 0) throw new Error('승인·반려·폐강은 관리자만 할 수 있습니다.');
  }
  var from = c.status;
  c.status = to; c.reason = to === '반려' ? String(d.reason || '') : (to === '폐강' ? String(d.reason || '') : '');
  c.updated = nowStr_();
  updateRows_(SH.COURSES, [c]);
  log_(ctx, '강좌 상태', c.id + ' ' + c.name, from + ' → ' + to + (d.reason ? ' (' + d.reason + ')' : ''));
  return withState_(ctx, { msg: '「' + c.name + '」 → ' + to });
}

function actDeleteCourse_(d, ctx) {
  var c = findCourse_(d.id);
  if (ctx.role === 'teacher') {
    if (c.teacher !== ctx.name) throw new Error('본인 강좌만 지울 수 있습니다.');
    if (['작성중', '반려', '제출'].indexOf(c.status) < 0) throw new Error('승인된 강좌는 관리자만 지울 수 있습니다.');
  }
  var en = readTable_(SH.ENROLL).filter(function (e) { return e.courseId === c.id && ACTIVE[e.status]; });
  if (en.length && !d.force) throw new Error('이 강좌에 신청한 학생이 ' + en.length + '명 있습니다. 그래도 지우려면 다시 확인하세요.|FORCE');
  en.forEach(function (e) { e.status = '취소'; e.note = (e.note ? e.note + ' / ' : '') + '강좌 삭제'; });
  updateRows_(SH.ENROLL, en);
  deleteRow_(SH.COURSES, c._row);
  log_(ctx, '강좌 삭제', c.id + ' ' + c.name, en.length ? '신청 ' + en.length + '건 취소' : '');
  return withState_(ctx, { msg: '강좌를 지웠습니다.' });
}

function actRosterParse_(d, ctx) {
  var s = ctx.s, db = loadAll_(s);
  var c = null;
  db.courses.some(function (x) { if (x.id === d.courseId) { c = x; return true; } return false; });
  if (!c) throw new Error('강좌를 먼저 고르세요.');
  var rows = parseRoster_(String(d.text || ''), db.students);
  var cmap = {};
  db.courses.forEach(function (x) { cmap[x.id] = x; });
  var bySid = {};
  db.enroll.forEach(function (e) { if (ACTIVE[e.status]) (bySid[e.sid] = bySid[e.sid] || []).push(e); });
  rows.forEach(function (r) {
    if (!r.sid) return;
    var mine = bySid[r.sid] || [];
    if (mine.some(function (e) { return e.courseId === c.id; })) { r.already = true; return; }
    var st = null;
    db.students.some(function (x) { if (x.sid === r.sid) { st = x; return true; } return false; });
    if (st && c.gradeList.indexOf(st.grade) < 0) r.warn = '대상 학년 아님';
    mine.forEach(function (e) {
      var o = cmap[e.courseId] && cmap[e.courseId].status !== '폐강' && coursesOverlap_(c, cmap[e.courseId]);
      if (o) r.conflict = (r.conflict ? r.conflict + ', ' : '') + cmap[e.courseId].name + '(' + o.join('·') + ')';
    });
  });
  return { rows: rows };
}

function actRosterAdd_(d, ctx) {
  var c = findCourse_(d.courseId);
  canEditRoster_(ctx, c);
  var status = ENROLL_STATUS.indexOf(d.status) >= 0 && d.status !== '취소' ? d.status : '선정';
  var students = readStudents_(), smap = {};
  students.forEach(function (st) { smap[st.sid] = st; });
  var all = readTable_(SH.ENROLL), add = [], upd = [], skipped = 0;
  var stamp = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss.SSS');
  (d.sids || []).forEach(function (sid) {
    var st = smap[sid];
    if (!st) { skipped++; return; }
    var ex = all.filter(function (e) { return e.sid === sid && e.courseId === c.id; });
    if (ex.some(function (e) { return ACTIVE[e.status]; })) { skipped++; return; }
    var src = ctx.role === 'admin' ? '관리자' : '교사';
    if (ex.length) { var e = ex[0]; e.status = status; e.source = src; e.time = stamp; e.wait = ''; e.name = st.name; upd.push(e); }
    else add.push({ id: newId_('E'), courseId: c.id, sid: sid, name: st.name, status: status, source: src, time: stamp, wait: '', note: '' });
  });
  updateRows_(SH.ENROLL, upd);
  appendRows_(SH.ENROLL, add);
  var n = add.length + upd.length;
  if (n) log_(ctx, '명단 추가', c.id + ' ' + c.name, n + '명 (' + status + ')');
  return withState_(ctx, { msg: n + '명을 추가했습니다.' + (skipped ? ' (이미 있거나 찾을 수 없는 ' + skipped + '명 제외)' : '') });
}

function actEnrollStatus_(d, ctx) {
  var status = d.status;
  if (ENROLL_STATUS.indexOf(status) < 0) throw new Error('잘못된 상태입니다.');
  var ids = d.ids || [], all = readTable_(SH.ENROLL), courses = {}, changed = [];
  readTable_(SH.COURSES).forEach(function (c) { courses[c.id] = c; });
  all.forEach(function (e) {
    if (ids.indexOf(e.id) < 0) return;
    canEditRoster_(ctx, courses[e.courseId] || { teacher: '' });
    e.status = status;
    if (status !== '대기') e.wait = '';
    if (d.note) e.note = d.note;
    changed.push(e);
  });
  if (status === '대기') {
    // 대기 번호는 강좌마다 뒤에 이어 붙입니다.
    changed.forEach(function (e) {
      var maxW = 0;
      all.forEach(function (x) { if (x.courseId === e.courseId && x.status === '대기' && x !== e) maxW = Math.max(maxW, int_(x.wait)); });
      if (!int_(e.wait)) e.wait = String(maxW + 1);
    });
  }
  updateRows_(SH.ENROLL, changed);
  if (changed.length) {
    var names = changed.slice(0, 5).map(function (e) { return e.name; }).join(', ') + (changed.length > 5 ? ' 외 ' + (changed.length - 5) + '명' : '');
    log_(ctx, '명단 상태 → ' + status, (courses[changed[0].courseId] || {}).name || '', names + (d.note ? ' / 사유: ' + d.note : ''));
  }
  return withState_(ctx, { msg: changed.length + '명을 「' + status + '」(으)로 바꿨습니다.' });
}

function actSaveChange_(d, ctx) {
  var x = d.change || {}, c = findCourse_(x.courseId);
  if (ctx.role === 'teacher' && c.teacher !== ctx.name) throw new Error('본인 강좌만 일정을 바꿀 수 있습니다.');
  var date = normDate_(x.date);
  if (!date) throw new Error('날짜를 확인하세요.');
  if (CHANGE_TYPES.indexOf(x.type) < 0) throw new Error('유형을 고르세요.');
  var st = normTime_(x.start), et = normTime_(x.end);
  if (x.type === '장소변경' && !String(x.room || '').trim()) throw new Error('바뀐 장소를 입력하세요.');
  if (x.type === '시간변경' && (!st || !et)) throw new Error('바뀐 시각을 입력하세요.');
  if ((st || et) && !(st && et && st < et)) throw new Error('시작·종료 시각을 확인하세요.');
  var o = { id: newId_('X'), date: date, courseId: c.id, type: x.type, room: String(x.room || '').trim(), start: st, end: et, reason: String(x.reason || '').trim(), by: ctx.name, at: nowStr_() };
  appendRows_(SH.CHANGES, [o]);
  log_(ctx, '일정 변경', c.name, date + ' ' + x.type + (o.room ? ' ' + o.room : '') + (o.reason ? ' (' + o.reason + ')' : ''));
  return withState_(ctx, { msg: date + ' ' + x.type + '을(를) 등록했습니다.' });
}

function actDeleteChange_(d, ctx) {
  var x = null;
  readTable_(SH.CHANGES).some(function (r) { if (r.id === d.id) { x = r; return true; } return false; });
  if (!x) throw new Error('항목을 찾을 수 없습니다.');
  var c = findCourse_(x.courseId);
  if (ctx.role === 'teacher' && c.teacher !== ctx.name) throw new Error('본인 강좌만 지울 수 있습니다.');
  deleteRow_(SH.CHANGES, x._row);
  log_(ctx, '일정 변경 삭제', c.name, x.date + ' ' + x.type);
  return withState_(ctx, { msg: '지웠습니다.' });
}

function actSessions_(d, ctx) {
  var s = ctx.s, db = loadAll_(s), c = null;
  db.courses.some(function (x) { if (x.id === d.courseId) { c = x; return true; } return false; });
  if (!c) throw new Error('강좌를 찾을 수 없습니다.');
  return { sessions: sessionsOfCourse_(c, db.holidayMap, db.changes) };
}

function actSaveSettings_(d, ctx) {
  var x = d.settings || {}, out = {};
  var allowed = ['schoolName', 'level', 'year', 'term', 'programName', 'teacherLabel', 'dept', 'manager', 'phone', 'opStart', 'opEnd', 'applyStart', 'applyEnd', 'method', 'maxCount', 'feeUse', 'feeUnit'];
  allowed.forEach(function (k) { if (k in x) out[k] = String(x[k] == null ? '' : x[k]).trim(); });
  if (out.level && !LEVELS[out.level]) throw new Error('학교급을 고르세요.');
  if (out.method && ['선착순', '추첨', '담당자선정'].indexOf(out.method) < 0) throw new Error('선발방식을 고르세요.');
  ['opStart', 'opEnd'].forEach(function (k) { if (out[k]) { var v = normDate_(out[k]); if (!v) throw new Error('날짜 형식을 확인하세요: ' + out[k]); out[k] = v; } });
  ['applyStart', 'applyEnd'].forEach(function (k) { if (out[k]) { var v = normDateTime_(out[k], k === 'applyStart' ? '00:00' : '23:59'); if (!v) throw new Error('날짜·시각 형식을 확인하세요: ' + out[k]); out[k] = v; } });
  if (x.adminPw) { if (String(x.adminPw).length < 4) throw new Error('비밀번호는 4자 이상으로 정하세요.'); out.adminPw = String(x.adminPw); }
  if (x.teacherPw) { if (String(x.teacherPw).length < 4) throw new Error('비밀번호는 4자 이상으로 정하세요.'); out.teacherPw = String(x.teacherPw); }
  writeSettings_(out);
  log_(ctx, '설정 변경', '', Object.keys(out).map(function (k) { return /Pw$/.test(k) ? k + '=(변경)' : k + '=' + out[k]; }).join(', '));
  ctx.s = readSettings_();
  return withState_(ctx, { msg: '설정을 저장했습니다.' + (x.adminPw ? ' 관리자 비밀번호가 바뀌었으니 다시 로그인하세요.' : ''), relogin: !!x.adminPw });
}

function actSaveSlots_(d, ctx) {
  var list = cleanSlots_(d.slots);
  if (!list.length) throw new Error('시간대를 하나 이상 넣으세요.');
  replaceData_(SH.SLOTS, list);
  log_(ctx, '시간대 변경', '', list.map(function (x) { return x.name + ' ' + x.start + '~' + x.end; }).join(', '));
  return withState_(ctx, { msg: '시간대를 저장했습니다. 이미 등록된 강좌의 시각은 바뀌지 않습니다.' });
}

function actShorten_(d, ctx) {
  if (d.clear) {
    writeSettings_({ shortApply: '', shortBoard: '', shortAdmin: '', shortBase: '' });
    log_(ctx, '짧은 주소 지움', '', '');
    ctx.s = readSettings_();
    return withState_(ctx, { msg: '짧은 주소를 지웠습니다. QR코드에는 원래 주소가 들어갑니다.' });
  }
  var out = shortenAll_(ctx.s);
  log_(ctx, '짧은 주소 만듦', '', out.shortApply + ' / ' + out.shortBoard + ' / ' + out.shortAdmin);
  ctx.s = readSettings_();
  return withState_(ctx, { msg: '짧은 주소를 만들었습니다. 학생 신청: ' + out.shortApply });
}

function actSetStage_(d, ctx) {
  var to = d.stage, s = ctx.s;
  if (STAGES.indexOf(to) < 0) throw new Error('잘못된 단계입니다.');
  var db = loadAll_(s);
  if (to === '신청접수') {
    if (!db.courses.some(function (c) { return c.status === '승인'; })) throw new Error('승인된 강좌가 없습니다. 강좌를 먼저 승인하세요.');
    var noCode = db.students.filter(function (st) { return !st.code; }).length;
    if (noCode && !d.force) throw new Error('확인코드가 없는 학생이 ' + noCode + '명 있습니다. 이 학생들은 온라인 신청을 할 수 없습니다.|FORCE');
  }
  if (to === '운영중' && !d.force) {
    var rv = buildReview_(db, s), issues = [];
    if (rv.conflicts.length) issues.push('시간 충돌 ' + rv.conflicts.length + '건');
    var pending = db.enroll.filter(function (e) { return e.status === '신청'; }).length;
    if (pending) issues.push('아직 선발하지 않은 신청 ' + pending + '건');
    if (rv.over.length) issues.push('정원 초과 강좌 ' + rv.over.length + '개');
    if (issues.length) throw new Error('확정 전에 확인할 것이 있습니다: ' + issues.join(', ') + '.|FORCE');
  }
  var from = s.stage;
  writeSettings_({ stage: to });
  log_(ctx, '진행 단계', '', from + ' → ' + to);
  ctx.s = readSettings_();
  return withState_(ctx, { msg: '진행 단계를 「' + to + '」(으)로 바꿨습니다.' });
}

function promoteIn_(all, courseId, seats) {
  var waiting = all.filter(function (e) { return e.courseId === courseId && e.status === '대기'; })
    .sort(function (a, b) { return (int_(a.wait) || 9999) - (int_(b.wait) || 9999) || (a.time < b.time ? -1 : 1); });
  var moved = waiting.slice(0, Math.max(0, seats));
  moved.forEach(function (e) { e.status = '선정'; e.wait = ''; e.note = (e.note ? e.note + ' / ' : '') + '대기→선정 ' + nowStr_().slice(5, 16); });
  // 남은 대기 번호를 1번부터 다시 매깁니다.
  var rest = waiting.slice(moved.length);
  rest.forEach(function (e, i) { e.wait = String(i + 1); });
  return moved.concat(rest);
}

function actRunSelection_(d, ctx) {
  var s = ctx.s, method = s.method, all = readTable_(SH.ENROLL);
  var courses = readTable_(SH.COURSES).filter(function (c) { return c.status === '승인' && (!d.courseId || c.id === d.courseId); });
  var changed = [], sel = 0, wait = 0, manual = [];
  courses.forEach(function (c) {
    var cap = int_(c.cap);
    var mine = all.filter(function (e) { return e.courseId === c.id; });
    var applied = mine.filter(function (e) { return e.status === '신청'; });
    if (!applied.length) return;
    var seats = Math.max(0, cap - mine.filter(function (e) { return e.status === '선정'; }).length);
    var picked, rest;
    if (applied.length <= seats) { picked = applied; rest = []; }
    else if (method === '추첨') { var sh = shuffle_(applied.slice()); picked = sh.slice(0, seats); rest = sh.slice(seats); }
    else if (method === '선착순') {
      var so = applied.slice().sort(function (a, b) { return a.time < b.time ? -1 : 1; });
      picked = so.slice(0, seats); rest = so.slice(seats);
    } else { manual.push(c.name + '(' + applied.length + '/' + seats + '석)'); return; }
    var w0 = 0;
    mine.forEach(function (e) { if (e.status === '대기') w0 = Math.max(w0, int_(e.wait)); });
    picked.forEach(function (e) { e.status = '선정'; e.wait = ''; changed.push(e); sel++; });
    rest.forEach(function (e, i) { e.status = '대기'; e.wait = String(w0 + i + 1); changed.push(e); wait++; });
  });
  updateRows_(SH.ENROLL, changed);
  var msg = '선발 완료 (' + method + '): 선정 ' + sel + '명, 대기 ' + wait + '명.';
  if (manual.length) msg += ' 정원을 넘어 직접 선정이 필요한 강좌: ' + manual.join(', ');
  log_(ctx, '선발 실행', d.courseId || '전체', msg);
  return withState_(ctx, { msg: msg });
}

function actPromote_(d, ctx) {
  var c = findCourse_(d.courseId), all = readTable_(SH.ENROLL);
  var selected = all.filter(function (e) { return e.courseId === c.id && e.status === '선정'; }).length;
  var seats = int_(c.cap) - selected;
  if (seats <= 0) throw new Error('빈 자리가 없습니다. (정원 ' + c.cap + '명, 선정 ' + selected + '명)');
  var changed = promoteIn_(all, c.id, seats);
  var moved = changed.filter(function (e) { return e.status === '선정'; });
  if (!moved.length) throw new Error('대기자가 없습니다.');
  updateRows_(SH.ENROLL, changed);
  log_(ctx, '대기자 승격', c.name, moved.map(function (e) { return e.name; }).join(', '));
  return withState_(ctx, { msg: moved.length + '명을 선정으로 올렸습니다: ' + moved.map(function (e) { return e.name; }).join(', ') });
}

function actCodes_(d) {
  var g = int_(d.grade), c = int_(d.cls);
  return {
    students: readStudents_().filter(function (st) { return (!g || st.grade === g) && (!c || st.cls === c); })
      .map(function (st) { return { sid: st.sid, grade: st.grade, cls: st.cls, no: st.no, name: st.name, code: st.code }; })
  };
}

function actGenCodes_(d, ctx) {
  var n = fillCodes_();
  log_(ctx, '확인코드 생성', '', n + '명');
  return withState_(ctx, { msg: n + '명에게 확인코드를 만들었습니다.' });
}

function fillCodes_() {
  var sh = sheet_(SH.STUDENTS), last = sh.getLastRow();
  if (last < 2) return 0;
  var range = sh.getRange(2, 1, last - 1, SCHEMA[SH.STUDENTS].length), vals = range.getDisplayValues(), n = 0;
  vals.forEach(function (r) {
    if (String(r[3]).trim() && !String(r[4]).trim()) { r[4] = String(1000 + Math.floor(Math.random() * 9000)); n++; }
  });
  if (n) range.setNumberFormat('@').setValues(vals);
  return n;
}

function actLogs_() {
  var rows = readTable_(SH.LOG);
  return { logs: rows.slice(-400).reverse() };
}

/* ───────────── 공용 도우미 ───────────── */

function courseCounts_(enroll) {
  var m = {};
  enroll.forEach(function (e) {
    var c = m[e.courseId] = m[e.courseId] || {};
    c[e.status] = (c[e.status] || 0) + 1;
  });
  return m;
}

function nextCourseId_(all) {
  var max = 0;
  all.forEach(function (c) { var m = /^C(\d+)$/.exec(c.id); if (m) max = Math.max(max, Number(m[1])); });
  return 'C' + ('00' + (max + 1)).slice(-3);
}

function newId_(prefix) {
  return prefix + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + Utilities.getUuid().replace(/-/g, '').slice(0, 6);
}
