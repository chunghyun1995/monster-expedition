/* =========================================================
   battle.js — DS 스타일 턴제 배틀 + 진화 연출
   ========================================================= */
let B=null,EV=null,hudE=null,hudP=null;
const pm=()=>G.party[B.pi],fm=()=>B.foe[B.fi];
const mult=s=>s>=0?(2+s)/2:2/(2-s);
const EPOS={x:186,y:90},PPOS={x:66,y:160};
const SIDE=s=>s==='p'?pm():fm();
const OTHER=s=>s==='p'?'e':'p';
const tn=()=>`${TCLASS[B.o.cls].n} ${B.o.name}`;
const bname=s=>s==='e'?(B.wild?'야생 ':'상대 ')+N(fm()):N(pm());
const center=s=>s==='e'?{x:EPOS.x+B.e.x,y:EPOS.y-34+B.e.y}:{x:PPOS.x+B.p.x,y:PPOS.y-62+B.p.y};
function bsay(t,wait){return say(t,wait?{keep:1}:{keep:1,auto:520+t.length*16});}
function waitA(){return new Promise(res=>{const h={tapA:1,key(k){if(k==='a'||k==='b'){popH(h);sfx('cur');res();}}};pushH(h);});}
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
async function battle(o){const wild=o.kind==='wild';
  B={o,wild,bg:o.bg||curMap().bg||'grass',foe:o.team.map(([s,l])=>makeMon(s,l,wild?{}:{shiny:false})),fi:0,pi:Math.max(0,G.party.findIndex(m=>m.hp>0)),
    st:{p:[0,0,0,0,0,0],e:[0,0,0,0,0,0]},flinch:{},moved:{},slide:0,e:blank(),p:blank(),etr:{show:false,x:0},ptr:{show:false,x:0},ball:null,shake:0,flash:0,flashCol:'#fff',
    part:new Set(),runs:0,lvUp:new Set(),usedItem:0,result:null,lowT:null};
  if(wild)fm().met={map:curMap().name,lv:fm().lv};
  Music.play(o.music||(wild?'wild':o.cls==='leader'?'leader':o.cls==='rival'?'rival':'trainer'));
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
  else{ballRow('e',false);ballRow('p',false);await sleep(30);ballRow('e',true);ballRow('p',true);await bsay(`${J(tn(),'이')} 승부를 걸어왔다!`,true);ballRow('e',false);ballRow('p',false);await sendFoe();}
  await sendPlayer();
  let res=null;
  while(!res){res=await doTurn(await chooseAction());}
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
    const i=await panel([{html:`<span style="font-size:${U(20)}">싸운다</span>`,x:24,y:14,w:208,h:104,cls:'red',flash:1},
      {html:`<img src="${menuIcon('bag')}" style="width:${U(22)};height:${U(22)}"><span>가방</span>`,x:4,y:124,w:84,h:64,cls:'yellow'},
      {html:'<span>도망치다</span>',x:96,y:140,w:64,h:48,cls:'blue'},
      {html:`<img src="${menuIcon('party')}" style="width:${U(22)};height:${U(22)}"><span>몬스터</span>`,x:168,y:124,w:84,h:64,cls:'green'}],{cancel:false,start:0});
    if(i===0){const mi=await chooseMove();if(mi==='back')continue;return{type:'move',mi};}
    if(i===1){hideMsg();const r=await bagScreen('battle');if(!r)continue;return{type:'item',...r};}
    if(i===2){hideMsg();const j=await partyScreen('battle');if(j<0)continue;return{type:'switch',idx:j};}
    return{type:'run'};}}
