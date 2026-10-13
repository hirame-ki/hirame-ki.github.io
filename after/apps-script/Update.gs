/**
 * 방과후 한눈에 — GitHub에서 새 버전을 확인하고, 버튼 하나로 코드를 바꿔 웹앱을 다시 배포합니다.
 *
 * 흐름: release/version.json 확인 → 새 버전이면 알림(관리자 화면 띠, 시트 열 때 알림)
 *       → [업데이트] → 파일 받기·확인값(SHA-256) 검사 → Apps Script API로 코드 교체
 *       → 새 버전 만들기 → 기존 웹앱 배포를 새 버전으로 (주소 그대로)
 * 학생·강좌·신청 데이터는 시트에 있으므로 바뀌지 않습니다. 새 열·탭은 다음 실행 때 자동으로 채워집니다.
 */

function updateBase_(s) {
  var b = String((s && s.updateBase) || UPDATE_BASE || '').trim();
  return b ? b.replace(/\/?$/, '/') : '';
}

/** a가 b보다 새 버전이면 true (예: 1.2.0 > 1.1.5) */
function isNewer_(a, b) {
  if (!a) return false;
  var pa = String(a).split('.').map(Number), pb = String(b || '0').split('.').map(Number);
  for (var i = 0; i < 3; i++) {
    var x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

function fetchText_(url) {
  var r;
  try {
    r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'Cache-Control': 'no-cache' } });
  } catch (e) {
    if (/permission|권한|authoriz/i.test(String(e.message || e))) {
      throw new Error('외부 접속 권한 승인이 필요합니다. 구글 시트 메뉴 [🏫 방과후 관리] → [업데이트 확인·설치]를 한 번 눌러 승인하세요.');
    }
    throw e;
  }
  if (r.getResponseCode() !== 200) throw new Error('파일을 받지 못했습니다 (' + r.getResponseCode() + '): ' + url);
  return r.getContentText('UTF-8');
}

function fetchRelease_(s) {
  var base = updateBase_(s);
  if (!base) throw new Error('업데이트주소가 비어 있습니다.');
  var info;
  try {
    info = JSON.parse(fetchText_(base + 'release/version.json?t=' + new Date().getTime()));
  } catch (e) {
    throw new Error('업데이트 정보를 가져오지 못했습니다. 인터넷 연결과 [설정] 탭의 업데이트주소를 확인하세요. (' + String(e.message || e).slice(0, 160) + ')');
  }
  if (!info.version || !info.files || !info.files.length) throw new Error('업데이트 정보 형식이 올바르지 않습니다.');
  return info;
}

/** 새 버전 확인 (6시간 동안 결과를 기억합니다) */
function checkUpdate_(force) {
  var cache = CacheService.getScriptCache();
  if (!force) {
    var c = cache.get('upd_info');
    if (c) return JSON.parse(c);
  }
  var s = readSettings_(), info = fetchRelease_(s);
  var res = {
    current: APP_VERSION, latest: info.version, date: info.date || '', notes: info.notes || [],
    changed: info.changed || [], newer: isNewer_(info.version, APP_VERSION), base: updateBase_(s)
  };
  if (s.latestVersion !== info.version) writeSettings_({ latestVersion: info.version });
  cache.put('upd_info', JSON.stringify(res), 21600);
  return res;
}

/* ───────────── Apps Script API ───────────── */

function scriptApi_(method, path, body) {
  var opt = {
    method: method, muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  };
  if (body) opt.payload = JSON.stringify(body);
  var r = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + ScriptApp.getScriptId() + path, opt);
  var code = r.getResponseCode(), text = r.getContentText();
  if (code >= 200 && code < 300) return text ? JSON.parse(text) : {};
  throw new Error(apiErrorMsg_(code, text));
}

function apiErrorMsg_(code, text) {
  var msg = String(text || '');
  try { msg = JSON.parse(text).error.message || msg; } catch (e) { }
  if (/has not enabled the Apps Script API|usersettings/i.test(msg)) {
    return 'Google Apps Script API가 꺼져 있습니다. https://script.google.com/home/usersettings 에서 "Google Apps Script API"를 [사용]으로 바꾼 뒤 몇 분 뒤 다시 시도하세요.';
  }
  if (/has not been used in project|it is disabled|SERVICE_DISABLED/i.test(msg)) {
    return '이 스크립트의 구글 클라우드 프로젝트에서 Apps Script API를 쓸 수 없는 계정입니다. 자동 업데이트 대신 붙여넣기 도우미로 바뀐 파일만 붙여넣으세요. (원문: ' + msg.slice(0, 200) + ')';
  }
  if (code === 401 || (code === 403 && /insufficient|scope|permission/i.test(msg))) {
    return '스크립트 수정 권한 승인이 필요합니다. 구글 시트 메뉴 [🏫 방과후 관리] → [업데이트 확인·설치]를 시트에서 한 번 눌러 승인하세요. (원문: ' + msg.slice(0, 160) + ')';
  }
  return 'Apps Script API 오류 (' + code + '): ' + msg.slice(0, 300);
}

