/* =====================================================================
   쌤버스 - 캐릭터 렌더링 공용 모듈
   ssambus_characters.html 에서 만든 커스터마이징 데이터(ST)와
   각 맵 페이지의 PLAYER, 원격 학생(presence) 캐릭터를
   동일한 방식으로 그리기 위한 공용 함수 모음.

   state 형식: { type:'student'|'teacher'|'fantasy', skin, hcolor, hair,
                 ccolor, cloth, gender, acc:[], dir }
   ===================================================================== */

var li=function(h,a){var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return 'rgb('+Math.min(255,r+a)+','+Math.min(255,g+a)+','+Math.min(255,b+a)+')';};
var dk=function(h,a){var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return 'rgb('+Math.max(0,r-a)+','+Math.max(0,g-a)+','+Math.max(0,b-a)+')';};

function drawHair(dir,hc,hs){
  var d=dk(hc,35);
  if(dir==='down'){
    if(hs==='buzz')return '<rect x="10" y="3" width="12" height="4" rx="2" fill="'+hc+'"/><rect x="9" y="5" width="2" height="2" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="2" rx="1" fill="'+hc+'"/>';
    if(hs==='short')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="4" rx="1" fill="'+hc+'"/>';
    if(hs==='parted')return '<rect x="10" y="3" width="12" height="7" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="5" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="5" rx="1" fill="'+hc+'"/><rect x="10" y="8" width="5" height="3" rx="1" fill="'+hc+'"/><rect x="17" y="6" width="5" height="2" rx="1" fill="'+hc+'"/><line x1="15" y1="3" x2="13" y2="8" stroke="'+d+'" stroke-width="1.2"/>';
    if(hs==='slickback')return '<rect x="10" y="3" width="12" height="5" rx="2" fill="'+hc+'"/><rect x="9" y="4" width="14" height="2.5" rx="1" fill="'+d+'"/><rect x="9" y="5" width="2" height="3" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="3" rx="1" fill="'+hc+'"/>';
    if(hs==='bob')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="6" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="6" rx="1" fill="'+hc+'"/><rect x="10" y="8" width="12" height="3" rx="1" fill="'+hc+'"/>';
    if(hs==='medium')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="8" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="8" rx="1" fill="'+hc+'"/><rect x="10" y="8" width="12" height="5" rx="1" fill="'+hc+'"/>';
    if(hs==='long')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="13" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="13" rx="1" fill="'+hc+'"/><rect x="10" y="8" width="12" height="10" rx="1" fill="'+hc+'"/>';
    if(hs==='wavy')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="13" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="13" rx="1" fill="'+hc+'"/><rect x="10" y="8" width="12" height="10" rx="1" fill="'+hc+'"/><path d="M9 12 Q11 10 13 12 Q15 14 17 12 Q19 10 21 12 Q23 14 23 14" stroke="'+d+'" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M9 15 Q11 13 13 15 Q15 17 17 15 Q19 13 21 15 Q23 17 23 17" stroke="'+d+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    if(hs==='twintail')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><rect x="8" y="8" width="3" height="11" rx="1.5" fill="'+hc+'"/><rect x="21" y="8" width="3" height="11" rx="1.5" fill="'+hc+'"/>';
    if(hs==='ponytail')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><rect x="14" y="2" width="4" height="13" rx="2" fill="'+hc+'"/>';
    if(hs==='bun')return '<rect x="10" y="3" width="12" height="6" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="4" rx="1" fill="'+hc+'"/><circle cx="16" cy="3" r="3" fill="'+hc+'"/><circle cx="16" cy="3" r="1.5" fill="'+d+'"/>';
  }
  if(dir==='up'){
    var b='<rect x="10" y="3" width="12" height="9" rx="3" fill="'+hc+'"/><rect x="9" y="5" width="2" height="6" rx="1" fill="'+hc+'"/><rect x="21" y="5" width="2" height="6" rx="1" fill="'+hc+'"/>';
    if(hs==='buzz'||hs==='short'||hs==='parted'||hs==='slickback')return b;
    if(hs==='bob')return b+'<rect x="9" y="10" width="2" height="3" rx="1" fill="'+hc+'"/><rect x="21" y="10" width="2" height="3" rx="1" fill="'+hc+'"/><rect x="11" y="11" width="10" height="2" rx="1" fill="'+hc+'"/>';
    if(hs==='medium')return b+'<rect x="9" y="10" width="2" height="5" rx="1" fill="'+hc+'"/><rect x="21" y="10" width="2" height="5" rx="1" fill="'+hc+'"/><rect x="11" y="11" width="10" height="4" rx="1" fill="'+hc+'"/>';
    if(hs==='long'||hs==='wavy')return b+'<rect x="9" y="10" width="2" height="9" rx="1" fill="'+hc+'"/><rect x="21" y="10" width="2" height="9" rx="1" fill="'+hc+'"/><rect x="11" y="11" width="10" height="7" rx="1" fill="'+hc+'"/>';
    if(hs==='twintail')return b+'<rect x="8" y="10" width="3" height="10" rx="1.5" fill="'+hc+'"/><rect x="21" y="10" width="3" height="10" rx="1.5" fill="'+hc+'"/>';
    if(hs==='ponytail')return b+'<rect x="15" y="11" width="2" height="10" rx="1" fill="'+hc+'"/>';
    if(hs==='bun')return b+'<circle cx="16" cy="3" r="3" fill="'+hc+'"/><circle cx="16" cy="3" r="1.5" fill="'+d+'"/>';
    return b;
  }
  if(dir==='left'){
    if(hs==='buzz')return '<rect x="12" y="3" width="10" height="4" rx="2" fill="'+hc+'"/>';
    if(hs==='short')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="2" height="4" rx="1" fill="'+hc+'"/>';
    if(hs==='parted')return '<rect x="11" y="3" width="11" height="7" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="2" height="5" rx="1" fill="'+hc+'"/><rect x="11" y="8" width="5" height="3" rx="1" fill="'+hc+'"/>';
    if(hs==='slickback')return '<rect x="11" y="3" width="11" height="5" rx="2" fill="'+hc+'"/><rect x="11" y="4" width="11" height="2.5" rx="1" fill="'+d+'"/>';
    if(hs==='bob')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="2" height="5" rx="1" fill="'+hc+'"/><rect x="12" y="8" width="10" height="3" rx="1" fill="'+hc+'"/>';
    if(hs==='medium')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="2" height="8" rx="1" fill="'+hc+'"/><rect x="12" y="8" width="10" height="5" rx="1" fill="'+hc+'"/>';
    if(hs==='long'||hs==='wavy')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="2" height="12" rx="1" fill="'+hc+'"/><rect x="12" y="8" width="10" height="9" rx="1" fill="'+hc+'"/>';
    if(hs==='twintail')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="3" height="11" rx="1.5" fill="'+hc+'"/>';
    if(hs==='ponytail')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><rect x="21" y="5" width="2" height="11" rx="1" fill="'+hc+'"/>';
    if(hs==='bun')return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/><circle cx="11" cy="4" r="3" fill="'+hc+'"/><circle cx="11" cy="4" r="1.5" fill="'+d+'"/>';
    return '<rect x="11" y="3" width="11" height="6" rx="3" fill="'+hc+'"/>';
  }
  return '';
}
function drawFace(dir,sk,sd){
  if(dir==='down')return '<rect x="11" y="6" width="10" height="9" rx="3" fill="'+sk+'"/><circle cx="14" cy="10" r="0.9" fill="'+sd+'"/><circle cx="18" cy="10" r="0.9" fill="'+sd+'"/><path d="M14 13 Q16 14.5 18 13" stroke="'+sd+'" stroke-width="0.7" fill="none" stroke-linecap="round"/>';
  if(dir==='up')return '<rect x="11" y="6" width="10" height="7" rx="3" fill="'+dk(sk,20)+'"/>';
  if(dir==='left')return '<rect x="13" y="6" width="8" height="9" rx="3" fill="'+sk+'"/><circle cx="19" cy="10" r="0.9" fill="'+sd+'"/><path d="M17 13 Q19 14 20 12.5" stroke="'+sd+'" stroke-width="0.7" fill="none" stroke-linecap="round"/>';
  return '';
}
function drawNeck(dir,sk){
  if(dir==='down')return '<rect x="14" y="14" width="4" height="3" rx="1" fill="'+sk+'"/>';
  if(dir==='left')return '<rect x="15" y="14" width="3" height="3" rx="1" fill="'+sk+'"/>';
  if(dir==='up')return '<rect x="14" y="14" width="4" height="3" rx="1" fill="'+dk(sk,20)+'"/>';
  return '';
}
function drawStudentBody(dir,cc,sk,gender){
  var L=li(cc,50),D=dk(cc,20),t='';
  if(dir==='down'){
    t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+cc+'"/><rect x="11" y="17" width="10" height="2" fill="'+L+'"/><rect x="14" y="17" width="4" height="5" fill="white" opacity="0.2"/><rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(gender==='female'){t+='<rect x="11" y="29" width="10" height="8" rx="1" fill="'+L+'"/><rect x="13" y="37" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="37" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="12" y="41" width="4" height="2" rx="1" fill="#111"/><rect x="16" y="41" width="4" height="2" rx="1" fill="#111"/>';}
    else{t+='<rect x="11" y="29" width="4" height="11" rx="1.5" fill="'+D+'"/><rect x="17" y="29" width="4" height="11" rx="1.5" fill="'+D+'"/><rect x="10" y="39" width="5" height="3" rx="1.5" fill="#111"/><rect x="17" y="39" width="5" height="3" rx="1.5" fill="#111"/>';}
  } else if(dir==='left'){
    t='<rect x="11" y="17" width="11" height="12" rx="2" fill="'+cc+'"/><rect x="12" y="17" width="9" height="2" fill="'+L+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(gender==='female'){t+='<rect x="12" y="29" width="9" height="8" rx="1" fill="'+L+'"/><rect x="15" y="37" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="15" y="41" width="4" height="2" rx="1" fill="#111"/>';}
    else{t+='<rect x="12" y="29" width="4" height="11" rx="1.5" fill="'+D+'"/><rect x="17" y="29" width="4" height="11" rx="1.5" fill="'+D+'"/><rect x="11" y="39" width="6" height="3" rx="1.5" fill="#111"/>';}
  } else {
    t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+D+'"/><rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+D+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+D+'"/><rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(gender==='female'){t+='<rect x="11" y="29" width="10" height="8" rx="1" fill="'+dk(L,10)+'"/><rect x="13" y="37" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="37" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="12" y="41" width="4" height="2" rx="1" fill="#111"/><rect x="16" y="41" width="4" height="2" rx="1" fill="#111"/>';}
    else{t+='<rect x="11" y="29" width="4" height="11" rx="1.5" fill="'+dk(D,10)+'"/><rect x="17" y="29" width="4" height="11" rx="1.5" fill="'+dk(D,10)+'"/><rect x="10" y="39" width="5" height="3" rx="1.5" fill="#111"/><rect x="17" y="39" width="5" height="3" rx="1.5" fill="#111"/>';}
  }
  return t;
}
function drawTeacherBody(dir,cl,cc,sk,gender){
  var L=li(cc,50),D=dk(cc,20),t='';
  if(dir==='down'){
    t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+cc+'"/>';
    if(cl==='suit'){t+='<rect x="10" y="17" width="5" height="12" rx="1" fill="'+L+'"/><rect x="17" y="17" width="5" height="12" rx="1" fill="'+L+'"/><rect x="13" y="17" width="6" height="12" fill="#FDFEFE"/>';}
    else if(cl==='hoodie'){t+='<rect x="13" y="17" width="6" height="5" rx="3" fill="'+L+'"/><rect x="11" y="21" width="10" height="3" rx="1" fill="'+D+'"/>';}
    else if(cl==='cardigan'){t+='<rect x="10" y="17" width="3" height="12" fill="'+D+'"/><rect x="19" y="17" width="3" height="12" fill="'+D+'"/><rect x="13" y="17" width="6" height="12" fill="'+L+'"/><circle cx="16" cy="20" r="0.7" fill="'+D+'"/><circle cx="16" cy="23" r="0.7" fill="'+D+'"/><circle cx="16" cy="26" r="0.7" fill="'+D+'"/>';}
    else if(cl==='vest'){t+='<rect x="13" y="17" width="6" height="12" fill="#FDFEFE"/><rect x="10" y="17" width="3" height="12" fill="'+D+'"/><rect x="19" y="17" width="3" height="12" fill="'+D+'"/>';}
    else if(cl==='shirt'){t+='<rect x="14" y="17" width="4" height="12" fill="'+L+'"/><rect x="13" y="17" width="2" height="4" rx="1" fill="'+L+'"/><rect x="17" y="17" width="2" height="4" rx="1" fill="'+L+'"/><circle cx="15.5" cy="19" r="0.6" fill="'+D+'"/><circle cx="15.5" cy="21.5" r="0.6" fill="'+D+'"/><circle cx="15.5" cy="24" r="0.6" fill="'+D+'"/>';}
    else if(cl==='sport'){t+='<rect x="10" y="17" width="12" height="2.5" rx="1" fill="'+L+'"/><line x1="16" y1="17" x2="16" y2="29" stroke="'+L+'" stroke-width="1.2"/><rect x="10" y="25" width="12" height="1" fill="'+L+'"/>';}
    if(cl!=='vest'){t+='<rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';}
    else{t+='<rect x="8" y="18" width="3" height="9" rx="1.5" fill="white"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="white"/>';}
    t+='<rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(gender==='female'){t+='<rect x="11" y="29" width="10" height="7" rx="1" fill="'+L+'"/><rect x="13" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="12" y="41" width="4" height="2" rx="1" fill="#222"/><rect x="16" y="41" width="4" height="2" rx="1" fill="#222"/>';}
    else{t+='<rect x="11" y="29" width="4" height="11" rx="1.5" fill="#2a2a2a"/><rect x="17" y="29" width="4" height="11" rx="1.5" fill="#2a2a2a"/><rect x="10" y="39" width="5" height="3" rx="1.5" fill="#111"/><rect x="17" y="39" width="5" height="3" rx="1.5" fill="#111"/>';}
  } else if(dir==='left'){
    t='<rect x="11" y="17" width="11" height="12" rx="2" fill="'+cc+'"/>';
    if(cl==='suit'||cl==='vest')t+='<rect x="15" y="17" width="5" height="12" fill="#FDFEFE"/>';
    else if(cl==='cardigan')t+='<rect x="15" y="17" width="6" height="12" fill="'+L+'"/><circle cx="18" cy="20" r="0.7" fill="'+D+'"/><circle cx="18" cy="23" r="0.7" fill="'+D+'"/>';
    else if(cl==='shirt')t+='<rect x="16" y="17" width="4" height="12" fill="'+L+'"/><circle cx="17.5" cy="20" r="0.6" fill="'+D+'"/><circle cx="17.5" cy="23" r="0.6" fill="'+D+'"/>';
    else if(cl==='hoodie')t+='<rect x="15" y="17" width="5" height="4" rx="2" fill="'+L+'"/>';
    else if(cl==='sport')t+='<line x1="16" y1="17" x2="16" y2="29" stroke="'+L+'" stroke-width="1.2"/>';
    t+='<rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(gender==='female'){t+='<rect x="12" y="29" width="9" height="7" rx="1" fill="'+L+'"/><rect x="15" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="15" y="41" width="4" height="2" rx="1" fill="#222"/>';}
    else{t+='<rect x="12" y="29" width="4" height="11" rx="1.5" fill="#2a2a2a"/><rect x="17" y="29" width="4" height="11" rx="1.5" fill="#2a2a2a"/><rect x="11" y="39" width="6" height="3" rx="1.5" fill="#111"/>';}
  } else {
    t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+D+'"/><rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+D+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+D+'"/><rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(gender==='female'){t+='<rect x="11" y="29" width="10" height="7" rx="1" fill="'+dk(L,10)+'"/><rect x="13" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="12" y="41" width="4" height="2" rx="1" fill="#222"/><rect x="16" y="41" width="4" height="2" rx="1" fill="#222"/>';}
    else{t+='<rect x="11" y="29" width="4" height="11" rx="1.5" fill="'+dk(D,10)+'"/><rect x="17" y="29" width="4" height="11" rx="1.5" fill="'+dk(D,10)+'"/><rect x="10" y="39" width="5" height="3" rx="1.5" fill="#111"/><rect x="17" y="39" width="5" height="3" rx="1.5" fill="#111"/>';}
  }
  return t;
}
function drawFantasyBody(dir,cl,cc,sk,gender){
  var L=li(cc,50),D=dk(cc,20),t='';
  if(dir==='down'){
    t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+cc+'"/>';
    if(cl==='mage'){
      t+='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+cc+'"/>';
      t+='<polygon points="16,18 16.7,20.2 19,20.2 17.2,21.4 17.9,23.6 16,22.4 14.1,23.6 14.8,21.4 13,20.2 15.3,20.2" fill="'+L+'" opacity="0.9"/>';
      t+='<rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';
      t+='<rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
      t+='<rect x="10" y="29" width="12" height="10" rx="2" fill="'+cc+'"/><rect x="11" y="29" width="10" height="2" fill="'+L+'" opacity="0.5"/>';
      t+='<rect x="13" y="39" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="39" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/>';
      t+='<rect x="12" y="43" width="4" height="2" rx="1" fill="#222"/><rect x="16" y="43" width="4" height="2" rx="1" fill="#222"/>';
    } else if(cl==='knight'){
      t='<rect x="10" y="17" width="12" height="12" rx="1" fill="'+cc+'"/>';
      t+='<rect x="11" y="18" width="10" height="10" rx="1" fill="'+L+'"/>';
      t+='<rect x="13" y="19" width="6" height="8" rx="1" fill="'+cc+'"/>';
      t+='<line x1="16" y1="19" x2="16" y2="27" stroke="'+L+'" stroke-width="0.8"/>';
      t+='<line x1="13" y1="23" x2="19" y2="23" stroke="'+L+'" stroke-width="0.6"/>';
      t+='<rect x="7" y="17" width="4" height="6" rx="1" fill="'+L+'"/><rect x="21" y="17" width="4" height="6" rx="1" fill="'+L+'"/>';
      t+='<rect x="8" y="23" width="3" height="5" rx="1" fill="'+cc+'"/><rect x="21" y="23" width="3" height="5" rx="1" fill="'+cc+'"/>';
      t+='<rect x="9" y="27" width="5" height="2" rx="1" fill="'+L+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+L+'"/>';
      if(gender==='female'){
        t+='<rect x="11" y="29" width="10" height="8" rx="1" fill="'+D+'"/>';
        t+='<rect x="11" y="29" width="10" height="2" fill="'+L+'" opacity="0.6"/>';
        t+='<rect x="13" y="37" width="3" height="6" rx="1" fill="'+L+'"/><rect x="16" y="37" width="3" height="6" rx="1" fill="'+L+'"/>';
        t+='<rect x="12" y="42" width="4" height="2" rx="1" fill="#333"/><rect x="16" y="42" width="4" height="2" rx="1" fill="#333"/>';
      } else {
        t+='<rect x="11" y="29" width="4" height="12" rx="1" fill="'+D+'"/><rect x="17" y="29" width="4" height="12" rx="1" fill="'+D+'"/>';
        t+='<rect x="11" y="29" width="4" height="2" fill="'+L+'" opacity="0.5"/><rect x="17" y="29" width="4" height="2" fill="'+L+'" opacity="0.5"/>';
        t+='<rect x="10" y="40" width="6" height="3" rx="1" fill="'+L+'"/><rect x="17" y="40" width="5" height="3" rx="1" fill="'+L+'"/>';
      }
    } else if(cl==='archer'){
      t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+cc+'"/>';
      t+='<rect x="14" y="17" width="4" height="12" fill="'+L+'" opacity="0.4"/>';
      t+='<line x1="10" y1="17" x2="22" y2="29" stroke="'+D+'" stroke-width="1.2"/>';
      t+='<rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';
      t+='<rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
      if(gender==='female'){
        t+='<rect x="11" y="29" width="10" height="7" rx="1" fill="'+D+'"/>';
        t+='<rect x="13" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/>';
        t+='<rect x="12" y="41" width="4" height="2" rx="1" fill="#333"/><rect x="16" y="41" width="4" height="2" rx="1" fill="#333"/>';
      } else {
        t+='<rect x="11" y="29" width="4" height="12" rx="1.5" fill="'+D+'"/><rect x="17" y="29" width="4" height="12" rx="1.5" fill="'+D+'"/>';
        t+='<rect x="10" y="40" width="6" height="3" rx="1.5" fill="#333"/><rect x="17" y="40" width="5" height="3" rx="1.5" fill="#333"/>';
      }
    } else if(cl==='healer'){
      t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+cc+'"/>';
      t+='<rect x="15" y="18.5" width="2" height="6" rx="0.5" fill="white" opacity="0.9"/>';
      t+='<rect x="13" y="20.5" width="6" height="2" rx="0.5" fill="white" opacity="0.9"/>';
      t+='<rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';
      t+='<rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
      t+='<rect x="10" y="29" width="12" height="10" rx="2" fill="'+cc+'"/>';
      t+='<rect x="13" y="39" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="39" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/>';
      t+='<rect x="12" y="43" width="4" height="2" rx="1" fill="#222"/><rect x="16" y="43" width="4" height="2" rx="1" fill="#222"/>';
    }
  } else if(dir==='left'){
    if(cl==='mage'){
      t='<rect x="11" y="17" width="11" height="12" rx="2" fill="'+cc+'"/>';
      t+='<polygon points="18,19 18.5,21 20.5,21 19,22 19.5,24 18,23 16.5,24 17,22 15.5,21 17.5,21" fill="'+L+'" opacity="0.9" transform="scale(0.7) translate(8,6)"/>';
      t+='<rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';
      t+='<rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
      t+='<rect x="12" y="29" width="10" height="10" rx="2" fill="'+cc+'"/>';
      t+='<rect x="15" y="39" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/>';
      t+='<rect x="14" y="43" width="4" height="2" rx="1" fill="#222"/>';
    } else if(cl==='knight'){
      t='<rect x="11" y="17" width="11" height="12" rx="1" fill="'+cc+'"/>';
      t+='<rect x="13" y="18" width="8" height="10" rx="1" fill="'+L+'"/>';
      t+='<rect x="15" y="19" width="5" height="8" rx="1" fill="'+cc+'"/>';
      t+='<rect x="21" y="17" width="4" height="6" rx="1" fill="'+L+'"/>';
      t+='<rect x="21" y="23" width="3" height="5" rx="1" fill="'+cc+'"/>';
      t+='<rect x="18" y="27" width="5" height="2" rx="1" fill="'+L+'"/>';
      if(gender==='female'){
        t+='<rect x="12" y="29" width="9" height="8" rx="1" fill="'+D+'"/>';
        t+='<rect x="15" y="37" width="3" height="6" rx="1" fill="'+L+'"/>';
        t+='<rect x="14" y="42" width="4" height="2" rx="1" fill="#333"/>';
      } else {
        t+='<rect x="12" y="29" width="4" height="12" rx="1" fill="'+D+'"/><rect x="17" y="29" width="4" height="12" rx="1" fill="'+D+'"/>';
        t+='<rect x="11" y="40" width="6" height="3" rx="1" fill="'+L+'"/>';
      }
    } else if(cl==='archer'){
      t='<rect x="11" y="17" width="11" height="12" rx="2" fill="'+cc+'"/>';
      t+='<line x1="11" y1="17" x2="22" y2="29" stroke="'+D+'" stroke-width="1.2"/>';
      t+='<rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';
      t+='<rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
      if(gender==='female'){
        t+='<rect x="12" y="29" width="9" height="7" rx="1" fill="'+D+'"/>';
        t+='<rect x="15" y="36" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/>';
        t+='<rect x="14" y="41" width="4" height="2" rx="1" fill="#333"/>';
      } else {
        t+='<rect x="12" y="29" width="4" height="12" rx="1.5" fill="'+D+'"/><rect x="17" y="29" width="4" height="12" rx="1.5" fill="'+D+'"/>';
        t+='<rect x="11" y="40" width="6" height="3" rx="1.5" fill="#333"/>';
      }
    } else if(cl==='healer'){
      t='<rect x="11" y="17" width="11" height="12" rx="2" fill="'+cc+'"/>';
      t+='<rect x="17" y="18.5" width="2" height="6" rx="0.5" fill="white" opacity="0.9"/>';
      t+='<rect x="15" y="20.5" width="6" height="2" rx="0.5" fill="white" opacity="0.9"/>';
      t+='<rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+cc+'"/>';
      t+='<rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
      t+='<rect x="12" y="29" width="10" height="10" rx="2" fill="'+cc+'"/>';
      t+='<rect x="15" y="39" width="3" height="5" rx="1.5" fill="'+dk(sk,10)+'"/>';
      t+='<rect x="14" y="43" width="4" height="2" rx="1" fill="#222"/>';
    }
  } else {
    var bd=dk(cc,15);
    t='<rect x="10" y="17" width="12" height="12" rx="2" fill="'+bd+'"/><rect x="8" y="18" width="3" height="9" rx="1.5" fill="'+bd+'"/><rect x="21" y="18" width="3" height="9" rx="1.5" fill="'+bd+'"/>';
    t+='<rect x="9" y="27" width="5" height="2" rx="1" fill="'+sk+'"/><rect x="18" y="27" width="5" height="2" rx="1" fill="'+sk+'"/>';
    if(cl==='knight'){
      t+='<rect x="7" y="17" width="4" height="5" rx="1" fill="'+dk(L,10)+'"/><rect x="21" y="17" width="4" height="5" rx="1" fill="'+dk(L,10)+'"/>';
    }
    if(gender==='female'){
      t+='<rect x="11" y="29" width="10" height="9" rx="2" fill="'+dk(bd,10)+'"/>';
      t+='<rect x="13" y="38" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/><rect x="16" y="38" width="3" height="6" rx="1.5" fill="'+dk(sk,10)+'"/>';
      t+='<rect x="12" y="43" width="4" height="2" rx="1" fill="#222"/><rect x="16" y="43" width="4" height="2" rx="1" fill="#222"/>';
    } else {
      t+='<rect x="11" y="29" width="4" height="12" rx="1.5" fill="'+dk(bd,10)+'"/><rect x="17" y="29" width="4" height="12" rx="1.5" fill="'+dk(bd,10)+'"/>';
      t+='<rect x="10" y="40" width="5" height="3" rx="1.5" fill="#222"/><rect x="17" y="40" width="5" height="3" rx="1.5" fill="#222"/>';
    }
  }
  return t;
}
function drawAcc(acc,dir,cc,type){
  var a='',L=li(cc,50),D=dk(cc,20);
  var h=function(v){return acc && acc.indexOf(v)>-1;};
  if(type!=='fantasy'){
    if(h('glasses')&&dir==='down')a+='<rect x="12" y="9.5" width="3" height="2" rx="1" fill="none" stroke="#888" stroke-width="0.6"/><rect x="17" y="9.5" width="3" height="2" rx="1" fill="none" stroke="#888" stroke-width="0.6"/><line x1="15" y1="10.5" x2="17" y2="10.5" stroke="#888" stroke-width="0.5"/><line x1="11" y1="10.5" x2="12" y2="10.5" stroke="#888" stroke-width="0.5"/><line x1="20" y1="10.5" x2="21" y2="10.5" stroke="#888" stroke-width="0.5"/>';
    if(h('glasses')&&dir==='left')a+='<rect x="17" y="9.5" width="3" height="2" rx="1" fill="none" stroke="#888" stroke-width="0.6"/>';
    if(h('glasses2')&&dir==='down')a+='<rect x="12" y="9.5" width="3" height="2.5" rx="0.5" fill="none" stroke="#3a2a1a" stroke-width="0.9"/><rect x="17" y="9.5" width="3" height="2.5" rx="0.5" fill="none" stroke="#3a2a1a" stroke-width="0.9"/><line x1="15" y1="10.5" x2="17" y2="10.5" stroke="#3a2a1a" stroke-width="0.6"/>';
    if(h('glasses2')&&dir==='left')a+='<rect x="17" y="9.5" width="3" height="2.5" rx="0.5" fill="none" stroke="#3a2a1a" stroke-width="0.9"/>';
    if(h('bag'))a+='<rect x="22" y="20" width="5" height="8" rx="1.5" fill="'+L+'" stroke="'+cc+'" stroke-width="0.5"/>';
    if(h('briefcase'))a+='<rect x="22" y="21" width="6" height="5" rx="1" fill="#8B6914" stroke="#5a4010" stroke-width="0.5"/><rect x="24" y="19.5" width="2" height="2" rx="0.5" fill="none" stroke="#5a4010" stroke-width="0.6"/>';
    if(h('hat'))a+='<rect x="10" y="2" width="12" height="2.5" rx="1" fill="'+cc+'"/><rect x="9" y="4" width="14" height="1.5" rx="0.5" fill="'+cc+'"/>';
    if(h('scarf'))a+='<rect x="12" y="16" width="8" height="4" rx="1.5" fill="#CC4444" opacity="0.9"/>';
    if(h('mask')&&dir==='down')a+='<rect x="11" y="11" width="10" height="5" rx="2" fill="white" stroke="#ddd" stroke-width="0.5"/>';
    if(h('mask')&&dir==='left')a+='<rect x="13" y="11" width="8" height="5" rx="2" fill="white" stroke="#ddd" stroke-width="0.5"/>';
    if(h('earring')&&dir==='down')a+='<circle cx="11" cy="12" r="1" fill="#FFD700"/><circle cx="21" cy="12" r="1" fill="#FFD700"/>';
    if(h('earring')&&dir==='left')a+='<circle cx="21" cy="12" r="1" fill="#FFD700"/>';
    if(h('ribbon')&&dir==='down')a+='<polygon points="13,4 16,6 19,4 16,2" fill="#FF6B9D"/><circle cx="16" cy="5" r="1" fill="#FF9DBD"/>';
    if(h('ribbon')&&dir==='left')a+='<polygon points="19,4 16,6 19,8 21,5" fill="#FF6B9D"/>';
    if(type==='teacher'){
      if(h('tie')&&dir==='down')a+='<polygon points="15,17 17,17 17.5,23 16,24.5 14.5,23" fill="#8B0000"/>';
      if(h('bowtie')&&dir==='down')a+='<polygon points="13,17.5 16,16.5 16,18.5" fill="#8B0000"/><polygon points="19,17.5 16,16.5 16,18.5" fill="#8B0000"/><circle cx="16" cy="17.5" r="0.8" fill="#c00"/>';
      if(h('lanyard')&&dir!=='up')a+='<rect x="14.5" y="17" width="3" height="5" rx="0.5" fill="#3498DB" opacity="0.9"/><rect x="15" y="22" width="2" height="3" rx="0.3" fill="white" stroke="#3498DB" stroke-width="0.3"/>';
      if(h('watch')&&dir!=='up')a+='<rect x="8" y="25" width="3" height="2" rx="0.5" fill="#C0C0C0" stroke="#999" stroke-width="0.3"/>';
    }
  }
  if(type==='fantasy'){
    if(h('fstaff'))a+='<line x1="23" y1="18" x2="27" y2="10" stroke="#8B6914" stroke-width="1.2"/><circle cx="27" cy="9" r="2" fill="#9B59B6" opacity="0.9"/><circle cx="27" cy="9" r="1" fill="#E8DAEF"/>';
    if(h('fsword'))a+='<rect x="4" y="16" width="1.5" height="12" rx="0.5" fill="#C0C0C0"/><rect x="3" y="21" width="4" height="1.2" rx="0.3" fill="#8B6914"/><rect x="4.2" y="27.5" width="1.2" height="2" rx="0.5" fill="#8B6914"/>';
    if(h('fbow'))a+='<path d="M26 12 Q29 20 26 28" stroke="#784212" stroke-width="1.5" fill="none"/><line x1="26" y1="12" x2="26" y2="28" stroke="#C8A96E" stroke-width="0.6"/>';
    if(h('fcape'))a+='<rect x="8" y="17" width="16" height="14" rx="2" fill="'+D+'" opacity="0.7"/><path d="M8 31 Q16 36 24 31" fill="'+D+'" opacity="0.7"/>';
    if(h('fcrown')&&dir!=='up')a+='<polygon points="11,5 13,2 16,4 19,2 21,5 21,7 11,7" fill="#B7950B"/><circle cx="16" cy="3.5" r="1" fill="#E74C3C"/><circle cx="12" cy="5" r="0.8" fill="#3498DB"/><circle cx="20" cy="5" r="0.8" fill="#27AE60"/>';
    if(h('fcrown')&&dir==='up')a+='<polygon points="11,3 13,0 16,2 19,0 21,3 21,5 11,5" fill="#B7950B"/>';
    if(h('fhat')&&dir!=='up')a+='<polygon points="16,0 12,7 20,7" fill="'+cc+'"/><rect x="9" y="6.5" width="14" height="2.5" rx="0.5" fill="'+cc+'"/><rect x="9" y="6.5" width="14" height="1" rx="0.3" fill="'+L+'"/>';
    if(h('fhat')&&dir==='up')a+='<polygon points="16,0 12,7 20,7" fill="'+dk(cc,15)+'"/><rect x="9" y="6.5" width="14" height="2" rx="0.5" fill="'+dk(cc,15)+'"/>';
    if(h('glasses')&&dir==='down')a+='<rect x="12" y="9.5" width="3" height="2" rx="1" fill="none" stroke="#888" stroke-width="0.6"/><rect x="17" y="9.5" width="3" height="2" rx="1" fill="none" stroke="#888" stroke-width="0.6"/><line x1="15" y1="10.5" x2="17" y2="10.5" stroke="#888" stroke-width="0.5"/><line x1="11" y1="10.5" x2="12" y2="10.5" stroke="#888" stroke-width="0.5"/><line x1="20" y1="10.5" x2="21" y2="10.5" stroke="#888" stroke-width="0.5"/>';
    if(h('glasses')&&dir==='left')a+='<rect x="17" y="9.5" width="3" height="2" rx="1" fill="none" stroke="#888" stroke-width="0.6"/>';
    if(h('earring')&&dir==='down')a+='<circle cx="11" cy="12" r="1" fill="#FFD700"/><circle cx="21" cy="12" r="1" fill="#FFD700"/>';
    if(h('earring')&&dir==='left')a+='<circle cx="21" cy="12" r="1" fill="#FFD700"/>';
  }
  return a;
}

/* state: {type, skin, hcolor, hair, ccolor, cloth, gender, acc, dir} -> SVG <g> innerHTML */
function renderCharacterSVG(state){
  var sd=dk(state.skin,50);
  var h=drawHair(state.dir,state.hcolor,state.hair);
  var f=drawFace(state.dir,state.skin,sd);
  var n=drawNeck(state.dir,state.skin);
  var b;
  if(state.type==='teacher')b=drawTeacherBody(state.dir,state.cloth,state.ccolor,state.skin,state.gender);
  else if(state.type==='fantasy')b=drawFantasyBody(state.dir,state.cloth,state.ccolor,state.skin,state.gender);
  else b=drawStudentBody(state.dir,state.ccolor,state.skin,state.gender);
  var a=drawAcc(state.acc,state.dir,state.ccolor,state.type);
  return (state.dir==='up') ? (b+n+h+a) : (h+f+n+b+a);
}