async function chooseMove(){const p=pm(),f=fm();
  if(p.moves.every(x=>x.pp<=0)){await bsay(`${J(N(p),'은')} 쓸 수 있는 기술이 없다!`,true);return'struggle';}
  msg(`${J(N(p),'은')}\n무엇을 할까?`);
  const btns=p.moves.map((x,j)=>{const d=MV[x.id],e=d.c==='x'?null:effT(d.t,SP[f.sid].t);
    return{html:`<span class="mn">${d.n}</span><span class="mi"><span>${TYPES[d.t].n} · ${CATN[d.c]}</span><span>PP ${x.pp}/${d.pp}</span></span><span class="hint">${e==null?'':e===0?'효과가 없다':e>1?'효과가 굉장하다':e<1?'효과가 별로다':''}</span>`,
      x:4+(j%2)*126,y:6+Math.floor(j/2)*68,w:122,h:62,cls:'mvbtn',disabled:x.pp<=0};});
  btns.push({html:'취소',x:4,y:146,w:248,h:40,cls:'dark'});
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
  else if(act.type==='item'){if(ITEMS[act.id].ball){if(await throwBall(act.id))return'caught';}else await useItemBattle(act);B.moved.p=1;}
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
  if(pm().hp<=0){cut=true;if(!G.party.some(m=>m.hp>0)){B.result='lose';return'done';}
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
async function animMove(side,mv,weak){if(!SET.anim){await sleep(180);return;}const ts=OTHER(side),U0=center(side),T0=center(ts),S=B[side];
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
    hudE.classList.add('out');await nicknamePrompt(e);e.st=e.st||'';
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
    if(!B.wild){B.etr.show=true;B.etr.x=130;hudE.classList.add('out');await tween(420,k=>B.etr.x=130*(1-k),EASE.out);
      await bsay(`${J(tn(),'과')}의 승부에서 이겼다!`,true);if(o.lose)await say(o.lose,{name:tn(),keep:1});
      const lastLv=B.foe[B.foe.length-1].lv,prize=TCLASS[o.cls].m*lastLv;G.money+=prize;await bsay(`${J(G.name,'은')} 상금으로 ${money(prize)}을 손에 넣었다!`,true);}}
  else if(res==='lose'){
    if(o.noLose){B.etr.show=true;B.etr.x=130;await tween(420,k=>B.etr.x=130*(1-k));if(o.winMsg)await say(o.winMsg,{name:tn(),keep:1});}
    else{await bsay(`${G.name}에게는 싸울 수 있는 몬스터가 없다!`,true);const lost=Math.floor(G.money/2);G.money-=lost;
      await bsay(B.wild?`${J(G.name,'은')} 허둥지둥 ${money(lost)}을 떨어뜨리고 말았다...`:`${J(G.name,'은')} 상금으로 ${money(lost)}을 건네주었다...`,true);await bsay('...... 눈앞이 캄캄해졌다!',true);}}
  await fadeTo(1);
  [hudE,hudP,$('#bre'),$('#brp')].forEach(e=>e&&e.remove());hudE=hudP=null;hideMsg();FX.list=[];
  const lv=[...B.lvUp],noLose=o.noLose;B=null;state='world';Pad.show();
  if(res==='lose'&&!noLose){healParty();enterMap(G.heal.map,G.heal.x,G.heal.y,'up',{quiet:1});await fadeTo(0);
    if(G.heal.map==='home'){await say(`${G.name}! 무사했구나... 푹 쉬었으니 이제 괜찮을 거야.`,{name:'엄마'});}
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
  g.drawImage(battleBg(b.bg),0,0);const sl=1-b.slide,eo=-sl*260,po=sl*260;
  platform(g,EPOS.x+eo,EPOS.y+2,60,13,b.bg);
  if(b.etr.show){g.save();g.translate(Math.round(EPOS.x+eo+b.etr.x-32),EPOS.y-78);g.scale(4,4);person(g,0,0,'down',0,LOOK[b.o.look]||LOOK.man);g.restore();}
  const e=b.e;if(e.show&&!e.blink&&fm())drawMon(g,fm().sid,EPOS.x+eo+e.x,EPOS.y+e.y,3,{shiny:fm().shiny,dark:e.dark,white:e.white,whiteCol:e.tint||'#ffffff',sx:e.sx,sy:e.sy,clipY:EPOS.y+3});
  platform(g,PPOS.x+po,PPOS.y-4,74,15,b.bg);
  if(b.ptr.show){g.save();g.translate(Math.round(PPOS.x+po+b.ptr.x-32),PPOS.y-78);g.scale(4,4);person(g,0,0,'up',0,LOOK.player);g.restore();}
  const p=b.p;if(p.show&&!p.blink&&pm())drawMon(g,pm().sid,PPOS.x+po+p.x,PPOS.y+p.y,4,{back:true,shiny:pm().shiny,white:p.white,whiteCol:p.tint||'#ffffff',sx:p.sx,sy:p.sy,clipY:PPOS.y+1});
  if(b.ball){g.save();g.translate(b.ball.x,b.ball.y);g.scale(1.6,1.6);capsule(g,0,0,b.ball.r,{kind:b.ball.kind,open:b.ball.open});if(b.ball.dim){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-5,-5,10,10);}g.restore();}
  FX.draw(g);g.restore();if(b.flash>0){g.globalAlpha=b.flash;g.fillStyle=b.flashCol;g.fillRect(0,0,W,H);g.globalAlpha=1;}}
