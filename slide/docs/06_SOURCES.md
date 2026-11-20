# 06. 확인된 사실 · 출처 · 재확인 목록

확인일은 모두 **2026-11-20**. 외부 서비스는 자주 바뀌므로, 구현·배포 직전에 '재확인' 표시 항목을 공식 문서로 다시 확인한다.
등급: **공식** = 서비스 회사 문서·공지 / **도구** = Claude 세션에 연결된 커넥터 도구 설명 / **제3자** = 언론·블로그 (공식으로 재확인 필요)

## 1. 스킬

| 사실 | 등급 | 출처 |
|---|---|---|
| Claude 스킬은 Free·Pro·Max·Team·Enterprise 플랜에서 쓸 수 있고, 코드 실행이 켜져 있어야 한다 | 공식 | https://support.claude.com/en/articles/12512176-what-are-skills |
| Claude 개인 플랜은 설정 → 기능에서 '코드 실행 및 파일 생성'(새 화면 이름 Create and edit files)을 켠다 | 공식 | https://support.claude.com/en/articles/12512180-use-skills-in-claude |
| Claude 업로드: Customize > Skills → + → Create skill → Upload a skill → 스킬 폴더가 든 ZIP | 공식 | https://support.claude.com/en/articles/12512180-get-started-with-claude-skills |
| Claude 업로드 실패 원인: ZIP 크기 초과, 폴더 이름≠스킬 이름, skill.md 없음, 이름·설명의 잘못된 문자 | 공식 | https://support.claude.com/en/articles/12512180-how-to-create-custom-skills |
| name: 최대 64자, 영어 소문자·숫자·하이픈만, XML 태그 금지, 'anthropic'·'claude' 금지 / description: 비어 있으면 안 됨, 최대 1,024자, XML 태그 금지 / SKILL.md 본문 500줄 이하 권장 | 공식 | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices |
| 하이픈으로 시작·끝나거나 연속(--) 금지, 폴더 이름과 name 일치 (Agent Skills 표준) | 공식 | https://agentskills.io/specification (Gemini Enterprise 문서도 같은 규칙: https://docs.cloud.google.com/gemini/enterprise/docs/skills) |
| ChatGPT: Skills → Create → Upload from your computer로 스킬 업로드 | 공식 | https://help.openai.com/en/articles/20001066 |
| Gemini 스킬은 SKILL.md 표준 기반이라 다른 플랫폼에서 만든 스킬을 가져올 수 있다 | 공식 | https://workspaceupdates.googleblog.com/2026/09/skills-gemini-app-workspace.html |
| Gemini 앱 스킬: 2026-10-13부터 순차 배포, 11월 중순 완료 예정, 개인 Google 계정 포함 | 공식 | https://workspaceupdates.googleblog.com/2026/10/an-update-on-launch-of-skills-in-gemini-app-and-workspace.html |
| Gemini 업로드: SKILL.md 파일, 또는 SKILL.md가 최상위 폴더에 있는 폴더·ZIP. 모바일 앱·Mac 앱·웹에서 스킬 사용 | 공식 | https://support.google.com/gemini?p=pn_skills |
| Gemini 스킬 이름은 소문자+하이픈, 폴더로 올릴 때 폴더 이름=스킬 이름. 참고 파일로 텍스트·PDF·이미지 가능 | 공식 | https://support.google.com/gemini/answer/18560919 |
| Gemini 앱 스킬 공유 기능 (2026-11-16) | 공식 | https://workspaceupdates.googleblog.com/2026/11/share-skills-add-files-from-Drive-Notebook-Photos-to-skills-Gemini-app.html |

## 2. 커넥터·연결 앱

