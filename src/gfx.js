/* =========================================================
   gfx.js — 도트 그래픽: 몬스터, 인물, 타일, 전투 배경, 파티클, 아이콘
   ========================================================= */
const topC=$('#top'),ctx=topC.getContext('2d'),botC=$('#bot'),bctx=botC.getContext('2d');
function R(c,x,y,w,h,g=ctx){g.fillStyle=c;g.fillRect(x,y,w,h);}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return[c,g];}
const hash=(x,y)=>(((x*73856093)^(y*19349663))>>>0)%65521;

/* ================= 몬스터 도트 생성 ================= */
const MONC={};
function monCanvas(sid,back=false,shiny=false){const key=sid+(back?'b':'f')+(shiny?'s':'');if(MONC[key])return MONC[key];
  const s=SP[sid],st=s.st,line=s.line,Rp=rng(line*7919+11),Rs=rng(sid*131+7),NN=24,CX=12;
  const g=[...Array(NN)].map(()=>Array(12).fill(0));
  const set=(x,y,v)=>{x=Math.floor(x);y=Math.floor(y);if(x>=0&&x<12&&y>=0&&y<NN)g[y][x]=v;};
  const get=(x,y)=>(x>=0&&x<12&&y>=0&&y<NN)?g[y][x]:0;
  const ell=(cx,cy,rx,ry,v,cond)=>{for(let y=0;y<NN;y++)for(let x=0;x<12;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<1&&(!cond||cond(x,y,g[y][x])))g[y][x]=v;};
  const S=[.6,.8,1][st],t0=s.t[0],t1=s.t[1]||null,has=t=>t0===t||t1===t;
  /* 계열 공통 성격 */
  const P={aspect:.8+Rp()*.5,head:Rp()<.62,eye:Math.floor(Rp()*3),ear:Math.floor(Rp()*3),hue:(Rp()-.5)*36,lum:(Rp()-.5)*.2,spot:Rp()<.4};
  const jelly=line===29,shroom=line===25,rocky=line===23,caterp=line===12&&st<2;
  let bodyRy=(3.4+Rp()*1.2)*(.55+.45*S)*1.35,bodyRx=bodyRy*P.aspect;
  const headR=(2.5+Rp()*1)*(.6+.4*S)*1.4,hasHead=P.head&&!jelly&&!shroom&&!rocky;
  if(caterp){bodyRx=bodyRy*.75;}
  const feetY=jelly?18:22,cy=feetY-bodyRy-.3,headY=cy-bodyRy*.72-headR*.5;
  ell(CX,cy,bodyRx,bodyRy,1);
  if(hasHead)ell(CX,headY,headR*1.12,headR,1);
  if(rocky)for(let y=0;y<NN;y++)for(let x=0;x<12;x++)if(g[y][x]&&Math.abs(x+.5-CX)/bodyRx+Math.abs(y+.5-cy)/bodyRy>1.22)g[y][x]=0;
  if(caterp){ell(CX,cy-bodyRy*.9,bodyRx*.85,bodyRy*.55,1);}
  const scanTop=()=>{for(let y=0;y<NN;y++)if(g[y][11])return y;return 8;};
  let top=scanTop();
  const headRx=hasHead?headR*1.12:bodyRx,faceY=hasHead?headY:cy-bodyRy*.35;
  /* 배 */
  if(!back&&!jelly)ell(CX,cy+bodyRy*.28,bodyRx*.58,bodyRy*.55,2,(x,y,v)=>v===1);
  /* 발·팔 */
  if(!jelly){const fx=CX-bodyRx*.55;for(const[dx,dy]of[[0,0],[-1,0],[0,-1],[-1,-1]])set(fx+dx,feetY+dy,1);
    if(has('ground')||line===27)set(fx-1,feetY,6),set(fx,feetY,6);
    if(!caterp){set(CX-bodyRx-.2,cy,1);set(CX-bodyRx-.8,cy+1,1);}}
  else{const by=Math.floor(cy+bodyRy*.6);for(let x=Math.floor(CX-bodyRx*.85);x<12;x+=2)for(let i=0;i<3+st;i++)set(x+(i%2?0:0),by+i,i===2+st?3:1);}
  /* 타입별 장식 */
  const feat=(t,primary)=>{top=scanTop();
    if(t==='fire'){const fh=2+st*2;for(let i=0;i<=fh;i++){const w=Math.max(1,Math.ceil((fh-i)/2));for(let j=0;j<w;j++)set(11-j,top-1-i,j<w-1||i<fh-1?4:12);}
      if(st>=1){for(let i=0;i<3+st;i++)set(CX-bodyRx-1-(i>1?1:0),cy+1-i,i<2?12:4);}}
    else if(t==='water'){for(let i=0;i<1+st;i++)for(let j=0;j<=1+st-i;j++)set(11-j,top-1-i,3);
      set(CX-headRx-.8,faceY,3);set(CX-headRx-1.6,faceY-1,3);}
    else if(t==='grass'){if(st<2){set(11,top-1,13);set(11,top-2,13);set(10,top-2,14);set(9,top-3,14);set(10,top-3,14);if(st)set(8,top-4,14),set(9,top-4,14);}
      else{ell(CX,top-1.5,7,3.8,14,(x,y,v)=>v===0);ell(CX,top-1.5,4,2.2,13,(x,y,v)=>v===14);}}
    else if(t==='elec'){const x0=CX-headRx*.65;[[0,-1],[-1,-2],[0,-3],[-1,-4],[-1,-5]].slice(0,3+st).forEach(([dx,dy],i,a)=>set(x0+dx,top+dy,i===a.length-1?6:1));
      if(!back){set(CX-headRx*.78,faceY+headR*.35,8);set(CX-headRx*.78+1,faceY+headR*.35,8);}}
    else if(t==='rock'){for(let k=0;k<5+st*3;k++){const x=Math.floor(CX-bodyRx*Rs()),y=Math.floor(cy-bodyRy*.6+Rs()*bodyRy*1.4);if(get(x,y)===1)set(x,y,7);}
      if(st>=1){set(CX-bodyRx*.75,cy-bodyRy*.85,7);set(CX-bodyRx*.75,cy-bodyRy*.85-1,7);set(CX-bodyRx*.95,cy-bodyRy*.6,7);}}
    else if(t==='ground'){set(CX-headRx*.7,top,1);set(CX-headRx*.8,top-1,3);}
    else if(t==='fly'){const y0=Math.floor(cy-bodyRy*.7),y1=Math.floor(cy+bodyRy*.2),L=2+st*2;
      for(let y=y0;y<=y1;y++){const k=(y-y0)/Math.max(1,y1-y0),len=Math.round(L*(1-k*.8));let x=11;while(x>=0&&g[y][x])x--;for(let i=0;i<len;i++)set(x-i,y-(i>>1),15);}
      if(!back&&!has('bug'))set(11,Math.floor(faceY)+2,4);}
    else if(t==='bug'){const x0=CX-headRx*.45;for(let i=1;i<=3+st;i++)set(x0-i*.6,top-i,i===3+st?8:6);
      for(let y=Math.floor(cy-bodyRy*.2);y<cy+bodyRy;y+=2)for(let x=0;x<12;x++)if(g[y][x]===2||g[y][x]===1&&back)g[y][x]=3;}
    else if(t==='poison'){if(shroom){ell(CX,top+1.2,6.5+st*1.6,3.4+st*.9,17);for(let k=0;k<3+st*2;k++){const x=Math.floor(CX-(2+Rs()*5)),y=Math.floor(top-1+Rs()*3);if(get(x,y)===17)set(x,y,5);}}
      else for(let k=0;k<3+st*2;k++){const x=Math.floor(CX-bodyRx*Rs()*.9),y=Math.floor(cy-bodyRy*.5+Rs()*bodyRy);if(get(x,y)===1)set(x,y,16);}}
    else if(t==='normal'){if(P.ear===0){ell(CX-headRx*.7,top+.6,1.7,1.7,1);ell(CX-headRx*.7,top+.6,.9,.9,8,(x,y,v)=>v===1);}
      else if(P.ear===1){for(let i=0;i<3+st;i++)set(CX-headRx*.6-(i>>1),top-i,1);}
      else{set(CX-headRx*.9,top+1,1);set(CX-headRx*1.1,top,1);}}};
  feat(t0,true);if(t1)feat(t1,false);
  if(P.spot&&!back)for(let k=0;k<3;k++){const x=Math.floor(CX-bodyRx*(.3+Rs()*.6)),y=Math.floor(cy-bodyRy*.6+Rs()*bodyRy*.5);if(get(x,y)===1)set(x,y,3);}
  /* 얼굴 */
  if(!back){const ey=Math.floor(faceY+(shroom?1:0)),ex=Math.floor(CX-headRx*.46);
    const es=st===2?2:P.eye;
    if(es===0){set(ex-1,ey-1,5);set(ex,ey-1,5);set(ex-1,ey,5);set(ex,ey,20);}
    else if(es===1){set(ex,ey,20);set(ex,ey-1,20);}
    else{set(ex-1,ey,5);set(ex,ey,20);set(ex-1,ey-1,20);set(ex,ey-1,5);set(ex-2,ey-2,6);}
    if(!jelly&&!(has('fly')&&!has('bug')))set(11,ey+2,6);}
  /* 대칭 복사 */
  const full=[...Array(NN)].map((_,y)=>{const r=g[y].slice();for(let x=11;x>=0;x--)r.push(g[y][x]);return r;});
  const out=full.map(r=>r.slice());
  for(let y=0;y<NN;y++)for(let x=0;x<NN;x++){if(full[y][x])continue;
    if((full[y-1]&&full[y-1][x])||(full[y+1]&&full[y+1][x])||full[y][x-1]||full[y][x+1])out[y][x]=9;}
  for(let y=0;y<NN;y++)for(let x=0;x<NN;x++){const v=out[y][x];if(v!==1&&v!==17)continue;
    const below=out[y+1]?out[y+1][x]:9,above=out[y-1]?out[y-1][x]:9;
    if(below===9||below===0||(back&&y>cy+1&&Rs()<.3))out[y][x]=v===17?18:10;else if(above===9)out[y][x]=v===17?19:11;}
  let base=shade(hueShift(TYPES[t0].c,P.hue),P.lum);if(shroom)base='#e8d9b5';if(jelly)base=shade(TYPES.water.c,.25);
  let cap=TYPES.poison.c;
  if(shiny){base=hueShift(base,150,1.1);cap=hueShift(cap,120);}
  const wing=has('bug')?'#f2f6ff':shade(base,.5);
  const COL={1:base,2:shade(base,.6),3:shade(base,-.35),4:'#ffd84a',5:'#ffffff',6:'#1d1d2b',7:'#9a8a6a',8:'#ff7a8a',9:shade(base,-.75),10:shade(base,-.22),11:shade(base,.25),
    12:'#ff6a2a',13:'#2f7d34',14:'#7bd35a',15:wing,16:'#9b4bc0',17:cap,18:shade(cap,-.25),19:shade(cap,.25)};
  COL[20]='#1d1d2b';
  /* ---- 2배 정밀 도트로 다듬기 (48x48) ---- */
  const A=out.map(r=>r.map(v=>v===9?0:v)),M=NN*2;
  // ① Scale2x(EPX): 계단을 매끄럽게 하면서 도트 느낌 유지
  const B=[...Array(M)].map(()=>Array(M).fill(0)),ga=(x,y)=>(x>=0&&y>=0&&x<NN&&y<NN)?A[y][x]:0;
  for(let y=0;y<NN;y++)for(let x=0;x<NN;x++){const P=A[y][x],a=ga(x,y-1),b=ga(x+1,y),c2=ga(x-1,y),d=ga(x,y+1);
    let e0=P,e1=P,e2=P,e3=P;if(c2===a&&c2!==d&&a!==b)e0=a;if(a===b&&a!==c2&&b!==d)e1=b;if(d===c2&&d!==b&&c2!==a)e2=c2;if(b===d&&b!==a&&d!==c2)e3=d;
    // 눈·입 같은 작은 디테일은 뭉개지지 않게 원래 값 유지
    if(P===20||P===5||P===6){e0=e1=e2=e3=P;}
    B[y*2][x*2]=e0;B[y*2][x*2+1]=e1;B[y*2+1][x*2]=e2;B[y*2+1][x*2+1]=e3;}
  const gb=(x,y)=>(x>=0&&y>=0&&x<M&&y<M)?B[y][x]:0;
  // ② 명암 경계에 체크무늬 디더링, 빛 받는 쪽(왼쪽 위) 가장자리에 하이라이트
  const C=B.map(r=>r.slice()),near=(x,y,v)=>gb(x-1,y)===v||gb(x+1,y)===v||gb(x,y-1)===v||gb(x,y+1)===v;
  for(let y=0;y<M;y++)for(let x=0;x<M;x++){const v=B[y][x];
    if(v===1||v===17){const sh=v===1?10:18,li=v===1?11:19;
      if(((x+y)&1)===0&&near(x,y,sh))C[y][x]=sh;else if(((x+y)&1)===1&&near(x,y,li))C[y][x]=li;
      else if(gb(x-1,y-1)===0&&gb(x,y-1)===0&&gb(x-1,y)!==0&&!back)C[y][x]=li;}
    else if(v===2&&gb(x,y+1)!==2&&gb(x,y+1)!==0&&((x+y)&1))C[y][x]=1;}
  // ③ 눈에 반짝이는 하이라이트 한 점
  for(let y=0;y<M;y++)for(let x=0;x<M;x++)if(B[y][x]===20&&gb(x-1,y)!==20&&gb(x,y-1)!==20&&gb(x+1,y)===20&&gb(x,y+1)===20)C[y][x]=5;
  // ④ 색이 있는 얇은 외곽선(셀아웃): 이웃한 색을 어둡게, 아래쪽은 더 진하게
  const[c,x2]=mkCanvas(M,M);
  for(let y=0;y<M;y++)for(let x=0;x<M;x++){const v=C[y][x];
    if(v){x2.fillStyle=COL[v];x2.fillRect(x,y,1,1);continue;}
    const nb=gb(x,y+1)||gb(x,y-1)||gb(x-1,y)||gb(x+1,y);if(!nb)continue;
    const dark=gb(x,y-1)?-.78:gb(x,y+1)?-.55:-.66;
    x2.fillStyle=nb===6||nb===20?'#14141e':shade(COL[nb],dark);x2.fillRect(x,y,1,1);}
  return MONC[key]=c;}
