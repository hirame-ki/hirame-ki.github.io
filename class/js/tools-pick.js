/* ==========================================================
   02 뽑기 — 1명 뽑기 · 여러 명 뽑기 · 룰렛 · 사다리
   ========================================================== */
(function () {
  'use strict';
  const { ico, audio, roster, $, $$, esc, shuffle, rand, lines, register, WHEEL, PALETTE, fitCanvas, confetti } = SD;
  const emptyNote = () => `<div class="empty">${ico('users')}<div>명단이 비어 있어요.<br>위쪽 <b>우리 반</b> 버튼에서 이름을 넣어주세요.</div></div>`;

  /* ---------------- 1명 뽑기 ---------------- */
  register({
    id: 'pickOne', group: 'pick', name: '한 명 뽑기', icon: 'pickOne',
    desc: '두근두근 굴려서 발표할 친구 한 명을 골라요.',
    mount(el) {
      el.innerHTML = `
        <div class="t">
          <div class="pick-stage"><div class="pick-name">?</div><div class="pick-sub">버튼을 눌러 뽑아요</div></div>
          <button class="btn t-btn t-big go">${ico('spark')}뽑기</button>
          <div class="row">
            <label class="switch"><input type="checkbox" class="nodup" checked><i></i>한 번 뽑힌 친구는 빼기</label>
            <button class="btn btn-ghost btn-sm refill">${ico('reset')}다시 모두</button>
          </div>
        </div>`;
      const nameEl = $('.pick-name', el), sub = $('.pick-sub', el), stage = $('.pick-stage', el), go = $('.go', el), nodup = $('.nodup', el);
      let used = new Set(), timer = 0;
      const pool = () => { const s = roster.students(); return nodup.checked ? s.filter(x => !used.has(x)) : s; };
      const status = () => {
        const all = roster.students().length;
        if (!all) { sub.textContent = '명단이 비어 있어요'; return; }
        if (nodup.checked) sub.textContent = `남은 친구 ${pool().length}명 / ${all}명`;
      };
      go.onclick = () => {
        const all = roster.students();
        if (!all.length) { stage.innerHTML = emptyNote(); return; }
        if (!stage.contains(nameEl)) { stage.innerHTML = ''; stage.append(nameEl, sub); }
        let p = pool();
        if (!p.length) { used.clear(); p = pool(); SD.toast('모두 한 번씩 뽑혔어요. 처음부터 다시 뽑아요.'); }
        clearTimeout(timer); go.disabled = true; nameEl.classList.remove('win'); nameEl.classList.add('rolling');
        let i = 0; const steps = 22;
        const spin = () => {
          nameEl.textContent = all[rand(all.length)]; audio.chime('tick'); i++;
          if (i < steps) { timer = setTimeout(spin, 30 + i * i * .45); return; }
          const w = p[rand(p.length)]; used.add(w);
          nameEl.textContent = w; nameEl.classList.remove('rolling'); void nameEl.offsetWidth; nameEl.classList.add('win');
          audio.chime('pop'); confetti(stage); go.disabled = false;
          sub.textContent = nodup.checked ? `축하해요! · 남은 친구 ${pool().length}명` : '축하해요!';
        };
        spin();
      };
      $('.refill', el).onclick = () => { used.clear(); nameEl.textContent = '?'; status(); };
      nodup.onchange = status;
      status();
      return { destroy() { clearTimeout(timer); }, onRoster() { used.clear(); nameEl.textContent = '?'; status(); } };
    },
  });

  /* ---------------- 여러 명 뽑기 ---------------- */
  register({
    id: 'pickMany', group: 'pick', name: '여러 명 뽑기', icon: 'pickMany',
    desc: '필요한 인원만큼 겹치지 않게 한 번에 뽑아요.',
    mount(el) {
      el.innerHTML = `
        <div class="t">
          <div class="row"><span class="label-sm">몇 명 뽑을까요?</span>
            <div class="stepper"><button data-d="-1">−</button><input type="number" class="cnt" min="1" max="99" value="3"><span class="unit">명</span><button data-d="1">+</button></div>
            <button class="btn t-btn go">${ico('shuffle')}뽑기</button>
          </div>
          <div class="chips"></div>
        </div>`;
      const cnt = $('.cnt', el), chips = $('.chips', el);
      $$('.stepper button', el).forEach(b => b.onclick = () => { cnt.value = Math.max(1, (+cnt.value || 1) + +b.dataset.d); });
      $('.go', el).onclick = () => {
        const s = roster.students();
        if (!s.length) { chips.innerHTML = emptyNote(); return; }
        const n = Math.min(Math.max(1, +cnt.value || 1), s.length);
        chips.innerHTML = shuffle(s).slice(0, n).map((x, i) => `<div class="name-chip" style="animation-delay:${i * 90}ms"><i>${i + 1}</i>${esc(x)}</div>`).join('');
        audio.chime('pop');
      };
      return {};
    },
  });

  /* ---------------- 룰렛 ---------------- */
  register({
    id: 'roulette', group: 'pick', name: '룰렛', icon: 'roulette',
    desc: '우리 반 명단이나 직접 쓴 항목으로 돌림판을 돌려요.',
    mount(el) {
      el.innerHTML = `
        <div class="t roulette">
          <div class="wheel-side">
          <div class="pills src"><button class="pill on" data-s="class">우리 반 명단</button><button class="pill" data-s="custom">직접 입력</button></div>
          <div class="custom-list" hidden><textarea class="textarea" placeholder="한 줄에 하나씩&#10;예) 칭찬 스티커&#10;자리 바꾸기&#10;노래 한 곡"></textarea></div>
          </div>
          <div class="wheel">
            <svg class="wheel-pointer" viewBox="0 0 34 40"><path d="M17 38 3 8a15 15 0 0 1 28 0z" fill="#1E2330"/><circle cx="17" cy="11" r="4.5" fill="#fff"/></svg>
            <canvas></canvas><div class="wheel-hub">${ico('spark')}</div>
          </div>
          <div class="wheel-side">
          <div class="result-line"></div>
          <button class="btn t-btn t-big go">${ico('roulette')}돌리기</button>
          </div>
        </div>`;
      const cv = $('canvas', el), res = $('.result-line', el), go = $('.go', el), ta = $('textarea', el), cl = $('.custom-list', el);
      let src = 'class', angle = 0, spinning = false, raf = 0;
      ta.value = SD.store.get('roulette.custom', '');
      const items = () => { const a = src === 'class' ? roster.students() : lines(ta.value); return a.length ? a : ['항목을 넣어주세요']; };
      function draw() {
        const { ctx, w, h } = fitCanvas(cv), it = items(), cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 2, sl = Math.PI * 2 / it.length;
        ctx.clearRect(0, 0, w, h);
        it.forEach((t, i) => {
          const a0 = angle + i * sl;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a0 + sl); ctx.closePath();
          ctx.fillStyle = WHEEL[i % WHEEL.length]; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(a0 + sl / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          const fs = Math.max(10, Math.min(r * .09, (r * sl) * .42, 26));
          ctx.fillStyle = '#2A2F3C'; ctx.font = `800 ${fs}px Pretendard Variable, Pretendard, sans-serif`;
          ctx.fillText(t.length > 7 ? t.slice(0, 7) + '…' : t, r - 14, 1); ctx.restore();
        });
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      }
      go.onclick = () => {
        if (spinning) return; const it = items(); if (it.length < 2) { SD.toast('두 개 이상 있어야 돌릴 수 있어요'); return; }
        spinning = true; go.disabled = true; res.textContent = '';
        const from = angle, turn = Math.PI * 2 * (5 + Math.random() * 4), dur = 4200 + Math.random() * 1200, t0 = performance.now();
        const sl = Math.PI * 2 / it.length; let lastIdx = -1;
        const step = (now) => {
          const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); angle = from + turn * e; draw();
          const idx = Math.floor((((Math.PI * 1.5 - angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / sl);
          if (idx !== lastIdx) { lastIdx = idx; if (p < .97) audio.chime('tick'); }
          if (p < 1) { raf = requestAnimationFrame(step); return; }
          spinning = false; go.disabled = false; res.textContent = it[idx % it.length]; audio.chime('pop');
        };
        raf = requestAnimationFrame(step);
      };
      $$('.src .pill', el).forEach(p => p.onclick = () => {
        src = p.dataset.s; $$('.src .pill', el).forEach(x => x.classList.toggle('on', x === p)); cl.hidden = src !== 'custom'; res.textContent = ''; requestAnimationFrame(draw);
      });
      ta.oninput = () => { SD.store.set('roulette.custom', ta.value); draw(); };
      requestAnimationFrame(draw);
      return { destroy() { cancelAnimationFrame(raf); }, onResize: draw, onRoster() { if (src === 'class') { res.textContent = ''; draw(); } } };
    },
  });

  /* ---------------- 사다리 ---------------- */
  register({
    id: 'ladder', group: 'pick', name: '사다리 타기', icon: 'ladder',
    desc: '참여자와 결과를 넣고 한 명씩 길을 따라가요.',
    mount(el) {
      el.innerHTML = `
        <div class="t top">
          <div class="ladder-setup">
            <div class="ladder-inputs">
              <div><label class="field-label">참여자 (한 줄에 한 명)</label><textarea class="textarea names"></textarea></div>
              <div><label class="field-label">결과 (한 줄에 하나)</label><textarea class="textarea results" placeholder="당첨&#10;통과&#10;통과"></textarea></div>
            </div>
          </div>
          <div class="row">
            <button class="btn t-btn make">${ico('ladder')}사다리 만들기</button>
            <button class="btn btn-soft all" hidden>${ico('eye')}모두 공개</button>
            <button class="btn btn-ghost edit" hidden>${ico('edit')}다시 입력</button>
          </div>
          <div class="ladder-canvas-wrap" hidden><canvas></canvas></div>
          <div class="ladder-starts"></div>
          <div class="ladder-results"></div>
        </div>`;
      const names = $('.names', el), results = $('.results', el), wrap = $('.ladder-canvas-wrap', el), cv = $('canvas', el);
      const setup = $('.ladder-setup', el), starts = $('.ladder-starts', el), resBox = $('.ladder-results', el);
      let L = null, raf = 0;
      const fillNames = () => { const s = roster.students(); names.value = s.slice(0, 12).join('\n'); };
      fillNames(); results.value = SD.store.get('ladder.results', '당첨\n통과\n통과\n통과');

      function build(n, res) {
        const rows = 7 + rand(4), br = [];
        for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < n - 1; c++) row.push(!(c > 0 && row[c - 1]) && Math.random() > .45); br.push(row); }
        const paths = Array.from({ length: n }, (_, s) => { let c = s; const p = [{ r: 0, c }]; for (let r = 0; r < rows; r++) { p.push({ r: r + .5, c }); if (c < n - 1 && br[r][c]) c++; else if (c > 0 && br[r][c - 1]) c--; p.push({ r: r + .5, c }); } p.push({ r: rows + 1, c }); return { end: c, p }; });
        return { n, rows, br, paths, res, reveal: new Array(n).fill(null) };
      }
      function draw() {
        if (!L) return;
        const { ctx, w, h } = fitCanvas(cv), { n, rows } = L, px = Math.min(60, w / n / 2), top = 34, bot = 34;
        const X = (c) => px + c * (w - px * 2) / Math.max(1, n - 1), Y = (r) => top + r * (h - top - bot) / (rows + 1);
        ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = '#E4DDD2'; ctx.lineWidth = 4;
        for (let c = 0; c < n; c++) { ctx.beginPath(); ctx.moveTo(X(c), Y(0)); ctx.lineTo(X(c), Y(rows + 1)); ctx.stroke(); }
        L.br.forEach((row, r) => row.forEach((b, c) => { if (b) { ctx.beginPath(); ctx.moveTo(X(c), Y(r + .5)); ctx.lineTo(X(c + 1), Y(r + .5)); ctx.stroke(); } }));
        const shown = new Set();
        L.reveal.forEach((rv, s) => {
          if (!rv) return; const col = PALETTE[s % PALETTE.length], pts = L.paths[s].p, seg = (pts.length - 1) * rv.p, full = Math.floor(seg);
          ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(X(pts[0].c), Y(pts[0].r));
          for (let i = 1; i <= full && i < pts.length; i++) ctx.lineTo(X(pts[i].c), Y(pts[i].r));
          if (full + 1 < pts.length) { const a = pts[full], b = pts[full + 1], f = seg - full; ctx.lineTo(X(a.c + (b.c - a.c) * f), Y(a.r + (b.r - a.r) * f)); }
          ctx.stroke(); if (rv.p >= 1) shown.add(L.paths[s].end);
        });
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const fs = Math.max(11, Math.min(15, (w - px * 2) / n / 4.2));
        for (let c = 0; c < n; c++) {
          ctx.font = `800 ${fs}px Pretendard Variable, Pretendard, sans-serif`; ctx.fillStyle = L.reveal[c] ? PALETTE[c % PALETTE.length] : '#1E2330';
          const nm = L.names[c]; ctx.fillText(nm.length > 5 ? nm.slice(0, 5) + '…' : nm, X(c), 14);
          ctx.font = `700 ${fs}px Pretendard Variable, Pretendard, sans-serif`; ctx.fillStyle = shown.has(c) ? '#1E2330' : '#B7B0A5';
          const rs = shown.has(c) ? (L.res[c] || '') : '?'; ctx.fillText(rs.length > 5 ? rs.slice(0, 5) + '…' : rs, X(c), h - 14);
        }
      }
      function loop() {
        let active = false; const now = performance.now();
        L.reveal.forEach((rv, s) => {
          if (!rv || rv.p >= 1) return; active = true; rv.p = Math.min(1, (now - rv.t0) / 1600);
          if (rv.p >= 1) {
            const e = L.paths[s].end; resBox.insertAdjacentHTML('beforeend', `<span style="background:${PALETTE[s % PALETTE.length]}">${esc(L.names[s])} → ${esc(L.res[e] || '?')}</span>`);
            audio.chime('pop');
          }
        });
        draw(); if (active) raf = requestAnimationFrame(loop); else raf = 0;
      }
      function go(s) {
        if (!L || L.reveal[s]) return; L.reveal[s] = { t0: performance.now(), p: 0 };
        const b = $(`.ladder-starts [data-s="${s}"]`, el); if (b) b.disabled = true;
        if (!raf) raf = requestAnimationFrame(loop);
      }
      $('.make', el).onclick = () => {
        const nm = lines(names.value), rs = lines(results.value);
        if (nm.length < 2) { SD.toast('참여자를 2명 이상 넣어주세요'); return; }
        if (nm.length > 16) { SD.toast('사다리는 16명까지 할 수 있어요'); return; }
        SD.store.set('ladder.results', results.value);
        while (rs.length < nm.length) rs.push('통과');
        L = build(nm.length, shuffle(rs.slice(0, nm.length))); L.names = nm;
        setup.hidden = true; wrap.hidden = false; $('.all', el).hidden = false; $('.edit', el).hidden = false; $('.make', el).innerHTML = `${ico('shuffle')}새로 섞기`;
        resBox.innerHTML = ''; starts.innerHTML = nm.map((x, i) => `<button class="pill" data-s="${i}" style="--c:${PALETTE[i % PALETTE.length]}">${esc(x)}</button>`).join('');
        $$('.pill', starts).forEach(b => b.onclick = () => go(+b.dataset.s));
        requestAnimationFrame(draw);
      };
      $('.all', el).onclick = () => { if (L) L.names.forEach((_, i) => setTimeout(() => go(i), i * 160)); };
      $('.edit', el).onclick = () => { setup.hidden = false; wrap.hidden = true; L = null; starts.innerHTML = ''; resBox.innerHTML = ''; $('.all', el).hidden = true; $('.edit', el).hidden = true; $('.make', el).innerHTML = `${ico('ladder')}사다리 만들기`; };
      return { destroy() { cancelAnimationFrame(raf); }, onResize: draw, onRoster() { if (!L) fillNames(); } };
    },
  });
})();
