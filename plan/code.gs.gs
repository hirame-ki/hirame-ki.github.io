// ╔══════════════════════════════════════════════════════════════════════╗
// ║       고교학점제 과목 설계 — Google Apps Script 백엔드 v2.1          ║
// ║       제작: 성포고 황성재 @hirame.ki                                  ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║  📌 처음 한 번만 — 배포 방법                                          ║
// ║  1. 상단 메뉴 → 확장프로그램 → Apps Script                           ║
// ║  2. [배포] → [새 배포] → ⚙️ → [웹 앱]                              ║
// ║  ⚠️  실행 계정: 나(본인) / 액세스: 모든 사용자(익명 포함)             ║
// ║  3. [배포] → 권한 허용 → URL 복사                                    ║
// ║  4. hirame-ki.github.io/plan → 로고(H) 5번 클릭 → 배포 URL 붙여넣기  ║
// ║                                                                      ║
// ║  ⚠️  코드 수정 시 반드시 [배포] → [기존 배포 관리] → 새 버전으로     ║
// ║      재배포해야 변경사항이 반영됩니다.                                 ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── 설정값 ────────────────────────────────────────────────────────────
const SHEET_STUDENTS  = '학생명단';
const SHEET_SELECTION = '과목선택';
const SHEET_MEMO      = '상담메모';
const SHEET_SCHEDULE  = '편제표';
const SHEET_CONFIG    = '⚙️ 설정';
const SHEET_GUIDE     = '📖 사용설명서';
// ──────────────────────────────────────────────────────────────────────

const SEM_DEFS = [
  { label: '1학년 1학기', year: 1, sem: 1 },
  { label: '1학년 2학기', year: 1, sem: 2 },
  { label: '2학년 1학기', year: 2, sem: 1 },
  { label: '2학년 2학기', year: 2, sem: 2 },
  { label: '3학년 1학기', year: 3, sem: 1 },
  { label: '3학년 2학기', year: 3, sem: 2 },
];

/* ══════════════════════════════════════════════════════
   onOpen — 스프레드시트 열 때 메뉴 생성
══════════════════════════════════════════════════════ */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 학점설계 관리')
    .addItem('🔧 시트 초기화 (처음 한 번만)', 'initAllSheets')
    .addSeparator()
    .addItem('📊 제출 현황 요약',   'showSummary')
    .addItem('🔓 전체 잠금 해제',   'unlockAll')
    .addSeparator()
    .addItem('📋 편제표 시트 열기', 'openScheduleSheet')
    .addItem('⚙️ 설정 시트 열기',  'openConfigSheet')
    .addItem('📅 마감일 설정',      'promptSetDeadline')
    .addSeparator()
    .addItem('📖 사용설명서 열기',  'openGuideSheet')
    .addToUi();
}

/* ══════════════════════════════════════════════════════
   initAllSheets — 모든 시트 생성/초기화
══════════════════════════════════════════════════════ */
function initAllSheets() {
  getStudentsSheet();
  getSelectionSheet();
  getMemoSheet();
  initScheduleSheet();
  initConfigSheet();
  createGuideSheet();
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const guide = ss.getSheetByName(SHEET_GUIDE);
  if (guide) { ss.setActiveSheet(guide); ss.moveActiveSheet(1); }
  SpreadsheetApp.getUi().alert(
    '✅ 초기화 완료!\n\n' +
    '생성된 시트:\n' +
    '  📖 사용설명서  ·  학생명단  ·  과목선택\n' +
    '  상담메모  ·  편제표  ·  ⚙️ 설정\n\n' +
    '사용설명서 탭을 먼저 읽어보세요!'
  );
}

function openScheduleSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(ss.getSheetByName(SHEET_SCHEDULE) || initScheduleSheet());
}
function openConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setActiveSheet(ss.getSheetByName(SHEET_CONFIG) || initConfigSheet());
}
function openGuideSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const g  = ss.getSheetByName(SHEET_GUIDE);
  if (g) ss.setActiveSheet(g); else createGuideSheet();
}

/* ══════════════════════════════════════════════════════
   promptSetDeadline
══════════════════════════════════════════════════════ */
function promptSetDeadline() {
  const ui       = SpreadsheetApp.getUi();
  const current  = getDeadline();
  const response = ui.prompt(
    '📅 제출 마감일 설정',
    '날짜를 입력하세요 (YYYY-MM-DD)\n현재 마감일: ' + (current || '미설정') + '\n\n비우고 확인 시 마감일 해제',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const val = response.getResponseText().trim();
  setDeadline(val);
  ui.alert(val ? '✅ 마감일이 ' + val + '로 설정되었습니다.' : '✅ 마감일이 해제되었습니다.');
}

/* ══════════════════════════════════════════════════════
   제출 현황 요약
══════════════════════════════════════════════════════ */
function showSummary() {
  const students  = getAllStudents();
  const total     = students.length;
  const submitted = students.filter(s => s.submitted).length;
  const confirmed = students.filter(s => s.confirmed).length;
  const deadline  = getDeadline();
  SpreadsheetApp.getUi().alert(
    '📊 제출 현황 요약\n\n' +
    '전체 학생:   ' + total + '명\n' +
    '제출 완료:   ' + submitted + '명\n' +
    '확정 완료:   ' + confirmed + '명\n' +
    '상담 대기:   ' + (submitted - confirmed) + '명\n' +
    '미제출:      ' + (total - submitted) + '명\n' +
    '\n제출 마감일: ' + (deadline || '미설정')
  );
}

/* ══════════════════════════════════════════════════════
   전체 잠금 해제
══════════════════════════════════════════════════════ */
function unlockAll() {
  const ui     = SpreadsheetApp.getUi();
  const result = ui.alert('⚠️ 전체 잠금 해제', '모든 학생의 잠금을 해제하시겠습니까?', ui.ButtonSet.YES_NO);
  if (result !== ui.Button.YES) return;
  const sheet = getStudentsSheet();
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      sheet.getRange(i + 1, 3).setValue(false);
      sheet.getRange(i + 1, 1, 1, 5).setBackground('#e8f0fe');
    }
  }
  ui.alert('✅ 전체 잠금 해제 완료!');
}