/* 실루엣/하양 버전 */
const TINTC={};
function tinted(c,col){if(!c.__id)c.__id=Math.random().toString(36).slice(2);const k=c.__id+col;if(TINTC[k])return TINTC[k];
  const[t,g]=mkCanvas(c.width,c.height);g.drawImage(c,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);return TINTC[k]=t;}
/* 몬스터 그리기 (발 중앙 x, 발 y 기준) */
function drawMon(g,sid,fx,fy,scale,o={}){if(!sid)return;const c=monCanvas(sid,o.back,o.shiny),w=24*scale*(o.sx||1),h=24*scale*(o.sy||1);
  g.save();if(o.alpha!=null)g.globalAlpha=clamp(o.alpha,0,1);if(o.clipY!=null){g.beginPath();g.rect(0,0,W,o.clipY);g.clip();}
  const x=Math.round(fx-w/2),y=Math.round(fy-h);
  g.drawImage(o.dark?tinted(c,'#14141e'):c,x,y,w,h);
  if(o.white>0){g.globalAlpha=(o.alpha!=null?o.alpha:1)*clamp(o.white,0,1);g.drawImage(tinted(c,o.whiteCol||'#ffffff'),x,y,w,h);}
  g.restore();}
const ICON={};
function monIcon(sid,shiny){const k=sid+(shiny?'s':'');if(!ICON[k])ICON[k]=monCanvas(sid,false,shiny).toDataURL();return ICON[k];}

