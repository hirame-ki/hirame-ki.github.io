// ============================================================
//  연수 전자서명 시스템 - Code.gs  (v5 · JSON API)
// ------------------------------------------------------------
//  ★ 이 코드는 최초 1회만 붙여넣고 배포하면 됩니다.
//    이후 화면(디자인·기능) 업데이트는 GitHub 웹페이지에
//    자동 반영되므로 이 코드를 다시 수정할 필요가 없습니다.
// ============================================================

const SHEET_CONFIG   = '⚙️ 연수설정';
const SHEET_RECORDS  = '📋 서명현황';
const SHEET_STAFF    = '👥 구성원명단';
const SHEET_SUMMARY  = '📊 미서명현황';
const SHEET_GUIDE    = '📖 사용설명서';
const DRIVE_FOLDER   = '연수 전자서명 파일';

const ROW_ORG        = 2;   // 기관명
const ROW_DEPT       = 4;   // 부서 목록
const ROW_HEADER     = 6;
const ROW_DATA_START = 7;
const MAX_TRAININGS  = 10;

// ── 추가 설정 (선택사항, 비워두면 기본 동작) ──────────────
const ROW_PIN        = 18;  // 출력 비밀번호
const ROW_NOTICE     = 19;  // 웹페이지 안내문
const ROW_COLOR      = 20;  // 대표 색상 (B20 셀의 배경색을 그대로 사용)

// ============================================================
//  웹앱 진입점 (JSON API)
// ============================================================

/**
 * GET 요청 처리
 *  - ?action=pageData : 기관명 + 오늘의 연수 + 구성원 명단 (JSON)
 *  - ?action=records  : 특정 연수의 서명 기록 (JSON, 서명등록부 출력용)
 *  - 파라미터 없음     : 배포 확인용 안내 페이지 (HTML)
 */
function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';

  if (action === 'pageData') {
    return _json(getPageData());
  }
  if (action === 'records') {
    return _json(getSignatureRecords(e.parameter.title, e.parameter.date, e.parameter.pin));
  }

  // 브라우저로 직접 열었을 때: 배포 성공 확인 페이지
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>연수 전자서명 API</title></head>' +
    '<body style="font-family:-apple-system,\'Malgun Gothic\',sans-serif;background:#F4F6F3;margin:0;padding:40px 20px;">' +
    '<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:36px 28px;text-align:center;box-shadow:0 4px 14px rgba(31,77,58,.1);">' +
    '<div style="font-size:44px;margin-bottom:14px;">&#9989;</div>' +
    '<h1 style="font-size:20px;color:#0E1A14;margin:0 0 10px;">API가 정상 작동 중입니다</h1>' +
    '<p style="font-size:14px;color:#465045;line-height:1.7;margin:0;">' +
    '이 페이지가 보이면 웹앱 배포에 성공한 것입니다.<br><br>' +
    '<b>배포 시 복사한 웹 앱 URL</b>(https://script.google.com/macros/s/…/exec)을<br>' +
    '서명 웹페이지의 <b>[시스템 연결]</b> 화면에 붙여넣어 주세요.</p>' +
    '</div></body></html>'
  ).setTitle('연수 전자서명 API');
}

/**
 * POST 요청 처리: 서명 제출
 * ※ 웹페이지에서 Content-Type 지정 없이(text/plain) 전송해야
 *   CORS preflight 없이 정상 동작합니다.
 */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return _json({ success: false, message: '잘못된 요청 형식입니다.' });
  }
  return _json(submitSignature(payload));
}

/** JSON 응답 생성 */
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  API 구현
// ============================================================

/**
 * 기관명 + 오늘의 활성 연수 + 부서별 구성원 목록 한 번에 반환
 */
function getPageData() {
  try {
    const ss     = SpreadsheetApp.getActiveSpreadsheet();
    const config = ss.getSheetByName(SHEET_CONFIG);
    if (!config) return { orgName:'', trainings:[], staffByDept:{}, deptOrder:[] };

    // 기관명
    const orgName = String(config.getRange(ROW_ORG, 2).getValue()).trim();

    // 오늘 날짜
    const tz    = Session.getScriptTimeZone();
    const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

    // 연수 목록
    const trainings = [];
    for (let i = 0; i < MAX_TRAININGS; i++) {
      const r    = ROW_DATA_START + i;
      const vals = config.getRange(r, 1, 1, 5).getValues()[0];
      const active = String(vals[0]).trim().toUpperCase();
      const title  = String(vals[1]).trim();
      const cont   = String(vals[2]).trim();
      const raw    = vals[3];
      if (!title || active !== 'Y') continue;

      let dateStr;
      if (raw instanceof Date && !isNaN(raw.getTime())) {
        dateStr = Utilities.formatDate(raw, tz, 'yyyy-MM-dd');
      } else {
        dateStr = String(raw).trim().replace(/\.\s*/g, '-').replace(/-$/, '');
      }
      if (dateStr === '매일' || dateStr === today) {
        trainings.push({ title, content: cont });
      }
    }

    // ── 구성원명단 시트에서 부서·성명 읽기 ─────────────────
    const staffSheet = ss.getSheetByName(SHEET_STAFF);
    const staffByDept = {};  // { 부서명: [성명, ...] }
    const deptOrder   = [];  // 부서 순서 유지

    if (staffSheet && staffSheet.getLastRow() >= 4) {
      const rows = staffSheet.getRange(4, 1, staffSheet.getLastRow() - 3, 2).getValues();
      rows.forEach(r => {
        const dept = String(r[0]).trim();
        const name = String(r[1]).trim();
        if (!name) return;
        if (!staffByDept[dept]) {
          staffByDept[dept] = [];
          deptOrder.push(dept);
        }
        staffByDept[dept].push(name);
      });
    }

    // 구성원명단이 비어있으면 연수설정의 부서 목록으로 fallback
    if (deptOrder.length === 0) {
      const deptRaw = String(config.getRange(ROW_DEPT, 2).getValue()).trim();
      deptRaw.split(',').map(d => d.trim()).filter(Boolean).forEach(d => {
        staffByDept[d] = [];
        deptOrder.push(d);
      });
    }

    // ── 추가 설정 읽기 (없거나 비어 있으면 기본 동작) ──────
    const notice = String(config.getRange(ROW_NOTICE, 2).getValue()).trim();

    // 대표 색상: 텍스트가 아니라 "셀 배경색(채우기 색)"을 그대로 읽음
    // → 관리자가 색상코드를 몰라도 팔레트에서 눈으로 보고 고를 수 있음
    const brandColor  = String(config.getRange(ROW_COLOR, 2).getBackground() || '').trim();
    const printPinSet = !!String(config.getRange(ROW_PIN,  2).getValue()).trim();
    // ※ 비밀번호 값 자체는 절대 응답에 포함하지 않음 (설정 여부만 전달)

    return { orgName, trainings, staffByDept, deptOrder, notice, brandColor, printPinSet };

  } catch (err) {
    Logger.log('getPageData error: ' + err);
    return { orgName:'', trainings:[], staffByDept:{}, deptOrder:[], error: err.message };
  }
}

