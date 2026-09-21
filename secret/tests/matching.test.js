/* 자율 · 진로 기록 모으기 — 학생 맞추기 테스트
   실행:  node tests/matching.test.js

   여기 있는 사례는 모두 "실제로 겪은 증상" 이다.
   교사가 받는 전교생 취합 파일은 서식이 제각각이라, 한 칸만 달라도
   기록이 통째로 빠지면서 화면에는 "가져올 새 기록이 없습니다" 만 뜬다.
   그래서 실패했던 서식을 하나씩 사례로 남겨 둔다. */

const { loadCore, createRunner } = require("./harness.js");
const C = loadCore();

const t = createRunner("자율 · 진로 가져오기 — 학생 맞추기");

/* ============================================================
   시험용 명단과 시트 만들기
   ============================================================ */
const T1 = "학급 자치 활동에서 서기를 맡아 회의 내용을 빠짐없이 정리해 학급 게시판에 공유하였다.";
const T2 = "진로 탐색 검사 결과를 바탕으로 관심 직업군을 스스로 조사해 발표하였다.";

const roster = (...list) => list.map((x, i) => ({
  id: "s" + (i + 1), no: x.no === undefined ? null : x.no,
  name: x.name, aliasesExtra: x.alias || []
}));

const CLS = { id: "c1", name: "1학년 3반", students: roster(
  { no: 5,  name: "김민수" },
  { no: 12, name: "이서연" },
) };

/* 전교생 파일 — 우리 반은 한참 아래에 나온다 (앞부분만 보면 이름 열을 못 찾는다) */
function schoolRows(ourRows, cols){
  const out = [];
  for(let ban = 1; ban <= 2; ban++){
    for(let no = 1; no <= 30; no++){
      out.push(cols({ grade: "1", ban: String(ban), no: String(no), name: `가상${ban}${no}`, text: T1 }));
    }
  }
  return out.concat(ourRows);
}

/* 시트 하나를 훑는다 — 머리글 찾기 · 열 역할 짐작 · 우리 반 골라내기를 한 번에 */
function plan(header, rows, opt){
  opt = opt || {};
  const cls = opt.cls || CLS;
  const all = header ? [header].concat(rows) : rows;
  const headerRow = opt.headerRow !== undefined ? opt.headerRow : C.findHeaderRow(all);
  const roles = opt.roles || C.guessAcRoles(all, headerRow, cls.students);
  const r = C.planAcSheet({
    sheet: { rows: all }, si: 0, roles, headerRow,
    sheetArea: opt.sheetArea === undefined ? "auto" : opt.sheetArea,
    cls, rowFix: opt.rowFix || {},
    myGrade: opt.myGrade === undefined ? "1" : opt.myGrade,
    myBan:   opt.myBan   === undefined ? "3" : opt.myBan,
    existing: opt.existing || new Set()
  });
  r.roles = roles;
  r.headerRow = headerRow;
  r.names = r.fresh.map(f => (cls.students.find(s => s.id === f.studentId) || {}).name).sort();
  return r;
}

/* ============================================================
   1. 이름 다듬기 — 화면에는 똑같아 보이는데 안 맞던 것들
   ============================================================ */
t.group("1. 이름 다듬기 (nameNfc · acNameKey)");

t.eq("맥에서 온 자모 분리 한글을 합쳐 준다 (NFD → NFC)",
  C.acNameKey("김민수".normalize("NFD")), C.acNameKey("김민수"));
t.ok("자모 분리된 원문은 글자 수부터 다르다 (눈으로는 구분 불가)",
  "김민수".normalize("NFD").length === 8 && "김민수".length === 3);
t.eq("제로폭 공백(U+200B)을 뗀다", C.acNameKey("김민​수"), "김민수");
t.eq("BOM(U+FEFF)을 뗀다", C.acNameKey("﻿김민수"), "김민수");
t.eq("전각 공백을 뗀다", C.acNameKey("김　민수"), "김민수");
t.eq("괄호 표시를 뗀다", C.acNameKey("김민수(2)"), "김민수");
t.eq("대괄호 표시를 뗀다", C.acNameKey("김민수[전출]"), "김민수");
t.eq("꼬리에 붙은 별표를 뗀다", C.acNameKey("김민수*"), "김민수");
t.eq("꼬리에 붙은 ★ 를 뗀다", C.acNameKey("김민수 ★"), "김민수");
t.eq("앞에 붙은 ※ 를 뗀다", C.acNameKey("※김민수"), "김민수");
t.eq("빈 값은 빈 문자열", C.acNameKey(null), "");
t.ok("성을 뗀 이름은 같은 것으로 보지 않는다 (다른 반 학생과 겹친다)",
  C.acNameKey("민수") !== C.acNameKey("김민수"));