/* ================= 인물 (16x20) ================= */
const LOOK={
 player:{hair:'#3b2416',skin:'#f6d2ac',shirt:'#e8473b',shirt2:'#ffffff',pants:'#2c3e66',hat:'#ffffff',hat2:'#e8473b',bag:'#f2c230'},
 rival:{hair:'#d98b2b',skin:'#f6d2ac',shirt:'#2e7dd7',shirt2:'#1d4f9a',pants:'#3b3b4b',scarf:'#3cc06a'},
 mom:{hair:'#6b3a1f',skin:'#f6d2ac',shirt:'#f29bb7',pants:'#7a4a6a',long:1},
 prof:{hair:'#d8d8d8',skin:'#f0c8a0',shirt:'#f4f4f4',pants:'#6b5a4a',coat:'#ffffff'},
 aide:{hair:'#2b2b3b',skin:'#f6d2ac',shirt:'#f4f4f4',pants:'#4a4a5a',coat:'#ffffff'},
 kid:{hair:'#2b1a10',skin:'#f6d2ac',shirt:'#3cb371',pants:'#34495e',hat:'#e2b33c'},
 girl:{hair:'#8a3b1f',skin:'#f6d2ac',shirt:'#e86fa8',pants:'#5a3d7a',long:1},
 lady:{hair:'#3a2a6a',skin:'#f6d2ac',shirt:'#8a6fd8',pants:'#3a2a6a',long:1},
 old:{hair:'#ececec',skin:'#e8c0a0',shirt:'#7a6a4f',pants:'#4a4a4a'},
 granny:{hair:'#dadada',skin:'#e8c0a0',shirt:'#9a5a7a',pants:'#5a3a4a',long:1},
 camper:{hair:'#3a2a1a',skin:'#e8b88a',shirt:'#5d8a3a',pants:'#6b5034',hat:'#6b8e23'},
 bug:{hair:'#1a1a1a',skin:'#f6d2ac',shirt:'#f2d03b',pants:'#3a5a8a',hat:'#f2d03b'},
 man:{hair:'#20140c',skin:'#f0c8a0',shirt:'#4a6fa5',pants:'#2d2d3d'},
 hiker:{hair:'#3a2414',skin:'#d9a070',shirt:'#b8552c',pants:'#5a4a2a',hat:'#7a5a2a',beard:1},
 swim:{hair:'#1a2a4a',skin:'#f0c8a0',shirt:'#3fb0e8',pants:'#3fb0e8'},
 fisher:{hair:'#2a2a2a',skin:'#d9a070',shirt:'#c8b060',pants:'#3a4a5a',hat:'#4a6a3a'},
 nurse:{hair:'#f08fb0',skin:'#f6d2ac',shirt:'#ffffff',pants:'#f08fb0',long:1,cap:1},
 clerk:{hair:'#3a2a1a',skin:'#f6d2ac',shirt:'#3d7ad6',pants:'#2c3e66',apron:1},
 guide:{hair:'#2a1a0a',skin:'#e0b080',shirt:'#e8e8e8',pants:'#3a3a4a',beard:1},
 leaderRock:{hair:'#5a4a3a',skin:'#d9a070',shirt:'#8a7a5a',pants:'#3b3b4b',hat:'#6e5a3c',beard:1},
 leaderWater:{hair:'#2a6ad8',skin:'#f6d2ac',shirt:'#1fb6c8',pants:'#ffffff',long:1},
 sister:{hair:'#d98b2b',skin:'#f6d2ac',shirt:'#f2c230',pants:'#a85a2a',long:1}};
/* 인물: 2배 해상도로 한 번 그려서 외곽선·명암을 다듬고 캐시 */
const PERC={};let perId=0;
function person(g,sx,sy,dir,fr,L){if(!L.__id)L.__id=++perId;const k=L.__id+dir+fr;
  g.fillStyle='rgba(0,0,0,.22)';g.fillRect(sx+3,sy+18,10,2);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(sx+2.5,sy+18.5,11,1);
  let c=PERC[k];if(!c){const[cv,cg]=mkCanvas(36,44);cg.setTransform(2,0,0,2,2,2);personRaw(cg,0,0,dir,fr,L);refineSprite(cv,cg);c=PERC[k]=cv;}
  g.drawImage(c,sx-1,sy-1,18,22);}
/* 스프라이트 다듬기: 얇은 색 외곽선, 위쪽 가장자리 빛, 오른쪽·아래 가장자리 그림자 */
function refineSprite(cv,cg){const w=cv.width,h=cv.height,id=cg.getImageData(0,0,w,h),d=id.data,src=new Uint8ClampedArray(d);
  const A=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:src[(y*w+x)*4+3],I=(x,y)=>(y*w+x)*4;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=I(x,y);
    if(src[i+3]<128){const nb=[[0,1],[0,-1],[-1,0],[1,0]].find(([dx,dy])=>A(x+dx,y+dy)>=128);if(!nb)continue;
      const j=I(x+nb[0],y+nb[1]),f=nb[1]===-1?.28:.4;d[i]=src[j]*f;d[i+1]=src[j+1]*f;d[i+2]=src[j+2]*f+8;d[i+3]=255;continue;}
    const dark=src[i]+src[i+1]+src[i+2]<120;if(dark)continue;
    if(A(x,y-1)<128){for(let c=0;c<3;c++)d[i+c]=Math.min(255,src[i+c]*1.12+18);}
    else if(A(x+1,y)<128||A(x,y+1)<128){for(let c=0;c<3;c++)d[i+c]=src[i+c]*.8;}}
  cg.putImageData(id,0,0);}
