/* =====================================================================
   쌤버스 - 캐릭터 렌더링 (Opus 품질 / viewBox 0 0 60 76)
   state: { type, skin, hcolor, hair, ccolor, cloth, gender, acc:[], dir }
   ===================================================================== */

var _rc = 0;

var li = function(h,a){
  if(!h||h[0]!=='#')return h;
  var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  return 'rgb('+Math.min(255,r+a)+','+Math.min(255,g+a)+','+Math.min(255,b+a)+')';
};
var dk = function(h,a){
  if(!h||h[0]!=='#')return h;
  var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  return 'rgb('+Math.max(0,r-a)+','+Math.max(0,g-a)+','+Math.max(0,b-a)+')';
};

/* ---- defs (그라데이션) ---- */
function _defs(id, skin, hc) {
  var sL=li(skin,20), sD=dk(skin,32), hD=dk(hc,45), hL=li(hc,28);
  return '<defs>'+
    '<radialGradient id="sk'+id+'" cx="48%" cy="38%" r="62%">'+
      '<stop offset="0%" stop-color="'+sL+'"/>'+
      '<stop offset="78%" stop-color="'+skin+'"/>'+
      '<stop offset="100%" stop-color="'+sD+'"/>'+
    '</radialGradient>'+
    '<linearGradient id="hg'+id+'" x1="0" y1="0" x2=".35" y2="1">'+
      '<stop offset="0%" stop-color="'+hL+'"/>'+
      '<stop offset="55%" stop-color="'+hc+'"/>'+
      '<stop offset="100%" stop-color="'+hD+'"/>'+
    '</linearGradient>'+
    '<radialGradient id="bl'+id+'" cx="50%" cy="50%" r="50%">'+
      '<stop offset="0%" stop-color="#ff9a8a" stop-opacity=".55"/>'+
      '<stop offset="100%" stop-color="#ff9a8a" stop-opacity="0"/>'+
    '</radialGradient>'+
    '<radialGradient id="ey'+id+'" cx="38%" cy="32%" r="62%">'+
      '<stop offset="0%" stop-color="#a87a5a"/>'+
      '<stop offset="55%" stop-color="#6b4326"/>'+
      '<stop offset="100%" stop-color="#2a1505"/>'+
    '</radialGradient>'+
  '</defs>';
}

/* ---- 뒷머리 (얼굴보다 먼저 그림) ---- */
function _hairBack(id, dir, hc, hs) {
  var hD=dk(hc,40), hg='url(#hg'+id+')';
  var t='';

  if(dir==='up') {
    t='<ellipse cx="30" cy="18" rx="17" ry="17" fill="'+hg+'"/>';
    if(hs==='long'){
      t+='<path d="M10,17 L50,17 L50,52 Q30,60 10,52 Z" fill="'+hD+'"/>';
    } else if(hs==='wavy'){
      t+='<path d="M10,17 L50,17 L50,52 Q30,60 10,52 Z" fill="'+hD+'"/>'+
         '<path d="M11,26 Q21,22 30,26 Q39,30 50,26" fill="none" stroke="'+dk(hD,10)+'" stroke-width="1.8" opacity=".55"/>'+
         '<path d="M10,35 Q20,31 30,35 Q40,39 50,35" fill="none" stroke="'+dk(hD,10)+'" stroke-width="1.8" opacity=".55"/>'+
         '<path d="M11,44 Q21,40 31,44 Q41,48 50,44" fill="none" stroke="'+dk(hD,10)+'" stroke-width="1.8" opacity=".55"/>';
    } else if(hs==='medium'){
      t+='<path d="M11,17 L49,17 L49,40 Q30,47 11,40 Z" fill="'+hD+'"/>';
    } else if(hs==='bob'){
      t+='<path d="M11,17 L49,17 L49,31 Q30,37 11,31 Z" fill="'+hD+'"/>';
    } else if(hs==='twintail'){
      t+='<ellipse cx="9" cy="30" rx="5.5" ry="12" fill="'+hg+'" transform="rotate(-10,9,30)"/>'+
         '<ellipse cx="51" cy="30" rx="5.5" ry="12" fill="'+hg+'" transform="rotate(10,51,30)"/>';
    } else if(hs==='ponytail'){
      t+='<path d="M26,18 Q24,36 28,52 Q30,57 32,52 Q36,36 34,18 Z" fill="'+hg+'"/>';
    } else if(hs==='bun'){
      t+='<ellipse cx="30" cy="5" rx="7" ry="6" fill="'+hg+'"/>'+
         '<ellipse cx="30" cy="5" rx="4" ry="3" fill="'+hD+'"/>';
    }
    return t;
  }

  if(dir==='left') {
    t='<ellipse cx="32" cy="18" rx="16" ry="17" fill="'+hD+'"/>';
    if(hs==='bob') t+='<rect x="13" y="18" width="7" height="15" rx="3.5" fill="'+hD+'"/>';
    else if(hs==='medium') t+='<rect x="13" y="18" width="7" height="24" rx="3.5" fill="'+hD+'"/>';
    else if(hs==='long') t+='<rect x="13" y="18" width="7" height="36" rx="3.5" fill="'+hD+'"/>';
    else if(hs==='wavy') t+='<path d="M13,18 C18,26 11,33 16,41 C11,49 16,55 13,54 L12,52 Q9,46 13,38 Q8,30 13,22 Q11,18 15,18 Z" fill="'+hD+'"/>';
    else if(hs==='ponytail') t+='<path d="M22,15 Q19,33 22,50 Q24,55 26,50 Q26,34 24,15 Z" fill="'+hg+'"/>';
    else if(hs==='twintail') t+='<ellipse cx="11" cy="30" rx="5.5" ry="12" fill="'+hg+'" transform="rotate(-10,11,30)"/>';
    else if(hs==='bun') t+='<ellipse cx="22" cy="5" rx="7" ry="6" fill="'+hg+'"/>';
    return t;
  }

  /* dir === 'down' : 앞에서 보면 뒷머리 줄기는 안 보임, 기본 두피 ellipse + 앞에서 보이는 스타일만 */
  t='<ellipse cx="30" cy="17" rx="18" ry="18" fill="'+hD+'"/>';
  if(hs==='twintail'){
    t+='<ellipse cx="9" cy="30" rx="5.5" ry="12" fill="'+hg+'" transform="rotate(-10,9,30)"/>'+
       '<ellipse cx="51" cy="30" rx="5.5" ry="12" fill="'+hg+'" transform="rotate(10,51,30)"/>';
  } else if(hs==='bun'){
    t+='<ellipse cx="30" cy="4" rx="8" ry="7" fill="'+hg+'"/>'+
       '<ellipse cx="30" cy="4" rx="5" ry="3.5" fill="'+hD+'"/>';
  }
  return t;
}

