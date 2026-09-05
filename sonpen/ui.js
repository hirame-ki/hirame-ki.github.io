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
/* 손펜 · UI 보조 스크립트 (app.js 는 건드리지 않습니다)
   1) 오프닝 애니메이션 정리
   2) 6단계 이전/다음 이동 (실제로는 기존 .tab 버튼을 눌러줍니다)
   3) 장식 문양 묶음(팩) 필터 — #emojiChips 의 칩을 보여주거나 감춥니다 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------- 1. 오프닝 ---------- */
  var op = $('#opening');
  if (op) {
    var close = function () { op.classList.add('done'); };
    setTimeout(close, 4000);
    op.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close();
    }, { once: true });
  }

  /* ---------- 2. 단계 이동 ---------- */
  var LABELS = ['다음 · 머리말과 꼬리말', '다음 · 격자', '다음 · 글씨체', '다음 · 꾸미기', '다음 · 용지와 인쇄', '🖨️ 인쇄 / PDF로 저장'];
  var tabs = $$('.tab');
  var prevBtn = $('#wizPrev'), nextBtn = $('#wizNext'), scroll = $('.panel-scroll');

  function index() {
    for (var i = 0; i < tabs.length; i++) if (tabs[i].classList.contains('active')) return i;
    return 0;
  }
  function sync() {
    var i = index();
    if (nextBtn) nextBtn.textContent = LABELS[i] || LABELS[LABELS.length - 1];
    if (prevBtn) prevBtn.disabled = (i === 0);
    if (prevBtn) prevBtn.style.opacity = (i === 0) ? '.45' : '1';
  }
  function goto(i) {
    if (i < 0 || i >= tabs.length) return;
    tabs[i].click();
    if (scroll) scroll.scrollTop = 0;
    sync();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { setTimeout(sync, 0); }); });
  if (prevBtn) prevBtn.addEventListener('click', function () { goto(index() - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    var i = index();
    if (i >= tabs.length - 1) { var p = $('#btnPrint'); if (p) p.click(); return; }
    goto(i + 1);
  });
  sync();

  /* ---------- 3. 장식 문양 팩 ---------- */
  var packs = (window.SONPEN_ORN_PACKS || []);
  var box = $('#emojiChips'), packBar = $('#ornPacks');
  if (packs.length && box && packBar) {
    var current = packs[0].id;

    var filter = function () {
      var set = null;
      packs.forEach(function (p) { if (p.id === current) set = p.chars; });
      $$('#emojiChips .chip').forEach(function (c) {
        var ch = (c.textContent || '').trim();
        var show = !set || set.indexOf(ch) >= 0;
        if (show) c.removeAttribute('hidden'); else c.setAttribute('hidden', '');
      });
    };

    packs.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ornpack' + (p.id === current ? ' on' : '');
      b.textContent = p.name;
      b.addEventListener('click', function () {
        current = p.id;
        $$('.ornpack').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        filter();
      });
      packBar.appendChild(b);
    });

    filter();
    new MutationObserver(filter).observe(box, { childList: true });
  }
})();
