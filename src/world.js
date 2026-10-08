/* =========================================================
   world.js — 필드 이동, 이벤트 도우미, 타이틀·오프닝·엔딩, 메인 루프
   ========================================================= */
let G=null,state='boot',busy=false,frame=0,transFx=null;
const P={x:0,y:0,tx:0,ty:0,dir:'down',moving:false,t:0,step:0,run:false,jump:false,turnAt:0,chain:false,emote:null};
const DV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const OPP={up:'down',down:'up',left:'right',right:'left'};
const curMap=()=>MAPS[G.map];
const npcOn=n=>!n.hide&&(!n.cond||n.cond());
const npcsOf=m=>m.npcs.filter(npcOn);
const npcById=id=>curMap().npcs.find(n=>n.id===id);
function npcAt(m,x,y){return npcsOf(m).find(n=>(n.x===x&&n.y===y)||(n.mv&&n.mx===x&&n.my===y));}
const itemAt=(m,x,y)=>m.items.find(i=>i.x===x&&i.y===y&&!G.flags[i.flag]);
function passable(m,x,y,dir){const c=tileAt(m,x,y);if(c==null)return false;if(m.out){if(c==='L')return dir==='down';return'.,=fQD:'.includes(c);}return'.cm'.includes(c);}

/* ---------- 이벤트 도우미 ---------- */
async function walkNpc(n,dirs,ms=240){for(const d of dirs){n.dir=d;const[dx,dy]=DV[d];n.mv=1;n.mx=n.x+dx;n.my=n.y+dy;n.walk=1;
    await tween(ms,k=>n.off=k*T);n.x+=dx;n.y+=dy;n.off=0;n.mv=0;n.walk=0;}}
async function walkPlayer(dirs,ms=230){for(const d of dirs){P.dir=d;const[dx,dy]=DV[d];P.tx=P.x+dx;P.ty=P.y+dy;P.moving=true;P.scripted=true;
    await tween(ms,k=>P.t=k);P.x=P.tx;P.y=P.ty;P.t=0;P.moving=false;P.scripted=false;P.step^=1;}G.x=P.x;G.y=P.y;}
async function emoteOn(n,kind='!',ms=650){(n==='player'?P:n).emote=kind;if(kind==='!')sfx('sel');await sleep(ms);(n==='player'?P:n).emote=null;}
function healParty(){G.party.forEach(healMon);}
function addMon(m){if(G.party.length<6){G.party.push(m);return'party';}m.boxAt=Date.now();G.box.push(m);return'box';}
async function giveItem(id,n=1,o={}){const it=ITEMS[id];G.bag[id]=(G.bag[id]||0)+n;await Music.jingle(it.p==='key'?'key':'item');
  await say(`${J(G.name,'은')} ${n>1?`${it.n} ${n}개를`:J(it.n,'을')} 손에 넣었다!`);
  if(it.p!=='key')await say(`${J(G.name,'은')} ${J(it.n,'을')} 가방의 ${POCKETS.find(p=>p[0]===it.p)[1]} 주머니에 넣었다.`);}
async function nicknamePrompt(m){const r=await ask(`${SP[m.sid].n}에게 이름을 붙여 주시겠습니까?`,['예','아니오']);
  if(r!==0)return;const v=await nameInput({title:`${SP[m.sid].n}의 이름은?`,def:'',max:6,allowEmpty:true,sug:[]});if(v&&v!==SP[m.sid].n)m.nick=v;}
async function runScript(fn){busy=true;try{await fn();}catch(e){console.error(e);}finally{busy=false;hideMsg();}}

/* ---------- 지도 이동 ---------- */
function enterMap(id,x,y,dir,o={}){const prev=G.map;G.map=id;const m=MAPS[id];
  P.x=P.tx=x;P.y=P.ty=y;P.moving=false;P.t=0;P.jump=false;if(dir)P.dir=dir;G.x=x;G.y=y;
  m.npcs=m.npcs.filter(n=>!n.tmp);for(const n of m.npcs){n.x=n.x0;n.y=n.y0;n.dir=n.d0;n.off=0;n.mv=0;n.walk=0;n.emote=null;n.wt=60+rnd(120);n.hide=false;}
  m.healAnim=null;Music.play(m.music);if(!o.quiet&&(MAPS[prev]?.name!==m.name||o.sign))showSign(m.name);if(state==='world')Pad.render();}