/* ============================================================
   2. 숫자 맞추기 — "05" 와 5
   ============================================================ */
t.group("2. 숫자 맞추기 (sameNumStr)");

t.ok('"05" 와 5 는 같은 번호',  C.sameNumStr("05", 5));
t.ok('"01" 과 "1" 은 같은 학년', C.sameNumStr("01", "1"));
t.ok('"3" 과 3 은 같다',         C.sameNumStr("3", 3));
t.ok("2 와 3 은 다르다",         !C.sameNumStr(2, 3));
t.ok("빈 값은 같다고 보지 않는다", !C.sameNumStr("", "1") && !C.sameNumStr("1", null));

/* ============================================================
   3. 학번 쪼개기
   ============================================================ */
t.group("3. 학번 쪼개기 (parseStudentNo)");

t.eq('"10305" → 1학년 3반 5번', C.parseStudentNo("10305"), { grade:"1", ban:"3", no:"5" });
t.eq('"1305" → 1학년 3반 5번',  C.parseStudentNo("1305"),  { grade:"1", ban:"3", no:"5" });
t.eq('"1-3-5" 도 읽는다',       C.parseStudentNo("1-3-5"), { grade:"1", ban:"3", no:"5" });
t.eq('"1-3" 은 학년 · 반까지',   C.parseStudentNo("1-3"),   { grade:"1", ban:"3", no:"" });
t.eq('"1학년 3반" 도 읽는다',    C.parseStudentNo("1학년 3반"), { grade:"1", ban:"3", no:"" });
t.eq('"1-03-05" 의 0 을 떼어 준다', C.parseStudentNo("1-03-05"), { grade:"1", ban:"3", no:"5" });
t.eq("날짜는 학번이 아니다",     C.parseStudentNo("2026.06.22"), null);
t.eq("두 자리 숫자는 학번이 아니다", C.parseStudentNo("10"), null);
t.eq("빈 값은 null",             C.parseStudentNo(""), null);

/* ============================================================
   4. 머리글 찾기 — 제목 · 안내문이 위에 붙은 파일
   ============================================================ */
t.group("4. 머리글 찾기 (findHeaderRow · headKey)");

t.eq('"성 명" 을 "성명" 으로 본다', C.headKey("성 명"), "성명");
t.eq('"이름(한글)" 을 "이름" 으로 본다', C.headKey("이름(한글)"), "이름");

t.eq("제목 · 빈 줄 · 안내문 아래 네 번째 줄을 머리글로 찾는다",
  C.findHeaderRow([
    ["1. 경기공유학교(2026.06.22.~)"],
    [],
    ["", "", "", "", "입력 시 주의사항 ▶", "중복되지 않게 적어 주세요"],
    ["연번", "학년", "반", "번호", "이름", "내용", "바이트수"],
    ["1", "1", "3", "5", "김민수", T1, "95"],
  ]), 3);

t.eq('띄어 쓴 머리글("성 명")도 머리글 줄로 센다',
  C.findHeaderRow([
    ["가짜 제목 한 줄"],
    ["학년", "반", "성 명", "특기 사항"],
  ]), 1);

/* ============================================================
   5. 열 역할 짐작 — 여기서 틀리면 기록이 통째로 빠진다
   ============================================================ */
t.group("5. 열 역할 짐작 (guessAcRoles)");

const rolesOf = (header, rows, cls) =>
  C.guessAcRoles([header].concat(rows), 0, (cls || CLS).students);

t.eq("표준 머리글",
  rolesOf(["연번","학년","반","번호","이름","내용","바이트수"],
          [["1","1","3","5","김민수",T1,"95"]]),
  ["ignore","grade","ban","no","name","text","ignore"]);

t.eq('띄어 쓴 "성 명" 도 이름 열로 본다 (전교생 파일)',
  rolesOf(["학년","반","번호","성 명","내용"],
          schoolRows([["1","3","5","김민수",T1]], r => [r.grade,r.ban,r.no,r.name,r.text])),
  ["grade","ban","no","name","text"]);

