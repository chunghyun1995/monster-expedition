/* =========================================================
   battle.js — 2화면 턴제 배틀 + 진화 연출
   ========================================================= */
let B=null,EV=null,hudE=null,hudP=null;
const pm=()=>G.party[B.pi],fm=()=>B.foe[B.fi];
const mult=s=>s>=0?(2+s)/2:2/(2-s);
const EPOS={x:186,y:90},PPOS={x:66,y:160};
const SIDE=s=>s==='p'?pm():fm();
const OTHER=s=>s==='p'?'e':'p';
const lookOf=o=>o.look||(o.cls&&TCLASS[o.cls]&&TCLASS[o.cls].look)||'man';
const tn=()=>B.o.cls?`${TCLASS[B.o.cls].n} ${B.o.name}`:B.o.name;
let BATTLES=0; // 배틀 횟수(NPC 대화 중에 배틀이 있었는지 확인용)
const bname=s=>s==='e'?(B.wild?'야생 ':'상대 ')+N(fm()):N(pm());
const center=s=>s==='e'?{x:EPOS.x+B.e.x,y:EPOS.y-34+B.e.y}:{x:PPOS.x+B.p.x,y:PPOS.y-62+B.p.y};
function bsay(t,wait){return say(t,wait?{keep:1}:{keep:1,auto:520+t.length*16});}
function waitA(){if(typeof autoTalk!=='undefined'&&autoTalk())return sleep(650);return new Promise(res=>{const h={tapA:1,key(k){if(k==='a'||k==='b'){popH(h);sfx('cur');res();}}};pushH(h);});}
const blank=()=>({show:false,x:0,y:0,white:0,alpha:1,sx:1,sy:1,dark:false,blink:false,tint:null});

/* ---------- HUD ---------- */
function makeHud(){hudE=el(TOP,'hud out',`<div class="hn"><span class="nm"></span><span class="lv"></span></div><div class="hpl">HP ${hpBar(1,1)}</div>`);hudE.id='hudE';
  hudP=el(TOP,'hud out',`<div class="hn"><span class="nm"></span><span class="lv"></span></div><div class="hpl">HP ${hpBar(1,1)}</div><div class="hpt"></div><div class="exp"><i></i></div>`);hudP.id='hudP';
  hudE.style.top=U(10);hudP.style.top=U(98);}
function updHud(side,hp){const m=side==='e'?fm():pm(),h=side==='e'?hudE:hudP;if(!m||!h)return;const mx=maxHp(m),v=hp==null?m.hp:hp,p=clamp(v/mx*100,0,100);
  h.querySelector('.nm').innerHTML=`${esc(N(m))} ${side==='e'&&B.wild&&G.caught[m.sid]?'<span style="color:#e2566f;font-size:'+U(8)+'">◆</span>':''}`;
  h.querySelector('.lv').innerHTML=`${stb(m.st)} Lv${m.lv}`;const bar=h.querySelector('.hpb i');bar.style.width=p+'%';bar.style.background=hpColor(p);
  if(side==='p')h.querySelector('.hpt').textContent=`${Math.max(0,Math.ceil(v))} / ${mx}`;}
function setExp(m,instant){if(!hudP)return;const e=hudP.querySelector('.exp i'),lo=expFor(m.lv),hi=expFor(m.lv+1);e.style.transition=instant?'none':'width .6s linear';
  e.style.width=(m.lv>=100?100:clamp((m.exp-lo)/(hi-lo)*100,0,100))+'%';}
async function animHP(side,m,to){const from=m.hp,mx=maxHp(m);to=clamp(Math.round(to),0,mx);m.hp=to;if(from===to){updHud(side);return;}
  await tween(Math.min(1000,300+Math.abs(from-to)/mx*800),k=>updHud(side,from+(to-from)*k));updHud(side);}
function ballRow(side,show){let r=$('#br'+side);if(!r){r=el(TOP,'ballrow','');r.id='br'+side;}
  const list=side==='e'?B.foe:G.party;r.innerHTML=[0,1,2,3,4,5].map(i=>{const m=list[i];return`<i class="${!m?'e':m.hp<=0?'f':''}"></i>`;}).join('');
  if(side==='e'){r.style.left=U(0);r.style.top=U(30);r.style.transform=show?'none':`translateX(${U(-120)})`;}else{r.style.right=U(0);r.style.top=U(118);r.style.transform=show?'none':`translateX(${U(120)})`;}}

/* ---------- 전투 시작 ---------- */
async function battle(o){const wild=o.kind==='wild',npc=o.kind==='npc';BATTLES++;
  if(!wild&&!o.npc&&TALKING&&!TALKING.mon&&TALKING.id!=='tw_guard')o.npc=TALKING.id; // 무한의 탑 수호자는 층마다 다른 사람
  B={o,wild,bg:o.bg||curMap().bg||'grass',foe:(o.team||[]).map(([s,l])=>makeMon(s,l,wild?{}:{shiny:false})),fi:0,pi:Math.max(0,G.party.findIndex(m=>m.hp>0)),
    st:{p:[0,0,0,0,0,0],e:[0,0,0,0,0,0]},flinch:{},moved:{},slide:0,e:blank(),p:blank(),etr:{show:false,x:0},ptr:{show:false,x:0},ball:null,shake:0,flash:0,flashCol:'#fff',
    part:new Set(),runs:0,lvUp:new Set(),usedItem:0,result:null,lowT:null};
  if(wild)fm().met={map:curMap().name,lv:fm().lv};
  Music.play(o.music||(wild?'wild':npc?'rival':o.cls==='leader'?'leader':o.cls==='rival'?'rival':'trainer'));
  for(let i=0;i<2;i++){transFx={type:'flash'};await sleep(70);transFx=null;await sleep(80);}
  const tt=wild?(B.bg==='forest'?'spin':'bars'):(o.cls==='leader'||o.cls==='rival')?'vs':'iris';
  transFx={type:tt,k:0,label:o.cls==='leader'?`관장 ${o.name}`:o.cls==='rival'?`라이벌 ${o.name}`:''};await tween(tt==='vs'?380:560,k=>transFx.k=k,EASE.in);if(tt==='vs')await sleep(800);
  state='battle';Pad.hide();botMode='battle';makeHud();transFx=null;hideMsg();FX.list=[];
  B.lowT=setInterval(()=>{if(B&&state==='battle'&&B.p.show){const m=pm();if(m&&m.hp>0&&m.hp<=maxHp(m)*.2)sfx('lowhp');}},1100);
  /* 등장 */
  if(wild){B.e.show=true;B.e.dark=true;}else B.etr.show=true;B.ptr.show=true;
  await tween(800,k=>B.slide=k,EASE.out);
  if(wild){const f=fm();G.seen[f.sid]=1;B.e.dark=false;B.e.white=1;await tween(260,k=>B.e.white=1-k);cry(f.sid);if(f.shiny)await shinyFx('e');
    updHud('e');hudE.classList.remove('out');await bsay(`앗! 야생 ${J(N(f),'이')} 나타났다!`);}
  else if(npc)await npcHeroStart();
  else{ballRow('e',false);ballRow('p',false);await sleep(30);ballRow('e',true);ballRow('p',true);await bsay(`${J(tn(),'이')} 승부를 걸어왔다!`,true);ballRow('e',false);ballRow('p',false);await sendFoe();}
  await sendPlayer();
  let res=null;
  while(!res){res=B.hero?await heroTurn():B.foeHero?await foeHeroTurn():await doTurn(await chooseAction());}
  return await endBattle(res);}

async function sendFoe(){const f=fm();G.seen[f.sid]=1;B.st.e=[0,0,0,0,0,0];B.part=new Set(B.p.show&&pm().hp>0?[pm()]:[]);B.e=blank();
  if(B.etr.show){await tween(320,k=>B.etr.x=k*130);B.etr.show=false;B.etr.x=0;}
  bsay(`${J(tn(),'은')} ${J(N(f),'을')} 내보냈다!`);
  B.ball={x:EPOS.x+40,y:EPOS.y-70,r:0};await tween(300,k=>{B.ball.x=EPOS.x+40-40*k;B.ball.y=EPOS.y-70+40*k-Math.sin(k*Math.PI)*20;B.ball.r=k*8;});
  await capsuleOpen('e');updHud('e');hudE.classList.remove('out');await sleep(500);}
async function sendPlayer(){const p=pm();B.st.p=[0,0,0,0,0,0];B.part.add(p);B.p=blank();
  bsay(`가랏! ${N(p)}!`);
  if(B.ptr.show)tween(320,k=>B.ptr.x=-k*130).then(()=>{B.ptr.show=false;B.ptr.x=0;});
  sfx('throw');B.ball={x:20,y:150,r:0};await tween(380,k=>{B.ball.x=20+(PPOS.x-20)*k;B.ball.y=150-60*Math.sin(k*Math.PI)-(30*k);B.ball.r=k*10;});
  await capsuleOpen('p');updHud('p');setExp(p,true);hudP.classList.remove('out');await sleep(450);}
async function capsuleOpen(side){const c=center(side);B.ball=null;sfx('open');
  FX.burst(c.x,c.y,16,{c:['#ffffff','#9fd8ff','#ffd84a'],shape:'star',s:3,life:22,sp:2.6});FX.add({x:c.x,y:c.y,shape:'ring',c:'#ffffff',s:4,life:16,grow:2});
  const S=B[side];S.show=true;S.white=1;S.sx=S.sy=.1;await tween(260,k=>{S.sx=S.sy=.1+.9*EASE.back(k);});await tween(220,k=>S.white=1-k);
  const m=SIDE(side);cry(m.sid);if(m.shiny)await shinyFx(side);}
async function shinyFx(side){const c=center(side);sfx('shiny');for(let i=0;i<3;i++){FX.burst(c.x,c.y-6,6,{c:['#fff8b0','#ffffff'],shape:'star',s:4,life:26,sp:1.6});await sleep(160);}}
async function recall(side){const S=B[side];sfx('absorb');S.white=1;await tween(260,k=>{S.sx=S.sy=1-k*.95;});S.show=false;S.sx=S.sy=1;S.white=0;(side==='p'?hudP:hudE).classList.add('out');}

/* ---------- 명령 ---------- */
async function chooseAction(){
  while(true){msg(`${J(N(pm()),'은')}\n무엇을 할까?`);
    guideSoon('battle','#botUI .btn.red','<b>싸운다</b>를 누르면 기술을 고를 수 있어요. 아래의 <b>가방</b>에선 회복약을, <b>몬스터</b>에선 교체를 할 수 있어요.',{title:'전투'});
    if(B.wild&&Object.keys(G.bag).some(k=>ITEMS[k]&&ITEMS[k].ball&&G.bag[k]>0))guideSoon('catch','#botUI .btn.yellow','야생 몬스터는 HP를 줄인 뒤 <b>가방 → 캡슐</b>을 던지면 붙잡을 수 있어요. 잠듦·마비 같은 상태 이상이면 더 잘 잡혀요!',{title:'포획'});
    if(B.foeHero&&Object.keys(G.bag).some(k=>ITEMS[k]&&ITEMS[k].ball&&G.bag[k]>0))guideSoon('catchHuman','#botUI .btn.yellow','사람도 <b>캡슐</b>로 붙잡을 수 있어요! 체력을 줄여 두면 더 잘 잡히고, 붙잡으면 <b>동료</b>가 되어 함께 싸워요.',{title:'사람 붙잡기'});
    if(!B.wild&&!B.foeHero&&Object.keys(G.bag).some(k=>ITEMS[k]&&ITEMS[k].ball&&G.bag[k]>0))guideSoon('steal','#botUI .btn.yellow','상대 트레이너의 몬스터도 <b>캡슐</b>로 빼앗을 수 있어요. 대신 화가 난 트레이너가 <b>직접 덤벼들고</b>, 이 승부에서 지면 빼앗은 몬스터를 되찾아 가요!',{title:'몬스터 빼앗기'});
    if(autoFight()){await sleep(220);return{type:'move',mi:autoMoveIndex()};}
    const i=await panel([{html:`<span style="font-size:${U(20)}">싸운다</span>`,x:24,y:14,w:208,h:104,cls:'red',flash:1},
      {html:`<img src="${menuIcon('bag')}" style="width:${U(22)};height:${U(22)}"><span>가방</span>`,x:4,y:124,w:84,h:64,cls:'yellow'},
      {html:'<span>도망치다</span>',x:96,y:140,w:64,h:48,cls:'blue'},
      {html:`<img src="${menuIcon('party')}" style="width:${U(22)};height:${U(22)}"><span>몬스터</span>`,x:168,y:124,w:84,h:64,cls:'green'}],{cancel:false,start:0,onOpen:h=>{h.autoHook=()=>{h.set&&h.set(0);h.key('a');};}});
    if(i===0){if(autoFight())return{type:'move',mi:autoMoveIndex()};const mi=await chooseMove();if(mi==='back')continue;return{type:'move',mi};}
    if(i===1){hideMsg();const r=await bagScreen('battle');if(!r)continue;return{type:'item',...r};}
    if(i===3){hideMsg();const j=await partyScreen('battle');if(j<0)continue;return{type:'switch',idx:j};}
    return{type:'run'};}}