async function doWarp([to,x,y,dir],door){busy=true;sfx(door?'door':'exit');await fadeTo(1,'top');enterMap(to,x,y,dir);await sleep(60);await fadeTo(0,'top');busy=false;checkTrig();}
async function edgeWarp(to,side){busy=true;const m2=MAPS[to];let x=P.x,y=P.y;
  if(side==='n')y=m2.h-1;if(side==='s')y=0;if(side==='e')x=0;if(side==='w')x=m2.w-1;
  await fadeTo(1,'top');enterMap(to,x,y,P.dir);await fadeTo(0,'top');busy=false;}
function checkTrig(){const m=curMap();for(const t of m.trig){if(P.x>=t.x&&P.x<t.x+t.w&&P.y>=t.y&&P.y<t.y+t.h&&(!t.cond||t.cond())){runScript(t.run);return true;}}return false;}

/* ---------- 필드 업데이트 ---------- */
function updateWorld(dt){const m=curMap();if(!busy&&!ui.length&&!P.moving&&SET.tips)worldGuides();
  /* NPC 배회 */
  if(!busy&&!ui.length)for(const n of npcsOf(m)){if(!n.wander||n.mv)continue;if(--n.wt>0)continue;n.wt=90+rnd(180);
    const d=['up','down','left','right'][rnd(4)],[dx,dy]=DV[d],nx=n.x+dx,ny=n.y+dy;n.dir=d;
    if(Math.abs(nx-n.x0)>2||Math.abs(ny-n.y0)>2||!passable(m,nx,ny,d)||'DLm'.includes(tileAt(m,nx,ny))||npcAt(m,nx,ny)||itemAt(m,nx,ny)||(nx===P.x&&ny===P.y)||(nx===P.tx&&ny===P.ty))continue;
    walkNpc(n,[d],380);}
  if(P.moving&&!P.scripted){const sp=P.jump?2.4:P.run?8.2:4.4;P.t+=dt*sp;if(P.t>=1){P.x=P.tx;P.y=P.ty;P.moving=false;P.t=0;P.step^=1;P.chain=!!dirStack.length;onStep();}return;}
  if(busy||ui.length||P.scripted)return;
  const now=performance.now(),hd=dirStack[dirStack.length-1],tp=tapDir;tapDir=null;const d=hd||tp;
  if(!d){P.chain=false;return;}
  if(d!==P.dir&&!P.chain){P.dir=d;P.turnAt=now;return;}
  if(hd&&now-P.turnAt<90&&!P.chain)return;
  tryMove(d);}
let lastBump=0;
function tryMove(d){const m=curMap();P.dir=d;const[dx,dy]=DV[d],nx=P.x+dx,ny=P.y+dy;
  if(nx<0||ny<0||nx>=m.w||ny>=m.h){const side={up:'n',down:'s',left:'w',right:'e'}[d];if(m.links&&m.links[side])edgeWarp(m.links[side],side);return;}
  const c=tileAt(m,nx,ny);
  if(m.out&&c==='L'&&d==='down'){const ly=ny+1;if(passable(m,nx,ly,'down')&&!npcAt(m,nx,ly)&&!itemAt(m,nx,ly)){P.tx=nx;P.ty=ly;P.moving=true;P.jump=true;P.t=0;sfx('jump');}return;}
  if(!passable(m,nx,ny,d)||npcAt(m,nx,ny)||itemAt(m,nx,ny)){if(frame-lastBump>18){sfx('bump');lastBump=frame;}P.chain=false;return;}
  P.tx=nx;P.ty=ny;P.moving=true;P.t=0;P.run=held.b&&!!G.flags.shoes;}
function onStep(){const m=curMap();G.x=P.x;G.y=P.y;G.steps=(G.steps||0)+1;
  if(P.jump){P.jump=false;sfx('land');}
  const w=m.warps[P.x+','+P.y];if(w){doWarp(w,tileAt(m,P.x,P.y)==='D');return;}
  if(checkTrig())return;
  const tr=sightCheck(m);if(tr){runScript(()=>trainerSpot(tr));return;}
  if(tileAt(m,P.x,P.y)===','){m.rustle={x:P.x,y:P.y,f:frame};if(m.enc&&G.party.some(p=>p.hp>0)&&Math.random()<.11)runScript(()=>wildEncounter(m));}
  if(Pad.app===3&&G.steps%5===0)Pad.render();}
