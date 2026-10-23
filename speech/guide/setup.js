// 초기 설정 따라 하기 · 장면 (실제 화면: img/setup, 위치: shots-setup.js)
window.GUIDE = (({ LOGO, gwin, lbl, dual }) => {
const DRAW = '그림으로 다시 그린 구글 화면이에요 · 실제 화면과 조금 다를 수 있어요';
const ART = {
  title: () => `<div class="A a-title">${LOGO.replace('<svg', '<svg class="pop"')}
    <p class="big pop" style="animation-delay:.15s">발표 레이스 <em>초기 설정</em>, 처음 한 번만 하면 돼요</p>
    <p class="sub pop" style="animation-delay:.3s">수업 전에 이 순서대로 준비해요</p>
    <div class="flow">${['🏫 새 반 만들기','👥 학생 명단','📋 설문지 사본','📮 QR 나누기','⏱ 발표 시간','📦 자료 등록'].map((t, i) => `${i ? `<b class="pop" style="animation-delay:${.5 + i * .35 - .15}s">›</b>` : ''}<span class="pop" style="animation-delay:${.5 + i * .35}s">${t}</span>`).join('')}</div></div>`,
  gcopy: () => `<div class="A">${gwin('docs.google.com/forms/d/…/copy', `<div class="gform-head"><span class="doc"></span>Google 설문지</div>
    <div class="gcard" style="left:250px;top:200px;width:560px;padding:34px 36px">
      <div style="font-size:26px;font-weight:700;margin-bottom:12px">사본을 만드시겠어요?</div>
      <div style="font-size:18px;color:#5F6368;line-height:1.6">'<b style="color:#202124">발표 자료 제출 (샘플)</b>'의 사본을<br>내 드라이브에 만들어요.</div>
      <div style="display:flex;justify-content:flex-end;margin-top:30px"><span class="gbtn" data-r="gcopyBtn">사본 만들기</span></div></div>`)}${lbl(DRAW)}</div>`,
  gedit: () => {
    const q = (sel, extra = '') => `<div class="gq" data-r="gQ" style="top:250px">
      <div class="qt">📎 발표 자료 파일 <span style="color:#D93025">*</span></div>
      <div class="sel" data-r="gSel">${sel}</div>${extra}</div>`;
    const head = `<div class="gform-head" style="background:#fff;color:#202124;border-bottom:1px solid #E0E0E0;justify-content:space-between"><span style="display:flex;gap:12px;align-items:center"><span class="doc" style="background:#673AB7"></span>발표 자료 제출 (샘플)의 사본</span><span style="display:flex;gap:10px"><span class="gbtn line">미리보기</span><span class="gbtn" data-r="gPublish">게시</span></span></div>`;
    const top = `<div class="gcard" data-r="gTitle" style="left:180px;top:140px;width:700px;border-top:10px solid #673AB7;padding:16px 26px"><div style="font-size:26px">발표 자료 제출</div><div class="gnote">파일 이름: 번호_이름_발표주제 · 마감: 10월 24일(금)</div></div>`;
    return `<div class="A">${gwin('docs.google.com/forms/d/…/edit', `<div style="position:absolute;inset:46px 0 0;background:#F0EBF8">${head}${top}
      <div class="fr on">${q('≡ 단답형', '<div class="gnote" style="margin-top:56px">이 질문을 파일 업로드로 바꿔 주세요. (이 안내 문구는 지워요)</div>')}</div>
      <div class="fr">${q('≡ 단답형', '<div class="gnote" style="margin-top:56px">이 질문을 파일 업로드로 바꿔 주세요. (이 안내 문구는 지워요)</div>')}<div class="gmenu" style="left:658px;top:310px">${['단답형','장문형','객관식 질문','체크박스','드롭다운'].map(x => `<div>${x}</div>`).join('')}<div class="hv" data-r="gUpload">⇪ 파일 업로드</div></div></div>
      <div class="fr">${q('⇪ 파일 업로드', '<div class="gnote" style="margin-top:56px">⬜ 특정 파일 형식만 허용 &nbsp; · &nbsp; 최대 파일 수 1 &nbsp; · &nbsp; 최대 파일 크기 <b>100MB</b></div>')}</div>
      <div class="fr">${q('⇪ 파일 업로드', '<div class="gnote" style="margin-top:56px">⬜ 특정 파일 형식만 허용 &nbsp; · &nbsp; 최대 파일 수 1 &nbsp; · &nbsp; 최대 파일 크기 <b>100MB</b></div>')}</div>
      </div>`)}${lbl(DRAW)}</div>`;
  },
  real1: () => `<div class="A a-real"><img src="img/setup/form-1.jpg" alt="구글 설문지 게시 양식 창" style="left:70px;top:130px;width:1140px;height:541px"><i data-r="r1manage" style="position:absolute;left:637px;top:350px;width:100px;height:65px"></i><span class="chipr">📸 실제 구글 설문지 화면</span></div>`,
  real2: () => `<div class="A a-real"><img src="img/setup/form-2.jpg" alt="응답자 보기를 링크가 있는 모든 사용자로 바꾸는 목록" style="left:240px;top:110px;width:800px;height:496px"><i data-r="r2any" style="position:absolute;left:493px;top:443px;width:320px;height:53px"></i><span class="chipr">📸 실제 구글 설문지 화면</span></div>`,
  glink: () => {
    const dlg = (url, on, copied) => `<div class="gcard" style="left:230px;top:170px;width:600px;padding:28px 30px">
      <div style="font-size:24px;font-weight:700;margin-bottom:18px">🔗 응답자 링크 복사</div>
      <div class="gfield" data-r="gUrl">${url}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:26px"><span class="gchk" data-r="gChk"><i class="${on ? 'on' : ''}">${on ? '✓' : ''}</i>URL 단축</span><span class="gbtn" data-r="gCopy">${copied ? '✓ 복사됨' : '복사'}</span></div></div>`;
    const LONGU = 'https://docs.google.com/forms/d/e/1FAIpQLSdk_qqfHq…/viewform?usp=…';
    const SHORTU = 'https://forms.gle/AbCd1234EfGh5678';
    return `<div class="A">${gwin('docs.google.com/forms/d/…/edit', `<div style="position:absolute;inset:46px 0 0;background:rgba(32,33,36,.45)">
      <div class="fr on">${dlg(LONGU, false)}</div><div class="fr">${dlg(SHORTU, true)}</div><div class="fr">${dlg(SHORTU, true, true)}</div></div>`)}${lbl(DRAW)}</div>`;
  },
  dist: () => `<div class="A">
    <div class="dcard pop" data-r="dist1" style="left:40px"><span class="no">1</span><h3>📺 TV에 띄우기</h3><p>교실 TV에 QR을 크게.<br>학생들이 자리에서 찍어요.</p>
      <div class="tv" style="position:relative;height:220px"><div class="scr" style="left:12px;top:0;width:302px;height:178px"><img src="img/setup/c4-tv.webp" alt=""></div><div class="leg" style="left:103px;top:178px"></div></div></div>
    <div class="dcard pop" data-r="dist2" style="left:455px;animation-delay:.35s"><span class="no">2</span><h3>🔗 링크 보내기</h3><p>[🔗 링크 복사] 뒤<br>클래스룸·메신저에 붙여 넣기</p>
      <div class="chat"><div class="bub">발표 자료는 여기로 내 주세요 📎<br><a>https://forms.gle/AbCd1234EfGh5678</a></div><div class="bub" style="align-self:flex-start;background:var(--soft);border-radius:16px 16px 16px 4px">마감: 10월 24일(금)까지 PDF로 제출</div></div></div>
    <div class="dcard pop" data-r="dist3" style="left:870px;animation-delay:.7s"><span class="no">3</span><h3>🖨 순서표에 함께</h3><p>순서표를 인쇄하면<br>오른쪽 위에 QR이 함께 나와요.</p>
      <div class="paper"><b style="font-size:15px">2학년 3반 발표 순서</b><span class="qr"></span><div class="ln" style="width:60%;margin-top:40px"></div>${'<div class="ln"></div>'.repeat(8)}</div></div></div>`,
  phone: () => `<div class="A">
    <div class="phone" style="left:200px;top:90px"><span class="notch"></span>
      <div class="pfr on" style="padding:0;background:#111"><div style="position:absolute;inset:0;background:url(img/setup/c4-tv.webp) no-repeat;background-size:2008px 1130px;background-position:-200px -150px;filter:brightness(.95)"></div><div style="position:absolute;left:46px;top:170px;width:184px;height:184px;border:4px solid #FFE07A;border-radius:18px"></div><div style="position:absolute;left:0;right:0;bottom:60px;text-align:center"><span style="padding:9px 16px;border-radius:99px;background:#FFE07A;font:700 16px var(--body)">🔗 forms.gle 열기</span></div></div>
      <div class="pfr" style="background:#F0EBF8"><div style="background:#fff;border-top:8px solid #673AB7;border-radius:10px;padding:14px"><b style="font-size:18px">발표 자료 제출</b><div style="font-size:12px;color:#5F6368;margin-top:4px">파일 이름: 번호_이름_발표주제</div></div>
        <div style="background:#fff;border-radius:10px;padding:14px;margin-top:10px;font-size:14px"><b>이름</b><div style="border-bottom:2px solid #673AB7;padding:6px 0;margin-top:4px">김민준</div></div>
        <div style="background:#fff;border-radius:10px;padding:14px;margin-top:10px;font-size:14px"><b>발표 주제</b><div style="border-bottom:2px solid #673AB7;padding:6px 0;margin-top:4px">기후변화와 탄소중립</div></div>
        <div style="background:#fff;border-radius:10px;padding:14px;margin-top:10px;font-size:14px"><b>📎 발표 자료 파일</b><div style="margin-top:10px;display:inline-block;padding:8px 14px;border:1.5px solid #DADCE0;border-radius:6px;color:#673AB7;font-weight:700">⇪ 파일 추가</div></div></div>
      <div class="pfr" style="background:#F0EBF8"><div style="background:#fff;border-top:8px solid #673AB7;border-radius:10px;padding:14px"><b style="font-size:18px">발표 자료 제출</b></div>
        <div style="background:#fff;border-radius:10px;padding:14px;margin-top:10px;font-size:14px"><b>📎 발표 자료 파일</b><div style="margin-top:10px;padding:10px;border:1.5px solid #DADCE0;border-radius:8px;font-size:13px">📕 <b>03_김민준_기후변화와 탄소중립.pdf</b></div></div>
        <div style="text-align:center;margin-top:30px"><span style="display:inline-block;padding:10px 26px;border-radius:8px;background:#673AB7;color:#fff;font-weight:700">제출</span></div>
        <div style="text-align:center;margin-top:24px;font:400 22px var(--display);color:#0E7A4F">✓ 제출했어요!</div></div>
    </div>
    <div style="position:absolute;left:580px;top:150px;width:600px">
      <p class="big pop" style="font-size:40px">학생은 이렇게 내요</p>
      <ol class="pop" style="animation-delay:.3s;font-size:23px;line-height:1.9;padding-left:30px;margin:14px 0 22px"><li>휴대폰 카메라로 QR 찍기</li><li>학교 구글 계정으로 로그인</li><li>이름 · 발표 주제 쓰고 파일 올리기</li></ol>
      <div class="pop" style="animation-delay:.6s;padding:18px 20px;border:var(--bw) solid var(--ink);border-radius:18px;background:var(--sun-s);box-shadow:0 4px 0 var(--ink)"><b style="font:400 24px var(--display)">📛 파일 이름 규칙</b><div style="margin-top:8px;font-size:22px"><code style="background:#fff;padding:4px 10px;border-radius:8px;border:2px solid var(--ink)">번호_이름_발표주제.pdf</code></div><div style="margin-top:10px;font-size:18px;color:var(--muted)">이름만 명단과 같으면 자동으로 그 학생에게 들어가요.<br>PPT는 PDF로 저장해서 내면 화면에 바로 보여요.</div></div></div></div>`,
  time: () => {
    const T = 112.5, p = s => (s / T * 100).toFixed(2);
    return `<div class="A a-time"><div class="clockbig" id="tClock">0:00</div><div class="st" id="tSt">최소 시간 전 · 아직 짧아요</div>
      <div class="bar"><i style="width:${p(60)}%;background:#D5DAE5"></i><i style="width:${p(15)}%;background:#7BE0B8"></i><i style="width:${p(15)}%;background:#FFC870"></i><i style="flex:1;background:#FF9DAE"></i></div>
      <span class="mark" id="tMark" style="left:140px"></span>
      ${[[0,'0:00',''],[60,'1:00','최소 시간'],[75,'1:15','15초 전'],[90,'1:30','최대 시간']].map(([s, t, d]) => `<span class="tick" style="left:${140 + s / T * 1000}px">${t}<small>${d}</small></span>`).join('')}
      ${[['회색','최소 시간 전','#7C879E',90],['초록','적정 시간','#0E9A6A',380],['주황','곧 끝나요','#D97706',670],['빨강','시간 초과','#D63655',960]].map(([n, d, c], i) => `<div class="zone pop" style="left:${140 + i * 255}px;animation-delay:${.3 + i * .25}s"><b style="color:${c}">${n}</b><span>${d}</span></div>`).join('')}
    </div>`;
  },
  dual: (a, b, ...r) => dual('setup', a, b, ...r),
  drive: () => {
    const rows = (sel) => `<h4>내 드라이브 › 발표 자료 제출 (응답)</h4>
      <div class="frow ${sel ? 'sel' : ''}" data-r="drvFolder"><span class="ic">📁</span>발표 자료 파일 (File responses)</div>
      <div class="frow"><span class="ic">📗</span>발표 자료 제출 (응답)</div>
      <div class="frow"><span class="ic">🟪</span>발표 자료 제출 (샘플)의 사본</div>`;
    const files = ['02_고은채_청소년 수면 시간과 학업 성취.pdf','05_김서진_플라스틱 없는 하루 실천기.pdf','06_남궁하린_케이팝 팬덤 문화의 두 얼굴.pdf','09_배준혁_전기차 배터리 재활용.pdf','11_송예담_인공지능 그림의 저작권.pdf','14_양시현_우리 동네 공원 지도 만들기.pdf','… 모두 10개'];
    return `<div class="A">${gwin('drive.google.com/drive/my-drive', `
      <div class="fr on"><div class="flist">${rows(false)}</div></div>
      <div class="fr"><div class="flist">${rows(true)}</div><div class="cmenu" style="left:420px;top:180px"><div>👁 미리보기</div><div>🔗 공유</div><div class="hv" data-r="drvDown">⬇ 다운로드</div><div>✏️ 이름 바꾸기</div><div>🗑 삭제</div></div></div>
      <div class="fr"><div class="flist">${rows(true)}</div><div class="dlchip" data-r="drvZip">🗜 발표 자료 파일-2026...zip<br><small style="opacity:.8">다운로드 완료</small></div></div>
      <div class="fr"><div class="flist"><h4>📂 다운로드 › 발표 자료 파일 (압축 푼 폴더)</h4>${files.map(f => `<div class="frow" style="height:46px"><span class="ic">📕</span>${f}</div>`).join('')}</div></div>`)}
      ${lbl('그림으로 다시 그린 드라이브 화면이에요 · zip 파일은 오른쪽 클릭 → [압축 풀기]로 풀어요')}</div>`;
  },
  end: () => `<div class="A a-end">
    <p class="big pop">초기 설정 <span style="color:var(--mint)">끝!</span> 이제 발표 수업을 시작해요</p>
    <div class="checks">${['새 반 만들기','학생 명단','설문지 사본','QR 나누기','발표 시간','자료 등록'].map((t, i) => `<span class="pop" style="animation-delay:${.25 + i * .18}s">${t}</span>`).join('')}</div>
    <div class="next pop" style="animation-delay:1.4s"><div><b>① 순서 정하기</b>레이스로 발표 순서를 뽑고 바로 발표를 시작해요.</div><div><b>🛠 수업 설정 <small style="font:700 14px var(--body)">선택</small></b>평가 · 화면 안내 · 과세특 등 필요한 것만 정해요.</div><div><b>💾 백업</b>기록은 이 컴퓨터 브라우저에만 있어요. 가끔 백업해 두세요.</div></div>
    <div class="acts pop" style="animation-delay:1.8s"><button type="button" data-act="restart">↺ 처음부터 다시 보기</button><button type="button" class="p" data-act="close">닫고 시작하기</button></div></div>`
};


/* ---------- 장면 목록 ---------- */
const CH = [
  { t:'시작', steps:[
    { art:'title', cap:'발표 수업을 시작하기 전에 <b>딱 한 번</b> 해 두는 준비예요. 반 만들기부터 자료 등록까지 실제 화면으로 차례대로 보여 드릴게요.', dur:8500 },
    { img:'intro', cur:'menu', click:true, hl:['menu'], cap:'맨 위 메뉴 맨 왼쪽의 <b>[⚙ 초기 설정]</b>을 누르면 이 화면이 열려요.' },
    { img:'intro', zoom:[0,70,1000,110], hl:['vs'], cap:'준비 순서는 제목 아래에 적혀 있어요. <b>반 만들기 → 학생 명단 → 자료 제출 링크 · 발표 시간 → 자료 미리 등록</b> 순서예요.' },
    { img:'intro', zoom:[0,60,700,110], hl:['guide','manual'], cur:'guide', cap:'이 안내는 언제든 <b>[🎬 초기 설정 따라 하기]</b>로 다시 볼 수 있고, 글로 된 설명은 <b>[📖 사용 설명서]</b>에 있어요.' }
  ]},
  { t:'새 반 만들기', steps:[
    { img:'c1-0', cur:'add', click:true, hl:['list','add'], cap:'처음에는 연습용 <b>예시 반</b>이 들어 있어요. 우리 반을 만들려면 왼쪽 <b>[＋ 새 반 만들기]</b>를 눌러요.' },
    { img:'c1-1', frames:['c1-1','c1-t0','c1-t1','c1-t2','c1-t3','c1-t4'], zoom:'box', cur:'name', click:true, hl:['name'], cap:'<b>반 이름</b>을 적어요. 2학년 3반, 2-5 국어처럼 알아보기 쉬운 이름이면 돼요.' },
    { img:'c1-2', zoom:'box', hl:['names','count'], cur:'names', cap:'엑셀 명렬표에서 <b>이름 칸을 복사해 아래 칸에 붙여 넣으면</b> 명단까지 한 번에 들어가요. 몇 명이 인식됐는지 바로 아래에 보여요. (명단은 나중에 넣어도 돼요)', dur:9000 },
    { img:'c1-2', zoom:'box', cur:'make', click:true, hl:['make'], cap:'<b>[만들기]</b>를 누르면 끝이에요.' },
    { img:'c1-3', hl:['item','sel'], cur:'sel', cap:'새 반이 목록에 생기고, 맨 위 <b>‘우리 반’</b>에도 바로 선택돼요. 반이 여러 개면 여기서 바꿔 가며 써요.' },
    { img:'c1-3', zoom:'rosterCard', hl:['roster'], cap:'붙여 넣은 학생 25명이 번호 순서대로 들어갔어요.' }
  ]},
  { t:'학생 명단', steps:[
    { img:'c2-0', zoom:'card', cur:'add', click:true, hl:['add'], cap:'전학생처럼 나중에 학생이 늘면 명단 오른쪽 위 <b>[＋ 학생 추가]</b>를 눌러요.' },
    { img:'c2-1', frames:['c2-1','c2-t0','c2-t1','c2-t2','c2-2'], frameMs:520, zoom:'box', cur:'inp', click:true, hl:['inp'], cap:'<b>‘한 명씩’</b>에서 이름을 쓰고 <b>Enter</b>를 누르면 바로 추가돼요. 이어서 다음 학생 이름을 쓰면 돼요.', dur:8000 },
    { img:'c2-3', zoom:'box', cur:'tabMany', click:true, hl:['ta','file'], cap:'여러 명이면 <b>‘여러 명 한꺼번에’</b>에 붙여 넣거나, <b>.txt · .csv 파일</b>을 불러와요.' },
    { img:'c2-3', zoom:'box', cur:'ok', click:true, hl:['ok'], cap:'<b>[추가하고 닫기]</b>를 눌러요.' },
    { img:'c2-4', zoom:'grid', hl:['lastEdit','lastDel'], cur:'lastEdit', cap:'이름 옆 <b>✏️</b>로 고치고, <b>✕</b>로 명단에서 빼요. 새로 넣은 학생은 맨 뒤에 붙어요.' },
    { img:'c2-4', zoom:'grid', hl:['sort'], cur:'sort', cap:'<b>[가나다순 정렬]</b>을 누르면 이름순으로 다시 정리돼요.' }
  ]},
  { t:'설문지 사본', steps:[
    { img:'c3-0', zoom:'card', cur:'copy', click:true, hl:['copy'], cap:'발표 자료는 <b>구글 설문지</b>로 받으면 편해요. 왼쪽 <b>[📄 설문지 사본 만들기]</b>를 누르면 미리 만들어 둔 샘플 설문지가 열려요.', dur:8500 },
    { art:'gcopy', cur:'gcopyBtn', click:true, hl:['gcopyBtn'], cap:'구글 화면에서 <b>[사본 만들기]</b>를 누르면 샘플이 선생님 드라이브에 복사돼요. 파일 이름 규칙 · 이름 · 주제 질문이 이미 들어 있어요.', dur:8500 },
    { art:'gedit', acts:[{ t:500, cur:'gSel' }, { t:1350, click:true, frame:1 }, { t:2300, cur:'gUpload' }, { t:3150, click:true, frame:2, hl:['gQ'] }, { t:5200, frame:3 }],
      cap:'사본에서 <b>‘📎 발표 자료 파일’</b> 질문의 유형을 <b>[파일 업로드]</b>로 바꾸고, 들어 있던 안내 문구는 지워요. 최대 파일 크기는 넉넉하게(100MB) 올려 두면 좋아요.', dur:9500 },
    { art:'gedit', startFrame:3, hl:['gTitle'], cur:'gTitle', acts:[{ t:3400, cur:'gPublish' }, { t:4300, click:true, hl:['gPublish'] }], cap:'제목과 마감일을 우리 반에 맞게 고친 뒤, 오른쪽 위 <b>[게시]</b>를 눌러요.', dur:7500 },
    { art:'real1', cur:'r1manage', click:true, hl:['r1manage'], cap:'게시 창이 열리면 <b>응답자</b> 옆 <b>[관리]</b>를 눌러요.' },
    { art:'real2', cur:'r2any', click:true, hl:['r2any'], cap:'응답자 보기를 <b>‘링크가 있는 모든 사용자’</b>로 바꾸고 [게시]해요. 학교 이름으로 <b>‘제한’</b>되어 있으면 학교 계정 학생만 낼 수 있어요.', dur:9000 },
    { art:'glink', acts:[{ t:300, hl:['gUrl'] }, { t:1600, cur:'gChk' }, { t:2500, click:true, frame:1, hl:['gUrl'] }, { t:4600, cur:'gCopy' }, { t:5500, click:true, frame:2 }],
      cap:'위쪽 🔗 버튼으로 응답자 링크를 복사해요. 이때 <b>[URL 단축]</b>을 꼭 체크하세요. 주소가 <b>forms.gle</b>로 짧아져서 QR이 훨씬 단순해져요.', dur:9500 },
    { img:'c3-help', zoom:'best', hl:['best'], cap:'이 순서는 앱의 <b>[만드는 방법]</b> 버튼에도 정리돼 있어서 언제든 다시 볼 수 있어요.' }
  ]},
  { t:'QR 만들고 나누기', steps:[
    { img:'c4-1', zoom:[330,240,620,260], cur:'url', click:true, hl:['url'], cap:'복사한 링크를 <b>‘제출 링크’</b> 칸에 붙여 넣어요.' },
    { img:'c4-1', zoom:[330,240,620,260], cur:'save', click:true, hl:['save'], cap:'<b>[저장]</b>을 눌러요.' },
    { img:'c4-2', zoom:[330,240,620,300], hl:['tip'], cur:'tip', cap:'단축하지 않은 <b>긴 주소</b>면 이렇게 알려 줘요. QR이 촘촘해져 잘 안 찍힐 수 있으니 <b>forms.gle 짧은 주소</b>로 바꿔 주세요.', dur:8500 },
    { img:'c4-3', zoom:[330,240,620,300], hl:['url','note'], cur:'note', cap:'짧은 주소로 바꾸고, <b>‘학생 안내 한 줄’</b>에 마감일 같은 안내를 적어 두면 QR 화면에 함께 나와요.' },
    { img:'c4-3', zoom:[330,240,620,300], cur:'save', click:true, hl:['save'], cap:'다시 <b>[저장]</b>을 눌러요.' },
    { img:'c4-4', zoom:[330,240,620,300], cur:'qr', click:true, hl:['qr'], cap:'이제 <b>[📮 QR 안내 화면 열기]</b>를 눌러요.' },
    { img:'c4-5', zoom:'box', hl:['qr'], cur:'qr', cap:'학생용 <b>QR 안내 화면</b>이에요. 가운데에 발표 레이스 마이크가 들어간 QR이 만들어져요.' },
    { img:'c4-5', zoom:'box', hl:['steps','rule'], cur:'rule', cap:'휴대폰으로 찍는 방법과 <b>파일 이름 규칙</b>, 선생님이 적은 안내가 함께 보여요.' },
    { img:'c4-5', zoom:'box', hl:['copy','tvb'], cur:'tvb', cap:'아래의 <b>[🔗 링크 복사]</b>와 <b>[📺 TV에 띄우기]</b>로 학생들에게 나눠 줘요.' },
    { art:'dist', acts:[{ t:600, hl:['dist1'] }, { t:3200, hl:['dist2'] }, { t:5800, hl:['dist3'] }],
      cap:'QR을 나누는 방법은 세 가지예요. <b>① TV에 띄우기</b>(먼저 ② 발표하기에서 [📺 TV 화면]을 열어 두세요) <b>② 링크를 클래스룸·메신저로 보내기</b> <b>③ 순서표를 인쇄하면 QR이 함께</b> 나와요.', dur:10500 },
    { art:'dual', artArgs:['c4-6','c4-tv','💻 노트북 · QR 안내 화면','📺 TV · 교실 전체가 보는 화면','[📺 TV에 띄우기]를 누르면','QR이 크게 떠요. 안내 창을 닫으면 원래대로'], hl:['tv'], cap:'<b>[📺 TV에 띄우기]</b>를 누르면 TV에 QR이 크게 떠요. QR 안내 창을 닫으면 TV는 원래 화면으로 돌아가요.' },
    { art:'phone', acts:[{ t:3200, frame:1 }, { t:6200, frame:2 }], phone:true, cap:'학생은 QR을 찍고 <b>학교 구글 계정</b>으로 로그인한 뒤, <b>번호_이름_발표주제</b> 규칙대로 이름을 바꾼 파일을 올려요. 이름만 맞으면 나중에 자동으로 그 학생에게 들어가요.', dur:10500 }
  ]},
  { t:'발표 시간', steps:[
    { img:'c5-0', zoom:'card', hl:['min','max'], cur:'min', cap:'발표 시간은 <b>반마다 따로</b> 정해요. 최소 시간과 최대 시간을 <b>초 단위</b>로 적어요. 60초 = 1분이에요.' },
    { img:'c5-1', zoom:[660,40,620,320], cur:'chip', click:true, hl:['min','max'], cap:'빠른 선택 버튼을 누르면 한 번에 채워져요. <b>[2:00 ~ 3:00]</b>을 누르면 120초 · 180초가 들어가요.' },
    { img:'c5-2', zoom:[660,40,620,320], cur:'chip', click:true, hl:['min','max'], cap:'오늘은 <b>[1:00 ~ 1:30]</b>으로 할게요. 1분 이상, 1분 30초 이하로 발표하면 ‘적정’이에요.' },
    { img:'c5-3', zoom:[660,40,620,320], cur:'save', click:true, hl:['save'], cap:'<b>[시간 저장]</b>을 누르면 다음에 시작하는 발표부터 이 시간이 쓰여요.' },
    { art:'time', run:'time', cap:'이 시간은 <b>‘이만큼 발표하면 알맞다’</b>는 기준이에요. 발표하는 동안 시계 색이 <b>회색 → 초록 → 주황 → 빨강</b>으로 바뀌어 소리 없이 알려 주고, 기록에도 적정 · 미달 · 초과로 남아요.', dur:12500 },
    { img:'c5-start', zoom:'box', hl:['time'], cur:'time', cap:'발표를 시작할 때도 시간이 보여요. 이 창에서는 확인만 하고, 바꾸려면 <b>⚙ 초기 설정 → 발표 시간</b>에서 바꿔요.' },
    { art:'dual', artArgs:['c5-s0','c5-tv0'], acts:[{ t:400, hl:['lap'] }, { t:3600, hl:['tv'] }], cap:'② 발표하기 화면은 <b>두 곳에 나뉘어</b> 보여요. <b>노트북</b>은 발표하는 학생이 이름을 확인하고 버튼을 누르는 화면, <b>TV</b>는 친구들이 보는 화면이에요.', dur:9500 },
    { art:'dual', artArgs:['c5-g','c5-tv1'], acts:[{ t:400, hl:['lap'] }, { t:3400, hl:['tv'] }], cap:'학생이 <b>[▶ 시작]</b>을 누르면 노트북에는 시계가 돌아가고, TV에는 <b>‘발표 중’과 경청 안내</b>가 크게 나와요. 최소 시간 전이라 시계는 회색이에요.', dur:9500 },
    { img:'c5-ok', zoom:[640,110,640,340], hl:['clock','status'], cap:'1분이 지나면 <b>초록</b> — 적정 구간이에요. 남은 시간도 함께 보여요.' },
    { img:'c5-warn', zoom:[640,110,640,340], hl:['clock','status'], cap:'끝나기 <b>15초 전</b>부터 <b>주황</b>으로 바뀌며 ‘곧 끝나요’를 알려 줘요. 몇 초 전에 바뀔지는 🛠 수업 설정에서 정해요.' },
    { img:'c5-over', zoom:[640,110,640,340], hl:['clock','status'], cap:'최대 시간을 넘기면 <b>빨강</b>, 몇 초 넘었는지 보여 줘요. 시계는 노트북에만 나와서 <b>TV를 보는 친구들은 시간에 신경 쓰지 않고</b> 발표에 집중해요.', dur:9000 }
  ]},
  { t:'자료 등록', steps:[
    { art:'drive', acts:[{ t:500, cur:'drvFolder', hl:['drvFolder'] }, { t:1500, frame:1, hl:['drvDown'] }, { t:2300, cur:'drvDown' }, { t:3200, click:true, frame:2, hl:['drvZip'] }, { t:6200, frame:3, hl:[] }],
      cap:'설문지로 받은 파일은 선생님 <b>구글 드라이브의 응답 폴더</b>에 모여요. 폴더를 오른쪽 클릭해 <b>[다운로드]</b>하면 zip으로 받아져요. <b>압축을 풀어</b> 주세요.', dur:10500 },
    { img:'c6-0', zoom:[300,300,980,200], cur:'pool', click:true, hl:['pool'], cap:'⚙ 초기 설정 맨 아래 <b>‘발표 자료 미리 등록’</b>에서 <b>[📎 자료 한꺼번에 등록]</b>을 눌러요.' },
    { img:'c6-1', zoom:'box', hl:['drop'], over:'fly', cap:'압축을 푼 <b>폴더를 이 칸에 통째로 끌어다 놓아요</b>. [📁 폴더 선택]이나 [📄 파일 선택]으로 골라도 돼요.', dur:8000 },
    { img:'c6-2', zoom:'res', hl:['res'], cap:'파일 이름 속 <b>학생 이름</b>을 찾아 자동으로 넣어 줘요. 파일 이름에 주제가 있으면 <b>발표 주제도 함께</b> 채워져요. (끝에 ‘- 이름’이 붙거나 ‘최종’이 붙어도 괜찮아요)', dur:9000 },
    { img:'c6-3', zoom:'stat', hl:['stat'], cur:'first', cap:'<b>‘자료 현황’</b>에서 누가 냈는지 한눈에 봐요. 초록은 자료 있음, 흰색은 아직 없음이에요.' },
    { img:'c6-3', zoom:'stat', cur:'first', click:true, hl:['first'], cap:'이름을 누르면 그 학생 자료를 보거나 고칠 수 있어요.' },
    { img:'c6-4', zoom:'box', hl:['mats','topic'], cap:'학생 한 명의 자료와 발표 주제를 확인하고, <b>[＋ 자료 추가] · [🔗 링크 추가]</b>로 직접 넣거나 ✕로 지울 수도 있어요.' },
    { img:'c6-5', zoom:[300,300,980,200], hl:['tag'], cap:'등록이 끝나면 <b>‘자료 10 / 28명 · 주제 10명’</b>처럼 표시돼요. 늦게 낸 학생 자료는 같은 방법으로 더 넣으면 돼요.' },
    { art:'dual', artArgs:['c6-s1','c6-tv1','💻 노트북 · 자료 + 타이머','📺 TV · 자료를 크게','PDF·이미지는 타이머 옆에 크게 보여요','◀ ▶ 버튼이나 방향키로 넘겨요'], acts:[{ t:400, hl:['lap'] }, { t:3400, hl:['tv'] }],
      cap:'미리 등록한 자료는 <b>[발표 시작]</b>을 누를 때 그 회차로 자동으로 옮겨 가요. 차례가 되면 노트북엔 자료와 타이머가, TV엔 자료가 크게 나오고, <b>[마침]을 누르면 다음 학생 자료가 저절로</b> 열려요.', dur:10500 }
  ]},
  { t:'준비 끝', steps:[
    { art:'end', cap:'초기 설정이 끝났어요! 이제 <b>① 순서 정하기</b>에서 레이스로 발표 순서를 뽑으면 돼요. 다시 보고 싶은 부분은 오른쪽 장면 목록이나 아래 슬라이드로 골라 보세요.', dur:14000, live:true }
  ]}
];
return { key:'setup', title:'초기 설정 <em>따라 하기</em>', sub:'실제 발표 레이스 화면으로 한 단계씩 보여 드려요', ART, CH };
})(window.G);
