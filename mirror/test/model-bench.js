/* 생기부돋보기 · AI 정밀 검사 모델 비교
   ────────────────────────────────────────────────────────────
   NIM 카탈로그의 후보 모델을 **실제 생기부 기록**으로 돌려, 고를 근거를 숫자로 만든다.
   임베딩 모델을 test/benchmark.html로 골랐던 것과 같은 방식이다.

   시험지는 `mirror/실제생기부X (테스트용).xlsx` — 그 파일의 **오류/테스트 유형 열**이
   정답지다(어떤 오류를 심어 놨는지 적혀 있다). 여기서는 AI가 맡는 영역인
   **맞춤법·띄어쓰기** 기록만 골라 쓴다(기재요령·분량·만연체는 로컬 규칙 담당).

   왜 필요한가:
   모델 카드의 "빠름·고성능"은 프런티어 모델과 견준 상대적 표현이라, 우리 쓰임새
   (학생 20~30명 한 번에 교정)의 첫 토큰 지연도 한국어 교정 품질도 말해 주지 않는다.
   2026-07-27 qwen3-next 종료 뒤 모델을 갈아 끼우면서 카드 설명만 보고 골랐다가
   ① 화면이 "0/N"에서 멎고 ② 맞춤법을 못 잡는 일이 잇달아 있었다.

   합격/불합격 기준 (사용자 요구를 그대로 옮긴 것):
     · **띄어쓰기 탈락** — 7번 장예원처럼 띄어쓰기가 거의 없는 기록을 못 고치면 체인에서 제외한다.
     · **오안내 감점** — 6번 고은서의 '구지'(→굳이)를 엉뚱하게 안내하면 우선순위를 뒤로 미룬다.
     · 그다음 과교정이 적은 것, 검출이 많은 것, TTFT가 짧은 것 순으로 본다.

   쓰는 법:
     NVAPI_KEY=nvapi-xxxx node mirror/test/model-bench.js
     node mirror/test/model-bench.js nvapi-xxxx
   결과는 화면에 표로 나오고 test/model-bench-result.json에도 남는다.
   키는 전달만 되고 파일에 저장하지 않는다. */

const fs = require('fs');
const path = require('path');

const KEY = process.argv[2] || process.env.NVAPI_KEY || '';
const BASE = 'https://hirameki.esquire0.workers.dev/v1';

/* 같은 기록을 몇 번 돌려 볼 것인가.
   temperature 0 · seed 고정으로 무작위성을 없애 두었는데도, 호스팅된 MoE 모델은
   서버 배치 구성에 따른 부동소수점 차이로 실행마다 답이 갈릴 수 있다.
   "실행할 때마다 결과가 다르다"는 것은 교사에게 그 자체로 결함이므로,
   맞히는가와 **똑같이 맞히는가**를 함께 잰다. 한 번만 재면 운으로 이긴 모델을 고르게 된다. */
const REPEAT = +(process.env.BENCH_REPEAT || 3);

/* `deepseek-ai/deepseek-v4-flash`와 `moonshotai/kimi-k2.6`은 뺐다 —
   실사용에서 첫 글자가 제때 안 나와 화면이 멎었고, 재는 데 시간만 든다.
   그 자리는 아직 재 보지 않은 후보로 채운다(활성 파라미터가 크지 않은 것들). */
const CANDIDATES = [
  { id:'openai/gpt-oss-120b',               extra:{ reasoning_effort:'low' } },
  { id:'google/gemma-4-31b-it',             extra:{} },
];
/* 뺀 모델과 이유 (다시 넣기 전에 반드시 읽을 것 — 같은 검토를 세 번 되풀이했다)

   ① NVIDIA 쪽 대기열 포화 — 모델이 느린 게 아니라 **줄이 밀려 있다.**
      `ResourceExhausted: Worker local total request limit reached (1088/48)`
      처리 슬롯 48개에 대기 1088건이라는 뜻이다. 우리 워커·우리 코드와 무관하다.
      한 건씩 순차로 불러도 90~120초를 넘긴다(동시 호출 탓이 아님을 따로 확인 —
      gpt-oss-120b는 4개 동시에도 TTFT 2초대). 한가한 시간대엔 될 수도 있으나,
      한 반 26명을 돌려야 하는 도구의 선두에 둘 수는 없다.
        · deepseek-ai/deepseek-v4-flash
        · z-ai/glm-5.2                      (한때 31~48초에 되기도 해 편차가 극심)
        · mistralai/mistral-medium-3.5-128b
   ② 계정에서 접근 불가 — 대기열 문제가 아니라 권한 문제라 시간이 지나도 그대로일 가능성이 크다.
        · moonshotai/kimi-k2.6  → 404 "Not found for account"
   ③ 교정본을 못 내놓음 — 답을 delta.content가 아니라 reasoning으로만 흘리고
      finish=length로 끝없이 생각만 하다 끝난다. **워커를 거치지 않고 직접 불러도 같다.**
        · nvidia/nemotron-3-nano-30b-a3b · openai/gpt-oss-20b · nvidia/nemotron-3-super-120b-a12b
   ④ 사라짐
        · qwen/*  NVIDIA 카탈로그에서 삭제(2026-07-27 수명 종료). 되돌릴 방법 없음.

   Groq에는 qwen3.6-27b가 남아 있지만 무료 토큰 한도가 빠듯해 학급 단위 사용에 부적합하다는
   판단으로 NVIDIA를 계속 쓰기로 했다(2026-07-28). */

