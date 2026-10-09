/* =========================================================
   auto.js — 자동 전투 · 자동 사냥 · 탑 자동 등반 · 필드 플로팅 버튼
   자동 전투: 효과가 굉장한 공격 기술이 있으면 그중 가장 센 것, 없으면 가장 센 공격 기술.
   자동 진행 중에는 대화가 저절로 넘어가고, 확인 질문은 안전한 쪽으로 답한다.
   ========================================================= */
var AUTO={battle:!!SET.autoBattle,hunt:false,climb:false,lastDir:null};
function autoFight(){return!!AUTO&&(AUTO.battle||AUTO.hunt||AUTO.climb);}
function autoTalk(){return!!AUTO&&(AUTO.climb||AUTO.hunt||(AUTO.battle&&state==='battle'));}
/* ---------- 자동 전투: 기술 고르기 ---------- */
function autoMoveIndex(){const p=pm(),f=fm(),usable=p.moves.map((x,i)=>({x,i,d:MV[x.id]})).filter(o=>o.x.pp>0);
  if(!usable.length)return'struggle';
  const dmg=usable.filter(o=>o.d.p>0).map(o=>{const e=f?effT(o.d.t,SP[f.sid].t):1,stab=SP[p.sid].t.includes(o.d.t)?1.5:1;return{...o,e,score:o.d.p*e*stab*((o.d.a||100)/100)};}).filter(o=>o.e>0);
  if(!dmg.length)return usable[0].i;
  const sup=dmg.filter(o=>o.e>1),pool=sup.length?sup:dmg;
  return pool.sort((a,b)=>b.score-a.score)[0].i;}
/* 자동 진행 중 확인 질문에 대한 답 (null이면 사람에게 묻는다) */
function autoAnswer(text,opts){if(!autoTalk())return null;
  if(text.includes('다음 몬스터'))return 0;           // 다음 몬스터를 내보낸다
  if(text.includes('교체하겠습니까'))return opts.length-1; // 교체하지 않는다
  if(text.includes('배우게 하겠습니까'))return opts.length-1; // 기존 기술 유지
  if(text.includes('포기하겠습니까'))return 0;
  if(text.includes('이름을 붙여'))return opts.length-1;
  if(text.includes('직접 맞서'))return 0;
  return null;}
function autoForcedPick(){let best=-1,bh=-1;G.party.forEach((m,i)=>{if(m.hp>0&&i!==B.pi&&m.hp/maxHp(m)>bh){bh=m.hp/maxHp(m);best=i;}});return best<0?G.party.findIndex(m=>m.hp>0):best;}

/* ---------- 자동 사냥: 풀숲에서 왔다 갔다 ---------- */
function partyHpRatio(){let a=0,b=0;for(const m of G.party){a+=Math.max(0,m.hp);b+=maxHp(m);}return b?a/b:0;}
function stopHunt(msgText){if(!AUTO.hunt)return;AUTO.hunt=false;updFloat(true);if(msgText){toast(msgText);sfx('back');}}
function nearestGrassStep(m){const key=(x,y)=>x+','+y,prev={},q=[[P.x,P.y]];prev[key(P.x,P.y)]=null;let n=0;
  while(q.length&&n++<900){const[x,y]=q.shift();if(tileAt(m,x,y)===','&&!(x===P.x&&y===P.y)){let k=key(x,y),d=null;while(prev[k]){d=prev[k][1];k=prev[k][0];}return d;}
    for(const d of['up','down','left','right']){const[dx,dy]=DV[d],nx=x+dx,ny=y+dy,k=key(nx,ny);if(k in prev||!passable(m,nx,ny,d)||npcAt(m,nx,ny)||itemAt(m,nx,ny)||tileAt(m,nx,ny)==='L')continue;prev[k]=[key(x,y),d];q.push([nx,ny]);}}
  return null;}
function autoTick(){if(!AUTO.hunt||busy||ui.length||P.moving||state!=='world')return;const m=curMap();
  if(!m.enc){stopHunt('이곳에는 야생 몬스터가 없어요.');return;}
  if(!G.party.some(p=>p.hp>0)||partyHpRatio()<.35){stopHunt('몬스터들의 체력이 낮아서 자동 사냥을 멈췄어요.');return;}
  let d=null;
  if(tileAt(m,P.x,P.y)===','){const opts=['left','right','up','down'].filter(k=>{const[dx,dy]=DV[k],nx=P.x+dx,ny=P.y+dy;return tileAt(m,nx,ny)===','&&passable(m,nx,ny,k)&&!npcAt(m,nx,ny)&&!itemAt(m,nx,ny);});
    const back={left:'right',right:'left',up:'down',down:'up'}[AUTO.lastDir];
    d=opts.includes(back)&&Math.random()<.85?back:opts[0]||null;}
  else d=nearestGrassStep(m);
  if(!d){stopHunt('근처에 풀숲이 없어요. 풀숲 근처에서 켜 주세요.');return;}
  AUTO.lastDir=d;P.dir=d;tryMove(d);}
function autoUserInput(){if(AUTO.hunt)stopHunt('자동 사냥을 멈췄어요.');if(AUTO.climb){AUTO.climb=false;updFloat(true);toast('자동 등반을 멈춰요 (지금 층까지만)');}}

