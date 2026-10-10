// 기존 웹 게임의 데이터(src/data.js, maps.js, maps2.js, postgame.js, npcfight.js, gfx.js의 외형 목록)를 Godot용 JSON으로 내보낸다.
// 지도 안의 이벤트 함수(talk·cond·sight·trig·obj)는 내보내지 않고 "있음" 표시만 남긴다 → Godot 쪽 scripts/events.gd 에서 같은 내용을 GDScript로 구현.
// 사용법: node tools/godot-data.cjs  → godot/data/game.json
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),src=f=>fs.readFileSync(path.join(root,'src',f),'utf8');
// 정의되지 않은 이름은 아무 일도 하지 않는 함수로 대신한다(이벤트 함수는 실행하지 않음)
const stub=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':stub,apply:()=>stub});
const ctx=vm.createContext(new Proxy({console,Math,JSON,Object,Array,String,Number,Set,Map,Date,RegExp},
  {has:()=>true,get:(t,k)=>k in t?t[k]:k===Symbol.unscopables?undefined:stub,set:(t,k,v)=>{t[k]=v;return true;}}));
const run=code=>vm.runInContext(code.replace(/^(const|let) /gm,'var '),ctx);
run(src('data.js'));run('var MAPS={};'+src('maps.js'));run(src('maps2.js'));run(src('postgame.js'));run(src('npcfight.js'));
const gfx=src('gfx.js'),lookBlock=gfx.slice(gfx.indexOf('const LOOK={'),gfx.indexOf('};',gfx.indexOf('const LOOK={')));
const looks=[...lookBlock.matchAll(/^\s*([a-zA-Z]+):\{hair/gm)].map(m=>m[1]);
const pick=(o,ks)=>Object.fromEntries(ks.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
const fn=v=>typeof v==='function';
const mapOut=m=>{
  const obj={};for(const[k,v]of Object.entries(m.obj||{}))obj[k]=fn(v)?'@fn':v;
  return{...pick(m,['id','name','out','music','bg','region','rows','floor','wall','pal']),links:m.links||{},enc:m.enc||[],signs:m.signs||{},warps:m.warps||{},obj,
    items:(m.items||[]).map(i=>pick(i,['x','y','item','n','flag'])),
    trig:(m.trig||[]).map(t=>({...pick(t,['x','y','w','h']),cond:fn(t.cond)})),
    npcs:m.npcs.map(n=>({...pick(n,['id','x','y','dir','look','name','wander','text','mon']),talk:fn(n.talk),cond:fn(n.cond),sight:fn(n.sight),
      trainer:n.trainer?pick(n.trainer,['cls','name','team','intro','lose','after']):undefined}))};};
const sp={};for(const[k,v]of Object.entries(ctx.SP))sp[k]=pick(v,['n','t','b','x','c','ls','ev','st','line','cat','h','w','d','human','legend']);
const maps={};for(const[id,m]of Object.entries(ctx.MAPS))maps[id]=mapOut(m);
const out={types:ctx.TYPES,chart:ctx.CHART,moves:ctx.MV,species:sp,natures:ctx.NATURES,items:ctx.ITEMS,pockets:ctx.POCKETS,tclass:ctx.TCLASS,looks,
  stn:ctx.STN,status:ctx.STATUS,catn:ctx.CATN,human_sid:ctx.HUMAN_SID,
  fight:{npc:ctx.FIGHT,role:ctx.FIGHT_ROLE,cls:ctx.FIGHT_CLASS,look:ctx.FIGHT_LOOK,subst:ctx.SUBST,refuse:ctx.SUBST_REFUSE},
  maps};
fs.writeFileSync(path.join(root,'godot/data/game.json'),JSON.stringify(out));
console.log('species',Object.keys(sp).length,'moves',Object.keys(out.moves).length,'looks',looks.length,'maps',Object.keys(maps).length,
  'npcs',Object.values(maps).reduce((s,m)=>s+m.npcs.length,0));
