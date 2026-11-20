// 슬라이드 뚝딱 — 사용법 영상 내레이션 만들기 (창체 비서 moa/guide/make-voice.mjs 와 같은 방식)
// index.html 의 UV_SAY(자막 · 읽을 말)를 VoiceStudio 「멋남 · 릴스 TTS 1」 목소리로 읽히고,
// 한 파일(guide/narration.m4a)로 이어 붙인 뒤, 줄마다 그 파일 안의 자리·길이(UV_VO)를 index.html 에 고쳐 씁니다.
//
//   cd C:\Users\User\Desktop\코딩\hirameki\slide\guide
//   node make-voice.mjs                 바뀐 줄·빠진 줄만 새로 읽힙니다(나머지는 voice-cache 에서 다시 씀)
//   node make-voice.mjs --redo c3b,c5d  그 줄만 다시 읽힙니다(발음이 이상할 때) · --seed 9 처럼 씨앗을 바꿔도 됩니다
//
// 필요한 것: VoiceStudio(목소리 「멋남 · 릴스 TTS 1」), ffmpeg. 한 줄에 1~3분 걸립니다(이 PC CPU 기준).
// voice-cache 의 wav 는 사이트에 올리지 않습니다(.gitignore). 사이트에는 narration.m4a 만 나갑니다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(HERE, '..', 'index.html');
const CACHE = path.join(HERE, 'voice-cache');
const OUT = path.join(HERE, 'narration.m4a');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const VOICE = '멋남 · 릴스 TTS 1';
const SEED = arg('seed', '7');
const REDO = new Set((arg('redo', '') || '').split(',').filter(Boolean));
const RATE = 44100, GAP = 0.45, LEAD = 0.1;   // 줄 사이 빈 소리(초) · 맨 앞 빈 소리

const VS = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'VoiceStudio', 'resources', 'cli', 'voicestudio.exe');
function findFfmpeg(){
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  const w = spawnSync('where', ['ffmpeg'], { encoding: 'utf8' });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim().split(/\r?\n/)[0];
  const base = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(base)) for (const d of fs.readdirSync(base).filter(n => /ffmpeg/i.test(n))) {
    for (const sub of fs.readdirSync(path.join(base, d))) {
      const exe = path.join(base, d, sub, 'bin', 'ffmpeg.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  throw new Error('ffmpeg 를 찾지 못했습니다. FFMPEG 환경 변수에 ffmpeg.exe 경로를 넣어 주세요.');
}
const FF = findFfmpeg();
const run = (exe, args, label) => {
  const r = spawnSync(exe, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${label} 실패 (${r.status})\n${(r.stderr || r.stdout || '').slice(-1500)}`);
  return r.stdout;
};

// index.html 의 /*SAY*/{…}/*SAY-END*/ · /*VO*/{…}/*VO-END*/ 사이를 읽고 쓴다
let html = fs.readFileSync(HTML, 'utf8');
const between = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); if (i < 0 || j < i) throw new Error(`index.html 에 ${a} … ${b} 표시가 없습니다`); return [i + a.length, j]; };
const [s0, s1] = between('/*SAY*/', '/*SAY-END*/');
const SAY = JSON.parse(html.slice(s0, s1));
const ids = Object.keys(SAY);
console.log(`내레이션 ${ids.length}줄 · 목소리 「${VOICE}」 · 씨앗 ${SEED}`);

fs.mkdirSync(CACHE, { recursive: true });
const keyOf = speech => crypto.createHash('sha1').update(`${VOICE}|${SEED}|${speech}`).digest('hex').slice(0, 12);

// wav(16비트) 의 소리 부분만 꺼낸다 — ffmpeg 가 앞에 LIST 덩어리를 붙여도 data 덩어리를 찾아 읽는다
function pcmOf(file){
  const b = fs.readFileSync(file);
  let p = 12;
  while (p + 8 <= b.length) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4);
    if (id === 'data') return b.subarray(p + 8, p + 8 + n);
    p += 8 + n + (n & 1);
  }
  throw new Error('wav 를 읽지 못했습니다: ' + file);
}
function wavOf(pcm){
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const t0 = Date.now();
let made = 0;
for (const id of ids) {
  const speech = SAY[id][1];
  const raw = path.join(CACHE, keyOf(speech) + '.wav');
  if (fs.existsSync(raw) && !REDO.has(id)) continue;
  const tic = Date.now();
  process.stdout.write(`  ${id} 읽히는 중 … `);
  const tmp = raw + '.part.wav';
  run(VS, ['--timeout', '1500', 'speak', '--voice', VOICE, '--language', 'Korean', '--seed', SEED, '-o', tmp, '--overwrite', speech], 'VoiceStudio');
  fs.renameSync(tmp, raw);
  made++;
  console.log(`${Math.round((Date.now() - tic) / 1000)}초 · ${speech}`);
}

// 줄마다 앞뒤 빈 소리를 다듬어 이어 붙인다(44.1kHz 한 채널) → 자리·길이를 잰다
const parts = [Buffer.alloc(Math.round(LEAD * RATE) * 2)];
let at = LEAD;
const VO = {};
for (const id of ids) {
  const raw = path.join(CACHE, keyOf(SAY[id][1]) + '.wav');
  const trim = path.join(CACHE, 'trim.wav');
  run(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af',
    'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse',
    '-ar', String(RATE), '-ac', '1', '-c:a', 'pcm_s16le', trim], '다듬기');
  const pcm = pcmOf(trim);
  fs.rmSync(trim, { force: true });
  const dur = pcm.length / 2 / RATE;
  VO[id] = [+at.toFixed(3), +dur.toFixed(3)];
  parts.push(pcm, Buffer.alloc(Math.round(GAP * RATE) * 2));
  at += dur + Math.round(GAP * RATE) / RATE;
}
const all = path.join(CACHE, 'all.wav');
fs.writeFileSync(all, wavOf(Buffer.concat(parts)));
// 소리 크기를 고르게(-16 LUFS) 맞추고 AAC 64kbps 한 채널로 — 길이·자리는 그대로
run(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', all, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', String(RATE), '-ac', '1',
  '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', '-metadata', 'title=슬라이드 뚝딱 사용법 내레이션',
  '-metadata', 'comment=AI 목소리(VoiceStudio)로 만든 내레이션', OUT], 'm4a 만들기');
fs.rmSync(all, { force: true });

// index.html 에 UV_VO 를 고쳐 쓴다(줄 끝은 파일 그대로). 목소리를 만드는 동안 index.html 을 고쳤을 수 있어 다시 읽는다
html = fs.readFileSync(HTML, 'utf8');
const nl = html.includes('\r\n') ? '\r\n' : '\n';
const voText = '{' + nl + ids.map(id => `  "${id}": [${VO[id][0]}, ${VO[id][1]}]`).join(',' + nl) + nl + '}';
const [v0, v1] = between('/*VO*/', '/*VO-END*/');
html = html.slice(0, v0) + voText + html.slice(v1);
fs.writeFileSync(HTML, html, 'utf8');

const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`새로 읽힌 줄 ${made}개 · 전체 ${at.toFixed(1)}초 · narration.m4a ${kb}KB · 걸린 시간 ${Math.round((Date.now() - t0) / 1000)}초`);
console.log('index.html 의 UV_VO 를 고쳐 썼습니다.');