/* ---------- 무한의 탑: 어디서든 입장 · 자동 등반 ---------- */
async function goTower(){const t=towerState();
  const r=await ask(`무한의 탑으로 이동할까요?\n최고 기록 ${t.best}층 · 나오면 지금 자리로 돌아와요.`,['이동한다','그만둔다']);
  if(r!==0)return;G.towerRet={map:G.map,x:P.x,y:P.y,dir:P.dir};sfx('exit');
  await fadeTo(1);enterMap('towerLobby',5,8,'up',{sign:1});await fadeTo(0);}
Object.defineProperty(MAPS.towerLobby.warps,'5,9',{enumerable:true,configurable:true,get(){const r=G&&G.towerRet;return r&&MAPS[r.map]?[r.map,r.x,r.y,r.dir||'down']:['town5',20,4,'down'];}});
async function autoClimb(start,here){AUTO.climb=true;updFloat(true);if(!here)await towerEnter(start);
  while(AUTO.climb&&G.map==='towerFloor'){const g=npcById('tw_guard');
    if(g&&!g.hide){await sleep(250);await towerFight();if(G.map!=='towerFloor')break;}
    if(towerState().cur>=100||!AUTO.climb)break;await sleep(200);await towerNext();}
  const was=AUTO.climb;AUTO.climb=false;updFloat(true);
  if(was&&G.map==='towerFloor'&&towerState().cur>=100)await say('탑의 꼭대기에 도착했다!');}

/* ---------- 필드 플로팅 버튼 ---------- */
const FLOAT=el(TOP,'floatbar','');FLOAT.innerHTML=`<button class="fb tower"><i></i><span>탑</span></button><button class="fb hunt"><i></i><span>자동<br>사냥</span></button><button class="fb auto"><i></i><span>자동<br>전투</span></button><button class="fb climb"><i></i><span>자동<br>등반</span></button><button class="fb stop"><span>자동<br>중지</span></button>`;
const FB={tower:FLOAT.querySelector('.tower'),hunt:FLOAT.querySelector('.hunt'),auto:FLOAT.querySelector('.auto'),stop:FLOAT.querySelector('.stop'),climb:FLOAT.querySelector('.climb')};
for(const b of Object.values(FB))b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();});
FB.tower.addEventListener('click',e=>{e.stopPropagation();if(!fieldFree())return;audioInit();sfx('sel');runScript(()=>goTower());});
FB.hunt.addEventListener('click',e=>{e.stopPropagation();audioInit();if(AUTO.hunt){stopHunt('자동 사냥을 멈췄어요.');return;}
  if(!fieldFree())return;if(!curMap().enc){toast('야생 몬스터가 나오는 곳에서만 쓸 수 있어요.');sfx('bad');return;}
  if(partyHpRatio()<.35){toast('먼저 몬스터를 회복시켜 주세요.');sfx('bad');return;}
  AUTO.hunt=true;sfx('sel');toast('자동 사냥 시작! 아무 키나 누르면 멈춰요.');updFloat(true);});
FB.auto.addEventListener('click',e=>{e.stopPropagation();audioInit();AUTO.battle=!AUTO.battle;SET.autoBattle=AUTO.battle?1:0;saveSettings();sfx(AUTO.battle?'sel':'back');
  toast(AUTO.battle?'자동 전투 켜짐':'자동 전투 꺼짐');updFloat(true);
  if(AUTO.battle&&state==='battle'){const h=topH();if(h&&h.autoHook)h.autoHook();}});
FB.climb.addEventListener('click',e=>{e.stopPropagation();audioInit();if(AUTO.climb||!fieldFree()||G.map!=='towerFloor')return;
  if(!G.party.some(m=>m.hp>0)){toast('싸울 수 있는 몬스터가 없어요.');sfx('bad');return;}
  sfx('sel');toast(`${towerState().cur}층부터 자동 등반을 다시 시작해요`);runScript(()=>autoClimb(towerState().cur,true));});
FB.stop.addEventListener('click',e=>{e.stopPropagation();sfx('back');if(AUTO.hunt)stopHunt('자동 사냥을 멈췄어요.');if(AUTO.climb){AUTO.climb=false;toast('자동 등반을 멈춰요 (지금 층까지만)');}updFloat(true);});
let floatKey='';
function updFloat(force){const inWorld=G&&state==='world',inBattle=state==='battle',inTower=G&&(G.map==='towerLobby'||G.map==='towerFloor');
  const show={tower:inWorld&&!!G.flags.pad&&!inTower&&!AUTO.hunt,hunt:inWorld&&!!G.flags.pad&&!inTower&&!!(curMap()&&curMap().enc),auto:(inWorld&&!!G.flags.pad)||inBattle,stop:AUTO.hunt||AUTO.climb,climb:inWorld&&G.map==='towerFloor'&&!AUTO.climb};
  const k=JSON.stringify([show,AUTO.battle,AUTO.hunt,AUTO.climb]);if(!force&&k===floatKey)return;floatKey=k;
  for(const n in FB)FB[n].classList.toggle('hidden',!show[n]);FB.auto.classList.toggle('on',autoFight());FB.hunt.classList.toggle('on',AUTO.hunt);
  FB.auto.querySelector('span').innerHTML=AUTO.climb||AUTO.hunt?'자동<br>진행중':AUTO.battle?'자동<br>전투 ON':'자동<br>전투';}
