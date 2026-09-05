/*!
 * 손펜 (Sonpen) — 손글씨 연습장 만들기
 * Copyright (c) 2026 황성재 (Hwang Seongjae) · Instagram @hirame.ki
 * All Rights Reserved. 모든 권리 보유.
 *
 * 이 파일은 오픈소스가 아닙니다.
 * 상업적 이용, 개작·2차적 저작물 작성, 재배포를 모두 금지합니다.
 * 자세한 조건은 LICENSE 파일을 참고하십시오. 문의: Instagram @hirame.ki
 * SPDX-License-Identifier: LicenseRef-Sonpen-Restricted
 */
/* ================= 손펜 · app.js ================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MM = 3.7795275591; /* 1mm = px @96dpi */

  /* ---------- 상태 ---------- */
  var S = {
    text: '가나다라마바사아자차카타파하\n오늘도 또박또박 한 글자씩.',
    autoCorrect: true,
    scriptMode: 'auto',
    repeat: 3, ghost: 28, firstSolid: true, fadeOut: false, showNumbers: false,
    gridStyle: 'cross', cols: 10, cellGap: 2, lineHeightMM: 16,
    gridColor: '#c9c2b6', inkColor: '#3a3a3a',
    font: 'gowun-dodum', fontScale: 72, fontWeight: '400',
    theme: 'cream', paperColor: '#fffdf7',
    borderStyle: 'thin', borderColor: '#e0b8a0',
    title: '', showMeta: true, footer: '',
    titleFont: '', titleSize: 20, titleWeight: '400', titleSpace: 1, titleGap: 3,
    titleAlign: 'center', titleOpacity: 100,
    footFont: '', footSize: 10, footWeight: '400', footSpace: 0, footGap: 4,
    footAlign: 'center', footOpacity: 65,
    emojis: ['✿', '❀'], emojiCustom: '', emojiPlace: 'top', emojiSize: 20,
    imgData: '', imgPlace: 'top-right', imgSize: 35, imgOpacity: 100,
    fontTouched: false,
    orient: 'portrait', margin: 15, zoom: 100
  };

  var strokesByPage = {};   /* {pageIndex: [stroke,...]} */
  var writeMode = false;
  var penColor = '#1b3a5c', penWidth = 3, eraser = false;

  /* ---------- 문자 판별 ---------- */
  function detectScript(t) {
    var ko = (t.match(/[가-힣ᄀ-ᇿ]/g) || []).length;
    var kana = (t.match(/[぀-ヿ]/g) || []).length;
    var han = (t.match(/[一-鿿㐀-䶿]/g) || []).length;
    var en = (t.match(/[A-Za-z]/g) || []).length;
    if (ko > 0 && ko >= kana && ko >= han) return 'ko';
    if (kana > 0) return 'ja';
    if (han > 0) return 'zh';
    if (en > 0) return 'en';
    return 'ko';
  }
  function effScript() {
    return S.scriptMode === 'auto' ? detectScript(S.text) : S.scriptMode;
  }
  var SCRIPT_LABEL = { ko: '한글 · 네모칸 격자', ja: '일본어 · 원고지 칸', zh: '중국어 · 전자격(田)', en: '알파벳 · 4선 노트' };

  function fontCss(id) {
    for (var i = 0; i < SONPEN_FONTS.length; i++) if (SONPEN_FONTS[i].id === id) return SONPEN_FONTS[i].css;
    return "'Noto Sans KR'";
  }

  /* ---------- 텍스트 → 줄 데이터 ---------- */
  function buildCellRows(text, cols) {
    var out = [];
    text.split('\n').forEach(function (line) {
      var chars = Array.from(line);
      if (!chars.length) { out.push({ chars: [], src: '' }); return; }
      for (var i = 0; i < chars.length; i += cols) {
        out.push({ chars: chars.slice(i, i + cols), src: line });
      }
    });
    return out;
  }

  var measureCanvas = document.createElement('canvas');
  var mctx = measureCanvas.getContext('2d');
  function wrapLatin(line, fontPx, family, weight, maxPx) {
    /* family 는 따옴표를 유지해야 canvas 가 폰트를 인식한다 */
    mctx.font = weight + ' ' + fontPx + 'px ' + family + ', sans-serif';
    /* 실제 렌더링의 자간(letter-spacing)까지 반영해야 줄이 넘치지 않는다 */
    if ('letterSpacing' in mctx) { mctx.letterSpacing = (fontPx * 0.04) + 'px'; }
    else { maxPx = maxPx * 0.94; }
    var words = line.split(/(\s+)/), rows = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur + words[i];
      if (mctx.measureText(test).width > maxPx && cur.trim()) {
        rows.push(cur.replace(/\s+$/, ''));
        cur = words[i].replace(/^\s+/, '');
      } else cur = test;
    }
    if (cur.trim() || !rows.length) rows.push(cur.replace(/\s+$/, ''));
    return rows;
  }

  /* ---------- 장식 ---------- */
  function emojiList() {
    var arr = S.emojis.slice();
    if (S.emojiCustom) arr = arr.concat(Array.from(S.emojiCustom.replace(/\s/g, '')));
    return arr.filter(Boolean);
  }
  function buildDeco(pageEl, pageIdx) {
    var deco = document.createElement('div');
    deco.className = 'deco';
    var ems = emojiList(), sz = S.emojiSize;
    if (ems.length) {
      var put = function (ch, css) {
        var s = document.createElement('span');
        s.className = 'em'; s.textContent = ch;
        s.style.fontSize = sz + 'px';
        Object.keys(css).forEach(function (k) { s.style[k] = css[k]; });
        deco.appendChild(s);
      };
      if (S.emojiPlace === 'corners') {
        var corners = [{ left: '10mm', top: '10mm' }, { right: '10mm', top: '10mm' },
                       { left: '10mm', bottom: '10mm' }, { right: '10mm', bottom: '10mm' }];
        corners.forEach(function (c, i) { put(ems[i % ems.length], c); });
      } else if (S.emojiPlace === 'top' || S.emojiPlace === 'bottom') {
        var n = 9;
        for (var i = 0; i < n; i++) {
          var pos = { left: (8 + (84 * i / (n - 1))) + '%' };
          pos[S.emojiPlace === 'top' ? 'top' : 'bottom'] = '9mm';
          put(ems[i % ems.length], pos);
        }
      } else if (S.emojiPlace === 'side') {
        for (var j = 0; j < 6; j++) {
          put(ems[j % ems.length], { left: '8mm', top: (14 + j * 13) + '%' });
          put(ems[(j + 1) % ems.length], { right: '8mm', top: (14 + j * 13) + '%' });
        }
      } else { /* scatter */
        var seed = 7 + pageIdx * 13;
        for (var k = 0; k < 14; k++) {
          seed = (seed * 9301 + 49297) % 233280;
          var x = 5 + (seed / 233280) * 88;
          seed = (seed * 9301 + 49297) % 233280;
          var y = 5 + (seed / 233280) * 88;
          put(ems[k % ems.length], { left: x.toFixed(1) + '%', top: y.toFixed(1) + '%', opacity: .55 });
        }
      }
    }
    if (S.imgData) {
      var img = document.createElement('img');
      img.className = 'deco-img'; img.src = S.imgData;
      img.style.opacity = (S.imgOpacity / 100);
      var w = S.imgSize + 'mm';
      img.style.width = w;
      var p = S.imgPlace;
      if (p === 'top-left') { img.style.left = '10mm'; img.style.top = '10mm'; }
      else if (p === 'top-right') { img.style.right = '10mm'; img.style.top = '10mm'; }
      else if (p === 'bottom-left') { img.style.left = '10mm'; img.style.bottom = '10mm'; }
      else if (p === 'bottom-right') { img.style.right = '10mm'; img.style.bottom = '10mm'; }
      else if (p === 'header') { img.style.left = '50%'; img.style.top = '8mm'; img.style.transform = 'translateX(-50%)'; }
      else { /* watermark */
        img.style.left = '50%'; img.style.top = '50%';
        img.style.transform = 'translate(-50%,-50%)';
        img.style.width = (S.imgSize * 2.4) + 'mm';
        img.style.opacity = Math.min(0.25, S.imgOpacity / 100);
      }
      deco.appendChild(img);
    }
    pageEl.appendChild(deco);
  }

  /* ---------- 페이지 생성 ---------- */
  function makePage(idx) {
    var page = document.createElement('div');
    page.className = 'page b-' + S.borderStyle + ' gs-' + S.gridStyle;
    if (S.orient === 'landscape') page.classList.add('landscape');
    page.style.setProperty('--paper', S.paperColor);
    page.style.setProperty('--grid', S.gridColor);
    page.style.setProperty('--ink', S.inkColor);
    page.style.setProperty('--bcol', S.borderColor);
    page.style.setProperty('--pad', S.margin + 'mm');
    page.style.setProperty('--cellgap', S.cellGap + 'px');
    page.style.setProperty('--ghost', (S.ghost / 100));
    page.style.setProperty('--chweight', S.fontWeight);
    page.style.setProperty('--practicefont', fontCss(S.font));
    page.style.setProperty('--lineh', S.lineHeightMM + 'mm');
    page.style.setProperty('--titlefont', fontCss(S.titleFont || S.font));
    page.style.setProperty('--titlesize', S.titleSize + 'pt');
    page.style.setProperty('--titleweight', S.titleWeight);
    page.style.setProperty('--titlespace', S.titleSpace + 'px');
    page.style.setProperty('--titlegap', S.titleGap + 'mm');
    page.style.setProperty('--titlealign', S.titleAlign);
    page.style.setProperty('--titleopacity', (S.titleOpacity / 100));
    page.style.setProperty('--footfont', fontCss(S.footFont || S.font));
    page.style.setProperty('--footsize', S.footSize + 'pt');
    page.style.setProperty('--footweight', S.footWeight);
    page.style.setProperty('--footspace', S.footSpace + 'px');
    page.style.setProperty('--footgap', S.footGap + 'mm');
    page.style.setProperty('--footalign', S.footAlign);
    page.style.setProperty('--footopacity', (S.footOpacity / 100));
    page.dataset.index = idx;

    var frame = document.createElement('div'); frame.className = 'frame';
    page.appendChild(frame);
    buildDeco(page, idx);

    var inner = document.createElement('div'); inner.className = 'page-inner';
    var head = document.createElement('div'); head.className = 'sheet-head';
    if (S.title) {
      var h = document.createElement('div'); h.className = 'sheet-title';
      h.textContent = S.title; head.appendChild(h);
    }
    if (S.showMeta) {
      var meta = document.createElement('div'); meta.className = 'sheet-meta';
      meta.innerHTML = '<i>이름</i><span></span><i>날짜</i><span></span>';
      head.appendChild(meta);
    }
    inner.appendChild(head);

    var body = document.createElement('div'); body.className = 'sheet-body';
    inner.appendChild(body);

    if (S.footer) {
      var f = document.createElement('div'); f.className = 'sheet-foot';
      f.textContent = S.footer; inner.appendChild(f);
    }
    page.appendChild(inner);
    page._body = body;
    return page;
  }

  function ghostFor(rep, i) {
    if (S.firstSolid && i === 0) return null;              /* 진한 견본 */
    if (!S.fadeOut) return S.ghost / 100;
    var start = S.ghost / 100, steps = Math.max(1, rep - 1);
    var t = (S.firstSolid ? i - 1 : i) / steps;
    return Math.max(0.04, start * (1 - t * 0.75));
  }

  /* ---------- 렌더 ---------- */
  function render() {
    var pagesEl = $('#pages');
    pagesEl.innerHTML = '';

    var script = effScript();
    /* 사용자가 직접 고르지 않았다면 언어에 맞는 기본 글씨체로 */
    if (!S.fontTouched) {
      var want = SONPEN_DEFAULT_FONT[script];
      if (want && want !== S.font) { S.font = want; buildFontList($('#fontSearch').value); }
    }
    $('#scriptHint').textContent = (S.scriptMode === 'auto' ? '자동 감지 결과: ' : '선택: ') + SCRIPT_LABEL[script];

    var pageWmm = S.orient === 'landscape' ? 297 : 210;
    var pageHmm = S.orient === 'landscape' ? 210 : 297;
    var padded = S.margin;
    var numW = S.showNumbers ? 6 : 0;
    var usableW = pageWmm - padded * 2 - numW;
    var PT = 0.3528;   /* 1pt = 0.3528mm */
    var headH = (S.title ? S.titleSize * PT * 1.35 + S.titleGap : 0) + (S.showMeta ? 9 : 0) + 5;
    var footH = S.footer ? S.footSize * PT * 1.45 + S.footGap : 0;
    var usableH = pageHmm - padded * 2 - headH - footH;
    var rowGapMM = 3;

    var rows = [];  /* {type, ...} */

    if (script === 'en') {
      var fontPx = S.lineHeightMM * (S.fontScale / 100) * MM;
      var fam = fontCss(S.font);
      var maxPx = (usableW - 2) * MM;
      S.text.split('\n').forEach(function (line) {
        if (!line.trim()) { rows.push({ type: 'line', text: '' }); return; }
        var wrapped = wrapLatin(line, fontPx, fam, S.fontWeight, maxPx);
        wrapped.forEach(function (w, wi) {
          for (var r = 0; r < S.repeat; r++) {
            rows.push({ type: 'line', text: (r === 0 || !S.firstSolid) ? w : (S.ghost > 0 ? w : ''), ghost: ghostFor(S.repeat, r) });
          }
        });
      });
      var rowH = S.lineHeightMM + rowGapMM;
      paginate(rows, Math.max(1, Math.floor(usableH / rowH)), function (page, row) {
        var lr = document.createElement('div');
        lr.className = 'line-row' + (row.ghost === null ? ' row-solid' : ' row-ghost');
        lr.style.setProperty('--linefont', (S.lineHeightMM * S.fontScale / 100) + 'mm');
        if (row.ghost !== null && row.ghost !== undefined) lr.style.setProperty('--ghost', row.ghost);
        var rules = document.createElement('div'); rules.className = 'rules';
        rules.innerHTML = '<i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i>';
        lr.appendChild(rules);
        var txt = document.createElement('div'); txt.className = 'txt'; txt.textContent = row.text;
        lr.appendChild(txt);
        page._body.appendChild(lr);
      });
    } else {
      var cellMM = (usableW - (S.cols - 1) * (S.cellGap / MM)) / S.cols;
      var cellRows = buildCellRows(S.text, S.cols);
      cellRows.forEach(function (cr) {
        for (var r = 0; r < S.repeat; r++) {
          rows.push({ type: 'cell', chars: cr.chars, ghost: ghostFor(S.repeat, r) });
        }
      });
      var rowH2 = cellMM + rowGapMM;
      var perPage = Math.max(1, Math.floor(usableH / rowH2));
      var lineNo = 0;
      paginate(rows, perPage, function (page, row) {
        lineNo++;
        var gr = document.createElement('div');
        gr.className = 'grid-row ' + (row.ghost === null ? 'row-solid' : 'row-ghost');
        if (row.ghost !== null && row.ghost !== undefined) gr.style.setProperty('--ghost', row.ghost);
        if (S.showNumbers) {
          var n = document.createElement('div'); n.className = 'rownum'; n.textContent = lineNo;
          gr.appendChild(n);
        }
        for (var c = 0; c < S.cols; c++) {
          var ch = row.chars[c];
          var cell = document.createElement('div');
          cell.className = 'cell' + (ch && ch.trim() ? '' : ' blank');
          cell.style.height = cellMM + 'mm';
          if (S.gridStyle === 'mi') {
            var d = document.createElement('span'); d.className = 'diag'; cell.appendChild(d);
          }
          var span = document.createElement('span');
          span.className = 'ch';
          span.style.fontSize = (cellMM * S.fontScale / 100) + 'mm';
          span.textContent = (ch && ch.trim()) ? ch : '';
          cell.appendChild(span);
          gr.appendChild(cell);
        }
        page._body.appendChild(gr);
      });
    }

    if (!pagesEl.children.length) pagesEl.appendChild(makePage(0));

    /* 인쇄 용지 방향 */
    var ps = $('#printStyle') || (function () {
      var e = document.createElement('style'); e.id = 'printStyle'; document.head.appendChild(e); return e;
    })();
    ps.textContent = '@page { size: A4 ' + S.orient + '; margin: 0; }';

    /* 확대/축소 */
    pagesEl.style.transform = 'scale(' + (S.zoom / 100) + ')';

    setupCanvases();
  }

  function paginate(rows, perPage, drawRow) {
    var pagesEl = $('#pages'), page = null, count = 0, idx = 0;
    rows.forEach(function (row) {
      if (!page || count >= perPage) {
        page = makePage(idx++); pagesEl.appendChild(page); count = 0;
      }
      drawRow(page, row);
      count++;
    });
  }

  /* ---------- 필기 캔버스 ---------- */
  function setupCanvases() {
    $$('#pages .page').forEach(function (page) {
      var idx = page.dataset.index;
      var cv = document.createElement('canvas');
      cv.className = 'ink-canvas';
      var w = page.clientWidth, h = page.clientHeight, dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      page.appendChild(cv);
      page._ctx = ctx; page._canvas = cv;
      if (writeMode) page.classList.add('writing');
      repaint(page);
      attachPointer(page, cv, ctx, idx);
    });
  }

  function repaint(page) {
    var ctx = page._ctx, idx = page.dataset.index;
    var w = page.clientWidth, h = page.clientHeight;
    ctx.clearRect(0, 0, w, h);
    (strokesByPage[idx] || []).forEach(function (st) {
      ctx.globalCompositeOperation = st.erase ? 'destination-out' : 'source-over';
      ctx.strokeStyle = st.color; ctx.lineWidth = st.width;
      ctx.beginPath();
      st.pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      if (st.pts.length === 1) { ctx.lineTo(st.pts[0][0] + .1, st.pts[0][1] + .1); }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function attachPointer(page, cv, ctx, idx) {
    var drawing = false, cur = null;
    function pos(e) {
      var r = cv.getBoundingClientRect();
      var sx = cv.clientWidth / r.width, sy = cv.clientHeight / r.height;
      return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
    }
    cv.addEventListener('pointerdown', function (e) {
      if (!writeMode) return;
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      drawing = true;
      cur = { color: penColor, width: eraser ? penWidth * 4 : penWidth, erase: eraser, pts: [pos(e)] };
      (strokesByPage[idx] = strokesByPage[idx] || []).push(cur);
      repaint(page);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      e.preventDefault();
      cur.pts.push(pos(e));
      ctx.globalCompositeOperation = cur.erase ? 'destination-out' : 'source-over';
      ctx.strokeStyle = cur.color; ctx.lineWidth = cur.width;
      var n = cur.pts.length;
      ctx.beginPath();
      ctx.moveTo(cur.pts[n - 2][0], cur.pts[n - 2][1]);
      ctx.lineTo(cur.pts[n - 1][0], cur.pts[n - 1][1]);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      cv.addEventListener(ev, function () { drawing = false; cur = null; });
    });
  }

  /* ---------- UI 구성 ---------- */
  function buildFontList(filter) {
    var box = $('#fontList'); box.innerHTML = '';
    var q = (filter || '').toLowerCase();
    SONPEN_FONTS.filter(function (f) {
      return !q || (f.name + ' ' + f.css + ' ' + f.kind).toLowerCase().indexOf(q) >= 0;
    }).forEach(function (f) {
      var el = document.createElement('div');
      el.className = 'fontitem' + (S.font === f.id ? ' on' : '');
      var sample = { ko: '가나다 한글 Aa', ja: 'あア漢 Aa', zh: '汉字学习 Aa', en: 'Aa Bb Cc 123' }[f.lang];
      el.innerHTML = '<span class="fname">' + sample + '</span><span class="fmeta">' + f.name + ' · ' + f.kind + '</span>';
      el.querySelector('.fname').style.fontFamily = f.css;
      el.addEventListener('click', function () {
        S.font = f.id; S.fontTouched = true;
        buildFontList($('#fontSearch').value); render();
      });
      box.appendChild(el);
    });
  }

  function buildThemes() {
    var g = $('#themeGrid'); g.innerHTML = '';
    SONPEN_THEMES.forEach(function (t) {
      var c = document.createElement('div');
      c.className = 'themecard' + (S.theme === t.id ? ' on' : '');
      c.innerHTML = '<div class="themeswatch" style="background:' + t.paper + ';box-shadow:inset 0 0 0 2px ' + t.borderColor + '"></div>' + t.name;
      c.addEventListener('click', function () { applyTheme(t); });
      g.appendChild(c);
    });
  }

  function applyTheme(t) {
    S.theme = t.id;
    S.paperColor = t.paper; S.gridColor = t.grid; S.inkColor = t.ink;
    S.borderStyle = t.border; S.borderColor = t.borderColor;
    S.emojis = t.emoji ? t.emoji.split(' ').filter(Boolean) : [];
    S.emojiPlace = t.place;
    syncInputs(); buildThemes(); buildEmojiChips(); render();
  }

  function buildEmojiChips() {
    var box = $('#emojiChips'); box.innerHTML = '';
    SONPEN_EMOJIS.forEach(function (e) {
      var b = document.createElement('button');
      b.className = 'chip' + (S.emojis.indexOf(e) >= 0 ? ' on' : '');
      b.textContent = e;
      b.addEventListener('click', function () {
        var i = S.emojis.indexOf(e);
        if (i >= 0) S.emojis.splice(i, 1); else S.emojis.push(e);
        buildEmojiChips(); render();
      });
      box.appendChild(b);
    });
  }

  /* ---------- 추천 문구 ---------- */
  var phraseCat = 'feel';

  function usePhrase(p) {
    $('#inputText').value = p.text;
    S.text = p.text;
    if (S.autoCorrect) runCorrection(true);
    render();
    markPhrase(p);
  }

  function markPhrase(p) {
    $$('#phraseList .phrase').forEach(function (el) {
      el.classList.toggle('on', el.dataset.text === p.text);
    });
  }

  function buildPhraseList() {
    var box = $('#phraseList'); if (!box) return;
    box.innerHTML = '';
    SONPEN_PHRASES.forEach(function (p) {
      if (p.cat !== phraseCat) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'phrase' + (p.text === S.text ? ' on' : '');
      b.dataset.text = p.text;

      var t = document.createElement('span');
      t.className = 'ptext';
      t.textContent = p.text.split('\n').join(' / ');
      b.appendChild(t);

      if (p.from) {
        var f = document.createElement('span');
        f.className = 'pfrom';
        f.textContent = p.from;
        b.appendChild(f);
      }
      b.addEventListener('click', function () { usePhrase(p); });
      box.appendChild(b);
    });
  }

  function buildPresets() {
    var bar = $('#phraseCats'); if (!bar) return;
    bar.innerHTML = '';
    SONPEN_PHRASE_CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ornpack' + (c.id === phraseCat ? ' on' : '');
      b.textContent = c.name;
      b.title = c.desc;
      b.addEventListener('click', function () {
        phraseCat = c.id;
        $$('#phraseCats .ornpack').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        buildPhraseList();
      });
      bar.appendChild(b);
    });
    buildPhraseList();

    var rnd = $('#btnPhraseRandom');
    if (rnd) rnd.addEventListener('click', function () {
      var p = SONPEN_RANDOM_PHRASE(phraseCat);
      usePhrase(p);
    });
  }

  /* ---------- 교정 ---------- */
  function runCorrection(silent) {
    var res = SonpenCorrector.correct($('#inputText').value);
    $('#inputText').value = res.text;
    S.text = res.text;
    var rep = $('#correctionReport');
    if (!res.changes.length) {
      rep.classList.add('hidden');
    } else {
      rep.classList.remove('hidden');
      rep.innerHTML = '<b>교정 ' + res.changes.length + '건</b><br>' + res.changes.map(function (c) {
        return '· <span class="del">' + esc(c.from) + '</span> → <b>' + esc(c.to) + '</b>' +
               (c.count > 1 ? ' ×' + c.count : '') + (c.rule ? ' <span style="opacity:.6">(' + esc(c.rule) + ')</span>' : '');
      }).join('<br>');
    }
    if (!silent) render();
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; }); }

  /* ---------- 제목 / 응원 문구 글씨체 목록 ---------- */
  function buildHeadFontSelects() {
    ['#titleFont', '#footFont'].forEach(function (sel) {
      var el = $(sel); if (!el) return;
      el.innerHTML = '';
      var o0 = document.createElement('option');
      o0.value = ''; o0.textContent = '본문 글씨체와 같게';
      el.appendChild(o0);
      var groups = { ko: '한글', ja: '일본어', zh: '중국어', en: '알파벳' };
      Object.keys(groups).forEach(function (lang) {
        var g = document.createElement('optgroup'); g.label = groups[lang];
        SONPEN_FONTS.forEach(function (f) {
          if (f.lang !== lang) return;
          var o = document.createElement('option');
          o.value = f.id; o.textContent = f.name;
          o.style.fontFamily = f.css;
          g.appendChild(o);
        });
        if (g.children.length) el.appendChild(g);
      });
    });
  }

  /* ---------- 입력 바인딩 ---------- */
  function bind() {
    /* 탭 */
    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.tab').forEach(function (x) { x.classList.remove('active'); });
        $$('.tabpage').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        $('.tabpage[data-page="' + t.dataset.tab + '"]').classList.add('active');
      });
    });
    $('#btnPanel').addEventListener('click', function () { $('#panel').classList.toggle('open'); });

    var typingTimer;
    $('#inputText').addEventListener('input', function () {
      S.text = this.value;
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function () {
        if (S.autoCorrect) runCorrection(true);
        render();
      }, 450);
    });
    $('#btnCorrectNow').addEventListener('click', function () { runCorrection(false); });
    $('#autoCorrect').addEventListener('change', function () { S.autoCorrect = this.checked; });

    var simple = [
      ['#scriptMode', 'scriptMode', 'value'],
      ['#repeat', 'repeat', 'number', '#repeatVal'],
      ['#ghostOpacity', 'ghost', 'number', '#opacityVal'],
      ['#firstSolid', 'firstSolid', 'check'],
      ['#fadeOut', 'fadeOut', 'check'],
      ['#showNumbers', 'showNumbers', 'check'],
      ['#cols', 'cols', 'number', '#colsVal'],
      ['#cellGap', 'cellGap', 'number', '#gapVal'],
      ['#lineHeightMM', 'lineHeightMM', 'number', '#lineHVal'],
      ['#gridColor', 'gridColor', 'value'],
      ['#inkColor', 'inkColor', 'value'],
      ['#fontScale', 'fontScale', 'number', '#fontScaleVal'],
      ['#fontWeight', 'fontWeight', 'value'],
      ['#paperColor', 'paperColor', 'value'],
      ['#borderStyle', 'borderStyle', 'value'],
      ['#borderColor', 'borderColor', 'value'],
      ['#sheetTitle', 'title', 'value'],
      ['#showMeta', 'showMeta', 'check'],
      ['#sheetFooter', 'footer', 'value'],
      ['#titleFont', 'titleFont', 'value'],
      ['#titleSize', 'titleSize', 'number', '#titleSizeVal'],
      ['#titleWeight', 'titleWeight', 'value'],
      ['#titleSpace', 'titleSpace', 'number', '#titleSpaceVal'],
      ['#titleGap', 'titleGap', 'number', '#titleGapVal'],
      ['#titleAlign', 'titleAlign', 'value'],
      ['#titleOpacity', 'titleOpacity', 'number', '#titleOpacityVal'],
      ['#footFont', 'footFont', 'value'],
      ['#footSize', 'footSize', 'number', '#footSizeVal'],
      ['#footWeight', 'footWeight', 'value'],
      ['#footSpace', 'footSpace', 'number', '#footSpaceVal'],
      ['#footGap', 'footGap', 'number', '#footGapVal'],
      ['#footAlign', 'footAlign', 'value'],
      ['#footOpacity', 'footOpacity', 'number', '#footOpacityVal'],
      ['#emojiCustom', 'emojiCustom', 'value'],
      ['#emojiPlace', 'emojiPlace', 'value'],
      ['#emojiSize', 'emojiSize', 'number'],
      ['#imgPlace', 'imgPlace', 'value'],
      ['#imgSize', 'imgSize', 'number'],
      ['#imgOpacity', 'imgOpacity', 'number'],
      ['#margin', 'margin', 'number', '#marginVal'],
      ['#zoom', 'zoom', 'number', '#zoomVal']
    ];
    simple.forEach(function (cfg) {
      var el = $(cfg[0]); if (!el) return;
      var handler = function () {
        S[cfg[1]] = cfg[2] === 'check' ? el.checked : (cfg[2] === 'number' ? Number(el.value) : el.value);
        if (cfg[3]) $(cfg[3]).textContent = el.value;
        render();
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });

    $$('input[name=gridStyle]').forEach(function (r) {
      r.addEventListener('change', function () { S.gridStyle = this.value; render(); });
    });
    $$('input[name=orient]').forEach(function (r) {
      r.addEventListener('change', function () { S.orient = this.value; render(); });
    });

    $('#fontSearch').addEventListener('input', function () { buildFontList(this.value); });

    $('#imgUpload').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { S.imgData = fr.result; render(); };
      fr.readAsDataURL(f);
    });
    $('#btnImgClear').addEventListener('click', function () {
      S.imgData = ''; $('#imgUpload').value = ''; render();
    });

    /* 인쇄 */
    $('#btnPrint').addEventListener('click', function () {
      var z = S.zoom; S.zoom = 100; $('#pages').style.transform = 'none';
      window.print();
      setTimeout(function () { S.zoom = z; $('#pages').style.transform = 'scale(' + (z / 100) + ')'; }, 400);
    });

    /* 쓰기 모드 */
    $('#btnWriteMode').addEventListener('click', toggleWrite);
    $('#btnExitWrite').addEventListener('click', toggleWrite);
    $('#penColor').addEventListener('input', function () { penColor = this.value; eraser = false; $('#btnEraser').classList.remove('active'); });
    $('#penWidth').addEventListener('input', function () { penWidth = Number(this.value); });
    $('#btnEraser').addEventListener('click', function () { eraser = !eraser; this.classList.toggle('active', eraser); });
    $('#btnUndo').addEventListener('click', function () {
      var keys = Object.keys(strokesByPage).filter(function (k) { return strokesByPage[k].length; });
      if (!keys.length) return;
      var last = keys[keys.length - 1];
      strokesByPage[last].pop();
      $$('#pages .page').forEach(repaint);
    });
    $('#btnClearInk').addEventListener('click', function () {
      strokesByPage = {}; $$('#pages .page').forEach(repaint);
    });

    /* 저장 */
    $('#btnSave').addEventListener('click', function () {
      try { localStorage.setItem('sonpen.settings', JSON.stringify(S)); alert('설정을 저장했습니다.'); }
      catch (e) { alert('저장하지 못했습니다: ' + e.message); }
    });
    $('#btnReset').addEventListener('click', function () {
      localStorage.removeItem('sonpen.settings'); location.reload();
    });

    window.addEventListener('resize', function () {
      clearTimeout(window._rs); window._rs = setTimeout(render, 200);
    });
  }

  function toggleWrite() {
    writeMode = !writeMode;
    $('#penBar').classList.toggle('hidden', !writeMode);
    $('#btnWriteMode').classList.toggle('active', writeMode);
    $$('#pages .page').forEach(function (p) { p.classList.toggle('writing', writeMode); });
  }

  /* ---------- 입력값 ← 상태 동기화 ---------- */
  function syncInputs() {
    $('#inputText').value = S.text;
    $('#autoCorrect').checked = S.autoCorrect;
    $('#scriptMode').value = S.scriptMode;
    $('#repeat').value = S.repeat; $('#repeatVal').textContent = S.repeat;
    $('#ghostOpacity').value = S.ghost; $('#opacityVal').textContent = S.ghost;
    $('#firstSolid').checked = S.firstSolid;
    $('#fadeOut').checked = S.fadeOut;
    $('#showNumbers').checked = S.showNumbers;
    $$('input[name=gridStyle]').forEach(function (r) { r.checked = (r.value === S.gridStyle); });
    $('#cols').value = S.cols; $('#colsVal').textContent = S.cols;
    $('#cellGap').value = S.cellGap; $('#gapVal').textContent = S.cellGap;
    $('#lineHeightMM').value = S.lineHeightMM; $('#lineHVal').textContent = S.lineHeightMM;
    $('#gridColor').value = S.gridColor;
    $('#inkColor').value = S.inkColor;
    $('#fontScale').value = S.fontScale; $('#fontScaleVal').textContent = S.fontScale;
    $('#fontWeight').value = S.fontWeight;
    $('#paperColor').value = S.paperColor;
    $('#borderStyle').value = S.borderStyle;
    $('#borderColor').value = S.borderColor;
    $('#sheetTitle').value = S.title;
    $('#showMeta').checked = S.showMeta;
    $('#sheetFooter').value = S.footer;
    $('#titleFont').value = S.titleFont;
    $('#titleSize').value = S.titleSize; $('#titleSizeVal').textContent = S.titleSize;
    $('#titleWeight').value = S.titleWeight;
    $('#titleSpace').value = S.titleSpace; $('#titleSpaceVal').textContent = S.titleSpace;
    $('#titleGap').value = S.titleGap; $('#titleGapVal').textContent = S.titleGap;
    $('#titleAlign').value = S.titleAlign;
    $('#titleOpacity').value = S.titleOpacity; $('#titleOpacityVal').textContent = S.titleOpacity;
    $('#footFont').value = S.footFont;
    $('#footSize').value = S.footSize; $('#footSizeVal').textContent = S.footSize;
    $('#footWeight').value = S.footWeight;
    $('#footSpace').value = S.footSpace; $('#footSpaceVal').textContent = S.footSpace;
    $('#footGap').value = S.footGap; $('#footGapVal').textContent = S.footGap;
    $('#footAlign').value = S.footAlign;
    $('#footOpacity').value = S.footOpacity; $('#footOpacityVal').textContent = S.footOpacity;
    $('#emojiCustom').value = S.emojiCustom;
    $('#emojiPlace').value = S.emojiPlace;
    $('#emojiSize').value = S.emojiSize;
    $('#imgPlace').value = S.imgPlace;
    $('#imgSize').value = S.imgSize;
    $('#imgOpacity').value = S.imgOpacity;
    $$('input[name=orient]').forEach(function (r) { r.checked = (r.value === S.orient); });
    $('#margin').value = S.margin; $('#marginVal').textContent = S.margin;
    $('#zoom').value = S.zoom; $('#zoomVal').textContent = S.zoom;
  }

  /* ---------- 시작 ---------- */
  function init() {
    var hadSavedText = false;
    try {
      var saved = localStorage.getItem('sonpen.settings');
      if (saved) {
        var o = JSON.parse(saved);
        Object.keys(o).forEach(function (k) { if (k in S) S[k] = o[k]; });
        hadSavedText = !!(o.text && String(o.text).trim());
      }
    } catch (e) { /* 무시 */ }

    /* 저장해 둔 문구가 없으면 열 때마다 다른 문구를 깔아 줍니다.
       직접 저장한 문구가 있으면 그것을 그대로 지킵니다. */
    if (!hadSavedText) {
      var pick = SONPEN_RANDOM_PHRASE();
      S.text = pick.text;
      for (var ci = 0; ci < SONPEN_PHRASE_CATS.length; ci++) {
        if (SONPEN_PHRASE_CATS[ci].id === pick.cat) { phraseCat = pick.cat; break; }
      }
    }

    bind();
    buildHeadFontSelects();
    syncInputs();
    buildFontList('');
    buildThemes();
    buildEmojiChips();
    buildPresets();
    render();

    /* 웹폰트 로딩이 끝나면 폭 계산이 달라지므로 한 번 더 그림 */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { render(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
