/* ==========================================================
   01 시간 — 타이머 · 스톱워치 · 알림 종 · 남은 날
   Copyright (c) 2026 황성재 (@hirame.ki). All rights reserved.
   상업적 이용·개작·무단 재배포 금지 — LICENSE 참고
   ========================================================== */
(function () {
  'use strict';
  const { ico, audio, $, $$, register, store } = SD;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------- 타이머 ---------------- */
  register({
    id: 'timer', group: 'time', name: '타이머', icon: 'timer',
    desc: '남은 시간을 큰 원으로 보여주고, 끝나면 차임이 울려요.',
    mount(el) {
      const C = 2 * Math.PI * 90;
      el.innerHTML = `
        <div class="t timer">
          <div class="ring-wrap">
            <svg viewBox="0 0 200 200"><circle class="ring-track" cx="100" cy="100" r="90" fill="none" stroke-width="10"/>
              <circle class="ring-fill" cx="100" cy="100" r="90" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
            <div class="ring-center"><div class="big-time">05:00</div><div class="ring-sub">준비</div></div>
          </div>
          <div class="timer-ctrl">
          <div class="pills">${[1, 3, 5, 10, 15, 20].map(m => `<button class="pill" data-m="${m}">${m}분</button>`).join('')}</div>
          <div class="row time-edit">
            <div class="stepper" title="분"><button data-d="-60">−</button><input type="number" class="in-m" min="0" max="99" value="5"><span class="unit">분</span><button data-d="60">+</button></div>
            <div class="stepper" title="초"><button data-d="-10">−</button><input type="number" class="in-s" min="0" max="59" value="0"><span class="unit">초</span><button data-d="10">+</button></div>
          </div>
          <div class="row">
            <button class="btn t-btn t-big go">${ico('play')}<span>시작</span></button>
            <button class="btn btn-soft t-big rs">${ico('reset')}다시</button>
          </div>
          </div>
        </div>`;
      const root = $('.timer', el), fill = $('.ring-fill', el), big = $('.big-time', el), sub = $('.ring-sub', el);
      const inM = $('.in-m', el), inS = $('.in-s', el), go = $('.go', el);
      let total = store.get('timer.last', 300), endAt = 0, remain = total, running = false, raf = 0, lastSec = -1;

      function paint() {
        const sec = Math.max(0, Math.ceil(remain - 1e-6));
        big.textContent = `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
        fill.style.strokeDashoffset = total > 0 ? C * (1 - remain / total) : C;
        root.classList.toggle('warn', running && sec <= 10 && sec > 0);
        if (sec !== lastSec && running && sec <= 5 && sec > 0) audio.chime('tick');
        lastSec = sec;
      }
      function setTotal(sec) {
        sec = Math.max(0, Math.min(sec, 99 * 60 + 59));
        stop(); total = sec; remain = sec; store.set('timer.last', sec);
        inM.value = Math.floor(sec / 60); inS.value = sec % 60;
        root.classList.remove('done', 'warn'); sub.textContent = '준비';
        $$('.pill', el).forEach(p => p.classList.toggle('on', +p.dataset.m * 60 === sec));
        paint();
      }
      function loop() {
        remain = Math.max(0, (endAt - performance.now()) / 1000);
        paint();
        if (remain <= 0) finish();
      }
      function start() {
        if (remain <= 0) { remain = total; root.classList.remove('done'); }
        if (total <= 0) return;
        running = true; endAt = performance.now() + remain * 1000;
        go.innerHTML = `${ico('pause')}<span>일시정지</span>`; sub.textContent = '진행 중';
        clearInterval(raf); raf = setInterval(loop, 100);
      }
      function stop() {
        clearInterval(raf); running = false;
        go.innerHTML = `${ico('play')}<span>${remain > 0 && remain < total ? '계속' : '시작'}</span>`;
        if (remain > 0 && remain < total) sub.textContent = '잠시 멈춤';
      }
      function finish() {
        running = false; clearInterval(raf); remain = 0; paint();
        root.classList.remove('warn'); root.classList.add('done'); sub.textContent = '시간 끝!';
        go.innerHTML = `${ico('play')}<span>시작</span>`;
        audio.chime('done');
      }
      go.onclick = () => running ? stop() : start();
      $('.rs', el).onclick = () => setTotal(total);
      $$('.pill', el).forEach(p => p.onclick = () => setTotal(+p.dataset.m * 60));
      $$('.stepper button', el).forEach(b => b.onclick = () => setTotal((running ? Math.ceil(remain) : total) + +b.dataset.d));
      [inM, inS].forEach(i => i.onchange = () => setTotal((+inM.value || 0) * 60 + (+inS.value || 0)));
      setTotal(total);
      return { destroy() { clearInterval(raf); } };
    },
  });

  /* ---------------- 스톱워치 ---------------- */
  register({
    id: 'stopwatch', group: 'time', name: '스톱워치', icon: 'stopwatch',
    desc: '걸린 시간을 재고 구간 기록을 남겨요.',
    mount(el) {
      el.innerHTML = `
        <div class="t">
          <div class="sw-display">00:00<small>.0</small></div>
          <div class="row">
            <button class="btn t-btn t-big go">${ico('play')}<span>시작</span></button>
            <button class="btn btn-soft t-big lap-b" disabled>${ico('flag')}기록</button>
            <button class="btn btn-ghost t-big rs">${ico('reset')}다시</button>
          </div>
          <div class="laps"></div>
        </div>`;
      const disp = $('.sw-display', el), go = $('.go', el), lapB = $('.lap-b', el), laps = $('.laps', el);
      let t0 = 0, acc = 0, running = false, raf = 0, n = 0, lastLap = 0;
      const fmt = (ms) => { const m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000), d = Math.floor(ms % 1000 / 100); return [`${pad(m)}:${pad(s)}`, `.${d}`]; };
      const now = () => acc + (running ? performance.now() - t0 : 0);
      function paint() { const [a, b] = fmt(now()); disp.innerHTML = `${a}<small>${b}</small>`; if (running) raf = requestAnimationFrame(paint); }
      go.onclick = () => {
        if (running) { acc = now(); running = false; cancelAnimationFrame(raf); go.innerHTML = `${ico('play')}<span>계속</span>`; lapB.disabled = true; }
        else { t0 = performance.now(); running = true; go.innerHTML = `${ico('pause')}<span>멈춤</span>`; lapB.disabled = false; paint(); }
      };
      lapB.onclick = () => {
        const t = now(), [a, b] = fmt(t), [c, d] = fmt(t - lastLap); lastLap = t; n++;
        laps.insertAdjacentHTML('afterbegin', `<div class="lap"><span>${n}번째</span><span>+${c}${d}</span><b>${a}${b}</b></div>`);
      };
      $('.rs', el).onclick = () => { running = false; cancelAnimationFrame(raf); acc = 0; n = 0; lastLap = 0; laps.innerHTML = ''; lapB.disabled = true; go.innerHTML = `${ico('play')}<span>시작</span>`; paint(); };
      return { destroy() { cancelAnimationFrame(raf); } };
    },
  });

  /* ---------------- 알림 종 ---------------- */
  register({
    id: 'bell', group: 'time', name: '알림 종', icon: 'bell',
    desc: '시작·주목·정리 신호를 부드러운 종소리로 알려요.',
    mount(el) {
      const B = [
        ['ding', '딩', '시작해요'], ['dingdong', '딩동댕', '잘했어요'],
        ['alert', '모두 주목', '화면에 크게 표시'], ['end', '정리 시간', '마무리해요'],
      ];
      el.innerHTML = `<div class="t"><div class="bells">${B.map(([k, n, s]) => `<button class="bell" data-k="${k}">${ico('bell')}<b>${n}</b><span>${s}</span></button>`).join('')}</div></div>`;
      $$('.bell', el).forEach(b => b.onclick = () => {
        audio.chime(b.dataset.k);
        b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring');
        if (b.dataset.k === 'alert' || b.dataset.k === 'end') {
          const msg = b.dataset.k === 'alert' ? '모두 주목!' : '정리해요';
          $$('.attention', el).forEach(x => x.remove());
          const ov = document.createElement('div'); ov.className = 'attention';
          ov.innerHTML = `<div class="msg"><b>${msg}</b><span>화면을 누르면 닫혀요</span></div>`;
          ov.onclick = () => ov.remove();
          el.appendChild(ov); setTimeout(() => ov.remove(), 6000);
        }
      });
      return {};
    },
  });

  /* ---------------- 남은 날 (디데이) ---------------- */
  register({
    id: 'dday', group: 'time', name: '남은 날', icon: 'dday',
    desc: '시험·행사까지 며칠 남았는지 크게 세어 보여줘요.',
    mount(el) {
      el.innerHTML = `
        <div class="t top dday">
          <div class="dday-add">
            <input class="input nm" placeholder="무슨 날인가요? (예: 중간고사)" maxlength="18">
            <input class="input dt" type="date">
            <button class="btn t-btn add">${ico('plus')}추가</button>
          </div>
          <div class="dday-list"></div>
        </div>`;
      const nm = $('.nm', el), dt = $('.dt', el), box = $('.dday-list', el);
      let items = store.get('dday.items', null) || [];
      const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
      const today = () => midnight(new Date());
      const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const days = (ymd) => Math.round((midnight(ymd + 'T00:00:00') - today()) / 86400000);
      const WD = ['일', '월', '화', '수', '목', '금', '토'];
      dt.value = iso(today());
      const save = () => store.set('dday.items', items);

      function render() {
        if (!items.length) { box.innerHTML = `<div class="empty">${ico('dday')}<div>기다리는 날을 위에서 추가해 주세요.<br>시험, 현장학습, 발표회처럼요.</div></div>`; return; }
        const sorted = [...items].sort((a, b) => Math.abs(days(a.date)) - Math.abs(days(b.date)));
        box.innerHTML = sorted.map((it, i) => {
          const n = days(it.date), d = new Date(it.date + 'T00:00:00');
          const tag = n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`;
          const sub = n === 0 ? '바로 오늘이에요' : n > 0 ? `${n}일 남았어요` : `${-n}일 지났어요`;
          return `<div class="dday-card ${i === 0 ? 'lead' : ''} ${n === 0 ? 'today' : n < 0 ? 'past' : ''}" style="animation-delay:${i * 60}ms">
            <button class="dd-del" data-id="${it.id}" title="지우기">${ico('x')}</button>
            <div class="dd-name">${SD.esc(it.name)}</div>
            <div class="dd-num">${tag}</div>
            <div class="dd-sub">${sub}</div>
            <div class="dd-date">${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${WD[d.getDay()]})</div>
          </div>`;
        }).join('');
      }
      const add = () => {
        const name = nm.value.trim(), date = dt.value;
        if (!name) { SD.toast('무슨 날인지 이름을 넣어주세요'); nm.focus(); return; }
        if (!date) { SD.toast('날짜를 골라주세요'); return; }
        items.push({ id: SD.uid(), name: name.slice(0, 18), date });
        nm.value = ''; save(); render(); audio.chime('pop');
      };
      $('.add', el).onclick = add;
      nm.onkeydown = (e) => { if (e.key === 'Enter') add(); };
      box.addEventListener('click', (e) => {
        const b = e.target.closest('.dd-del'); if (!b) return;
        items = items.filter(x => x.id !== b.dataset.id); save(); render();
      });
      render();
      /* 자정을 넘기면 숫자가 저절로 하루 줄어들게 */
      const iv = setInterval(render, 60000);
      return { destroy() { clearInterval(iv); } };
    },
  });
})();
