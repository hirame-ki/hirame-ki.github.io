// ============================================================
//  연수 전자서명 시스템 - Code.gs  (v6 · 이미지 전용 스탠드얼론)
// ------------------------------------------------------------
//  ★ 이 코드는 구글 "시트"가 아니라 독립 Apps Script 프로젝트로
//    배포합니다 (script.google.com → 새 프로젝트). 시트를 만들
//    필요가 전혀 없습니다.
//
//  이 스크립트가 하는 일은 딱 두 가지뿐입니다:
//   ① 서명 이미지(PNG)를 이 계정의 구글 드라이브에 저장하고
//      URL을 돌려주기
//   ② (나중에 자동화 예정) 오래된 서명 기록을 이 계정의 드라이브에
//      백업 저장하기
//  그 외 기관명·구성원·연수·서명 텍스트 기록은 전부 Supabase에서
//  관리하므로, 이 코드를 다시 수정할 일은 거의 없습니다.
// ============================================================

const DRIVE_FOLDER  = '연수 전자서명 파일';
const ARCHIVE_FILE  = '연수 전자서명 아카이브';
const NOTIFY_EMAIL  = '';   // 비워두면 이 스크립트를 배포한 계정(실행 계정)의 이메일로 자동 발송

// ============================================================
//  웹앱 진입점
// ============================================================

/**
 * GET 요청 처리
 *  - ?action=ping : 연결 확인용 JSON ({ok:true}) — 웹페이지가 연결 시 호출
 *  - 파라미터 없음 : 사람이 URL을 직접 열었을 때 보여줄 안내 페이지 (HTML)
 */
function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';

  if (action === 'ping') {
    return _json({ ok: true });
  }

  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>연수 전자서명 이미지 저장소</title></head>' +
    '<body style="font-family:-apple-system,\'Malgun Gothic\',sans-serif;background:#F4F6F3;margin:0;padding:40px 20px;">' +
    '<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:36px 28px;text-align:center;box-shadow:0 4px 14px rgba(31,77,58,.1);">' +
    '<div style="font-size:44px;margin-bottom:14px;">&#9989;</div>' +
    '<h1 style="font-size:20px;color:#0E1A14;margin:0 0 10px;">API가 정상 작동 중입니다</h1>' +
    '<p style="font-size:14px;color:#465045;line-height:1.7;margin:0;">' +
    '이 페이지가 보이면 배포에 성공한 것입니다.<br><br>' +
    '<b>배포 시 복사한 웹 앱 URL</b>(https://script.google.com/macros/s/…/exec)을<br>' +
    '서명 웹페이지의 <b>[시스템 연결]</b> 화면에 붙여넣어 주세요.<br><br>' +
    '이 스크립트는 서명 이미지 저장 전용이며, 기관명·구성원·연수 정보는<br>' +
    '웹페이지의 <b>[관리자]</b> 메뉴에서 직접 관리합니다.</p>' +
    '</div></body></html>'
  ).setTitle('연수 전자서명 이미지 저장소');
}

/**
 * POST 요청 처리
 *  - action:'archiveBackup' : 오래된 서명 기록을 이 드라이브에 백업 (자동화는 추후 연동 예정)
 *  - 그 외(기본)            : 서명 이미지 업로드
 */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return _json({ success: false, message: '잘못된 요청 형식입니다.' });
  }

  const action = payload && payload.action ? String(payload.action) : '';
  if (action === 'archiveBackup') return _json(saveArchiveBackup(payload.rows));

  return _json(uploadSignatureImage(payload));
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  ① 서명 이미지 업로드
// ============================================================
/**
 * payload: { trainingTitle, department, name, dateStr, signatureData }
 * signatureData: 'data:image/png;base64,...' 형식의 캔버스 출력값
 */
function uploadSignatureImage(payload) {
  try {
    if (!payload || !payload.trainingTitle || !payload.name || !payload.signatureData) {
      return { success: false, message: '필수 정보가 누락되었습니다.' };
    }

    const dateStr = payload.dateStr || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    const folder    = _getOrCreateFolder(DRIVE_FOLDER);
    const subFolder = _getOrCreateFolder(payload.trainingTitle, folder);
    const imgData   = payload.signatureData.split(',')[1];
    const fileName  = dateStr + '_' + (payload.department || '') + '_' + payload.name + '.png';
    const blob      = Utilities.newBlob(Utilities.base64Decode(imgData), 'image/png', fileName);
    const file      = subFolder.createFile(blob);

    // 링크가 있는 모든 사용자 열람 허용 (Supabase에 저장된 URL로 웹페이지에서 바로 표시하기 위함)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const imgUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';

    return { success: true, fileId: fileId, imageUrl: imgUrl };
  } catch (err) {
    Logger.log('uploadSignatureImage error: ' + err);
    return { success: false, message: _friendlyDriveError(err) };
  }
}