/* ---- 앞머리 (얼굴 위에 그림) ---- */
function _hairFront(id, dir, hc, hs) {
  var hD=dk(hc,40), hL=li(hc,25), hg='url(#hg'+id+')';
  if(dir==='up') return '';

  if(dir==='left') {
    /* 옆모습: 앞머리는 위쪽(y<12)만 덮어 눈(cy=18)을 가리지 않음 */
    var bang='<path d="M17,18 Q16,2 30,1 Q45,2 46,12 Q42,6 36,8 Q28,10 17,18 Z" fill="'+hg+'"/>';
    var hi='<path d="M20,4 Q28,2 36,4" fill="none" stroke="'+hL+'" stroke-width="1.5" stroke-linecap="round" opacity=".2"/>';
    return bang+
      (hs==='twintail'?'<circle cx="47" cy="14" r="2.5" fill="#c0506a"/>':'')+
      (hs==='ponytail'?'<circle cx="24" cy="8" r="2.5" fill="#c0506a"/>':'')+
      (hs==='bun'?'<circle cx="22" cy="4" r="3" fill="#c0506a"/>':'')+
      hi;
  }

  /* dir === 'down' */
  if(hs==='buzz'){
    return '<path d="M14,19 Q13,7 30,5 Q47,7 46,19 Q45,13 39,11 Q37,14 30,14 Q23,14 21,11 Q15,13 14,19 Z" fill="'+hg+'"/>'+
           '<path d="M18,6 Q26,4 34,6" fill="none" stroke="'+hL+'" stroke-width="1.5" opacity=".2" stroke-linecap="round"/>';
  }
  if(hs==='short'){
    /* 짧은 머리: 피부가 보이지 않도록 부드러운 단일 캡 패스 */
    return '<path d="M13,18 Q12,3 30,2 Q48,3 47,18 Q44,11 38,10 Q30,13 22,10 Q16,11 13,18 Z" fill="'+hg+'"/>'+
           '<path d="M19,5 Q27,3 33,5" fill="none" stroke="'+hL+'" stroke-width="2" stroke-linecap="round" opacity=".2"/>';
  }
  var base='<path d="M13,18 Q12,4 30,2 Q48,4 47,18 Q45,10 38,8 Q40,13 39,16 Q35,8 30,8 Q25,8 21,16 Q20,13 22,8 Q15,10 13,18 Z" fill="'+hg+'"/>';
  var hi='<path d="M19,5 Q27,3 33,5" fill="none" stroke="'+hL+'" stroke-width="2" stroke-linecap="round" opacity=".2"/>';
  if(hs==='parted'){
    return '<path d="M13,18 Q12,4 30,2 Q48,4 47,18 Q45,10 38,8 Q40,13 39,16 Q35,8 30,9 L29,18 Q26,10 22,9 Q20,13 22,8 Q15,10 13,18 Z" fill="'+hg+'"/>'+
           '<path d="M29,8 Q30,5 32,8" fill="none" stroke="'+hD+'" stroke-width="0.9" opacity=".7"/>'+hi;
  }
  if(hs==='slickback'){
    return '<path d="M14,19 Q13,5 30,3 Q47,5 46,19 Q44,9 30,8 Q16,9 14,19 Z" fill="'+hg+'"/>'+hi;
  }
  if(hs==='twintail'){
    return base+'<circle cx="11" cy="19" r="2.5" fill="#c0506a"/><circle cx="49" cy="19" r="2.5" fill="#c0506a"/>'+hi;
  }
  if(hs==='ponytail'){
    return base+hi;
  }
  if(hs==='bun'){
    return base+hi;
  }
  if(hs==='wavy'){
    return base+
      '<path d="M13,18 C7,26 12,33 7,40 C11,47 7,53 11,57" fill="none" stroke="'+hD+'" stroke-width="3.5" stroke-linecap="round"/>'+
      '<path d="M47,18 C53,26 48,33 53,40 C49,47 53,53 49,57" fill="none" stroke="'+hD+'" stroke-width="3.5" stroke-linecap="round"/>'+
      hi;
  }
  return base+hi;
}

/* ---- 얼굴 ---- */
function _face(id, dir, skin, hc) {
  var brow=dk(hc,20), ns=dk(skin,40), hg='url(#sk'+id+')';
  if(dir==='up'){
    return '<rect x="13" y="10" width="14" height="11" rx="4" fill="'+dk(skin,22)+'"/>';
  }
  if(dir==='left'){
    return ''+
      '<ellipse cx="22" cy="19" rx="3" ry="4.2" fill="'+hg+'"/>'+
      '<ellipse cx="32" cy="18" rx="14" ry="14.5" fill="'+hg+'"/>'+
      '<ellipse cx="43" cy="22" rx="4" ry="2.8" fill="url(#bl'+id+')"/>'+
      '<path d="M35,12.5 Q38,11 41,12.5" fill="none" stroke="'+brow+'" stroke-width="1.1" stroke-linecap="round"/>'+
      '<ellipse cx="38" cy="18" rx="4.2" ry="5" fill="#fff"/>'+
      '<ellipse cx="38" cy="18.5" rx="3.6" ry="4.3" fill="url(#ey'+id+')"/>'+
      '<ellipse cx="38" cy="19" rx="1.8" ry="2.3" fill="#1a0c02"/>'+
      '<ellipse cx="36.5" cy="16" rx="1.4" ry="1.7" fill="#fff"/>'+
      '<ellipse cx="39.5" cy="20" rx=".7" ry=".9" fill="#fff" opacity=".6"/>'+
      '<path d="M33.5,15 Q38,12.5 42.5,15" fill="none" stroke="#1a0c02" stroke-width="1.4" stroke-linecap="round"/>'+
      '<ellipse cx="43" cy="22.5" rx=".8" ry=".6" fill="'+ns+'"/>'+
      '<path d="M40,25.5 Q43,28 46,25.5" fill="none" stroke="#c05a48" stroke-width="1.1" stroke-linecap="round"/>';
  }
  /* down */
  return ''+
    '<ellipse cx="15" cy="19" rx="3" ry="4.2" fill="'+hg+'"/>'+
    '<ellipse cx="45" cy="19" rx="3" ry="4.2" fill="'+hg+'"/>'+
    '<ellipse cx="30" cy="18" rx="15.5" ry="15" fill="'+hg+'"/>'+
    '<ellipse cx="19" cy="22" rx="4.5" ry="3" fill="url(#bl'+id+')"/>'+
    '<ellipse cx="41" cy="22" rx="4.5" ry="3" fill="url(#bl'+id+')"/>'+
    '<path d="M19,12.5 Q22,11 25,12.5" fill="none" stroke="'+brow+'" stroke-width="1.1" stroke-linecap="round"/>'+
    '<path d="M35,12.5 Q38,11 41,12.5" fill="none" stroke="'+brow+'" stroke-width="1.1" stroke-linecap="round"/>'+
    '<ellipse cx="22" cy="18" rx="4.2" ry="5" fill="#fff"/>'+
    '<ellipse cx="38" cy="18" rx="4.2" ry="5" fill="#fff"/>'+
    '<ellipse cx="22" cy="18.5" rx="3.6" ry="4.3" fill="url(#ey'+id+')"/>'+
    '<ellipse cx="38" cy="18.5" rx="3.6" ry="4.3" fill="url(#ey'+id+')"/>'+
    '<ellipse cx="22" cy="19" rx="1.8" ry="2.3" fill="#1a0c02"/>'+
    '<ellipse cx="38" cy="19" rx="1.8" ry="2.3" fill="#1a0c02"/>'+
    '<ellipse cx="20.5" cy="16" rx="1.4" ry="1.7" fill="#fff"/>'+
    '<ellipse cx="36.5" cy="16" rx="1.4" ry="1.7" fill="#fff"/>'+
    '<ellipse cx="23.5" cy="20" rx=".7" ry=".9" fill="#fff" opacity=".6"/>'+
    '<ellipse cx="39.5" cy="20" rx=".7" ry=".9" fill="#fff" opacity=".6"/>'+
    '<path d="M17.5,15 Q22,12.5 26.5,15" fill="none" stroke="#1a0c02" stroke-width="1.4" stroke-linecap="round"/>'+
    '<path d="M33.5,15 Q38,12.5 42.5,15" fill="none" stroke="#1a0c02" stroke-width="1.4" stroke-linecap="round"/>'+
    '<ellipse cx="30" cy="22.5" rx=".8" ry=".6" fill="'+ns+'"/>'+
    '<path d="M27,25.5 Q30,28 33,25.5" fill="none" stroke="#c05a48" stroke-width="1.1" stroke-linecap="round"/>';
}

