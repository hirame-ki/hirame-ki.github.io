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

/* ---- 눈 단일 렌더 (eye 스타일별) ---- */
function _eyeSVG(eye,id,cx,by){
  var P={
    normal:[4.2,5.0,3.6,4.3,1.8,2.3,1.4],
    small: [3.0,3.5,2.5,3.0,1.2,1.7,1.2],
    large: [5.0,6.2,4.3,5.3,2.2,2.7,1.6],
    round: [4.5,4.5,3.8,3.8,1.9,1.9,1.4],
    sharp: [4.8,3.5,4.0,3.0,2.0,1.5,1.5]
  };
  var p=P[eye]||P.normal;
  var wRx=p[0],wRy=p[1],iRx=p[2],iRy=p[3],pRx=p[4],pRy=p[5],lw=p[6];
  var ey='url(#ey'+id+')';
  var hx=+(cx-wRx*0.36).toFixed(1),hy=+(by-wRy*0.40).toFixed(1);
  var hrx=+(wRx*0.34).toFixed(1),hry=+(wRy*0.34).toFixed(1);
  var h2x=+(cx+wRx*0.36).toFixed(1),h2y=+(by+wRy*0.40).toFixed(1);
  var h2rx=+(wRx*0.17).toFixed(1),h2ry=+(wRy*0.17).toFixed(1);
  var l1x=+(cx-(wRx+0.3)).toFixed(1),l2x=+(cx+(wRx+0.3)).toFixed(1);
  var lmy=+(by-wRy-0.5).toFixed(1);
  var l1y=+(by-wRy*0.60).toFixed(1),l2y=l1y;
  if(eye==='sharp'){l1y=+(by-wRy*0.10).toFixed(1);l2y=+(by-wRy*0.55).toFixed(1);}
  return '<ellipse cx="'+cx+'" cy="'+by+'" rx="'+wRx+'" ry="'+wRy+'" fill="#fff"/>'+
    '<ellipse cx="'+cx+'" cy="'+(by+0.5)+'" rx="'+iRx+'" ry="'+iRy+'" fill="'+ey+'"/>'+
    '<ellipse cx="'+cx+'" cy="'+(by+1)+'" rx="'+pRx+'" ry="'+pRy+'" fill="#1a0c02"/>'+
    '<ellipse cx="'+hx+'" cy="'+hy+'" rx="'+hrx+'" ry="'+hry+'" fill="#fff"/>'+
    '<ellipse cx="'+h2x+'" cy="'+h2y+'" rx="'+h2rx+'" ry="'+h2ry+'" fill="#fff" opacity=".6"/>'+
    '<path d="M'+l1x+','+l1y+' Q'+cx+','+lmy+' '+l2x+','+l2y+'" fill="none" stroke="#1a0c02" stroke-width="'+lw+'" stroke-linecap="round"/>';
}

/* ---- 얼굴 ---- */
function _face(id, dir, skin, hc, eye) {
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
      _eyeSVG(eye,id,38,18)+
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
    _eyeSVG(eye,id,22,18)+_eyeSVG(eye,id,38,18)+
    '<ellipse cx="30" cy="22.5" rx=".8" ry=".6" fill="'+ns+'"/>'+
    '<path d="M27,25.5 Q30,28 33,25.5" fill="none" stroke="#c05a48" stroke-width="1.1" stroke-linecap="round"/>';
}