/* ══════════════════════════════════════════════════════
   GET 요청 처리
══════════════════════════════════════════════════════ */
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getStudent') {
    const id = e.parameter.id;
    if (!id) return jsonRes({ ok: false, error: '학번이 없습니다' });
    const student = findStudent(id);
    if (!student) return jsonRes({ ok: true, data: null });
    const selection = findSelection(id);
    return jsonRes({ ok: true, data: Object.assign({}, student, selection) });
  }

  if (action === 'getAllStudents') {
    return jsonRes({ ok: true, data: getAllStudents() });
  }

  if (action === 'getStudentList') {
    return jsonRes({ ok: true, data: getStudentList() });
  }

  if (action === 'getSchedule') {
    const data = readScheduleFromSheet();
    if (!data) return jsonRes({ ok: false, error: '편제표 시트가 없습니다' });
    return jsonRes({ ok: true, data: data, deadline: getDeadline() || null });
  }

  return jsonRes({ ok: false, error: '알 수 없는 요청' });
}

/* ══════════════════════════════════════════════════════
   POST 요청 처리
══════════════════════════════════════════════════════ */
function doPost(e) {
  const body   = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === 'submitSelection') {
    const student = findStudent(body.id);
    if (!student) return jsonRes({ ok: false, error: '등록되지 않은 학번입니다' });
    if (student.locked) return jsonRes({ ok: false, error: '이미 제출된 선택입니다.' });
    saveSelection(body);
    lockStudent(body.id, true);
    return jsonRes({ ok: true });
  }

  if (action === 'autoSave') {
    saveAutoSelection(body);
    return jsonRes({ ok: true });
  }

  if (action === 'addStudent') {
    if (findStudent(body.id)) return jsonRes({ ok: false, error: '이미 등록된 학번입니다' });
    addStudent(body.id, body.name);
    return jsonRes({ ok: true });
  }

  if (action === 'removeStudent') {
    removeStudent(body.id);
    return jsonRes({ ok: true });
  }

  if (action === 'confirmStudent') {
    setConfirmed(body.id, true);
    return jsonRes({ ok: true });
  }

  if (action === 'unconfirmStudent') {
    setConfirmed(body.id, false);
    return jsonRes({ ok: true });
  }

  if (action === 'unlockStudent') {
    lockStudent(body.id, false);
    setConfirmed(body.id, false);
    return jsonRes({ ok: true });
  }

  if (action === 'saveMemo') {
    saveMemo(body.id, body.memo);
    return jsonRes({ ok: true });
  }

  if (action === 'saveSchedule') {
    if (!body.data) return jsonRes({ ok: false, error: '편제표 데이터가 없습니다' });
    writeScheduleToSheet(body.data);
    return jsonRes({ ok: true });
  }

  if (action === 'saveDeadline') {
    setDeadline(body.deadline || '');
    return jsonRes({ ok: true });
  }

  return jsonRes({ ok: false, error: '알 수 없는 요청' });
}