function sightCheck(m){for(const n of npcsOf(m)){const live=(n.trainer&&!G.flags[n.id])||(n.sight&&!n.trainer);if(!live)continue;const[dx,dy]=DV[n.dir];
  for(let i=1;i<=4;i++){const x=n.x+dx*i,y=n.y+dy*i;if(x===P.x&&y===P.y)return n;if(!passable(m,x,y,n.dir)||npcAt(m,x,y)||itemAt(m,x,y))break;}}return null;}
async function trainerSpot(n){Music.play(n.trainer?(n.trainer.cls==='lass'||n.trainer.cls==='girl'?'rival':'trainer'):'rival');await emoteOn(n,'!',800);const[dx,dy]=DV[n.dir];
  while(Math.abs(P.x-n.x)+Math.abs(P.y-n.y)>1)await walkNpc(n,[n.dir],220);P.dir=OPP[n.dir];
  if(n.sight&&!n.trainer){await n.sight(n);return;}await trainerTalk(n);}
const tname=n=>`${TCLASS[n.trainer.cls].n} ${n.trainer.name}`;
async function trainerTalk(n){const t=n.trainer;for(const l of t.intro)await say(l,{name:tname(n)});
  const r=await battle({kind:'trainer',cls:t.cls,name:t.name,team:t.team,lose:t.lose,look:n.look,bg:curMap().bg});
  if(r==='win')G.flags[n.id]=1;}
async function wildEncounter(m){const tot=m.enc.reduce((s,e)=>s+e[3],0);let r=Math.random()*tot,pick=m.enc[0];
  for(const e of m.enc){if((r-=e[3])<0){pick=e;break;}}
  await battle({kind:'wild',team:[[pick[0],pick[1]+rnd(pick[2]-pick[1]+1)]],bg:m.bg});}
async function interact(){const m=curMap(),[dx,dy]=DV[P.dir];let x=P.x+dx,y=P.y+dy;const c=tileAt(m,x,y);
  let n=npcAt(m,x,y);if(!n&&c==='K')n=npcAt(m,x+dx,y+dy);
  if(n){if(n.mv)return;await runScript(async()=>{const d0=n.dir;n.dir=OPP[P.dir];
      if(n.trainer&&!G.flags[n.id])await trainerTalk(n);
      else if(n.trainer)await talk(n.trainer.after,{name:tname(n)});
      else if(n.talk)await n.talk(n);else await talk(n.text,{name:n.name,look:n.look});
      if(n.wander)n.dir=d0;});return;}
  const it=itemAt(m,x,y);if(it){await runScript(async()=>{G.flags[it.flag]=1;await giveItem(it.item,it.n);});return;}
  const key=x+','+y,ob=m.obj[key];
  if(ob){await runScript(async()=>{if(typeof ob==='function')await ob();else await talk(ob);});return;}
  if(c==='s'&&m.signs[key]){await runScript(()=>talk(m.signs[key]));return;}
  const def={S:['책이 가득 꽂혀 있다.'],v:['TV에서 재미있는 방송을 하고 있다.'],b:['푹신해 보이는 침대다.'],p:['잘 가꿔진 화분이다.'],r:['커다란 바위다. 꿈쩍도 하지 않는다.'],'~':['맑은 물이 반짝이고 있다.'],h:['회복 장치다.']}[c];
  if(c==='P'){await runScript(pcMenu);return;}
  if(def)await runScript(()=>talk(def));}
fieldKey=k=>{if(state!=='world'||busy||P.moving||ui.length)return;if(k==='a')interact();else if(k==='menu')openMenu();else if(k==='l'||k==='r')Pad.cycle(k);};

/* ---------- 필드 그리기 ---------- */
function camera(){const m=curMap(),k=P.moving?P.t:0,px=lerp(P.x,P.tx,k)*T,py=lerp(P.y,P.ty,k)*T;
  let cx=Math.round(px+8-W/2),cy=Math.round(py+8-H/2);
  cx=m.w*T<=W?Math.round((m.w*T-W)/2):clamp(cx,0,m.w*T-W);cy=m.h*T<=H?Math.round((m.h*T-H)/2):clamp(cy,0,m.h*T-H);return{cx,cy,px,py};}