/* ---- 목 ---- */
function _neck(dir, skin) {
  if(dir==='down') return '<rect x="26" y="33" width="8" height="7" rx="2.5" fill="'+skin+'"/>';
  if(dir==='left') return '<rect x="27" y="33" width="7" height="7" rx="2.5" fill="'+skin+'"/>';
  if(dir==='up')   return '<rect x="26" y="33" width="8" height="7" rx="2.5" fill="'+dk(skin,20)+'"/>';
  return '';
}

/* ---- 교복 몸체 ---- */
function _studentBody(dir, cc, sk, gender) {
  var L=li(cc,50), D=dk(cc,22), sk2=dk(sk,15);
  var shoeC='#1a1a1a';
  var t='';

  if(dir==='down'){
    if(gender==='female'){
      /* 상의 */
      t='<rect x="19" y="33" width="22" height="14" rx="5" fill="#fbfbf7"/>'+
        '<rect x="20" y="34" width="4" height="10" rx="2" fill="#000" opacity=".04"/>'+
        '<polygon points="26,33 30,40 24,35" fill="#e8e8e0"/>'+
        '<polygon points="34,33 30,40 36,35" fill="#e8e8e0"/>'+
        '<path d="M30,38 L27,41 L30,40 L33,41 Z" fill="#c0506a"/>'+
        '<circle cx="30" cy="40" r="1.3" fill="#a03050"/>'+
        /* 팔 */
        '<rect x="14" y="34" width="6" height="12" rx="3" fill="#fbfbf7"/>'+
        '<rect x="40" y="34" width="6" height="12" rx="3" fill="#fbfbf7"/>'+
        '<ellipse cx="17" cy="47" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
        '<ellipse cx="43" cy="47" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
        /* 치마 */
        '<path d="M18,46 L42,46 L47,59 Q30,65 13,59 Z" fill="'+cc+'"/>'+
        '<path d="M18,46 L42,46 L43,50 L17,50 Z" fill="'+D+'" opacity=".5"/>'+
        '<path d="M24,47 L23,58" stroke="'+D+'" stroke-width=".7" opacity=".5"/>'+
        '<path d="M30,47 L30,59" stroke="'+D+'" stroke-width=".7" opacity=".5"/>'+
        '<path d="M36,47 L37,58" stroke="'+D+'" stroke-width=".7" opacity=".5"/>'+
        /* 다리·신발 */
        '<rect x="24" y="57" width="5.5" height="11" rx="2.5" fill="#3a2f4a"/>'+
        '<rect x="30.5" y="57" width="5.5" height="11" rx="2.5" fill="#3a2f4a"/>'+
        '<ellipse cx="26.7" cy="68" rx="4" ry="2.4" fill="#2a1f2f"/>'+
        '<ellipse cx="33.3" cy="68" rx="4" ry="2.4" fill="#2a1f2f"/>';
    } else {
      /* 상의(블레이저) */
      t='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
        '<polygon points="25,33 30,44 35,33" fill="#f7f7f2"/>'+
        '<polygon points="30,35 28,38 30,46 32,38" fill="#b03030"/>'+
        '<polygon points="29,35 31,35 30,37.5" fill="#7a1f1f"/>'+
        '<polygon points="25,33 30,44 26,34" fill="'+D+'"/>'+
        '<polygon points="35,33 30,44 34,34" fill="'+D+'"/>'+
        '<rect x="19" y="34" width="3.5" height="12" rx="2" fill="#fff" opacity=".1"/>'+
        /* 팔 */
        '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+cc+'"/>'+
        '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+cc+'"/>'+
        '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
        '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
        /* 바지 */
        '<rect x="22" y="47" width="16" height="9" rx="2" fill="'+D+'"/>'+
        '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
        '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
        '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="'+shoeC+'"/>'+
        '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="'+shoeC+'"/>';
    }
  } else if(dir==='left'){
    if(gender==='female'){
      t='<rect x="19" y="33" width="21" height="14" rx="5" fill="#fbfbf7"/>'+
        '<rect x="36" y="34" width="4" height="10" rx="2" fill="#000" opacity=".04"/>'+
        '<rect x="26" y="34" width="6" height="12" rx="3" fill="#fbfbf7"/>'+
        '<ellipse cx="29" cy="47" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
        '<path d="M19,46 L40,46 L44,59 Q29,65 14,59 Z" fill="'+cc+'"/>'+
        '<path d="M19,46 L40,46 L40.5,50 L18,50 Z" fill="'+D+'" opacity=".5"/>'+
        '<path d="M28,47 L27.5,58" stroke="'+D+'" stroke-width=".7" opacity=".5"/>'+
        '<rect x="26" y="57" width="5.5" height="11" rx="2.5" fill="#3a2f4a"/>'+
        '<ellipse cx="29" cy="68" rx="4" ry="2.4" fill="#2a1f2f"/>';
    } else {
      t='<rect x="19" y="33" width="21" height="16" rx="5" fill="'+cc+'"/>'+
        '<polygon points="27,33 29,44 33,33" fill="#f7f7f2"/>'+
        '<polygon points="28,35 27.5,38 29,46 30.5,38" fill="#b03030"/>'+
        '<rect x="26" y="34" width="6.5" height="13" rx="3" fill="'+cc+'"/>'+
        '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
        '<rect x="23" y="47" width="15" height="9" rx="2" fill="'+D+'"/>'+
        '<rect x="23" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
        '<rect x="31" y="55" width="6" height="12" rx="3" fill="'+D+'"/>'+
        '<ellipse cx="27" cy="68" rx="4.5" ry="2.6" fill="'+shoeC+'"/>'+
        '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="'+shoeC+'"/>';
    }
  } else { /* up */
    var bd=dk(cc,15);
    t='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+bd+'"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+bd+'"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+bd+'"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk2+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk2+'"/>';
    if(gender==='female'){
      t+='<path d="M18,48 L42,48 L47,60 Q30,66 13,60 Z" fill="'+dk(cc,10)+'"/>'+
         '<rect x="24" y="57" width="5.5" height="11" rx="2.5" fill="#3a2f4a"/>'+
         '<rect x="30.5" y="57" width="5.5" height="11" rx="2.5" fill="#3a2f4a"/>'+
         '<ellipse cx="26.7" cy="68" rx="4" ry="2.4" fill="#2a1f2f"/>'+
         '<ellipse cx="33.3" cy="68" rx="4" ry="2.4" fill="#2a1f2f"/>';
    } else {
      t+='<rect x="22" y="47" width="16" height="9" rx="2" fill="'+dk(D,10)+'"/>'+
         '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+dk(D,10)+'"/>'+
         '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+dk(D,10)+'"/>'+
         '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>'+
         '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>';
    }
  }
  return t;
}

