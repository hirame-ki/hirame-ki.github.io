# 쌤버스 (Ssambus) 프로젝트 인수인계 문서

## 프로젝트 개요

* **프로젝트명**: 쌤버스
* **브랜드**: 쌤보드 생태계 (기존 쌤보드 앱의 메타버스 수업 도구)
* **개발자**: @hirame.ki (인스타그램)
* **개념**: 교사가 수업 내용을 설정하면, 학생들이 QR로 접속해 방탈출형 미션을 수행하는 2D 메타버스 수업 플랫폼

\---

## 확정된 기술 스택

|항목|내용|
|-|-|
|프론트엔드|HTML/CSS/JS (단일 파일)|
|실시간 통신|Supabase Realtime (무료 플랜)|
|배포|GitHub Pages (완전 무료)|
|그래픽|SVG/Canvas 직접 제작 (라이선스 문제로 에셋 미사용)|
|AI 기능|Groq API (추후 필요 시)|

### Supabase 무료 플랜 스펙

* 동시 접속 200명 (한 반 30명 기준 6반 동시 수업 가능)
* 월 메시지 200만 건
* **주의**: 7일간 API 요청 없으면 프로젝트 자동 일시정지 → 주기적 ping 코드 필요

\---

## 사용자 구조

```
쌤보드 개발자 (히라메키)
  → 플랫폼 제작 및 배포
      ↓
교사 (배포받은 사용자)
  → 대시보드에서 맵/미션 설정
  → QR코드 생성 후 학생에게 공유
      ↓
학생
  → QR 스캔으로 입장
  → 캐릭터 선택 및 꾸미기
  → 맵 탐험 + 미션 수행
```

\---

## 수업 구조: 방탈출형

```
QR 스캔 입장
  ↓
캐릭터 선택/꾸미기 + 닉네임 입력
  ↓
맵 입장 (실시간 다른 학생 캐릭터 보임)
  ↓
구역 진입 → 미션 발동
  ↓
미션 수행 (영상/퀴즈/구글폼/링크)
  ↓
클리어 → 다음 구역 열림
  ↓
전체 완료 → 소감 입력 (선택)
```

\---

## 맵 구성 (1차 5종, 추후 확장)

### 1차 제작

1. 일반교실
2. 도서관
3. 운동장
4. 현대도시
5. 자연숲

### 추후 추가 예정

* 체육관, 음악실, 미술실, 컴퓨터실, 교무실
* 한강공원, 동네마을, 일반 길거리

\---

## 캐릭터 시스템

### 종류

1. **교복 캐릭터** (학생용)
2. **교사 캐릭터**
3. **판타지 캐릭터** ← 완성

### 공통 스펙

* 크기: 32×48px (SVG, viewBox 0 0 32 48)
* 방향: 앞(down) / 옆(left) / 뒤(up)
* 성별: 남(바지+운동화) / 여(치마+구두)

### 교복 캐릭터 옵션 (완성)

* 피부색: 8종
* 머리 스타일: 숏컷, 짧은머리, 가르마, 보브컷, 단발, 장발, 웨이브, 양갈래, 포니테일, 올림머리
* 머리색: 14종 (흑발\~백발, 파랑/보라/빨강/초록/회색 포함)
* 교복 색상: 12종
* 액세서리 (중복 선택): 안경, 뿔테, 가방, 모자, 목도리, 마스크, 귀걸이, 리본

### 교사 캐릭터 옵션 (완성)

* 피부색: 8종
* 머리 스타일: 숏컷, 짧은머리, 옆가르마, 올백, 보브컷, 단발, 장발, 웨이브, 포니테일, 올림머리
* 머리색: 12종
* 의상 스타일: 정장, 후드, 가디건, 조끼, 셔츠, 체육복
* 의상 색상: 12종
* 액세서리 (중복 선택): 안경, 뿔테, 넥타이, 나비넥타이, 서류가방, 숄더백, 목걸이카드, 모자, 귀걸이, 마스크, 목도리, 시계

### 판타지 캐릭터 옵션 (완성)

* 피부색: 8종
* 머리 스타일: 교복/교사와 동일한 풀옵션
* 의상: 마법사/기사/궁수 등 `_fantasyBody()` 구현 완료 (`ssambus_character_render.js`)
* 교복/교사와 동일한 방향(앞/옆/뒤), 성별, 머리색, 액세서리 지원

\---

## 데이터 구조 (Supabase)

### 테이블

**teachers** (교사 계정)

```json
{
  "id": "teacher\_001",
  "name": "김선생",
  "email": "kim@school.kr",
  "password": "hashed",
  "created\_at": "2026-06-12"
}
```

**rooms** (수업방)

```json
{
  "id": "room\_abc123",
  "teacher\_id": "teacher\_001",
  "title": "일본 문화 탐험",
  "map\_id": "classroom",
  "qr\_url": "https://ssambus.github.io/join?room=abc123",
  "status": "waiting | active | closed",
  "created\_at": "2026-06-12"
}
```

**missions** (미션)

```json
{
  "id": "mission\_001",
  "room\_id": "room\_abc123",
  "zone\_id": "zone\_A",
  "title": "영상 시청",
  "type": "youtube | quiz | google\_form | link",
  "content": "https://...",
  "order": 1,
  "required": true,
  "quiz": {
    "question": "질문 텍스트",
    "options": \["보기1", "보기2", "보기3", "보기4"],
    "answer": 0,
    "pass\_score": 1
  }
}
```

**students** (학생 세션 - 수업 종료 시 삭제)

```json
{
  "id": "student\_uuid",
  "room\_id": "room\_abc123",
  "nickname": "김민준",
  "character": {
    "type": "school | teacher | fantasy",
    "gender": "male | female",
    "hair": "short",
    "hair\_color": "#2c1b0e",
    "cloth\_color": "#1a3a6b",
    "accessory": \["glasses", "bag"]
  },
  "position": { "x": 5, "y": 3 },
  "missions\_done": \["mission\_001"]
}
```

**realtime\_positions** (Supabase Realtime 채널)

```json
{
  "room\_id": "room\_abc123",
  "student\_id": "student\_uuid",
  "nickname": "김민준",
  "character\_type": "school",
  "x": 5,
  "y": 3,
  "direction": "down"
}
```

\---

## 화면 구조

```
\[입장 화면]
  교사: ID/PW 로그인
  학생: QR 스캔 → 자동 입장

\[캐릭터 선택 화면] (학생)
  캐릭터 종류 선택 (교복/교사/판타지)
  꾸미기 (머리/옷/색상/액세서리)
  닉네임 입력
  입장 버튼

\[교사 대시보드]
  맵 선택 (샘플 중 선택)
  구역별 미션 설정
  QR코드 생성/공유
  수업 시작/종료
  실시간 학생 위치 모니터링
  미션 완료 현황

\[메인 게임 화면]
  상단: 수업명 + 미션 진행률
  중앙: 맵 + 캐릭터들 (실시간)
  하단: 방향키 (모바일 대응)
  우측: 접속 학생 목록

\[미션 화면]
  유형별: 영상 / 퀴즈 / 구글폼 / 외부링크
  완료 → 다음 구역 열림

\[완료 화면]
  전체 미션 클리어 메시지
  소감 입력 (선택)
```

\---

## 학생 접속 방식

* **QR 스캔 단일 방식** (코드 입력 방식 없음)
* 교사가 빔프로젝터에 QR 띄우기 — 교사 대시보드 "🔗 학생 초대 링크" 버튼으로 QR 즉시 노출 + "⛶ 전체화면으로 보기" 지원
* 학생 초대 링크 팝업에는 **시작 맵 1개**만 표시 (혼란 방지)
* 상단 수업 코드 옆 "복사" 버튼으로 코드 직접 복사 가능
* 한 QR로 30명 동시 입장 가능
* 원격 수업 시: QR 이미지 파일 공유

\---

## 지원 기기

* 태블릿, 크롬북, 스마트폰 모두 지원
* 반응형 레이아웃 필수
* 모바일: 터치/드래그로 캐릭터 이동
* PC/크롬북: 키보드 방향키로 이동

\---

## 개발 단계 진행 현황

|단계|내용|상태|
|-|-|-|
|1단계|화면 구조 설계|✅ 완료|
|2단계|데이터 구조 설계|✅ 완료|
|3단계|캐릭터 제작 (교복/교사)|✅ 완료|
|3단계|캐릭터 제작 (판타지)|✅ 완료|
|4단계|맵 제작 (Canvas 타일) - 일반교실|✅ 1차 완료 (`ssambus_map_classroom.html`)|
|4단계|맵 제작 - 도서관|✅ 1차 완료 (`ssambus_map_library.html`)|
|4단계|맵 제작 - 운동장|✅ 1차 완료 (`ssambus_map_playground.html`)|
|4단계|맵 제작 - 체육관|✅ 1차 완료 (`ssambus_map_gym.html`)|
|4단계|맵 제작 - 현대도시|✅ 1차 완료 (`ssambus_map_city.html`)|
|4단계|맵 제작 - 자연숲|✅ 1차 완료 (`ssambus_map_forest.html`)|
|5단계|Supabase 실시간 통신|🟡 1차 코드 작성 완료 (Presence 기반, 실제 프로젝트 연결 전)|
|6단계|미션 시스템|🟡 1차 완료 (구역별 미션 발동/진행률 추적)|
|7단계|교사 대시보드|✅ 완료 (수업 코드 분리 + 작성자 본인만 수정/삭제)|
|8단계|배포|✅ 1차 완료 (GitHub Pages 배포 가이드 작성, `index.html` 추가)|

