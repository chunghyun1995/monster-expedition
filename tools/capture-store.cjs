const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require(process.env.ART_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'store/screenshots');
async function main(){const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
 try{const page=await browser.newPage({viewport:{width:1080,height:1920}});await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>ART.ready);await page.waitForTimeout(300);await page.screenshot({path:path.join(dir,'01-title.png')});
 await page.evaluate(()=>{newGameData('탐험가');G.flags.pad=G.flags.starter=G.flags.shoes=1;G.party=[makeMon(1,12),makeMon(4,12),makeMon(7,12)];SET.tips=false;clearPages(TOP);clearPages(BOT);hideMsg();state='world';enterMap('town',12,12,'down',{quiet:true});Pad.el=null;Pad.app=1;Pad.show();});await page.waitForTimeout(100);await page.screenshot({path:path.join(dir,'02-field.png')});
 await page.evaluate(()=>{enterMap('home',7,3,'down',{quiet:true});});await page.waitForTimeout(100);await page.screenshot({path:path.join(dir,'04-room.png')});
 await page.evaluate(()=>{battle({kind:'wild',team:[[4,10]],bg:'grass'});});await page.waitForTimeout(6500);await page.screenshot({path:path.join(dir,'03-battle.png')});
 await page.reload();await page.waitForFunction(()=>ART.ready);await page.evaluate(()=>{newGameData('탐험가');G.flags.pad=G.flags.starter=1;G.party=[makeMon(1,12),makeMon(4,12),makeMon(7,12)];SET.tips=false;clearPages(TOP);clearPages(BOT);hideMsg();state='world';enterMap('town',12,12,'down',{quiet:true});Pad.el=null;Pad.show();busy=true;partyScreen('field');});await page.waitForTimeout(200);await page.screenshot({path:path.join(dir,'08-party.png')});console.log('Captured 5 current game screenshots');
 }finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