function personRaw(g,sx,sy,dir,fr,L){const r=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(sx+x,sy+y,w,h);};
  const skin=L.skin,hair=L.hair,sh=L.shirt,pt=L.pants,dk=shade(sh,-.3),out='#1d1d2b';
  const lA=fr===1?1:0,lB=fr===2?1:0,side=dir==='left'||dir==='right';
  /* 다리 */
  if(side){const f=dir==='left'?-1:1;r(pt,5,14,6,2);r(pt,5+(fr===1?f:0),16,2,2-0);r(pt,9-(fr===2?f:0),16,2,2);r(out,5+(fr===1?f:0),18,2,1);r(out,9-(fr===2?f:0),18,2,1);}
  else{r(pt,4,14,8,2);r(pt,5,16-lA,2,2);r(pt,9,16-lB,2,2);r(out,5,18-lA,2,1);r(out,9,18-lB,2,1);}
  /* 몸 */
  if(L.coat){r(L.coat,3,9,10,7);r(shade(L.coat,-.15),3,15,10,1);r(L.shirt==='#f4f4f4'?'#6a8ad8':sh,6,9,4,4);}
  else{r(sh,4,9,8,6);r(dk,4,14,8,1);if(L.shirt2)r(L.shirt2,4,9,8,1);if(L.apron)r('#ffffff',5,10,6,5);}
  if(!L.coat){r(shade(sh,.18),4,9.5,8,.5);r(dk,7.75,10,.5,4);}else{r(shade(L.coat,-.12),7.75,10,.5,5);r('#c8ccd8',7.5,11,.5,.5);r('#c8ccd8',7.5,13,.5,.5);}
  r(shade(pt,.2),5,14,2,.5);r(shade(pt,-.25),side?8:7.75,14.5,side?.5:.5,1.5);
  if(L.scarf)r(L.scarf,4,8,8,2);
  /* 팔 */
  if(side){const f=dir==='left'?1:0,sw=fr?1:0;r(sh,f?8:6,10+sw,2,3);r(skin,f?8:6,13+sw,2,1);}
  else{const a=fr===1?1:0,b=fr===2?1:0;r(L.coat||sh,2,10-a+b,2,3);r(L.coat||sh,12,10+a-b,2,3);r(skin,2,13-a+b,2,1);r(skin,12,13+a-b,2,1);}
  if(L.bag&&dir!=='up'){r(L.bag,side?(dir==='left'?9:3):2,11,side?4:1,3);}
  if(L.bag&&dir==='up')r(L.bag,4,9,8,5);
  /* 머리 */
  r(out,3,1,10,1);r(out,2,2,1,6);r(out,13,2,1,6);r(out,3,8,10,1);
  r(skin,3,2,10,6);
  if(dir==='down'){r(hair,3,1,10,3);r(hair,3,4,1,3);r(hair,12,4,1,3);if(L.long){r(hair,2,4,2,6);r(hair,12,4,2,6);}
    r(out,5,5,1,2);r(out,10,5,1,2);r('#ffffff',5,5,.5,.5);r('#ffffff',10,5,.5,.5);r('#e89a9a',4,6.5,1,.5);r('#e89a9a',11,6.5,1,.5);
    r(shade(skin,-.12),7.5,6.5,1,.5);r(shade(hair,.22),4,1.5,3,.5);r(shade(hair,.22),9,1.5,2,.5);r(shade(hair,-.2),3,3.5,10,.5);
    if(L.beard)r(hair,5,7,6,2);}
  else if(dir==='up'){r(hair,3,1,10,7);if(L.long)r(hair,3,8,10,3);r(shade(hair,.22),5,2,1.5,.5);r(shade(hair,.22),9,2.5,2,.5);r(shade(hair,-.2),7.5,3,.5,4);}
  else{const f=dir==='left';r(hair,3,1,10,3);r(hair,f?8:3,3,5,4);if(L.long)r(hair,f?9:3,4,4,6);
    r(out,f?5:10,5,1,2);r('#ffffff',f?5:10,5,.5,.5);r(shade(hair,.22),f?5:6,1.5,4,.5);r('#e89a9a',f?4:11,6.5,1,.5);if(L.beard)r(hair,f?3:9,7,4,2);}
  /* 모자 */
  if(L.hat){r(L.hat,3,0,10,3);r(L.hat2||shade(L.hat,-.25),3,2,10,1);
    if(dir==='down')r(L.hat2||shade(L.hat,-.25),3,3,10,1);else if(dir==='left')r(shade(L.hat,-.25),0,2,4,1);else if(dir==='right')r(shade(L.hat,-.25),12,2,4,1);
    if(L.hat2&&dir!=='up')r(L.hat2,7,0,2,2);}
  if(L.cap){r('#ffffff',4,0,8,2);r('#e2566f',7,0,2,2);}}
function emote(g,sx,sy,kind){R('#1d1d2b',sx+3,sy-14,10,12,g);R('#ffffff',sx+4,sy-13,8,10,g);R('#1d1d2b',sx+7,sy-3,2,2,g);
  if(kind==='!'){R('#e2566f',sx+7,sy-12,2,5,g);R('#e2566f',sx+7,sy-6,2,2,g);}
  else if(kind==='?'){R('#3d7ad6',sx+6,sy-12,4,1,g);R('#3d7ad6',sx+9,sy-11,1,2,g);R('#3d7ad6',sx+7,sy-9,2,1,g);R('#3d7ad6',sx+7,sy-6,2,2,g);}
  else{R('#e2566f',sx+5,sy-11,2,2,g);R('#e2566f',sx+9,sy-11,2,2,g);R('#e2566f',sx+5,sy-9,6,2,g);R('#e2566f',sx+6,sy-7,4,1,g);R('#e2566f',sx+7,sy-6,2,1,g);}}
function capsule(g,x,y,r=0,o={}){g.save();g.translate(Math.round(x),Math.round(y));g.rotate(r);const k=o.kind==='great'?['#c03ad8','#ff6b6b']:['#3d7ad6','#5d9bff'];
  if(o.open){R('#1d2340',-5,-9,10,5,g);R(k[1],-4,-8,8,3,g);R('#1d2340',-5,1,10,5,g);R('#f4f4f4',-4,1,8,4,g);}
  else{R('#1d2340',-5,-5,10,10,g);R(k[1],-4,-4,8,4,g);R('#f4f4f4',-4,0,8,4,g);R('#1d2340',-4,-1,8,1,g);R('#ffd84a',-1,-2,2,3,g);R('#ffffff',-3,-3,2,1,g);
    if(o.kind==='great'){R(k[0],-4,-4,2,2,g);R(k[0],2,-4,2,2,g);}}
  g.restore();}

/* ================= 필드 타일 ================= */
const GR='#8fd36f',GR2='#77be58',TG='#4ea443',TG2='#2f7d34',TG3='#9be07a';
function ground(sx,sy,h){R(GR,sx,sy,16,16);
  for(let i=0;i<3;i++){const q=(h>>(i*4))&255,x=sx+1+q%13,y=sy+1+(q>>3)%13;R(GR2,x,y+.5,.5,1);R(GR2,x+1,y,.5,1.5);R('#a8e48a',x+.5,y-.5,.5,.5);}
  if(h%3===0){R(GR2,sx+2+h%9,sy+3+(h>>3)%9,2,1);R(GR2,sx+3+h%9,sy+2+(h>>3)%9,1,1);R('#b4ec96',sx+2.5+h%9,sy+2.5+(h>>3)%9,.5,.5);}
  if(h%7===1){R('#a6e086',sx+(h>>2)%12,sy+(h>>5)%12,1,1);R('#d8f6c0',sx+(h>>2)%12,sy+(h>>5)%12,.5,.5);}
  if(h%11===3){R('#7d8c6a',sx+(h>>3)%13,sy+(h>>6)%13,1,.5);R('#c4c8b0',sx+(h>>3)%13,sy+(h>>6)%13-.5,.5,.5);}}
function tree(sx,sy,h){R('#2f7d34',sx,sy,16,16);R('#5a3a1e',sx+6,sy+11,4,5);R('#1b4f26',sx+2,sy,12,1);R('#1b4f26',sx+1,sy+1,14,1);R('#1b4f26',sx,sy+2,16,8);R('#1b4f26',sx+1,sy+10,14,1);R('#1b4f26',sx+3,sy+11,10,1);
  R('#2f8a3c',sx+3,sy+1,10,1);R('#2f8a3c',sx+1,sy+2,14,8);R('#2f8a3c',sx+3,sy+10,10,1);R('#4fb54d',sx+4,sy+2,5,2);R('#4fb54d',sx+3,sy+4,3,2);R('#6fd06a',sx+5,sy+2,2,1);R('#24702f',sx+9,sy+6,4,3);R('#24702f',sx+6,sy+8,3,2);
  for(const[x,y]of[[2.5,6],[5,5.5],[7.5,3.5],[10,3],[12,5.5],[4,8.5],[11.5,8.5],[8.5,6.5]]){R('#3f9e45',sx+x,sy+y,1,.5);R('#1f5f2a',sx+x+.5,sy+y+.5,.5,.5);}
  R('#8be080',sx+5,sy+2,.5,.5);R('#8be080',sx+3.5,sy+4,.5,.5);R('#8be080',sx+7,sy+2.5,.5,.5);
  R('#7a5230',sx+6.5,sy+11.5,.5,4);R('#3e2612',sx+8.5,sy+12,.5,4);R('#3e2612',sx+7.5,sy+13.5,.5,1);R('#1b4f26',sx+5,sy+15.5,6,.5);}