| 사실 | 등급 | 출처 |
|---|---|---|
| Claude 웹 커넥터는 모든 사용자(Claude, 데스크톱, 모바일)가 쓸 수 있다 | 공식 | https://support.claude.com/en/articles/11176164-pre-built-web-connectors-using-remote-mcp |
| Claude는 연결된 서비스에서 그 사람이 가진 권한만큼만 접근한다 | 공식 | https://support.claude.com/articles/11176164 |
| Claude 커넥터 추가: 대화창 + → Connectors → Manage connectors → + | 공식 | https://support.claude.com/en/articles/10168395-set-up-claude-integrations |
| 커넥터 도구 권한은 Always allow · Needs approval · Blocked 중 선택 | 공식 | https://academy.claude.com/courses/deploying-claude-enterprise-with-confidence/connectors |
| 개인 설정 위치: Settings → Connectors → (커넥터) → Tool permissions | 제3자 | https://support.rentman.io/hc/en-us/articles/35681845068690 (재확인) |
| 'Always allow'가 유지되지 않고 다시 묻는 사례 보고 | 제3자 | https://github.com/anthropics/claude-code/issues/56757 |
| 캔바 커넥터 도구: 공유 URL로 디자인 읽기(글·페이지 수·썸네일·발표자 노트), 사본 만들기(페이지 선택 가능), 편집(글 바꾸기·서식·이미지 교체·위치·크기·페이지 추가·순서·발표자 노트 등, **애니메이션 없음**, 저장 전 미리보기와 사용자 승인 필요), 내보내기(PDF·PNG·JPG·GIF·PPTX·MP4), 단축 링크 풀기, 브랜드 키트·참조 디자인으로 새 디자인 생성 | 도구 | Claude 세션의 Canva 커넥터 도구 설명 (read-design, copy-design, edit-design, export-design, resolve-shortlink, create-design) |
| 미리캔버스 커넥터 도구: 편집 링크(…/v2/design2/{designId})로 내 디자인 정보·미리보기·구조 읽기, 페이지 내용 수정·추가·삭제, PDF·PowerPoint를 브랜드 키트 템플릿으로 등록, 다운로드(PNG·JPG·PDF·PPTX·MP4·GIF, **커넥터로 만든 디자인만**). **애니메이션 도구 없음** | 도구 | Claude 세션의 MiriCanvas 커넥터 도구 설명·안내서 |
| 미리캔버스 브랜드 키트 모드: 등록 템플릿을 모두 선택 화면에 보여 주고, '알아서 골라 줘'여도 사용자 선택을 기다린다 (랜덤 아님) | 도구 | MiriCanvas 안내서 design/template-select |
| 2026-08-28 기준 미리캔버스 공식 MCP 서버는 공개된 것이 없다는 자료 (이후 상황 재확인) | 제3자 | https://www.gpters.org/news/post/create-canvas-ai-ppt-WymtM2XrvIAGXiI |
| ChatGPT Canva 앱 연결: Settings → Apps & connectors(일부 'Apps') → Canva → Connect | 제3자 | https://findskill.ai/blog/how-to-use-canva-in-chatgpt/ (재확인) |
| ChatGPT의 Canva 앱은 Canva 무료·교육용 계정도 연결 가능, 브랜드 템플릿 검색은 유료 캔바 플랜 필요 | 제3자 | https://eseospace.com/blog/connect-chatgpt-to-canva-mcp/ (재확인) |
| Gemini의 Canva 연결된 앱: 2026-05-19부터 영어 일부 시장에 순차 배포, Gemini 설정에서 켜고 @Canva로 사용 | 공식(캔바 보도자료)·제3자 | https://www.businesswire.com/news/home/20260519890336/en · https://itbrief.co.uk/story/canva-launches-gemini-connected-app-for-ai-design-workflows |

## 3. 결과 확인·저장

| 사실 | 등급 | 출처 |
|---|---|---|
| Gemini Canvas: HTML 미리보기, Code 보기에서 직접 수정, Share & export → Share로 링크 | 공식 | https://support.google.com/gemini/answer/16047321 |
| ChatGPT: 2026-05-28 GPT-5.5 모델에서 캔버스가 빠지고 대화 안 코드 블록으로 바뀜. HTML 코드 블록은 Preview 지원, 저장은 복사 후 .html로 | 제3자 | https://www.ai-toolbox.co/chatgpt-management-and-productivity/canvas-sharing-how-to-share-chatgpt-canvas-creations · https://static.app/guides/what-is-chatgpt-canvas (OpenAI 공지로 재확인) |