async function chooseMove(){const p=pm(),f=fm();
  if(p.moves.every(x=>x.pp<=0)){await bsay(`${J(N(p),'은')} 쓸 수 있는 기술이 없다!`,true);return'struggle';}
  msg(`${J(N(p),'은')}\n무엇을 할까?`);
  const btns=p.moves.map((x,j)=>{const d=MV[x.id],e=d.c==='x'||!f?null:effT(d.t,SP[f.sid].t);
    return{html:`<span class="mn">${d.n}</span><span class="mi"><span>${TYPES[d.t].n} · ${CATN[d.c]}</span><span>PP ${x.pp}/${d.pp}</span></span><span class="hint">${e==null?'':e===0?'효과가 없다':e>1?'효과가 굉장하다':e<1?'효과가 별로다':''}</span>`,
      x:4+(j%2)*126,y:6+Math.floor(j/2)*68,w:122,h:62,cls:'mvbtn',disabled:x.pp<=0};});
  btns.push({html:'취소',x:4,y:146,w:248,h:40,cls:'dark'});
  guideSoon('moves','#botUI .mvbtn','기술 버튼에는 <b>타입 · 분류 · 남은 PP</b>가 보여요. 상대에게 잘 통하면 <b>"효과가 굉장하다"</b>라고 미리 알려 줘요.',{title:'기술 고르기'});
  const i=await panel(btns,{onOpen:h=>h.els.forEach((e,j)=>{if(j<p.moves.length){const c=TYPES[MV[p.moves[j].id].t].c;e.style.background=`linear-gradient(${shade(c,.3)},${shade(c,-.1)})`;e.style.borderColor=shade(c,-.5);}})});
  if(i<0||i===btns.length-1)return'back';return i;}

/* ---------- 턴 진행 ---------- */
function speedOf(s){const m=SIDE(s);return calc(m)[5]*mult(B.st[s][5])*(m.st==='par'?.25:1);}
function aiMove(e,p){const av=e.moves.filter(x=>x.pp>0);if(!av.length)return'struggle';let best=av[0].id,bs=-1;
  for(const x of av){const d=MV[x.id];let s;
    if(d.p){const ef=effT(d.t,SP[p.sid].t);s=d.p*ef*(SP[e.sid].t.includes(d.t)?1.5:1)*(d.a?d.a/100:1);if(ef===0)s=1;}
    else if(d.fx.status){const imm=(d.fx.status==='psn'&&SP[p.sid].t.includes('poison'))||(d.fx.status==='brn'&&SP[p.sid].t.includes('fire'))||(d.fx.status==='par'&&(SP[p.sid].t.includes('elec')||SP[p.sid].t.includes('ground')));s=p.st||imm?2:48;}
    else if(d.fx.foe){s=B.st.p[d.fx.foe[0][0]]>-2?32:4;}else if(d.fx.self){s=B.st.e[d.fx.self[0][0]]<2?32:4;}else s=10;
    s*=B.wild?.4+Math.random()*1.3:.75+Math.random()*.5;if(s>bs){bs=s;best=x.id;}}return best;}
async function doTurn(act){B.flinch={};B.moved={};
  const leaderHeal=B.o.leader&&!B.usedItem&&fm().hp>0&&fm().hp<=maxHp(fm())/4;
  const eAct=leaderHeal?{type:'item'}:{type:'move',id:aiMove(fm(),pm())};
  if(act.type==='run'){if(!B.wild){await bsay('안 돼! 트레이너와의 승부에서 등을 보일 수는 없다!',true);return null;}
    if(tryRun()){sfx('run');await bsay('무사히 도망쳤다!',true);return'run';}await bsay('도망칠 수 없었다!');B.moved.p=1;}
  else if(act.type==='switch'){await bsay(`돌아와, ${N(pm())}!`);await recall('p');B.pi=act.idx;await sendPlayer();B.moved.p=1;}
  else if(act.type==='item'){if(ITEMS[act.id].ball){if(await throwBall(act.id)){if(B.wild)return'caught';await foeHeroStart();return null;}}else await useItemBattle(act);B.moved.p=1;}
  if(eAct.type==='item'){B.usedItem=1;G.bag;await bsay(`${J(tn(),'은')} 고급회복약을 사용했다!`);sfx('heal');await animHP('e',fm(),fm().hp+60);B.moved.e=1;}
  const seq=[];
  if(act.type==='move'){const pid=act.mi==='struggle'?'struggle':pm().moves[act.mi].id;
    if(eAct.type==='move'){const pp=MV[pid].fx.pri||0,ep=MV[eAct.id].fx.pri||0,ps=speedOf('p'),es=speedOf('e');
      const pFirst=pp!==ep?pp>ep:ps!==es?ps>es:Math.random()<.5;seq.push(...(pFirst?[['p',pid,act.mi],['e',eAct.id]]:[['e',eAct.id],['p',pid,act.mi]]));}
    else seq.push(['p',pid,act.mi]);}
  else if(eAct.type==='move')seq.push(['e',eAct.id]);
  for(const[s,id,mi]of seq){await useMove(s,id,mi);const c=await checkFaints();if(c==='done')return B.result;if(c==='cut')return null;}
  await endTurn();const c=await checkFaints();if(c==='done')return B.result;
  return null;}
function tryRun(){B.runs++;const a=speedOf('p'),b=speedOf('e');if(a>=b)return true;const f=Math.floor(a*128/b)+30*B.runs;return rnd(256)<f;}
async function checkFaints(){let cut=false;
  if(fm().hp<=0){cut=true;if(!B.wild&&B.fi<B.foe.length-1){B.fi++;await nextFoe();}else{B.result='win';return'done';}}
  if(B.hero)return cut?'cut':false;
  if(pm().hp<=0){cut=true;if(!G.party.some(m=>m.hp>0)){if(!B.heroUsed&&await heroStart())return'cut';B.result='lose';return'done';}
    if(B.wild){const r=await ask('다음 몬스터를 사용하겠습니까?',['다음 몬스터','도망친다']);
      if(r===1){if(tryRun()){sfx('run');await bsay('무사히 도망쳤다!',true);B.result='run';return'done';}await bsay('도망칠 수 없었다!',true);}}
    B.pi=await partyScreen('forced');await sendPlayer();}
  return cut?'cut':false;}
async function nextFoe(){const nf=fm();
  if(SET.style===0&&pm().hp>0&&G.party.filter(m=>m.hp>0).length>1){
    const r=await ask(`${J(tn(),'은')} ${J(N(nf),'을')} 내보내려 한다.\n${G.name}도 몬스터를 교체하겠습니까?`,['예','아니오'],{keep:1});
    if(r===0){const j=await partyScreen('battle');if(j>=0){await bsay(`돌아와, ${N(pm())}!`);await recall('p');B.pi=j;await sendFoe();await sendPlayer();return;}}}
  await sendFoe();}

/* ---------- 기술 사용 ---------- */
async function useMove(side,id,mi){const u=SIDE(side),ts=OTHER(side),t=SIDE(ts);if(u.hp<=0||t.hp<=0)return;B.moved[side]=1;
  if(u.st==='slp'){if(--u.slp<=0){u.st='';u.slp=0;updHud(side);await bsay(`${J(bname(side),'은')} 잠에서 깨어났다!`);}
    else{await statusAnim(side,'slp');await bsay(`${J(bname(side),'은')} 쿨쿨 잠들어 있다.`);return;}}
  if(B.flinch[side]){await bsay(`${J(bname(side),'은')} 풀이 죽어서 기술을 쓸 수 없다!`);return;}
  if(u.st==='par'&&chance(25)){await statusAnim(side,'par');await bsay(`${J(bname(side),'은')} 몸이 저려서 움직일 수 없다!`);return;}
  const mv=MV[id];
  if(id!=='struggle'){const slot=side==='p'&&mi!=null&&mi!=='struggle'?u.moves[mi]:u.moves.find(x=>x.id===id);if(slot)slot.pp=Math.max(0,slot.pp-1);}
  await bsay(`${bname(side)}의 ${mv.n}!`);
  if(mv.a&&rnd(100)>=mv.a){sfx('miss');await bsay(`그러나 ${bname(side)}의 공격은 빗나갔다!`);return;}
  if(mv.c==='x'){const fx=mv.fx;
    if(fx.status){const e=effT(mv.t,SP[t.sid].t);if(e===0||!canStatus(t,fx.status)){await animMove(side,mv,true);await bsay(t.st===fx.status?`${J(bname(ts),'은')} 이미 ${STATUS[fx.status].n} 상태다!`:'그러나 효과가 없었다...');return;}
      await animMove(side,mv);await inflict(ts,fx.status);return;}
    if(fx.heal){await animMove(side,mv);await healSelf(side,u,fx.heal);return;}
    await animMove(side,mv);
    if(fx.foe)for(const[s,v]of fx.foe)await statChange(ts,s,v);
    if(fx.self)for(const[s,v]of fx.self)await statChange(side,s,v);return;}
  const r=dmgCalc(u,t,mv,B.st[side],B.st[ts]);
  if(r.e===0){await bsay(`${bname(ts)}에게는 효과가 없는 것 같다...`);return;}
  await animMove(side,mv);sfx(r.e>1?'super':r.e<1?'weak':'hit');await hitReact(ts,r.e);
  const before=t.hp;await animHP(ts,t,t.hp-r.d);const dealt=before-t.hp;
  if(r.crit)await bsay('급소에 맞았다!');if(r.e>1)await bsay('효과가 굉장했다!');else if(r.e<1)await bsay('효과가 별로인 듯하다...');
  if(mv.fx.drain&&u.hp>0&&dealt>0){const hh=Math.max(1,Math.floor(dealt*mv.fx.drain/100));sfx('absorb');await drainFx(ts,side);await animHP(side,u,u.hp+hh);await bsay(`${bname(ts)}에게서 체력을 흡수했다!`);}
  if(mv.fx.recoil&&dealt>0){const rr=Math.max(1,Math.floor((id==='struggle'?maxHp(u):dealt)*mv.fx.recoil/100));await animHP(side,u,u.hp-rr);await bsay(`${J(bname(side),'은')} 반동으로 데미지를 입었다!`);}
  if(t.hp>0){if(mv.fx.st&&chance(mv.fx.st[1])&&canStatus(t,mv.fx.st[0]))await inflict(ts,mv.fx.st[0]);
    if(mv.fx.stat){const[who,s,v,ch]=mv.fx.stat;if(chance(ch))await statChange(who==='foe'?ts:side,s,v);}
    if(mv.fx.flinch&&chance(mv.fx.flinch)&&!B.moved[ts])B.flinch[ts]=1;}
  if(t.hp<=0)await faint(ts);if(u.hp<=0)await faint(side);}
function dmgCalc(u,t,mv,us,ts){const su=calc(u),st=calc(t),ph=mv.c==='p';const crit=Math.random()<1/(mv.fx.crit?8:16);
  let A=ph?su[1]:su[3],D=ph?st[2]:st[4];const as=us[ph?1:3],ds=ts[ph?2:4];A*=crit?Math.max(1,mult(as)):mult(as);D*=crit?Math.min(1,mult(ds)):mult(ds);
  let d=Math.floor(Math.floor(Math.floor(2*u.lv/5+2)*mv.p*A/D)/50)+2;if(ph&&u.st==='brn')d=Math.floor(d/2);if(crit)d=Math.floor(d*1.5);
  d=Math.floor(d*(85+rnd(16))/100);const stab=SP[u.sid].t.includes(mv.t)?1.5:1,e=mv.id==='struggle'?1:effT(mv.t,SP[t.sid].t);
  d=Math.floor(d*stab*e);if(e>0)d=Math.max(1,d);return{d,e,crit};}
function canStatus(m,s){if(m.st||m.hp<=0)return false;const t=SP[m.sid].t;
  if(s==='psn'&&t.includes('poison'))return false;if(s==='brn'&&t.includes('fire'))return false;if(s==='par'&&t.includes('elec'))return false;return true;}
async function inflict(side,s){const m=SIDE(side);m.st=s;if(s==='slp')m.slp=1+rnd(3);updHud(side);await statusAnim(side,s);
  await bsay({psn:`${J(bname(side),'은')} 독에 걸렸다!`,brn:`${J(bname(side),'은')} 화상을 입었다!`,par:`${J(bname(side),'은')} 마비되어 기술이 나오기 어려워졌다!`,slp:`${J(bname(side),'은')} 잠들어 버렸다!`}[s]);}