function sha256Hex_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/* ───────────── 업데이트 실행 ───────────── */

function performUpdate_(who) {
  var s = readSettings_(), info = fetchRelease_(s), base = updateBase_(s);
  if (!isNewer_(info.version, APP_VERSION)) throw new Error('이미 최신 버전(v' + APP_VERSION + ')입니다.');

  // 1) 새 파일을 받아 확인값(SHA-256)이 version.json과 같은지 검사 → 중간에 바뀌거나 덜 올라간 파일은 쓰지 않음
  var files = info.files.map(function (f) {
    var src = fetchText_(base + f.path + '?v=' + encodeURIComponent(info.version)).replace(/\r\n/g, '\n');
    if (f.sha256 && sha256Hex_(src) !== f.sha256) {
      throw new Error('「' + f.name + '」 파일 확인값이 맞지 않아 업데이트를 멈췄습니다. GitHub에 올린 직후라면 5분쯤 뒤 다시 시도하세요.');
    }
    return { name: f.name, type: f.type, source: src };
  });

  // 2) 지금 프로젝트에서 웹앱 공개 설정·시간대는 그대로 두고, 학교가 따로 추가한 파일도 남김
  var cur = scriptApi_('get', '/content'), curManifest = null, extra = [], known = {};
  files.forEach(function (f) { known[f.name] = true; });
  (info.removed || []).forEach(function (n) { known[n] = true; });
  (cur.files || []).forEach(function (f) {
    if (f.name === 'appsscript') { try { curManifest = JSON.parse(f.source); } catch (e) { } }
    else if (!known[f.name]) extra.push({ name: f.name, type: f.type, source: f.source });
  });
  files = files.map(function (f) {
    if (f.name !== 'appsscript' || !curManifest) return f;
    var m = JSON.parse(f.source);
    if (curManifest.webapp) m.webapp = curManifest.webapp;
    if (curManifest.timeZone) m.timeZone = curManifest.timeZone;
    return { name: f.name, type: f.type, source: JSON.stringify(m, null, 2) };
  });
  if (!files.some(function (f) { return f.name === 'appsscript'; })) {
    if (!curManifest) throw new Error('매니페스트(appsscript.json)를 찾을 수 없습니다.');
    files.push({ name: 'appsscript', type: 'JSON', source: JSON.stringify(curManifest, null, 2) });
  }

  // 3) 코드 교체
  scriptApi_('put', '/content', { files: files.concat(extra) });

  // 4) 새 버전을 만들고, 웹앱 배포를 새 버전으로 (웹앱 주소는 바뀌지 않음)
  var ver = scriptApi_('post', '/versions', { description: APP_NAME + ' v' + info.version });
  var deps = (scriptApi_('get', '/deployments').deployments || []).filter(function (d) {
    return d.deploymentConfig && d.deploymentConfig.versionNumber &&
      (d.entryPoints || []).some(function (e) { return e.entryPointType === 'WEB_APP'; });
  });
  var url = webUrl_() || s.webUrl;
  var targets = deps.filter(function (d) {
    return (d.entryPoints || []).some(function (e) { return e.webApp && e.webApp.url === url; });
  });
  if (!targets.length) targets = deps;
  targets.forEach(function (d) {
    scriptApi_('put', '/deployments/' + d.deploymentId, {
      deploymentConfig: { scriptId: ScriptApp.getScriptId(), versionNumber: ver.versionNumber, manifestFileName: 'appsscript', description: APP_NAME + ' v' + info.version }
    });
  });

  writeSettings_({ latestVersion: info.version });
  CacheService.getScriptCache().remove('upd_info');
  log_({ role: 'admin', name: who || '관리자' }, '업데이트', 'v' + APP_VERSION + ' → v' + info.version,
    '파일 ' + files.length + '개, 웹앱 배포 ' + targets.length + '개 갱신 (버전 ' + ver.versionNumber + ')');
  return { from: APP_VERSION, to: info.version, versionNumber: ver.versionNumber, deployments: targets.length, notes: info.notes || [] };
}

