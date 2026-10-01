/*!
 * 손펜 (Sonpen) — 손글씨 연습장 만들기 · 인터랙션 모션
 * Copyright (c) 2026 황성재 (Hwang Seongjae) · Instagram @hirame.ki
 * All Rights Reserved. 모든 권리 보유.
 * SPDX-License-Identifier: LicenseRef-Sonpen-Restricted
 */
/* 손펜 · 인터랙션 모션 (app.js 는 건드리지 않습니다)
   app.js 는 무엇을 바꾸든 #pages 를 통째로 다시 그립니다. 그래서
   1) 누르기 직전(capture 단계)에 "무엇을 눌렀는지"와 지금 종이의 복제본을 잡아 두고
   2) #pages 가 새로 그려지는 순간(MutationObserver) 그 종류에 맞는 전환을 재생합니다.
   슬라이더·글자 입력처럼 연속으로 바뀌는 값은 의도를 남기지 않으므로 움직이지 않습니다.

   테마      : 잉크가 번지듯 왼쪽 위에서 새 종이가 퍼짐
   격자      : 칸이 물결처럼 차례로 깔림 (4선 노트는 선이 그어짐)
   글씨체    : 글자가 차례로 떠오름
   추천 문구 : 견본 줄이 한 글자씩 써지고, 따라쓰기 줄이 이어서 나타남
   용지 방향 : 종이가 뒤집히며 돌아감
   문양·그림 : 장식이 톡톡 튀어나옴
   인쇄      : 인쇄 헤드가 종이를 훑은 뒤 인쇄 창을 엶 */
