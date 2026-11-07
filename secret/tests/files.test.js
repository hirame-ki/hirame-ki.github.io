/* 파일 읽기 테스트 — 교사가 올릴 법한 파일을 실제 바이트로 읽어 본다.
   실행:  node tests/files.test.js

   tests/fixtures 의 파일은 한셀(Hancom Office 2022)로 같은 가상 자료를 형식만 바꿔 저장한 것이다.
   학생 이름 · 내용은 모두 지어낸 값이고, 형식마다 같은 표가 나와야 한다.
   한셀이 만들 수 없는 변형(옛 BIFF5 · 2003 XML · MHTML · 깨진 파일 등)은 아래 도우미로 직접 짠다. */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { loadCore, createRunner } = require("./harness.js");
const C = loadCore();

const t = createRunner("파일 읽기");
const FX = path.join(__dirname, "fixtures");
const fx = name => fs.readFileSync(path.join(FX, name));
const read = name => C.readSheets(fx(name), name);
const failMsg = (bytes, name) => {
  try { C.readSheets(bytes, name); return ""; }
  catch (e) { return (e.friendly ? "" : "[친절하지 않은 오류] ") + e.message; }
};

/* ============================================================
   시험 파일을 직접 짜는 도우미
   ============================================================ */
const u8 = (...a) => Uint8Array.from(a);
const le16 = v => [v & 255, (v >> 8) & 255];
const le32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
const concat = list => Buffer.concat(list.map(x => Buffer.from(x)));
const utf16 = s => Buffer.from(s, "utf16le");

/* 무압축 ZIP — 항목 이름과 내용만 주면 된다 */
function makeZip(files, opt = {}) {
  const locals = [], centrals = [];
  let off = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameB = Buffer.from(name, "utf8");
    const data = Buffer.from(content);
    const flags = opt.encrypted ? 1 : 0;
    const local = concat([le32(0x04034b50), le16(20), le16(flags), le16(0), le16(0), le16(0),
      le32(0), le32(data.length), le32(data.length), le16(nameB.length), le16(0), nameB, data]);
    centrals.push(concat([le32(0x02014b50), le16(20), le16(20), le16(flags), le16(0), le16(0), le16(0),
      le32(0), le32(data.length), le32(data.length), le16(nameB.length), le16(0), le16(0),
      le16(0), le16(0), le32(0), le32(off), nameB]));
    locals.push(local);
    off += local.length;
  }
  const cd = concat(centrals);
  const eocd = concat([le32(0x06054b50), le16(0), le16(0), le16(centrals.length), le16(centrals.length),
    le32(cd.length), le32(off), le16(0)]);
  return concat([...(opt.prefix ? [opt.prefix] : []), ...locals, cd, eocd]);
}

const XMLNS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const CT = '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>';
const ROOT_RELS = '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
const WB_RELS = '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';

/* sheetXml 하나로 된 가장 작은 xlsx */
function miniXlsx(sheetXml, extra = {}) {
  return makeZip({
    "[Content_Types].xml": CT,
    "_rels/.rels": ROOT_RELS,
    "xl/workbook.xml": extra.workbook || `<?xml version="1.0"?><workbook ${XMLNS}><sheets><sheet name="시트" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": extra.rels || WB_RELS,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0"?><worksheet ${XMLNS}><sheetData>${sheetXml}</sheetData>${extra.tail || ""}</worksheet>`,
    ...(extra.files || {}),
  });
}

/* BIFF 기록 하나 */
const rec = (id, ...parts) => {
  const body = concat(parts);
  return concat([le16(id), le16(body.length), body]);
};
const BOF8 = (dt = 5) => rec(0x0809, le16(0x0600), le16(dt), le16(0), le16(0), le32(0), le32(0));
const BOF5 = (dt = 5) => rec(0x0809, le16(0x0500), le16(dt), le16(0), le16(0));
const EOF_ = () => rec(0x000A);
const dbl = v => { const b = Buffer.alloc(8); b.writeDoubleLE(v); return b; };
/* 짧은 유니코드 문자열 (BIFF8 시트 이름) */
const shortU = s => concat([u8(s.length, 1), utf16(s)]);
const longU = s => concat([le16(s.length), u8(1), utf16(s)]);

/* BIFF8 통합 문서 — 시트 하나 */
function biff8(sheetRecords, globals = [], name = "시트") {
  const before = concat([BOF8(), ...globals]);
  const bound = len => rec(0x85, le32(len), u8(0, 0), shortU(name));
  const pos = before.length + bound(0).length + EOF_().length;
  return concat([before, bound(pos), EOF_(), BOF8(0x10), ...sheetRecords, EOF_()]);
}

/* OLE 복합 파일 — 큰 스트림은 일반 섹터, 4096 바이트 미만은 미니 스트림에 넣는다 */
function makeCfb(streams) {
  const SEC = 512, MINI = 64, CUT = 4096;
  const names = Object.keys(streams);
  const secs = [];                       /* 데이터 섹터들 */
  const fat = [];
  const END = 0xFFFFFFFE, FREE = 0xFFFFFFFF, FATSEC = 0xFFFFFFFD;
  const pushChain = buf => {
    const start = secs.length;
    const n = Math.max(1, Math.ceil(buf.length / SEC));
    for (let i = 0; i < n; i++) {
      const s = Buffer.alloc(SEC);
      Buffer.from(buf).copy(s, 0, i * SEC, Math.min(buf.length, (i + 1) * SEC));
      secs.push(s);
      fat[start + i] = i === n - 1 ? END : start + i + 1;
    }
    return start;
  };
  /* 미니 스트림 묶기 */
  const miniParts = [], miniFat = [];
  const entries = names.map(nm => {
    const data = Buffer.from(streams[nm]);
    if (data.length >= CUT) return { nm, start: pushChain(data), size: data.length };
    const startMini = miniFat.length;
    const n = Math.max(1, Math.ceil(data.length / MINI));
    for (let i = 0; i < n; i++) {
      const s = Buffer.alloc(MINI);
      data.copy(s, 0, i * MINI, Math.min(data.length, (i + 1) * MINI));
      miniParts.push(s);
      miniFat[startMini + i] = i === n - 1 ? END : startMini + i + 1;
    }
    return { nm, start: startMini, size: data.length };
  });
  const miniStream = Buffer.concat(miniParts);
  const miniStart = miniStream.length ? pushChain(miniStream) : END;
  const miniFatBuf = Buffer.alloc(Math.max(1, Math.ceil(miniFat.length * 4 / SEC)) * SEC, 0xFF);
  miniFat.forEach((v, i) => miniFatBuf.writeUInt32LE(v >>> 0, i * 4));
  const miniFatStart = miniFat.length ? pushChain(miniFatBuf) : END;

  /* 디렉터리 — 형제를 오른쪽으로 잇는 단순한 나무 */
  const dirEntry = (nm, type, left, right, child, start, size) => {
    const e = Buffer.alloc(128);
    utf16(nm).copy(e, 0);
    e.writeUInt16LE((nm.length + 1) * 2, 64);
    e[66] = type; e[67] = 1;
    e.writeUInt32LE(left >>> 0, 68); e.writeUInt32LE(right >>> 0, 72); e.writeUInt32LE(child >>> 0, 76);
    e.writeUInt32LE(start >>> 0, 116); e.writeUInt32LE(size >>> 0, 120);
    return e;
  };
  const NOSTREAM = 0xFFFFFFFF;
  const dirs = [dirEntry("Root Entry", 5, NOSTREAM, NOSTREAM, entries.length ? 1 : NOSTREAM, miniStart, miniStream.length)];
  entries.forEach((e, i) => dirs.push(dirEntry(e.nm, 2, NOSTREAM, i + 1 < entries.length ? i + 2 : NOSTREAM, NOSTREAM, e.start, e.size)));
  while (dirs.length % 4) dirs.push(dirEntry("", 0, NOSTREAM, NOSTREAM, NOSTREAM, 0, 0));
  const dirStart = pushChain(Buffer.concat(dirs));

  /* FAT 섹터 — 자기 자신도 FAT 에 표시한다 */
  const perSec = SEC / 4;
  let nFat = 1;
  while (nFat * perSec < secs.length + nFat) nFat++;
  const fatStart = secs.length;
  for (let i = 0; i < nFat; i++) fat[fatStart + i] = FATSEC;
  const fatBuf = Buffer.alloc(nFat * SEC, 0xFF);
  for (let i = 0; i < fat.length; i++) fatBuf.writeUInt32LE((fat[i] === undefined ? FREE : fat[i]) >>> 0, i * 4);
  for (let i = 0; i < nFat; i++) {
    const s = Buffer.alloc(SEC);
    fatBuf.copy(s, 0, i * SEC, (i + 1) * SEC);
    secs.push(s);
  }

  const head = Buffer.alloc(SEC, 0);
  Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]).copy(head, 0);
  head.writeUInt16LE(0x3E, 24); head.writeUInt16LE(3, 26); head.writeUInt16LE(0xFFFE, 28);
  head.writeUInt16LE(9, 30); head.writeUInt16LE(6, 32);
  head.writeUInt32LE(nFat, 44); head.writeUInt32LE(dirStart, 48);
  head.writeUInt32LE(CUT, 56);
  head.writeUInt32LE(miniFatStart >>> 0, 60); head.writeUInt32LE(miniFat.length ? Math.ceil(miniFat.length * 4 / SEC) : 0, 64);
  head.writeUInt32LE(END, 68); head.writeUInt32LE(0, 72);
  for (let i = 0; i < 109; i++) head.writeUInt32LE(i < nFat ? fatStart + i : FREE, 76 + i * 4);
  return Buffer.concat([head, ...secs]);
}

