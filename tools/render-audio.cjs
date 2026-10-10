// 웹 게임의 소리(src/audio.js)를 Chromium의 OfflineAudioContext로 그대로 녹음해 Godot용 OGG 파일로 만든다.
//   node tools/render-audio.cjs   →  godot/assets/audio/{bgm,sfx,jingle,cry}/*.ogg + godot/data/audio.json
// BGM은 멜로디·반주 길이의 최소공배수만큼 녹음하고, 끝에서 넘치는 꼬리를 앞쪽에 더해 끊김 없이 반복된다.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'godot/assets/audio');
const RATE = 32000;
const BGM_GAIN = 0.12, SFX_GAIN = 0.17;   // 웹 게임의 최대 BGM 음량, 효과음 음량

const PAGE = `
const SET={bgm:5,sfx:1};const rnd=n=>Math.floor(Math.random()*n);
function rng(seed){let s=(seed*2654435761)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const sleep=ms=>Promise.resolve();let SP={};
`;
const PAGE2 = `
function initFor(ctx){AC=ctx;master=AC.createGain();master.connect(AC.destination);
  bgmGain=AC.createGain();sfxGain=AC.createGain();bgmGain.connect(master);sfxGain.connect(master);
  bgmGain.gain.value=${BGM_GAIN};sfxGain.gain.value=${SFX_GAIN};
  const len=AC.sampleRate*1,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;NOISE=buf;
  for(const duty of[.125,.25,.5]){const n=32,re=new Float32Array(n),im=new Float32Array(n);
    for(let k=1;k<n;k++){re[k]=0;im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*duty);}PULSE[duty]=AC.createPeriodicWave(re,im);}
  const mk=h=>{const re=new Float32Array(h.length+1),im=new Float32Array(h.length+1);h.forEach((v,i)=>im[i+1]=v);return AC.createPeriodicWave(re,im);};
  SOFT.lead=mk([1,.12,.04]);SOFT.bell=mk([1,0,.08,0,.02]);SOFT.mid=mk([1,.25,.08,.03]);}
const gcd=(a,b)=>b?gcd(b,a%b):a;
async function renderFn(sec,fn){const ctx=new OfflineAudioContext(1,Math.ceil(sec*${RATE}),${RATE});initFor(ctx);fn();
  const b=await ctx.startRendering();return Array.from(b.getChannelData(0));}
async function renderSfx(n){return renderFn(2.5,()=>SFX[n]());}
async function renderCry(sid,human){SP={[sid]:human?{human:1}:{}};return renderFn(1.5,()=>cry(sid));}
async function renderJingle(n){const J=JINGLES[n],{len}=parseMel(J.mel),dt=60/(J.bpm*.88)/4;
  return renderFn(len*dt+1.5,()=>{Music.cur=null;Music.jingle(n);});}
async function renderSong(name){const S=buildSong(SONGS[name]),dt=60/S.bpm/4;
  const total=S.steps*S.melLen/gcd(S.steps,S.melLen),loopSec=total*dt,tail=2;
  const data=await renderFn(loopSec+tail,()=>{Music.song=S;Music.nodes=[];
    for(let p=0,t=0.0;p<total;p++,t+=dt){
      const mp=p%S.melLen;for(const e of S.mel)if(e.t===mp)Music.note(e.f,e.d*dt,{wave:SOFT.lead,v:.42,t,ep:1});
      const ap=p%S.steps;for(const e of S.arp)if(e.t===ap)Music.note(e.f,e.d*dt*1.6,{wave:SOFT.bell,v:.3*(e.v||.5),t,pluck:1});
      for(const e of S.bass)if(e.t===ap)Music.note(e.f,e.d*dt*.95,{type:'sine',v:.55,t,pluck:1});
      for(const e of S.drum)if(e.t===ap)Music.drum(e.k,t);}});
  const n=Math.round(loopSec*${RATE});
  if(S.loop){for(let i=n;i<data.length;i++)data[i-n]+=data[i];return {data:data.slice(0,n),loop:true,steps:total};}
  return {data,loop:false,steps:total};}
`;

