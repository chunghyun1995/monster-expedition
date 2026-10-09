'use strict';
/* =========================================================
   core.js — 공통 유틸, 설정, 입력, 화면 크기
   ========================================================= */
const $=s=>document.querySelector(s);
const W=256,H=192,T=16,SC=2; // SC: 캔버스 내부 해상도 배율(반 픽셀 디테일용)
const rnd=n=>Math.floor(Math.random()*n);
const chance=p=>Math.random()*100<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad3=n=>String(n).padStart(3,'0');
const EASE={lin:k=>k,out:k=>1-(1-k)*(1-k),in:k=>k*k,io:k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,back:k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);}};
function tween(ms,f,ease=EASE.lin){return new Promise(res=>{if(ms<=0){f(1);res();return;}const t0=performance.now();
  const step=now=>{const k=Math.min(1,(now-t0)/ms);f(ease(k));if(k<1)requestAnimationFrame(step);else res();};requestAnimationFrame(step);});}
/* 한국어 조사: 받침 판별 (숫자·영문 일부 포함) */
const DIGK='영일이삼사오육칠팔구';
function J(w,p){w=String(w);let ch=w[w.length-1];if(/\d/.test(ch))ch=DIGK[+ch];
  const c=ch.charCodeAt(0),jong=(c>=0xAC00&&c<=0xD7A3)?(c-0xAC00)%28:(/[lmnrLMNR]/.test(ch)?1:0);
  if(p==='로')return w+((jong&&jong!==8)?'으로':'로');
  if(p==='이라')return w+(jong?'이라':'라');
  const t={이:['이','가'],은:['은','는'],을:['을','를'],과:['과','와'],아:['아','야']}[p];
  return w+(jong?t[0]:t[1]);}
/* 색 */
function hexRgb(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function rgbHex(r,g,b){return'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');}
function shade(h,f){const[r,g,b]=hexRgb(h);return f>0?rgbHex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):rgbHex(r*(1+f),g*(1+f),b*(1+f));}
function hueShift(h,deg,sat=1){let[r,g,b]=hexRgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let hh=0,s=0;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);hh=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;hh*=60;}
  hh=(hh+deg+360)%360;s=clamp(s*sat,0,1);const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  const f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};const k=hh/360;
  return rgbHex(f(k+1/3)*255,f(k)*255,f(k-1/3)*255);}
function rng(seed){let s=(seed*2654435761)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ---------- 설정 ---------- */
const SET_KEY='monster-expedition-settings-v2';
const SET={text:1,anim:1,bgm:3,sfx:1,style:0,layout:0,tips:1};
try{Object.assign(SET,JSON.parse(localStorage.getItem(SET_KEY)||'{}'));}catch(e){}
function saveSettings(){try{localStorage.setItem(SET_KEY,JSON.stringify(SET));}catch(e){}}

/* ---------- 입력 ---------- */
/* ui 스택의 맨 위 핸들러가 키를 받는다. 키: up down left right a b menu l r */
const ui=[];
const pushH=h=>{ui.push(h);return h;};
const popH=h=>{const i=ui.indexOf(h);if(i>=0)ui.splice(i,1);};
const topH=()=>ui[ui.length-1];
let dirStack=[],tapDir=null;const held={b:false};
const DIRS=new Set(['up','down','left','right']);
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right',
  z:'a',Z:'a',' ':'a',x:'b',X:'b',Backspace:'b',Shift:'b',Enter:'menu',Escape:'menu',c:'menu',C:'menu',q:'l',Q:'l',e:'r',E:'r'};
let fieldKey=null; // world.js가 지정: 필드에서 받는 키 처리
function press(k){audioInit();if(typeof autoUserInput!=='undefined'&&!(k==='a'&&AUTO.climb))autoUserInput();const h=topH();if(h){if(h.key)h.key(k);return;}if(fieldKey)fieldKey(k);}
// 메뉴·전투·대화 중에 누른 방향은 필드 이동으로 넘기지 않는다
function fieldFree(){return typeof state!=='undefined'&&state==='world'&&!ui.length&&!busy;}
function dirDown(k){if(typeof autoUserInput!=='undefined')autoUserInput();dirStack=dirStack.filter(x=>x!==k);dirStack.push(k);tapDir=fieldFree()?k:null;}
function clearDirs(){dirStack=[];tapDir=null;if(typeof P!=='undefined'&&P)P.chain=false;}
function dirUp(k){dirStack=dirStack.filter(x=>x!==k);}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='m'||e.key==='M'){audioInit();toggleMute();return;}
  const k=KEYMAP[e.key];if(!k)return;e.preventDefault();
  if(k==='b')held.b=true;
  if(DIRS.has(k)){if(!e.repeat)dirDown(k);if(ui.length)press(k);}
  else if(!e.repeat)press(k);});