/* ══════════════════════════════════════════════════════
   편제표 시트 (4열 × 6학기 = 24열, 행 50개)
══════════════════════════════════════════════════════ */
function initScheduleSheet() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SCHEDULE);
  if (sheet) { sheet.clearFormats(); sheet.clear(); }
  else { sheet = ss.insertSheet(SHEET_SCHEDULE); sheet.setTabColor('#7b1fa2'); }

  const NEEDED = 24;
  if (sheet.getMaxColumns() < NEEDED)
    sheet.insertColumnsAfter(sheet.getMaxColumns(), NEEDED - sheet.getMaxColumns());

  const W = { NUM: 25, NAME: 130, CR: 45, TYPE: 60 };
  for (let s = 0; s < 6; s++) {
    const b = s * 4 + 1;
    sheet.setColumnWidth(b,     W.NUM);
    sheet.setColumnWidth(b + 1, W.NAME);
    sheet.setColumnWidth(b + 2, W.CR);
    sheet.setColumnWidth(b + 3, W.TYPE);
  }

  const YC = [
    { year:'#1a237e', s1:'#1565c0', s2:'#1976d2', d1:'#e3f2fd', d2:'#e8f5e9', h1:'#bbdefb', h2:'#c8e6c9' },
    { year:'#4a148c', s1:'#6a1b9a', s2:'#7b1fa2', d1:'#f3e5f5', d2:'#fce4ec', h1:'#e1bee7', h2:'#f8bbd9' },
    { year:'#bf360c', s1:'#d84315', s2:'#e64a19', d1:'#fbe9e7', d2:'#fff3e0', h1:'#ffccbc', h2:'#ffe0b2' },
  ];

  const R_HDR  = 3;
  const R_MAX  = 50;
  const R_LAST = R_HDR + R_MAX;

  sheet.setRowHeight(1, 32);
  sheet.setRowHeight(2, 26);
  for (let r = R_HDR; r <= R_LAST; r++) sheet.setRowHeight(r, 22);

  for (let y = 0; y < 3; y++) {
    const c  = YC[y];
    const b1 = y * 8 + 1;
    const b2 = y * 8 + 5;

    sheet.getRange(1, b1, 1, 8).merge().setValue((y+1) + '학년')
      .setBackground(c.year).setFontColor('#fff').setFontWeight('bold').setFontSize(13)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');

    sheet.getRange(1, b1, R_LAST, 1)
      .setBorder(null, true, null, null, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_THICK);

    for (let s = 0; s < 2; s++) {
      const b     = s === 0 ? b1 : b2;
      const label = (y+1) + '학년 ' + (s+1) + '학기';
      const bgHdr = s === 0 ? c.s1 : c.s2;
      const bgSub = s === 0 ? c.h1 : c.h2;
      const bgDat = s === 0 ? c.d1 : c.d2;

      sheet.getRange(2, b, 1, 4).merge().setValue(label)
        .setBackground(bgHdr).setFontColor('#fff').setFontWeight('bold')
        .setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');

      if (s === 1) {
        sheet.getRange(1, b, R_LAST, 1)
          .setBorder(null, true, null, null, null, null, '#555555', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      ['No','과목명','학점','구분'].forEach(function(lbl, li) {
        var cell = sheet.getRange(R_HDR, b + li);
        cell.setValue(lbl).setBackground(bgSub).setFontWeight('bold')
          .setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle')
          .setBorder(true,true,true,true,null,null,'#9e9e9e',SpreadsheetApp.BorderStyle.SOLID);
      });

      for (let r = 0; r < R_MAX; r++) {
        const row = R_HDR + 1 + r;

        sheet.getRange(row, b).setValue(r+1)
          .setBackground(bgDat).setFontColor('#9e9e9e').setFontSize(9).setHorizontalAlignment('center');

        sheet.getRange(row, b+1).setBackground('#ffffff').setFontSize(10)
          .setBorder(true,true,true,true,null,null,'#e0e0e0',SpreadsheetApp.BorderStyle.SOLID);

        var crCell = sheet.getRange(row, b+2);
        crCell.setBackground('#fafafa').setHorizontalAlignment('center').setFontSize(10)
          .setBorder(true,true,true,true,null,null,'#e0e0e0',SpreadsheetApp.BorderStyle.SOLID);
        crCell.setDataValidation(
          SpreadsheetApp.newDataValidation().requireNumberBetween(1,8)
            .setAllowInvalid(false).setHelpText('1~8 사이 학점 입력').build()
        );

        var typCell = sheet.getRange(row, b+3);
        typCell.setBackground('#fafafa').setHorizontalAlignment('center').setFontSize(10)
          .setBorder(true,true,true,true,null,null,'#e0e0e0',SpreadsheetApp.BorderStyle.SOLID);
        typCell.setDataValidation(
          SpreadsheetApp.newDataValidation().requireValueInList(['공통','선택'],true)
            .setAllowInvalid(false).setHelpText('"공통" 또는 "선택"').build()
        );
      }
    }
  }

  sheet.getRange(1, NEEDED, R_LAST, 1)
    .setBorder(null,null,null,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID_THICK);

  const guideRow = R_LAST + 2;
  sheet.getRange(guideRow, 1, 1, NEEDED).merge()
    .setValue('✏️  과목명 입력 → 학점(숫자) → 구분(공통/선택) 선택. 저장 후 웹 앱 [↻ 서버에서 불러오기] 클릭하면 학생 화면에 즉시 반영됩니다.')
    .setBackground('#fff9c4').setFontColor('#5d4037').setFontSize(10)
    .setFontStyle('italic').setVerticalAlignment('middle');
  sheet.setRowHeight(guideRow, 28);
  sheet.setFrozenRows(3);
  return sheet;
}

/* ══════════════════════════════════════════════════════
   ⚙️ 설정 시트
══════════════════════════════════════════════════════ */
function initConfigSheet() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) { sheet = ss.insertSheet(SHEET_CONFIG); sheet.setTabColor('#795548'); }
  else { sheet.clear(); sheet.clearFormats(); }

  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 420);

  var hdr = sheet.getRange(1, 1, 1, 3);
  hdr.setValues([['설정 키','값','설명']]);
  hdr.setBackground('#4e342e').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 26);

  var configs = [
    ['deadline',    '', '제출 마감일 (YYYY-MM-DD). 예: 2025-03-31  |  비우면 미설정'],
    ['school_name', '', '학교명. 학생 화면에 표시됩니다'],
    ['class_info',  '', '학년·반 정보. 예: 3학년 2반'],
    ['teacher_name','', '담임 교사 이름'],
  ];

  var rowColors = ['#efebe9','#fafafa'];
  configs.forEach(function(cfg, i) {
    var row = i + 2;
    sheet.setRowHeight(row, 24);
    sheet.getRange(row,1).setValue(cfg[0])
      .setBackground(rowColors[i%2]).setFontWeight('bold').setFontSize(10)
      .setFontColor('#3e2723').setFontFamily('Courier New');
    sheet.getRange(row,2).setValue(cfg[1])
      .setBackground('#ffffff').setFontSize(11)
      .setBorder(true,true,true,true,null,null,'#d7ccc8',SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(row,3).setValue(cfg[2])
      .setBackground(rowColors[i%2]).setFontSize(10).setFontColor('#5d4037').setFontStyle('italic');
  });

  var gr = configs.length + 3;
  sheet.getRange(gr, 1, 1, 3).merge()
    .setValue('⚠️  B열(값)만 수정하세요. A열(키)과 C열(설명)은 변경하지 마세요.')
    .setBackground('#fff3e0').setFontColor('#bf360c').setFontSize(10).setFontStyle('italic').setVerticalAlignment('middle');
  sheet.setRowHeight(gr, 28);
  return sheet;
}