function drawTileOut(m,tx,ty,sx,sy){const c=tileAt(m,tx,ty),h=hash(tx,ty);
  switch(c){
  case '.':ground(sx,sy,h);break;
  case ',':{R(TG,sx,sy,16,16);const sw=(m.rustle&&m.rustle.x===tx&&m.rustle.y===ty&&frame-m.rustle.f<12)?1:0;
    for(const[bx,by]of[[1,2],[8,1],[4,8],[11,9]]){R(TG2,sx+bx,sy+by+1,1,5);R(TG2,sx+bx+3,sy+by+1,1,5);R(TG2,sx+bx+1,sy+by+4,2,2);R(TG3,sx+bx+1+sw,sy+by,1,3);R(TG3,sx+bx+2-sw,sy+by+1,1,2);
      R('#c8f4a8',sx+bx+1+sw,sy+by,.5,.5);R('#c8f4a8',sx+bx+2.5-sw,sy+by+1,.5,.5);R('#5fb853',sx+bx+.5,sy+by+1,.5,2);R('#5fb853',sx+bx+3.5,sy+by+1.5,.5,2);R('#225e28',sx+bx+1,sy+by+5.5,2,.5);}
    R('#3d8c38',sx,sy+15.5,16,.5);break;}
  case '=':R('#e8d6a0',sx,sy,16,16);if(h&1)R('#d4bf85',sx+2+h%11,sy+2+(h>>4)%11,2,1);if(h%5===0)R('#f4e6bc',sx+(h>>3)%13,sy+(h>>6)%13,2,1);
    for(let i=0;i<2;i++){const q=(h>>(i*5+2))&255,x=sx+1+q%13,y=sy+1+(q>>4)%13;R('#b8a06a',x,y+.5,1.5,.5);R('#f8ecc8',x,y,1,.5);}
    if(h%4===2){R('#d9c690',sx+(h>>2)%12,sy+(h>>4)%12,3,.5);}
    for(const[dx,dy,ex,ey]of[[-1,0,0,0],[1,0,15,0],[0,-1,0,0],[0,1,0,15]]){const n=tileAt(m,tx+dx,ty+dy);if(n==='.'||n==='f'||n===',')R('#cdb87a',sx+ex,sy+ey,dx?1:16,dy?1:16);}break;
  case '~':{R('#4b8fe6',sx,sy,16,16);R('#4386dc',sx,sy+8,16,8);const o=((frame>>4)+h)&7;R('#7fb7ff',sx+o,sy+4,5,1);R('#7fb7ff',sx+((o+8)&15)-2,sy+11,4,1);R('#a8d0ff',sx+((o+3)&15),sy+8,2,1);
    R('#5f9ef0',sx+o+.5,sy+5,4,.5);if(((frame>>3)+h)%9===0)R('#ffffff',sx+((h>>2)&13)+1,sy+((h>>5)&11)+2,.5,.5);
    const up=tileAt(m,tx,ty-1);if(up&&up!=='~'&&up!=='Q')R('#3a76c8',sx,sy,16,3),R('#e8f4ff',sx,sy+3,16,1);
    for(const[dx,ex]of[[-1,0],[1,15]]){const n=tileAt(m,tx+dx,ty);if(n&&n!=='~'&&n!=='Q')R('#3a76c8',sx+ex,sy,1,16);}break;}
  case 'f':{ground(sx,sy,h);const cols=['#ff6b6b','#ffd84a','#ffffff','#ff9ad5'];
    for(const[fx,fy,i]of[[3,3,0],[10,9,1]]){const s=((frame>>5)+h+i)&1,cc=cols[(h+i)%4];R('#2f7d34',sx+fx+1,sy+fy+3,1,2);R('#4fb54d',sx+fx+1.5,sy+fy+3.5,1,.5);
      R(cc,sx+fx+s+.5,sy+fy,2,3);R(cc,sx+fx+s,sy+fy+.5,3,2);R(shade(cc,-.18),sx+fx+s+.5,sy+fy+2.5,2,.5);R('#e8a020',sx+fx+1+s,sy+fy+1,1,1);R('#fff2a0',sx+fx+1+s,sy+fy+1,.5,.5);}break;}
  case 's':ground(sx,sy,h);R('#6a4424',sx+7,sy+9,2,7);R('#4a2c14',sx+1,sy+2,14,9);R('#c8955a',sx+2,sy+3,12,7);R('#e0b47a',sx+2,sy+3,12,1);R('#8a6038',sx+4,sy+5,8,1);R('#8a6038',sx+4,sy+7,6,1);break;
  case 'r':ground(sx,sy,h);R('rgba(0,0,0,.18)',sx+2,sy+14,13,1.5);R('#4a4a58',sx+2,sy+5,12,10);R('#8e8ea0',sx+3,sy+4,10,9);R('#b5b5c5',sx+4,sy+5,4,2);R('#6e6e80',sx+3,sy+12,10,2);R('#4a4a58',sx+8,sy+8,1,3);
    R('#d8d8e4',sx+4,sy+5,1.5,.5);R('#7a7a8c',sx+10,sy+6,2,.5);R('#7a7a8c',sx+5,sy+10,.5,1.5);R('#a2a2b4',sx+9,sy+8,.5,2);R('#5a5a6a',sx+12.5,sy+5,.5,7);break;
  case 'F':ground(sx,sy,h);R('#f4f0e4',sx,sy+5,16,2);R('#f4f0e4',sx,sy+10,16,2);R('#f4f0e4',sx+2,sy+3,2,11);R('#f4f0e4',sx+10,sy+3,2,11);R('#a8a294',sx,sy+12,16,1);break;
  case 'L':{ground(sx,sy,h);R('#5ea84a',sx,sy+9,16,3);R('#3f7f33',sx,sy+12,16,2);R('#2c5e24',sx,sy+14,16,1);R('#a6e086',sx,sy+8,16,1);break;}
  case 'Q':R('#b07a40',sx,sy,16,16);for(let i=0;i<16;i+=4)R('#8a5a2a',sx,sy+i,16,1);R('#d09a5a',sx+((h>>2)&15),sy+1,3,1);break;
  case 'D':{const k=bldAt(m,tx,ty);wallTile(m,k,tx,ty,sx,sy);
    if(k==='C'||k==='M'){R('#2a3048',sx+2,sy+2,12,14);R('#9fd8ff',sx+3,sy+3,10,13);R('#2a3048',sx+8,sy+3,1,13);R('#e8f6ff',sx+4,sy+4,2,4);}
    else if(k==='G'||k==='B'){R('#2a2d38',sx+1,sy+2,14,14);R('#596080',sx+2,sy+3,12,13);R('#2a2d38',sx+8,sy+3,1,13);R('#8a90b0',sx+3,sy+4,4,1);}
    else{R('#3a2414',sx+3,sy+2,10,14);R('#7a5230',sx+4,sy+3,8,13);R('#5a3a20',sx+4,sy+8,8,1);R('#f2c94c',sx+10,sy+10,1,2);}break;}
  case 'H':case 'K':case 'B':case 'C':case 'M':case 'G':building(m,c,tx,ty,sx,sy);break;
  default:tree(sx,sy,h);}}
const BLD={H:{roof:'#d0583e',r2:'#a33a2a',wall:'#f2e8d0'},K:{roof:'#4f9a5a',r2:'#2f6a3a',wall:'#f2e8d0'},B:{roof:'#8b93ab',r2:'#5e6680',wall:'#e8ecf4'},
  C:{roof:'#e2566f',r2:'#b63a52',wall:'#fff4f4'},M:{roof:'#3d7ad6',r2:'#2b5aa8',wall:'#f0f4ff'},G:{roof:'#7d8396',r2:'#555b70',wall:'#e8e4da'}};
