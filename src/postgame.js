/* =========================================================
   postgame.js — 엔딩 이후 콘텐츠
   1) 전설의 몬스터: 하늘봉 장로의 이야기 → 세 수호신의 동굴 → 정상의 천공신
   2) 무한의 탑: 1~100층, 수호자 몬스터 레벨 = 층수, 10층마다 체크포인트·보상
   ========================================================= */

/* ------------------------------ 전설의 몬스터 ------------------------------ */
const LEGENDS=[{sid:31,map:'crater',where:'붉은재 화산길(3번 도로)의 절벽 동굴'},{sid:32,map:'spring',where:'4번 도로 강물이 시작되는 수원 동굴'},{sid:33,map:'storm',where:'5번 산길의 폭풍 봉우리 동굴'}];
function shrine(id,name,legend,out,ox,oy,o){defMap(id,{name,music:'gym',bg:o.bg,floor:o.floor,wall:o.wall,region:o.region,rows:o.rows,
  warps:{'5,9':[out,ox,oy,'down']},
  obj:{'2,4':[o.stone],'8,4':[o.stone]},
  npcs:[{id:'leg'+legend,x:5,y:3,dir:'down',mon:legend,name:SP[legend].n,cond:()=>!G.flags['cap'+legend],talk:()=>legendBattle(legend,50,o.bg)}]});}
shrine('crater','화산 분화구 동굴',31,'route3',3,13,{bg:'rock',floor:'stone',wall:'#5a2a1a',region:'route3',stone:'"불의 수호신, 붉은 산의 심장에 잠들다"라고 새겨져 있다.',
  rows:['wwwwwwwwwww','wwwwwwwwwww','%%%%...%%%%','%%.......%%','%.Y.....Y.%','%..%...%..%','%.........%','%%.......%%','%%%%...%%%%','%%%%%m%%%%%']});
shrine('spring','수원 동굴',32,'route4',11,1,{bg:'water',floor:'pool',wall:'#2a5a8a',region:'route4',stone:'"물의 수호신, 모든 강의 첫 물방울을 지키다"라고 새겨져 있다.',
  rows:['wwwwwwwwwww','wwwwwwwwwww','~~~~...~~~~','~~.......~~','~.Y.....Y.~','~..~...~..~','~.........~','~~.......~~','~~~~...~~~~','~~~~~m~~~~~']});
shrine('storm','폭풍 봉우리 동굴',33,'route5',3,15,{bg:'rock',floor:'stone',wall:'#3a3a5a',region:'route5',stone:'"번개의 수호신, 먹구름의 왕좌에 앉다"라고 새겨져 있다.',
  rows:['wwwwwwwwwww','wwwwwwwwwww','RRRR...RRRR','RR.......RR','R.Y.....Y.R','R..R...R..R','R.........R','RR.......RR','RRRR...RRRR','RRRRRmRRRRR']});
async function elderTalk(){const o={name:'하늘봉 장로'};const F=G.flags;
  if(!F.legendQuest){
    await say('오오, 정상에서의 승부, 잘 보았네. 자네라면 이 이야기를 들려줘도 되겠군.',o);
    await say('먼 옛날, 하늘의 신 천공신이 이 지방을 만들고 세 수호신에게 땅을 맡겼다네.',o);
    await say('불의 염화룡, 물의 심해왕, 번개의 자계수... 세 수호신은 지금도 깊은 동굴에서 잠들어 있지.',o);
    await say('세 수호신을 모두 깨우면, 천공신이 이 정상에 다시 모습을 드러낸다고 전해진다네.',o);
    for(const L of LEGENDS)await say(`${SP[L.sid].n}: ${L.where}`,o);
    await say('동굴 입구는 이제 자네에게 열릴 걸세. 수호신들은 아주 강하니, 심층 공명등을 넉넉히 챙겨 가게.',o);
    F.legendQuest=1;await giveItem('hyper',3);sfx('sparkle');return;}
  const left=LEGENDS.filter(L=>!F['awake'+L.sid]);
  if(left.length){await say(`아직 깨어나지 않은 수호신이 ${left.length}마리 남았네.`,o);for(const L of left)await say(`${SP[L.sid].n}: ${L.where}`,o);return;}
  if(!F.cap34){await say('세 수호신이 모두 깨어났군! 하늘이 울리고 있어... 정상으로 가 보게!',o);return;}
  await say('천공신과 함께하는 원정가라니... 살아서 이런 날을 보게 될 줄이야.',o);
  await say('남쪽 무한의 탑에서 자네의 힘을 더 시험해 보는 것도 좋겠지.',o);}
