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

  /* ---------- 4. 손글씨 영상 팝업 ---------- */
  var VIDEOS = [
    { id: '0haMrMpiUR4', vertical: true, tag: '1분 쇼츠', title: '아이들 글씨, 알아볼 수 있나요?',
      desc: '요즘 아이들의 손글씨, 한번 들여다볼까요?' },
    { id: 'A0Geav86hPk', tag: '다큐', title: 'AI 시대, 한글 쓰기가 힘든 아이들',
      desc: '손글씨가 뇌에 미치는 놀라운 영향' },
    { id: 'iCddt0fdl0o', tag: '다큐', title: '하루 1시간 손글씨의 힘',
      desc: '손으로 썼더니 자기 효능감과 기억력이 자랐어요' }
  ];
  var vModal = $('#videoModal'), vBtn = $('#btnVideos');
  if (vModal && vBtn) {
    var vList = $('#vmList'), vPlayer = $('#vmPlayer'), vDesc = $('#vmDesc'), vOpen = $('#vmOpen');
    var lastFocus = null;

    var play = function (i) {
      var v = VIDEOS[i];
      $$('.vm-item').forEach(function (b, k) {
        b.classList.toggle('on', k === i);
        b.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      vPlayer.classList.toggle('vertical', !!v.vertical);
      vPlayer.innerHTML = '';
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1';
      f.title = v.title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullScreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      vPlayer.appendChild(f);
      vDesc.textContent = v.desc;
      vOpen.href = v.vertical ? 'https://youtube.com/shorts/' + v.id : 'https://youtu.be/' + v.id;
    };

    VIDEOS.forEach(function (v, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'vm-item';
      b.setAttribute('role', 'tab');
      b.innerHTML = '<span class="vi-tag"></span><b></b>';
      b.querySelector('.vi-tag').textContent = '▶ ' + v.tag;
      b.querySelector('b').textContent = v.title;
      b.addEventListener('click', function () { play(i); });
      vList.appendChild(b);
    });

    var openV = function () {
      lastFocus = document.activeElement;
      vModal.hidden = false;
      document.body.classList.add('vm-open');
      play(0);
      var c = vModal.querySelector('.vm-close');
      if (c) c.focus();
    };
    var closeV = function () {
      if (vModal.hidden) return;
      vModal.hidden = true;
      vPlayer.innerHTML = '';            /* iframe 을 지워야 소리가 멈춥니다 */
      document.body.classList.remove('vm-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    vBtn.addEventListener('click', openV);
    $$('[data-vclose]').forEach(function (el) { el.addEventListener('click', closeV); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeV(); });
  }
})();
