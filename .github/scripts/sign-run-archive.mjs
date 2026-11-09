// ============================================================
//  2개월 경과 서명 기록 아카이브 스크립트
// ------------------------------------------------------------
//  1. Supabase institutions 테이블에서 전체 기관 목록(org_key, apps_script_url) 조회
//     (service_role 키 사용 — anon 키로는 테이블 직접 조회가 막혀 있어 불가능)
//  2. 기관별로 기준일 이전 기록을 읽기만 한다 (이 단계에서는 지우지 않음)
//  3. 읽은 기록을 그 기관의 Apps Script(doPost action:'archiveBackup')로 전송
//     → 기관 자신의 구글 드라이브에 엑셀로 저장 + 이메일 알림 발송
//  4. 드라이브 저장이 성공했다고 확인된 기록만 Supabase에서 삭제
//
//  ※ 예전에는 archive_old_signatures()로 지우면서 읽은 뒤에 드라이브로 보내서,
//    Apps Script가 고장 난 기관은 기록이 백업 없이 사라졌다. 그래서 순서를 바꿨다.
//    백업이 실패한 기관의 기록은 Supabase에 그대로 남고 다음 실행 때 다시 시도한다.
//    저장은 됐는데 삭제만 실패하면 다음 실행 때 엑셀에 중복으로 들어갈 수 있지만,
//    기록이 사라지는 것보다 낫다.
//
//  필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ARCHIVE_DAYS(선택, 기본 60)
// ============================================================

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ARCHIVE_DAYS  = Number(process.env.ARCHIVE_DAYS || 60);

// Apps Script는 한 번에 최대 6분만 실행되고 줄마다 시트에 적으므로 나눠서 보낸다.
const BATCH_SIZE    = 500;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS);
const cutoffStr = cutoff.toISOString().slice(0, 10);

async function sb(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!r.ok) throw new Error(`${path.split('?')[0]} → HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

// 기준일 이전 기록을 오래된 순서로 한 묶음 읽는다 (삭제하지 않음)
function readOldRows(orgKey) {
  const q = new URLSearchParams({
    org_key: `eq.${orgKey}`,
    sign_date: `lt.${cutoffStr}`,
    select: 'id,sign_date,sign_time,training_title,department,name,image_url',
    order: 'id.asc',
    limit: String(BATCH_SIZE)
  });
  return sb(`signatures?${q}`);
}

// 드라이브에 저장됐다고 응답을 받은 경우에만 정상 종료한다.
// HTML 오류 페이지·접속 실패·success:false는 모두 예외로 던져 삭제 단계로 못 가게 한다.
async function backupToDrive(url, rows) {
  const payload = rows.map(r => ({
    date: r.sign_date,
    time: r.sign_time,
    trainingTitle: r.training_title,
    department: r.department,
    name: r.name,
    imageUrl: r.image_url
  }));

  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ action: 'archiveBackup', rows: payload })
  });
  const text = await resp.text();

  let res;
  try {
    res = JSON.parse(text);
  } catch {
    throw new Error(`Apps Script가 정상 응답을 주지 않음 (HTTP ${resp.status})`);
  }
  if (!res || res.success !== true) {
    throw new Error(res && res.message ? res.message : '알 수 없는 응답');
  }
  if (res.savedCount !== undefined && res.savedCount !== rows.length) {
    throw new Error(`저장 건수 불일치 (보냄 ${rows.length}건, 저장 ${res.savedCount}건)`);
  }
}

// 방금 저장한 묶음까지만 지운다 (id 상한으로 범위를 고정)
async function deleteBackedUp(orgKey, rows) {
  const q = new URLSearchParams({
    org_key: `eq.${orgKey}`,
    sign_date: `lt.${cutoffStr}`,
    id: `lte.${rows[rows.length - 1].id}`,
    select: 'id'
  });
  const deleted = await sb(`signatures?${q}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  });
  return deleted.length;
}

async function archiveInstitution({ org_key, apps_script_url }) {
  let total = 0;

  for (;;) {
    const rows = await readOldRows(org_key);
    if (rows.length === 0) return total;

    if (!apps_script_url) {
      throw new Error(`apps_script_url이 없어 드라이브 백업 불가 (${rows.length}건 이상 Supabase에 유지)`);
    }

    try {
      await backupToDrive(apps_script_url, rows);
    } catch (err) {
      throw new Error(`드라이브 백업 실패, 기록은 지우지 않고 유지 (${total > 0 ? `앞서 ${total}건 처리 후 ` : ''}${rows.length}건 이상 남음): ${err.message}`);
    }

    const deletedCount = await deleteBackedUp(org_key, rows);
    if (deletedCount !== rows.length) {
      console.warn(`[${org_key}] 삭제 건수 불일치: 백업 ${rows.length}건, 삭제 ${deletedCount}건`);
    }
    if (deletedCount === 0) throw new Error('백업은 됐지만 삭제되지 않음 — 반복을 멈춤');

    total += rows.length;
    if (rows.length < BATCH_SIZE) return total;
  }
}

async function main() {
  const institutions = await sb('institutions?select=org_key,apps_script_url');
  console.log(`대상 기관 ${institutions.length}곳, 기준일 ${cutoffStr} 이전 기록 아카이브 시작`);

  let okCount = 0, failCount = 0;

  for (const inst of institutions) {
    try {
      const total = await archiveInstitution(inst);
      if (total === 0) {
        console.log(`[${inst.org_key}] 아카이브할 기록 없음`);
      } else {
        console.log(`[${inst.org_key}] ${total}건 드라이브 백업 성공 → Supabase에서 삭제`);
        okCount++;
      }
    } catch (err) {
      console.error(`[${inst.org_key}] 처리 중 오류:`, err.message);
      failCount++;
    }
  }

  console.log(`완료 — 성공 ${okCount}곳 / 실패 ${failCount}곳 / 전체 ${institutions.length}곳`);
}

main().catch(err => { console.error(err); process.exit(1); });