async function statChange(side,s,v){const S=B.st[side],nm=bname(side);
  if((v>0&&S[s]>=6)||(v<0&&S[s]<=-6)){await bsay(`${nm}의 ${J(STN[s],'은')} 더 이상 ${v>0?'올라가지':'떨어지지'} 않는다!`);return;}
  S[s]=clamp(S[s]+v,-6,6);const c=center(side);sfx(v>0?'statup':'statdn');
  if(SET.anim){for(let i=0;i<10;i++)FX.add({x:c.x-22+rnd(44),y:c.y+(v>0?20:-20)+rnd(10),vy:v>0?-1.4:1.4,shape:'arrow',dn:v<0,c:v>0?'#ff7a4a':'#4a8aff',s:3,life:34});
    B[side].tint=v>0?'#ff9a6a':'#6a9aff';B[side].white=.45;await tween(500,k=>B[side].white=.45*(1-k));B[side].tint=null;}
  await bsay(`${nm}의 ${J(STN[s],'이')} ${Math.abs(v)>=2?'크게 ':''}${v>0?'올라갔다!':'떨어졌다!'}`);}
async function endTurn(){for(const side of['p','e']){const m=SIDE(side);if(!m||m.hp<=0)continue;
  if(m.st==='psn'||m.st==='brn'){await statusAnim(side,m.st);await animHP(side,m,m.hp-Math.max(1,Math.floor(maxHp(m)/8)));
    await bsay(`${J(bname(side),'은')} ${m.st==='psn'?'독':'화상'} 데미지를 입고 있다!`);if(m.hp<=0)await faint(side);}}}
async function healSelf(side,u,pct){
  if(u.hp>=maxHp(u)){await bsay('그러나 체력이 이미 가득하다!');return;}
  sfx('heal');await animHP(side,u,u.hp+Math.max(1,Math.floor(maxHp(u)*pct/100)));await bsay(`${J(bname(side),'은')} 체력을 회복했다!`);}
async function faint(side){const m=SIDE(side),S=B[side];if(!S.show)return;cry(m.sid,{faint:1});await sleep(300);sfx('faint');
  if(side==='e'&&(B.wild||B.fi>=B.foe.length-1))Music.play('victory');
  await tween(420,k=>S.y=k*96,EASE.in);S.show=false;S.y=0;(side==='p'?hudP:hudE).classList.add('out');
  await bsay(`${J(bname(side),'은')} 쓰러졌다!`);if(side==='e')await gainExp();}

/* ---------- 연출 ---------- */
async function hitReact(side,e){const S=B[side];if(e>1){B.shake=4;setTimeout(()=>B.shake=0,260);}
  for(let i=0;i<4;i++){S.blink=!S.blink;await sleep(65);}S.blink=false;}
async function drainFx(from,to){const a=center(from),b=center(to);for(let i=0;i<12;i++){const t=24+rnd(10);FX.add({x:a.x+rnd(20)-10,y:a.y+rnd(20)-10,vx:(b.x-a.x)/t,vy:(b.y-a.y)/t,shape:'circ',c:i%2?'#9be07a':'#e8ffd0',s:2,life:t,fade:0});}await sleep(420);}
async function statusAnim(side,s){if(!SET.anim){await sleep(100);return;}const c=center(side);sfx({psn:'poison',brn:'burn',par:'para',slp:'sleep'}[s]);
  if(s==='psn')for(let i=0;i<10;i++)FX.add({x:c.x-20+rnd(40),y:c.y+10,vy:-.6-Math.random(),shape:'circ',c:i%2?'#c060e0':'#7a2a9a',s:2+rnd(2),life:34});
  else if(s==='brn')for(let i=0;i<10;i++)FX.add({x:c.x-18+rnd(36),y:c.y+14,vy:-1-Math.random()*.8,shape:'flame',s:3,life:30});
  else if(s==='par')for(let i=0;i<6;i++)FX.add({x:c.x-18+rnd(36),y:c.y+rnd(20)-10,shape:'bolt',c:'#ffe060',len:14,life:14,fade:0});
  else for(let i=0;i<3;i++)FX.add({x:c.x+8+i*6,y:c.y-10,vx:.3,vy:-.5,shape:'z',c:'#ffffff',life:50});
  await sleep(550);}
/* ---------- 기술 연출 ----------
   기술마다 고유한 모션(MOVE_FX). 없는 기술은 타입별 기본 연출(typeFx). */
async function animMove(side,mv,weak){if(!SET.anim){await sleep(180);return;}
  const f=MOVE_FX[mv.id];if(!f){await typeFx(side,mv,weak);return;}
  const ts=OTHER(side),c={side,ts,mv,U:center(side),T:center(ts),S:B[side],TS:B[ts],d:side==='p'?1:-1};
  try{await f(c);}finally{for(const k of['S','TS']){c[k].x=0;c[k].y=0;c[k].sx=1;c[k].sy=1;c[k].white=0;c[k].tint=null;c[k].alpha=1;}B.dim=0;B.shake=0;}}
/* 연출 도구 */
const AX={
  dash:async(c,dist=24,ms=200)=>{await tween(ms*.5,k=>{c.S.x=c.d*dist*k;c.S.y=-c.d*dist*.3*k;},EASE.in);await tween(ms*.5,k=>{c.S.x=c.d*dist*(1-k);c.S.y=-c.d*dist*.3*(1-k);});},
  hop:async(c,h=26,ms=320)=>{await tween(ms,k=>c.S.y=-Math.sin(k*Math.PI)*h);},
  knock:async(c,dist=10,ms=220)=>{c.TS.white=.8;await tween(ms,k=>{c.TS.x=c.d*dist*Math.sin(k*Math.PI);c.TS.white=.8*(1-k);});},
  wiggle:async(c,n=4,amp=5,ms=380,who='S')=>{await tween(ms,k=>c[who].x=Math.sin(k*Math.PI*2*n)*amp*(1-k));},
  squash:async(c,who='S',ms=300)=>{await tween(ms,k=>{const v=Math.sin(k*Math.PI);c[who].sx=1+v*.18;c[who].sy=1-v*.18;});},
  impact:(c,col='#ffd84a',s=10,at)=>{const t=at||c.T;FX.add({x:t.x,y:t.y,shape:'impact',c:col,s,life:10});FX.add({x:t.x,y:t.y,shape:'ring',c:'#ffffff',s:4,life:12,grow:2.4});},
  shake:async(n=5,ms=260)=>{B.shake=n;await sleep(ms);B.shake=0;},
  flash:async(col='#ffffff',a=.7,ms=240)=>{B.flashCol=col;B.flash=a;await tween(ms,k=>B.flash=a*(1-k));},
  dim:async(to=.5,ms=200)=>{const f=B.dim||0;await tween(ms,k=>B.dim=f+(to-f)*k);},
  tint:async(c,col,ms=300,who='TS')=>{c[who].tint=col;await tween(ms,k=>c[who].white=.65*Math.sin(k*Math.PI));c[who].white=0;c[who].tint=null;},
  /* 포물선/직선 투사체: arc>0이면 위로 휘었다 떨어짐 */
  proj:async(c,n,o,gap=55,arc=0,frames=18,from,to)=>{const A0=from||c.U,T0=to||c.T;
    for(let i=0;i<n;i++){const t=frames,g=arc?arc*2/(t*t/4):0,j=o.spread||0;const tx=T0.x+(Math.random()-.5)*j,ty=T0.y+(Math.random()-.5)*j;
      FX.add({x:A0.x,y:A0.y,vx:(tx-A0.x)/t,vy:(ty-A0.y)/t-g*t/2,g,life:t,fade:0,...o});if(gap)await sleep(gap);}await sleep(frames*16);},
  beam:async(c,col,w=6,ms=520,col2)=>{FX.add({x:c.U.x,y:c.U.y,x2:c.T.x,y2:c.T.y,shape:'beam',c:col,c2:col2,s:w,life:Math.round(ms/16),fade:0});await sleep(ms*.7);},
  rain:(c,n,o,w=48,h=70)=>{for(let i=0;i<n;i++)FX.add({x:c.T.x-w/2+Math.random()*w,y:c.T.y-h-Math.random()*30,vy:2.2+Math.random(),fade:0,life:Math.round(h/2.6),...o});},
  drain:async(c,col,n=12)=>{for(let i=0;i<n;i++){const t=26;FX.add({x:c.T.x+(Math.random()-.5)*24,y:c.T.y+(Math.random()-.5)*20,vx:(c.U.x-c.T.x)/t,vy:(c.U.y-c.T.y)/t-1.4,g:.1,shape:'wisp',c:col,s:2,life:t,fade:0});await sleep(40);}await sleep(320);},
  aura:async(c,col,ms=520,risers='#ffffff',who='U')=>{const p=c[who];FX.add({x:p.x,y:p.y,shape:'aura',c:col,s:28,life:Math.round(ms/16),fade:1});
    for(let i=0;i<12;i++)FX.add({x:p.x-22+Math.random()*44,y:p.y+18,vy:-1.4-Math.random(),shape:'star',c:risers,s:1.6,life:26});await sleep(ms);},
  rings:async(c,col,n=3,at='T',grow=2)=>{for(let i=0;i<n;i++){FX.add({x:c[at].x,y:c[at].y,shape:'ring',c:col,s:5,life:18,grow});await sleep(110);}await sleep(160);},
  burst:(c,n,o,at='T')=>FX.burst(c[at].x,c[at].y,n,o)};
