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
/* 손펜 - 무료 폰트 목록 (Google Fonts, 모두 정자체 / 흘림체 제외) */
window.SONPEN_FONTS = [
  // ---------- 한글 ----------
  { id:'noto-sans-kr',  name:'본고딕 (Noto Sans KR)', css:"'Noto Sans KR'",  lang:'ko', kind:'고딕' },
  { id:'noto-serif-kr', name:'본명조 (Noto Serif KR)', css:"'Noto Serif KR'", lang:'ko', kind:'명조' },
  { id:'nanum-gothic',  name:'나눔고딕',              css:"'Nanum Gothic'",  lang:'ko', kind:'고딕' },
  { id:'nanum-myeongjo',name:'나눔명조',              css:"'Nanum Myeongjo'",lang:'ko', kind:'명조' },
  { id:'gowun-dodum',   name:'고운돋움',              css:"'Gowun Dodum'",   lang:'ko', kind:'고딕' },
  { id:'gowun-batang',  name:'고운바탕',              css:"'Gowun Batang'",  lang:'ko', kind:'명조' },
  { id:'plex-kr',       name:'IBM Plex Sans KR',      css:"'IBM Plex Sans KR'", lang:'ko', kind:'고딕' },
  { id:'hahmlet',       name:'함렛 (Hahmlet)',        css:"'Hahmlet'",       lang:'ko', kind:'명조' },
  { id:'song-myung',    name:'송명 (Song Myung)',     css:"'Song Myung'",    lang:'ko', kind:'명조' },
  { id:'jua',           name:'주아 (Jua)',            css:"'Jua'",           lang:'ko', kind:'둥근' },
  { id:'do-hyeon',      name:'도현 (Do Hyeon)',       css:"'Do Hyeon'",      lang:'ko', kind:'제목' },
  { id:'gaegu',         name:'개구 (또박 손글씨)',     css:"'Gaegu'",         lang:'ko', kind:'손글씨' },
  { id:'gamja',         name:'감자꽃 (또박 손글씨)',   css:"'Gamja Flower'",  lang:'ko', kind:'손글씨' },
  { id:'black-han',     name:'검은고딕 (제목용)',      css:"'Black Han Sans'",lang:'ko', kind:'제목' },

  // ---------- 일본어 ----------
  { id:'noto-sans-jp',  name:'Noto Sans JP',          css:"'Noto Sans JP'",  lang:'ja', kind:'ゴシック' },
  { id:'noto-serif-jp', name:'Noto Serif JP',         css:"'Noto Serif JP'", lang:'ja', kind:'明朝' },
  { id:'zen-maru',      name:'Zen Maru Gothic (둥근)', css:"'Zen Maru Gothic'", lang:'ja', kind:'丸ゴシック' },
  { id:'zen-kaku',      name:'Zen Kaku Gothic New',   css:"'Zen Kaku Gothic New'", lang:'ja', kind:'ゴシック' },
  { id:'biz-mincho',    name:'BIZ UDPMincho (교과서풍)', css:"'BIZ UDPMincho'", lang:'ja', kind:'明朝' },

  // ---------- 중국어 ----------
  { id:'noto-sans-sc',  name:'Noto Sans SC (간체)',   css:"'Noto Sans SC'",  lang:'zh', kind:'黑体' },
  { id:'noto-serif-sc', name:'Noto Serif SC (간체)',  css:"'Noto Serif SC'", lang:'zh', kind:'宋体' },
  { id:'noto-sans-tc',  name:'Noto Sans TC (번체)',   css:"'Noto Sans TC'",  lang:'zh', kind:'黑体' },

  // ---------- 알파벳 ----------
  { id:'andika',        name:'Andika (학습용 정자)',   css:"'Andika'",        lang:'en', kind:'교육용' },
  { id:'atkinson',      name:'Atkinson Hyperlegible', css:"'Atkinson Hyperlegible'", lang:'en', kind:'가독성' },
  { id:'nunito',        name:'Nunito',                css:"'Nunito'",        lang:'en', kind:'산세리프' },
  { id:'quicksand',     name:'Quicksand (둥근)',      css:"'Quicksand'",     lang:'en', kind:'산세리프' },
  { id:'poppins',       name:'Poppins',               css:"'Poppins'",       lang:'en', kind:'산세리프' },
  { id:'lora',          name:'Lora',                  css:"'Lora'",          lang:'en', kind:'세리프' }
];