\---

## 완성된 파일

### `ssambus_characters.html`
교복/교사/판타지 캐릭터 커스터마이징 시스템 (3개 탭). 모든 옵션(피부색, 머리, 의상, 색상, 액세서리) 완성.

### `ssambus_map_classroom.html`
일반교실 맵 1차 완성본. 구조:

* **크기**: 15열 x 16행, 타일 48px → 720x768px 캔버스
* **배치 (한국 교실 표준 구조 반영)**:
  - 상단(0행): 가로로 긴 칠판(2~12열, 11칸) + 좌측 끝(1열)에 천장형 거치대 대형TV
  - 1행: 칠판 정면 중앙(6~8열)에 교탁
  - 좌측(0열, 1~14행): 통창(창문) 전체
  - 우측(14열): 앞문(3행)·뒷문(13행) 2개
  - 하단(15행): 게시판(1~6열, 코르크보드) + 사물함(8~13열, 메탈)
  - 학생 책상: 5행 x 5열 = 25석 (4,6,8,10,12행 / 3,5,7,9,11열), 책상마다 1칸 통로 + 상하좌우 2칸 코너 통로로 25명 동시 이동 시 겹침 최소화
* **캐릭터**: 기본 교복 남학생(검은머리/숏컷/남색 교복) SVG를 캔버스 위에 오버레이, 방향키(↑↓←→)/터치패드로 타일 단위 이동, 충돌 체크(WALKABLE: 바닥=0, 문=5)
* **확장 시 참고**: 캐릭터 커스터마이징 데이터(ST 객체)를 `ssambus_characters.html`에서 가져와 PLAYER에 연결하면 꾸민 캐릭터로 입장 가능. 다른 학생들의 실시간 위치는 Supabase Realtime 연동 후 동일한 SVG 오버레이 방식으로 여러 명 렌더링하면 됨.

\---

### `ssambus_map_library.html`
도서관 맵 1차 완성본. 구조:

* **크기**: 15열 x 21행, 타일 48px → 720x1008px 캔버스 (일반교실보다 세로로 더 넓음)
* **배치**:
  - 상단(0행): 입구문(6~8열, 3칸)
  - 1행: 입구 앞 사서 대출대(6~8열) - 컴퓨터/표지판/책더미 디테일
  - 중단(3~4행, 6~7행): 서가(책장) 2블록 x 6열 = 12유닛, 사이사이 통로
  - 우측(14열, 1~19행): 통창(창문)
  - 하단(10~18행): 열람석 5행 x 5열 = 25석 (일반교실 책상 배치와 동일한 간격/통로 패턴으로 겹침 최소화)
* **수정 이력**: 0행 입구문(6~8열)이 1행 사서 대출대(6~8열, 통행 불가)에 가로막혀 접근 불가능했던 문제 수정 → 1행 7열을 통로(0)로 비우고, "도서관 입구" 표지판을 0행 문 위에 오버레이로 표시 (LIBRARY 표지판은 표지판으로 통합)
* **카메라 추적**: 맵 세로 길이(1008px)가 화면(672px)보다 커서, `.stage-wrap`을 720x672px(`overflow:hidden`)로 고정하고 `updateCamera()`로 캐릭터를 따라 세로 스크롤 (가로는 720px로 정확히 맞아 스크롤 없음) — 아래 "카메라 추적 시스템" 섹션 참고
* **캐릭터**: 일반교실과 동일한 SVG 오버레이/이동 로직 재사용

\---

### `ssambus_map_playground.html` (운동장) - 가로로 확장 완료

* **크기**: 32열 x 14행, 타일 48px → 1536x672px 캔버스 (가로로 길게 확장, 화면에는 768x672px 뷰포트로 카메라 추적 표시)
* **배치**: 외곽 펜스(0행/13행/0열/31열, 13행 15~16열은 출입구 게이트) + 트랙(1행·12행·1열·30열) + 내부 잔디 운동장
  - 좌우 대칭 배치: 좌측 농구대(3열,3행) ↔ 우측 농구대(28열,3행) / 좌측 놀이기구(4~6열,3~4행) ↔ 우측 놀이기구(25~27열,3~4행)
  - 좌측 축구 골대(2열,6~8행) ↔ 우측 축구 골대(29열,6~8행) / 좌측 벤치(3열,10~11행) ↔ 우측 벤치(28열,10~11행)
  - 11행 15열에 국기게양대, 13행 15~16열이 정문 게이트(출입구)
  - `drawGoal`/`drawHoop`은 `col <= COLS/2` 기준으로 좌우 방향을 자동 반전해 동일 함수로 양쪽을 미러링
* **WALKABLE**: 잔디(2)/트랙(3)/펜스출입구(5) - 넓은 잔디 공터로 25명 동시 이동에 충분
* **플레이어 시작 위치**: 12행 15열 (정문 게이트 안쪽 트랙)
* **캐릭터**: 기존 맵과 동일한 SVG 오버레이/이동 로직 재사용
* **카메라 추적**: 아래 "카메라 추적 시스템" 섹션 참고 (`VIEW_W=768, VIEW_H=672`)

\---

### `ssambus_map_gym.html` (체육관) - 가로로 확장 완료

* **크기**: 28열 x 14행, 타일 48px → 1344x672px 캔버스 (가로로 길게 확장, 화면에는 768x672px 뷰포트로 카메라 추적 표시)
* **배치**: 상/하단 벽(0행/13행)에 농구 골대 2쌍(7~8열, 19~20열) 그래픽 - 좌우 양쪽에 코트 2면 구성
  - 좌측(1열) 관람석(2~11행) / 우측(26열) 창고(2~11행, 단 3~4행·9~10행은 출입문 접근을 위해 코트 바닥으로 비움) / 최우측(27열) 출입문 2개(3~4행, 9~10행, 나머지는 벽)
  - 좌상단(2~3행, 2~3열)에 무대(stage)
  - 6행에 전체 코트라인 + 좌측 코트(7.5열)·우측 코트(19.5열) 각각 센터서클 + 배구네트 오버레이
* **WALKABLE**: 코트 바닥(0)/문(5) - 넓은 코트 전체가 이동 가능 공간
* **수정 이력**: 3~4행/9~10행의 26열 보관대(8) 타일이 출입문(27열)을 가로막아 접근 불가능했던 문제 수정 → 해당 칸을 코트 바닥(0)으로 변경해 문까지 통로 확보
* **플레이어 시작 위치**: 3행 5열
* **캐릭터**: 기존 맵과 동일한 SVG 오버레이/이동 로직 재사용
* **카메라 추적**: 아래 "카메라 추적 시스템" 섹션 참고 (`VIEW_W=768, VIEW_H=672`)

\---

### `ssambus_map_city.html` (현대도시) - 재설계 + 가로 확장 완료

* **크기**: 28열 x 14행, 타일 48px → 1344x672px 캔버스 (도심형 십자도로 구조를 가로로 확장, 화면에는 768x672px 뷰포트로 카메라 추적 표시)
* **배치 (3블록 도심 구조 - 기존 "공원형" 광장 디자인은 자연숲과 너무 유사해 폐기 후 재설계)**:
  - 8열 너비 건물 블록 3개(0~7열 / 10~17열 / 20~27열) 사이로 남북 도로 2개(8~9열, 18~19열)가 지도를 세로로 가로지름
  - 동서 도로(6~7행)가 지도를 가로로 가로질러 두 남북 도로와 교차 → 사거리 2곳 형성
  - 각 사거리 중앙(6~7행)에 분수가 있는 작은 광장(9) - 통행 가능, 사거리 진입부에 횡단보도(3)·신호등(4) 배치
  - 각 건물 블록의 도로쪽 가장자리 건물(6/11/16/21열)에는 컬러 어닝으로 1층 상가 표현
  - 인도 위 가로수(0행/13행 일부) + 벤치(0열/27열 일부) 장식
  - 남북 도로 2개 모두 0행/13행에서 지도 끝까지 뻗어있어 상단/하단이 "도시 입구/출구" 역할 (0행 8~9열 위에 "현대도시 입구" 표지판 오버레이)
* **WALKABLE**: 인도(0)/도로(2)/횡단보도(3)/신호등칸(4)/사거리광장(9) - 건물(1)만 막힘, 도로+인도가 넓어 25명 동시 활동 충분
* **플레이어 시작 위치**: 0행 8열 (상단 도시 입구)
* **캐릭터**: 기존 맵과 동일한 SVG 오버레이/이동 로직 재사용
* **카메라 추적**: 아래 "카메라 추적 시스템" 섹션 참고 (`VIEW_W=768, VIEW_H=672`)

\---

### `ssambus_map_forest.html` (자연숲) - 가로로 확장 완료