function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24);
  b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36);
  b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), 44 + i * 2));
  return b;
}
// 끝의 무음을 잘라낸다
function trim(d) {
  let e = d.length;
  while (e > 0 && Math.abs(d[e - 1]) < 0.0004) e--;
  return d.slice(0, Math.min(d.length, e + 64));
}
function save(rel, samples, scale, q = 3) {
  const f = path.join(OUT, rel + '.ogg'), tmp = path.join(OUT, '_tmp.wav');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(tmp, wav(samples.map(v => v * scale)));
  if(process.env.AUDIO_PYTHON)execFileSync(process.env.AUDIO_PYTHON,[path.join(ROOT,'tools/encode-ogg.py'),tmp,f]);
  else execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-c:a', 'libvorbis', '-q:a', String(q), f]);
  fs.unlinkSync(tmp);
}
const peak = d => d.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/audio.js'), 'utf8').replace(/document\.addEventListener\([^\n]*\n/, '');
  const game = JSON.parse(fs.readFileSync(path.join(ROOT, 'godot/data/game.json'), 'utf8'));
  const browser = await chromium.launch(process.env.AUDIO_BROWSER ? {executablePath:process.env.AUDIO_BROWSER} : {});
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: PAGE + src + PAGE2 });
  const names = await page.evaluate(() => ({ sfx: Object.keys(SFX), songs: Object.keys(SONGS), jingles: Object.keys(JINGLES) }));
  fs.rmSync(OUT, { recursive: true, force: true });
  const meta = { rate: RATE, bgm_gain: BGM_GAIN, sfx_gain: SFX_GAIN, bgm: {}, sfx: names.sfx, jingle: {}, cry: {} };

  // BGM: 곡마다 따로 정규화하지 않고 공통 배율 하나로 (곡 사이 음량 차이 유지)
  const songs = {};
  for (const n of names.songs) songs[n] = await page.evaluate(n => renderSong(n), n);
  const jingles = {};
  for (const n of names.jingles) jingles[n] = trim(await page.evaluate(n => renderJingle(n), n));
  const bp = Math.max(...Object.values(songs).map(s => peak(s.data)), ...Object.values(jingles).map(peak));
  const bscale = 0.9 / bp;   // 녹음 배율: 재생할 때 (설정 음량 / 0.12) / bscale
  meta.bgm_scale = bscale;
  for (const [n, s] of Object.entries(songs)) {
    save('bgm/' + n, s.data, bscale, 2);
    meta.bgm[n] = { loop: s.loop, sec: +(s.data.length / RATE).toFixed(3) };
  }
  for (const [n, d] of Object.entries(jingles)) {
    save('jingle/' + n, d, bscale, 3);
    meta.jingle[n] = +(d.length / RATE).toFixed(3);
  }
  // 효과음·울음소리: 공통 배율
  const sfx = {};
  for (const n of names.sfx) sfx[n] = trim(await page.evaluate(n => renderSfx(n), n));
  const cries = {};
  for (const sid of Object.keys(game.species)) {
    if (game.species[sid].human) continue;
    cries[sid] = trim(await page.evaluate(([s]) => renderCry(+s, false), [sid]));
  }
  const sp = Math.max(...Object.values(sfx).map(peak), ...Object.values(cries).map(peak));
  const sscale = Math.min(4, 0.9 / sp);
  meta.sfx_scale = sscale;
  for (const [n, d] of Object.entries(sfx)) save('sfx/' + n, d, sscale, 4);
  for (const [sid, d] of Object.entries(cries)) {
    save('cry/' + sid, d, sscale, 3);
    meta.cry[sid] = +(d.length / RATE).toFixed(3);
  }
  await browser.close();
  fs.writeFileSync(path.join(ROOT, 'godot/data/audio.json'), JSON.stringify(meta, null, 1));
  console.log('bgm peak', bp.toFixed(3), 'scale', bscale.toFixed(2), '| sfx peak', sp.toFixed(3), 'scale', sscale.toFixed(2));
  for (const [n, s] of Object.entries(meta.bgm)) console.log(n, s.sec + 's', songs[n].steps + ' steps');
})();
