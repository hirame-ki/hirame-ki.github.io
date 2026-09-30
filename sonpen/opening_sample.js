/*!
 * 손펜 (Sonpen) — 손글씨 연습장 만들기 · 오프닝 샘플
 * Copyright (c) 2026 황성재 (Hwang Seongjae) · Instagram @hirame.ki
 * All Rights Reserved. 모든 권리 보유.
 * SPDX-License-Identifier: LicenseRef-Sonpen-Restricted
 */
/* 손펜 · 오프닝 샘플 — "삐뚤빼뚤한 글씨가 반듯해지기까지"
   index_opening_sample.html 에서만 씁니다. 원본 index.html · ui.js · app.js 는 건드리지 않습니다.

   장면 1 삐뚤빼뚤 : WebGL(three.js) — 네 언어 글자가 기울고 뒤엉킨 채 터널처럼 쏟아짐
   장면 2 격자     : 글자가 언어별 격자(십자 · 4선 · 米 · 원고지)에 똑바로 내려앉음 + SVG 선 그리기
   장면 3 따라쓰기 : 칸을 벗어난 삐뚤빼뚤 "손펜" → 획이 견본 자리로 바로잡힘 → 펜이 획순대로 따라 씀 → 도장
   장면 4 꾸미기   : 테마 10종 연습장이 3D 회전목마로 돌다 한 장으로 모임
   장면 5 인쇄     : 인쇄 헤드가 지나간 뒤, 실제 미리보기 종이 자리로 날아가 앱으로 이어짐
   소리는 Web Audio로 즉석 합성합니다(음원 파일 없음). 브라우저 정책상 [소리 켜기]를 눌러야 납니다. */
