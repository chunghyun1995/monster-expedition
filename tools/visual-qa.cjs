const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(process.env.ART_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa');fs.mkdirSync(out,{recursive:true});
async function main(){const errors=[],server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'text/plain');res.end(b);});});
 await new Promise(r=>server.listen(8125,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage({viewport:{width:900,height:1100}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8125');await page.waitForFunction(()=>typeof ART!=='undefined'&&ART.ready);await page.waitForTimeout(600);
 await page.screenshot({path:path.join(out,'01-title.png')});
 const stats=await page.evaluate(()=>({assets:Object.keys(ART.images).length,mons:Object.keys(SP).filter(k=>!SP[k].human).length,actors:ART_LOOK.length,canvas:topC.width}));assert.equal(stats.assets,8);assert.equal(stats.canvas,1024);
 await page.evaluate(()=>{newGameData('탐험가');G.party=[makeMon(1,12),makeMon(4,12),makeMon(7,12)];G.flags.starter=1;G.flags.shoes=1;state='world';busy=false;clearPages(TOP);clearPages(BOT);hideMsg();enterMap('home',7,3,'down',{quiet:true});Pad.el=null;Pad.show();});
 await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'02-room.png')});
 const maps=await page.evaluate(()=>Object.values(MAPS).filter(m=>m.out).map(m=>({id:m.id,spot:(()=>{for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++)if(tileAt(m,x,y)==='.'&&tileAt(m,x+1,y)==='.')return[x,y];return[1,1];})()})));
 for(const m of maps){await page.evaluate(({id,spot})=>enterMap(id,...spot,'down',{quiet:true}),m);await page.waitForTimeout(40);}assert(maps.length>5);
 const first=maps[0];await page.evaluate(({id,spot})=>enterMap(id,...spot,'right',{quiet:true}),first);await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'03-field.png')});
 const movement=await page.evaluate(async()=>{const x=P.x;await walkPlayer(['right'],240);return P.x-x;});assert.equal(movement,1);
 await page.evaluate(()=>{SET.tips=false;busy=true;G.party=[makeMon(1,12)];battle({kind:'wild',team:[[4,10]],bg:'grass'});});await page.waitForTimeout(5500);
 // Skip the dialogue gate to directly verify every move renderer with real B.
 await page.evaluate(()=>{hideMsg();B.p.show=B.e.show=true;B.ptr.show=B.etr.show=false;B.slide=1;B.e.dark=false;});await page.screenshot({path:path.join(out,'04-battle.png')});
 const moves=await page.evaluate(async()=>{SET.anim=true;const ids=Object.keys(MOVE_FX);for(const id of ids){if(!MV[id])continue;await animMove('p',{...MV[id],id},false);}return ids.length;});assert(moves>=40);
 await page.reload();await page.waitForFunction(()=>ART.ready);
 await page.evaluate(()=>{newGameData('탐험가');G.party=[makeMon(1,12),makeMon(4,12),makeMon(7,12)];G.flags.pad=1;G.flags.starter=1;SET.tips=false;state='world';busy=false;clearPages(TOP);clearPages(BOT);hideMsg();enterMap('home',7,3,'down',{quiet:true});Pad.el=null;Pad.show();});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'05-mobile.png')});
 await page.setViewportSize({width:1080,height:1920});await page.evaluate(()=>{const m=Object.values(MAPS).find(m=>m.out);enterMap(m.id,Math.floor(m.w/2),Math.floor(m.h/2),'down',{quiet:true});});await page.waitForTimeout(100);await page.screenshot({path:path.join(root,'store/screenshots/02-field.png')});
 await page.evaluate(()=>{G.party=[makeMon(1,12),makeMon(4,12),makeMon(7,12)];partyScreen('view');});await page.waitForTimeout(100);await page.screenshot({path:path.join(root,'store/screenshots/08-party.png')});
 // New offline context: image decode must succeed without any remote request.
 const offline=await browser.newPage();await offline.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:8125')?route.continue():route.abort());await offline.goto('http://127.0.0.1:8125');await offline.waitForFunction(()=>ART.ready);assert.equal(await offline.evaluate(()=>Object.keys(ART.images).length),8);await offline.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({stats,outdoorMaps:maps.length,movement,moves,offline:true,errors},null,2));console.log(JSON.stringify({stats,outdoorMaps:maps.length,movement,moves,offline:true,errors}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