* **크기**: 28열 x 14행, 타일 48px → 1344x672px 캔버스 (가로로 길게 확장, 화면에는 768x672px 뷰포트로 카메라 추적 표시)
* **배치**: 외곽 전체(0행/13행/0열/27열) 숲 경계 / 내부는 풀밭 위에 나무·바위·덤불·꽃밭을 가로 전체에 드문드문 배치
  - 중앙(4~8행, 13~16열)에 더 넓어진 연못 + 통나무 다리(14~15열, 연못을 가로지르는 2칸 폭 이동 경로)
  - 좌측에서 우측까지 곳곳에 나무/바위/덤불/꽃밭이 분산 배치되어 넓은 맵 전체를 탐험하는 느낌 강화
  - **입구**: 1행 0열의 경계를 흙길(타일 5, "자연숲 입구" 표지판)로 열어 명확한 진입 지점 제공 (기존과 동일 위치 유지)
* **WALKABLE**: 풀밭(0)/입구흙길(5)/통나무다리(6)/꽃밭(7) - 장애물(나무/바위/덤불/연못) 사이 넓은 풀밭 공터로 25명 동시 이동 충분
* **플레이어 시작 위치**: 1행 1열
* **캐릭터**: 기존 맵과 동일한 SVG 오버레이/이동 로직 재사용
* **카메라 추적**: 아래 "카메라 추적 시스템" 섹션 참고 (`VIEW_W=768, VIEW_H=672`)

\---

## 카메라 추적 시스템 (화면보다 큰 맵 공통 패턴)

도서관/운동장/체육관/현대도시/자연숲처럼 캔버스 크기가 화면보다 큰 맵은 전체 맵을 그대로 보여주거나 브라우저 스크롤바에 맡기지 않고, **고정 크기 뷰포트 + JS 스크롤 추적** 방식으로 캐릭터를 항상 화면 안에 보이게 한다.

* **CSS**: `.stage-wrap{width:Wpx;max-width:100%;height:Hpx;overflow:hidden;border:4px solid #4a3728;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15)}` — `.stage`(캔버스+캐릭터 래퍼)는 그대로 두고 `.stage-wrap`만 고정 크기로 잘라서 보여줌
* **JS 상수**: `const VIEW_W = 768, VIEW_H = 672;` (가로로 넓은 맵은 768x672 = 16x14타일 뷰포트, 도서관처럼 세로로 긴 맵은 720x672 = 15x14타일 뷰포트로 가로폭을 캔버스 너비와 맞춤)
* **JS 함수**:
  ```js
  function updateCamera(){
    const wrap = document.querySelector('.stage-wrap');
    const canvasW = COLS*TS, canvasH = ROWS*TS;
    const px = pos.c*TS + TS/2, py = pos.r*TS + TS/2;
    wrap.scrollLeft = Math.max(0, Math.min(px - VIEW_W/2, canvasW - VIEW_W));
    wrap.scrollTop  = Math.max(0, Math.min(py - VIEW_H/2, canvasH - VIEW_H));
  }
  ```
* `placePlayer()` 안에서 `left`/`top` 설정 후 `updateCamera()`를 호출 → 캐릭터가 이동할 때마다 맵이 캐릭터를 따라 스크롤되어 항상 화면 중앙 근처에 위치
* 적용 완료: `ssambus_map_gym.html`, `ssambus_map_playground.html`, `ssambus_map_city.html`, `ssambus_map_forest.html` (모두 `VIEW_W=768,VIEW_H=672`), `ssambus_map_library.html`(`VIEW_W=720,VIEW_H=672`)
* `ssambus_map_classroom.html`(15x16, 720x768)도 도서관과 동일하게 `VIEW_W=720, VIEW_H=672` 카메라 추적 적용 완료 (세로로만 96px 스크롤)

\---

## 맵별 출입구 정리 (미션 진입/이탈 기준점)

| 맵 | 출입구 위치 | 형태 |
|-|-|-|
| 일반교실 | 14열, 3행(앞문)·13행(뒷문) | 문(도어 그래픽) |
| 도서관 | 0행, 6~8열 | 문 + "도서관 입구" 표지판 |
| 운동장 | 13행, 15~16열 | 펜스 게이트 |
| 체육관 | 27열, 3~4행(앞문)·9~10행(뒷문) | 문(도어 그래픽), 통로 확보 완료 |
| 현대도시 | 0행, 8~9열 (상단 도로) / 13행, 8~9열 + 18~19열 (하단 도로) | 도로가 지도 끝까지 연결 + "현대도시 입구" 표지판 |
| 자연숲 | 1행, 0열 | 흙길 + "자연숲 입구" 표지판 |

\---

## 맵별 미션 구역(zone) 정리

각 맵을 **8개 구역(zone_A~zone_H)**으로 분할해 `ssambus_missions.js`의 `MISSION_ZONES`에 정의함. 캐릭터가 구역에 진입하면 해당 구역에 연결된 미완료 미션이 자동으로 모달로 표시됨.

| 맵 | zone_A | zone_B | zone_C | zone_D | zone_E~H |
|-|-|-|-|-|-|
| 일반교실 | 칠판·TV 앞·교사 책상 | 앞쪽 통로·앞문 | 책상 1·2열 | 책상 3열 | 책상 4·5열, 뒷쪽, 게시판, 사물함 |
| 도서관 | 입구·대출대 | 서가 1열 | 서가 2열 | 중앙 통로 | 열람석 1~5열 |
| 운동장 | 서쪽 펜스·골대 | 좌측 놀이기구 | 좌측 잔디 | 중앙 광장 좌 | 중앙 광장 우, 우측 잔디, 우측 놀이기구, 동쪽 펜스·골대 |
| 체육관 | 무대·관람석 | 좌측 코트 | 중앙 코트 | 우측 코트 | 관람석·보관대 등 4개 |
| 현대도시 | 블록1 남 | 블록1 북 | 사거리1(횡단보도) | 블록2 남 | 블록2 북, 사거리2, 블록3 남·북 |
| 자연숲 | 서북 입구 숲길 | 서남 | 연못 북서 | 북동쪽 깊은 숲 | 중·동 구역 4개 |

\---

## Supabase 멀티플레이어 연동 (✅ 실제 연동 완료, 2026-06-14)

6개 맵 파일(일반교실/도서관/운동장/체육관/현대도시/자연숲) 모두에 Supabase Realtime **Presence** 기반 멀티플레이어 코드를 추가했다. 별도의 broadcast 채널 없이 `channel.track()` 하나로 (1) 신규 입장자에게 현재 모든 참여자 상태 동기화, (2) 상태 변경 시 실시간 전파가 모두 처리된다.

* **새 파일**:
  - `ssambus_supabase_config.js` - 실제 프로젝트의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 적용 완료 (프로젝트: `kelvxbvvxpcnlholvmfr`)
  - `ssambus_realtime.js` - 모든 맵 공용. `initRealtime()`(채널 연결+presence 구독), `broadcastMyPosition()`(이동 시 내 상태 track, 150ms 간격으로 throttle), `renderRemotePlayers()`(다른 학생 캐릭터를 `#remote-players`에 렌더링), `__rtConnect()`(연결 끊김 시 1초 후 자동 재연결)
* **각 맵 파일 변경 사항**: `<head>` 하단에 Supabase CDN + config + realtime 스크립트(`ssambus_realtime.js?v=7`) 로드, `.stage`에 `#remote-players` 컨테이너 추가, `.remote-player`/`.nick` CSS 추가(이동 transition `.15s linear`), `placePlayer()` 끝에 `broadcastMyPosition()` 호출, 페이지 로드 마지막에 `initRealtime()` 호출
* **안전장치**: `SUPABASE_URL`이 플레이스홀더(`'YOUR-PROJECT'` 포함)이면 `initRealtime()`이 콘솔 안내만 출력하고 즉시 종료 → Supabase 미설정 상태에서도 싱글플레이는 기존과 동일하게 100% 정상 동작
* **전송 속도 제한**: 이동 시마다 매번 `track()`을 호출하면 Realtime 전송 제한에 걸려 연결이 끊기므로, 최소 150ms 간격으로 묶어서 전송(`__rtSendInterval`). 빠르게 연속 이동하면 중간 좌표가 생략되어 원격 화면에서 약간 "건너뛰는" 것처럼 보일 수 있음 - 무료 플랜(월 200만 메시지) 한도를 고려한 의도적 트레이드오프이며, 더 매끄럽게 하려면 타임스탬프 기반 보간(interpolation) 추가 필요(추후 작업)
* **자동 재연결**: 채널 상태가 `CLOSED`/`CHANNEL_ERROR`/`TIMED_OUT`이 되면 1초 후 자동으로 채널을 재생성해 재연결
* **방/닉네임 규칙**: URL 쿼리스트링 `?room=<방ID>&nickname=<닉네임>` (기본값: `room=demo`, `nickname=학생####`) - 추후 교사 대시보드의 QR 생성 로직에서 `room` 값을 room_id로 채워 넣으면 됨
* **다른 학생 캐릭터 외형**: presence로 전달되는 캐릭터 상태(`type/skin/hcolor/hair/ccolor/cloth/gender/acc/dir`)를 공용 모듈의 `renderCharacterSVG(state)`에 그대로 넘겨 렌더링 (커스터마이징 데이터 연동 완료로 자동 반영됨)
* **테스트 검증**: 일반교실/도서관 맵에서 로컬 서버(`python -m http.server`)로 두 브라우저 탭(학생A/B, 같은 room) 실시간 동기화 확인 완료

