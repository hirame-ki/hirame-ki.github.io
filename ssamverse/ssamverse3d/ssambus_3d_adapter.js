/* =====================================================================
   쌤버스 3D 통합 어댑터 (재사용 모듈)

   전제 조건 — 이 스크립트를 로드하는 3D 맵 페이지는 미리 다음을 준비해야 한다:
     - three.js (전역 THREE) + scene/camera 준비
     - ssambus_supabase_config.js / ssambus_character_render.js /
       ssambus_realtime.js / ssambus_missions.js 로드 (순서는 이 스크립트보다
       앞이든 뒤든 무관 — 실제 호출은 프레임 루프에서 일어나므로)
     - 전역 var pos = {r, c}  (r=world z, c=world x, TS=1 매핑)
     - 전역 var PLAYER = {..., dir, _facingRight}
     - 전역 var TS = 1
     - 숨김 DOM: <div id="player" style="display:none">...</div>
                 <div id="remote-players" style="display:none"></div>

   사용법 (맵 페이지의 animate() 루프 안):
     SsamAdapter3D.init({ THREE, scene, camera });   // 최초 1회
     ...
     SsamAdapter3D.update(dt, camera);                // 매 프레임
     var hit = SsamAdapter3D.checkMission3D(camera.position.x, camera.position.z);

   공개 API: init(opts), update(dt, camera), checkMission3D(x, z)
   ===================================================================== */