/* 첫 글자까지 기다리는 한도. 앱은 30초지만 **여기서는 60초로 넉넉히 잡는다.**
   NVIDIA 무료 티어는 대기가 길어, 30초로 재면 품질이 좋은 모델이 '느리다'는 이유로
   측정도 되기 전에 떨어져 나간다(실제로 glm-5.2가 그렇게 탈락했다).
   속도는 탈락 조건이 아니라 **순위 요소(TTFT)**로만 쓰고, 품질을 먼저 가린다.
   앱의 30초는 그대로 둔다 — 선생님이 화면 앞에서 무한정 기다릴 수는 없기 때문이다. */
const FIRST_TOKEN_MS = 60000;

/* 시험 문항. must = 교정본에 반드시 있어야 할 것, forbid = 남아 있으면 안 되는 원래 오류.
   clean = 오류가 없는 기록(손대면 과교정). 본문은 엑셀에서 읽어 오므로 여기엔 채점표만 둔다. */
const SPEC = {
  5:  { kind:'맞춤법',
        must:['역할', '겪는', '드러냄'],
        forbid:['역활', '격는', '들어냄'] },
  6:  { kind:'맞춤법', key:'구지',              // ← 오안내를 가리는 문항
        must:['뛰어남', '굳이', '보여줌으로써'],
        forbid:['띄어남', '구지', '보여줌으로서'] },
  7:  { kind:'띄어쓰기', key:'띄어쓰기',        // ← 탈락을 가리는 문항
        must:['유명 정치인', '영어 연설문', '분석하며 수사학적', '기법과 대중을',
              '설득하는 언어적', '장치를 탐구함', '영자 신문', '기자가 되어',
              '주요 행사', '명확한 문체', '기사를 작성함', '뉴스 앵커',
              '역할을 맡아', '정확한 발음', '억양으로 뉴스', '전달하는 활동',
              '뛰어난 전달력', '몰입감을 보여줌'],
        forbid:['유명정치인', '영어연설문', '기자가되어', '뉴스앵커', '몰입감을보여줌'] },
  8:  { kind:'띄어쓰기',
        must:['미래 모빌리티', '자율주행 자동차', '기술 보고서', '핵심 기술',
              '원리를 요약', '급우들에게 설명함', '공학 분야', '영어 어휘',
              '활용하는 능력', '조별 프로젝트', '영어 설명서', '모형 자동차',
              '영어로 프레젠테이션', '영어 구사력'],
        forbid:['미래모빌리티', '자율주행자동차', '핵심기술', '조별프로젝트', '영어구사력'] },
  14: { kind:'정상', clean:true },
  15: { kind:'정상', clean:true },
};