/* ============================================================
   1. 한셀로 저장한 같은 자료 — 형식이 달라도 같은 표가 나와야 한다
   ============================================================ */
t.group("1. 한셀로 저장한 파일");

const FORMATS = ["hancell-sample.cell", "hancell-sample.xlsx", "hancell-sample.xlsm",
                 "hancell-sample.xlsb", "hancell-sample.xls", "hancell-sample.ods"];
const TABS = ["안내", "자율활동", "진로활동", "1학년 3반", "1학년 4반", "자율동아리", "통합", "숨김", "행사 취합"];

const pick = (sheets, name) => sheets.find(s => s.name === name) || { rows: [], rowNums: [] };

FORMATS.forEach(name => {
  let sheets;
  try { sheets = read(name); } catch (e) { sheets = []; t.ok(`${name} 를 연다`, false, e.message); return; }
  const fmt = path.extname(name);
  t.eq(`${fmt} — 탭 아홉 개를 순서대로 읽는다`, sheets.map(s => s.name), TABS);

  const ja = pick(sheets, "자율활동");
  t.eq(`${fmt} — 머리글을 그대로 읽는다`, ja.rows[0], ["학년", "반", "번호", "성 명", "활동 내용", "날짜"]);
  t.eq(`${fmt} — 숫자 칸에 .0 이 붙지 않는다`, ja.rows[1].slice(0, 4), ["1", "3", "5", "김민수"]);
  /* 한셀은 .ods 로 저장할 때 날짜 서식을 버리고 일련번호만 남긴다 — 파일 안에 날짜라는 표시가 없다 */
  t.eq(`${fmt} — 날짜 칸은 날짜로 읽는다`, ja.rows[1][5], fmt === ".ods" ? "46101" : "2026-03-20");

  const jr = pick(sheets, "진로활동");
  t.eq(`${fmt} — 빈 줄을 건너뛰고 실제 행 번호를 지킨다`, jr.rowNums, [1, 2, 4, 5, 6, 7, 8]);
  t.eq(`${fmt} — 세로 병합(학년 · 반)을 아래 줄까지 채운다`,
    [jr.rows[3].slice(1, 5), jr.rows[4].slice(1, 5), jr.rows[5].slice(1, 5), jr.rows[6].slice(1, 5)],
    [["1", "3", "5", "김민수"], ["1", "3", "12", "이서연"], ["1", "3", "20", "최유진"], ["1", "4", "5", "김민수"]]);

  t.eq(`${fmt} — 숨긴 탭은 표시를 남긴다`,
    sheets.filter(s => s.hidden).map(s => s.name), ["숨김"]);

  const tong = pick(sheets, "통합");
  t.eq(`${fmt} — 학번이 숫자 그대로 온다`, tong.rows.slice(1).map(r => r[0]), ["10305", "10312", "10405"]);
  t.eq(`${fmt} — 빈 칸 자리가 밀리지 않는다`, tong.rows[2][5], "전입");

  const ev = pick(sheets, "행사 취합");
  t.eq(`${fmt} — 한 칸의 쉼표 명단도 그대로 온다`, ev.rows[2][4], "김민수, 이서연, 박수민");
});

{
  const sheets = read("hancell-sample.csv");
  t.eq(".csv (EUC-KR) — 한글이 깨지지 않는다", sheets[0].rows[0].slice(0, 4), ["학년", "반", "번호", "성 명"]);
  t.eq(".csv — 탭 하나로 읽는다", sheets.length, 1);
}

{
  const sheets = read(path.join("hancell-sample.files", "sheet002.htm"));
  t.ok(".htm 표 한 장 — 표를 읽는다", sheets.length === 1 && sheets[0].rows.length === 6,
    JSON.stringify(sheets.map(s => s.rows.length)));
  t.eq(".htm 표 한 장 — EUC-KR 표기가 틀려도 한글이 깨지지 않는다",
    sheets[0].rows[1].slice(0, 4), ["1", "3", "5", "김민수"]);
}

t.ok(".htm 웹페이지 표지 — 왜 못 읽는지 알려 준다",
  /표지|웹페이지/.test(failMsg(fx("hancell-sample.htm"), "hancell-sample.htm")),
  failMsg(fx("hancell-sample.htm"), "hancell-sample.htm"));

["hancell-password.cell", "hancell-password.xlsx"].forEach(name => {
  const msg = failMsg(fx(name), name);
  t.ok(`${path.extname(name)} 암호 파일 — 암호를 풀라고 알려 준다`, /암호/.test(msg) && !/친절하지/.test(msg), msg);
});

/* ============================================================
   2. xlsx 변형
   ============================================================ */
t.group("2. xlsx 변형");

{ /* 이름공간 접두사 — 한셀은 <x:worksheet> 처럼 쓴다 */
  const x = makeZip({
    "[Content_Types].xml": CT,
    "_rels/.rels": ROOT_RELS,
    "xl/workbook.xml": '<?xml version="1.0"?><x:workbook xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><x:sheets><x:sheet name="탭" sheetId="1" r:id="rId1"/></x:sheets></x:workbook>',
    "xl/_rels/workbook.xml.rels": WB_RELS,
    "xl/worksheets/sheet1.xml": '<?xml version="1.0"?><x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><x:sheetData><x:row r="1"><x:c r="A1" t="inlineStr"><x:is><x:t>이름</x:t></x:is></x:c></x:row></x:sheetData></x:worksheet>',
  });
  t.eq("x: 접두사가 붙은 파일을 읽는다", C.readSheets(x, "a.xlsx")[0].rows, [["이름"]]);
}

{ /* 후리가나(rPh)는 칸 내용이 아니다 */
  const x = miniXlsx('<row r="1"><c r="A1" t="s"><v>0</v></c></row>', { files: {
    "xl/sharedStrings.xml": '<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><r><t>김</t></r><r><t>민수</t></r><rPh sb="0" eb="1"><t>キム</t></rPh></si></sst>',
  }});
  t.eq("서식 조각은 잇고 후리가나는 뺀다", C.readSheets(x, "a.xlsx")[0].rows[0][0], "김민수");
}