/* ---- 목 ---- */
function _neck(dir, skin) {
  if(dir==='down') return '<rect x="26" y="33" width="8" height="3" rx="1.5" fill="'+skin+'"/>';
  if(dir==='left') return '<rect x="27" y="33" width="7" height="3" rx="1.5" fill="'+skin+'"/>';
  if(dir==='up')   return '<rect x="26" y="33" width="8" height="3" rx="1.5" fill="'+dk(skin,20)+'"/>';
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

/* =====================================================================
   애니 캐릭터 렌더링 v2 (패턴/칼/이노스케 헬멧/네즈코 재킷)
   ===================================================================== */

/* 탄지로 몸체: 바둑판 하오리 + 검은 칼 */
function _tanjiroBody(dir,sk,id){
  var cc='#2E2723',D=dk(cc,22),pid='chkT'+id;
  var pat='<defs><pattern id="'+pid+'" patternUnits="userSpaceOnUse" width="6" height="6">'+
    '<rect width="6" height="6" fill="#3DA86A"/>'+
    '<rect width="3" height="3" fill="#111a11"/>'+
    '<rect x="3" y="3" width="3" height="3" fill="#111a11"/>'+
    '</pattern></defs>';
  if(dir==='down'){
    return pat+
      '<rect x="3.5" y="24" width="2.5" height="30" rx=".8" fill="#2a2010"/>'+
      '<rect x="2" y="21" width="5" height="3.5" rx=".8" fill="#784212"/>'+
      '<rect x="2.5" y="17" width="4" height="5" rx=".8" fill="#5a3020"/>'+
      '<path d="M13,33 Q7,40 9,57 Q11,62 17,58 L19,33 Z" fill="url(#'+pid+')"/>'+
      '<path d="M47,33 Q53,40 51,57 Q49,62 43,58 L41,33 Z" fill="url(#'+pid+')"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<rect x="22" y="47" width="16" height="9" rx="2" fill="'+D+'"/>'+
      '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
      '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>'+
      '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>';
  }
  if(dir==='left'){
    return pat+
      '<rect x="2.5" y="26" width="2.5" height="26" rx=".8" fill="#2a2010"/>'+
      '<rect x="1" y="23" width="5" height="3.5" rx=".8" fill="#784212"/>'+
      '<path d="M14,33 Q9,40 11,54 Q13,59 18,55 L20,33 Z" fill="url(#'+pid+')"/>'+
      '<rect x="19" y="33" width="21" height="16" rx="5" fill="'+cc+'"/>'+
      '<rect x="26" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
      '<rect x="23" y="47" width="15" height="9" rx="2" fill="'+D+'"/>'+
      '<rect x="23" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
      '<rect x="31" y="55" width="6" height="12" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="27" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>'+
      '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>';
  }
  return pat+
    '<path d="M13,33 Q7,38 9,46 L19,46 L19,33 Z" fill="url(#'+pid+')" opacity=".85"/>'+
    '<path d="M47,33 Q53,38 51,46 L41,46 L41,33 Z" fill="url(#'+pid+')" opacity=".85"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+dk(cc,15)+'"/>'+
    '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
    '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
    '<rect x="22" y="47" width="16" height="9" rx="2" fill="'+D+'"/>'+
    '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
    '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
    '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>'+
    '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>';
}

/* 탄지로 이마 흉터 */
function _tanjiroScar(dir){
  if(dir!=='down') return '';
  return '<path d="M19,13 Q21,10 20,13" stroke="#C0392B" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".85"/>'+
    '<circle cx="20" cy="13.5" r=".9" fill="#C0392B" opacity=".75"/>';
}

/* 네즈코 기모노 + 재킷(하오리) */
function _nezukoBody(dir,sk){
  var kimono='#D8507A',jacket='#F090B0',sash='#A03060';
  if(dir==='down'){
    return '<rect x="18" y="33" width="24" height="16" rx="5" fill="'+kimono+'"/>'+
      '<path d="M18,33 L22,33 L23,47 L18,47 Z" fill="'+jacket+'"/>'+
      '<path d="M42,33 L38,33 L37,47 L42,47 Z" fill="'+jacket+'"/>'+
      '<polygon points="22,33 26,33 25,44 23,47" fill="'+jacket+'" opacity=".6"/>'+
      '<polygon points="38,33 34,33 35,44 37,47" fill="'+jacket+'" opacity=".6"/>'+
      '<rect x="18" y="42" width="24" height="5" fill="'+sash+'"/>'+
      '<rect x="13" y="34" width="6.5" height="14" rx="3" fill="'+jacket+'"/>'+
      '<rect x="40.5" y="34" width="6.5" height="14" rx="3" fill="'+jacket+'"/>'+
      '<ellipse cx="16.3" cy="49" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="43.7" cy="49" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<path d="M18,47 L42,47 L44,68 L16,68 Z" fill="'+kimono+'"/>'+
      '<path d="M18,47 L42,47 L41,51 L19,51 Z" fill="'+sash+'" opacity=".4"/>'+
      '<path d="M24,48 L23.5,67 M36,48 L36.5,67" stroke="'+dk(kimono,20)+'" stroke-width=".7" opacity=".35"/>'+
      '<rect x="23" y="67" width="6" height="4" rx="1.5" fill="#2a1505"/>'+
      '<rect x="31" y="67" width="6" height="4" rx="1.5" fill="#2a1505"/>'+
      '<ellipse cx="26" cy="71" rx="4" ry="2" fill="#1a1008"/>'+
      '<ellipse cx="34" cy="71" rx="4" ry="2" fill="#1a1008"/>';
  }
  if(dir==='left'){
    return '<rect x="19" y="33" width="21" height="15" rx="5" fill="'+kimono+'"/>'+
      '<path d="M19,33 L22,33 L22,47 L19,47 Z" fill="'+jacket+'"/>'+
      '<rect x="19" y="42" width="21" height="5" fill="'+sash+'"/>'+
      '<rect x="26" y="34" width="6.5" height="14" rx="3" fill="'+jacket+'"/>'+
      '<path d="M19,47 L40,47 L42,68 L17,68 Z" fill="'+kimono+'"/>'+
      '<ellipse cx="29.3" cy="49" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="26" cy="71" rx="4" ry="2" fill="#1a1008"/>';
  }
  return '<rect x="18" y="33" width="24" height="15" rx="5" fill="'+dk(kimono,15)+'"/>'+
    '<rect x="13" y="34" width="6.5" height="14" rx="3" fill="'+dk(jacket,15)+'"/>'+
    '<rect x="40.5" y="34" width="6.5" height="14" rx="3" fill="'+dk(jacket,15)+'"/>'+
    '<path d="M18,47 L42,47 L44,68 L16,68 Z" fill="'+dk(kimono,15)+'"/>'+
    '<ellipse cx="26" cy="71" rx="4" ry="2" fill="#111"/>'+
    '<ellipse cx="34" cy="71" rx="4" ry="2" fill="#111"/>';
}

/* 대나무 재갈 */
function _bambooMuzzle(dir){
  if(dir==='down') return '<rect x="17" y="23" width="26" height="5.5" rx="2.7" fill="#3a6a1a" opacity=".93"/>'+
    '<path d="M23,23 L23,28.5 M29,23 L29,28.5 M35,23 L35,28.5" stroke="#2a4a10" stroke-width=".9" opacity=".7"/>';
  if(dir==='left') return '<rect x="27" y="23" width="20" height="5.5" rx="2.7" fill="#3a6a1a" opacity=".93"/>'+
    '<path d="M32,23 L32,28.5 M37,23 L37,28.5" stroke="#2a4a10" stroke-width=".9" opacity=".7"/>';
  return '';
}

/* 이노스케 맨살 상체 + 하카마 + 양검 */
function _inosukeBody(dir,sk){
  var cc='#344057',D=dk(cc,30),bl='#4a6070',gu='#8B6914',hd='#5a3a20';
  if(dir==='down'){
    return '<rect x="3.5" y="22" width="2.5" height="32" rx=".8" fill="'+bl+'"/>'+
      '<rect x="2" y="19" width="5" height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="2.5" y="15" width="4" height="5" rx=".8" fill="'+hd+'"/>'+
      '<rect x="54" y="22" width="2.5" height="32" rx=".8" fill="'+bl+'"/>'+
      '<rect x="53" y="19" width="5" height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="53.5" y="15" width="4" height="5" rx=".8" fill="'+hd+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+sk+'"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+sk+'"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+sk+'"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+dk(sk,12)+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+dk(sk,12)+'"/>'+
      '<path d="M18,46 L42,46 L44,68 L16,68 Z" fill="'+cc+'"/>'+
      '<path d="M29,46 L28,68 M31,46 L32,68" stroke="'+D+'" stroke-width=".8" opacity=".45"/>'+
      '<rect x="22" y="67" width="6" height="4" rx="1.5" fill="#2a1a08"/>'+
      '<rect x="32" y="67" width="6" height="4" rx="1.5" fill="#2a1a08"/>'+
      '<ellipse cx="25" cy="71" rx="4" ry="2" fill="#1a1008"/>'+
      '<ellipse cx="35" cy="71" rx="4" ry="2" fill="#1a1008"/>';
  }
  if(dir==='left'){
    return '<rect x="3.5" y="24" width="2.5" height="28" rx=".8" fill="'+bl+'"/>'+
      '<rect x="2" y="21" width="5" height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="19" y="33" width="21" height="14" rx="5" fill="'+sk+'"/>'+
      '<rect x="26" y="34" width="6.5" height="13" rx="3" fill="'+sk+'"/>'+
      '<path d="M19,46 L40,46 L42,68 L17,68 Z" fill="'+cc+'"/>'+
      '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+dk(sk,12)+'"/>'+
      '<ellipse cx="25" cy="71" rx="4" ry="2" fill="#1a1008"/>';
  }
  return '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+dk(sk,15)+'"/>'+
    '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+dk(sk,15)+'"/>'+
    '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+dk(sk,15)+'"/>'+
    '<path d="M18,46 L42,46 L44,68 L16,68 Z" fill="'+dk(cc,15)+'"/>'+
    '<ellipse cx="25" cy="71" rx="4" ry="2" fill="#111"/>'+
    '<ellipse cx="35" cy="71" rx="4" ry="2" fill="#111"/>';
}

/* 이노스케 멧돼지 마스크 (헬멧형, 목 위만 덮음) */
function _boarMask(dir){
  if(dir==='down'){
    return '<ellipse cx="30" cy="17" rx="18" ry="17" fill="#C2BAA8"/>'+
      '<ellipse cx="30" cy="17" rx="16" ry="15" fill="#CEC5B2"/>'+
      '<ellipse cx="30" cy="26" rx="7.5" ry="5" fill="#C07858"/>'+
      '<ellipse cx="26.5" cy="24.5" rx="2.2" ry="2.2" fill="#3a1a0a"/>'+
      '<ellipse cx="33.5" cy="24.5" rx="2.2" ry="2.2" fill="#3a1a0a"/>'+
      '<ellipse cx="19" cy="13" rx="4.5" ry="3.5" fill="#3a3020"/>'+
      '<ellipse cx="41" cy="13" rx="4.5" ry="3.5" fill="#3a3020"/>'+
      '<ellipse cx="19" cy="13" rx="2.8" ry="2.2" fill="#4a8030" opacity=".55"/>'+
      '<ellipse cx="41" cy="13" rx="2.8" ry="2.2" fill="#4a8030" opacity=".55"/>'+
      '<ellipse cx="7" cy="6" rx="5.5" ry="7.5" fill="#C07858"/>'+
      '<ellipse cx="7" cy="6" rx="3.2" ry="5" fill="#FF9090"/>'+
      '<ellipse cx="53" cy="6" rx="5.5" ry="7.5" fill="#C07858"/>'+
      '<ellipse cx="53" cy="6" rx="3.2" ry="5" fill="#FF9090"/>';
  }
  if(dir==='left'){
    return '<ellipse cx="32" cy="16" rx="14" ry="16" fill="#C2BAA8"/>'+
      '<ellipse cx="32" cy="16" rx="12" ry="14" fill="#CEC5B2"/>'+
      '<ellipse cx="44" cy="23" rx="5.5" ry="4" fill="#C07858"/>'+
      '<ellipse cx="44" cy="22" rx="1.8" ry="1.8" fill="#3a1a0a"/>'+
      '<ellipse cx="38" cy="12" rx="4" ry="3" fill="#3a3020"/>'+
      '<ellipse cx="38" cy="12" rx="2.5" ry="2" fill="#4a8030" opacity=".55"/>'+
      '<ellipse cx="19" cy="5" rx="4.5" ry="6.5" fill="#C07858"/>'+
      '<ellipse cx="19" cy="5" rx="2.8" ry="4.5" fill="#FF9090"/>';
  }
  return '<ellipse cx="30" cy="17" rx="18" ry="17" fill="#C2BAA8"/>'+
    '<ellipse cx="7" cy="6" rx="5.5" ry="7.5" fill="#C07858"/>'+
    '<ellipse cx="7" cy="6" rx="3.2" ry="5" fill="#FF9090"/>'+
    '<ellipse cx="53" cy="6" rx="5.5" ry="7.5" fill="#C07858"/>'+
    '<ellipse cx="53" cy="6" rx="3.2" ry="5" fill="#FF9090"/>';
}

/* 젠이츠 몸체: 흰 삼각무늬 노란 하오리 + 노란 칼 */
function _zenitsuBody(dir,sk,id){
  var cc='#262B49',hc='#F0C030',D=dk(cc,22),pid='zenP'+id;
  var pat='<defs><pattern id="'+pid+'" patternUnits="userSpaceOnUse" width="5" height="5">'+
    '<rect width="5" height="5" fill="'+hc+'"/>'+
    '<path d="M0,5 L2.5,0 L5,5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>'+
    '</pattern></defs>';
  if(dir==='down'){
    return pat+
      '<rect x="3.5" y="24" width="2.5" height="30" rx=".8" fill="#E8C840"/>'+
      '<rect x="2" y="21" width="5" height="3.5" rx=".8" fill="#784212"/>'+
      '<rect x="2.5" y="17" width="4" height="5" rx=".8" fill="#5a3020"/>'+
      '<path d="M13,33 Q7,40 9,57 Q11,62 17,58 L19,33 Z" fill="url(#'+pid+')"/>'+
      '<path d="M47,33 Q53,40 51,57 Q49,62 43,58 L41,33 Z" fill="url(#'+pid+')"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<rect x="22" y="47" width="16" height="9" rx="2" fill="'+D+'"/>'+
      '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
      '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>'+
      '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>';
  }
  if(dir==='left'){
    return pat+
      '<rect x="2.5" y="26" width="2.5" height="26" rx=".8" fill="#E8C840"/>'+
      '<rect x="1" y="23" width="5" height="3.5" rx=".8" fill="#784212"/>'+
      '<path d="M14,33 Q9,40 11,54 Q13,59 18,55 L20,33 Z" fill="url(#'+pid+')"/>'+
      '<rect x="19" y="33" width="21" height="16" rx="5" fill="'+cc+'"/>'+
      '<rect x="26" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
      '<rect x="23" y="47" width="15" height="9" rx="2" fill="'+D+'"/>'+
      '<rect x="23" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
      '<rect x="31" y="55" width="6" height="12" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="27" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>'+
      '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#1a1008"/>';
  }
  return pat+
    '<path d="M13,33 Q7,38 9,46 L19,46 L19,33 Z" fill="url(#'+pid+')" opacity=".85"/>'+
    '<path d="M47,33 Q53,38 51,46 L41,46 L41,33 Z" fill="url(#'+pid+')" opacity=".85"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+dk(cc,15)+'"/>'+
    '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
    '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="url(#'+pid+')"/>'+
    '<rect x="22" y="47" width="16" height="9" rx="2" fill="'+D+'"/>'+
    '<rect x="22" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
    '<rect x="31" y="55" width="7" height="12" rx="3" fill="'+D+'"/>'+
    '<ellipse cx="25.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>'+
    '<ellipse cx="34.5" cy="68" rx="4.5" ry="2.6" fill="#111"/>';
}

/* 히나타 배구 유니폼 */
function _hinataBody(dir,sk){
  var cc='#262B49',acc='#E88030',D=dk(cc,22);
  if(dir==='down'){
    return '<rect x="18" y="33" width="24" height="16" rx="5" fill="'+cc+'"/>'+
      '<rect x="18" y="40" width="24" height="3" fill="'+acc+'" opacity=".65"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+cc+'"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+cc+'"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<path d="M18,47 L42,47 L44,65 L16,65 Z" fill="'+cc+'"/>'+
      '<path d="M18,47 L42,47 L41,51 L19,51 Z" fill="'+acc+'" opacity=".4"/>'+
      '<rect x="22" y="64" width="6" height="5" rx="1.5" fill="#fff"/>'+
      '<rect x="32" y="64" width="6" height="5" rx="1.5" fill="#fff"/>'+
      '<ellipse cx="25" cy="69" rx="4.5" ry="2" fill="#e0e0e0" stroke="#ccc" stroke-width=".5"/>'+
      '<ellipse cx="35" cy="69" rx="4.5" ry="2" fill="#e0e0e0" stroke="#ccc" stroke-width=".5"/>';
  }
  if(dir==='left'){
    return '<rect x="19" y="33" width="21" height="16" rx="5" fill="'+cc+'"/>'+
      '<rect x="19" y="40" width="21" height="3" fill="'+acc+'" opacity=".65"/>'+
      '<rect x="26" y="34" width="6.5" height="13" rx="3" fill="'+cc+'"/>'+
      '<path d="M19,47 L40,47 L42,65 L17,65 Z" fill="'+cc+'"/>'+
      '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="26" cy="68" rx="4.5" ry="2" fill="#e0e0e0" stroke="#ccc" stroke-width=".5"/>';
  }
  return '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+dk(cc,15)+'"/>'+
    '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="'+dk(cc,15)+'"/>'+
    '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="'+dk(cc,15)+'"/>'+
    '<path d="M18,47 L42,47 L44,65 L16,65 Z" fill="'+dk(cc,15)+'"/>'+
    '<ellipse cx="25" cy="69" rx="4.5" ry="2" fill="#ccc"/>'+
    '<ellipse cx="35" cy="69" rx="4.5" ry="2" fill="#ccc"/>';
}

/* 히나타 머리 스파이크 */
function _hinataSpikes(dir,hc){
  if(dir!=='down') return '';
  return '<path d="M18,11 Q16,3 20,8" fill="'+hc+'" stroke="'+dk(hc,20)+'" stroke-width=".5"/>'+
    '<path d="M25,7 Q24,0 28,6" fill="'+hc+'" stroke="'+dk(hc,20)+'" stroke-width=".5"/>'+
    '<path d="M33,7 Q34,0 37,6" fill="'+hc+'" stroke="'+dk(hc,20)+'" stroke-width=".5"/>'+
    '<path d="M40,10 Q43,3 44,9" fill="'+hc+'" stroke="'+dk(hc,20)+'" stroke-width=".5"/>';
}

/* 루피 몸체: 빨간 조끼 + 파란 반바지 */
function _luffyBody(dir,sk){
  if(dir==='down'){
    return '<rect x="18" y="33" width="24" height="16" rx="5" fill="#E62C39"/>'+
      '<rect x="25" y="33" width="10" height="15" fill="#4C7FD4"/>'+
      '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="#E62C39"/>'+
      '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="#E62C39"/>'+
      '<ellipse cx="16.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="43.7" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<path d="M18,47 L42,47 L44,65 L16,65 Z" fill="#3B5998"/>'+
      '<path d="M18,47 L42,47 L41.5,51 L18.5,51 Z" fill="#4C7FD4" opacity=".5"/>'+
      '<rect x="22" y="64" width="7" height="5" rx="2" fill="#2a3a6a"/>'+
      '<rect x="31" y="64" width="7" height="5" rx="2" fill="#2a3a6a"/>'+
      '<ellipse cx="25.5" cy="69" rx="4.5" ry="2.2" fill="#2a1a08"/>'+
      '<ellipse cx="34.5" cy="69" rx="4.5" ry="2.2" fill="#2a1a08"/>';
  }
  if(dir==='left'){
    return '<rect x="19" y="33" width="21" height="16" rx="5" fill="#E62C39"/>'+
      '<rect x="26" y="33" width="9" height="15" fill="#4C7FD4"/>'+
      '<rect x="26" y="34" width="6.5" height="13" rx="3" fill="#E62C39"/>'+
      '<path d="M19,47 L40,47 L42,65 L17,65 Z" fill="#3B5998"/>'+
      '<ellipse cx="29.3" cy="48" rx="3.2" ry="2.6" fill="'+sk+'"/>'+
      '<ellipse cx="26" cy="68" rx="4.5" ry="2.2" fill="#2a1a08"/>';
  }
  return '<rect x="18" y="33" width="24" height="14" rx="5" fill="#B01F28"/>'+
    '<rect x="13" y="34" width="6.5" height="13" rx="3" fill="#B01F28"/>'+
    '<rect x="40.5" y="34" width="6.5" height="13" rx="3" fill="#B01F28"/>'+
    '<path d="M18,47 L42,47 L44,65 L16,65 Z" fill="#2B4070"/>'+
    '<ellipse cx="25.5" cy="69" rx="4.5" ry="2.2" fill="#1a1008"/>'+
    '<ellipse cx="34.5" cy="69" rx="4.5" ry="2.2" fill="#1a1008"/>';
}

/* 루피 밀짚모자 (뒷모습 포함) */
function _strawHat(dir){
  if(dir==='up'){
    return '<ellipse cx="30" cy="10" rx="27" ry="5.5" fill="#DFC18A"/>'+
      '<ellipse cx="30" cy="10" rx="27" ry="5.5" fill="none" stroke="#C8A87A" stroke-width=".8"/>'+
      '<path d="M9,10 Q11,0 30,0 Q49,0 51,10 Z" fill="'+dk('#DFC18A',8)+'"/>'+
      '<path d="M9,10 Q11,0 30,0 Q49,0 51,10" fill="none" stroke="#C8A87A" stroke-width=".8"/>'+
      '<path d="M9,10 Q30,13 51,10 Q30,8.5 9,10" fill="#E62C39"/>';
  }
  if(dir==='left'){
    return '<path d="M10,11 Q12,1 31,0 Q49,2 50,11 Z" fill="#DFC18A"/>'+
      '<path d="M10,11 Q12,1 31,0 Q49,2 50,11" fill="none" stroke="#C8A87A" stroke-width=".8"/>'+
      '<ellipse cx="31" cy="11" rx="25" ry="5.5" fill="#DFC18A"/>'+
      '<ellipse cx="31" cy="11" rx="25" ry="5.5" fill="none" stroke="#C8A87A" stroke-width=".8"/>'+
      '<path d="M6,11 Q31,14 56,11 Q31,8.5 6,11" fill="#E62C39"/>'+
      '<path d="M16,7 Q28,5 38,7" fill="none" stroke="#F0D5A0" stroke-width=".9" opacity=".65"/>';
  }
  return '<path d="M8,11 Q11,1 30,0 Q49,1 52,11 Z" fill="#DFC18A"/>'+
    '<path d="M8,11 Q11,1 30,0 Q49,1 52,11" fill="none" stroke="#C8A87A" stroke-width=".8"/>'+
    '<ellipse cx="30" cy="11" rx="27" ry="5.5" fill="#DFC18A"/>'+
    '<ellipse cx="30" cy="11" rx="27" ry="5.5" fill="none" stroke="#C8A87A" stroke-width=".8"/>'+
    '<path d="M3,11 Q30,14 57,11 Q30,8.5 3,11" fill="#E62C39"/>'+
    '<path d="M16,7 Q25,4 35,7" fill="none" stroke="#F0D5A0" stroke-width=".9" opacity=".65"/>';
}

/* ===== 디즈니 캐릭터 ===== */

/* 엘사 — 아이스블루 드레스 */
function _elsaBody(dir,sk){
  var c='#89CFF0',D=dk(c,18),sl='#C8E8FF';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+c+'"/>'+
      '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="11" cy="48" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="48" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="5" fill="'+c+'"/>'+
      '<path d="M18,36 Q30,33 42,36 L40,33 L20,33 Z" fill="'+sl+'" opacity=".65"/>'+
      '<path d="M16,49 L44,49 L42,70 L18,70 Z" fill="'+D+'"/>'+
      '<path d="M16,49 L44,49 L44,54 L16,54 Z" fill="'+c+'" opacity=".7"/>'+
      '<path d="M23,38 L24,35 L25,38" fill="white" opacity=".55"/>'+
      '<path d="M36,37 L37,34 L38,37" fill="white" opacity=".55"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="10" cy="48" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="5" fill="'+c+'"/>'+
      '<path d="M16,49 L40,49 L38,70 L17,70 Z" fill="'+D+'"/>';
  }
  return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="5" fill="'+dk(c,10)+'"/>'+
    '<path d="M16,49 L44,49 L42,70 L18,70 Z" fill="'+dk(D,10)+'"/>';
}
function _elsaBraid(dir){
  if(dir!=='down') return '';
  return '<path d="M38,22 Q44,32 43,45 Q42,52 41,58" stroke="#C8D8FF" stroke-width="3.5" stroke-linecap="round" fill="none"/>'+
    '<path d="M39,22 Q45,33 44,46" stroke="white" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".45"/>'+
    '<rect x="36" y="19" width="6" height="2" rx="1" fill="#89CFF0" opacity=".9"/>';
}