function grassOver(g,m,x,y,sx,sy){if(tileAt(m,x,y)!==',')return;R(TG,sx+1,sy+15,14,5,g);for(const bx of[2,5,9,12])R(TG3,sx+bx,sy+14+(bx&1),1,3,g);R(TG2,sx+1,sy+19,14,1,g);}
function drawWorld(g){const m=curMap(),{cx,cy,px,py}=camera();R('#000',0,0,W,H,g);
  const x0=Math.floor(cx/T),y0=Math.floor(cy/T);
  for(let ty=y0;ty<=y0+Math.ceil(H/T);ty++)for(let tx=x0;tx<=x0+Math.ceil(W/T);tx++){const sx=tx*T-cx,sy=ty*T-cy;
    if(m.out)drawTileOut(m,tx,ty,sx,sy);else if(tileAt(m,tx,ty)==null)R('#000',sx,sy,16,16,g);else drawTileIn(m,tx,ty,sx,sy);}
  for(const it of m.items)if(!G.flags[it.flag])capsule(g,it.x*T-cx+8,it.y*T-cy+10,0,{kind:it.item==='great'?'great':'ball'});
  if(m.id==='lab')for(const[sx0,sy0,sid]of STARTERS)if(!G.flags.starter||(sid!==G.starter&&sid!==G.rivalStarter))capsule(g,sx0*T-cx+8,sy0*T-cy+7);
  if(m.healAnim){const hx=4*T-cx,hy=2*T-cy;for(let i=0;i<m.healAnim.n;i++){const bx=hx+3+(i%3)*5,by=hy+4+Math.floor(i/3)*4;R(m.healAnim.blink&&(frame>>3)&1?'#ffffff':'#ffd84a',bx,by,3,3,g);}}
  const ents=[];
  for(const n of npcsOf(m)){const[dx,dy]=DV[n.dir],off=n.off||0;
    ents.push({y:n.y*T+dy*off,f:()=>{const sx=Math.round(n.x*T+dx*off-cx),sy=Math.round(n.y*T+dy*off-cy)-6;
      person(g,sx,sy+(n.bow?1:0),n.dir,n.walk?((frame>>3)&1)+1:0,LOOK[n.look]||LOOK.man);grassOver(g,m,n.x,n.y,sx,sy);if(n.emote)emote(g,sx,sy,n.emote);}});}
  if(!P.hidden)ents.push({y:py+.5,f:()=>{const k=P.moving?P.t:0,jy=P.jump?-Math.sin(Math.PI*k)*10:0,sx=Math.round(px-cx),sy=Math.round(py-cy)-6+Math.round(jy);
    if(P.jump){g.fillStyle='rgba(0,0,0,.3)';g.fillRect(sx+3,Math.round(py-cy)+12,10,3);}
    const fr=P.moving?(P.t<.5?(P.step?2:1):0):0;person(g,sx,sy,P.dir,fr,LOOK.player);
    if(!P.moving)grassOver(g,m,P.x,P.y,sx,sy);else if(P.t>.5)grassOver(g,m,P.tx,P.ty,sx,sy);if(P.emote)emote(g,sx,sy,P.emote);}});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  if(m.out){const h=new Date().getHours();const t=h>=20||h<4?'rgba(20,30,90,.33)':h>=17?'rgba(255,120,40,.13)':h<7?'rgba(255,190,150,.1)':null;if(t){g.fillStyle=t;g.fillRect(0,0,W,H);}}}

/* ---------- 타이틀 ---------- */
const TITLE_MONS=[3,6,9];
function drawTitle(g){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2b4fb8');gr.addColorStop(.55,'#8ec5ff');gr.addColorStop(.55,'#6fc04f');gr.addColorStop(1,'#2f7d34');
  g.fillStyle=gr;g.fillRect(0,0,W,H);for(let i=0;i<40;i++){const tw=((frame>>3)+i)%7===0;g.fillStyle=tw?'#fff':'rgba(255,255,255,.55)';g.fillRect((i*67)%W,(i*37)%60,tw?2:1,tw?2:1);}
  for(let i=0;i<3;i++){const x=((frame*.3+i*110)%(W+80))-50,y=74+i*6;g.fillStyle='#fff';g.fillRect(x,y,30,6);g.fillRect(x+6,y-4,16,4);g.fillStyle='#d8ecff';g.fillRect(x,y+5,30,2);}
  g.fillStyle='#4fa040';g.beginPath();g.arc(30,118,60,Math.PI,0);g.arc(220,124,70,Math.PI,0);g.fill();
  TITLE_MONS.forEach((sid,i)=>{const b=Math.abs(Math.sin(frame/22+i*1.7))*5,x=48+i*80;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,170,26,5,0,0,7);g.fill();drawMon(g,sid,x,170-b,3);});
}
function drawTitleBot(g){g.fillStyle='#14183a';g.fillRect(0,0,W,H);for(let i=0;i<14;i++){g.fillStyle=`rgba(90,120,255,${.06+.04*(i%3)})`;const r=((frame*.6+i*30)%220);g.beginPath();g.arc(128,96,r,0,7);g.fill();}}