/* ══════════════════════════════════════════════════════
   사용설명서 시트
══════════════════════════════════════════════════════ */
function createGuideSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ex = ss.getSheetByName(SHEET_GUIDE);
  if (ex) ss.deleteSheet(ex);

  var sheet = ss.insertSheet(SHEET_GUIDE, 0);
  sheet.setTabColor('#e91e63');
  sheet.setColumnWidth(1, 30);
  sheet.setColumnWidth(2, 700);

  var T = '#1a237e'; var TF = '#ffffff';
  var S = '#e8eaf6'; var SF = '#1a237e';
  var W = '#fff8e1'; var WF = '#e65100';
  var N = '#e8f5e9'; var NF = '#1b5e20';
  var B = '#f5f5f5'; var BF = '#424242';
  var O = '#ffffff'; var OF = '#333333';
  var P = '#f3e5f5'; var PF = '#4a148c';
  var H = '#e0f2f1'; var HF = '#004d40';  // 핵심 안내 박스(청록)

  var rows = [
    [T,TF,'bold',  16,'📚 고교학점제 과목 설계 시스템 — 사용설명서 v2.1'],
    [T,TF,'normal',11,'제작: 성포고 황성재 @hirame.ki  |  최종 업데이트: 2026.5.22.'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'🗺️  시스템 전체 구조'],
    [B,BF,'normal',10,'   이 시스템은 웹 앱(index.html)과 Google Apps Script(Code.gs) 두 부분으로 구성됩니다.'],
    [O,OF,'normal',11,'   ① 웹 앱 (index.html)  →  학생·교사가 브라우저로 접속하는 화면(hirame-ki.github.io/plan)'],
    [O,OF,'normal',11,'   ② Google Apps Script (Code.gs)  →  데이터 저장/조회 서버 (이 스프레드시트)'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'📋  시트 구조 및 역할'],
    [B,BF,'bold',  10,'   시트명                  역할'],
    [O,OF,'normal',11,'   📖 사용설명서           본 안내 시트 (자동 생성, 직접 수정 불필요)'],
    [O,OF,'normal',11,'   학생명단                학번·이름·잠금·확정 여부 관리. 웹 앱에서 자동 관리됨'],
    [O,OF,'normal',11,'   과목선택                학생 제출 데이터 자동 기록. 임시저장은 회색, 제출은 노랑, 확정은 초록'],
    [O,OF,'normal',11,'   상담메모                교사가 각 학생에 입력하는 개인 상담 메모 (웹 앱에서 입력)'],
    [O,OF,'normal',11,'   편제표                  ★ 학교 과목 편제 입력. 웹 앱에 자동 동기화'],
    [O,OF,'normal',11,'   ⚙️ 설정                마감일 등 설정값 (웹 앱에서도 변경 가능)'],
    [W,WF,'normal',10,'   ※ 시트 이름·헤더 행은 절대 수정하지 마세요. 코드에서 이름으로 시트를 찾습니다.'],
    [O,O, 'normal',10,''],
    // ── 신규 핵심 안내 섹션 ──
    [H,HF,'bold',  13,'⭐  공유받은 교사가 해야 할 일 (요약)'],
    [H,HF,'normal',11,'   이 스프레드시트는 데이터 저장 서버 역할만 합니다. 교사가 시트에서 직접 입력할 것은 단 두 가지뿐입니다.'],
    [N,NF,'bold',  12,'   ✅  ① 「학생명단」 시트에 학번·이름만 입력'],
    [O,OF,'normal',11,'        · A열 학번 / B열 이름만 작성. C·D·E열은 자동 처리됩니다.'],
    [O,OF,'normal',11,'        · 웹 앱의 [📤 엑셀 일괄 등록] 기능을 쓰면 더 빠릅니다.'],
    [N,NF,'bold',  12,'   ✅  ② 「편제표」 시트에 학교 과목을 정확히 입력'],
    [O,OF,'normal',11,'        · 학년·학기별 칸에 과목명 → 학점(숫자) → 구분(공통/선택) 입력'],
    [O,OF,'normal',11,'        · 입력 후 웹 앱에서 [↻ 서버에서 불러오기] 한 번 클릭'],
    [W,WF,'bold',  11,'   🚫  나머지(마감일·상담메모·확정·잠금해제·엑셀 내보내기 등)는 전부 웹 앱에서 해결하세요.'],
    [W,WF,'normal',10,'        시트를 직접 만지면 오히려 오류가 생길 수 있습니다. 시트는 "저장 서버" 역할만 합니다.'],
    [O,O, 'normal',10,''],
    // ── 기존 처음 설정 섹션 ──
    [S,SF,'bold',  13,'🔧  처음 설정 (1회)'],
    [O,OF,'normal',11,'   1. 상단 메뉴 → 확장프로그램 → Apps Script'],
    [O,OF,'normal',11,'   2. [배포] → [새 배포] → ⚙️ → [웹 앱] 선택'],
    [W,WF,'bold',  11,'   3. 실행 계정: 나(본인)  /  액세스: 모든 사용자(익명 포함)  ← 반드시!'],
    [O,OF,'normal',11,'   4. [배포] → 권한 허용 → 생성된 URL 복사'],
    [O,OF,'normal',11,'   5. hirame-ki.github.io/plan 접속 → 로고(H) 5번 클릭 → 배포 URL 붙여넣기 → 저장'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'📝  편제표 입력 방법 (핵심!)'],
    [O,OF,'normal',11,'   1. [📚 학점설계 관리] → [📋 편제표 시트 열기]'],
    [O,OF,'normal',11,'   2. 학년·학기별 칸에 과목명 → 학점(숫자) → 구분 드롭다운(공통/선택) 입력'],
    [W,WF,'bold',  11,'   3. ⚠️  "공통"으로 설정한 과목은 학생 앱에서 자동 선택·고정됩니다.'],
    [O,OF,'normal',11,'   4. 웹 앱 교사 설정 탭 → [↻ 서버에서 불러오기] → 학생 화면에 즉시 반영'],
    [W,WF,'normal',10,'   ※ 웹 앱에서 편제표를 저장해도 이 시트에 자동 기록됩니다. 양방향 동기화.'],
    [W,WF,'normal',10,'   ※ 웹 앱의 드래그 앤 드롭(PDF·엑셀 자동 인식)보다 시트 직접 입력이 훨씬 정확합니다.'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'🔢  학번 구조 및 학년 자동 인식'],
    [O,OF,'normal',11,'   형식: 학년(1자리) + 반(2자리) + 번호(2자리) = 5자리  예) 10101 = 1학년 1반 1번'],
    [P,PF,'bold',  11,'   1XXXX → 1학년    2XXXX → 2학년    3XXXX → 3학년  (첫 자리로 자동 판별)'],
    [W,WF,'normal',10,'   ※ 학년 진급 시 학번 앞자리도 바뀌는 학교에서만 정확히 작동합니다.'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'👨‍🎓  학생 명단 등록'],
    [O,OF,'bold',  11,'   방법 1 — 엑셀 일괄 등록 (가장 추천) ★'],
    [O,OF,'normal',11,'     웹 앱 설정 탭 → [📥 샘플 양식 다운로드] → 학번·이름 작성 → [📤 엑셀 업로드]'],
    [O,OF,'normal',11,'     .xlsx/.xls 지원  |  헤더 자동 인식  |  중복 학번 자동 건너뜀'],
    [O,OF,'bold',  11,'   방법 2 — 웹 앱 개별 추가'],
    [O,OF,'normal',11,'     교사 설정 탭 → 학생 명단 관리 → 학번+이름 입력 후 [추가]'],
    [O,OF,'bold',  11,'   방법 3 — 학생명단 시트 직접 입력 (비추천)'],
    [O,OF,'normal',11,'     A: 학번(숫자)  B: 이름  만 입력하면 됩니다. C·D·E열은 자동 처리'],
    [N,NF,'normal',10,'   💡  C열(잠금)·D열(확정)을 비워두면 자동으로 FALSE 처리되어 정상 작동합니다.'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'🖥️  교사 대시보드 기능'],
    [O,OF,'bold',  11,'   [전체 학생 탭]  이름·학번 검색 / 제출상태 필터 / 학점·국영수 초과 표시'],
    [O,OF,'bold',  11,'   [학생 상세 탭]  과목 목록·그래프·핵심권장 현황 / 확정·잠금해제 / 상담메모'],
    [O,OF,'bold',  11,'   [설정 탭]'],
    [O,OF,'normal',11,'     · GAS URL 변경 / 초기 설정 초기화'],
    [O,OF,'normal',11,'     · 학생 공유 링크 표시 및 복사'],
    [O,OF,'normal',11,'     · 제출 마감일 설정/해제 → 학생 화면에 D-day 카운트다운 표시'],
    [O,OF,'normal',11,'     · 편제표 수정 / 서버에서 불러오기'],
    [O,OF,'normal',11,'     · 학생 개별 추가 / 엑셀 일괄 등록 / 목록 확인'],
    [O,OF,'normal',11,'     · 📊 엑셀 내보내기 (전체현황 + 과목선택상세, 색상 디자인 포함)'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'👩‍🎓  학생 화면 기능'],
    [O,OF,'normal',11,'   [① 대학·학과]  대학 → 계열 → 학과 선택 → 핵심권장·일반권장 과목 표시'],
    [O,OF,'normal',11,'   [② 과목 설계]  학기별 과목 클릭으로 선택/해제. 공통과목은 자동 선택·고정'],
    [O,OF,'normal',11,'   · 총학점 진행 바 / 국영수 81학점 제한 바 / 영역별 이수 그래프 실시간 반영'],
    [O,OF,'normal',11,'   · 국·영·수 81학점 초과 시 제출 차단 + 빨간 경고 팝업'],
    [O,OF,'normal',11,'   · 과목 선택 충돌 감지 14가지 (미적분Ⅰ 없이 Ⅱ 선택 등 위계 경고)'],
    [O,OF,'normal',11,'   · 30초 자동 임시저장 + 브라우저 닫기 직전 저장'],
    [O,OF,'normal',11,'   · 편제표 미설정 시 샘플 데이터 경고 배너'],
    [O,OF,'normal',11,'   · 마감일 D-day 표시 (3일 이내: 주황, 마감 후: 빨강)'],
    [O,OF,'normal',11,'   · 과목명 로마자(Ⅰ,Ⅱ)↔숫자(1,2) 혼용 자동 통일'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,"🎨  '과목선택' 시트의 색상 의미"],
    ['#e8f0fe',OF,'normal',11,'   파랑 (학생명단)  →  등록됨, 미제출'],
    ['#fce8e6',OF,'normal',11,'   빨강 (학생명단)  →  학생 제출완료, 교사 확인 대기'],
    ['#e6f4ea',OF,'normal',11,'   초록 (학생명단)  →  교사 최종 확정 완료'],
    ['#fff8e1',OF,'normal',11,'   노랑 (과목선택)  →  최종 제출됨'],
    ['#f3f3f3',OF,'normal',11,'   회색 (과목선택)  →  학생 임시저장 (미제출)'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'⚠️  주의사항'],
    [W,WF,'bold',  11,'   1. Code.gs 수정 시 반드시 새 버전으로 재배포해야 반영됩니다.'],
    [W,WF,'normal',11,'   2. 시트 이름(학생명단, 과목선택 등)을 변경하면 오류가 발생합니다.'],
    [W,WF,'normal',11,'   3. 학생 데이터는 이 스프레드시트에 저장됩니다. 삭제 시 데이터 손실됩니다.'],
    [W,WF,'normal',11,'   4. 편제표 시트 직접 수정 후 웹 앱 [↻ 서버에서 불러오기]를 클릭하세요.'],
    [W,WF,'normal',11,'   5. 과목명 로마자(Ⅰ,Ⅱ)와 숫자(1,2)는 자동 통일되어 인식됩니다.'],
    [O,O, 'normal',10,''],
    [S,SF,'bold',  13,'©️  저작권 및 이용 안내'],
    [O,OF,'normal',11,'   본 시스템은 성포고등학교 황성재 교사(@hirame.ki)가 제작한 교육용 무료 도구입니다.'],
    [O,OF,'normal',11,'   · 비상업적 교육 목적으로 자유롭게 사용 가능 / 배포·공유 시 출처 표기 필수'],
    [W,WF,'bold',  11,'   ⚠️  상업적 이용 및 원작자 표기 삭제 금지  |  문의: 인스타그램 @hirame.ki'],
  ];

  rows.forEach(function(r, i) {
    var bg=r[0], fg=r[1], bld=r[2], sz=r[3], txt=r[4];
    var cell = sheet.getRange(i+1, 2);
    cell.setValue(txt).setBackground(bg).setFontColor(fg).setFontWeight(bld).setFontSize(sz);
    sheet.getRange(i+1, 1).setBackground(bg);
    sheet.setRowHeight(i+1, sz >= 13 ? 30 : (sz >= 11 ? 20 : 16));
  });
  sheet.setRowHeight(1, 38);
  sheet.getRange(1, 2, rows.length, 1).setWrap(true);
  sheet.protect().setDescription('사용설명서 보호').setWarningOnly(true);
  return sheet;
}