/* 모아나 — 빨간 탑+청록 스커트 */
function _moanaBody(dir,sk){
  var top='#C93838',skirt='#2A8878',belt='#F09820';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="10" rx="3.5" fill="'+top+'"/>'+
      '<rect x="40" y="35" width="7" height="10" rx="3.5" fill="'+top+'"/>'+
      '<ellipse cx="11" cy="45" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="45" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="12" rx="4" fill="'+top+'"/>'+
      '<rect x="17" y="44" width="26" height="5" rx="1" fill="'+belt+'"/>'+
      '<path d="M15,49 L45,49 L43,70 L17,70 Z" fill="'+skirt+'"/>'+
      '<path d="M21,49 L22,70 M28,49 L29,70 M35,49 L35,70 M41,49 L40,70" stroke="'+dk(skirt,15)+'" stroke-width=".7" opacity=".45"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="10" rx="3.5" fill="'+top+'"/>'+
      '<ellipse cx="10" cy="45" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="12" rx="4" fill="'+top+'"/>'+
      '<rect x="17" y="44" width="23" height="5" rx="1" fill="'+belt+'"/>'+
      '<path d="M15,49 L40,49 L38,70 L16,70 Z" fill="'+skirt+'"/>';
  }
  return '<rect x="13" y="35" width="7" height="10" rx="3.5" fill="'+dk(top,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="10" rx="3.5" fill="'+dk(top,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="12" rx="4" fill="'+dk(top,10)+'"/>'+
    '<path d="M15,49 L45,49 L43,70 L17,70 Z" fill="'+dk(skirt,10)+'"/>';
}
function _moanaFlower(dir){
  if(dir!=='down') return '';
  return '<circle cx="41" cy="10" r="3.5" fill="#F5A020"/>'+
    '<circle cx="41" cy="6"  r="2.2" fill="#F5A020"/>'+
    '<circle cx="45" cy="10" r="2.2" fill="#F5A020"/>'+
    '<circle cx="41" cy="14" r="2.2" fill="#F5A020"/>'+
    '<circle cx="37" cy="10" r="2.2" fill="#F5A020"/>'+
    '<circle cx="41" cy="10" r="2"   fill="#FFF060"/>';
}