function bldAt(m,tx,ty){for(const[dx,dy]of[[-1,0],[1,0],[0,-1]]){const q=tileAt(m,tx+dx,ty+dy);if(BLD[q])return q;}return'H';}
function wallTile(m,k,tx,ty,sx,sy){const b=BLD[k];R(b.wall,sx,sy,16,16);for(let y=3;y<14;y+=4)R(shade(b.wall,-.05),sx,sy+y,16,.5);R(shade(b.wall,-.12),sx,sy+14,16,2);R(shade(b.wall,.06),sx,sy,16,.5);
  const same=q=>q===k||q==='D';if(!same(tileAt(m,tx-1,ty)))R(shade(b.wall,-.25),sx,sy,2,16);if(!same(tileAt(m,tx+1,ty)))R(shade(b.wall,-.25),sx+14,sy,2,16);}
function building(m,k,tx,ty,sx,sy){const b=BLD[k];let up=0,dn=0;while(tileAt(m,tx,ty-up-1)===k)up++;
  while([k,'D'].includes(tileAt(m,tx,ty+dn+1)))dn++;const hgt=up+dn+1,roofRows=hgt>=4?2:1;
  const lft=![k,'D'].includes(tileAt(m,tx-1,ty)),rgt=![k,'D'].includes(tileAt(m,tx+1,ty));
  if(up<roofRows){R(b.roof,sx,sy,16,16);for(let i=2;i<16;i+=4){R(b.r2,sx,sy+i+(up?2:0),16,1);R(shade(b.roof,.14),sx,sy+i+(up?2:0)-1,16,.5);
      for(let x=((i>>2)&1)*2;x<16;x+=4)R(shade(b.roof,-.1),sx+x+.5,sy+i+(up?2:0)+1,.5,2.5);}
    if(up===0){R(shade(b.roof,.25),sx,sy,16,2);R(b.r2,sx,sy+2,16,1);}if(up===roofRows-1){R('#3a2a2a',sx,sy+13,16,3);R(shade(b.roof,-.35),sx,sy+12,16,1);}
    if(lft)R(b.r2,sx,sy,2,16);if(rgt)R(b.r2,sx+14,sy,2,16);
    if(k==='G'&&up===0&&!lft&&!rgt&&tileAt(m,tx-1,ty)===k&&tileAt(m,tx+1,ty)===k&&(tx%3===0))R('#f2c94c',sx+6,sy+4,4,4);
    return;}
  wallTile(m,k,tx,ty,sx,sy);
  const below=tileAt(m,tx,ty+1);
  if(below==='D'){
    if(k==='C'){R('#ffffff',sx+2,sy+1,12,12);R('#e2566f',sx+7,sy+2,2,10);R('#e2566f',sx+3,sy+6,10,2);}
    else if(k==='M'){R('#2b5aa8',sx+1,sy+2,14,10);R('#ffffff',sx+3,sy+4,10,1);R('#ffffff',sx+3,sy+7,7,1);R('#ffd84a',sx+11,sy+7,2,2);}
    else if(k==='G'){R('#8a6a1a',sx+3,sy+1,10,12);R('#f2c94c',sx+4,sy+2,8,10);R('#fff2b0',sx+5,sy+3,2,4);R('#8a6a1a',sx+7,sy+5,2,4);}
    else if(k==='B'){R('#3a4a6a',sx+2,sy+3,12,8);R('#9fd0ff',sx+3,sy+4,10,6);R('#ffffff',sx+4,sy+5,3,1);}
    else{R('#3a4a6a',sx+3,sy+3,10,8);R('#9fd0ff',sx+4,sy+4,8,6);R('#ffffff',sx+5,sy+5,2,1);R('#c84a3a',sx+3,sy+11,10,2);}}
  else if((tx+ty)%2===0||k==='B'){R('#3a4a6a',sx+3,sy+3,10,8);R('#9fd0ff',sx+4,sy+4,8,6);R('#ffffff',sx+5,sy+5,2,1);R('#d6ecff',sx+4,sy+9,8,1);if(k==='H'||k==='K')R('#c84a3a',sx+3,sy+11,10,2);}}

/* ================= 실내 타일 ================= */
function drawTileIn(m,tx,ty,sx,sy){const c=tileAt(m,tx,ty),h=hash(tx,ty),fl=m.floor||'wood';
  const floor=()=>{if(fl==='wood'){R('#d9a86a',sx,sy,16,16);R('#c4925a',sx,sy+7,16,1);R('#c4925a',sx,sy+15,16,1);R('#c4925a',sx+((ty&1)?4:12),sy,1,7);R('#c4925a',sx+((ty&1)?10:2),sy+8,1,7);
      R('#e6b87c',sx,sy+.5,16,.5);R('#e6b87c',sx,sy+8.5,16,.5);R('#cc985e',sx+(h%9)+2,sy+3,3,.5);R('#cc985e',sx+((h>>3)%9)+3,sy+11.5,4,.5);}
    else if(fl==='tile'){R('#f2f2ea',sx,sy,16,16);R('#dcdcd0',sx,sy+15,16,1);R('#dcdcd0',sx+15,sy,1,16);if((tx+ty)%2)R('#e8e8de',sx,sy,15,15);R('#ffffff',sx+1,sy+1,3,.5);R('#ffffff',sx+1,sy+1,.5,2);}
    else if(fl==='lab'){R('#e4ecf2',sx,sy,16,16);R('#c8d4de',sx,sy+15,16,1);R('#c8d4de',sx+15,sy,1,16);}
    else if(fl==='stone'){R('#b8a582',sx,sy,16,16);R('#a08c68',sx,sy+15,16,1);R('#a08c68',sx+15,sy,1,16);if(h%4===0)R('#cbb894',sx+3,sy+4,4,2);}
    else{R('#bfe4f2',sx,sy,16,16);R('#a8d4e8',sx,sy+15,16,1);R('#a8d4e8',sx+15,sy,1,16);}};
  switch(c){
  case 'w':{const below=tileAt(m,tx,ty+1);const wc=m.wall||'#e8d8b8';R(wc,sx,sy,16,16);R(shade(wc,-.08),sx,sy+((tx&1)?0:8),16,8);
    if(below!=='w'){R(shade(wc,-.3),sx,sy+12,16,4);R(shade(wc,-.45),sx,sy+15,16,1);}else R(shade(wc,.15),sx,sy,16,1);break;}
  case 'x':R('#000',sx,sy,16,16);break;
  case 'm':floor();R('#c84a3a',sx+1,sy+3,14,11);R('#e86a5a',sx+2,sy+4,12,9);R('#f2c94c',sx+2,sy+8,12,1);break;
  case 'c':R('#c84a5a',sx,sy,16,16);R('#e8a040',sx,sy,16,1);R('#a83a4a',sx,sy+15,16,1);if(h%2)R('#d85a6a',sx+4,sy+4,8,8);break;
  case 'T':floor();R('#7a4a2a',sx+1,sy+3,14,11);R('#b07a4a',sx+1,sy+2,14,9);R('#c8925a',sx+2,sy+3,12,2);R('#5a3418',sx+2,sy+13,2,3);R('#5a3418',sx+12,sy+13,2,3);break;
  case 'K':floor();R('#5a6488',sx,sy+2,16,12);R('#e8ecf6',sx,sy+1,16,5);R('#ffffff',sx,sy+1,16,1);R('#3d4562',sx,sy+13,16,3);break;
  case 'S':R(m.wall||'#e8d8b8',sx,sy,16,16);R('#6a4424',sx+1,sy,14,16);R('#4a2c14',sx+2,sy+1,12,14);
    for(let i=0;i<3;i++){const yy=sy+2+i*5;R('#8a6038',sx+2,yy+4,12,1);for(let j=0;j<5;j++)R(['#e2566f','#3d7ad6','#f2c230','#3cb371','#8a6fd8'][(h+i+j)%5],sx+3+j*2,yy+((h+j)%2),2,4-((h+j)%2));}break;
  case 'P':floor();R('#3d4562',sx+2,sy+1,12,12);R('#6ad0ff',sx+3,sy+2,10,7);R(((frame>>4)&1)?'#ffffff':'#bdeeff',sx+4,sy+3,4,1);R('#c8ccd8',sx+1,sy+12,14,4);R('#3d4562',sx+5,sy+13,6,1);break;
  case 'h':floor();R('#5a6488',sx,sy+4,16,12);R('#c8ccd8',sx+1,sy+2,14,8);for(let i=0;i<3;i++)R('#e2566f',sx+2+i*5,sy+4,3,3);R('#3d4562',sx,sy+14,16,2);break;
  case 'v':floor();R('#2a2a34',sx+1,sy+2,14,10);R(((frame>>5)&1)?'#7ad0ff':'#8ae07a',sx+2,sy+3,12,7);R('#4a4a58',sx+4,sy+12,8,4);break;
  case 'b':floor();R('#5a3a8a',sx+1,sy,14,16);R('#ffffff',sx+2,sy+1,12,4);R('#8a6fd8',sx+2,sy+6,12,9);break;
  case 'p':floor();R('#8a5a2a',sx+4,sy+10,8,6);R('#2f7d34',sx+3,sy+2,10,9);R('#4fb54d',sx+5,sy+1,6,6);R('#6fd06a',sx+6,sy+2,2,2);break;
  case 'R':floor();R('#5a4a3a',sx+1,sy+3,14,13);R('#8a7458',sx+2,sy+2,12,11);R('#a68e6e',sx+3,sy+3,5,3);R('#6e5a44',sx+2,sy+12,12,2);break;
  case 'Y':floor();R('#4a4a58',sx+4,sy+12,8,4);R('#8e8ea0',sx+5,sy+3,6,10);R('#c8c8d8',sx+6,sy+4,2,6);R('#f2c94c',sx+6,sy,4,4);break;
  case '~':{R('#3a8ad8',sx,sy,16,16);const o=((frame>>4)+h)&7;R('#7fc0ff',sx+o,sy+5,5,1);R('#7fc0ff',sx+((o+8)&15)-2,sy+11,4,1);
    const up=tileAt(m,tx,ty-1);if(up&&up!=='~')R('#e8f4ff',sx,sy,16,2);break;}
  default:floor();}}