/* ── 엑셀 읽기 (외부 라이브러리 없이) ───────────────────── */
async function readZip(ab){
  const dv = new DataView(ab), u8 = new Uint8Array(ab);
  let eocd = -1;
  for (let i = ab.byteLength - 22; i >= 0 && i > ab.byteLength - 65558; i--)
    if (dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
  if (eocd < 0) throw new Error('엑셀 구조를 읽지 못했습니다');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder(), out = {};
  for (let k = 0; k < count; k++){
    const nLen = dv.getUint16(p+28,true), eLen = dv.getUint16(p+30,true), cLen = dv.getUint16(p+32,true);
    const method = dv.getUint16(p+10,true), cSize = dv.getUint32(p+20,true), lho = dv.getUint32(p+42,true);
    const name = dec.decode(u8.slice(p+46, p+46+nLen));
    const lN = dv.getUint16(lho+26,true), lE = dv.getUint16(lho+28,true);
    const st = lho + 30 + lN + lE;
    out[name] = { method, data: u8.slice(st, st + cSize) };
    p += 46 + nLen + eLen + cLen;
  }
  return out;
}
async function entryText(e){
  if (!e) return '';
  if (e.method === 0) return new TextDecoder().decode(e.data);
  const s = new Blob([e.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new TextDecoder().decode(await new Response(s).arrayBuffer());
}
// 이 파일은 한글을 &#48264; 형태로 저장하고 <x:row>처럼 접두사를 붙인다 → 둘 다 되돌린다
const stripNs = s => s.replace(/<(\/?)[A-Za-z0-9]+:/g, '<$1');
const unesc = s => String(s)
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
  .replace(/&amp;/g,'&');

async function loadCases(){
  const file = path.join(__dirname, '..', '실제생기부X (테스트용).xlsx');
  const buf = fs.readFileSync(file);
  const z = await readZip(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));

  const shared = [];
  for (const m of stripNs(await entryText(z['xl/sharedStrings.xml'])).matchAll(/<si>([\s\S]*?)<\/si>/g))
    shared.push([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join(''));

  const sheet = stripNs(await entryText(z['xl/worksheets/sheet1.xml']));
  const colIdx = ref => { let n = 0; for (const ch of ref.replace(/\d/g,'')) n = n*26 + (ch.charCodeAt(0)-64); return n-1; };
  const rows = [];
  for (const rm of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)){
    const cells = [];
    for (const cm of rm[1].matchAll(/<c ([^>]*)>([\s\S]*?)<\/c>/g)){
      const r = (cm[1].match(/r="([A-Z]+\d+)"/) || [])[1] || 'A1';
      const t = (cm[1].match(/t="(\w+)"/) || [])[1];
      let v = '';
      if (t === 's') v = shared[+(cm[2].match(/<v>(\d+)<\/v>/) || [])[1]] ?? '';
      else if (t === 'inlineStr') v = [...cm[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('');
      else v = (cm[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1] ?? '';
      cells[colIdx(r)] = unesc(v);
    }
    if (cells.some(c => (c||'').trim())) rows.push(cells.map(c => c ?? ''));
  }
  // [번호, 이름, 진로, 과세특 내용, 오류/테스트 유형]
  const cases = [];
  for (const c of rows.slice(1)){
    const no = +c[0];
    if (!SPEC[no]) continue;
    cases.push({ no, name: c[1], text: c[3], label: c[4] || '(정상)', ...SPEC[no] });
  }
  /* 채점표 자가 검증 — must에 '원문에 이미 있는 말'이 섞이면 아무것도 안 고친 모델이
     점수를 얻는다(실제로 '수사학적 기법'을 넣었다가 그렇게 됐다).
     forbid에는 반대로 원문에 있어야 한다. 어긋나면 채점 자체가 틀린 것이므로 멈춘다. */
  for (const c of cases){
    const ghost = (c.must || []).filter(s => c.text.includes(s));
    if (ghost.length) throw new Error(`${c.no}번 채점표 오류 — 원문에 이미 있는 must: ${ghost.join(', ')}`);
    const absent = (c.forbid || []).filter(s => !c.text.includes(s));
    if (absent.length) throw new Error(`${c.no}번 채점표 오류 — 원문에 없는 forbid: ${absent.join(', ')}`);
  }
  return cases.sort((a, b) => a.no - b.no);
}

// 앱이 실제로 쓰는 시스템 프롬프트를 index.html에서 그대로 읽어 온다 — 벤치가 앱과 따로 놀지 않게
function appSystemPrompt(){
  const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const i = src.indexOf("const sys = '너는 학교생활기록부");
  if (i < 0) throw new Error('index.html에서 시스템 프롬프트를 찾지 못했습니다');
  const end = src.indexOf('\n  const raw', i);
  return new Function('return (' + src.slice(src.indexOf('=', i) + 1, end).trim().replace(/;$/, '') + ')')();
}

/* 한자·가나 감지. 범위를 글자 그대로 쓰지 않고 \u 이스케이프로 적는다 —
   호환한자 豈(U+F900)와 한자 豈(U+8C48)는 화면에서 똑같이 보여서, 글자로 적으면
   범위가 U+8C48부터 시작해 **한글 음절(U+AC00~)까지 통째로 삼킨다**(실제로 겪었다). */
const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/;
/* 생기부는 개조식·명사형 종결(~함/~임/~음)로 쓴다. 여기 걸리면 문체를 어긴 것.
   '~했습니다'는 '합니다'가 아니라 '습니다'로 끝나므로 어간이 아니라 어미로 잡아야 한다. */
const DECL = /(습니다|입니다|해요|어요|한다|이다|했다|였다|된다|보인다)[.!?]?\s*$/;
const stripThink = t => String(t).replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^[\s\S]*?<\/think>/, '').trim();

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 앱(aiChatOnce)과 똑같은 파라미터로 부른다 — 벤치에서 좋았던 설정이 앱에서 재현돼야 하므로.
   무료 한도(약 40 req/분)에 걸리면 잠시 쉬고 다시 부른다. 여기서 포기하면
   '느린 모델'이 아니라 '한도에 걸린 모델'이 탈락해 순위가 뒤집힌다. */
async function callModel(m, sys, user){
  const t0 = Date.now();
  let ttft = null, out = '', reason = '', finish = '';
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctl.abort(); }, FIRST_TOKEN_MS);
  const stopClock = () => clearTimeout(timer);

  let res;
  try {
    for (let attempt = 0; ; attempt++){
      res = await fetch(BASE + '/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + KEY },
        body: JSON.stringify({
          model: m.id, temperature: 0, top_p: 1, seed: 12345, max_tokens: 2048,
          messages:[{ role:'system', content: sys }, { role:'user', content: user }],
          ...m.extra, stream: true }),
        signal: ctl.signal,
      });
      if (res.status !== 429 || attempt >= 3) break;
      await sleep(5000 * (attempt + 1));
    }
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).slice(0, 120));
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '';
  for (;;){
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream:true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0){
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const d = line.slice(5).trim();
      if (d === '[DONE]'){ buf = ''; break; }
      let ev; try { ev = JSON.parse(d); } catch(_){ continue; }
      if (ev.error) throw new Error((ev.error.status || '') + ' ' + String(ev.error.message || '').slice(0, 120));
      const ch = ev.choices?.[0] || {};
      if (ch.finish_reason) finish = ch.finish_reason;
      /* 추론형 모델은 생각을 delta.reasoning(또는 reasoning_content)으로 따로 흘리고
         본문은 delta.content로 보낸다. 둘을 나눠 세어 두면, 본문이 비었을 때
         "생각만 하다 끝났는지"를 그 자리에서 구분할 수 있다. */
      reason += ch.delta?.reasoning || ch.delta?.reasoning_content || '';
      const piece = ch.delta?.content || '';
      if (piece && ttft === null){ ttft = Date.now() - t0; stopClock(); }  // 생성 시작 → 시계 끔
      out += piece;
    }
  }
  // 본문이 비면 왜 비었는지 남긴다 — 그러지 않으면 '0점'과 '호출 실패'가 구분되지 않는다
  if (!out.trim()){
    const why = reason.trim()
      ? `본문 없이 생각(reasoning)만 ${reason.length}자 출력` + (finish ? ` · finish=${finish}` : '')
      : `응답이 비어 있음${finish ? ` · finish=${finish}` : ''}`;
    return { ttft: Date.now() - t0, total: Date.now() - t0, raw:'', empty: why };
  }
  return { ttft: ttft ?? (Date.now() - t0), total: Date.now() - t0, raw: out };
  } catch (e){
    if (timedOut) throw new Error(`${FIRST_TOKEN_MS/1000}초 안에 응답을 시작하지 못함 (앱에서도 못 쓰는 속도)`);
    throw e;
  } finally { stopClock(); }
}