## 4. 디자인 참고

| 사실 | 등급 | 출처 |
|---|---|---|
| Wise 핵심 색: Bright Green #9FE870, Forest Green #163300 | 제3자 | https://dotyeti.com/blog/wise-rebrand-and-logo-explanation-behind-the-new-visuals |
| Wise 글꼴: 제목 Wise Sans(전용), 본문 Inter | 제3자 | https://styles.refero.design/style/367c0c6e-73a7-441c-a8ff-91d139ac60dc |
| Wise 디자인 시스템: 활성 상태를 포레스트 그린 3px 테두리로 강조 | 공식(Wise 디자인팀 글) | https://medium.com/@therealstephsmith/accessible-but-never-boring-part-2-e188db299bd0 |
| 근흑색 #0e0f0c, 제목 굵기 900, 알약 버튼 등 세부값 | 제3자 | https://opendesigner.io/design-systems/wise · https://open-design.ai/systems/wise/ |
| 캔바 Pro 요소가 든 템플릿은 캔바 템플릿 링크 형태로만 판매 허용 (→ 갤러리는 링크만) | 공식 | https://www.canva.com/en_au/help/using-canva-to-create-products-for-sale/ |

## 5. 맥락 (대화 중 검토)

| 사실 | 등급 | 출처 |
|---|---|---|
| Claude Design: 디자인 파일을 읽어 디자인 시스템을 만들고 이후 작업에 적용, 캔바·PDF·PPTX·HTML로 내보내기 | 공식 | https://www.anthropic.com/news/claude-design-anthropic-labs |
| 캔바: 2026년 2월부터 Claude·ChatGPT 안에서 브랜드 키트를 적용한 디자인 생성 | 제3자 | https://everything-pr.com/how-pr-teams-use-canva |

## 6. 재확인 목록 (구현 전·배포 전)

- [ ] Claude·ChatGPT·Gemini의 **한국어 화면 메뉴 이름** (스킬 업로드, 커넥터, 권한)
- [ ] ChatGPT: Skills 메뉴 위치, 대상 계정, 폴더 한 겹 ZIP 인식 여부
- [ ] Gemini: 폴더 한 겹 ZIP 인식 여부, 한국 계정의 스킬·Canva 연결 앱 제공 여부
- [ ] ChatGPT·Gemini의 Canva 앱이 공유 링크 디자인을 읽고 사본을 고칠 수 있는지
- [ ] 미리캔버스 커넥터 공개 연결 방법 (커넥터 목록 등재 여부·연결 주소·요금제 조건)
- [ ] 각 AI 미리보기 화면에서 jsDelivr 엔진 스크립트가 불러와지는지
- [ ] 캔바 '공유 → 다운로드 → PNG' 메뉴 이름
- [x] JSZip·Pretendard·KaTeX·QR 라이브러리의 고정 버전과 주소 → JSZip 3.10.1, Pretendard 1.3.9, KaTeX 0.16.11, qrcode-generator 1.4.4 (2026-11-20 주소 열림 확인, TEST_LOG)
- [x] 내장 테마 5종 대비 검증 결과 → 파스텔 accent-ink를 #B54726으로 조정, 나머지 통과 (2026-11-20, TEST_LOG)

결과는 docs/TEST_LOG.md에 날짜와 함께 기록하고, 이 문서와 04 문서를 고친다.

## 추가 확인 (2026-11-20 오후, 이 PC에서 직접 확인)