/**
 * 특정 연수의 서명 기록 반환 (서명등록부 출력용)
 * @param title 연수명
 * @param date  yyyy-MM-dd (생략 시 오늘)
 */
function getSignatureRecords(title, date, pin) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_RECORDS);
    const tz    = Session.getScriptTimeZone();

    // ── 출력 비밀번호 확인 (설정된 경우에만) ──────────────
    const config    = ss.getSheetByName(SHEET_CONFIG);
    const configPin = config ? String(config.getRange(ROW_PIN, 2).getValue()).trim() : '';
    if (configPin && String(pin || '').trim() !== configPin) {
      return { success: false, needPin: true, records: [] };
    }

    const targetTitle = String(title || '').trim();
    const targetDate  = String(date  || '').trim() ||
                        Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

    const records = [];
    if (sheet && sheet.getLastRow() >= 2 && targetTitle) {
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
      rows.forEach(r => {
        let rowDate = r[0];
        rowDate = (rowDate instanceof Date)
          ? Utilities.formatDate(rowDate, tz, 'yyyy-MM-dd')
          : String(rowDate).trim();
        if (rowDate !== targetDate) return;
        if (String(r[2]).trim() !== targetTitle) return;

        let rowTime = r[1];
        rowTime = (rowTime instanceof Date)
          ? Utilities.formatDate(rowTime, tz, 'HH:mm:ss')
          : String(rowTime).trim();

        // G열 파일 URL에서 드라이브 파일 ID 추출
        const idMatch = String(r[6]).match(/[-\w]{25,}/);

        records.push({
          department : String(r[3]).trim(),
          name       : String(r[4]).trim(),
          time       : rowTime,
          fileId     : idMatch ? idMatch[0] : ''
        });
      });
    }

    return { success: true, title: targetTitle, date: targetDate, records };

  } catch (err) {
    Logger.log('getSignatureRecords error: ' + err);
    return { success: false, message: err.message, records: [] };
  }
}

/**
 * 서명 제출 처리
 */