t.eq('"이 름" 도 이름 열로 본다',
  rolesOf(["학년","반","번호","이 름","특기 사항"], [["1","3","5","김민수",T1]]),
  ["grade","ban","no","name","text"]);

t.eq('"이름(한글)" 도 이름 열로 본다',
  rolesOf(["학년","반","번호","이름(한글)","내용"], [["1","3","5","김민수",T1]]),
  ["grade","ban","no","name","text"]);

t.eq('내용 머리글에 "학생" 이 들어가도 이름 열로 뺏기지 않는다',
  rolesOf(["학년","반","번호","이름","학생 특기사항"], [["1","3","5","김민수",T1]]),
  ["grade","ban","no","name","text"]);

t.eq('"학생 활동 내용" 한 열뿐이어도 내용으로 본다',
  rolesOf(["학년","반","번호","성 명","학생 활동 내용"], [["1","3","5","김민수",T1]]),
  ["grade","ban","no","name","text"]);

t.eq('"학년반" 한 칸은 학번처럼 쪼갠다',
  rolesOf(["학년반","번호","이름","내용"], [["1-3","5","김민수",T1]]),
  ["sno","no","name","text"]);

t.eq('"구분" 열이 학기를 담으면 영역으로 보지 않는다',
  rolesOf(["구분","학년","반","번호","이름","내용"], [["1학기","1","3","5","김민수",T1]]),
  ["ignore","grade","ban","no","name","text"]);

t.eq('"구분" 열이 자율 · 진로를 담으면 영역으로 본다',
  rolesOf(["구분","학년","반","번호","이름","내용"],
          [["자율활동","1","3","5","김민수",T1],["진로활동","1","3","12","이서연",T2]]),
  ["area","grade","ban","no","name","text"]);

t.eq("이름처럼 보이는 열이 둘이면 글이 짧은 쪽만 이름으로 둔다",
  rolesOf(["학년","반","학생","학생 의견"], [["1","3","김민수",T1]]),
  ["grade","ban","name","text"]);

t.eq("머리글이 아예 없는 전교생 파일도 이름 열을 값으로 찾아낸다",
  C.guessAcRoles(
    schoolRows([["1","3","5","김민수",T1],["1","3","12","이서연",T2]],
               r => [r.grade,r.ban,r.no,r.name,r.text]),
    -1, CLS.students),
  ["ignore","ignore","ignore","name","text"]);

/* ============================================================
   6. 우리 반 골라내기 — 실제로 실패했던 파일 서식들
   ============================================================ */
t.group("6. 우리 반 골라내기 (planAcSheet)");

const STD = ["연번","학년","반","번호","이름","내용"];
const stdRow = (g,b,n,name,text) => ["", g, b, n, name, text];

{
  const r = plan(STD, [stdRow("1","3","5","김민수",T1), stdRow("1","3","12","이서연",T2)]);
  t.eq("표준 서식 — 두 건 다 담는다", [r.fresh.length, r.names], [2, ["김민수","이서연"]]);
  t.eq("영역도 함께 나뉜다", r.fresh.map(f => f.area), ["auto","auto"]);
}

{
  const r = plan(STD, [stdRow("1","3","5","김민수",T1), stdRow("2","3","5","동명이인",T1)]);
  t.eq("다른 학년 줄은 계속 걸러 낸다", [r.fresh.length, r.outOfClass], [1, 1]);
}

{ /* 학년이 "01" 로 적혀 와도 우리 반이다 */
  const r = plan(STD, [stdRow("01","03","5","김민수",T1), stdRow("01","03","12","이서연",T2)]);
  t.eq('학년 · 반에 0 이 붙어 와도 담는다 ("01" = 1학년)', r.fresh.length, 2);
  t.eq("이때 다른 반으로 잘못 빼지 않는다", r.outOfClass, 0);
}

{ /* 학년 · 반이 한 칸에 "1-3" */
  const r = plan(["학년반","번호","이름","내용"],
                 [["1-3","5","김민수",T1], ["2-3","5","남의반",T1]]);
  t.eq('"학년반" 한 칸("1-3")으로도 우리 반을 가른다', [r.fresh.length, r.outOfClass], [1, 1]);
}