/**
 * 구글 API의 원본 예외 메시지는 계정 언어·시점에 따라 문구가 달라질 수 있고,
 * 그대로 노출하면 서명자에게 뜻 모를 기술 오류로 보인다. 저장용량 초과로
 * 의심되는 키워드가 보이면 명확한 한국어 안내로 바꿔서 반환한다.
 */
function _friendlyDriveError(err) {
  const raw = String((err && err.message) || err || '');
  const quotaLike = /quota|storage|용량|space/i.test(raw);
  if (quotaLike) {
    return '이 기관의 구글 드라이브 저장 공간이 가득 찼습니다.\n' +
      '드라이브 관리자에게 여유 공간 확보를 요청한 뒤 다시 시도해 주세요.';
  }
  return raw || '이미지 저장 중 오류가 발생했습니다.';
}

// ============================================================
//  ② 오래된 서명 기록 백업 (아카이브)
//  ※ 이 함수를 실제로 주기적으로 호출하는 자동화(GitHub Actions 등)는
//    이번 구현 범위에 포함되지 않음 — 함수만 미리 준비해둔 상태.
//    Supabase의 archive_old_signatures()가 반환한 rows를 그대로 전달하면 됨:
//    rows: [{ date, time, trainingTitle, department, name, imageUrl }, ...]
// ============================================================
function saveArchiveBackup(rows) {
  try {
    if (!rows || !rows.length) return { success: true, savedCount: 0 };

    const ss    = _getOrCreateArchiveSpreadsheet();
    const sheet = ss.getSheetByName('백업') || _setupArchiveSheet(ss);

    rows.forEach(function(r) {
      const newRow = sheet.getLastRow() + 1;
      sheet.appendRow([r.date, r.time, r.trainingTitle, r.department, r.name, r.imageUrl, '']);
      sheet.getRange(newRow, 7).setFormula('=IMAGE("' + r.imageUrl + '",4,60,160)');
      sheet.setRowHeight(newRow, 70);
    });

    _notifyArchiveBackup(rows.length, ss.getUrl());

    return { success: true, savedCount: rows.length };
  } catch (err) {
    Logger.log('saveArchiveBackup error: ' + err);
    return { success: false, message: err.message };
  }
}

/**
 * 백업 완료 시 이메일로 알림 (건수 + 백업 파일 위치).
 * GitHub Actions가 사람 없이 호출하는 자동화라 브라우저 알림창은 띄울 대상이
 * 없으므로, 이메일이 실질적인 알림 수단이다. 발송 실패해도 백업 자체는
 * 이미 끝난 뒤이므로 별도로 처리해 백업 결과에 영향을 주지 않는다.
 */
function _notifyArchiveBackup(count, sheetUrl) {
  try {
    const to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
    if (!to) return;
    MailApp.sendEmail({
      to: to,
      subject: '[연수 전자서명] 서명 기록 자동 백업 완료 (' + count + '건)',
      body:
        '오래된 서명 기록 ' + count + '건이 자동으로 백업되어 Supabase에서는 삭제되었습니다.\n\n' +
        '백업 위치: ' + sheetUrl + '\n\n' +
        '이 메일은 연수 전자서명 시스템이 자동으로 발송했습니다.'
    });
  } catch (err) {
    Logger.log('_notifyArchiveBackup error: ' + err);
  }
}

function _getOrCreateArchiveSpreadsheet() {
  const iter = DriveApp.getFilesByName(ARCHIVE_FILE);
  if (iter.hasNext()) return SpreadsheetApp.open(iter.next());
  const ss = SpreadsheetApp.create(ARCHIVE_FILE);
  _setupArchiveSheet(ss);
  return ss;
}