(function () {
  'use strict';
  if (!window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var G = window.gsap || null;
  var pagesEl = $('#pages'), stage = $('#stage');
  var now = function () { return Date.now(); };
  var restart = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* =====================================================================
     1. 누름 물결
     ===================================================================== */
  var RIPPLE = '.btn, .ornpack, .phrase, .vm-item, .vm-close, .sa-fold, .tab';
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var t = e.target;
    var host = t.closest && t.closest(RIPPLE);
    if (!host) { var opt = t.closest && t.closest('.opt'); host = opt && opt.querySelector('span'); }
    if (!host || host.disabled) return;
    var r = host.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var wrap = document.createElement('span');
    wrap.className = 'mo-rip';
    var dot = document.createElement('i');
    dot.style.width = dot.style.height = size + 'px';
    dot.style.left = (e.clientX - r.left - size / 2) + 'px';
    dot.style.top = (e.clientY - r.top - size / 2) + 'px';
    wrap.appendChild(dot);
    host.appendChild(wrap);
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 700);
  }, true);

  /* =====================================================================
     2. 단계 레일 — 밑줄이 미끄러지고 내용이 옆에서 밀려 들어옴
     ===================================================================== */
  var tabsEl = $('.tabs'), tabs = $$('.tab'), bar = null;
  var activeIndex = function () {
    for (var i = 0; i < tabs.length; i++) if (tabs[i].classList.contains('active')) return i;
    return 0;
  };
  function placeBar(animate) {
    if (!bar) return;
    var t = tabs[activeIndex()];
    if (!t) return;
    if (!G) { bar.style.transform = 'translateX(' + t.offsetLeft + 'px)'; bar.style.width = t.offsetWidth + 'px'; return; }
    if (animate) G.to(bar, { x: t.offsetLeft, width: t.offsetWidth, duration: .5, ease: 'power3.out', overwrite: true });
    else G.set(bar, { x: t.offsetLeft, width: t.offsetWidth, overwrite: true });
  }
  if (tabsEl && tabs.length) {
    bar = document.createElement('span');
    bar.className = 'mo-tabbar';
    bar.setAttribute('aria-hidden', 'true');
    tabsEl.appendChild(bar);
    tabsEl.classList.add('mo-ready');
    placeBar(false);
    window.addEventListener('resize', function () { placeBar(false); });
    window.addEventListener('load', function () { placeBar(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeBar(false); });

    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.tab');
      if (!t) return;
      var from = activeIndex();
      setTimeout(function () {
        var to = activeIndex();
        if (to === from) return;
        var dir = to > from ? 1 : -1;
        placeBar(true);
        restart(tabs[to], 'mo-pop');
        var next = $('#wizNext');
        if (next) restart(next, 'mo-shine');
        /* 가로 스크롤 레일(모바일)이면 고른 단계를 가운데로 */
        if (tabsEl.scrollWidth > tabsEl.clientWidth + 2) {
          var tt = tabs[to];
          tabsEl.scrollTo({ left: tt.offsetLeft - (tabsEl.clientWidth - tt.offsetWidth) / 2, behavior: 'smooth' });
        }
        var page = $('.tabpage.active');
        if (G && page) {
          G.fromTo(page.children, { opacity: 0, x: 26 * dir }, {
            opacity: 1, x: 0, duration: .46, ease: 'power3.out', stagger: .045, clearProps: 'opacity,transform'
          });
        }
      }, 0);
    }, true);
  }

  /* =====================================================================
     3. 종이 전환 — 누른 것의 종류를 기억했다가 #pages 가 다시 그려질 때 재생
     ===================================================================== */
  var pending = null;   // { kind, until, played }
  var ghost = null;     // 바뀌기 전 종이의 복제본
  var NEEDS_GHOST = { theme: 1, grid: 1, font: 1, write: 1, orient: 1, fade: 1 };
  var GHOST_ON_TOP = { grid: 1, font: 1, write: 1, orient: 1, fade: 1 };

  function removeGhost() {
    if (!ghost) return;
    if (G) G.killTweensOf(ghost.querySelectorAll('.page'));
    if (G) G.killTweensOf(ghost);
    if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
  }

  function settle(pages) {
    if (!G) return;
    pages.forEach(function (p) {
      G.killTweensOf(p);
      G.killTweensOf(p.querySelectorAll('*'));
      G.set(p, { clearProps: 'clipPath,transform,opacity' });
    });
  }

  function intend(kind, ttl) {
    if (!G || !pagesEl || !stage) return;
    var t = now();
    /* 셀렉트는 input · change 가 연달아 와서 두 번 그립니다. 한 번만 잡습니다. */
    if (pending && pending.kind === kind && t < pending.until && !pending.played) return;
    removeGhost();
    settle($$('#pages .page'));
    pending = { kind: kind, until: t + (ttl || 450), played: false };

    if (!NEEDS_GHOST[kind] || !pagesEl.firstChild) return;
    ghost = pagesEl.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('mo-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.left = pagesEl.offsetLeft + 'px';
    ghost.style.top = pagesEl.offsetTop + 'px';
    ghost.style.width = pagesEl.offsetWidth + 'px';
    ghost.style.zIndex = GHOST_ON_TOP[kind] ? 2 : 0;
    /* 필기 캔버스는 복제되지 않으므로 그림을 옮겨 둡니다 */
    var src = $$('canvas', pagesEl), dst = $$('canvas', ghost);
    dst.forEach(function (c, i) {
      var s = src[i]; if (!s || !s.width) return;
      try { c.getContext('2d').drawImage(s, 0, 0); } catch (err) {}
    });
    stage.insertBefore(ghost, pagesEl);

    var g = ghost;
    setTimeout(function () {
      /* 다시 그려지지 않았으면(같은 값을 또 누른 경우 등) 조용히 치웁니다 */
      if (ghost === g && pending && !pending.played) removeGhost();
    }, (ttl || 450) + 50);
  }

  function ghostOut(kind) {
    if (!ghost) return;
    var g = ghost, gp = $$('.page', g);
    var done = function () { if (ghost === g) removeGhost(); };
    if (kind === 'theme') { G.delayedCall(.9, done); return; }
    if (kind === 'orient') {
      G.to(gp, { rotationY: 90, opacity: 0, transformPerspective: 1600, duration: .3, ease: 'power2.in', onComplete: done });
      return;
    }
    if (kind === 'font') {
      G.to(g, { opacity: 0, filter: 'blur(2px)', duration: .32, ease: 'power1.out', onComplete: done });
      return;
    }
    G.to(g, { opacity: 0, duration: kind === 'write' ? .2 : .28, ease: 'power1.out', onComplete: done });
  }

  function decoPop(pages, delay) {
    var ems = [];
    pages.slice(0, 2).forEach(function (p) { ems = ems.concat($$('.deco .em, .deco-img', p)); });
    if (!ems.length) return;
    G.from(ems, {
      scale: 0, rotation: -40, opacity: 0, duration: .5, delay: delay || 0,
      ease: 'back.out(2.2)', stagger: { amount: Math.min(.5, ems.length * .04) },
      clearProps: 'transform,opacity'
    });
  }

  function restFade(pages, delay) {
    if (pages.length < 2) return;
    G.from(pages.slice(1), { opacity: 0, duration: .45, delay: delay || .1, ease: 'power1.out', clearProps: 'opacity' });
  }

  function animateNew(kind) {
    var pages = $$('#pages .page');
    var p0 = pages[0];
    if (!p0) return;

    switch (kind) {
      case 'theme':
        G.fromTo(pages, { clipPath: 'circle(0% at 0% 0%)' }, {
          clipPath: 'circle(145% at 0% 0%)', duration: .85, ease: 'power2.inOut', clearProps: 'clipPath'
        });
        decoPop(pages, .45);
        break;

      case 'grid':
        var cells = $$('.cell', p0);
        if (cells.length) {
          G.from(cells, {
            scale: .45, opacity: 0, duration: .42, ease: 'back.out(1.7)',
            stagger: { amount: .6, grid: 'auto', from: 'start' }, clearProps: 'transform,opacity'
          });
        } else {
          G.from($$('.rules i', p0), {
            scaleX: 0, transformOrigin: 'left center', duration: .5, ease: 'power2.out',
            stagger: { amount: .55 }, clearProps: 'transform'
          });
          G.from($$('.txt', p0), { opacity: 0, duration: .4, delay: .35, clearProps: 'opacity' });
        }
        restFade(pages, .2);
        break;

      case 'font':
        var chars = $$('.ch, .txt, .sheet-title, .sheet-foot', p0);
        G.from(chars, {
          opacity: 0, y: 7, duration: .38, ease: 'power2.out',
          stagger: { amount: Math.min(.45, chars.length * .01) }, clearProps: 'opacity,transform'
        });
        restFade(pages, .15);
        break;

      case 'write':
        var rows = $$('.grid-row, .line-row', p0);
        var lead = $('.row-solid', p0) || rows[0];
        if (lead) {
          var glyphs = $$('.ch', lead).filter(function (c) { return (c.textContent || '').trim(); });
          if (glyphs.length) {
            var each = Math.min(.06, 1.1 / glyphs.length);
            G.fromTo(glyphs, { clipPath: 'inset(0% 100% 0% 0%)' }, {
              clipPath: 'inset(0% 0% 0% 0%)', duration: .16, ease: 'none', stagger: each, clearProps: 'clipPath'
            });
          } else {
            var line = $('.txt', lead);
            if (line) G.fromTo(line, { clipPath: 'inset(0% 100% 0% 0%)' }, {
              clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power1.inOut', clearProps: 'clipPath'
            });
          }
        }
        var rest = rows.filter(function (r) { return r !== lead; });
        if (rest.length) G.from(rest, {
          opacity: 0, y: 5, duration: .4, delay: .25, ease: 'power2.out',
          stagger: { amount: Math.min(.7, rest.length * .035) }, clearProps: 'opacity,transform'
        });
        restFade(pages, .3);
        break;

      case 'orient':
        G.fromTo(pages, { rotationY: -90, opacity: 0, transformPerspective: 1600 }, {
          rotationY: 0, opacity: 1, duration: .6, delay: .24, ease: 'power3.out', clearProps: 'transform,opacity'
        });
        break;

      case 'deco':
        decoPop(pages, 0);
        break;

      case 'border':
        G.from($$('.frame', p0), { opacity: 0, scale: 1.035, duration: .5, ease: 'power2.out', clearProps: 'opacity,transform' });
        break;

      default: /* fade — 겹쳐 놓은 복제본이 사라지는 것만으로 충분합니다 */
        break;
    }
  }

  if (G && pagesEl) {
    new MutationObserver(function () {
      if (!pending || now() > pending.until) return;
      var first = !pending.played;
      pending.played = true;
      /* 같은 동작에서 한 번 더 그려져도 잇달아 받을 수 있게 잠깐 열어 둡니다 */
      pending.until = Math.min(pending.until, now() + 120);
      if (first) ghostOut(pending.kind);
      animateNew(pending.kind);
    }).observe(pagesEl, { childList: true });
  }

  /* 무엇을 눌렀는지 → 전환 종류 */
  var CLICKS = [
    ['.themecard', 'theme'],
    ['.fontitem', 'font'],
    ['.phrase, #btnPhraseRandom', 'write'],
    ['#emojiChips .chip', 'deco'],
    ['#btnImgClear', 'deco'],
    ['#btnCorrectNow', 'fade']
  ];
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    for (var i = 0; i < CLICKS.length; i++) {
      if (t.closest(CLICKS[i][0])) { intend(CLICKS[i][1]); return; }
    }
  }, true);

  function fieldKind(el) {
    if (!el || !el.closest || !el.closest('#panel')) return null;
    if (el.name === 'gridStyle') return 'grid';
    if (el.name === 'orient') return 'orient';
    switch (el.id) {
      case 'scriptMode': return 'grid';
      case 'fontWeight': return 'font';
      case 'borderStyle': return 'border';
      case 'emojiPlace': return 'deco';
      case 'autoCorrect': return null;
    }
    if (el.tagName === 'SELECT' || el.type === 'checkbox') return 'fade';
    return null;   // 슬라이더 · 글자 · 색은 연속 입력이라 움직이지 않습니다
  }
  ['input', 'change'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var el = e.target;
      if (el && el.id === 'imgUpload') { if (ev === 'change') intend('deco', 3000); return; }
      var k = fieldKind(el);
      if (k) intend(k);
    }, true);
  });

  /* =====================================================================
     4. 고른 것이 톡 — 다시 그려지는 목록은 그려진 뒤에 찾아서 튕깁니다
     ===================================================================== */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    var chip = t.closest('#emojiChips .chip');
    if (chip) {
      var ch = (chip.textContent || '').trim();
      setTimeout(function () {
        $$('#emojiChips .chip').forEach(function (c) { if ((c.textContent || '').trim() === ch) restart(c, 'mo-hit'); });
      }, 0);
      return;
    }
    if (t.closest('.themecard')) {
      setTimeout(function () { var on = $('.themecard.on'); if (on) restart(on, 'mo-hit'); }, 0);
      return;
    }
    if (t.closest('.fontitem')) {
      setTimeout(function () { var on = $('.fontitem.on'); if (on) restart(on, 'mo-hit'); }, 0);
      return;
    }
    if (t.closest('.phrase, #btnPhraseRandom')) {
      var ta = $('#inputText');
      if (ta) restart(ta, 'mo-flash');
      if (G && t.closest('#btnPhraseRandom')) {
        G.fromTo('#btnPhraseRandom', { rotation: -8 }, { rotation: 0, duration: .6, ease: 'elastic.out(1.2,.35)', clearProps: 'transform' });
      }
      return;
    }
    /* 추천 문구 분류 → 목록이 차례로 */
    if (G && t.closest('#phraseCats .ornpack')) {
      setTimeout(function () {
        G.from($$('#phraseList .phrase').slice(0, 12), {
          opacity: 0, y: 10, duration: .36, ease: 'power2.out', stagger: .03, clearProps: 'opacity,transform'
        });
      }, 0);
      return;
    }
    /* 문양 묶음 → 칩이 차례로 */
    if (G && t.closest('#ornPacks .ornpack')) {
      setTimeout(function () {
        G.from($$('#emojiChips .chip:not([hidden])'), {
          opacity: 0, scale: .6, duration: .38, ease: 'back.out(2)', stagger: .025, clearProps: 'opacity,transform'
        });
      }, 0);
    }
  }, true);

  /* 교정 결과가 펼쳐지듯 */
  var rep = $('#correctionReport');
  if (G && rep) {
    var wasHidden = rep.classList.contains('hidden');
    new MutationObserver(function () {
      var hid = rep.classList.contains('hidden');
      if (wasHidden && !hid) {
        G.from(rep, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: .38, ease: 'power2.out', clearProps: 'all' });
      }
      wasHidden = hid;
    }).observe(rep, { attributes: true, attributeFilter: ['class'] });
  }

  /* 슬라이더 숫자가 바뀌면 살짝 부풀었다 돌아옴 */
  if (G) {
    $$('.label b[id], .numv').forEach(function (el) {
      new MutationObserver(function () {
        G.fromTo(el, { scale: 1.28 }, { scale: 1, duration: .3, ease: 'power2.out', overwrite: true, clearProps: 'transform' });
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* =====================================================================
     5. 쓰기 모드 · 도구 접기 · 지우기
     ===================================================================== */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    if (t.closest('#btnWriteMode, #btnWriteMode2, #btnExitWrite')) {
      setTimeout(function () {
        var bar = $('#penBar');
        var on = bar && !bar.classList.contains('hidden');
        if (on) {
          if (G) {
            G.from(bar, { y: -18, opacity: 0, duration: .42, ease: 'power3.out', clearProps: 'opacity,transform' });
            G.from(bar.children, { y: -8, opacity: 0, duration: .36, delay: .08, ease: 'power2.out', stagger: .035, clearProps: 'opacity,transform' });
          }
          visiblePages().slice(0, 2).forEach(function (p) { restart(p, 'mo-glow'); setTimeout(function () { p.classList.remove('mo-glow'); }, 950); });
        } else if (G) {
          var sa = $('#stageActions');
          if (sa) G.from(sa.children, { y: -10, opacity: 0, duration: .38, ease: 'power3.out', stagger: .05, clearProps: 'opacity,transform' });
        }
      }, 0);
      return;
    }

    if (t.closest('#btnStageFold') && G) {
      setTimeout(function () {
        G.fromTo('#btnStageFold', { rotation: -28 }, { rotation: 0, duration: .7, ease: 'elastic.out(1,.4)', clearProps: 'transform' });
        var sa = $('#stageActions');
        if (sa && !sa.classList.contains('folded')) {
          G.from('#stageActionBtns', { opacity: 0, x: 22, scale: .92, transformOrigin: 'right center', duration: .4, ease: 'back.out(1.6)', clearProps: 'opacity,transform' });
        }
      }, 0);
      return;
    }

    if (t.closest('#btnClearInk')) {
      visiblePages().slice(0, 2).forEach(function (p) { overlay(p, 'mo-sweep', 650); });
      return;
    }

    if (t.closest('#btnUndo') && G) {
      G.fromTo('#btnUndo', { rotation: 0 }, { rotation: -10, duration: .12, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' });
    }
  }, true);

  function visiblePages() {
    var vh = window.innerHeight;
    var all = $$('#pages .page');
    var vis = all.filter(function (p) { var r = p.getBoundingClientRect(); return r.bottom > 60 && r.top < vh - 60; });
    return vis.length ? vis : all.slice(0, 1);
  }
  function overlay(page, cls, life) {
    var d = document.createElement('div');
    d.className = cls;
    page.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, life);
    return d;
  }

  /* =====================================================================
     6. 인쇄 — 인쇄 헤드가 종이를 한 번 훑은 뒤 원래 동작(인쇄 창)으로
     ===================================================================== */
  var printing = false, pass = false;
  document.addEventListener('click', function (e) {
    if (pass) return;
    var b = e.target.closest && e.target.closest('#btnPrint');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    if (printing) return;
    printing = true;
    var page = visiblePages()[0];
    if (page) {
      overlay(page, 'mo-scan', 700);
      if (G) G.fromTo(page, { y: 0 }, { y: -8, duration: .3, yoyo: true, repeat: 1, ease: 'power2.inOut', clearProps: 'transform' });
    }
    setTimeout(function () {
      printing = false;
      pass = true;
      try { b.click(); } finally { pass = false; }
    }, 640);
  }, true);
})();
