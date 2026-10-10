/* =========================================================
   audio.js — 칩튠 BGM 시퀀서, 효과음, 몬스터 울음소리 (모두 오리지널)
   ========================================================= */
let AC=null,bgmGain=null,sfxGain=null,master=null,NOISE=null,PULSE={},SOFT={};
let muted=false;
function audioInit(){try{
  if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.connect(AC.destination);
    bgmGain=AC.createGain();sfxGain=AC.createGain();
    // 필터/에코 없이 깨끗하게 바로 출력
    bgmGain.connect(master);sfxGain.connect(master);applyVolume();
    const len=AC.sampleRate*1,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;NOISE=buf;
    for(const duty of[.125,.25,.5]){const n=32,re=new Float32Array(n),im=new Float32Array(n);
      for(let k=1;k<n;k++){re[k]=0;im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*duty);}PULSE[duty]=AC.createPeriodicWave(re,im);}
    // 부드러운 음색(플루트/오르골 느낌) — 사각파 대신 사용
    const mk=h=>{const re=new Float32Array(h.length+1),im=new Float32Array(h.length+1);h.forEach((v,i)=>im[i+1]=v);return AC.createPeriodicWave(re,im);};
    SOFT.lead=mk([1,.12,.04]);SOFT.bell=mk([1,0,.08,0,.02]);SOFT.mid=mk([1,.25,.08,.03]);
    if(Music.want)Music.play(Music.want,true);}
  else if(AC.state==='suspended')AC.resume();}catch(e){}}
function applyVolume(){if(!AC)return;const t=AC.currentTime;master.gain.setValueAtTime(muted?0:1,t);
  bgmGain.gain.setValueAtTime([0,.028,.045,.065,.09,.12][SET.bgm]||0,t);sfxGain.gain.setValueAtTime(SET.sfx?.17:0,t);}
function toggleMute(){muted=!muted;applyVolume();if(typeof toast==='function')toast(muted?'소리 꺼짐':'소리 켜짐');}
// 다른 앱·탭으로 가면 소리를 멈추고, 돌아오면 다시 재생 (안드로이드 앱도 이 함수를 부름)
let bgPaused=false;
function audioPause(){try{if(AC&&AC.state==='running'){bgPaused=true;AC.suspend();}}catch(e){}}
function audioResume(){try{if(AC&&bgPaused){bgPaused=false;AC.resume();}}catch(e){}}
document.addEventListener('visibilitychange',()=>document.hidden?audioPause():audioResume());

/* ---------- 효과음 ---------- */
function osc(f,d,{type='square',duty=0,v=.5,slide=0,delay=0,dest=null,attack=.012}={}){if(!AC)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
  if(duty||type==='square'||type==='sawtooth')o.setPeriodicWave(duty===.125?SOFT.bell:SOFT.mid);else o.type=type;v*=.8;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(dest||sfxGain);o.start(t);o.stop(t+d+.03);}
function noise(d,{v=.4,delay=0,f=3000,q=1,type='bandpass',slide=0,dest=null}={}){if(!AC)return;const t=AC.currentTime+delay,s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=NOISE;fl.type=type;fl.frequency.setValueAtTime(f,t);if(slide)fl.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);fl.Q.value=q;
  v*=.55;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl).connect(g).connect(dest||sfxGain);s.start(t,Math.random()*.5);s.stop(t+d+.03);}
