/* =========================================================
   ui.js — 대화창, 터치 버튼 패널, 스크롤 리스트, 예/아니오, 수량, 이름 입력
   ========================================================= */
const TOP=$('#topUI'),BOT=$('#botUI');
const U=n=>`calc(var(--u) * ${n})`;
function el(root,cls,html,rect,tag='div'){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(rect)place(e,rect);root.append(e);return e;}
function place(e,[x,y,w,h]){e.style.left=U(x);e.style.top=U(y);if(w!=null)e.style.width=U(w);if(h!=null)e.style.height=U(h);}

/* ---------- 대화창 (위 화면) ---------- */
const dlg=el(TOP,'hidden','<span class="tx"></span><i class="nx hidden"></i>');dlg.id='dlg';
const dtx=dlg.querySelector('.tx'),dnx=dlg.querySelector('.nx');let dtag=null,dlgTm=null;
function msg(text,o={}){clearTimeout(dlgTm);dlgShow();setTag(o.name);const pg=paginate(text);dtx.textContent=pg[pg.length-1];dnx.classList.add('hidden');setTag(o.name);}
function setTag(name){if(dtag){dtag.remove();dtag=null;}if(name){dtag=el(dlg,'tag',esc(name));}}
function dlgShow(){dlg.classList.remove('hidden');TOP.classList.add('talking');}
function hideMsg(){dlg.classList.add('hidden');TOP.classList.remove('talking');setTag(null);}
/* 대화창 2줄 단위로 나누기 (넘치면 A로 다음 페이지) */
function dlgLines(t){dtx.style.maxHeight='none';dtx.textContent=t||' ';const lh=parseFloat(getComputedStyle(dtx).lineHeight)||16;const n=Math.round(dtx.offsetHeight/lh);dtx.style.maxHeight='';return n;}
function fitCut(rest,max=2){if(dlgLines(rest)<=max)return rest.length;
  let lo=1,hi=rest.length;while(lo<hi){const m=(lo+hi+1)>>1;if(dlgLines(rest.slice(0,m))<=max)lo=m;else hi=m-1;}
  let cut=lo;const sp=Math.max(rest.lastIndexOf(' ',cut),rest.lastIndexOf('\n',cut));
  if(sp>cut*.4&&!/[\s]/.test(rest[cut]||''))cut=sp; // 단어 중간에서 자르지 않기
  return Math.max(1,cut);}
/* 지금 글꼴 기준으로 첫 페이지와 나머지 */
function splitPage(rest){rest=String(rest);if(!dlg.offsetWidth)return[rest,''];const c=fitCut(rest);const pg=rest.slice(0,c).replace(/\s+$/,''),r=rest.slice(c).replace(/^\s+/,'');dtx.textContent='';return[pg,r];}
function paginate(text){const pages=[];let rest=String(text);do{const[a,b]=splitPage(rest);pages.push(a);rest=b;}while(rest.length);return pages;}
const CPS=[45,22,6];
function say(text,o={}){return new Promise(res=>{clearTimeout(dlgTm);dlgShow();setTag(o.name);dnx.classList.add('hidden');
  let rest=String(text),cur='';dtx.textContent='';
  let i=0,done=false,closed=false,at=null,tm=null;const sp=CPS[SET.text]||22;
  const last=()=>!rest.length;
  // 페이지마다 그 순간의 글꼴·화면 크기로 다시 잰다 (웹폰트 늦게 로드, 화면 회전 대응)
  const start=()=>{[cur,rest]=splitPage(rest);i=0;done=false;dtx.textContent='';dnx.classList.add('hidden');tm=setInterval(()=>{i+=sp<10?3:1;dtx.textContent=cur.slice(0,i);if(i>=cur.length)fin();},sp);};
  const fin=()=>{clearInterval(tm);
    if(dlg.offsetWidth&&dlgLines(cur)>2){const c=fitCut(cur);rest=(cur.slice(c).replace(/^\s+/,'')+(rest?' '+rest:''));cur=cur.slice(0,c).replace(/\s+$/,'');}
    dtx.textContent=cur;done=true;
    if(o.auto)at=setTimeout(()=>last()?close():next(),o.auto*(SET.text===2?.6:SET.text===0?1.4:1));else dnx.classList.remove('hidden');};
  const next=()=>{clearTimeout(at);start();};
  const close=()=>{if(closed)return;closed=true;clearTimeout(at);popH(h);dnx.classList.add('hidden');if(!o.keep)dlgTm=setTimeout(()=>{if(!ui.some(x=>x.isSay))hideMsg();},30);res();};
  const h={isSay:1,tapA:1,key(k){if(k!=='a'&&k!=='b')return;if(!done){fin();return;}if(!o.auto)sfx('cur');if(last())close();else next();}};
  start();pushH(h);});}