function actCheckUpdate_(d) { return checkUpdate_(!!d.force); }

function actRunUpdate_(d, ctx) {
  var r = performUpdate_(ctx.name);
  return {
    update: r, reload: true,
    msg: 'v' + r.to + '(으)로 업데이트했습니다.' + (r.deployments ? ' 웹앱도 새 버전으로 바꿨습니다.' : ' (웹앱 배포를 찾지 못해 코드만 바꿨습니다)') + ' 잠시 뒤 새로고침하세요.'
  };
}

/* ───────────── 시트 메뉴 ───────────── */

function menuUpdate() {
  var ui = requireSheet_();
  var info;
  try { info = checkUpdate_(true); } catch (e) { ui.alert('업데이트 확인', String(e.message || e), ui.ButtonSet.OK); return; }
  if (!info.newer) {
    ui.alert('업데이트 확인', '지금 최신 버전(v' + APP_VERSION + ')을 쓰고 있습니다.', ui.ButtonSet.OK);
    return;
  }
  var notes = (info.notes || []).map(function (n) { return '· ' + n; }).join('\n');
  var ok = ui.alert('새 버전 v' + info.latest + ' (지금 v' + APP_VERSION + ')',
    (info.date ? info.date + ' 공개\n\n' : '') + (notes || '(바뀐 내용 설명 없음)') +
    '\n\n지금 업데이트할까요? 코드 파일만 바뀌고 학생·강좌·신청 데이터는 그대로입니다.', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  try {
    var r = performUpdate_('관리자(시트)');
    ui.alert('업데이트 완료', 'v' + r.from + ' → v' + r.to + '\n웹앱 배포 ' + r.deployments + '개를 새 버전으로 바꿨습니다.\n\n시트를 새로고침(F5)한 뒤, 메뉴를 한 번 눌러 새 권한 승인 창이 뜨면 허용하세요.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('업데이트하지 못했습니다', String(e.message || e) + '\n\n[업데이트 가능 여부 점검]으로 원인을 확인할 수 있습니다.', ui.ButtonSet.OK);
  }
}

/** 이 계정에서 자동 업데이트를 쓸 수 있는지 하나씩 확인합니다. (코드를 바꾸지 않음) */
function menuUpdateDiagnose() {
  var ui = requireSheet_(), s = readSettings_(), lines = [], ok = true;
  var step = function (label, fn) {
    try { var m = fn(); lines.push('✅ ' + label + (m ? ' — ' + m : '')); return true; }
    catch (e) { ok = false; lines.push('❌ ' + label + ' — ' + String(e.message || e)); return false; }
  };
  step('지금 버전', function () { return 'v' + APP_VERSION; });
  step('업데이트 정보 받기 (GitHub)', function () { var i = checkUpdate_(true); return '최신 v' + i.latest + (i.newer ? ' (새 버전 있음)' : ' (최신)'); });
  var apiOk = step('Apps Script API 사용', function () { scriptApi_('get', ''); return '사용 가능'; });
  if (apiOk) {
    step('코드 읽기 권한', function () { return '파일 ' + (scriptApi_('get', '/content').files || []).length + '개'; });
    step('웹앱 배포 찾기', function () {
      var deps = (scriptApi_('get', '/deployments').deployments || []).filter(function (d) { return d.deploymentConfig && d.deploymentConfig.versionNumber; });
      var url = webUrl_() || s.webUrl;
      var hit = deps.some(function (d) { return (d.entryPoints || []).some(function (e) { return e.webApp && e.webApp.url === url; }); });
      if (!deps.length) throw new Error('웹앱 배포가 없습니다. 사용설명서 4단계로 먼저 배포하세요.');
      return deps.length + '개' + (hit ? ' (지금 주소와 일치)' : ' (주소 일치 확인 못 함 — 업데이트 시 모든 웹앱 배포를 갱신)');
    });
  }
  ui.alert('업데이트 가능 여부 점검', lines.join('\n') + '\n\n' + (ok
    ? '→ 이 계정은 [업데이트 확인·설치] 버튼으로 자동 업데이트를 쓸 수 있습니다.'
    : '→ ❌ 항목을 먼저 해결하세요. Apps Script API 문제가 해결되지 않으면 붙여넣기 도우미로 업데이트할 수 있습니다.'), ui.ButtonSet.OK);
}
