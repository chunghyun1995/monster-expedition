/* =========================================================
   portrait.js — 대화창 초상화 (자연스러운 애니메이션 풍 일러스트)
   직선·도형 대신 매끄러운 곡선(캣멀롬 → 베지어)과 끝이 가늘어지는 머리 가닥으로 그린다.
   선은 검정 대신 바탕색보다 어두운 색으로 얇게. 눈 깜빡임과 입 움직임은 CSS.
   ========================================================= */
const POR={
  player:{hair:'boy',hat:'cap',eye:'#7a4a22'},
  rival:{hair:'messy',eye:'#2a9a6a',scarf:1,brow:'smug',mouth:'grin'},
  mom:{hair:'long',eye:'#8a5a32',fem:1,brow:'soft',mouth:'smile'},
  prof:{hair:'old',eye:'#5a6a7a',glasses:'round',coat:1,mous:1,age:2,mouth:'smile'},
  aide:{hair:'neat',eye:'#4a4a6a',glasses:'rect',coat:1},
  kid:{hair:'boy',hat:'cap',eye:'#6a4a22',young:1,mouth:'grin'},
  girl:{hair:'twin',eye:'#b24a7a',fem:1,ribbon:'#ff8ab0',young:1,mouth:'smile'},
  lady:{hair:'long',eye:'#7a5ac0',fem:1,brow:'soft'},
  old:{hair:'old',eye:'#5a4a3a',squint:1,mous:1,age:2,mouth:'smile'},
  granny:{hair:'bun',eye:'#5a4a3a',squint:1,fem:1,age:2,mouth:'smile'},
  camper:{hair:'neat',hat:'bucket',eye:'#5a4a2a'},
  bug:{hair:'boy',hat:'cap',eye:'#3a4a3a',young:1,mouth:'grin'},
  man:{hair:'neat',eye:'#4a3a2a'},
  hiker:{hair:'neat',hat:'bucket',eye:'#4a3a2a',beard:1,age:1,brow:'thick'},
  swim:{hair:'boy',eye:'#2a6a9a',goggles:1,mouth:'grin'},
  fisher:{hair:'neat',hat:'bucket',eye:'#3a4a3a',age:1},
  nurse:{hair:'long',eye:'#d0508a',fem:1,nursecap:1,brow:'soft',mouth:'smile'},
  clerk:{hair:'neat',eye:'#3a3a6a',mouth:'smile'},
  guide:{hair:'neat',hat:'guard',eye:'#4a3a2a',beard:1,age:1},
  leaderRock:{hair:'neat',hat:'bucket',eye:'#4a2a12',beard:1,brow:'thick',age:1},
  leaderWater:{hair:'long',eye:'#1a8ad0',fem:1,ribbon:'#ffffff',brow:'soft'},
  sister:{hair:'pony',eye:'#b06a2a',fem:1,mouth:'smile'},
  leaderFire:{hair:'messy',eye:'#d04a1a',brow:'thick',mouth:'grin'},
  leaderElec:{hair:'twin',eye:'#d0a010',fem:1,ribbon:'#ffe060',mouth:'grin'},
  leaderSky:{hair:'long',eye:'#4a70c0',fem:1,brow:'soft',coat:1},
  villain:{hair:'neat',eye:'#8a1a2a',brow:'thick',hat:'guard',mouth:'grin'},
  boss:{hair:'old',eye:'#a01a2a',brow:'thick',beard:1,age:2,coat:1}};
