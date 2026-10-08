/* =========================================================
   portrait.js — 대화창 초상화 (2D 애니메이션 풍 벡터 일러스트)
   LOOK의 색을 그대로 쓰고, 인물마다 머리 모양·소품을 정해 SVG로 그린다.
   눈 깜빡임·말할 때 입 움직임은 CSS 애니메이션.
   ========================================================= */
const POR={
  player:{hair:'spiky',hat:'cap',eye:'#6a3a1a'},
  rival:{hair:'spiky2',eye:'#2a8a5a',scarf:1,brow:'smug'},
  mom:{hair:'long',eye:'#7a4a2a',fem:1},
  prof:{hair:'old',eye:'#4a5a6a',glasses:'round',coat:1,mous:1},
  aide:{hair:'short',eye:'#3a3a5a',glasses:'rect',coat:1},
  kid:{hair:'spiky',hat:'cap',eye:'#5a3a1a'},
  girl:{hair:'twin',eye:'#a04a6a',fem:1,ribbon:'#ff8ab0'},
  lady:{hair:'long',eye:'#6a4ab0',fem:1},
  old:{hair:'old',eye:'#5a4a3a',squint:1,mous:1},
  granny:{hair:'bun',eye:'#5a4a3a',squint:1,fem:1},
  camper:{hair:'short',hat:'bucket',eye:'#5a4a2a'},
  bug:{hair:'spiky',hat:'cap',eye:'#3a3a3a'},
  man:{hair:'short',eye:'#4a3a2a'},
  hiker:{hair:'short',hat:'bucket',eye:'#4a3a2a',beard:1},
  swim:{hair:'short',eye:'#2a5a8a',goggles:1},
  fisher:{hair:'short',hat:'bucket',eye:'#3a4a3a'},
  nurse:{hair:'long',eye:'#c04a7a',fem:1,nursecap:1},
  clerk:{hair:'short',eye:'#3a3a5a'},
  guide:{hair:'short',hat:'guard',eye:'#4a3a2a',beard:1},
  leaderRock:{hair:'short',hat:'bucket',eye:'#3a2a1a',beard:1,brow:'thick'},
  leaderWater:{hair:'long',eye:'#1a7ab8',fem:1,ribbon:'#ffffff'},
  sister:{hair:'pony',eye:'#a05a2a',fem:1}};
