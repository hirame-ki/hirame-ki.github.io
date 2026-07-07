// ============================================================
//  2개월 경과 서명 기록 아카이브 스크립트
// ------------------------------------------------------------
//  1. Supabase institutions 테이블에서 전체 기관 목록(org_key, apps_script_url) 조회
//     (service_role 키 사용 — anon 키로는 테이블 직접 조회가 막혀 있어 불가능)
//  2. 기관별로 archive_old_signatures(org_key, cutoff_date) 호출
//     → 기준일 이전 기록을 반환하면서 동시에 Supabase에서 삭제
//  3. 반환된 기록을 그 기관의 Apps Script(doPost action:'archiveBackup')로 전송
//     → 기관 자신의 구글 드라이브에 엑셀로 저장 + 이메일 알림 발송
//
//  필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ARCHIVE_DAYS(선택, 기본 60)
// ============================================================

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ARCHIVE_DAYS  = Number(process.env.ARCHIVE_DAYS || 60);

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
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

async function main() {
  const institutions = await sb('institutions?select=org_key,apps_script_url');
  console.log(`대상 기관 ${institutions.length}곳, 기준일 ${cutoffStr} 이전 기록 아카이브 시작`);

  let okCount = 0, failCount = 0;

  for (const inst of institutions) {
    const { org_key, apps_script_url } = inst;
    try {
      const result = await sb('rpc/archive_old_signatures', {
        method: 'POST',
        body: JSON.stringify({ p_org_key: org_key, p_cutoff_date: cutoffStr })
      });

      if (!result.rows || result.rows.length === 0) {
        console.log(`[${org_key}] 아카이브할 기록 없음`);
        continue;
      }

      if (!apps_script_url) {
        console.warn(`[${org_key}] apps_script_url이 없어 드라이브 백업 불가 (Supabase에서는 이미 ${result.archivedCount}건 삭제됨)`);
        failCount++;
        continue;
      }

      const res = await fetch(apps_script_url, {
        method: 'POST',
        body: JSON.stringify({ action: 'archiveBackup', rows: result.rows })
      }).then(r => r.json());

      if (res.success) {
        console.log(`[${org_key}] ${result.archivedCount}건 아카이브 → 드라이브 백업 성공`);
        okCount++;
      } else {
        console.warn(`[${org_key}] 드라이브 백업 실패: ${res.message}`);
        failCount++;
      }
    } catch (err) {
      console.error(`[${org_key}] 처리 중 오류:`, err.message);
      failCount++;
    }
  }

  console.log(`완료 — 성공 ${okCount}곳 / 실패 ${failCount}곳 / 전체 ${institutions.length}곳`);
}

main().catch(err => { console.error(err); process.exit(1); });
