/* ==========================================================
   03 모둠·점수 / 04 교실 분위기 / 05 나눔
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
          <div class="group-grid"></div>
        </div>`;
      const num = $('.num', el), unit = $('.unit', el), grid = $('.group-grid', el), toScore = $('.to-score', el);
      let mode = 'count', last = null;
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
      };
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
})();