/* ══════════════════════════════════════════════════════
   편제표 읽기/쓰기 (MAX_ROWS 50)
══════════════════════════════════════════════════════ */
function readScheduleFromSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SCHEDULE);
  if (!sheet) return null;

  var result   = {};
  var R_DATA   = 4;
  var MAX_ROWS = 50;

  SEM_DEFS.forEach(function(def, si) {
    var base = si * 4 + 1;
    var subs = [];
    for (var r = 0; r < MAX_ROWS; r++) {
      var row  = R_DATA + r;
      var name = String(sheet.getRange(row, base+1).getValue()||'').trim();
      var cr   = parseInt(sheet.getRange(row, base+2).getValue())||4;
      var type = String(sheet.getRange(row, base+3).getValue()||'').trim();
      if (!name) continue;
      subs.push({ name: name, cr: cr, type: type === '공통' ? '공통' : '선택' });
    }
    result[def.label] = subs;
  });
  return result;
}

function writeScheduleToSheet(scheduleData) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SCHEDULE);
  if (!sheet) sheet = initScheduleSheet();

  var R_DATA   = 4;
  var MAX_ROWS = 50;

  SEM_DEFS.forEach(function(def, si) {
    var base = si * 4 + 1;
    var subs = scheduleData[def.label] || [];
    for (var r = 0; r < MAX_ROWS; r++) {
      var row = R_DATA + r;
      var sub = subs[r];
      sheet.getRange(row, base+1).setValue(sub ? sub.name : '');
      sheet.getRange(row, base+2).setValue(sub ? (sub.cr||4) : '');
      sheet.getRange(row, base+3).setValue(sub ? (sub.type==='공통'?'공통':'선택') : '');
    }
  });
}