const MOVE_FX={
 /* ----- 사람 ----- */
 punch:async c=>{await AX.dash(c,26,200);sfx('hit');AX.impact(c,'#ffffff',10);await AX.knock(c,8);},
 kick:async c=>{await AX.hop(c,34,300);sfx('throw');await AX.dash(c,36,200);sfx('super');AX.impact(c,'#ffd84a',14);AX.shake(4,180);await AX.knock(c,12);},
 bluster:async c=>{sfx('statdn');AX.wiggle(c,3,4,360);await AX.rings(c,'#ff7a5a',3,'U',3);},
 drink:async c=>{await AX.aura(c,'rgba(120,230,140,.55)',520,'#c8ffd0');},
 megapunch:async c=>{await AX.aura(c,'rgba(255,90,60,.5)',380,'#ffb070');await AX.dash(c,40,240);sfx('super');AX.impact(c,'#ff5a3a',18);AX.shake(6,260);await AX.knock(c,16);},
 /* ----- 보통 ----- */
 tackle:async c=>{sfx('throw');await AX.dash(c,30,220);sfx('hit');AX.impact(c);await AX.knock(c);},
 scratch:async c=>{await AX.dash(c,14,160);sfx('hit');FX.add({x:c.T.x+4,y:c.T.y,shape:'claw',c:'#ff5a7a',s:18,life:14,fade:1});await AX.knock(c,6);await sleep(80);},
 growl:async c=>{sfx('bad');AX.wiggle(c,6,3,420);for(let i=0;i<4;i++){FX.add({x:c.U.x+c.d*16,y:c.U.y-4,vx:c.d*3.2,vy:(c.T.y-c.U.y)/40,shape:'crescent',c:'#ff8a5a',s:6+i,rot:c.d>0?0:Math.PI,life:36,fade:1});await sleep(90);}await sleep(260);AX.wiggle(c,4,3,300,'TS');await sleep(300);},
 tailwag:async c=>{sfx('sparkle');AX.wiggle(c,5,6,520);await AX.proj(c,5,{shape:'heart',c:'#ff7aa8',s:3},90,14,30);},
 harden:async c=>{sfx('statup');await AX.tint(c,'#c8d0e0',420,'S');FX.add({x:c.U.x,y:c.U.y,shape:'ring',c:'#e8f0ff',s:30,life:16,grow:-1.2});await AX.aura(c,'rgba(200,210,230,.55)',380,'#ffffff');},
 quick:async c=>{sfx('wind');for(let i=0;i<6;i++)FX.add({x:c.U.x-c.d*10,y:c.U.y-14+i*6,vx:c.d*7,shape:'line',c:'#ffffff',s:10,w:1.2,life:12});await AX.dash(c,42,140);sfx('hit');AX.impact(c,'#ffffff',8);await AX.knock(c,8,160);},
 headbutt:async c=>{await AX.hop(c,30,280);sfx('throw');await AX.dash(c,34,180);sfx('super');AX.impact(c,'#ffd84a',14);AX.shake(4,200);await AX.knock(c,12);},
 focus:async c=>{sfx('statup');AX.squash(c,'S',600);await AX.aura(c,'rgba(255,90,60,.6)',600,'#ffb070');for(let i=0;i<2;i++){FX.add({x:c.U.x,y:c.U.y,shape:'ring',c:'#ff7a4a',s:30,life:18,grow:-1.5});await sleep(120);}await sleep(200);},
 sing:async c=>{sfx('sleep');for(let i=0;i<7;i++){FX.add({x:c.U.x,y:c.U.y-10,vx:(c.T.x-c.U.x)/40,vy:(c.T.y-c.U.y)/40-.4,g:.02,vr:.05,shape:'note',c:['#ff7aa8','#7ab0ff','#ffd84a'][i%3],s:2.6,life:42,fade:0});await sleep(110);}await sleep(420);await AX.tint(c,'#c8b8ff',320);},
 takedown:async c=>{sfx('run');for(let i=0;i<8;i++)FX.add({x:c.U.x-c.d*6,y:c.U.y+20,vx:-c.d*(1+Math.random()),vy:-Math.random(),shape:'circ',c:'#d8c8a8',s:2+rnd(2),life:20});
   await AX.dash(c,50,260);sfx('super');AX.impact(c,'#ff9a3a',16);AX.shake(6,300);await AX.knock(c,16,260);await AX.wiggle(c,3,3,220);},
 struggle:async c=>{await AX.wiggle(c,5,6,360);await AX.dash(c,16,160);sfx('hit');AX.impact(c,'#ffffff',7);await AX.knock(c,5);},
 /* ----- 불꽃 ----- */
 ember:async c=>{sfx('burn');await AX.proj(c,4,{shape:'flame',s:3},70,10,20);AX.burst(c,10,{shape:'flame',s:2.5,life:20,sp:1.6,g:-.05});await sleep(200);},
 flamewheel:async c=>{sfx('burn');const ring=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ring.push(a);}
   await tween(420,k=>{for(const a of ring)FX.add({x:c.U.x+Math.cos(a+k*9)*24,y:c.U.y+Math.sin(a+k*9)*20,shape:'flame',s:2.4,life:4,fade:0});c.S.sx=Math.cos(k*Math.PI*4);});
   await AX.dash(c,40,220);sfx('super');AX.burst(c,16,{shape:'flame',s:3,life:24,sp:2.4,g:-.06});AX.impact(c,'#ff7a2a',12);await AX.knock(c,10);},
 willo:async c=>{sfx('sparkle');await AX.dim(.35,200);for(let i=0;i<3;i++){const t=48;
     FX.add({x:c.U.x,y:c.U.y-10,vx:(c.T.x-c.U.x)/t,vy:(c.T.y-c.U.y)/t,shape:'wisp',c:'#6a8aff',s:3,life:t,fade:0});await sleep(160);}
   await sleep(600);for(let i=0;i<10;i++)FX.add({x:c.T.x-16+Math.random()*32,y:c.T.y+12,vy:-1-Math.random(),shape:'flame',s:2,c:'#7a9aff',life:26});await AX.tint(c,'#6a8aff',380);await AX.dim(0,200);},
 firefang:async c=>{await AX.dash(c,22,180);sfx('hit');FX.add({x:c.T.x,y:c.T.y,shape:'fang',s:10,life:22,fade:0});await sleep(200);sfx('burn');AX.burst(c,12,{shape:'flame',s:2.6,life:22,sp:2,g:-.05});await AX.knock(c,8);},
 flameburst:async c=>{sfx('burn');await AX.dim(.4,180);const t=26;FX.add({x:c.U.x,y:c.U.y,vx:(c.T.x-c.U.x)/t,vy:(c.T.y-c.U.y)/t,shape:'wisp',c:'#ff7a2a',s:6,life:t,fade:0});
   for(let i=0;i<t;i+=2)setTimeout(()=>FX.add({x:c.U.x+(c.T.x-c.U.x)*i/t,y:c.U.y+(c.T.y-c.U.y)*i/t,shape:'flame',s:2,life:10}),i*16);
   await sleep(t*16);sfx('super');AX.flash('#ffb060',.7,320);AX.shake(6,320);AX.impact(c,'#ff5a1a',20);AX.burst(c,26,{shape:'flame',s:3.4,life:30,sp:3.4,g:-.04});await AX.rings(c,'#ffd84a',2);await AX.dim(0,200);},
 /* ----- 물 ----- */
 bubble:async c=>{sfx('splash');for(let i=0;i<9;i++){const t=34+rnd(10);FX.add({x:c.U.x,y:c.U.y,vx:(c.T.x-c.U.x)/t+(Math.random()-.5)*.6,vy:(c.T.y-c.U.y)/t+(Math.random()-.5)*.6,shape:'bubble',c:'#9fd8ff',s:2+rnd(3),life:t,fade:0});await sleep(60);}
   await sleep(420);AX.burst(c,12,{shape:'circ',c:'#dff2ff',s:1.4,life:14,sp:2});await sleep(150);},
 watergun:async c=>{sfx('splash');await AX.beam(c,'#5aa8ff',6,560,'#e8f6ff');AX.burst(c,14,{shape:'drop',c:'#9fd0ff',s:2.2,life:24,sp:2.4,g:.14});await AX.knock(c,8);},
 withdraw:async c=>{sfx('statup');await tween(220,k=>{c.S.sx=1-.15*k;c.S.sy=1-.2*k;});FX.add({x:c.U.x,y:c.U.y,shape:'bubble',c:'#6aa8ff',s:30,life:34,fade:1});await sleep(420);await tween(220,k=>{c.S.sx=.85+.15*k;c.S.sy=.8+.2*k;});},
 aquatail:async c=>{await AX.hop(c,18,240);sfx('splash');FX.add({x:c.T.x,y:c.T.y,shape:'crescent',c:'#5aa8ff',s:18,life:16,rot:c.d>0?-.3:Math.PI+.3});await sleep(120);
   AX.burst(c,16,{shape:'drop',c:'#9fd0ff',s:2.4,life:26,sp:3,g:.16});await AX.knock(c,12);},
 wave:async c=>{sfx('splash');await AX.dim(.25,160);const startX=c.d>0?-40:W+40,t=46;FX.add({x:startX,y:H-10,vx:c.d*(W+80)/t,shape:'band',c:'#3a7ad8',s:70,h:110,life:t,fade:0});
   await sleep(t*16*.55);AX.shake(5,360);AX.burst(c,20,{shape:'drop',c:'#cfe8ff',s:2.6,life:30,sp:3.4,g:.16});await sleep(t*16*.45);await AX.knock(c,14);await AX.dim(0,200);},
 /* ----- 풀 ----- */
 vine:async c=>{sfx('leaf');for(let i=0;i<2;i++){FX.add({x:c.T.x+(i?8:-8),y:c.T.y,shape:'crescent',c:'#3f9a3a',s:16,life:12,rot:i?-2.4:-.6});sfx('hit');await AX.knock(c,6,140);}},
 absorb:async c=>{sfx('absorb');AX.tint(c,'#9be07a',300);await AX.drain(c,'#8ae06a',12);await AX.aura(c,'rgba(140,230,110,.45)',300,'#c8ffb0');},
 leaf:async c=>{sfx('leaf');for(let i=0;i<6;i++){const t=16;FX.add({x:c.U.x,y:c.U.y-8+rnd(16),vx:(c.T.x-c.U.x)/t,vy:(c.T.y-c.U.y)/t,vr:.9,shape:'leaf',c:'#7bd35a',s:3,life:t,fade:0});await sleep(55);}
   await sleep(220);sfx('hit');FX.add({x:c.T.x,y:c.T.y,shape:'line',c:'#ffffff',s:22,w:2,rot:-.7,life:8});FX.add({x:c.T.x,y:c.T.y,shape:'line',c:'#ffffff',s:22,w:2,rot:.7,life:8});await AX.knock(c,8);},
 sleeppowder:async c=>{sfx('sparkle');AX.rain(c,26,{shape:'circ',c:'#c8f0a8',s:1.4,vy:1.2,vx:.2},60,60);await sleep(700);for(let i=0;i<3;i++){FX.add({x:c.T.x+6+i*5,y:c.T.y-12,vy:-.6,vx:.4,shape:'z',c:'#ffffff',life:40});await sleep(140);}await sleep(260);},
 growth:async c=>{sfx('statup');await tween(420,k=>{const v=Math.sin(k*Math.PI);c.S.sx=1+v*.12;c.S.sy=1+v*.12;});for(let i=0;i<8;i++)FX.add({x:c.U.x-20+Math.random()*40,y:c.U.y+16,vy:-1.4,vr:.2,shape:'leaf',c:'#9be07a',s:2.4,life:30});await AX.aura(c,'rgba(140,230,110,.5)',420,'#e8ffd0');},
 petal:async c=>{sfx('wind');await AX.dim(.2,160);await tween(900,k=>{for(let i=0;i<3;i++){const a=k*14+i*2.1,r=34*(1-k*.6);FX.add({x:c.T.x+Math.cos(a)*r,y:c.T.y+Math.sin(a)*r*.7,shape:'petal',c:i%2?'#ff9ad5':'#ffd0e8',s:2.6,rot:a,life:6,fade:1});}});
   sfx('hit');AX.burst(c,20,{shape:'petal',c:['#ff9ad5','#ffd0e8','#ffffff'],s:2.4,life:30,sp:3,vr:.3});await AX.knock(c,10);await AX.dim(0,160);},
 /* ----- 전기 ----- */
 thundershock:async c=>{sfx('bolt');for(let i=0;i<3;i++){FX.add({x:c.U.x,y:c.U.y,x2:c.T.x+(Math.random()-.5)*14,y2:c.T.y+(Math.random()-.5)*14,shape:'beam',c:'#ffe060',c2:'#ffffff',s:2.2,life:8,fade:0});await sleep(70);}
   AX.burst(c,10,{shape:'star',c:'#fff4a0',s:2,life:14,sp:2.4});await AX.tint(c,'#fff060',240);},
 spark:async c=>{sfx('bolt');for(let i=0;i<8;i++)FX.add({x:c.U.x-18+Math.random()*36,y:c.U.y-16+Math.random()*32,shape:'star',c:'#ffe060',s:2,life:12});AX.tint(c,'#fff060',260,'S');await AX.dash(c,36,200);
   sfx('hit');AX.impact(c,'#ffe060',12);AX.burst(c,12,{shape:'star',c:['#ffe060','#ffffff'],s:2,life:16,sp:3});await AX.knock(c,10);},
 thunderwave:async c=>{sfx('bolt');await AX.rings(c,'#ffe060',4,'T',1.6);for(let i=0;i<4;i++)FX.add({x:c.T.x-16+rnd(32),y:c.T.y+10,shape:'bolt',c:'#ffe060',len:24,life:8,fade:0});await AX.tint(c,'#fff060',300);},
 thunder:async c=>{await AX.dim(.6,260);sfx('bolt');for(let i=0;i<3;i++){FX.add({x:c.T.x+(i-1)*8,y:c.T.y+16,shape:'bolt',c:i===1?'#ffffff':'#ffe060',len:120,life:12,fade:0});await sleep(50);}
   AX.flash('#ffffff',.95,360);AX.shake(7,360);AX.impact(c,'#ffe060',16);AX.burst(c,20,{shape:'star',c:['#ffe060','#ffffff'],s:2.4,life:20,sp:3.4});await AX.tint(c,'#fff060',360);await AX.dim(0,220);},
 /* ----- 바위 ----- */
 rockthrow:async c=>{sfx('throw');await AX.proj(c,3,{shape:'shard',c:'#9a8462',s:4,vr:.3},110,28,24);sfx('rock');AX.burst(c,8,{shape:'sq',c:'#b8a07a',s:2,life:18,sp:2,g:.12});await AX.knock(c,8);},
 rocktomb:async c=>{sfx('rock');for(let i=0;i<4;i++){const x=c.T.x+(i-1.5)*14;FX.add({x,y:c.T.y-80,vy:3.6,shape:'shard',c:i%2?'#8a7458':'#6e5a44',s:6,life:22,fade:0});await sleep(90);}
   await sleep(240);AX.shake(4,260);AX.burst(c,10,{shape:'sq',c:'#b8a07a',s:2,life:18,sp:2.4,g:.12});await AX.knock(c,6);},
 rockslide:async c=>{sfx('rock');AX.rain(c,14,{shape:'shard',c:'#8a7458',s:5,vy:3.4,vr:.2},90,90);await sleep(420);AX.shake(6,420);sfx('rock');AX.burst(c,14,{shape:'sq',c:'#b8a07a',s:2.4,life:22,sp:3,g:.14});await AX.knock(c,12);},
 defcurl:async c=>{sfx('rock');await tween(260,k=>{c.S.sx=1-.12*k;c.S.sy=1-.12*k;});await AX.tint(c,'#b8a07a',380,'S');for(let i=0;i<10;i++){const a=i/10*Math.PI*2;FX.add({x:c.U.x+Math.cos(a)*30,y:c.U.y+Math.sin(a)*26,vx:-Math.cos(a)*1.2,vy:-Math.sin(a)*1,shape:'shard',c:'#9a8462',s:2.4,life:22});}await sleep(360);},
 /* ----- 땅 ----- */
 mudslap:async c=>{sfx('splash');await AX.proj(c,5,{shape:'circ',c:'#8a5a2a',s:3},60,12,18);AX.burst(c,12,{shape:'circ',c:['#8a5a2a','#a87a3a'],s:1.8,life:20,sp:2.4,g:.14});await AX.tint(c,'#8a5a2a',300);},
 dig:async c=>{sfx('shake');AX.shake(5,500);for(let i=0;i<3;i++)FX.add({x:c.T.x-12+i*12,y:c.T.y+24,shape:'crack',c:'#3a2a1a',s:12,life:40,fade:1,rot:(i-1)*.3});await sleep(200);
   for(let i=0;i<16;i++)FX.add({x:c.T.x-24+rnd(48),y:c.T.y+24,vy:-2-Math.random()*1.6,g:.12,shape:'sq',c:i%2?'#d8a858':'#a87a3a',s:3,life:30});await sleep(240);await AX.knock(c,10);},
 bulldoze:async c=>{await AX.hop(c,20,240);sfx('shake');AX.shake(8,520);const t=24;for(let i=0;i<=t;i+=2)setTimeout(()=>{const x=c.U.x+(c.T.x-c.U.x)*i/t,y=c.U.y+24+(c.T.y-c.U.y)*i/t;FX.add({x,y,vy:-2,g:.1,shape:'sq',c:'#c8985a',s:3,life:22});FX.add({x,y,shape:'crack',c:'#3a2a1a',s:8,life:30});},i*16);
   await sleep(t*16+100);AX.impact(c,'#d8a858',16);await AX.knock(c,14);},
 /* ----- 바람 ----- */
 gust:async c=>{sfx('wind');FX.add({x:c.T.x,y:c.T.y,shape:'spiral',c:'#ffffff',s:22,life:40,fade:1});for(let i=0;i<8;i++)FX.add({x:c.T.x-24,y:c.T.y-20+i*6,vx:3,shape:'line',c:'rgba(255,255,255,.8)',s:8,life:16});await sleep(520);await AX.knock(c,8);},
 wing:async c=>{sfx('wind');await AX.dash(c,24,200);for(const r of[-.5,.5]){FX.add({x:c.T.x,y:c.T.y,shape:'crescent',c:'#ffffff',s:16,life:12,rot:r+(c.d>0?0:Math.PI)});sfx('hit');await sleep(110);}
   AX.burst(c,8,{shape:'feather',c:'#f4f0e4',s:2.2,life:30,sp:1.6,g:.04,vr:.15});await AX.knock(c,8);},
 aerial:async c=>{sfx('wind');await tween(300,k=>{c.S.y=-k*140;c.S.alpha=1-k;});await sleep(200);c.S.x=(c.T.x-c.U.x)*.95;await tween(200,k=>{c.S.y=(c.T.y-c.U.y)-(1-k)*120;c.S.alpha=k;});
   sfx('super');AX.impact(c,'#ffffff',16);AX.shake(5,260);AX.burst(c,10,{shape:'feather',c:'#f4f0e4',s:2.2,life:30,sp:2,g:.04,vr:.15});await AX.knock(c,12);
   await tween(220,k=>{c.S.x=(c.T.x-c.U.x)*.95*(1-k);c.S.y=(c.T.y-c.U.y)*(1-k);});c.S.alpha=1;},
 /* ----- 곤충 ----- */
 stringshot:async c=>{sfx('sparkle');for(let i=0;i<4;i++){FX.add({x:c.U.x,y:c.U.y,x2:c.T.x+(i-1.5)*8,y2:c.T.y+(i%2?6:-6),shape:'beam',c:'#ffffff',c2:'#e8e8e8',s:1.4,life:20,fade:0});await sleep(70);}
   FX.add({x:c.T.x,y:c.T.y,shape:'web',c:'rgba(255,255,255,.9)',s:24,life:40,fade:1});await sleep(520);},
 bite:async c=>{await AX.dash(c,22,180);sfx('hit');FX.add({x:c.T.x,y:c.T.y,shape:'fang',s:11,life:22,fade:0});await sleep(220);AX.impact(c,'#ffffff',8);await AX.knock(c,8);},
 silver:async c=>{sfx('wind');for(let i=0;i<22;i++){const t=24+rnd(10);FX.add({x:c.U.x,y:c.U.y-6+rnd(12),vx:(c.T.x-c.U.x)/t+(Math.random()-.5),vy:(c.T.y-c.U.y)/t+(Math.random()-.5),shape:'star',c:i%2?'#e8f0ff':'#c8d4ff',s:1.6,life:t,fade:0});await sleep(18);}
   await sleep(420);await AX.tint(c,'#e8f0ff',260);},
 leechsting:async c=>{sfx('throw');await AX.proj(c,1,{shape:'needle',c:'#e2566f',s:6,rot:Math.atan2(c.T.y-c.U.y,c.T.x-c.U.x)},0,0,14);sfx('hit');AX.impact(c,'#e2566f',8);await AX.drain(c,'#ff7a9a',10);},
 /* ----- 독 ----- */
 poisonsting:async c=>{sfx('throw');await AX.proj(c,2,{shape:'needle',c:'#b060e0',s:6,rot:Math.atan2(c.T.y-c.U.y,c.T.x-c.U.x)},70,0,14);sfx('poison');AX.burst(c,8,{shape:'circ',c:'#c060e0',s:2,life:20,sp:1.6,g:-.03});await AX.knock(c,6);},
 acid:async c=>{sfx('poison');await AX.proj(c,4,{shape:'drop',c:'#9a4ad0',s:2.6},70,18,22);for(let i=0;i<12;i++)FX.add({x:c.T.x-18+rnd(36),y:c.T.y+10-rnd(20),vy:-.6-Math.random(),shape:'bubble',c:'#c070f0',s:1.6+rnd(2),life:30});await AX.tint(c,'#b060e0',360);},
 toxspore:async c=>{sfx('poison');for(let i=0;i<14;i++){const t=40+rnd(10);FX.add({x:c.U.x,y:c.U.y-10,vx:(c.T.x-c.U.x)/t+(Math.random()-.5)*.5,vy:(c.T.y-c.U.y)/t-.3,g:.012,shape:'wisp',c:'#a050d0',s:2,life:t,fade:0});await sleep(40);}
   await sleep(520);await AX.tint(c,'#a050d0',320);}};