/* 백설공주 — 파란 보디스+노란 스커트 */
function _snowwhiteBody(dir,sk){
  var bodice='#3C5A9A',skirt='#F7D448',sleeve='#F9E870',collar='#FFFFF5';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+sleeve+'"/>'+
      '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+sleeve+'"/>'+
      '<ellipse cx="11" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="4" fill="'+bodice+'"/>'+
      '<path d="M21,33 Q30,31 39,33 L38,39 Q30,37 22,39 Z" fill="'+collar+'"/>'+
      '<path d="M15,47 L45,47 L43,70 L17,70 Z" fill="'+skirt+'"/>'+
      '<path d="M21,47 L22,70 M27,47 L28,70 M33,47 L33,70 M39,47 L38,70" stroke="'+dk(skirt,12)+'" stroke-width=".7" opacity=".4"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+sleeve+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="14" rx="4" fill="'+bodice+'"/>'+
      '<path d="M14,47 L40,47 L38,70 L16,70 Z" fill="'+skirt+'"/>';
  }
  return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+dk(sleeve,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+dk(sleeve,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="4" fill="'+dk(bodice,10)+'"/>'+
    '<path d="M15,47 L45,47 L43,70 L17,70 Z" fill="'+dk(skirt,10)+'"/>';
}
function _snowwhiteRibbon(dir){
  if(dir!=='down') return '';
  return '<path d="M13,13 Q16,9 20,12 Q17,8 14,13 Z" fill="#C02828"/>'+
    '<path d="M47,13 Q44,9 40,12 Q43,8 46,13 Z" fill="#C02828"/>'+
    '<circle cx="30" cy="12" r="2.5" fill="#C02828"/>'+
    '<path d="M12,12 Q30,10 48,12" stroke="#C02828" stroke-width="2" fill="none"/>';
}

/* 라푼젤 — 보라색 드레스+긴 금발 */
function _rapunzelBody(dir,sk){
  var cc='#8A5BA0',D=dk(cc,16),sl='#C080D0',belt='#C8A030';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+sl+'"/>'+
      '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+sl+'"/>'+
      '<ellipse cx="11" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+cc+'"/>'+
      '<path d="M22,33 Q30,31 38,33 L37,38 Q30,36 23,38 Z" fill="'+sl+'" opacity=".6"/>'+
      '<rect x="17" y="46" width="26" height="4" rx="1" fill="'+belt+'"/>'+
      '<path d="M15,50 L45,50 L43,70 L17,70 Z" fill="'+D+'"/>'+
      '<path d="M22,50 L23,70 M29,50 L29,70 M36,50 L35,70 M42,50 L41,70" stroke="'+dk(D,15)+'" stroke-width=".6" opacity=".4"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+sl+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="14" rx="5" fill="'+cc+'"/>'+
      '<rect x="17" y="46" width="23" height="4" rx="1" fill="'+belt+'"/>'+
      '<path d="M14,50 L40,50 L38,70 L16,70 Z" fill="'+D+'"/>';
  }
  return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+dk(sl,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+dk(sl,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+dk(cc,10)+'"/>'+
    '<path d="M15,50 L45,50 L43,70 L17,70 Z" fill="'+dk(D,10)+'"/>';
}

/* 신데렐라 — 하늘색 볼가운 */
function _cinderellaBody(dir,sk){
  var c='#7EC8E8',D=dk(c,15),sl='#AAE0F0',sash='#F0F8FF';
  if(dir==='down'){
    return '<rect x="12" y="35" width="8" height="12" rx="4" fill="'+sl+'"/>'+
      '<rect x="40" y="35" width="8" height="12" rx="4" fill="'+sl+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="50" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+c+'"/>'+
      '<path d="M20,33 Q30,31 40,33 L38,38 Q30,36 22,38 Z" fill="'+sash+'" opacity=".7"/>'+
      '<path d="M13,49 L47,49 L44,70 L16,70 Z" fill="'+D+'"/>'+
      '<path d="M13,49 L47,49 L47,55 L13,55 Z" fill="'+c+'" opacity=".6"/>'+
      '<path d="M20,49 L21,70 M26,49 L27,70 M30,49 L30,70 M34,49 L33,70 M40,49 L39,70" stroke="white" stroke-width=".6" opacity=".35"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+sl+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="14" rx="5" fill="'+c+'"/>'+
      '<path d="M12,49 L40,49 L38,70 L14,70 Z" fill="'+D+'"/>';
  }
  return '<rect x="12" y="35" width="8" height="12" rx="4" fill="'+dk(sl,10)+'"/>'+
    '<rect x="40" y="35" width="8" height="12" rx="4" fill="'+dk(sl,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="5" fill="'+dk(c,10)+'"/>'+
    '<path d="M13,49 L47,49 L44,70 L16,70 Z" fill="'+dk(D,10)+'"/>';
}
function _cinderellaTiara(dir){
  if(dir!=='down') return '';
  return '<path d="M21,10 L23,6 L25,10" fill="#E8D060" stroke="#C8A830" stroke-width=".5"/>'+
    '<path d="M27,10 L30,4 L33,10" fill="#E8D060" stroke="#C8A830" stroke-width=".5"/>'+
    '<path d="M35,10 L37,6 L39,10" fill="#E8D060" stroke="#C8A830" stroke-width=".5"/>'+
    '<path d="M20,10 L40,10" stroke="#E8D060" stroke-width="1.8"/>'+
    '<circle cx="30" cy="4" r="1.5" fill="#AAE0F0"/>';
}

/* 뮬란 — 핑크 한푸 */
function _mulanBody(dir,sk){
  var outer='#D87090',inner='#F0C0D0',sash='#E04060',acc='#C85070';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+outer+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+outer+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+outer+'"/>'+
      '<path d="M24,33 L30,40 L36,33" fill="'+inner+'" opacity=".8"/>'+  // front opening
      '<rect x="17" y="46" width="26" height="4" rx="1" fill="'+sash+'"/>'+
      '<path d="M16,50 L44,50 L42,70 L18,70 Z" fill="'+outer+'"/>'+
      '<path d="M24,50 Q26,60 24,70 M36,50 Q34,60 36,70" stroke="'+acc+'" stroke-width=".8" fill="none" opacity=".5"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+outer+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+outer+'"/>'+
      '<rect x="17" y="46" width="23" height="4" rx="1" fill="'+sash+'"/>'+
      '<path d="M15,50 L40,50 L38,70 L16,70 Z" fill="'+outer+'"/>';
  }
  return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(outer,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(outer,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(outer,10)+'"/>'+
    '<path d="M16,50 L44,50 L42,70 L18,70 Z" fill="'+dk(outer,12)+'"/>';
}
function _mulanHairpin(dir){
  if(dir!=='down') return '';
  return '<path d="M32,8 L32,2 Q34,0 36,2 L38,5" stroke="#C89020" stroke-width="1.5" stroke-linecap="round" fill="none"/>'+
    '<circle cx="38" cy="5" r="2.2" fill="#E84060"/>'+
    '<circle cx="38" cy="5" r="1"   fill="#F8C0C0"/>';
}

/* ===== 인기 애니 캐릭터 ===== */

/* 나루토 — 오렌지 닌자복 */
function _narutoBody(dir,sk){
  var c='#E87020',D=dk(c,18),bl='#181818';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+c+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+c+'"/>'+
      '<rect x="14" y="33" width="2.5" height="16" rx="1" fill="'+bl+'"/>'+
      '<rect x="43.5" y="33" width="2.5" height="16" rx="1" fill="'+bl+'"/>'+
      '<path d="M27,33 L30,38 L33,33" fill="'+sk+'" opacity=".8"/>'+  // collar skin
      '<rect x="18" y="49" width="11" height="21" rx="3" fill="'+c+'"/>'+  // left leg
      '<rect x="31" y="49" width="11" height="21" rx="3" fill="'+D+'"/>'+  // right leg
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#1A1A1A"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#1A1A1A"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+c+'"/>'+
      '<rect x="14" y="33" width="2.5" height="16" rx="1" fill="'+bl+'"/>'+
      '<rect x="18" y="49" width="10" height="21" rx="3" fill="'+c+'"/>'+
      '<rect x="29" y="49" width="10" height="21" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#1A1A1A"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#1A1A1A"/>';
  }
  return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(c,10)+'"/>'+
    '<rect x="18" y="49" width="11" height="21" rx="3" fill="'+dk(c,10)+'"/>'+
    '<rect x="31" y="49" width="11" height="21" rx="3" fill="'+dk(D,10)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#111"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#111"/>';
}
function _narutoExtras(dir){
  // 이마 머리띠 + 수염
  var out='';
  if(dir==='down'){
    out+='<rect x="14" y="13" width="32" height="6" rx="2" fill="#5A5A5A"/>'+  // headband plate
      '<rect x="15" y="14" width="30" height="4" rx="1" fill="#C0C8C0"/>'+
      '<path d="M27,14 L28,16 L30,13 L32,16 L33,14" fill="none" stroke="#3A3A3A" stroke-width=".9"/>'+  // konoha symbol
      // whiskers
      '<path d="M14,22 Q17,21 20,22" stroke="#8B5A3A" stroke-width="1.2" fill="none" stroke-linecap="round"/>'+
      '<path d="M14,24 Q17,23 20,24" stroke="#8B5A3A" stroke-width="1.2" fill="none" stroke-linecap="round"/>'+
      '<path d="M40,22 Q43,21 46,22" stroke="#8B5A3A" stroke-width="1.2" fill="none" stroke-linecap="round"/>'+
      '<path d="M40,24 Q43,23 46,24" stroke="#8B5A3A" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
  }
  return out;
}

/* 손오공 — 오렌지 도복 */
function _gokuBody(dir,sk){
  var c='#E87020',D=dk(c,18),blue='#3060A8',belt='#2A2A2A';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+blue+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+blue+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+c+'"/>'+
      '<path d="M25,33 L30,39 L35,33" fill="'+blue+'" opacity=".9"/>'+  // blue collar V
      '<rect x="16" y="45" width="28" height="5" rx="1.5" fill="'+belt+'"/>'+  // belt
      '<rect x="18" y="50" width="11" height="20" rx="3" fill="'+c+'"/>'+
      '<rect x="31" y="50" width="11" height="20" rx="3" fill="'+D+'"/>'+
      '<rect x="12" y="47" width="5" height="6" rx="2" fill="'+blue+'"/>'+  // left wristband
      '<rect x="43" y="47" width="5" height="6" rx="2" fill="'+blue+'"/>'+  // right wristband
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#111"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#111"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+blue+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+c+'"/>'+
      '<rect x="16" y="45" width="24" height="5" rx="1.5" fill="'+belt+'"/>'+
      '<rect x="18" y="50" width="10" height="20" rx="3" fill="'+c+'"/>'+
      '<rect x="29" y="50" width="10" height="20" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#111"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#111"/>';
  }
  return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(c,10)+'"/>'+
    '<rect x="18" y="50" width="11" height="20" rx="3" fill="'+dk(c,10)+'"/>'+
    '<rect x="31" y="50" width="11" height="20" rx="3" fill="'+dk(D,10)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#111"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#111"/>';
}
function _gokuSpikes(dir,hc){
  // 극단적 삐죽머리 추가
  if(dir==='up') return '';
  return '<path d="M15,16 Q11,6 16,12" fill="'+hc+'" stroke="'+dk(hc,15)+'" stroke-width=".5"/>'+
    '<path d="M20,10 Q17,1 23,8"  fill="'+hc+'" stroke="'+dk(hc,15)+'" stroke-width=".5"/>'+
    '<path d="M28,8  Q27,0 32,6"  fill="'+hc+'" stroke="'+dk(hc,15)+'" stroke-width=".5"/>'+
    '<path d="M36,9  Q38,1 41,8"  fill="'+hc+'" stroke="'+dk(hc,15)+'" stroke-width=".5"/>'+
    '<path d="M43,14 Q48,5 46,14" fill="'+hc+'" stroke="'+dk(hc,15)+'" stroke-width=".5"/>';
}

/* 세일러문 — 세일러복 */
function _sailormoonBody(dir,sk){
  var top='#F8F8F8',skirt='#2A50C8',bow='#E82828',collar='#2A50C8';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="'+top+'"/>'+
      '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="'+top+'"/>'+
      '<ellipse cx="11" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="4" fill="'+top+'"/>'+
      // sailor collar V
      '<path d="M18,33 L30,43 L42,33 L38,33 L30,40 L22,33 Z" fill="'+collar+'" opacity=".85"/>'+
      // red front bow
      '<path d="M27,38 Q30,36 33,38 L32,42 Q30,40 28,42 Z" fill="'+bow+'"/>'+
      '<circle cx="30" cy="38" r="2" fill="'+dk(bow,10)+'"/>'+
      '<rect x="17" y="47" width="26" height="23" rx="3" fill="'+skirt+'"/>'+
      '<path d="M17,47 L43,47 L43,50 L17,50 Z" fill="'+dk(skirt,10)+'"/>'+
      '<path d="M21,50 L20,70 M27,50 L27,70 M33,50 L33,70 M39,50 L38,70" stroke="white" stroke-width=".5" opacity=".35"/>'+
      '<ellipse cx="24" cy="70" rx="5" ry="2.2" fill="#fff" opacity=".9"/>'+
      '<ellipse cx="36" cy="70" rx="5" ry="2.2" fill="#fff" opacity=".9"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+top+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="14" rx="4" fill="'+top+'"/>'+
      '<rect x="16" y="47" width="24" height="23" rx="3" fill="'+skirt+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.2" fill="white" opacity=".9"/>'+
      '<ellipse cx="33" cy="70" rx="5" ry="2.2" fill="white" opacity=".9"/>';
  }
  return '<rect x="13" y="35" width="7" height="12" rx="3.5" fill="#DDD"/>'+
    '<rect x="40" y="35" width="7" height="12" rx="3.5" fill="#DDD"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="4" fill="#DDD"/>'+
    '<rect x="17" y="47" width="26" height="23" rx="3" fill="'+dk(skirt,10)+'"/>'+
    '<ellipse cx="24" cy="70" rx="5" ry="2.2" fill="white" opacity=".8"/>'+
    '<ellipse cx="36" cy="70" rx="5" ry="2.2" fill="white" opacity=".8"/>';
}
function _sailormoonBuns(dir,hc){
  if(dir==='up') return '';
  // 오당고 (두 개의 동그란 번 + 티아라)
  return '<circle cx="17" cy="10" r="6.5" fill="'+hc+'"/>'+
    '<circle cx="43" cy="10" r="6.5" fill="'+hc+'"/>'+
    '<circle cx="17" cy="10" r="5"   fill="'+li(hc,12)+'"/>'+
    '<circle cx="43" cy="10" r="5"   fill="'+li(hc,12)+'"/>'+
    // tiara
    '<path d="M20,14 L30,10 L40,14" stroke="#E8C030" stroke-width="1.8" fill="none" stroke-linecap="round"/>'+
    '<circle cx="30" cy="10" r="2" fill="#E82828"/>'+
    // pigtail hints
    '<path d="M14,16 Q10,24 12,32" stroke="'+hc+'" stroke-width="3.5" stroke-linecap="round" fill="none"/>'+
    '<path d="M46,16 Q50,24 48,32" stroke="'+hc+'" stroke-width="3.5" stroke-linecap="round" fill="none"/>';
}

/* 키리토 — 올블랙 SAO 코트 + 쌍검 */
/* 키리토 — 올블랙 롱코트 + 양허리 쌍검 */
function _kiritoBody(dir,sk){
  var coat='#18181C',inner='#28283A',bl='#4A6878',gu='#7A6010';
  if(dir==='down'){
    // 쌍검: 허리 양옆 — 몸통 바깥에 위치
    return '<rect x="3"  y="30" width="3"   height="36" rx="1.2" fill="'+bl+'"/>'+
      '<rect x="1.2" y="26" width="6.5" height="5"  rx="1"   fill="'+gu+'"/>'+
      '<rect x="54" y="30" width="3"   height="36" rx="1.2" fill="'+bl+'"/>'+
      '<rect x="52.5" y="26" width="6.5" height="5" rx="1"  fill="'+gu+'"/>'+
      // 코트 — 소매 길어서 손목까지
      '<rect x="11" y="33" width="8" height="22" rx="4" fill="'+coat+'"/>'+
      '<rect x="41" y="33" width="8" height="22" rx="4" fill="'+coat+'"/>'+
      '<ellipse cx="15" cy="56" rx="4" ry="3.5" fill="'+sk+'"/>'+
      '<ellipse cx="45" cy="56" rx="4" ry="3.5" fill="'+sk+'"/>'+
      // 코트 몸통 — 긴 코트 (y=33~72)
      '<path d="M18,33 L42,33 L44,72 L16,72 Z" fill="'+coat+'"/>'+
      // 코트 라펠 (V자 칼라)
      '<path d="M24,33 L30,42 L36,33 L34,33 L30,40 L26,33 Z" fill="'+inner+'"/>'+
      // 코트 단추 라인
      '<path d="M30,42 L30,70" stroke="#303048" stroke-width="1" opacity=".6"/>'+
      '<circle cx="30" cy="50" r="1.2" fill="#404055"/>'+
      '<circle cx="30" cy="58" r="1.2" fill="#404055"/>'+
      '<ellipse cx="23" cy="72" rx="5.5" ry="2.2" fill="#080810"/>'+
      '<ellipse cx="37" cy="72" rx="5.5" ry="2.2" fill="#080810"/>';
  }
  if(dir==='left'){
    return '<rect x="7"  y="30" width="3" height="36" rx="1.2" fill="'+bl+'"/>'+
      '<rect x="5.5" y="26" width="6.5" height="5" rx="1" fill="'+gu+'"/>'+
      '<rect x="11" y="33" width="8" height="22" rx="4" fill="'+coat+'"/>'+
      '<ellipse cx="15" cy="56" rx="4" ry="3.5" fill="'+sk+'"/>'+
      '<path d="M18,33 L40,33 L42,72 L17,72 Z" fill="'+coat+'"/>'+
      '<path d="M23,33 L29,41 L35,33 L33,33 L29,39 L25,33 Z" fill="'+inner+'"/>'+
      '<ellipse cx="22" cy="72" rx="5" ry="2.2" fill="#080810"/>'+
      '<ellipse cx="34" cy="72" rx="5" ry="2.2" fill="#080810"/>';
  }
  return '<rect x="4"  y="29" width="3" height="38" rx="1.2" fill="'+dk(bl,10)+'"/>'+
    '<rect x="53" y="29" width="3" height="38" rx="1.2" fill="'+dk(bl,10)+'"/>'+
    '<rect x="11" y="33" width="8" height="22" rx="4" fill="'+dk(coat,5)+'"/>'+
    '<rect x="41" y="33" width="8" height="22" rx="4" fill="'+dk(coat,5)+'"/>'+
    '<path d="M18,33 L42,33 L44,72 L16,72 Z" fill="'+dk(coat,5)+'"/>'+
    '<ellipse cx="23" cy="72" rx="5.5" ry="2.2" fill="#080810"/>'+
    '<ellipse cx="37" cy="72" rx="5.5" ry="2.2" fill="#080810"/>';
}

/* 에렌 — 조사병단 + 녹색 망토(앞/뒤 모두) */
function _erenBody(dir,sk){
  var uniform='#6B5535',shirt='#E8E0D0',cape='#3A7030',belt='#332210',D=dk(uniform,12);
  if(dir==='down'){
    // 앞면: 망토가 어깨에서 내려오는 모습 (좌우 녹색 패널)
    return '<path d="M10,33 Q8,38 9,52 L14,52 L14,33 Z" fill="'+cape+'"/>'+
      '<path d="M50,33 Q52,38 51,52 L46,52 L46,33 Z" fill="'+cape+'"/>'+
      '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+uniform+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+uniform+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+uniform+'"/>'+
      '<path d="M24,33 L30,40 L36,33" fill="'+shirt+'" opacity=".95"/>'+
      '<rect x="17" y="44" width="26" height="4" rx="1.5" fill="'+belt+'"/>'+
      '<rect x="20" y="35" width="6" height="7" rx="1" fill="'+cape+'" opacity=".7"/>'+  // 왼쪽 어깨 망토 단추
      '<rect x="34" y="35" width="6" height="7" rx="1" fill="'+cape+'" opacity=".7"/>'+  // 오른쪽 어깨 망토 단추
      '<rect x="18" y="48" width="11" height="22" rx="3" fill="'+uniform+'"/>'+
      '<rect x="31" y="48" width="11" height="22" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="23" cy="70" rx="5" ry="2.5" fill="#2A1808"/>'+
      '<ellipse cx="37" cy="70" rx="5" ry="2.5" fill="#2A1808"/>';
  }
  if(dir==='left'){
    return '<path d="M9,33 Q7,40 8,54 L13,54 L13,33 Z" fill="'+cape+'"/>'+
      '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+uniform+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+uniform+'"/>'+
      '<rect x="17" y="44" width="23" height="4" rx="1.5" fill="'+belt+'"/>'+
      '<rect x="18" y="48" width="10" height="22" rx="3" fill="'+uniform+'"/>'+
      '<rect x="29" y="48" width="10" height="22" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#2A1808"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#2A1808"/>';
  }
  return '<path d="M8,33 Q4,50 6,66 Q10,71 15,67 L15,33 Z" fill="'+cape+'"/>'+
    '<path d="M52,33 Q56,50 54,66 Q50,71 45,67 L45,33 Z" fill="'+cape+'"/>'+
    '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="18" y="48" width="11" height="22" rx="3" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="31" y="48" width="11" height="22" rx="3" fill="'+dk(D,8)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5" ry="2.5" fill="#2A1808"/>'+
    '<ellipse cx="37" cy="70" rx="5" ry="2.5" fill="#2A1808"/>';
}

/* 레비 — 조사병단 + 크고 선명한 흰 크라바트 */
function _leviBody(dir,sk){
  var uniform='#8C7555',cravat='#F2F0EC',belt='#332210',D=dk(uniform,12);
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+uniform+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+uniform+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+uniform+'"/>'+
      // 크라바트: 폭넓은 흰 스카프가 V자로 크게 펼쳐짐
      '<path d="M22,33 Q30,38 38,33 L36,42 Q30,45 24,42 Z" fill="'+cravat+'"/>'+
      '<path d="M27,42 L30,48 L33,42 Z" fill="'+cravat+'"/>'+
      '<path d="M28,48 Q30,52 32,48 L31.5,54 Q30,56 28.5,54 Z" fill="'+cravat+'"/>'+
      '<rect x="17" y="44" width="26" height="4" rx="1.5" fill="'+belt+'"/>'+
      '<rect x="18" y="48" width="11" height="22" rx="3" fill="'+uniform+'"/>'+
      '<rect x="31" y="48" width="11" height="22" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="23" cy="70" rx="5" ry="2.5" fill="#2A1808"/>'+
      '<ellipse cx="37" cy="70" rx="5" ry="2.5" fill="#2A1808"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+uniform+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+uniform+'"/>'+
      '<path d="M22,33 Q30,38 40,33 L38,42 Q30,45 24,42 Z" fill="'+cravat+'" opacity=".9"/>'+
      '<rect x="17" y="44" width="23" height="4" rx="1.5" fill="'+belt+'"/>'+
      '<rect x="18" y="48" width="10" height="22" rx="3" fill="'+uniform+'"/>'+
      '<rect x="29" y="48" width="10" height="22" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#2A1808"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#2A1808"/>';
  }
  return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="18" y="48" width="11" height="22" rx="3" fill="'+dk(uniform,10)+'"/>'+
    '<rect x="31" y="48" width="11" height="22" rx="3" fill="'+dk(D,8)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5" ry="2.5" fill="#2A1808"/>'+
    '<ellipse cx="37" cy="70" rx="5" ry="2.5" fill="#2A1808"/>';
}

