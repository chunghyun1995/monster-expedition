/* =========================================================
   mon.js — 몬스터 개체 생성·능력치 계산
   ========================================================= */
const N=m=>m.nick||SP[m.sid].n;
const expFor=l=>l<=1?0:l*l*l;
function calc(m){const b=SP[m.sid].b,L=m.lv,iv=m.iv,nat=NATURES[m.nat];const s=[Math.floor((2*b[0]+iv[0])*L/100)+L+10];
  for(let i=1;i<6;i++){let v=Math.floor((2*b[i]+iv[i])*L/100)+5;if(nat[1]===i&&nat[2]!==i)v=Math.floor(v*1.1);if(nat[2]===i&&nat[1]!==i)v=Math.floor(v*.9);s.push(v);}
  return s;}
const maxHp=m=>calc(m)[0];
function makeMon(sid,lv,o={}){const known=[];
  for(const[l,id]of SP[sid].ls)if(l<=lv){const i=known.indexOf(id);if(i>=0)known.splice(i,1);known.push(id);}
  const m={sid,lv,exp:expFor(lv),nick:'',moves:known.slice(-4).map(id=>({id,pp:MV[id].pp})),iv:[...Array(6)].map(()=>rnd(32)),
    nat:rnd(NATURES.length),shiny:o.shiny!=null?o.shiny:rnd(256)===0,st:'',slp:0,hp:1,uid:Date.now().toString(36)+rnd(1e6).toString(36),
    met:o.met||null,ot:o.ot||null};
  if(o.iv)m.iv=o.iv;m.hp=maxHp(m);return m;}
function healMon(m){m.hp=maxHp(m);m.st='';m.slp=0;m.moves.forEach(x=>x.pp=MV[x.id].pp);}
const hpColor=p=>p>50?'#3ccf5a':p>20?'#f2c230':'#e8473b';
const hpBar=(hp,max)=>{const p=clamp(hp/max*100,0,100);return`<div class="hpb"><i style="width:${p}%;background:${hpColor(p)}"></i></div>`;};
const typesHtml=sid=>SP[sid].t.map(tb).join(' ');