function judge(c, raw){
  /* want(분모)는 응답과 무관한 '이 문항의 만점'이므로 처음부터 채워 둔다.
     예전에는 JSON 파싱에 성공한 뒤에야 넣었는데, 파싱이 실패한 실행에서 want가 0이 되어
     분모가 실행마다 달라졌다 — 검출 27.0/24처럼 분자가 분모보다 큰 값이 나온 원인이다. */
  const r = { json:false, style:true, cjk:false, hit:0, want:(c.must || []).length,
              left:0, over:0, fixed:'' };
  const m = stripThink(raw).match(/\{[\s\S]*\}/);
  if (!m) return r;
  let o; try { o = JSON.parse(m[0]); } catch(_){ return r; }
  r.json = true;
  const fixed = typeof o.corrected === 'string' ? o.corrected : '';
  r.fixed = fixed;
  r.cjk = CJK.test(fixed);
  r.style = !DECL.test(fixed.trim());
  if (c.clean){
    // 고칠 것이 없는 기록 — 글자가 하나라도 달라지면 과교정
    if (fixed.replace(/\s+/g,' ').trim() !== c.text.replace(/\s+/g,' ').trim()) r.over++;
    return r;
  }
  for (const s of c.must || []) if (fixed.includes(s)) r.hit++;
  for (const s of c.forbid || []) if (fixed.includes(s)) r.left++;   // 안 고치고 남겨 둠
  return r;
}

