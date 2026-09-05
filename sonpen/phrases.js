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

/* 손펜 · 추천 문구 모음
   ─────────────────────────────────────────────────────────────
   실린 인용문은 저작권 보호기간이 끝난 것만 골랐습니다.
   생존 작가의 글이나 저작권이 남아 있는 현대 시·노래 가사는 넣지 않았습니다.
   한문 고전(목민심서·논어·명심보감 등)의 우리말 옮김은 판본마다 표현이
   조금씩 다르며, 여기 실린 것은 널리 쓰이는 형태를 다듬은 것입니다.

   항목 형식
     cat  : 갈래 id (아래 SONPEN_PHRASE_CATS 참고)
     lang : ko | en | ja | zh   (격자 자동 감지에 쓰입니다)
     text : 연습장에 들어갈 본문. \n 으로 줄을 나눕니다.
     from : 출처 (없으면 생략)
   ───────────────────────────────────────────────────────────── */

window.SONPEN_PHRASE_CATS = [
  { id: 'feel',    name: '감성',       desc: '마음이 놓이는 짧은 문장' },
  { id: 'poem',    name: '시',         desc: '저작권이 풀린 우리 시' },
  { id: 'mokmin',  name: '목민심서',    desc: '다산 정약용의 가르침' },
  { id: 'reflect', name: '성찰 일지',   desc: '하루를 돌아보는 문장' },
  { id: 'classic', name: '고전 명언',   desc: '논어 · 명심보감 · 옛말' },
  { id: 'season',  name: '계절과 자연', desc: '풍경을 담은 문장' },
  { id: 'basic',   name: '기초 연습',   desc: '자모 · 받침 · 숫자' },
  { id: 'en',      name: 'English',    desc: '알파벳 · 영어 문장' },
  { id: 'ja',      name: '日本語',      desc: 'かな · 漢字' },
  { id: 'zh',      name: '中文',        desc: '한자 · 중국어' }
];