async function typeFx(side,mv,weak){const ts=OTHER(side),U0=center(side),T0=center(ts),S=B[side];
  if(mv.c==='p'){const d=side==='p'?1:-1;await tween(150,k=>{const s=Math.sin(k*Math.PI)*18;S.x=s*d;S.y=-s*.4*d;});S.x=S.y=0;}
  const proj=async(n,o)=>{for(let i=0;i<n;i++){const t=16;FX.add({x:U0.x,y:U0.y,vx:(T0.x-U0.x)/t+(Math.random()-.5),vy:(T0.y-U0.y)/t+(Math.random()-.5),life:t,fade:0,...o});await sleep(45);}await sleep(260);};
  if(mv.c==='x'){if(mv.fx.self){sfx('statup');for(let i=0;i<14;i++){const a=i/14*Math.PI*2;FX.add({x:U0.x+Math.cos(a)*30,y:U0.y+Math.sin(a)*24,vx:-Math.cos(a)*1.2,vy:-Math.sin(a)*1,shape:'star',c:'#fff8b0',s:2,life:24});}await sleep(420);return;}
    if(mv.fx.status){const col={psn:'#b060e0',brn:'#6a9aff',par:'#ffe060',slp:'#d8f0c8'}[mv.fx.status];sfx('sparkle');await proj(8,{shape:'circ',c:col,s:2.5});return;}
    sfx('sel');for(let i=0;i<3;i++){FX.add({x:U0.x,y:U0.y,shape:'ring',c:'#ffffff',s:6,life:18,grow:2});await sleep(130);}await sleep(200);return;}
  switch(mv.t){
  case 'fire':sfx('burn');if(mv.c==='s')await proj(8,{shape:'flame',s:3});for(let i=0;i<14;i++)FX.add({x:T0.x-20+rnd(40),y:T0.y+16,vy:-1.2-Math.random()*1.2,vx:(Math.random()-.5)*.6,shape:'flame',s:3+rnd(2),life:32});await sleep(450);break;
  case 'water':sfx('splash');await proj(10,{shape:'circ',c:'#9fd0ff',s:3});FX.burst(T0.x,T0.y,14,{c:['#bfe4ff','#6aa8ff'],shape:'circ',s:2,life:24,sp:2.4,g:.12});await sleep(300);break;
  case 'grass':sfx('leaf');if(mv.id==='vine'){for(let i=0;i<3;i++){FX.add({x:T0.x,y:T0.y,shape:'slash',c:'#3f9a3a',s:14,life:12,rot:i*.7});await sleep(110);}}
    else if(mv.fx.drain){FX.burst(T0.x,T0.y,10,{c:'#9be07a',shape:'circ',s:2,life:18,sp:1.2});await sleep(250);}
    else await proj(10,{shape:'leaf',c:'#7bd35a',s:3,vr:.4});FX.burst(T0.x,T0.y,8,{c:'#9be07a',shape:'leaf',s:2.5,life:20,sp:2,vr:.3});await sleep(250);break;
  case 'elec':sfx('bolt');B.flash=.6;B.flashCol='#fff4a0';for(let i=0;i<5;i++){FX.add({x:T0.x-20+rnd(40),y:T0.y+10,shape:'bolt',c:i%2?'#ffffff':'#ffe060',len:40+rnd(20),life:10,fade:0});await sleep(60);}
    await tween(250,k=>B.flash=.6*(1-k));break;
  case 'rock':sfx('rock');for(let i=0;i<7;i++)FX.add({x:T0.x-24+rnd(48),y:T0.y-60-rnd(30),vy:2,g:.25,shape:'sq',c:i%2?'#9a8462':'#6e5a44',s:5+rnd(3),life:26,fade:0});await sleep(380);B.shake=5;await sleep(220);B.shake=0;break;
  case 'ground':sfx('shake');B.shake=6;for(let i=0;i<16;i++)FX.add({x:T0.x-30+rnd(60),y:T0.y+24,vy:-1-Math.random()*1.5,g:.08,shape:'sq',c:i%2?'#d8a858':'#a87a3a',s:3,life:30});await sleep(500);B.shake=0;break;
  case 'fly':sfx('wind');for(let i=0;i<5;i++){FX.add({x:T0.x-30,y:T0.y-20+i*10,vx:4,shape:'slash',c:'#ffffff',s:8,life:14,rot:-.5});await sleep(60);}await sleep(200);break;
  case 'bug':sfx('leaf');for(let i=0;i<16;i++){const a=Math.random()*7;FX.add({x:T0.x+Math.cos(a)*30,y:T0.y+Math.sin(a)*24,vx:-Math.cos(a)*1.6,vy:-Math.sin(a)*1.3,shape:'sq',c:i%2?'#c8e05a':'#ffffff',s:2,life:20});}
    await sleep(300);FX.add({x:T0.x-6,y:T0.y,shape:'slash',c:'#1d1d2b',s:10,life:10,rot:.8});FX.add({x:T0.x+6,y:T0.y,shape:'slash',c:'#1d1d2b',s:10,life:10,rot:-.8});await sleep(160);break;
  case 'poison':sfx('poison');if(mv.c==='s')await proj(8,{shape:'circ',c:'#b060e0',s:3});for(let i=0;i<12;i++)FX.add({x:T0.x-20+rnd(40),y:T0.y+16,vy:-.8-Math.random(),shape:'circ',c:i%2?'#c060e0':'#7a2a9a',s:2+rnd(3),life:30});await sleep(400);break;
  default:if(mv.c==='s')await proj(6,{shape:'star',c:'#ffffff',s:3});FX.burst(T0.x,T0.y,10,{c:['#ffffff','#ffd84a'],shape:'star',s:4,life:16,sp:3});FX.add({x:T0.x,y:T0.y,shape:'ring',c:'#ffffff',s:4,life:12,grow:2.5});await sleep(200);}}

/* ---------- 도구 / 포획 ---------- */
async function useItemBattle(a){const m=G.party[a.target];await bsay(`${J(G.name,'은')} ${J(ITEMS[a.id].n,'을')} 사용했다!`);
  await applyItem(a.id,m,{anim:a.target===B.pi?async(b0,to)=>{m.hp=b0;await animHP('p',m,to);}:null});if(a.target===B.pi)updHud('p');}