{ /* 학번 한 칸 */
  const r = plan(["학번","이름","내용"],
                 [["10305","김민수",T1], ["20305","남의반",T1]]);
  t.eq("학번 한 칸(10305)으로도 우리 반을 가른다", [r.fresh.length, r.outOfClass], [1, 1]);
}

{ /* '구분' 열이 학기 — 예전에는 전 줄이 "자율·진로 아님" 으로 빠졌다 */
  const r = plan(["구분","학년","반","번호","이름","내용"],
                 [["1학기","1","3","5","김민수",T1], ["2학기","1","3","12","이서연",T2]]);
  t.eq('"구분" 열이 학기여도 시트 영역으로 담는다', r.fresh.length, 2);
  t.eq("이때 영역 없음으로 빼지 않는다", r.noArea, 0);
}

{ /* 동아리 · 봉사는 계속 제외 */
  const r = plan(["영역","학년","반","번호","이름","내용"],
                 [["자율활동","1","3","5","김민수",T1],
                  ["동아리활동","1","3","5","김민수",T2],
                  ["봉사활동","1","3","12","이서연",T2]]);
  t.eq("동아리 · 봉사 줄은 담지 않는다", [r.fresh.length, r.noArea], [1, 2]);
  t.eq("영역 칸이 진로면 진로로 담는다",
    plan(["영역","학년","반","번호","이름","내용"],
         [["진로활동","1","3","5","김민수",T2]]).fresh.map(f => f.area), ["career"]);
}

{ /* 내용 머리글에 '학생' — 예전에는 내용 열이 사라져 전 줄이 빠졌다 */
  const r = plan(["학년","반","번호","이름","학생 특기사항"],
                 [["1","3","5","김민수",T1], ["1","3","12","이서연",T2]]);
  t.eq('내용 머리글이 "학생 특기사항" 이어도 담는다', r.fresh.length, 2);
  t.eq("이때 내용 없음으로 빼지 않는다", r.noText, 0);
}

{ /* 띄어 쓴 이름 머리글 + 명단에 번호가 없는 반 */
  const noNo = { id:"c2", name:"1학년 3반", students: roster({ name:"김민수" }, { name:"이서연" }) };
  const r = plan(["학년","반","번호","성 명","내용"],
                 schoolRows([["1","3","5","김민수",T1], ["1","3","12","이서연",T2]],
                            x => [x.grade,x.ban,x.no,x.name,x.text]),
                 { cls: noNo });
  t.eq('"성 명" 머리글 + 명단에 번호가 없어도 이름으로 담는다', r.fresh.length, 2);
  t.eq("이때 못 찾은 이름이 없다", Object.keys(r.unmatched).length, 0);
}

{ /* 번호에 0 이 붙은 동명이인 */
  const twins = { id:"c3", name:"1학년 3반",
    students: roster({ no:5, name:"김민수" }, { no:9, name:"김민수" }) };
  const r = plan(STD, [stdRow("1","3","05","김민수",T1), stdRow("1","3","09","김민수",T2)], { cls: twins });
  t.eq('동명이인을 "05" · "09" 번호로 갈라낸다', r.fresh.length, 2);
  t.eq("확인이 필요한 줄로 남지 않는다", r.ambiguous.length, 0);
  t.eq("서로 다른 학생에게 담긴다", new Set(r.fresh.map(f => f.studentId)).size, 2);
}

{ /* 번호로도 갈리지 않는 동명이인은 교사에게 물어본다 */
  const twins = { id:"c3", name:"1학년 3반",
    students: roster({ no:5, name:"김민수" }, { no:9, name:"김민수" }) };
  const r = plan(["학년","반","이름","내용"], [["1","3","김민수",T1]], { cls: twins });
  t.eq("번호가 없는 동명이인은 담지 않고 확인을 받는다", [r.fresh.length, r.ambiguous.length], [0, 1]);
  t.eq("명단 동명이인을 미리 알려 준다", r.rosterDupes, ["김민수"]);

  /* rowFix 의 열쇠는 "시트번호|머리글 다음부터 센 줄번호|그 줄에서 몇 번째 사람" 이다 */
  const pick = plan(["학년","반","이름","내용"], [["1","3","김민수",T1]],
                    { cls: twins, rowFix: { "0|0|0": "s2" } });
  t.eq("교사가 고른 학생으로 담는다", pick.fresh.map(f => f.studentId), ["s2"]);

  const skip = plan(["학년","반","이름","내용"], [["1","3","김민수",T1]],
                    { cls: twins, rowFix: { "0|0|0": "__skip" } });
  t.eq("건너뛰기를 고르면 담지 않고 목록에만 남긴다",
    [skip.fresh.length, skip.ambiguous.length], [0, 1]);
}