function tileAt(m,x,y){return(x<0||y<0||x>=m.w||y>=m.h)?null:m.rows[y][x];}

/* ================= 전투 배경 ================= */
const BGC={};
function battleBg(kind){if(BGC[kind])return BGC[kind];const[c,g]=mkCanvas(W,H);
  const P={grass:['#a8dcff','#e6f6ff','#8fd36f','#6fb84f','#b8e89a','#5aa04a'],forest:['#5e9f6a','#a9d6a0','#5e9a42','#3f7a33','#88c06a','#2f6a2a'],
    city:['#bcd4ff','#eef4ff','#c8c0a8','#a89c80','#e0d8c0','#8a7e64'],rock:['#6a5a48','#a8906c','#9a8462','#7a6648','#c2aa84','#5a4a34'],
    water:['#2f7fc8','#8ad0ff','#4aa0e8','#2f7fc8','#a8e0ff','#1f5f9a'],lab:['#c8d8e8','#f4f8ff','#d8e0ea','#b8c4d4','#eef2f8','#98a4b8']}[kind]||null;
  const p=P||[];const gr=g.createLinearGradient(0,0,0,120);gr.addColorStop(0,p[0]);gr.addColorStop(1,p[1]);g.fillStyle=gr;g.fillRect(0,0,W,120);
  if(kind==='grass'||kind==='city'){for(let i=0;i<4;i++){g.fillStyle='rgba(255,255,255,.8)';const x=20+i*70,y=18+(i%2)*14;g.fillRect(x,y,30,6);g.fillRect(x+6,y-4,16,4);}}
  if(kind==='forest'){for(let i=0;i<12;i++){g.fillStyle=i%2?'#2f6a3a':'#3f7f48';const x=i*24-6,hh=40+((i*37)%30);g.beginPath();g.moveTo(x,96);g.lineTo(x+16,96-hh);g.lineTo(x+32,96);g.fill();}}
  if(kind==='city'){for(let i=0;i<9;i++){const x=i*30,hh=30+((i*53)%40);g.fillStyle=['#9aa8c8','#8898b8','#a8b4d0'][i%3];g.fillRect(x,96-hh,26,hh);g.fillStyle='#dce8ff';for(let y=96-hh+4;y<92;y+=8)for(let xx=x+4;xx<x+22;xx+=7)g.fillRect(xx,y,3,4);}}
  if(kind==='rock'){g.fillStyle='#5a4a3a';for(let i=0;i<10;i++){const x=i*28,hh=20+((i*41)%40);g.beginPath();g.moveTo(x-10,100);g.lineTo(x+8,100-hh);g.lineTo(x+30,100);g.fill();}}
  if(kind==='water'){g.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<14;i++)g.fillRect((i*47)%W,20+(i*29)%70,18,2);}
  if(kind==='lab'){g.fillStyle='#b8c4d4';for(let x=0;x<W;x+=32)g.fillRect(x,0,2,96);g.fillStyle='#9aa8bc';g.fillRect(0,92,W,4);}
  g.fillStyle=p[2];g.fillRect(0,96,W,96);g.fillStyle=p[3];for(let y=100;y<H;y+=10)g.fillRect(0,y,W,1);
  return BGC[kind]=c;}
function platform(g,cx,cy,rx,ry,kind){const P={grass:['#b8e89a','#6fb84f','#5aa04a'],forest:['#88c06a','#4f8a3a','#2f6a2a'],city:['#e0d8c0','#b0a488','#8a7e64'],
  rock:['#c2aa84','#9a8462','#5a4a34'],water:['#a8e0ff','#5ab0f0','#1f5f9a'],lab:['#eef2f8','#c4cede','#98a4b8']}[kind]||['#ccc','#999','#666'];
  g.fillStyle=P[2];g.beginPath();g.ellipse(cx,cy+3,rx,ry,0,0,7);g.fill();g.fillStyle=P[1];g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,7);g.fill();
  g.fillStyle=P[0];g.beginPath();g.ellipse(cx,cy-1,rx*.82,ry*.7,0,0,7);g.fill();}