async function throwBall(id){const e=fm(),it=ITEMS[id];G.bag[id]--;await bsay(`${J(G.name,'은')} ${J(it.n,'을')} 던졌다!`);
  sfx('throw');const kind=id==='great'?'great':'ball',ex=EPOS.x,ey=EPOS.y-52;B.ball={x:30,y:150,r:0,kind};
  await tween(520,k=>{B.ball.x=30+(ex-30)*k;B.ball.y=150+(ey-150)*k-Math.sin(k*Math.PI)*60;B.ball.r=k*14;});
  B.ball.open=1;sfx('open');B.e.white=1;await tween(160,()=>{});FX.burst(ex,ey+10,10,{c:['#ff8a8a','#ffffff'],shape:'star',s:2,life:16,sp:1.8});
  sfx('absorb');await tween(320,k=>{B.e.sx=B.e.sy=1-k;B.e.y=-k*24;});B.e.show=false;B.e.sx=B.e.sy=1;B.e.y=0;B.ball.open=0;
  await tween(300,k=>{B.ball.y=ey+Math.abs(Math.sin(k*Math.PI*1.5))*-10*(1-k)+k*30;B.ball.r=0;});sfx('land');
  const M=maxHp(e),bonus={slp:2,par:1.5,psn:1.5,brn:1.5}[e.st]||1;const a=Math.floor((3*M-2*e.hp)*SP[e.sid].c*it.ball*bonus/(3*M));
  let n=0;if(a>=255)n=4;else{const b=1048560/Math.sqrt(Math.sqrt(16711680/Math.max(1,a)));while(n<4&&rnd(65536)<b)n++;}
  for(let i=0;i<Math.min(n,3);i++){await sleep(420);sfx('wobble');await tween(360,k=>B.ball.r=Math.sin(k*Math.PI*2)*.45);}
  await sleep(420);
  if(n>=4){sfx('click');FX.burst(B.ball.x,B.ball.y,8,{c:'#ffd84a',shape:'star',s:3,life:24,sp:1.5});B.ball.dim=1;Music.stop(true);await Music.jingle('caught');
    await bsay(`좋았어! ${J(N(e),'을')} 붙잡았다!`,true);
    const isNew=!G.caught[e.sid];G.caught[e.sid]=1;G.seen[e.sid]=1;e.ot=G.name;
    if(isNew){await bsay(`${N(e)}의 데이터가 몬스터 도감에 새로 등록되었다!`,true);await dexEntryPop(e.sid);}
    // 트레이너의 몬스터는 이름 짓기 없이 바로 데려온다(지면 되찾아 가므로 기록해 둔다)
    hudE.classList.add('out');if(B.wild)await nicknamePrompt(e);else{(B.stolen=B.stolen||[]).push(e);e.met=e.met||{map:curMap().name,lv:e.lv};}e.st=e.st||'';
    if(addMon(e)==='box')await bsay(`${J(N(e),'은')} 보관함으로 전송되었다!`,true);
    return true;}
  sfx('breakout');B.ball.open=1;B.e.show=true;B.e.white=1;FX.burst(ex,ey+10,10,{c:['#ffffff','#9fd8ff'],shape:'star',s:3,life:18,sp:2});
  await tween(220,k=>B.e.white=1-k);B.ball=null;cry(e.sid);
  await bsay(['앗! 캡슐에서 빠져나와 버렸다!','아앗! 붙잡았다고 생각했는데!','아깝다! 조금만 더 하면 붙잡을 수 있었는데!','으앗! 거의 다 붙잡았는데!'][Math.min(n,3)]);return false;}
async function dexEntryPop(sid){const sp=SP[sid];const p=page(TOP,`<div class="abs" style="inset:0;background:linear-gradient(#e2566f,#b63a52)"></div><div class="title-bar" style="background:#241824">몬스터 도감 · 신규 등록</div>
  <div class="abs" style="left:${U(8)};top:${U(26)};width:${U(100)};height:${U(100)};border-radius:${U(6)};background:radial-gradient(#fff,#cfe8f8)"></div><img class="abs big" src="${monIcon(sid)}" style="left:${U(10)};top:${U(28)};width:${U(96)};height:${U(96)}">
  <div class="sheet" style="left:${U(114)};top:${U(26)};width:${U(134)};height:${U(100)}"><div style="font-size:${U(9)};color:#6a7190">No.${pad3(sid)}</div><div style="font-size:${U(13)}">${sp.n}</div><div style="font-size:${U(9)}">${sp.cat} 몬스터</div>${typesHtml(sid)}
  <div style="font-size:${U(9)};margin-top:${U(4)}">키 ${sp.h.toFixed(1)} m · ${sp.w.toFixed(1)} kg</div></div>
  <div class="sheet desc" style="left:${U(8)};top:${U(132)};width:${U(240)};height:${U(54)}">${sp.d}</div>`);hideMsg();cry(sid);await waitA();p.remove();}

/* ---------- 경험치 / 레벨업 / 기술 ---------- */
async function gainExp(){const f=fm(),parts=[...B.part].filter(m=>m.hp>0&&G.party.includes(m)&&m.lv<100);if(!parts.length)return;
  const base=SP[f.sid].x*f.lv/7*(B.wild?1:1.5);
  if(B.wild&&!B.o.legend){const gold=Math.max(1,Math.floor(base*.5));G.money+=gold;B.gold=(B.gold||0)+gold;}
  for(const m of parts){const g=Math.max(1,Math.floor(base/parts.length));await bsay(`${J(N(m),'은')} ${g} 경험치를 얻었다!`);await addExp(m,g,m===pm()&&B.p.show);}}
async function addExp(m,g,active){let left=g;
  while(left>0&&m.lv<100){const need=expFor(m.lv+1)-m.exp,add=Math.min(left,need);m.exp+=add;left-=add;
    if(active){setExp(m);const iv=setInterval(()=>sfx('exp'),70);await sleep(650);clearInterval(iv);}
    if(m.exp>=expFor(m.lv+1)){await levelUp(m,active);if(active)setExp(m,true);}}}
async function levelUp(m,active){const o=calc(m);m.lv++;const n=calc(m);m.hp=Math.min(n[0],m.hp+n[0]-o[0]);B&&B.lvUp.add(m);if(active)updHud('p');
  Music.jingle('level');await say(`${J(N(m),'은')} 레벨 ${J(m.lv,'로')} 올랐다!`,{keep:1});
  const box=el(TOP,'box lvbox',STN.map((s,i)=>`<div><span>${s}</span><span>+${n[i]-o[i]}</span></div>`).join(''));await waitA();
  box.innerHTML=STN.map((s,i)=>`<div><span>${s}</span><span>${n[i]}</span></div>`).join('');await waitA();box.remove();
  await learnMoves(m);}
async function learnMoves(m){for(const[l,id]of SP[m.sid].ls){if(l!==m.lv||m.moves.some(x=>x.id===id))continue;await learnMove(m,id);}}
async function learnMove(m,id){const nmv=MV[id].n;
  if(m.moves.length<4){m.moves.push({id,pp:MV[id].pp});Music.jingle('level');await say(`${J(N(m),'은')} 새로 ${J(nmv,'을')} 배웠다!`,{keep:1});return;}
  await say(`${J(N(m),'은')} 새로 ${J(nmv,'을')} 배우고 싶다...`,{keep:1});await say(`하지만 ${J(N(m),'은')} 기술을 4개까지만 기억할 수 있다!`,{keep:1});
  while(true){const r=await ask(`다른 기술을 잊게 하고 ${J(nmv,'을')} 배우게 하겠습니까?`,['예','아니오'],{keep:1});
    if(r===0){msg(`어느 기술을 잊게 하겠습니까?`);
      const btns=m.moves.map((x,j)=>{const d=MV[x.id];return{html:`<span class="mn">${d.n}</span><span class="mi"><span>${TYPES[d.t].n} · ${CATN[d.c]}</span><span>PP ${x.pp}/${d.pp}</span></span>`,x:4+(j%2)*126,y:4+Math.floor(j/2)*58,w:122,h:52,cls:'mvbtn'};});
      const d=MV[id];btns.push({html:`<span class="mn">${d.n}</span><span class="mi"><span>${TYPES[d.t].n} · 새 기술</span><span>위력 ${d.p||'-'}</span></span>`,x:4,y:124,w:180,h:52,cls:'mvbtn'});
      btns.push({html:'취소',x:190,y:124,w:62,h:52,cls:'dark'});
      const i=await panel(btns,{backdrop:true,bg:'linear-gradient(#4a5a88,#2a3358)',onOpen:h=>h.els.forEach((e,j)=>{if(j<5){const mv=j<4?MV[m.moves[j].id]:d;const c=TYPES[mv.t].c;e.style.background=`linear-gradient(${shade(c,.3)},${shade(c,-.1)})`;}})});
      hideMsg();if(i>=0&&i<4){const old=MV[m.moves[i].id].n;m.moves[i]={id,pp:MV[id].pp};
        await say(`하나, 둘... 뿅!`,{keep:1});await say(`${J(N(m),'은')} ${J(old,'을')} 깨끗이 잊었다!`,{keep:1});Music.jingle('level');await say(`그리고... ${J(N(m),'은')} 새로 ${J(nmv,'을')} 배웠다!`,{keep:1});return;}}
    const q=await ask(`그럼... ${J(nmv,'을')} 배우는 것을 포기하겠습니까?`,['예','아니오'],{keep:1});
    if(q===0){await say(`${J(N(m),'은')} 결국 ${J(nmv,'을')} 배우지 않았다!`,{keep:1});return;}}}

/* ---------- 전투 종료 ---------- */
async function endBattle(res){const o=B.o;clearInterval(B.lowT);
  if(res==='win'){Music.play('victory');
    if(B.wild&&B.gold){sfx('sel');await bsay(`${J(G.name,'은')} ${money(B.gold)}을 주웠다!`,true);}
    if(!B.wild){
      // 캡슐로 붙잡은 사람은 캡슐 안에 있으니 다시 나와서 말하지 않는다
      if(!B.captured){B.etr.show=true;B.etr.x=130;hudE.classList.add('out');await tween(420,k=>B.etr.x=130*(1-k),EASE.out);
        await bsay(`${J(tn(),'과')}의 승부에서 이겼다!`,true);if(o.lose)await say(o.lose,{name:tn(),keep:1});}
      // 상금은 트레이너전만 (NPC와의 대결은 상금 없음)
      if(o.kind!=='npc'&&B.foe.length){const lastLv=B.foe[B.foe.length-1].lv,prize=TCLASS[o.cls].m*lastLv;G.money+=prize;await bsay(`${J(G.name,'은')} 상금으로 ${money(prize)}을 손에 넣었다!`,true);}}}
  else if(res==='lose'){
    if(B.stolen&&B.stolen.length)await giveBack();
    if(o.kind==='npc'&&o.winMsg){B.etr.show=true;B.etr.x=0;await say(o.winMsg,{name:tn(),keep:1});}
    if(o.noLose){B.etr.show=true;B.etr.x=130;await tween(420,k=>B.etr.x=130*(1-k));if(o.winMsg)await say(o.winMsg,{name:tn(),keep:1});}
    else{await bsay(`${G.name}에게는 싸울 수 있는 몬스터가 없다!`,true);const lost=Math.floor(G.money/2);G.money-=lost;
      await bsay(B.wild?`${J(G.name,'은')} 허둥지둥 ${money(lost)}을 떨어뜨리고 말았다...`:`${J(G.name,'은')} 상금으로 ${money(lost)}을 건네주었다...`,true);await bsay('...... 눈앞이 캄캄해졌다!',true);}}
  await fadeTo(1);
  [hudE,hudP,$('#bre'),$('#brp')].forEach(e=>e&&e.remove());hudE=hudP=null;hideMsg();FX.list=[];
  const lv=[...B.lvUp],noLose=o.noLose;B=null;state='world';clearDirs();Pad.show();
  if(res==='lose'&&!noLose){healParty();enterMap(G.heal.map,G.heal.x,G.heal.y,'up',{quiet:1});await fadeTo(0);
    if(G.heal.map==='home'){if(G.flags.cap_mom)await say(`${J(G.name,'아')}, 쓰러져서 실려 왔다며? 아줌마가 푹 쉬게 해 줬단다.`,{name:'옆집 아주머니',look:'granny'});
      else await say(`${G.name}! 무사했구나... 푹 쉬었으니 이제 괜찮을 거야.`,{name:'엄마'});}
    else{await say('기다리셨습니다! 맡겨 주신 몬스터는 모두 건강해졌어요.',{name:'간호사'});}
    await say('몬스터들이 기운을 되찾았다! 무리하지 말고 다시 원정을 떠나자.');return res;}
  if(res==='lose'&&noLose)healParty();
  Music.play(curMap().music);await fadeTo(0);
  for(const m of lv){if(!G.party.includes(m))continue;const ev=SP[m.sid].ev;if(ev&&m.lv>=ev[0]&&m.hp>0)await evolve(m);}
  return res;}