(function () {
  'use strict';

  var root = document.getElementById('op2');
  if (!root) return;
  var body = document.body;
  var NS = 'http://www.w3.org/2000/svg';
  var W = window.innerWidth, H = window.innerHeight;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var done = false;

  function reveal() { body.classList.remove('op2-lock'); body.classList.add('op2-in'); }
  if (reduce || !window.gsap) { root.parentNode.removeChild(root); reveal(); return; }

  var $ = function (s) { return root.querySelector(s); };
  var glCanvas = $('.op2-gl'), svg = $('.op2-svg'), deck = $('.op2-deck'), ring = $('.op2-ring');
  var paper = $('.op2-paper'), hud = $('.op2-hud'), boot = $('.op2-boot');
  var capEls = root.querySelectorAll('.op2-cap span'), stepEls = root.querySelectorAll('.op2-prog span');
  var btnSkip = $('.op2-skip'), btnSound = $('.op2-sound');

  var INK = '#2f2b26', PENINK = '#1b3a5c', GHOST = '#d3c9b8', LINE = '#c9bca5', DASH = '#dcd2c1';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) { // 매번 같은 "삐뚤빼뚤"이 나오도록 고정 시드
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  /* =====================================================================
     소리 — Web Audio 합성
     ===================================================================== */
  var AC = null, master = null, noiseBuf = null, soundOn = false;
  function audioInit() {
    if (AC) { AC.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    AC = new C();
    master = AC.createGain(); master.gain.value = .6;
    var comp = AC.createDynamicsCompressor();
    master.connect(comp); comp.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function live() { return soundOn && AC && !done; }
  function noiseSrc() { var s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; }
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  }
  function chain(src, nodes) { var n = src; nodes.forEach(function (x) { n.connect(x); n = x; }); n.connect(master); }
  var SFX = {
    whoosh: function (dur, f0, f1) {
      if (!live()) return;
      var t = AC.currentTime, s = noiseSrc(), f = AC.createBiquadFilter(), g = AC.createGain();
      f.type = 'bandpass'; f.Q.value = 1.3;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(g, t, dur * .45, .45, dur);
      chain(s, [f, g]); s.start(t); s.stop(t + dur + .05);
    },
    tick: function (freq) {
      if (!live()) return;
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      env(g, t, .004, .16, .14);
      chain(o, [g]); o.start(t); o.stop(t + .16);
    },
    scratch: function (dur, rough) {
      if (!live()) return;
      var t = AC.currentTime, s = noiseSrc(), f = AC.createBiquadFilter(), h = AC.createBiquadFilter(), g = AC.createGain();
      f.type = 'bandpass'; f.frequency.value = rough ? 2400 : 3600; f.Q.value = .9;
      h.type = 'highpass'; h.frequency.value = 1200;
      g.gain.setValueAtTime(.0001, t);
      for (var k = 0; k < dur; k += .022) g.gain.linearRampToValueAtTime((rough ? .16 : .08) + Math.random() * (rough ? .22 : .1), t + k);
      g.gain.linearRampToValueAtTime(.0001, t + dur + .02);
      chain(s, [f, h, g]); s.start(t); s.stop(t + dur + .05);
    },
    flick: function () {
      if (!live()) return;
      var t = AC.currentTime, s = noiseSrc(), f = AC.createBiquadFilter(), g = AC.createGain();
      f.type = 'highpass'; f.frequency.value = 1800;
      env(g, t, .003, .2, .08);
      chain(s, [f, g]); s.start(t); s.stop(t + .1);
    },
    snap: function () {
      if (!live()) return;
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(880, t + .12);
      env(g, t, .01, .2, .3);
      chain(o, [g]); o.start(t); o.stop(t + .32);
    },
    thump: function () {
      if (!live()) return;
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(50, t + .2);
      env(g, t, .004, .8, .32);
      chain(o, [g]); o.start(t); o.stop(t + .34);
      var s = noiseSrc(), f = AC.createBiquadFilter(), g2 = AC.createGain();
      f.type = 'lowpass'; f.frequency.value = 900;
      env(g2, t, .002, .35, .09);
      chain(s, [f, g2]); s.start(t); s.stop(t + .1);
    },
    printer: function (dur) {
      if (!live()) return;
      var t = AC.currentTime, s = noiseSrc(), f = AC.createBiquadFilter(), g = AC.createGain();
      f.type = 'bandpass'; f.frequency.value = 850; f.Q.value = 2.2;
      g.gain.setValueAtTime(.0001, t);
      for (var k = 0; k < dur; k += 1 / 18) {
        g.gain.linearRampToValueAtTime(.26, t + k + .008);
        g.gain.linearRampToValueAtTime(.05, t + k + .045);
      }
      g.gain.linearRampToValueAtTime(.0001, t + dur + .03);
      chain(s, [f, g]); s.start(t); s.stop(t + dur + .05);
    },
    chime: function () {
      if (!live()) return;
      [784, 1175, 1568].forEach(function (fq, i) {
        var t = AC.currentTime + i * .08, o = AC.createOscillator(), g = AC.createGain();
        o.type = 'sine'; o.frequency.value = fq;
        env(g, t, .01, .2 / (i + 1), 1.5);
        chain(o, [g]); o.start(t); o.stop(t + 1.55);
      });
    }
  };
  btnSound.addEventListener('click', function (e) {
    e.stopPropagation();
    soundOn = !soundOn;
    if (soundOn) audioInit();
    btnSound.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    btnSound.querySelector('.lb').textContent = soundOn ? '소리 끄기' : '소리 켜기';
    btnSound.querySelector('.wave').style.display = soundOn ? '' : 'none';
    btnSound.querySelector('.mute').style.display = soundOn ? 'none' : '';
  });

  /* =====================================================================
     자막 · 진행 표시
     ===================================================================== */
  var capI = 0;
  function caption(text) {
    var out = capEls[capI], inn = capEls[capI ^ 1];
    capI ^= 1;
    inn.textContent = text;
    gsap.to(out, { opacity: 0, y: -10, filter: 'blur(6px)', duration: .35, ease: 'power2.in' });
    gsap.fromTo(inn, { opacity: 0, y: 12, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: .55, ease: 'power3.out', delay: .12 });
  }
  function step(i) {
    for (var k = 0; k < stepEls.length; k++) {
      stepEls[k].classList.toggle('on', k === i);
      stepEls[k].classList.toggle('past', k < i);
    }
  }

  /* =====================================================================
     "손펜" 획 데이터 — 100×100 칸 기준, 획순대로
     ===================================================================== */
  var SON = ['M50 12C47 24 38 34 22 42', 'M46 26C54 33 64 38 78 42', 'M50 44L50 55', 'M18 57L82 57', 'M30 66L30 87L78 87'];
  var PEN = ['M10 14L54 14', 'M22 16L24 38', 'M42 16L40 38', 'M8 40L56 40', 'M58 28L71 28', 'M71 8L71 58', 'M87 4L87 64', 'M26 66L26 88L80 88'];
  var SON_JAMO = [[0, 1], [2, 3], [4]], PEN_JAMO = [[0, 1, 2, 3], [4, 5, 6], [7]];

  function nums(d) { return d.match(/-?\d*\.?\d+/g).map(Number); }
  function tmpl(d) { return d.replace(/-?\d*\.?\d+/g, '#'); }
  function fill(t, arr) { var i = 0; return t.replace(/#/g, function () { return (+arr[i++].toFixed(2)); }); }

  // 삐뚤빼뚤 버전: 자모마다 기울이고, 크기를 흔들고, 자리를 어긋내고, 점마다 떨림을 줍니다.
  function messify(strokes, jamo, glyphTf, seed) {
    var r = rng(seed), out = strokes.map(nums);
    jamo.forEach(function (idx) {
      var xs = [], ys = [];
      idx.forEach(function (i) { var n = out[i]; for (var k = 0; k < n.length; k += 2) { xs.push(n[k]); ys.push(n[k + 1]); } });
      var cx = xs.reduce(function (a, b) { return a + b; }) / xs.length, cy = ys.reduce(function (a, b) { return a + b; }) / ys.length;
      var rot = (r() - .5) * .55, sc = .82 + r() * .42, dx = (r() - .5) * 20, dy = (r() - .5) * 16;
      var c = Math.cos(rot), s = Math.sin(rot);
      idx.forEach(function (i) {
        var n = out[i];
        for (var k = 0; k < n.length; k += 2) {
          var x = (n[k] - cx) * sc, y = (n[k + 1] - cy) * sc;
          n[k] = cx + x * c - y * s + dx + (r() - .5) * 7;
          n[k + 1] = cy + x * s + y * c + dy + (r() - .5) * 7;
        }
      });
    });
    // 글자 전체도 칸에서 벗어나게
    var gc = Math.cos(glyphTf.rot), gs = Math.sin(glyphTf.rot);
    out.forEach(function (n) {
      for (var k = 0; k < n.length; k += 2) {
        var x = (n[k] - 50) * glyphTf.sc, y = (n[k + 1] - 50) * glyphTf.sc;
        n[k] = 50 + x * gc - y * gs + glyphTf.dx;
        n[k + 1] = 50 + x * gs + y * gc + glyphTf.dy;
      }
    });
    return out;
  }
  var SON_MESSY = messify(SON, SON_JAMO, { rot: -.2, sc: 1.2, dx: -6, dy: -12 }, 11);
  var PEN_MESSY = messify(PEN, PEN_JAMO, { rot: .24, sc: .8, dx: 10, dy: 18 }, 29);

  /* =====================================================================
     장면 1·2 — WebGL 글자 터널 → 격자에 착지
     ===================================================================== */
  var LANG_FONT = {
    ko: "'Gowun Dodum','Noto Sans KR',sans-serif",
    en: "'Andika','Nunito',sans-serif",
    zh: "'Noto Serif SC','Noto Sans SC',serif",
    ja: "'Zen Maru Gothic','Noto Sans JP',sans-serif"
  };
  var ROW_DEFS = [
    { lang: 'ko', text: '천천히또박또박', type: 'cross', label: '한글 · 십자 격자', ink: '#2f2b26' },
    { lang: 'en', text: 'Be kind', type: 'four', label: 'English · 4선 노트', ink: '#2c4257' },
    { lang: 'zh', text: '學而時習之', type: 'mi', label: '漢字 · 米자 격자', ink: '#4a3a28' },
    { lang: 'ja', text: 'ありがとう', type: 'genko', label: '日本語 · 원고지', ink: '#5b3644' }
  ];
  var POOL = {
    ko: '가나다라마바사아자차카타파하손펜글씨연습장우리마음별꽃봄바른한날오늘또박',
    en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    zh: '永天地人日月山水火木金土心手字書文春風花',
    ja: 'あいうえおかきくけこさしすせそたちつてとなにぬねのさくらカタナ'
  };
  var POOL_ARR = {};
  Object.keys(POOL).forEach(function (l) { POOL_ARR[l] = Array.from(POOL[l]); });

  var ATL = { cols: 16, cell: 128, list: [], index: {}, adv: {}, cap: .44, canvas: document.createElement('canvas'), tex: null };
  (function () {
    function add(ch, lang) {
      var k = lang + ch;
      if (ch === ' ' || ATL.index[k] != null) return;
      ATL.index[k] = ATL.list.length; ATL.list.push({ ch: ch, lang: lang });
    }
    Object.keys(POOL_ARR).forEach(function (l) { POOL_ARR[l].forEach(function (c) { add(c, l); }); });
    ROW_DEFS.forEach(function (r) { Array.from(r.text).forEach(function (c) { add(c, r.lang); }); });
  })();

  function drawAtlas() {
    var n = ATL.cols * ATL.cell, cv = ATL.canvas;
    cv.width = cv.height = n;
    var x = cv.getContext('2d');
    x.clearRect(0, 0, n, n); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    ATL.list.forEach(function (g, i) {
      var cx = (i % ATL.cols) * ATL.cell + 64, y0 = Math.floor(i / ATL.cols) * ATL.cell;
      if (g.lang === 'en') {
        x.font = '400 84px ' + LANG_FONT.en;
        x.fillText(g.ch, cx, y0 + 92);
        ATL.adv[g.ch] = x.measureText(g.ch).width / 128;
      } else {
        x.font = '400 96px ' + LANG_FONT[g.lang];
        var m = x.measureText(g.ch), a = m.actualBoundingBoxAscent || 80, d = m.actualBoundingBoxDescent || 8;
        x.fillText(g.ch, cx, y0 + 64 + (a - d) / 2);
      }
    });
    x.font = '400 84px ' + LANG_FONT.en;
    ATL.cap = (x.measureText('H').actualBoundingBoxAscent || 57) / 128;
    if (ATL.tex) ATL.tex.needsUpdate = true;
  }

  function layoutRows() {
    var c = Math.round(clamp(Math.min(W / 12.5, H / 9.4), 34, 72));
    var lab = Math.round(clamp(c * .36, 16, 24)), gap = Math.round(c * .26);
    var rowH = c + lab + gap, total = rowH * 4 - gap;
    var top = Math.round(H * .45 - total / 2), x0 = Math.round(W / 2 - c * 3.5);
    var glyphs = [];
    var rows = ROW_DEFS.map(function (d, i) {
      var r = { def: d, c: c, x: x0, y: top + i * rowH + lab };
      var chars = Array.from(d.text);
      if (d.type === 'four') {
        var s = c * .6 / ATL.cap, base = r.y + c * .7, pen = r.x + c * .3;
        chars.forEach(function (ch) {
          var a = (ch === ' ' ? .3 : (ATL.adv[ch] || .5)) * s * 1.04;
          if (ch !== ' ') glyphs.push({ ch: ch, lang: 'en', sx: pen + a / 2, sy: base - .219 * s, size: s, ink: d.ink });
          pen += a;
        });
      } else {
        chars.forEach(function (ch, k) {
          glyphs.push({ ch: ch, lang: d.lang, sx: r.x + c * (k + .5), sy: r.y + c * .5, size: c * 1.0, ink: d.ink });
        });
      }
      return r;
    });
    return { rows: rows, glyphs: glyphs, c: c };
  }

  var VERT = [
    'attribute vec3 aSeed; attribute vec3 aTarget; attribute float aGlyph; attribute vec3 aColor;',
    'attribute float aRand; attribute float aSize; attribute float aTSize;',
    'uniform float uTravel, uSpin, uLand, uOut, uGlobal, uDPR, uScale, uDepth, uNear, uMaxPt, uMess;',
    'varying float vGlyph; varying vec3 vColor; varying float vAlpha; varying float vRot;',
    'void main(){',
    '  float ang = aSeed.x + uSpin*(0.6 + aRand);',
    '  float z = mod(aSeed.z*uDepth + uTravel*(0.7 + 0.6*aRand), uDepth) - uDepth + uNear;',
    '  vec3 p = vec3(cos(ang)*aSeed.y, sin(ang)*aSeed.y, z);',
    '  p.xy += vec2(sin(uSpin*7.0 + aRand*40.0), cos(uSpin*5.0 + aRand*30.0)) * 14.0 * uMess;',
    '  float size = aSize; float k = 0.0;',
    '  if (aTarget.z > 0.5) {',
    '    k = clamp((uLand - aRand*0.3)/0.7, 0.0, 1.0); k = k*k*(3.0 - 2.0*k);',
    '    p = mix(p, vec3(aTarget.xy, 0.0), k); size = mix(aSize, aTSize, k);',
    '  } else {',
    '    p.xy *= 1.0 + uOut*uOut*3.0*(0.4 + aRand);',
    '  }',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  float dist = -mv.z;',
    '  gl_PointSize = min(size * uScale / max(dist, 1.0) * uDPR, uMaxPt);',
    '  float a = smoothstep(uDepth, uDepth*0.35, dist) * smoothstep(30.0, 240.0, dist);',
    '  if (aTarget.z > 0.5) a = mix(a, 1.0, k); else a *= (1.0 - uOut);',
    '  vAlpha = a * uGlobal; vGlyph = aGlyph; vColor = aColor;',
    '  vRot = ((aRand - 0.5)*2.6 + sin(uSpin*3.0 + aRand*20.0)*0.35) * uMess * (1.0 - k);',
    '}'
  ].join('\n');
  var FRAG = [
    'uniform sampler2D uAtlas; uniform float uCols;',
    'varying float vGlyph; varying vec3 vColor; varying float vAlpha; varying float vRot;',
    'void main(){',
    '  vec2 q = gl_PointCoord - 0.5; float s = sin(vRot), c = cos(vRot);',
    '  q = vec2(c*q.x - s*q.y, s*q.x + c*q.y) + 0.5;',
    '  if (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) discard;',
    '  float row = floor((vGlyph + 0.5) / uCols); float col = vGlyph - row*uCols;',
    '  float a = texture2D(uAtlas, (vec2(col, row) + q) / uCols).a * vAlpha;',
    '  if (a < 0.01) discard;',
    '  gl_FragColor = vec4(vColor, a);',
    '}'
  ].join('\n');

  var GL = null, ROWS = null, glRun = false, glTravel = 0, glSpin = 0, pointer = { x: 0, y: 0 };
  var G = { speed: 5200, spin: .5, land: 0, out: 0, global: 0, par: 1, roll: -.3, mess: 1 };

  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

  function initGL() {
    if (!window.THREE) return false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    if (!renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);
    var gl = renderer.getContext(), ptRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    var camera = new THREE.PerspectiveCamera(50, W / H, 1, 20000);
    var scene = new THREE.Scene();
    ATL.tex = new THREE.CanvasTexture(ATL.canvas);
    ATL.tex.flipY = false; ATL.tex.anisotropy = 4;

    ROWS = layoutRows();
    var nStorm = W < 700 ? 900 : 1700, n = nStorm + ROWS.glyphs.length;
    var aSeed = new Float32Array(n * 3), aTarget = new Float32Array(n * 3), aGlyph = new Float32Array(n);
    var aColor = new Float32Array(n * 3), aRand = new Float32Array(n), aSize = new Float32Array(n), aTSize = new Float32Array(n);
    var R = Math.max(W, H), langs = ['ko', 'ko', 'en', 'zh', 'ja'];
    var pal = ['#2f2b26', '#2f2b26', '#2f2b26', '#35618f', '#35618f', '#b9855f', '#8fc7ab', '#f0a58e', '#b8a4dd', '#eda3bd', '#8ab6dd'].map(hexRGB);
    for (var i = 0; i < n; i++) {
      var g = i >= nStorm ? ROWS.glyphs[i - nStorm] : null;
      var lang = g ? g.lang : langs[(Math.random() * langs.length) | 0];
      var ch = g ? g.ch : POOL_ARR[lang][(Math.random() * POOL_ARR[lang].length) | 0];
      aGlyph[i] = ATL.index[lang + ch];
      aSeed[i * 3] = Math.random() * Math.PI * 2;
      aSeed[i * 3 + 1] = g ? 180 + Math.random() * R * .5 : 140 + Math.pow(Math.random(), .8) * R * 1.1;
      aSeed[i * 3 + 2] = Math.random();
      aRand[i] = Math.random();
      aSize[i] = g ? 60 : 26 + Math.random() * 54;
      var col = g ? hexRGB(g.ink) : pal[(Math.random() * pal.length) | 0];
      aColor.set(col, i * 3);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(aTarget, 3));
    geo.setAttribute('aGlyph', new THREE.BufferAttribute(aGlyph, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geo.setAttribute('aTSize', new THREE.BufferAttribute(aTSize, 1));
    var mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false,
      uniforms: {
        uAtlas: { value: ATL.tex }, uCols: { value: ATL.cols },
        uTravel: { value: 0 }, uSpin: { value: 0 }, uLand: { value: 0 }, uOut: { value: 0 }, uGlobal: { value: 0 }, uMess: { value: 1 },
        uDPR: { value: renderer.getPixelRatio() }, uScale: { value: 1 }, uDepth: { value: 5200 }, uNear: { value: 0 },
        uMaxPt: { value: ptRange ? ptRange[1] : 256 }
      }
    });
    var points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    GL = { renderer: renderer, camera: camera, scene: scene, geo: geo, mat: mat, nStorm: nStorm, D: 1 };
    sizeGL();
    return true;
  }

  function sizeGL() {
    var D = (H / 2) / Math.tan(25 * Math.PI / 180);
    GL.D = D;
    GL.renderer.setSize(W, H, false);
    GL.camera.aspect = W / H; GL.camera.updateProjectionMatrix();
    GL.mat.uniforms.uScale.value = D;
    GL.mat.uniforms.uNear.value = D - 30;
    ROWS = layoutRows();
    var t = GL.geo.getAttribute('aTarget'), ts = GL.geo.getAttribute('aTSize');
    ROWS.glyphs.forEach(function (g, k) {
      var i = GL.nStorm + k;
      t.array[i * 3] = g.sx - W / 2; t.array[i * 3 + 1] = H / 2 - g.sy; t.array[i * 3 + 2] = 1;
      ts.array[i] = g.size;
    });
    t.needsUpdate = true; ts.needsUpdate = true;
  }

  var last = 0;
  function frame(now) {
    if (!glRun || done) return;
    var dt = last ? Math.min(.05, (now - last) / 1000) : .016;
    last = now;
    glTravel += dt * G.speed; glSpin += dt * G.spin;
    var u = GL.mat.uniforms;
    u.uTravel.value = glTravel; u.uSpin.value = glSpin; u.uLand.value = G.land;
    u.uOut.value = G.out; u.uGlobal.value = G.global; u.uMess.value = G.mess;
    var cam = GL.camera;
    cam.position.set(pointer.x * 90 * G.par, pointer.y * 60 * G.par, GL.D);
    cam.lookAt(0, 0, 0);
    cam.rotation.z += G.roll;
    GL.renderer.render(GL.scene, cam);
    requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', function (e) {
    pointer.x = (e.clientX / W - .5) * 2; pointer.y = -(e.clientY / H - .5) * 2;
  });

  /* ---------- 장면 2의 SVG 격자 ---------- */
  var s2 = null, s2Rows = [];
  function buildS2() {
    if (s2) s2.parentNode.removeChild(s2);
    s2 = svgEl('g', { 'class': 's2' }, svg); s2Rows = [];
    ROWS.rows.forEach(function (r) {
      var d = r.def, c = r.c, x = r.x, y = r.y;
      var n = d.type === 'four' ? 7 : Array.from(d.text).length, w = c * n;
      var g = svgEl('g', {}, s2);
      var solid = [], dashed = [];
      var col = d.type === 'genko' ? '#dca38f' : LINE;
      function P(dd, dash, width, color) {
        var p = svgEl('path', { d: dd, fill: 'none', stroke: color || col, 'stroke-width': width || 1.3, 'stroke-linecap': 'round' }, g);
        if (dash) { p.setAttribute('stroke-dasharray', '4 4'); p.setAttribute('stroke', DASH); dashed.push(p); }
        else { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = '1'; solid.push(p); }
        return p;
      }
      var k, v = '', cr = '', dg = '';
      if (d.type === 'four') {
        P('M' + x + ' ' + (y + c * .1) + 'h' + w);
        P('M' + x + ' ' + (y + c * .4) + 'h' + w, true);
        P('M' + x + ' ' + (y + c * .7) + 'h' + w, false, 1.8);
        P('M' + x + ' ' + (y + c * .96) + 'h' + w);
      } else {
        for (k = 1; k < n; k++) v += 'M' + (x + k * c) + ' ' + y + 'v' + c;
        P('M' + x + ' ' + y + 'h' + w + 'v' + c + 'h' + (-w) + 'Z' + v, false, d.type === 'genko' ? 1.5 : 1.3);
        if (d.type === 'genko') {
          P('M' + x + ' ' + (y - 5) + 'h' + w, false, .9);
          P('M' + x + ' ' + (y + c + 5) + 'h' + w, false, .9);
        } else {
          for (k = 0; k < n; k++) cr += 'M' + (x + (k + .5) * c) + ' ' + y + 'v' + c + 'M' + (x + k * c) + ' ' + (y + c / 2) + 'h' + c;
          P(cr, true);
          if (d.type === 'mi') {
            for (k = 0; k < n; k++) dg += 'M' + (x + k * c) + ' ' + y + 'l' + c + ' ' + c + 'M' + (x + (k + 1) * c) + ' ' + y + 'l' + (-c) + ' ' + c;
            P(dg, true);
          }
        }
      }
      var fs = clamp(c * .21, 11, 14);
      var lab = svgEl('g', { opacity: 0 }, g);
      svgEl('circle', { cx: x + 4, cy: y - fs * .95, r: 3.2, fill: d.ink }, lab);
      var tx = svgEl('text', { x: x + 13, y: y - fs * .55, 'font-size': fs, fill: '#8a8173', 'font-weight': 500 }, lab);
      tx.textContent = d.label;
      s2Rows.push({ g: g, solid: solid, dashed: dashed, label: lab });
    });
  }
  function tlS2() {
    var t = gsap.timeline();
    s2Rows.forEach(function (r, i) {
      var at = i * .16;
      t.to(r.solid, { strokeDashoffset: 0, duration: .6, ease: 'power2.inOut', stagger: .05 }, at);
      t.fromTo(r.dashed, { opacity: 0 }, { opacity: 1, duration: .5 }, at + .25);
      t.fromTo(r.label, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: .45, ease: 'power2.out' }, at + .1);
      t.call(function () { SFX.tick(620 + i * 130); }, null, at + .3);
    });
    return t;
  }

  /* =====================================================================
     장면 3 — 삐뚤빼뚤 → 바로잡기 → 획순 따라쓰기 → 도장
     ===================================================================== */
  var S3 = null, penS = { x: 0, y: 0, k: 1, o: 0 };
  function buildS3() {
    var S = Math.round(clamp(Math.min(W * .42, H * .31), 110, 240)), s = S / 3;
    var left = Math.round(W / 2 - S), top = Math.round(H * .43 - (S * 1.18 + s) / 2), sy = top + S * 1.18;
    var g = svgEl('g', { 'class': 's3' }, svg);
    var gridSolid = [], gridDash = [];
    function P(d, dash, parent) {
      var p = svgEl('path', { d: d, fill: 'none', stroke: dash ? DASH : LINE, 'stroke-width': dash ? 1.2 : 1.6, 'stroke-linecap': 'round' }, parent || g);
      if (dash) { p.setAttribute('stroke-dasharray', '5 5'); p.style.opacity = 0; gridDash.push(p); }
      else { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = '1'; gridSolid.push(p); }
      return p;
    }
    var k, cr = '', v = '', cr2 = '';
    P('M' + left + ' ' + top + 'h' + 2 * S + 'v' + S + 'h' + (-2 * S) + 'Z' + 'M' + (left + S) + ' ' + top + 'v' + S);
    for (k = 0; k < 2; k++) cr += 'M' + (left + (k + .5) * S) + ' ' + top + 'v' + S + 'M' + (left + k * S) + ' ' + (top + S / 2) + 'h' + S;
    P(cr, true);
    for (k = 1; k < 6; k++) v += 'M' + (left + k * s) + ' ' + sy + 'v' + s;
    P('M' + left + ' ' + sy + 'h' + 2 * S + 'v' + s + 'h' + (-2 * S) + 'Z' + v);
    for (k = 0; k < 6; k++) cr2 += 'M' + (left + (k + .5) * s) + ' ' + sy + 'v' + s + 'M' + (left + k * s) + ' ' + (sy + s / 2) + 'h' + s;
    P(cr2, true);

    function glyph(paths, x, y, size, color, width, op) {
      var gg = svgEl('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + size / 100 + ')', opacity: op }, g);
      return {
        g: gg, paths: paths.map(function (d) {
          return svgEl('path', { d: d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gg);
        })
      };
    }
    // 삐뚤빼뚤 글씨 (나중에 흐린 견본 자리로 바로잡힘)
    var messy = [
      { data: SON_MESSY, good: SON, gl: glyph(SON_MESSY.map(function (n, i) { return fill(tmpl(SON[i]), n); }), left, top, S, '#4a4540', 6.2, 1) },
      { data: PEN_MESSY, good: PEN, gl: glyph(PEN_MESSY.map(function (n, i) { return fill(tmpl(PEN[i]), n); }), left + S, top, S, '#4a4540', 6.2, 1) }
    ];
    var messyPaths = [];
    messy.forEach(function (m) {
      m.gl.paths.forEach(function (p, i) {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L + ' ' + (L + 2); p.style.strokeDashoffset = L;
        messyPaths.push({ p: p, L: L, from: m.data[i], to: nums(m.good[i]), t: tmpl(m.good[i]) });
      });
    });
    // 흐린 따라쓰기 줄 (반복할수록 점점 흐려지기)
    var small = [];
    for (k = 0; k < 6; k++) {
      var sg = glyph(k % 2 ? PEN : SON, left + k * s, sy, s, INK, 7, 0);
      sg.g._op = [.34, .34, .22, .22, .12, .12][k];
      small.push(sg.g);
    }
    // 견본 위에 펜이 쓰는 진한 글씨
    var solid = [glyph(SON, left, top, S, PENINK, 7.4, 1), glyph(PEN, left + S, top, S, PENINK, 7.4, 1)];
    var strokes = [];
    solid.forEach(function (gl, j) {
      gl.paths.forEach(function (p) {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L + ' ' + (L + 2); p.style.strokeDashoffset = L;
        strokes.push({ p: p, len: L, ox: left + j * S, oy: top, k: S / 100 });
      });
    });

    // 연필
    var pen = svgEl('g', { 'class': 'pen', opacity: 0 }, g);
    var pr = svgEl('g', { transform: 'rotate(28)' }, pen);
    svgEl('path', { d: 'M0 0L-6.5 -17L6.5 -17Z', fill: '#2b2b2b' }, pr);
    svgEl('path', { d: 'M-6.5 -17L-11 -40L11 -40L6.5 -17Z', fill: '#f1d9b5' }, pr);
    svgEl('rect', { x: -11, y: -150, width: 22, height: 110, rx: 2, fill: '#35618f' }, pr);
    svgEl('rect', { x: -11, y: -150, width: 7, height: 110, fill: '#fff', opacity: .2 }, pr);
    svgEl('rect', { x: -11.5, y: -168, width: 23, height: 18, fill: '#c9ccd1' }, pr);
    svgEl('rect', { x: -11, y: -186, width: 22, height: 18, rx: 5, fill: '#eda3bd' }, pr);

    // 도장 "참 잘했어요"
    var R = Math.round(S * .27), stampPos = svgEl('g', { transform: 'translate(' + (left + 2 * S - R * .35) + ' ' + (top + R * .2) + ')' }, g);
    var stamp = svgEl('g', { filter: 'url(#op2-rough)', opacity: 0 }, stampPos);
    svgEl('circle', { r: R, fill: 'none', stroke: '#d2553f', 'stroke-width': R * .09 }, stamp);
    svgEl('circle', { r: R * .86, fill: 'none', stroke: '#d2553f', 'stroke-width': R * .03 }, stamp);
    var t1 = svgEl('text', { y: R * .16, 'text-anchor': 'middle', 'font-size': R * .78, fill: '#d2553f', 'font-family': "'Black Han Sans','Do Hyeon',sans-serif" }, stamp);
    t1.textContent = '참';
    var t2 = svgEl('text', { y: R * .58, 'text-anchor': 'middle', 'font-size': R * .27, fill: '#d2553f', 'font-family': "'Do Hyeon','Black Han Sans',sans-serif" }, stamp);
    t2.textContent = '잘했어요';

    S3 = {
      g: g, S: S, gridSolid: gridSolid, gridDash: gridDash, messy: messy, messyPaths: messyPaths,
      small: small, strokes: strokes, pen: pen, penK: clamp(S / 230, .55, 1.05), stamp: stamp
    };
  }
  function penDraw() {
    S3.pen.setAttribute('transform', 'translate(' + penS.x.toFixed(1) + ' ' + penS.y.toFixed(1) + ') scale(' + (S3.penK * penS.k).toFixed(3) + ')');
    S3.pen.setAttribute('opacity', penS.o);
  }
  function strokePt(st, v) {
    var q = st.p.getPointAtLength(st.len * v);
    return { x: st.ox + q.x * st.k, y: st.oy + q.y * st.k };
  }
  function tlS3() {
    var t = gsap.timeline(), o = S3;
    t.call(function () { step(2); caption('내 글씨, 나도 못 알아볼 때'); });
    t.to(o.gridSolid, { strokeDashoffset: 0, duration: .55, ease: 'power2.inOut', stagger: .1 }, 0);
    t.to(o.gridDash, { opacity: 1, duration: .4 }, .3);
    // 1) 삐뚤빼뚤 휘갈겨 쓰기
    var at = .35;
    o.messyPaths.forEach(function (m) {
      var d = .035 + m.L / 100 * .06;
      t.to(m.p, { strokeDashoffset: 0, duration: d, ease: 'none', onStart: function () { SFX.scratch(d, true); } }, at);
      at += d + .01;
    });
    // 2) 격자에 맞춰 바로잡기 (획이 견본 자리로 이동하며 흐려짐)
    var fix = at + .4, mix = { v: 0 };
    t.call(function () {
      caption('격자에 맞추면, 글씨가 바로잡혀요');
      o.messyPaths.forEach(function (m) { m.p.style.strokeDasharray = 'none'; });
      SFX.snap();
    }, null, fix);
    t.to(mix, {
      v: 1, duration: .6, ease: 'back.out(1.6)', onUpdate: function () {
        o.messyPaths.forEach(function (m) {
          var arr = m.from.map(function (a, i) { return a + (m.to[i] - a) * mix.v; });
          m.p.setAttribute('d', fill(m.t, arr));
        });
      }
    }, fix);
    t.to(o.messy.reduce(function (a, m) { return a.concat(m.gl.paths); }, []), { attr: { stroke: GHOST, 'stroke-width': 7 }, duration: .6, ease: 'power1.inOut' }, fix + .25);
    t.fromTo(o.small, { opacity: 0 }, { opacity: function (i, el) { return el._op; }, duration: .4, stagger: .06 }, fix + .35);
    // 3) 펜이 획순대로 따라 쓰기
    var trace = fix + .8;
    t.call(function () { caption('흐린 견본을 따라, 획순대로 또박또박'); }, null, trace - .2);
    var p0 = strokePt(o.strokes[0], 0);
    t.fromTo(penS, { x: W * .92, y: H * 1.1, o: 0, k: 1.1 }, { x: p0.x, y: p0.y, o: 1, k: 1, duration: .45, ease: 'power3.out', onUpdate: penDraw }, trace - .3);
    at = trace + .15;
    o.strokes.forEach(function (st, i) {
      if (i > 0) {
        var p = strokePt(st, 0);
        t.to(penS, { x: p.x, y: p.y, duration: .06, ease: 'power1.inOut', onUpdate: penDraw }, at);
        t.to(penS, { k: 1.07, duration: .035, yoyo: true, repeat: 1, onUpdate: penDraw }, at);
        at += .065;
      }
      var d = .05 + st.len / st.k / 100 * .13, pr = { v: 0 };
      t.to(pr, {
        v: 1, duration: d, ease: 'power1.inOut',
        onStart: function () { SFX.scratch(d, false); },
        onUpdate: function () {
          st.p.style.strokeDashoffset = st.len * (1 - pr.v);
          var q = strokePt(st, pr.v); penS.x = q.x; penS.y = q.y; penDraw();
        }
      }, at);
      at += d;
    });
    t.to(penS, { x: W * 1.08, y: -H * .15, duration: .55, ease: 'power2.in', onUpdate: penDraw }, at + .08);
    // 4) 도장
    var st = at + .22;
    t.fromTo(o.stamp, { opacity: 0, scale: 2.6, rotation: -42, transformOrigin: '50% 50%' },
      { opacity: .92, scale: 1, rotation: -14, duration: .24, ease: 'power4.in' }, st);
    t.call(function () { SFX.thump(); caption('참 잘했어요'); }, null, st + .24);
    t.fromTo(o.g, { x: -5, y: 3 }, { x: 0, y: 0, duration: .45, ease: 'elastic.out(1,.3)' }, st + .24);
    return t;
  }

  /* =====================================================================
     장면 4 — 테마 10종 3D 회전목마
     ===================================================================== */
  var CONTENT = {
    cream: { title: '손펜', kind: 'ko', grid: 'cross', text: '천천히또박또박', foot: '천천히, 또박또박' },
    mint: { title: 'Daily Writing', kind: 'en', text: 'Be kind.', foot: 'slow & neat' },
    peach: { title: '고마운 마음', kind: 'ko', grid: 'cross', text: '고마워사랑해', foot: '예쁜 말, 예쁜 글씨' },
    sky: { title: 'ひらがな', kind: 'ja', grid: 'genko', text: 'ありがとう', foot: 'ていねいに' },
    kraft: { title: '論語 · 學而', kind: 'zh', grid: 'mi', text: '學而時習之', foot: '배우고 때때로 익히면' },
    lavender: { title: '오늘의 나에게', kind: 'ko', grid: 'cross', text: '오늘도잘했어', foot: '성찰 일지' },
    grass: { title: 'Hope', kind: 'en', text: 'Hope is the', foot: 'Emily Dickinson' },
    plain: { title: '받아쓰기', kind: 'ko', grid: 'cross', text: '가갸거겨고교', foot: '바른 글씨 챌린지' },
    night: { title: '서시', kind: 'ko', grid: 'cross', text: '별을노래하는', foot: '윤동주' },
    sakura: { title: 'さくら', kind: 'ja', grid: 'genko', text: 'さくらさくら', foot: '春' }
  };
  var DECK = { sheets: [], front: -1, P: { spin: 216, spread: 1, radius: 0 }, w: 0, h: 0 };
  function logoSVG(color) {
    function g(paths, x) {
      return '<g transform="translate(' + x + ' 0)">' + paths.map(function (d) {
        return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';
      }).join('') + '</g>';
    }
    return '<svg class="sh-logo" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">' + g(SON, 0) + g(PEN, 100) + '</svg>';
  }
  function sheetHTML(th, ct, front) {
    var rows = '', ghost = [1, .34, .25, .17, .1], chars = Array.from(ct.text), i, k;
    for (i = 0; i < 5; i++) {
      if (ct.kind === 'en') {
        rows += '<div class="sh-four"><i></i><i></i><i></i><i></i><b style="opacity:' + ghost[i] + '">' + ct.text + '</b></div>';
      } else {
        rows += '<div class="sh-row sh-' + ct.grid + '">';
        for (k = 0; k < 7; k++) rows += '<span class="sh-c">' + (chars[k] ? '<em style="opacity:' + ghost[i] + '">' + chars[k] + '</em>' : '') + '</span>';
        rows += '</div>';
      }
    }
    return '<div class="sh-frame b-' + th.border + '"></div>' +
      '<div class="sh-in"><div class="sh-orn">' + (th.emoji || '&nbsp;') + '</div>' +
      (front ? logoSVG(th.ink) : '<div class="sh-title">' + ct.title + '</div>') +
      '<div class="sh-meta"><span>이름</span><span>날짜</span></div>' +
      '<div class="sh-rows sh-' + ct.kind + '">' + rows + '</div>' +
      '<div class="sh-foot">' + ct.foot + '</div></div>' +
      '<div class="sh-name">' + th.name + '</div>' + (front ? '<div class="sh-scan"></div>' : '');
  }
  function buildDeck() {
    var themes = window.SONPEN_THEMES || [];
    var h = Math.round(clamp(Math.min(H * .58, W * .62 * 1.414), 220, 470)), w = Math.round(h / 1.414);
    DECK.w = w; DECK.h = h; DECK.P.radius = w * 1.62;
    ring.innerHTML = '';
    DECK.sheets = themes.map(function (th, i) {
      var el = document.createElement('div');
      el.className = 'op2-sheet';
      el.style.cssText = '--w:' + w + 'px;--h:' + h + 'px;--paper:' + th.paper + ';--grid:' + th.grid + ';--ink:' + th.ink + ';--bc:' + th.borderColor;
      el.innerHTML = sheetHTML(th, CONTENT[th.id] || CONTENT.cream, i === 0);
      ring.appendChild(el);
      return el;
    });
    deckDraw();
  }
  function deckDraw() {
    var P = DECK.P, n = DECK.sheets.length, stp = 360 / n;
    DECK.sheets.forEach(function (el, i) {
      var a = i * stp + P.spin;
      a = ((a % 360) + 540) % 360 - 180;
      a *= P.spread;
      var rad = a * Math.PI / 180;
      var x = Math.sin(rad) * P.radius, z = Math.cos(rad) * P.radius - P.radius - i * 1.5 * (1 - P.spread);
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + a.toFixed(2) + 'deg)';
    });
    var front = Math.round((((-P.spin) % 360) + 360) % 360 / stp) % n;
    if (front !== DECK.front) { DECK.front = front; SFX.flick(); }
  }
  function tlS4() {
    var t = gsap.timeline(), P = DECK.P, front = DECK.sheets[0];
    t.call(function () { step(3); caption('바른 글씨 연습장, 분위기는 10가지'); });
    t.to(deck, { opacity: 1, duration: .35 }, 0);
    t.fromTo(ring, { rotationX: 64, y: H * .42, scale: .5 }, { rotationX: -7, y: -H * .03, scale: .9, duration: 1.05, ease: 'power3.out' }, 0);
    t.fromTo(P, { spin: 216 }, { spin: -360, duration: 2.0, ease: 'power2.inOut', onUpdate: deckDraw }, 0);
    t.to(P, { spread: 0, radius: 0, duration: .7, ease: 'power3.inOut', onUpdate: deckDraw }, 1.45);
    t.to(ring, { rotationX: 0, y: 0, scale: 1, duration: .7, ease: 'power3.inOut' }, 1.45);
    t.set(DECK.sheets.slice(1), { autoAlpha: 0 }, 2.15);
    t.call(function () { step(4); caption('A4로 바로 인쇄 — 설치 없이, 무료로'); }, null, 2.15);
    var scan = front.querySelector('.sh-scan'), name = front.querySelector('.sh-name');
    t.to(name, { opacity: 0, duration: .2 }, 2.15);
    t.fromTo(scan, { top: '-16%', opacity: 1 }, {
      top: '102%', duration: .75, ease: 'none', immediateRender: false, onStart: function () { SFX.printer(.75); }
    }, 2.25);
    t.to(scan, { opacity: 0, duration: .15 });
    t.call(handoff, null, 3.1);
    return t;
  }

  /* =====================================================================
     장면 5 — 실제 미리보기 종이 자리로 날아가 앱으로 넘겨주기
     ===================================================================== */
  var tl = null, tail = null;
  function handoff() {
    if (done) return;
    var front = DECK.sheets[0], r = front.getBoundingClientRect();
    var tgt = document.querySelector('#pages .page'), tr = tgt && tgt.getBoundingClientRect();
    var ok = tr && tr.width > 60 && tr.bottom > 40 && tr.top < H - 40 && tr.right > 0 && tr.left < W;
    reveal();
    SFX.chime();
    tail = gsap.timeline({ onComplete: cleanup });
    if (ok) {
      tail.to(ring, {
        x: '+=' + ((tr.left + tr.width / 2) - (r.left + r.width / 2)),
        y: '+=' + ((tr.top + tr.height / 2) - (r.top + r.height / 2)),
        scale: tr.width / r.width, duration: .9, ease: 'power3.inOut'
      }, 0);
    } else {
      tail.to(ring, { scale: 1.12, duration: .8, ease: 'power2.out' }, 0);
    }
    tail.to(hud, { opacity: 0, duration: .3 }, 0);
    tail.to(paper, { opacity: 0, duration: .7, ease: 'power1.inOut' }, .15);
    tail.to(front, { opacity: 0, duration: .3 }, .75);
  }

  /* =====================================================================
     시작 · 건너뛰기 · 정리
     ===================================================================== */
  function cleanup() {
    if (done && !root.parentNode) return;
    done = true; glRun = false;
    if (tl) tl.kill();
    if (tail) tail.kill();
    if (GL) {
      GL.geo.dispose(); GL.mat.dispose(); if (ATL.tex) ATL.tex.dispose();
      GL.renderer.dispose();
      if (GL.renderer.forceContextLoss) GL.renderer.forceContextLoss();
    }
    if (root.parentNode) root.parentNode.removeChild(root);
    reveal();
    document.removeEventListener('keydown', onKey);
  }
  function skip() {
    if (done) return;
    done = true;
    if (tl) tl.pause();
    if (tail) tail.pause();
    reveal();
    gsap.to(root, { opacity: 0, duration: .35, ease: 'power1.out', onComplete: cleanup });
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || (e.key === ' ' && e.target === document.body)) { e.preventDefault(); skip(); }
  }
  btnSkip.addEventListener('click', function (e) { e.stopPropagation(); skip(); });
  document.addEventListener('keydown', onKey);

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    if (GL && glRun) { sizeGL(); buildS2(); s2Rows.forEach(function (r) { gsap.set(r.solid, { strokeDashoffset: 0 }); gsap.set([r.dashed, r.label], { opacity: 1 }); }); }
  });

  function start() {
    if (done) return;
    boot.classList.add('off');
    drawAtlas();
    var glOK = initGL();
    if (glOK) buildS2(); else glCanvas.style.display = 'none';
    buildS3();
    buildDeck();

    tl = gsap.timeline({ delay: .1 });
    var T3 = .1;
    if (glOK) {
      glRun = true; requestAnimationFrame(frame);
      tl.call(function () { step(0); caption('삐뚤빼뚤, 제멋대로인 글씨들'); SFX.whoosh(1.7, 280, 2600); }, null, 0);
      tl.to(G, { global: 1, duration: .6, ease: 'power1.out' }, 0);
      tl.to(G, { speed: 1500, duration: 1.4, ease: 'power3.out' }, 0);
      tl.to(G, { roll: .1, duration: 1.6, ease: 'sine.inOut' }, 0);
      tl.addLabel('land', 1.25);
      tl.to(G, { land: 1, duration: 1.35, ease: 'power2.inOut' }, 'land');
      tl.to(G, { out: 1, duration: 1.0, ease: 'power2.in' }, 'land');
      tl.to(G, { speed: 120, spin: 0, duration: 1.3, ease: 'power2.out' }, 'land');
      tl.to(G, { par: 0, roll: 0, mess: 0, duration: 1.15, ease: 'power2.inOut' }, 'land');
      tl.call(function () { step(1); caption('격자에 앉히면 반듯하게 — 한글 · 영어 · 한자 · 일본어'); SFX.whoosh(1.0, 2400, 380); }, null, 'land+=.2');
      tl.add(tlS2(), 'land+=.95');
      tl.addLabel('s2out', 'land+=2.45');
      tl.to(G, { global: 0, duration: .45, ease: 'power1.in' }, 's2out');
      tl.to(s2Rows.map(function (r) { return r.g; }), { opacity: 0, y: -14, duration: .4, stagger: .05, ease: 'power1.in' }, 's2out');
      tl.call(function () { glRun = false; glCanvas.style.display = 'none'; }, null, 's2out+=.5');
      T3 = 'land+=2.9';
    }
    tl.add(tlS3(), T3);
    tl.addLabel('s3out', '+=.4');
    tl.to(S3.g, { opacity: 0, scale: .72, y: -30, transformOrigin: '50% 45%', duration: .45, ease: 'power2.in' }, 's3out');
    tl.add(tlS4(), 's3out+=.3');
    window.SonpenOpening = { timeline: tl, skip: skip };
  }

  var fontsReady = document.fonts && document.fonts.load ? Promise.all([
    document.fonts.load('96px "Gowun Dodum"', '가나손펜천히또박'),
    document.fonts.load('84px "Andika"', 'Be kind Hope'),
    document.fonts.load('96px "Noto Serif SC"', '學而時習之永'),
    document.fonts.load('96px "Zen Maru Gothic"', 'ありがとうさくら'),
    document.fonts.load('20px "Gowun Batang"', '삐뚤빼뚤 글씨'),
    document.fonts.load('40px "Black Han Sans"', '참'),
    document.fonts.load('40px "Do Hyeon"', '잘했어요')
  ]).catch(function () {}) : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1200); })]).then(start);
  fontsReady.then(function () {
    if (done || !GL) return;
    drawAtlas();
    if (glRun) sizeGL();
  });
})();