function submitSignature(payload) {
  try {
    if (!payload || !payload.trainingTitle || !payload.department ||
        !payload.name || !payload.signatureData) {
      return { success: false, message: '필수 정보가 누락되었습니다.' };
    }

    const ss          = SpreadsheetApp.getActiveSpreadsheet();
    const recordSheet = ss.getSheetByName(SHEET_RECORDS);
    const tz          = Session.getScriptTimeZone();
    const now         = new Date();
    const dateStr     = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    const timeStr     = Utilities.formatDate(now, tz, 'HH:mm:ss');

    // ── 방안①: 서버 중복 차단 ──────────────────────────────
    // 오늘 날짜 + 연수명 + 이름 조합이 이미 시트에 있으면 저장 거부
    if (recordSheet.getLastRow() >= 2) {
      const existing = recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, 5).getValues();
      const isDuplicate = existing.some(function(row) {
        let rowDate = row[0];
        if (rowDate instanceof Date) {
          rowDate = Utilities.formatDate(rowDate, tz, 'yyyy-MM-dd');
        } else {
          rowDate = String(rowDate).trim();
        }
        const rowTitle = String(row[2]).trim();
        const rowName  = String(row[4]).trim();
        return rowDate === dateStr
            && rowTitle === payload.trainingTitle
            && rowName  === payload.name;
      });
      if (isDuplicate) {
        return {
          success: false,
          duplicate: true,
          message: '[' + payload.trainingTitle + '] ' + payload.name + '님은 이미 서명을 완료하셨습니다.'
        };
      }
    }
    // ─────────────────────────────────────────────────────────

    // 드라이브에 PNG 저장
    const folder    = _getOrCreateFolder(DRIVE_FOLDER);
    const subFolder = _getOrCreateFolder(payload.trainingTitle, folder);
    const imgData   = payload.signatureData.split(',')[1];
    const fileName  = dateStr + '_' + payload.department + '_' + payload.name + '.png';
    const blob      = Utilities.newBlob(Utilities.base64Decode(imgData), 'image/png', fileName);
    const file      = subFolder.createFile(blob);

    // 공유 권한: 링크가 있는 모든 사용자 열람 허용
    // (없으면 시트 IMAGE 수식·웹 출력에서 이미지가 표시되지 않음)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId  = file.getId();
    const fileUrl = file.getUrl();

    // thumbnail 엔드포인트가 uc?export=view보다 표시 안정성이 높음
    const imgUrl  = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';

    // 데이터 행 추가
    const newRow = recordSheet.getLastRow() + 1;
    recordSheet.appendRow([
      dateStr, timeStr,
      payload.trainingTitle,
      payload.department,
      payload.name,
      '✅ 완료',
      fileUrl,
      '',   // H열: 이미지 수식 자리
    ]);

    // H열에 IMAGE 수식으로 서명 이미지 직접 표시
    recordSheet.getRange(newRow, 8).setFormula('=IMAGE("' + imgUrl + '",4,60,160)');

    // 서명 이미지가 잘 보이도록 행 높이 설정
    recordSheet.setRowHeight(newRow, 70);

    return { success: true };
  } catch (err) {
    Logger.log('submitSignature error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
//  미서명 현황 집계
// ============================================================
function generateAttendanceSummary() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const recSheet = ss.getSheetByName(SHEET_RECORDS);
  if (!recSheet || recSheet.getLastRow() < 2) {
    ui.alert('⚠️ 서명 데이터 없음', '아직 서명된 데이터가 없습니다.', ui.ButtonSet.OK);
    return;
  }

  const recData = recSheet.getRange(2, 1, recSheet.getLastRow() - 1, 6).getValues();

  const trainingSet = {};
  recData.forEach(row => {
    const date  = String(row[0]).trim();
    const title = String(row[2]).trim();
    if (!title) return;
    const key = title + ' (' + date + ')';
    if (!trainingSet[key]) trainingSet[key] = { title, date, key };
  });

  const trainingKeys = Object.keys(trainingSet);
  if (trainingKeys.length === 0) { ui.alert('서명 데이터가 없습니다.'); return; }

  let listText = '번호를 입력하세요 (전체: 0)\n\n0. 전체 연수 모두 집계\n';
  trainingKeys.forEach((k, i) => { listText += (i + 1) + '. ' + k + '\n'; });

  const resp = ui.prompt('📊 미서명 현황 집계', listText, ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const choice = parseInt(resp.getResponseText().trim());
  let targets;
  if (choice === 0) {
    targets = trainingKeys.map(k => trainingSet[k]);
  } else if (choice >= 1 && choice <= trainingKeys.length) {
    targets = [trainingSet[trainingKeys[choice - 1]]];
  } else { ui.alert('올바른 번호를 입력해 주세요.'); return; }

  const staffSheet = ss.getSheetByName(SHEET_STAFF);
  if (!staffSheet || staffSheet.getLastRow() < 4) {
    ui.alert('⚠️ 구성원명단 없음', '[👥 구성원명단] 시트에 구성원 정보를 먼저 입력하세요.', ui.ButtonSet.OK);
    return;
  }

  const staffData = staffSheet.getRange(4, 1, staffSheet.getLastRow() - 3, 2).getValues();
  const staffList = staffData
    .filter(r => String(r[1]).trim())
    .map(r => ({ dept: String(r[0]).trim(), name: String(r[1]).trim() }));

  if (staffList.length === 0) { ui.alert('[👥 구성원명단] 시트에 구성원 정보를 입력해 주세요.'); return; }

  let sumSheet = ss.getSheetByName(SHEET_SUMMARY);
  if (!sumSheet) sumSheet = ss.insertSheet(SHEET_SUMMARY);
  sumSheet.clear();
  sumSheet.setTabColor('#E74C3C');

  [160, 90, 120, 80, 90, 80].forEach((w, i) => sumSheet.setColumnWidth(i + 1, w));

  sumSheet.getRange(1, 1, 1, 6).merge();
  sumSheet.getRange(1, 1)
    .setValue('📊 연수 서명 현황 집계 (생성: ' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') + ')')
    .setBackground('#2C3E50').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(12)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sumSheet.setRowHeight(1, 38);

  ['연수명','날짜','부서','성명','서명 여부','서명 시각'].forEach((h, i) => {
    sumSheet.getRange(2, i + 1).setValue(h)
      .setBackground('#34495E').setFontColor('#FFFFFF')
      .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  });
  sumSheet.setRowHeight(2, 34);
  sumSheet.setFrozenRows(2);

  let currentRow = 3;

  targets.forEach(target => {
    const signedMap = {};
    recData.forEach(row => {
      if (String(row[2]).trim() === target.title && String(row[0]).trim() === target.date) {
        const dept = String(row[3]).trim();
        const name = String(row[4]).trim();
        const time = String(row[1]).trim();
        signedMap[dept + '_' + name] = time;
        signedMap['_' + name]        = time;
      }
    });

    sumSheet.getRange(currentRow, 1, 1, 6).merge();
    sumSheet.getRange(currentRow, 1)
      .setValue('📋 ' + target.title + '  |  ' + target.date)
      .setBackground('#5C6BC0').setFontColor('#FFFFFF')
      .setFontWeight('bold').setFontSize(11)
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    sumSheet.setRowHeight(currentRow, 34);
    currentRow++;

    let signedCount = 0;

    staffList.forEach((staff, idx) => {
      const isSigned = !!(signedMap[staff.dept + '_' + staff.name] || signedMap['_' + staff.name]);
      if (isSigned) signedCount++;
      const signTime    = signedMap[staff.dept + '_' + staff.name] || signedMap['_' + staff.name] || '';
      const statusText  = isSigned ? '✅ 완료' : '❌ 미서명';
      const statusColor = isSigned ? '#27AE60' : '#E74C3C';
      const rowBg       = isSigned
        ? (idx % 2 === 0 ? '#EDFAF4' : '#F5FEFA')
        : (idx % 2 === 0 ? '#FFF0F0' : '#FFF8F8');

      [target.title, target.date, staff.dept, staff.name, statusText, signTime].forEach((val, ci) => {
        const cell = sumSheet.getRange(currentRow, ci + 1);
        cell.setValue(val).setBackground(rowBg).setVerticalAlignment('middle');
        if (ci === 4) cell.setFontColor(statusColor).setFontWeight('bold').setHorizontalAlignment('center');
        else if (ci <= 1) cell.setFontColor('#888').setFontSize(10);
        else cell.setFontColor('#2C3E50');
      });
      sumSheet.setRowHeight(currentRow, 30);
      currentRow++;
    });

    const total   = staffList.length;
    const pct     = total > 0 ? Math.round(signedCount / total * 100) : 0;
    sumSheet.getRange(currentRow, 1, 1, 6).merge();
    sumSheet.getRange(currentRow, 1)
      .setValue('✅ 완료: ' + signedCount + '명   ❌ 미서명: ' + (total - signedCount) + '명   (' + pct + '% 완료) / 전체 ' + total + '명')
      .setBackground('#F0F4FF').setFontColor('#2C3E50')
      .setFontWeight('bold').setFontSize(11)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sumSheet.setRowHeight(currentRow, 34);
    currentRow++;

    sumSheet.getRange(currentRow, 1, 1, 6).merge().setBackground('#E8E4F8');
    sumSheet.setRowHeight(currentRow, 6);
    currentRow++;
  });

  ss.setActiveSheet(sumSheet);
  ui.alert('✅ 집계 완료!', '대상 연수: ' + targets.length + '개\n전체 구성원: ' + staffList.length + '명', ui.ButtonSet.OK);
}

// ============================================================
//  서명현황 연수명별 그룹 정렬
// ============================================================
function groupSortByTraining() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_RECORDS);
    const last  = sheet.getLastRow();
    if (last < 2) { SpreadsheetApp.getUi().alert('정렬할 데이터가 없습니다.'); return; }

    // 이미지 수식 보존을 위해 7열까지만 정렬 (H열 이미지는 건드리지 않음)
    const range = sheet.getRange(2, 1, last - 1, 7);
    const data  = range.getValues();

    data.sort((a, b) => {
      const t = String(a[2]).localeCompare(String(b[2]), 'ko');
      if (t !== 0) return t;
      const d = String(a[0]).localeCompare(String(b[0]));
      if (d !== 0) return d;
      return String(a[3]).localeCompare(String(b[3]), 'ko');
    });
    range.setValues(data);

    const palette = ['#EDE9FF','#E6F9F0','#FFF0F4','#FFF8E6','#E6F4FF',
                     '#F9E6FF','#E6FFF8','#FFEDE6','#E6F0FF','#F0FFE6'];
    let colorIdx = -1, lastTitle = null;
    data.forEach((row, i) => {
      const title = String(row[2]);
      if (title !== lastTitle) { colorIdx++; lastTitle = title; }
      // H열(이미지)까지 포함해 배경색 적용
      sheet.getRange(i + 2, 1, 1, 8).setBackground(palette[colorIdx % palette.length]);
    });
    SpreadsheetApp.getUi().alert('✅ 정렬 완료!');
  } catch (err) {
    SpreadsheetApp.getUi().alert('오류: ' + err.message);
  }
}