/* 고죠 — 주술회전 검은 교복 + 안대 */
function _gojoBody(dir,sk){
  var c='#151520',D=dk(c,0),acc='#303048';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="16" rx="3.5" fill="'+c+'"/>'+
      '<rect x="40" y="35" width="7" height="16" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="11" cy="51" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="51" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="18" rx="4" fill="'+c+'"/>'+
      '<path d="M25,33 Q30,37 35,33 L34,40 Q30,42 26,40 Z" fill="'+acc+'" opacity=".8"/>'+
      '<rect x="18" y="51" width="11" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="31" y="51" width="11" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#08080F"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#08080F"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="16" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="10" cy="51" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="18" rx="4" fill="'+c+'"/>'+
      '<rect x="18" y="51" width="10" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="29" y="51" width="10" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#08080F"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#08080F"/>';
  }
  return '<rect x="13" y="35" width="7" height="16" rx="3.5" fill="'+dk(c,0)+'"/>'+
    '<rect x="40" y="35" width="7" height="16" rx="3.5" fill="'+dk(c,0)+'"/>'+
    '<rect x="18" y="33" width="24" height="18" rx="4" fill="'+dk(c,0)+'"/>'+
    '<rect x="18" y="51" width="11" height="19" rx="3" fill="'+dk(c,0)+'"/>'+
    '<rect x="31" y="51" width="11" height="19" rx="3" fill="'+dk(c,0)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#08080F"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#08080F"/>';
}
function _gojoBlindfold(dir){
  if(dir==='up') return '';
  return '<rect x="14" y="17" width="32" height="7" rx="3" fill="#F0F0FF"/>'+
    '<rect x="14" y="18" width="32" height="3" rx="1.5" fill="white" opacity=".6"/>';
}