/* 언어별 기본 폰트 */
window.SONPEN_DEFAULT_FONT = { ko:'gowun-dodum', ja:'zen-kaku', zh:'noto-sans-sc', en:'andika' };

/* 기본 디자인 테마 */
window.SONPEN_THEMES = [
  { id:'cream',   name:'크림 노트',   paper:'#fffdf7', grid:'#d8d2c4', ink:'#3a3a3a', border:'thin',    borderColor:'#d9c3a5', emoji:'❀ ✿ ❀', place:'top' },
  { id:'mint',    name:'민트 산책',   paper:'#f4fbf7', grid:'#c2ddcd', ink:'#2f4f42', border:'rounded', borderColor:'#8fc7ab', emoji:'☘ ❧', place:'corners' },
  { id:'peach',   name:'복숭아빛',    paper:'#fff6f3', grid:'#f0cfc4', ink:'#5b3b34', border:'dots',    borderColor:'#f0a58e', emoji:'✽ ❉', place:'top' },
  { id:'sky',     name:'맑은 하늘',   paper:'#f5faff', grid:'#c6d9ec', ink:'#2c4257', border:'wave',    borderColor:'#8ab6dd', emoji:'⌒ ⏝ ⌒', place:'top' },
  { id:'kraft',   name:'크라프트',    paper:'#f3e7d3', grid:'#c9b394', ink:'#4a3a28', border:'double',  borderColor:'#a9825a', emoji:'◈ ◇', place:'corners' },
  { id:'lavender',name:'라벤더',      paper:'#f9f6ff', grid:'#d6cbe8', ink:'#3f3554', border:'ribbon',  borderColor:'#b8a4dd', emoji:'✧ ⋆', place:'side' },
  { id:'grass',   name:'풀잎 노트',   paper:'#fbfff4', grid:'#cfdcbb', ink:'#3a4a2b', border:'corner',  borderColor:'#9cba76', emoji:'⚘ ✤ ❦', place:'scatter' },
  { id:'plain',   name:'담백한 흰색', paper:'#ffffff', grid:'#cccccc', ink:'#333333', border:'none',    borderColor:'#cccccc', emoji:'', place:'top' },
  { id:'night',   name:'밤하늘',      paper:'#eef1f8', grid:'#c0c7dc', ink:'#28304a', border:'dashed',  borderColor:'#7b86ad', emoji:'✦ ✧ ⁘', place:'scatter' },
  { id:'sakura',  name:'벚꽃',        paper:'#fff7fa', grid:'#f2ccd8', ink:'#5b3644', border:'dots',    borderColor:'#eda3bd', emoji:'❁ ❁', place:'corners' }
];

/* 장식 문양 — 단색 활자 문양(이모지 대신). 색은 테두리 색(--bcol)을 따릅니다. */
window.SONPEN_ORN_PACKS = [
  { id:'line',  name:'선과 점',   chars:['⎯','·','◦','⋯','│','‧','⁃','⁚','⁝','⌇','⌒','⏝'] },
  { id:'flora', name:'식물',      chars:['❀','✿','❁','✾','❦','❧','☘','✤','❖','⚘','✽','❉'] },
  { id:'geo',   name:'기하',      chars:['◇','◈','▫','▪','◌','⬦','⬧','△','▽','⌑','⎔','◍'] },
  { id:'star',  name:'별과 문양', chars:['✦','✧','✩','⋆','✵','❋','⁂','⁘','⁙','✻','✼','✺'] }
];
window.SONPEN_EMOJIS = window.SONPEN_ORN_PACKS.reduce(function (a, p) { return a.concat(p.chars); }, []);

window.SONPEN_PRESETS = [
  { label:'한글 기본', text:'가나다라마바사아자차카타파하\n한글은 또박또박 쓰면 예쁩니다.' },
  { label:'받침 연습', text:'값 넋 닭 맑음 앉다 읊다 훑다 얹다' },
  { label:'짧은 명언', text:'천 리 길도 한 걸음부터.\n오늘 걷지 않으면 내일은 뛰어야 한다.' },
  { label:'숫자·기호', text:'0 1 2 3 4 5 6 7 8 9\n, . ? ! ( ) : ; " \'' },
  { label:'English', text:'The quick brown fox jumps over the lazy dog.\nPractice makes perfect.' },
  { label:'ひらがな', text:'あいうえお かきくけこ さしすせそ\n毎日少しずつ練習します。' },
  { label:'汉字', text:'一二三四五六七八九十\n学而时习之，不亦说乎。' }
];