// ============================================================
//  초기 설정
// ============================================================
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _setupConfigSheet(ss);
  _setupRecordSheet(ss);
  _setupStaffSheet(ss);
  _setupSummarySheet(ss);
  _setupGuideSheet(ss);
  SpreadsheetApp.getUi().alert(
    '✅ 초기 설정 완료!\n\n' +
    '① [⚙️ 연수설정] → B2 기관명, B4 부서목록, 7~16행 연수 입력\n' +
    '   (선택) B18 출력 비밀번호, B19 안내문\n' +
    '   (선택) B20 대표 색상 → 셀 클릭 후 채우기 색으로 직접 선택\n' +
    '② [👥 구성원명단] → A열 부서, B열 성명 입력\n' +
    '   (이 명단이 서명 화면의 부서·이름 선택 목록이 됩니다)\n' +
    '③ [배포] → [새 배포] → 웹 앱 (액세스: 모든 사용자) → URL 복사\n' +
    '④ 서명 웹페이지에 접속해 복사한 URL을 연결\n\n' +
    '★ 배포는 딱 1회면 충분합니다. 이후 재배포는 필요 없습니다!'
  );
}

// ── 설정 시트 ────────────────────────────────────────────────
function _setupConfigSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_CONFIG);
  if (!sheet) sheet = ss.insertSheet(SHEET_CONFIG);
  sheet.clear();

  [80, 270, 360, 140, 100].forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.getRange(1, 1, 1, 5).merge();
  _cell(sheet, 1, 1, '⚙️ 연수 전자서명 시스템 설정', { bg:'#2C3E50', fg:'#FFFFFF', bold:true, size:13, halign:'center' });
  sheet.setRowHeight(1, 42);

  _cell(sheet, ROW_ORG, 1, '🏛️ 기관명', { bg:'#4A90D9', fg:'#FFFFFF', bold:true, halign:'center' });
  _cell(sheet, ROW_ORG, 2, '○○기관', { bg:'#EBF4FF', fg:'#1A1A2E', bold:true, size:12 });
  sheet.getRange(ROW_ORG, 3, 1, 3).merge();
  sheet.getRange(ROW_ORG, 3).setValue('← 웹페이지 상단에 표시될 기관 이름 (학교·교육청·연수원 등)')
    .setBackground('#EBF4FF').setFontColor('#999').setFontSize(10).setVerticalAlignment('middle');
  sheet.setRowHeight(ROW_ORG, 38);

  sheet.getRange(3, 1, 1, 5).merge().setBackground('#C8D6E5');
  sheet.setRowHeight(3, 4);

  _cell(sheet, ROW_DEPT, 1, '🏢 부서 목록', { bg:'#4A90D9', fg:'#FFFFFF', bold:true, halign:'center' });
  _cell(sheet, ROW_DEPT, 2,
    '교무기획부,교육과정부,인문사회부,과학기술부,예술체육부,학생생활부,진로상담부,행정실',
    { bg:'#FFFFFF', fg:'#2C3E50', wrap:true });
  sheet.getRange(ROW_DEPT, 3, 1, 3).merge();
  sheet.getRange(ROW_DEPT, 3).setValue('← 쉼표(,)로 구분 입력 (웹 선택 목록은 👥 구성원명단 시트 기준)')
    .setBackground('#FFFFFF').setFontColor('#999').setFontSize(10).setVerticalAlignment('middle');
  sheet.setRowHeight(ROW_DEPT, 44);

  sheet.getRange(5, 1, 1, 5).merge().setBackground('#C8D6E5');
  sheet.setRowHeight(5, 4);

  ['활성\n(Y/N)', '연수명', '연수 내용 (간략 설명)', '날짜\n(yyyy-MM-dd 또는 매일)', '비고']
    .forEach((h, i) => _cell(sheet, ROW_HEADER, i + 1, h, { bg:'#5C6BC0', fg:'#FFFFFF', bold:true, halign:'center', wrap:true }));
  sheet.setRowHeight(ROW_HEADER, 48);
  sheet.getRange(ROW_HEADER, 1).setNote('Y: 오늘 목록에 표시\nN: 숨김\n날짜: yyyy-MM-dd 또는 매일\n⚠️ D열은 텍스트 형식으로!');

  const tz    = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const rowBg = ['#F8F7FF', '#F2F0FF'];
  const samples = [
    ['Y', '학교폭력 예방 교원 연수',   '학교폭력 개념, 사안 처리 절차, 피해학생 지원 방법', today],
    ['Y', '개인정보보호 연수',           '개인정보보호법 주요 내용, 교육현장 적용 사례',       today],
    ['Y', '성희롱·성폭력 예방 연수',   '직장 내 성희롱 예방, 대처 방법, 피해자 지원 절차',   today],
    ['N', '직장 내 괴롭힘 예방 연수',   '직장 내 괴롭힘 정의, 예방 및 대응 절차',             '매일'],
  ];
  for (let i = 0; i < MAX_TRAININGS; i++) {
    const r  = ROW_DATA_START + i;
    const bg = rowBg[i % 2];
    const s  = samples[i] || ['N', '', '', today];
    _cell(sheet, r, 1, s[0], { bg, fg: s[0]==='Y' ? '#27AE60' : '#AAAAAA', bold:true, halign:'center' });
    _cell(sheet, r, 2, s[1], { bg, fg:'#1A1A2E', bold: s[1]!=='' });
    _cell(sheet, r, 3, s[2], { bg, fg:'#555555', wrap:true });
    sheet.getRange(r, 4).setNumberFormat('@STRING@').setValue(s[3])
      .setBackground(bg).setFontColor('#2C3E50').setHorizontalAlignment('center').setVerticalAlignment('middle');
    _cell(sheet, r, 5, '', { bg, fg:'#999' });
    sheet.setRowHeight(r, 54);
  }

  // ── 추가 설정 (선택사항) ──────────────────────────────
  sheet.getRange(17, 1, 1, 5).merge().setBackground('#C8D6E5');
  sheet.setRowHeight(17, 4);

  _cell(sheet, ROW_PIN, 1, '🔐 출력 비밀번호', { bg:'#8E44AD', fg:'#FFFFFF', bold:true, halign:'center' });
  sheet.getRange(ROW_PIN, 2).setNumberFormat('@STRING@')
    .setBackground('#FAF5FF').setFontColor('#1A1A2E').setFontWeight('bold').setVerticalAlignment('middle');
  sheet.getRange(ROW_PIN, 3, 1, 3).merge();
  sheet.getRange(ROW_PIN, 3).setValue('← 입력 시 웹페이지 [서명결과 출력]에 비밀번호 잠금 적용 (비워두면 누구나 출력 가능)')
    .setBackground('#FAF5FF').setFontColor('#999').setFontSize(10).setVerticalAlignment('middle');
  sheet.setRowHeight(ROW_PIN, 38);

  _cell(sheet, ROW_NOTICE, 1, '📢 안내문', { bg:'#8E44AD', fg:'#FFFFFF', bold:true, halign:'center' });
  sheet.getRange(ROW_NOTICE, 2).setNumberFormat('@STRING@')
    .setBackground('#FFFFFF').setFontColor('#2C3E50').setWrap(true).setVerticalAlignment('middle');
  sheet.getRange(ROW_NOTICE, 3, 1, 3).merge();
  sheet.getRange(ROW_NOTICE, 3).setValue('← 입력 시 웹페이지 상단에 안내 문구 표시 (예: 서명 후 설문 참여 부탁드립니다)')
    .setBackground('#FFFFFF').setFontColor('#999').setFontSize(10).setVerticalAlignment('middle');
  sheet.setRowHeight(ROW_NOTICE, 44);

  _cell(sheet, ROW_COLOR, 1, '🎨 대표 색상', { bg:'#8E44AD', fg:'#FFFFFF', bold:true, halign:'center' });
  // B20 셀 자체가 색상 견본입니다. 색상코드를 입력하는 게 아니라,
  // 이 셀을 선택하고 툴바의 "채우기 색" 도구로 원하는 색을 칠하면
  // 그 색이 그대로 웹페이지에 적용됩니다 (기본값: 시스템 기본 녹색).
  sheet.getRange(ROW_COLOR, 2)
    .setValue('')
    .setBackground('#1F4D3A')
    .setNote('👆 이 셀을 클릭한 뒤 상단 툴바의 "채우기 색(페인트통 아이콘)"으로\n원하는 색을 선택하세요. 칠한 색이 웹페이지 색상이 됩니다.');
  sheet.getRange(ROW_COLOR, 3, 1, 3).merge();
  sheet.getRange(ROW_COLOR, 3).setValue('← 이 셀 클릭 → 툴바 🪣 채우기 색 → 원하는 색 선택 (기본값: 초록)')
    .setBackground('#FAF5FF').setFontColor('#999').setFontSize(10).setWrap(true).setVerticalAlignment('middle');
  sheet.setRowHeight(ROW_COLOR, 38);

  sheet.setFrozenRows(ROW_HEADER);
  sheet.setTabColor('#5C6BC0');
}