\---

## 캐릭터 커스터마이징 → PLAYER 연동 (완료)

* **공용 렌더링 모듈**: `ssambus_character_render.js` 신규 생성 - `li/dk` 색상 헬퍼, `drawHair/drawFace/drawNeck/drawStudentBody/drawTeacherBody/drawFantasyBody/drawAcc`, 그리고 통합 진입점 `renderCharacterSVG(state)` (state: `{type, skin, hcolor, hair, ccolor, cloth, gender, acc, dir}`)를 포함. `ssambus_characters.html`, 6개 맵 파일, `ssambus_realtime.js`가 모두 이 모듈을 공용으로 사용.
* **데이터 전달**: `ssambus_characters.html`에 "이 캐릭터로 입장하기" 버튼 + 맵 선택 드롭다운 추가. 클릭 시 현재 탭의 `ST[currentChar]`를 `{type, ...}` 형태로 `localStorage.setItem('ssambus_player_character', JSON.stringify(data))`에 저장하고, 선택한 맵으로 이동(쿼리스트링 `room`/`nickname` 유지).
* **맵 파일 측**: 각 맵의 `PLAYER`는 `localStorage.getItem('ssambus_player_character')`를 읽어 기본값과 `Object.assign`으로 병합. `renderPlayer()`는 `renderCharacterSVG(PLAYER)`만 호출.
* **멀티플레이어 자동 반영**: `__rtMyState()`가 `type/hair/cloth/gender/acc`까지 모두 전송하도록 확장되어, 다른 학생 화면에도 커스터마이징된 외형이 그대로 표시됨 (메시지 빈도/주기는 기존 150ms throttle 그대로 유지 - 무료 플랜 한도 영향 없음).

\---

## 미션 시스템 (6단계, 1차 완료)

구역(zone) 진입 → 미션 모달 자동 표시 → 완료 시 진행률 반영 흐름을 구현. 물리적 이동 잠금은 없음(진행률만 추적).

* **새 파일**:
  - `ssambus_missions.js` - 모든 맵 공용 모듈. `MISSION_ZONES`(맵별 zone 좌표), `DEMO_MISSIONS`(Supabase 데이터 없을 때 대체용 데모 미션), `initMissionSystem(mapId)`, `checkZoneOnMove(pos)` 포함
  - `ssambus_missions_setup.sql` - Supabase SQL 편집기에 붙여넣을 `missions` 테이블 생성 스크립트 + RLS(읽기 허용) + `room_id='demo'` 샘플 미션 데이터(DEMO_MISSIONS와 동일 내용)
* **각 맵 파일 변경 사항**: `<head>`에 `ssambus_missions.js` 스크립트 추가, `placePlayer()`의 `broadcastMyPosition()` 다음에 `checkZoneOnMove(pos)` 호출 추가, 파일 끝 `initRealtime()` 다음에 `initMissionSystem('<mapId>')` 호출 추가
* **미션 데이터 우선순위**: Supabase `missions` 테이블에서 `room_id`+`map_id` 일치 행을 `order`로 정렬해 조회 → 결과가 있으면 그걸 사용, 없으면(Supabase 미설정 포함) `DEMO_MISSIONS[mapId]` 사용. 즉 `ssambus_missions_setup.sql`을 실행하지 않아도 즉시 테스트 가능하며, 추후 교사 대시보드가 `missions` 테이블에 행을 쓰면 자동으로 그 데이터가 우선 적용됨
* **지원 미션 타입**: `youtube`(영상 임베드+시청완료), `quiz`(객관식, 정답 선택 시에만 완료 가능), `google_form`(iframe 임베드+새 창 링크), `link`(외부 링크 새 탭+완료 버튼). `required:false`이면 "나중에" 스킵 가능
* **진행률 UI**: 화면 우상단에 "🎯 미션 진행률 X / Y" 배지를 동적으로 표시 (DOM 동적 생성이라 맵 HTML 수정 불필요)
* **진행 상태 저장**: localStorage 키 `ssambus_missions_done_<room>_<student>` (studentId는 멀티플레이어와 동일하게 `sessionStorage.ssambus_student_id` 공유) - 새로고침해도 유지, 별도 로그인 불필요
* **확장 시 참고**: 교사 대시보드(7단계)에서 미션을 추가/수정하려면 `missions` 테이블에 행을 쓰기만 하면 됨 (스키마는 `ssambus_missions_setup.sql` 참고). zone_id는 맵별로 `zone_A/zone_B/zone_C` 중 하나를 사용

\---

## Supabase 자동 일시정지 방지 (완료)

* **새 파일**: `.github/workflows/supabase-ping.yml` - GitHub Actions로 매일 00:00 UTC(한국시간 09:00)에 `missions` 테이블을 가볍게 조회(`select=id&limit=1`)해 Supabase 프로젝트를 활성 상태로 유지. Actions 탭에서 `workflow_dispatch`로 수동 실행도 가능
* **적용 방법**: GitHub Pages 배포 시 이 파일을 그대로 저장소에 올리면(웹 UI 업로드 시 파일명/경로를 `.github/workflows/supabase-ping.yml`로 입력하면 폴더가 자동 생성됨) 별도 설정 없이 동작. 저장소가 Private인 경우에도 스케줄된 워크플로는 정상 동작(무료 플랜 한도 내)
* **참고**: anon key가 워크플로 파일에 그대로 포함되어 있으나, 클라이언트 JS(`ssambus_supabase_config.js`)에도 이미 공개되어 있는 값이며 RLS로 보호되므로 문제 없음

\---

## 교사 대시보드 (1차 완료)

* **새 파일**: `ssambus_teacher_dashboard.html` - 교사용 미션 관리 화면. 접속 코드(`ACCESS_CODE`, 기본값 `ssambus2026`, 파일 상단에서 변경 가능) 입력 후 6개 맵 × 구역(zone_A/B/C)별 미션 목록을 보고 추가/수정/삭제 가능
* 미션 유형(유튜브/퀴즈/구글설문/링크)에 맞춰 입력폼이 바뀌며, 퀴즈는 질문+보기4개+정답을 직접 입력
* 저장/삭제는 Supabase `missions` 테이블에 직접 반영되어, 학생 화면(`ssambus_missions.js`)에 즉시 적용됨
* **새 파일**: `ssambus_teacher_dashboard_setup.sql` - missions 테이블에 쓰기(insert/update/delete) RLS 정책 추가. 대시보드 사용 전 Supabase SQL Editor에서 1회 실행 필요
* **회원가입 불필요**: Supabase Auth 없이 화면 단 접속 코드로만 접근 제한 (anon key는 이미 공개된 값이라 RLS 정책상 누구나 쓰기 가능 - 학교 수업용으로는 충분하나 더 엄격한 보안이 필요하면 추후 Auth로 교체)
* 수업방은 1개(`room_id='demo'`)로 고정. 추후 여러 수업방이 필요하면 ROOM_ID를 동적으로 바꾸는 구조로 확장 가능

---

## 미션 구역 8개로 확장 (완료)

* 맵별 미션 구역을 기존 3개(zone_A/B/C)에서 **8개(zone_A~zone_H)**로 확장. `ssambus_missions.js`의 `MISSION_ZONES`와 `ssambus_teacher_dashboard.html`의 `MAPS`를 함께 갱신
* 각 맵의 그리드 구조를 분석해 구역을 분할(겹침/공백 없이 전체 영역 커버, 현대도시는 동서 도로 일부만 구역 미지정):
  - 일반교실(16행): 2행씩 8개 (칠판·TV 앞 → 책상 1~5열 → 게시판/사물함)
  - 도서관(21행): 입구·대출대 → 서가 1·2열 → 중앙통로 → 열람석 1~5열
  - 운동장(32열): 4열씩 서→동 8개 (펜스·골대 → 놀이기구 → 잔디 → 중앙광장×2 → ...)
  - 체육관(28열): 무대·관람석 → 코트 좌/중/우 → 관람석·보관대
  - 현대도시(28열): 3블록×남/북 6개 + 사거리(횡단보도) 2개
  - 자연숲(28열x14행): 4x2 격자 8개 (입구·서북 → 연못가 → 깊은 숲 등)
* 교사 대시보드에서 8개 구역별로 미션을 추가/수정/삭제 가능 (구역당 여러 개도 가능하지만 맵당 최대 8곳을 기본 단위로 제공)
* 기존 데모 미션(zone_A/zone_B 사용)은 새 구역 구조에서도 그대로 동작 (zone_A, zone_B id는 유지됨, 라벨만 변경)

---

## 교사별 수업(수업 코드) 분리 (완료)

* 기존에는 모든 교사가 `room_id='demo'`를 공유해 한 명이 미션을 바꾸면 전체에 영향을 줬음 → **교사별로 독립된 "수업 코드"**로 분리
* 교사 접속 코드(`ACCESS_CODE`) 입력 후, **"수업 선택" 화면**에서
  - **새 수업 만들기**: 영문/숫자 6자리 코드(예: `A3F9K2`)를 자동 생성해 그 코드로 수업방(`room_id`) 시작
  - **기존 수업 코드 입력**: 다른 기기에서 이전에 만든 수업을 코드로 다시 불러올 수 있음
  - 선택한 수업 코드는 브라우저(localStorage)에 저장되어 다음 접속 시 자동으로 이어짐. 상단 "수업 변경" 버튼으로 다른 수업으로 전환 가능