/* ══════════════════════════════════════════════════════
   ⚙️ 설정값 저장/조회
══════════════════════════════════════════════════════ */
function getConfigSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_CONFIG) || initConfigSheet();
}
function getConfigValue(key) {
  var rows = getConfigSheet().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) return String(rows[i][1]);
  }
  return '';
}
function setConfigValue(key, value) {
  var sheet = getConfigSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) { sheet.getRange(i+1,2).setValue(value); return; }
  }
  sheet.appendRow([key, value, '']);
}
function getDeadline()   { return getConfigValue('deadline'); }
function setDeadline(dl) { setConfigValue('deadline', dl); }

/* ══════════════════════════════════════════════════════
   학생 임시저장
══════════════════════════════════════════════════════ */
function saveAutoSelection(data) {
  if (!data || !data.id) return;
  var student = findStudent(data.id);
  if (student && student.locked) return;

  var sheet = getSelectionSheet();
  var rows  = sheet.getDataRange().getValues();
  var now   = new Date().toLocaleString('ko-KR');

  var partial = [
    String(data.id), data.name||'', data.grade||'',
    data.univ||'', data.track||'', data.major||'',
    0, 0, '',
    JSON.stringify(data.selSubs  || {}),
    JSON.stringify(data.coreList || []),
    JSON.stringify(data.recList  || []),
    '임시저장 ' + now
  ];

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      var ts = String(rows[i][12]||'');
      if (ts && !ts.startsWith('임시저장')) return;
      sheet.getRange(i+1,1,1,partial.length).setValues([partial]).setBackground('#f3f3f3');
      return;
    }
  }
  sheet.appendRow(partial);
  sheet.getRange(sheet.getLastRow(),1,1,partial.length).setBackground('#f3f3f3');
}