/* ---------- 오프닝 ---------- */
let introFx={prof:1,mon:0,player:0,pscale:1,white:0};
function drawIntro(g){const gr=g.createRadialGradient(128,90,10,128,90,170);gr.addColorStop(0,'#3a4a8a');gr.addColorStop(1,'#0a0e24');g.fillStyle=gr;g.fillRect(0,0,W,H);
  for(let i=0;i<30;i++){g.fillStyle='rgba(255,255,255,.4)';g.fillRect((i*83+frame*.2)%W,(i*47)%H,1,1);}
  g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.ellipse(128,150,90,16,0,0,7);g.fill();
  if(introFx.prof){g.save();g.translate(introFx.mon?70:96,52);g.scale(4,4);person(g,0,0,'down',0,LOOK.prof);g.restore();}
  if(introFx.mon){const b=Math.abs(Math.sin(frame/14))*4;drawMon(g,10,182,150-b,3,{white:introFx.white});}
  if(introFx.player){const s=4*introFx.pscale;g.save();g.translate(128-8*s,150-20*s);g.scale(s,s);person(g,0,0,'down',0,LOOK.player);g.restore();}
  FX.draw(g);}
async function intro(){state='intro';Music.play('intro');introFx={prof:1,mon:0,player:0,pscale:1,white:0};botMode='plain';const o={name:'한결 박사'};
  await fadeTo(0);
  await say('안녕! 몬스터의 세계에 온 걸 환영한단다!',o);
  await say('나는 한결. 사람들은 나를 몬스터 박사라고 부르지.',o);
  sfx('open');FX.burst(182,130,14,{c:['#fff','#ffd84a'],shape:'star',s:3,life:24,sp:2.2});introFx.mon=1;introFx.white=1;await tween(500,k=>introFx.white=1-k);cry(10);
  await say('이 세계에는 "몬스터"라고 불리는 신비한 생물들이 살고 있단다.',o);
  await say('사람들은 몬스터와 함께 생활하고, 때로는 힘을 합쳐 승부를 겨루기도 하지.',o);
  await say('나는 몬스터를 연구하면서 이 지방의 몬스터 도감을 만들고 있단다.',o);
  introFx.mon=0;introFx.prof=0;introFx.player=1;
  await say('그럼 이제 너에 대해 알려 주겠니? 이름이 무엇이니?',{...o,keep:1});
  const name=await nameInput({title:'당신의 이름을 알려 주세요',def:'',max:6,sug:['하늘','태양','바다','별이','민준','서연','지호','유나']});
  newGameData(name);
  await say(`${name}! 정말 좋은 이름이구나!`,o);
  await say(`${name}, 너만의 몬스터 원정이 이제 막 시작되려 하고 있단다.`,o);
  await say('꿈과 모험, 그리고 몬스터가 가득한 세계로! 자, 출발하자!',o);
  await tween(900,k=>introFx.pscale=1-k*.85,EASE.in);await fadeTo(1,'both',true);
  hideMsg();introFx.player=0;busy=true;state='world';enterMap('home',7,3,'down',{quiet:1});Pad.show();
  await sleep(300);await fadeTo(0);showSign('우리 집');
  try{const mom=npcById('mom');mom.dir='right';await emoteOn(mom,'!');
    await say(`일어났구나, ${name}! 한결 박사님이 연구소로 와 달라고 하셨단다.`,{name:'엄마'});
    await say('연구소는 마을 위쪽에 있는 큰 건물이야. 메뉴는 Enter 키나 아래 화면의 메뉴 버튼으로 열 수 있단다.',{name:'엄마'});
    await say('조심해서 다녀오렴!',{name:'엄마'});mom.dir='left';}finally{busy=false;hideMsg();}}