* 상단바 **"🔗 학생 초대 링크"** 버튼 → 6개 맵별로 `ssambus_map_XXX.html?room=수업코드` 형태의 링크를 모달로 보여주고 복사 가능. 이 링크를 학생에게 공유(또는 QR로 변환)하면 해당 수업의 미션만 받음
* 학생 측 맵 페이지(`ssambus_map_*.html`)와 `ssambus_missions.js`/`ssambus_realtime.js`는 이미 `?room=` 파라미터를 지원하고 있어(없으면 `demo`로 폴백) 별도 수정 불필요했음
* RLS 정책(`ssambus_teacher_dashboard_setup.sql`)이 모든 room_id에 대해 쓰기를 허용하므로 추가 SQL 변경 없이 동작

---

## 수업별 쓰기 권한 분리 (완료) - 다른 교사가 내 수업을 수정/삭제 못하게

* 수업 코드만으로는 "다른 교사가 같은 코드를 알면 내 미션을 수정/삭제할 수 있는" 문제가 있어, **익명 인증(Supabase Anonymous Sign-In)**으로 기기별 식별자를 부여
* `missions` 테이블에 `teacher_id`(uuid) 컬럼 추가, RLS를 "읽기는 누구나 / 쓰기(추가·수정·삭제)는 작성자 본인(teacher_id = auth.uid())만" 으로 변경
* **새 SQL 파일로 교체**: `ssambus_teacher_dashboard_setup.sql` (v2) - 기존에 v1을 실행했어도 이 파일을 다시 실행하면 정책이 새 버전으로 덮어써짐
* **⚠ 추가로 Supabase 대시보드에서 1회 설정 필요**: `Authentication > Sign In / Providers > Anonymous` 토글을 **ON**으로 켜야 함 (안 켜면 대시보드 진입 시 "인증 실패" 토스트가 뜨고 미션 저장이 안 됨)
* 다른 기기/교사가 같은 수업 코드로 들어와도, 본인이 작성하지 않은 미션은 카드에 "🔒 다른 기기에서 작성 (이 기기에서 수정/삭제 불가)"로 표시되고 수정/삭제 버튼이 비활성화됨
* **남은 한계**: 읽기(select)는 여전히 전체 허용이라, 개발자도구/API로 missions 테이블을 필터 없이 통째로 조회하면 다른 수업의 내용도 보일 수 있음. 완전 비공개가 필요하면 Edge Function 구조 도입 필요(추후 옵션)

---

## 배포 가이드 (8단계, GitHub Pages)

### 0) 새로 추가된 파일
* `index.html` - 사이트 첫 화면(랜딩 페이지). "교사용 대시보드" / "캐릭터 만들기·체험하기" 두 개 버튼만 있는 간단한 메뉴. 학생은 보통 교사가 보낸 초대 링크(QR)로 직접 맵에 입장하므로 이 페이지를 거치지 않아도 됨.

### 1) Supabase 사전 설정 (배포 전 1회, SQL Editor + 대시보드 화면)
배포 전에 반드시 아래 2가지를 먼저 끝내야 함. 안 하면 미션/대시보드가 정상 동작하지 않음.

1. Supabase 프로젝트 > **SQL Editor**에서 다음 파일들을 순서대로 실행
   - `ssambus_missions_setup.sql` (아직 실행 안 했다면 - missions 테이블 생성 + 데모 데이터)
   - `ssambus_teacher_dashboard_setup.sql` (v2 - teacher_id 컬럼 + RLS 정책, 이미 실행했다면 그대로 둬도 됨. 다시 실행해도 안전함)
2. Supabase 대시보드 > **Authentication > Sign In / Providers > Anonymous** 토글을 **ON**
   - 이걸 켜지 않으면 교사 대시보드 접속 시 "인증 실패" 토스트가 뜨고 미션 저장이 안 됨

### 2) GitHub Pages 배포 (웹 UI 업로드만 사용)
1. github.com에서 새 저장소(Repository) 생성 (예: `ssambus`) - Public으로 생성 (Private도 Pages 무료 사용 가능)
2. 저장소 메인 화면 > **Add file > Upload files**로 아래 파일들을 한 번에 드래그하여 업로드
   - `index.html`
   - `ssambus_characters.html`
   - `ssambus_character_render.js`
   - `ssambus_map_classroom.html`, `ssambus_map_library.html`, `ssambus_map_playground.html`, `ssambus_map_gym.html`, `ssambus_map_city.html`, `ssambus_map_forest.html`, `ssambus_map_artroom.html`, `ssambus_map_cafeteria.html`, `ssambus_map_computer.html`, `ssambus_map_health.html`, `ssambus_map_music.html`, `ssambus_map_science.html`, `ssambus_map_modum_classroom.html`, `ssambus_map_maze.html`, `ssambus_map_race.html`
   - `ssambus_missions.js`
   - `ssambus_realtime.js`
   - `ssambus_supabase_config.js` (Supabase URL/anon key 포함 - anon key는 공개되어도 되는 키이므로 그대로 업로드해도 됨)
   - `ssambus_teacher_dashboard.html`
   - (참고용 - 사이트 동작에는 필요 없지만 보관용으로 같이 올려도 무방) `ssambus_missions_setup.sql`, `ssambus_teacher_dashboard_setup.sql`, `ssambus_handover.md`
3. `.github/workflows/supabase-ping.yml`도 업로드
   - Upload files 화면에서 파일명 입력칸에 경로를 포함해서 `.github/workflows/supabase-ping.yml`로 지정하면 폴더가 자동 생성됨
4. 커밋 완료 후, 저장소 **Settings > Pages**로 이동
   - Source: **Deploy from a branch**
   - Branch: **main** / 폴더: **/ (root)** 선택 후 저장
5. 1~2분 후 `https://<깃허브계정>.github.io/<저장소이름>/` 주소로 접속해 `index.html`이 보이면 배포 완료

### 3) 배포 후 동작 확인 체크리스트
1. 배포된 주소로 접속 → `index.html` 랜딩 페이지가 보이는지 확인
2. "교사용 대시보드" 클릭 → 접속 코드(`ssam`) 입력 → "새 수업 만들기"로 수업 코드 생성 확인
3. 임의의 맵에 미션 1개를 추가 → "🔗 학생 초대 링크" 모달에서 해당 맵 링크 복사
4. 복사한 링크를 새 탭(또는 다른 브라우저/시크릿창)에서 열어 입장 → 해당 구역으로 이동 시 방금 추가한 미션이 뜨는지 확인
5. (2명 이상 테스트 가능하면) 같은 맵에 두 명이 들어가서 서로의 캐릭터가 실시간으로 움직이는지 확인 (Realtime 동작 확인)

### 4) 학생용 QR 코드 안내 (선택)
이 프로젝트에는 QR 코드 생성 기능이 포함되어 있지 않음. 교사가 "🔗 학생 초대 링크" 모달에서 복사한 URL을 외부 QR 생성 사이트(예: 네이버 'QR코드 생성' 검색 결과 등 신뢰할 수 있는 무료 도구)에 붙여넣어 QR 이미지를 만들고, 학생들에게 화면 공유/인쇄물로 안내하면 됨.

---

## 추가 기능 완료 (2026-06-15)

이번 세션에서 추가로 완료한 작업:

* **교사용 "실시간 맵 보기" (관전)**: 6개 맵 파일 모두에 `?teacherView=1` 모드 추가 - 자기 캐릭터/조작 UI를 숨기고 맵 전체를 보여줌(`updateCamera()`가 `.stage-wrap`을 맵 전체 크기로 표시). 교사 대시보드에 "🗺️ 실시간 맵 보기" 버튼 추가 → 맵 탭 전환 + 축소된 iframe(`MAP_FILES[mapId]+'?room='+ROOM_ID+'&teacherView=1'`) + 접속 인원(Presence 기반) 표시
* **터치 스와이프 이동**: 모든 맵에서 `.stage-wrap`에 `touchstart/move/end` 기반 스와이프(좌/우/상/하, 30px 임계값)로 `move(dir)` 호출 추가. 기존 방향키/버튼 이동은 그대로 유지
* **캐릭터 선택 강제 버그 수정**: 처음 접속(localStorage에 `ssambus_player_character` 없음)한 학생은 맵 진입 전 자동으로 `ssambus_characters.html`로 리다이렉트(`location.replace`, 기존 쿼리 + `map=` 파라미터 보존) → 캐릭터를 고른 뒤 원래 가려던 맵으로 입장. `__NEEDS_CHAR_SETUP` 플래그로 처리
* **맵 채팅 (말풍선)**: `ssambus_realtime.js`에 Supabase Realtime **broadcast** 채널(`chat` 이벤트) 추가. 화면 하단에 채팅 입력창을 자동 주입(`__rtBuildChatUI()`), 전송 시 `#player`/`.remote-player` 위에 `.chat-bubble`로 4초간 표시(`__rtShowBubble()`). teacherView(실시간 맵 보기)에서도 학생 말풍선이 보임
* **교사 맵 참가 기능**: 교사 대시보드에 "🧑‍🏫 맵 참가하기" 버튼 + 맵 선택 모달 추가. 클릭 시 새 탭에서 `MAP_FILES[mapId]?room=<ROOM_ID>&nickname=선생님`을 일반 참가자 모드로 열어, 캐릭터 선택("교사" 탭) 후 학생들과 함께 이동·채팅 가능
* `index.html` 사용설명서에 위 기능들 모두 반영(7~9번 항목, 4번 항목에 스와이프/캐릭터 리다이렉트 추가)