{ /* _x000D_ — 엑셀이 칸 안 줄바꿈을 이렇게 적어 올 때가 있다 */
  const x = miniXlsx('<row r="1"><c r="A1" t="inlineStr"><is><t>김민수_x000D_\n이서연</t></is></c></row>');
  t.eq("_x000D_ 를 줄바꿈으로 푼다", C.readSheets(x, "a.xlsx")[0].rows[0][0], "김민수\n이서연");
}

{ /* 다른 프로그램에서 붙여 넣은 칸 앞의 제어 문자 — 실제 파일의 제목 칸에서 나왔다 */
  const x = miniXlsx('<row r="1"><c r="A1" t="inlineStr"><is><t>_x001D__x001D_김민수</t></is></c></row>');
  t.eq("눈에 안 보이는 제어 문자를 뗀다 (xlsx)", C.readSheets(x, "a.xlsx")[0].rows[0][0], "김민수");
  const w = biff8([rec(0x204, le16(0), le16(0), le16(0), longU("\u001d\u001d이서연"))]);
  t.eq("눈에 안 보이는 제어 문자를 뗀다 (옛 엑셀)", C.readSheets(w, "a.xls")[0].rows[0][0], "이서연");
}

{ /* 오류값 칸 */
  const x = miniXlsx('<row r="1"><c r="A1" t="e"><v>#N/A</v></c><c r="B1" t="str"><v>#REF!</v></c><c r="C1" t="inlineStr"><is><t>글</t></is></c></row>');
  t.eq("#N/A 같은 오류값은 빈 칸으로 본다", C.readSheets(x, "a.xlsx")[0].rows[0], ["", "", "글"]);
}

{ /* r 속성이 없는 칸 — 일부 프로그램이 이렇게 저장한다 */
  const x = miniXlsx('<row><c t="inlineStr"><is><t>이름</t></is></c><c t="inlineStr"><is><t>내용</t></is></c></row><row><c t="inlineStr"><is><t>김민수</t></is></c><c t="inlineStr"><is><t>글</t></is></c></row>');
  const s = C.readSheets(x, "a.xlsx")[0];
  t.eq("칸 위치가 없어도 왼쪽부터 차례로 넣는다", s.rows, [["이름", "내용"], ["김민수", "글"]]);
  t.eq("줄 번호도 차례로 센다", s.rowNums, [1, 2]);
}

{ /* 빈 서식 칸이 열 수를 부풀리면 표가 옆으로 끝없이 늘어난다 */
  const x = miniXlsx('<row r="1"><c r="A1" t="inlineStr"><is><t>이름</t></is></c><c r="XFD1" s="3"/></row><row r="2"><c r="A2" s="3"/></row><row r="999" hidden="1"><c r="A999" t="inlineStr"><is><t>숨은 줄</t></is></c></row>');
  const s = C.readSheets(x, "a.xlsx")[0];
  t.eq("빈 서식 칸은 열 수에 넣지 않는다", s.rows[0].length, 1);
  t.eq("빈 서식 줄은 건너뛴다", s.rowNums, [1, 999]);
  t.eq("숨긴 줄 수를 알려 준다", s.hiddenRows, 1);
}