(function(){
  'use strict';

  var THREE_ = null, scene_ = null, camera_ = null;
  var sprites = new Map();   // studentId -> { sprite, lastInner, lastFlip, nickEl, nickText }
  var bubbles = new Map();   // studentId -> { div, expiresAt }
  var myToastEl = null, myToastTimer = null;
  var lastMoveX = null, lastMoveZ = null;

  var SPRITE_W = 1.05, SPRITE_H = 1.7, PIVOT_Y = SPRITE_H / 2;
  var CANVAS_W = 120, CANVAS_H = 152; // 60:76 비율 유지 (×2)
  var MOVE_EPS = 0.02;

  /* ===================== 스타일 ===================== */
  function ensureStyle(){
    if(document.getElementById('adapter3d-style')) return;
    var style = document.createElement('style');
    style.id = 'adapter3d-style';
    style.textContent =
      '.nick3d-label{position:fixed;transform:translate(-50%,-100%);font-size:11px;' +
        'background:rgba(255,255,255,.9);padding:1px 6px;border-radius:4px;font-weight:600;' +
        'color:#222;pointer-events:none;z-index:15;white-space:nowrap;font-family:sans-serif}' +
      '.bubble3d{position:fixed;transform:translate(-50%,-100%);max-width:200px;' +
        'background:#fff;color:#222;padding:6px 12px;border-radius:14px;font-size:13px;' +
        'line-height:1.4;box-shadow:0 4px 14px rgba(0,0,0,.3);pointer-events:none;z-index:16;' +
        'font-family:sans-serif;word-break:break-word}' +
      '#adapter3d-toast{position:fixed;left:50%;bottom:170px;transform:translateX(-50%);' +
        'background:rgba(74,124,255,.92);color:#fff;padding:8px 18px;border-radius:20px;' +
        'font-size:13px;font-weight:600;z-index:16;display:none;font-family:sans-serif;' +
        'max-width:70vw;text-align:center}';
    document.head.appendChild(style);
  }

  /* ===================== SVG → 캔버스 텍스처 ===================== */
  function svgDataUrl(innerHtml){
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 76">' + innerHtml + '</svg>');
  }

  function drawPlaceholder(ctx){
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(190,200,215,.55)';
    ctx.beginPath(); ctx.ellipse(CANVAS_W/2, CANVAS_H*0.62, CANVAS_W*0.28, CANVAS_H*0.35, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(CANVAS_W/2, CANVAS_H*0.22, CANVAS_W*0.2, 0, Math.PI*2); ctx.fill();
  }

  function makeSprite(){
    var canvas = document.createElement('canvas');
    canvas.width = CANVAS_W; canvas.height = CANVAS_H;
    var ctx = canvas.getContext('2d');
    drawPlaceholder(ctx);
    var texture = new THREE_.CanvasTexture(canvas);
    var mat = new THREE_.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    var spr = new THREE_.Sprite(mat);
    spr.scale.set(SPRITE_W, SPRITE_H, 1);
    scene_.add(spr);
    return { sprite: spr, canvas: canvas, texture: texture };
  }

  function updateSpriteTexture(entry, innerHtml, flip){
    var ctx = entry.canvas.getContext('2d');
    var img = new Image();
    img.onload = function(){
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.save();
      if(flip){ ctx.translate(CANVAS_W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
      entry.texture.needsUpdate = true;
    };
    img.src = svgDataUrl(innerHtml);
  }

  function ensureNickLabel(id){
    var el = document.getElementById('nick3d-' + id);
    if(!el){
      el = document.createElement('div');
      el.id = 'nick3d-' + id;
      el.className = 'nick3d-label';
      document.body.appendChild(el);
    }
    return el;
  }

  /* ===================== 시점 상대 방향 계산 =====================
     ssambus_character_render.js의 dir(down/left/up)+facingRight는 원래
     "고정된 하향 2D 카메라"를 전제로 캐릭터의 절대 이동방향을 표현한다.
     3D에서는 보는 사람마다 위치가 다르므로, 캐릭터의 절대 이동방향과
     "그 캐릭터에서 나(카메라)를 바라보는 각도"의 상대각을 구해서, 마치
     그 상대각이 곧 절대 이동방향인 것처럼 같은 매핑 규칙을 적용한다.
     (그래야 앞에서 보면 정면, 뒤에서 보면 뒤통수가 항상 맞게 보인다) */
  function angleFromDirFacing(dir, facingRight){
    if(dir === 'down') return 0;
    if(dir === 'up') return 180;
    if(dir === 'left') return facingRight ? 90 : 270;
    return 0;
  }
  function pickDirFromAngle(a){
    a = ((a % 360) + 360) % 360;
    if(a >= 315 || a < 45)  return { dir: 'down', facingRight: false };
    if(a < 135)              return { dir: 'left', facingRight: true  };
    if(a < 225)              return { dir: 'up',   facingRight: false };
    return                        { dir: 'left', facingRight: false };
  }

  /* ===================== 원격 학생 스프라이트 동기화 ===================== */
  function syncRemoteSprites(){
    var container = document.getElementById('remote-players');
    if(!container) return;
    var seen = new Set();
    var myPos = camera_.position;

    container.querySelectorAll('[data-student]').forEach(function(el){
      var id = el.dataset.student;
      seen.add(id);

      // TS=1: left=c*TS → worldX=c, top=r*TS-24 → worldZ=r (역보정 +24)
      var worldX = parseFloat(el.style.left) || 0;
      var worldZ = (parseFloat(el.style.top) || 0) + 24;

      var entry = sprites.get(id);
      if(!entry){
        var made = makeSprite();
        entry = { sprite: made.sprite, canvas: made.canvas, texture: made.texture,
          lastKey: null, nickEl: ensureNickLabel(id), nickText: '' };
        sprites.set(id, entry);
      }

      entry.sprite.position.set(worldX, PIVOT_Y, worldZ);

      var appearance = __rtAvatarState[id];
      var remotePos = __rtRemotePos[id];
      if(appearance && remotePos && typeof remotePos.dir === 'string'){
        var charFacingAngle = angleFromDirFacing(remotePos.dir, remotePos.facingRight);
        var angleToViewer = Math.atan2(myPos.x - worldX, myPos.z - worldZ) * 180 / Math.PI;
        // 상대각의 부호를 뒤집어야 좌/우 프로필이 올바르게 나온다.
        // (angleToViewer/charFacingAngle 모두 atan2(x,z) 시계방향 기준이라, 그대로 빼면
        //  앞뒤는 맞지만 좌우가 뒤집혀 보임 — 이동방향과 반대편 프로필이 선택됨)
        var picked = pickDirFromAngle(charFacingAngle - angleToViewer);
        var key = id + '|' + appearance.type + '|' + appearance.preset + '|' + appearance.skin
          + '|' + appearance.hcolor + '|' + appearance.hair + '|' + appearance.ccolor + '|' + appearance.cloth
          + '|' + appearance.gender + '|' + (appearance.acc || []).join(',') + '|' + picked.dir + '|' + picked.facingRight;
        if(key !== entry.lastKey){
          entry.lastKey = key;
          var renderState = Object.assign({}, appearance, { dir: picked.dir, facingRight: picked.facingRight });
          var svgMarkup = renderCharacterSVG(renderState);
          var flip = (picked.dir === 'left' && !picked.facingRight);
          updateSpriteTexture(entry, svgMarkup, flip);
        }
      }

      var nickSpan = el.querySelector('.nick');
      entry.nickText = nickSpan ? nickSpan.textContent : '';
    });

    sprites.forEach(function(entry, id){
      if(seen.has(id)) return;
      scene_.remove(entry.sprite);
      if(entry.nickEl) entry.nickEl.remove();
      var b = bubbles.get(id);
      if(b){ b.div.remove(); bubbles.delete(id); }
      sprites.delete(id);
    });
  }

  /* ===================== 화면 투영 (닉네임 라벨 + 말풍선) ===================== */
  function projectToScreen(worldPos){
    var v = worldPos.clone().project(camera_);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
      behind: v.z > 1 || v.z < -1
    };
  }

  function updateLabelsAndBubbles(){
    var now = Date.now();
    sprites.forEach(function(entry, id){
      var headPos = entry.sprite.position.clone();
      headPos.y += SPRITE_H * 0.5 + 0.18;
      var p = projectToScreen(headPos);

      if(entry.nickEl){
        if(p.behind || !entry.nickText){
          entry.nickEl.style.display = 'none';
        } else {
          entry.nickEl.style.display = '';
          entry.nickEl.textContent = entry.nickText;
          entry.nickEl.style.left = p.x + 'px';
          entry.nickEl.style.top = p.y + 'px';
        }
      }

      var bubble = bubbles.get(id);
      if(bubble){
        if(now > bubble.expiresAt){
          bubble.div.remove();
          bubbles.delete(id);
        } else if(p.behind){
          bubble.div.style.display = 'none';
        } else {
          bubble.div.style.display = '';
          bubble.div.style.left = p.x + 'px';
          bubble.div.style.top = (p.y - 30) + 'px';
        }
      }
    });
  }

  /* ===================== 채팅 말풍선 ===================== */
  function showOwnToast(text){
    if(!myToastEl){
      myToastEl = document.createElement('div');
      myToastEl.id = 'adapter3d-toast';
      document.body.appendChild(myToastEl);
    }
    myToastEl.textContent = '나: ' + text;
    myToastEl.style.display = 'block';
    clearTimeout(myToastTimer);
    myToastTimer = setTimeout(function(){ myToastEl.style.display = 'none'; }, 4000);
  }

  function overrideShowBubble(){
    window.__rtShowBubble = function(id, text){
      // __rtStudentId는 ssambus_realtime.js에 let으로 선언되어 window 프로퍼티가 아니므로
      // 반드시 전역 식별자(같은 스크립트 스코프)로 참조해야 한다.
      if(id === __rtStudentId){ showOwnToast(text); return; }
      var entry = sprites.get(id);
      if(!entry) return; // 아직 화면에 없는(먼 맵/미접속) 학생 — 무시

      var old = bubbles.get(id);
      if(old) old.div.remove();

      var div = document.createElement('div');
      div.className = 'bubble3d';
      div.textContent = text;
      document.body.appendChild(div);
      bubbles.set(id, { div: div, expiresAt: Date.now() + 4000 });
    };
  }

  /* ===================== 내 캐릭터 위치/방향 브로드캐스트 ===================== */
  function bucketDir(dx, dz){
    if(Math.abs(dx) > Math.abs(dz)) return dx > 0 ? 'right' : 'left';
    return dz > 0 ? 'down' : 'up';
  }

  function updateOwnState(camPos){
    if(typeof pos === 'undefined' || typeof PLAYER === 'undefined') return;
    // 교사 실시간 맵 보기에서는 관찰만 하므로 본인 위치를 방송하지 않는다
    // (방송하면 교실에 유령 참가자가 생기거나 불필요한 네트워크 트래픽 발생)
    if(window.TEACHER_VIEW) return;

    if(lastMoveX !== null){
      var dx = camPos.x - lastMoveX, dz = camPos.z - lastMoveZ;
      if(Math.hypot(dx, dz) > MOVE_EPS){
        var d = bucketDir(dx, dz);
        PLAYER._facingRight = (d === 'right');
        PLAYER.dir = (d === 'right') ? 'left' : d;
      }
    }
    lastMoveX = camPos.x; lastMoveZ = camPos.z;

    pos.r = camPos.z;
    pos.c = camPos.x;
    try{ broadcastMyPosition(); }catch(e){}
  }

  /* ===================== 채팅 입력창 포커스 여부 ===================== */
  function isChatInputFocused(){
    var el = document.activeElement;
    return !!(el && el.id === 'rt-chat-input');
  }

  /* ===================== 공개 API ===================== */
  var API = {
    init: function(opts){
      THREE_ = opts.THREE;
      scene_ = opts.scene;
      camera_ = opts.camera;
      ensureStyle();
      overrideShowBubble();
    },
    isChatInputFocused: isChatInputFocused,
    update: function(dt, camera){
      if(camera) camera_ = camera;
      updateOwnState(camera_.position);
      syncRemoteSprites();
      updateLabelsAndBubbles();
    },
    checkMission3D: function(x, z){
      if(typeof window.checkMission3D !== 'function') return null;
      return window.checkMission3D(x, z);
    }
  };

  window.SsamAdapter3D = API;
})();