/* 이타도리 — 주술회전 네이비 교복 */
function _itadoriBody(dir,sk){
  var c='#1A2040',D=dk(c,0);
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="15" rx="3.5" fill="'+c+'"/>'+
      '<rect x="40" y="35" width="7" height="15" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="11" cy="50" rx="4.5" ry="4.5" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="50" rx="4.5" ry="4.5" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="18" rx="4" fill="'+c+'"/>'+
      '<path d="M25,33 Q30,37 35,33 L34,40 Q30,43 26,40 Z" fill="'+dk(c,0)+'" opacity=".7"/>'+
      '<rect x="18" y="51" width="11" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="31" y="51" width="11" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#0A0A18"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#0A0A18"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="15" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="10" cy="50" rx="4.5" ry="4.5" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="18" rx="4" fill="'+c+'"/>'+
      '<rect x="18" y="51" width="10" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="29" y="51" width="10" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#0A0A18"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#0A0A18"/>';
  }
  return '<rect x="13" y="35" width="7" height="15" rx="3.5" fill="'+dk(c,0)+'"/>'+
    '<rect x="40" y="35" width="7" height="15" rx="3.5" fill="'+dk(c,0)+'"/>'+
    '<rect x="18" y="33" width="24" height="18" rx="4" fill="'+dk(c,0)+'"/>'+
    '<rect x="18" y="51" width="11" height="19" rx="3" fill="'+dk(c,0)+'"/>'+
    '<rect x="31" y="51" width="11" height="19" rx="3" fill="'+dk(c,0)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#0A0A18"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#0A0A18"/>';
}