// ── 서명현황 시트 (H열 이미지 포함) ────────────────────────
function _setupRecordSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_RECORDS);
  if (!sheet) sheet = ss.insertSheet(SHEET_RECORDS);
  sheet.clear();

  const headers = ['날짜', '시간', '연수명', '부서', '성명', '서명 여부', '서명 파일 URL', '서명 이미지'];
  const widths  = [100, 80, 220, 130, 80, 80, 260, 180];
  headers.forEach((h, i) => {
    sheet.setColumnWidth(i + 1, widths[i]);
    _cell(sheet, 1, i + 1, h, { bg:'#2C3E50', fg:'#FFFFFF', bold:true, halign:'center', size:11 });
  });
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setTabColor('#27AE60');
}

// ── 구성원 명단 시트 ────────────────────────────────────────
function _setupStaffSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_STAFF);
  if (!sheet) sheet = ss.insertSheet(SHEET_STAFF);
  sheet.clear();

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 280);

  sheet.getRange(1, 1, 1, 3).merge();
  _cell(sheet, 1, 1, '👥 전체 구성원 명단', { bg:'#2C3E50', fg:'#FFFFFF', bold:true, size:13, halign:'center' });
  sheet.setRowHeight(1, 40);

  sheet.getRange(2, 1, 1, 3).merge();
  _cell(sheet, 2, 1,
    '※ A열: 부서명, B열: 성명 입력 → 웹 서명 화면의 부서·이름 선택 목록이 자동 생성됩니다.',
    { bg:'#FFF8E6', fg:'#E67E22', size:10, wrap:true });
  sheet.setRowHeight(2, 34);

  ['부서', '성명', '비고'].forEach((h, i) => {
    _cell(sheet, 3, i + 1, h, { bg:'#5C6BC0', fg:'#FFFFFF', bold:true, halign:'center' });
  });
  sheet.setRowHeight(3, 34);

  const sample = [
    ['교무기획부', '김철수', ''], ['교무기획부', '이영희', ''],
    ['교육과정부', '박민준', ''], ['교육과정부', '최지현', ''],
    ['인문사회부', '정수연', ''], ['과학기술부', '한동훈', ''],
    ['학생생활부', '윤서진', ''], ['행정실',     '강미래', '행정직'],
  ];
  const bg2 = ['#F8F7FF', '#F2F0FF'];
  sample.forEach((row, i) => {
    const r = 4 + i, bg = bg2[i % 2];
    _cell(sheet, r, 1, row[0], { bg, fg:'#5C6BC0', bold:true });
    _cell(sheet, r, 2, row[1], { bg, fg:'#1A1A2E', bold:true });
    _cell(sheet, r, 3, row[2], { bg, fg:'#999' });
    sheet.setRowHeight(r, 30);
  });

  sheet.setFrozenRows(3);
  sheet.setTabColor('#E67E22');
}