function newGameData(name){G={v:2,name,id:String(rnd(65536)).padStart(5,'0'),money:3000,party:[],box:[],bag:{},map:'home',x:7,y:3,dir:'down',flags:{},seen:{},caught:{},
  badges:[0,0,0,0,0],heal:{map:'home',x:4,y:6},steps:0,playMs:0,start:Date.now(),starter:0,rivalStarter:4};}

/* ---------- 엔딩 크레딧 ---------- */
let CR=null;
function drawCredits(g){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#ff9a5a');gr.addColorStop(.5,'#ffd8a0');gr.addColorStop(.62,'#7cc65a');gr.addColorStop(1,'#3a8a3a');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.fillStyle='#ffe8b0';g.beginPath();g.arc(190,96,26,0,7);g.fill();
  for(let i=0;i<3;i++){g.fillStyle='rgba(255,255,255,.7)';const x=((frame*.2+i*120)%(W+60))-40;g.fillRect(x,30+i*12,34,6);}
  const list=CR.list,sp=1.2;list.forEach((sid,i)=>{const x=W+40+i*70-(frame-CR.f0)*sp;if(x<-40||x>W+40)return;const b=Math.abs(Math.sin((frame+i*13)/8))*4;
    g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(x,160,18,4,0,0,7);g.fill();drawMon(g,sid,x,160-b,2);});
  const px=W+40+list.length*70-(frame-CR.f0)*sp+40;g.save();g.translate(Math.max(px,110),120);g.scale(2,2);person(g,0,0,'right',((frame>>3)&1)+1,LOOK.player);g.restore();}
async function credits(final){state='credits';Music.play('title');CR={f0:frame,list:Object.keys(G.caught).map(Number).sort((a,b)=>a-b)};if(!CR.list.length)CR.list=[G.starter];
  Pad.hide();botMode='credits';const roll=el(BOT,'abs','',[0,0,256,192]);roll.style.overflow='hidden';
  const L=[['몬스터 원정대',''],['제작','chunghyun1995'],['프로그래밍 · 도트 · 음악','Claude'],['도와준 몬스터들',CR.list.map(s=>SP[s].n).join(' · ')],
    ['관장들','단단 · 하라 · 화련 · 찌나 · 하늬'],['라이벌',RIVAL],['그리고 플레이해 준',`${G.name} 님`],['',''],['THE END','…그리고 원정은 계속된다!']];
  const box=el(roll,'credits',L.map(([h,t])=>`<h3>${esc(h)}</h3><div>${esc(t)}</div>`).join(''));
  const total=Math.max(14000,CR.list.length*70/1.2*16.7+3000);
  await tween(total,k=>box.style.transform=`translateY(${U(-k*(192+box.offsetHeight/parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u'))))})`);
  roll.remove();await fadeTo(1);state='world';
  if(final)enterMap('town5',12,4,'down',{quiet:1});else enterMap('town2',19,13,'down',{quiet:1});Pad.show();await fadeTo(0);
  await say(final?'축하합니다! 다섯 개의 배지를 모으고 라이벌과의 마지막 승부까지 마쳐 몬스터 원정대를 클리어했습니다!':'축하합니다! 두 번째 배지를 얻었습니다!');
  await say('도감을 모두 채우거나, 몬스터를 더 강하게 키워 보세요. 원정은 계속됩니다!');}

/* ---------- 전투 화면 전환 ---------- */
function drawTrans(g){const t=transFx;if(t.type==='flash'){g.fillStyle=t.col||'rgba(255,255,255,.9)';g.fillRect(0,0,W,H);return;}const k=t.k;g.fillStyle='#000';
  if(t.type==='bars'){for(let i=0;i<12;i++){const w=W*k;if(i%2)g.fillRect(W-w,i*16,w,16);else g.fillRect(0,i*16,w,16);}}
  else if(t.type==='iris'){g.beginPath();g.rect(0,0,W,H);g.arc(128,96,Math.max(0,170*(1-k)),0,7,true);g.fill('evenodd');}
  else if(t.type==='spin'){g.save();g.translate(128,96);for(let i=0;i<8;i++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,0);g.arc(0,0,200,0,Math.PI/4*k);g.fill();}g.restore();}
  else if(t.type==='vs'){g.fillRect(0,0,W,H*k/2);g.fillRect(0,H-H*k/2,W,H*k/2);if(k>.95&&t.label){g.fillStyle='#e2566f';g.fillRect(0,78,W,36);g.fillStyle='#ffd84a';g.fillRect(0,80,W,2);g.fillRect(0,110,W,2);
    g.fillStyle='#fff';g.font='bold 16px Galmuri11, sans-serif';g.textAlign='center';g.fillText(t.label,128,102);g.textAlign='left';}}}