/* ---------- 진화 ---------- */
async function evolve(m){const from=m.sid,to=SP[from].ev[1],oldName=N(m);state='evolve';Pad.hide();botMode='plain';Music.play('evolve');
  EV={sid:from,white:0,scale:1,flash:0,f0:frame};await fadeTo(0);
  await say(`어...? ${oldName}의 모습이...!`,{keep:1});cry(from);await tween(700,k=>EV.white=k);
  guideSoon('evolve','top','진화를 원하지 않으면 지금 <b>B</b>를 누르세요. 진화를 멈출 수 있어요.',{title:'진화'});
  let cancel=false;const h={key(k){if(k==='b')cancel=true;}};pushH(h);
  for(let i=0;i<16&&!cancel;i++){const d=Math.max(70,420-i*24);EV.sid=i%2?to:from;await tween(d,k=>EV.scale=(i%2?1.1:.95)+Math.sin(k*Math.PI)*.08);
    if(i%3===0){const a=Math.random()*7;for(let j=0;j<8;j++)FX.add({x:128+Math.cos(a+j)*90,y:80+Math.sin(a+j)*70,vx:-Math.cos(a+j)*3,vy:-Math.sin(a+j)*2.4,shape:'star',c:'#fff8b0',s:2,life:30});}sfx('cur');}
  popH(h);
  if(cancel){EV.sid=from;EV.scale=1;await tween(400,k=>EV.white=1-k);cry(from);await say(`어라...? ${oldName}의 변화가 멈췄다!`,{keep:1});}
  else{EV.sid=to;EV.scale=1.1;await tween(250,k=>EV.flash=k);const o=calc(m);m.sid=to;const n=calc(m);m.hp=Math.min(n[0],m.hp+n[0]-o[0]);G.seen[to]=G.caught[to]=1;
    EV.white=0;await tween(450,k=>EV.flash=1-k);cry(to);FX.burst(128,80,24,{c:['#fff8b0','#ffffff','#9fd8ff'],shape:'star',s:3,life:40,sp:3});await Music.jingle('evolved');
    await say(`축하합니다! ${J(oldName,'은')} ${J(SP[to].n,'로')} 진화했다!`,{keep:1});await learnMoves(m);}
  await fadeTo(1);hideMsg();EV=null;state='world';Pad.show();Music.play(curMap().music);await fadeTo(0);}
function drawEvolve(g){const gr=g.createRadialGradient(128,90,10,128,90,180);gr.addColorStop(0,'#3a4a8a');gr.addColorStop(1,'#080a18');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.save();g.translate(128,80);g.rotate((frame-EV.f0)/80);for(let i=0;i<12;i++){g.rotate(Math.PI/6);g.fillStyle=i%2?'rgba(255,216,74,.09)':'rgba(127,184,255,.09)';g.beginPath();g.moveTo(0,0);g.lineTo(-16,-200);g.lineTo(16,-200);g.fill();}g.restore();
  drawMon(g,EV.sid,128,130,4,{white:EV.white,sx:EV.scale,sy:EV.scale});FX.draw(g);if(EV.flash>0){g.fillStyle=`rgba(255,255,255,${EV.flash})`;g.fillRect(0,0,W,H);}}

/* ---------- 전투 그리기 ---------- */
function drawBattle(g){const b=B;if(!b)return;g.save();if(b.shake)g.translate(Math.round((Math.random()-.5)*b.shake*2),Math.round((Math.random()-.5)*b.shake));
  g.drawImage(battleBg(b.bg),0,0);if(b.dim>0){g.fillStyle=`rgba(8,8,28,${b.dim})`;g.fillRect(0,0,W,H);}const sl=1-b.slide,eo=-sl*260,po=sl*260;
  platform(g,EPOS.x+eo,EPOS.y+2,60,13,b.bg);
  if(b.etr.show){const es=4*(b.etr.s==null?1:b.etr.s);g.save();if(b.etr.a!=null)g.globalAlpha=b.etr.a;g.translate(Math.round(EPOS.x+eo+b.etr.x-8*es),Math.round(EPOS.y+2-20*es+(b.etr.y||0)));g.scale(es,es);person(g,0,0,'down',0,LOOK[lookOf(b.o)]||LOOK.man);g.restore();}
  const e=b.e;if(e.show&&!e.blink&&fm())drawMon(g,fm().sid,EPOS.x+eo+e.x,EPOS.y+e.y,3,{alpha:e.alpha,shiny:fm().shiny,dark:e.dark,white:e.white,whiteCol:e.tint||'#ffffff',sx:e.sx,sy:e.sy,clipY:EPOS.y+3});
  platform(g,PPOS.x+po,PPOS.y-4,74,15,b.bg);
  if(b.ptr.show){g.save();g.translate(Math.round(PPOS.x+po+b.ptr.x-32),PPOS.y-78);g.scale(4,4);person(g,0,0,'up',0,LOOK.player);g.restore();}
  const p=b.p;if(p.show&&!p.blink&&pm())drawMon(g,pm().sid,PPOS.x+po+p.x,PPOS.y+p.y,4,{alpha:p.alpha,back:true,shiny:pm().shiny,white:p.white,whiteCol:p.tint||'#ffffff',sx:p.sx,sy:p.sy,clipY:PPOS.y+1});
  if(b.ball){g.save();g.translate(b.ball.x,b.ball.y);g.scale(1.6,1.6);capsule(g,0,0,b.ball.r,{kind:b.ball.kind,open:b.ball.open});if(b.ball.dim){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-5,-5,10,10);}g.restore();}
  FX.draw(g);g.restore();if(b.flash>0){g.globalAlpha=b.flash;g.fillStyle=b.flashCol;g.fillRect(0,0,W,H);g.globalAlpha=1;}}

/* ---------- 최후의 수단: 트레이너가 직접 싸운다 ----------
   몬스터가 모두 쓰러지면 한 번, 트레이너가 직접 나설 수 있다. 쓰러지면 평소처럼 패배. */
const HERO_ACT=[{n:'돌 던지기',acc:92,lo:.16,hi:.24,d:'안정적'},{n:'몸통 박치기',acc:72,lo:.28,hi:.4,d:'위력 높음'}];
async function heroStart(){B.heroUsed=1;
  const r=await ask(`${G.name}의 몬스터가 모두 쓰러졌다!\n마지막으로 ${J(G.name,'이')} 직접 맞서 볼까?`,['직접 맞선다!','포기한다'],{keep:1});
  if(r!==0)return false;
  const lv=Math.max(...G.party.map(m=>m.lv)),max=20+lv*3;B.hero={lv,max,hp:max};
  hudP.querySelector('.exp').style.visibility='hidden';heroHud();
  B.ptr.show=true;B.ptr.x=-130;sfx('run');await tween(420,k=>B.ptr.x=-130*(1-k),EASE.out);hudP.classList.remove('out');
  await bsay(`${J(G.name,'은')} 쓰러진 몬스터들 앞을 막아섰다!`,true);
  await bsay(`${tnOrWild()} 앞에 ${J(G.name,'이')} 직접 맞선다!`);
  return true;}
const tnOrWild=()=>B.foeHero?tn():B.wild?`야생 ${N(fm())}`:N(fm());
function heroHud(hp){const h=B.hero,v=hp==null?h.hp:hp,p=clamp(v/h.max*100,0,100);
  hudP.querySelector('.nm').textContent=G.name;hudP.querySelector('.lv').innerHTML=`<span class="stb" style="background:#e2566f">트레이너</span>`;
  const bar=hudP.querySelector('.hpb i');bar.style.width=p+'%';bar.style.background=hpColor(p);hudP.querySelector('.hpt').textContent=`${Math.max(0,Math.ceil(v))} / ${h.max}`;}
async function heroHP(to){const h=B.hero,from=h.hp;to=clamp(Math.round(to),0,h.max);h.hp=to;await tween(Math.min(900,300+Math.abs(from-to)/h.max*700),k=>heroHud(from+(to-from)*k));heroHud();}
async function heroTurn(){const f=fm(),h=B.hero,vsT=!!B.foeHero;
  msg(`${J(G.name,'은')}\n어떻게 맞설까?`);
  const heal=['super','potion'].find(k=>G.bag[k]>0);
  const btns=[...HERO_ACT.map((a,i)=>({html:`<span class="mn">${a.n}</span><span class="mi"><span>${a.d}</span><span>명중 ${a.acc}</span></span>`,x:4+i*126,y:6,w:122,h:62,cls:'mvbtn hero'})),
    {html:heal?`<span>${ITEMS[heal].n} 마시기</span><small>남은 ${G.bag[heal]}개</small>`:'<span>회복약 없음</span>',x:4,y:74,w:122,h:56,cls:'yellow',disabled:!heal},
    {html:B.wild?'<span>도망치다</span>':'<span>버티기</span><small>방어 자세</small>',x:130,y:74,w:122,h:56,cls:'blue'}];
  guideSoon('hero','#botUI .mvbtn','몬스터가 모두 쓰러져서 <b>트레이너가 직접</b> 싸우고 있어요! 트레이너가 쓰러지면 패배예요.',{title:'최후의 수단'});
  const i=autoFight()?(await sleep(300),0):await panel(btns,{cancel:false,onOpen:hh=>hh.els.slice(0,2).forEach(e=>{e.style.background='linear-gradient(#ffb08a,#d8603a)';e.style.borderColor='#7a2a10';})});
  hideMsg();let guard=false;
  if(i<2){const a=HERO_ACT[i];await bsay(`${J(G.name,'은')} ${J(a.n,'을')} 했다!`);
    // 연출: 돌 던지기 = 포물선, 몸통 박치기 = 돌진
    const c=center('e');
    if(i===0){sfx('throw');await tween(380,k=>{FX.add({x:40+(c.x-40)*k,y:150-(150-c.y)*k-Math.sin(k*Math.PI)*40,shape:'circ',c:'#8a7a6a',s:3,life:3});});}
    else{sfx('run');await tween(240,k=>B.ptr.x=k*60);await tween(160,k=>B.ptr.x=60*(1-k));}
    if(rnd(100)<a.acc){
      if(vsT){const t=B.foeHero,dmg=Math.max(1,Math.round(t.max*(a.lo+Math.random()*(a.hi-a.lo))*(h.lv/Math.max(1,t.lv))**.3));sfx('hit');await trainerBlink();await foeHeroHP(t.hp-dmg);}
      else{const mx=maxHp(f),dmg=Math.max(1,Math.round(mx*(a.lo+Math.random()*(a.hi-a.lo))));sfx('hit');await hitReact('e',1);await animHP('e',f,f.hp-dmg);}
      if(i===1&&Math.random()<.35){await bsay(`반동으로 ${G.name}도 조금 다쳤다!`);await heroHP(h.hp-Math.round(h.max*.06));}}
    else{sfx('miss');await bsay(`하지만 ${tnOrWild()}에게 빗나갔다!`);}}
  else if(i===2&&heal){G.bag[heal]--;await bsay(`${J(G.name,'은')} ${J(ITEMS[heal].n,'을')} 꿀꺽 마셨다!`);sfx('heal');await heroHP(h.hp+Math.round(h.max*(heal==='super'?.6:.35)));}
  else{if(B.wild){if(Math.random()<.6){sfx('run');await bsay('몬스터들을 안고 무사히 도망쳤다!',true);return'run';}await bsay('도망칠 수 없었다!');}
    else{guard=true;await bsay(`${J(G.name,'은')} 몸을 웅크리고 버틴다!`);}}
  // 상대가 쓰러졌는지
  if(vsT){if(B.foeHero.hp<=0)return await foeHeroDown();}
  else if(f.hp<=0){await faint('e');
    if(!B.wild&&B.fi<B.foe.length-1){B.fi++;await bsay(`${J(G.name,'은')} 숨을 고른다...`);await sendFoe();return null;}
    await bsay(`${J(G.name,'이')} 직접 승리를 거머쥐었다!`,true);return'win';}
  // 상대의 반격
  if(vsT)await trainerAct(true,guard);
  else{const id=aiHeroMove(f),mv=MV[id];await bsay(`${tnOrWild()}의 ${mv.n}!`);
    if(SET.anim)await animMove('e',mv,false);
    const pw=mv.p||40,raw=h.max*(.1+pw/650)*(.85+Math.random()*.3)*(f.lv/Math.max(1,h.lv))**.5*(guard?.4:1);
    if(rnd(100)<(mv.a||100)){sfx('hit');B.shake=5;setTimeout(()=>B.shake=0,260);await heroHP(h.hp-Math.max(1,Math.round(raw)));}
    else{sfx('miss');await bsay(`${J(G.name,'은')} 몸을 날려 피했다!`);}}
  if(h.hp<=0){sfx('faint');await tween(400,k=>B.ptr.x=-k*130);B.ptr.show=false;hudP.classList.add('out');await bsay(`${J(G.name,'은')} 힘이 다해 쓰러졌다...`,true);return'lose';}
  return null;}
function aiHeroMove(e){const av=e.moves.filter(x=>x.pp>0&&MV[x.id].p);return av.length?av[rnd(av.length)].id:e.moves[0].id;}

/* ---------- 몬스터를 빼앗긴 트레이너가 직접 덤벼든다 ----------
   트레이너전에서 캡슐로 상대 몬스터를 붙잡으면 바로 내 것이 되지만, 화가 난 트레이너가 남은 몬스터 대신 직접 싸운다.
   트레이너를 쓰러뜨리면 승리. 내 몬스터와 나(최후의 수단)까지 모두 쓰러지면 빼앗은 몬스터를 되찾아 간다. */