addEventListener('keyup',e=>{const k=KEYMAP[e.key];if(!k)return;if(DIRS.has(k))dirUp(k);if(k==='b')held.b=false;});
addEventListener('blur',()=>{dirStack=[];held.b=false;});
document.addEventListener('visibilitychange',()=>{dirStack=[];held.b=false;});
/* 원형 패드 */
(()=>{const c=$('#cpad');if(!c)return;let cur=null,pid=null;
  const set=d=>{if(d===cur)return;if(cur)dirUp(cur);cur=d;c.dataset.d=d||'';if(d){dirDown(d);if(ui.length)press(d);}};
  const at=e=>{const r=c.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    if(Math.hypot(dx,dy)<r.width*.12)return cur; // 가운데는 직전 방향 유지
    return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');};
  c.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();pid=e.pointerId;try{c.setPointerCapture(pid);}catch(_){}
    const d=at(e);set(d||null);});
  c.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();set(at(e));});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;set(null);};
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>c.addEventListener(n,end));
  c.addEventListener('contextmenu',e=>e.preventDefault());})();
document.querySelectorAll('#pad button').forEach(b=>{const k=b.dataset.k;
  const down=e=>{e.preventDefault();b.classList.add('down');if(k==='b')held.b=true;
    if(DIRS.has(k)){dirDown(k);if(ui.length)press(k);}else press(k);};
  const up=()=>{b.classList.remove('down');if(DIRS.has(k))dirUp(k);if(k==='b')held.b=false;};
  b.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,up));
  b.addEventListener('contextmenu',e=>e.preventDefault());});
/* 화면 탭: 대화 넘기기 */
$('#scrTop').addEventListener('click',()=>{const h=topH();if(h&&h.tapA)press('a');});
$('#botUI').addEventListener('click',e=>{if(e.target!==$('#botUI')&&!e.target.classList.contains('backdrop'))return;const h=topH();if(h&&h.tapA)press('a');});

/* ---------- 화면 크기 (DS 2화면) ---------- */
function layout(){const coarse=matchMedia('(pointer:coarse)').matches;
  const land=coarse&&innerWidth>innerHeight*1.15; // 휴대폰 가로: 패드를 화면 양옆에
  const pbMax=land?Math.min(innerHeight/4.2,58):Math.min((innerWidth-12)/5.4,62);
  let pb=Math.round(Math.max(40,Math.min(pbMax,(land?innerHeight*.2:innerHeight*.075))));
  const slim=coarse,BW=slim?264:282,BV=slim?397:425,BH=slim?204:224; // 본체 포함 크기 (u 단위)
  const calcU=pb=>{const iw=land?innerWidth-2*Math.ceil(pb*2.7+14):innerWidth-(coarse?8:16);
    const ih=land?innerHeight-8:innerHeight-(coarse?8+6+Math.ceil(pb*2.7)+4:16+34);
    const vert=Math.min(iw/BW,ih/BV),wide=Math.min(iw/(256*2+(slim?20:41)),ih/BH);
    const useWide=SET.layout===2||(SET.layout===0&&(land?wide>vert:!coarse&&wide>vert*1.3));
    return{u:Math.max(.8,Math.min(useWide?wide:vert,4)),useWide,ih};};
  let r=calcU(pb);
  // 세로 화면에서 남는 높이는 패드에 조금 나눠 준다
  if(coarse&&!land&&!r.useWide){const left=r.ih-r.u*BV;if(left>3)pb=Math.round(Math.max(40,Math.min(pbMax,pb+left/2.7)));r=calcU(pb);}
  $('#pad').style.setProperty('--pb',pb+'px');$('#ds').classList.toggle('slim',slim);document.body.classList.toggle('land',land);
  document.documentElement.style.setProperty('--u',r.u.toFixed(3)+'px');$('#ds').classList.toggle('wide',r.useWide);}
addEventListener('resize',layout);layout();