{ /* 동명이인이 아닌 줄도 건너뛸 수 있다 */
  const r = plan(STD, [stdRow("1","3","5","김민수",T1), stdRow("1","3","12","이서연",T2)],
                 { rowFix: { "0|0|0": "__skip" } });
  t.eq("건너뛰기로 표시한 줄만 빠진다", r.names, ["이서연"]);
}

{ /* 맥에서 만든 파일 — 화면에는 똑같은 이름인데 예전에는 "못 찾음" 으로 빠졌다 */
  const r = plan(STD, [stdRow("1","3","5","김민수".normalize("NFD"), T1)]);
  t.eq("자모 분리된 이름(맥 파일)도 찾아낸다", r.names, ["김민수"]);
  t.eq("못 찾음으로 빠지지 않는다", Object.keys(r.unmatched).length, 0);
}

{
  const r = plan(STD, [stdRow("1","3","5","김민​수", T1)]);
  t.eq("제로폭 공백이 섞인 이름도 찾아낸다", r.names, ["김민수"]);
}

{
  const r = plan(STD, [stdRow("1","3","5","김민수(2)",T1), stdRow("1","3","12","5. 이서연",T2)]);
  t.eq("괄호 표시 · 앞에 붙은 번호도 찾아낸다", r.names, ["김민수","이서연"]);
}

{ /* 별칭 */
  const aliased = { id:"c4", name:"1학년 3반",
    students: roster({ no:5, name:"남궁민수", alias:["남궁 민수","민수"] }) };
  const r = plan(STD, [stdRow("1","3","5","남궁 민수",T1)], { cls: aliased });
  t.eq("명단에 넣어 둔 별칭으로도 찾아낸다", r.names, ["남궁민수"]);
}

{ /* 명단에 없는 이름 */
  const r = plan(STD, [stdRow("1","3","7","박서준",T1)]);
  t.eq("명단에 없는 이름은 담지 않고 이름을 보여 준다",
    [r.fresh.length, r.unmatched], [0, { "박서준": 1 }]);
}

{ /* 이름도 번호도 없는 줄 — 예전에는 전 학생이 후보가 되어 확인 목록이 부풀었다 */
  const r = plan(["학년","반","번호","이름","내용"],
                 [["1","3","","",T1], ["1","3","5","김민수",T2]]);
  t.eq("이름도 번호도 없는 줄은 따로 세어 제외한다", [r.fresh.length, r.noWho], [1, 1]);
  t.eq("확인 목록을 부풀리지 않는다", r.ambiguous.length, 0);
}

{ /* 이미 담은 것은 건너뛴다 */
  const first = plan(STD, [stdRow("1","3","5","김민수",T1)]);
  const existing = new Set(first.fresh.map(f => `${f.studentId}|${f.area}|${f.text}`));
  const again = plan(STD, [stdRow("1","3","5","김민수",T1)], { existing });
  t.eq("같은 학생 · 같은 영역 · 같은 문구는 다시 담지 않는다",
    [again.fresh.length, again.dup.length], [0, 1]);
}

{ /* 학년 · 반 열이 없는 시트는 경고를 띄운다 */
  const r = plan(["이름","내용"], [["김민수",T1]]);
  t.eq("학년 · 반 열이 없으면 이름만으로 찾았다고 알린다", [r.nameOnly, r.fresh.length], [true, 1]);
  const r2 = plan(["반","이름","내용"], [["3","김민수",T1]]);
  t.eq("반만 있으면 학년 없음으로 알린다", [r2.nameOnly, r2.noGrade], [false, true]);
}

{ /* 영역을 못 정한 시트는 담지 않는다 */
  const r = plan(STD, [stdRow("1","3","5","김민수",T1)], { sheetArea: "" });
  t.eq("시트 영역을 고르지 않았으면 담지 않는다", [r.fresh.length, r.noArea], [0, 1]);
}

{ /* 내용이 빈 줄 */
  const r = plan(STD, [stdRow("1","3","5","김민수",""), stdRow("1","3","12","이서연",T2)]);
  t.eq("내용이 빈 줄은 세어서 제외한다", [r.fresh.length, r.noText], [1, 1]);
}