let porN=0;
function portraitSVG(key){const L=LOOK[key]||LOOK.man,P=POR[key]||{hair:'short',eye:'#4a3a2a'},id='p'+(++porN);
  const sk=L.skin,skS=shade(sk,-.16),skL=shade(sk,.12),hr=L.hair,hrS=shade(hr,-.32),hrL=shade(hr,.38),ln='#2b2236',sh=L.shirt,shS=shade(sh,-.28),eye=P.eye||'#4a3a2a';
  const o=[];const add=s=>o.push(s);
  add(`<defs><linearGradient id="${id}i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(eye,-.45)}"/><stop offset=".55" stop-color="${eye}"/><stop offset="1" stop-color="${shade(eye,.55)}"/></linearGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hr,.12)}"/><stop offset="1" stop-color="${hrS}"/></linearGradient></defs>`);
  const S=`stroke="${ln}" stroke-width="1.4" stroke-linejoin="round"`;
  /* 뒷머리 */
  if(P.hair==='long'||P.hair==='twin')add(`<path d="M24 40 C22 18 78 18 76 40 L80 84 C70 90 30 90 20 84 Z" fill="url(#${id}h)" ${S}/>`);
  if(P.hair==='twin')add(`<path d="M22 44 C8 52 8 78 16 92 C22 80 22 64 28 54 Z" fill="url(#${id}h)" ${S}/><path d="M78 44 C92 52 92 78 84 92 C78 80 78 64 72 54 Z" fill="url(#${id}h)" ${S}/>`);
  if(P.hair==='pony')add(`<path d="M68 30 C92 30 96 58 86 80 C82 64 78 52 66 44 Z" fill="url(#${id}h)" ${S}/>`);
  if(P.hair==='bun')add(`<circle cx="50" cy="17" r="10" fill="url(#${id}h)" ${S}/>`);
  /* 몸 · 옷 */
  add(`<path d="M10 104 C12 86 28 79 50 79 C72 79 88 86 90 104 Z" fill="${sh}" ${S}/>`);
  add(`<path d="M50 80 C62 80 76 84 84 92 L88 104 L60 104 Z" fill="${shS}" opacity=".55"/>`);
  if(P.coat)add(`<path d="M10 104 C12 86 28 79 42 79 L50 100 L58 79 C72 79 88 86 90 104 Z" fill="#ffffff" ${S}/><path d="M42 79 L50 100 L58 79" fill="none" stroke="${shade('#ffffff',-.25)}" stroke-width="1.2"/><path d="M74 86 L82 104" stroke="#d8dce8" stroke-width="3"/>`);
  if(L.shirt2&&!P.coat)add(`<path d="M38 80 L50 92 L62 80" fill="none" stroke="${L.shirt2}" stroke-width="4"/>`);
  if(L.apron)add(`<path d="M34 86 L66 86 L68 104 L32 104 Z" fill="#ffffff" ${S}/>`);
  /* 목 */
  add(`<path d="M43 64 L43 80 C46 83 54 83 57 80 L57 64 Z" fill="${sk}" ${S}/><path d="M43 68 C47 74 53 74 57 68 L57 64 L43 64 Z" fill="${skS}"/>`);
  if(P.scarf||L.scarf)add(`<path d="M36 76 C44 82 56 82 64 76 L66 84 C56 90 44 90 34 84 Z" fill="${L.scarf||'#3cc06a'}" ${S}/><path d="M58 84 L64 98 L56 96 Z" fill="${L.scarf||'#3cc06a'}" ${S}/>`);
  /* 귀 · 얼굴 */
  add(`<ellipse cx="28.5" cy="49" rx="4" ry="5.5" fill="${sk}" ${S}/><ellipse cx="71.5" cy="49" rx="4" ry="5.5" fill="${sk}" ${S}/>`);
  add(`<path d="M28 38 C28 20 72 20 72 38 L72 49 C72 61 62 70 50 73 C38 70 28 61 28 49 Z" fill="${sk}" ${S}/>`);
  add(`<path d="M28 44 C30 58 38 67 50 70 C42 64 34 56 31 44 Z" fill="${skL}" opacity=".6"/>`);
  /* 수염(턱) */
  if(P.beard)add(`<path d="M30 52 C32 66 42 74 50 76 C58 74 68 66 70 52 C66 60 60 64 50 64 C40 64 34 60 30 52 Z" fill="${hr}" ${S}/><path d="M40 62 C46 60 54 60 60 62" fill="none" stroke="${hrS}" stroke-width="1.2"/>`);
  /* 볼 */
  add(`<ellipse cx="36" cy="58" rx="5" ry="2.6" fill="#ff8a9a" opacity=".42"/><ellipse cx="64" cy="58" rx="5" ry="2.6" fill="#ff8a9a" opacity=".42"/>`);
  /* 눈 */
  const eyeG=(cx,f)=>{if(P.squint)return`<path d="M${cx-6} 50 Q${cx} ${45} ${cx+6} 50" fill="none" stroke="${ln}" stroke-width="2.2" stroke-linecap="round"/>`;
    const lash=P.fem?`<path d="M${cx+f*6.5} 44.5 l${f*3} -2.2" stroke="${ln}" stroke-width="1.6" stroke-linecap="round"/>`:'';
    return`<g class="eye"><ellipse cx="${cx}" cy="50.5" rx="5.4" ry="6.4" fill="#ffffff"/>
      <ellipse cx="${cx+f*.6}" cy="51.2" rx="3.9" ry="5.4" fill="url(#${id}i)"/><ellipse cx="${cx+f*.6}" cy="51.6" rx="1.9" ry="2.9" fill="${shade(eye,-.7)}"/>
      <circle cx="${cx-1.6}" cy="48.6" r="1.6" fill="#ffffff"/><circle cx="${cx+1.6}" cy="53.6" r=".8" fill="#ffffff" opacity=".9"/>
      <path d="M${cx-6.2} 46.4 Q${cx} 41.6 ${cx+6.6} 45.6" fill="none" stroke="${ln}" stroke-width="2.6" stroke-linecap="round"/>${lash}</g>`;};
  add(`<g class="eyes">${eyeG(39,-1)}${eyeG(61,1)}</g>`);
  /* 눈썹 */
  const bw=P.brow==='thick'?2.6:1.5,by=P.brow==='smug'?[39,37.5]:[39.5,39.5];
  add(`<path d="M33 ${by[0]} Q39 ${by[0]-2.6} 45 ${by[0]-.6}" fill="none" stroke="${hrS}" stroke-width="${bw}" stroke-linecap="round"/><path d="M55 ${by[1]-.6} Q61 ${by[1]-2.6} 67 ${by[1]}" fill="none" stroke="${hrS}" stroke-width="${bw}" stroke-linecap="round"/>`);
  /* 코 · 입 */
  add(`<path d="M50.5 55 L49.4 58.2 L51 58.4" fill="none" stroke="${skS}" stroke-width="1.1" stroke-linecap="round"/>`);
  if(P.mous)add(`<path d="M42 61 C46 59 54 59 58 61 C55 63.5 45 63.5 42 61 Z" fill="${shade(hr,-.05)}" ${S} stroke-width="1"/>`);
  add(`<g class="mc"><path d="M46.5 ${P.mous?64.5:63} Q50 ${P.mous?66.5:65.2} 53.5 ${P.mous?64.5:63}" fill="none" stroke="${ln}" stroke-width="1.4" stroke-linecap="round"/></g>`);
  add(`<g class="mo"><path d="M46 ${P.mous?64:62.4} Q50 ${P.mous?62.8:61.6} 54 ${P.mous?64:62.4} Q53 ${P.mous?68.5:67.2} 50 ${P.mous?68.8:67.4} Q47 ${P.mous?68.5:67.2} 46 ${P.mous?64:62.4} Z" fill="#9a2a3a" stroke="${ln}" stroke-width="1.1"/><path d="M47.6 ${P.mous?67.2:66} Q50 ${P.mous?65.6:64.4} 52.4 ${P.mous?67.2:66}" fill="#ff8a8a"/></g>`);
  /* 머리 그림자(앞머리 아래) */
  if(P.hair!=='old')add(`<path d="M29 40 C36 46 44 42 50 45 C56 42 64 46 71 40 L71 36 L29 36 Z" fill="${skS}" opacity=".55"/>`);
  /* 앞머리 */
  const hs=`fill="url(#${id}h)" ${S}`;
  if(P.hair==='spiky')add(`<path d="M24 42 C20 18 40 10 52 12 C66 12 82 20 76 42 L72 34 L68 44 L62 33 L57 43 L51 31 L45 43 L40 32 L34 44 L30 34 Z" ${hs}/>`);
  else if(P.hair==='spiky2')add(`<path d="M22 44 C16 14 44 6 58 10 C72 12 86 24 78 44 L74 36 L72 46 L64 32 L60 44 L52 28 L46 42 L40 30 L36 44 L30 34 L26 46 Z" ${hs}/><path d="M60 10 L70 2 L66 14 Z" ${hs}/>`);
  else if(P.hair==='short')add(`<path d="M25 42 C22 18 40 12 52 13 C66 13 80 20 75 42 L71 36 C66 30 60 34 56 30 C50 36 42 33 36 36 C32 36 29 38 25 42 Z" ${hs}/>`);
  else if(P.hair==='long'||P.hair==='twin'||P.hair==='pony'||P.hair==='bun')add(`<path d="M24 50 C18 18 44 10 54 12 C70 13 84 24 76 50 L72 40 C68 34 62 30 58 26 C54 34 44 38 34 38 C30 40 28 44 26 52 Z" ${hs}/>
    <path d="M28 40 C26 52 27 62 30 70 C32 60 32 50 34 42 Z" ${hs}/><path d="M72 40 C74 52 73 62 70 70 C68 60 68 50 66 42 Z" ${hs}/>`);
  else if(P.hair==='old')add(`<path d="M27 46 C24 34 28 26 34 24 C32 32 32 38 31 46 Z" fill="${hr}" ${S}/><path d="M73 46 C76 34 72 26 66 24 C68 32 68 38 69 46 Z" fill="${hr}" ${S}/><path d="M36 22 C44 17 56 17 64 22" fill="none" stroke="${hr}" stroke-width="2.4" stroke-linecap="round"/>`);
  if(P.hair!=='old')add(`<path d="M34 20 C42 15 56 15 64 19" fill="none" stroke="${hrL}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/><path d="M40 24 L44 22" stroke="${hrL}" stroke-width="1.6" stroke-linecap="round"/>`);
  /* 모자 · 소품 */
  if(P.hat==='cap'){const c1=L.hat||'#ffffff',c2=L.hat2||shade(c1,-.3);add(`<path d="M24 34 C22 12 78 12 76 34 Z" fill="${c1}" ${S}/><path d="M24 34 C40 30 60 30 76 34 C80 38 82 40 84 40 C64 44 36 44 24 38 Z" fill="${c2}" ${S}/><circle cx="50" cy="23" r="4.2" fill="${c2}" ${S}/>`);}
  if(P.hat==='bucket'){const c1=L.hat||'#7a5a2a';add(`<path d="M28 32 C28 12 72 12 72 32 Z" fill="${c1}" ${S}/><path d="M16 36 C30 28 70 28 84 36 C70 40 30 40 16 36 Z" fill="${shade(c1,-.18)}" ${S}/><path d="M29 29 L71 29" stroke="${shade(c1,-.35)}" stroke-width="2.4"/>`);}
  if(P.hat==='guard')add(`<path d="M26 32 C26 14 74 14 74 32 Z" fill="#3a4a6a" ${S}/><path d="M24 32 L76 32 L80 38 L22 38 Z" fill="#2a3450" ${S}/><circle cx="50" cy="24" r="3.4" fill="#f2c94c" ${S}/>`);
  if(P.nursecap)add(`<path d="M34 22 L66 22 L62 10 L38 10 Z" fill="#ffffff" ${S}/><path d="M48 12 h4 v3 h3 v4 h-3 v3 h-4 v-3 h-3 v-4 h3 Z" fill="#e2566f"/>`);
  if(P.ribbon)add(`<path d="M66 22 L76 14 L78 26 Z M66 22 L72 32 L62 30 Z" fill="${P.ribbon}" ${S}/><circle cx="67" cy="23" r="2.6" fill="${shade(P.ribbon,-.2)}" ${S}/>`);
  if(P.goggles)add(`<path d="M28 30 L72 30" stroke="#2a2a3a" stroke-width="3"/><rect x="33" y="25" width="13" height="9" rx="4" fill="#7fd0ff" ${S}/><rect x="54" y="25" width="13" height="9" rx="4" fill="#7fd0ff" ${S}/>`);
  if(P.glasses==='round')add(`<g fill="none" stroke="#5a4a3a" stroke-width="1.6"><circle cx="39" cy="51" r="8"/><circle cx="61" cy="51" r="8"/><path d="M47 50 Q50 48 53 50"/></g>`);
  if(P.glasses==='rect')add(`<g fill="none" stroke="#2a2a3a" stroke-width="1.6"><rect x="31" y="45" width="16" height="11" rx="3"/><rect x="53" y="45" width="16" height="11" rx="3"/><path d="M47 50 L53 50"/></g>`);
  return`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g class="bob">${o.join('')}</g></svg>`;}