\---

## 추가 기능 완료 (2026-06-16)

### 채팅 가시성 설정 (전체 / 근접 / 금지)

* **`ssambus_realtime.js`**: `__rtChatMode` 변수(`'all'|'proximity'|'disabled'`) 추가. 교사 대시보드에서 broadcast(`chat_setting` 이벤트)로 변경 시 모든 학생에게 즉시 반영
* **근접 판정**: 발신자 presence 위치와 내 `pos`의 유클리드 거리 ≤ `__rtProximityThreshold`(5타일) 이내만 수신 (`__rtIsNearby()`)
* **채팅 금지**: `disabled`이면 채팅 입력창 숨김 + 하단에 빨간색 "선생님이 채팅을 일시 중지했습니다." 배너 표시 (`__rtApplyChatMode()`)
* **교사 대시보드**: 상단 토글 버튼(전체 공개 → 근접만 → 채팅 금지 → 반복 순환) 추가 → 클릭 시 broadcast
* **초기값 로드**: 학생 맵 입장 시 `room_settings.chat_mode`를 Supabase에서 읽어 채팅 모드 초기화 (`__rtLoadChatMode()`)
* **SQL**: `room_settings` 테이블에 `chat_mode text not null default 'all'` 컬럼 추가 (`ssambus_room_settings_setup.sql` 하단)

---

### 다양한 미션 타입 추가

기존 `youtube/quiz/google_form/link` 외 4종 추가:

| 타입 | 설명 |
|-|-|
| `image_quiz` | 이미지 URL + 질문 + 4지선다. 이미지가 모달 상단에 표시됨 |
| `short_answer` | 주관식 단답형. 정답(텍스트)을 입력하면 대소문자 무시 비교 후 완료 처리 |
| `discussion` | 토론/의견 제시 미션. 100자 이상 입력 시 완료. 정답 없이 자유 서술 |
| `ox_quiz` | O/X 2지선다 퀴즈. 이미지 첨부 가능 |

* **교사 대시보드**: 미션 타입 선택 시 해당 입력 폼이 동적으로 바뀜 (`onTypeChange()`)
* **`ssambus_missions.js`**: 타입별 모달 렌더링 로직 추가 (`__msRenderMission()`)
* **SQL**: `missions.type` CHECK 제약에 4개 타입 추가 (`ssambus_missions_setup.sql`)

---

### PDF 미션 자동 생성 (Groq API · Qwen3-32B)

* **교사 대시보드 상단 버튼**: "📄 PDF로 미션 생성" → PDF 업로드 모달 열림
* **PDF 텍스트 추출**: `pdf.js`(v3.11.174 CDN) 브라우저 사이드에서 페이지별 텍스트 추출
* **AI 미션 생성**: Groq API의 `qwen/qwen3-32b` 모델로 추출 텍스트 전송 → 미션 JSON 배열 응답. 프롬프트 앞에 `/no_think` 접두사, 응답에서 `<think>` 블록 제거 처리
* **미리보기 & 저장**: 생성된 미션 카드 미리보기(수정 가능) 후 "저장" 클릭 시 현재 수업의 선택 맵/구역에 일괄 등록 (`savePdfMissions()`)
* **구현 위치**: `ssambus_teacher_dashboard.html` 내 인라인 JS (별도 파일 없음)
* **API 키**: 대시보드 상단 `GROQ_API_KEY` 상수에 직접 입력 (교사 기기에서만 사용, 배포용 파일에서는 실제 키로 교체 필요)

---

### 맵 에디터 (교사용 가구 배치)

교사가 각 맵에 가구를 직접 배치하고 미션 발동 위치로 활용하는 에디터.

#### 가구 배치 (에디터 모달)
* **교사 대시보드 상단 "🪑 맵 에디터" 버튼** → 맵별 탭 + 팔레트 + 캔버스 에디터 모달
* **맵별 전용 팔레트** - 맵 성격에 맞는 가구만 표시:

| 맵 | 가구 |
|-|-|
| 교실 / 도서관 | 책상, 화분, 책장, 칸막이 |
| 운동장 | 화분/나무, 벤치, 바위, 꽃밭 |
| 체육관 | 책상, 칸막이, 운동매트, 운동기구(덤벨) |
| 현대도시 | 칸막이, 벤치, 가로수, 쓰레기통 |
| 자연숲 | 화분, 나무, 바위, 꽃밭, 버섯 |

* **캔버스 조작**: 좌클릭/드래그로 배치, 우클릭 또는 지우개 팔레트로 삭제. 보행 가능 타일에만 배치 허용
* **충돌 처리**: 배치된 가구 좌표에 `grid[r][c] = 99` 설정 → 기존 WALKABLE 체크가 자동으로 이동 차단
* **저장**: "💾 저장" 클릭 시 `room_settings.map_tiles` (JSONB)에 `{"classroom":{"2,3":20, ...}}` 형태로 Supabase에 upsert
* **SQL**: `room_settings` 테이블에 `map_tiles jsonb` 컬럼 추가 (`ssambus_room_settings_setup.sql` 하단)

#### 픽셀 아트 가구 렌더링
* **교사 에디터 캔버스**: 팔레트 버튼에 28×28px 캔버스 미리보기, 에디터 그리드에 픽셀 아트로 가구 표시 (`__edCTile(ctx, x, y, ts, type)` + `__edCT20~37()`)
* **학생 맵**: `__msLoadAndApplyOverlays()` — 이모지 div 방식을 완전 제거, `<canvas id="map">` 위에 픽셀 아트 직접 드로잉 (`__msCTile()` + `__msCT20~37()`). `drawMap()` 실행 후 동일 ctx에 겹쳐 그림

#### 가구 타입 번호 체계
| 번호 | 공통 | 번호 | 맵 특화 |
|-|-|-|-|
| 20 | 책상/가구 | 30 | 벤치 |
| 21 | 화분 | 31 | 나무/가로수 |
| 22 | 책장 | 32 | 바위 |
| 23 | 칸막이 | 33 | 꽃밭 |
| — | — | 34 | 운동매트 |
| — | — | 35 | 운동기구(덤벨) |
| — | — | 36 | 쓰레기통 |
| — | — | 37 | 버섯 |

#### A교사 vs B교사 격리
`room_settings.map_tiles`는 `room_id` 단위로 저장. A교사와 B교사는 각자 다른 수업 코드를 사용하므로 완전히 격리됨. 학생이 교사의 배치 가구를 봐야 하므로 localStorage가 아닌 Supabase 저장 방식을 유지.

#### 이전 수업 맵 불러오기 (완료, 2026-06-19)
* 맵 에디터 모달 하단 **"📂 이전 수업 불러오기"** 버튼 클릭 → `getRoomList()` 기반 수업 목록 모달 표시
* 수업 선택 시 Supabase `room_settings.map_tiles`를 조회해 `__edOverlays` 전체 교체
* `switchEditorMap(__edMapId)` 재호출로 캔버스 즉시 반영
* 실제 DB 반영은 기존 "💾 저장" 버튼을 눌러야 완료 (토스트로 안내)

---

### 미션 트리거 타일 (타일 직접 지정 발동)

기존 구역(zone) 진입 방식 외 **특정 타일을 직접 밟을 때 미션이 발동**되는 방식 추가.

* **미션 편집 모달**: "📍 미션 발동 위치" 섹션 추가. 라디오 버튼으로 "구역(zone)으로 발동" / "타일 직접 지정" 선택
* **타일 직접 지정 UI**: 현재 맵 미리보기 캔버스 표시 → 클릭으로 타일 선택/해제 (토글). 선택된 타일은 오렌지 강조 테두리 + ✓ 뱃지로 표시. 맵 에디터에서 배치한 가구도 미리보기에 픽셀 아트로 표시됨
* **저장**: `missions.trigger_tiles` JSONB 컬럼에 `[{"r":2,"c":3},{"r":2,"c":4}]` 형태로 저장
* **발동 우선순위**: `checkZoneOnMove(pos)`에서 tile 트리거를 zone보다 먼저 체크. `trigger_tiles`가 있는 미션은 zone 기반 판정에서 제외됨
* **현재 zone 추적**: 타일 위에 서 있는 동안 `__msCurrentZone = '__tile_' + missionId`로 설정해 재발동 방지
* **SQL**: `missions` 테이블에 `trigger_tiles jsonb` 컬럼 추가 (`ssambus_missions_setup.sql` 하단)

---

## SQL 변경 사항 누적 (실행 필요 항목)

아래 두 SQL은 **최초 1회** Supabase SQL Editor에서 실행. `if not exists`이므로 재실행해도 안전.

