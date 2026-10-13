/**
 * 방과후 한눈에 — 시트 메뉴 · 처음 설정 · 시트 안 사용설명서 · 예시 데이터
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🏫 방과후 관리')
    .addItem('① 처음 설정하기 (학교 정보)', 'menuSetup')
    .addItem('② 접속 주소·QR 보기', 'menuLinks')
    .addSeparator()
    .addItem('학생 확인코드 만들기 (빈 칸만)', 'menuGenCodes')
    .addItem('입력 내용 점검하기', 'menuCheck')
    .addItem('새 주기 시작 안내 (기록 보관)', 'menuNewCycle')
    .addSeparator()
    .addItem('업데이트 확인·설치', 'menuUpdate')
    .addItem('업데이트 가능 여부 점검', 'menuUpdateDiagnose')
    .addSeparator()
    .addItem('예시 데이터로 체험하기', 'menuSample')
    .addItem('사용설명서 탭 다시 만들기', 'menuManual')
    .addItem('[배포자용] 빈 템플릿으로 만들기', 'menuTemplate')
    .addToUi();
  // 시트를 열 때: 새 열·탭 자동 보정, 새 버전이 확인돼 있으면 알림
  try {
    ensureSchema_();
    var s = readSettings_();
    if (isNewer_(s.latestVersion, APP_VERSION)) {
      SpreadsheetApp.getActive().toast('새 버전 v' + s.latestVersion + '이(가) 있습니다. 메뉴 [🏫 방과후 관리] → [업데이트 확인·설치]를 누르세요.', '방과후 한눈에 업데이트', 15);
    }
  } catch (e) { /* 처음 설정 전에는 조용히 넘어감 */ }
}

/* ───────────── 메뉴 동작 ───────────── */

/**
 * 시트 메뉴·설정 창에서만 실행되게 막습니다.
 * (웹앱 화면에서 google.script.run으로 이 함수들을 직접 부르는 것을 차단)
 */
function requireSheet_() {
  try { return SpreadsheetApp.getUi(); } catch (e) { throw new Error('구글 시트 메뉴에서만 실행할 수 있습니다.'); }
}

function menuSetup() {
  requireSheet_();
  ensureSheets_();
  var html = HtmlService.createTemplateFromFile('SetupDialog');
  var s = readSettings_();
  html.currentJson = JSON.stringify({
    schoolName: s.schoolName, level: s.level, year: s.year || Utilities.formatDate(new Date(), TZ, 'yyyy'), term: s.term,
    dept: s.dept, manager: s.manager, phone: s.phone, opStart: s.opStart, opEnd: s.opEnd,
    feeUse: s.feeUse, method: s.method, maxCount: s.maxCount, hasAdminPw: !!s.adminPw, hasTeacherPw: !!s.teacherPw,
    slots: readTable_(SH.SLOTS).map(function (x) { return { name: x.name, start: normTime_(x.start), end: normTime_(x.end) }; }),
    presets: { '초등학교': presetSlots_('초등학교'), '중학교': presetSlots_('중학교'), '고등학교': presetSlots_('고등학교') }
  }).replace(/</g, '\\u003c');
  SpreadsheetApp.getUi().showModalDialog(html.evaluate().setWidth(560).setHeight(680), '① 처음 설정하기');
}

/** 설정 창에서 부르는 함수 */
function setupSchool(f) {
  requireSheet_();
  ensureSheets_();
  ensureSchema_();
  if (!LEVELS[f.level]) throw new Error('학교급을 고르세요.');
  if (!String(f.schoolName || '').trim()) throw new Error('학교명을 입력하세요.');
  var cur = readSettings_();
  if (!cur.adminPw && String(f.adminPw || '').length < 4) throw new Error('관리자 비밀번호를 4자 이상으로 정하세요.');
  if (!cur.teacherPw && String(f.teacherPw || '').length < 4) throw new Error('교사 비밀번호를 4자 이상으로 정하세요.');
  var out = {
    schoolName: String(f.schoolName).trim(), level: f.level, year: String(f.year || '').trim(), term: String(f.term || '').trim(),
    dept: f.dept || '', manager: f.manager || '', phone: f.phone || '',
    opStart: normDate_(f.opStart), opEnd: normDate_(f.opEnd),
    feeUse: f.feeUse === '사용' ? '사용' : '사용안함', method: f.method || '추첨', maxCount: String(int_(f.maxCount))
  };
  if (f.adminPw) out.adminPw = String(f.adminPw);
  if (f.teacherPw) out.teacherPw = String(f.teacherPw);
  writeSettings_(out);

  var lv = LEVELS[f.level], msgs = [];
  var slots = cleanSlots_(f.slots);
  if (slots.length) {
    replaceData_(SH.SLOTS, slots);
    msgs.push('시간대 ' + slots.length + '개를 저장했습니다: ' + slots.map(function (x) { return x.name; }).join(', '));
  } else if (readTable_(SH.SLOTS).length === 0) {
    replaceData_(SH.SLOTS, presetSlots_(f.level));
    msgs.push('[시간대] 탭에 ' + f.level + ' 예시 시간대를 넣었습니다. 언제든 바꿀 수 있습니다.');
  }
  if (readTable_(SH.ROOMS).length === 0) {
    replaceData_(SH.ROOMS, lv.rooms.map(function (r) { return { name: r, capacity: '', note: '' }; }));
    msgs.push('[장소] 탭에 예시 장소를 넣었습니다. 학교에 맞게 고치세요.');
  }
  if (readTable_(SH.HOLIDAYS).length === 0 && out.year) {
    var hs = holidaysOf_(int_(out.year));
    if (hs.length) { replaceData_(SH.HOLIDAYS, hs); msgs.push('[휴일] 탭에 ' + out.year + '년 공휴일을 넣었습니다. 재량휴업일·시험 기간을 더하세요.'); }
  }
  if (f.sample) { loadSample_(f.level); msgs.push('예시 학생·교사·강좌·신청 데이터를 넣었습니다.'); }
  log_({ role: 'admin', name: '관리자(시트)' }, '처음 설정', out.schoolName, f.level);
  return msgs;
}

function menuLinks() {
  var ui = requireSheet_(), L = links_(readSettings_());
  if (!L.base) {
    ui.alert('아직 웹앱이 배포되지 않았습니다',
      '[확장 프로그램] → [Apps Script] → 오른쪽 위 [배포] → [새 배포] → 유형 [웹 앱]\n' +
      '· 다음 사용자 인증 정보로 실행: 나\n· 액세스 권한이 있는 사용자: 모든 사용자\n\n' +
      '배포 후 나오는 웹 앱 URL을 [설정] 탭의 \'웹앱주소\' 칸에 붙여넣으면 이 메뉴에서 주소와 QR코드를 볼 수 있습니다.\n' +
      '(사용설명서 탭 4단계 참고)', ui.ButtonSet.OK);
    return;
  }
  var t = HtmlService.createTemplateFromFile('LinksDialog');
  t.linksJson = JSON.stringify(L).replace(/</g, '\\u003c');
  ui.showModalDialog(t.evaluate().setWidth(760).setHeight(560), '② 접속 주소·QR');
}