/* ============================================================
   7. 한 칸에 여러 사람이 적힌 파일
   같은 활동을 함께 한 학생을 한 줄에 몰아 적어 보내는 학교가 있다.
   ============================================================ */
t.group("7. 한 칸에 여러 사람 (splitPeople)");

const SP = v => C.splitPeople(v, CLS.students);

t.eq("쉼표로 쪼갠다",        SP("김민수, 이서연"), ["김민수","이서연"]);
t.eq("가운뎃점으로 쪼갠다",   SP("김민수·이서연"), ["김민수","이서연"]);
t.eq("슬래시로 쪼갠다",      SP("김민수/이서연"), ["김민수","이서연"]);
t.eq("세미콜론으로 쪼갠다",   SP("김민수;이서연"), ["김민수","이서연"]);
t.eq("칸 안 줄바꿈으로 쪼갠다", SP("김민수\n이서연"), ["김민수","이서연"]);
t.eq("띄어쓰기만 있어도 둘 다 명단에 있으면 쪼갠다", SP("김민수 이서연"), ["김민수","이서연"]);
t.eq('"및" 으로 이어 써도 쪼갠다',  SP("김민수 및 이서연"), ["김민수","이서연"]);
t.eq('"와" 로 이어 써도 쪼갠다',    SP("김민수와 이서연"), ["김민수","이서연"]);
t.eq("번호가 앞에 붙어 있어도 쪼갠다", SP("1.김민수 2.이서연"), ["1.김민수","2.이서연"]);
t.eq("한 사람이면 한 개",      SP("김민수"), ["김민수"]);
t.eq("빈 칸이면 빈 배열",      SP("  "), []);

{ /* 성과 이름을 띄어 쓴 이름을 둘로 찢으면 안 된다 */
  const ng = { id:"c9", name:"1학년 3반", students: roster({ no:5, name:"남궁민수" }) };
  t.eq('"남궁 민수" 는 한 사람으로 본다',
    C.splitPeople("남궁 민수", ng.students), ["남궁 민수"]);
}
t.eq('"김 민수" 도 한 사람으로 본다', SP("김 민수"), ["김 민수"]);

t.eq("쉼표가 든 문장은 사람으로 쪼개지 않는다",
  SP("학급 회의에서 사회를 맡았고, 친구들의 의견을 차분히 정리하였다"),
  ["학급 회의에서 사회를 맡았고, 친구들의 의견을 차분히 정리하였다"]);

t.eq("번호 칸도 여러 개를 쪼갠다", C.splitNums("5, 12"), ["5","12"]);
t.eq('"5번 12번" 도 쪼갠다',      C.splitNums("5번 12번"), ["5","12"]);
t.eq('"05" 는 그대로 한 개',      C.splitNums("05"), ["05"]);

t.eq('"5. 김민수" 에서 번호를 뽑는다', C.parseNamePiece("5. 김민수"), { name:"김민수", no:"5" });
t.eq('"김민수 5번" 에서도 뽑는다',     C.parseNamePiece("김민수 5번"), { name:"김민수", no:"5" });
t.eq("번호가 없으면 이름만",           C.parseNamePiece("김민수"), { name:"김민수", no:"" });

/* ---- 실제로 담기는지 ---- */
{
  const r = plan(["학년","반","이름","내용"], [["1","3","김민수, 이서연",T1]]);
  t.eq("한 칸에 두 명 — 두 학생에게 같은 문구를 담는다", r.names, ["김민수","이서연"]);
  t.eq("두 건 모두 같은 내용", r.fresh.map(f => f.text), [T1, T1]);
  t.eq("여러 명이 적힌 줄 수를 알려 준다", r.multiRows, 1);
}

{
  const r = plan(STD, [stdRow("1","3","5, 12","김민수, 이서연",T1)]);
  t.eq("이름과 번호가 같은 개수면 순서대로 짝짓는다", r.names, ["김민수","이서연"]);
}

{ /* 짝짓기가 동명이인을 갈라낸다 */
  const twins = { id:"cA", name:"1학년 3반",
    students: roster({ no:5, name:"김민수" }, { no:9, name:"김민수" }, { no:12, name:"이서연" }) };
  const r = plan(STD, [stdRow("1","3","9, 12","김민수, 이서연",T1)], { cls: twins });
  t.eq("짝지은 번호로 동명이인을 가른다",
    [r.fresh.map(f => f.studentId), r.ambiguous.length], [["s2","s3"], 0]);
}

