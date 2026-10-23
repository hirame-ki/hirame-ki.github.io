// 수업 설정 따라 하기 · 장면 (실제 화면: img/conf, 위치: shots-conf.js)
window.GUIDE = (({ LOGO, dual }) => {
const OPT = [
  ['📝', '평가 기준표', '평가를 이 도구에서 하지 않으면 그대로 두셔도 돼요.', '기본 4항목 · 각 5점'],
  ['📺', '발표 화면 안내', '안 바꾸면 기본 경청 문구로 나와요.', '최대 시간 15초 전 주황'],
  ['🤖', '과세특 프롬프트', '과세특 초안을 여기서 안 만들면 건너뛰어요.', '과목·학년 비워 둠'],
  ['🔒', '음성 인식', '고르지 않으면 브라우저 음성 인식으로 기록해요.', '브라우저 음성 인식'],
  ['💾', '백업 · 복원', '컴퓨터를 바꾸거나 기록을 지우기 전에만.', '필요할 때만']
];
const ART = {
  opt: () => `<div class="A a-title" style="gap:18px">${LOGO.replace('<svg', '<svg class="pop" style="width:80px;height:80px"')}
    <p class="big pop" style="animation-delay:.15s">🛠 수업 설정은 <em>모두 선택</em>이에요</p>
    <p class="sub pop" style="animation-delay:.3s">하나도 안 해도 발표 수업은 그대로 진행돼요 · 필요한 것만 골라서 정해요</p>
    <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;max-width:1160px">${OPT.map(([i, n, d, def], k) => `<div class="pop" style="animation-delay:${.55 + k * .3}s;width:372px;padding:16px 14px;border:var(--bw) solid var(--ink);border-radius:18px;background:#fff;box-shadow:0 4px 0 var(--ink);text-align:left">
      <div style="font:400 27px/1.3 var(--display)">${i} ${n}</div>
      <div style="margin:6px 0 10px;font-size:18px;line-height:1.5;color:var(--muted)">${d}</div>
      <div style="font-size:17px;font-weight:700;padding:7px 12px;border-radius:10px;background:var(--sun-s)">안 하면 → ${def}</div></div>`).join('')}</div></div>`,
  dual: (a, b, ...r) => dual('conf', a, b, ...r),
  end: () => `<div class="A a-end">
    <p class="big pop">수업 설정은 <span style="color:var(--main)">필요할 때만</span> 열어 보세요</p>
    <div class="checks">${['평가 기준표 · 만점 자유','발표 화면 문구','과세특 프롬프트','음성 인식 방식','백업 · 복원','개인정보 안내'].map((t, i) => `<span class="pop" style="animation-delay:${.25 + i * .18}s">${t}</span>`).join('')}</div>
    <div class="next pop" style="animation-delay:1.4s"><div><b>📝 평가는</b>③ 기록 보기의 [📝 평가하기]에서 매겨요.</div><div><b>🤖 과세특은</b>③ 기록 보기의 [🤖 과세특 프롬프트]로 만들어요.</div><div><b>💾 백업은</b>컴퓨터를 바꾸거나 기록을 지우기 전에 꼭.</div></div>
    <div class="acts pop" style="animation-delay:1.8s"><button type="button" data-act="restart">↺ 처음부터 다시 보기</button><button type="button" class="p" data-act="close">닫기</button></div></div>`
};

const CH = [
  { t:'시작', steps:[
    { art:'opt', cap:'수업 설정에 있는 다섯 가지는 <b>모두 선택</b>이에요. 하나도 하지 않아도 발표 수업은 그대로 진행되고, 필요한 것만 골라서 정하면 돼요.', dur:12000 },
    { img:'k0', cur:'menu', click:true, hl:['menu'], cap:'맨 위 메뉴 맨 오른쪽 <b>[🛠 수업 설정]</b>을 눌러요. ‘선택’ 표시가 붙어 있어요.' },
    { img:'k0', zoom:[0,130,1000,90], hl:['opt','vs'], cap:'제목 옆에도 <b>선택</b>이라고 적혀 있어요. 여기서 정한 내용은 <b>모든 반에 함께</b> 쓰여요.' }
  ]},
  { t:'평가 기준표', steps:[
    { img:'r0', hl:['rows'], cap:'평가 항목과 만점을 정해요. 처음에는 <b>4개 항목, 각 5점</b>이 들어 있어요. 평가를 이 도구에서 하지 않으면 그대로 두셔도 돼요.' },
    { img:'r0', frames:['r0','r1-t0','r1-t1','r1-t2'], frameMs:600, zoom:[760,290,520,120], cur:'m1', click:true, hl:['m1'], cap:'만점은 칸에 <b>숫자를 직접</b> 적어요. 1점부터 100점까지 자유롭게 쓸 수 있어요. ‘내용 구성’을 <b>10점</b>으로 바꿔 볼게요.', dur:8000 },
    { img:'r2', zoom:[16,225,760,330], hl:['total','m1'], cap:'합계가 바로 바뀌어요. <b>20점 → 25점</b>.' },
    { img:'r2', zoom:[880,225,400,90], cur:[1150,240,94,31], click:true, hl:[[1150,240,94,31]], cap:'항목을 더 넣으려면 <b>[＋ 항목 추가]</b>를 눌러요.' },
    { img:'r3', frames:['r3','r3-t0','r3-t1','r3-t2'], frameMs:600, zoom:[36,470,760,130], cur:'n5', hl:['n5'], cap:'‘새 항목’이 기본 <b>5점</b>으로 생겨요. 이름을 <b>‘질의응답’</b>으로 바꿔요.', dur:7500 },
    { img:'r4-t0', frames:['r4-t0','r4-t1','r5'], frameMs:700, zoom:[760,470,520,130], cur:'m5', click:true, hl:['m5'], cap:'만점을 <b>20점</b>으로 적었어요. 이렇게 10점이 넘는 항목은 평가할 때 <b>점수를 직접 적는 칸</b>으로 나와요.', dur:8000 },
    { img:'r5', hl:['x5','reset'], cur:'x5', cap:'필요 없는 항목은 <b>✕</b>로 지워요(지우기 전에 한 번 더 물어봐요). 항목은 8개까지, <b>[기본 항목으로]</b>를 누르면 처음 4개로 돌아가요.', dur:8000 },
    { img:'e0', zoom:'head', cur:'score', click:true, hl:['score'], cap:'점수는 <b>③ 기록 보기</b>의 <b>[📝 평가하기]</b>에서 매겨요. 학생이 쓰는 발표 화면에는 평가 버튼이 없어요.' },
    { img:'e1', zoom:'box', hl:['text','rub'], cap:'왼쪽엔 <b>발표 내용(음성 인식)</b>, 오른쪽엔 <b>평가 기준표</b>가 있어서 읽으면서 채점해요. ◀ ▶로 학생을 넘겨요.' },
    { img:'e2', zoom:'box', cur:'b8', click:true, hl:['b8','sum'], cap:'10점 이하 항목은 <b>숫자 버튼</b>을 눌러요. 같은 숫자를 한 번 더 누르면 지워져요.' },
    { img:'e3', zoom:'box', cur:'num', click:true, hl:['num','sum'], cap:'만점이 10점보다 큰 항목은 칸에 <b>점수를 적어요</b>(0점부터 만점까지). 합계도 함께 바뀌어요.' },
    { img:'e4-t0', frames:['e4-t0','e4'], frameMs:900, zoom:[210,24,860,752], cur:'memo', hl:['memo'], cap:'<b>선생님 관찰 기록</b>도 여기서 남겨요. 과세특 프롬프트에서 <b>가장 중요한 근거</b>로 쓰여요.', dur:7500 }
  ]},
  { t:'발표 화면 안내', steps:[
    { img:'s0', zoom:[16,80,620,120], cur:'warn', click:true, hl:['warn','demo'], cap:'발표 시계가 <b>주황으로 바뀌는 때</b>를 골라요. 최대 시간 10 · 15 · 20 · 30 · 60초 전, 또는 쓰지 않음.' },
    { img:'s1', zoom:[16,80,620,120], hl:['warn'], cap:'<b>30초 전</b>으로 바꿨어요. 바꾸지 않으면 15초 전이에요.' },
    { img:'s1', zoom:[16,230,620,210], hl:['listen','tok'], cap:'자료 없이 발표할 때 화면에 크게 나오는 문구예요. <b>{이름}</b>, <b>{주제}</b> 자리는 그 학생의 이름과 주제로 바뀌어요. 중괄호 안은 고치지 마세요.', dur:8500 },
    { img:'s2', zoom:[16,236,620,510], cur:'ex', click:true, hl:['ex','lp'], cap:'<b>예시 버튼</b>을 누르면 문구가 바로 들어가고, 아래 <b>미리보기</b>로 확인해요. 주제가 없는 학생은 {주제}가 든 줄이 빠져요.', dur:8500 },
    { art:'dual', artArgs:['s3','s3tv','💻 노트북 · 발표 학생 화면','📺 TV · 친구들이 보는 화면','30초 전부터 시계가 주황','바꾼 문구가 크게 나와요'], acts:[{ t:400, hl:['lap'] }, { t:3400, hl:['tv'] }],
      cap:'실제 발표에서는 이렇게 보여요. 바꾼 문구가 노트북과 TV에 크게 뜨고, 끝나기 <b>30초 전</b>부터 시계가 주황이 돼요.', dur:9000 }
  ]},
  { t:'과세특 프롬프트', steps:[
    { img:'a0', zoom:[650,215,615,440], hl:['note'], cap:'과세특 프롬프트는 <b>발표 내용 · 관찰 기록 · 점수</b>를 담아 AI에게 줄 부탁 글을 만들어 줘요. 여기서 미리 정해 두는 건 선택이에요.', dur:8500 },
    { img:'a0', frames:['a0','a1-t0','a1-t1','a1-t2'], frameMs:550, zoom:[650,215,615,440], cur:'subj', click:true, hl:['subj'], cap:'<b>과목</b>을 적어요.' },
    { img:'a2', zoom:[650,215,615,440], cur:'grade', click:true, hl:['grade','len','anon'], cap:'<b>학교급 · 학년</b>을 고르고, <b>분량</b>(기본 500자)과 <b>학생 이름 빼기</b>(권장)를 확인해요.' },
    { img:'a3-t0', frames:['a3-t0','a3'], frameMs:900, zoom:[650,215,615,440], cur:'extra', click:true, hl:['extra'], cap:'성취기준처럼 꼭 넣고 싶은 요청이 있으면 <b>‘추가 요청’</b>에 적어요.' },
    { img:'a4', zoom:'head', cur:'ai', click:true, hl:['ai'], cap:'이제 <b>③ 기록 보기</b>에서 <b>[🤖 전체 과세특 프롬프트]</b>를 누르면,' },
    { img:'a5', zoom:'box', hl:['out'], cap:'정해 둔 <b>과목 · 학년 · 요청</b>이 프롬프트에 들어가 있어요. [📋 복사]해서 AI 대화창에 붙여 넣으면 돼요. AI 초안은 꼭 <b>사실을 확인하고 고쳐서</b> 써 주세요.', dur:9500 }
  ]},
  { t:'음성 인식', steps:[
    { img:'v0', zoom:[16,360,620,350], hl:['cloud'], cap:'발표하는 동안 말소리를 글자로 바꾸는 방법이에요. 기본은 <b>브라우저 음성 인식</b> — 가장 정확하지만, 말소리가 구글 · 마이크로소프트 서버를 거쳐요.', dur:9000 },
    { img:'v1', zoom:[16,360,620,350], cur:'local', click:true, hl:['local'], cap:'<b>‘기기 안에서만 인식’</b>은 소리가 이 컴퓨터 밖으로 나가지 않아요. 최신 Chrome에서 한국어 모델을 한 번 내려받아야 해요.', dur:8500 },
    { img:'v2', zoom:[16,360,620,350], cur:'off', click:true, hl:['off'], cap:'<b>‘음성 인식 끄기’</b>를 고르면 발표 시간만 기록하고 마이크를 쓰지 않아요.' },
    { img:'v2', zoom:[16,360,620,350], cur:'priv', click:true, hl:['priv'], cap:'<b>[개인정보·보안 안내 전체 보기]</b>를 누르면,' },
    { img:'v3', zoom:'box', hl:['box'], spot:false, cap:'무엇이 어디에 저장되는지 자세히 볼 수 있어요. 명단과 기록은 <b>이 컴퓨터 브라우저에만</b> 저장되고, 서버로 보내지 않아요.', dur:8500 }
  ]},
  { t:'백업 · 복원', steps:[
    { img:'b0', zoom:[650,380,620,140], hl:['bak','inc'], cur:'bak', cap:'기록은 이 컴퓨터 브라우저에만 있어요. <b>[⬇ 백업 파일 저장]</b>으로 파일을 만들어 두세요. ‘발표 자료 파일도 함께 담기’를 켜면 자료까지 담겨요.', dur:9000 },
    { img:'b1', zoom:[650,380,620,140], cur:'bak', click:true, hl:['bak'], cap:'백업 파일(.json)이 내려받아져요. <b>학생 정보가 들어 있으니</b> 안전한 곳에 보관해요.' },
    { img:'b1', zoom:[650,380,620,140], cur:'res', click:true, hl:['res'], cap:'다른 컴퓨터에서는 <b>[⬆ 백업 불러오기]</b>를 눌러 그 파일을 골라요.' },
    { img:'b2', zoom:'box', hl:['box'], spot:false, cur:'ok', cap:'불러오면 지금 브라우저의 기록이 <b>백업 내용으로 바뀌어요</b>. 확인 창을 잘 읽고 [불러오기]를 눌러요.' },
    { img:'b3', zoom:'box', hl:['box'], spot:false, cap:'여러 선생님이 함께 쓰는 컴퓨터라면 수업 뒤 백업하고 <b>[이 브라우저의 모든 데이터 지우기]</b>를 눌러요. 지운 내용은 되돌릴 수 없어요.', dur:8500 }
  ]},
  { t:'정리', steps:[
    { art:'end', cap:'수업 설정은 <b>필요할 때만</b> 열어서 정하면 돼요. 다시 보고 싶은 부분은 오른쪽 장면 목록이나 아래 슬라이드로 골라 보세요.', dur:13000, live:true }
  ]}
];
return { key:'conf', title:'수업 설정 <em>따라 하기</em>', sub:'모두 선택이에요 · 필요한 것만 실제 화면으로 골라 보세요', ART, CH };
})(window.G);