/** 접속 주소·QR 창의 [짧은 주소 만들기] / [짧은 주소 지우기] */
function menuShorten(clear) {
  requireSheet_();
  if (clear) writeSettings_({ shortApply: '', shortBoard: '', shortAdmin: '', shortBase: '' });
  else shortenAll_(readSettings_());
  log_({ role: 'admin', name: '관리자(시트)' }, clear ? '짧은 주소 지움' : '짧은 주소 만듦', '', '');
  return links_(readSettings_());
}

function menuGenCodes() {
  var ui = requireSheet_();
  ensureSheets_();
  var n = fillCodes_();
  ui.alert(n ? n + '명에게 4자리 확인코드를 만들었습니다.\n관리자 화면 [출력] → [확인코드 안내 쪽지]로 반별 인쇄할 수 있습니다.' : '확인코드가 비어 있는 학생이 없습니다.');
}

function menuCheck() {
  requireSheet_();
  ensureSheets_();
  var s = readSettings_(), db = loadAll_(s), p = [];
  if (!labels_(s).configured) p.push('· [설정] 학교명·학교급이 비어 있습니다. ① 처음 설정하기를 실행하세요.');
  if (!s.adminPw || !s.teacherPw) p.push('· [설정] 관리자/교사 비밀번호를 정하세요.');
  if (!normDate_(s.opStart) || !normDate_(s.opEnd)) p.push('· [설정] 운영시작일·운영종료일을 넣으면 강좌 기간 기본값으로 쓰입니다.');
  var raw = readTable_(SH.STUDENTS);
  if (raw.length !== db.students.length) p.push('· [학생] 학년·반·번호·이름 중 빈 칸이 있는 줄이 ' + (raw.length - db.students.length) + '개 있습니다.');
  var seen = {}, dup = [];
  db.students.forEach(function (st) { if (seen[st.sid]) dup.push(st.sid); seen[st.sid] = true; });
  if (dup.length) p.push('· [학생] 학년·반·번호가 겹치는 학생: ' + dup.slice(0, 10).join(', '));
  var noCode = db.students.filter(function (st) { return !st.code; }).length;
  if (noCode) p.push('· [학생] 확인코드가 없는 학생 ' + noCode + '명 → 메뉴 [학생 확인코드 만들기]');
  if (!db.teachers.length) p.push('· [교사] 명단이 비어 있습니다. 교사는 이 명단의 이름으로 로그인합니다.');
  var tnames = {};
  db.teachers.forEach(function (t) { tnames[t.name] = true; });
  db.courses.forEach(function (c) {
    var w = [];
    if (!c.dayList.length) w.push('요일');
    if (!c.s || !c.e || c.s >= c.e) w.push('시각');
    if (!c.capNum) w.push('정원');
    if (c.teacher && !tnames[c.teacher]) w.push('담당자(교사 명단에 없음)');
    if (w.length) p.push('· [강좌] ' + c.id + ' ' + c.name + ': ' + w.join(', ') + ' 확인');
  });
  db.slots.forEach(function (x) { if (!x.start || !x.end) p.push('· [시간대] ' + x.name + ' 시각 형식 확인 (예: 15:40)'); });
  SpreadsheetApp.getUi().alert('입력 내용 점검', p.length ? p.join('\n') : '문제가 없습니다. 👍', SpreadsheetApp.getUi().ButtonSet.OK);
}

/** 새 주기는 웹 관리자 화면에서 시작합니다. (지난 기록은 지우지 않고 보관) */
function menuNewCycle() {
  var ui = requireSheet_();
  ui.alert('새 주기 시작 (기록 보관)',
    '학기·분기·방학 등 새 운영 주기는 웹 관리자 화면 [주기 관리] → [새 주기 시작]에서 만듭니다.\n\n' +
    '· 지금 주기의 강좌·신청·일정 기록은 지워지지 않고 [주기 관리]에서 언제든 다시 볼 수 있습니다.\n' +
    '· 새 주기를 만든 뒤 [지난 주기에서 불러오기]로 강좌 계획(필요하면 수강생 명단까지)을 그대로 가져와 빠르게 시작할 수 있습니다.\n' +
    '· 학년이 올라가는 새 학년도라면 [학생] 탭을 새 명렬로 바꾼 뒤 시작하세요.\n\n' +
    '관리자 화면 주소는 메뉴 [② 접속 주소·QR 보기]에서 확인합니다.', ui.ButtonSet.OK);
}

function menuSample() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('예시 데이터로 체험하기',
    '[학생] [교사] [강좌] [수강신청] [일정변경] 탭을 예시 데이터로 바꿉니다. 지금 들어 있는 내용은 지워집니다.\n' +
    '체험이 끝나면 메뉴 [[배포자용] 빈 템플릿으로 만들기]로 비울 수 있습니다. 계속할까요?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  ensureSheets_();
  ensureSchema_();
  var s = readSettings_();
  var level = LEVELS[s.level] ? s.level : '중학교';
  if (!s.schoolName) writeSettings_({ schoolName: '예시' + level, level: level, year: Utilities.formatDate(new Date(), TZ, 'yyyy'), term: '2학기' });
  if (!s.adminPw) writeSettings_({ adminPw: 'admin1234' });
  if (!s.teacherPw) writeSettings_({ teacherPw: 'teacher1234' });
  loadSample_(level);
  ui.alert('예시 데이터를 넣었습니다.\n관리자 비밀번호: ' + readSettings_().adminPw + '\n교사 비밀번호: ' + readSettings_().teacherPw + '\n학생 체험: 1학년 1반 1번 / [학생] 탭 첫 줄 이름 / 확인코드 1234');
}

function menuManual() { requireSheet_(); writeManualSheet_(); SpreadsheetApp.getActive().setActiveSheet(sheet_(SH.MANUAL)); }