/* 데쿠 — 녹색 히어로 슈트 + 토끼귀 */
function _dekuBody(dir,sk){
  var c='#2A5A28',D=dk(c,15),acc='#1A3818',white='#E8F0E8';
  if(dir==='down'){
    return '<rect x="13" y="35" width="7" height="15" rx="3.5" fill="'+c+'"/>'+
      '<rect x="40" y="35" width="7" height="15" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="11" cy="50" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="50" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="17" rx="4" fill="'+c+'"/>'+
      '<path d="M22,33 L22,38 L18,38 Z" fill="'+white+'" opacity=".6"/>'+  // left chest detail
      '<path d="M38,33 L38,38 L42,38 Z" fill="'+white+'" opacity=".6"/>'+  // right chest detail
      '<rect x="16" y="46" width="28" height="5" rx="2" fill="'+acc+'"/>'+  // belt
      '<rect x="17" y="51" width="11" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="32" y="51" width="11" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5.5" ry="2.5" fill="#1A1A1A"/>'+
      '<ellipse cx="38" cy="70" rx="5.5" ry="2.5" fill="#1A1A1A"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="15" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="10" cy="50" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="17" rx="4" fill="'+c+'"/>'+
      '<rect x="16" y="46" width="24" height="5" rx="2" fill="'+acc+'"/>'+
      '<rect x="17" y="51" width="10" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="28" y="51" width="10" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="21" cy="70" rx="5" ry="2.5" fill="#1A1A1A"/>'+
      '<ellipse cx="33" cy="70" rx="5" ry="2.5" fill="#1A1A1A"/>';
  }
  return '<rect x="13" y="35" width="7" height="15" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="15" rx="3.5" fill="'+dk(c,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="17" rx="4" fill="'+dk(c,10)+'"/>'+
    '<rect x="17" y="51" width="11" height="19" rx="3" fill="'+dk(c,10)+'"/>'+
    '<rect x="32" y="51" width="11" height="19" rx="3" fill="'+dk(D,10)+'"/>'+
    '<ellipse cx="22" cy="70" rx="5.5" ry="2.5" fill="#1A1A1A"/>'+
    '<ellipse cx="38" cy="70" rx="5.5" ry="2.5" fill="#1A1A1A"/>';
}
function _dekuEars(dir){
  if(dir==='up') return '';
  var c='#2A5A28';
  return '<rect x="19" y="0" width="5" height="10" rx="2.5" fill="'+c+'"/>'+
    '<rect x="36" y="0" width="5" height="10" rx="2.5" fill="'+c+'"/>'+
    '<rect x="20" y="1" width="3" height="7" rx="1.5" fill="#1A3818"/>';
}

/* 코난 — 파란 학교 정장 + 안경 */
/* 코난 — 파란 재킷+반바지, 동그란 안경, 빨간 나비넥타이 */
function _conanBody(dir,sk){
  var jacket='#2A4A88',D=dk(jacket,15),shorts='#2A4A88',shirt='#F8F8F8',tie='#C02828';
  if(dir==='down'){
    return '<rect x="14" y="35" width="7" height="12" rx="3.5" fill="'+jacket+'"/>'+
      '<rect x="39" y="35" width="7" height="12" rx="3.5" fill="'+jacket+'"/>'+
      '<ellipse cx="12" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="48" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="4" fill="'+jacket+'"/>'+
      '<path d="M24,33 Q30,38 36,33 L35,40 Q30,42 25,40 Z" fill="'+shirt+'"/>'+
      // 나비넥타이 (빨간 가젯)
      '<path d="M26,37 Q28,35 30,37 Q28,39 26,37 Z" fill="'+tie+'"/>'+
      '<path d="M30,37 Q32,35 34,37 Q32,39 30,37 Z" fill="'+tie+'"/>'+
      '<circle cx="30" cy="37" r="1.5" fill="#A01818"/>'+
      // 반바지 (짧게 — y49~59)
      '<rect x="18" y="47" width="11" height="13" rx="3" fill="'+shorts+'"/>'+
      '<rect x="31" y="47" width="11" height="13" rx="3" fill="'+D+'"/>'+
      // 맨 다리 (y60~68)
      '<rect x="19" y="60" width="9" height="10" rx="2.5" fill="'+sk+'"/>'+
      '<rect x="32" y="60" width="9" height="10" rx="2.5" fill="'+sk+'"/>'+
      '<ellipse cx="23" cy="70" rx="5" ry="2.5" fill="#1A1A28"/>'+
      '<ellipse cx="37" cy="70" rx="5" ry="2.5" fill="#1A1A28"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+jacket+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="14" rx="4" fill="'+jacket+'"/>'+
      '<rect x="18" y="47" width="10" height="13" rx="3" fill="'+shorts+'"/>'+
      '<rect x="29" y="47" width="10" height="13" rx="3" fill="'+D+'"/>'+
      '<rect x="19" y="60" width="8" height="10" rx="2.5" fill="'+sk+'"/>'+
      '<rect x="30" y="60" width="8" height="10" rx="2.5" fill="'+sk+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#1A1A28"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#1A1A28"/>';
  }
  return '<rect x="14" y="35" width="7" height="12" rx="3.5" fill="'+dk(jacket,10)+'"/>'+
    '<rect x="39" y="35" width="7" height="12" rx="3.5" fill="'+dk(jacket,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="4" fill="'+dk(jacket,10)+'"/>'+
    '<rect x="18" y="47" width="11" height="13" rx="3" fill="'+dk(shorts,10)+'"/>'+
    '<rect x="31" y="47" width="11" height="13" rx="3" fill="'+dk(D,8)+'"/>'+
    '<rect x="19" y="60" width="9" height="10" rx="2.5" fill="'+dk(sk,12)+'"/>'+
    '<rect x="32" y="60" width="9" height="10" rx="2.5" fill="'+dk(sk,12)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5" ry="2.5" fill="#1A1A28"/>'+
    '<ellipse cx="37" cy="70" rx="5" ry="2.5" fill="#1A1A28"/>';
}
function _conanGlasses(dir){
  if(dir==='up') return '';
  // 작고 동그란 안경 (눈 위치에 맞게 cy=21)
  return '<ellipse cx="24" cy="21" rx="3.5" ry="3" fill="none" stroke="#222" stroke-width="1.3"/>'+
    '<ellipse cx="36" cy="21" rx="3.5" ry="3" fill="none" stroke="#222" stroke-width="1.3"/>'+
    '<path d="M27.5,21 L32.5,21" stroke="#222" stroke-width="1.1"/>'+
    '<path d="M20.5,21 L18,22" stroke="#222" stroke-width="1.1"/>';
}

/* 짱구 — 흰 티셔츠+빨간 짧은 반바지+맨 다리 */
function _shinchanBody(dir,sk){
  var shirt='#F5F5F5',shorts='#E02828',shoe='#1A1A1A',D=dk(shorts,12);
  if(dir==='down'){
    return '<rect x="14" y="35" width="7" height="12" rx="3.5" fill="'+shirt+'"/>'+
      '<rect x="39" y="35" width="7" height="12" rx="3.5" fill="'+shirt+'"/>'+
      '<ellipse cx="12" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="48" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="14" rx="4" fill="'+shirt+'"/>'+
      // 짧은 반바지 (y47~57, 10유닛만)
      '<rect x="17" y="47" width="12" height="11" rx="3" fill="'+shorts+'"/>'+
      '<rect x="31" y="47" width="12" height="11" rx="3" fill="'+D+'"/>'+
      // 맨 다리 (y58~68)
      '<rect x="18" y="58" width="10" height="11" rx="2.5" fill="'+sk+'"/>'+
      '<rect x="32" y="58" width="10" height="11" rx="2.5" fill="'+sk+'"/>'+
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="'+shoe+'"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="'+shoe+'"/>';
  }
  if(dir==='left'){
    return '<rect x="12" y="35" width="7" height="12" rx="3.5" fill="'+shirt+'"/>'+
      '<ellipse cx="10" cy="47" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="14" rx="4" fill="'+shirt+'"/>'+
      '<rect x="17" y="47" width="11" height="11" rx="3" fill="'+shorts+'"/>'+
      '<rect x="29" y="47" width="11" height="11" rx="3" fill="'+D+'"/>'+
      '<rect x="18" y="58" width="9" height="11" rx="2.5" fill="'+sk+'"/>'+
      '<rect x="29" y="58" width="9" height="11" rx="2.5" fill="'+sk+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="'+shoe+'"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="'+shoe+'"/>';
  }
  return '<rect x="14" y="35" width="7" height="12" rx="3.5" fill="#E8E8E8"/>'+
    '<rect x="39" y="35" width="7" height="12" rx="3.5" fill="#E8E8E8"/>'+
    '<rect x="18" y="33" width="24" height="14" rx="4" fill="#E8E8E8"/>'+
    '<rect x="17" y="47" width="12" height="11" rx="3" fill="'+dk(shorts,10)+'"/>'+
    '<rect x="31" y="47" width="12" height="11" rx="3" fill="'+dk(D,8)+'"/>'+
    '<rect x="18" y="58" width="10" height="11" rx="2.5" fill="'+dk(sk,12)+'"/>'+
    '<rect x="32" y="58" width="10" height="11" rx="2.5" fill="'+dk(sk,12)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="'+shoe+'"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="'+shoe+'"/>';
}

/* 이치고 — 검은 사신복 + 대검 참월 */
function _ichigoBody(dir,sk){
  var c='#101018',D=dk(c,0),bl='#506878',gu='#808090';
  if(dir==='down'){
    // zangetsu (large sword) on left side, rendered first
    return '<rect x="2" y="16" width="3" height="44" rx="1.2" fill="'+bl+'"/>'+
      '<rect x="0" y="13" width="7" height="4.5" rx="1" fill="'+gu+'"/>'+
      '<rect x="1" y="9" width="5" height="5" rx="1" fill="#3A2818"/>'+
      '<rect x="13" y="35" width="7" height="16" rx="3.5" fill="'+c+'"/>'+
      '<rect x="40" y="35" width="7" height="16" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="11" cy="51" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="51" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="18" rx="4" fill="'+c+'"/>'+
      '<path d="M26,33 Q30,38 34,33 L33,42 Q30,44 27,42 Z" fill="#1A1A28" opacity=".8"/>'+
      '<rect x="18" y="51" width="11" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="31" y="51" width="11" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#080808"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#080808"/>';
  }
  if(dir==='left'){
    return '<rect x="8" y="16" width="3" height="44" rx="1.2" fill="'+bl+'"/>'+
      '<rect x="6" y="13" width="7" height="4.5" rx="1" fill="'+gu+'"/>'+
      '<rect x="12" y="35" width="7" height="16" rx="3.5" fill="'+c+'"/>'+
      '<ellipse cx="10" cy="51" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="18" rx="4" fill="'+c+'"/>'+
      '<rect x="18" y="51" width="10" height="19" rx="3" fill="'+c+'"/>'+
      '<rect x="29" y="51" width="10" height="19" rx="3" fill="'+D+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#080808"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#080808"/>';
  }
  return '<rect x="4" y="15" width="3" height="46" rx="1.2" fill="'+dk(bl,10)+'"/>'+
    '<rect x="13" y="35" width="7" height="16" rx="3.5" fill="'+dk(c,0)+'"/>'+
    '<rect x="40" y="35" width="7" height="16" rx="3.5" fill="'+dk(c,0)+'"/>'+
    '<rect x="18" y="33" width="24" height="18" rx="4" fill="'+dk(c,0)+'"/>'+
    '<rect x="18" y="51" width="11" height="19" rx="3" fill="'+dk(c,0)+'"/>'+
    '<rect x="31" y="51" width="11" height="19" rx="3" fill="'+dk(c,0)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#080808"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#080808"/>';
}

/* 조로 — 녹색 머리 + 삼도류 + 눈 흉터 */
function _zoroBody(dir,sk){
  var c='#1A2030',shirt='#E8E8E0',belt='#2A2010',bl='#4A6070',gu='#8B6914';
  if(dir==='down'){
    // three swords: left hip (2) + mouth (held by teeth = ignored) → left 2, right 1
    return '<rect x="2"  y="24" width="2.5" height="38" rx=".8" fill="'+bl+'"/>'+
      '<rect x="6"  y="24" width="2.5" height="38" rx=".8" fill="'+bl+'"/>'+
      '<rect x="0.5" y="21" width="5.5" height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="4.5" y="21" width="5.5" height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="55" y="24" width="2.5" height="38" rx=".8" fill="'+bl+'"/>'+
      '<rect x="53.5" y="21" width="5.5" height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+shirt+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+shirt+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+shirt+'"/>'+
      // open shirt detail
      '<path d="M26,33 Q30,40 34,33 L33,48 Q30,49 27,48 Z" fill="'+sk+'" opacity=".5"/>'+
      '<rect x="16" y="44" width="28" height="5" rx="2" fill="'+belt+'"/>'+
      '<rect x="18" y="49" width="11" height="21" rx="3" fill="'+c+'"/>'+
      '<rect x="31" y="49" width="11" height="21" rx="3" fill="'+dk(c,10)+'"/>'+
      '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#0A0A10"/>'+
      '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#0A0A10"/>';
  }
  if(dir==='left'){
    return '<rect x="6"  y="24" width="2.5" height="38" rx=".8" fill="'+bl+'"/>'+
      '<rect x="10" y="24" width="2.5" height="38" rx=".8" fill="'+bl+'"/>'+
      '<rect x="5"  y="21" width="5"   height="3.5" rx=".8" fill="'+gu+'"/>'+
      '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+shirt+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+shirt+'"/>'+
      '<rect x="16" y="44" width="24" height="5" rx="2" fill="'+belt+'"/>'+
      '<rect x="18" y="49" width="10" height="21" rx="3" fill="'+c+'"/>'+
      '<rect x="29" y="49" width="10" height="21" rx="3" fill="'+dk(c,10)+'"/>'+
      '<ellipse cx="22" cy="70" rx="5" ry="2.5" fill="#0A0A10"/>'+
      '<ellipse cx="34" cy="70" rx="5" ry="2.5" fill="#0A0A10"/>';
  }
  return '<rect x="4"  y="23" width="2.5" height="40" rx=".8" fill="'+dk(bl,10)+'"/>'+
    '<rect x="8"  y="23" width="2.5" height="40" rx=".8" fill="'+dk(bl,10)+'"/>'+
    '<rect x="53" y="23" width="2.5" height="40" rx=".8" fill="'+dk(bl,10)+'"/>'+
    '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(shirt,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(shirt,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(shirt,10)+'"/>'+
    '<rect x="18" y="49" width="11" height="21" rx="3" fill="'+dk(c,10)+'"/>'+
    '<rect x="31" y="49" width="11" height="21" rx="3" fill="'+dk(c,15)+'"/>'+
    '<ellipse cx="23" cy="70" rx="5.5" ry="2.5" fill="#0A0A10"/>'+
    '<ellipse cx="37" cy="70" rx="5.5" ry="2.5" fill="#0A0A10"/>';
}
function _zoroScar(dir){
  if(dir!=='down') return '';
  // left eye scar
  return '<path d="M22,17 L26,25" stroke="#C05040" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>'+
    '<path d="M23,17 L27,25" stroke="#C05040" stroke-width=".6" stroke-linecap="round" opacity=".5"/>';
}

/* 아스나 — KoB 백+적 유니폼 + 세검 */
function _asunaBody(dir,sk){
  var top='#D81830',white='#F5F0F0',acc='#A01020',rapier='#C8C8D8',gu2='#E8C030';
  if(dir==='down'){
    return '<rect x="3" y="24" width="2" height="38" rx=".8" fill="'+rapier+'"/>'+
      '<rect x="1.5" y="21" width="5" height="3.5" rx=".8" fill="'+gu2+'"/>'+
      '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+white+'"/>'+
      '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+white+'"/>'+
      '<ellipse cx="11" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<ellipse cx="49" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+white+'"/>'+
      '<rect x="18" y="33" width="4"  height="16" rx="2" fill="'+top+'"/>'+
      '<rect x="38" y="33" width="4"  height="16" rx="2" fill="'+top+'"/>'+
      '<path d="M22,33 Q30,37 38,33 L37,40 Q30,42 23,40 Z" fill="'+top+'" opacity=".7"/>'+
      '<path d="M15,49 L45,49 L43,70 L17,70 Z" fill="'+white+'"/>'+
      '<path d="M15,49 L17,70 M19,49 L20,70 M25,49 L25,70 M31,49 L30,70 M37,49 L36,70 M43,49 L42,70" stroke="'+acc+'" stroke-width=".7" opacity=".3"/>'+
      '<path d="M15,49 L17,54 Q30,57 43,54 L45,49" fill="'+top+'" opacity=".5"/>';
  }
  if(dir==='left'){
    return '<rect x="7" y="24" width="2" height="38" rx=".8" fill="'+rapier+'"/>'+
      '<rect x="5.5" y="21" width="5" height="3.5" rx=".8" fill="'+gu2+'"/>'+
      '<rect x="12" y="35" width="7" height="14" rx="3.5" fill="'+white+'"/>'+
      '<ellipse cx="10" cy="49" rx="4" ry="4" fill="'+sk+'"/>'+
      '<rect x="18" y="33" width="22" height="16" rx="4" fill="'+white+'"/>'+
      '<rect x="18" y="33" width="4"  height="16" rx="2" fill="'+top+'"/>'+
      '<path d="M14,49 L40,49 L38,70 L16,70 Z" fill="'+white+'"/>'+
      '<path d="M14,49 L16,54 Q27,57 40,54 L40,49" fill="'+top+'" opacity=".5"/>';
  }
  return '<rect x="13" y="35" width="7" height="14" rx="3.5" fill="'+dk(white,10)+'"/>'+
    '<rect x="40" y="35" width="7" height="14" rx="3.5" fill="'+dk(white,10)+'"/>'+
    '<rect x="18" y="33" width="24" height="16" rx="4" fill="'+dk(white,10)+'"/>'+
    '<path d="M15,49 L45,49 L43,70 L17,70 Z" fill="'+dk(white,10)+'"/>'+
    '<path d="M15,49 L17,54 Q30,57 43,54 L45,49" fill="'+dk(top,10)+'" opacity=".5"/>';
}

/* 애니 캐릭터 메인 */
function _animeChar(preset,dir,id){
  var skin,hc,hs,body,extra,face,neck,hBack,hFront;
  switch(preset){
    /* ── 귀멸의 칼날 ── */
    case 'tanjiro':
      skin='#FEE5C5'; hc='#4B2C2F'; hs='short';
      body=_tanjiroBody(dir,skin,id); extra=_tanjiroScar(dir); break;
    case 'nezuko':
      skin='#FBE8D7'; hc='#31302B'; hs='long';
      body=_nezukoBody(dir,skin); extra=_bambooMuzzle(dir); break;
    case 'inosuke':
      skin='#F0D5A8'; hc='#CE9E73'; hs='medium';
      body=_inosukeBody(dir,skin); extra=''; break;
    case 'zenitsu':
      skin='#F1D4B2'; hc='#F3DC76'; hs='medium';
      body=_zenitsuBody(dir,skin,id); extra=''; break;
    /* ── 하이큐 / 원피스 ── */
    case 'hinata':
      skin='#F1D4B2'; hc='#F27F34'; hs='short';
      body=_hinataBody(dir,skin); extra=_hinataSpikes(dir,'#F27F34'); break;
    case 'luffy':
      skin='#DFC18A'; hc='#2E333F'; hs='short';
      body=_luffyBody(dir,skin); extra=_strawHat(dir); break;
    /* ── 디즈니 ── */
    case 'elsa':
      skin='#F5F2F8'; hc='#D8DEFF'; hs='long';
      body=_elsaBody(dir,skin); extra=_elsaBraid(dir); break;
    case 'moana':
      skin='#8B5E3C'; hc='#1A1010'; hs='long';
      body=_moanaBody(dir,skin); extra=_moanaFlower(dir); break;
    case 'snowwhite':
      skin='#FDE8D8'; hc='#120808'; hs='short';
      body=_snowwhiteBody(dir,skin); extra=_snowwhiteRibbon(dir); break;
    case 'rapunzel':
      skin='#FDE8D0'; hc='#F5C820'; hs='long';
      body=_rapunzelBody(dir,skin); extra=''; break;
    case 'cinderella':
      skin='#FDE8D0'; hc='#F0E080'; hs='medium';
      body=_cinderellaBody(dir,skin); extra=_cinderellaTiara(dir); break;
    case 'mulan':
      skin='#F0D8C0'; hc='#120808'; hs='medium';
      body=_mulanBody(dir,skin); extra=_mulanHairpin(dir); break;
    /* ── 나루토 / 드래곤볼 ── */
    case 'naruto':
      skin='#F5D5A0'; hc='#F0D030'; hs='short';
      body=_narutoBody(dir,skin); extra=_narutoExtras(dir); break;
    case 'goku':
      skin='#F5D5A0'; hc='#181818'; hs='short';
      body=_gokuBody(dir,skin); extra=_gokuSpikes(dir,'#181818'); break;
    /* ── 세일러문 ── */
    case 'sailormoon':
      skin='#FDE8D0'; hc='#F5E060'; hs='long';
      body=_sailormoonBody(dir,skin); extra=_sailormoonBuns(dir,'#F5E060'); break;
    /* ── SAO ── */
    case 'kirito':
      skin='#F0D5B5'; hc='#181818'; hs='short';
      body=_kiritoBody(dir,skin); extra=''; break;
    /* ── 진격의 거인 ── */
    case 'eren':
      skin='#F0D5B5'; hc='#3A2818'; hs='short';
      body=_erenBody(dir,skin); extra=''; break;
    case 'levi':
      skin='#F0D5B5'; hc='#181818'; hs='short';
      body=_leviBody(dir,skin); extra=''; break;
    /* ── 주술회전 ── */
    case 'gojo':
      skin='#F0D0C0'; hc='#E8EAFF'; hs='medium';
      body=_gojoBody(dir,skin); extra=_gojoBlindfold(dir); break;
    case 'itadori':
      skin='#F0D5B5'; hc='#C06878'; hs='short';
      body=_itadoriBody(dir,skin); extra=''; break;
    /* ── 나의 히어로 아카데미아 ── */
    case 'deku':
      skin='#F0D5B5'; hc='#2A5A20'; hs='short';
      body=_dekuBody(dir,skin); extra=_dekuEars(dir); break;
    /* ── 명탐정 코난 ── */
    case 'conan':
      skin='#F5E5C5'; hc='#181818'; hs='short';
      body=_conanBody(dir,skin); extra=_conanGlasses(dir); break;
    /* ── 짱구는 못말려 ── */
    case 'shinchan':
      skin='#F5E5A0'; hc='#181818'; hs='short';
      body=_shinchanBody(dir,skin); extra=''; break;
    /* ── 블리치 ── */
    case 'ichigo':
      skin='#F5D5B0'; hc='#E07820'; hs='short';
      body=_ichigoBody(dir,skin); extra=''; break;
    /* ── 원피스 ── */
    case 'zoro':
      skin='#F0D5B5'; hc='#2A7030'; hs='short';
      body=_zoroBody(dir,skin); extra=_zoroScar(dir); break;
    /* ── SAO ── */
    default: /* asuna */
      skin='#F5E5D0'; hc='#C87840'; hs='long';
      body=_asunaBody(dir,skin); extra=''; break;
  }
  var defs=_defs(id,skin,hc);
  var shadow='<ellipse cx="30" cy="73" rx="14" ry="3.5" fill="#00000018"/>';
  hBack=_hairBack(id,dir,hc,hs);
  var noHairFront=(preset==='inosuke'||preset==='sailormoon');
  hFront=noHairFront?'':_hairFront(id,dir,hc,hs);
  face=(preset==='inosuke')?_boarMask(dir):_face(id,dir,skin,hc);
  neck=_neck(dir,skin);
  if(dir==='up') return defs+shadow+body+neck+hBack+hFront+extra;
  return defs+shadow+body+hBack+face+neck+hFront+extra;
}

/* ---- 메인 렌더 ---- */
function renderCharacterSVG(state) {
  var id='_r'+(++_rc);
  if(state.type==='anime') return _animeChar(state.preset||'luffy', state.dir||'down', id);
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
  var face  =_face(id,dir,skin,hc,state.eye);
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