{ /* 번호가 없으면 동명이인만 확인을 받고, 나머지는 담는다 */
  const twins = { id:"cB", name:"1학년 3반",
    students: roster({ no:5, name:"김민수" }, { no:9, name:"김민수" }, { no:12, name:"이서연" }) };
  const r = plan(["학년","반","이름","내용"], [["1","3","김민수, 이서연",T1]], { cls: twins });
  t.eq("한 줄 안에서 확인이 필요한 사람만 빼고 담는다",
    [r.names, r.ambiguous.length], [["이서연"], 1]);
}

{ /* 한 칸에 동명이인이 둘 — 확인 열쇠가 겹치지 않아야 각각 고를 수 있다 */
  const twins = { id:"cC", name:"1학년 3반",
    students: roster({ no:5, name:"김민수" }, { no:9, name:"김민수" }) };
  const r = plan(["학년","반","이름","내용"], [["1","3","김민수, 김민수",T1]], { cls: twins });
  t.eq("두 사람 몫의 확인 줄이 따로 생긴다", r.ambiguous.length, 2);
  t.eq("확인 열쇠가 서로 다르다", new Set(r.ambiguous.map(a => a.key)).size, 2);

  const picked = plan(["학년","반","이름","내용"], [["1","3","김민수, 김민수",T1]],
                      { cls: twins, rowFix: { "0|0|0": "s1", "0|0|1": "s2" } });
  t.eq("각각 다른 학생으로 고를 수 있다",
    picked.fresh.map(f => f.studentId).sort(), ["s1","s2"]);
}

{ /* 다른 반 학생이 섞여 있으면 그 이름만 못 찾음 */
  const r = plan(["학년","반","이름","내용"], [["1","3","김민수, 박서준, 이서연",T1]]);
  t.eq("명단에 있는 사람만 담고, 없는 이름은 따로 알려 준다",
    [r.names, r.unmatched], [["김민수","이서연"], { "박서준": 1 }]);
}

{ /* 같은 사람이 두 번 적혀 있어도 한 번만 담는다 */
  const r = plan(["학년","반","이름","내용"], [["1","3","김민수, 김민수",T1]]);
  t.eq("같은 사람이 겹쳐 적혀 있으면 한 번만 담는다",
    [r.fresh.length, r.dup.length], [1, 1]);
}

{ /* 이름 열이 없고 번호만 여러 개 */
  const r = plan(["학년","반","번호","내용"], [["1","3","5, 12",T1]]);
  t.eq("번호만 여러 개 적혀 있어도 나눠 담는다", r.names, ["김민수","이서연"]);
}

{ /* 여러 명 칸이 섞인 시트의 열 역할 */
  t.eq("여러 명이 적힌 칸이 있어도 이름 열로 알아본다",
    C.guessAcRoles([["학년","반","성 명","내용"],
                    ["1","3","김민수, 이서연",T1],
                    ["1","3","김민수",T2]], 0, CLS.students),
    ["grade","ban","name","text"]);

  t.eq("쉼표가 든 내용 열을 이름 열로 오인하지 않는다",
    C.guessAcRoles([["학년","반","이름","기록"],
                    ["1","3","김민수","학급 회의에서 사회를 맡았고, 의견을 정리하였다"],
                    ["1","3","이서연","진로 검사 결과를 바탕으로, 관심 직업을 조사하였다"]], 0, CLS.students),
    ["grade","ban","name","text"]);
}

/* ============================================================
   8. 전교생 파일 통째로
   ============================================================ */
t.group("8. 전교생 파일 통째로");

{
  const rows = schoolRows([["1","3","5","김민수",T1], ["1","3","12","이서연",T2]],
                          r => [r.grade, r.ban, r.no, r.name, r.text]);
  const r = plan(["학년","반","번호","이름","내용"], rows);
  t.eq("60줄 중 우리 반 두 줄만 골라낸다", [r.fresh.length, r.outOfClass], [2, 60]);
  t.eq("다른 반 이름은 못 찾음으로 쌓이지 않는다", Object.keys(r.unmatched).length, 0);
}

t.done();