window.SONPEN_PHRASES = [

  /* ========== 감성 ========== */
  { cat:'feel', lang:'ko', text:'오늘도 무사히 하루를 건넜습니다.' },
  { cat:'feel', lang:'ko', text:'천천히 가도 괜찮아요.\n길은 도망가지 않으니까요.' },
  { cat:'feel', lang:'ko', text:'좋은 날은 늘 조용히 옵니다.' },
  { cat:'feel', lang:'ko', text:'마음이 시끄러운 날에는\n손을 천천히 움직여 봅니다.' },
  { cat:'feel', lang:'ko', text:'괜찮다는 말을 나에게도 해 줍니다.' },
  { cat:'feel', lang:'ko', text:'서두르지 않아도\n닿을 곳에는 닿습니다.' },
  { cat:'feel', lang:'ko', text:'오늘의 나는 어제보다 한 뼘 더 자랐습니다.' },
  { cat:'feel', lang:'ko', text:'작은 일을 끝까지 해내는 사람이\n결국 멀리 갑니다.' },
  { cat:'feel', lang:'ko', text:'비가 오는 날에는 비의 소리를 듣습니다.' },
  { cat:'feel', lang:'ko', text:'고맙다는 말은 아껴 두지 않기로 합니다.' },
  { cat:'feel', lang:'ko', text:'잘 쉰 하루도 잘 산 하루입니다.' },
  { cat:'feel', lang:'ko', text:'흔들려도 뿌리는 그대로입니다.' },
  { cat:'feel', lang:'ko', text:'한 글자씩 쓰다 보면\n마음도 한 줄씩 정리됩니다.' },
  { cat:'feel', lang:'ko', text:'오늘 하루, 나에게 다정하기.' },
  { cat:'feel', lang:'ko', text:'조용한 시간이 사람을 단단하게 만듭니다.' },

  /* ========== 시 (저작권 만료) ========== */
  { cat:'poem', lang:'ko', from:'윤동주 「서시」',
    text:'죽는 날까지 하늘을 우러러\n한 점 부끄럼이 없기를,\n잎새에 이는 바람에도\n나는 괴로워했다.' },
  { cat:'poem', lang:'ko', from:'윤동주 「서시」',
    text:'별을 노래하는 마음으로\n모든 죽어 가는 것을 사랑해야지\n그리고 나한테 주어진 길을\n걸어가야겠다.' },
  { cat:'poem', lang:'ko', from:'윤동주 「새로운 길」',
    text:'내를 건너서 숲으로\n고개를 넘어서 마을로\n어제도 가고 오늘도 갈\n나의 길 새로운 길' },
  { cat:'poem', lang:'ko', from:'김소월 「진달래꽃」',
    text:'나 보기가 역겨워\n가실 때에는\n말없이 고이 보내 드리우리다' },
  { cat:'poem', lang:'ko', from:'김소월 「진달래꽃」',
    text:'영변에 약산\n진달래꽃\n아름 따다 가실 길에 뿌리우리다' },
  { cat:'poem', lang:'ko', from:'김소월 「엄마야 누나야」',
    text:'엄마야 누나야 강변 살자\n뜰에는 반짝이는 금모래빛\n뒷문 밖에는 갈잎의 노래' },
  { cat:'poem', lang:'ko', from:'한용운 「님의 침묵」',
    text:'님은 갔습니다.\n아아, 사랑하는 나의 님은 갔습니다.' },
  { cat:'poem', lang:'ko', from:'한용운 「나룻배와 행인」',
    text:'나는 나룻배\n당신은 행인' },
  { cat:'poem', lang:'ko', from:'이육사 「청포도」',
    text:'내 고장 칠월은\n청포도가 익어 가는 시절' },
  { cat:'poem', lang:'ko', from:'이육사 「광야」',
    text:'다시 천고의 뒤에\n백마 타고 오는 초인이 있어\n이 광야에서 목 놓아 부르게 하리라' },
  { cat:'poem', lang:'ko', from:'정지용 「향수」',
    text:'그곳이 차마 꿈엔들 잊힐 리야.' },
  { cat:'poem', lang:'ko', from:'김영랑 「돌담에 속삭이는 햇발」',
    text:'돌담에 속삭이는 햇발같이\n풀 아래 웃음 짓는 샘물같이' },
  { cat:'poem', lang:'ko', from:'황진이 시조',
    text:'동짓달 기나긴 밤을 한 허리를 베어 내어\n춘풍 이불 아래 서리서리 넣었다가' },
  { cat:'poem', lang:'ko', from:'윤선도 「오우가」',
    text:'내 벗이 몇이나 하니 수석과 송죽이라\n동산에 달 오르니 그 더욱 반갑고야' },

  /* ========== 목민심서 ========== */
  { cat:'mokmin', lang:'ko', from:'목민심서 · 율기(律己)',
    text:'청렴은 목민관의 본래 임무이며\n모든 선의 근원이요 모든 덕의 뿌리이다.' },
  { cat:'mokmin', lang:'ko', from:'목민심서 · 애민(愛民)',
    text:'백성을 사랑하는 근본은\n씀씀이를 절약하는 데 있다.' },
  { cat:'mokmin', lang:'ko', from:'목민심서 · 율기(律己)',
    text:'자신을 다스린 뒤에야\n남을 다스릴 수 있다.' },
  { cat:'mokmin', lang:'ko', from:'목민심서 · 부임(赴任)',
    text:'벼슬자리에 있는 사람이 지켜야 할 것은\n오직 두려워할 외(畏) 한 글자뿐이다.' },
  { cat:'mokmin', lang:'ko', from:'목민심서 · 봉공(奉公)',
    text:'윗사람을 섬기기는 쉬우나\n백성을 섬기기는 어렵다.' },
  { cat:'mokmin', lang:'ko', from:'목민심서 · 율기(律己)',
    text:'청렴하면 위엄이 서고\n정직하면 아랫사람이 따른다.' },
  { cat:'mokmin', lang:'ko', from:'목민심서 · 애민(愛民)',
    text:'백성의 어려움을 내 몸의 아픔처럼 여긴다.' },
  { cat:'mokmin', lang:'ko', from:'다산 정약용',
    text:'부지런함으로 가난을 이기고\n검소함으로 넉넉함을 지킨다.' },
  { cat:'mokmin', lang:'ko', from:'다산 정약용 · 유배지에서 보낸 편지',
    text:'하루라도 책을 읽지 않으면\n입 안에 가시가 돋는다.' },
  { cat:'mokmin', lang:'ko', from:'다산 정약용',
    text:'배우고 익힌 것을 삶으로 옮기지 않으면\n배우지 않은 것과 같다.' },

  /* ========== 성찰 일지 ========== */
  { cat:'reflect', lang:'ko', text:'오늘 나는 무엇에 마음을 썼는가.' },
  { cat:'reflect', lang:'ko', text:'오늘 가장 고마웠던 한 가지를 적습니다.' },
  { cat:'reflect', lang:'ko', text:'내가 오늘 미룬 일은 무엇인가.\n왜 미루었는가.' },
  { cat:'reflect', lang:'ko', text:'오늘 누군가에게 건넨 말 중\n다시 하고 싶은 말이 있는가.' },
  { cat:'reflect', lang:'ko', text:'하루를 돌아보고\n내일의 나에게 한 문장을 남깁니다.' },
  { cat:'reflect', lang:'ko', text:'나는 오늘 무엇을 배웠는가.' },
  { cat:'reflect', lang:'ko', text:'잘한 일 하나, 아쉬운 일 하나.\n둘 다 오늘의 나입니다.' },
  { cat:'reflect', lang:'ko', text:'지금 내 마음의 날씨는 어떠한가.' },
  { cat:'reflect', lang:'ko', text:'오늘 내가 지킨 약속과\n지키지 못한 약속을 적어 봅니다.' },
  { cat:'reflect', lang:'ko', text:'내일 아침의 나에게\n무엇을 부탁하고 싶은가.' },
  { cat:'reflect', lang:'ko', text:'욕심을 덜어 낸 자리에\n무엇을 채울 것인가.' },
  { cat:'reflect', lang:'ko', text:'오늘 나는 누구에게 도움이 되었는가.' },

  /* ========== 고전 명언 ========== */
  { cat:'classic', lang:'ko', from:'논어 · 학이',
    text:'배우고 때때로 익히면\n또한 기쁘지 아니한가.' },
  { cat:'classic', lang:'ko', from:'논어 · 위정',
    text:'옛것을 익혀 새것을 안다.' },
  { cat:'classic', lang:'ko', from:'논어 · 술이',
    text:'세 사람이 길을 가면\n그중에 반드시 나의 스승이 있다.' },
  { cat:'classic', lang:'ko', from:'논어 · 위령공',
    text:'잘못을 하고도 고치지 않는 것,\n이것을 잘못이라 한다.' },
  { cat:'classic', lang:'ko', from:'명심보감',
    text:'하루라도 착한 일을 생각하지 않으면\n온갖 나쁜 것이 저절로 일어난다.' },
  { cat:'classic', lang:'ko', from:'명심보감',
    text:'남을 꾸짖는 마음으로 자신을 꾸짖고\n자신을 용서하는 마음으로 남을 용서하라.' },
  { cat:'classic', lang:'ko', from:'채근담',
    text:'바쁠수록 마음은 한가로워야 하고\n한가할수록 마음은 깨어 있어야 한다.' },
  { cat:'classic', lang:'ko', from:'노자 · 도덕경',
    text:'천 리 길도 한 걸음에서 시작한다.' },
  { cat:'classic', lang:'ko', from:'노자 · 도덕경',
    text:'가장 좋은 것은 물과 같다.\n물은 만물을 이롭게 하면서 다투지 않는다.' },
  { cat:'classic', lang:'ko', from:'맹자',
    text:'하늘이 큰 일을 맡기려 할 때에는\n반드시 먼저 그 마음과 뜻을 괴롭게 한다.' },
  { cat:'classic', lang:'ko', from:'우리 속담',
    text:'공든 탑이 무너지랴.\n티끌 모아 태산이다.' },
  { cat:'classic', lang:'ko', from:'우리 속담',
    text:'말 한마디에 천 냥 빚을 갚는다.' },

  /* ========== 계절과 자연 ========== */
  { cat:'season', lang:'ko', text:'봄볕이 창가에 오래 머무는 오후입니다.' },
  { cat:'season', lang:'ko', text:'매화가 피면 겨울은 물러갑니다.' },
  { cat:'season', lang:'ko', text:'여름 저녁, 마당에 물을 뿌립니다.\n흙냄새가 올라옵니다.' },
  { cat:'season', lang:'ko', text:'매미 소리가 멎으면\n가을이 문 앞에 와 있습니다.' },
  { cat:'season', lang:'ko', text:'가을 하늘이 높고 말이 살찝니다.' },
  { cat:'season', lang:'ko', text:'낙엽 밟는 소리를 따라 걷습니다.' },
  { cat:'season', lang:'ko', text:'첫눈이 오면 누구에게 연락할지\n미리 정해 둡니다.' },
  { cat:'season', lang:'ko', text:'겨울나무는 아무것도 하지 않는 듯 보이지만\n속으로 봄을 준비합니다.' },
  { cat:'season', lang:'ko', text:'바람이 지나간 자리에 풀이 눕고\n다시 일어섭니다.' },
  { cat:'season', lang:'ko', text:'달빛이 마루까지 들어온 밤입니다.' },

  /* ========== 기초 연습 ========== */
  { cat:'basic', lang:'ko', text:'가나다라마바사아자차카타파하' },
  { cat:'basic', lang:'ko', text:'ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ\nㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ' },
  { cat:'basic', lang:'ko', text:'값 넋 닭 맑음 앉다 읊다 훑다 얹다' },
  { cat:'basic', lang:'ko', text:'까 따 빠 싸 짜\n꿈 땀 뿔 씨앗 짝꿍' },
  { cat:'basic', lang:'ko', text:'0 1 2 3 4 5 6 7 8 9\n, . ? ! ( ) : ;' },
  { cat:'basic', lang:'ko', text:'하나 둘 셋 넷 다섯\n여섯 일곱 여덟 아홉 열' },
  { cat:'basic', lang:'ko', text:'월요일 화요일 수요일 목요일\n금요일 토요일 일요일' },
  { cat:'basic', lang:'ko', text:'봄 여름 가을 겨울\n동 서 남 북' },

  /* ========== English ========== */
  { cat:'en', lang:'en', text:'The quick brown fox jumps over the lazy dog.' },
  { cat:'en', lang:'en', text:'ABCDEFGHIJKLM\nNOPQRSTUVWXYZ' },
  { cat:'en', lang:'en', text:'abcdefghijklm\nnopqrstuvwxyz' },
  { cat:'en', lang:'en', text:'Practice makes perfect.\nSlow and steady wins the race.' },
  { cat:'en', lang:'en', from:'Henry David Thoreau',
    text:'Go confidently in the direction of your dreams.' },
  { cat:'en', lang:'en', from:'Marcus Aurelius',
    text:'You have power over your mind,\nnot outside events.' },
  { cat:'en', lang:'en', from:'Ralph Waldo Emerson',
    text:'What lies behind us and what lies before us\nare tiny matters compared to what lies within us.' },
  { cat:'en', lang:'en', from:'Robert Frost',
    text:'I took the one less traveled by,\nAnd that has made all the difference.' },
  { cat:'en', lang:'en', from:'Emily Dickinson',
    text:'Hope is the thing with feathers\nThat perches in the soul.' },
  { cat:'en', lang:'en', text:'Today I will do my best,\nand that will be enough.' },

  /* ========== 日本語 ========== */
  { cat:'ja', lang:'ja', text:'あいうえお かきくけこ さしすせそ\nたちつてと なにぬねの' },
  { cat:'ja', lang:'ja', text:'アイウエオ カキクケコ サシスセソ\nタチツテト ナニヌネノ' },
  { cat:'ja', lang:'ja', text:'毎日少しずつ練習します。\n続けることが力になります。' },
  { cat:'ja', lang:'ja', from:'松尾芭蕉',
    text:'古池や\n蛙飛びこむ\n水の音' },
  { cat:'ja', lang:'ja', text:'春夏秋冬 花鳥風月\n山川草木 日月星辰' },
  { cat:'ja', lang:'ja', text:'ゆっくりでも\n前に進めば それでいい。' },

  /* ========== 中文 ========== */
  { cat:'zh', lang:'zh', text:'一二三四五六七八九十\n百千万亿' },
  { cat:'zh', lang:'zh', from:'논어',
    text:'学而时习之，不亦说乎。' },
  { cat:'zh', lang:'zh', from:'노자',
    text:'千里之行，始于足下。' },
  { cat:'zh', lang:'zh', from:'순자',
    text:'不积跬步，无以至千里。' },
  { cat:'zh', lang:'zh', text:'春夏秋冬 东西南北\n天地日月 山水花草' },
  { cat:'zh', lang:'zh', from:'이백 · 정야사',
    text:'床前明月光，疑是地上霜。\n举头望明月，低头思故乡。' }
];

/* 페이지를 열 때 처음 보여 줄 문구를 뽑습니다.
   기초 연습(자모 나열)은 첫인상용으로 심심해서 빼고 고릅니다. */
window.SONPEN_RANDOM_PHRASE = function (catId) {
  var pool = window.SONPEN_PHRASES.filter(function (p) {
    return catId ? p.cat === catId : (p.cat !== 'basic' && p.lang === 'ko');
  });
  if (!pool.length) pool = window.SONPEN_PHRASES;
  return pool[Math.floor(Math.random() * pool.length)];
};