// ── 미서명현황 시트 (빈 상태로 초기 생성) ─────────────────
function _setupSummarySheet(ss) {
  let sheet = ss.getSheetByName(SHEET_SUMMARY);
  if (!sheet) sheet = ss.insertSheet(SHEET_SUMMARY);
  sheet.clear();
  sheet.getRange(1, 1, 1, 6).merge();
  _cell(sheet, 1, 1,
    '📊 미서명 현황  |  [🎓 연수서명관리] → [미서명 현황 집계] 버튼을 눌러 집계하세요',
    { bg:'#ECF0F1', fg:'#7F8C8D', size:11, halign:'center' });
  sheet.setRowHeight(1, 44);
  sheet.setTabColor('#E74C3C');
}

// ── 사용설명서 시트 ─────────────────────────────────────────
function _setupGuideSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_GUIDE);
  if (!sheet) sheet = ss.insertSheet(SHEET_GUIDE);
  sheet.clear();
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 560);

  const W = '#FFFFFF', G = '#2C3E50';
  const rows = [
    [1,  '📖 연수 전자서명 시스템 사용설명서 v5', null, true, '#2C3E50', null, 40, 14],
    [2,  'Designed & Built by 성포고등학교 황성재 | @hirame.ki', null, true, '#34495E', null, 28, 10, '#BDC3C7', 'right'],
    [3,  '', null, true, '#C8D6E5', null, 5],
    [4,  '🔧 최초 설치 (딱 1회만 하면 끝!)', null, true, '#4A90D9', null, 36, 12],
    [5,  '① Apps Script 열기', '시트 상단 메뉴 [확장 프로그램] → [Apps Script] 클릭\n(코드는 이 시트에 이미 포함되어 있어 붙여넣기가 필요 없습니다)', false, '#EBF4FF', '#EBF4FF', 52, null, true],
    [6,  '② 웹앱 배포', '[배포] → [새 배포] → 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → [배포]\n(최초 1회 권한 승인 창이 뜨면 계정 선택 후 허용) → 웹 앱 URL 복사', false, '#F0F4FF', '#F0F4FF', 56, null, true],
    [7,  '③ 기본 정보 입력', '[⚙️ 연수설정] B2 기관명 · 7~16행 연수 입력 / [👥 구성원명단] 부서·성명 입력', false, '#EBF4FF', '#EBF4FF', 44, null, true],
    [8,  '④ 웹페이지 연결', '서명 웹페이지 접속 → 복사한 배포 URL 붙여넣기 → [연결하기]', false, '#F0F4FF', '#F0F4FF'],
    [9,  '⑤ 링크 공유', '연결 완료 후 표시되는 공유 링크·QR을 구성원에게 안내', false, '#EBF4FF', '#EBF4FF'],
    [10, '', null, true, '#C8D6E5', null, 5],
    [11, '✨ v5의 달라진 점', null, true, '#16A085', null, 36, 12],
    [12, '재배포 불필요', '화면(디자인·기능) 업데이트는 웹페이지에 자동 반영됩니다.\n→ 이 코드와 배포를 다시 손댈 필요가 없습니다.', false, '#E8F8F3', '#E8F8F3', 52, null, true],
    [13, '서명등록부 출력', '웹페이지 [서명결과 출력] → 부서·성명·서명 이미지가 담긴 서명등록부를 인쇄(PDF 저장)할 수 있습니다.', false, '#F0FBF7', '#F0FBF7', 44, null, true],
    [14, '', null, true, '#C8D6E5', null, 5],
    [15, '👥 구성원명단 입력 (중요!)', null, true, '#E67E22', null, 36, 12],
    [16, '입력 위치', '[👥 구성원명단] 시트 → A열: 부서, B열: 성명 입력', false, '#FFF8F0', '#FFF8F0'],
    [17, '자동 연동', '명단에 입력된 부서·이름이 웹 서명 화면의 선택 목록에 자동 반영됨', false, '#FFF3E6', '#FFF3E6', 44, null, true],
    [18, '', null, true, '#C8D6E5', null, 5],
    [19, '📋 연수 등록', null, true, '#27AE60', null, 36, 12],
    [20, '기관명', '[⚙️ 연수설정] B2 셀 입력 → 웹페이지 상단 자동 반영', false, '#F0FFF4', '#F0FFF4'],
    [21, '연수 입력', '7~16행: A열 Y/N, B열 연수명, C열 내용, D열 날짜', false, '#ECFDF5', '#ECFDF5'],
    [22, '날짜 형식', '특정일: 2025-03-15 / 항상: 매일\n⚠️ D열 셀 서식 반드시 "일반 텍스트"로!', false, '#F0FFF4', '#F0FFF4', 52, null, true],
    [23, '', null, true, '#C8D6E5', null, 5],
    [24, '📊 서명 확인', null, true, '#2980B9', null, 36, 12],
    [25, '셀 내 이미지', '[📋 서명현황] 시트 H열에 서명 이미지가 셀 안에 직접 표시됨', false, '#EBF4FF', '#EBF4FF'],
    [26, '서명등록부', '웹페이지 [서명결과 출력] 버튼 → 브라우저 인쇄 / PDF 저장', false, '#F0F4FF', '#F0F4FF'],
    [27, '미서명 집계', '[🎓 연수서명관리] → [미서명 현황 집계] → [📊 미서명현황] 시트 확인', false, '#EBF4FF', '#EBF4FF'],
    [28, '', null, true, '#C8D6E5', null, 5],
    [29, '⚠️ 주의사항', null, true, '#E74C3C', null, 36, 12],
    [30, '날짜 오류', 'D열이 날짜 서식으로 변환되면 연수 목록이 표시되지 않음\n→ 셀 서식을 "일반 텍스트"로 변경 후 다시 입력', false, '#FFF5F5', '#FFF5F5', 56, '#C0392B', true],
    [31, '액세스 권한', '배포 시 액세스가 "모든 사용자"가 아니면 웹페이지 연결에 실패함\n→ [배포 관리]에서 액세스 권한 확인', false, '#FFF0F0', '#FFF0F0', 52, '#C0392B', true],
    [32, '이름 일치', '명단의 성명과 서명 시 선택 이름이 동일하므로 미서명 판별 정확도 100%', false, '#FFF5F5', '#FFF5F5'],
    [33, '', null, true, '#C8D6E5', null, 5],
    [34, '🔒 서명 보안 (대리·재서명 방지)', null, true, '#1A5276', null, 36, 12],
    [35, '방안 ① 서버 차단', '제출 시 서버(시트)에서 오늘 날짜 기준 동일 연수+동일 이름 조합 확인\n→ 이미 서명된 경우 저장 거부 (다른 기기 시도해도 차단)', false, '#EBF5FB', '#EBF5FB', 56, null, true],
    [36, '방안 ② 기기 잠금', '서명 완료 시 브라우저에 연수별 완료 기록 저장\n→ 같은 기기 재접속해도 해당 연수 ✅ 완료 표시, 재시도 불가', false, '#EBF5FB', '#EBF5FB', 56, null, true],
    [37, '대리 서명 방지', '같은 기기에서 1회 제출 시 이름과 무관하게 해당 연수 잠금\n→ A가 B 이름으로 대리 서명 후, 같은 기기에서 A 본인도 서명 불가', false, '#EBF5FB', '#EBF5FB', 56, null, true],
    [38, '한계 및 보완', '브라우저 캐시 삭제 또는 다른 기기 접속 시 방안②는 우회 가능\n→ 방안①(서버 차단)이 최종 안전망 역할 수행\n→ 연수 후 미서명현황 집계로 관리자가 최종 확인 권장', false, '#FFF8F0', '#FFF8F0', 66, '#A04000', true],
    [39, '', null, true, '#C8D6E5', null, 5],
    [40, '🛠️ 추가 설정 (선택사항)', null, true, '#8E44AD', null, 36, 12],
    [41, '출력 비밀번호', '[⚙️ 연수설정] B18 입력 시 [서명결과 출력]에 비밀번호 잠금 적용\n→ 구성원 명단·서명 이미지가 아무에게나 노출되지 않도록 보호', false, '#FAF5FF', '#FAF5FF', 52, null, true],
    [42, '안내문', '[⚙️ 연수설정] B19 입력 시 웹페이지 상단에 안내 문구 표시', false, '#F5EBFF', '#F5EBFF'],
    [43, '대표 색상', '[⚙️ 연수설정] B20 셀 클릭 → 툴바 채우기 색(페인트통) → 원하는 색 선택\n→ 칠한 색이 웹페이지 전체 색상으로 자동 반영 (코드 입력 불필요)', false, '#FAF5FF', '#FAF5FF', 44, null, true],
  ];

  rows.forEach(entry => {
    const [r, col1, col2, isHdr, bg1, bg2, h, size, fgOvr, align, wrap] = [
      entry[0], entry[1], entry[2], entry[3], entry[4], entry[5],
      entry[6]||36, entry[7]||11, entry[8]||W, entry[9]||'left', entry[10]||false
    ];
    if (isHdr && col2 === null) {
      sheet.getRange(r, 1, 1, 2).merge();
      const cell = sheet.getRange(r, 1);
      if (col1) cell.setValue(col1);
      cell.setBackground(bg1||'#EEE');
      if (col1 && bg1 !== '#C8D6E5') {
        cell.setFontColor(fgOvr).setFontWeight('bold').setFontSize(size)
          .setHorizontalAlignment(align).setVerticalAlignment('middle');
      }
    } else {
      const c1 = sheet.getRange(r, 1);
      c1.setValue(col1).setBackground(bg1).setFontColor(G).setFontWeight('bold').setVerticalAlignment('middle');
      const c2 = sheet.getRange(r, 2);
      c2.setValue(col2).setBackground(bg2||'#FFF')
        .setFontColor(entry[8]==='#C0392B'?'#C0392B':'#555').setVerticalAlignment('middle');
      if (wrap) { c1.setWrap(true); c2.setWrap(true); }
    }
    sheet.setRowHeight(r, h);
  });

  sheet.setTabColor('#FF6B35');
}

