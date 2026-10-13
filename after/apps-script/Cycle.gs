/**
 * 방과후 한눈에 — 운영 주기(학기·분기·방학) 관리 · 시트 구조 자동 보정
 *
 * 강좌·수강신청·일정변경 행에는 '주기' 열이 있어서, 새 주기를 시작해도 지난 기록이 같은 탭에 그대로 남습니다.
 * 화면은 [설정] 탭의 '현재주기'에 해당하는 행만 다룹니다.
 */

/* ───────────── 시트 구조 자동 보정 (업데이트 후 첫 실행 때) ───────────── */

function ensureSchema_() {
  var s;
  try { s = readSettings_(); } catch (e) { return; } // 아직 [설정] 탭이 없음 → 처음 설정에서 만듦
  if (Number(s.schemaVer || 0) >= SCHEMA_VERSION && s.cycle) return;
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    s = readSettings_();
    if (Number(s.schemaVer || 0) >= SCHEMA_VERSION && s.cycle) return;
    migrate_(s);
  } finally {
    lock.releaseLock();
  }
}

function migrate_(s) {
  ensureSheets_();
  ensureHeaders_();
  var cycles = readTable_(SH.CYCLES), cur = s.cycle;
  if (!cur || !cycles.some(function (c) { return c.id === cur; })) {
    var open = cycles.filter(function (c) { return c.status === '진행중'; });
    if (open.length) {
      cur = open[open.length - 1].id;
    } else {
      cur = newCycleId_();
      appendRows_(SH.CYCLES, [cycleRow_(cur, s, '진행중')]);
    }
    writeSettings_({ cycle: cur });
  }
  fillBlankCycle_(cur);
  writeSettings_({ schemaVer: String(SCHEMA_VERSION) });
}

/** 새 버전에서 생긴 열의 머리글을 채웁니다. (기존 열 순서는 그대로) */
function ensureHeaders_() {
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss_().getSheetByName(name);
    if (!sh) return;
    var cols = SCHEMA[name], head = sh.getRange(1, 1, 1, cols.length).getDisplayValues()[0], changed = false;
    cols.forEach(function (c, j) { if (!String(head[j]).trim()) { head[j] = c[1]; changed = true; } });
    if (!changed) return;
    sh.getRange(1, 1, 1, cols.length).setValues([head]).setFontWeight('bold').setBackground('#e8eef7').setHorizontalAlignment('center');
    sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), cols.length).setNumberFormat('@');
  });
}

/** 주기 열이 비어 있는 예전 행에 현재 주기를 적습니다. */
function fillBlankCycle_(cur) {
  Object.keys(CYCLE_TABLES).forEach(function (name) {
    var sh = ss_().getSheetByName(name);
    if (!sh) return;
    var last = sh.getLastRow();
    if (last < 2) return;
    var col = SCHEMA[name].map(function (c) { return c[0]; }).indexOf('cycle') + 1;
    var ids = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
    var range = sh.getRange(2, col, last - 1, 1), vals = range.getDisplayValues(), n = 0;
    vals.forEach(function (r, i) {
      if (String(ids[i][0]).trim() && !String(r[0]).trim()) { r[0] = cur; n++; }
    });
    if (n) range.setNumberFormat('@').setValues(vals);
  });
}

/* ───────────── 주기 도우미 ───────────── */

