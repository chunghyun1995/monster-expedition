// 기존 웹 게임의 데이터(src/data.js, src/maps.js, src/gfx.js의 외형 목록)를 Godot용 JSON으로 내보낸다.
// 사용법: node tools/godot-data.cjs  → godot/data/game.json
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),src=f=>fs.readFileSync(path.join(root,'src',f),'utf8');
// 정의되지 않은 이름은 아무 일도 하지 않는 함수로 대신한다(지도 안의 이벤트 함수는 실행하지 않음)
const stub=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':stub,apply:()=>stub});
const ctx=vm.createContext(new Proxy({console,Math,JSON,Object,Array,String,Number,Set,Map,Date},
  {has:()=>true,get:(t,k)=>k in t?t[k]:k===Symbol.unscopables?undefined:stub,set:(t,k,v)=>{t[k]=v;return true;}}));
const run=code=>vm.runInContext(code.replace(/^(const|let) /gm,'var '),ctx);
run(src('data.js'));run('var MAPS={};'+src('maps.js'));
const gfx=src('gfx.js'),lookBlock=gfx.slice(gfx.indexOf('const LOOK={'),gfx.indexOf('};',gfx.indexOf('const LOOK={')));
const looks=[...lookBlock.matchAll(/^\s*([a-zA-Z]+):\{hair/gm)].map(m=>m[1]);
const pick=(o,ks)=>Object.fromEntries(ks.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
const mapOut=id=>{const m=ctx.MAPS[id];return{id,name:m.name,bg:m.bg,rows:m.rows,links:m.links||{},enc:m.enc||[],signs:m.signs||{},warps:m.warps||{},
  items:(m.items||[]).map(i=>pick(i,['x','y','item','n','flag'])),
  npcs:m.npcs.filter(n=>!n.mon).map(n=>({...pick(n,['id','x','y','dir','look','name','wander','text']),trainer:n.trainer?pick(n.trainer,['cls','name','team','intro','lose','after']):undefined}))};};
const sp={};for(const[k,v]of Object.entries(ctx.SP))sp[k]=pick(v,['n','t','b','x','c','ls','ev','st','cat','h','w','d','human','legend']);
const out={types:ctx.TYPES,chart:ctx.CHART,moves:ctx.MV,species:sp,natures:ctx.NATURES,items:ctx.ITEMS,tclass:ctx.TCLASS,looks,
  maps:{town:mapOut('town'),route1:mapOut('route1')}};
fs.writeFileSync(path.join(root,'godot/data/game.json'),JSON.stringify(out));
console.log('species',Object.keys(sp).length,'moves',Object.keys(out.moves).length,'looks',looks.length,'maps',Object.keys(out.maps),
  'town npcs',out.maps.town.npcs.length,'route1 npcs',out.maps.route1.npcs.length);