```sql
-- room_settings 에 채팅 모드 + 맵 타일 컬럼 추가
alter table room_settings add column if not exists chat_mode text not null default 'all';
alter table room_settings add column if not exists map_tiles jsonb;

-- missions 에 트리거 타일 컬럼 추가
alter table missions add column if not exists trigger_tiles jsonb;
```

각 파일(`ssambus_room_settings_setup.sql`, `ssambus_missions_setup.sql`) 하단에 이미 포함되어 있음.

---

## 추가 기능 완료 (2026-06-18~19)

### 학생 초대 링크 UX 개선
* **팝업 개편**: "🔗 학생 초대 링크" 버튼 클릭 시 **시작 맵 1개** 링크만 표시(혼란 방지) + QR 코드 즉시 렌더링(버튼 클릭 불필요)
* **QR 전체화면**: "⛶ 전체화면으로 보기" 버튼 → `#qrFullscreen` 오버레이(z-index:9999)로 브라우저 전체 확대. ESC 키로 닫기
* **수업코드 복사 버튼**: 학생 초대 모달에서 제거 → 상단 헤더 수업코드 옆으로 이동 (`id="roomCopyBtn"`)

### AI 자동문제 생성 개선
* **"추가할 구역" 셀렉터 제거**: 미션 카드마다 구역 드롭다운이 있어 dead code였던 전체 구역 셀렉터 삭제
* **타입 셀렉터 → 읽기 전용 뱃지**: 생성 시 결정된 문제 형식을 카드에서 변경하면 데이터 구조가 깨질 수 있어 수정 불가 뱃지로 고정. 힌트 문구("형식 변경은 카드별 드롭다운으로") 추가
* **✕ 버튼**: 각 미션 카드에 제외 버튼 추가. 5문제 중 맘에 드는 것만 선택해 저장 가능 (`data-q-idx` 로 원본 인덱스 추적)

### 이전 수업 맵 불러오기 (완료)
* 맵 에디터 모달 하단 **"📂 이전 수업 불러오기"** 버튼 → `getRoomList()`에서 현재 수업 제외 목록 모달 표시
* 수업 선택 시 Supabase `room_settings.map_tiles` 조회 → `__edOverlays` 전체 교체 → `switchEditorMap()` 재렌더
* 실제 저장은 기존 "💾 저장" 버튼으로 확정 (토스트 안내)

### 소감 입력 + 엑셀 반영 (완료)
* **마지막 맵 완료 팝업**에만 소감 입력 텍스트에어리어 추가 (중간 맵 팝업은 기존 "확인" 버튼만 유지)
* "제출하고 닫기" / "건너뛰기" 버튼 분리. 소감 입력 시 `mission_progress` 테이블에 `mission_id='__reflection__'`로 저장
* **엑셀 "소감 모음" 시트**: "📊 진행현황 다운로드"에 소감 데이터 포함. 닉네임·소감 내용·제출 시각 3컬럼, 교대 줄 색상 스타일 적용

### 캐릭터 이동 부드럽게 (`ssambus_realtime.js` 단독 수정)
* **카메라 transition 추가**: `.stage { transition: transform .12s linear }` — 카메라와 플레이어가 동기화돼 슬라이드 이동
* **이동 쿨다운 패치** (`__rtPatchMoveWithCooldown`): 전역 `move()` 함수를 125ms 쿨다운으로 래핑. OS 키 리피트(~30ms)보다 느리게 제한해 CSS 전환이 끊기지 않음
* **원격 캐릭터 개선**: 전송 간격 150ms → 100ms(쿨다운 이후 모든 이동이 전송됨), transition `.22s ease-out`으로 2타일 점프도 부드럽게 보간
* **최초 등장 시 즉시 배치**: 신규 원격 플레이어는 `transition:none`으로 즉시 위치 배치 후 다음 프레임에서 전환 복원 (코너에서 슬라이드 인 현상 제거)

### 기타
* 구역 명칭 수정: `ssambus_missions.js` + `ssambus_teacher_dashboard.html` MAPS — 교실 zone_A `'칠판·TV 앞·교사 책상'`, zone_B `'앞쪽 통로·앞문'`, 자연숲 zone_D `'북동쪽 깊은 숲'`
* 데모 미션 QR 학생 차단 확인: `if(__msRoomId === 'demo') return DEMO_MISSIONS` 분기로 `?room=` 파라미터 있는 학생에게는 데모 미션이 실행되지 않음 (기존 구현 정상 확인)

---

## 추가 기능 완료 (2026-06-22~28)

### 애니 캐릭터 26종 (`ssambus_character_render.js`, 2026-06-22)
* **귀멸의 칼날** 4종: 탄지로, 네즈코, 이노스케, 젠이츠 (하오리 패턴 텍스처, 대나무 재갈, 멧돼지 마스크 등 캐릭터 전용 액세서리 포함)
* **하이큐·원피스** 2종: 히나타(배구 유니폼), 루피(밀짚모자+조끼)
* **디즈니** 6종: 엘사, 모아나, 백설공주, 라푼젤, 신데렐라, 뮬란
* **인기 애니** 14종: 나루토, 손오공, 세일러문, 키리토, 에렌, 레비, 고죠, 이타도리, 데쿠, 코난, 짱구, 이치고, 조로, 아스나
* 캐릭터 캐릭터 선택 화면(`ssambus_characters.html`) '애니' 탭에 통합. 교사 대시보드에서 수업 참여자 비율 기준으로 해금 임계값 설정 가능(`char_unlock_threshold`)
* **realtime preset 버그픽스**: 애니 캐릭터 외형이 다른 플레이어 화면에도 올바르게 렌더링

### 멀티타일 가구 시스템 + 캐릭터 커스터마이징 개선 (2026-06-23)
* 맵 에디터에서 **2×2 크기 가구**(교실 책상, 피아노, 드럼 세트, 침대, PC 등) 배치 지원 — 단일 타일로 표현하던 가구를 실제 비율에 맞게 확장
* 캐릭터 **눈 모양 커스터마이징** 추가 (일반/큰눈/반달/점눈 등)
* 캐릭터 **목 길이 단축** — 머리와 몸통 사이 공백 줄임
* `loadMapOverlays` 위치 버그 수정 — 맵 진입 시 가구 타일이 누락되는 문제 해결

### 신규 맵 2종 (2026-06-24~25)
* **미로 맵** (`ssambus_map_maze.html`): Z자 경로 + 8개 막다른 길 + 60×60 그리드. 캐릭터 겹침 허용(통로가 좁아 막힘 방지). 미션 트리거 타일 기반 퀴즈 구조
* **경주 트랙 맵** (`ssambus_map_race.html`): 타원형 트랙 + 실시간 진행 현황 UI(Q8 기준 순위 표시). 겹침 허용. type 98 투명 장애물로 트랙 경계 제한

### 교사 대시보드 개선 (2026-06-24~25)
* 교사 접속 코드 **`ssam`으로 변경** (기존 `ssambus2026`)
* 모든 페이지(index, 맵, 대시보드, 캐릭터 화면) **제작자 크레딧** 우하단 고정 표시
* 실시간 진행현황 **Q8 미션 기반 완료 순위** 패널 추가 (경주 트랙용)
* **욕설 필터** 추가: 채팅 전송 시 금칙어 감지 → 전송 차단 + 경고 토스트. 기본 한/영 금칙어 목록 내장
* 맵 에디터에 **type 98 투명 장애물** 배치 지원 (미로/경주 트랙용). 학생 화면에서는 투명, 교사 뷰에서는 빨간 X 표시

### 모바일 호환 개선 (2026-06-25~26)
* **채팅 후 화면 축소 버그 수정**: iOS Safari에서 채팅 입력창 포커스 → blur 후 viewport 축소 현상 → viewport 메타 동적 주입 + 스크롤 초기화로 해결
* 모든 맵 파일 터치/스와이프 이동 지원 완비

### 애니 캐릭터 해금 강제 적용 (2026-06-26)
* `__rtLoadRoomSettings` 수신 시 `char_unlock_threshold`가 있으면 즉시 캐릭터 선택 화면에 반영 (새로고침 없이 실시간 적용)

### 멀티플레이어 안정성 대폭 개선 (2026-06-27)
* **캐릭터 방향 버그 수정**: 다른 플레이어 화면에서 항상 오른쪽만 바라보던 문제 → `facingRight` 플래그를 broadcast에 포함해 수정
* **캐릭터 깜빡임 수정**: 다른 플레이어 캐릭터가 반복적으로 사라졌다 나타나던 문제 → `__rtAvatarState` 캐시 도입, 실제 외형 변경 시에만 SVG 재생성
* **Supabase 무한 재연결 루프 수정**: `removeChannel()` → CLOSED 이벤트 → 재연결 예약 → 무한루프 패턴 차단. `__rtChannel = null` 선행 + 클로저 캡처로 구 채널 콜백 조기 종료
* **`ClientPresenceRateLimitReached` 해결**: 위치/상태 전송을 `channel.track()` → `channel.send(broadcast)` 방식으로 전환. `track()`은 접속 1회만 호출 (`__rtTrackPresence`). 이동 딜레이 개선 + 분당 `track()` 호출 수 400~600회 → 1~2회로 감소