/* ---- 교사 몸체 ---- */
function _teacherBody(dir, cl, cc, sk, gender) {
  var L=li(cc,50), D=dk(cc,22), sk2=dk(sk,15), shoe='#111';
  var pantC=(gender==='female')?'#4a4038':'#2a2a2a';
  var t='';

  if(dir==='down'){
    /* 공통: 팔·손 */
    var armC=(cl==='vest')?'white':cc;
    t='<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+armC+'"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+armC+'"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>';
    /* 상의 */
    if(cl==='suit'){
      t+='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
         '<polygon points="25,33 30,45 35,33" fill="#f7f7f2"/>'+
         '<polygon points="25,33 30,45 26,34" fill="'+D+'"/>'+
         '<polygon points="35,33 30,45 34,34" fill="'+D+'"/>'+
         '<rect x="19" y="34" width="3.5" height="12" rx="2" fill="#fff" opacity=".1"/>';
    } else if(cl==='hoodie'){
      t+='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="23" y="33" width="14" height="6" rx="4" fill="'+L+'"/>'+
         '<rect x="22" y="38" width="16" height="3" rx="1.5" fill="'+D+'"/>';
    } else if(cl==='cardigan'){
      t+='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="18" y="33" width="4" height="16" fill="'+D+'"/>'+
         '<rect x="38" y="33" width="4" height="16" fill="'+D+'"/>'+
         '<rect x="22" y="33" width="16" height="16" fill="'+L+'"/>'+
         '<circle cx="30" cy="37" r="1.1" fill="'+D+'"/>'+
         '<circle cx="30" cy="41" r="1.1" fill="'+D+'"/>'+
         '<circle cx="30" cy="45" r="1.1" fill="'+D+'"/>';
    } else if(cl==='vest'){
      t+='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="22" y="33" width="16" height="16" fill="#f7f7f2"/>'+
         '<circle cx="30" cy="37" r="1" fill="'+D+'"/>'+
         '<circle cx="30" cy="41" r="1" fill="'+D+'"/>'+
         '<circle cx="30" cy="45" r="1" fill="'+D+'"/>';
    } else if(cl==='shirt'){
      t+='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="23" y="33" width="14" height="16" fill="'+L+'" opacity=".4"/>'+
         '<circle cx="30" cy="36" r=".9" fill="'+D+'"/>'+
         '<circle cx="30" cy="39.5" r=".9" fill="'+D+'"/>'+
         '<circle cx="30" cy="43" r=".9" fill="'+D+'"/>'+
         '<path d="M26,34 L29,45" stroke="'+D+'" stroke-width=".6"/>'+
         '<path d="M34,34 L31,45" stroke="'+D+'" stroke-width=".6"/>';
    } else if(cl==='sport'){
      t+='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="18" y="33" width="24" height="3" rx="1.5" fill="'+L+'"/>'+
         '<line x1="30" y1="33" x2="30" y2="49" stroke="'+L+'" stroke-width="1.5"/>'+
         '<rect x="18" y="44" width="24" height="1.5" fill="'+L+'"/>';
    }
    /* 하체 */
    if(gender==='female'){
      /* 교사 치마 */
      t+='<path d="M19,47 L41,47 L45,61 Q30,67 15,61 Z" fill="'+pantC+'"/>'+
         '<path d="M19,47 L41,47 L41,52 L19,52 Z" fill="rgba(0,0,0,.18)"/>'+
         '<rect x="24" y="59" width="5.5" height="9" rx="2.5" fill="#2a2a35"/>'+
         '<rect x="30.5" y="59" width="5.5" height="9" rx="2.5" fill="#2a2a35"/>'+
         '<ellipse cx="26.7" cy="68.5" rx="4" ry="2.2" fill="'+shoe+'"/>'+
         '<ellipse cx="33.3" cy="68.5" rx="4" ry="2.2" fill="'+shoe+'"/>';
    } else {
      t+='<rect x="22" y="47" width="16" height="9" rx="2" fill="'+pantC+'"/>'+
         '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+pantC+'"/>'+
         '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+pantC+'"/>'+
         '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="'+shoe+'"/>'+
         '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="'+shoe+'"/>';
    }
  } else if(dir==='left'){
    var armC=(cl==='vest')?'white':cc;
    t='<rect x="26" y="34" width="6.5" height="13" rx="3" fill="'+armC+'"/>'+
      '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>';
    t+='<rect x="19" y="33" width="21" height="16" rx="5" fill="'+cc+'"/>';
    if(cl==='suit'||cl==='vest'){
      t+='<rect x="24" y="33" width="12" height="16" fill="#f7f7f2"/>';
    } else if(cl==='cardigan'){
      t+='<rect x="24" y="33" width="12" height="16" fill="'+L+'"/>'+
         '<circle cx="32" cy="37" r="1" fill="'+D+'"/>'+
         '<circle cx="32" cy="41" r="1" fill="'+D+'"/>';
    } else if(cl==='shirt'){
      t+='<rect x="24" y="33" width="12" height="16" fill="'+L+'" opacity=".4"/>'+
         '<circle cx="30" cy="37" r=".8" fill="'+D+'"/>'+
         '<circle cx="30" cy="41" r=".8" fill="'+D+'"/>';
    } else if(cl==='hoodie'){
      t+='<rect x="25" y="33" width="10" height="5" rx="3" fill="'+L+'"/>';
    } else if(cl==='sport'){
      t+='<line x1="30" y1="33" x2="30" y2="49" stroke="'+L+'" stroke-width="1.5"/>';
    }
    if(gender==='female'){
      t+='<path d="M20,47 Q15,55 16,62 Q23,67 37,65 Q41,58 38,47 Z" fill="'+pantC+'"/>'+
         '<path d="M20,47 L38,47 L38,52 L20,52 Z" fill="rgba(0,0,0,.18)"/>'+
         '<rect x="24" y="60" width="6" height="8" rx="2.5" fill="#2a2a35"/>'+
         '<ellipse cx="27" cy="68.5" rx="4" ry="2.2" fill="'+shoe+'"/>';
    } else {
      t+='<rect x="23" y="47" width="14" height="9" rx="2" fill="'+pantC+'"/>'+
         '<rect x="23" y="55" width="6.5" height="12" rx="3" fill="'+pantC+'"/>'+
         '<rect x="30.5" y="55" width="6.5" height="12" rx="3" fill="'+pantC+'"/>'+
         '<ellipse cx="26.5" cy="68" rx="4.5" ry="2.6" fill="'+shoe+'"/>'+
         '<ellipse cx="34" cy="68" rx="4.5" ry="2.6" fill="'+shoe+'"/>';
    }
  } else { /* up */
    var bd=dk(cc,15);
    t='<rect x="18" y="33" width="24" height="16" rx="5" fill="'+bd+'"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+bd+'"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+bd+'"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk2+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk2+'"/>';
    if(gender==='female'){
      t+='<path d="M17,47 L43,47 L46,62 Q30,68 14,62 Z" fill="'+dk(bd,10)+'"/>'+
         '<rect x="24" y="60" width="5.5" height="8" rx="2.5" fill="#2a2a35"/>'+
         '<rect x="30.5" y="60" width="5.5" height="8" rx="2.5" fill="#2a2a35"/>'+
         '<ellipse cx="26.7" cy="68.5" rx="4" ry="2.2" fill="#111"/>'+
         '<ellipse cx="33.3" cy="68.5" rx="4" ry="2.2" fill="#111"/>';
    } else {
      t+='<rect x="22" y="47" width="16" height="9" rx="2" fill="'+dk(bd,10)+'"/>'+
         '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+dk(bd,10)+'"/>'+
         '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+dk(bd,10)+'"/>'+
         '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>'+
         '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>';
    }
  }
  return t;
}