/* ---------- 아래 화면 배경 ---------- */
function renderBot(){const g=bctx;g.setTransform(SC,0,0,SC,0,0);g.imageSmoothingEnabled=false;
  if(botMode==='title'||botMode==='plain'||botMode==='credits'){drawTitleBot(g);return;}
  if(botMode==='battle'){g.fillStyle='#262b42';g.fillRect(0,0,W,H);g.fillStyle='#2e3450';for(let y=-20;y<H+20;y+=24)for(let x=-20;x<W+20;x+=24){const o=(frame*.25)%24;g.beginPath();g.arc(x+o,y+o,7,0,7);g.fill();}return;}
  const c=botMode==='menu'?['#3d5aa8','#4a68b8']:['#2f8a8a','#3a9a9a'];g.fillStyle=c[0];g.fillRect(0,0,W,H);g.fillStyle=c[1];
  const o=(frame*.3)%32;for(let x=-64;x<W+64;x+=32){g.beginPath();g.moveTo(x+o,0);g.lineTo(x+o+16,0);g.lineTo(x+o+16-H,H);g.lineTo(x+o-H,H);g.fill();}}

/* ---------- 메인 루프 ---------- */
let lastT=performance.now();
function render(){const g=ctx;g.setTransform(SC,0,0,SC,0,0);g.imageSmoothingEnabled=false;
  if(state==='world')drawWorld(g);else if(state==='battle')drawBattle(g);else if(state==='evolve')drawEvolve(g);else if(state==='intro')drawIntro(g);
  else if(state==='credits')drawCredits(g);else drawTitle(g);
  if(transFx)drawTrans(g);}
function loop(now){const dt=Math.min(.05,(now-lastT)/1000);lastT=now;frame++;
  if(G&&(state==='world'||state==='battle'))G.playMs=(G.playMs||0)+dt*1000;
  if(state==='world')updateWorld(dt);FX.step();render();renderBot();requestAnimationFrame(loop);}

async function startFromCode(g,lg){try{localStorage.setItem(SAVE_KEY,JSON.stringify(g));}catch(e){}
  lg.remove();hideMsg();await fadeTo(1);G=g;G.flags=G.flags||{};G.badges=G.badges||[0,0];G.box=G.box||[];busy=true;state='world';enterMap(G.map,G.x,G.y,G.dir||'down',{sign:1});Pad.show();await fadeTo(0);busy=false;
  await say(`저장 코드를 불러왔다! ${G.name}의 모험을 이어서 시작한다.`);}
