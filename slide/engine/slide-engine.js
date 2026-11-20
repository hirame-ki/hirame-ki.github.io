/*! Slide Engine v1.2.0 | 수업 슬라이드 엔진 | MIT */
(function () {
'use strict';
if (window.SlideEngine) return;
var VERSION = '1.2.0', D = document, W = window;
var SRC = (D.currentScript && D.currentScript.src) || '';
var CDN = {
  katexCss: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
  katexJs: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
  qr: 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js',
  gf: 'https://fonts.googleapis.com/css2?display=swap&family='
};
var FONTS = { rounded: 'Gowun+Dodum', cute: 'Jua', serif: 'Noto+Serif+KR:wght@700;900', heavy: 'Black+Han+Sans', ja: 'Noto+Sans+JP:wght@400;700', zh: 'Noto+Sans+SC:wght@400;700' };

/* 아이콘: "닫힌 도형|선" (24×24, 엔진 자체 제작) */
var C9 = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z';
var IC = {
  book: 'M12 6.5C10 5 7 4.5 3.5 4.5v13c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-13C17 4.5 14 5 12 6.5z|M12 6.5v13',
  pencil: 'M4 20l1.2-4.8L16.5 3.9a1.9 1.9 0 0 1 2.7 0l.9.9a1.9 1.9 0 0 1 0 2.7L8.8 18.8 4 20z|M14.5 6l3.5 3.5',
  bulb: 'M12 3a6 6 0 0 0-3.8 10.6c.6.6.8 1.3.8 2.4h6c0-1.1.2-1.8.8-2.4A6 6 0 0 0 12 3z|M9.5 19h5M10.5 21.5h3',
  question: C9 + '|M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.5-1.2 1-1.2 1.9M12 16.8v.2',
  check: '|M5 12.5l4.5 4.5L19 7.5',
  x: '|M6 6l12 12M18 6L6 18',
  clock: C9 + '|M12 7.5V12l3 2',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z|M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6M15.5 4.3a3.5 3.5 0 0 1 0 6.4M17.5 14.4c2.3.9 4 3 4 5.6',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M4 21c0-3.9 3.6-7 8-7s8 3.1 8 7',
  chat: 'M4 5h16v11.5H10L5.5 20v-3.5H4z|M8 9.5h8M8 12.5h5',
  globe: C9 + '|M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z',
  map: 'M9 4L3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z|M9 4v13.5M15 6.5V20',
  calendar: 'M4 5.5h16v15H4z|M4 10h16M8 3.5v4M16 3.5v4',
  star: 'M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z|',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z|',
  flag: 'M5.5 4.5h12l-2.5 4 2.5 4h-12z|M5.5 21V4',
  target: C9 + '|M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.9v.2',
  chart: '|M4 4v16h16M8.5 16v-4.5M12.5 16V8M16.5 16v-6.5',
  search: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z|M16 16l4.5 4.5',
  camera: 'M3.5 8H7l1.5-2.5h7L17 8h3.5v11.5h-17z|M12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  music: 'M6.5 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM16.5 13.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z|M9 18V5.5l10-2V16',
  film: 'M3.5 4.5h17v15h-17z|M7.5 4.5v15M16.5 4.5v15M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4',
  home: 'M5.5 10v10h13V10L12 4.5z|M3.5 11.5L12 4.5l8.5 7M10 20v-5.5h4V20',
  leaf: 'M5 19C5 10.5 10.5 5 20 5c0 9-5 14-13 14z|M5 19c2.5-4 5.5-6.5 9.5-8.5',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z|M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
  cloud: 'M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.3 3.9 3.9 0 0 1-.4 7.7z|',
  water: 'M12 3s6.5 6.6 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z|M9 14.5a3 3 0 0 0 3 3',
  fire: 'M12 3c.5 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2 .8-3.5 2-4.5.2 1.5.8 2.3 1.8 2.6C9.8 8.5 10.5 5.5 12 3z|',
  school: 'M2.5 9L12 4.5 21.5 9 12 13.5z|M6.5 11.5V16c1.5 1.3 3.4 2 5.5 2s4-.7 5.5-2v-4.5M21.5 9v5.5',
  trophy: 'M8 4h8v5.5a4 4 0 0 1-8 0z|M8 5.5H4.5c0 3 1.2 4.5 3.5 5M16 5.5h3.5c0 3-1.2 4.5-3.5 5M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z',
  puzzle: 'M4 8.5h4.2a2.3 2.3 0 1 1 3.6 0H16v4.2a2.3 2.3 0 1 0 0 3.6V20.5H4z|',
  key: 'M8 11.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z|M11 12.5l9-9M16.5 7L19 9.5M13.5 10l2 2',
  link: '|M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  list: '|M9 6h11M9 12h11M9 18h11M4.5 6h.1M4.5 12h.1M4.5 18h.1',
  'arrow-right': '|M4 12h16M13 5l7 7-7 7',
  quote: 'M4.5 17.5V14c0-3.5 1.5-6 4.5-7.5V9c-1.2.8-1.8 2-1.8 3.5h2.3v5zM13.5 17.5V14c0-3.5 1.5-6 4.5-7.5V9c-1.2.8-1.8 2-1.8 3.5h2.3v5z|',
  info: C9 + '|M12 11v5.5M12 7.4v.2',
  alert: 'M12 4l9.5 16h-19z|M12 10v4.5M12 17.2v.2',
  gift: 'M3.5 8.5h17v4h-17zM5 12.5h14v8H5z|M12 8.5v12M12 8.5C10.5 5.5 7 5 7 7s2 1.5 5 1.5zM12 8.5C13.5 5.5 17 5 17 7s-2 1.5-5 1.5z',
  scale: 'M2.5 13.5L5 7.5l2.5 6a2.5 2.5 0 0 1-5 0zM16.5 13.5l2.5-6 2.5 6a2.5 2.5 0 0 1-5 0z|M12 4.5V20M7.5 20h9M5 7.5h14',
  image: 'M4 5.5h16v13H4z|M4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15 9.2v.2',
  grid: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z|',
  expand: '|M4.5 9.5v-5h5M19.5 9.5v-5h-5M4.5 14.5v5h5M19.5 14.5v5h-5',
  left: '|M14.5 5.5L8 12l6.5 6.5',
  right: '|M9.5 5.5L16 12l-6.5 6.5',
  note: 'M5 4.5h14v15H5z|M8.5 9h7M8.5 12.5h7M8.5 16h4'
};
function svg(name) {
  var p = (IC[name] || IC.info).split('|');
  return '<svg viewBox="0 0 24 24" aria-hidden="true" data-se>' + (p[0] ? '<path class="f" d="' + p[0] + '"/><path d="' + p[0] + '"/>' : '') + (p[1] ? '<path d="' + p[1] + '"/>' : '') + '</svg>';
}

/* 도우미 */
function $(s, r) { return (r || D).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
function h(tag, a) {
  var e = D.createElement(tag), i, n, v, k;
  e.setAttribute('data-se', '');
  for (n in a || {}) {
    v = a[n];
    if (v == null || v === false) continue;
    if (n === 'class') e.className = v;
    else if (n === 'text') e.textContent = v;
    else if (n === 'html') e.innerHTML = v;
    else if (n.slice(0, 2) === 'on') e.addEventListener(n.slice(2), v);
    else e.setAttribute(n, v === true ? '' : v);
  }
  for (i = 2; i < arguments.length; i++) {
    k = arguments[i];
    (Array.isArray(k) ? k : [k]).forEach(function (c) { if (c != null) e.append(c); });
  }
  return e;
}
function setA(e, n, v) {
  if (!e.hasAttribute(n)) e.setAttribute('data-se-a', ((e.getAttribute('data-se-a') || '') + ' ' + n).trim());
  e.setAttribute(n, v);
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function load(src, css) {
  return new Promise(function (ok, no) {
    var e = css ? h('link', { rel: 'stylesheet', href: src }) : h('script', { src: src });
    e.onload = ok; e.onerror = no; D.head.append(e);
  });
}
function store(k, v) {
  if (W.location.protocol === 'about:') return null;
  try { if (v === undefined) return W.sessionStorage.getItem(k); W.sessionStorage.setItem(k, v); } catch (e) { return null; }
}
function btn(label, fn, cls) { return h('button', { type: 'button', class: 'se-btn ' + (cls || ''), text: label, onclick: fn }); }
function uibtn(label, fn, cls) { return h('button', { type: 'button', class: 'se-ui-btn ' + (cls || ''), text: label, onclick: fn }); }

function start() {
  var deck = $('main.deck') || $('.deck');
  if (!deck) return;
  var html = D.documentElement;
  var slides = $$('section.slide', deck).filter(function (s) { return !s.classList.contains('handout'); });
  var N = slides.length;
  if (!N) return;
  var mq = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduce() { return mq.matches || deck.getAttribute('data-motion') === 'none'; }
  var fa = deck.getAttribute('data-features');
  var F = {};
  (fa == null ? 'stagger draw pen zoom edit overview help progress' : fa).split(/\s+/).forEach(function (f) { if (f) { F[f] = 1; deck.classList.add('se-f-' + f); } });
  function has(f) { return !!F[f]; }
  var W0 = deck.getAttribute('data-ratio') === '4:3' ? 1440 : 1920;
  var K = { slow: 1.4, fast: 0.7 }[deck.getAttribute('data-speed')] || 1;
  var cur = -1, trT = 0, top = null, editing = false, dirty = false;
  var pen = { on: false, paths: {}, color: '', w: 6 };
  var ui = {};
  /* 테마 팩: data-theme이 있으면 테마 CSS가 색·글꼴·장식·모션을 정한다 */
  var theme = deck.getAttribute('data-theme');
  var T = { title: '', tr: '', pt: '', cel: false };
  function tv(n) { return W.getComputedStyle(deck).getPropertyValue(n).trim().replace(/^["']|["']$/g, ''); }
  if (theme) { deck.removeAttribute('data-deco'); deck.classList.add('se-themed'); }
  if (deck.getAttribute('data-motion') !== 'none') deck.classList.add('se-m');

  /* ── 화면 맞춤 ── */
  function fit() {
    var r = deck.getBoundingClientRect();
    var s = Math.min(r.width / W0, r.height / 1080) || 1;
    deck.style.setProperty('--se-scale', s.toFixed(5));
  }
  function fitAll() {
    slides.forEach(function (s) {
      if (s.classList.contains('layout-fullbleed')) return;
      s.style.removeProperty('--se-fit');
      var f = 1;
      while (f > 0.8 && s.scrollHeight > s.clientHeight + 2) { f = +(f - 0.05).toFixed(2); s.style.setProperty('--se-fit', f); }
    });
  }

  /* ── 준비 ── */
  function split(elm, cls, byWord) {
    var n = 0, tw = D.createTreeWalker(elm, NodeFilter.SHOW_TEXT), nodes = [];
    while (tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach(function (t) {
      if (!t.nodeValue.trim() || t.parentNode.closest('rt,[data-se]')) return;
      var parts = byWord ? t.nodeValue.split(/(\s+)/) : Array.from(t.nodeValue), f = D.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { f.append(p); return; }
        var sp = h('span', { class: cls, text: p });
        sp.setAttribute('data-se', 'wrap');
        sp.style.setProperty('--se-c', n++);
        f.append(sp);
      });
      t.replaceWith(f);
    });
    return n;
  }
  var EXPAND = '.cards,.cols,.steps,.timeline,.goals,.agenda,.points,.refs,.stats,.map,.venn,.chart,.activity,.text,.overlay';
  function units(s) {
    var out = [];
    (function walk(p, depth) {
      Array.prototype.forEach.call(p.children, function (c) {
        if (c.hasAttribute('data-se') || c.classList.contains('notes') || c.classList.contains('step')) return;
        if (depth < 2 && c.matches(EXPAND)) walk(c, depth + 1); else out.push(c);
      });
    })(s, 0);
    return out;
  }
  function prepare() {
    var ft = deck.getAttribute('data-footer') || 'page';
    var stages = [];
    slides.forEach(function (s) { var t = s.getAttribute('data-stage'); if (t && stages.indexOf(t) < 0) stages.push(t); });
    var typed = deck.getAttribute('data-enter') === 'type';
    var lively = deck.getAttribute('data-motion') === 'lively';
    if (theme) {
      T.title = typed ? '' : tv('--t-title'); T.tr = tv('--t-transition'); T.pt = tv('--t-particles'); T.cel = tv('--t-celebrate') === '1';
      if (T.title && T.title !== 'none') deck.classList.add('se-tfx-' + T.title); else T.title = '';
    }
    slides.forEach(function (s, i) {
      setA(s, 'aria-roledescription', 'slide');
      setA(s, 'aria-label', (i + 1) + ' / ' + N);
      setA(s, 'aria-hidden', 'true');
      $$('i.ico[data-i]', s).forEach(function (e) { e.innerHTML = svg(e.getAttribute('data-i')); setA(e, 'aria-hidden', 'true'); });
      $$('.words', s).forEach(function (e) { split(e, 'se-wd', true); });
      if (typed) $$('h1,h2,.big,.q', s).forEach(function (e) { if (!e.closest('.quiz')) { split(e, 'se-ch'); e.classList.add('se-typed'); } });
      var hero = T.title && s.matches('.layout-cover,.layout-section,.layout-statement,.layout-question') ? $('h1,h2,.big,.q', s) : null;
      if (hero && !hero.classList.contains('words')) { split(hero, 'se-tw', T.title !== 'chars'); hero.classList.add('se-fx'); }
      var u = units(s);
      u.forEach(function (e, j) { e.classList.add('se-u'); e.style.setProperty('--se-i', j); });
      if (has('stagger')) s.style.setProperty('--se-gap', Math.min(lively ? 0.12 : 0.09, 0.55 / Math.max(u.length, 1)).toFixed(3) + 's');
      if (ft !== 'none') s.append(h('div', { class: 'se-foot', 'aria-hidden': 'true', text: (ft === 'page-title' && D.title ? D.title + '   ·   ' : '') + (i + 1) }));
      if (has('stage') && s.getAttribute('data-stage')) {
        s.append(h('div', { class: 'se-stagebar', 'aria-label': '수업 단계: ' + s.getAttribute('data-stage') }, stages.map(function (t) {
          return h('span', { class: t === s.getAttribute('data-stage') ? 'on' : '', text: t });
        })));
      }
      if (theme) { var dc = h('div', { class: 'se-deco', 'aria-hidden': 'true' }), k; for (k = 0; k < 6; k++) dc.append(h('i')); s.prepend(dc); }
      bgInit(s);
    });
    $$('.img-slot', deck).forEach(slotInit);
    $$('.quiz', deck).forEach(quizInit);
    $$('.blank', deck).forEach(blankInit);
    $$('.timer', deck).forEach(timerInit);
    $$('.picker', deck).forEach(pickerInit);
    $$('.tally', deck).forEach(tallyInit);
    $$('.chart', deck).forEach(chartInit);
    $$('.map', deck).forEach(mapInit);
    $$('pre.code', deck).forEach(codeInit);
    if ($('.qr', deck)) qrInit();
    if (has('math')) mathInit();
    var hf = deck.getAttribute('data-head-font'), le = deck.getAttribute('data-lang-extra');
    [hf, le].forEach(function (f) { if (FONTS[f]) D.head.append(h('link', { rel: 'stylesheet', href: CDN.gf + FONTS[f] })); });
  }

  /* ── 이동 ── */
  function stepsOf(s) { return s.__st || (s.__st = $$('.step', s)); }
  function setSteps(s, k) {
    s.__k = k;
    stepsOf(s).forEach(function (e, i) { e.classList.toggle('is-shown', i < k); });
  }
  var morphIds = {}, morphN = 0, pend = null, pendT = 0;
  function tag(s, on) {
    $$('[data-morph]', s).forEach(function (e) {
      var n = e.getAttribute('data-morph');
      if (!morphIds[n]) morphIds[n] = 'se-m-' + (++morphN);
      e.style.viewTransitionName = on ? morphIds[n] : '';
    });
  }
  function go(i, o) {
    o = o || {};
    i = Math.max(0, Math.min(N - 1, i));
    if (pend) { clearTimeout(pendT); pend(); }
    if (i === cur) return;
    var from = slides[cur], to = slides[i], back = cur > -1 && i < cur;
    var tr = (!from || o.instant || reduce()) ? 'none' : (deck.getAttribute('data-transition') || T.tr || 'fade');
    setA(deck, 'data-se-tr', tr);
    function swap() {
      if (from) { from.classList.remove('is-active'); from.setAttribute('aria-hidden', 'true'); left(from); }
      setSteps(to, o.shown ? stepsOf(to).length : 0);
      to.classList.add('is-active'); to.removeAttribute('aria-hidden');
      cur = i; entered(to);
    }
    clearTimeout(trT);
    slides.forEach(function (s) { s.classList.remove('is-leaving', 'is-entering'); });
    if (tr === 'morph' && D.startViewTransition) {
      tag(from, 1);
      var vt = D.startViewTransition(function () { tag(from, 0); swap(); tag(to, 1); });
      var done = function () { tag(to, 0); };
      vt.finished.then(done, done);
      return;
    }
    if (tr === 'none') { swap(); return; }
    deck.classList.toggle('se-back', back);
    if (tr === 'curtain') {
      if (!ui.curtain) { ui.curtain = h('div', { class: 'se-curtain', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')); deck.append(ui.curtain); }
      ui.curtain.classList.remove('on'); void ui.curtain.offsetWidth; ui.curtain.classList.add('on');
      pend = function () { pend = null; swap(); };
      pendT = setTimeout(pend, 520 * K);
      trT = setTimeout(function () { ui.curtain.classList.remove('on'); }, 1100 * K);
      return;
    }
    from.classList.add('is-leaving');
    swap();
    to.classList.add('is-entering');
    trT = setTimeout(function () { from.classList.remove('is-leaving'); to.classList.remove('is-entering'); }, (tr === 'wipe' || tr === 'iris' || tr === 'cover' ? 800 : 600) * K + 80);
  }
  function next() {
    var s = slides[cur], st = stepsOf(s);
    if (s.__k < st.length) { var e = st[s.__k++]; e.classList.add('is-shown'); counts(e); return; }
    if (cur < N - 1) go(cur + 1);
  }
  function prev() {
    var s = slides[cur], st = stepsOf(s);
    if (s.__k > 0) { st[--s.__k].classList.remove('is-shown'); return; }
    if (cur > 0) go(cur - 1, { shown: true });
  }
  function left(s) {
    if (s.__pt) s.__pt.stop();
  }
  function entered(s) {
    if (ui.progress) ui.progress.style.setProperty('--se-v', (N > 1 ? cur / (N - 1) * 100 : 100) + '%');
    if (ui.count) ui.count.textContent = (cur + 1) + ' / ' + N;
    try { W.history.replaceState(null, '', '#' + (cur + 1)); } catch (e) {}
    store('se:last:' + W.location.pathname, String(cur));
    var t = $('h1,h2,.big,.q', s);
    ui.live.textContent = (cur + 1) + ' / ' + N + (t ? ': ' + t.textContent.trim() : '');
    counts(s);
    if (s.__pt) s.__pt.start();
    if (ui.notes) notesFill();
    penRedraw();
    presenterFill();
  }

  /* ── 숫자 올라가기 ── */
  function counts(root) {
    var list = $$('.count[data-to]', root);
    if (root.matches && root.matches('.count[data-to]')) list.push(root);
    list.forEach(function (e) {
      if (e.closest('.step:not(.is-shown)')) return;
      var raw = String(e.getAttribute('data-to')).replace(/,/g, ''), to = parseFloat(raw);
      if (isNaN(to)) return;
      var dec = (raw.split('.')[1] || '').length;
      if (e.__fin == null) { e.__fin = e.textContent.trim(); e.__grp = !e.__fin || /,/.test(e.__fin); if (!e.__fin) e.__fin = fmt(to); }
      function fmt(v) { return e.__grp ? v.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec); }
      clearInterval(e.__iv);
      if (reduce()) { e.textContent = e.__fin; return; }
      var t0 = Date.now(), dur = 1000 * K;
      e.textContent = fmt(0);
      e.__iv = setInterval(function () {
        var p = Math.min(1, (Date.now() - t0) / dur);
        e.textContent = p < 1 ? fmt(to * (1 - Math.pow(1 - p, 3))) : e.__fin;
        if (p >= 1) clearInterval(e.__iv);
      }, 32);
    });
  }

  /* ── 배경 움직임 ── */
  function bgInit(s) {
    var m = deck.getAttribute('data-bg-motion'), hero = s.matches('.layout-cover,.layout-section,.layout-question' + (theme ? ',.layout-statement' : ''));
    if (m == null && theme && T.pt && T.pt !== 'none') m = 'particles';
    if (!m || m === 'none' || !hero) return;
    var b = h('div', { class: 'se-bg ' + m, 'aria-hidden': 'true' }), i;
    if (m === 'particles') {
      var c = h('canvas', { width: 960, height: 540 });
      b.append(c); s.__pt = particles(c, T.pt && T.pt !== 'none' ? T.pt : 'dust');
    } else for (i = 0; i < (m === 'flow' ? 2 : 4); i++) b.append(h('i'));
    s.prepend(b);
  }
  /* 입자: dust(떠오르는 점) · stars(반짝이는 별) · snow(눈) · petals(꽃잎) · bubbles(물방울) · confetti(색종이) */
  function particles(c, mode) {
    var ctx = c.getContext('2d'), raf = 0, on = false, P = [], i, t = 0, C = null;
    var fall = mode === 'snow' || mode === 'petals' || mode === 'confetti';
    var n = mode === 'stars' ? 80 : mode === 'bubbles' ? 18 : 28;
    function mk(p, init) {
      p.x = Math.random() * 960; p.y = init ? Math.random() * 540 : (fall ? -14 : 554);
      p.r = mode === 'stars' ? 0.5 + Math.random() * 1.9 : mode === 'bubbles' ? 5 + Math.random() * 16 : 2 + Math.random() * 5;
      p.a = Math.random() * 6.283; p.s = 0.5 + Math.random(); p.c = Math.floor(Math.random() * 3);
      p.vx = mode === 'stars' ? 0 : (Math.random() - 0.5) * (fall ? 0.3 : 0.22);
      p.vy = mode === 'stars' ? 0 : fall ? 0.22 + Math.random() * 0.4 : -(0.05 + Math.random() * 0.2) * (mode === 'bubbles' ? 2 : 1);
      return p;
    }
    for (i = 0; i < n; i++) P.push(mk({}, true));
    function draw() {
      if (!C) { var cs = W.getComputedStyle(deck), g = function (k, d) { return cs.getPropertyValue(k).trim() || d; }; C = [g('--accent', '#FF5A36'), g('--accent-2', '#1E2A44'), g('--ink', '#16181B')]; }
      t += 0.016;
      ctx.clearRect(0, 0, 960, 540);
      P.forEach(function (p) {
        p.x += p.vx + (fall ? Math.sin(t * p.s + p.a) * 0.25 : 0); p.y += p.vy;
        if (p.y < -16 || p.y > 556) mk(p, false);
        if (p.x < -16) p.x = 974; if (p.x > 976) p.x = -14;
        if (mode === 'stars') {
          ctx.fillStyle = ctx.strokeStyle = C[2]; ctx.globalAlpha = 0.2 + 0.7 * Math.abs(Math.sin(t * p.s * 0.9 + p.a));
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
          if (p.r > 2) { ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(p.x - p.r * 3, p.y); ctx.lineTo(p.x + p.r * 3, p.y); ctx.moveTo(p.x, p.y - p.r * 3); ctx.lineTo(p.x, p.y + p.r * 3); ctx.stroke(); }
        } else if (mode === 'bubbles') {
          ctx.strokeStyle = C[0]; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.stroke();
        } else if (mode === 'petals' || mode === 'confetti') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a + t * p.s * (mode === 'confetti' ? 1.6 : 0.7));
          ctx.fillStyle = C[mode === 'confetti' ? p.c : p.c % 2]; ctx.globalAlpha = mode === 'confetti' ? 0.85 : 0.5;
          ctx.beginPath();
          if (mode === 'confetti') ctx.rect(-p.r, -p.r * 0.5, p.r * 2, p.r); else ctx.ellipse(0, 0, p.r * 1.5, p.r * 0.75, 0, 0, 6.2832);
          ctx.fill(); ctx.restore();
        } else {
          ctx.fillStyle = mode === 'snow' ? C[2] : C[0]; ctx.globalAlpha = mode === 'snow' ? 0.55 : 0.16 + p.r / 22;
          ctx.beginPath(); ctx.arc(p.x, p.y, mode === 'snow' ? p.r * 0.7 : p.r, 0, 6.2832); ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      if (on) raf = W.requestAnimationFrame(draw);
    }
    return {
      start: function () { W.cancelAnimationFrame(raf); on = !reduce(); draw(); },
      stop: function () { on = false; W.cancelAnimationFrame(raf); }
    };
  }
  /* 정답 축하: 색종이가 터진다 (생동감 있게 · 테마가 켠 경우) */
  function burst(el) {
    if (reduce() || !el) return;
    var r = el.getBoundingClientRect(), d = deck.getBoundingClientRect(), i, a, v, pc;
    var box = h('div', { class: 'se-burst', 'aria-hidden': 'true' });
    box.style.left = (r.left + Math.min(r.width / 2, 120) - d.left) + 'px'; box.style.top = (r.top + r.height / 2 - d.top) + 'px';
    for (i = 0; i < 30; i++) {
      pc = h('i'); a = Math.random() * 6.283; v = 140 + Math.random() * 300;
      pc.style.cssText = '--dx:' + (Math.cos(a) * v).toFixed(0) + 'px;--dy:' + (Math.sin(a) * v - 140).toFixed(0) + 'px;--r:' + (Math.random() * 720 - 360).toFixed(0) + 'deg;animation-delay:' + (Math.random() * 0.08).toFixed(2) + 's';
      box.append(pc);
    }
    deck.append(box);
    setTimeout(function () { box.remove(); }, 1600);
  }

  /* ── 겹쳐 뜨는 창 ── */
  function toast(msg) {
    if (ui.toast) ui.toast.remove();
    ui.toast = h('div', { class: 'se-toast se-ui', role: 'status', text: msg });
    deck.append(ui.toast);
    var t = ui.toast;
    setTimeout(function () { t.remove(); }, 3200);
  }
  function open(name, el, onClose) {
    close();
    top = { name: name, el: el, back: D.activeElement, onClose: onClose };
    deck.append(el);
    var f = $('button,[tabindex]', el);
    if (f) f.focus();
  }
  function close() {
    if (!top) return false;
    var t = top; top = null;
    t.el.remove();
    if (t.onClose) t.onClose();
    if (t.back && t.back.focus && D.contains(t.back)) t.back.focus();
    return true;
  }
  function toggle(name, build) {
    if (top && top.name === name) { close(); return; }
    build();
  }
  function trap(e) {
    if (!top || e.key !== 'Tab') return;
    var f = $$('button,[tabindex="0"],a[href]', top.el);
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && D.activeElement === a) { z.focus(); e.preventDefault(); }
    else if (!e.shiftKey && D.activeElement === z) { a.focus(); e.preventDefault(); }
  }

  var KEYS = [
    ['다음 · 이전', '→ Space · ←', ''], ['처음 · 끝', 'Home · End', ''], ['원하는 장으로', '숫자 + Enter', ''], ['전체 화면', 'F', ''],
    ['전체 보기', 'O', 'overview'], ['발표자 노트', 'N', ''], ['발표자 화면', 'P', 'presenter'], ['글자 고치기 · 저장', 'E · Ctrl+S', 'edit'],
    ['판서 펜 · 지우기', 'D · C', 'pen'], ['스포트라이트', 'L', 'spotlight'], ['검은 화면 · 흰 화면', 'B · W', ''], ['고대비', 'H', 'hc'],
    ['단축키 안내', '?', 'help'], ['열린 것 닫기', 'Esc', '']
  ];
  function help() {
    toggle('help', function () {
      var list = h('ul', { class: 'se-keys' }, KEYS.filter(function (k) { return !k[2] || has(k[2]); }).map(function (k) {
        return h('li', null, h('span', { text: k[0] }), h('kbd', { text: k[1] }));
      }));
      var row = h('div', { class: 'se-row' });
      if (!has('noprint')) row.append(uibtn('PDF·인쇄', function () { close(); W.print(); }));
      if ($('.handout', deck)) row.append(uibtn('학습지 인쇄', printHandout));
      if (has('edit') && dirty) row.append(uibtn('파일로 저장', save));
      row.append(uibtn('닫기', close, 'pri'), h('span', { class: 'se-ver', text: 'Slide Engine ' + VERSION }));
      var p = h('div', { class: 'se-panel se-ui', role: 'dialog', 'aria-modal': 'true', 'aria-label': '단축키 안내' },
        h('h2', { text: '단축키' }), h('p', { text: '화면 왼쪽을 누르면 이전, 오른쪽을 누르면 다음 장으로 가요.' }), list, row);
      var ov = h('div', { class: 'se-ov', onclick: function (e) { if (e.target === ov) close(); } }, p);
      open('help', ov);
    });
  }
  function printHandout() {
    close();
    html.classList.add('se-print-handout');
    var off = function () { html.classList.remove('se-print-handout'); W.removeEventListener('afterprint', off); };
    W.addEventListener('afterprint', off);
    W.print();
    setTimeout(off, 60000);
  }
  function thumb(s, w) {
    var box = h('div', { class: 'deck se-on se-static se-thumb' });
    Array.prototype.forEach.call(deck.attributes, function (a) { if (/^data-(?!se|features)/.test(a.name)) box.setAttribute(a.name, a.value); });
    Object.keys(F).forEach(function (f) { box.classList.add('se-f-' + f); });
    box.style.cssText = 'width:' + w + 'px;height:' + (w * 1080 / W0) + 'px;--se-ts:' + (w / W0);
    var c = s.cloneNode(true);
    c.classList.add('is-active'); c.classList.remove('is-leaving', 'is-entering');
    c.removeAttribute('aria-hidden'); c.removeAttribute('id');
    $$('[id]', c).forEach(function (e) { e.removeAttribute('id'); });
    $$('[contenteditable]', c).forEach(function (e) { e.removeAttribute('contenteditable'); });
    box.append(c);
    return box;
  }
  function overview() {
    if (!has('overview')) return;
    toggle('overview', function () {
      var grid = h('div', { class: 'se-grid' });
      var ov = h('div', { class: 'se-ov se-over se-ui', role: 'dialog', 'aria-modal': 'true', 'aria-label': '전체 보기' }, grid);
      open('overview', ov);
      var w = 320;
      slides.forEach(function (s, i) {
        var b = h('button', { type: 'button', 'aria-label': (i + 1) + '번째 장', 'aria-current': i === cur ? 'true' : null, onclick: function () { close(); go(i); } }, h('b', { text: String(i + 1) }));
        grid.append(b);
        w = b.clientWidth || w;
        b.append(thumb(s, w));
      });
      var c = $('[aria-current]', grid);
      if (c) { c.focus(); c.scrollIntoView({ block: 'center' }); }
      ov.addEventListener('keydown', function (e) {
        var bs = $$('button', grid), i = bs.indexOf(D.activeElement), cols = Math.max(1, Math.round(grid.clientWidth / (bs[0].offsetWidth + 20)));
        var d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
        if (d && i > -1) { e.preventDefault(); e.stopPropagation(); bs[Math.max(0, Math.min(bs.length - 1, i + d))].focus(); }
      });
    });
  }
  function notesFill() {
    var n = $('.notes', slides[cur]);
    ui.notes.innerHTML = '<b>발표자 노트</b>' + (n ? n.innerHTML : '이 장에는 노트가 없어요.');
  }
  function notes() {
    if (ui.notes) { ui.notes.remove(); ui.notes = null; return; }
    ui.notes = h('div', { class: 'se-notes se-ui', role: 'note' });
    deck.append(ui.notes); notesFill();
  }
  function blank(w) {
    toggle('blank' + (w ? 'w' : ''), function () {
      open('blank' + (w ? 'w' : ''), h('div', { class: 'se-blank' + (w ? ' w' : ''), tabindex: '0', 'aria-label': '가림 화면. 아무 키나 누르면 돌아가요', onclick: close }));
    });
  }
  function fullscreen() {
    try { if (D.fullscreenElement) D.exitFullscreen(); else html.requestFullscreen(); } catch (e) {}
  }
  function hc() { if (has('hc')) html.classList.toggle('se-hc'); }
  function spot() {
    if (!has('spotlight')) return;
    if (ui.spot) { ui.spot.remove(); ui.spot = null; return; }
    ui.spot = h('div', { class: 'se-spot' });
    deck.append(ui.spot);
  }
  function openZoom(node, box) {
    var ov = h('div', { class: 'se-ov se-zoom', role: 'dialog', 'aria-modal': 'true', 'aria-label': '크게 보기', tabindex: '0', onclick: close }, node);
    ov.style.overflow = 'hidden';
    open('zoom', ov);
    if (box) {
      var r = node.getBoundingClientRect(), o = ov.getBoundingClientRect();
      node.style.scale = Math.min(o.width * 0.94 / r.width, o.height * 0.94 / r.height).toFixed(4);
    }
  }

  /* ── 발표자 화면 ── */
  var pw = null, pt0 = 0, piv = 0;
  function presenter() {
    if (!has('presenter')) return;
    if (pw && !pw.closed) { pw.focus(); return; }
    try { pw = W.open('', 'se-presenter', 'width=1180,height=760'); } catch (e) { pw = null; }
    if (!pw) { toast('새 창이 막혔어요. 주소창의 팝업 허용을 눌러 주세요.'); return; }
    var css = $$('link[rel~="stylesheet"],style').map(function (n) { return n.outerHTML; }).join('');
    pw.document.open();
    pw.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>발표자 화면</title>' + css +
      '<style>html,body{height:100%;margin:0;background:#16181B!important;color:#fff;font:500 16px/1.5 "Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif}' +
      'body{display:grid;grid-template-columns:1.9fr 1fr;gap:20px;padding:20px;box-sizing:border-box}' +
      '.pv-l{font-size:13px;font-weight:700;color:#9FE870;margin:14px 0 6px}.pv-top{display:flex;gap:14px;align-items:center}' +
      '#clock{font-size:44px;font-weight:800;font-variant-numeric:tabular-nums}#pos{font-size:18px;color:#C9CEC6}' +
      '#notes{font-size:20px;line-height:1.6;overflow:auto;max-height:34vh}button{font:700 15px/1 inherit;height:44px;padding:0 20px;border-radius:999px;border:1.5px solid #fff;background:none;color:#fff;cursor:pointer}' +
      '.pv-nav{display:flex;gap:8px;margin-top:16px}.pv-nav button{flex:1}#c,#n{border-radius:10px;overflow:hidden}aside{min-width:0}</style></head>' +
      '<body><div><div id="c"></div></div><aside><div class="pv-top"><b id="clock">00:00</b><span id="pos"></span><button id="rs">시간 다시</button></div>' +
      '<div class="pv-l">다음 장</div><div id="n"></div><div class="pv-l">노트</div><div id="notes"></div>' +
      '<div class="pv-nav"><button id="pv">이전</button><button id="nx">다음</button></div></aside></body></html>');
    pw.document.close();
    var g = function (id) { return pw.document.getElementById(id); };
    g('nx').onclick = next; g('pv').onclick = prev;
    g('rs').onclick = function () { pt0 = Date.now(); };
    pw.addEventListener('keydown', function (e) { onKey(e, true); });
    pw.addEventListener('resize', presenterFill);
    pt0 = Date.now();
    clearInterval(piv);
    piv = setInterval(function () {
      if (!pw || pw.closed) { clearInterval(piv); return; }
      var t = Math.floor((Date.now() - pt0) / 1000);
      g('clock').textContent = ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + t % 60).slice(-2);
    }, 500);
    setTimeout(presenterFill, 60);
  }
  function presenterFill() {
    if (!pw || pw.closed) return;
    var d = pw.document, c = d.getElementById('c'), n = d.getElementById('n');
    if (!c) return;
    var s = slides[cur], nx = slides[cur + 1], nt = $('.notes', s);
    c.textContent = ''; n.textContent = '';
    c.append(thumb(s, Math.max(320, c.parentNode.clientWidth)));
    if (nx) n.append(thumb(nx, Math.max(200, n.parentNode.clientWidth))); else n.textContent = '마지막 장이에요.';
    d.getElementById('notes').innerHTML = nt ? nt.innerHTML : '노트가 없어요.';
    d.getElementById('pos').textContent = (cur + 1) + ' / ' + N;
  }

  /* ── 판서 펜 ── */
  function penInit() {
    pen.cv = h('canvas', { class: 'se-pen', width: W0, height: 1080, 'aria-hidden': 'true' });
    deck.append(pen.cv);
    pen.ctx = pen.cv.getContext('2d');
    var cs = getComputedStyle(deck);
    var cols = [cs.getPropertyValue('--ink').trim() || '#16181B', cs.getPropertyValue('--accent').trim() || '#FF5A36', '#E5332A'];
    pen.color = cols[0];
    var bar = h('div', { class: 'se-penbar se-ui', role: 'toolbar', 'aria-label': '판서 펜' });
    cols.forEach(function (c, i) {
      var b = h('button', { type: 'button', 'aria-label': ['기본색', '강조색', '빨강'][i], 'aria-pressed': i === 0 ? 'true' : 'false', onclick: function () {
        pen.color = c; $$('button[data-c]', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      } }, h('i'));
      b.setAttribute('data-c', ''); b.style.setProperty('--c', c); bar.append(b);
    });
    [6, 14].forEach(function (w, i) {
      var b = h('button', { type: 'button', 'aria-label': i ? '굵게' : '가늘게', 'aria-pressed': i === 0 ? 'true' : 'false', onclick: function () {
        pen.w = w; $$('button[data-w]', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      } }, h('u'));
      b.setAttribute('data-w', ''); b.style.setProperty('--h', (i ? 8 : 3) + 'px'); bar.append(b);
    });
    bar.append(h('button', { type: 'button', text: '지우기 (C)', onclick: penClear }), h('button', { type: 'button', text: '끝 (D)', onclick: penToggle }));
    pen.bar = bar;
    var path = null;
    function pos(e) { var r = pen.cv.getBoundingClientRect(); return [(e.clientX - r.left) * W0 / r.width, (e.clientY - r.top) * 1080 / r.height]; }
    pen.cv.addEventListener('pointerdown', function (e) {
      if (!pen.on) return;
      e.preventDefault(); e.stopPropagation();
      try { pen.cv.setPointerCapture(e.pointerId); } catch (x) {}
      path = { c: pen.color, w: pen.w, p: [pos(e)] };
      (pen.paths[cur] || (pen.paths[cur] = [])).push(path);
    });
    pen.cv.addEventListener('pointermove', function (e) {
      if (!path) return;
      var a = path.p[path.p.length - 1], b = pos(e);
      path.p.push(b); stroke(path, a, b);
    });
    var end = function (e) { if (path) { e.stopPropagation(); if (path.p.length === 1) { path.p.push([path.p[0][0] + 0.1, path.p[0][1]]); stroke(path, path.p[0], path.p[1]); } } path = null; };
    pen.cv.addEventListener('pointerup', end);
    pen.cv.addEventListener('pointercancel', end);
  }
  function stroke(path, a, b) {
    var c = pen.ctx;
    c.strokeStyle = path.c; c.lineWidth = path.w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }
  function penRedraw() {
    if (!pen.ctx) return;
    pen.ctx.clearRect(0, 0, W0, 1080);
    (pen.paths[cur] || []).forEach(function (p) { for (var i = 1; i < p.p.length; i++) stroke(p, p.p[i - 1], p.p[i]); });
  }
  function penClear() { pen.paths[cur] = []; penRedraw(); }
  function penToggle() {
    if (!has('pen')) return;
    if (!pen.cv) penInit();
    pen.on = !pen.on;
    pen.cv.classList.toggle('on', pen.on);
    if (pen.on) deck.append(pen.bar); else pen.bar.remove();
    if (ui.penBtn) ui.penBtn.setAttribute('aria-pressed', pen.on ? 'true' : 'false');
  }

  /* ── 편집·저장 ── */
  var ESEL = 'h1,h2,h3,p,li,td,th,cite,small,time,figcaption,.term,.meaning,.example,.center,.branch,.role,.time,.output,.overlap';
  var snap = [];
  function edit() {
    if (!has('edit')) return;
    if (editing) { editEnd(true); return; }
    close(); if (pen.on) penToggle();
    editing = true; snap = [];
    deck.classList.add('se-editing');
    $$(ESEL, deck).forEach(function (e) {
      if (e.closest('[data-se],.se-ui,.handout') || e.querySelector(ESEL) || !e.closest('.slide')) return;
      if (e.matches('.blank') || !e.textContent.trim()) return;
      snap.push([e, e.innerHTML]);
      e.setAttribute('contenteditable', 'true'); e.setAttribute('spellcheck', 'false');
    });
    ui.editbar = h('div', { class: 'se-editbar se-ui', role: 'toolbar', 'aria-label': '편집' }, h('span', { text: '글자를 눌러 고치세요' }),
      uibtn('저장', function () { save(); editEnd(true); }, 'pri'), uibtn('취소', function () { editEnd(false); }));
    deck.append(ui.editbar);
  }
  function editEnd(keep) {
    editing = false;
    deck.classList.remove('se-editing');
    snap.forEach(function (p) {
      if (!keep) p[0].innerHTML = p[1]; else if (p[0].innerHTML !== p[1]) dirty = true;
      p[0].removeAttribute('contenteditable'); p[0].removeAttribute('spellcheck');
    });
    snap = [];
    if (ui.editbar) { ui.editbar.remove(); ui.editbar = null; }
    fitAll();
  }
  function clean() {
    var r = html.cloneNode(true);
    $$('[data-se]', r).forEach(function (n) {
      var t = n.getAttribute('data-se');
      if (!n.parentNode) return;
      if (t === 'wrap') n.replaceWith.apply(n, Array.prototype.slice.call(n.childNodes));
      else if (t === 'math') n.replaceWith(n.getAttribute('data-se-src') || '');
      else n.remove();
    });
    [r].concat($$('*', r)).forEach(function (n) {
      var a = n.getAttribute('data-se-a');
      if (a) { a.split(' ').forEach(function (x) { n.removeAttribute(x); }); n.removeAttribute('data-se-a'); }
      Array.prototype.slice.call(n.classList).forEach(function (c) { if (/^(se-|is-|has-img)/.test(c)) n.classList.remove(c); });
      if (n.hasAttribute('class') && !n.classList.length) n.removeAttribute('class');
      n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck');
      if (n.hasAttribute('style')) {
        var keep = (n.getAttribute('style') || '').split(';').filter(function (d) { d = d.trim(); return d && !/^(--se-|view-transition-name)/.test(d); }).join(';');
        if (keep) n.setAttribute('style', keep); else n.removeAttribute('style');
      }
    });
    r.normalize();
    return '<!doctype html>\n' + r.outerHTML;
  }
  function save() {
    var a = h('a', { href: URL.createObjectURL(new Blob([clean()], { type: 'text/html;charset=utf-8' })), download: (D.title || 'slides').replace(/[\\/:*?"<>|]/g, '_') + '.html' });
    D.body.append(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    dirty = false;
    toast('고친 파일을 내려받았어요. 다음부터는 이 파일로 발표하세요.');
  }

  /* ── 사진 칸 ── */
  var hoverSlot = null;
  function slotInit(f) {
    var img = $('img', f), hint = f.getAttribute('data-hint') || '';
    f.classList.toggle('has-img', !!(img && img.getAttribute('src')));
    var input = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () { if (input.files[0]) put(input.files[0]); input.value = ''; } });
    var pick = function (e) { if (e) e.stopPropagation(); input.click(); };
    var canFind = deck.getAttribute('data-photo-search') !== 'off' && !!W.fetch;
    var find = function (e) { if (e) e.stopPropagation(); photoFind(f, hint); };
    var b = h('div', { class: 'se-slot-btn', onclick: pick,
      html: svg('image') + '<span>사진을 끌어다 놓거나 아래에서 고르세요</span>' + (hint ? '<small>찾을 사진: ' + esc(hint) + '</small>' : '') },
      h('span', { class: 'se-slot-acts' },
        h('button', { type: 'button', text: '내 사진 고르기', 'aria-label': '내 사진 고르기' + (hint ? ': ' + hint : ''), onclick: pick }),
        canFind ? h('button', { type: 'button', class: 'pri', text: '사진 찾기', onclick: find }) : null));
    var tools = h('div', { class: 'se-slot-tools se-ui' },
      canFind ? h('button', { type: 'button', text: '찾기', 'aria-label': '사진 찾기', onclick: find }) : null,
      h('button', { type: 'button', text: '바꾸기', onclick: pick }),
      h('button', { type: 'button', text: '지우기', onclick: function (e) { e.stopPropagation(); if (img) img.removeAttribute('src'); f.classList.remove('has-img'); credit(''); dirty = true; } }));
    var cr = h('small', { class: 'se-slot-credit', text: f.getAttribute('data-credit') || '' });
    f.append(b, tools, cr, input);
    function credit(t) { if (t) f.setAttribute('data-credit', t); else f.removeAttribute('data-credit'); cr.textContent = t; }
    if (W.ResizeObserver) new W.ResizeObserver(function () { var hh = f.clientHeight; if (hh) f.classList.toggle('is-sm', hh < 400); }).observe(f);
    function put(file, cred) {
      if (!file || !/^image\//.test(file.type)) { toast('사진 파일만 넣을 수 있어요.'); return; }
      var fr = new FileReader();
      fr.onload = function () {
        shrink(fr.result, file, function (url) {
          if (!img) { img = D.createElement('img'); img.alt = hint || '사진'; f.prepend(img); }
          img.src = url; f.classList.add('has-img'); credit(cred || '');
          if (!dirty && has('edit')) toast('사진을 넣었어요. E → 저장을 누르면 파일에 담겨요.');
          dirty = true;
        });
      };
      fr.readAsDataURL(file);
    }
    f.__put = put;
    f.addEventListener('dragover', function (e) { e.preventDefault(); f.classList.add('is-drop'); });
    f.addEventListener('dragleave', function () { f.classList.remove('is-drop'); });
    f.addEventListener('drop', function (e) { e.preventDefault(); f.classList.remove('is-drop'); put(e.dataTransfer.files[0]); });
    f.addEventListener('pointerenter', function () { hoverSlot = f; });
    f.addEventListener('pointerleave', function () { if (hoverSlot === f) hoverSlot = null; });
  }
  /* ── 사진 찾기: 위키미디어 공용의 자유 이용 사진을 찾아 파일 안에 담는다 ── */
  var WM = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiextmetadatafilter=LicenseShortName%7CArtist';
  function plain(s) { try { return (new W.DOMParser().parseFromString(String(s), 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); } catch (e) { return ''; } }
  function wmJson(u) { return W.fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
  function photoFind(f, hint) {
    var en = (hint.match(/[A-Za-z][A-Za-z0-9 ,'-]{2,}/g) || []).sort(function (a, b) { return b.length - a.length; })[0];
    var seq = 0, off = 0, busy = false;
    var inp = h('input', { type: 'search', class: 'se-pf-in', value: (en || hint).trim(), placeholder: '예: water cycle, volcano, 한옥', 'aria-label': '찾을 낱말' });
    var msg = h('p', { class: 'se-pf-msg', role: 'status' });
    var grid = h('div', { class: 'se-pf-grid' });
    var more = uibtn('더 보기', function () { run(true); });
    more.hidden = true;
    var form = h('form', { class: 'se-pf-form', onsubmit: function (e) { e.preventDefault(); run(false); } }, inp, h('button', { type: 'submit', class: 'se-ui-btn pri', text: '찾기' }));
    var p = h('div', { class: 'se-panel se-pf se-ui', role: 'dialog', 'aria-modal': 'true', 'aria-label': '사진 찾기' },
      h('h2', { text: '사진 찾기' }),
      h('p', { text: '위키미디어 공용의 자유 이용 사진이에요. 고르면 사진이 파일에 담기고 출처가 함께 적혀요. 영어로 찾으면 더 많이 나와요.' }),
      form, msg, grid, h('div', { class: 'se-row' }, more, uibtn('닫기', close)));
    var ov = h('div', { class: 'se-ov', onclick: function (e) { if (e.target === ov) close(); } }, p);
    open('photo', ov, function () { seq++; });
    inp.focus(); inp.select();
    if (inp.value) run(false);
    function run(add) {
      var q = inp.value.trim(), my = ++seq;
      if (!q) { msg.textContent = '찾을 낱말을 적어 주세요.'; return; }
      if (!add) { off = 0; grid.textContent = ''; }
      more.hidden = true; msg.textContent = '찾는 중…';
      wmJson(WM + '&generator=search&gsrnamespace=6&gsrlimit=12&gsroffset=' + off + '&iiprop=url%7Cextmetadata%7Csize%7Cmime&iiurlwidth=330&gsrsearch=' + encodeURIComponent(q + ' filetype:bitmap filew:>1000'))
        .then(function (d) {
          if (my !== seq) return;
          var pages = (d.query && d.query.pages) || {};
          Object.keys(pages).map(function (k) { return pages[k]; })
            .filter(function (x) { return x.imageinfo && x.imageinfo[0] && x.imageinfo[0].thumburl && /jpe?g|png/.test(x.imageinfo[0].mime || ''); })
            .sort(function (a, b) { return (a.index || 0) - (b.index || 0); }).forEach(card);
          off = (d['continue'] && d['continue'].gsroffset) || 0;
          more.hidden = !off;
          msg.textContent = grid.children.length ? '마음에 드는 사진을 누르세요.' : '찾은 사진이 없어요. 다른 낱말(영어)로 찾아 보세요.';
        })
        .catch(function () { if (my === seq) msg.textContent = '사진을 찾지 못했어요. 인터넷 연결을 확인해 주세요.'; });
    }
    function card(pg) {
      var ii = pg.imageinfo[0], em = ii.extmetadata || {};
      var lic = em.LicenseShortName ? plain(em.LicenseShortName.value) : '', who = em.Artist ? plain(em.Artist.value) : '';
      if (who.length > 40) who = who.slice(0, 38) + '…';
      var name = pg.title.replace(/^File:/, '').replace(/\.\w+$/, '');
      var cred = '사진: ' + [who, lic, 'Wikimedia Commons'].filter(Boolean).join(' · ');
      var c = h('button', { type: 'button', class: 'se-pf-card', title: name, onclick: function () { take(pg.title, cred, c); } },
        h('img', { src: ii.thumburl, alt: name }), h('small', { text: [lic, who].filter(Boolean).join(' · ') }));
      grid.append(c);
    }
    function take(title, cred, c) {
      if (busy) return;
      busy = true;
      var my = seq;
      c.classList.add('is-busy'); msg.textContent = '사진을 넣는 중…';
      wmJson(WM + '&iiprop=url&iiurlwidth=1280&titles=' + encodeURIComponent(title))
        .then(function (d) { var pages = d.query.pages, ii = pages[Object.keys(pages)[0]].imageinfo[0]; return W.fetch(ii.thumburl || ii.url); })
        .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (bl) { busy = false; if (my !== seq) return; close(); f.__put(bl, cred); })
        .catch(function () { busy = false; c.classList.remove('is-busy'); if (my === seq) msg.textContent = '사진을 가져오지 못했어요. 다른 사진을 골라 보세요.'; });
    }
  }
  function shrink(url, file, cb) {
    if (file.size < 600000 || /svg|gif/.test(file.type)) { cb(url); return; }
    var im = new Image();
    im.onload = function () {
      var m = Math.min(1, 1920 / Math.max(im.width, im.height)), c = D.createElement('canvas');
      c.width = Math.round(im.width * m); c.height = Math.round(im.height * m);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      try { cb(c.toDataURL('image/jpeg', 0.86)); } catch (e) { cb(url); }
    };
    im.onerror = function () { cb(url); };
    im.src = url;
  }

  /* ── 퀴즈 ── */
  function quizInit(q) {
    var ans = (q.getAttribute('data-answer') || '').trim(), kind = q.classList.contains('ox') ? 'ox' : q.classList.contains('initials') ? 'ini' : 'opt';
    var msg = h('span', { class: 'se-q-msg', 'aria-live': 'polite' });
    var row = h('div', { class: 'se-q-row' }, msg, btn('다시', reset, 'sm'));
    var why = $('.why', q), qq = $('.q', q), items = [], box;
    if (kind === 'ox') {
      box = h('div', { class: 'se-ox' }, ['O', 'X'].map(function (v) {
        var b = h('button', { type: 'button', 'aria-label': v === 'O' ? 'O, 맞아요' : 'X, 아니에요', onclick: function () { pick(v); } }, v, h('small'));
        items.push(b); return b;
      }));
      if (qq) qq.after(box); else q.prepend(box);
    } else if (kind === 'ini') {
      box = h('p', { class: 'se-ini', text: q.getAttribute('data-hint') || '' });
      if (qq) qq.after(box); else q.prepend(box);
      row.prepend(btn('정답 보기', function () { pick(ans); }, 'sm pri'));
    } else {
      items = $$('.opts > li', q);
      items.forEach(function (li, i) {
        setA(li, 'role', 'button'); setA(li, 'tabindex', '0');
        li.addEventListener('click', function () { pick(String(i + 1)); });
        li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pick(String(i + 1)); } });
      });
    }
    if (why) why.before(row); else q.append(row);
    row.style.display = 'none';
    function pick(v) {
      if (q.classList.contains('is-done')) return false;
      var ok = String(v).toUpperCase() === ans.toUpperCase();
      q.classList.add('is-done');
      row.style.display = '';
      if (kind === 'ini') { box.textContent = ans; msg.textContent = '정답: ' + ans; return true; }
      items.forEach(function (it, i) {
        var val = kind === 'ox' ? 'OX'[i] : String(i + 1);
        var right = val.toUpperCase() === ans.toUpperCase();
        it.classList.toggle('is-right', right);
        it.classList.toggle('is-wrong', !right && val === String(v));
        if (kind === 'ox') it.lastChild.textContent = right ? '정답 ✓' : (val === String(v) ? '오답 ✕' : '');
      });
      if (ok && (T.cel || deck.getAttribute('data-motion') === 'lively')) burst(items.filter(function (it) { return it.classList.contains('is-right'); })[0]);
      msg.textContent = ok ? '✓ 정답이에요' : '✕ 아쉬워요. 정답은 ' + ans + (kind === 'opt' ? '번' : '') + '이에요';
      return true;
    }
    function reset() {
      q.classList.remove('is-done'); row.style.display = 'none'; msg.textContent = '';
      items.forEach(function (it) { it.classList.remove('is-right', 'is-wrong'); if (kind === 'ox') it.lastChild.textContent = ''; });
      if (kind === 'ini') box.textContent = q.getAttribute('data-hint') || '';
    }
    q.__pick = kind === 'opt' ? pick : null;
    q.__n = items.length;
  }
  function blankInit(b) {
    var a = b.getAttribute('data-answer') || '';
    b.style.setProperty('--se-n', Math.max(2, Array.from(a).length));
    setA(b, 'role', 'button'); setA(b, 'tabindex', '0'); setA(b, 'aria-label', '빈칸. 누르면 정답이 보여요');
    var tog = function (e) {
      if (editing) return;
      e.stopPropagation();
      var o = b.classList.toggle('is-open');
      b.setAttribute('aria-label', o ? '정답: ' + a : '빈칸. 누르면 정답이 보여요');
    };
    b.addEventListener('click', tog);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(e); } });
  }

  /* ── 타이머·뽑기·손들기 ── */
  function timerInit(t) {
    var base = parseInt(t.getAttribute('data-sec'), 10) || 180, leftS = base, iv = 0, end = 0;
    var time = h('div', { class: 'se-t-time', role: 'timer' }), bar = h('div', { class: 'se-t-bar' }, h('i'));
    var bS = btn('시작', tog, 'pri'), bR = btn('다시', reset);
    var row = h('div', { class: 'se-t-row' }, bS, bR, [60, 180, 300, 600].map(function (s) { return btn(s / 60 + '분', function () { base = s; reset(); }, 'sm'); }));
    t.append(time, bar, row);
    function draw() {
      var s = Math.ceil(leftS);
      time.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2);
      bar.firstChild.style.setProperty('--se-v', (leftS / base * 100) + '%');
    }
    function stop() { clearInterval(iv); iv = 0; bS.textContent = '시작'; }
    function tog() {
      if (iv) { stop(); return; }
      if (leftS <= 0) leftS = base;
      t.classList.remove('is-end');
      end = Date.now() + leftS * 1000; bS.textContent = '멈춤';
      iv = setInterval(function () {
        leftS = Math.max(0, (end - Date.now()) / 1000); draw();
        if (leftS <= 0) { stop(); t.classList.add('is-end'); time.textContent = '끝!'; }
      }, 200);
    }
    function reset() { stop(); leftS = base; t.classList.remove('is-end'); draw(); }
    draw();
  }
  function pickerInit(p) {
    var min = parseInt(p.getAttribute('data-min'), 10), max = parseInt(p.getAttribute('data-max'), 10);
    if (isNaN(min)) min = 1; if (isNaN(max)) max = 30; if (max < min) { var x = min; min = max; max = x; }
    var pool = [], done = [], iv = 0;
    var num = h('div', { class: 'se-p-num', 'aria-live': 'polite', text: '?' }), list = h('div', { class: 'se-p-list' });
    var bP = btn('뽑기', draw, 'pri'), bR = btn('초기화', reset, 'sm');
    p.append(num, h('div', { class: 'se-p-side' }, h('div', { class: 'se-t-row' }, bP, bR), list));
    function reset() { clearInterval(iv); pool = []; done = []; for (var i = min; i <= max; i++) pool.push(i); num.textContent = '?'; list.textContent = min + '번부터 ' + max + '번까지'; bP.disabled = false; }
    function show(v) { num.textContent = v; done.push(v); list.textContent = '뽑힌 번호: ' + done.join(', '); bP.disabled = !pool.length; }
    function draw() {
      if (!pool.length || iv) return;
      var v = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (reduce()) { show(v); return; }
      var t0 = Date.now(); bP.disabled = true;
      iv = setInterval(function () {
        if (Date.now() - t0 > 1000) { clearInterval(iv); iv = 0; show(v); return; }
        num.textContent = min + Math.floor(Math.random() * (max - min + 1));
      }, 70);
    }
    reset();
  }
  function tallyInit(t) {
    var opts = (t.getAttribute('data-options') || '찬성,반대').split(',').map(function (s) { return s.trim(); }).filter(Boolean), n = opts.map(function () { return 0; }), rows = [];
    opts.forEach(function (o, i) {
      var fill = h('i'), cnt = h('b', { 'aria-live': 'polite', text: '0' });
      var row = h('div', { class: 'se-ty' }, h('span', { class: 'se-ty-l', text: o }), h('div', { class: 'se-ty-t' }, fill),
        h('div', { class: 'se-ty-c' }, h('button', { type: 'button', 'aria-label': o + ' 한 명 빼기', text: '−', onclick: function () { n[i] = Math.max(0, n[i] - 1); draw(); } }), cnt,
          h('button', { type: 'button', 'aria-label': o + ' 한 명 더하기', text: '+', onclick: function () { n[i]++; draw(); } })));
      rows.push([row, fill, cnt]); t.append(row);
    });
    function draw() {
      var m = Math.max.apply(null, n);
      rows.forEach(function (r, i) { r[1].style.setProperty('--se-v', (m ? n[i] / m * 100 : 0) + '%'); r[2].textContent = n[i]; r[0].classList.toggle('is-top', m > 0 && n[i] === m); });
    }
  }

  /* ── 그래프·개념도·코드·QR·수식 ── */
  function chartInit(c) {
    var bars = $$('.bar', c), unit = c.getAttribute('data-unit') || '';
    var vals = bars.map(function (b) { return parseFloat(b.getAttribute('data-value')) || 0; });
    if (!bars.length) return;
    if (c.getAttribute('data-type') === 'ratio') {
      var sum = vals.reduce(function (a, b) { return a + b; }, 0) || 1;
      var track = h('div', { class: 'se-ratio', role: 'img', 'aria-label': bars.map(function (b, i) { return b.getAttribute('data-label') + ' ' + Math.round(vals[i] / sum * 100) + '%'; }).join(', ') });
      var legend = h('div', { class: 'se-legend' });
      bars.forEach(function (b, i) {
        var seg = h('i', { class: 'se-seg' });
        seg.style.setProperty('--se-v', (vals[i] / sum * 100) + '%');
        track.append(seg);
        var sw = h('i', { class: 'se-seg' });
        legend.append(h('span', null, sw, b.getAttribute('data-label') + ' ', h('b', { text: (b.getAttribute('data-value') || '') + unit })));
        sw.style.cssText = 'width:44px;flex:none';
        sw.setAttribute('data-n', i + 1);
        b.style.display = 'none'; b.setAttribute('data-se-a', ((b.getAttribute('data-se-a') || '') + ' style').trim());
      });
      c.append(track, legend);
      $$('.se-legend .se-seg', c).forEach(function (sw, i) {
        var src = getComputedStyle(track.children[i]);
        sw.style.backgroundColor = src.backgroundColor; sw.style.backgroundImage = src.backgroundImage; sw.style.backgroundSize = src.backgroundSize;
      });
      return;
    }
    var max = Math.max.apply(null, vals) || 1;
    if (!bars.some(function (b) { return b.classList.contains('hl'); })) bars[vals.indexOf(max)].classList.add('is-auto', 'hl');
    bars.forEach(function (b, i) {
      var f = h('span', { class: 'se-bf' });
      f.style.setProperty('--se-v', (vals[i] / max * 100) + '%');
      b.append(h('span', { class: 'se-bl', text: b.getAttribute('data-label') || '' }), h('span', { class: 'se-bt' }, f, h('span', { class: 'se-bv', text: (b.getAttribute('data-value') || '') + unit })));
    });
  }
  function mapInit(m) {
    var c = $('.center', m), br = $$('.branch', m), n = br.length;
    if (!c || !n) return;
    var svgEl = D.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('data-se', ''); svgEl.setAttribute('viewBox', '0 0 100 100'); svgEl.setAttribute('preserveAspectRatio', 'none'); svgEl.setAttribute('aria-hidden', 'true');
    var a0 = n % 2 ? -90 : -90 + 180 / n;
    c.style.setProperty('--se-x', '50%'); c.style.setProperty('--se-y', '50%');
    br.forEach(function (b, i) {
      var a = (a0 + i * 360 / n) * Math.PI / 180, x = 50 + 37 * Math.cos(a), y = 50 + 36 * Math.sin(a);
      b.style.setProperty('--se-x', x.toFixed(2) + '%'); b.style.setProperty('--se-y', y.toFixed(2) + '%');
      var l = D.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', 50); l.setAttribute('y1', 50); l.setAttribute('x2', x.toFixed(2)); l.setAttribute('y2', y.toFixed(2));
      l.setAttribute('pathLength', 1); l.setAttribute('vector-effect', 'non-scaling-stroke');
      svgEl.append(l);
    });
    m.prepend(svgEl);
    m.classList.add('se-map');
  }
  var KW = 'def|class|return|if|elif|else|for|while|in|import|from|as|try|except|finally|with|lambda|True|False|None|and|or|not|function|var|let|const|new|this|null|true|false|public|static|void|int|float|double|string|bool|break|continue|print|input|range';
  function codeInit(pre) {
    var lang = (pre.getAttribute('data-lang') || '').toLowerCase(), plain = /^(html|css|xml|text|txt|)$/.test(lang);
    var lines = pre.textContent.replace(/^\n|\n\s*$/g, '').split('\n');
    var re = new RegExp('(#.*$|//.*$)|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(' + KW + ')\\b', 'g');
    function w(cls, text) { var s = h('span', { class: cls, text: text }); s.setAttribute('data-se', 'wrap'); return s; }
    pre.textContent = '';
    lines.forEach(function (line, i) {
      var ln = w('se-cl', ''), last = 0, m;
      if (!plain) {
        re.lastIndex = 0;
        while ((m = re.exec(line))) {
          if (m.index > last) ln.append(line.slice(last, m.index));
          ln.append(w(m[1] ? 'se-c' : m[2] ? 'se-s' : m[3] ? 'se-n' : 'se-k', m[0]));
          last = m.index + m[0].length;
        }
      }
      ln.append(line.slice(last) + (i < lines.length - 1 ? '\n' : ''));
      pre.append(ln);
    });
  }
  function qrInit() {
    function fallback(q) { q.append(h('div', { class: 'se-qr-url', text: q.getAttribute('data-url') || '' })); }
    load(CDN.qr).then(function () {
      $$('.qr', deck).forEach(function (q) {
        var url = q.getAttribute('data-url') || '';
        try {
          var g = W.qrcode(0, 'M'); g.addData(url); g.make();
          var n = g.getModuleCount(), d = '', r, c;
          for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (g.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
          q.append(h('div', { html: '<svg viewBox="0 0 ' + n + ' ' + n + '" role="img" aria-label="QR 코드: ' + esc(url) + '" shape-rendering="crispEdges"><path d="' + d + '" fill="#000"/></svg>' }));
        } catch (e) {}
        fallback(q);
      });
    }, function () { $$('.qr', deck).forEach(fallback); });
  }
  function mathInit() {
    Promise.all([load(CDN.katexCss, 1), load(CDN.katexJs)]).then(function () {
      $$('section', deck).forEach(function (s) {
        var tw = D.createTreeWalker(s, NodeFilter.SHOW_TEXT), ns = [];
        while (tw.nextNode()) if (/\\\(|\\\[/.test(tw.currentNode.nodeValue)) ns.push(tw.currentNode);
        ns.forEach(function (t) {
          if (t.parentNode.closest('pre,[data-se]')) return;
          var f = D.createDocumentFragment();
          t.nodeValue.split(/(\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/).forEach(function (p) {
            var m = /^\\([(\[])([\s\S]+)\\[)\]]$/.exec(p);
            if (!m) { f.append(p); return; }
            var sp = h('span', { class: m[1] === '[' ? 'se-math-block' : 'se-math' });
            sp.setAttribute('data-se', 'math'); sp.setAttribute('data-se-src', p);
            try { sp.innerHTML = W.katex.renderToString(m[2], { displayMode: m[1] === '[', throwOnError: false }); } catch (e) { sp.textContent = p; }
            f.append(sp);
          });
          t.replaceWith(f);
        });
      });
      fitAll();
    }, function () {});
  }

  /* ── 키보드·포인터 ── */
  var numBuf = '', numT = 0;
  function activeQuiz() {
    return $$('.quiz', slides[cur]).filter(function (q) { return q.__pick && !q.classList.contains('is-done') && !q.closest('.step:not(.is-shown)'); })[0];
  }
  function onKey(e, remote) {
    if (e.defaultPrevented) return;
    var t = e.target, k = e.key, code = e.code || '';
    var typing = !remote && t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''));
    if ((e.ctrlKey || e.metaKey) && code === 'KeyS' && (editing || dirty) && has('edit')) { e.preventDefault(); save(); if (editing) editEnd(true); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === 'Escape') {
      if (close() || (editing && (editEnd(false), 1)) || (pen.on && (penToggle(), 1)) || (ui.spot && (spot(), 1)) || (ui.notes && (notes(), 1))) e.preventDefault();
      return;
    }
    if (editing) {
      if (k === 'Enter' && typing) { e.preventDefault(); try { D.execCommand('insertLineBreak'); } catch (x) {} }
      if (k === 'PageDown') { e.preventDefault(); next(); } else if (k === 'PageUp') { e.preventDefault(); prev(); }
      return;
    }
    if (typing) return;
    if (top) {
      trap(e);
      if (top && /^blank/.test(top.name)) { close(); e.preventDefault(); return; }
      var same = top && { overview: 'KeyO', help: 'Slash' }[top.name];
      if (same && code === same) { close(); e.preventDefault(); }
      return;
    }
    if (!remote && t && t.closest && t.closest('button,a,[role="button"],summary') && (k === 'Enter' || k === ' ')) return;
    var L = /^Key[A-Z]$/.test(code) ? code.slice(3).toLowerCase() : (k.length === 1 ? k.toLowerCase() : '');
    var hit = true;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar') next();
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') prev();
    else if (k === 'Enter') { if (numBuf) { go(parseInt(numBuf, 10) - 1); numBuf = ''; } else next(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(N - 1);
    else if (/^[0-9]$/.test(k)) {
      var q = !numBuf && activeQuiz();
      if (q && +k >= 1 && +k <= q.__n) q.__pick(k);
      else { numBuf += k; clearTimeout(numT); numT = setTimeout(function () { numBuf = ''; }, 1800); }
    }
    else if (k === '?' || (code === 'Slash' && e.shiftKey)) { if (has('help')) help(); }
    else if (L === 'f') fullscreen();
    else if (L === 'o') overview();
    else if (L === 'n') notes();
    else if (L === 'p') presenter();
    else if (L === 'e') edit();
    else if (L === 'd') penToggle();
    else if (L === 'c') { if (pen.cv) penClear(); }
    else if (L === 'l') spot();
    else if (L === 'b') blank(false);
    else if (L === 'w') blank(true);
    else if (L === 'h') hc();
    else hit = false;
    if (hit) e.preventDefault();
  }
  var ISEL = 'a,button,input,select,textarea,label,[role="button"],[contenteditable],.se-ui,.blank,.quiz,.img-slot,.timer,.picker,.tally,.qr,pre.code,.se-ov';
  var pd = null, barT = 0;
  function showBar() {
    if (!ui.bar) return;
    ui.bar.classList.add('on');
    clearTimeout(barT);
    barT = setTimeout(function () { ui.bar.classList.remove('on'); }, 2600);
  }
  function bind() {
    D.addEventListener('keydown', onKey);
    deck.addEventListener('pointerdown', function (e) { pd = { x: e.clientX, y: e.clientY, type: e.pointerType, t: e.target }; });
    deck.addEventListener('pointerup', function (e) {
      var p = pd; pd = null;
      if (!p || top || editing || pen.on || e.button > 0) return;
      if (p.t.closest && (p.t.closest(ISEL) || (has('zoom') && p.t.closest('table')))) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); return; }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
      var r = deck.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      if (x < 1 / 3) prev(); else if (p.type === 'mouse' || x > 2 / 3) next(); else showBar();
    });
    deck.addEventListener('pointermove', function (e) {
      if (ui.spot) { var r = deck.getBoundingClientRect(); ui.spot.style.setProperty('--x', (e.clientX - r.left) + 'px'); ui.spot.style.setProperty('--y', (e.clientY - r.top) + 'px'); }
      if (e.pointerType === 'mouse' && (Math.abs(e.movementX) + Math.abs(e.movementY) > 1)) showBar();
    });
    deck.addEventListener('click', function (e) {
      if (!has('zoom') || top || editing || pen.on) return;
      var im = e.target.closest('.img-slot.has-img > img'), tb = !im && e.target.closest('.slide table');
      if (im) openZoom(h('img', { src: im.src, alt: im.alt }));
      else if (tb) {
        var box = h('div', { class: 'se-zoom-box' });
        box.style.width = (tb.offsetWidth + 96) + 'px';
        box.append(tb.cloneNode(true));
        openZoom(box, true);
      }
    });
    D.addEventListener('paste', function (e) {
      if (editing || !e.clipboardData) return;
      var f = Array.prototype.filter.call(e.clipboardData.files || [], function (x) { return /^image\//.test(x.type); })[0];
      if (!f) return;
      var s = hoverSlot || $('.img-slot:not(.has-img)', slides[cur]) || $('.img-slot', slides[cur]);
      if (s && s.__put) { e.preventDefault(); s.__put(f); }
    });
    W.addEventListener('resize', function () { fit(); });
    if (W.ResizeObserver) new W.ResizeObserver(function () { fit(); }).observe(deck);
    W.addEventListener('hashchange', function () { var n = parseInt(W.location.hash.slice(1), 10); if (n) go(n - 1); });
    W.addEventListener('beforeunload', function (e) { if (dirty && has('edit')) { e.preventDefault(); e.returnValue = ''; } });
    if (mq.addEventListener) mq.addEventListener('change', function () { slides[cur].__pt && slides[cur].__pt.start(); });
  }
  function chrome() {
    ui.live = h('div', { class: 'se-live', 'aria-live': 'polite' });
    deck.append(ui.live);
    if (has('progress')) { ui.progress = h('div', { class: 'se-progress', 'aria-hidden': 'true' }); deck.append(ui.progress); }
    function tb(icon, label, fn) { return h('button', { type: 'button', 'aria-label': label, title: label, html: svg(icon), onclick: function (e) { e.stopPropagation(); fn(); showBar(); } }); }
    ui.count = h('button', { type: 'button', class: 'se-count', 'aria-label': '전체 보기', onclick: function (e) { e.stopPropagation(); overview(); } });
    ui.bar = h('div', { class: 'se-bar se-ui', role: 'toolbar', 'aria-label': '발표 도구' }, tb('left', '이전', prev), ui.count, tb('right', '다음', next));
    if (has('overview')) ui.bar.append(tb('grid', '전체 보기 (O)', overview));
    if (has('pen')) ui.bar.append(ui.penBtn = tb('pencil', '판서 펜 (D)', penToggle));
    ui.bar.append(tb('note', '발표자 노트 (N)', notes), tb('expand', '전체 화면 (F)', fullscreen));
    if (has('help')) ui.bar.append(tb('question', '단축키 안내 (?)', help));
    deck.append(ui.bar);
  }

  /* ── 시작 ── */
  deck.classList.add('se-on');
  if (deck.__se) return;
  deck.__se = 1;
  fit();
  if (theme && tv('--t-name') !== theme && SRC) {
    var tcss = SRC.replace(/slide-engine(\.min)?\.js(\?.*)?$/, 'themes/' + theme + '.css');
    if (tcss !== SRC) { load(tcss, 1).then(boot, boot); return; }
  }
  boot();
  function boot() {
  prepare();
  chrome();
  bind();
  fitAll();
  var first = parseInt(W.location.hash.slice(1), 10) - 1;
  if (isNaN(first) || first < 0) first = parseInt(store('se:last:' + W.location.pathname), 10) || 0;
  go(Math.min(first, N - 1), { instant: true });
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { fit(); fitAll(); });
  W.addEventListener('load', function () { fit(); fitAll(); });

  W.SlideEngine = {
    version: VERSION,
    get index() { return cur + 1; },
    get total() { return N; },
    go: function (n) { go(n - 1); },
    next: next, prev: prev,
    toggle: function (name) { var f = { pen: penToggle, spotlight: spot, edit: edit, hc: hc, overview: overview, notes: notes, help: help, presenter: presenter, fullscreen: fullscreen }[name]; if (f) f(); },
    refresh: function () { fit(); fitAll(); },
    html: clean
  };
  try { deck.dispatchEvent(new CustomEvent('se:ready', { bubbles: true })); } catch (e) {}
  }
}

if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
})();
