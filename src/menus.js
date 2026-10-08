/* =========================================================
   menus.js — 원정패드, 메뉴, 파티, 요약, 가방, 도감, 트레이너 카드, 리포트, 설정, 상점, 센터, PC
   ========================================================= */
let botMode='title';
const fmtTime=ms=>{const m=Math.floor(ms/60000);return`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;};
const money=n=>`${Number(n).toLocaleString()}원`;
const DOW='일월화수목금토';
const REGION={town:{n:'새싹마을',x:44,y:92},route1:{n:'1번 도로',x:44,y:62},city:{n:'바위시티',x:44,y:28},route2:{n:'2번 도로',x:98,y:28},town2:{n:'물결마을',x:150,y:28}};

/* ================= 원정패드 (필드의 아래 화면) ================= */
const Pad={el:null,app:0,tm:null,
  apps:[['시계','clock'],['파티','party'],['지도','map'],['만보기','steps']],
  init(){this.el=el(BOT,'','',[0,0,256,192]);this.el.id='padUI';this.el.classList.add('hidden');},
  show(){if(!this.el)this.init();botMode='pad';this.el.classList.remove('hidden');this.render();clearInterval(this.tm);this.tm=setInterval(()=>{if(this.app===0||this.app===3)this.render();},1000);},
  hide(){if(this.el)this.el.classList.add('hidden');clearInterval(this.tm);},
  cycle(d){if(!G.flags.pad)return;this.app=(this.app+(d==='l'?-1:1)+this.apps.length)%this.apps.length;sfx('cur');this.render();},
  render(){if(!this.el||!G)return;const e=this.el;
    if(!G.flags.pad){e.innerHTML=`<div class="sheet" style="left:${U(28)};top:${U(30)};width:${U(200)};text-align:center"><div style="font-size:${U(10)}">${esc(G.name)}의 모험</div><div class="desc" style="margin-top:${U(4)}">${esc(curMap().name)}<br>플레이 시간 ${fmtTime(G.playMs)}</div></div>`;}
    else{const[nm,k]=this.apps[this.app];
      e.innerHTML=`<div class="dev"></div><div class="lcd" style="left:${U(44)};top:${U(22)};width:${U(168)};height:${U(116)}">${this[k]()}</div>
        <div class="nav" data-d="l" style="left:${U(21)}">◀</div><div class="nav" data-d="r" style="left:${U(217)}">▶</div>
        <div class="dots" style="top:${U(141)};bottom:auto">${this.apps.map((a,i)=>`<i class="${i===this.app?'on':''}"></i>`).join('')}</div>
        <div class="abs lcdt" style="left:${U(44)};top:${U(12)};width:${U(168)};text-align:center;font-size:${U(7)};color:#ffd9d9">원정패드 · ${nm}</div>`;
      e.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',ev=>{ev.stopPropagation();if(ui.length)return;this.cycle(n.dataset.d);}));
      if(k==='map')this.drawMap(e.querySelector('canvas'));}
    const mb=el(e,'btn red','<span style="font-size:'+U(12)+'">≡ 메뉴</span>',[64,158,128,28]);
    mb.addEventListener('click',ev=>{ev.stopPropagation();if(!ui.length&&state==='world'&&!busy)openMenu();});},
  clock(){const d=new Date(),h=d.getHours(),ph=h<5||h>=20?'밤':h<10?'아침':h<17?'낮':'저녁';
    return`<div class="t lcdt" style="top:${U(18)};font-size:${U(36)};letter-spacing:${U(2)}">${String(h).padStart(2,'0')}<span class="blink">:</span>${String(d.getMinutes()).padStart(2,'0')}</div>
      <div class="t lcdt" style="top:${U(70)};font-size:${U(11)}">${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})</div><div class="t lcdt" style="top:${U(88)};font-size:${U(9)}">지금은 ${ph}</div>`;},
  party(){return`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:${U(4)};padding:${U(8)} ${U(8)}">${[0,1,2,3,4,5].map(i=>{const m=G.party[i];
    if(!m)return`<div style="height:${U(46)};border:1px dashed #6a8a5a;border-radius:${U(4)}"></div>`;const mx=maxHp(m);
    return`<div style="height:${U(46)};text-align:center;font-size:${U(7)}"><img src="${monIcon(m.sid,m.shiny)}" style="width:${U(24)};height:${U(24)};image-rendering:pixelated;${m.hp<=0?'filter:grayscale(1) brightness(.6)':''}"><div>Lv${m.lv}</div>${hpBar(m.hp,mx)}</div>`;}).join('')}</div>`;},
  map(){return`<canvas width="168" height="116"></canvas>`;},
  drawMap(c){if(!c)return;const g=c.getContext('2d');g.fillStyle='#cfe8c1';g.fillRect(0,0,168,116);g.fillStyle='#b5d8a4';for(let i=0;i<8;i++)g.fillRect((i*37)%160,(i*23)%110,14,8);
    g.fillStyle='#8ab8e8';g.fillRect(140,8,26,40);g.fillStyle='#24391f';
    const P0=REGION;g.lineWidth=4;g.strokeStyle='#6a8a5a';g.beginPath();g.moveTo(P0.town.x,P0.town.y);g.lineTo(P0.city.x,P0.city.y);g.lineTo(P0.town2.x,P0.town2.y);g.stroke();
    const cur=curMap().region;
    for(const[k,r]of Object.entries(P0)){const isTown=!k.startsWith('route');if(!isTown)continue;g.fillStyle='#2f4a2a';g.fillRect(r.x-6,r.y-6,12,12);g.fillStyle='#e8f4e0';g.fillRect(r.x-4,r.y-4,8,8);}
    const r=P0[cur]||P0.town;if((frame>>4)&1||true){g.fillStyle='#e2566f';g.beginPath();g.arc(r.x,r.y,4,0,7);g.fill();}
    g.fillStyle='#24391f';g.font='9px Galmuri9, monospace';g.fillText((P0[cur]||P0.town).n,8,110);
    g.font='7px Galmuri9, monospace';g.fillText('새싹',P0.town.x+9,P0.town.y+3);g.fillText('바위',P0.city.x-8,P0.city.y-9);g.fillText('물결',P0.town2.x-8,P0.town2.y+16);},
  steps(){return`<div class="lcdt" style="padding:${U(10)} ${U(12)};font-size:${U(9.5)};line-height:1.75">
    <div style="display:flex;justify-content:space-between"><span>걸음 수</span><b>${(G.steps||0).toLocaleString()}보</b></div>
    <div style="display:flex;justify-content:space-between"><span>플레이 시간</span><b>${fmtTime(G.playMs)}</b></div>
    <div style="display:flex;justify-content:space-between"><span>소지금</span><b>${money(G.money)}</b></div>
    <div style="display:flex;justify-content:space-between"><span>도감 (포획)</span><b>${Object.keys(G.caught).length} / ${DEX_N}</b></div>
    <div style="display:flex;justify-content:space-between"><span>배지</span><b>${G.badges.filter(Boolean).length}개</b></div></div>`;}};

/* ================= 시작 메뉴 ================= */
let menuIdx=0;
async function openMenu(){if(busy)return;busy=true;sfx('menu');
  try{while(true){
    const T=[['dex','도감',G.flags.dex],['party','몬스터',G.party.length>0],['bag','가방',1],['card',G.name,1],['save','리포트',1],['opt','설정',1]];
    const btns=T.map(([k,l,ok],i)=>({html:`<img src="${menuIcon(k)}" style="width:${U(24)};height:${U(24)};image-rendering:pixelated"><span style="font-size:${U(10.5)}">${ok?esc(l):'???'}</span>`,
      x:i%2?132:8,y:6+Math.floor(i/2)*54,w:116,h:48,cls:'tile',disabled:!ok}));
    btns.push({html:'닫기',x:78,y:168,w:100,h:20,cls:'dark'});
    const i=await panel(btns,{backdrop:true,bg:'linear-gradient(135deg,#5a8ad8,#3d5aa8)',start:menuIdx,menuClose:true});
    if(i<0||i===6)break;menuIdx=i;
    if(i===0)await dexScreen();else if(i===1)await partyScreen('field');else if(i===2)await bagScreen('field');
    else if(i===3)await trainerCard();else if(i===4){if(await saveMenu())break;}else if(i===5)await optionsMenu();}}
  finally{hideMsg();clearPages(TOP);busy=false;Pad.render();}}

/* ================= 파티 ================= */
function partyCellHtml(m){const mx=maxHp(m);return`<img src="${monIcon(m.sid,m.shiny)}" alt=""><div class="inf"><div class="nm">${esc(N(m))}</div>
  <div class="sub"><span>Lv${m.lv} ${stb(m.st)}</span><span>${m.hp}/${mx}</span></div>${hpBar(m.hp,mx)}</div>`;}
function monTopPage(m,title){const sp=SP[m.sid],mx=maxHp(m);
  return`<div class="abs" style="inset:0;background:linear-gradient(#cfe6ff,#f4f9ff)"></div><div class="title-bar">${esc(title||'몬스터')}<span class="r">${esc(G.name)}의 파티</span></div>
  <div class="abs" style="left:${U(10)};top:${U(26)};width:${U(104)};height:${U(104)};border-radius:${U(8)};background:radial-gradient(#ffffff,#d6e8c8)"></div>
  <img class="abs big" src="${monIcon(m.sid,m.shiny)}" style="left:${U(14)};top:${U(30)};width:${U(96)};height:${U(96)}">
  ${m.shiny?`<div class="abs" style="left:${U(14)};top:${U(28)};color:#e2566f;font-size:${U(12)}">★</div>`:''}
  <div class="sheet" style="left:${U(122)};top:${U(26)};width:${U(126)};height:${U(104)}"><div style="font-size:${U(11)}">${esc(N(m))}</div>
  <div style="font-size:${U(9)};margin:${U(2)} 0">Lv${m.lv} ${typesHtml(m.sid)}</div><div class="hpl">HP ${hpBar(m.hp,mx)}</div>
  <div style="text-align:right;font-size:${U(9.5)}">${m.hp} / ${mx}</div><div style="font-size:${U(9)};margin-top:${U(3)}">${m.st?stb(m.st):'상태: 건강'}</div>
  <div style="font-size:${U(8.5)};color:#6a7190;margin-top:${U(3)}">${NATURES[m.nat][0]} 성격</div></div>
  <div class="sheet" style="left:${U(10)};top:${U(138)};width:${U(238)};height:${U(48)};font-size:${U(9)};padding:${U(4)} ${U(8)}">${m.moves.map(x=>`${tb(MV[x.id].t)} ${MV[x.id].n}`).join('&nbsp; ')}</div>`;}
/* mode: field | battle | forced | item | deposit — 선택 인덱스 반환 */
async function partyScreen(mode,o={}){let at=o.start!=null?o.start:mode==='forced'?Math.max(0,G.party.findIndex(m=>m.hp>0)):mode==='battle'&&B?B.pi:0;const prevBot=botMode;botMode='menu';
  const tp=page(TOP,'');
  try{while(true){
    const btns=[0,1,2,3,4,5].map(i=>{const m=G.party[i];if(!m)return{html:'',x:i%2?130:4,y:4+Math.floor(i/2)*52,w:122,h:48,cls:'pcell empty',disabled:1,skip:1};
      return{html:partyCellHtml(m),x:i%2?130:4,y:4+Math.floor(i/2)*52,w:122,h:48,cls:'pcell'+(i===0?' first':'')+(m.hp<=0?' ko':'')};});
    const tip={field:'몬스터를 선택해 주세요.',battle:'교체할 몬스터를 선택해 주세요.',forced:'다음에 내보낼 몬스터를 선택해 주세요.',item:o.tip||'누구에게 사용할까요?',deposit:'맡길 몬스터를 선택해 주세요.'}[mode];
    if(mode!=='forced')btns.push({html:'돌아가기',x:180,y:162,w:72,h:26,cls:'dark'});
    const i=await panel(btns,{backdrop:true,bg:'linear-gradient(#5aa0e8,#3a6ab8)',start:Math.min(at,G.party.length-1),cancel:mode==='forced'?false:-1,
      html:`<div class="abs" style="left:${U(6)};top:${U(166)};color:#fff;font-size:${U(8.5)}">${tip}</div>`,
      onMove:j=>{const m=G.party[j];tp.innerHTML=m?monTopPage(m,{field:'몬스터',battle:'몬스터 교체',forced:'몬스터 교체',item:'도구 사용',deposit:'몬스터 맡기기'}[mode]):'';}});
    if(i<0||i===6)return-1;at=i;const m=G.party[i];
    if(mode==='item'||mode==='deposit')return i;
    if(mode==='forced'){if(m.hp<=0){await say(`${J(N(m),'은')} 싸울 수 있는 기력이 없다!`);continue;}if(i===B.pi)continue;return i;}
    if(mode==='battle'){const c=await panel([{html:'교체한다',x:40,y:40,w:176,h:40,cls:'blue'},{html:'정보 보기',x:40,y:88,w:176,h:40},{html:'취소',x:40,y:136,w:176,h:32,cls:'dark'}],{backdrop:true,bg:'rgba(20,24,40,.55)'});
      if(c===0){if(m.hp<=0){await say(`${J(N(m),'은')} 싸울 수 있는 기력이 없다!`);continue;}if(i===B.pi){await say(`${J(N(m),'은')} 이미 싸우고 있다!`);continue;}return i;}
      if(c===1)await summary(G.party,i);continue;}
    /* field */
    const c=await panel([{html:'정보 보기',x:40,y:30,w:176,h:40,cls:'blue'},{html:'순서 바꾸기',x:40,y:78,w:176,h:40,disabled:G.party.length<2},{html:'취소',x:40,y:126,w:176,h:32,cls:'dark'}],{backdrop:true,bg:'rgba(20,24,40,.55)'});
    if(c===0)await summary(G.party,i);
    else if(c===1){msg(`${J(N(m),'을')} 어디로 옮길까요?`);
      const btn2=G.party.map((mm,j)=>({html:partyCellHtml(mm),x:j%2?130:4,y:4+Math.floor(j/2)*52,w:122,h:48,cls:'pcell'+(j===i?' first':'')}));
      const j=await panel(btn2,{backdrop:true,bg:'linear-gradient(#e8a05a,#b8703a)',start:i});hideMsg();
      if(j>=0&&j!==i){[G.party[i],G.party[j]]=[G.party[j],G.party[i]];sfx('swap');at=j;}}}}
  finally{tp.remove();botMode=prevBot;}}

/* ================= 요약 (3페이지) ================= */
async function summary(lst,idx){let pg=0,mi=0;const tp=page(TOP,''),bp=el(BOT,'abs','',[0,0,256,192]);const prevBot=botMode;botMode='menu';
  const PG=['프로필','능력치','기술'];
  const render=()=>{const m=lst[idx],sp=SP[m.sid],s=calc(m),mx=s[0],nat=NATURES[m.nat];
    const head=`<div class="abs" style="inset:0;background:linear-gradient(${['#ffe9b8,#fff8e6','#d8f0c8,#f4fbef','#d6e4ff,#f2f6ff'][pg]})"></div><div class="title-bar">${PG[pg]}<span class="r">${idx+1} / ${lst.length}</span></div>`;
    let body='';
    if(pg===0){body=`<div class="abs" style="left:${U(8)};top:${U(24)};width:${U(96)};height:${U(96)};border-radius:${U(8)};background:radial-gradient(#fff,#e8dcc0)"></div>
      <img class="abs big" src="${monIcon(m.sid,m.shiny)}" style="left:${U(8)};top:${U(24)};width:${U(96)};height:${U(96)}">
      <div class="abs" style="left:${U(8)};top:${U(122)};width:${U(96)};text-align:center;font-size:${U(11)}">${esc(N(m))}${m.shiny?' <span style="color:#e2566f">★</span>':''}</div>
      <div class="sheet kv" style="left:${U(112)};top:${U(24)};width:${U(136)};height:${U(112)};padding:${U(5)} ${U(8)}">
      <b>도감 No.</b><span>${pad3(m.sid)}</span><b>종류</b><span>${sp.n}</span><b>타입</b><span>${typesHtml(m.sid)}</span><b>어버이</b><span>${esc(m.ot||G.name)}</span>
      <b>ID No.</b><span>${G.id}</span><b>레벨</b><span>${m.lv}</span><b>성격</b><span>${nat[0]}</span></div>
      <div class="sheet desc" style="left:${U(8)};top:${U(142)};width:${U(240)};height:${U(44)};padding:${U(4)} ${U(8)}">${nat[0]} 성격.<br>${m.met?`${esc(m.met.map)}에서 Lv${m.met.lv}일 때 만났다.`:'운명적으로 만났다.'}</div>`;}
    else if(pg===1){const bar=(v,maxv)=>`<div class="bar"><i style="width:${clamp(v/maxv*100,4,100)}%"></i></div>`;
      const lo=expFor(m.lv),hi=expFor(m.lv+1),ep=m.lv>=100?100:(m.exp-lo)/(hi-lo)*100;
      body=`<img class="abs big" src="${monIcon(m.sid,m.shiny)}" style="left:${U(8)};top:${U(24)};width:${U(72)};height:${U(72)}">
      <div class="abs" style="left:${U(8)};top:${U(98)};width:${U(72)};text-align:center;font-size:${U(9.5)}">${esc(N(m))}<br>Lv${m.lv}</div>
      <div class="sheet" style="left:${U(88)};top:${U(24)};width:${U(160)};height:${U(118)};padding:${U(5)} ${U(8)}"><div class="stat-grid">
      <span>HP</span><span style="text-align:right">${m.hp} / ${mx}</span>${bar(m.hp,mx)}
      ${[1,2,3,4,5].map(i=>`<span class="${nat[1]===i&&nat[2]!==i?'up':nat[2]===i&&nat[1]!==i?'dn':''}">${STN[i]}</span><span style="text-align:right">${s[i]}</span>`).join('')}</div></div>
      <div class="sheet" style="left:${U(8)};top:${U(146)};width:${U(240)};height:${U(40)};padding:${U(3)} ${U(8)};font-size:${U(9)}">
      <div style="display:flex;justify-content:space-between"><span>경험치</span><span>${m.exp.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between"><span>다음 레벨까지</span><span>${m.lv>=100?0:(hi-m.exp).toLocaleString()}</span></div>
      <div class="hpb" style="height:${U(3)}"><i style="width:${ep}%;background:#3fa9f5"></i></div></div>`;}
    else{const sel=m.moves[mi]||m.moves[0],d=MV[sel.id];
      body=`<div class="sheet" style="left:${U(8)};top:${U(24)};width:${U(240)};height:${U(92)};padding:${U(3)} ${U(8)}">${m.moves.map((x,j)=>`<div class="mvline" style="${j===mi?'background:#ffe9a8;':''}">${tb(MV[x.id].t)} ${MV[x.id].n}<span class="r">PP ${x.pp}/${MV[x.id].pp}</span></div>`).join('')}</div>
      <div class="sheet" style="left:${U(8)};top:${U(120)};width:${U(240)};height:${U(66)};padding:${U(4)} ${U(8)}">
      <div style="display:flex;gap:${U(10)};font-size:${U(9)}"><span>분류 <b>${CATN[d.c]}</b></span><span>위력 <b>${d.p||'-'}</b></span><span>명중 <b>${d.a||'-'}</b></span></div>
      <div class="desc" style="margin-top:${U(3)}">${d.d}</div></div>`;}
    tp.innerHTML=head+body;
    bp.innerHTML=`<div class="backdrop" style="background:linear-gradient(#4a5a88,#2a3358)"></div>`;
    PG.forEach((t,j)=>{const b=el(bp,'btn tab'+(j===pg?' on':''),t,[6+j*82,6,78,26]);b.addEventListener('click',e=>{e.stopPropagation();pg=j;sfx('cur');render();});});
    if(pg===2){m.moves.forEach((x,j)=>{const dd=MV[x.id],b=el(bp,'btn mvbtn'+(j===mi?' sel':''),`<span class="mn">${dd.n}</span><span class="mi"><span>${TYPES[dd.t].n}</span><span>PP ${x.pp}/${dd.pp}</span></span>`,[6+(j%2)*124,40+Math.floor(j/2)*56,120,50]);
      b.style.background=`linear-gradient(${shade(TYPES[dd.t].c,.25)},${TYPES[dd.t].c})`;b.addEventListener('click',e=>{e.stopPropagation();mi=j;sfx('cur');render();});});}
    else{const big=el(bp,'abs','',[78,38,100,100]);big.innerHTML=`<div class="abs" style="inset:0;border-radius:50%;background:radial-gradient(rgba(255,255,255,.35),rgba(255,255,255,0) 70%)"></div><img class="abs big" src="${monIcon(m.sid,m.shiny)}" style="left:${U(2)};top:${U(2)};width:${U(96)};height:${U(96)};animation:hop .4s infinite alternate">`;
      big.addEventListener('click',e=>{e.stopPropagation();cry(m.sid);});}
    const nav=[['▲ 이전',[6,156,70,30],()=>h.key('up')],['▼ 다음',[80,156,70,30],()=>h.key('down')],['돌아가기',[166,156,84,30],()=>h.key('b')]];
    nav.forEach(([t,r,f],j)=>{const b=el(bp,'btn'+(j===2?' dark':''),t,r);b.addEventListener('click',e=>{e.stopPropagation();f();});});};
  return new Promise(res=>{const h={key(k){if(k==='left'){pg=(pg+2)%3;sfx('cur');render();}else if(k==='right'){pg=(pg+1)%3;sfx('cur');render();}
      else if(k==='up'){if(pg===2&&lst[idx].moves.length>1&&false)return;idx=(idx-1+lst.length)%lst.length;mi=0;sfx('cur');render();cry(lst[idx].sid);}
      else if(k==='down'){idx=(idx+1)%lst.length;mi=0;sfx('cur');render();cry(lst[idx].sid);}
      else if(k==='a'){if(pg===2){mi=(mi+1)%lst[idx].moves.length;sfx('cur');render();}else cry(lst[idx].sid);}
      else if(k==='b'||k==='menu'){sfx('back');popH(h);tp.remove();bp.remove();botMode=prevBot;res();}}};
    pushH(h);render();cry(lst[idx].sid);});}

/* ================= 가방 ================= */
let bagPocket=0;
function bagItems(p){return Object.keys(ITEMS).filter(k=>ITEMS[k].p===POCKETS[p][0]&&G.bag[k]>0);}
async function bagScreen(mode){const tp=page(TOP,''),prevBot=botMode;botMode='menu';
  const top=(id)=>{const it=id&&ITEMS[id];tp.innerHTML=`<div class="abs" style="inset:0;background:linear-gradient(#ffe2b0,#fff6e4)"></div><div class="title-bar">가방 · ${POCKETS[bagPocket][1]}<span class="r">${money(G.money)}</span></div>
    <div class="abs" style="left:${U(14)};top:${U(30)};width:${U(80)};height:${U(80)};border-radius:${U(10)};background:radial-gradient(#fff,#f2d8a8)"></div>
    ${it?`<img class="abs big" src="${itemIcon(id)}" style="left:${U(30)};top:${U(46)};width:${U(48)};height:${U(48)}">`:`<img class="abs big" src="${menuIcon('bag')}" style="left:${U(30)};top:${U(46)};width:${U(48)};height:${U(48)}">`}
    <div class="sheet" style="left:${U(104)};top:${U(30)};width:${U(144)};height:${U(80)}"><div style="font-size:${U(11)}">${it?it.n:'비어 있다'}</div><div style="font-size:${U(9)};color:#6a7190">${it?(it.p==='key'?'중요한 물건':`보유 ${G.bag[id]}개`):''}</div></div>
    <div class="sheet desc" style="left:${U(14)};top:${U(118)};width:${U(234)};height:${U(66)}">${it?it.d:'이 주머니에는 아무것도 없다.'}</div>`;};
  try{while(true){const ids=bagItems(bagPocket);
    const items=ids.map(k=>({html:`<img src="${itemIcon(k)}"><span>${ITEMS[k].n}</span><span class="r">${ITEMS[k].p==='key'?'':'× '+G.bag[k]}</span>`,
      disabled:mode==='battle'&&(ITEMS[k].p==='key'||(ITEMS[k].ball&&!B.wild))}));
    const tabs=POCKETS.map((p,j)=>({html:p[1],x:4+j*84,y:4,w:80,h:24,cls:'tab'+(j===bagPocket?' on':''),val:-10-j}));
    let moved=0;
    const r=await list(items,{rect:[4,32,248,126],rowH:18,backdrop:true,bg:'linear-gradient(#e89a4a,#b8682a)',keys:['left','right','__tab'],allowDisabled:false,
      buttons:[{html:'닫기',x:180,y:162,w:72,h:26,cls:'dark',val:-1}],
      onOpen:hh=>{tabs.forEach((t,j)=>{const e=el(hh.wrap,'btn '+t.cls,t.html,[t.x,t.y,t.w,t.h]);e.style.pointerEvents='auto';e.addEventListener('click',ev=>{ev.stopPropagation();if(topH()!==hh)return;bagPocket=j;sfx('cur');hh.key('__tab');});});
        el(hh.wrap,'abs',`<span style="color:#fff;font-size:${U(8.5)}">◀▶ 주머니 전환</span>`,[6,168,120,16]);},
      onMove:i=>top(ids[i]),onKey:(k,i,close)=>{if(k==='__tab'){}else if(k==='left')bagPocket=(bagPocket+2)%3;else if(k==='right')bagPocket=(bagPocket+1)%3;sfx('cur');close(-2);}});
    if(r===-2)continue;
    if(r<0){if(r===-1)return null;continue;}
    const id=ids[r],it=ITEMS[id];
    if(it.p==='key'){await say(id==='pad'?'원정패드는 아래 화면에서 사용할 수 있다.':id==='dex'?'도감은 메뉴에서 볼 수 있다.':`${it.n}은 신고 있는 것만으로 효과가 있다.`);continue;}
    if(mode==='battle'){if(it.ball)return{id};
      const t=await partyScreen('item',{tip:`${it.n}을(를) 누구에게 사용할까요?`});if(t<0)continue;
      if(!canUse(id,G.party[t])){await say('사용해도 효과가 없을 것 같다.');continue;}return{id,target:t};}
    const c=await panel([{html:'사용하기',x:40,y:50,w:176,h:40,cls:'blue'},{html:'그만두기',x:40,y:100,w:176,h:34,cls:'dark'}],{backdrop:true,bg:'rgba(20,24,40,.55)'});
    if(c!==0)continue;
    if(it.ball){await say('지금은 사용할 수 없다!');continue;}
    const t=await partyScreen('item',{tip:`${it.n}을(를) 누구에게 사용할까요?`});if(t<0)continue;
    const m=G.party[t];if(!canUse(id,m)){await say('사용해도 효과가 없을 것 같다.');continue;}
    await applyItem(id,m);}}
  finally{tp.remove();botMode=prevBot;}}
function canUse(id,m){const it=ITEMS[id];if(it.revive)return m.hp<=0;if(m.hp<=0)return false;
  if(it.heal)return m.hp<maxHp(m);if(it.cure)return it.cure==='all'?!!m.st:m.st===it.cure;return false;}
async function applyItem(id,m,o={}){const it=ITEMS[id];G.bag[id]--;
  if(it.revive){m.hp=Math.max(1,Math.floor(maxHp(m)*it.revive));m.st='';sfx('heal');await say(`${J(N(m),'은')} 기운을 되찾았다!`);return;}
  if(it.heal){const b0=m.hp;m.hp=Math.min(maxHp(m),m.hp+it.heal);sfx('heal');if(o.anim)await o.anim(b0,m.hp);await say(`${N(m)}의 HP가 ${m.hp-b0} 회복되었다!`);return;}
  if(it.cure){m.st='';m.slp=0;sfx('heal');await say(`${N(m)}의 상태 이상이 나았다!`);}}

/* ================= 도감 ================= */
async function dexScreen(){const tp=page(TOP,''),prevBot=botMode;botMode='menu';const ids=Object.keys(SP).map(Number);let at=0;
  const show=(id,bounce)=>{const sp=SP[id],seen=G.seen[id],cg=G.caught[id];
    tp.innerHTML=`<div class="abs" style="inset:0;background:linear-gradient(#e2566f,#b63a52)"></div><div class="title-bar" style="background:linear-gradient(#3a2a3a,#241824)">몬스터 도감<span class="r">발견 ${Object.keys(G.seen).length} · 포획 ${Object.keys(G.caught).length}</span></div>
    <div class="abs" style="left:${U(8)};top:${U(24)};width:${U(100)};height:${U(100)};border-radius:${U(6)};background:${seen?'radial-gradient(#ffffff,#cfe8f8)':'#1d2030'};border:${U(2)} solid #3a2a3a"></div>
    ${seen?`<img class="abs big" src="${monIcon(id)}" style="left:${U(10)};top:${U(26)};width:${U(96)};height:${U(96)};${bounce?'animation:hop .25s 4 alternate':''}">`:`<div class="abs" style="left:${U(8)};top:${U(60)};width:${U(100)};text-align:center;color:#6a7190;font-size:${U(22)}">?</div>`}
    <div class="sheet" style="left:${U(114)};top:${U(24)};width:${U(134)};height:${U(100)};padding:${U(5)} ${U(8)}">
     <div style="font-size:${U(9)};color:#6a7190">No.${pad3(id)}</div><div style="font-size:${U(12)}">${seen?sp.n:'？？？'}</div>
     <div style="font-size:${U(9)};margin:${U(2)} 0">${seen?sp.cat+' 몬스터':'??? 몬스터'}</div><div>${seen?typesHtml(id):''}</div>
     <div style="font-size:${U(9)};margin-top:${U(4)}">키 ${cg?sp.h.toFixed(1)+' m':'???'}<br>몸무게 ${cg?sp.w.toFixed(1)+' kg':'???'}</div></div>
    <div class="sheet desc" style="left:${U(8)};top:${U(130)};width:${U(240)};height:${U(56)};padding:${U(5)} ${U(8)}">${cg?sp.d:seen?'붙잡으면 자세한 데이터가 기록된다.':'아직 만나지 못한 몬스터.'}</div>`;};
  try{while(true){const r=await list(ids.map(id=>({html:G.seen[id]?`<span style="color:#6a7190;font-size:${U(8)}">${pad3(id)}</span><img src="${monIcon(id)}"><span>${SP[id].n}</span><span class="r">${G.caught[id]?'<span style="color:#e2566f">◆</span>':''}</span>`
        :`<span style="color:#6a7190;font-size:${U(8)}">${pad3(id)}</span><span style="width:${U(16)}"></span><span style="color:#aab">- - - - -</span>`})),
      {rect:[4,4,248,154],rowH:19,backdrop:true,bg:'linear-gradient(#3a2a3a,#5a3a4a)',start:at,allowDisabled:true,buttons:[{html:'닫기',x:180,y:162,w:72,h:26,cls:'dark',val:-1}],onMove:i=>show(ids[i])});
    if(r<0)break;at=r;const id=ids[r];if(G.seen[id]){show(id,1);cry(id);}else sfx('bad');}}
  finally{tp.remove();botMode=prevBot;}}

/* ================= 트레이너 카드 ================= */
async function trainerCard(){const tp=page(TOP,''),bp=el(BOT,'abs','',[0,0,256,192]);const prevBot=botMode;botMode='menu';
  const d=new Date(G.start||Date.now());
  tp.innerHTML=`<div class="abs" style="inset:0;background:#2a3358"></div>
    <div class="abs" style="left:${U(10)};top:${U(12)};width:${U(236)};height:${U(168)};border-radius:${U(10)};background:linear-gradient(135deg,#6ab0ff,#3d6ad6);border:${U(2)} solid #1f3f7a;box-shadow:inset 0 0 0 ${U(2)} rgba(255,255,255,.4)"></div>
    <div class="abs" style="left:${U(22)};top:${U(20)};color:#fff;font-size:${U(9)};letter-spacing:${U(1)}">TRAINER CARD</div><div class="abs" style="left:${U(160)};top:${U(20)};color:#fff;font-size:${U(9)}">ID No.${G.id}</div>
    <div class="sheet kv" style="left:${U(20)};top:${U(36)};width:${U(148)};height:${U(134)};padding:${U(6)} ${U(8)}">
     <b>이름</b><span>${esc(G.name)}</span><b>소지금</b><span>${money(G.money)}</span><b>도감</b><span>${Object.keys(G.caught).length}마리</span>
     <b>플레이 시간</b><span>${fmtTime(G.playMs)}</span><b>걸음 수</b><span>${(G.steps||0).toLocaleString()}</span><b>모험 시작</b><span>${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}</span></div>
    <canvas class="abs big" width="16" height="20" style="left:${U(178)};top:${U(56)};width:${U(56)};height:${U(70)}"></canvas>`;
  person(tp.querySelector('canvas').getContext('2d'),0,0,'down',0,LOOK.player);
  bp.innerHTML=`<div class="backdrop" style="background:linear-gradient(#5a4a3a,#2a2018)"></div><div class="abs" style="left:${U(8)};top:${U(6)};color:#f2dca0;font-size:${U(10)}">배지 케이스</div>`;
  const B2=[['반석 배지','바위시티 관장 단단'],['물결 배지','물결마을 관장 하라']];
  B2.forEach(([n,w],i)=>{const s=el(bp,'badge-slot','',[30+i*124,30,72,72]);if(G.badges[i])s.innerHTML=`<img src="${badgeIcon(i)}">`;
    el(bp,'abs',`<div style="text-align:center;color:#f2dca0;font-size:${U(9)}">${G.badges[i]?n:'???'}<br><span style="font-size:${U(7.5)};color:#c8b080">${G.badges[i]?w:''}</span></div>`,[i*124+6,108,120,30]);
    s.addEventListener('click',e=>{e.stopPropagation();if(G.badges[i])sfx('sparkle');});});
  const cb=el(bp,'btn dark','돌아가기',[166,158,84,28]);
  return new Promise(res=>{const close=()=>{popH(h);tp.remove();bp.remove();botMode=prevBot;res();};const h={key(k){if(k==='b'||k==='a'||k==='menu'){sfx('back');close();}}};
    cb.addEventListener('click',e=>{e.stopPropagation();sfx('back');close();});pushH(h);});}

/* ================= 리포트 ================= */
const SAVE_KEY='monster-expedition-save-v2';
function saveGame(){G.x=P.x;G.y=P.y;G.dir=P.dir;G.savedAt=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(G));return true;}catch(e){return false;}}
function readSave(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
async function saveMenu(){const tp=page(TOP,`<div class="abs" style="inset:0;background:rgba(10,14,30,.55)"></div>
  <div class="sheet kv" style="left:${U(40)};top:${U(16)};width:${U(176)};padding:${U(8)} ${U(12)}"><b>장소</b><span>${esc(curMap().name)}</span><b>이름</b><span>${esc(G.name)}</span>
  <b>배지</b><span>${G.badges.filter(Boolean).length}</span><b>도감</b><span>${Object.keys(G.caught).length}</span><b>플레이 시간</b><span>${fmtTime(G.playMs)}</span></div>`);
  try{const r=await ask('지금까지의 모험을 리포트에 기록하시겠습니까?',['예','아니오'],{keep:1});if(r!==0){hideMsg();return false;}
    msg('리포트를 기록하고 있습니다...\n전원을 끄지 마세요.');await sleep(900);
    if(saveGame()){await Music.jingle('save');await say(`${J(G.name,'은')} 리포트에 제대로 기록했다!`);return true;}
    await say('리포트를 기록하지 못했습니다... (브라우저 저장소를 쓸 수 없음)');return false;}
  finally{tp.remove();}}

/* ================= 설정 ================= */
async function optionsMenu(){const rows=[['텍스트 속도',['느림','보통','빠름'],'text'],['전투 애니메이션',['끄기','켜기'],'anim'],['배경음 볼륨',['0','1','2','3','4','5'],'bgm'],
  ['효과음',['끄기','켜기'],'sfx'],['전투 방식',['교체','연속'],'style'],['화면 배치',['자동','세로','가로'],'layout']];
  const html=i=>i===rows.length?'<span style="margin:auto">결정</span>':`<span>${rows[i][0]}</span><span class="r" style="color:#3d5aa8">◀ ${rows[i][1][SET[rows[i][2]]]} ▶</span>`;
  const tp=page(TOP,`<div class="abs" style="inset:0;background:linear-gradient(#d8dce8,#f4f6fb)"></div><div class="title-bar">설정</div>
    <div class="sheet desc" style="left:${U(14)};top:${U(30)};width:${U(228)}">◀ ▶ 로 값을 바꾸고 결정을 누르세요.<br>전투 방식 "교체"는 상대가 다음 몬스터를 낼 때 교체할지 물어봅니다.<br>화면 배치 "가로"는 넓은 화면에서 두 화면을 나란히 보여 줍니다.</div>`);
  try{await list([...rows.map((r,i)=>({html:html(i)})),{html:html(rows.length)}],{rect:[4,4,248,150],rowH:21,backdrop:true,bg:'linear-gradient(#6a7290,#3d4562)',keys:['left','right','a'],tapPick:false,
    buttons:[{html:'결정',x:170,y:160,w:82,h:28,cls:'blue',val:-1}],
    onOpen:h=>{optH=h;},onKey:(k,i,close)=>{if(k==='a'){if(i>=rows.length){sfx('sel');close(i);return;}k='right';}if(i>=rows.length)return;const r=rows[i],n=r[1].length;SET[r[2]]=(SET[r[2]]+(k==='left'?-1:1)+n)%n;saveSettings();applyVolume();if(r[2]==='layout')layout();sfx('cur');optH.update(i,html(i));}});}
  finally{tp.remove();}}
let optH=null;

/* ================= 상점 ================= */
function shopStock(){const s=['ball','potion','antidote','burnheal','parheal','awake'];if(G.badges[0])s.splice(1,0,'great'),s.splice(3,0,'super'),s.push('fullheal');if(G.badges[1])s.push('revive');return s;}
async function shop(){const o={name:'점원'};let first=1;
  while(true){const c=await ask(first?'어서 오세요! 무엇을 도와드릴까요?':'그 밖에 필요하신 건 없으세요?',['사러 왔어요','팔러 왔어요','괜찮아요'],o);
    first=0;if(c===0)await shopBuy();else if(c===1)await shopSell();else break;}
  await say('감사합니다! 또 오세요!',o);}
function shopTop(id,mode){const it=ITEMS[id];return`<div class="abs" style="inset:0;background:linear-gradient(#cfe0ff,#f2f6ff)"></div><div class="title-bar">몬스터 상점 · ${mode}<span class="r">${money(G.money)}</span></div>
  ${it?`<img class="abs big" src="${itemIcon(id)}" style="left:${U(20)};top:${U(36)};width:${U(48)};height:${U(48)}"><div class="sheet" style="left:${U(84)};top:${U(30)};width:${U(164)};height:${U(60)}"><div style="font-size:${U(11)}">${it.n}</div><div style="font-size:${U(9)};color:#6a7190">가방에 ${G.bag[id]||0}개</div></div>
  <div class="sheet desc" style="left:${U(8)};top:${U(98)};width:${U(240)};height:${U(50)}">${it.d}</div>`:''}`;}
async function shopBuy(){const tp=page(TOP,'');let at=0;
  try{while(true){const st=shopStock();
    const r=await list(st.map(k=>({html:`<img src="${itemIcon(k)}"><span>${ITEMS[k].n}</span><span class="r">${money(ITEMS[k].price)}</span>`})),
      {rect:[4,4,248,150],rowH:20,start:at,backdrop:true,bg:'linear-gradient(#5a8ad8,#3d5aa8)',buttons:[{html:'그만두기',x:170,y:160,w:82,h:28,cls:'dark',val:-1}],onMove:i=>tp.innerHTML=shopTop(st[i],'사기')});
    if(r<0)break;at=r;const id=st[r],it=ITEMS[id];const max=Math.min(99,Math.floor(G.money/it.price));
    if(max<1){await say('돈이 부족하신 것 같아요.',{name:'점원'});continue;}
    msg(`${J(it.n,'을')} 몇 개 사시겠어요?`,{name:'점원'});const n=await numberPick({max,price:it.price,title:it.n});hideMsg();if(!n)continue;
    const ok=await ask(`${it.n} ${n}개, 총 ${money(n*it.price)}입니다. 괜찮으시겠어요?`,['예','아니오'],{name:'점원'});if(ok!==0)continue;
    G.money-=n*it.price;G.bag[id]=(G.bag[id]||0)+n;sfx('save');tp.innerHTML=shopTop(id,'사기');await say('네, 여기 있습니다! 감사합니다!',{name:'점원'});
    if(id==='ball'&&n>=10){G.bag.great=(G.bag.great||0)+1;await say('캡슐을 많이 사 주셔서 슈퍼캡슐을 하나 덤으로 드릴게요!',{name:'점원'});}}}
  finally{tp.remove();}}
async function shopSell(){const tp=page(TOP,'');
  try{while(true){const ids=Object.keys(ITEMS).filter(k=>ITEMS[k].price&&G.bag[k]>0);
    if(!ids.length){await say('팔 수 있는 물건이 없는 것 같네요.',{name:'점원'});break;}
    const r=await list(ids.map(k=>({html:`<img src="${itemIcon(k)}"><span>${ITEMS[k].n}</span><span class="r">× ${G.bag[k]} · ${money(ITEMS[k].price/2)}</span>`})),
      {rect:[4,4,248,150],rowH:20,backdrop:true,bg:'linear-gradient(#5aa86a,#3a7a4a)',buttons:[{html:'그만두기',x:170,y:160,w:82,h:28,cls:'dark',val:-1}],onMove:i=>tp.innerHTML=shopTop(ids[i],'팔기')});
    if(r<0)break;const id=ids[r],it=ITEMS[id];const n=await numberPick({max:G.bag[id],price:it.price/2,title:it.n});if(!n)continue;
    const ok=await ask(`${it.n} ${n}개를 ${money(n*it.price/2)}에 사겠습니다. 괜찮으세요?`,['예','아니오'],{name:'점원'});if(ok!==0)continue;
    G.bag[id]-=n;G.money+=n*it.price/2;sfx('save');await say(`${money(n*it.price/2)}을 받았다!`);}}
  finally{tp.remove();}}

/* ================= 몬스터 센터 ================= */
async function nurse(out,ox,oy){const o={name:'간호사'},n=npcById('nurse_'+G.map);
  await say('어서 오세요! 몬스터 센터입니다.',o);
  const r=await ask('몬스터의 체력을 회복시켜 드릴까요?',['예','아니오'],o);
  if(r!==0){await say('또 들러 주세요!',o);return;}
  await say('그럼 몬스터를 잠시 맡아 두겠습니다.',o);n.dir='left';const m=curMap();m.healAnim={n:G.party.length,f0:frame,on:true};
  for(let i=0;i<G.party.length;i++){m.healAnim.n=i+1;sfx('click');await sleep(260);}
  m.healAnim.blink=true;await Music.jingle('heal');m.healAnim=null;healParty();n.dir='down';
  G.heal={map:out,x:ox,y:oy};
  await say('기다리셨습니다! 맡겨 주신 몬스터는 모두 건강해졌어요.',o);n.bow=1;await sleep(400);n.bow=0;await say('또 들러 주세요!',o);}

/* ================= PC 보관함 ================= */
async function pcMenu(){sfx('menu');await say(`${J(G.name,'은')} PC의 전원을 켰다!`);
  while(true){const c=await ask('무엇을 할까?',['몬스터 맡기기','몬스터 데려오기','그만두기']);
    if(c===0){if(G.party.length<=1){await say('마지막 한 마리는 맡길 수 없습니다!');continue;}
      const i=await partyScreen('deposit');if(i<0)continue;const m=G.party[i];
      const ok=await ask(`${J(N(m),'을')} 보관함에 맡기겠습니까?`);if(ok!==0)continue;
      G.party.splice(i,1);healMon(m);G.box.push(m);sfx('save');await say(`${J(N(m),'을')} 보관함에 맡겼다.`);}
    else if(c===1){if(!G.box.length){await say('보관함에 몬스터가 없습니다.');continue;}
      const tp=page(TOP,'');
      const r=await list(G.box.map(m=>({html:`<img src="${monIcon(m.sid,m.shiny)}"><span>${esc(N(m))}</span><span class="r">Lv${m.lv}</span>`})),
        {rect:[4,4,248,150],rowH:20,backdrop:true,bg:'linear-gradient(#6a7290,#3d4562)',buttons:[{html:'그만두기',x:170,y:160,w:82,h:28,cls:'dark',val:-1}],onMove:i=>tp.innerHTML=monTopPage(G.box[i],'보관함')});
      tp.remove();if(r<0)continue;if(G.party.length>=6){await say('파티가 가득 찼습니다! 먼저 몬스터를 맡겨 주세요.');continue;}
      const m=G.box.splice(r,1)[0];G.party.push(m);sfx('save');await say(`${J(N(m),'을')} 데려왔다!`);}
    else break;}
  sfx('back');await say('PC의 전원을 껐다.');}

/* ================= 몬스터 합성 =================
   같은 종류 두 마리 → 무작위 타입의 상위(진화형) 몬스터 1마리.
   레벨은 둘 중 높은 레벨 +2. 둘 중 하나라도 이로치면 결과도 이로치. */
const FUSE_POOL=()=>Object.keys(SP).map(Number).filter(s=>SP[s].st>=1&&SP[s].line>9&&s!==13);
function fusionResult(src){const pool=FUSE_POOL().filter(s=>s!==src),types=[...new Set(pool.flatMap(s=>SP[s].t))];
  const t=types[rnd(types.length)],cand=pool.filter(s=>SP[s].t.includes(t));
  const hi=cand.filter(s=>SP[s].st>=2),use=SP[src].st>=1&&hi.length?hi:cand;return use[rnd(use.length)];}
function allMons(){return[...G.party.map((m,i)=>({m,where:'party',i})),...G.box.map((m,i)=>({m,where:'box',i}))];}
async function fusionLab(){const o={name:'합성 연구원'};
  if(!G.flags.fuseIntro){G.flags.fuseIntro=1;
    await say('어서 오세요! 여기는 몬스터 합성 연구실이에요.',o);
    await say('같은 종류의 몬스터 두 마리를 맡겨 주시면, 하나로 합쳐서 더 강한 상위 몬스터로 만들어 드려요.',o);
    await say('어떤 타입이 나올지는 저도 몰라요! 레벨은 두 마리 중 높은 쪽보다 2 올라간답니다.',o);}
  const all=allMons(),cnt={};for(const x of all)cnt[x.m.sid]=(cnt[x.m.sid]||0)+1;
  const sids=Object.keys(cnt).map(Number).filter(s=>cnt[s]>=2).sort((a,b)=>a-b);
  if(!sids.length){await say('지금은 같은 종류의 몬스터가 두 마리 이상 없네요. 파티나 보관함에 두 마리를 모아서 다시 와 주세요!',o);return;}
  if(await ask('합성을 해 볼까요?',['합성한다','그만둔다'],o)!==0){await say('또 오세요!',o);return;}
  // 1) 종류 고르기
  const tp=page(TOP,'');const sp=sid=>`<div class="abs" style="inset:0;background:linear-gradient(#e8dcff,#f8f4ff)"></div><div class="title-bar">몬스터 합성<span class="r">같은 종류 2마리 → 상위 몬스터</span></div>
    <img class="abs big" src="${monIcon(sid)}" style="left:${U(80)};top:${U(30)};width:${U(96)};height:${U(96)}">
    <div class="sheet" style="left:${U(8)};top:${U(132)};width:${U(240)};text-align:center"><b>${SP[sid].n}</b> ${typesHtml(sid)}<div class="desc">보유 ${cnt[sid]}마리 · 결과 타입은 무작위</div></div>`;
  const si=await list(sids.map(s=>({html:`<img src="${monIcon(s)}"><span>${SP[s].n}</span><span class="r">× ${cnt[s]}</span>`})),
    {rect:[4,4,248,150],rowH:20,backdrop:true,bg:'linear-gradient(#7a6aa8,#4a3d72)',buttons:[{html:'그만두기',x:170,y:160,w:82,h:28,cls:'dark',val:-1}],onMove:i=>tp.innerHTML=sp(sids[i])});
  if(si<0){tp.remove();await say('또 오세요!',o);return;}
  const sid=sids[si],mine=all.filter(x=>x.m.sid===sid);
  // 2) 재료 두 마리 고르기
  const pick=async(excl,title)=>{const c=mine.filter(x=>x!==excl);if(c.length===1&&excl)return c[0];
    const r=await list(c.map(x=>({html:`<img src="${monIcon(x.m.sid,x.m.shiny)}"><span>${esc(N(x.m))}</span><span class="r">${x.where==='party'?'파티':'보관함'} · Lv${x.m.lv}</span>`})),
      {rect:[4,4,248,150],rowH:20,backdrop:true,bg:'linear-gradient(#7a6aa8,#4a3d72)',buttons:[{html:'그만두기',x:170,y:160,w:82,h:28,cls:'dark',val:-1}],onMove:i=>tp.innerHTML=monTopPage(c[i].m,title)});
    return r<0?null:c[r];};
  const a=await pick(null,'첫 번째 재료');if(!a){tp.remove();return;}
  const b=await pick(a,'두 번째 재료');tp.remove();if(!b)return;
  if(await ask(`${N(a.m)} Lv${a.m.lv} + ${N(b.m)} Lv${b.m.lv}\n합성하면 두 마리는 사라져요. 괜찮아요?`,['합성한다','그만둔다'],o)!==0){await say('또 오세요!',o);return;}
  // 3) 합성
  const to=fusionResult(sid),lv=Math.min(100,Math.max(a.m.lv,b.m.lv)+2);
  const m=makeMon(to,lv,{met:{map:'합성 연구실',lv},ot:G.name,shiny:a.m.shiny||b.m.shiny});
  const partyIdx=[a,b].filter(x=>x.where==='party').map(x=>G.party.indexOf(x.m));
  G.party=G.party.filter(x=>x!==a.m&&x!==b.m);G.box=G.box.filter(x=>x!==a.m&&x!==b.m);
  if(partyIdx.length)G.party.splice(Math.min(...partyIdx),0,m);else addMon(m);
  await say('그럼 시작할게요! 합성 장치, 가동!',o);
  const fx=page(TOP,`<div class="abs" style="inset:0;background:radial-gradient(circle at 50% 45%,#ffffff,#b8a8f0 60%,#4a3d72)"></div>
    <img class="abs big fa" src="${monIcon(sid,a.m.shiny)}" style="left:${U(30)};top:${U(50)};width:${U(64)};height:${U(64)};transition:all .9s ease-in">
    <img class="abs big fb" src="${monIcon(sid,b.m.shiny)}" style="left:${U(162)};top:${U(50)};width:${U(64)};height:${U(64)};transition:all .9s ease-in">
    <img class="abs big fr" src="${monIcon(to,m.shiny)}" style="left:${U(80)};top:${U(34)};width:${U(96)};height:${U(96)};opacity:0;transform:scale(.2);transition:all .6s cubic-bezier(.2,1.6,.4,1)">`);
  await sleep(300);sfx('absorb');for(const q of['.fa','.fb']){const e=fx.querySelector(q);e.style.left=U(96);e.style.opacity='.2';e.style.filter='brightness(4)';}
  await sleep(950);sfx('open');const r=fx.querySelector('.fr');r.style.opacity='1';r.style.transform='scale(1)';
  await sleep(500);cry(to);if(m.shiny)sfx('shiny');
  G.seen[to]=G.caught[to]=1;await Music.jingle('evolved');
  await say(`합성 성공! ${SP[to].t.map(x=>TYPES[x].n).join('·')} 타입 ${J(SP[to].n,'이')} 태어났다! (Lv${lv})`);
  await nicknamePrompt(m);fx.remove();
  if(!G.party.includes(m))await say(`파티가 가득 차서 ${J(N(m),'은')} 보관함으로 보내졌다.`);
  await say('소중히 키워 주세요!',o);}