/* 모델 하나를 전 문항에 걸쳐 재고 점수를 매긴다. 여러 모델이 동시에 이 함수를 돈다. */
async function runModel(m, sys, cases){
  const r = { model:m.id, ttft:[], json:0, style:0, cjk:0, hit:0, want:0, left:0, over:0,
              same:0, cases:0, spacingOk:false, gujiOk:false, err:null, detail:{} };
  const t0 = Date.now();
  try {
    for (const c of cases){
      const runs = [];
      for (let k = 0; k < REPEAT; k++){
        const { ttft, raw, empty } = await callModel(m, sys, c.text);
        r.ttft.push(ttft);
        runs.push(judge(c, raw));
        if (empty){ r.empty = (r.empty || 0) + 1; r.emptyWhy = empty; }
      }
      // 점수는 반복의 평균으로 — 한 번 잘 맞힌 것과 늘 잘 맞히는 것을 구분한다
      const avg = f => runs.reduce((s, x) => s + f(x), 0) / runs.length;
      r.json  += avg(x => x.json ? 1 : 0);
      r.style += avg(x => x.style ? 1 : 0);
      r.cjk   += avg(x => x.cjk ? 1 : 0);
      r.hit   += avg(x => x.hit);
      r.want  += runs[0].want;
      r.left  += avg(x => x.left);
      r.over  += avg(x => x.over);
      r.cases++;
      // 일관성: 반복 실행에서 교정본이 글자 하나까지 같았는가
      const identical = runs.every(x => x.fixed === runs[0].fixed);
      if (identical) r.same++;
      r.detail[c.no] = { hit:avg(x=>x.hit), want:runs[0].want, left:avg(x=>x.left),
                         over:avg(x=>x.over), identical, fixed:runs[0].fixed };
      // 선생님이 지정한 두 관문 — 반복 중 '항상' 통과해야 인정한다(운으로 한 번 맞힌 것 배제)
      if (c.key === '띄어쓰기')
        r.spacingOk = runs.every(x => x.want && x.hit / x.want >= 0.7);
      if (c.key === '구지')
        r.gujiOk = runs.every(x => x.fixed.includes('굳이') && !x.fixed.includes('구지'));
    }
    r.ttftMed = r.ttft.slice().sort((a,b)=>a-b)[Math.floor(r.ttft.length/2)];
    console.log(m.id.padEnd(34) + `TTFT ${r.ttftMed}ms · 검출 ${r.hit.toFixed(1)}/${r.want}` +
                ` · 일관 ${r.same}/${r.cases} · 과교정 ${r.over.toFixed(1)}` +
                (r.empty ? ` · 빈응답 ${r.empty}회` : '') +
                `  [띄어쓰기 ${r.spacingOk?'✓':'✗'} · 구지 ${r.gujiOk?'✓':'✗'}]` +
                `  (${Math.round((Date.now()-t0)/1000)}초)`);
  } catch (e){
    r.err = e.message;
    console.log(m.id.padEnd(34) + '✗ ' + e.message);
  }
  return r;
}