/* ---- 판타지 몸체 ---- */
function _fantasyBody(dir, cl, cc, sk, gender) {
  var L=li(cc,50), D=dk(cc,22), sk2=dk(sk,15);
  var t='';
  if(dir==='down'){
    if(cl==='mage'){
      t='<rect x="10" y="49" width="40" height="18" rx="6" fill="'+D+'"/>'+
         '<rect x="13" y="33" width="34" height="18" rx="6" fill="'+cc+'"/>'+
         '<polygon points="30,35 30.7,37.5 33.2,37.5 31.2,38.9 32,41.3 30,39.9 28,41.3 28.8,38.9 26.8,37.5 29.3,37.5" fill="'+L+'" opacity=".9"/>'+
         '<rect x="13" y="34" width="5" height="14" rx="3" fill="'+cc+'"/>'+
         '<rect x="42" y="34" width="5" height="14" rx="3" fill="'+cc+'"/>'+
         '<ellipse cx="15.5" cy="49" rx="3.5" ry="2.8" fill="'+sk+'"/>'+
         '<ellipse cx="44.5" cy="49" rx="3.5" ry="2.8" fill="'+sk+'"/>'+
         '<rect x="24" y="66" width="6" height="5" rx="2.5" fill="'+sk2+'"/>'+
         '<rect x="30" y="66" width="6" height="5" rx="2.5" fill="'+sk2+'"/>'+
         '<ellipse cx="27" cy="71" rx="4.5" ry="2.4" fill="#2a1a0a"/>'+
         '<ellipse cx="33" cy="71" rx="4.5" ry="2.4" fill="#2a1a0a"/>';
    } else if(cl==='knight'){
      t='<rect x="12" y="33" width="36" height="18" rx="3" fill="'+cc+'"/>'+
         '<rect x="14" y="35" width="32" height="14" rx="2" fill="'+L+'"/>'+
         '<rect x="18" y="37" width="24" height="10" rx="2" fill="'+cc+'"/>'+
         '<line x1="30" y1="37" x2="30" y2="47" stroke="'+L+'" stroke-width="1"/>'+
         '<line x1="18" y1="42" x2="42" y2="42" stroke="'+L+'" stroke-width=".8"/>'+
         '<rect x="7" y="33" width="6" height="10" rx="2" fill="'+L+'"/>'+
         '<rect x="47" y="33" width="6" height="10" rx="2" fill="'+L+'"/>'+
         '<rect x="8" y="43" width="5" height="8" rx="2" fill="'+cc+'"/>'+
         '<rect x="47" y="43" width="5" height="8" rx="2" fill="'+cc+'"/>'+
         '<ellipse cx="10.5" cy="52" rx="3.5" ry="2.8" fill="'+L+'"/>'+
         '<ellipse cx="49.5" cy="52" rx="3.5" ry="2.8" fill="'+L+'"/>';
      if(gender==='female'){
        t+='<rect x="18" y="49" width="24" height="14" rx="3" fill="'+D+'"/>'+
           '<rect x="24" y="62" width="6" height="10" rx="3" fill="'+L+'"/>'+
           '<rect x="30" y="62" width="6" height="10" rx="3" fill="'+L+'"/>'+
           '<ellipse cx="27" cy="72" rx="4" ry="2.2" fill="#333"/>'+
           '<ellipse cx="33" cy="72" rx="4" ry="2.2" fill="#333"/>';
      } else {
        t+='<rect x="18" y="49" width="12" height="18" rx="3" fill="'+D+'"/>'+
           '<rect x="30" y="49" width="12" height="18" rx="3" fill="'+D+'"/>'+
           '<rect x="17" y="66" width="14" height="5" rx="2" fill="'+L+'"/>'+
           '<rect x="29" y="66" width="14" height="5" rx="2" fill="'+L+'"/>';
      }
    } else if(cl==='archer'){
      t='<rect x="14" y="33" width="32" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="18" y="33" width="24" height="16" rx="3" fill="'+L+'" opacity=".35"/>'+
         '<line x1="14" y1="33" x2="46" y2="49" stroke="'+D+'" stroke-width="1.8"/>'+
         '<rect x="13" y="34" width="6" height="12" rx="3" fill="'+cc+'"/>'+
         '<rect x="41" y="34" width="6" height="12" rx="3" fill="'+cc+'"/>'+
         '<ellipse cx="16" cy="47" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
         '<ellipse cx="44" cy="47" rx="3.2" ry="2.6" fill="'+sk+'"/>';
      if(gender==='female'){
        t+='<rect x="18" y="48" width="24" height="12" rx="3" fill="'+D+'"/>'+
           '<rect x="24" y="59" width="6" height="11" rx="3" fill="'+sk2+'"/>'+
           '<rect x="30" y="59" width="6" height="11" rx="3" fill="'+sk2+'"/>'+
           '<ellipse cx="27" cy="71" rx="4" ry="2.2" fill="#333"/>'+
           '<ellipse cx="33" cy="71" rx="4" ry="2.2" fill="#333"/>';
      } else {
        t+='<rect x="22" y="48" width="16" height="8" rx="2" fill="'+D+'"/>'+
           '<rect x="22" y="55" width="7" height="13" rx="3" fill="'+D+'"/>'+
           '<rect x="31" y="55" width="7" height="13" rx="3" fill="'+D+'"/>'+
           '<ellipse cx="25.5" cy="69" rx="4.5" ry="2.4" fill="#333"/>'+
           '<ellipse cx="34.5" cy="69" rx="4.5" ry="2.4" fill="#333"/>';
      }
    } else { /* healer */
      t='<rect x="13" y="33" width="34" height="18" rx="6" fill="'+cc+'"/>'+
         '<rect x="18" y="35" width="3" height="10" rx="1" fill="white" opacity=".9"/>'+
         '<rect x="14" y="40" width="9" height="3" rx="1" fill="white" opacity=".9"/>'+
         '<rect x="13" y="34" width="5" height="14" rx="3" fill="'+cc+'"/>'+
         '<rect x="42" y="34" width="5" height="14" rx="3" fill="'+cc+'"/>'+
         '<ellipse cx="15.5" cy="49" rx="3.5" ry="2.8" fill="'+sk+'"/>'+
         '<ellipse cx="44.5" cy="49" rx="3.5" ry="2.8" fill="'+sk+'"/>'+
         '<rect x="15" y="49" width="30" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="24" y="64" width="6" height="7" rx="3" fill="'+sk2+'"/>'+
         '<rect x="30" y="64" width="6" height="7" rx="3" fill="'+sk2+'"/>'+
         '<ellipse cx="27" cy="71" rx="4" ry="2.2" fill="#2a1a0a"/>'+
         '<ellipse cx="33" cy="71" rx="4" ry="2.2" fill="#2a1a0a"/>';
    }
  } else if(dir==='left'){
    if(cl==='mage'){
      t='<rect x="14" y="49" width="35" height="18" rx="6" fill="'+D+'"/>'+
         '<rect x="17" y="33" width="26" height="18" rx="6" fill="'+cc+'"/>'+
         '<rect x="26" y="34" width="5" height="14" rx="3" fill="'+cc+'"/>'+
         '<ellipse cx="28.5" cy="49" rx="3.5" ry="2.8" fill="'+sk+'"/>'+
         '<rect x="28" y="66" width="6" height="5" rx="2.5" fill="'+sk2+'"/>'+
         '<ellipse cx="31" cy="71" rx="4.5" ry="2.4" fill="#2a1a0a"/>';
    } else if(cl==='knight'){
      t='<rect x="16" y="33" width="28" height="18" rx="3" fill="'+cc+'"/>'+
         '<rect x="18" y="35" width="24" height="14" rx="2" fill="'+L+'"/>'+
         '<rect x="22" y="37" width="18" height="10" rx="2" fill="'+cc+'"/>'+
         '<rect x="25" y="33" width="7" height="10" rx="2" fill="'+L+'"/>'+
         '<rect x="25" y="43" width="5" height="8" rx="2" fill="'+cc+'"/>'+
         '<ellipse cx="28" cy="52" rx="3.5" ry="2.8" fill="'+L+'"/>'+
         '<rect x="20" y="49" width="20" height="15" rx="3" fill="'+D+'"/>'+
         '<rect x="25" y="63" width="6" height="9" rx="3" fill="'+D+'"/>'+
         '<rect x="32" y="63" width="6" height="9" rx="3" fill="'+D+'"/>'+
         '<ellipse cx="28" cy="72" rx="4" ry="2.2" fill="#333"/>'+
         '<ellipse cx="35" cy="72" rx="4" ry="2.2" fill="#333"/>';
    } else if(cl==='archer'){
      t='<rect x="17" y="33" width="27" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="26" y="34" width="6" height="12" rx="3" fill="'+cc+'"/>'+
         '<ellipse cx="29" cy="47" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
         '<rect x="24" y="48" width="18" height="15" rx="3" fill="'+D+'"/>'+
         '<rect x="26" y="62" width="6" height="9" rx="3" fill="'+sk2+'"/>'+
         '<ellipse cx="29" cy="71" rx="4" ry="2.2" fill="#333"/>';
    } else {
      t='<rect x="17" y="33" width="27" height="18" rx="6" fill="'+cc+'"/>'+
         '<rect x="26" y="34" width="5" height="14" rx="3" fill="'+cc+'"/>'+
         '<ellipse cx="28.5" cy="49" rx="3.5" ry="2.8" fill="'+sk+'"/>'+
         '<rect x="18" y="49" width="25" height="16" rx="5" fill="'+cc+'"/>'+
         '<rect x="26" y="64" width="6" height="7" rx="3" fill="'+sk2+'"/>'+
         '<ellipse cx="29" cy="71" rx="4" ry="2.2" fill="#2a1a0a"/>';
    }
  } else { /* up */
    var bd=dk(cc,15);
    t='<rect x="13" y="33" width="34" height="18" rx="6" fill="'+bd+'"/>'+
      '<rect x="13" y="34" width="5" height="14" rx="3" fill="'+bd+'"/>'+
      '<rect x="42" y="34" width="5" height="14" rx="3" fill="'+bd+'"/>'+
      '<ellipse cx="15.5" cy="49" rx="3.5" ry="2.8" fill="'+sk2+'"/>'+
      '<ellipse cx="44.5" cy="49" rx="3.5" ry="2.8" fill="'+sk2+'"/>'+
      '<rect x="15" y="49" width="30" height="18" rx="5" fill="'+dk(bd,10)+'"/>'+
      '<rect x="24" y="66" width="6" height="6" rx="3" fill="'+sk2+'"/>'+
      '<rect x="30" y="66" width="6" height="6" rx="3" fill="'+sk2+'"/>'+
      '<ellipse cx="27" cy="72" rx="4.5" ry="2.4" fill="#1a1a1a"/>'+
      '<ellipse cx="33" cy="72" rx="4.5" ry="2.4" fill="#1a1a1a"/>';
  }
  return t;
}