/* ══════════════════════════════════════════════════════
   시트 초기화 공통 유틸
══════════════════════════════════════════════════════ */
function getOrCreateSheet(name, headers, colors) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var hr = sheet.getRange(1,1,1,headers.length);
    hr.setValues([headers]).setFontWeight('bold').setFontColor('#ffffff');
    if (colors) { hr.setBackground(colors.header); sheet.setTabColor(colors.tab); }
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 120);
  }
  return sheet;
}
function getStudentsSheet() {
  return getOrCreateSheet(SHEET_STUDENTS,
    ['학번','이름','잠금여부','확정여부','등록일시'],
    {header:'#1a73e8',tab:'#4285f4'});
}
function getSelectionSheet() {
  return getOrCreateSheet(SHEET_SELECTION,
    ['학번','이름','학년','목표대학','계열','학과','총학점','국영수학점',
     '핵심권장이수','선택과목(JSON)','핵심목록(JSON)','권장목록(JSON)','제출일시'],
    {header:'#0f9d58',tab:'#34a853'});
}
function getMemoSheet() {
  return getOrCreateSheet(SHEET_MEMO,
    ['학번','이름','상담메모','최종수정일'],
    {header:'#f4b400',tab:'#fbbc04'});
}

/* ══════════════════════════════════════════════════════
   학생명단 CRUD
══════════════════════════════════════════════════════ */
function findStudent(id) {
  var sheet = getStudentsSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      return {
        id: String(rows[i][0]), name: rows[i][1],
        locked:    rows[i][2]===true||rows[i][2]==='TRUE',
        confirmed: rows[i][3]===true||rows[i][3]==='TRUE',
        regAt: rows[i][4], rowIndex: i+1
      };
    }
  }
  return null;
}
function getStudentList() {
  var sheet = getStudentsSheet();
  var rows  = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    result.push({id: String(rows[i][0]), name: rows[i][1]});
  }
  return result;
}
function getAllStudents() {
  var students  = getStudentList();
  var selSheet  = getSelectionSheet();
  var selRows   = selSheet.getDataRange().getValues();
  var memoSheet = getMemoSheet();
  var memoRows  = memoSheet.getDataRange().getValues();
  return students.map(function(st) {
    var info    = findStudent(st.id);
    var selRow  = selRows.find(function(r){return String(r[0])===String(st.id);});
    var memoRow = memoRows.find(function(r){return String(r[0])===String(st.id);});
    var selSubs  = safeJson(selRow?selRow[9] :null,{});
    var coreList = safeJson(selRow?selRow[10]:null,[]);
    var recList  = safeJson(selRow?selRow[11]:null,[]);
    var allSel   = Object.values(selSubs).flat().map(function(s){return s.name||s;});
    var coreOk   = coreList.filter(function(c){return allSel.includes(c);}).length;
    var ts       = selRow ? String(selRow[12]||'') : '';
    return {
      id:st.id, name:st.name,
      locked:      info?info.locked:false,
      confirmed:   info?info.confirmed:false,
      submitted:   !!selRow && !ts.startsWith('임시저장'),
      grade:       selRow?selRow[2]:'',
      univ:        selRow?selRow[3]:'',
      track:       selRow?selRow[4]:'',
      major:       selRow?selRow[5]:'',
      total:       selRow?selRow[6]:0,
      kea:         selRow?selRow[7]:0,
      selSubs:selSubs, coreList:coreList, recList:recList, coreOk:coreOk,
      coreTotal:   coreList.length,
      submittedAt: ts,
      memo:        memoRow?memoRow[2]:''
    };
  });
}
function addStudent(id, name) {
  var sheet   = getStudentsSheet();
  var now     = new Date().toLocaleString('ko-KR');
  sheet.appendRow([String(id), name, false, false, now]);
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow,1,1,5).setBackground(lastRow%2===0?'#e8f0fe':'#ffffff');
}
function removeStudent(id) {
  var sheet = getStudentsSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = rows.length-1; i >= 1; i--) {
    if (String(rows[i][0])===String(id)) { sheet.deleteRow(i+1); return; }
  }
}
function lockStudent(id, locked) {
  var sheet = getStudentsSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0])===String(id)) {
      sheet.getRange(i+1,3).setValue(locked);
      sheet.getRange(i+1,1,1,5).setBackground(locked?'#fce8e6':'#e8f0fe');
      return;
    }
  }
}
function setConfirmed(id, confirmed) {
  var sheet = getStudentsSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0])===String(id)) {
      sheet.getRange(i+1,4).setValue(confirmed);
      sheet.getRange(i+1,1,1,5).setBackground(confirmed?'#e6f4ea':'#fce8e6');
      break;
    }
  }
  var selSheet = getSelectionSheet();
  var selRows  = selSheet.getDataRange().getValues();
  for (var j = 1; j < selRows.length; j++) {
    if (String(selRows[j][0])===String(id)) {
      selSheet.getRange(j+1,1,1,selSheet.getLastColumn())
              .setBackground(confirmed?'#e6f4ea':'#fff8e1');
      return;
    }
  }
}