function newCycleId_() { return 'P' + Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss'); }

function cycleName_(s) {
  var t = ((s.year ? s.year + '학년도 ' : '') + (s.term || '')).trim();
  return t || '첫 주기';
}

function cycleRow_(id, s, status) {
  return {
    id: id, name: cycleName_(s), year: s.year || '', term: s.term || '', opStart: s.opStart || '', opEnd: s.opEnd || '',
    applyStart: s.applyStart || '', applyEnd: s.applyEnd || '', method: s.method || '', maxCount: s.maxCount || '',
    status: status, started: nowStr_(), closed: '', courses: '', students: '', enrolls: '', note: ''
  };
}

/** 주기별 통계 { 주기ID: {courses, students, enrolls} } */
function cycleStats_() {
  var out = {};
  var get = function (id) { return out[id] = out[id] || { courses: 0, students: 0, enrolls: 0, _s: {} }; };
  readTable_(SH.COURSES, true).forEach(function (c) { if (c.status === '승인') get(c.cycle || '').courses++; });
  readTable_(SH.ENROLL, true).forEach(function (e) {
    if (e.status !== '선정') return;
    var o = get(e.cycle || '');
    o.enrolls++;
    if (!o._s[e.sid]) { o._s[e.sid] = true; o.students++; }
  });
  Object.keys(out).forEach(function (k) { delete out[k]._s; });
  return out;
}

/** 화면에 보여 줄 현재 주기 정보 */
function currentCycleInfo_(s) {
  var rows = [];
  try { rows = readTable_(SH.CYCLES); } catch (e) { rows = []; }
  var cur = null;
  rows.forEach(function (r) { if (r.id === s.cycle) cur = r; });
  return {
    id: s.cycle || '', name: cycleName_(s), started: cur ? cur.started : '',
    pastCount: rows.filter(function (r) { return r.id !== s.cycle; }).length
  };
}

/* ───────────── API ───────────── */

function actCycles_(d, ctx) {
  var s = ctx.s, stats = cycleStats_();
  var list = readTable_(SH.CYCLES).map(function (r) {
    var st = stats[r.id] || { courses: 0, students: 0, enrolls: 0 }, isCur = r.id === s.cycle;
    return {
      id: r.id, name: isCur ? cycleName_(s) : r.name, current: isCur, status: isCur ? '진행중' : (r.status || '종료'),
      opStart: isCur ? s.opStart : r.opStart, opEnd: isCur ? s.opEnd : r.opEnd,
      started: r.started, closed: r.closed, courses: st.courses, students: st.students, enrolls: st.enrolls
    };
  });
  return { cycles: list.reverse(), current: s.cycle };
}

function actCycleDetail_(d) {
  var id = String(d.id || '');
  var courses = readTable_(SH.COURSES, true).filter(function (c) { return c.cycle === id; });
  var enroll = readTable_(SH.ENROLL, true).filter(function (e) { return e.cycle === id && e.status !== '취소'; });
  var cnt = courseCounts_(enroll);
  return {
    courses: courses.map(function (c) {
      var n = cnt[c.id] || {};
      return { id: c.id, name: c.name, area: c.area, teacher: c.teacher, grades: c.grades, days: c.days, start: normTime_(c.start), end: normTime_(c.end),
        startDate: c.startDate, endDate: c.endDate, room: c.room, cap: c.cap, fee: c.fee, status: c.status,
        selected: n['선정'] || 0, applied: n['신청'] || 0, waiting: n['대기'] || 0 };
    }),
    enroll: enroll.map(function (e) { return { courseId: e.courseId, sid: e.sid, name: e.name, status: e.status, wait: e.wait, source: e.source }; })
  };
}

/** 새 주기 시작: 지금 주기는 '종료'로 기록해 두고, 새 주기ID로 바꿉니다. 데이터는 지우지 않습니다. */
function actStartCycle_(d, ctx) {
  var s = ctx.s;
  var term = String(d.term || '').trim(), year = String(d.year || '').trim();
  if (!term) throw new Error('학기(주기 이름)를 입력하세요. 예: 1학기, 여름방학, 2분기');
  if (!d.force && (s.stage === '신청접수' || s.stage === '신청마감')) {
    throw new Error('지금 주기가 아직 「' + s.stage + '」 단계입니다. 새 주기를 시작하면 이 주기는 기록으로만 남습니다.|FORCE');
  }
  var opStart = normDate_(d.opStart), opEnd = normDate_(d.opEnd);
  if (opStart && opEnd && opStart > opEnd) throw new Error('운영 기간을 확인하세요.');
  var applyStart = d.applyStart ? normDateTime_(d.applyStart, '00:00') : '', applyEnd = d.applyEnd ? normDateTime_(d.applyEnd, '23:59') : '';

  // 1) 지금 주기 마감 기록
  var stats = cycleStats_()[s.cycle] || { courses: 0, students: 0, enrolls: 0 };
  var rows = readTable_(SH.CYCLES), closedName = cycleName_(s);
  rows.forEach(function (r) {
    if (r.id !== s.cycle) return;
    var snap = cycleRow_(r.id, s, '종료');
    snap._row = r._row; snap.started = r.started; snap.closed = nowStr_(); snap.note = r.note;
    snap.courses = String(stats.courses); snap.students = String(stats.students); snap.enrolls = String(stats.enrolls);
    updateRows_(SH.CYCLES, [snap]);
  });

  // 2) 새 주기
  var next = { year: year || s.year, term: term, opStart: opStart, opEnd: opEnd, applyStart: applyStart, applyEnd: applyEnd, method: s.method, maxCount: s.maxCount };
  var id = newCycleId_();
  appendRows_(SH.CYCLES, [cycleRow_(id, next, '진행중')]);
  writeSettings_({ cycle: id, year: next.year, term: term, opStart: opStart, opEnd: opEnd, applyStart: applyStart, applyEnd: applyEnd, stage: '준비중' });
  log_(ctx, '새 주기 시작', cycleName_(next), '이전 주기 「' + closedName + '」 기록 보관 (강좌 ' + stats.courses + ', 선정 ' + stats.enrolls + '건)');
  ctx.s = readSettings_();
  return withState_(ctx, { msg: '새 주기 「' + cycleName_(next) + '」를 시작했습니다. 「' + closedName + '」 기록은 [주기 관리]에 그대로 남아 있습니다.', closedId: s.cycle });
}

/** 지난 주기에서 강좌 계획(과 선정된 수강생 명단)을 현재 주기로 복사합니다. */
function actImportCycle_(d, ctx) {
  var s = ctx.s, from = String(d.from || '');
  if (!from || from === s.cycle) throw new Error('불러올 지난 주기를 고르세요.');
  var status = d.asStatus === '작성중' ? '작성중' : '승인';
  var everyCourse = readTable_(SH.COURSES, true);
  // 기본은 승인된 강좌만. includeClosed면 작성중·제출·폐강·반려 강좌도 함께.
  var src = everyCourse.filter(function (c) { return c.cycle === from && (d.includeClosed || c.status === '승인'); });
  if (!src.length) throw new Error('그 주기에는 불러올 강좌가 없습니다.');

  var mine = readTable_(SH.COURSES), keyOf = function (c) { return [c.name, c.teacher, normDays_(c.days).join(''), normTime_(c.start)].join('|'); };
  var exists = {};
  mine.forEach(function (c) { exists[keyOf(c)] = true; });
  var teachers = {};
  readTable_(SH.TEACHERS).forEach(function (t) { teachers[t.name] = true; });

  var max = 0;
  everyCourse.forEach(function (c) { var m = /^C(\d+)$/.exec(c.id); if (m) max = Math.max(max, Number(m[1])); });
  var map = {}, add = [], dup = 0, noTeacher = 0, now = nowStr_();
  src.forEach(function (c) {
    if (exists[keyOf(c)]) { dup++; return; }
    var id = 'C' + ('00' + (++max)).slice(-3);
    map[c.id] = id;
    if (c.teacher && !teachers[c.teacher]) noTeacher++;
    var o = {};
    SCHEMA[SH.COURSES].forEach(function (k) { o[k[0]] = c[k[0]]; });
    o.id = id; o.cycle = s.cycle; o.status = status; o.reason = ''; o.updated = now;
    if (normDate_(s.opStart)) o.startDate = normDate_(s.opStart);
    if (normDate_(s.opEnd)) o.endDate = normDate_(s.opEnd);
    add.push(o);
  });
  appendRows_(SH.COURSES, add);

  var rosterMsg = '';
  if (d.rosters && add.length) {
    var smap = {};
    readStudents_().forEach(function (st) { smap[st.sid] = st; });
    var stamp = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss.SSS'), en = [], miss = 0;
    readTable_(SH.ENROLL, true).forEach(function (e) {
      if (e.cycle !== from || e.status !== '선정' || !map[e.courseId]) return;
      var st = smap[e.sid];
      if (!st || st.name !== e.name) { miss++; return; }
      en.push({ id: newId_('E'), courseId: map[e.courseId], sid: e.sid, name: st.name, status: '선정', source: '불러오기', time: stamp, wait: '', note: '', cycle: s.cycle });
    });
    appendRows_(SH.ENROLL, en);
    rosterMsg = ' 수강생 ' + en.length + '명도 「선정」으로 넣었습니다.' + (miss ? ' (지금 학생 명렬과 학번·이름이 맞지 않는 ' + miss + '명은 뺐습니다)' : '');
  }
  var srcName = '';
  readTable_(SH.CYCLES).forEach(function (r) { if (r.id === from) srcName = r.name; });
  log_(ctx, '지난 주기 불러오기', srcName, '강좌 ' + add.length + '개 (' + status + ')' + rosterMsg);
  var msg = '「' + srcName + '」에서 강좌 ' + add.length + '개를 「' + status + '」 상태로 불러왔습니다.' + rosterMsg;
  if (dup) msg += ' 이미 있는 강좌 ' + dup + '개는 건너뛰었습니다.';
  var warnings = [];
  if (noTeacher) warnings.push('담당자가 [교사] 명단에 없는 강좌가 ' + noTeacher + '개 있습니다. 교사 명단을 확인하세요.');
  if (!normDate_(s.opStart) || !normDate_(s.opEnd)) warnings.push('이번 주기 운영 기간이 비어 있어 강좌 기간을 지난 주기 그대로 두었습니다. [설정]에서 운영 기간을 넣고 강좌 기간을 확인하세요.');
  return withState_(ctx, { msg: msg, warnings: warnings });
}