/* 여러 줄 연속 */
async function talk(lines,o={}){for(const l of lines)await say(l,o);}

/* ---------- 버튼 패널 (방향키로 가까운 버튼 이동) ---------- */
function panel(btns,o={}){return new Promise(res=>{const root=o.root||BOT,wrap=el(root,'abs','',[0,0,256,192]);wrap.style.pointerEvents='none';
  if(o.backdrop){const bd=el(wrap,'backdrop '+(o.backdrop===true?'':o.backdrop));bd.style.pointerEvents='auto';if(o.bg)bd.style.background=o.bg;}
  if(o.html)el(wrap,'abs',o.html,[0,0,256,192]).style.pointerEvents='none';
  let idx=clamp(o.start||0,0,btns.length-1);while(btns[idx]&&btns[idx].skip)idx++;
  const els=btns.map((b,i)=>{const e=el(wrap,'btn '+(b.cls||'')+(b.disabled?' dis':''),b.html,[b.x,b.y,b.w,b.h]);e.style.pointerEvents='auto';
    e.addEventListener('pointerdown',ev=>{ev.stopPropagation();if(topH()!==h)return;if(b.disabled){sfx('bad');return;}e.classList.add('press');});
    e.addEventListener('pointerup',()=>e.classList.remove('press'));e.addEventListener('pointerleave',()=>e.classList.remove('press'));
    e.addEventListener('click',ev=>{ev.stopPropagation();if(topH()!==h)return;idx=i;draw();pick();});return e;});
  const draw=()=>{els.forEach((e,i)=>e.classList.toggle('sel',i===idx&&!o.noSel));if(o.onMove)o.onMove(idx,els[idx]);};
  const close=v=>{popH(h);if(!o.keep)wrap.remove();res(v);};
  const pick=()=>{const b=btns[idx];if(b.disabled){sfx('bad');return;}if(!o.silent)sfx(b.sfx||'sel');if(b.flash){els[idx].classList.add('press');setTimeout(()=>close(idx),90);}else close(idx);};
  const move=(dx,dy)=>{const a=btns[idx],ax=a.x+a.w/2,ay=a.y+a.h/2;let best=-1,bd=1e9;
    btns.forEach((b,i)=>{if(i===idx||b.skip)return;const bx=b.x+b.w/2,by=b.y+b.h/2,ddx=bx-ax,ddy=by-ay;
      const along=dx?ddx*dx:ddy*dy,across=dx?Math.abs(ddy):Math.abs(ddx);if(along<=2)return;const d=along+across*2.2;if(d<bd){bd=d;best=i;}});
    if(best>=0){idx=best;sfx('cur');draw();}};
  const h={wrap,els,key(k){if(k==='up')move(0,-1);else if(k==='down')move(0,1);else if(k==='left')move(-1,0);else if(k==='right')move(1,0);
    else if(k==='a')pick();else if(k==='b'||(k==='menu'&&o.menuClose)){if(o.cancel===false)return;sfx('back');close(o.cancel!=null?o.cancel:-1);}
    else if(o.onKey)o.onKey(k,idx,close);},set(i){idx=i;draw();}};
  h.refresh=(i,html)=>{els[i].innerHTML=html;};
  pushH(h);draw();if(o.onOpen)o.onOpen(h);});}