const N2F=(()=>{const m={C:0,D:2,E:4,F:5,G:7,A:9,B:11};return s=>{const r=/^([A-G])([#b]?)(-?\d)$/.exec(s);if(!r)return 0;let n=m[r[1]]+(r[2]==='#'?1:r[2]==='b'?-1:0)+(+r[3]+1)*12;return 440*Math.pow(2,(n-69)/12);};})();
const seq=(notes,step=.07,o={})=>notes.forEach((n,i)=>n&&osc(N2F(n),step*1.6,{duty:.25,v:.35,delay:i*step,...o}));
const SFX={
  cur:()=>osc(1320,.04,{duty:.5,v:.25}),
  sel:()=>{osc(988,.05,{duty:.25,v:.3});osc(1319,.08,{duty:.25,v:.3,delay:.05});},
  back:()=>{osc(880,.05,{duty:.25,v:.3});osc(660,.08,{duty:.25,v:.3,delay:.05});},
  bad:()=>{osc(180,.09,{duty:.5,v:.35});osc(150,.12,{duty:.5,v:.35,delay:.09});},
  bump:()=>osc(80,.08,{type:'square',v:.25,slide:-20}),
  door:()=>{noise(.12,{v:.35,f:900});osc(220,.12,{type:'triangle',v:.4,delay:.06,slide:-80});},
  exit:()=>{noise(.16,{v:.3,f:600,slide:-300});},
  jump:()=>osc(300,.18,{duty:.5,v:.3,slide:500}),
  land:()=>noise(.06,{v:.3,f:500}),
  grass:()=>noise(.08,{v:.12,f:4500,q:.7}),
  menu:()=>{osc(660,.05,{duty:.25,v:.3});osc(990,.07,{duty:.25,v:.3,delay:.04});},
  hit:()=>{noise(.16,{v:.6,f:1200,slide:-900});osc(160,.12,{type:'square',v:.35,slide:-100});},
  super:()=>{noise(.2,{v:.7,f:1800,slide:-1500});osc(220,.08,{type:'square',v:.4,slide:-120});osc(110,.18,{type:'square',v:.4,delay:.08,slide:-50});},
  weak:()=>{noise(.1,{v:.35,f:700,slide:-400});osc(120,.1,{type:'triangle',v:.4});},
  miss:()=>noise(.18,{v:.25,f:6000,type:'highpass'}),
  faint:()=>osc(600,.6,{duty:.25,v:.4,slide:-560}),
  statup:()=>{for(let i=0;i<6;i++)osc(500+i*120,.08,{duty:.25,v:.25,delay:i*.04});},
  statdn:()=>{for(let i=0;i<6;i++)osc(1100-i*120,.08,{duty:.25,v:.25,delay:i*.04});},
  throw:()=>noise(.3,{v:.3,f:2500,slide:2000,q:2}),
  open:()=>{osc(400,.2,{duty:.125,v:.35,slide:900});noise(.25,{v:.3,f:5000,type:'highpass',delay:.05});},
  absorb:()=>{for(let i=0;i<8;i++)osc(1500-i*140,.06,{duty:.125,v:.22,delay:i*.03});},
  wobble:()=>{osc(240,.06,{type:'square',v:.35});osc(180,.08,{type:'square',v:.3,delay:.06});},
  click:()=>{osc(1800,.03,{duty:.5,v:.35});osc(900,.06,{duty:.5,v:.3,delay:.03});},
  breakout:()=>{noise(.25,{v:.5,f:3000});osc(500,.2,{duty:.25,v:.3,slide:500});},
  exp:()=>osc(1000+Math.random()*400,.03,{duty:.25,v:.12}),
  run:()=>{for(let i=0;i<4;i++)noise(.06,{v:.25,f:1500+i*300,delay:i*.07});},
  heal:()=>seq(['C6','E6','G6','C7'],.06,{v:.25}),
  burn:()=>noise(.4,{v:.4,f:900,slide:-500}),
  poison:()=>{for(let i=0;i<4;i++)osc(300+rnd(200),.08,{type:'sine',v:.4,delay:i*.08,slide:-100});},
  para:()=>{for(let i=0;i<5;i++)osc(1500+rnd(800),.04,{duty:.125,v:.25,delay:i*.05});},
  sleep:()=>seq(['G5','E5','C5'],.15,{v:.2,type:'triangle',duty:0}),
  shiny:()=>seq(['E7','G7','B7','E8'],.05,{v:.18,duty:.125}),
  save:()=>seq(['C5','E5','G5','C6','-','G5','C6'],.08,{v:.28}),
  lowhp:()=>{osc(1568,.09,{duty:.5,v:.12});osc(1318,.12,{duty:.5,v:.12,delay:.1});},
  swap:()=>{osc(700,.05,{duty:.25,v:.25});osc(500,.05,{duty:.25,v:.25,delay:.05});},
  shake:()=>{noise(.5,{v:.6,f:200,type:'lowpass'});},
  bolt:()=>{noise(.3,{v:.5,f:4000,type:'highpass'});osc(80,.25,{type:'sawtooth',v:.3,slide:-40});},
  splash:()=>{noise(.3,{v:.4,f:1500,slide:-1000,q:3});},
  wind:()=>noise(.4,{v:.35,f:800,slide:1800,q:4}),
  leaf:()=>{for(let i=0;i<5;i++)noise(.05,{v:.25,f:3000+rnd(2000),delay:i*.06});},
  rock:()=>{for(let i=0;i<3;i++){noise(.15,{v:.45,f:300,type:'lowpass',delay:i*.1});osc(90,.12,{type:'square',v:.25,delay:i*.1,slide:-30});}},
  sparkle:()=>seq(['C7','G7','E7','C8'],.04,{v:.15,duty:.125}),
};
function sfx(n){if(!AC||!SFX[n])return;try{SFX[n]();}catch(e){}}
/* 울음소리: 종족 번호로 고유한 소리를 합성 */
/* 울음소리 (사람은 울음소리 대신 짧은 효과음) */
function cry(sid,o={}){if(!AC)return;if(SP[sid]&&SP[sid].human){if(!o.faint)sfx('sel');return;}const R=rng(sid*977+13),base=220+R()*500,len=(.35+R()*.35)*(o.faint?1.4:1),wav=['triangle','sine','triangle'][Math.floor(R()*3)];
  const pitch=o.faint?.7:1,t=AC.currentTime,g=AC.createGain(),o1=AC.createOscillator(),o2=AC.createOscillator(),lfo=AC.createOscillator(),lg=AC.createGain();
  o1.type=wav;o2.type='triangle';const f=base*pitch;
  o1.frequency.setValueAtTime(f,t);o1.frequency.linearRampToValueAtTime(f*(1.2+R()*.8),t+len*.25);o1.frequency.linearRampToValueAtTime(f*(.6+R()*.5),t+len);
  o2.frequency.setValueAtTime(f*1.5,t);o2.frequency.linearRampToValueAtTime(f*(.8+R()),t+len);
  lfo.frequency.value=12+R()*30;lg.gain.value=f*(.05+R()*.15);lfo.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.3,t+.03);g.gain.setValueAtTime(.26,t+len*.7);g.gain.exponentialRampToValueAtTime(.0001,t+len);
  const g2=AC.createGain();g2.gain.value=.35;o1.connect(g);o2.connect(g2).connect(g);g.connect(sfxGain);
  [o1,o2,lfo].forEach(o=>{o.start(t);o.stop(t+len+.05);});
  return sleep(len*1000);}

/* ---------- BGM 시퀀서 ----------
   곡 = {bpm, bars:[코드...], mel:'C5.2 E5.2 ...', bass:스타일, arp:스타일, drum:스타일}
   음표 토큰: 음이름+옥타브.길이(16분음표 단위), 쉼표 '-' */
const CH={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
function chordNotes(c){const m=/^([A-G][#b]?)(m7|maj7|m|7|sus4|dim)?$/.exec(c);const r=CH[m[1]],q=m[2]||'';
  const iv={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],sus4:[0,5,7],dim:[0,3,6]}[q];return iv.map(i=>r+i);}
const midiF=n=>440*Math.pow(2,(n-69)/12);
function parseMel(s,tr=0){const ev=[];let t=0;for(const tok of s.trim().split(/\s+/)){const[nn,d]=tok.split('.');const dur=+d||2;
  if(nn!=='-'){const f=N2F(nn);ev.push({t,d:dur,f:f*Math.pow(2,tr/12)});}t+=dur;}return{ev,len:t};}
function buildSong(S){const bars=S.bars.flatMap(b=>b.split(' ').length>1?[b]:[b]),steps=bars.length*16,tr=S.tr||0;
  const mel=parseMel(S.mel,tr);const bass=[],arp=[],drum=[];
  bars.forEach((bar,bi)=>{const parts=bar.split(' '),per=16/parts.length;
    parts.forEach((c,pi)=>{const ns=chordNotes(c),t0=bi*16+pi*per,root=36+ns[0]+tr+(ns[0]>5?-12:0)+12;
      // 베이스
      const B=S.bass||'walk';
      for(let s=0;s<per;s+=2){let n=root;
        if(B==='walk')n=root+[0,7,12,7][(s/2)%4]-(s/2%4===2?0:0);
        else if(B==='drive')n=root+((s/2)%2?12:0);
        else if(B==='march')n=root+((s/4)%2?7:0);
        else if(B==='pulse'){if(s%4)continue;n=root;}
        else if(B==='slow'){if(s%8)continue;n=root+(s%16?7:0);}
        bass.push({t:t0+s,d:B==='pulse'?4:B==='slow'?8:2,f:midiF(n)});}
      // 화음 아르페지오
      const A={fast:'up',trem:'off'}[S.arp]||S.arp||'up';const chord=ns.map(n=>60+n+tr+(n>7?-12:0));
      if(A==='up'||A==='fast'){const st=A==='fast'?1:2;for(let s=0;s<per;s+=st){const n=chord[(s/st)%chord.length]+((s/st)>=chord.length?12:0);arp.push({t:t0+s,d:st,f:midiF(n),v:.5});}}
      else if(A==='off'){for(let s=2;s<per;s+=4)chord.forEach(n=>arp.push({t:t0+s,d:1.5,f:midiF(n),v:.32}));}
      else if(A==='pad'){chord.forEach(n=>arp.push({t:t0,d:per,f:midiF(n),v:.22}));}
      else if(A==='trem'){for(let s=0;s<per;s+=1)arp.push({t:t0+s,d:1,f:midiF(chord[s%2?1:0]+12),v:.3});}
    });
    const DR={fast:'soft',rock:'soft',beat:'soft',march:'none',swing:'none',soft:'none'};const D={march:'k-h-s-h-k-k-s-h-',beat:'k-h-s-h-k-h-s-hh',rock:'k-hks-hkk-hks-hs',soft:'k---h---s---h---',none:'----------------',fast:'kh-hskh-khkhskhs',swing:'k--hs--hk--hs-hh'}[DR[S.drum||'beat']||S.drum||'beat'];
    for(let s=0;s<16;s++)if(D[s]!=='-')drum.push({t:bi*16+s,k:D[s]});});
  return{bpm:Math.round(S.bpm*(S.bpm>150?.78:.86)),steps,mel:mel.ev,melLen:Math.max(mel.len,1),bass,arp,drum,loop:S.loop!==false,lead:S.lead||.25};}
// Revised 2026-10-11: new scores, no external song references.
const SONGS={
 "title": {
  "bpm": 118,
  "bars": [
   "E",
   "Bm",
   "A",
   "F#m"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "F#5.3 A5.1 B5.4 -.2 E5.2 G#5.4 D6.2 B5.3 F#5.1 A5.4 E5.2 -.4 C#6.3 E6.1 B5.2 A5.2 F#5.4 E5.4 G#5.2 B5.2 F#5.3 E5.1 D5.2 E5.6"
 },
 "town": {
  "bpm": 103,
  "bars": [
   "D",
   "G",
   "Bm",
   "A"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "A4.3 D5.1 F#5.2 E5.2 -.4 B4.4 G5.2 D5.3 B4.1 E5.4 F#5.2 A5.4 F#5.3 B5.1 A5.2 D5.2 E5.4 F#5.4 B4.2 E5.2 C#5.3 A4.1 D5.2 E5.6"
 },
 "route": {
  "bpm": 127,
  "bars": [
   "Am",
   "D",
   "G",
   "Em"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "E5.2 A5.3 B5.1 D6.4 G5.2 -.4 F#5.3 E5.1 A5.2 D5.2 B5.4 A5.4 G5.3 B5.1 D6.2 E6.2 C6.4 B5.4 A5.2 F#5.2 B5.3 E5.1 G5.2 E5.6"
 },
 "city": {
  "bpm": 109,
  "bars": [
   "Bb",
   "Gm",
   "Eb",
   "F"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "D5.3 F5.1 A5.4 -.2 C6.2 Bb5.4 G5.2 D5.3 F5.1 Bb5.4 A5.2 G5.4 Eb5.3 G5.1 D6.2 C6.2 Bb5.4 F5.4 A5.2 C6.2 G5.3 F5.1 Eb5.2 F5.6"
 },
 "center": {
  "bpm": 89,
  "bars": [
   "G",
   "Em",
   "C",
   "D"
  ],
  "bass": "slow",
  "arp": "pad",
  "drum": "none",
  "mel": "B4.3 E5.1 A5.4 -.2 G5.2 D5.4 F#5.2 G5.3 B5.1 E5.4 D5.2 -.4 E5.3 A5.1 G5.2 C5.2 D5.4 E5.4 F#5.2 B4.2 E5.3 D5.1 A4.2 G4.6"
 },
 "gym": {
  "bpm": 116,
  "bars": [
   "F#m",
   "D",
   "E",
   "Bm"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "C#5.3 F#5.1 A5.2 B5.2 -.4 E5.4 D6.2 A5.3 F#5.1 E5.4 G#5.2 A5.4 B5.3 E6.1 G#5.2 F#5.2 D5.4 E5.4 F#5.2 A5.2 C#5.3 B4.1 E5.2 F#5.6"
 },
 "wild": {
  "bpm": 159,
  "bars": [
   "Em",
   "C",
   "Am",
   "Bm"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "B5.1 E5.3 G5.2 A5.2 F#5.1 D5.3 E5.4 C6.2 G5.1 E5.3 A5.2 B5.2 D6.2 G5.4 A5.3 E5.1 B5.2 C6.2 G5.4 F#5.4 D6.2 B5.2 F#5.3 A5.1 E5.2 B5.6"
 },
 "trainer": {
  "bpm": 151,
  "bars": [
   "Bm",
   "G",
   "D",
   "A"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "F#5.3 B5.1 D6.2 E6.2 A5.4 G5.4 B5.2 G5.3 E5.1 F#5.4 D6.2 B5.4 A5.3 D6.1 F#6.2 E6.2 B5.4 A5.4 E6.2 C#6.2 G5.3 A5.1 F#5.2 B5.6"
 },
 "leader": {
  "bpm": 166,
  "bars": [
   "Cm",
   "Ab",
   "Fm",
   "Bb"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "G5.3 C6.1 Eb6.2 D6.2 Bb5.4 Ab5.4 C6.2 Ab5.3 F5.1 G5.4 Eb6.2 C6.4 F6.3 C6.1 G5.2 Ab5.2 Eb5.4 F5.4 D6.2 Bb5.2 F5.3 G5.1 Ab5.2 C6.6"
 },
 "rival": {
  "bpm": 137,
  "bars": [
   "A",
   "D",
   "Bm",
   "E"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "C#5.3 A5.1 F#5.2 E5.2 -.4 B5.4 A5.2 D6.3 F#5.1 G5.4 E5.2 D5.4 B5.3 F#5.1 A5.2 C#6.2 E6.4 D6.4 G#5.2 E5.2 B5.3 F#5.1 A5.2 E5.6"
 },
 "victory": {
  "bpm": 121,
  "bars": [
   "F",
   "Bb",
   "Dm",
   "C"
  ],
  "bass": "pulse",
  "arp": "off",
  "drum": "soft",
  "mel": "A5.3 D6.1 C6.4 F5.2 G5.2 E5.4 D6.2 F6.3 C6.1 Bb5.4 A5.2 F5.4 A5.3 E6.1 D6.2 C6.2 F6.4 E6.4 G5.2 C6.2 F5.3 E5.1 A5.2 F5.6"
 },
 "evolve": {
  "bpm": 92,
  "bars": [
   "Dm",
   "G",
   "Bb",
   "A"
  ],
  "bass": "slow",
  "arp": "off",
  "drum": "none",
  "mel": "A5.3 D6.1 F6.2 E6.2 B5.4 A5.4 G5.2 B5.3 D6.1 E6.4 F6.2 D6.4 F5.3 Bb5.1 A5.2 E6.2 D6.4 C6.4 E6.2 C#6.2 G5.3 A5.1 B5.2 D6.6"
 },
 "intro": {
  "bpm": 94,
  "bars": [
   "F#m",
   "E",
   "D",
   "A"
  ],
  "bass": "slow",
  "arp": "pad",
  "drum": "none",
  "mel": "C#5.3 E5.1 B5.4 -.2 A5.2 F#5.4 G#5.2 B5.3 D6.1 A5.4 E5.2 -.4 F#5.3 A5.1 E6.2 D6.2 B5.4 A5.4 C#6.2 E6.2 B5.3 A5.1 F#5.2 E5.6"
 }
};
const JINGLES={
 "heal": {
  "bpm": 98,
  "mel": "E5.3 A5.2 F#5.1 -.2 C#6.4 B5.3 D6.5",
  "chords": [
   "A"
  ]
 },
 "item": {
  "bpm": 123,
  "mel": "A5.3 D6.1 F#5.2 B5.4 -.2 E6.6",
  "chords": [
   "D"
  ]
 },
 "key": {
  "bpm": 111,
  "mel": "F#5.3 B5.1 E6.4 C#6.2 A5.2 D6.6",
  "chords": [
   "Bm"
  ]
 },
 "level": {
  "bpm": 136,
  "mel": "D6.3 A5.1 C#6.2 E6.3 B5.1 F#6.6",
  "chords": [
   "A"
  ]
 },
 "caught": {
  "bpm": 107,
  "mel": "B5.3 E6.1 A5.2 F#5.2 C#6.4 D6.2 E6.6",
  "chords": [
   "E"
  ]
 },
 "badge": {
  "bpm": 117,
  "mel": "F5.3 Bb5.1 D6.2 C6.4 G5.2 A5.3 F6.5",
  "chords": [
   "Bb"
  ]
 },
 "evolved": {
  "bpm": 101,
  "mel": "A5.3 D6.1 B5.2 G5.4 C#6.2 E6.3 D6.5",
  "chords": [
   "D"
  ]
 },
 "save": {
  "bpm": 104,
  "mel": "F#5.3 B5.1 A5.2 D6.2 E6.3 C#6.5",
  "chords": [
   "Bm"
  ]
 }
};
const Music={cur:null,want:null,song:null,pos:0,next:0,timer:null,nodes:[],jingling:false,
  play(name,force){this.want=name;if(!AC)return;if(this.cur===name&&!force&&this.timer)return;this.stop(true);this.cur=name;if(!name||this.jingling)return;
    this.song=buildSong(SONGS[name]);this.pos=0;this.next=AC.currentTime+.08;this.timer=setInterval(()=>this.tick(),25);},
  stop(keepWant){if(this.timer)clearInterval(this.timer);this.timer=null;this.nodes.forEach(n=>{try{n.stop();}catch(e){}});this.nodes=[];this.cur=null;if(!keepWant)this.want=null;},
  tick(){if(!AC||!this.song)return;const S=this.song,dt=60/S.bpm/4;
    while(this.next<AC.currentTime+.12){const p=this.pos;
      const mp=p%S.melLen;for(const e of S.mel)if(e.t===mp)this.note(e.f,e.d*dt,{wave:SOFT.lead,v:.42,t:this.next,ep:1});
      const ap=p%S.steps;for(const e of S.arp)if(e.t===ap)this.note(e.f,e.d*dt*1.6,{wave:SOFT.bell,v:.3*(e.v||.5),t:this.next,pluck:1});
      for(const e of S.bass)if(e.t===ap)this.note(e.f,e.d*dt*.95,{type:'sine',v:.55,t:this.next,pluck:1});
      for(const e of S.drum)if(e.t===ap)this.drum(e.k,this.next);
      this.pos++;this.next+=dt;
      if(!S.loop&&this.pos>=S.steps){this.stop();return;}}
    this.nodes=this.nodes.filter(n=>n._end>AC.currentTime);},
  note(f,d,{duty=0,wave=null,type='square',v=.5,t,pluck=0,ep=0}){const o=AC.createOscillator(),g=AC.createGain();
    if(wave)o.setPeriodicWave(wave);else if(duty||type==='square')o.setPeriodicWave(SOFT.lead);else o.type=type;
    o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);
    if(pluck){g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);}
    else if(ep){const r=Math.max(d,.12);g.gain.linearRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(v*.45,t+Math.min(.35,r*.6));g.gain.exponentialRampToValueAtTime(.0001,t+r+.12);o.connect(g).connect(bgmGain);o.start(t);o.stop(t+r+.15);o._end=t+r+.18;this.nodes.push(o);return;}
    else{g.gain.linearRampToValueAtTime(v,t+.025);g.gain.linearRampToValueAtTime(v*.7,t+Math.min(.15,d*.5));g.gain.linearRampToValueAtTime(v*.5,t+d*.9);g.gain.linearRampToValueAtTime(.0001,t+d+.04);}o.connect(g).connect(bgmGain);o.start(t);o.stop(t+d+.06);o._end=t+d+.08;this.nodes.push(o);},
  drum(k,t){const s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=NOISE;s._end=t+.3;
    if(k==='k'){const o=AC.createOscillator(),gg=AC.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);gg.gain.setValueAtTime(.2,t);gg.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(gg).connect(bgmGain);o.start(t);o.stop(t+.16);o._end=t+.2;this.nodes.push(o);return;}
    fl.type=k==='s'?'bandpass':'highpass';fl.frequency.value=k==='s'?1400:6000;g.gain.setValueAtTime(k==='s'?.07:.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+(k==='s'?.1:.035));
    s.connect(fl).connect(g).connect(bgmGain);s.start(t,Math.random()*.5);s.stop(t+.2);this.nodes.push(s);},
  /* 짧은 팡파르: BGM을 잠시 멈추고 연주 */
  async jingle(name){if(!AC){await sleep(400);return;}const J=JINGLES[name],resume=this.cur;this.stop(true);this.jingling=true;
    const{ev,len}=parseMel(J.mel),dt=60/(J.bpm*.88)/4,t0=AC.currentTime+.05,ch=chordNotes(J.chords[0]);
    for(const e of ev){this.note(e.f,e.d*dt,{wave:SOFT.lead,v:.5,t:t0+e.t*dt});this.note(e.f/2,e.d*dt*1.5,{wave:SOFT.bell,v:.25,t:t0+e.t*dt,pluck:1});}
    ch.forEach(n=>this.note(midiF(48+n),len*dt,{type:'triangle',v:.5,t:t0}));
    await sleep(len*dt*1000+250);this.jingling=false;if(this.want===resume&&resume)this.play(resume,true);else if(this.want)this.play(this.want,true);}
};