async function main(){
  if (!KEY.startsWith('nvapi-')){
    console.error('NVIDIA 키가 필요합니다.\n  NVAPI_KEY=nvapi-xxxx node mirror/test/model-bench.js');
    process.exit(1);
  }
  const sys = appSystemPrompt();
  const cases = await loadCases();
  console.log('시험지: 실제생기부X (테스트용).xlsx');
  cases.forEach(c => console.log(`  ${c.no}번 ${c.name} — ${c.label}`));
  console.log(`\n후보 모델 ${CANDIDATES.length}개\n`);

  /* 모델끼리는 동시에 돌린다 — 한 모델이 느려도 다른 모델을 기다리게 하지 않는다.
     한 모델 안에서는 순차로 부른다(동시에 부르면 서로 대기열에 끼어 TTFT가 왜곡된다).
     NVIDIA 무료 한도는 분당 40회쯤인데 이 방식은 분당 10회를 넘지 않아 여유가 있다.
     출력이 뒤섞이지 않도록 진행 표시는 각 모델이 끝났을 때 한 줄로 낸다. */
  console.log('모델별로 동시에 진행합니다. 끝나는 대로 한 줄씩 나옵니다.\n');
  const rows = await Promise.all(CANDIDATES.map(m => runModel(m, sys, cases)));

  const ok = rows.filter(x => !x.err);
  const N = cases.length;
  const pct = x => x.want ? x.hit / x.want : 0;
  console.log('\n' + '모델'.padEnd(34) + 'TTFT    JSON 문체 한자  검출률 일관성 과교정 띄어쓰기 구지');
  console.log('─'.repeat(98));
  for (const x of ok)
    console.log(x.model.padEnd(34) +
      String(x.ttftMed + 'ms').padEnd(8) +
      /* 소수 첫째 자리까지 보인다. 예전에는 반올림해서 5.67을 '6/6'으로 찍어 놓고
         아래 '제외' 줄에는 'JSON 형식 미준수'라고 적어, 표와 결론이 모순돼 보였다. */
      `${x.json.toFixed(1)}/${N}`.padEnd(7) + `${x.style.toFixed(1)}/${N}`.padEnd(7) +
      (x.cjk ? x.cjk.toFixed(1) + '건' : '없음').padEnd(6) +
      (Math.round(pct(x) * 100) + '%').padEnd(7) + `${x.same}/${x.cases}`.padEnd(7) +
      x.over.toFixed(1).padEnd(7) +
      (x.spacingOk ? '✓' : '✗').padEnd(9) + (x.gujiOk ? '✓' : '✗'));

  /* 순위 — 선생님이 정한 우선순위에 '일관성'을 얹었다.
     ① 띄어쓰기(7번)를 늘 고치는가   ② '구지'를 늘 바르게 고치는가
     ③ 검출률   ④ **일관성**(같은 기록에 같은 답)   ⑤ 과교정 적은 순   ⑥ TTFT
     일관성을 검출률 바로 뒤에 둔 것은, 조금 더 잡지만 실행마다 답이 달라지는 모델보다
     조금 덜 잡아도 늘 같은 답을 주는 모델이 검토·승인 작업에 낫기 때문이다. */
  const clean = ok.filter(x => x.json >= N - 0.01 && x.style >= N - 0.01 && x.cjk < 0.01);
  const pass = clean.filter(x => x.spacingOk).sort((a, b) =>
      (b.gujiOk - a.gujiOk) || (pct(b) - pct(a)) ||
      (b.same - a.same) || (a.over - b.over) || (a.ttftMed - b.ttftMed));

  console.log('\n권장 순서 (탈락: JSON·문체 미준수 · 한자 혼입 · 띄어쓰기 못 고침)');
  if (!pass.length) console.log('  ⚠ 관문을 통과한 모델이 없습니다. 후보를 늘려야 합니다.');
  pass.forEach((x, i) => console.log(`  ${i+1}. ${x.model}` +
    `  (검출 ${Math.round(pct(x)*100)}% · 일관 ${x.same}/${x.cases} · 과교정 ${x.over.toFixed(1)} · TTFT ${x.ttftMed}ms)`));
  const dropped = ok.filter(x => !pass.includes(x));
  if (dropped.length){
    console.log('\n제외');
    for (const x of dropped)
      console.log(`  · ${x.model} — ` +
        (x.json < N - 0.01 ? 'JSON 형식 미준수' : x.style < N - 0.01 ? '문체 위반'
          : x.cjk >= 0.01 ? '한자 혼입' : !x.spacingOk ? '띄어쓰기를 못 고침' : '기타'));
  }
  for (const x of rows.filter(y => y.err)) console.log(`  · ${x.model} — 호출 실패: ${x.err}`);
  console.log('\n이 순서를 index.html의 AI_CHAIN에 그대로 옮기면 된다.');

  fs.writeFileSync(path.join(__dirname, 'model-bench-result.json'),
    JSON.stringify({ at:new Date().toISOString(), cases:cases.map(c => ({ no:c.no, name:c.name, label:c.label })), rows }, null, 2));
  console.log('→ test/model-bench-result.json 에 저장했습니다.');
}

// 직접 실행할 때만 돈다. require로 불러 채점 로직만 따로 시험할 수 있게 열어 둔다.
if (require.main === module) main();
module.exports = { loadCases, judge, appSystemPrompt, CANDIDATES, SPEC };