/* ---------- 스크롤 리스트 ---------- */
function list(items,o={}){return new Promise(res=>{const root=o.root||BOT,[x,y,w,hh]=o.rect||[4,4,248,160],rh=o.rowH||20,vis=Math.floor((hh-4)/rh);
  const wrap=el(root,'abs','',[0,0,256,192]);wrap.style.pointerEvents='none';
  if(o.backdrop){const bd=el(wrap,'backdrop');bd.style.pointerEvents='auto';if(o.bg)bd.style.background=o.bg;}
  if(o.html)el(wrap,'abs',o.html,[0,0,256,192]).style.pointerEvents='none';
  const box=el(wrap,'lst','',[x,y,w,hh]);box.style.pointerEvents='auto';const inner=el(box,'in');
  const au=el(box,'arrow up hidden'),ad=el(box,'arrow dn hidden');au.style.top=U(1);ad.style.bottom=U(1);
  let idx=clamp(o.start||0,0,Math.max(0,items.length-1)),off=clamp(idx-Math.floor(vis/2),0,Math.max(0,items.length-vis));
  const rows=items.map((it,i)=>{const r=el(inner,'row'+(it.disabled?' dis':''),it.html);r.style.height=U(rh);
    r.addEventListener('click',ev=>{ev.stopPropagation();if(topH()!==h)return;if(idx===i||o.tapPick!==false){idx=i;draw();pick();}else{idx=i;draw();}});return r;});
  const extra=(o.buttons||[]).map((b,j)=>{const e=el(wrap,'btn '+(b.cls||''),b.html,[b.x,b.y,b.w,b.h]);e.style.pointerEvents='auto';
    e.addEventListener('click',ev=>{ev.stopPropagation();if(topH()!==h)return;sfx('back');close(b.val!=null?b.val:-1);});return e;});
  const draw=()=>{if(idx<off)off=idx;if(idx>=off+vis)off=idx-vis+1;inner.style.transform=`translateY(${U(-off*rh)})`;
    rows.forEach((r,i)=>r.classList.toggle('sel',i===idx));au.classList.toggle('hidden',off<=0);ad.classList.toggle('hidden',off+vis>=items.length);if(o.onMove&&items.length)o.onMove(idx);};
  const close=v=>{popH(h);if(!o.keep)wrap.remove();res(v);};
  const pick=()=>{if(!items.length)return;if(items[idx].disabled&&!o.allowDisabled){sfx('bad');return;}sfx('sel');close(idx);};
  const h={wrap,key(k){const n=items.length;if(o.onKey&&o.keys&&o.keys.includes(k)){o.onKey(k,idx,close);return;}if(!n&&k!=='b')return;
    if(k==='up'){idx=(idx-1+n)%n;sfx('cur');draw();}else if(k==='down'){idx=(idx+1)%n;sfx('cur');draw();}
    else if(k==='left'){idx=Math.max(0,idx-vis);sfx('cur');draw();}else if(k==='right'){idx=Math.min(n-1,idx+vis);sfx('cur');draw();}
    else if(k==='a')pick();else if(k==='b'){if(o.cancel===false)return;sfx('back');close(-1);}
    else if(o.onKey)o.onKey(k,idx,close);},
    update(i,html){rows[i].innerHTML=html;}};
  box.addEventListener('wheel',e=>{e.preventDefault();h.key(e.deltaY>0?'down':'up');},{passive:false});
  pushH(h);draw();if(o.onOpen)o.onOpen(h);});}

/* ---------- 예 / 아니오 ---------- */
async function ask(text,opts=['예','아니오'],o={}){dlgShow();setTag(o.name);const pg=paginate(text);for(let i=0;i<pg.length-1;i++)await say(pg[i],{...o,keep:1});msg(pg[pg.length-1],o);
  const n=opts.length,bw=n>2?200:176,bh=n>2?38:52,gap=8,y0=(192-(bh+gap)*n+gap)/2;
  const i=await panel(opts.map((t,j)=>({html:`<span class="bigbtn">${esc(t)}</span>`,x:(256-bw)/2,y:y0+j*(bh+gap),w:bw,h:bh,cls:j===0?'blue':''})),
    {backdrop:true,bg:'rgba(20,24,40,.55)',cancel:o.cancel!=null?o.cancel:n-1,start:o.start||0});
  if(!o.keep)hideMsg();return i;}