async function titleScreen(){state='title';botMode='title';Music.play('title');clearPages(BOT);
  const lg=page(TOP,`<div class="logo"><h1>몬스터 원정대</h1><p>MONSTER EXPEDITION</p></div><div class="ver">Ver 2.0</div>`);
  const st=page(BOT,`<div class="abs blink" style="left:0;right:0;top:${U(80)};text-align:center;color:#fff;font-size:${U(14)}">— 터치 또는 Z 키로 시작 —</div>
    <div class="abs" style="left:0;right:0;top:${U(170)};text-align:center;color:#8f9ad8;font-size:${U(7.5)}">오리지널 몬스터 RPG · 소리는 M 키로 켜고 끕니다</div>`);
  await new Promise(res=>{const h={tapA:1,key(k){if(k==='a'||k==='menu'){popH(h);sfx('sel');res();}}};pushH(h);st.addEventListener('click',()=>h.key('a'));});
  st.remove();
  // QR/링크로 열린 경우: 주소의 #c=코드 를 바로 불러오기
  let linkCode=location.hash.startsWith('#c=')?location.hash:null;
  if(linkCode)try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
  while(true){const sv=readSave();
    if(linkCode){const lc=linkCode;linkCode=null;let g=null;
      try{g=await readSaveCode(lc);}catch(e){await say(`불러오기 링크를 읽지 못했어요. (${e.message})`);}
      if(g){const c=await ask(`${g.name}의 모험(배지 ${(g.badges||[]).filter(Boolean).length} · 도감 ${Object.keys(g.caught||{}).length})을 불러올까요?${sv?' 이 기기의 기존 리포트는 덮어써집니다.':''}`,['불러오기','그만두기']);
        if(c===0){await startFromCode(g,lg);return;}}}
    const btns=[{html:sv?`<div style="font-size:${U(12)}">이어하기</div><small>${esc(sv.name)} · 배지 ${(sv.badges||[]).filter(Boolean).length} · 도감 ${Object.keys(sv.caught||{}).length} · ${fmtTime(sv.playMs||0)}</small>`:'<div style="font-size:'+U(12)+'">이어하기</div><small>리포트 없음</small>',x:20,y:16,w:216,h:56,cls:'blue',disabled:!sv},
      {html:`<div style="font-size:${U(12)}">처음부터 시작</div>`,x:20,y:78,w:216,h:36},{html:'<div>코드로 불러오기</div><small>다른 기기에서 이어 하기</small>',x:20,y:120,w:216,h:36,cls:'purple'},{html:'설정',x:20,y:162,w:216,h:24,cls:'dark'}];
    const i=await panel(btns,{start:sv?0:1,cancel:false});
    if(i===3){await optionsMenu();continue;}
    if(i===2){const g=await inputSaveCode();if(!g)continue;
      if(sv){const c=await ask(`${g.name}의 모험(배지 ${(g.badges||[]).filter(Boolean).length} · 도감 ${Object.keys(g.caught||{}).length})을 불러옵니다. 이 기기의 기존 리포트는 덮어써집니다. 괜찮습니까?`,['불러오기','돌아가기'],{start:1});if(c!==0)continue;}
      await startFromCode(g,lg);return;}
    if(i===1&&sv){const c=await ask('기존 리포트가 있습니다. 처음부터 시작하면 리포트를 저장할 때 덮어쓰게 됩니다. 괜찮습니까?',['처음부터 시작','돌아가기'],{start:1});if(c!==0)continue;}
    lg.remove();await fadeTo(1);
    if(i===0){G=sv;G.flags=G.flags||{};G.badges=G.badges||[0,0];busy=true;state='world';enterMap(G.map,G.x,G.y,G.dir||'down',{sign:1});Pad.show();await fadeTo(0);busy=false;return;}
    await intro();return;}}

Pad.init();requestAnimationFrame(loop);titleScreen();

/* 필드에서 처음 하는 일 안내 */
function worldGuides(){const touch=matchMedia('(pointer:coarse)').matches;
  if(!guideSeen('move'))return guide('move','top',touch?'아래 <b>원형 패드</b>로 걸어 다닐 수 있어요. 짧게 누르면 방향만 바뀌어요.<br>사람이나 물건 앞에서 <b>A</b>를 누르면 말을 걸거나 조사해요.':'<b>방향키</b>로 걸어 다닐 수 있어요. 짧게 누르면 방향만 바뀌어요.<br>사람이나 물건 앞에서 <b>Z</b>를 누르면 말을 걸거나 조사해요.',{title:'이동과 조사'});
  if(G.flags.pad&&!guideSeen('menu')&&document.querySelector('#padUI .btn.red'))return guide('menu','#padUI .btn.red',`여기서 <b>메뉴</b>를 열어요. 도감·몬스터·가방·리포트(저장)·설정이 들어 있어요.${touch?'':' 키보드는 <b>Enter</b>.'}`,{title:'메뉴'});
  if(G.flags.pad&&!guideSeen('padapp')&&document.querySelector('#padUI .nav'))return guide('padapp','#padUI .lcd',`원정패드의 <b>◀ ▶</b>로 시계 · 파티 · 지도 · 만보기 앱을 바꿔 볼 수 있어요.${touch?'':' 키보드는 <b>Q / E</b>.'}`,{title:'원정패드'});
  if(G.flags.shoes&&!guideSeen('run'))return guide('run','top',`<b>B${touch?'':'(X)'}</b>를 누른 채로 이동하면 질주신발로 빠르게 달릴 수 있어요.`,{title:'달리기'});
  if(G.flags.badge0&&!guideSeen('fuse'))return guide('fuse','top','몬스터 두 마리를 합치면 <b>한 단계 위 등급</b>의 무작위 타입 몬스터가 돼요. <b>메뉴 → 몬스터 → 합성하기</b>나 몬스터 센터의 합성 연구원에게서 할 수 있어요.',{title:'몬스터 합성'});}