async function legendBattle(sid,lv,bg){const s=SP[sid];
  await say(sid===34?'구름이 갈라지며 거대한 그림자가 내려왔다...!':`${J(s.n,'이')} 깊은 잠에서 깨어나 이쪽을 노려본다...!`);cry(sid);await sleep(500);
  const r=await battle({kind:'wild',team:[[sid,lv]],bg,music:'leader',legend:1});
  if(state!=='world'||r==='lose')return;
  const first=!G.flags['awake'+sid];G.flags['awake'+sid]=1;
  if(r==='caught'){G.flags['cap'+sid]=1;await say(`${J(s.n,'이')} ${G.name}의 동료가 되었다!`);}
  else if(r==='win')await say(`${J(s.n,'은')} 쓰러졌지만 그 기운은 사라지지 않았다... 다시 찾아오면 또 만날 수 있을 것 같다.`);
  else await say(`${J(s.n,'은')} 아직 이곳에서 기다리고 있다.`);
  if(first&&sid!==34&&LEGENDS.every(L=>G.flags['awake'+L.sid])){sfx('shake');await say('...!');await say('멀리 하늘봉 쪽에서 천둥 같은 울림이 들려왔다! 세 수호신이 모두 깨어났다!');}}

/* ------------------------------ 무한의 탑 ------------------------------ */
defMap('towerLobby',{name:'무한의 탑 로비',music:'center',bg:'lab',floor:'tile',wall:'#d8d0f0',region:'town5',
  rows:['wwwwwwwwwww','wwwwwwwwwww','p...h.....p','...........','.Y.......Y.','...........','...........','p.........p','...........','.....m.....'],
  warps:{'5,9':['town5',20,4,'down']},
  obj:{'1,4':()=>towerRecord(),'9,4':()=>towerRecord(),'4,2':['회복 장치가 반짝이고 있다.']},
  npcs:[{id:'tw_rec',x:5,y:3,dir:'down',look:'aide',name:'탑 안내원',talk:()=>towerMenu()}]});
defMap('towerFloor',{name:'무한의 탑',music:'gym',bg:'lab',floor:'lab',wall:'#4a3a6a',region:'town5',
  rows:['wwwwwwwwwww','wwwwwwwwwww','SSSSYuYSSSS','p...Y.Y...p','...........','...........','...........','...........','...........','.....m.....'],
  warps:{'5,9':['towerLobby',5,8,'up']},
  trig:[{x:5,y:2,w:1,h:1,run:()=>towerNext()}],
  npcs:[{id:'tw_guard',x:5,y:3,dir:'down',look:'man',name:'탑의 수호자',talk:()=>towerFight()}]});
const TOWER_LOOKS=['man','hiker','camper','lady','swim','fisher','girl','kid','bug','villain'];
function towerState(){return G.tower||(G.tower={best:0,cur:0});}
function towerTeam(f){const R=rng(f*9973+7),pick=a=>a[Math.floor(R()*a.length)];
  if(f===100)return[[31,100],[32,100],[33,100],[6,100],[3,100],[9,100]];
  const n=f<10?1:f<25?2:f<50?3:f<80?4:5,all=Object.keys(SP).map(Number).filter(s=>!SP[s].legend&&!SP[s].human&&s!==13);
  const st=()=>{const r=R();if(f<16)return 0;if(f<36)return r<.6?0:1;if(f<70)return r<.6?1:2;return r<.25?1:2;};
  const team=[];for(let i=0;i<n;i++){const want=st();const pool=all.filter(s=>SP[s].st===want);team.push([pick(pool),f]);}
  if(f%10===0&&f<100)team[team.length-1]=[pick(all.filter(s=>SP[s].st===2)),f];
  return team;}