| 사실 | 확인 방법 |
|---|---|
| 캔바 커넥터의 이미지 생성 도구는 글로 요청하면 그림을 만들어 사용자의 캔바에 저장하고, 그림 ID만 돌려준다. 가로세로 비율은 정해진 11가지 중에서 고른다 | 이 PC의 Claude Code에 연결된 캔바 커넥터로 1건 생성 |
| 그 그림의 주소는 200px 미리보기만 받을 수 있고 약 4시간 뒤 만료된다. 주소의 크기 값을 바꾸면 403 | 주소를 직접 열어 확인 |
| 미리캔버스 커넥터에는 이미지 생성 도구가 없다 (디자인 요소 검색만 있음) | 커넥터의 도구 목록 |
| Google Fonts에 Hahmlet · Gaegu · Bagel Fat One · Do Hyeon · Gowun Batang이 있다 | css2 주소 응답 200 |

- 재확인 필요: claude.ai·ChatGPT·Gemini 대화 화면에서 캔바 이미지 생성이 같은 모습으로 되는지, 그림을 여는 링크가 보이는지.

## 추가 확인 (2026-11-20 밤, 사용자의 크롬에서 직접 확인)

- **ChatGPT 무료 계정**(계정 표시 Free): 그림 1장을 직접 만들어 HTML 파일 안에 base64로 넣고, 내려받을 수 있는 파일로 줬다 (2.79MB, PNG 1장). 답의 파일 링크를 누르면 미리보기 창이 열리고 그 창 위의 다운로드 버튼으로 받는다.
- **Gemini**(교육청 교육용 계정, 모델 표시 4 Hydrogen): 같은 요청에 "이미지를 만들어 HTML에 Base64로 넣을 수 없다", "html 파일을 내려받게 줄 수 없다"고 답했다. 도구에서 「이미지 만들기」를 켜고 다시 요청해도 같았다. 모델을 3.1 Pro로 바꿔도(그대로 · 이미지 만들기 켬) 두 번 다 안 됐다 — "이미지 도구와 HTML을 쓰는 영역이 분리돼 있어 그림 데이터를 읽어 올 수 없다".
- **위키미디어 공용 API**(`commons.wikimedia.org/w/api.php`, `thumb.wikimedia.org`): 로그인 없이 `origin=*`로 다른 사이트에서 검색·사진 받기가 된다 (`access-control-allow-origin: *`). 엔진 v1.2.0의 [사진 찾기]가 쓴다.
- 재확인 필요: ChatGPT 무료 계정의 그림 한도(공식 문서로 확인하지 않음), 여러 장을 한 번에 넣는 결과, Gemini 개인 계정·다른 모델.

## 추가 확인 (2026-11-21, 사용자의 크롬에서 직접 확인)

- **캔바 편집 화면(한국어)**: 오른쪽 위 **공유** → 창 제목 「디자인 공유」, 「액세스 레벨: 나만 액세스 가능」, 버튼 **링크 복사** · 「링크 맞춤 설정」 · 「공개 보기 링크」. 사용자가 준 `canva.link/…` 주소는 이 디자인의 편집 주소(`canva.com/design/{id}/…/edit`)로 열린다. 11-20 Claude 테스트 2는 이 주소(액세스 '나만')로 같은 계정의 캔바 커넥터가 읽었다.
- **미리캔버스** (11-21 01시대, 사용자가 로그인한 뒤 확인): 내 드라이브의 디자인을 열면 새 탭에 편집 화면이 뜨고 주소는 `https://www.miricanvas.com/v2/ko/design2/{designId}` 형식이다(언어 `ko`가 들어간다). 이 PC의 미리캔버스 연결 도구에 그 designId를 주니 제목·크기·13쪽의 쪽 정보를 읽어 왔다 → **편집 화면 주소의 마지막 부분으로 디자인을 읽을 수 있다**(같은 계정). 편집 화면 위쪽에 [공유]·[다운로드] 버튼이 있다. 재확인 필요: claude.ai의 미리캔버스 커넥터에서도 같은지, 템플릿에서 편집 화면으로 가는 버튼 이름, [공유]로 만드는 링크를 AI가 읽는지.
