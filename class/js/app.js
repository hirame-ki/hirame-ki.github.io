/* ==========================================================
   수업서랍 · app — 오프닝, 서랍(홈), 화면 분할, 명단
   Copyright (c) 2026 황성재 (@hirame.ki). All rights reserved.
   상업적 이용·개작·무단 재배포 금지 — LICENSE 참고
   ========================================================== */
(function () {
  'use strict';
  const { ico, store, roster, $, $$, esc, GROUPS, TOOLS, toast, uid, numbered, lines } = SD;
  const MAX = 4;
  const byId = (id) => TOOLS.find(t => t.id === id);
  const gc = (g) => `--c:var(--${g});--c-soft:var(--${g}-soft)`;
  const COMBOS = [
    ['scoreboard', 'timer'], ['pickOne', 'timer'], ['groups', 'scoreboard'], ['noise', 'timer'],
  ];

  /* ================= 오프닝 ================= */
  function intro() {
    const el = $('#intro'); const home = $('#home');
    const done = () => {
      if (el.classList.contains('out')) return;
      el.classList.add('out'); home.classList.add('enter');
      setTimeout(() => { el.hidden = true; home.classList.remove('enter'); }, 900);
      try { sessionStorage.setItem('sd.intro', '1'); } catch (e) {}
    };
    let seen = false; try { seen = sessionStorage.getItem('sd.intro') === '1'; } catch (e) {}
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) { el.hidden = true; home.classList.add('enter'); setTimeout(() => home.classList.remove('enter'), 1200); return; }
    const pick = ['timer', 'pickOne', 'trophy', 'roulette', 'bell', 'groups', 'qr'];
    const grp = ['time', 'pick', 'team', 'pick', 'time', 'team', 'share'];
    const n = pick.length;
    $('.intro-icons', el).innerHTML = pick.map((p, i) => {
      const a = Math.PI * (1.08 + (i / (n - 1)) * .84), R = 132;
      const x = Math.cos(a) * R, y = Math.sin(a) * R * .78 - 18, r = (i - (n - 1) / 2) * 5;
      return `<div class="intro-icon" style="${gc(grp[i])};--i:${i};--x:${x.toFixed(1)}px;--y:${y.toFixed(1)}px;--r:${r}deg">${ico(p)}</div>`;
    }).join('');
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('play'));
    const t = setTimeout(done, 3300);
    const skip = () => { clearTimeout(t); done(); };
    el.addEventListener('click', skip);
    addEventListener('keydown', skip, { once: true });
  }
  $('#replay-intro')?.addEventListener('click', () => {
    try { sessionStorage.removeItem('sd.intro'); } catch (e) {}
    const el = $('#intro'); el.classList.remove('out', 'play'); void el.offsetWidth; intro();
  });

  /* ================= 서랍(홈) ================= */
  let selecting = false, picked = [];
  function card(t, extra = '') {
    return `<button class="tool-card ${extra}" data-id="${t.id}" style="${gc(t.group)}">
      <span class="tool-check">${ico('check')}</span>
      <span class="tool-ico">${ico(t.icon)}</span>
      <span><span class="tool-name">${t.name}</span><span class="tool-desc" style="display:block">${t.desc}</span></span>
      <span class="open-hint">열기 ${ico('arrow')}</span>
    </button>`;
  }
  function renderHome() {
    $('#combos').innerHTML = `<span class="combo-label">${ico('layers')}자주 쓰는 조합</span>` + COMBOS.map(c => {
      const ts = c.map(byId);
      return `<button class="combo" data-combo="${c.join(',')}"><span class="dots">${ts.map(t => `<span style="${gc(t.group)};background:var(--c-soft);color:var(--c)">${ico(t.icon)}</span>`).join('')}</span>${ts.map(t => t.name).join('<span class="plus"> + </span>')}</button>`;
    }).join('');
    $('#drawers').innerHTML = GROUPS.map((g, gi) => {
      const ts = TOOLS.filter(t => t.group === g.id);
      return `<section class="drawer" style="${gc(g.id)};--d:${gi}">
        <div class="drawer-head"><span class="drawer-no">${g.no}</span><h2 class="drawer-title">${g.name}</h2><span class="drawer-desc">${g.desc}</span><span class="drawer-line"></span></div>
        <div class="tool-grid">${ts.map(t => card(t)).join('')}</div>
      </section>`;
    }).join('');
    const last = store.get('ws.open', []);
    const resume = $('#resume');
    if (last.length) { resume.hidden = false; $('span', resume).textContent = `이어서 쓰기 · ${last.map(id => byId(id)?.name).filter(Boolean).join(' + ')}`; }
    else resume.hidden = true;
  }
  function setSelecting(on) {
    selecting = on; if (!on) picked = [];
    $('#home').classList.toggle('selecting', on);
    $('#select-toggle').innerHTML = on ? `${ico('x')}<span>고르기 취소</span>` : `${ico('layers')}<span>여러 개 골라 함께 쓰기</span>`;
    syncPicked();
  }
  function syncPicked() {
    $$('#drawers .tool-card').forEach(c => c.classList.toggle('picked', picked.includes(c.dataset.id)));
    const bar = $('#select-bar');
    bar.classList.toggle('show', selecting);
    $('.sel-info', bar).innerHTML = picked.length ? `<b>${picked.length}개</b> 골랐어요` : '함께 쓸 도구를 2~4개 골라요';
    $('.sel-pills', bar).innerHTML = picked.map(id => `<span>${byId(id).name}</span>`).join('');
    $('#sel-open').disabled = picked.length < 1;
    $('#sel-open span').textContent = picked.length >= 2 ? '나란히 열기' : '열기';
  }
  $('#drawers').addEventListener('click', (e) => {
    const c = e.target.closest('.tool-card'); if (!c) return; const id = c.dataset.id;
    if (!selecting) return openWorkspace([id]);
    if (picked.includes(id)) picked = picked.filter(x => x !== id);
    else if (picked.length >= MAX) toast(`한 화면에는 ${MAX}개까지 띄울 수 있어요`);
    else picked.push(id);
    syncPicked();
  });
  $('#combos').addEventListener('click', (e) => { const c = e.target.closest('.combo'); if (c) openWorkspace(c.dataset.combo.split(',')); });
  $('#select-toggle').onclick = () => setSelecting(!selecting);
  $('#sel-cancel').onclick = () => setSelecting(false);
  $('#sel-open').onclick = () => { const p = [...picked]; setSelecting(false); openWorkspace(p); };
  $('#resume').onclick = () => openWorkspace(store.get('ws.open', []));

  /* ================= 작업 공간 ================= */
  const panes = new Map(); // id -> { el, body, inst, ro }
  let open = [], focus = null;
  const layout = Object.assign({ 2: 'row', 3: 'main', split: .5 }, store.get('ws.layout', {}));

  function mountPane(id) {
    const t = byId(id); const el = document.createElement('section');
    el.className = 'pane'; el.dataset.id = id; el.style.cssText = gc(t.group);
    el.innerHTML = `<header class="pane-head"><span class="pane-ico">${ico(t.icon)}</span><h3 class="pane-title">${t.name}</h3>
      <button class="icon-btn f" title="이 도구만 크게">${ico('expand')}</button><button class="icon-btn c" title="닫기">${ico('x')}</button></header>
      <div class="pane-body"></div>`;
    const body = $('.pane-body', el);
    let inst = {};
    try { inst = t.mount(body) || {}; } catch (e) { console.error(e); body.innerHTML = `<div class="t"><div class="empty">도구를 여는 중 문제가 생겼어요.</div></div>`; }
    const ro = new ResizeObserver(() => inst.onResize && inst.onResize()); ro.observe(body);
    $('.f', el).onclick = () => setFocus(focus === id ? null : id);
    $('.c', el).onclick = () => closeTool(id);
    panes.set(id, { el, body, inst, ro });
  }
  function unmountPane(id) {
    const p = panes.get(id); if (!p) return;
    try { p.inst.destroy && p.inst.destroy(); } catch (e) {}
    p.ro.disconnect(); p.el.remove(); panes.delete(id);
  }
  function openWorkspace(ids) {
    ids = ids.filter(byId).slice(0, MAX); if (!ids.length) return;
    [...panes.keys()].forEach(id => { if (!ids.includes(id)) unmountPane(id); });
    open = ids; focus = null; ids.forEach(id => { if (!panes.has(id)) mountPane(id); });
    show('workspace'); renderWorkspace();
  }
  function addTool(id) {
    if (open.includes(id)) return; if (open.length >= MAX) { toast(`한 화면에는 ${MAX}개까지 띄울 수 있어요`); return; }
    open.push(id); mountPane(id); focus = null; renderWorkspace();
  }
  function closeTool(id) {
    open = open.filter(x => x !== id); unmountPane(id); if (focus === id) focus = null;
    if (!open.length) { store.set('ws.open', []); return show('home'); }
    renderWorkspace();
  }
  function setFocus(id) { focus = id; renderWorkspace(); }

  function renderWorkspace() {
    store.set('ws.open', open);
    history.replaceState(null, '', '#' + open.join('+'));
    const box = $('#panes'), n = open.length;
    box.className = `panes n${n} ${n === 2 ? 'l-' + layout[2] : n === 3 ? 'l-' + layout[3] : ''} ${focus ? 'has-focus' : ''}`;
    box.style.setProperty('--split', `minmax(0,${(layout.split / (1 - layout.split)).toFixed(3)}fr)`);
    open.forEach(id => { const p = panes.get(id); p.el.classList.toggle('focus', focus === id); box.appendChild(p.el); $('.f', p.el).innerHTML = ico(focus === id ? 'shrink' : 'expand'); $('.f', p.el).title = focus === id ? '나란히 보기로' : '이 도구만 크게'; });
    $('#ws-tabs').innerHTML = open.map(id => { const t = byId(id); return `<span class="ws-tab" style="${gc(t.group)}"><span class="dot"></span>${t.name}<button data-close="${id}" title="닫기">${ico('x')}</button></span>`; }).join('');
    $('#ws-add').hidden = n >= MAX;
    const seg = $('#ws-layout');
    if (n === 2 && !focus) seg.innerHTML = `<button data-l="row" class="${layout[2] === 'row' ? 'on' : ''}">${ico('colsIco')}좌우</button><button data-l="col" class="${layout[2] === 'col' ? 'on' : ''}">${ico('rowsIco')}위아래</button>`;
    else if (n === 3 && !focus) seg.innerHTML = `<button data-l="main" class="${layout[3] === 'main' ? 'on' : ''}">${ico('main3')}크게+작게</button><button data-l="row" class="${layout[3] === 'row' ? 'on' : ''}">${ico('col3')}세 칸</button>`;
    else seg.innerHTML = '';
    seg.hidden = !seg.innerHTML;
    placeSplitter();
  }
  $('#ws-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-close]'); if (b) closeTool(b.dataset.close); });
  $('#ws-layout').addEventListener('click', (e) => {
    const b = e.target.closest('[data-l]'); if (!b) return;
    layout[open.length] = b.dataset.l; if (open.length === 2) layout.split = .5; store.set('ws.layout', layout); renderWorkspace();
  });
  $('#ws-home').onclick = () => show('home');

  /* 두 칸 사이 경계 드래그 */
  const splitter = $('#splitter');
  function placeSplitter() {
    const ok = open.length === 2 && !focus && innerWidth > 860;
    splitter.hidden = !ok; if (!ok) return;
    requestAnimationFrame(() => {
      const box = $('#panes').getBoundingClientRect(), a = panes.get(open[0]).el.getBoundingClientRect(), ws = $('#workspace').getBoundingClientRect();
      const row = layout[2] === 'row'; splitter.className = `splitter ${row ? 'v' : 'h'}`;
      if (row) { splitter.style.left = `${a.right - ws.left}px`; splitter.style.top = `${box.top - ws.top + 12}px`; splitter.style.height = `${box.height - 28}px`; splitter.style.width = '12px'; }
      else { splitter.style.top = `${a.bottom - ws.top}px`; splitter.style.left = `${box.left - ws.left + 16}px`; splitter.style.width = `${box.width - 32}px`; splitter.style.height = '12px'; }
    });
  }
  splitter.addEventListener('pointerdown', (e) => {
    e.preventDefault(); splitter.setPointerCapture(e.pointerId); splitter.classList.add('drag');
    const move = (ev) => {
      const r = $('#panes').getBoundingClientRect(), row = layout[2] === 'row';
      const v = row ? (ev.clientX - r.left - 16) / (r.width - 32 - 12) : (ev.clientY - r.top - 12) / (r.height - 28 - 12);
      layout.split = Math.min(.78, Math.max(.22, v)); $('#panes').style.setProperty('--split', `minmax(0,${(layout.split / (1 - layout.split)).toFixed(3)}fr)`); placeSplitter();
    };
    const up = () => { splitter.classList.remove('drag'); splitter.removeEventListener('pointermove', move); store.set('ws.layout', layout); };
    splitter.addEventListener('pointermove', move); splitter.addEventListener('pointerup', up, { once: true });
  });
  splitter.addEventListener('dblclick', () => { layout.split = .5; store.set('ws.layout', layout); renderWorkspace(); });
  addEventListener('resize', placeSplitter);

  /* ================= 도구 추가 모달 ================= */
  function openPicker() {
    $('#picker-body').innerHTML = GROUPS.map(g => `<div class="picker-group">${g.no} · ${g.name}</div><div class="picker-grid">${TOOLS.filter(t => t.group === g.id).map(t => card(t, open.includes(t.id) ? 'open' : '')).join('')}</div>`).join('');
    showModal('picker');
  }
  $('#ws-add').onclick = openPicker;
  $('#picker-body').addEventListener('click', (e) => { const c = e.target.closest('.tool-card'); if (!c) return; hideModal('picker'); addTool(c.dataset.id); });

  /* ================= 명단 모달 ================= */
  let editId = null;
  function renderRoster() {
    const cur = roster.current(); editId = cur.id;
    $('#class-list').innerHTML = roster.classes.map(c => `<button class="class-item ${c.id === cur.id ? 'on' : ''}" data-id="${c.id}">${esc(c.name)}<span>${c.students.length}명</span></button>`).join('') +
      `<button class="btn btn-ghost btn-sm" id="class-add" style="justify-content:flex-start">${ico('plus')}반 추가</button>`;
    $('#class-name').value = cur.name; $('#class-students').value = cur.students.join('\n');
    $('#class-count').textContent = `${cur.students.length}명`;
    $('#class-del').disabled = roster.classes.length < 2;
  }
  function syncChip() { const c = roster.current(); $('#class-chip .lbl').textContent = c.name; $('#class-chip .count').textContent = `${c.students.length}명`; }
  const commit = () => { const c = roster.current(); c.name = $('#class-name').value.trim() || '우리 반'; c.students = lines($('#class-students').value); roster.save(); };
  $('#class-chip').onclick = () => { renderRoster(); showModal('roster'); };
  $('#class-list').addEventListener('click', (e) => {
    if (e.target.closest('#class-add')) { commit(); const c = { id: uid(), name: `새 반 ${roster.classes.length + 1}`, students: [] }; roster.classes.push(c); roster.currentId = c.id; roster.save(); renderRoster(); $('#class-name').select(); return; }
    const b = e.target.closest('.class-item'); if (!b) return; commit(); roster.currentId = b.dataset.id; roster.save(); renderRoster();
  });
  let deb = 0;
  ['class-name', 'class-students'].forEach(id => $('#' + id).addEventListener('input', () => {
    clearTimeout(deb); deb = setTimeout(() => { commit(); const c = roster.current(); $('#class-count').textContent = `${c.students.length}명`; const it = $(`.class-item[data-id="${c.id}"]`); if (it) it.innerHTML = `${esc(c.name)}<span>${c.students.length}명</span>`; }, 250);
  }));
  $('#class-fill').onclick = () => {
    const n = Math.max(1, Math.min(60, +$('#class-fill-n').value || 24));
    const cur = lines($('#class-students').value);
    if (cur.length && !confirm(`지금 명단을 1번~${n}번으로 바꿀까요?`)) return;
    $('#class-students').value = numbered(n).join('\n'); commit(); renderRoster();
  };
  $('#class-del').onclick = () => {
    if (roster.classes.length < 2) return; const c = roster.current();
    if (!confirm(`'${c.name}' 명단을 지울까요?`)) return;
    roster.classes = roster.classes.filter(x => x.id !== c.id); roster.currentId = roster.classes[0].id; roster.save(); renderRoster();
  };
  roster.onChange(() => { syncChip(); panes.forEach(p => p.inst.onRoster && p.inst.onRoster()); });

  /* ================= 공통: 보기 전환·모달·전체화면 ================= */
  function show(v) {
    $('#home').hidden = v !== 'home'; $('#workspace').hidden = v !== 'workspace'; document.body.dataset.view = v;
    if (v === 'home') { renderHome(); setSelecting(false); if (location.hash) history.replaceState(null, '', location.pathname + location.search); }
  }
  function showModal(id) { $('#m-' + id).hidden = false; setTimeout(() => $(`#m-${id} input, #m-${id} button.tool-card`)?.focus(), 50); }
  function hideModal(id) { $('#m-' + id).hidden = true; if (id === 'roster') commit(); }
  $$('.modal-wrap').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close-modal]')) hideModal(m.id.slice(2)); });
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const m = $$('.modal-wrap').find(x => !x.hidden); if (m) return hideModal(m.id.slice(2));
    if (focus) return setFocus(null);
    if (selecting) setSelecting(false);
  });
  $('#brand').onclick = () => show('home');
  $('#open-license').onclick = () => showModal('license');

  /* 제작자 칩: 마우스가 가까이(90px) 오면 열리고, 충분히 멀어지면(140px) 닫힘 */
  const maker = $('#maker-chip');
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = maker.getBoundingClientRect();
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    const d = Math.hypot(dx, dy), on = maker.classList.contains('open');
    if (!on && d < 90) maker.classList.add('open');
    else if (on && d > 140) maker.classList.remove('open');
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => maker.classList.remove('open'));
  $('#fs').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => toast('이 브라우저에서는 전체 화면을 쓸 수 없어요'));
  };
  document.addEventListener('fullscreenchange', () => { $('#fs').innerHTML = ico(document.fullscreenElement ? 'shrink' : 'full'); setTimeout(placeSplitter, 100); });

  /* ================= 시작 ================= */
  $('#fs').innerHTML = ico('full');
  /* 주소 뒤 #scoreboard+timer 처럼 조합을 즐겨찾기로 저장해 바로 열 수 있음 */
  const fromHash = () => decodeURIComponent(location.hash.slice(1)).split('+').filter(byId);
  const initial = fromHash();
  syncChip(); show('home');
  if (initial.length) { const el = $('#intro'); el.hidden = true; openWorkspace(initial); }
  else intro();
  addEventListener('hashchange', () => { const ids = fromHash(); if (ids.length && ids.join('+') !== open.join('+')) openWorkspace(ids); });
})();