function menuTemplate() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('[배포자용] 빈 템플릿으로 만들기',
    '설정값(비밀번호 포함)과 모든 데이터를 지우고, 빈 탭과 사용설명서만 남깁니다.\n다른 학교에 /copy 링크로 나눠 주기 직전에 실행하세요. 계속할까요?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  ensureSheets_();
  [SH.SLOTS, SH.ROOMS, SH.HOLIDAYS, SH.STUDENTS, SH.TEACHERS, SH.COURSES, SH.ENROLL, SH.CHANGES, SH.CYCLES, SH.LOG].forEach(function (n) { replaceData_(n, []); });
  var sh = sheet_(SH.SETTINGS);
  sh.clearContents();
  sh.getRange(1, 1, 1, 3).setValues([['항목', '값', '설명']]);
  sh.getRange(2, 1, SETTING_DEFS.length, 3).setNumberFormat('@')
    .setValues(SETTING_DEFS.map(function (d) { return [d[1], d[3], d[2]]; }));
  writeManualSheet_();
  ss_().setActiveSheet(sheet_(SH.MANUAL));
  ss_().moveActiveSheet(1);
  ui.alert('빈 템플릿이 되었습니다.\n공유 → 일반 액세스: 링크가 있는 모든 사용자(뷰어)로 바꾼 뒤,\n주소 끝의 /edit... 부분을 /copy 로 바꿔서 나눠 주세요.');
}

/* ───────────── 시트 만들기 ───────────── */

// 파일을 어떤 순서로 만들어도 동작하도록 다른 파일의 값은 함수 안에서만 씁니다.
function sheetOrder_() {
  return [SH.MANUAL, SH.SETTINGS, SH.STUDENTS, SH.TEACHERS, SH.SLOTS, SH.ROOMS, SH.HOLIDAYS, SH.COURSES, SH.ENROLL, SH.CHANGES, SH.CYCLES, SH.LOG];
}

function sheetColor_(name) {
  if (name === SH.MANUAL || name === SH.SETTINGS) return '#1e5aa8';
  if ([SH.COURSES, SH.ENROLL, SH.CHANGES, SH.CYCLES].indexOf(name) >= 0) return '#b8860b';
  if (name === SH.LOG) return '#888888';
  return '#2e8b57';
}