function _setupArchiveSheet(ss) {
  let sheet = ss.getSheetByName('백업');
  if (!sheet) sheet = ss.getSheets()[0].setName('백업');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['날짜', '시간', '연수명', '부서', '성명', '서명 파일 URL', '서명 이미지']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
//  사용설명서 시트 (선택 사항)
//  이 코드는 시트 없이도(스탠드얼론 Apps Script) 완전히 동작하지만,
//  "코드가 이미 담긴 시트 사본"을 기관에 공유하는 방식으로 배포하고
//  싶을 때를 위해 안내 시트를 만드는 기능을 추가로 제공한다.
//  onOpen()은 이 코드가 시트에 바인딩되어 사본이 열렸을 때만 자동
//  실행되며, script.google.com에서 만든 완전 스탠드얼론 배포에서는
//  애초에 호출되지 않으므로 서로 방해되지 않는다.
// ============================================================
const SHEET_GUIDE = '📖 사용설명서';
const WEBAPP_URL  = 'https://hirame-ki.github.io/sign';   // 실제 배포 주소로 바꿔서 사용

function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;   // 스탠드얼론 배포에는 시트가 없으므로 아무 것도 하지 않음
  SpreadsheetApp.getUi()
    .createMenu('🖊️ 전자서명 관리')
    .addItem('📖 사용설명서 만들기 (최초 1회)', 'setupGuideSheet')
    .addToUi();
}

function setupGuideSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_GUIDE);
  if (!sheet) sheet = ss.insertSheet(SHEET_GUIDE);
  sheet.clear();
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 640);

  const W = '#FFFFFF';
  const rows = [
    [1,  '📖 연수 전자서명 시스템 사용설명서', null, true, '#2C3E50', null, 42, 14],
    [2,  '이 시트의 코드가 담긴 사본을 배포받으셨습니다. 아래 순서대로 진행해 주세요.', null, true, '#34495E', null, 30, 10.5, '#BDC3C7'],
    [3,  '', null, true, '#C8D6E5', null, 6],

    [4,  '🚀 1단계 — Apps Script 배포 (최초 1회, 약 3분)', null, true, '#4A90D9', null, 38, 12],
    [5,  '① Apps Script 열기', '이 시트 상단 메뉴 [확장 프로그램] → [Apps Script] 클릭\n(코드는 이미 이 사본에 포함되어 있어 붙여넣을 필요가 없습니다)', false, '#EBF4FF', '#EBF4FF', 50, null, true],
    [6,  '② 새 배포 시작', 'Apps Script 화면 우측 상단 [배포] → [새 배포] 클릭', false, '#F0F4FF', '#F0F4FF'],
    [7,  '③ 유형 선택', '배포 설정 창의 톱니바퀴(⚙️) 아이콘 클릭 → 유형 목록에서 [웹 앱] 선택', false, '#EBF4FF', '#EBF4FF', 44, null, true],
    [8,  '④ 실행 설정', '실행 계정: 나 / 액세스 권한: 모든 사용자 ← 반드시 이렇게 설정해야 구성원이 접속 가능합니다', false, '#F0F4FF', '#F0F4FF', 44, null, true],
    [9,  '⑤ 배포·권한 승인', '[배포] 클릭 → 최초 1회 권한 승인 창이 뜨면 본인 계정 선택 →\n[고급] → [~(으)로 이동(안전하지 않음)] → [허용]', false, '#EBF4FF', '#EBF4FF', 52, null, true],
    [10, '⑥ 웹 앱 URL 복사', '배포 완료 화면에 표시되는 "웹 앱 URL"을 통째로 복사\n(https://script.google.com/macros/s/…/exec 형태)', false, '#F0F4FF', '#F0F4FF', 50, null, true],
    [11, '⑦ 웹페이지 연결', '브라우저에서 ' + WEBAPP_URL + ' 접속 →\n복사한 URL을 붙여넣고 [연결하기] 클릭', false, '#EBF4FF', '#EBF4FF', 50, null, true],
    [12, '', null, true, '#C8D6E5', null, 6],

    [13, '⚙️ 2단계 — 웹페이지 초기 설정 (연결 직후, 최초 1회)', null, true, '#27AE60', null, 38, 12],
    [14, '① 관리자 비밀번호 생성', '헤더의 ⚙️ [관리자] 버튼 클릭 → 처음이라 "비밀번호 만들기" 화면이 뜸 →\n4자리 이상으로 설정 (서명등록부 출력 시 비밀번호로도 함께 사용됨)', false, '#F0FFF4', '#F0FFF4', 52, null, true],
    [15, '② 기관 설정 입력', '[기관 설정] 탭 → 기관명 입력, 안내문(선택 — 서명 화면 상단 배너), 대표 색상 선택 → [저장하기]', false, '#ECFDF5', '#ECFDF5', 44, null, true],
    [16, '③ 구성원 등록', '[구성원 관리] 탭 → [구성원 추가] → 부서 선택(또는 새 부서 직접 입력) →\n성명 칸에 여러 명을 줄바꿈으로 구분해 한 번에 붙여넣기 가능(엑셀 이름 열 복사 지원) → [저장하기]', false, '#F0FFF4', '#F0FFF4', 56, null, true],
    [17, '④ 연수 등록', '[연수 관리] 탭 → [새 연수 추가] → 연수명 · 대상 · 시간 · 날짜 입력 → [저장하기]', false, '#ECFDF5', '#ECFDF5'],
    [18, '⑤ 공유 링크 안내', '관리자 패널을 닫으면 서명 화면으로 돌아갑니다 → 헤더의 🔗 버튼 →\n표시되는 공유 링크·QR을 구성원에게 안내', false, '#F0FFF4', '#F0FFF4', 44, null, true],
    [19, '', null, true, '#C8D6E5', null, 6],

    [20, '✅ 이후에는', null, true, '#8E44AD', null, 36, 12],
    [21, '재배포 불필요', '화면 업데이트는 웹페이지에 자동 반영되고, 기관명·구성원·연수 정보는\n전부 웹페이지의 관리자 패널에서 관리하므로 이 시트나 코드를 다시 열 일이 거의 없습니다.', false, '#FAF5FF', '#FAF5FF', 52, null, true],
    [22, '정보 변경', '기관명·구성원·연수 내용을 바꾸고 싶을 때는 언제든 웹페이지 헤더의\n⚙️ 관리자 버튼으로 들어가 수정하면 됩니다.', false, '#F5EBFF', '#F5EBFF', 44, null, true],
    [23, '이미지 파일', '제출된 서명 이미지는 이 계정의 구글 드라이브 [연수 전자서명 파일] 폴더에\n연수명별로 자동 정리되어 저장됩니다.', false, '#FAF5FF', '#FAF5FF', 44, null, true],
  ];

  rows.forEach(function(entry) {
    const r = entry[0], col1 = entry[1], col2 = entry[2], isHdr = entry[3];
    const bg1 = entry[4], bg2 = entry[5];
    const h = entry[6] || 32, size = entry[7] || 11, fgOvr = entry[8] || W, wrap = entry[10] || false;

    if (isHdr && col2 === null) {
      sheet.getRange(r, 1, 1, 2).merge();
      const cell = sheet.getRange(r, 1);
      if (col1) cell.setValue(col1);
      cell.setBackground(bg1 || '#EEE');
      if (col1 && bg1 !== '#C8D6E5') {
        cell.setFontColor(fgOvr).setFontWeight('bold').setFontSize(size)
          .setHorizontalAlignment('left').setVerticalAlignment('middle');
      }
    } else {
      const c1 = sheet.getRange(r, 1);
      c1.setValue(col1).setBackground(bg1).setFontColor('#2C3E50').setFontWeight('bold').setVerticalAlignment('middle');
      const c2 = sheet.getRange(r, 2);
      c2.setValue(col2).setBackground(bg2 || '#FFF').setFontColor('#555').setVerticalAlignment('middle');
      if (wrap) { c1.setWrap(true); c2.setWrap(true); }
    }
    sheet.setRowHeight(r, h);
  });

  sheet.setTabColor('#FF6B35');
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);   // 맨 앞 탭으로 이동 → 사본을 열자마자 보이도록

  SpreadsheetApp.getUi().alert(
    '✅ 사용설명서 시트가 준비됐습니다!',
    '이 시트를 기관별로 사본을 만들어 배포하시면, 사본을 받은 담당자가 시트를 열자마자\n' +
    '[' + SHEET_GUIDE + '] 탭의 안내를 보고 스스로 배포·설정을 진행할 수 있습니다.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================
//  유틸리티
// ============================================================
function _getOrCreateFolder(name, parent) {
  const root = parent || DriveApp.getRootFolder();
  const iter = root.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : root.createFolder(name);
}