/* ══════════════════════════════════════════════════════
   과목선택 저장/조회
══════════════════════════════════════════════════════ */
function saveSelection(data) {
  var sheet    = getSelectionSheet();
  var now      = new Date().toLocaleString('ko-KR');
  var rows     = sheet.getDataRange().getValues();
  var allSel   = Object.values(data.selSubs||{}).flat().map(function(s){return s.name;});
  var coreList = data.coreList||[];
  var coreOk   = coreList.filter(function(c){return allSel.includes(c);}).length;
  var newRow   = [
    String(data.id), data.name, data.grade,
    data.univ||'', data.track||'', data.major||'',
    data.total||0, data.kea||0,
    coreOk+'/'+coreList.length,
    JSON.stringify(data.selSubs ||{}),
    JSON.stringify(data.coreList||[]),
    JSON.stringify(data.recList ||[]),
    now
  ];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0])===String(data.id)) {
      sheet.getRange(i+1,1,1,newRow.length).setValues([newRow]).setBackground('#fff8e1');
      return;
    }
  }
  sheet.appendRow(newRow);
  sheet.getRange(sheet.getLastRow(),1,1,newRow.length).setBackground('#fff8e1');
}
function findSelection(id) {
  var sheet = getSelectionSheet();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0])===String(id)) {
      return {
        grade:rows[i][2], univ:rows[i][3], track:rows[i][4], major:rows[i][5],
        total:rows[i][6], kea:rows[i][7],
        selSubs:  safeJson(rows[i][9], {}),
        coreList: safeJson(rows[i][10],[]),
        recList:  safeJson(rows[i][11],[]),
        submittedAt:rows[i][12]
      };
    }
  }
  return {};
}

/* ══════════════════════════════════════════════════════
   상담 메모
══════════════════════════════════════════════════════ */
function saveMemo(id, memo) {
  var sheet   = getMemoSheet();
  var rows    = sheet.getDataRange().getValues();
  var now     = new Date().toLocaleString('ko-KR');
  var student = findStudent(id);
  var name    = student ? student.name : '';
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0])===String(id)) {
      sheet.getRange(i+1,3,1,2).setValues([[memo,now]]);
      return;
    }
  }
  sheet.appendRow([String(id), name, memo, now]);
  sheet.getRange(sheet.getLastRow(),1,1,4).setBackground('#fff8e1');
}

/* ══════════════════════════════════════════════════════
   유틸
══════════════════════════════════════════════════════ */
function safeJson(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch(e) { return fallback; }
}
function jsonRes(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}