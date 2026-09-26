/* ==========================================================
   03 모둠·점수 / 04 교실 분위기 / 05 나눔
   Copyright (c) 2026 황성재 (@hirame.ki). All rights reserved.
   상업적 이용·개작·무단 재배포 금지 — LICENSE 참고
   ========================================================== */
(function () {
  'use strict';
  const { ico, audio, roster, store, $, $$, esc, shuffle, register, PALETTE, uid } = SD;

  /* ---------------- 모둠 편성 ---------------- */
  register({
    id: 'groups', group: 'team', name: '모둠 편성', icon: 'groups',
    desc: '모둠 수나 인원을 정하면 고르게 섞어서 나눠요.',
    mount(el) {
      el.innerHTML = `
        <div class="t top">
          <div class="row">
            <div class="pills mode"><button class="pill on" data-m="count">모둠 수로</button><button class="pill" data-m="size">모둠 인원으로</button></div>
            <div class="stepper"><button data-d="-1">−</button><input type="number" class="num" min="1" max="30" value="${store.get('groups.n', 4)}"><span class="unit">모둠</span><button data-d="1">+</button></div>
            <button class="btn t-btn go">${ico('shuffle')}편성하기</button>
            <button class="btn btn-soft to-score" hidden>${ico('trophy')}점수판으로</button>
          </div>
          <div class="next-step" hidden>
            <span class="ns-msg">${ico('roles')}이 모둠 그대로 <b>역할</b>도 나눠 볼까요?</span>
            <button class="btn btn-brand btn-sm ns-go">역할 나누기 열기</button>
            <button class="icon-btn ns-no" type="button" aria-label="닫기">${ico('x')}</button>
          </div>
          <div class="group-grid"></div>
        </div>`;
      const num = $('.num', el), unit = $('.unit', el), grid = $('.group-grid', el), toScore = $('.to-score', el);
      const nextStep = $('.next-step', el);
      let mode = 'count', last = null;
      const rolesOpen = () => !!document.querySelector('.pane[data-id="roles"]');
      $$('.mode .pill', el).forEach(p => p.onclick = () => { mode = p.dataset.m; $$('.mode .pill', el).forEach(x => x.classList.toggle('on', x === p)); unit.textContent = mode === 'count' ? '모둠' : '명씩'; });
      $$('.stepper button', el).forEach(b => b.onclick = () => { num.value = Math.max(1, (+num.value || 1) + +b.dataset.d); });
      $('.go', el).onclick = () => {
        const s = shuffle(roster.students());
        if (s.length < 2) { grid.innerHTML = `<div class="empty">${ico('users')}<div>학생이 2명 이상 있어야 나눌 수 있어요.</div></div>`; return; }
        const n = Math.max(1, +num.value || 1); store.set('groups.n', n);
        const k = Math.min(s.length, mode === 'count' ? n : Math.ceil(s.length / n));
        const g = Array.from({ length: k }, () => []); s.forEach((x, i) => g[i % k].push(x));
        last = g;
        grid.innerHTML = g.map((m, i) => `<div class="group-card" style="--gc:${PALETTE[i % PALETTE.length]};animation-delay:${i * 70}ms"><h4>${i + 1}모둠<span>${m.length}명</span></h4><ul>${m.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('');
        toScore.hidden = false; audio.chime('pop');
        /* 편성 결과를 내보내요 — 역할 나누기가 이 모둠을 그대로 이어받아요 */
        store.set('team.groups', g);
        document.dispatchEvent(new CustomEvent('sd:groups'));
        /* 역할 나누기가 이미 옆에 떠 있으면 저절로 따라오니, 없을 때만 물어봐요 */
        nextStep.hidden = rolesOpen();
        if (rolesOpen()) SD.toast('역할 나누기도 이 모둠으로 맞췄어요');
      };
      $('.ns-go', el).onclick = () => {
        nextStep.hidden = true;
        document.dispatchEvent(new CustomEvent('sd:open-tool', { detail: 'roles' }));
      };
      $('.ns-no', el).onclick = () => { nextStep.hidden = true; };
      toScore.onclick = () => {
        if (!last) return;
        store.set('score.teams', last.map((_, i) => ({ id: uid(), name: `${i + 1}모둠`, score: 0 })));
        document.dispatchEvent(new CustomEvent('sd:scores'));
        SD.toast(`점수판에 ${last.length}개 모둠을 만들었어요`);
      };
      return {};
    },
  });

  /* ---------------- 점수판 ---------------- */
  register({
    id: 'scoreboard', group: 'team', name: '점수판', icon: 'trophy',
    desc: '모둠·팀 점수를 크게 띄우고 누르면 바로 올라가요.',
    mount(el) {
      el.innerHTML = `
        <div class="t top">
          <div class="score-add"><input class="input" placeholder="팀 이름 (예: 해바라기 모둠)" maxlength="16"><button class="btn t-btn add">${ico('plus')}추가</button></div>
          <div class="teams"></div>
          <div class="score-foot">
            <span class="label-sm muted">팀을 누르고 빠르게 더하기</span>
            <div class="pills quick">${[1, 2, 5, 10].map(v => `<button class="pill" data-v="${v}">+${v}</button>`).join('')}</div>
            <button class="btn btn-ghost btn-sm preset">${ico('groups')}4모둠 만들기</button>
            <button class="btn btn-ghost btn-sm zero">${ico('reset')}점수 0으로</button>
          </div>
        </div>`;
      const box = $('.teams', el), input = $('.input', el);
      let teams = store.get('score.teams', null) || [1, 2, 3, 4].map(i => ({ id: uid(), name: `${i}모둠`, score: 0 }));
      let sel = null, bumpId = null;
      const save = () => store.set('score.teams', teams);
      function render() {
        const order = [...teams].sort((a, b) => b.score - a.score);
        const rank = (t) => order.findIndex(x => x.score === t.score) + 1;
        const top = order[0]?.score;
        box.innerHTML = teams.map((t, i) => {
          const r = rank(t), lead = t.score === top && t.score > 0, any = teams.some(x => x.score !== 0);
          return `<div class="team ${sel === t.id ? 'sel' : ''}" data-id="${t.id}" style="--tc:${PALETTE[i % PALETTE.length]}">
            <div class="team-top"><span class="team-rank ${lead ? 'r1' : ''}">${lead ? ico('crown') : ''}${any ? r + '위' : ''}</span><button class="team-del" title="삭제">${ico('x')}</button></div>
            <div class="team-name" contenteditable="true" spellcheck="false">${esc(t.name)}</div>
            <div class="team-score ${bumpId === t.id ? 'bump' : ''}">${t.score}</div>
            <div class="team-ctrl"><button class="minus">−</button><button class="plus">+</button></div>
          </div>`;
        }).join('') || `<div class="empty">${ico('trophy')}<div>위에서 팀을 추가해 주세요.</div></div>`;
        bumpId = null;
      }
      const add = (id, v) => { const t = teams.find(x => x.id === id); if (!t) return; t.score += v; bumpId = id; save(); render(); if (v > 0) audio.chime(v >= 5 ? 'pop' : 'tick'); };
      box.addEventListener('click', (e) => {
        const card = e.target.closest('.team'); if (!card) return; const id = card.dataset.id;
        if (e.target.closest('.plus')) return add(id, 1);
        if (e.target.closest('.minus')) return add(id, -1);
        if (e.target.closest('.team-del')) { teams = teams.filter(t => t.id !== id); if (sel === id) sel = null; save(); return render(); }
        if (e.target.closest('.team-name')) return;
        sel = sel === id ? null : id; render();
      });
      box.addEventListener('focusout', (e) => {
        if (!e.target.classList.contains('team-name')) return;
        const t = teams.find(x => x.id === e.target.closest('.team').dataset.id); const v = e.target.textContent.trim();
        if (t && v) { t.name = v.slice(0, 16); save(); }
        render();
      });
      box.addEventListener('keydown', (e) => { if (e.target.classList.contains('team-name') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
      $$('.quick .pill', el).forEach(p => p.onclick = () => { if (!sel) { SD.toast('먼저 점수를 줄 팀을 눌러 주세요'); return; } add(sel, +p.dataset.v); });
      const addTeam = () => { const v = input.value.trim(); if (!v) return; teams.push({ id: uid(), name: v.slice(0, 16), score: 0 }); input.value = ''; save(); render(); };
      $('.add', el).onclick = addTeam; input.onkeydown = (e) => { if (e.key === 'Enter') addTeam(); };
      $('.zero', el).onclick = () => { if (!confirm('모든 팀의 점수를 0으로 되돌릴까요?')) return; teams.forEach(t => t.score = 0); save(); render(); };
      $('.preset', el).onclick = () => { if (teams.length && !confirm('지금 팀을 지우고 1~4모둠으로 새로 만들까요?')) return; teams = [1, 2, 3, 4].map(i => ({ id: uid(), name: `${i}모둠`, score: 0 })); sel = null; save(); render(); };
      const onExternal = () => { teams = store.get('score.teams', teams); sel = null; render(); };
      document.addEventListener('sd:scores', onExternal);
      render();
      return { destroy() { document.removeEventListener('sd:scores', onExternal); } };
    },
  });

  /* ---------------- 소음 측정 ---------------- */
  const FACES = {
    good: '<circle cx="50" cy="50" r="46" fill="#fff"/><circle cx="35" cy="42" r="5" fill="#1E2330"/><circle cx="65" cy="42" r="5" fill="#1E2330"/><path d="M32 60q18 16 36 0" stroke="#1E2330" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="26" cy="58" r="6" fill="#FFB9A6" opacity=".7"/><circle cx="74" cy="58" r="6" fill="#FFB9A6" opacity=".7"/>',
    mid: '<circle cx="50" cy="50" r="46" fill="#fff"/><circle cx="35" cy="42" r="5" fill="#1E2330"/><circle cx="65" cy="42" r="5" fill="#1E2330"/><path d="M34 64h32" stroke="#1E2330" stroke-width="5" stroke-linecap="round"/>',
    loud: '<circle cx="50" cy="50" r="46" fill="#fff"/><path d="M28 36l12 6M72 36l-12 6" stroke="#1E2330" stroke-width="5" stroke-linecap="round"/><circle cx="35" cy="47" r="4.5" fill="#1E2330"/><circle cx="65" cy="47" r="4.5" fill="#1E2330"/><ellipse cx="50" cy="67" rx="9" ry="7" fill="#1E2330"/>',
  };
  register({
    id: 'noise', group: 'mood', name: '소음 측정', icon: 'gauge',
    desc: '마이크로 교실 목소리 크기를 표정으로 보여줘요.',
    mount(el) {
      el.innerHTML = `
        <div class="t">
          <div class="meter">
            <div class="face"><svg viewBox="0 0 100 100">${FACES.good}</svg></div>
            <div class="meter-side">
              <div class="meter-state">준비됐어요</div>
              <div class="meter-bar"><div class="fill"></div><div class="limit"></div></div>
              <label class="label-sm">허용 크기 <b class="lv">${store.get('noise.limit', 60)}</b></label>
              <input type="range" class="range" min="20" max="95" value="${store.get('noise.limit', 60)}">
              <button class="btn t-btn go">${ico('mic')}측정 시작</button>
            </div>
          </div>
          <div class="hint">마이크 권한을 허용해야 작동해요. 소리는 기록되거나 전송되지 않아요.</div>
        </div>`;
      const face = $('.face', el), svg = $('.face svg', el), state = $('.meter-state', el), fill = $('.fill', el), limitEl = $('.limit', el), range = $('.range', el), go = $('.go', el), lv = $('.lv', el);
      let stream = null, ctx = null, an = null, raf = 0, smooth = 0, mood = '', loudSince = 0;
      const place = () => { limitEl.style.left = `calc(${range.value}% - 1.5px)`; lv.textContent = range.value; };
      range.oninput = () => { place(); store.set('noise.limit', +range.value); };
      place(); SD.initRanges(el);
      function setMood(m) {
        if (m === mood) return; mood = m;
        const map = { good: ['var(--team-soft)', 'var(--team)', '아주 좋아요'], mid: ['#FFF6DE', '#E0A21C', '조금 커요'], loud: ['#FDECEA', 'var(--danger)', '목소리를 줄여요'] };
        const [bg, fg, txt] = map[m]; face.style.setProperty('--fc', bg); face.style.setProperty('--fs', fg); state.style.setProperty('--fs', fg); state.textContent = txt; svg.innerHTML = FACES[m];
      }
      function tick() {
        const d = new Uint8Array(an.fftSize); an.getByteTimeDomainData(d);
        let s = 0; for (let i = 0; i < d.length; i++) { const v = (d[i] - 128) / 128; s += v * v; }
        const lvl = Math.min(100, Math.sqrt(s / d.length) * 320); smooth = smooth * .82 + lvl * .18;
        fill.style.width = smooth + '%'; face.style.setProperty('--pulse', 1 + smooth / 400);
        const lim = +range.value;
        if (smooth > lim) { if (!loudSince) loudSince = performance.now(); if (performance.now() - loudSince > 600) setMood('loud'); }
        else { loudSince = 0; setMood(smooth > lim * .7 ? 'mid' : 'good'); }
        raf = requestAnimationFrame(tick);
      }
      function stop() {
        cancelAnimationFrame(raf); raf = 0;
        if (stream) stream.getTracks().forEach(t => t.stop()); stream = null;
        if (ctx) ctx.close(); ctx = null;
        go.innerHTML = `${ico('mic')}측정 시작`; fill.style.width = '0%'; mood = ''; setMood('good'); state.textContent = '준비됐어요';
      }
      go.onclick = async () => {
        if (stream) return stop();
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
          ctx = new (window.AudioContext || window.webkitAudioContext)(); an = ctx.createAnalyser(); an.fftSize = 1024;
          ctx.createMediaStreamSource(stream).connect(an); go.innerHTML = `${ico('pause')}측정 멈춤`; tick();
        } catch (e) { stream = null; state.textContent = '마이크를 쓸 수 없어요'; SD.toast('브라우저에서 마이크 권한을 허용해 주세요'); }
      };
      return { destroy: stop };
    },
  });

  /* ---------------- 집중 소리 ---------------- */
  let noise = null; // { type, src, gain } — 한 곳에서만 재생
  const bufCache = {};
  function makeBuf(c, type) {
    if (bufCache[type]) return bufCache[type];
    const len = c.sampleRate * 4, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    if (type === 'white') for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * .5;
    else if (type === 'pink') { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } }
    else { let l = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; l = (l + .02 * w) / 1.02; d[i] = l * 3.5; } }
    /* 이음새가 튀지 않도록 끝을 부드럽게 */
    const f = 2000; for (let i = 0; i < f; i++) { const k = i / f; d[len - f + i] = d[len - f + i] * (1 - k) + d[i] * k; }
    return (bufCache[type] = b);
  }
  register({
    id: 'sounds', group: 'mood', name: '집중 소리', icon: 'headphones',
    desc: '화이트·핑크·브라운 노이즈로 차분한 분위기를 만들어요.',
    mount(el) {
      const S = [['white', '화이트', '쉬— 고른 소리', '#9AA6B8'], ['pink', '핑크', '빗소리처럼 잔잔', '#F48FB1'], ['brown', '브라운', '낮고 포근한 소리', '#B08968']];
      el.innerHTML = `
        <div class="t">
          <div class="sounds">${S.map(([k, n, d, c]) => `<button class="sound" data-k="${k}" style="--sc:${c}"><div class="wave">${'<i></i>'.repeat(7)}</div><b>${n} 노이즈</b><span>${d}</span></button>`).join('')}</div>
          <div class="volume">${ico('volLo')}<input type="range" min="0" max="1" step=".01" value="${store.get('sound.vol', .35)}">${ico('volHi')}</div>
          <div class="hint">한 번 누르면 재생, 다시 누르면 멈춰요.</div>
        </div>`;
      const vol = $('input', el); SD.initRanges(el);
      const sync = () => $$('.sound', el).forEach(b => b.classList.toggle('on', noise?.type === b.dataset.k));
      const stopNoise = () => { if (noise) { const n = noise; n.gain.gain.setTargetAtTime(0, n.gain.context.currentTime, .15); setTimeout(() => { try { n.src.stop(); } catch (e) {} }, 500); noise = null; } document.dispatchEvent(new Event('sd:noise')); };
      $$('.sound', el).forEach(b => b.onclick = () => {
        const k = b.dataset.k, was = noise?.type; stopNoise(); if (was === k) return;
        const c = audio.ctx(), src = c.createBufferSource(), g = c.createGain();
        src.buffer = makeBuf(c, k); src.loop = true; g.gain.value = 0; g.gain.setTargetAtTime(+vol.value, c.currentTime, .3);
        src.connect(g); g.connect(c.destination); src.start(); noise = { type: k, src, gain: g };
        document.dispatchEvent(new Event('sd:noise'));
      });
      vol.oninput = () => { store.set('sound.vol', +vol.value); if (noise) noise.gain.gain.setTargetAtTime(+vol.value, noise.gain.context.currentTime, .05); };
      document.addEventListener('sd:noise', sync); sync();
      return { destroy() { document.removeEventListener('sd:noise', sync); stopNoise(); } };
    },
  });

  /* ---------------- QR 코드 ---------------- */
  register({
    id: 'qr', group: 'share', name: 'QR 코드', icon: 'qr',
    desc: '주소를 QR로 크게 띄워 아이들 기기로 바로 연결해요.',
    mount(el) {
      el.innerHTML = `
        <div class="t">
          <div class="qr-row"><input class="input" placeholder="주소나 문장을 붙여 넣으세요 (예: 패들렛, 구글 설문)"><button class="btn t-btn gen">만들기</button></div>
          <div class="qr-box"><div class="empty">${ico('qr')}<div>여기에 QR 코드가 크게 나타나요</div></div></div>
          <div class="qr-text"></div>
          <button class="btn btn-soft btn-sm dl" hidden>${ico('download')}이미지로 저장</button>
        </div>`;
      const input = $('.input', el), box = $('.qr-box', el), txt = $('.qr-text', el), dl = $('.dl', el);
      function gen() {
        const v = input.value.trim(); if (!v) return;
        if (typeof QRCode === 'undefined') { SD.toast('QR 모듈을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'); return; }
        box.innerHTML = ''; store.set('qr.last', v);
        try { new QRCode(box, { text: v, width: 512, height: 512, colorDark: '#1E2330', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); txt.textContent = v; dl.hidden = false; }
        catch (e) { box.innerHTML = `<div class="empty">내용이 너무 길어요. 조금 줄여 주세요.</div>`; dl.hidden = true; }
      }
      $('.gen', el).onclick = gen; input.onkeydown = (e) => { if (e.key === 'Enter') gen(); };
      dl.onclick = () => { const c = $('canvas', box); const a = document.createElement('a'); a.download = 'qrcode.png'; a.href = c ? c.toDataURL('image/png') : $('img', box).src; a.click(); };
      const lastV = store.get('qr.last', ''); if (lastV) { input.value = lastV; setTimeout(gen, 0); }
      return {};
    },
  });

  /* ---------------- 역할 나누기 ---------------- */
  register({
    id: 'roles', group: 'team', name: '역할 나누기', icon: 'roles',
    desc: '모둠장·기록이처럼 정해 둔 역할을 고르게 배정해요.',
    mount(el) {
      el.innerHTML = `
        <div class="t top roles">
          <div class="row">
            <div class="pills mode">
              <button class="pill" data-m="link">편성된 모둠 그대로</button>
              <button class="pill" data-m="group">새로 섞어서</button>
              <button class="pill" data-m="all">반 전체에</button>
            </div>
            <div class="stepper g-box"><button data-d="-1">−</button><input type="number" class="gn" min="1" max="12" value="4"><span class="unit">모둠</span><button data-d="1">+</button></div>
            <button class="btn t-btn go">${ico('shuffle')}역할 나누기</button>
          </div>
          <div class="link-note" hidden></div>
          <div class="roles-body">
            <div class="roles-input"><label class="field-label">역할 · 한 줄에 하나</label><textarea class="textarea rl" placeholder="모둠장&#10;기록이&#10;발표이&#10;지킴이"></textarea></div>
            <div class="roles-out"><div class="empty">${ico('roles')}<div>역할을 적고 <b>역할 나누기</b>를 눌러 주세요.</div></div></div>
          </div>
        </div>`;
      const rl = $('.rl', el), out = $('.roles-out', el), gn = $('.gn', el), gBox = $('.g-box', el);
      const note = $('.link-note', el);
      const linked = () => store.get('team.groups', null);
      /* 모둠 편성 결과가 있으면 그걸 이어받는 게 기본 */
      let mode = store.get('roles.mode', 'link');
      if (mode === 'link' && !linked()) mode = 'group';
      rl.value = store.get('roles.list', '모둠장\n기록이\n발표이\n지킴이');
      gn.value = store.get('roles.gn', 4);
      const syncMode = () => {
        $$('.mode .pill', el).forEach(x => x.classList.toggle('on', x.dataset.m === mode));
        gBox.hidden = mode !== 'group';
        const g = linked();
        note.hidden = mode !== 'link';
        if (mode === 'link') {
          note.innerHTML = g
            ? `${ico('groups')}<b>모둠 편성</b>에서 만든 ${g.length}모둠(${g.reduce((a, m) => a + m.length, 0)}명)을 그대로 쓰고, 역할만 나눠요.`
            : `${ico('groups')}아직 편성된 모둠이 없어요. <b>모둠 편성</b>에서 먼저 모둠을 만들어 주세요.`;
        }
      };
      const card = (title, count, rows, c) =>
        `<div class="group-card" style="--gc:${c};animation-delay:${Math.random() * 120}ms"><h4>${esc(title)}<span>${count}명</span></h4><ul class="role-list">${rows}</ul></div>`;
      const assign = (quiet) => {
        const rs = SD.lines(rl.value), s = shuffle(roster.students());
        store.set('roles.list', rl.value);
        if (!rs.length) { if (!quiet) SD.toast('역할을 한 줄에 하나씩 적어 주세요'); return; }
        if (mode === 'link') {
          const src = linked();
          if (!src || !src.length) { if (!quiet) SD.toast('모둠 편성에서 먼저 모둠을 만들어 주세요'); return; }
          /* 모둠 구성원은 건드리지 않고, 그 안에서 역할만 섞어요 */
          out.innerHTML = `<div class="group-grid">${src.map((m, i) => card(`${i + 1}모둠`, m.length,
            shuffle(m).map((x, j) => `<li><b>${esc(j < rs.length ? rs[j] : '모둠원')}</b><span>${esc(x)}</span></li>`).join(''),
            PALETTE[i % PALETTE.length])).join('')}</div>`;
          audio.chime('pop'); return;
        }
        if (!s.length) { out.innerHTML = `<div class="empty">${ico('users')}<div>명단이 비어 있어요.<br>위쪽 <b>우리 반</b> 버튼에서 이름을 넣어주세요.</div></div>`; return; }
        if (mode === 'group') {
          const k = Math.max(1, Math.min(12, +gn.value || 1)); store.set('roles.gn', k);
          const g = Array.from({ length: Math.min(k, s.length) }, () => []);
          s.forEach((x, i) => g[i % g.length].push(x));
          /* 역할은 모둠마다 한 번씩만 — 모둠장이 둘 나오지 않게, 남는 사람은 모둠원 */
          out.innerHTML = `<div class="group-grid">${g.map((m, i) => card(`${i + 1}모둠`, m.length,
            m.map((x, j) => `<li><b>${esc(j < rs.length ? rs[j] : '모둠원')}</b><span>${esc(x)}</span></li>`).join(''),
            PALETTE[i % PALETTE.length])).join('')}</div>`;
        } else {
          const by = rs.map(() => []);
          s.forEach((x, i) => by[i % rs.length].push(x));
          out.innerHTML = `<div class="group-grid">${rs.map((r, i) => card(r, by[i].length,
            by[i].map(x => `<li><span>${esc(x)}</span></li>`).join(''),
            PALETTE[i % PALETTE.length])).join('')}</div>`;
        }
        audio.chime('pop');
      };
      $('.go', el).onclick = () => assign(false);
      $$('.mode .pill', el).forEach(p => p.onclick = () => { mode = p.dataset.m; store.set('roles.mode', mode); syncMode(); });
      $$('.g-box button', el).forEach(b => b.onclick = () => { gn.value = Math.max(1, Math.min(12, (+gn.value || 1) + +b.dataset.d)); store.set('roles.gn', +gn.value); });
      /* 옆에서 모둠을 새로 편성하면 역할도 그 모둠에 맞춰 바로 다시 나눠요 */
      const onGroups = () => { syncMode(); if (mode === 'link') assign(true); };
      document.addEventListener('sd:groups', onGroups);
      syncMode();
      if (mode === 'link' && linked()) assign(true);
      return { destroy() { document.removeEventListener('sd:groups', onGroups); } };
    },
  });

  /* ---------------- 수업 신호등 ---------------- */
  register({
    id: 'signal', group: 'mood', name: '수업 신호등', icon: 'signal',
    desc: '지금은 어떻게 이야기할 때인지 색으로 알려줘요.',
    mount(el) {
      const S = [
        ['green', '초록불', '자유롭게 이야기해요', '함께 이야기해요', '#2FBF9B'],
        ['yellow', '노란불', '짝과 소곤소곤', '소곤소곤 이야기해요', '#F2AE2E'],
        ['red', '빨간불', '혼자 조용히', '혼자 조용히 해요', '#F2594B'],
      ];
      el.innerHTML = `
        <div class="t signal">
          <div class="signal-msg"></div>
          <div class="lamps">${S.map(([k, n, d, , c]) => `<button class="lamp" data-k="${k}" style="--lc:${c}"><span class="bulb"></span><b>${n}</b><span class="ld">${d}</span></button>`).join('')}</div>
        </div>`;
      const root = $('.signal', el), msg = $('.signal-msg', el);
      let cur = store.get('signal.k', '');
      function render() {
        const hit = S.find(x => x[0] === cur);
        $$('.lamp', el).forEach(b => b.classList.toggle('on', b.dataset.k === cur));
        msg.textContent = hit ? hit[3] : '신호를 골라 주세요';
        root.classList.toggle('picked', !!hit);
        root.style.setProperty('--sc', hit ? hit[4] : 'var(--ink-3)');
      }
      $$('.lamp', el).forEach(b => b.onclick = () => {
        cur = cur === b.dataset.k ? '' : b.dataset.k;
        store.set('signal.k', cur); render(); if (cur) audio.chime('pop');
      });
      render();
      return {};
    },
  });

  /* ---------------- 화면 칠판 ---------------- */
  register({
    id: 'board', group: 'share', name: '화면 칠판', icon: 'board',
    desc: '학습 문제나 할 일을 큰 글씨로 띄워 둬요.',
    mount(el) {
      el.innerHTML = `
        <div class="t top board">
          <div class="row board-bar">
            <div class="board-size" title="글씨 크기">
              <span class="bs-mark sm">가</span>
              <input type="range" class="range bsr" min="4" max="34" step="1" value="10" aria-label="글씨 크기">
              <span class="bs-mark lg">가</span>
            </div>
            <div class="pills skin">${[['light', '흰 칠판'], ['dark', '초록 칠판']].map(([k, n]) => `<button class="pill" data-k="${k}">${n}</button>`).join('')}</div>
            <button class="btn btn-ghost btn-sm clear">${ico('trash')}지우기</button>
          </div>
          <div class="board-sheet" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true" aria-label="화면 칠판"></div>
        </div>`;
      const sheet = $('.board-sheet', el), root = $('.board', el), bsr = $('.bsr', el);
      /* 예전에 'm' 같은 단계로 저장해 둔 값이 있으면 보통 크기로 */
      const saved = store.get('board.size', 10);
      let size = typeof saved === 'number' ? saved : 10, skin = store.get('board.skin', 'light'), deb = 0;
      bsr.value = size;
      sheet.textContent = store.get('board.text', '');
      function render() {
        root.style.setProperty('--bs', size); root.dataset.skin = skin;
        $$('.skin .pill', el).forEach(p => p.classList.toggle('on', p.dataset.k === skin));
        sheet.classList.toggle('blank', !sheet.textContent.trim());
        SD.initRanges(el);
      }
      sheet.addEventListener('input', () => {
        sheet.classList.toggle('blank', !sheet.textContent.trim());
        clearTimeout(deb); deb = setTimeout(() => store.set('board.text', sheet.innerText), 300);
      });
      /* 서식 없이 글자만 붙여 넣기 — 칠판 글씨가 뒤섞이지 않게 */
      sheet.addEventListener('paste', (e) => {
        e.preventDefault();
        document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
      });
      bsr.oninput = () => { size = +bsr.value; store.set('board.size', size); render(); };
      $$('.skin .pill', el).forEach(p => p.onclick = () => { skin = p.dataset.k; store.set('board.skin', skin); render(); });
      $('.clear', el).onclick = () => {
        if (sheet.textContent.trim() && !confirm('칠판에 쓴 내용을 모두 지울까요?')) return;
        sheet.textContent = ''; store.set('board.text', ''); render(); sheet.focus();
      };
      render();
      return { destroy() { clearTimeout(deb); store.set('board.text', sheet.innerText); } };
    },
  });

  /* ---------------- 낱말 카드 ---------------- */
  register({
    id: 'cards', group: 'share', name: '낱말 카드', icon: 'cards',
    desc: '낱말이나 문장을 한 장씩 아주 크게 띄워요.',
    mount(el) {
      el.innerHTML = `
        <div class="t cards">
          <div class="cards-setup">
            <label class="field-label">카드 내용 · 한 줄에 하나</label>
            <textarea class="textarea cl" placeholder="apple, 사과&#10;book, 책&#10;pencil, 연필"></textarea>
            <p class="hint">쉼표로 나누면 뒤집는 카드가 돼요. 예) apple, 사과</p>
            <button class="btn t-btn t-big start">${ico('cards')}카드 띄우기</button>
          </div>
          <div class="cards-stage" hidden>
            <div class="card-step"></div>
            <div class="card-face"><span class="card-text"></span></div>
            <div class="row">
              <button class="btn btn-soft prev">${ico('back')}이전</button>
              <button class="btn t-btn t-big flip" hidden>${ico('reset')}뒤집기</button>
              <button class="btn t-btn t-big nextc">다음${ico('arrow')}</button>
            </div>
            <div class="row">
              <button class="btn btn-ghost btn-sm shuf">${ico('shuffle')}섞기</button>
              <button class="btn btn-ghost btn-sm edit">${ico('edit')}다시 입력</button>
            </div>
          </div>
        </div>`;
      const setup = $('.cards-setup', el), stageBox = $('.cards-stage', el), cl = $('.cl', el);
      const step = $('.card-step', el), face = $('.card-face', el), txt = $('.card-text', el);
      const flipB = $('.flip', el), root = $('.cards', el);
      let deck = [], i = 0, back = false;
      cl.value = store.get('cards.text', '');
      const parse = () => SD.lines(cl.value).map(line => {
        const k = line.indexOf(',');
        return k > 0 ? { a: line.slice(0, k).trim(), b: line.slice(k + 1).trim() } : { a: line, b: '' };
      }).filter(c => c.a);
      function render() {
        const n = deck.length; if (!n) return;
        i = Math.max(0, Math.min(n - 1, i));
        const c = deck[i], hasBack = !!c.b;
        step.textContent = `${i + 1} / ${n}`;
        txt.textContent = back && hasBack ? c.b : c.a;
        face.classList.toggle('back', back && hasBack);
        /* 글자가 많아지면 저절로 작아지게 — 뒤에서도 읽히는 크기로 */
        const len = [...txt.textContent].length;
        root.dataset.len = len <= 3 ? 'xs' : len <= 7 ? 's' : len <= 16 ? 'm' : 'l';
        flipB.hidden = !hasBack;
        $('.prev', el).disabled = i === 0;
      }
      const move = (d) => { const n = deck.length; if (!n) return; i = (i + d + n) % n; back = false; render(); audio.chime('tick'); };
      $('.start', el).onclick = () => {
        deck = parse(); store.set('cards.text', cl.value);
        if (!deck.length) { SD.toast('카드 내용을 한 줄에 하나씩 넣어주세요'); return; }
        i = 0; back = false; setup.hidden = true; stageBox.hidden = false; render();
      };
      $('.nextc', el).onclick = () => move(1);
      $('.prev', el).onclick = () => move(-1);
      face.onclick = () => { const c = deck[i]; if (c && c.b) { back = !back; render(); audio.chime('tick'); } else move(1); };
      flipB.onclick = () => { back = !back; render(); audio.chime('tick'); };
      $('.shuf', el).onclick = () => { deck = shuffle(deck); i = 0; back = false; render(); audio.chime('pop'); };
      $('.edit', el).onclick = () => { setup.hidden = false; stageBox.hidden = true; };
      return {};
    },
  });
})();
