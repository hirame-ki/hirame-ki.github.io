/**
 * 방과후 한눈에 — 계산 로직
 * 날짜·시각 정리, 시간 겹침, 중복 검토, 일자별 수업 계산, 명단 붙여넣기 해석
 * (시트를 직접 건드리지 않는 순수 함수만 모아 두었습니다.)
 */

var DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
var DAY_ORDER = ['월', '화', '수', '목', '금', '토', '일'];

function int_(v) {
  var n = parseInt(String(v == null ? '' : v).replace(/[^\d-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function pad2_(n) { return ('0' + n).slice(-2); }

function makeSid_(g, c, n) { return String(g) + pad2_(c) + pad2_(n); }

/** '2026-03-02', '2026. 3. 2', '2026/3/2', '2026년 3월 2일' → '2026-03-02' */
function normDate_(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  var m = /(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/.exec(s);
  if (!m) return '';
  var y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return y + '-' + pad2_(mo) + '-' + pad2_(d);
}

/** '15:40', '15:40:00', '오후 3:40:00', 'PM 3:40', '1540' → '15:40' */
function normTime_(v) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  var pm = /오후|pm/i.test(s), am = /오전|am/i.test(s);
  var m = /(\d{1,2})\s*[:시]\s*(\d{1,2})?/.exec(s) || /^(\d{1,2})(\d{2})$/.exec(s);
  if (!m) return '';
  var h = +m[1], mi = +(m[2] || 0);
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  if (h > 23 || mi > 59) return '';
  return pad2_(h) + ':' + pad2_(mi);
}

/** '2026-03-02 9:00' → '2026-03-02 09:00' (시각이 없으면 기본 시각을 붙임) */
function normDateTime_(v, defTime) {
  var s = String(v == null ? '' : v).trim();
  var d = normDate_(s);
  if (!d) return '';
  var rest = s.replace(/(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?/, '');
  return d + ' ' + (normTime_(rest) || defTime || '00:00');
}

/** '월,수' '월수' '월/수' '월요일, 수요일' → ['월','수'] */
function normDays_(v) {
  var s = Array.isArray(v) ? v.join(',') : String(v == null ? '' : v);
  return DAY_ORDER.filter(function (d) { return s.indexOf(d) >= 0; });
}

/** '전체', '', '1,2', '1~3', '1-3학년' → [1,2,3] */
function normGrades_(v, maxGrade) {
  var s = Array.isArray(v) ? v.join(',') : String(v == null ? '' : v).trim();
  var all = [];
  for (var i = 1; i <= maxGrade; i++) all.push(i);
  if (!s || /전체|모두|전학년/.test(s)) return all;
  var out = {};
  s.replace(/(\d)\s*[~\-]\s*(\d)/g, function (m, a, b) {
    for (var g = +a; g <= +b; g++) out[g] = true;
    return '';
  }).replace(/\d/g, function (m) { out[+m] = true; return ''; });
  return all.filter(function (g) { return out[g]; });
}

/** 강좌 행에 계산용 값을 덧붙입니다. */
function prepCourse_(c, s, maxGrade) {
  c.dayList = normDays_(c.days);
  c.gradeList = normGrades_(c.grades, maxGrade);
  c.s = normTime_(c.start);
  c.e = normTime_(c.end);
  c.d1 = normDate_(c.startDate) || normDate_(s.opStart) || '0000-01-01';
  c.d2 = normDate_(c.endDate) || normDate_(s.opEnd) || '9999-12-31';
  c.capNum = int_(c.cap);
  c.minNum = int_(c.min);
  c.feeNum = int_(c.fee);
  c.materialNum = int_(c.material);
  return c;
}

/** 두 강좌가 같은 요일·같은 시간·같은 기간에 겹치면 겹치는 요일 배열, 아니면 null */
function coursesOverlap_(a, b) {
  if (!a || !b || !a.s || !a.e || !b.s || !b.e) return null;
  if (!(a.s < b.e && b.s < a.e)) return null;
  if (!(a.d1 <= b.d2 && b.d1 <= a.d2)) return null;
  var days = a.dayList.filter(function (d) { return b.dayList.indexOf(d) >= 0; });
  return days.length ? days : null;
}

function dayName_(ymd) {
  var p = ymd.split('-');
  return DAY_NAMES[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay()];
}

function addDays_(ymd, n) {
  var p = ymd.split('-');
  var t = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
  return t.getUTCFullYear() + '-' + pad2_(t.getUTCMonth() + 1) + '-' + pad2_(t.getUTCDate());
}

/** 특정 날짜의 한 강좌 수업 (없으면 null). 휴일·휴강·보강·장소/시간 변경을 반영합니다. */
function sessionOn_(c, ymd, holidayMap, changes) {
  var regular = !holidayMap[ymd] && c.dayList.indexOf(dayName_(ymd)) >= 0 && ymd >= c.d1 && ymd <= c.d2;
  var sess = regular ? { date: ymd, start: c.s, end: c.e, room: c.room, state: '정상', note: '' } : null;
  changes.forEach(function (x) {
    if (x.courseId !== c.id || x.date !== ymd) return;
    if (x.type === '보강') {
      sess = { date: ymd, start: x.start || c.s, end: x.end || c.e, room: x.room || c.room, state: '보강', note: x.reason };
    } else if (!sess) {
      return;
    } else if (x.type === '휴강') {
      sess.state = '휴강'; sess.note = x.reason;
    } else {
      if (x.room) sess.room = x.room;
      if (x.start) sess.start = x.start;
      if (x.end) sess.end = x.end;
      if (sess.state === '정상') sess.state = '변경';
      sess.note = x.reason;
    }
  });
  return sess;
}

function sessionsOnDate_(courses, ymd, holidayMap, changes) {
  var out = [];
  courses.forEach(function (c) {
    if (c.status !== '승인') return;
    var x = sessionOn_(c, ymd, holidayMap, changes);
    if (!x) return;
    x.courseId = c.id; x.name = c.name; x.teacher = c.teacher; x.area = c.area; x.origRoom = c.room; x.cap = c.capNum;
    out.push(x);
  });
  return out.sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : (a.room < b.room ? -1 : 1); });
}

function sessionsOfCourse_(c, holidayMap, changes) {
  var out = [], d1 = c.d1, d2 = c.d2;
  changes.forEach(function (x) { if (x.courseId === c.id && x.type === '보강') { if (x.date < d1) d1 = x.date; if (x.date > d2) d2 = x.date; } });
  if (d1 < '1900' || d2 > '9000') return out;
  for (var cur = d1, guard = 0; cur <= d2 && guard < 800; cur = addDays_(cur, 1), guard++) {
    var x = sessionOn_(c, cur, holidayMap, changes);
    if (x) out.push(x);
  }
  return out;
}

/** 중복·충돌 검토 결과 */
function buildReview_(db, s) {
  var max = int_(s.maxCount);
  var live = {}, list = [];
  db.courses.forEach(function (c) { if (c.status !== '폐강' && c.status !== '반려') { live[c.id] = c; list.push(c); } });
  var stu = {};
  db.students.forEach(function (st) { stu[st.sid] = st; });

  var perStu = {};
  db.enroll.forEach(function (e) {
    if (!ACTIVE[e.status] || !live[e.courseId]) return;
    (perStu[e.sid] = perStu[e.sid] || []).push(e);
  });

  var conflicts = [], multi = [], unmatched = [];
  Object.keys(perStu).forEach(function (sid) {
    var es = perStu[sid], name = stu[sid] ? stu[sid].name : es[0].name;
    if (!stu[sid]) es.forEach(function (e) { unmatched.push({ sid: sid, name: e.name, courseId: e.courseId, enrollId: e.id }); });
    var act = es.filter(function (e) { return e.status !== '대기'; });
    for (var i = 0; i < act.length; i++) {
      for (var j = i + 1; j < act.length; j++) {
        var ov = coursesOverlap_(live[act[i].courseId], live[act[j].courseId]);
        if (ov) conflicts.push({ sid: sid, name: name, a: act[i].courseId, b: act[j].courseId, aId: act[i].id, bId: act[j].id, aStatus: act[i].status, bStatus: act[j].status, days: ov.join('·') });
      }
    }
    if (es.length >= 2) multi.push({ sid: sid, name: name, count: act.length, waiting: es.length - act.length, courseIds: es.map(function (e) { return e.courseId; }), over: max > 0 && act.length > max });
  });

  var roomConflicts = [], teacherConflicts = [];
  for (var i = 0; i < list.length; i++) {
    for (var j = i + 1; j < list.length; j++) {
      var a = list[i], b = list[j], ov = coursesOverlap_(a, b);
      if (!ov) continue;
      if (a.room && a.room === b.room) roomConflicts.push({ room: a.room, a: a.id, b: b.id, days: ov.join('·') });
      if (a.teacher && a.teacher === b.teacher) teacherConflicts.push({ teacher: a.teacher, a: a.id, b: b.id, days: ov.join('·') });
    }
  }

  var counts = courseCounts_(db.enroll), over = [], under = [];
  list.forEach(function (c) {
    var n = counts[c.id] || {}, act = (n['선정'] || 0) + (n['신청'] || 0);
    if (c.capNum && act > c.capNum) over.push({ id: c.id, count: act, cap: c.capNum, selected: n['선정'] || 0 });
    if (c.status === '승인' && c.minNum && act < c.minNum) under.push({ id: c.id, count: act, min: c.minNum });
  });

  multi.sort(function (a, b) { return b.count - a.count; });
  return { conflicts: conflicts, multi: multi, roomConflicts: roomConflicts, teacherConflicts: teacherConflicts, over: over, under: under, unmatched: unmatched, maxCount: max };
}

/**
 * 붙여넣은 명단 해석
 * 지원 형식: '10203 홍길동' / '1 2 3 홍길동'(엑셀 칸) / '1-2-3 홍길동' / '1학년 2반 3번 홍길동' / '홍길동'
 */
function parseRoster_(text, students) {
  var bySid = {}, byName = {};
  students.forEach(function (st) { bySid[st.sid] = st; (byName[st.name] = byName[st.name] || []).push(st); });
  var lines = String(text).split(/\r?\n/), out = [], seen = {};
  lines.forEach(function (raw) {
    var line = raw.trim();
    if (!line) return;
    var nameM = line.replace(/(\d)\s*(학년|반|번)/g, '$1 ').match(/[가-힣]{2,5}/);
    var name = nameM ? nameM[0] : '';
    var nums = line.match(/\d+/g) || [];
    if (!nums.length && /^(이름|성명|학년|학번)$/.test(name)) return; // 머리글
    var g = 0, c = 0, n = 0;
    if (nums.length && nums[0].length === 5) { g = +nums[0][0]; c = +nums[0].slice(1, 3); n = +nums[0].slice(3); }
    else if (nums.length && nums[0].length === 4) { g = +nums[0][0]; c = +nums[0][1]; n = +nums[0].slice(2); }
    else if (nums.length >= 3) { g = +nums[0]; c = +nums[1]; n = +nums[2]; }
    var r = { line: line, name: name, sid: '', status: '', msg: '', candidates: [] };
    if (g && c && n) {
      var sid = makeSid_(g, c, n), st = bySid[sid];
      if (!st) { r.status = 'notfound'; r.msg = g + '학년 ' + c + '반 ' + n + '번 학생이 명렬에 없습니다.'; }
      else if (name && st.name !== name) {
        r.status = 'mismatch'; r.msg = '학번은 ' + st.name + ', 입력한 이름은 ' + name + '입니다.';
        r.candidates = [{ sid: st.sid, name: st.name }].concat((byName[name] || []).map(function (x) { return { sid: x.sid, name: x.name }; }));
      } else { r.status = 'ok'; r.sid = sid; r.name = st.name; }
    } else if (name) {
      var cands = byName[name] || [];
      if (cands.length === 1) { r.status = 'ok'; r.sid = cands[0].sid; r.msg = '이름으로 찾음'; }
      else if (cands.length > 1) { r.status = 'ambiguous'; r.msg = '같은 이름이 ' + cands.length + '명 있습니다. 골라 주세요.'; r.candidates = cands.map(function (x) { return { sid: x.sid, name: x.name }; }); }
      else { r.status = 'notfound'; r.msg = '명렬에 없는 이름입니다. (오타 확인)'; }
    } else {
      r.status = 'notfound'; r.msg = '학번이나 이름을 알아볼 수 없습니다.';
    }
    if (r.sid) {
      if (seen[r.sid]) { r.status = 'dup'; r.msg = '위에 이미 있는 학생입니다.'; }
      seen[r.sid] = true;
    }
    out.push(r);
  });
  return out;
}

function shuffle_(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = arr[i];
    arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