/* ---- 액세서리 ---- */
function _acc(acc, dir, cc, type) {
  var a='', L=li(cc,50), D=dk(cc,22);
  var h=function(v){return acc&&acc.indexOf(v)>-1;};

  if(type!=='fantasy'){
    if(h('glasses')&&dir==='down')
      a+='<rect x="14" y="14.5" width="8" height="6" rx="2.5" fill="none" stroke="#888" stroke-width=".9"/>'+
         '<rect x="28" y="14.5" width="8" height="6" rx="2.5" fill="none" stroke="#888" stroke-width=".9"/>'+
         '<path d="M22,17 L28,17" stroke="#888" stroke-width=".7"/>'+
         '<line x1="12" y1="17" x2="14" y2="17" stroke="#888" stroke-width=".7"/>'+
         '<line x1="36" y1="17" x2="38" y2="17" stroke="#888" stroke-width=".7"/>';
    if(h('glasses')&&dir==='left')
      a+='<rect x="28" y="14.5" width="8" height="6" rx="2.5" fill="none" stroke="#888" stroke-width=".9"/>';
    if(h('glasses2')&&dir==='down')
      a+='<rect x="14" y="14.5" width="8" height="7" rx=".8" fill="none" stroke="#3a2a1a" stroke-width="1.2"/>'+
         '<rect x="28" y="14.5" width="8" height="7" rx=".8" fill="none" stroke="#3a2a1a" stroke-width="1.2"/>'+
         '<path d="M22,17.5 L28,17.5" stroke="#3a2a1a" stroke-width=".8"/>';
    if(h('glasses2')&&dir==='left')
      a+='<rect x="28" y="14.5" width="8" height="7" rx=".8" fill="none" stroke="#3a2a1a" stroke-width="1.2"/>';
    if(h('bag'))
      a+='<rect x="44" y="35" width="10" height="14" rx="3" fill="'+L+'" stroke="'+cc+'" stroke-width=".8"/>'+
         '<rect x="45" y="32" width="2" height="4" rx="1" fill="none" stroke="'+cc+'" stroke-width=".7"/>';
    if(h('briefcase'))
      a+='<rect x="44" y="37" width="11" height="10" rx="2" fill="#8B6914" stroke="#5a4010" stroke-width=".7"/>'+
         '<rect x="47" y="34" width="5" height="4" rx="1" fill="none" stroke="#5a4010" stroke-width=".8"/>'+
         '<line x1="44" y1="42" x2="55" y2="42" stroke="#5a4010" stroke-width=".5"/>';
    if(h('hat')){
      if(dir==='up'){
        a+='<path d="M12,18 Q12,0 30,0 Q48,0 48,18 Z" fill="'+dk(cc,10)+'"/>'+
           '<rect x="11" y="14" width="38" height="5" rx="2" fill="'+dk(cc,20)+'"/'+'>';
      } else if(dir==='left'){
        a+='<path d="M17,18 Q17,0 32,0 Q47,0 47,18 Z" fill="'+cc+'"/>'+
           '<rect x="16" y="14" width="32" height="5" rx="2" fill="'+dk(cc,15)+'"/>'+
           '<path d="M47,15 Q57,17 54,22 L47,20 Z" fill="'+dk(cc,10)+'"/>';
      } else {
        a+='<path d="M11,18 Q11,0 30,0 Q49,0 49,18 Z" fill="'+cc+'"/>'+
           '<rect x="10" y="14" width="40" height="5" rx="2" fill="'+dk(cc,15)+'"/>'+
           '<path d="M8,18 Q30,23 52,18 L52,21 Q30,26 8,21 Z" fill="'+dk(cc,10)+'"/>';
      }
    }
    if(h('scarf'))
      a+='<rect x="18" y="29" width="24" height="7" rx="3.5" fill="#CC4444" opacity=".95"/>'+
         '<rect x="25" y="29" width="10" height="7" rx="2" fill="#b03030" opacity=".6"/>';
    if(h('mask')&&dir==='down')
      a+='<rect x="16" y="19" width="28" height="10" rx="3.5" fill="white" stroke="#ddd" stroke-width=".7"/>'+
         '<path d="M19,22 L41,22" stroke="#eee" stroke-width=".5"/>'+
         '<path d="M19,25 L41,25" stroke="#eee" stroke-width=".5"/>';
    if(h('mask')&&dir==='left')
      a+='<rect x="20" y="19" width="24" height="10" rx="3.5" fill="white" stroke="#ddd" stroke-width=".7"/>';
    if(h('earring')&&dir==='down')
      a+='<circle cx="12" cy="21" r="1.8" fill="#FFD700"/>'+
         '<circle cx="48" cy="21" r="1.8" fill="#FFD700"/>';
    if(h('earring')&&dir==='left')
      a+='<circle cx="12" cy="21" r="1.8" fill="#FFD700"/>';
    if(h('ribbon')&&dir==='down')
      a+='<polygon points="20,7 27,10 34,7 27,4" fill="#FF6B9D"/>'+
         '<circle cx="27" cy="8" r="2" fill="#FF9DBD"/>';
    if(h('ribbon')&&dir==='left')
      a+='<polygon points="42,7 49,10 49,4" fill="#FF6B9D"/>';
    if(type==='teacher'){
      if(h('tie')&&dir==='down')
        a+='<polygon points="27.5,33 32.5,33 33.5,43 30,46 26.5,43" fill="#8B0000"/>'+
           '<polygon points="28.5,33 31.5,33 30,36" fill="#6a1010"/>';
      if(h('bowtie')&&dir==='down')
        a+='<polygon points="22,34 30,32 30,36" fill="#8B0000"/>'+
           '<polygon points="38,34 30,32 30,36" fill="#8B0000"/>'+
           '<circle cx="30" cy="34" r="1.5" fill="#c00"/>';
      if(h('lanyard')&&dir!=='up')
        a+='<rect x="27" y="33" width="6" height="9" rx="1" fill="#3498DB" opacity=".9"/>'+
           '<rect x="28" y="42" width="4" height="5" rx=".5" fill="white" stroke="#3498DB" stroke-width=".5"/>';
      if(h('watch')&&dir!=='up')
        a+='<rect x="8" y="44" width="5" height="3.5" rx="1" fill="#C0C0C0" stroke="#999" stroke-width=".5"/>'+
           '<circle cx="10.5" cy="45.5" r=".8" fill="#fff" opacity=".6"/>';
    }
  }
  if(type==='fantasy'){
    if(h('fstaff'))
      a+='<line x1="47" y1="34" x2="54" y2="18" stroke="#8B6914" stroke-width="1.8"/>'+
         '<circle cx="54" cy="16" r="3.5" fill="#9B59B6" opacity=".9"/>'+
         '<circle cx="54" cy="16" r="1.8" fill="#E8DAEF"/>';
    if(h('fsword'))
      a+='<rect x="4" y="28" width="2.5" height="22" rx=".8" fill="#C0C0C0"/>'+
         '<rect x="2" y="37" width="7" height="2" rx=".5" fill="#8B6914"/>'+
         '<rect x="4.5" y="49" width="2" height="3" rx=".8" fill="#8B6914"/>';
    if(h('fbow'))
      a+='<path d="M50 20 Q56 30 50 50" stroke="#784212" stroke-width="2.5" fill="none"/>'+
         '<line x1="50" y1="20" x2="50" y2="50" stroke="#C8A96E" stroke-width="1"/>';
    if(h('fcape')){
      if(dir==='up'){
        a+='<rect x="12" y="33" width="36" height="26" rx="4" fill="'+D+'" opacity=".75"/>'+
           '<path d="M12 59 Q30 68 48 59" fill="'+D+'" opacity=".75"/>';
      } else if(dir==='left'){
        a+='<rect x="14" y="33" width="24" height="24" rx="4" fill="'+D+'" opacity=".65"/>'+
           '<path d="M14 57 Q26 64 38 57" fill="'+D+'" opacity=".65"/>';
      }
    }
    if(h('fcrown')&&dir!=='up')
      a+='<polygon points="17,9 20,4 24,7 30,3 36,7 40,4 43,9 43,12 17,12" fill="#B7950B"/>'+
         '<circle cx="30" cy="5" r="2" fill="#E74C3C"/>'+
         '<circle cx="19.5" cy="8.5" r="1.5" fill="#3498DB"/>'+
         '<circle cx="40.5" cy="8.5" r="1.5" fill="#27AE60"/>';
    if(h('fcrown')&&dir==='up')
      a+='<polygon points="17,5 20,0 24,3 30,0 36,3 40,0 43,5 43,8 17,8" fill="#B7950B"/>';
    if(h('fhat')&&dir!=='up')
      a+='<polygon points="30,0 18,12 42,12" fill="'+cc+'"/>'+
         '<rect x="14" y="11" width="32" height="5" rx="1" fill="'+cc+'"/>'+
         '<rect x="14" y="11" width="32" height="2" rx=".5" fill="'+L+'"/>';
    if(h('fhat')&&dir==='up')
      a+='<polygon points="30,0 18,12 42,12" fill="'+dk(cc,15)+'"/>'+
         '<rect x="14" y="11" width="32" height="4" rx="1" fill="'+dk(cc,15)+'"/>';
    if(h('glasses')&&dir==='down')
      a+='<rect x="14" y="14.5" width="8" height="6" rx="2.5" fill="none" stroke="#888" stroke-width=".9"/>'+
         '<rect x="28" y="14.5" width="8" height="6" rx="2.5" fill="none" stroke="#888" stroke-width=".9"/>'+
         '<path d="M22,17 L28,17" stroke="#888" stroke-width=".7"/>'+
         '<line x1="12" y1="17" x2="14" y2="17" stroke="#888" stroke-width=".7"/>'+
         '<line x1="36" y1="17" x2="38" y2="17" stroke="#888" stroke-width=".7"/>';
    if(h('earring')&&dir==='down')
      a+='<circle cx="12" cy="21" r="1.8" fill="#FFD700"/>'+
         '<circle cx="48" cy="21" r="1.8" fill="#FFD700"/>';
    if(h('earring')&&dir==='left')
      a+='<circle cx="12" cy="21" r="1.8" fill="#FFD700"/>';
  }
  return a;
}