/* ---------- 수량 선택 ---------- */
function numberPick(o){return new Promise(res=>{let n=1;const max=Math.max(1,o.max);
  const wrap=el(BOT,'abs','',[0,0,256,192]);el(wrap,'backdrop').style.background='rgba(20,24,40,.6)';
  const box=el(wrap,'sheet','',[38,30,180,96]);
  const draw=()=>{box.innerHTML=`<div style="text-align:center;font-size:${U(9)};color:#6a7190">${esc(o.title||'몇 개?')}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:${U(10)};font-size:${U(22)};margin:${U(4)} 0">
    <span style="color:#e2566f">◀</span><b>× ${String(n).padStart(2,'0')}</b><span style="color:#e2566f">▶</span></div>
    ${o.price?`<div style="text-align:center;font-size:${U(11)}">${(n*o.price).toLocaleString()}원</div>`:''}`;};
  const mk=(html,r,cls,f)=>{const e=el(wrap,'btn '+cls,html,r);e.addEventListener('click',ev=>{ev.stopPropagation();if(topH()!==h)return;f();});return e;};
  mk('−1',[12,134,52,26],'',()=>h.key('left'));mk('+1',[70,134,52,26],'',()=>h.key('right'));mk('−10',[12,164,52,24],'',()=>h.key('down'));mk('+10',[70,164,52,24],'',()=>h.key('up'));
  mk('결정',[132,134,58,54],'blue',()=>h.key('a'));mk('취소',[196,134,52,54],'',()=>h.key('b'));
  const close=v=>{popH(h);wrap.remove();res(v);};
  const h={key(k){if(k==='left')n=n<=1?max:n-1;else if(k==='right')n=n>=max?1:n+1;else if(k==='up')n=Math.min(max,n+10);else if(k==='down')n=Math.max(1,n-10);
    else if(k==='a'){sfx('sel');close(n);return;}else if(k==='b'){sfx('back');close(0);return;}else return;sfx('cur');draw();}};
  pushH(h);draw();});}

/* ---------- 이름 입력 ---------- */
function nameInput(o){return new Promise(res=>{const wrap=el(BOT,'abs','',[0,0,256,192]);el(wrap,'backdrop').style.background='linear-gradient(#e8eefc,#c8d4f0)';
  el(wrap,'abs',`<div style="text-align:center;font-size:${U(10)};color:#3d4562">${esc(o.title)}</div>`,[0,8,256,16]);
  const inp=el(wrap,'namein','',[48,28,160,32],'input');inp.maxLength=o.max||6;inp.value=o.def||'';inp.placeholder=`최대 ${o.max||6}글자`;inp.autocomplete='off';
  const sug=o.sug||[];sug.forEach((s,i)=>{const e=el(wrap,'btn','<span>'+esc(s)+'</span>',[8+i%4*61,70+Math.floor(i/4)*30,56,24]);
    e.addEventListener('click',ev=>{ev.stopPropagation();inp.value=s;sfx('cur');});});
  const ok=el(wrap,'btn blue','<span class="bigbtn">결정</span>',[132,148,116,36]),cl=o.allowEmpty?el(wrap,'btn','<span>그만두기</span>',[8,148,116,36]):null;
  const close=v=>{popH(h);inp.blur();wrap.remove();res(v);};
  const done=()=>{const v=inp.value.trim().slice(0,o.max||6);if(!v&&!o.allowEmpty){sfx('bad');inp.focus();return;}sfx('sel');close(v);};
  ok.addEventListener('click',ev=>{ev.stopPropagation();done();});if(cl)cl.addEventListener('click',ev=>{ev.stopPropagation();sfx('back');close('');});
  inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&!e.isComposing){e.preventDefault();done();}});
  const h={key(k){if(k==='a'||k==='menu')done();else if(k==='b'&&o.allowEmpty){sfx('back');close('');}}};
  pushH(h);setTimeout(()=>{if(!matchMedia('(pointer:coarse)').matches)inp.focus();},60);});}

/* ---------- 지도 표지판 / 토스트 / 페이드 ---------- */
const signEl=el(TOP,'','');signEl.id='sign';let signTm=null;
function showSign(t){signEl.textContent=t;signEl.classList.add('on');clearTimeout(signTm);signTm=setTimeout(()=>signEl.classList.remove('on'),2200);}
function toast(t){showSign(t);}
function fadeTo(v,which='both',white=false){for(const id of(which==='both'?['fadeTop','fadeBot']:[which==='top'?'fadeTop':'fadeBot'])){const f=$('#'+id);f.classList.toggle('white',white);f.style.opacity=v;}return sleep(290);}
/* 위/아래 화면 페이지(전체를 덮는 HTML) */
function page(root,html,cls=''){return el(root,'page '+cls,html);}
function clearPages(root){root.querySelectorAll(':scope>.page').forEach(e=>e.remove());}
