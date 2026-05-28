/* ════════════════════════════════════════════════════════════
   히라메키 · 사운드 엔진
   Web Audio API로 절차적으로 합성하는 우아한 사운드 시스템
   ─────────────────────────────────────────────────────────────
   · 클릭음   — 부드러운 종(bell) 톤 (사인 + 옥타브 하모닉)
   · 호버음   — 극히 미세한 고주파 틱
   · 배경음악 — 느린 패드, 4성 화음, LFO 모듈레이션
   ════════════════════════════════════════════════════════════ */
(function(){
  const Lux = {
    ctx:null, master:null, musicGain:null, sfxGain:null,
    musicOn:false, sfxOn:true, _started:false, _musicNodes:[],
    _reverb:null,
  };

  function ensure(){
    if(Lux.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    Lux.ctx = new AC();
    Lux.master   = Lux.ctx.createGain(); Lux.master.gain.value = 0.9;
    Lux.musicGain= Lux.ctx.createGain(); Lux.musicGain.gain.value = 0.18;
    Lux.sfxGain  = Lux.ctx.createGain(); Lux.sfxGain.gain.value = 0.35;
    Lux._reverb  = makeReverb(Lux.ctx, 3.2, 2.2);
    const revGain = Lux.ctx.createGain(); revGain.gain.value = 0.45;
    Lux._reverb.connect(revGain).connect(Lux.master);
    Lux.musicGain.connect(Lux._reverb);
    Lux.musicGain.connect(Lux.master);
    Lux.sfxGain.connect(Lux._reverb);
    Lux.sfxGain.connect(Lux.master);
    Lux.master.connect(Lux.ctx.destination);
  }

  // ── 간이 컨볼버 임펄스 응답 생성 (지수 감쇠 노이즈) ──
  function makeReverb(ctx, sec, decay){
    const conv = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const len = Math.floor(rate*sec);
    const buf = ctx.createBuffer(2, len, rate);
    for(let ch=0; ch<2; ch++){
      const data = buf.getChannelData(ch);
      for(let i=0;i<len;i++){
        data[i] = (Math.random()*2-1) * Math.pow(1-i/len, decay);
      }
    }
    conv.buffer = buf;
    return conv;
  }

  // ── 클릭 사운드: 우아한 마림바/종 톤 ──
  function click(variant){
    if(!Lux.sfxOn) return;
    ensure();
    if(Lux.ctx.state==='suspended') Lux.ctx.resume();
    const t = Lux.ctx.currentTime;
    // 변형: primary(맑음) / soft(어두움)
    const freq = variant==='soft' ? 392 : variant==='warn' ? 466 : 587.33; // G4 / Bb4 / D5
    const tones = [
      {f:freq,     gain:0.55, dur:0.55},
      {f:freq*2,   gain:0.20, dur:0.40},
      {f:freq*3.01,gain:0.08, dur:0.30},
    ];
    tones.forEach(({f,gain,dur})=>{
      const osc = Lux.ctx.createOscillator();
      const g   = Lux.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t+0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
      osc.connect(g).connect(Lux.sfxGain);
      osc.start(t);
      osc.stop(t+dur+0.05);
    });
  }

  // ── 호버 사운드: 극히 미세 ──
  let _lastHover = 0;
  function hover(){
    if(!Lux.sfxOn) return;
    const now = performance.now();
    if(now - _lastHover < 80) return;  // 디바운스
    _lastHover = now;
    ensure();
    if(Lux.ctx.state==='suspended') Lux.ctx.resume();
    const t = Lux.ctx.currentTime;
    const osc = Lux.ctx.createOscillator();
    const g   = Lux.ctx.createGain();
    osc.type='sine';
    osc.frequency.value = 1760; // A6
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(0.04, t+0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.10);
    osc.connect(g).connect(Lux.sfxGain);
    osc.start(t); osc.stop(t+0.15);
  }

  // ── 배경음악: 느린 패드 (C장조7 기반, LFO 흔들림) ──
  // 음표: C4(261.63) E4(329.63) G4(392.00) B4(493.88) D5(587.33) — 부드러운 모달
  function startMusic(){
    ensure();
    if(Lux.ctx.state==='suspended') Lux.ctx.resume();
    stopMusic();
    Lux.musicOn = true;

    const chords = [
      [220.00, 261.63, 329.63, 392.00], // Am add(C E G)
      [196.00, 246.94, 293.66, 369.99], // G/B add (G B D F#)
      [174.61, 220.00, 261.63, 329.63], // F (F A C E)
      [220.00, 261.63, 329.63, 493.88], // Am7
    ];
    const chordDur = 9.5; // 한 코드 9.5초

    // 패드 보이스: 톱니파 → 로우패스 → 게인
    const lp = Lux.ctx.createBiquadFilter();
    lp.type='lowpass'; lp.frequency.value=900; lp.Q.value=0.6;
    const padGain = Lux.ctx.createGain(); padGain.gain.value=0;
    lp.connect(padGain).connect(Lux.musicGain);

    // LFO로 필터 흔들기 (호흡감)
    const lfo = Lux.ctx.createOscillator();
    const lfoGain = Lux.ctx.createGain();
    lfo.frequency.value = 0.07; lfoGain.gain.value = 280;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    Lux._musicNodes.push(lfo);

    const voices = [];
    for(let v=0; v<4; v++){
      const oscA = Lux.ctx.createOscillator(); oscA.type='triangle';
      const oscB = Lux.ctx.createOscillator(); oscB.type='sine';
      const vGain= Lux.ctx.createGain(); vGain.gain.value = 0.18;
      oscA.connect(vGain); oscB.connect(vGain); vGain.connect(lp);
      voices.push({oscA, oscB, vGain});
      oscA.start(); oscB.start();
      Lux._musicNodes.push(oscA, oscB);
    }

    // 부드러운 페이드인
    padGain.gain.linearRampToValueAtTime(0.55, Lux.ctx.currentTime+4);

    // 코드 진행 스케줄러
    let idx = 0;
    const advance = ()=>{
      if(!Lux.musicOn) return;
      const chord = chords[idx % chords.length];
      const t = Lux.ctx.currentTime;
      voices.forEach((v,i)=>{
        const f = chord[i] || chord[chord.length-1];
        v.oscA.frequency.linearRampToValueAtTime(f, t+1.8);
        v.oscB.frequency.linearRampToValueAtTime(f*2.003, t+1.8); // 살짝 디튠
      });
      idx++;
      Lux._musicTimer = setTimeout(advance, chordDur*1000);
    };
    advance();

    // 종 하나씩 떨어뜨리기 (선택적, 매 코드마다 한번)
    Lux._bellTimer = setInterval(()=>{
      if(!Lux.musicOn) return;
      const chord = chords[(idx-1+chords.length) % chords.length];
      const note = chord[Math.floor(Math.random()*chord.length)] * 4;  // 2옥 위
      const t = Lux.ctx.currentTime;
      const osc = Lux.ctx.createOscillator();
      const g   = Lux.ctx.createGain();
      osc.type='sine'; osc.frequency.value = note;
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(0.05, t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t+2.4);
      osc.connect(g).connect(Lux.musicGain);
      osc.start(t); osc.stop(t+2.6);
    }, 7600);
  }

  function stopMusic(){
    Lux.musicOn = false;
    clearTimeout(Lux._musicTimer);
    clearInterval(Lux._bellTimer);
    if(Lux.musicGain){
      const t = Lux.ctx.currentTime;
      Lux.musicGain.gain.cancelScheduledValues(t);
      Lux.musicGain.gain.setValueAtTime(Lux.musicGain.gain.value, t);
      Lux.musicGain.gain.linearRampToValueAtTime(0, t+0.6);
    }
    setTimeout(()=>{
      Lux._musicNodes.forEach(n=>{ try{n.stop();}catch(e){} });
      Lux._musicNodes = [];
      if(Lux.musicGain) Lux.musicGain.gain.value = 0.18;
    }, 800);
  }

  function toggleMusic(){
    if(Lux.musicOn) stopMusic();
    else startMusic();
    saveState();
    updateToggle();
  }

  function toggleSfx(){
    Lux.sfxOn = !Lux.sfxOn;
    saveState();
    updateToggle();
    if(Lux.sfxOn) click('primary');
  }

  function saveState(){
    try{
      localStorage.setItem('hsc_audio',
        JSON.stringify({musicOn:Lux.musicOn, sfxOn:Lux.sfxOn}));
    }catch(e){}
  }

  function loadState(){
    try{
      const j = JSON.parse(localStorage.getItem('hsc_audio')||'{}');
      Lux.sfxOn = j.sfxOn !== false;       // 기본 ON
      Lux._wantMusic = j.musicOn === true; // 기본 OFF (자동재생 차단 회피)
    }catch(e){ Lux.sfxOn = true; }
  }

  function updateToggle(){
    const mBtns = document.querySelectorAll('[data-audio-music]');
    const sBtns = document.querySelectorAll('[data-audio-sfx]');
    mBtns.forEach(b=>{
      b.dataset.on = Lux.musicOn ? '1' : '0';
      b.setAttribute('aria-pressed', Lux.musicOn);
      b.title = Lux.musicOn ? '배경음악 끄기' : '배경음악 켜기';
      const use = b.querySelector('use');
      if(use) use.setAttribute('href', Lux.musicOn ? '#i-music' : '#i-music-off');
    });
    sBtns.forEach(b=>{
      b.dataset.on = Lux.sfxOn ? '1' : '0';
      b.setAttribute('aria-pressed', Lux.sfxOn);
      b.title = Lux.sfxOn ? '효과음 끄기' : '효과음 켜기';
      const use = b.querySelector('use');
      if(use) use.setAttribute('href', Lux.sfxOn ? '#i-volume' : '#i-volume-off');
    });
  }

  // ── 페이지 전역 사운드 위임 ──
  function bindGlobal(){
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('button, .tab, .subj-item, .student-card, select');
      if(!t) return;
      if(t.disabled) return;
      if(t.classList && t.classList.contains('audio-ctl')) return;
      // 변형: 위험 = warn, 보조 = soft, 기본 = primary
      let v='primary';
      if(t.classList.contains('btn-warn') || t.classList.contains('btn-ghost')) v='soft';
      if(t.dataset && t.dataset.danger==='1') v='warn';
      click(v);
    }, true);

    // 호버는 .btn, .tab, .subj-item에서만
    document.addEventListener('mouseover', (e)=>{
      const t = e.target.closest('.btn, .tab, .student-card, .subj-item');
      if(!t || t.disabled) return;
      if(t._hoverArmed) return;
      t._hoverArmed = true;
      setTimeout(()=>{ t._hoverArmed=false; }, 250);
      hover();
    }, true);
  }

  // 첫 사용자 상호작용 시 오디오 컨텍스트 시작 + 원하면 음악 자동 시작
  function firstInteraction(){
    if(Lux._started) return;
    Lux._started = true;
    ensure();
    if(Lux.ctx.state==='suspended') Lux.ctx.resume();
    if(Lux._wantMusic) startMusic();
    updateToggle();
  }

  window.LuxAudio = {
    init(){
      loadState();
      bindGlobal();
      ['click','keydown','touchstart'].forEach(ev=>{
        window.addEventListener(ev, firstInteraction, {once:true, capture:true});
      });
      // DOM 준비되면 토글 상태 표시
      const tryUpdate = ()=>{ if(document.querySelector('[data-audio-music]')) updateToggle(); else setTimeout(tryUpdate, 200); };
      tryUpdate();
    },
    click, hover, toggleMusic, toggleSfx,
    isMusicOn:()=>Lux.musicOn, isSfxOn:()=>Lux.sfxOn,
  };
})();