function ensureSheets_() {
  var ss = ss_(), order = sheetOrder_();
  order.forEach(function (name, idx) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name, idx);
      if (name === SH.MANUAL) { writeManualSheet_(); return; }
      if (name === SH.SETTINGS) {
        sh.getRange(1, 1, 1, 3).setValues([['항목', '값', '설명']]);
        sh.getRange(2, 1, SETTING_DEFS.length, 3).setNumberFormat('@')
          .setValues(SETTING_DEFS.map(function (d) { return [d[1], d[3], d[2]]; }));
        sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 520);
        sh.getRange('B2:B' + (SETTING_DEFS.length + 1)).setBackground('#fffbe6');
        var li = function (key, list) {
          var i = SETTING_DEFS.map(function (d) { return d[0]; }).indexOf(key) + 2;
          sh.getRange(i, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build());
        };
        li('level', Object.keys(LEVELS)); li('stage', STAGES); li('method', ['선착순', '추첨', '담당자선정']); li('feeUse', ['사용', '사용안함']);
      } else {
        var cols = SCHEMA[name];
        sh.getRange(1, 1, 1, cols.length).setValues([cols.map(function (c) { return c[1]; })]);
        sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');
        if (name === SH.COURSES) {
          sh.getRange(2, 17, sh.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(COURSE_STATUS, true).build());
        }
        if (name === SH.ENROLL) {
          sh.getRange(2, 5, sh.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ENROLL_STATUS, true).build());
        }
        if (name === SH.CHANGES) {
          sh.getRange(2, 4, sh.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CHANGE_TYPES, true).build());
        }
      }
      var w = SCHEMA[name] ? SCHEMA[name].length : 3;
      sh.getRange(1, 1, 1, w).setFontWeight('bold').setBackground('#e8eef7').setHorizontalAlignment('center');
      sh.setFrozenRows(1);
      sh.setTabColor(sheetColor_(name));
    }
  });
  // 새 스프레드시트에 기본으로 있던 빈 시트(시트1, Sheet1)는 지웁니다.
  ss.getSheets().forEach(function (sh) {
    if (order.indexOf(sh.getName()) < 0 && /^(시트|Sheet)\d+$/.test(sh.getName()) && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

/** 머리글은 두고 데이터만 바꿉니다. */
function replaceData_(name, objs) {
  var sh = sheet_(name), last = sh.getLastRow(), n = SCHEMA[name].length;
  if (last >= 2) sh.getRange(2, 1, last - 1, n).clearContent();
  if (objs.length) sh.getRange(2, 1, objs.length, n).setNumberFormat('@').setValues(objs.map(function (o) { return toRow_(name, o); }));
}

/** 양력 공휴일 + 확인된 해의 음력·대체공휴일 */
function holidaysOf_(y) {
  if (!y) return [];
  var fixed = [['03-01', '삼일절'], ['05-05', '어린이날'], ['06-06', '현충일'], ['08-15', '광복절'], ['10-03', '개천절'], ['10-09', '한글날'], ['12-25', '성탄절']];
  var extra = {
    2026: [['02-16', '설날 연휴'], ['02-17', '설날'], ['02-18', '설날 연휴'], ['03-02', '삼일절 대체공휴일'], ['05-25', '부처님오신날 대체공휴일'],
      ['06-03', '전국동시지방선거'], ['08-17', '광복절 대체공휴일'], ['09-24', '추석 연휴'], ['09-25', '추석'], ['09-26', '추석 연휴'], ['10-05', '개천절 대체공휴일']]
  };
  var list = fixed.concat(extra[y] || []).map(function (x) { return { date: y + '-' + x[0], reason: x[1] }; })
    .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  if (!extra[y]) list.push({ date: '', reason: '※ 설날·추석·부처님오신날·대체공휴일은 직접 추가하세요' });
  return list;
}

/* ───────────── 시트 안 사용설명서 ───────────── */

var MANUAL_LINES = [
  ['T', '🏫 방과후 한눈에 — 사용설명서'],
  ['P', '방과후·늘봄 강좌 개설부터 학생 신청, 중복 확인, 확정, 가정통신문, 일자별 현황판까지 이 시트 하나로 관리합니다.'],
  ['P', '이 탭은 언제든 메뉴 [🏫 방과후 관리] → [사용설명서 탭 다시 만들기]로 처음 상태로 되돌릴 수 있습니다.'],
  ['H', '0. 사본을 받으셨나요? (지금 화면)'],
  ['P', '링크로 [사본 만들기]를 누르셨다면 이 파일은 이미 선생님의 구글 드라이브에 있는 선생님 소유의 파일입니다. 학생 정보는 이 파일 안에만 저장되고 다른 곳으로 보내지지 않습니다.'],
  ['P', '파일 이름은 [파일] → [이름 바꾸기]로 바꿔도 됩니다. 예) 2026 2학기 방과후 관리'],
  ['H', '1단계. 메뉴 열기와 권한 승인 (처음 한 번)'],
  ['N', '1) 화면 위쪽 메뉴줄 맨 오른쪽(도움말 옆)에 [🏫 방과후 관리] 메뉴가 생길 때까지 5~10초 기다립니다. 안 보이면 새로고침(F5)하세요.'],
  ['N', '2) [🏫 방과후 관리] → [① 처음 설정하기]를 누릅니다.'],
  ['N', '3) "승인 필요" 창이 뜨면 [계속] → 내 구글 계정 선택을 합니다.'],
  ['N', '4) "Google에서 확인하지 않은 앱" 화면이 나오면 왼쪽 아래 [고급] → [(프로젝트 이름)(으)로 이동(안전하지 않음)]을 누릅니다. 이 프로그램은 선생님 계정 안의 이 시트만 다루므로 안심하셔도 됩니다.'],
  ['N', '5) [허용]을 누른 뒤, 메뉴 [① 처음 설정하기]를 한 번 더 누릅니다.'],
  ['H', '2단계. 학교 정보 입력 (① 처음 설정하기 창)'],
  ['N', '· 학교급: 초등학교 / 중학교 / 고등학교 중 선택 → 학년 수와 용어(늘봄·방과후, 강사·담당 교사)가 맞춰지고, 시간대 칸에 학교급 예시값이 채워집니다.'],
  ['N', '· 시간대: 예시값일 뿐 고정이 아닙니다. 창 안에서 이름(1부, 8교시 등)과 시작·종료 시각을 고치고, [+ 시간대 추가]·[삭제]로 개수도 바꿀 수 있습니다. 나중에 관리자 화면 [설정] → [시간대]나 시트의 [시간대] 탭에서도 언제든 바꿉니다.'],
  ['N', '· 학교명, 학년도, 학기, 담당부서·담당자·연락처(가정통신문 문의처)를 입력합니다.'],
  ['N', '· 운영 기간: 강좌를 만들 때 기본으로 들어갈 시작일·종료일입니다.'],
  ['N', '· 수강료 표시: [사용]을 고르면 강좌마다 수강료·재료비 금액이 화면과 가정통신문에 표시됩니다. 결제 기능은 없습니다. 무료 운영이면 [사용안함].'],
  ['N', '· 선발 방식: 선착순(신청 즉시 선정, 정원이 차면 대기) / 추첨(마감 후 무작위) / 담당자선정(직접 고름)'],
  ['N', '· 최대 신청 개수: 학생 1명이 신청할 수 있는 강좌 수 (0이면 제한 없음)'],
  ['N', '· 관리자 비밀번호, 교사 비밀번호(교사·강사 공용)를 4자 이상으로 정합니다. 비밀번호는 [설정] 탭에서도 바꿀 수 있습니다.'],
  ['N', '· [저장]을 누르면 입력한 시간대가 [시간대] 탭에 저장되고, [장소] [휴일] 탭이 비어 있으면 예시값과 그해 공휴일이 들어갑니다.'],
  ['H', '3단계. 명단 넣기 (시트 탭에 붙여넣기)'],
  ['N', '[학생] 탭: 학년 | 반 | 번호 | 이름 순서로 나이스·엑셀에서 복사해 A2칸에 붙여넣습니다. 확인코드 칸은 비워 두고 메뉴 [학생 확인코드 만들기]를 누르면 4자리 숫자가 자동으로 채워집니다.'],
  ['N', '[교사] 탭: 강좌를 맡는 교사·외부 강사 이름을 적습니다. 교사는 이 이름을 골라 로그인합니다.'],
  ['N', '[시간대] 탭: 학교 일과에 맞게 이름·시각을 고치거나 줄을 더하고 지웁니다. (형식 15:40) 강좌 등록 때 빠른 선택 버튼으로 나오고, 현황판 묶음 제목에 쓰입니다. 시간대를 바꿔도 이미 등록한 강좌의 시각은 그대로입니다.'],
  ['N', '[장소] 탭: 교실·특별실 이름. 같은 시간에 같은 장소를 쓰면 경고가 뜹니다.'],
  ['N', '[휴일] 탭: 공휴일은 자동으로 들어가 있습니다. 재량휴업일, 시험 기간, 방학식 이후 등 수업이 없는 날을 날짜(2026-10-09 형식) | 사유로 더하세요.'],
  ['N', '다 넣었으면 메뉴 [입력 내용 점검하기]로 빠진 곳이 없는지 확인하세요.'],
  ['H', '4단계. 웹 화면 열기 (웹앱 배포, 처음 한 번)'],
  ['N', '1) 메뉴 [확장 프로그램] → [Apps Script]를 누릅니다. 코드 화면이 새 탭으로 열립니다. (코드는 고치지 않습니다)'],
  ['N', '2) 오른쪽 위 파란 [배포] → [새 배포]를 누릅니다.'],
  ['N', '3) [유형 선택] 옆 톱니바퀴 → [웹 앱]을 고릅니다.'],
  ['N', '4) 설명: 아무 말(예: 방과후) / 다음 사용자 인증 정보로 실행: [나] / 액세스 권한이 있는 사용자: [모든 사용자] 로 정하고 [배포]를 누릅니다.'],
  ['N', '5) 권한 승인 창이 다시 뜨면 1단계와 같이 승인합니다.'],
  ['N', '6) 나온 [웹 앱 URL]을 복사합니다. 이것이 관리자·교사 화면 주소입니다.'],
  ['N', '7) 시트로 돌아와 메뉴 [② 접속 주소·QR 보기]를 누르면 관리자·학생·현황판 주소와 QR코드가 나옵니다. 주소가 안 나오면 6)의 주소를 [설정] 탭 \'웹앱주소\' 칸에 붙여넣으세요.'],
  ['N', '8) 같은 창에서 [짧은 주소 만들기]를 누르면 is.gd(무료 주소 단축 서비스)로 짧은 주소(예: https://is.gd/AbC123)가 만들어지고, 모든 QR코드가 단순해져 휴대전화로 더 잘 인식됩니다. 처음 한 번 외부 접속 권한 승인 창이 뜹니다.'],
  ['W', '※ 학교 구글 계정, 개인 구글 계정 모두 사용할 수 있습니다. 액세스 권한을 [모든 사용자]로 해야 학생이 로그인 없이 신청할 수 있습니다.'],
  ['W', '※ 나중에 코드를 새 버전으로 바꾼 경우에만 [배포] → [배포 관리] → 연필 → 버전 [새 버전] → [배포]를 합니다. 주소는 그대로 유지됩니다.'],
  ['H', '5단계. 한 학기 진행 순서 (웹 화면)'],
  ['N', '주소 세 가지(관리자·교사 화면 / 학생 신청 / 현황판)와 QR코드는 관리자 화면 [홈] → [접속 주소·QR]에서 바로 복사·저장·인쇄할 수 있습니다.'],
  ['N', '① 준비중 — 교사·강사가 [강좌] 메뉴에서 강좌 계획(강좌명, 대상 학년, 요일·시간, 장소, 정원, 수강료)을 입력하고 [승인 요청]. 관리자는 [강좌] 목록에서 승인/반려. 관리자가 직접 등록한 강좌는 바로 승인됩니다.'],
  ['N', '② 가정통신문 — 관리자 [가정통신문] 메뉴에서 「개설 및 신청 안내」를 고르면 학교급에 맞는 본문 초안과 강좌 안내표, 신청 QR코드(주소 글자 없이 QR만)가 자동으로 만들어집니다. 본문을 고친 뒤 [인쇄/PDF] 또는 [전체 복사] → 한글(HWP) 문서에 붙여넣기. 종이 신청이 필요하면 회신용 신청서도 함께 넣을 수 있습니다.'],
  ['N', '③ 확인코드 배부 — [출력] → [확인코드 안내 쪽지]를 반별로 인쇄해 담임 선생님께 드립니다.'],
  ['N', '④ 신청접수 — [홈]에서 [신청 접수 시작]. 학생은 학년·반·번호·이름·확인코드로 들어와 신청합니다. 시간이 겹치는 강좌, 대상 학년이 아닌 강좌, 최대 개수 초과는 자동으로 막힙니다. 교사는 [명단] 메뉴에서 엑셀 명단을 붙여넣어 직접 넣을 수도 있습니다.'],
  ['N', '⑤ 신청마감 — [신청 마감]을 누르면 학생 신청이 닫힙니다.'],
  ['N', '⑥ 중복 검토 — [중복 검토] 메뉴: 🔴 시간 충돌(반드시 정리) / 🟡 다중 수강·최대 개수 초과 / 장소·담당자 겹침 / 정원 초과·최소 인원 미달 / 명렬에 없는 학생. 학생 이름으로 검색하면 주간 시간표가 나옵니다.'],
  ['N', '⑦ 선발 — [선발·확정] 메뉴에서 [선발 실행]. 정원 안이면 모두 선정, 넘으면 선발 방식(추첨/선착순)에 따라 선정·대기가 나뉩니다. 우선 선발할 학생은 먼저 [명단]에서 「선정」으로 바꿔 두면 그 자리는 지켜집니다.'],
  ['N', '⑧ 확정(운영중) — [최종 확정]. 이후 명단 변경은 관리자만 할 수 있고, 모든 변경은 [변경 이력]에 남습니다. [가정통신문] 「수강 확정 안내」와 [출력] → 개인별 통지서·출석부·반별 현황을 인쇄합니다.'],
  ['N', '⑨ 운영 중 — 휴강·보강·장소 변경은 [일정 변경]에 등록하면 현황판에 바로 표시됩니다. 취소생이 생기면 [선발·확정]에서 [대기자 승격].'],
  ['N', '⑩ 주기가 끝나면 — [주기 관리] → [새 주기 시작]. 지금 주기는 기록으로 보관되고, 새 주기는 「준비중」에서 시작합니다. [지난 주기에서 불러오기]로 강좌 계획과(원하면) 선정된 수강생 명단까지 가져오면 처음 설정이 몇 초면 끝납니다.'],
  ['H', '6단계. 오늘의 현황판 (모니터 게시)'],
  ['N', '· 교무실·복도 모니터의 브라우저에서 현황판 주소(?page=board)를 열고 F11(전체 화면)을 누르세요.'],
  ['N', '· 오늘 열리는 강좌를 시간대별로 강좌명·담당·장소·인원으로 보여 줍니다. 강좌가 많으면 자동으로 페이지가 넘어가고, 5분마다 새로 고칩니다.'],
  ['N', '· 학생 이름은 현황판에 나오지 않습니다(인원만 표시). [월간] 버튼으로 달력 보기, ◀ ▶로 다른 날짜를 볼 수 있습니다.'],
  ['H', '7단계. 자동 업데이트 준비 (처음 한 번)'],
  ['N', '1) https://script.google.com/home/usersettings 에 들어가 "Google Apps Script API"를 [사용]으로 바꿉니다.'],
  ['N', '2) 메뉴 [업데이트 가능 여부 점검]을 누르고, 권한 승인 창이 뜨면 허용합니다. 모든 항목이 ✅이면 준비 끝입니다.'],
  ['N', '3) 새 버전이 나오면 관리자 화면 위쪽 띠와 시트를 열 때 알림이 뜹니다. [업데이트 확인·설치] 한 번이면 코드 교체와 웹앱 재배포까지 끝납니다. 학생·강좌·신청 데이터와 웹앱 주소는 바뀌지 않습니다.'],
  ['W', '※ 업데이트 뒤에 권한 승인 창이 다시 뜨면 허용하세요(새 기능이 새 권한을 쓰는 경우). 코드를 직접 고친 경우 업데이트할 때 덮어써집니다.'],
  ['H', '탭 설명'],
  ['N', '사용설명서 / 설정 (학교 정보·비밀번호·진행단계) / 학생 / 교사 / 시간대 / 장소 / 휴일 — 학교가 직접 입력하는 탭 (초록·파랑)'],
  ['N', '강좌 / 수강신청 / 일정변경 / 주기 / 변경이력 — 웹 화면이 자동으로 기록하는 탭 (노랑·회색). 강좌·수강신청·일정변경의 맨 끝 「주기」 열로 학기별 기록을 구분합니다. 꼭 필요할 때만 직접 고치고, 머리글(1행)과 ID·주기 열은 바꾸지 마세요.'],
  ['H', '자주 묻는 질문'],
  ['Q', 'Q. 학생이 확인코드를 잊어버렸어요.'],
  ['P', 'A. [학생] 탭에서 그 학생의 확인코드를 보거나 새 숫자로 고쳐 알려 주세요. [출력] → 확인코드 안내 쪽지로 다시 인쇄할 수도 있습니다.'],
  ['Q', 'Q. 이름이 같은 학생이 있어요.'],
  ['P', 'A. 모든 학생은 학년·반·번호(학번)로 구분하므로 섞이지 않습니다. 명단을 이름만 붙여넣으면 같은 이름이 있을 때 고르라고 물어봅니다.'],
  ['Q', 'Q. 비밀번호를 잊었어요.'],
  ['P', 'A. 시트 [설정] 탭의 관리자비밀번호·교사비밀번호 칸에서 확인하거나 바꾸세요. 5번 틀리면 10분 동안 잠깁니다.'],
  ['Q', 'Q. 새 학기(새 주기)에 다시 쓰려면?'],
  ['P', 'A. 관리자 화면 [주기 관리] → [새 주기 시작]. 지난 기록은 지워지지 않고 [주기 관리]에서 언제든 볼 수 있습니다. 이어서 [지난 주기에서 불러오기]로 강좌 계획을 그대로 가져오세요. 학년이 올라갔으면 [학생] 탭을 새 명렬로 먼저 바꾸세요. 웹앱 주소는 그대로입니다.'],
  ['Q', 'Q. 새 버전이 나왔다고 알림이 떠요.'],
  ['P', 'A. 메뉴 [업데이트 확인·설치] 또는 관리자 화면 위쪽 띠의 [지금 업데이트]를 누르면 코드가 새 버전으로 바뀌고 웹앱도 다시 배포됩니다(주소 그대로, 데이터 그대로). 처음 한 번은 아래 7단계 준비가 필요합니다.'],
  ['Q', 'Q. 먼저 연습해 보고 싶어요.'],
  ['P', 'A. 메뉴 [예시 데이터로 체험하기]를 누르면 가상의 학생 수백 명과 강좌 40여 개가 들어갑니다. 지난 주기(1학기) 기록도 들어 있어 [주기 관리]의 보기·불러오기를 연습할 수 있습니다. 연습 후에는 메뉴 [[배포자용] 빈 템플릿으로 만들기]로 비우세요.'],
  ['Q', 'Q. QR코드가 잘 안 찍혀요.'],
  ['P', 'A. [② 접속 주소·QR 보기] 또는 관리자 화면 [홈]에서 [짧은 주소 만들기]를 누르세요. 주소가 짧아지면 QR 무늬가 굵고 단순해져 인식이 잘 됩니다.'],
  ['Q', 'Q. 개인정보는 안전한가요?'],
  ['P', 'A. 모든 데이터는 이 구글 시트(선생님 드라이브)에만 저장됩니다. 학생 화면은 본인 정보만, 현황판은 인원 수만 보여 줍니다. 시트 공유 범위는 꼭 필요한 교직원으로 제한하세요.']
];

function writeManualSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(SH.MANUAL);
  if (!sh) sh = ss.insertSheet(SH.MANUAL, 0);
  sh.clear();
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 24);
  sh.setColumnWidth(2, 900);
  var rows = MANUAL_LINES.map(function (l) { return ['', l[1]]; });
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange(1, 2, rows.length, 1).setWrap(true).setVerticalAlignment('middle').setFontSize(11).setFontFamily('Malgun Gothic');
  MANUAL_LINES.forEach(function (l, i) {
    var r = sh.getRange(i + 1, 2);
    if (l[0] === 'T') { r.setFontSize(18).setFontWeight('bold').setFontColor('#ffffff').setBackground('#1e5aa8'); sh.setRowHeight(i + 1, 44); }
    else if (l[0] === 'H') { r.setFontSize(13).setFontWeight('bold').setFontColor('#1e5aa8').setBackground('#e8eef7'); sh.setRowHeight(i + 1, 32); }
    else if (l[0] === 'W') { r.setFontColor('#a33a00').setBackground('#fff4e5'); }
    else if (l[0] === 'Q') { r.setFontWeight('bold'); }
  });
  sh.setTabColor('#1e5aa8');
  return sh;
}

/* ───────────── 예시 데이터 ───────────── */

function rng_(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

var SAMPLE_COURSES = {
  '초등학교': [
    ['방송댄스', '예체능'], ['로봇과학', '과학'], ['컴퓨터 코딩', '정보'], ['바둑', '교양'], ['주산 암산', '교과'], ['클레이아트', '미술'],
    ['음악줄넘기', '체육'], ['우쿨렐레', '음악'], ['영어놀이', '외국어'], ['독서논술', '국어'], ['창의미술', '미술'], ['생명과학', '과학'],
    ['축구', '체육'], ['발레', '예체능'], ['한자', '교양'], ['마술', '교양'], ['보드게임', '교양'], ['플루트', '음악'],
    ['과학실험', '과학'], ['종이접기', '미술'], ['피아노', '음악'], ['3D펜', '정보'], ['배드민턴', '체육'], ['수학 놀이', '교과'],
    ['그림책 영어', '외국어'], ['드론', '정보'], ['캘리그라피', '미술'], ['탁구', '체육'], ['요가', '체육'], ['합창', '음악']
  ],
  '중학교': [
    ['수학 심화', '교과'], ['수학 기초', '교과'], ['영어 회화', '외국어'], ['영어 독해', '외국어'], ['국어 논술', '교과'], ['과학 탐구 실험', '과학'],
    ['파이썬 코딩', '정보'], ['로봇 메이커', '정보'], ['드론 교실', '정보'], ['3D 프린팅', '정보'], ['AI 기초', '정보'], ['밴드부', '음악'],
    ['합창', '음악'], ['우쿨렐레', '음악'], ['기타 연주', '음악'], ['드로잉', '미술'], ['웹툰 그리기', '미술'], ['캘리그라피', '미술'],
    ['영상 제작', '미디어'], ['사진 동아리', '미디어'], ['농구', '체육'], ['배드민턴', '체육'], ['탁구', '체육'], ['풋살', '체육'],
    ['줄넘기', '체육'], ['방송댄스', '체육'], ['바둑', '교양'], ['체스', '교양'], ['독서토론', '교양'], ['일본어', '외국어'],
    ['중국어', '외국어'], ['진로 탐색', '진로'], ['보드게임 수학', '교과'], ['한국사 심화', '교과'], ['연극', '예술'], ['피아노', '음악'],
    ['플로깅 환경', '교양'], ['메이커 목공', '정보'], ['수학 경시', '교과'], ['과학 논술', '과학'], ['영어 뮤지컬', '외국어'], ['요리 과학', '과학'],
    ['코딩 게임 제작', '정보'], ['배구', '체육']
  ],
  '고등학교': [
    ['수학Ⅰ 심화', '교과'], ['수학Ⅱ 기초', '교과'], ['미적분 문제풀이', '교과'], ['확률과 통계', '교과'], ['영어 독해 실전', '외국어'], ['영어 듣기', '외국어'],
    ['문학 감상', '교과'], ['독서 논술', '교과'], ['화법과 작문', '교과'], ['물리학 실험', '과학'], ['화학 탐구', '과학'], ['생명과학 심화', '과학'],
    ['지구과학', '과학'], ['한국사 정리', '교과'], ['사회문화', '교과'], ['생활과 윤리', '교과'], ['파이썬 데이터 분석', '정보'], ['AI 프로젝트', '정보'],
    ['일본어 회화', '외국어'], ['중국어 회화', '외국어'], ['진로 포트폴리오', '진로'], ['면접 대비', '진로'], ['논술 실전', '교과'], ['밴드', '음악'],
    ['농구', '체육'], ['배드민턴', '체육'], ['헬스 기초', '체육'], ['드로잉', '미술'], ['영상 제작', '미디어'], ['토론', '교양'],
    ['경제 탐구', '교과'], ['수학 개념 정리', '교과'], ['영어 문법', '외국어'], ['과학 논술', '과학'], ['시사 영어', '외국어'], ['통합과학 보충', '과학'],
    ['통합사회 보충', '교과'], ['국어 문법', '교과'], ['심리학 입문', '교양'], ['법과 정치', '교과']
  ]
};

var SURNAMES = '김이박최정강조윤장임한오서신권황안송류전홍고문양손배백허유남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모남궁탁국'.split('');
var GIVEN1 = '민서지하예수도윤시은준현우주건채가유다나연소아태승재정혜성진영미선희동상경'.split('');
var GIVEN2 = '준연서윤우진호아은원빈율희영린민훈혁찬수인현솔별온결담슬하나람'.split('');

function loadSample_(level) {
  ensureSheets_();
  var lv = LEVELS[level] || LEVELS['중학교'], R = rng_(20261013);
  var pick = function (arr) { return arr[Math.floor(R() * arr.length)]; };
  var today = today_(), s = readSettings_();

  // 운영 기간: 오늘이 들어 있는 주의 전주 월요일부터 10주
  var dow = DAY_ORDER.indexOf(dayName_(today));
  var opStart = addDays_(today, -dow - 7), opEnd = addDays_(opStart, 7 * 10 + 4);
  writeSettings_({
    opStart: opStart, opEnd: opEnd, stage: '신청접수',
    applyStart: addDays_(today, -3) + ' 09:00', applyEnd: addDays_(today, 7) + ' 18:00',
    dept: s.dept || '방과후부', manager: s.manager || '김담당', phone: s.phone || '02-000-0000',
    feeUse: s.feeUse || '사용안함', feeUnit: s.feeUnit || '3개월'
  });

  // 학생
  var classes = level === '초등학교' ? 4 : 6, perClass = level === '초등학교' ? 22 : 25, students = [];
  for (var g = 1; g <= lv.grades; g++) for (var c = 1; c <= classes; c++) for (var n = 1; n <= perClass; n++) {
    students.push({ grade: g, cls: c, no: n, name: pick(SURNAMES) + pick(GIVEN1) + pick(GIVEN2), code: String(1000 + Math.floor(R() * 9000)), note: '' });
  }
  students[0].code = '1234';
  students[1].name = students[0].name; // 동명이인 예시
  replaceData_(SH.STUDENTS, students);

  // 교사
  var courses = SAMPLE_COURSES[level] || SAMPLE_COURSES['중학교'];
  var tcount = Math.ceil(courses.length / 2), teachers = [], used = {};
  while (teachers.length < tcount) {
    var tn = pick(SURNAMES) + pick(GIVEN1) + pick(GIVEN2);
    if (used[tn]) continue;
    used[tn] = true;
    teachers.push({ name: tn, dept: level === '초등학교' ? '외부 강사' : pick(['국어', '수학', '영어', '과학', '정보', '음악', '미술', '체육', '사회', '외부 강사']), phone: '' });
  }
  replaceData_(SH.TEACHERS, teachers);
  if (readTable_(SH.SLOTS).length === 0) replaceData_(SH.SLOTS, lv.slots.map(function (x) { return { name: x[0], start: x[1], end: x[2] }; }));
  if (readTable_(SH.ROOMS).length === 0) replaceData_(SH.ROOMS, lv.rooms.map(function (r) { return { name: r, capacity: '', note: '' }; }));
  if (readTable_(SH.HOLIDAYS).length === 0) replaceData_(SH.HOLIDAYS, holidaysOf_(int_(today.slice(0, 4))));

  // 강좌: 월·수 / 화·목 묶음을 번갈아 배치해 하루 20개 안팎이 되게 합니다.
  var patterns = [['월', '수'], ['화', '목']], rooms = lv.rooms, slotN = lv.slots.length, rows = [];
  var gradesAll = [];
  for (var gg = 1; gg <= lv.grades; gg++) gradesAll.push(gg);
  courses.forEach(function (cn, i) {
    var p = Math.floor(i / 2), pat = patterns[i % 2], slot = lv.slots[p % Math.min(slotN, 3)];
    var room = rooms[Math.floor(p / 3) % rooms.length];
    var gr = level === '초등학교' ? (i % 3 === 0 ? '1,2' : i % 3 === 1 ? '3,4' : '전체') : (i % 4 === 0 ? '1' : i % 4 === 1 ? '2,3' : '전체');
    var cap = [12, 15, 16, 18, 20, 24][i % 6];
    var days = pat.join(',');
    if (i === courses.length - 1) days = '금';
    rows.push({
      id: 'C' + ('00' + (i + 1)).slice(-3), name: cn[0], area: cn[1], teacher: teachers[Math.floor(i / 2) % teachers.length].name,
      grades: gr, days: days, start: slot[1], end: slot[2], startDate: opStart, endDate: opEnd, room: room,
      cap: String(cap), min: String(Math.max(5, Math.floor(cap / 3))), fee: String([30000, 45000, 60000, 0][i % 4] || ''), material: i % 5 === 0 ? '15000' : '',
      desc: cn[0] + ' 활동을 통해 ' + ['기초 실력을 다지고', '창의적으로 표현하며', '협력하는 방법을 배우고', '흥미를 넓히며'][i % 4] + ' 즐겁게 참여합니다.',
      status: '승인', reason: '', updated: today + ' 09:00:00'
    });
  });
  // 의도적인 예시: 장소 겹침 1건, 승인 대기 2건, 작성중 1건
  if (rows.length > 6) { rows[5].room = rows[1].room; rows[5].start = rows[1].start; rows[5].end = rows[1].end; rows[5].days = rows[1].days; }
  if (rows.length > 10) { rows[rows.length - 2].status = '제출'; rows[rows.length - 3].status = '제출'; rows[rows.length - 4].status = '작성중'; }
  // 신청: 학생마다 겹치지 않게 1~3개씩, 일부 강좌는 정원 초과
  var prepped = rows.map(function (r) { return prepCourse_(Object.assign({}, r), { opStart: opStart, opEnd: opEnd }, lv.grades); });
  var open = prepped.filter(function (c) { return c.status === '승인'; });
  var mine = {}, counts = {}, enroll = [], t0 = addDays_(today, -3);
  var stamp = function (k) {
    var sec = Math.floor(k * 37 % 86000);
    return t0 + ' ' + pad2_(9 + Math.floor(sec / 3600) % 10) + ':' + pad2_(Math.floor(sec / 60) % 60) + ':' + pad2_(sec % 60) + '.000';
  };
  var k = 0;
  var tryAdd = function (st, c, limit) {
    var sid = makeSid_(st.grade, st.cls, st.no), list = mine[sid] || [];
    if (c.gradeList.indexOf(st.grade) < 0 || list.length >= 3) return false;
    if (list.some(function (x) { return x === c || coursesOverlap_(x, c); })) return false;
    if ((counts[c.id] || 0) >= limit) return false;
    list.push(c); mine[sid] = list; counts[c.id] = (counts[c.id] || 0) + 1;
    enroll.push({ id: 'E' + ('0000' + (++k)).slice(-5), courseId: c.id, sid: sid, name: st.name, status: '신청', source: '학생', time: stamp(k), wait: '', note: '' });
    return true;
  };
  // 인기 강좌 2개는 정원을 넘게 신청 (추첨·대기 예시)
  [open[1], open[6]].forEach(function (c) {
    if (!c) return;
    for (var i = 0, j = Math.floor(R() * students.length); i < students.length && (counts[c.id] || 0) < c.capNum + 5; i++) {
      tryAdd(students[(j + i * 7) % students.length], c, c.capNum + 5);
    }
  });
  students.forEach(function (st) {
    var want = R() < 0.35 ? 0 : (R() < 0.5 ? 1 : (R() < 0.7 ? 2 : 3)), tries = 0;
    var sid = makeSid_(st.grade, st.cls, st.no);
    while ((mine[sid] || []).length < want && tries++ < 20) { var c = pick(open); tryAdd(st, c, c.capNum - 2); }
  });
  // 교사가 직접 넣은 명단 + 의도적인 시간 충돌·최대 개수 초과 예시
  var bySidOf = function (sid) { return students.filter(function (x) { return makeSid_(x.grade, x.cls, x.no) === sid; })[0]; };
  var conflictTarget = open[4], victims = enroll.filter(function (e) {
    var c = prepped.filter(function (p) { return p.id === e.courseId; })[0];
    return c !== conflictTarget && coursesOverlap_(c, conflictTarget) && conflictTarget.gradeList.indexOf(bySidOf(e.sid).grade) >= 0;
  }).slice(0, 5);
  victims.forEach(function (e) {
    enroll.push({ id: 'E' + ('0000' + (++k)).slice(-5), courseId: conflictTarget.id, sid: e.sid, name: e.name, status: '선정', source: '교사', time: stamp(k), wait: '', note: '' });
  });
  var heavy = Object.keys(mine).filter(function (sid) { return mine[sid].length === 3; }).slice(0, 3);
  heavy.forEach(function (sid) {
    var st = bySidOf(sid);
    var extra = open.filter(function (c) { return c.gradeList.indexOf(st.grade) >= 0 && !mine[sid].some(function (x) { return x === c || coursesOverlap_(x, c); }); })[0];
    if (extra) enroll.push({ id: 'E' + ('0000' + (++k)).slice(-5), courseId: extra.id, sid: sid, name: st.name, status: '선정', source: '교사', time: stamp(k), wait: '', note: '' });
  });
  // 체험용 학생(1학년 1반 1번, 확인코드 1234)은 깨끗하게 1개만 신청한 상태로 둡니다.
  var demoSid = makeSid_(students[0].grade, students[0].cls, students[0].no);
  var demoFirst = enroll.filter(function (e) { return e.sid === demoSid; })[0];
  enroll = enroll.filter(function (e) { return e.sid !== demoSid || e === demoFirst; });

  // 주기: 지난 1학기(종료, 강좌 24개·선정 명단) + 지금 주기 → [주기 관리]의 보기·불러오기 체험용
  var year = s.year || today.slice(0, 4), curId = 'SMP2', pastId = 'SMP1';
  rows.forEach(function (r) { r.cycle = curId; });
  enroll.forEach(function (e) { e.cycle = curId; });
  var pStart = addDays_(opStart, -26 * 7), pEnd = addDays_(pStart, 7 * 16 + 4);
  var past = rows.slice(0, 24).map(function (r, i) {
    return Object.assign({}, r, { id: 'C' + ('00' + (rows.length + i + 1)).slice(-3), cycle: pastId, startDate: pStart, endDate: pEnd, status: '승인', updated: pStart + ' 09:00:00' });
  });
  var pastEn = [];
  past.forEach(function (c, ci) {
    var pc = prepCourse_(Object.assign({}, c), {}, lv.grades), n = 0, want = Math.min(int_(c.cap), 8 + ci % 6);
    for (var j = 0; j < students.length && n < want; j++) {
      var st = students[(ci * 37 + j * 11) % students.length];
      if (pc.gradeList.indexOf(st.grade) < 0) continue;
      pastEn.push({ id: 'EP' + ('0000' + (pastEn.length + 1)).slice(-4), courseId: c.id, sid: makeSid_(st.grade, st.cls, st.no), name: st.name, status: '선정', source: '학생', time: pStart + ' 10:00:00.000', wait: '', note: '', cycle: pastId });
      n++;
    }
  });
  replaceData_(SH.COURSES, past.concat(rows));
  replaceData_(SH.ENROLL, pastEn.concat(enroll));
  replaceData_(SH.CYCLES, [
    { id: pastId, name: year + '학년도 1학기', year: year, term: '1학기', opStart: pStart, opEnd: pEnd, applyStart: addDays_(pStart, -10) + ' 09:00', applyEnd: addDays_(pStart, -4) + ' 18:00',
      method: '추첨', maxCount: '3', status: '종료', started: addDays_(pStart, -20) + ' 08:00:00', closed: pEnd + ' 18:00:00', courses: String(past.length), students: '', enrolls: String(pastEn.length), note: '예시' },
    { id: curId, name: year + '학년도 ' + (s.term || '2학기'), year: year, term: s.term || '2학기', opStart: opStart, opEnd: opEnd, applyStart: addDays_(today, -3) + ' 09:00', applyEnd: addDays_(today, 7) + ' 18:00',
      method: s.method || '추첨', maxCount: s.maxCount || '3', status: '진행중', started: pEnd + ' 18:00:00', closed: '', courses: '', students: '', enrolls: '', note: '예시' }
  ]);
  writeSettings_({ cycle: curId, year: year, schemaVer: String(SCHEMA_VERSION) });

  // 일정 변경: 오늘 휴강 1, 오늘 장소 변경 1, 내일 보강 1
  var todays = sessionsOnDate_(prepped, today, {}, []);
  var chg = [];
  if (todays.length > 2) {
    chg.push({ id: 'X0001', date: today, courseId: todays[0].courseId, type: '휴강', room: '', start: '', end: '', reason: '강사 출장', by: '관리자', at: today + ' 08:30:00' });
    chg.push({ id: 'X0002', date: today, courseId: todays[1].courseId, type: '장소변경', room: '다목적실', start: '', end: '', reason: '교실 공사', by: '관리자', at: today + ' 08:31:00' });
    chg.push({ id: 'X0003', date: addDays_(today, 3), courseId: todays[0].courseId, type: '보강', room: '', start: todays[0].start, end: todays[0].end, reason: '휴강 보충', by: '관리자', at: today + ' 08:32:00' });
  }
  chg.forEach(function (x) { x.cycle = curId; });
  replaceData_(SH.CHANGES, chg);
}