const FOE_ACT=[{n:'주먹 날리기',acc:95,lo:.14,hi:.21},{n:'날아차기',acc:75,lo:.25,hi:.36}];
function foeHeroSetup(lv){const max=30+lv*4;B.foeHero={lv,max,hp:max,healed:0};B.fi=-1;B.ball=null;B.e=blank();B.st.e=[0,0,0,0,0,0];}
async function foeHeroStart(){foeHeroSetup(Math.max(...B.foe.map(m=>m.lv))+2);
  Music.play('rival');B.etr.show=true;B.etr.x=130;sfx('run');await tween(420,k=>B.etr.x=130*(1-k),EASE.out);
  await say('이런 미친놈! 뭐하는 짓이야!',{name:tn(),keep:1});
  foeHeroHud();hudE.classList.remove('out');
  await bsay(`화가 난 ${J(tn(),'이')} 직접 덤벼들었다!`,true);}
/* NPC와의 대결: 처음부터 NPC가 직접 싸운다(몬스터 없음). 캡슐로 붙잡으면 동료가 된다 */
async function npcHeroStart(){foeHeroSetup(B.o.lv||5);
  foeHeroHud();hudE.classList.remove('out');
  await bsay(`${J(tn(),'과')}의 대결이 시작됐다!`,true);}
function foeHeroHud(hp){const t=B.foeHero,v=hp==null?t.hp:hp,p=clamp(v/t.max*100,0,100);
  hudE.querySelector('.nm').textContent=B.o.name;hudE.querySelector('.lv').innerHTML=`<span class="stb" style="background:#e2566f">${B.o.kind==='npc'?'사람':'트레이너'}</span>`;
  const bar=hudE.querySelector('.hpb i');bar.style.width=p+'%';bar.style.background=hpColor(p);}
async function foeHeroHP(to){const t=B.foeHero,from=t.hp;to=clamp(Math.round(to),0,t.max);t.hp=to;
  await tween(Math.min(900,300+Math.abs(from-to)/t.max*700),k=>foeHeroHud(from+(to-from)*k));foeHeroHud();}
async function trainerBlink(){B.shake=3;setTimeout(()=>B.shake=0,200);for(let i=0;i<4;i++){B.etr.show=!B.etr.show;await sleep(65);}B.etr.show=true;}
async function foeHeroTurn(){const act=await chooseAction();B.flinch={};B.moved={};
  if(act.type==='run'){if(B.o.kind==='npc'){sfx('run');await bsay('무사히 도망쳤다!',true);return'run';}
    await bsay('안 돼! 화가 난 트레이너에게 등을 보일 수는 없다!',true);return null;}
  if(act.type==='switch'){await bsay(`돌아와, ${N(pm())}!`);await recall('p');B.pi=act.idx;await sendPlayer();}
  else if(act.type==='item'){if(ITEMS[act.id].ball){if(await throwBallHuman(act.id))return'win';}else await useItemBattle(act);}
  else{await monVsTrainer(act.mi);if(B.foeHero.hp<=0)return await foeHeroDown();}
  if(pm().hp>0)await trainerAct(false);
  if(pm().hp>0)await endTurn(); // 독·화상 (상대 쪽은 몬스터가 없어 건너뛴다)
  if(pm().hp<=0)return await playerDown();
  return null;}
/* 내 몬스터가 트레이너를 공격: 트레이너 체력에 대한 비율로, 위력·공격력·레벨 차이를 반영 */
async function monVsTrainer(mi){const u=pm(),t=B.foeHero;B.moved.p=1;
  if(u.st==='slp'){if(--u.slp<=0){u.st='';u.slp=0;updHud('p');await bsay(`${J(N(u),'은')} 잠에서 깨어났다!`);}
    else{await statusAnim('p','slp');await bsay(`${J(N(u),'은')} 쿨쿨 잠들어 있다.`);return;}}
  if(u.st==='par'&&chance(25)){await statusAnim('p','par');await bsay(`${J(N(u),'은')} 몸이 저려서 움직일 수 없다!`);return;}
  const id=mi==='struggle'?'struggle':u.moves[mi].id,mv=MV[id];
  if(id!=='struggle')u.moves[mi].pp=Math.max(0,u.moves[mi].pp-1);
  await bsay(`${N(u)}의 ${mv.n}!`);
  if(mv.a&&rnd(100)>=mv.a){sfx('miss');await bsay(`그러나 ${N(u)}의 공격은 빗나갔다!`);return;}
  if(!mv.p){await animMove('p',mv);
    if(mv.fx.heal){await healSelf('p',u,mv.fx.heal);return;}
    if(mv.fx.self){for(const[s,v]of mv.fx.self)await statChange('p',s,v);}else await bsay(`하지만 ${J(tn(),'은')} 아랑곳하지 않는다!`);return;}
  await animMove('p',mv);sfx('hit');await trainerBlink();
  const su=calc(u),ph=mv.c==='p',A=(ph?su[1]*mult(B.st.p[1]):su[3]*mult(B.st.p[3]))*(ph&&u.st==='brn'?.5:1);
  const crit=Math.random()<1/16,stab=SP[u.sid].t.includes(mv.t)?1.2:1;
  const d=Math.max(1,Math.round(t.max*(.1+mv.p/500)*Math.sqrt(A/(10+t.lv*1.6))*(.85+Math.random()*.3)*stab*(crit?1.5:1)));
  await foeHeroHP(t.hp-d);if(crit)await bsay('급소에 맞았다!');
  if(mv.fx.drain&&u.hp>0){const hh=Math.max(1,Math.floor(d*mv.fx.drain/100));sfx('absorb');await animHP('p',u,u.hp+hh);await bsay(`${tn()}에게서 체력을 흡수했다!`);}
  if(mv.fx.recoil){const rr=Math.max(1,Math.floor((id==='struggle'?maxHp(u):d)*mv.fx.recoil/100));await animHP('p',u,u.hp-rr);await bsay(`${J(N(u),'은')} 반동으로 데미지를 입었다!`);}
  if(u.hp<=0)await faint('p');}
/* 트레이너의 행동: 체력이 적으면 한 번 회복, 아니면 주먹·발차기 (onHero: 내가 직접 싸우는 중) */
async function trainerAct(onHero,guard){const t=B.foeHero;
  if(!t.healed&&t.hp<t.max*.3){t.healed=1;await bsay(`${J(tn(),'은')} 고급회복약을 벌컥벌컥 마셨다!`);sfx('heal');await foeHeroHP(t.hp+Math.round(t.max*.45));return;}
  const a=FOE_ACT[Math.random()<.6?0:1];await bsay(`${tn()}의 ${a.n}!`);
  sfx('run');await tween(200,k=>B.etr.x=-k*50);await tween(160,k=>B.etr.x=-50*(1-k));
  if(onHero){const h=B.hero;
    if(rnd(100)<a.acc){const raw=h.max*(a.lo+Math.random()*(a.hi-a.lo))*(t.lv/Math.max(1,h.lv))**.3*(guard?.4:1);sfx('hit');B.shake=5;setTimeout(()=>B.shake=0,260);await heroHP(h.hp-Math.max(1,Math.round(raw)));}
    else{sfx('miss');await bsay(`${J(G.name,'은')} 몸을 날려 피했다!`);}
    return;}
  const u=pm();
  if(rnd(100)<a.acc){const dmg=Math.max(1,Math.round(maxHp(u)*(a.lo+Math.random()*(a.hi-a.lo))*(t.lv/Math.max(1,u.lv))**.6));sfx('hit');await hitReact('p',1);await animHP('p',u,u.hp-dmg);}
  else{sfx('miss');await bsay(`${J(N(u),'은')} 재빨리 피했다!`);}
  if(u.hp<=0)await faint('p');}
async function playerDown(){if(!G.party.some(m=>m.hp>0)){if(!B.heroUsed&&await heroStart())return null;return'lose';}
  B.pi=await partyScreen('forced');await sendPlayer();return null;}
async function foeHeroDown(){sfx('faint');await tween(420,k=>B.etr.x=k*130);B.etr.show=false;hudE.classList.add('out');
  await bsay(`${J(tn(),'은')} 털썩 주저앉았다!`,true);
  if(B.stolen&&B.stolen.length)await say('크윽... 졌다. 그 몬스터는 이제 네 거야. 잘 돌봐 줘...',{name:tn(),keep:1});
  return'win';}
/* 사람(화난 트레이너·NPC)에게 캡슐 던지기: 붙잡으면 동료가 되어 파티(가득 차면 보관함)에 들어온다 */
async function throwBallHuman(id){const t=B.foeHero,it=ITEMS[id],sid=humanSid(lookOf(B.o)),name=B.o.name;G.bag[id]--;
  await bsay(`${J(G.name,'은')} ${J(it.n,'을')} 던졌다!`);
  sfx('throw');const kind=id==='great'?'great':'ball',ex=EPOS.x,ey=EPOS.y-52;B.ball={x:30,y:150,r:0,kind};
  await tween(520,k=>{B.ball.x=30+(ex-30)*k;B.ball.y=150+(ey-150)*k-Math.sin(k*Math.PI)*60;B.ball.r=k*14;});
  B.ball.open=1;sfx('open');FX.burst(ex,ey+10,10,{c:['#ff8a8a','#ffffff'],shape:'star',s:2,life:16,sp:1.8});
  sfx('absorb');await tween(320,k=>{B.etr.s=1-k*.9;B.etr.a=1-k;});B.etr.show=false;B.etr.s=B.etr.a=null;B.ball.open=0;
  await tween(300,k=>{B.ball.y=ey+Math.abs(Math.sin(k*Math.PI*1.5))*-10*(1-k)+k*30;B.ball.r=0;});sfx('land');
  const M=t.max,a=Math.floor((3*M-2*t.hp)*SP[sid].c*it.ball/(3*M));
  let n=0;if(a>=255)n=4;else{const b=1048560/Math.sqrt(Math.sqrt(16711680/Math.max(1,a)));while(n<4&&rnd(65536)<b)n++;}
  for(let i=0;i<Math.min(n,3);i++){await sleep(420);sfx('wobble');await tween(360,k=>B.ball.r=Math.sin(k*Math.PI*2)*.45);}
  await sleep(420);
  if(n>=4){sfx('click');FX.burst(B.ball.x,B.ball.y,8,{c:'#ffd84a',shape:'star',s:3,life:24,sp:1.5});B.ball.dim=1;Music.stop(true);await Music.jingle('caught');
    hudE.classList.add('out');await bsay(`좋았어! ${J(name,'을')} 붙잡았다!`,true);
    const m=makeMon(sid,Math.min(100,t.lv),{shiny:false,ot:G.name,met:{map:curMap().name,lv:Math.min(100,t.lv)}});
    m.nick=name;m.hp=Math.max(1,Math.round(maxHp(m)*t.hp/t.max));
    B.captured=m;B.o.captured=true;if(B.o.npc)G.flags['cap_'+B.o.npc]=1;
    await bsay(`${J(name,'이')} 동료가 되었다!`,true);
    if(addMon(m)==='box')await bsay(`${J(name,'은')} 보관함으로 전송되었다!`,true);
    B.ball=null;return true;}
  sfx('breakout');B.ball.open=1;B.etr.show=true;B.etr.a=.3;FX.burst(ex,ey+10,10,{c:['#ffffff','#9fd8ff'],shape:'star',s:3,life:18,sp:2});
  await tween(220,k=>B.etr.a=.3+.7*k);B.etr.a=null;B.ball=null;
  await bsay([`앗! ${J(name,'이')} 캡슐을 박차고 나왔다!`,'아앗! 붙잡았다고 생각했는데!','아깝다! 조금만 더 하면 붙잡을 수 있었는데!','으앗! 거의 다 붙잡았는데!'][Math.min(n,3)]);
  await say(['이게 무슨 짓이야?!','어딜 감히 나를 캡슐에!','휴, 큰일 날 뻔했네...','깜짝이야! 두 번 다시 안 들어가!'][rnd(4)],{name:tn(),keep:1});
  return false;}
/* 패배: 빼앗았던 몬스터를 트레이너가 되찾아 간다 */
async function giveBack(){const names=B.stolen.map(m=>N(m));
  for(const m of B.stolen)for(const list of[G.party,G.box]){const i=list.indexOf(m);if(i>=0)list.splice(i,1);}
  B.stolen=[];B.pi=0;
  B.etr.show=true;B.etr.x=130;hudE.classList.add('out');await tween(420,k=>B.etr.x=130*(1-k),EASE.out);
  await say('흥, 내 몬스터는 돌려받겠어!',{name:tn(),keep:1});
  await bsay(`${J(tn(),'은')} ${J(names.join(', '),'을')} 되찾아 갔다...`,true);}