{ /* 경로가 제각각인 파일 */
  const abs = miniXlsx('<row r="1"><c r="A1" t="inlineStr"><is><t>절대경로</t></is></c></row>', {
    rels: '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="x/worksheet" Target="/xl/worksheets/sheet1.xml"/></Relationships>',
  });
  t.eq("절대 경로로 적힌 시트를 찾는다", C.readSheets(abs, "a.xlsx")[0].rows[0][0], "절대경로");

  const upper = makeZip({
    "_rels/.rels": ROOT_RELS,
    "XL\\WORKBOOK.XML": `<workbook ${XMLNS}><sheets><sheet name="탭" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "XL\\_RELS\\WORKBOOK.XML.RELS": WB_RELS,
    "XL\\WORKSHEETS\\SHEET1.XML": `<worksheet ${XMLNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>대문자</t></is></c></row></sheetData></worksheet>`,
  });
  t.eq("대문자 · 역슬래시 경로도 찾는다", C.readSheets(upper, "a.xlsx")[0].rows[0][0], "대문자");

  const noRels = makeZip({
    "xl/workbook.xml": `<workbook ${XMLNS}><sheets><sheet name="탭" sheetId="1"/></sheets></workbook>`,
    "xl/worksheets/sheet1.xml": `<worksheet ${XMLNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>관계없음</t></is></c></row></sheetData></worksheet>`,
  });
  t.eq("관계 파일이 없어도 순서로 찾는다", C.readSheets(noRels, "a.xlsx")[0].rows[0][0], "관계없음");

  const withHead = makeZip({
    "[Content_Types].xml": CT, "_rels/.rels": ROOT_RELS,
    "xl/workbook.xml": `<workbook ${XMLNS}><sheets><sheet name="탭" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": WB_RELS,
    "xl/worksheets/sheet1.xml": `<worksheet ${XMLNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>앞머리</t></is></c></row></sheetData></worksheet>`,
  }, { prefix: Buffer.from("보안 프로그램이 앞에 붙인 자료입니다.") });
  t.eq("앞에 다른 자료가 붙은 파일도 표를 찾아 읽는다", C.readSheets(withHead, "a.xlsx")[0].rows[0][0], "앞머리");
}
{ /* 탭 이름의 특수 문자 — 엑셀은 & ' < > 를 탭 이름에 허용한다 */
  const x = miniXlsx('<row r="1"><c r="A1" t="inlineStr"><is><t>글</t></is></c></row>', {
    workbook: `<?xml version="1.0"?><workbook ${XMLNS}><sheets><sheet name="자율 &amp; 진로 &lt;1&gt; &#xD55C;" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  });
  t.eq("탭 이름의 & < > 와 문자 참조를 푼다", C.readSheets(x, "a.xlsx")[0].name, "자율 & 진로 <1> 한");
}

{ /* 숨긴 탭 · 차트 탭이 섞인 통합 문서 — 탭 순서는 파일에 적힌 차례를 따른다 */
  const sheet = text => `<?xml version="1.0"?><worksheet ${XMLNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>${text}</t></is></c></row></sheetData></worksheet>`;
  const rel = (id, type, target) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
  const x = makeZip({
    "[Content_Types].xml": CT, "_rels/.rels": ROOT_RELS,
    "xl/workbook.xml": `<?xml version="1.0"?><workbook ${XMLNS}><sheets>
      <sheet name="셋째 파일" sheetId="3" r:id="rId3"/>
      <sheet name="차트" sheetId="9" r:id="rId9"/>
      <sheet name="숨김" sheetId="2" state="hidden" r:id="rId2"/>
      <sheet name="아주 숨김" sheetId="4" state="veryHidden" r:id="rId4"/>
      <sheet name="첫째 파일" sheetId="1" r:id="rId1"/>
    </sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${
      rel("rId1", "worksheet", "worksheets/sheet1.xml")}${rel("rId2", "worksheet", "worksheets/sheet2.xml")}${
      rel("rId3", "worksheet", "worksheets/sheet3.xml")}${rel("rId4", "worksheet", "worksheets/sheet4.xml")}${
      rel("rId9", "chartsheet", "chartsheets/sheet1.xml")}</Relationships>`,
    "xl/worksheets/sheet1.xml": sheet("가"), "xl/worksheets/sheet2.xml": sheet("나"),
    "xl/worksheets/sheet3.xml": sheet("다"), "xl/worksheets/sheet4.xml": sheet("라"),
    "xl/chartsheets/sheet1.xml": "<chartsheet/>",
  });
  const s = C.readSheets(x, "a.xlsx");
  t.eq("탭 순서 · 내용이 짝을 맞추고 차트 탭은 뺀다",
    s.map(v => [v.name, v.rows[0][0], v.hidden]),
    [["셋째 파일", "다", false], ["숨김", "나", true], ["아주 숨김", "라", true], ["첫째 파일", "가", false]]);
}

{ /* 크기를 뒤에 적는 ZIP (스트리밍으로 만든 파일) — 앞쪽 크기 칸이 0 이다 */
  const zlib = require("zlib");
  const names = {
    "[Content_Types].xml": CT, "_rels/.rels": ROOT_RELS,
    "xl/workbook.xml": `<?xml version="1.0"?><workbook ${XMLNS}><sheets><sheet name="탭" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": WB_RELS,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0"?><worksheet ${XMLNS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>스트리밍</t></is></c></row></sheetData></worksheet>`,
  };
  const locals = [], centrals = [];
  let off = 0;
  for (const [name, content] of Object.entries(names)) {
    const nameB = Buffer.from(name, "utf8"), raw = Buffer.from(content), data = zlib.deflateRawSync(raw);
    const local = concat([le32(0x04034b50), le16(20), le16(8), le16(8), le16(0), le16(0),
      le32(0), le32(0), le32(0), le16(nameB.length), le16(0), nameB, data,
      le32(0x08074b50), le32(0), le32(data.length), le32(raw.length)]);
    centrals.push(concat([le32(0x02014b50), le16(20), le16(20), le16(8), le16(8), le16(0), le16(0),
      le32(0), le32(data.length), le32(raw.length), le16(nameB.length), le16(0), le16(0),
      le16(0), le16(0), le32(0), le32(off), nameB]));
    locals.push(local);
    off += local.length;
  }
  const cd = concat(centrals);
  const eocd = concat([le32(0x06054b50), le16(0), le16(0), le16(centrals.length), le16(centrals.length), le32(cd.length), le32(off), le16(0)]);
  t.eq("크기를 뒤에 적는 ZIP 도 읽는다", C.readSheets(concat([...locals, cd, eocd]), "a.xlsx")[0].rows[0][0], "스트리밍");
}

t.eq("지수 표기 숫자를 푼다", C.numText("2.0301E4"), "20301");
t.eq('글자 "PK" 로 시작하는 CSV 를 압축 파일로 오해하지 않는다',
  C.readSheets(Buffer.from("PK활동,내용\n김민수,기록\n"), "a.csv")[0].rows[0], ["PK활동", "내용"]);

{ /* 날짜 */
  const styles = '<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="yyyy&quot;년&quot; m&quot;월&quot; d&quot;일&quot;"/><numFmt numFmtId="165" formatCode="0&quot;번&quot;"/><numFmt numFmtId="166" formatCode="[$-412]General"/></numFmts><cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="164"/><xf numFmtId="165"/><xf numFmtId="14"/></cellXfs></styleSheet>';
  const x = miniXlsx('<row r="1"><c r="A1" s="1"><v>46101.75</v></c><c r="B1" s="2"><v>5</v></c><c r="C1" s="3"><v>46101</v></c><c r="D1" s="3"><v>3</v></c></row>', { files: { "xl/styles.xml": styles } });
  const s = C.readSheets(x, "a.xlsx")[0];
  t.eq("오후 시각이 있어도 날짜가 하루 밀리지 않는다", s.rows[0][0], "2026-03-20");
  t.eq('"번" 이 붙은 숫자 서식은 날짜가 아니다', s.rows[0][1], "5");
  t.eq("날짜 서식 번호 14 를 읽는다", s.rows[0][2], "2026-03-20");
  t.eq("날짜 서식이 걸린 작은 수는 그대로 둔다", s.rows[0][3], "3");

  const y = miniXlsx('<row r="1"><c r="A1" s="1"><v>44639</v></c></row>', {
    files: { "xl/styles.xml": styles },
    workbook: `<workbook ${XMLNS}><workbookPr date1904="1"/><sheets><sheet name="탭" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  });
  t.eq("1904 날짜 체계를 따른다", C.readSheets(y, "a.xlsx")[0].rows[0][0], "2026-03-20");
}

t.ok("날짜 서식 — yyyy-mm-dd", C.isDateFmtCode("yyyy-mm-dd"));
t.ok("날짜 서식 — 오전/오후", C.isDateFmtCode("[$-412]AM/PM h:mm"));
t.ok("날짜 서식 아님 — General", !C.isDateFmtCode("General"));
t.ok("날짜 서식 아님 — [Red]", !C.isDateFmtCode("#,##0_ ;[Red]-#,##0"));
t.ok('날짜 서식 아님 — "일" 글자가 붙은 숫자', !C.isDateFmtCode('0"일"'));

t.eq("부동소수 찌꺼기를 지운다", C.numText("0.30000000000000004"), "0.3");
t.eq("10305.0 은 10305", C.numText("10305.0"), "10305");

{ /* 깨진 XML 도 읽을 수 있는 만큼 읽는다 */
  const el = C.parseXmlLite('<a x="1 & 2"><b>가 &amp; 나<c/>다<!-- 주석 --></b><![CDATA[<라>]]>');
  t.eq("닫는 태그가 없어도 내용을 읽는다", C.xmlText(el), "가 & 나다<라>");
}

{ /* 한셀의 .cell · .xlsx — 서식 표의 일부를 AlternateContent 로 감싸 둔다.
     건너뛰면 뒤쪽 서식 번호가 밀려서, 날짜 칸이 숫자로 읽히거나 학번이 날짜로 읽힌다 */
  const styles = `<?xml version="1.0"?><x:styleSheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
    <x:numFmts count="1"><x:numFmt numFmtId="176" formatCode="yyyy&quot;년&quot; m&quot;월&quot;"/></x:numFmts>
    <x:cellXfs count="5">
      <x:xf numFmtId="0"/>
      <mc:AlternateContent><mc:Choice Requires="hs"><x:xf numFmtId="0"/></mc:Choice><mc:Fallback><x:xf numFmtId="0"/></mc:Fallback></mc:AlternateContent>
      <x:xf numFmtId="14"/>
      <mc:AlternateContent><mc:Choice Requires="hs"><x:xf numFmtId="176"/></mc:Choice><mc:Fallback><x:xf numFmtId="176"/></mc:Fallback></mc:AlternateContent>
      <x:xf numFmtId="0"/>
    </x:cellXfs></x:styleSheet>`;
  const sheet = C.readSheets(miniXlsx(
    `<row r="1"><c r="A1" s="1"><v>20301</v></c><c r="B1" s="2"><v>46101</v></c><c r="C1" s="3"><v>46101</v></c><c r="D1" s="4"><v>20301</v></c></row>`,
    { files: { "xl/styles.xml": styles } }), "a.xlsx")[0];
  t.eq("감싼 서식이 있어도 칸마다 제 서식을 찾는다", sheet.rows[0], ["20301", "2026-03-20", "2026-03-20", "20301"]);
}

/* ============================================================
   3. 압축 풀기 — 브라우저 기능 없이 직접 푼다
   ============================================================ */
t.group("3. 압축 풀기");

const sampleText = Buffer.from(Array.from({ length: 4000 }, (_, i) => `<row r="${i}"><c>김민수${i % 7}</c></row>`).join(""));
[0, 1, 6, 9].forEach(level => {
  const packed = zlib.deflateRawSync(sampleText, { level });
  const out = C.inflateRawJs(new Uint8Array(packed), sampleText.length);
  t.ok(`압축 수준 ${level} 을 푼다`, Buffer.compare(Buffer.from(out), sampleText) === 0);
});
{
  const packed = zlib.deflateRawSync(Buffer.from("abc"), { strategy: zlib.constants.Z_FIXED });
  t.eq("고정 허프만 블록을 푼다", Buffer.from(C.inflateRawJs(new Uint8Array(packed))).toString(), "abc");
  const out = C.inflateRawJs(new Uint8Array(zlib.deflateRawSync(sampleText)), 4);
  t.ok("크기를 모르면 알아서 늘린다", Buffer.compare(Buffer.from(out), sampleText) === 0);
}

/* ============================================================
   4. 옛 엑셀(BIFF) 변형
   ============================================================ */
t.group("4. 옛 엑셀 (BIFF)");

{ /* 공유 문자열이 CONTINUE 로 잘린 파일 — 긴 문장이 잘려 있어도 이어 붙인다 */
  const long = "가".repeat(30) + "나".repeat(30);
  const first = concat([le32(2), le32(2), le16(long.length), u8(1), utf16(long.slice(0, 30))]);
  const cont = concat([u8(1), utf16(long.slice(30))]);
  /* 두 번째 문자열은 압축 표기(라틴) + 서식 런 + 확장 정보 */
  const cont2 = concat([le16(3), u8(0x0C), le16(1), le32(4), Buffer.from("abc", "latin1"), le16(0), le16(0), le32(0)]);
  const wb = biff8([
    rec(0xFD, le16(0), le16(0), le16(0), le32(0)),
    rec(0xFD, le16(0), le16(1), le16(0), le32(1)),
    rec(0x0203, le16(1), le16(0), le16(0), dbl(10305)),
    /* RK — 정수 · 100 나눗셈 · 실수 윗자리 */
    rec(0x027E, le16(1), le16(1), le16(0), le32((5 << 2) | 2)),
    rec(0x027E, le16(1), le16(2), le16(0), le32((1250 << 2) | 3)),
    rec(0xBD, le16(2), le16(0), le16(0), le32((7 << 2) | 2), le16(0), le32((8 << 2) | 2), le16(1)),
    rec(0x0201, le16(3), le16(0), le16(0)),
    rec(0xBE, le16(3), le16(1), le16(0), le16(0), le16(2)),
    /* 수식 — 문자열 결과는 다음 기록에 온다 */
    rec(0x06, le16(4), le16(0), le16(0), u8(0, 0, 0, 0, 0, 0, 0xFF, 0xFF), le16(0), le32(0), le16(0)),
    rec(0x207, longU("수식글")),
    rec(0x06, le16(4), le16(1), le16(0), dbl(3), le16(0), le32(0), le16(0)),
    rec(0x06, le16(4), le16(2), le16(0), u8(2, 0, 7, 0, 0, 0, 0xFF, 0xFF), le16(0), le32(0), le16(0)),
    rec(0x0205, le16(5), le16(0), le16(0), u8(1, 0)),
    rec(0x0205, le16(5), le16(1), le16(0), u8(7, 1)),
    rec(0x204, le16(6), le16(0), le16(0), longU("낱칸")),
    /* 세로 병합 */
    rec(0x204, le16(7), le16(0), le16(0), longU("병합")),
    rec(0x204, le16(7), le16(1), le16(0), longU("옆1")),
    rec(0x204, le16(8), le16(1), le16(0), longU("옆2")),
    rec(0xE5, le16(1), le16(7), le16(8), le16(0), le16(0)),
    /* 숨긴 줄 */
    rec(0x208, le16(9), le16(0), le16(1), le16(255), le16(0), le16(0), le16(0x20), le16(0)),
    rec(0x204, le16(9), le16(0), le16(0), longU("숨은줄")),
  ], [rec(0xFC, first), rec(0x3C, cont, cont2)]);
  const s = C.parseBiff(wb)[0];
  t.eq("CONTINUE 로 잘린 문자열을 이어 붙인다", s.rows[0][0], long);
  t.eq("압축 문자열 · 서식 런 · 확장 정보를 건너뛴다", s.rows[0][1], "abc");
  t.eq("숫자 · RK 를 읽는다", s.rows[1], ["10305", "5", "12.5"]);
  t.eq("MULRK 를 읽는다", s.rows[2], ["7", "8"]);
  t.eq("수식의 문자열 · 숫자 결과를 읽고 오류는 뺀다", s.rows[3], ["수식글", "3"]);
  t.eq("논리값은 읽고 오류값은 뺀다", s.rows[4], ["TRUE"]);
  t.eq("병합을 아래 줄로 채운다", s.rows[7], ["병합", "옆2"]);
  t.eq("숨긴 줄 수를 센다", s.hiddenRows, 1);
  t.eq("빈 줄을 건너뛰고 실제 행 번호를 지킨다", s.rowNums, [1, 2, 3, 5, 6, 7, 8, 9, 10]);
}

{ /* 날짜 서식 */
  const wb = biff8([rec(0x0203, le16(0), le16(0), le16(0), dbl(46101)), rec(0x0203, le16(0), le16(1), le16(1), dbl(46101))],
    [rec(0x41E, le16(170), longU('yyyy"년" m"월"')),
     rec(0xE0, le16(0), le16(0), Buffer.alloc(16)),
     rec(0xE0, le16(0), le16(170), Buffer.alloc(16))]);
  t.eq("날짜 서식이 걸린 칸만 날짜로 읽는다", C.parseBiff(wb)[0].rows[0], ["46101", "2026-03-20"]);
}

{ /* Excel 5.0 / 95 — 글자가 EUC-KR 바이트다 */
  const eucName = Buffer.from([0xB1, 0xE8, 0xB9, 0xCE, 0xBC, 0xF6]); /* 김민수 */
  const before = concat([BOF5(), rec(0x42, le16(949))]);
  const bound = len => rec(0x85, le32(len), u8(0, 0, eucName.length), eucName);
  const pos = before.length + bound(0).length + EOF_().length;
  const wb = concat([before, bound(pos), EOF_(), BOF5(0x10),
    rec(0x204, le16(0), le16(0), le16(0), le16(eucName.length), eucName),
    rec(0xD6, le16(0), le16(1), le16(0), le16(eucName.length), eucName, u8(0)),
    EOF_()]);
  const s = C.parseBiff(wb)[0];
  t.eq("BIFF5 시트 이름의 한글을 읽는다", s.name, "김민수");
  t.eq("BIFF5 칸의 한글을 읽는다", s.rows[0], ["김민수", "김민수"]);
}

{ /* 한셀의 옛 .cell — 판 번호가 0x1001 이다.
     줄 번호가 4바이트라 칸 기록이 2바이트씩 밀리고, 글자는 폭 표시가 0이어도 늘 두 바이트다 */
  const BOFH = (dt = 5) => rec(0x0809, le16(0x1001), le16(dt), le16(0), le16(0), le32(0), le32(0));
  const name = "1학년 3반 자율";
  const wide = s => concat([le16(s.length), u8(0), utf16(s)]);
  const before = concat([BOFH(),
    rec(0x41E, le16(170), wide('yyyy"년" m"월"')),
    rec(0xE0, le16(0), le16(0), Buffer.alloc(50)),
    rec(0xE0, le16(0), le16(170), Buffer.alloc(50)),
    rec(0xFC, le32(2), le32(2), wide("번호"), wide("김민수"))]);
  const bound = len => rec(0x85, le32(len), u8(0, 0), u8(name.length, 0), utf16(name));
  const pos = before.length + bound(0).length + EOF_().length;
  const wb = concat([before, bound(pos), EOF_(), BOFH(0x10),
    /* 줄 번호 4 · 열 2 · 서식 2 · 값 */
    rec(0xFD, le32(0), le16(0), le16(0), le32(0)),
    rec(0xFD, le32(0), le16(1), le16(0), le32(1)),
    rec(0x204, le32(1), le16(0), le16(0), wide("낱칸")),
    rec(0x0203, le32(1), le16(1), le16(1), dbl(46101)),
    rec(0x027E, le32(1), le16(2), le16(0), le32((5 << 2) | 2)),
    rec(0xBD, le32(2), le16(0), le16(0), le32((7 << 2) | 2), le16(0), le32((8 << 2) | 2), le16(1)),
    rec(0x201, le32(2), le16(2), le16(0)),
    rec(0x06, le32(3), le16(0), le16(0), u8(0, 0, 0, 0, 0, 0, 0xFF, 0xFF), le16(0), le32(0), le16(0)),
    rec(0x207, wide("수식글")),
    rec(0x06, le32(3), le16(1), le16(0), dbl(3), le16(0), le32(0), le16(0)),
    rec(0x0205, le32(3), le16(2), le16(0), u8(1, 0)),
    rec(0x204, le32(4), le16(0), le16(0), wide("병합")),
    rec(0x204, le32(4), le16(1), le16(0), wide("옆1")),
    rec(0x204, le32(5), le16(1), le16(0), wide("옆2")),
    rec(0xE5, le16(1), le32(4), le32(5), le16(0), le16(0)),
    /* 위 표에 없는 큰 줄 번호 — 65535 를 넘어도 그대로 지킨다 */
    rec(0x208, le32(6), le16(0), le16(1), le16(255), le16(0), le16(0), le16(0x20), le16(0)),
    rec(0x204, le32(6), le16(0), le16(0), wide("숨은줄")),
    rec(0x204, le32(70000), le16(1), le16(0), wide("끝")),
    EOF_()]);
  const s = C.parseBiff(wb)[0];
  t.eq("한셀 옛 형식의 시트 이름을 읽는다", s.name, name);
  t.eq("한셀 옛 형식 — 공유 글자 칸", s.rows[0], ["번호", "김민수"]);
  t.eq("한셀 옛 형식 — 글자 · 날짜 · 숫자 칸", s.rows[1], ["낱칸", "2026-03-20", "5"]);
  t.eq("한셀 옛 형식 — 묶음 숫자 칸", s.rows[2], ["7", "8"]);
  t.eq("한셀 옛 형식 — 수식 칸", s.rows[3], ["수식글", "3", "TRUE"]);
  t.eq("한셀 옛 형식 — 세로 병합 칸을 채운다", [s.rows[4], s.rows[5]], [["병합", "옆1"], ["병합", "옆2"]]);
  t.eq("한셀 옛 형식 — 실제 행 번호", s.rowNums, [1, 2, 3, 4, 5, 6, 7, 70001]);
  t.eq("한셀 옛 형식 — 숨긴 줄을 센다", s.hiddenRows, 1);

  /* 정말로 한 바이트인 글자는 그대로 읽는다 */
  const ascii = "Sheet1";
  const before2 = BOF8();
  const bound2 = len => rec(0x85, le32(len), u8(0, 0), u8(ascii.length, 0), Buffer.from(ascii, "latin1"));
  const pos2 = before2.length + bound2(0).length + EOF_().length;
  const wb2 = concat([before2, bound2(pos2), EOF_(), BOF8(0x10),
    rec(0x204, le16(0), le16(0), le16(0), le16(2), u8(0), Buffer.from("ab", "latin1")),
    EOF_()]);
  const s2 = C.parseBiff(wb2)[0];
  t.eq("한 바이트 시트 이름은 그대로 읽는다", s2.name, ascii);
  t.eq("한 바이트 칸 글자는 그대로 읽는다", s2.rows[0], ["ab"]);
}

{ /* 차트가 끼어 있는 시트 — 안쪽 EOF 에서 끊기면 아래 칸을 잃는다 */
  const wb = biff8([
    rec(0x204, le16(0), le16(0), le16(0), longU("앞")),
    BOF8(0x20), rec(0x204, le16(50), le16(0), le16(0), longU("차트 안")), EOF_(),
    rec(0x204, le16(1), le16(0), le16(0), longU("뒤")),
  ]);
  t.eq("끼어 있는 차트를 건너뛰고 끝까지 읽는다", C.parseBiff(wb)[0].rows, [["앞"], ["뒤"]]);
}

{ /* 암호 */
  const wb = biff8([], [rec(0x2F, le16(1), Buffer.alloc(52))]);
  const msg = failMsg(makeCfb({ Workbook: Buffer.concat([wb, Buffer.alloc(5000)]) }), "a.xls");
  t.ok("암호 표시(FILEPASS)가 있으면 암호를 풀라고 알려 준다", /암호/.test(msg), msg);
}

{ /* 복합 파일 — 일반 섹터와 미니 스트림 */
  const small = biff8([rec(0x204, le16(0), le16(0), le16(0), longU("작은 파일"))]);
  t.ok("미니 스트림에 든 작은 통합 문서 확인", small.length < 4096);
  t.eq("미니 스트림의 통합 문서를 읽는다", C.readSheets(makeCfb({ Workbook: small }), "a.xls")[0].rows, [["작은 파일"]]);
  const big = biff8(Array.from({ length: 600 }, (_, i) => rec(0x204, le16(i), le16(0), le16(0), longU("칸" + i))));
  t.ok("일반 섹터에 든 큰 통합 문서 확인", big.length >= 4096);
  const s = C.readSheets(makeCfb({ "\u0005SummaryInformation": Buffer.alloc(200), Workbook: big }), "a.xls")[0];
  t.eq("일반 섹터의 통합 문서를 끝까지 읽는다", [s.rows.length, s.rows[599][0]], [600, "칸599"]);
  const nxl = C.readSheets(makeCfb({ Book: small }), "a.nxl")[0];
  t.eq('"Book" 스트림 · .nxl 도 같은 방식으로 읽는다', nxl.rows, [["작은 파일"]]);
}

/* ============================================================
   5. 엑셀용 HTML · 2003 XML · MHTML
   ============================================================ */
t.group("5. 표가 든 텍스트 파일");

{ /* 학교 시스템에서 내려받은 .xls 는 사실 HTML 인 경우가 많다 */
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">
    <title>활동</title><style>td{mso-number-format:"\\@";} /* <table> */</style>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>진로활동</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <script>var t="<table><tr><td>가짜</td></tr></table>";</script></head><body>
    <table border=1>
      <tr><th>학년</th><th>반</th><th>번호</th><th>이름</th><th colspan=2>내용</th></tr>
      <tr><td rowspan=2>1</td><td rowspan=2 x:num="3">3</td><td x:num=5>5</td><td>김&nbsp;민수</td><td>줄&amp;바꿈<br style='mso-data-placement:same-cell'>둘째</td><td>칸</td></tr>
      <tr><td>12</td><td>이서연
          (전입)</td><td colspan=2></td></tr>
      <tr><td>2<td>3<td>5<td>정하늘<td>닫는 태그 없음<td>칸</tr>
    </table></body></html>`;
  const s = C.readSheets(Buffer.from(html), "a.xls");
  t.eq("시트 이름은 x:Name 을 쓴다", s.map(x => x.name), ["진로활동"]);
  t.eq("th · colspan 을 읽는다", s[0].rows[0], ["학년", "반", "번호", "이름", "내용"]);
  t.eq("&nbsp; · &amp; · <br> 을 푼다", s[0].rows[1], ["1", "3", "5", "김 민수", "줄&바꿈\n둘째", "칸"]);
  t.eq("rowspan 을 아래 줄까지 채우고 소스의 줄바꿈은 띄어쓰기로 본다", s[0].rows[2], ["1", "3", "12", "이서연 (전입)"]);
  t.eq("닫는 태그가 없는 칸도 읽는다", s[0].rows[3], ["2", "3", "5", "정하늘", "닫는 태그 없음", "칸"]);
}

{ /* 안쪽 표 */
  const html = `<html><body><table><tr><td>바깥<table><tr><td>이름</td><td>내용</td></tr></table></td></tr></table></body></html>`;
  const s = C.readSheets(Buffer.from(html), "a.htm");
  t.eq("겉을 감싼 표는 빼고 안쪽 표를 읽는다", s.map(x => x.rows), [[["이름", "내용"]]]);
}

{ /* 2003 XML 스프레드시트 */
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="자율"><Table>
      <Row><Cell><Data ss:Type="String">이름</Data></Cell><Cell ss:Index="3"><Data ss:Type="String">내용</Data></Cell></Row>
      <Row ss:Index="3"><Cell ss:MergeDown="1"><Data ss:Type="String">김민수</Data></Cell><Cell ss:Index="3"><Data ss:Type="Number">5.0</Data></Cell></Row>
      <Row><Cell ss:Index="3"><Data ss:Type="DateTime">2026-03-20T00:00:00.000</Data></Cell></Row>
    </Table></Worksheet>
    <Worksheet ss:Name="숨김"><Table><Row><Cell><Data ss:Type="String">글</Data></Cell></Row></Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Visible>SheetHidden</Visible></WorksheetOptions></Worksheet>
  </Workbook>`;
  const s = C.readSheets(Buffer.from(xml), "a.xml");
  t.eq("2003 XML — 탭 이름과 숨김", s.map(x => [x.name, x.hidden]), [["자율", false], ["숨김", true]]);
  t.eq("2003 XML — 칸 위치 · 병합 · 숫자 · 날짜", s[0].rows,
    [["이름", "", "내용"], ["김민수", "", "5"], ["김민수", "", "2026-03-20"]]);
  t.eq("2003 XML — 실제 행 번호", s[0].rowNums, [1, 3, 4]);
}

{ /* 단일 파일 웹페이지(.mht) */
  const page1 = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>첫탭</x:Name></x:ExcelWorksheet><x:ExcelWorksheet><x:Name>둘째탭</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><frameset><frame src="sheet001.htm"></frameset></html>`;
  const qp = Buffer.from("<html><body><table><tr><td>이름</td></tr></table></body></html>").toString("latin1")
    .replace(/[^\x20-\x7e]|=/g, ch => "=" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
  const b64 = Buffer.from("<html><body><table><tr><td>내용</td></tr></table></body></html>").toString("base64");
  const mht = [
    'MIME-Version: 1.0', 'Content-Type: multipart/related; boundary="----=_NextPart_01"', '',
    '------=_NextPart_01', 'Content-Location: file:///C:/a.htm', 'Content-Transfer-Encoding: 8bit', 'Content-Type: text/html; charset="utf-8"', '', Buffer.from(page1).toString("latin1"),
    '------=_NextPart_01', 'Content-Location: file:///C:/a.files/sheet001.htm', 'Content-Transfer-Encoding: quoted-printable', 'Content-Type: text/html; charset="utf-8"', '', qp,
    '------=_NextPart_01', 'Content-Location: file:///C:/a.files/sheet002.htm', 'Content-Transfer-Encoding: base64', 'Content-Type: text/html; charset="utf-8"', '', b64,
    '------=_NextPart_01', 'Content-Location: file:///C:/a.files/tabstrip.htm', 'Content-Transfer-Encoding: 8bit', 'Content-Type: text/html; charset="utf-8"', '', '<html><body><table><tr><td>탭 줄</td></tr></table></body></html>',
    '------=_NextPart_01--', '',
  ].join("\r\n");
  const s = C.readSheets(Buffer.from(mht, "latin1"), "a.mht");
  t.eq("MHTML — 시트마다 이름과 표를 읽는다", s.map(x => [x.name, x.rows[0][0]]), [["첫탭", "이름"], ["둘째탭", "내용"]]);
}

/* ============================================================
   6. CSV · 텍스트
   ============================================================ */
t.group("6. CSV · 텍스트");

const csvRows = text => C.parseCsv(text);
t.eq("쉼표", csvRows("이름,내용\n김민수,글"), [["이름", "내용"], ["김민수", "글"]]);
t.eq("탭", csvRows("이름\t내용\n김민수\t글, 쉼표 있음"), [["이름", "내용"], ["김민수", "글, 쉼표 있음"]]);
t.eq("세미콜론", csvRows("이름;내용\n김민수;글"), [["이름", "내용"], ["김민수", "글"]]);
t.eq("세로줄", csvRows("이름|내용\n김민수|글"), [["이름", "내용"], ["김민수", "글"]]);
t.eq("맨 윗줄이 제목이어도 구분자를 맞힌다",
  csvRows("2026학년도, 진로활동 취합\n이름\t번호\t내용\n김민수\t5\t글, 쉼표\n이서연\t12\t글\n"),
  [["2026학년도, 진로활동 취합"], ["이름", "번호", "내용"], ["김민수", "5", "글, 쉼표"], ["이서연", "12", "글"]]);
t.eq("sep= 줄을 따른다", csvRows("sep=;\r\n이름;내용\r\n김민수;글,쉼표"), [["이름", "내용"], ["김민수", "글,쉼표"]]);
t.eq("옛 맥 줄바꿈(CR)만 있어도 줄을 나눈다", csvRows("이름,내용\r김민수,글\r"), [["이름", "내용"], ["김민수", "글"]]);
t.eq("따옴표 안의 줄바꿈 · 쉼표 · 큰따옴표", csvRows('이름,내용\n김민수,"첫 줄\n둘째, ""셋째"""'),
  [["이름", "내용"], ["김민수", '첫 줄\n둘째, "셋째"']]);
t.eq('="010" 표기의 값을 꺼낸다', csvRows('번호,이름\n="05",김민수'), [["번호", "이름"], ["05", "김민수"]]);
t.eq("칸 중간의 따옴표는 글자로 둔다", csvRows('이름,내용\n김민수,3" 모니터'), [["이름", "내용"], ["김민수", '3" 모니터']]);

{
  const text = "이름,내용\n김민수,글";
  const le = Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(text, "utf16le")]);
  const be = Buffer.from(le); be.swap16();
  t.eq("UTF-16 LE (BOM)", C.decodeTextBytes(le), text);
  t.eq("UTF-16 BE (BOM)", C.decodeTextBytes(be), text);
  t.eq("UTF-16 LE (BOM 없음)", C.decodeTextBytes(Buffer.from(text, "utf16le")), text);
  t.eq("UTF-8 BOM", C.decodeTextBytes(Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(text)])), text);
  t.eq("EUC-KR", C.decodeTextBytes(Buffer.from([0xB1, 0xE8, 0xB9, 0xCE, 0xBC, 0xF6])), "김민수");
  t.eq("UTF-16 CSV 파일 읽기", C.readSheets(le, "a.csv")[0].rows[1], ["김민수", "글"]);
  t.eq("확장자가 .xls 인 탭 구분 텍스트도 읽는다",
    C.readSheets(Buffer.from("이름\t내용\n김민수\t글"), "a.xls")[0].rows[1], ["김민수", "글"]);
}

/* ============================================================
   7. 읽을 수 없는 파일 — 왜 안 되는지 알려 준다
   ============================================================ */
t.group("7. 읽을 수 없는 파일");

const friendly = (label, bytes, name, re) => {
  const msg = failMsg(bytes, name);
  t.ok(label, re.test(msg) && !/친절하지/.test(msg), msg);
};
friendly("빈 파일", Buffer.alloc(0), "a.xlsx", /빈 파일/);
friendly("내용이 없는 파일", Buffer.from("\n\n \n"), "a.csv", /내용이 없/);
friendly("PDF", Buffer.from("%PDF-1.7 abc"), "a.pdf", /PDF/);
friendly("그림", Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0]), "a.png", /그림/);
friendly("한글 파일 (.hwp)", makeCfb({ FileHeader: Buffer.alloc(256), BodyText: Buffer.alloc(100) }), "a.hwp", /한글/);
friendly("한글 파일 (.hwpx)", makeZip({ mimetype: "application/hwp+zip", "Contents/section0.xml": "<a/>" }), "a.hwpx", /한글/);
friendly("옛 한글 파일", Buffer.from("HWP Document File V3.00 \x1a"), "a.hwp", /한글/);
friendly("워드 파일 (.docx)", makeZip({ "word/document.xml": "<a/>" }), "a.docx", /워드/);
friendly("워드 파일 (.doc)", makeCfb({ WordDocument: Buffer.alloc(100) }), "a.doc", /워드/);
friendly("파워포인트 (.pptx)", makeZip({ "ppt/presentation.xml": "<a/>" }), "a.pptx", /파워포인트/);
friendly("압축 파일", makeZip({ "자료.xlsx": "abc" }), "자료.zip", /압축/);
friendly("암호 걸린 ZIP", makeZip({ "xl/workbook.xml": "abc" }, { encrypted: true }), "a.xlsx", /암호/);
friendly("엑셀 2.1~4.0 옛 파일", Buffer.from([0x09, 0x04, 0x06, 0, 0, 0, 0x10, 0, 0, 0, 0, 0]), "a.xls", /옛|오래/);
friendly("보안 프로그램으로 잠긴 파일(알 수 없는 바이트)",
  Buffer.from(Array.from({ length: 3000 }, (_, i) => (i * 7 + 3) % 256)), "a.xlsx", /보안|DRM/);
friendly("끊긴 ZIP", makeZip({ "xl/workbook.xml": "abc" }).subarray(0, 40), "a.xlsx", /손상|보안|DRM/);
friendly("표가 없는 XML", Buffer.from('<?xml version="1.0"?><root><a>1</a></root>'), "a.xml", /표/);
friendly("표가 없는 HTML", Buffer.from("<html><body><p>글</p></body></html>"), "a.html", /표/);

/* ============================================================
   8. 파일 한 개를 탭별로 끝까지 — 1학년 3반 담임이 올렸을 때
   형식이 달라도 탭마다 같은 학생 · 같은 영역이 골라져야 한다.
   ============================================================ */
t.group("8. 탭별로 끝까지");

const ROSTER = [
  { id: "s5", no: 5, name: "김민수" },
  { id: "s8", no: 8, name: "남궁 민수" },
  { id: "s12", no: 12, name: "이서연" },
  { id: "s20", no: 20, name: "최유진" },
];
const CLS = { id: "c1", name: "1학년 3반", students: ROSTER };

function planTab(sheets, tab, chosenArea) {
  const si = sheets.findIndex(s => s.name === tab);
  const sheet = sheets[si];
  const headerRow = C.findHeaderRow(sheet.rows);
  const hint = C.sheetHintOf(sheet, headerRow, sheets.map(s => s.name));
  const roles = C.guessAcRoles(sheet.rows, headerRow, ROSTER);
  const r = C.planAcSheet({
    sheet, si, roles, headerRow, sheetArea: chosenArea || hint.area || "", cls: CLS, rowFix: {},
    myGrade: "1", myBan: "3", classWide: false, hint, existing: new Set(),
  });
  r.got = r.fresh.map(p => `${p.studentId}:${p.area}`);
  r.roles = roles;
  r.hint = hint;
  return r;
}

FORMATS.forEach(name => {
  const fmt = path.extname(name);
  const sheets = read(name);

  t.eq(`${fmt} 안내 탭 — 표가 아니어서 사람을 찾을 열이 없다`,
    C.guessAcRoles(pick(sheets, "안내").rows, C.findHeaderRow(pick(sheets, "안내").rows), ROSTER)
      .filter(r => ["name", "no", "sno", "banno", "grade", "ban"].includes(r)), []);

  let r = planTab(sheets, "자율활동");
  t.eq(`${fmt} 자율활동 탭 — 우리 반 세 명만 자율로`, r.got, ["s5:auto", "s12:auto", "s8:auto"]);
  t.eq(`${fmt} 자율활동 탭 — 다른 반 · 다른 학년은 뺀다`, r.outOfClass, 2);
  t.eq(`${fmt} 자율활동 탭 — 이름 · 번호가 같은 4반 줄을 짚어 준다`, r.outNameHit, 1);

  r = planTab(sheets, "진로활동");
  t.eq(`${fmt} 진로활동 탭 — 제목 · 빈 줄 · 병합을 넘어 세 명을 진로로`, r.got, ["s5:career", "s12:career", "s20:career"]);
  t.eq(`${fmt} 진로활동 탭 — 연번은 번호가 아니다`, r.roles[0], "ignore");
  t.eq(`${fmt} 진로활동 탭 — 4반 김민수는 뺀다`, r.outOfClass, 1);

  r = planTab(sheets, "1학년 3반", "auto");
  t.eq(`${fmt} 1학년 3반 탭 — 탭 이름을 반으로 읽는다`, [r.hint.grade, r.hint.ban, r.hint.area], ["1", "3", null]);
  t.eq(`${fmt} 1학년 3반 탭 — 영역을 고르면 두 명이 담긴다`, r.got, ["s5:auto", "s12:auto"]);
  t.eq(`${fmt} 1학년 3반 탭 — 합계 줄을 사람으로 읽지 않는다`, [r.totalRows, Object.keys(r.unmatched)], [1, []]);
  t.eq(`${fmt} 1학년 3반 탭 — 탭 이름으로 반을 알았으니 경고하지 않는다`, r.nameOnly, false);
  r = planTab(sheets, "1학년 3반");
  t.eq(`${fmt} 1학년 3반 탭 — 영역을 안 고르면 담지 않는다`, r.got, []);

  r = planTab(sheets, "1학년 4반", "auto");
  t.eq(`${fmt} 1학년 4반 탭 — 같은 이름이 있어도 다른 반 탭은 담지 않는다`, [r.got, r.outByTab], [[], 1]);
  t.eq(`${fmt} 1학년 4반 탭 — 탭으로 뺀 줄에 학년 · 반 값 경고를 띄우지 않는다`, r.outNameHit, 0);

  r = planTab(sheets, "자율동아리");
  t.eq(`${fmt} 자율동아리 탭 — 자율활동이 아니다`, [r.hint.area, r.hint.other, r.got], [null, true, []]);

  r = planTab(sheets, "통합");
  t.eq(`${fmt} 통합 탭 — 자율 · 진로 칸을 나눠 담고 동아리 칸은 뺀다`, r.got, ["s5:auto", "s5:career", "s12:auto"]);
  t.ok(`${fmt} 통합 탭 — 동아리 내용이 섞이지 않는다`, r.fresh.every(p => !/동아리/.test(p.text)));
  t.eq(`${fmt} 통합 탭 — 10405 는 다른 반이다`, r.outOfClass, 1);

  t.eq(`${fmt} 숨김 탭 — 숨긴 표시가 남는다`, pick(sheets, "숨김").hidden, true);

  r = planTab(sheets, "행사 취합");
  t.eq(`${fmt} 행사 취합 탭 — 한 칸의 여러 이름을 진로로 나눠 담는다`, r.got, ["s5:career", "s12:career"]);
  t.eq(`${fmt} 행사 취합 탭 — 명단에 없는 이름을 알려 준다`, Object.keys(r.unmatched), ["박수민"]);
  t.eq(`${fmt} 행사 취합 탭 — 동아리 줄은 뺀다`, r.noArea, 1);
  t.eq(`${fmt} 행사 취합 탭 — 전교생 줄은 켜면 담을 수 있다고 알려 준다`, r.wholeOffer, 1);
});

t.done();