// ============================================================
//  유틸리티
// ============================================================
function _todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
function _getOrCreateFolder(name, parent) {
  const root = parent || DriveApp.getRootFolder();
  const iter = root.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : root.createFolder(name);
}
function _cell(sheet, row, col, value, style) {
  const range = sheet.getRange(row, col);
  if (value !== '' && value !== undefined) range.setValue(value);
  if (style.bg)     range.setBackground(style.bg);
  if (style.fg)     range.setFontColor(style.fg);
  if (style.bold)   range.setFontWeight('bold');
  if (style.size)   range.setFontSize(style.size);
  if (style.wrap)   range.setWrap(true);
  if (style.halign) range.setHorizontalAlignment(style.halign);
  else              range.setHorizontalAlignment('left');
  range.setVerticalAlignment('middle');
}

// ============================================================
//  커스텀 메뉴
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎓 연수서명관리')
    .addItem('📋 초기설정 실행 (최초 1회)', 'setupSpreadsheet')
    .addSeparator()
    .addItem('📊 미서명 현황 집계', 'generateAttendanceSummary')
    .addItem('🔀 연수명별 그룹 정렬', 'groupSortByTraining')
    .addSeparator()
    .addItem('🔗 웹앱 배포 안내', 'showWebAppInfo')
    .addToUi();
}

function showWebAppInfo() {
  SpreadsheetApp.getUi().alert(
    '🔗 웹앱 배포 안내 (최초 1회만!)',
    '1. [확장 프로그램] → [Apps Script]\n' +
    '2. [배포] → [새 배포]\n' +
    '3. 유형: 웹 앱 / 실행 계정: 나 / 액세스: 모든 사용자\n' +
    '4. [배포] 후 웹 앱 URL 복사\n' +
    '5. 서명 웹페이지에 접속해 복사한 URL을 붙여넣고 [연결하기]\n' +
    '6. 연결 후 생성되는 공유 링크를 구성원에게 안내\n\n' +
    '★ 이후 코드 수정이나 재배포는 필요하지 않습니다.\n' +
    '   화면 업데이트는 웹페이지에 자동 반영됩니다.\n\n' +
    'QR 생성: https://qr.io',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
