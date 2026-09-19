/* ==========================================================
   수업서랍 · core — 아이콘, 저장소, 명단, 소리, 도구 레지스트리
   Copyright (c) 2026 황성재 (@hirame.ki). All rights reserved.
   상업적 이용·개작·무단 재배포 금지 — LICENSE 참고
   ========================================================== */
(function () {
  'use strict';

  /* ---------- 아이콘 (24 그리드 라인 아이콘) ---------- */
  const P = {
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 2"/><path d="M9.5 2.5h5"/><path d="M18.5 6.5l1.4-1.4"/>',
    stopwatch: '<circle cx="12" cy="14" r="7"/><path d="M12 10.5V14h3"/><path d="M10 2.5h4M12 2.5v4"/><path d="M4.5 7.5 6 6"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9z"/><path d="M10.2 20.5a2 2 0 0 0 3.6 0"/>',
    pickOne: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5a7 7 0 0 1 14 0"/><path d="M19.5 2.5v3.5M17.75 4.25h3.5"/>',
    pickMany: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><path d="M15.5 4.8a3.4 3.4 0 0 1 0 6.4"/><path d="M21.5 20.5a6.5 6.5 0 0 0-3.8-5.9"/>',
    roulette: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3v6.8M19.8 16.5l-5.9-3.4M4.2 16.5l5.9-3.4"/>',
    ladder: '<path d="M6 3v18M12 3v18M18 3v18"/><path d="M6 7.5h6M12 11.5h6M6 15.5h6M12 19h6"/>',
    groups: '<circle cx="12" cy="12" r="3.4"/><circle cx="12" cy="3.8" r="1.8"/><circle cx="20.2" cy="12" r="1.8"/><circle cx="12" cy="20.2" r="1.8"/><circle cx="3.8" cy="12" r="1.8"/>',
    trophy: '<path d="M8 21h8M12 16.5V21"/><path d="M7 3.5h10v5.5a5 5 0 0 1-10 0z"/><path d="M17 5.5h3v1.5a3.5 3.5 0 0 1-3.2 3.5M7 5.5H4v1.5a3.5 3.5 0 0 0 3.2 3.5"/>',
    gauge: '<path d="M3.5 16.5a8.5 8.5 0 1 1 17 0"/><path d="M12 16.5l4.2-5.2"/><circle cx="12" cy="16.5" r="1.4"/><path d="M6.4 10.4l1 .8M12 6.5v1.3M17.6 10.4l-1 .8"/>',
    headphones: '<path d="M3.5 17v-5a8.5 8.5 0 0 1 17 0v5"/><rect x="3" y="13.5" width="5" height="7.5" rx="2"/><rect x="16" y="13.5" width="5" height="7.5" rx="2"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><path d="M14 14h3v3h-3zM20 14v.01M20 17.5V21h-3.5M14 20.5v.01"/>',
    /* UI */
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><path d="M16 11h6M19 8v6"/>',
    layers: '<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/>',
    colsIco: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M12 4v16"/>',
    rowsIco: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 12h18"/>',
    col3: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16M15 4v16"/>',
    main3: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M13 4v16M13 12h8"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8"/>',
    crown: '<path d="M3.5 8l4 3.5L12 5l4.5 6.5 4-3.5-1.8 10.5H5.3z"/>',
    volLo: '<path d="M11 5 6 9H3v6h3l5 4z"/>',
    volHi: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    drawer: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 12h18M10 8h4M10 16h4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  };
  const ico = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

  /* ---------- 저장소 (브라우저 안에만) ---------- */
  const KEY = 'sueop-seorap.v1';
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { mem = {}; }
  const store = {
    get(k, d) { return k in mem ? mem[k] : d; },
    set(k, v) { mem[k] = v; try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* 저장 불가 환경 */ } },
  };

  /* ---------- 명단 ---------- */
  const numbered = (n) => Array.from({ length: n }, (_, i) => `${i + 1}번`);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const roster = {
    classes: store.get('classes', null) || [{ id: uid(), name: '우리 반', students: numbered(24) }],
    currentId: store.get('currentClass', null),
    listeners: new Set(),
    current() { return this.classes.find(c => c.id === this.currentId) || this.classes[0]; },
    students() { return [...(this.current()?.students || [])]; },
    save() {
      store.set('classes', this.classes);
      store.set('currentClass', this.current()?.id);
      this.listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    },
    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  };
  if (!roster.classes.find(c => c.id === roster.currentId)) roster.currentId = roster.classes[0].id;

  /* ---------- 소리 (Web Audio, 파일 없이 합성) ---------- */
  let actx = null;
  const audio = {
    ctx() {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    },
    tone(freq, at = 0, dur = .6, vol = .28, type = 'sine') {
      try {
        const c = this.ctx(), t = c.currentTime + at;
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + .015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05);
        /* 배음 한 겹 — 종소리 느낌 */
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.type = 'sine'; o2.frequency.value = freq * 2.76;
        g2.gain.setValueAtTime(0.0001, t);
        g2.gain.exponentialRampToValueAtTime(vol * .18, t + .01);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * .5);
        o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(t + dur);
      } catch (e) { /* 오디오 미지원 */ }
    },
    chime(kind) {
      const T = (f, a, d, v) => this.tone(f, a, d, v);
      if (kind === 'ding') { T(988, 0, 1.4); }
      else if (kind === 'dingdong') { T(784, 0, 1.1); T(988, .38, 1.1); T(1175, .76, 1.6); }
      else if (kind === 'alert') { [1319, 988, 1319, 988].forEach((f, i) => T(f, i * .18, .35, .24)); }
      else if (kind === 'end') { T(1175, 0, .9); T(988, .32, .9); T(784, .64, 1.5); }
      else if (kind === 'done') { [784, 988, 1175, 1568].forEach((f, i) => T(f, i * .16, i === 3 ? 1.6 : .6, .26)); }
      else if (kind === 'tick') { this.tone(1400, 0, .06, .08, 'triangle'); }
      else if (kind === 'pop') { this.tone(660, 0, .25, .18, 'triangle'); this.tone(990, .07, .3, .14, 'triangle'); }
    },
  };

  /* ---------- 유틸 ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rand = (n) => Math.floor(Math.random() * n);
  const lines = (s) => s.split('\n').map(x => x.trim()).filter(Boolean);
  const PALETTE = ['#FF8A65', '#8B7CF6', '#2FBF9B', '#4A9EF5', '#F2AE2E', '#F06292', '#26B5C9', '#8BC34A', '#B08968', '#7986CB', '#FF7043', '#AB47BC'];
  const WHEEL = ['#FFB199', '#B9AEFF', '#86E0C6', '#9CCBFF', '#FFD98A', '#FFA8C5', '#8EDDE8', '#C5E3A0', '#E2C6AE', '#B4BDF0', '#FFC4A3', '#D9A7E6'];

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }

  /* 캔버스를 부모 크기 × 기기 배율로 맞춤 */
  function fitCanvas(canvas) {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  function confetti(host, colors = PALETTE) {
    const box = document.createElement('div'); box.className = 'confetti';
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 160;
      p.style.cssText = `background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 40}px;--rot:${rand(720) - 360}deg;animation-delay:${Math.random() * 80}ms`;
      box.appendChild(p);
    }
    host.appendChild(box); setTimeout(() => box.remove(), 1400);
  }

  /* ---------- 도구 레지스트리 ---------- */
  const GROUPS = [
    { id: 'time', no: '01', name: '시간', desc: '활동 시간을 재고, 알리고, 마무리해요' },
    { id: 'pick', no: '02', name: '뽑기', desc: '공정하게, 설레게 — 발표자와 순서를 정해요' },
    { id: 'team', no: '03', name: '모둠·점수', desc: '모둠을 나누고 함께 점수를 쌓아요' },
    { id: 'mood', no: '04', name: '교실 분위기', desc: '목소리 크기와 집중 환경을 살펴요' },
    { id: 'share', no: '05', name: '나눔', desc: '링크와 자료를 아이들에게 바로 건네요' },
  ];
  const TOOLS = [];
  const register = (def) => TOOLS.push(def);

  /* 슬라이더 채움 색 */
  const rangeFill = (r) => { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); };
  document.addEventListener('input', (e) => { if (e.target.type === 'range') rangeFill(e.target); });
  const initRanges = (el) => el.querySelectorAll('input[type=range]').forEach(rangeFill);

  window.SD = { ico, store, roster, audio, $, $$, esc, shuffle, rand, lines, uid, numbered, PALETTE, WHEEL, toast, fitCanvas, confetti, GROUPS, TOOLS, register, initRanges };
})();