async function towerRecord(){const t=towerState();await say(`기록판: ${G.name}의 최고 기록은 ${t.best}층이다.${G.flags.towerClear?' (100층 정복!)':''}`);}
async function towerMenu(){const o={name:'탑 안내원'},t=towerState();
  if(!G.flags.towerIntro){G.flags.towerIntro=1;
    await say('무한의 탑에 오신 걸 환영합니다! 이 탑은 100층까지 이어져 있어요.',o);
    await say('층마다 수호자가 기다리고, 수호자의 몬스터 레벨은 층수와 같아요. 100층은 레벨 100이랍니다!',o);
    await say('10층을 돌파할 때마다 몬스터가 회복되고 보상을 받아요. 다음에는 돌파한 10층 단위부터 다시 도전할 수 있어요.',o);
    await say('도중에 지면 이 로비로 돌아오게 되지만, 돈을 잃지는 않으니 안심하세요!',o);}
  const top=Math.min(91,Math.floor(t.best/10)*10+1),cps=[];for(let f=1;f<=top;f+=10)cps.push(f);
  cps.reverse();const items=[...cps.map(f=>({html:`<span>${f}층부터 도전</span><span class="r">${f===1?'처음부터':'체크포인트'}</span>`})),...cps.map(f=>({html:`<span>${f}층부터 자동 등반</span><span class="r">AUTO</span>`})),{html:'<span>그만두기</span>'}];
  const tp=page(TOP,`<div class="abs" style="inset:0;background:linear-gradient(#3a2a6a,#1d1a3a)"></div><div class="title-bar">무한의 탑<span class="r">최고 기록 ${t.best}층</span></div>
    <div class="sheet desc" style="left:${U(14)};top:${U(30)};width:${U(228)}">수호자의 몬스터 레벨 = 층수<br>10층마다 회복 + 보상 · 체크포인트<br>100층 수호자: 레벨 100 몬스터 6마리</div>`);
  const r=await list(items,{rect:[4,4,248,150],rowH:20,backdrop:true,bg:'linear-gradient(#6a5aa8,#3d3270)',buttons:[{html:'닫기',x:170,y:160,w:82,h:28,cls:'dark',val:-1}]});
  tp.remove();if(r<0||r>=cps.length*2){await say('또 오세요!',o);return;}
  const auto=r>=cps.length,f=cps[auto?r-cps.length:r];if(auto){AUTO.climb=true;updFloat(true);}if(!G.party.some(m=>m.hp>0)){await say('먼저 몬스터를 회복시켜 주세요.',o);return;}
  await say('도전 전에 몬스터들을 회복시켜 드릴게요.',o);healParty();sfx('heal');
  if(auto){await say(`${f}층부터 자동으로 올라갈게요. 지거나 '자동 중지'를 누르면 멈춰요.`,o);await autoClimb(f);return;}
  await say(`그럼 ${f}층으로 안내할게요. 행운을 빌어요!`,o);await towerEnter(f);}
async function towerEnter(f){const t=towerState();t.cur=f;const m=MAPS.towerFloor;m.name=`무한의 탑 ${f}층`;
  m.npcs[0].look=f===100?'boss':f%10===0?'villain':TOWER_LOOKS[f%TOWER_LOOKS.length];m.npcs[0].name=`${f}층 수호자`;
  m.music=f%10===0?'leader':'gym';
  await fadeTo(1);enterMap('towerFloor',5,8,'up',{sign:1});await fadeTo(0);}
async function towerFight(){const t=towerState(),f=t.cur,n=npcById('tw_guard'),o={name:`${f}층 수호자`};
  await say(f===100?'...여기까지 올라온 자는 처음이다. 마지막 시험, 레벨 100의 힘을 받아라!':f%10===0?`${f}층의 문지기다. 이 층을 넘으면 보상이 기다린다!`:'탑을 오르려면 나를 넘어서라!',o);
  const r=await battle({kind:'trainer',cls:'tower',name:`${f}층 수호자`,look:n.look,team:towerTeam(f),noLose:1,lose:'...길을 열어 주지.',winMsg:'다시 도전하도록.',bg:'lab',music:f%10===0?'leader':'trainer'});
  if(state!=='world')return;
  if(r!=='win'){await say(`${f}층에서 도전이 끝났다... 로비로 돌아간다.`);healParty();await fadeTo(1);enterMap('towerLobby',5,8,'up',{quiet:1});await fadeTo(0);
    await say(`최고 기록: ${t.best}층. 다음엔 ${Math.min(91,Math.floor(t.best/10)*10+1)}층부터 다시 도전할 수 있어요!`,{name:'탑 안내원'});return;}
  t.best=Math.max(t.best,f);n.hide=1;sfx('open');
  if(f%10===0){healParty();sfx('heal');await say(`${f}층 돌파! 몬스터들이 회복되었다.`);
    const prize=f*40;G.money+=prize;await say(`${J(G.name,'은')} 보상으로 ${money(prize)}을 받았다!`);
    await giveItem('lvup',Math.max(1,f/20|0));if(f%50===0)await giveItem('revive',2);}
  if(f===100){G.flags.towerClear=1;await Music.jingle('badge');await say('무한의 탑 100층을 정복했다!!');await giveItem('hyper',5);await giveItem('lvup',10);
    await say('탑의 꼭대기에서 이 지방 전체가 내려다보인다... 진정한 원정대장의 탄생이다!');return;}
  await say('위층으로 가는 계단이 열렸다!');}
async function towerNext(){const t=towerState();if(npcById('tw_guard')&&!npcById('tw_guard').hide)return;
  if(t.cur>=100){await say('더 이상 올라갈 곳이 없다. 하늘이 손에 닿을 것 같다.');return;}
  sfx('exit');await towerEnter(t.cur+1);}