/* ---- 메인 렌더 ---- */
function renderCharacterSVG(state) {
  var id='_r'+(++_rc);
  var skin  = state.skin   || '#FDEBD0';
  var hc    = state.hcolor || '#1a1008';
  var cc    = state.ccolor || '#1a3a6b';
  var dir   = state.dir    || 'down';
  var gender= state.gender || 'male';
  var hs    = state.hair   || 'short';
  var cl    = state.cloth  || 'suit';
  var type  = state.type   || 'student';
  var acc   = state.acc    || [];

  var shadow='<ellipse cx="30" cy="73" rx="14" ry="3.5" fill="#00000018"/>';
  var defs  =_defs(id,skin,hc);
  var hBack =_hairBack(id,dir,hc,hs);
  var hFront=_hairFront(id,dir,hc,hs);
  var face  =_face(id,dir,skin,hc);
  var neck  =_neck(dir,skin);
  var body;
  if(type==='teacher')      body=_teacherBody(dir,cl,cc,skin,gender);
  else if(type==='fantasy') body=_fantasyBody(dir,cl,cc,skin,gender);
  else                       body=_studentBody(dir,cc,skin,gender);
  var acc2=_acc(acc,dir,cc,type);

  if(dir==='up'){
    return defs+shadow+body+neck+hBack+hFront+acc2;
  }
  /* down/left: neck은 face 뒤에서 body 앞에 노출되어야 하므로 face 다음에 렌더 */
  return defs+shadow+body+hBack+face+neck+hFront+acc2;
}