/* ================= 파티클 ================= */
const FX={list:[],
  add(p){this.list.push(Object.assign({x:0,y:0,vx:0,vy:0,g:0,life:30,t:0,c:'#fff',s:2,shape:'sq',rot:0,vr:0,fade:1},p));},
  burst(x,y,n,o){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=(o.sp||2)*(.4+Math.random()*.8);this.add({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,...o,c:Array.isArray(o.c)?o.c[i%o.c.length]:o.c});}},
  step(){for(const p of this.list){p.t++;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.rot+=p.vr;if(p.drag){p.vx*=p.drag;p.vy*=p.drag;}}this.list=this.list.filter(p=>p.t<p.life);},
  draw(g){for(const p of this.list){const a=p.fade?clamp(1-p.t/p.life,0,1)*1.4:1;g.save();g.globalAlpha=clamp(a,0,1);g.translate(Math.round(p.x),Math.round(p.y));g.rotate(p.rot);g.fillStyle=p.c;const s=p.s;
    switch(p.shape){case 'circ':g.beginPath();g.arc(0,0,s,0,7);g.fill();break;
      case 'ring':g.strokeStyle=p.c;g.lineWidth=2;g.beginPath();g.arc(0,0,s+p.t*(p.grow||1),0,7);g.stroke();break;
      case 'star':g.fillRect(-s,-.5,s*2,1.5);g.fillRect(-.5,-s,1.5,s*2);g.fillRect(-s/2,-s/2,s,s);break;
      case 'leaf':g.beginPath();g.ellipse(0,0,s*1.6,s*.7,0,0,7);g.fill();g.fillStyle='#2f7d34';g.fillRect(-s,-.3,s*2,.8);break;
      case 'flame':g.fillStyle=p.t<p.life*.3?'#fff4a0':p.t<p.life*.6?'#ffb030':'#ff5a20';g.beginPath();g.ellipse(0,0,s,s*1.5,0,0,7);g.fill();break;
      case 'z':g.font='bold 9px monospace';g.fillText('Z',0,0);break;
      case 'arrow':g.beginPath();g.moveTo(0,p.dn?4:-4);g.lineTo(-4,p.dn?-1:1);g.lineTo(4,p.dn?-1:1);g.fill();g.fillRect(-1.5,p.dn?-5:0,3,5);break;
      case 'bolt':g.strokeStyle=p.c;g.lineWidth=2;g.beginPath();let yy=-p.len||-30;g.moveTo(0,yy);for(let i=0;i<5;i++){yy+=(p.len||30)/5*2/2;g.lineTo((i%2?-1:1)*(4+Math.random()*3),yy);}g.lineTo(0,0);g.stroke();break;
      case 'slash':g.strokeStyle=p.c;g.lineWidth=3;g.beginPath();g.moveTo(-s,-s);g.lineTo(s,s);g.stroke();break;
      default:g.fillRect(-s/2,-s/2,s,s);}g.restore();}}};

/* ================= 아이콘 ================= */
const UIIC={};
function pix(w,h,draw){const[c,g]=mkCanvas(w,h);draw((col,x,y,ww=1,hh=1)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh);},g);return c.toDataURL();}
function itemIcon(id){if(UIIC['i'+id])return UIIC['i'+id];const it=ITEMS[id];
  const u=pix(16,16,(r,g)=>{
    if(it.ball){const c=id==='great'?'#c03ad8':'#3d7ad6';r('#1d2340',3,3,10,10);r(c,4,4,8,4);r('#f4f4f4',4,8,8,4);r('#1d2340',4,7,8,1);r('#ffd84a',7,6,2,3);r('#fff',5,5,2,1);if(id==='great'){r('#ff6b6b',4,4,2,2);r('#ff6b6b',10,4,2,2);}}
    else if(it.heal){const c=id==='super'?'#f08030':'#a05ad8';r('#1d1d2b',5,2,6,2);r('#c8ccd8',6,1,4,2);r('#1d1d2b',3,4,10,11);r(c,4,5,8,9);r('#fff',5,6,2,6);r(shade(c,-.3),4,12,8,2);}
    else if(it.cure){const c={psn:'#7ad06a',brn:'#e8622c',par:'#f0c418',slp:'#8ab0ff',all:'#ff7ad0'}[it.cure];
      if(id==='awake'){r('#1d1d2b',4,4,8,9);r('#f2c94c',5,5,6,7);r('#fff4b0',6,6,2,3);r('#8a6a1a',7,13,2,2);r('#1d1d2b',7,2,2,2);}
      else{r('#1d1d2b',5,2,6,13);r(c,6,6,4,8);r('#fff',6,3,4,3);r('#ffffff',6,7,1,5);}}
    else if(it.revive){r('#1d1d2b',7,1,2,14);r('#f2c94c',5,2,6,9);r('#fff4b0',6,3,2,6);r('#e8a020',8,4,2,6);r('#a87a20',7,12,2,3);}
    else if(id==='dex'){r('#1d1d2b',2,2,12,13);r('#e2566f',3,3,10,11);r('#b63a52',3,3,2,11);r('#9fd8ff',7,5,5,4);r('#fff',8,6,2,1);r('#ffd84a',7,11,2,2);}
    else if(id==='pad'){r('#1d1d2b',2,3,12,11);r('#e75a5a',3,4,10,9);r('#cfe8c1',5,5,6,6);r('#2f4a2a',6,7,4,1);}
    else if(id==='shoes'){r('#1d1d2b',2,8,12,6);r('#3d7ad6',3,9,10,4);r('#ffffff',3,12,11,1);r('#1d1d2b',3,5,6,4);r('#3d7ad6',4,6,4,3);r('#ffd84a',9,10,2,1);}
  });return UIIC['i'+id]=u;}
function menuIcon(k){if(UIIC['m'+k])return UIIC['m'+k];const u=pix(24,24,(r)=>{
  if(k==='dex'){r('#1d1d2b',4,2,17,21);r('#e2566f',5,3,15,19);r('#b63a52',5,3,3,19);r('#1d1d2b',10,6,8,7);r('#9fd8ff',11,7,6,5);r('#ffffff',12,8,2,1);r('#ffd84a',10,16,3,3);r('#3cb371',15,16,3,3);}
  else if(k==='party'){r('#1d2340',4,4,16,16);r('#5d9bff',5,5,14,7);r('#f4f4f4',5,12,14,7);r('#1d2340',5,11,14,2);r('#1d2340',9,9,6,6);r('#ffd84a',10,10,4,4);r('#ffffff',7,6,3,2);}
  else if(k==='bag'){r('#1d1d2b',3,6,18,16);r('#e8a040',4,7,16,14);r('#c07a20',4,7,16,4);r('#1d1d2b',8,2,8,5);r('#e8a040',9,3,6,3);r('#ffd84a',10,13,4,3);r('#8a5a10',4,20,16,1);}
  else if(k==='card'){r('#1d1d2b',2,5,20,15);r('#3d7ad6',3,6,18,13);r('#ffffff',4,7,7,8);r('#f6d2ac',5,8,5,5);r('#3b2416',5,8,5,2);r('#ffffff',12,8,8,1);r('#ffffff',12,11,7,1);r('#ffffff',12,14,8,1);}
  else if(k==='save'){r('#1d1d2b',4,2,16,20);r('#3cb371',5,3,14,18);r('#ffffff',7,5,10,14);for(let y=7;y<18;y+=3)r('#9aa0b4',8,y,8,1);r('#e2566f',16,2,2,8);}
  else if(k==='opt'){r('#1d1d2b',6,3,12,18);r('#1d1d2b',3,6,18,12);r('#8e98b4',7,4,10,16);r('#8e98b4',4,7,16,10);r('#1d1d2b',9,9,6,6);r('#cfd6ea',10,10,4,4);}
  else if(k==='close'){r('#1d1d2b',5,5,14,14);r('#e2566f',6,6,12,12);r('#ffffff',8,11,8,2);}});
  return UIIC['m'+k]=u;}
function badgeIcon(i,big){const k='b'+i+(big?'B':'');if(UIIC[k])return UIIC[k];const u=pix(16,16,(r)=>{
  if(i===0){r('#5a4a2a',3,2,10,12);r('#5a4a2a',1,5,14,6);r('#c8a060',4,3,8,10);r('#c8a060',2,6,12,4);r('#f2dca0',5,4,3,3);r('#8a6a3a',7,8,4,3);}
  else{r('#1f4f9a',7,1,2,2);r('#1f4f9a',5,3,6,2);r('#1f4f9a',3,5,10,7);r('#1f4f9a',5,12,6,2);r('#6ab8ff',6,4,4,2);r('#6ab8ff',4,6,8,5);r('#e8f6ff',5,6,3,2);r('#3d8ad6',7,11,4,1);}});
  return UIIC[k]=u;}
