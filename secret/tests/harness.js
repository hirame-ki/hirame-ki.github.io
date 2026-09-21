/* index.html 안의 @import-core 구간만 떼어내 node 에서 돌린다.
   빌드 도구도 의존성도 없다 — 앱은 파일 하나로 굴러가야 하므로 테스트도 그 원칙을 따른다.

   구간을 늘리고 싶으면 index.html 에
     /* ===== @import-core:start ... * /  ~  /* ===== @import-core:end ... * /
   로 감싸고, 아래 CORE_NAMES 에 이름을 더하면 된다.
   그 구간에는 document · window · state 를 쓰면 안 된다 (아래에서 막는다). */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "..", "index.html");

const CORE_NAMES = [
  "guessArea", "isOtherArea",
  "onlyDigits", "sameNumStr",
  "nameNfc", "acNameKey", "headKey",
  "parseNamePiece", "findByName", "splitPeople", "splitNums",
  "parseStudentNo", "parseClassNumbers",
  "HEAD_WORDS", "findHeaderRow", "guessAcRoles",
  "planAcSheet",
];

/* 순수 함수 구간이 몰래 브라우저 API 를 쓰기 시작하면 테스트가 먼저 깨지게 한다 */
const FORBIDDEN = /\b(document|window|localStorage|indexedDB)\s*\.|\bstate\s*\./;

function extractCore(){
  const src = fs.readFileSync(SRC, "utf8");
  const re = /@import-core:start[\s\S]*?\*\/([\s\S]*?)\/\* =+ @import-core:end/g;
  const parts = [...src.matchAll(re)].map(m => m[1]);
  if(!parts.length){
    throw new Error("index.html 에서 @import-core 구간을 찾지 못했습니다. 표시가 지워졌는지 확인하세요.");
  }
  const code = parts.join("\n");
  const bad = code.match(FORBIDDEN);
  if(bad){
    throw new Error("@import-core 구간에서 브라우저 API 를 씁니다: " + bad[0] +
                    "\n순수 함수로 남겨 두세요 (필요한 값은 인수로 받기).");
  }
  return { code, blocks: parts.length };
}

function loadCore(){
  const { code, blocks } = extractCore();
  const sandbox = { module: { exports: {} }, console };
  vm.runInNewContext(
    code + "\n;module.exports = { " + CORE_NAMES.join(", ") + " };",
    sandbox,
    { filename: "index.html#import-core" }
  );
  const api = sandbox.module.exports;
  const missing = CORE_NAMES.filter(n => api[n] === undefined);
  if(missing.length) throw new Error("구간에서 못 찾은 이름: " + missing.join(", "));
  api.__blocks = blocks;
  return api;
}

/* ---- 아주 작은 테스트 틀 ---- */
function createRunner(title){
  const fails = [];
  let count = 0, group = "";

  const show = v => typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v);

  const t = {
    group(name){ group = name; console.log("\n" + name); },
    ok(label, cond, detail){
      count++;
      if(cond){ console.log("  ✓ " + label); }
      else {
        console.log("  ✗ " + label + (detail ? "  → " + detail : ""));
        fails.push((group ? group + " / " : "") + label + (detail ? " → " + detail : ""));
      }
    },
    eq(label, got, want){
      t.ok(label, JSON.stringify(got) === JSON.stringify(want),
           "받은 값 " + show(got) + " · 기대한 값 " + show(want));
    },
    done(){
      console.log("\n" + "─".repeat(58));
      if(fails.length){
        console.log(`${title}: ${count - fails.length}/${count} 통과 · 실패 ${fails.length}건`);
        fails.forEach(f => console.log("  · " + f));
        process.exitCode = 1;
      } else {
        console.log(`${title}: ${count}/${count} 모두 통과`);
      }
    }
  };
  console.log(title);
  return t;
}

module.exports = { loadCore, extractCore, createRunner, SRC };