### 버그픽스 (2026-06-28)
* **`__rtIsTileOccupied` stale presence 버그**: 교실 입장 후 r:6,c:30이 이유 없이 막히던 문제 + 캐릭터 겹침 → `presenceState()` 루프를 `__rtRemotePos`(broadcast 기반 실시간 캐시) 루프로 교체
* **type 98 타일 교사 뷰 시각화**: 맵 에디터로 배치한 투명 장애물을 교사가 `?teacherView=1`로 접속하면 빨간 X로 확인 가능
* **욕설필터 기본단어 UI**: 교사 대시보드 욕설필터 모달에 기본 내장 금칙어 목록을 회색 태그로 표시
* **캐릭터 LEFT view 손 위치 버그**: 옆모습에서 손이 엉덩이에 떠 보이던 문제 → SVG 렌더링 순서 수정(back arm + hand를 body rect 이전으로 이동). 영향 캐릭터: `_studentBody`(남학생), `_tanjiroBody`, `_zenitsuBody`, `_nezukoBody`, `_inosukeBody`, `_hinataBody`, `_luffyBody`. Group B(Disney 6 + 일반 애니 14)는 구조상 문제없어 수정 불필요

### 교사 참가자 미션 면제 (`ssambus_missions.js`, 2026-06-28)
* "맵 참가하기"(`teacherMode=1`)로 입장한 교사는 구역/타일 진입 시 미션 팝업이 뜨지 않고, 출구에서 차단되지 않으며, 필수 미션 미완료 상태에서도 다음 맵으로 자동 이동 가능
* 수정 위치: `checkZoneOnMove` (미션 발동 생략), `__msBlockExit` (출구 차단 생략), `__msCheckExit` (다음 맵 이동 허용)

---

## 현재 완성된 맵 목록 (15종)

| id | 파일명 | 특징 |
|-|-|-|
| classroom | `ssambus_map_classroom.html` | 일반교실, 60×60, 48px |
| library | `ssambus_map_library.html` | 도서관, 세로 카메라 추적 |
| playground | `ssambus_map_playground.html` | 운동장, 가로 확장 |
| gym | `ssambus_map_gym.html` | 체육관, 가로 확장 |
| city | `ssambus_map_city.html` | 현대도시, 십자도로 구조 |
| forest | `ssambus_map_forest.html` | 자연숲, 연못+통나무다리 |
| artroom | `ssambus_map_artroom.html` | 미술실 |
| cafeteria | `ssambus_map_cafeteria.html` | 급식실 |
| computer | `ssambus_map_computer.html` | 컴퓨터실 |
| health | `ssambus_map_health.html` | 보건실 |
| music | `ssambus_map_music.html` | 음악실 |
| science | `ssambus_map_science.html` | 과학실 |
| modum_classroom | `ssambus_map_modum_classroom.html` | 모둠교실(그룹 활동용) |
| maze | `ssambus_map_maze.html` | 미로(겹침 허용, Z자 경로) |
| race | `ssambus_map_race.html` | 경주 트랙(실시간 순위 UI) |

---

## 다음 작업

현재 구현 완료 목록: 맵 15종 · 애니 캐릭터 26종 · 맵 에디터(가구 배치·픽셀 아트·팔레트) · 미션 트리거 타일 · 채팅 모드(전체/근접/금지) · 욕설 필터 · 다양한 미션 타입(youtube/quiz/google_form/link/image_quiz/short_answer/discussion/ox_quiz) · PDF 미션 자동 생성(Groq API) · 이전 수업 맵 불러오기 · 소감 입력 + 엑셀 반영 · 캐릭터 부드러운 이동 · 실시간 완료 순위 · 교사 참가자 미션 면제.

남은 작업(모두 선택 사항):

* (선택) **새 맵 추가**: 교무실, 한강공원, 동네마을, 일반 길거리 — 새 맵 추가 가이드 섹션 참고
* (선택) **미션 전체 완료 화면 고도화**: 전체 클리어 시 애니메이션 연출 강화, 교사 대시보드 실시간 동기화

\---

## 새 맵 추가 가이드 (체크리스트)

새 맵(예: 음악실/미술실/컴퓨터실/교무실 = 실내형, 한강공원/동네마을/일반 길거리 = 야외형) 하나를 추가할 때 수정해야 하는 파일과 위치를 정리한 체크리스트. 실내형은 `ssambus_map_classroom.html` 또는 `ssambus_map_gym.html`을, 야외형은 `ssambus_map_city.html` 또는 `ssambus_map_forest.html`을 복사해서 시작하는 것을 추천(가로로 긴 야외형은 `VIEW_W=768,VIEW_H=672` 카메라 추적 패턴 적용됨).

새 맵의 내부 id를 `<id>`(예: `music`, `art`, `computer`, `teacher_office`, `hanriver`, `village`, `street`)라고 할 때:

### 1) `ssambus_map_<id>.html` (새로 생성, 기존 맵 복사 후 수정)
* `COLS`/`ROWS`/`TS`, 배경 `grid` 배열, `WALKABLE` Set, `drawMap()`의 타일 그리기 로직을 새 맵 디자인에 맞게 교체
* 그대로 유지(기존 맵과 동일하게 복붙)해야 하는 공용 블록:
  - `TEACHER_VIEW` 체크 + body 스타일/legend 숨김 블록
  - `__NEEDS_CHAR_SETUP` 리다이렉트 블록 - `__params.set('map', 'ssambus_map_<id>.html')`로 파일명만 변경
  - `updateCamera()` (맵이 화면보다 크면 카메라 추적 추가, `VIEW_W`/`VIEW_H` 설정)
  - `placePlayer()` 안의 `if(TEACHER_VIEW) el.style.display='none'`
  - keydown 리스너의 `if(TEACHER_VIEW) return;`
  - 터치 스와이프 블록 (`.stage-wrap`에 touchstart/move/end)
  - `<head>`의 Supabase config + `ssambus_realtime.js` + `ssambus_missions.js` 로드
  - 파일 끝 init 블록:
    ```js
    if(!__NEEDS_CHAR_SETUP){
      renderPlayer();
      placePlayer();
      initRealtime('<id>');
      if(!TEACHER_VIEW) initMissionSystem('<id>');
    }
    ```
* 새로 정해야 하는 것: 플레이어 시작 위치(`pos`), 출입구(문/게이트) 칸 좌표, `.stage-wrap` 크기(`width`/`height`, 화면보다 크면 `overflow:hidden`)

### 2) `ssambus_missions.js`
* `MISSION_ZONES.<id>`: 맵을 8개 구역(zone_A~H)으로 분할해 `{id,label,r0,c0,r1,c1}` 8개 추가 (겹침/공백 없이 전체 영역 커버)
* `EXIT_ZONES.<id>`: 출입구 칸 좌표 추가 (`[{r0,c0,r1,c1}, ...]`)
* `MAP_FILES.<id>` / `MAP_LABELS.<id>` 추가
* `MAP_ORDER_DEFAULT`에 `<id>` 추가 (학생 진행 순서 기본값에 포함시킬지 결정)
* (선택) `DEMO_MISSIONS.<id>`에 데모 미션 1~2개 추가 - 교사가 아직 미션을 등록하지 않았을 때 표시됨

### 3) `ssambus_teacher_dashboard.html`
* `MAP_FILES`에 `<id>:'ssambus_map_<id>.html'` 추가
* `MAP_CANVAS_SIZE`에 `<id>:{w:..., h:...}` 추가 (실시간 맵 보기 축소 표시용, 맵 HTML의 `COLS*TS`/`ROWS*TS`와 동일하게)
* `MAPS` 배열에 `{id:'<id>', label:'...', zones:[ {id:'zone_A',label:'...'}, ... 8개 ]}` 추가 (`ssambus_missions.js`의 `MISSION_ZONES.<id>` 라벨과 맞추기)
* "🚪 맵 이동 순서", "🗺️ 실시간 맵 보기", "🧑‍🏫 맵 참가하기" 모달은 모두 `MAPS`/`MAP_FILES`/`MAP_CANVAS_SIZE` 기반으로 자동 동작하므로 추가 수정 불필요

### 4) `index.html`
* "2. 교사용 대시보드 사용법" 항목의 맵 목록(일반교실/도서관/운동장/체육관/현대도시/자연숲)에 새 맵 이름 추가

### 5) 배포 시
* "배포 가이드 > 2) GitHub Pages 배포" 업로드 파일 목록에 `ssambus_map_<id>.html` 추가

\---

## 개발 원칙 (히라메키 스타일)

* GitHub 배포는 항상 웹 UI 업로드 (터미널 명령어 사용 안 함)
* 파일은 완전 교체 방식 (부분 수정 지양)
* 작업 전 반드시 최신 파일 업로드 후 진행
* 한국어 UI 전면 적용
* 완성도 높은 결과물을 처음부터 제시 (수정 최소화)
* 자유도와 완벽함을 추구해. 되도록 결과물을 완성도있게 제시해줘. 
* 수정을 최소화하게 해줘. 
* 세션에서 토큰이 90%이상 소모하였다면, 작업을 이어서 할 수 있도록 인수인계 파일을 갱신 및 생성해.