/* 점들을 지나는 매끄러운 곡선 (캣멀롬 스플라인) */
function smoothPath(pts,closed=true,t=.5){const n=pts.length,P=i=>closed?pts[(i+n)%n]:pts[Math.max(0,Math.min(n-1,i))];
  let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;const last=closed?n:n-1;
  for(let i=0;i<last;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
    const c1=[p1[0]+(p2[0]-p0[0])*t/3,p1[1]+(p2[1]-p0[1])*t/3],c2=[p2[0]-(p3[0]-p1[0])*t/3,p2[1]-(p3[1]-p1[1])*t/3];
    d+=` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;}
  return d+(closed?' Z':'');}
/* 머리 한 가닥: 뿌리(x,y)에서 시작해 휘어지며 끝이 뾰족해지는 모양 */
function lock(x,y,len,ang,w,curl=0,tip=0){const N=7;let a=ang*Math.PI/180,cx=x,cy=y;const L=[],R=[];
  for(let i=0;i<=N;i++){const k=i/N,ww=w*(1-k)**(.9+tip);const nx=Math.cos(a+Math.PI/2),ny=Math.sin(a+Math.PI/2);
    L.push([cx+nx*ww/2,cy+ny*ww/2]);R.unshift([cx-nx*ww/2,cy-ny*ww/2]);cx+=Math.cos(a)*len/N;cy+=Math.sin(a)*len/N;a+=curl*Math.PI/180/N;}
  return smoothPath([...L.slice(0,-1),[cx-Math.cos(a)*len/N*.4,cy-Math.sin(a)*len/N*.4],...R.slice(1)],true,.6);}
/* 굵기가 변하는 선 (속눈썹·눈썹·입) */
function taper(pts,w0,w1){const L=[],R=[],n=pts.length;for(let i=0;i<n;i++){const p=pts[i],q=pts[Math.min(n-1,i+1)],o=pts[Math.max(0,i-1)];
    const dx=q[0]-o[0],dy=q[1]-o[1],len=Math.hypot(dx,dy)||1,w=w0+(w1-w0)*(i/(n-1)),s=Math.sin(Math.PI*i/(n-1))*.6+.4;
    L.push([p[0]-dy/len*w*s/2,p[1]+dx/len*w*s/2]);R.unshift([p[0]+dy/len*w*s/2,p[1]-dx/len*w*s/2]);}
  return smoothPath([...L,...R],true,.5);}
let porN=0;
function portraitSVG(key){const L=LOOK[key]||LOOK.man,P=POR[key]||{hair:'neat',eye:'#4a3a2a'},q='p'+(++porN)+'_';
  const sk=L.skin,skH=shade(sk,.1),skS=shade(sk,-.12),skD=shade(sk,-.26),hr=L.hair,hrD=shade(hr,-.38),hrS=shade(hr,-.2),hrL=shade(hr,.28),hrH=shade(hr,.55);
  const line=shade(hr,-.55),skLine=shade(sk,-.5),eyeC=P.eye||'#4a3a2a',sh=L.shirt,shD=shade(sh,-.28),shL=shade(sh,.2),lash='#3a2630';
  const o=[];const A=s=>o.push(s);
  A(`<defs>
    <linearGradient id="${q}hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hrL}"/><stop offset=".5" stop-color="${hr}"/><stop offset="1" stop-color="${hrS}"/></linearGradient>
    <linearGradient id="${q}hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hrS}"/><stop offset="1" stop-color="${hrD}"/></linearGradient>
    <linearGradient id="${q}ir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(eyeC,-.55)}"/><stop offset=".55" stop-color="${eyeC}"/><stop offset="1" stop-color="${shade(eyeC,.6)}"/></linearGradient>
    <linearGradient id="${q}cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shL}"/><stop offset="1" stop-color="${sh}"/></linearGradient>
    <radialGradient id="${q}bl"><stop offset="0" stop-color="#ff8a8a" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a8a" stop-opacity="0"/></radialGradient>
    <filter id="${q}b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>`);
  const HL=`stroke="${line}" stroke-width="1" stroke-linejoin="round"`;
  /* 얼굴 윤곽: 부드러운 볼과 둥근 턱 */
  const faceD=smoothPath([[66,84],[72,62],[100,54],[128,62],[134,84],[134,102],[128,124],[114,142],[100,148],[86,142],[72,124],[66,102]]);
  A(`<clipPath id="${q}fc"><path d="${faceD}"/></clipPath>`);
  /* 뒷머리 */
  const long=['long','twin','pony','bun'].includes(P.hair);
  if(P.hair==='long'||P.hair==='twin'){A(`<path d="${smoothPath([[100,26],[136,34],[154,70],[152,120],[160,168],[146,196],[118,190],[100,176],[82,190],[54,196],[40,168],[48,120],[46,70],[64,34]])}" fill="url(#${q}hb)" ${HL}/>`);
    for(const[x,a,l]of[[58,96,70],[70,92,80],[130,88,80],[142,84,70]])A(`<path d="${lock(x,110,l,a,14,a<90?6:-6,.3)}" fill="${hrS}" opacity=".9"/>`);}
  if(P.hair==='twin')A(`<path d="${smoothPath([[48,64],[30,88],[22,130],[30,176],[40,190],[46,150],[52,110],[60,80]])}" fill="url(#${q}hr)" ${HL}/><path d="${smoothPath([[152,64],[170,88],[178,130],[170,176],[160,190],[154,150],[148,110],[140,80]])}" fill="url(#${q}hr)" ${HL}/>
    <path d="M32 100 C28 130 30 156 36 176 M168 100 C172 130 170 156 164 176" fill="none" stroke="${hrH}" stroke-width="1.6" opacity=".55"/>`);
  if(P.hair==='pony')A(`<path d="${smoothPath([[124,36],[160,38],[178,70],[176,120],[166,162],[160,130],[150,96],[134,66]])}" fill="url(#${q}hr)" ${HL}/><path d="M164 70 C172 96 170 124 164 146" fill="none" stroke="${hrH}" stroke-width="1.6" opacity=".55"/>`);
  if(P.hair==='bun')A(`<path d="${smoothPath([[100,8],[116,14],[118,30],[100,38],[82,30],[84,14]])}" fill="url(#${q}hr)" ${HL}/><path d="M90 16 C96 12 104 12 110 16" fill="none" stroke="${hrH}" stroke-width="1.8" opacity=".6"/>`);
  /* 몸 · 옷: 자연스러운 어깨 */
  A(`<path d="${smoothPath([[22,206],[30,182],[56,168],[86,162],[100,164],[114,162],[144,168],[170,182],[178,206]],false)} Z" fill="url(#${q}cl)" ${HL}/>`);
  A(`<path d="M118 166 C142 170 160 180 168 200" fill="none" stroke="${shD}" stroke-width="6" opacity=".35" filter="url(#${q}b)"/><path d="M60 176 C70 186 74 196 76 206 M140 176 C130 186 126 196 124 206" fill="none" stroke="${shD}" stroke-width="1" opacity=".5"/>`);
  if(P.coat)A(`<path d="${smoothPath([[22,206],[30,182],[56,168],[84,161],[94,184],[100,204],[106,184],[116,161],[144,168],[170,182],[178,206]],false)} Z" fill="#fafbff" stroke="#9aa2b8" stroke-width="1"/>
    <path d="M84 161 C88 176 94 192 100 204 C106 192 112 176 116 161" fill="${sh}" stroke="#9aa2b8" stroke-width="1"/><path d="M150 176 C160 184 168 194 172 206" fill="none" stroke="#d8dcea" stroke-width="5"/>`);
  else if(L.shirt2)A(`<path d="M80 163 C88 172 94 178 100 182 C106 178 112 172 120 163" fill="none" stroke="${L.shirt2}" stroke-width="5" stroke-linecap="round"/>`);
  if(L.apron)A(`<path d="${smoothPath([[72,176],[128,176],[132,206],[68,206]])}" fill="#ffffff" stroke="#b8bcc8" stroke-width="1"/>`);
  /* 목 */
  A(`<path d="M88 136 C88 148 87 158 85 166 C94 172 106 172 115 166 C113 158 112 148 112 136 Z" fill="${sk}" stroke="${skLine}" stroke-width=".9"/>
     <path d="M88 140 C94 152 106 152 112 140 L112 136 L88 136 Z" fill="${skS}" opacity=".9"/>`);
  if(P.scarf||L.scarf){const sc=L.scarf||'#3cc06a';A(`<path d="${smoothPath([[74,158],[100,168],[126,158],[132,170],[100,182],[68,170]])}" fill="${sc}" stroke="${shade(sc,-.4)}" stroke-width="1"/>
    <path d="${smoothPath([[112,174],[124,178],[132,200],[118,196]])}" fill="${shade(sc,-.12)}" stroke="${shade(sc,-.4)}" stroke-width="1"/><path d="M78 164 C90 172 110 172 122 164" fill="none" stroke="${shade(sc,.35)}" stroke-width="1.4" opacity=".8"/>`);}
  /* 귀 */
  A(`<path d="M68 96 C60 92 58 104 62 112 C64 116 68 116 69 112" fill="${sk}" stroke="${skLine}" stroke-width=".9"/><path d="M132 96 C140 92 142 104 138 112 C136 116 132 116 131 112" fill="${sk}" stroke="${skLine}" stroke-width=".9"/>`);
  /* 얼굴 + 부드러운 그림자 */
  A(`<path d="${faceD}" fill="${sk}" stroke="${skLine}" stroke-width="1"/>`);
  A(`<g clip-path="url(#${q}fc)"><path d="M130 76 C140 104 132 132 108 150 L140 150 Z" fill="${skS}" opacity=".7" filter="url(#${q}b)"/><ellipse cx="82" cy="96" rx="12" ry="18" fill="${skH}" opacity=".5" filter="url(#${q}b)"/></g>`);
  if(P.age)A(`<path d="M76 124 C78 128 81 130 84 131 M124 124 C122 128 119 130 116 131" fill="none" stroke="${skD}" stroke-width="1" opacity=".55"/>`+(P.age>1?`<path d="M86 74 C94 72 106 72 114 74" fill="none" stroke="${skD}" stroke-width=".9" opacity=".5"/>`:''));
  if(P.beard)A(`<path d="${smoothPath([[68,112],[78,132],[92,146],[100,152],[108,146],[122,132],[132,112],[120,124],[100,128],[80,124]])}" fill="url(#${q}hb)" stroke="${line}" stroke-width=".9"/>
    <path d="M84 134 C88 140 92 144 96 147 M116 134 C112 140 108 144 104 147" fill="none" stroke="${hrL}" stroke-width="1" opacity=".5"/>`);
  /* 홍조 */
  A(`<ellipse cx="80" cy="121" rx="10" ry="5" fill="url(#${q}bl)"/><ellipse cx="120" cy="121" rx="10" ry="5" fill="url(#${q}bl)"/>`);
  /* 눈: 위꺼풀이 홍채를 살짝 덮는 자연스러운 모양 */
  const eye=(cx,f)=>{const cy=106;
    if(P.squint)return`<g class="eye"><path d="${taper([[cx-10,cy+1],[cx-4,cy-4],[cx+4,cy-4],[cx+10,cy+1]],1.4,3.2)}" fill="${lash}"/></g>`;
    const w=P.young?10.5:9.5,h=P.young?11:10,ix=cx+f*.8,id=q+'e'+f;
    const shape=smoothPath([[cx-w,cy-1],[cx-w*.4,cy-h*.95],[cx+w*.5,cy-h*.9],[cx+w,cy-2.5],[cx+w*.55,cy+h*.75],[cx-w*.2,cy+h*.85],[cx-w*.8,cy+h*.45]]);
    return`<g class="eye"><clipPath id="${id}"><path d="${shape}"/></clipPath><path d="${shape}" fill="#fbfcff"/>
      <g clip-path="url(#${id})"><ellipse cx="${ix}" cy="${cy+1.5}" rx="${w*.66}" ry="${h*.92}" fill="url(#${q}ir)"/><ellipse cx="${ix}" cy="${cy+2}" rx="${w*.3}" ry="${h*.45}" fill="${shade(eyeC,-.7)}"/>
        <path d="${smoothPath([[cx-w,cy-h],[cx+w,cy-h],[cx+w,cy-h*.35],[cx,cy-h*.55],[cx-w,cy-h*.35]])}" fill="${shade(eyeC,-.6)}" opacity=".35"/>
        <ellipse cx="${ix-w*.28}" cy="${cy-h*.22}" rx="${w*.2}" ry="${h*.22}" fill="#fff"/><circle cx="${ix+w*.25}" cy="${cy+h*.42}" r="${w*.09}" fill="#fff" opacity=".85"/></g>
      <path d="${taper([[cx-w-1,cy],[cx-w*.45,cy-h-.6],[cx+w*.45,cy-h-.4],[cx+w+1.5,cy-3.5]],2.2,1.2)}" fill="${lash}"/>
      ${P.fem?`<path d="${taper([[cx+f*(w-1),cy-h*.55],[cx+f*(w+3),cy-h*.95],[cx+f*(w+5),cy-h*1.05]],1.6,.4)}" fill="${lash}"/>`:''}
      <path d="M${cx-w*.5} ${cy+h*.95} Q${cx+f} ${cy+h*1.12} ${cx+w*.6} ${cy+h*.78}" fill="none" stroke="${lash}" stroke-width=".7" opacity=".45"/>
      <path d="M${cx-w*.7} ${cy-h-3.5} Q${cx} ${cy-h-6} ${cx+w*.8} ${cy-h-3}" fill="none" stroke="${skD}" stroke-width=".8" opacity=".6"/></g>`;};
  A(`<g class="eyes">${eye(83,-1)}${eye(117,1)}</g>`);
  /* 눈썹 */
  const bw=P.brow==='thick'?3.4:P.brow==='soft'?1.6:2.4,bc=hrS;
  const brow=(cx,f)=>{const y=P.brow==='smug'&&f<0?88:90,lift=P.brow==='thick'?2:0;
    return`<path d="${taper([[cx-f*9,y+1+(f<0?0:lift)],[cx-f*2,y-2.2],[cx+f*9,y+(f<0?lift:0)]],bw,bw*.5)}" fill="${bc}"/>`;};
  A(brow(83,-1)+brow(117,1));
  /* 코: 아주 작게 */
  A(`<path d="M101.5 121 C102.6 123 102 124.6 100 125" fill="none" stroke="${skD}" stroke-width="1.1" stroke-linecap="round"/>`);
  /* 입 */
  const my=P.mous?137:134;
  if(P.mous)A(`<path d="${smoothPath([[86,131],[100,127],[114,131],[108,135],[100,133],[92,135]])}" fill="url(#${q}hb)" stroke="${line}" stroke-width=".8"/>`);
  const closed=P.mouth==='grin'?`<path d="${taper([[92,my-1],[98,my+2.6],[104,my+2.4],[109,my-1.5]],1.6,1.2)}" fill="${lash}"/>`
    :P.mouth==='smile'?`<path d="${taper([[94,my],[100,my+3],[106,my]],1.5,1.5)}" fill="${lash}"/>`
    :`<path d="${taper([[95,my+1],[100,my+2],[105,my+1]],1.3,1.3)}" fill="${lash}"/>`;
  A(`<g class="mc">${closed}</g>`);
  A(`<g class="mo"><path d="${smoothPath([[93,my-.5],[100,my-1.5],[107,my-.5],[105,my+6],[100,my+8],[95,my+6]])}" fill="#9a3040" stroke="${lash}" stroke-width="1"/><path d="${smoothPath([[96,my+5.5],[100,my+3.5],[104,my+5.5],[100,my+7.5]])}" fill="#f08890"/></g>`);
  /* 앞머리 그림자 (이마) */
  if(P.hair!=='old')A(`<g clip-path="url(#${q}fc)"><path d="M60 76 C74 92 88 84 100 90 C112 84 126 92 140 76 L140 50 L60 50 Z" fill="${skS}" opacity=".85" filter="url(#${q}b)"/></g>`);
  /* 정수리 */
  if(P.hair!=='old')A(`<path d="${smoothPath([[60,100],[56,70],[68,40],[100,28],[132,40],[144,70],[140,100],[128,74],[100,64],[72,74]])}" fill="url(#${q}hr)" ${HL}/>`);
  /* 앞머리: 한 덩어리 술 + 끝이 살짝 뾰족한 갈래 (tips: 끝점, 사이사이 홈은 자동) */
  const fringe=(tips,sweep=0,top=46,inner=true)=>{const n=tips.length;let d=`M${tips[0][0]-10} ${top+20}`;const notch=[];
    for(let i=0;i<=n;i++){const a=tips[Math.max(0,i-1)],b=tips[Math.min(n-1,i)];notch.push([(i===0?a[0]-9:i===n?b[0]+9:(a[0]+b[0])/2),(i===0||i===n?top+26:Math.min(a[1],b[1])-12-(i%2)*3)]);}
    d=`M${notch[0][0]} ${notch[0][1]}`;
    for(let i=0;i<n;i++){const N0=notch[i],T=tips[i],N1=notch[i+1];
      d+=` Q${(N0[0]+T[0])/2-sweep*.3} ${(N0[1]+T[1])/2+2} ${T[0]} ${T[1]} Q${(T[0]+N1[0])/2+sweep*.2} ${(T[1]+N1[1])/2-1} ${N1[0]} ${N1[1]}`;}
    d+=` C${notch[n][0]+4} ${top} ${notch[n][0]-6} ${top-14} 100 ${top-16} C${notch[0][0]+6} ${top-14} ${notch[0][0]-4} ${top} ${notch[0][0]} ${notch[0][1]} Z`;
    let out=`<path d="${d}" fill="url(#${q}hr)" ${HL}/>`;
    if(inner)for(const T of tips)out+=`<path d="M${(T[0]+100)/2+sweep*.2} ${top-4} Q${T[0]+sweep*.15} ${(T[1]+top)/2} ${T[0]} ${T[1]-5}" fill="none" stroke="${hrS}" stroke-width="1" opacity=".7"/>`;
    return out;};
  if(P.hair==='boy'){A(`<path d="${lock(64,76,32,98,11,6,.3)}" fill="url(#${q}hr)" ${HL}/><path d="${lock(136,76,32,82,11,-6,.3)}" fill="url(#${q}hr)" ${HL}/>`);
    A(fringe([[70,92],[82,96],[95,90],[107,95],[119,90],[131,92]],8,48));}
  else if(P.hair==='messy'){A(`<path d="${smoothPath([[62,70],[52,40],[70,46],[72,22],[88,36],[100,12],[110,34],[128,20],[128,44],[148,40],[138,70]],true,.25)}" fill="url(#${q}hr)" ${HL}/>`);
    A(`<path d="${lock(62,74,40,100,13,10,.3)}" fill="url(#${q}hr)" ${HL}/><path d="${lock(138,74,40,80,13,-10,.3)}" fill="url(#${q}hr)" ${HL}/>`);
    A(fringe([[66,98],[78,94],[90,100],[103,92],[116,98],[128,92],[138,98]],10,50));}
  else if(P.hair==='neat'){A(`<path d="${lock(64,74,30,96,10,4,.3)}" fill="url(#${q}hr)" ${HL}/><path d="${lock(136,74,30,84,10,-4,.3)}" fill="url(#${q}hr)" ${HL}/>`);
    A(fringe([[68,82],[80,80],[94,76],[108,74],[122,74],[134,80]],-14,48));}
  else if(long){A(`<path d="${lock(66,76,80,95,17,8,.45)}" fill="url(#${q}hr)" ${HL}/><path d="${lock(134,76,80,85,17,-8,.45)}" fill="url(#${q}hr)" ${HL}/>`);
    A(fringe([[68,98],[80,94],[92,90],[108,90],[120,94],[132,98]],0,48));}
  if(P.hair==='old')A(`<path d="${smoothPath([[64,106],[58,86],[64,66],[74,58],[70,76],[70,96]])}" fill="url(#${q}hr)" ${HL}/><path d="${smoothPath([[136,106],[142,86],[136,66],[126,58],[130,76],[130,96]])}" fill="url(#${q}hr)" ${HL}/>
    <path d="M78 54 C90 46 110 46 122 54" fill="none" stroke="${hr}" stroke-width="4" stroke-linecap="round"/><ellipse cx="90" cy="62" rx="10" ry="4" fill="#fff" opacity=".3"/>`);
  /* 머리 광택: 부드러운 띠 */
  if(P.hair!=='old')A(`<path d="M70 56 C84 46 116 46 130 56" fill="none" stroke="${hrH}" stroke-width="3.2" stroke-linecap="round" opacity=".55" filter="url(#${q}b)"/>
     <path d="M80 52 C84 50 88 49 92 48 M108 48 C112 49 116 50 120 52" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`);
  /* 모자 · 소품 */
  if(P.hat==='cap'){const c1=L.hat||'#ffffff',c2=L.hat2||shade(c1,-.3);
    A(`<g clip-path="url(#${q}fc)"><path d="M56 80 C80 74 120 74 146 80 L146 94 C120 86 80 86 56 94 Z" fill="${skD}" opacity=".45" filter="url(#${q}b)"/></g>
      <path d="${smoothPath([[58,78],[60,52],[78,34],[100,30],[122,34],[140,52],[142,78],[100,72]])}" fill="${c1}" stroke="${shade(c1,-.45)}" stroke-width="1"/>
      <path d="M66 62 C70 46 86 38 104 37" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7"/>
      <path d="${smoothPath([[56,78],[100,70],[146,78],[164,86],[150,92],[100,86],[58,86]])}" fill="${c2}" stroke="${shade(c2,-.4)}" stroke-width="1"/>
      <ellipse cx="100" cy="52" rx="8" ry="7" fill="${c2}" stroke="${shade(c2,-.4)}" stroke-width="1"/><ellipse cx="100" cy="52" rx="3.5" ry="3" fill="${c1}"/>`);}
  if(P.hat==='bucket'){const c1=L.hat||'#7a5a2a';A(`<path d="${smoothPath([[64,70],[66,44],[100,32],[134,44],[136,70],[100,66]])}" fill="${c1}" stroke="${shade(c1,-.45)}" stroke-width="1"/>
    <path d="${smoothPath([[38,76],[66,64],[100,62],[134,64],[162,76],[134,84],[100,84],[66,84]])}" fill="${shade(c1,-.1)}" stroke="${shade(c1,-.45)}" stroke-width="1"/><path d="M66 66 C88 62 112 62 134 66" fill="none" stroke="${shade(c1,-.35)}" stroke-width="3"/>`);}
  if(P.hat==='guard')A(`<path d="${smoothPath([[60,70],[62,44],[100,32],[138,44],[140,70],[100,66]])}" fill="#3a4a6a" stroke="#1a2236" stroke-width="1"/><path d="${smoothPath([[56,70],[100,66],[144,70],[150,80],[100,78],[50,80]])}" fill="#26304a" stroke="#1a2236" stroke-width="1"/><circle cx="100" cy="52" r="6" fill="#f2c94c" stroke="#8a6a1a" stroke-width="1"/>`);
  if(P.nursecap)A(`<path d="${smoothPath([[72,54],[78,32],[100,28],[122,32],[128,54],[100,50]])}" fill="#fff" stroke="#c8ccd8" stroke-width="1"/><path d="M96 34 h8 v6 h6 v7 h-6 v6 h-8 v-6 h-6 v-7 h6 Z" fill="#e2566f"/>`);
  if(P.ribbon)A(`<path d="${smoothPath([[130,50],[146,36],[154,48],[146,58]])}" fill="${P.ribbon}" stroke="${shade(P.ribbon,-.4)}" stroke-width="1"/><path d="${smoothPath([[130,50],[134,66],[124,64]])}" fill="${shade(P.ribbon,-.08)}" stroke="${shade(P.ribbon,-.4)}" stroke-width="1"/><circle cx="131" cy="51" r="4" fill="${shade(P.ribbon,-.15)}"/>`);
  if(P.goggles)A(`<path d="M58 66 C80 62 120 62 142 66" fill="none" stroke="#2a2a3a" stroke-width="4"/><ellipse cx="80" cy="60" rx="12" ry="8" fill="#8ad4ff" stroke="#2a3a4a" stroke-width="1.4"/><ellipse cx="120" cy="60" rx="12" ry="8" fill="#8ad4ff" stroke="#2a3a4a" stroke-width="1.4"/><path d="M74 56 l6 -1 M114 56 l6 -1" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
  if(P.glasses==='round')A(`<g fill="none" stroke="#7a5a3a" stroke-width="1.6"><circle cx="83" cy="106" r="13"/><circle cx="117" cy="106" r="13"/><path d="M96 104 Q100 101 104 104"/></g><path d="M74 100 L84 96 M108 100 L118 96" stroke="#fff" stroke-width="2.2" opacity=".5" stroke-linecap="round"/>`);
  if(P.glasses==='rect')A(`<g fill="none" stroke="#2a2a3a" stroke-width="1.6"><rect x="69" y="97" width="28" height="19" rx="5"/><rect x="103" y="97" width="28" height="19" rx="5"/><path d="M97 104 L103 104"/></g><path d="M74 101 L82 99 M108 101 L116 99" stroke="#fff" stroke-width="2.2" opacity=".5" stroke-linecap="round"/>`);
  return`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g class="bob">${o.join('')}</g></svg>`;}
