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
    return { success: false, message: err.message };
  }
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

    return { success: true, savedCount: rows.length };
  } catch (err) {
    Logger.log('saveArchiveBackup error: ' + err);
    return { success: false, message: err.message };
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
//  유틸리티
// ============================================================
function _getOrCreateFolder(name, parent) {
  const root = parent || DriveApp.getRootFolder();
  const iter = root.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : root.createFolder(name);
}
