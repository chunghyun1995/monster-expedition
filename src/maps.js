/* =========================================================
   maps.js — 지도 데이터와 이벤트 스크립트
   바깥 타일: # 나무 . 땅 , 풀숲 = 길 ~ 물 f 꽃 s 표지판 r 바위 F 울타리 L 턱 Q 다리 D 문
             H/K 집 B 연구소 C 몬스터센터 M 상점 G 체육관
   실내 타일: w 벽 . 바닥 m 출구매트 c 카펫 T 탁자 K 카운터 S 책장 P PC h 회복기 v TV b 침대 p 화분 R 바위 Y 석상 ~ 물 x 빈공간
   ========================================================= */
const RIVAL='도윤';
const MAPS={};
function defMap(id,o){o.id=id;o.h=o.rows.length;o.w=o.rows[0].length;o.npcs=o.npcs||[];o.items=o.items||[];o.signs=o.signs||{};o.warps=o.warps||{};o.obj=o.obj||{};o.trig=o.trig||[];
  for(const n of o.npcs){n.x0=n.x;n.y0=n.y;n.d0=n.dir;n.off=0;}MAPS[id]=o;return o;}
const nm=()=>G.name;

/* ------------------------------ 새싹마을 ------------------------------ */
defMap('town',{name:'새싹마을',out:1,music:'town',bg:'grass',region:'town',
 rows:[
  '##########==##########',
  '#ff.......==.......ff#',
  '#.BBBBBBB.==.........#',
  '#.BBBBBBB.==...s.....#',
  '#.BBBBBBB.==.....ff..#',
  '#.BBBDBBB.==.....ff..#',
  '#....=....==.........#',
  '#....=======.........#',
  '#.........==.........#',
  '#.HHHH....==...KKKK..#',
  '#.HHHH....==...KKKK..#',
  '#.HHHH....==...KKKK..#',
  '#.HHDH....==...KDKK..#',
  '#...=.....==....=....#',
  '#...=============....#',
  '#~~~~.........ff.....#',
  '#~~~~~...........ff..#',
  '######################'],
 links:{n:'route1'},
 warps:{'5,5':['lab',5,10,'up'],'4,12':['home',4,6,'up'],'16,12':['rhouse',4,6,'up']},
 signs:{'15,3':['새싹마을','새로운 모험이 싹트는 곳']},
 npcs:[{id:'t_girl',x:7,y:9,dir:'down',look:'girl',name:'마을 소녀',wander:1,text:['몬스터를 데리고 다니면 풀숲도 무섭지 않대!','연구소의 한결 박사님은 몬스터 도감을 만들고 계셔.']},
       {id:'t_man',x:15,y:15,dir:'left',look:'man',name:'아저씨',wander:1,text:['이 연못에는 물 타입 몬스터가 산다는 소문이 있지.','언젠가 나도 원정을 떠나 보고 싶구먼.']}],
 trig:[{x:10,y:1,w:2,h:1,cond:()=>!G.flags.starter,run:async()=>{await say('앗, 풀숲에서 무언가 바스락거린다...');await say('몬스터 없이 가는 건 위험할 것 같다. 먼저 연구소에 들르자!');await walkPlayer(['down']);}}]});

defMap('home',{name:'우리 집',music:'town',bg:'lab',floor:'wood',wall:'#e8d8b8',region:'town',
 rows:['wwwwwwwwww','wwwwwwwwww','SS...v..pp','..........','...TT.....','...TT.....','p........p','....mm....'],
 warps:{'4,7':['town',4,13,'down'],'5,7':['town',4,13,'down']},
 obj:{'5,2':['TV에서 몬스터 특집 방송을 하고 있다.','"여러분도 몬스터와 함께 원정을 떠나 보세요!"'],'0,2':['몬스터 사진집이 꽂혀 있다.'],'1,2':['요리책이 꽂혀 있다. 엄마가 자주 보는 책이다.']},
 npcs:[{id:'mom',x:6,y:4,dir:'left',look:'mom',name:'엄마',talk:async()=>{
   if(!G.flags.starter){await say(`일어났구나, ${nm()}! 한결 박사님이 연구소로 와 달라고 하셨단다.`,{name:'엄마'});await say('연구소는 마을 위쪽에 있는 큰 건물이야.',{name:'엄마'});return;}
   await say(`${nm()}, 피곤하지 않니? 잠깐 쉬었다 가렴.`,{name:'엄마'});await fadeTo(1);healParty();await Music.jingle('heal');await fadeTo(0);
   G.heal={map:'home',x:4,y:6};await say('몬스터들이 기운을 되찾았다!');await say('힘내렴! 엄마는 언제나 응원할게.',{name:'엄마'});}}]});

defMap('rhouse',{name:`${RIVAL}네 집`,music:'town',bg:'lab',floor:'wood',wall:'#d8e4c8',region:'town',
 rows:['wwwwwwwwww','wwwwwwwwww','pp..v..SSS','..........','.....TT...','.....TT...','p........p','....mm....'],
 warps:{'4,7':['town',16,13,'down'],'5,7':['town',16,13,'down']},
 obj:{'4,2':['TV에서 체육관 관장 특집을 하고 있다.'],'7,2':['트레이너 잡지가 잔뜩 꽂혀 있다.'],'8,2':['트레이너 잡지가 잔뜩 꽂혀 있다.'],'9,2':['몬스터 도감 해설서가 꽂혀 있다.']},
 npcs:[{id:'sister',x:3,y:4,dir:'right',look:'sister',name:'세은 누나',talk:async()=>{const o={name:'세은 누나'};
   if(!G.flags.starter){await say(`${RIVAL}는 벌써 연구소에 갔어! 성격이 급하다니까.`,o);return;}
   if(!G.flags.gift1){await say(`${nm()}도 몬스터를 받았구나! 이거 가져가. 모험에 꼭 필요할 거야.`,o);await giveItem('potion',3);G.flags.gift1=1;return;}
   await say(`${RIVAL} 녀석, 너한테는 절대 안 진다고 난리야. 잘 부탁해!`,o);}}]});

/* ------------------------------ 연구소 ------------------------------ */
const STARTERS=[[4,4,1],[5,4,4],[6,4,7]];
defMap('lab',{name:'한결 연구소',music:'town',bg:'lab',floor:'lab',wall:'#dfe6f0',region:'town',
 rows:['wwwwwwwwwwww','wwwwwwwwwwww','SSSS....SSSS','............','....TTT.....','............','............','TT........TT','TT........TT','............','p..........p','.....mm.....'],
 warps:{'5,11':['town',5,6,'down'],'6,11':['town',5,6,'down']},
 obj:{'0,2':['몬스터의 진화에 관한 논문이 꽂혀 있다.'],'1,2':['몬스터의 진화에 관한 논문이 꽂혀 있다.'],'2,2':['"타입 상성 대백과"','불꽃은 풀에, 풀은 물에, 물은 불꽃에 강하다.'],'3,2':['"타입 상성 대백과"','전기는 땅에 전혀 통하지 않는다.'],
   '8,2':['연구 일지가 빼곡히 꽂혀 있다.'],'9,2':['연구 일지가 빼곡히 꽂혀 있다.'],'10,2':['"캡슐 공학 입문"'],'11,2':['"캡슐 공학 입문"'],
   '0,7':['현미경과 실험 도구가 놓여 있다.'],'1,7':['현미경과 실험 도구가 놓여 있다.'],'10,7':['컴퓨터 화면에 몬스터 데이터가 떠 있다.'],'11,7':['컴퓨터 화면에 몬스터 데이터가 떠 있다.'],
   '4,4':()=>pickStarter(0),'5,4':()=>pickStarter(1),'6,4':()=>pickStarter(2)},
 npcs:[{id:'prof',x:5,y:3,dir:'down',look:'prof',name:'한결 박사',talk:async()=>{const o={name:'한결 박사'};
     if(!G.flags.starter){await say('테이블 위의 캡슐 세 개 중에서 마음에 드는 아이를 골라 보렴.',o);return;}
     const s=Object.keys(G.seen).length,c=Object.keys(G.caught).length;await say(`도감은 잘 채우고 있니? 발견 ${s}종, 포획 ${c}종이로구나.`,o);
     await say(c>=20?'정말 대단하구나! 너는 진정한 몬스터 박사가 될 수 있겠어!':c>=10?'좋아, 그 기세로 계속 가 보렴!':'아직 갈 길이 멀구나. 풀숲 곳곳을 찾아보렴!',o);}},
   {id:'rival_lab',x:8,y:5,dir:'left',look:'rival',name:RIVAL,cond:()=>!G.flags.rival1,talk:async()=>{await say(`늦었잖아, ${nm()}! 나는 네가 먼저 고르게 해 줄게. 대인배니까!`,{name:RIVAL});}},
   {id:'aide1',x:2,y:9,dir:'down',look:'aide',name:'연구원',text:['박사님은 젊었을 때 몬스터 원정대의 대장이셨대요.','몬스터는 레벨이 오르면 모습이 바뀌기도 해요. 이걸 "진화"라고 하죠.']},
   {id:'aide2',x:9,y:9,dir:'down',look:'aide',name:'연구원',wander:1,text:['몬스터 센터의 PC로 보관함을 이용할 수 있어요.','파티에는 6마리까지 데리고 다닐 수 있답니다.']}],
 trig:[{x:4,y:9,w:4,h:2,cond:()=>!G.flags.labIntro,run:labIntro}]});
async function labIntro(){G.flags.labIntro=1;const prof=npcById('prof'),o={name:'한결 박사'};
  await emoteOn(prof,'!');await say(`오, 왔구나 ${nm()}! 기다리고 있었단다.`,o);
  await say('너와 도윤에게 몬스터를 한 마리씩 맡기고, 이 지방의 몬스터 도감을 완성하는 걸 도와 달라고 부탁하려던 참이었어.',o);
  await say('테이블 위의 캡슐 세 개 중에서 마음에 드는 아이를 골라 보렴.',o);
  await say(`난 ${nm()}가 고른 다음에 고를게. 내가 고르면 남는 게 불쌍하잖아?`,{name:RIVAL});}
async function pickStarter(i){const[x,y,sid]=STARTERS[i];
  if(G.flags.starter){await say(sid===G.starter||sid===G.rivalStarter?'텅 빈 캡슐이 놓여 있다.':'박사님의 소중한 몬스터가 들어 있다.');return;}
  const s=SP[sid],pg=page(TOP,`<div class="abs" style="inset:0;background:radial-gradient(circle at 50% 40%,#fffbe0,#c8e0f8)"></div>
    <canvas class="abs big" width="24" height="24" style="left:${U(80)};top:${U(6)};width:${U(96)};height:${U(96)}"></canvas>
    <div class="sheet" style="left:${U(8)};top:${U(104)};width:${U(240)};height:${U(36)};padding:${U(3)} ${U(8)}"><b>${s.n}</b> ${typesHtml(sid)} <span style="font-size:${U(8)};color:#6a7190">${s.cat} 몬스터</span><div class="desc" style="font-size:${U(8.5)}">${s.d}</div></div>`);
  pg.querySelector('canvas').getContext('2d').drawImage(monCanvas(sid),0,0);cry(sid);
  const r=await ask(`${TYPES[s.t[0]].n} 타입 몬스터 ${J(s.n,'을')} 고르겠니?`,['이 아이로 할래!','다시 고를래'],{name:'한결 박사'});pg.remove();
  if(r!==0)return;
  G.starter=sid;G.rivalStarter=COUNTER[sid];G.flags.starter=1;
  const m=makeMon(sid,5,{met:{map:'한결 연구소',lv:5},ot:G.name,shiny:false});addMon(m);G.seen[sid]=G.caught[sid]=1;
  await Music.jingle('key');await say(`${J(G.name,'은')} 한결 박사에게서 ${J(s.n,'을')} 받았다!`);
  await nicknamePrompt(m);
  const rv=npcById('rival_lab');await say(`그럼 나는 이 녀석으로 할게!`,{name:RIVAL});
  await walkNpc(rv,['up']);rv.dir='left';await sleep(300);
  await say(`${J(RIVAL,'은')} ${J(SP[G.rivalStarter].n,'을')} 골랐다!`);await walkNpc(rv,['down']);rv.dir='left';
  Music.play('rival');await say(`${nm()}! 모처럼 몬스터를 받았으니까 한 판 붙자!`,{name:RIVAL});
  const res=await battle({kind:'trainer',cls:'rival',name:RIVAL,team:rivalTeam(1),noLose:1,look:'rival',music:'rival',bg:'lab',
    lose:'뭐야! 처음인데 너무 잘하잖아!',winMsg:'헤헷, 역시 내가 고른 몬스터가 최고야!'});
  G.flags.rival1=1;Music.play('town');
  await say(res==='win'?'쳇, 다음엔 안 질 거야! 내 몬스터를 더 강하게 키워 오겠어!':'좋아, 이 기세로 체육관도 정복하고 오겠어!',{name:RIVAL});
  const prof=npcById('prof'),o={name:'한결 박사'};
  await say('훌륭한 승부였단다! 몬스터들도 즐거워 보이는구나.',o);
  await say('자, 너희에게 이걸 주마. 만난 몬스터를 자동으로 기록하는 하이테크 도감이란다.',o);
  await giveItem('dex',1,{key:1});G.flags.dex=1;
  await say('그리고 이건 내가 만든 원정패드다! 아래 화면에서 시계와 지도, 파티 상태를 볼 수 있지.',o);
  await giveItem('pad',1,{key:1});G.flags.pad=1;Pad.show();
  await say('어머님께서 맡기신 질주신발도 있단다. B버튼을 누른 채 걸으면 달릴 수 있어.',o);
  await giveItem('shoes',1,{key:1});G.flags.shoes=1;
  await say('마지막으로 포획캡슐이다. 야생 몬스터를 약하게 만든 뒤 던지면 붙잡을 수 있단다.',o);
  await giveItem('ball',5);
  await say('북쪽 1번 도로를 지나면 바위시티가 있다. 그곳의 체육관 관장에게 도전해 보렴!',o);
  await say(`그럼 먼저 간다! 바위시티에서 보자, ${nm()}!`,{name:RIVAL});
  await walkNpc(rv,['down','down','down','down','down','down']);G.flags.rivalLeft=1;rv.hide=1;sfx('exit');
  G.heal={map:'home',x:4,y:6};}

/* ------------------------------ 1번 도로 ------------------------------ */
defMap('route1',{name:'1번 도로',out:1,music:'route',bg:'grass',region:'route1',
 rows:[
  '##########==##########',
  '#,,,,,,...==...,,,,,,#',
  '#,,,,,,...==...,,,,,,#',
  '#,,,,.....==.....,,,,#',
  '#......s..==.........#',
  '####......==......####',
  '#,,,,.....==....ff.r.#',
  '#,,,,,,...==...,,,,..#',
  '#,,,,,,...==...,,,,..#',
  '#LLLLLL...==...LLLLLL#',
  '#.........==.........#',
  '#..####...==...####..#',
  '#..####...==...####..#',
  '#.........==,,,,,,,,.#',
  '#.ff......==,,,,,,,,.#',
  '#.ff......==,,,,,,,,.#',
  '#~~~~.....==......,,.#',
  '#~~~~~....==.........#',
  '#~~~~.....==...r.....#',
  '#,,,,,....==.........#',
  '#,,,,,,...==..LLLLLL.#',
  '#,,,,,,...==......ff.#',
  '#.........==.........#',
  '##########==##########'],
 links:{s:'town',n:'city'},
 enc:[[15,2,4,40],[10,2,4,35],[12,2,3,20],[27,3,4,5]],
 signs:{'7,4':['1번 도로','↑ 바위시티 · ↓ 새싹마을']},
 items:[{x:20,y:10,item:'potion',n:1,flag:'i_r1a'},{x:1,y:10,item:'ball',n:2,flag:'i_r1b'},{x:19,y:21,item:'antidote',n:1,flag:'i_r1c'}],
 npcs:[{id:'r1_tip',x:16,y:17,dir:'down',look:'man',name:'아저씨',wander:1,text:['풀숲에서는 야생 몬스터가 튀어나오지.','몬스터의 HP를 줄이고, 잠들거나 마비되게 하면 붙잡기 쉬워진다네!']},
   {id:'tr_minsu',x:8,y:13,dir:'right',look:'kid',trainer:{cls:'kid',name:'민수',team:[[15,4],[10,3]],intro:['눈이 마주쳤으니 승부다!'],lose:'으앙, 졌다!',after:['다음엔 꼭 이길 거야! 레벨을 올려 올 테다!']}},
   {id:'tr_jia',x:13,y:4,dir:'left',look:'girl',trainer:{cls:'girl',name:'지아',team:[[10,4],[12,4]],intro:['내 몬스터 귀엽지? 실력도 좋다구!'],lose:'귀엽기만 한 게 아니었구나...',after:['포획캡슐은 몬스터가 약해졌을 때 던지는 게 좋아.']}}]});

/* ------------------------------ 바위시티 ------------------------------ */
defMap('city',{name:'바위시티',out:1,music:'city',bg:'city',region:'city',
 rows:[
  '########################',
  '#ff.......GGGGGG.....ff#',
  '#.........GGGGGG.......#',
  '#...s.....GGGGGG.......#',
  '#.........GGGGGG.......#',
  '#.........GGDGGG.......#',
  '#...........=..........#',
  '#..CCCCC....=....MMMM..#',
  '#..CCCCC....=....MMMM..#',
  '#..CCCCC....=....MMMM..#',
  '#..CCDCC....=....MMDM...',
  '#....===============....',
  '#.........===..........#',
  '#.HHHH....==....ff.....#',
  '#.HHHH....==....ff..r..#',
  '#.HHHH....==...........#',
  '#.HDHH....==....~~~~...#',
  '#..=......==....~~~~...#',
  '#..========.....~~~....#',
  '##########==############'],
 links:{s:'route1',e:'route2'},
 warps:{'12,5':['gym1',6,14,'up'],'5,10':['center1',6,8,'up'],'19,10':['mart1',5,7,'up'],'3,16':['chouse',4,6,'up']},
 signs:{'4,3':['바위시티','단단한 의지가 모이는 바위의 도시']},
 npcs:[{id:'c_old',x:8,y:6,dir:'down',look:'old',name:'할아버지',text:['체육관 관장 단단은 바위 타입 몬스터를 쓴다네.','바위에는 물이나 풀 기술이 잘 통하지. 불꽃과 비행은 고전할 게야.']},
   {id:'c_girl',x:16,y:13,dir:'left',look:'lady',name:'아가씨',wander:1,text:['동쪽 2번 도로 숲에는 여러 타입의 몬스터가 살아요.','상점에서 상태 이상 치료약도 꼭 챙기세요!']},
   {id:'c_kid',x:7,y:12,dir:'up',look:'kid',name:'꼬마',wander:1,text:['몬스터 센터에서는 공짜로 몬스터를 회복시켜 줘!','센터 PC로 보관함에 몬스터를 맡길 수 있어.']},
   {id:'c_guard',x:22,y:9,dir:'down',look:'guide',name:'경비원',text:['여기서부터 2번 도로야. 숲에는 강한 몬스터가 많으니 조심하렴.']}],
 trig:[{x:22,y:10,w:2,h:2,cond:()=>!G.flags.badge0,run:async()=>{const g=npcById('c_guard');g.dir='down';await emoteOn(g,'!');
   await say('잠깐! 이 앞 2번 도로 숲은 아주 위험해.',{name:'경비원'});await say('바위시티 체육관의 배지를 얻은 트레이너만 지나갈 수 있단다.',{name:'경비원'});await walkPlayer(['left']);}}]});
defMap('chouse',{name:'바위시티 민가',music:'city',bg:'lab',floor:'wood',wall:'#e8d0c0',region:'city',
 rows:['wwwwwwwwww','wwwwwwwwww','SS..v...pp','..........','...TT.....','...TT.....','p........p','....mm....'],
 warps:{'4,7':['city',3,17,'down'],'5,7':['city',3,17,'down']},
 npcs:[{id:'granny',x:6,y:4,dir:'left',look:'granny',name:'할머니',talk:async()=>{const o={name:'할머니'};
   if(!G.flags.badge0){await say('젊은이, 체육관에 도전하려고? 관장 단단은 내 손자란다.',o);await say('배지를 얻어 오면 좋은 걸 주마. 호호.',o);return;}
   if(!G.flags.gift2){await say('어머나, 단단을 이겼구나! 약속대로 이걸 주마.',o);await giveItem('great',3);G.flags.gift2=1;return;}
   await say('슈퍼캡슐은 보통 캡슐보다 훨씬 잘 붙잡힌단다.',o);}},
   {id:'ch_kid',x:2,y:5,dir:'right',look:'kid',name:'꼬마',text:['우리 형은 바위시티 체육관 관장이야! 엄청 세다구!']}]});

/* ---- 공용: 몬스터 센터 / 상점 ---- */
function centerMap(id,out,ox,oy,region,music){defMap(id,{name:'몬스터 센터',music:'center',bg:'lab',floor:'tile',wall:'#fbe4e8',region,
 rows:['wwwwwwwwwwwww','wwwwwwwwwwwww','p...h.......p','...KKKKKKK..P','.............','.TT.......TT.','.TT.......TT.','.............','p...........p','......m......'],
 warps:{'6,9':[out,ox,oy,'down']},
 obj:{'12,3':()=>pcMenu(),'4,2':['회복 장치가 반짝이고 있다.']},
 npcs:[{id:'nurse_'+id,x:6,y:2,dir:'down',look:'nurse',name:'간호사',talk:()=>nurse(out,ox,oy)},
   {id:'cg_'+id,x:2,y:7,dir:'right',look:id==='center1'?'old':'lady',name:id==='center1'?'할아버지':'아가씨',wander:1,
    text:id==='center1'?['몬스터가 쓰러지면 몬스터 센터로 데려오게나.','그리고 항상 회복약을 넉넉히 챙겨 두게!']:['물결마을 체육관 관장 하라 씨는 물 타입의 달인이에요.','전기 타입과 풀 타입 몬스터가 있으면 든든하겠죠!']}]});}
centerMap('center1','city',5,11,'city');
function martMap(id,out,ox,oy,region){defMap(id,{name:'몬스터 상점',music:'center',bg:'lab',floor:'tile',wall:'#e4ecfb',region,
 rows:['wwwwwwwwwww','wwwwwwwwwww','..K.....SSS','..K........','..K..SS.SS.','...........','....SS.SS..','p.........p','.....m.....'],
 warps:{'5,8':[out,ox,oy,'down']},
 obj:{'8,2':['캡슐이 진열되어 있다.'],'9,2':['회복약이 진열되어 있다.'],'10,2':['상태 이상 치료약이 진열되어 있다.'],'5,4':['신상품 몬스터 사료가 놓여 있다.'],'6,4':['신상품 몬스터 사료가 놓여 있다.'],
   '8,4':['캠핑 용품이 놓여 있다.'],'9,4':['캠핑 용품이 놓여 있다.'],'4,6':['몬스터 장난감이 놓여 있다.'],'5,6':['몬스터 장난감이 놓여 있다.'],'7,6':['반짝이는 액세서리가 놓여 있다.'],'8,6':['반짝이는 액세서리가 놓여 있다.']},
 npcs:[{id:'clerk_'+id,x:1,y:3,dir:'right',look:'clerk',name:'점원',talk:()=>shop()},
   {id:'mg_'+id,x:7,y:5,dir:'up',look:'man',name:'손님',wander:1,text:['상태 이상은 배틀이 끝나도 낫지 않으니 치료약을 꼭 챙기게.','만능치료제 하나면 어떤 상태 이상도 낫는다네.']}]});}
martMap('mart1','city',19,11,'city');

/* ------------------------------ 바위시티 체육관 ------------------------------ */
defMap('gym1',{name:'바위시티 체육관',music:'gym',bg:'rock',floor:'stone',wall:'#8a7458',region:'city',
 rows:['wwwwwwwwwwwww','wwwwwwwwwwwww','R....ccc....R','R...........R','RRRR..R..RRRR','R...........R','R..RRR.RRR..R','R...........R','RRR..RRR..RRR','R...........R','R.RRR...RRR.R','R...........R','R...........R','R....Y.Y....R','R...........R','R.....m.....R'],
 warps:{'6,15':['city',12,6,'down']},
 obj:{'5,13':()=>statue(0),'7,13':()=>statue(0)},
 npcs:[{id:'g1_guide',x:4,y:14,dir:'right',look:'guide',name:'체육관 안내원',text:['어이, 도전자! 이곳 관장 단단은 바위 타입 전문이야.','바위 타입에는 물과 풀 기술이 효과가 굉장하지! 반대로 불꽃이나 비행은 별로야.','관장의 몬스터는 땅 타입이기도 해서 전기 기술이 통하지 않으니 조심해!']},
   {id:'tr_cheolsu',x:2,y:9,dir:'right',look:'hiker',trainer:{cls:'hiker',name:'철수',team:[[23,10]],intro:['관장님께 도전하려면 나부터 넘어서라!'],lose:'으음, 단단하지 못했군...',after:['관장님의 바위거북은 방어가 엄청나다고.']}},
   {id:'tr_yeongho',x:10,y:5,dir:'left',look:'hiker',trainer:{cls:'hiker',name:'영호',team:[[27,9],[23,10]],intro:['산에서 단련한 내 몬스터들을 보아라!'],lose:'산사태 같은 공격이었다...',after:['특수 기술로 공격하면 바위 타입의 단단한 방어를 피할 수 있지.']}},
   {id:'leader1',x:6,y:2,dir:'down',look:'leaderRock',name:'관장 단단',talk:leaderRock}]});
async function statue(i){const L=[['바위시티 체육관','관장: 단단'],['물결마을 체육관','관장: 하라']][i];await say(`${L[0]} · ${L[1]}`);
  if(G.badges[i])await say(`인증 트레이너: ${G.name}`);else await say('인증 트레이너: 아직 없음');}
async function leaderRock(){const o={name:'관장 단단'};
  if(G.badges[0]){await say('다시 왔나. 너의 단단한 의지는 이미 증명되었다.',o);await say('동쪽 물결마을의 관장 하라는 물 타입의 고수다. 방심하지 마라.',o);return;}
  await say('잘 왔다, 도전자여. 나는 바위시티 체육관 관장 단단.',o);
  await say('바위처럼 단단한 의지가 없으면 몬스터도 강해지지 않는다. 그 의지, 승부로 보여 다오!',o);
  const r=await battle({kind:'trainer',cls:'leader',name:'단단',look:'leaderRock',team:[[23,12],[24,14]],music:'leader',bg:'rock',leader:1,
    lose:'훌륭하다... 너의 의지는 바위보다 단단하구나!'});
  if(r!=='win')return;
  await say('좋다. 바위시티 체육관을 이긴 증표로 이 배지를 주마.',o);
  G.badges[0]=1;G.flags.badge0=1;await Music.jingle('badge');await say(`${J(G.name,'은')} 관장 단단에게서 반석 배지를 받았다!`);
  await say('반석 배지는 트레이너 카드에서 볼 수 있다. 이제 동쪽 2번 도로로 갈 수 있을 거다.',o);
  await say('물결마을의 하라는 나보다 훨씬 까다로운 상대다. 몬스터를 잘 키워 두도록!',o);}

/* ------------------------------ 2번 도로 ------------------------------ */
defMap('route2',{name:'2번 도로',out:1,music:'route',bg:'forest',region:'route2',
 rows:[
  '##############################',
  '#,,,,,,,,####,,,,,,,,,,,,,,,,#',
  '#,,,,,,,,####,,,,,,,,..,,,,,,#',
  '#,,,,.......,,,,..~~~~..,,,,,#',
  '#....LLLL....,,..~~~~~~.,,,,,#',
  '#,,,,.......,,,,..~~~~.......#',
  '#,,,,,,..............,,,......',
  '#,,,,,,....======........,,...',
  '#.......,,,,,,..==..,,,,,,,..#',
  '#..s....,,,,,,..==..,,,,,,,..#',
  '...........................r.#',
  '......LLLL......==...........#',
  '#,,,,,,,,,,,,...==...,,,,,,,,#',
  '#,,,,,,,,,,,,...==...,,,,ff..#',
  '#.....ff........==...........#',
  '##############################'],
 links:{w:'city',e:'town2'},
 enc:[[17,8,10,15],[21,8,10,12],[25,8,10,15],[12,7,9,8],[13,8,9,5],[10,8,10,12],[27,8,10,13],[23,9,11,10],[19,9,11,7],[29,9,10,3]],
 signs:{'3,9':['2번 도로','→ 물결마을 · ← 바위시티']},
 items:[{x:27,y:12,item:'super',n:1,flag:'i_r2a'},{x:2,y:14,item:'ball',n:3,flag:'i_r2b'},{x:28,y:2,item:'revive',n:1,flag:'i_r2c'},{x:22,y:2,item:'parheal',n:1,flag:'i_r2d'}],
 npcs:[{id:'tr_donghun',x:12,y:6,dir:'down',look:'camper',trainer:{cls:'camper',name:'동훈',team:[[21,10],[23,10]],intro:['숲에서 단련한 내 몬스터를 받아라!'],lose:'캠프파이어가 꺼져 버렸어...',after:['물결마을 관장은 물 타입을 써. 전기나 풀 타입이 있으면 좋을 거야.']}},
   {id:'tr_haneul',x:5,y:12,dir:'up',look:'bug',trainer:{cls:'bugboy',name:'하늘',team:[[13,9],[14,11]],intro:['벌레 몬스터의 진가를 보여 주지!'],lose:'나풀나비가 날아가 버렸다...',after:['꼬물이는 금방 진화해. 레벨 10이면 나풀나비가 된다구!']}},
   {id:'tr_sera',x:24,y:9,dir:'left',look:'lady',trainer:{cls:'lass',name:'세라',team:[[17,11]],intro:['찌릿찌릿한 승부, 어때요?'],lose:'찌릿... 내가 감전된 기분이에요.',after:['전기 타입은 땅 타입에게는 전혀 통하지 않아요.']}},
   {id:'tr_gildong',x:24,y:5,dir:'down',look:'fisher',trainer:{cls:'fisher',name:'길동',team:[[19,11],[29,10]],intro:['오늘은 고기 대신 트레이너를 낚아 볼까!'],lose:'놓친 고기가 크다더니...',after:['물파리는 독이 있어. 해독약을 챙기라고.']}},
   {id:'r2_girl',x:20,y:14,dir:'left',look:'girl',name:'소녀',wander:1,text:['숲 깊은 곳에는 연못이 있어. 개굴물을 본 적 있니?']}],
 trig:[{x:2,y:10,w:1,h:2,cond:()=>G.flags.badge0&&!G.flags.rival2,run:rival2}]});
async function rival2(){G.flags.rival2=1;if(P.y!==10)await walkPlayer(['up']);Music.play('rival');const rv={id:'rv2',x:9,y:10,dir:'left',look:'rival',name:RIVAL,off:0,tmp:1};curMap().npcs.push(rv);
  await emoteOn(rv,'!');while(Math.abs(rv.x-P.x)>1)await walkNpc(rv,['left']);P.dir='right';
  await say(`${nm()}! 너도 배지를 땄구나! 나도 방금 따고 왔지!`,{name:RIVAL});await say('그럼 누가 더 강해졌는지 확인해 볼까? 간다!',{name:RIVAL});
  await battle({kind:'trainer',cls:'rival',name:RIVAL,team:rivalTeam(2),look:'rival',music:'rival',bg:'forest',lose:'으으, 또 졌어! 너 너무 강해진 거 아냐?'});
  if(state!=='world'||G.map!=='route2')return;
  await say('좋아, 물결마을 체육관에서는 내가 먼저 배지를 따 주겠어! 그럼 간다!',{name:RIVAL});
  await walkNpc(rv,['right','right','right','right','right','right','right','right']);curMap().npcs.splice(curMap().npcs.indexOf(rv),1);Music.play(curMap().music);}

/* ------------------------------ 물결마을 ------------------------------ */
defMap('town2',{name:'물결마을',out:1,music:'city',bg:'water',region:'town2',
 rows:[
  '########################',
  '#ff....CCCCC....~~~~~~~#',
  '#......CCCCC....~~~~~~~#',
  '#......CCCCC....QQ~~~~~#',
  '#......CCDCC....QQ~~~~~#',
  '#........=......QQ~~~~~#',
  '...=================~~~#',
  '...........=........~~~#',
  '#..MMMM....=....GGGGGG.#',
  '#..MMMM....=....GGGGGG.#',
  '#..MMMM....=....GGGGGG.#',
  '#..MDMM....=....GGGGGG.#',
  '#...=......=....GGGDGG.#',
  '#...=================..#',
  '#.HHHH..............ff.#',
  '#.HHHH....s..........ff#',
  '#.HHHH.......ff........#',
  '#.HDHH.................#',
  '#......................#',
  '########################'],
 links:{w:'route2'},
 warps:{'9,4':['center2',6,8,'up'],'4,11':['mart2',5,7,'up'],'19,12':['gym2',6,14,'up'],'3,17':['thouse',4,6,'up']},
 signs:{'10,15':['물결마을','잔잔한 물결이 반겨 주는 호숫가 마을']},
 npcs:[{id:'w_fisher',x:17,y:5,dir:'right',look:'fisher',name:'낚시꾼',text:['이 호수에는 물파리가 많아. 독에 조심하라고.','언젠가 해일왕이라는 몬스터를 보고 싶구먼.']},
   {id:'w_lady',x:13,y:16,dir:'up',look:'lady',name:'아가씨',wander:1,text:['관장 하라 님의 몬스터는 정말 아름다워요!']},
   {id:'w_kid',x:8,y:9,dir:'down',look:'kid',name:'꼬마',wander:1,text:['물 타입에는 전기랑 풀 기술이 잘 통해!','근데 물파리는 독 타입이기도 해서 풀 기술은 별로래.']},
   {id:'rival3',x:21,y:13,dir:'left',look:'rival',name:RIVAL,cond:()=>G.flags.rival2&&!G.flags.rival3,talk:rival3,sight:rival3}]});
async function rival3(){if(G.flags.rival3)return;G.flags.rival3=1;const rv=npcById('rival3');Music.play('rival');
  await say(`${nm()}! 체육관에 도전하러 왔구나. 하지만 그 전에 나랑 마지막으로 한 판 하자!`,{name:RIVAL});
  await say('이번엔 진심으로 간다! 내 파트너도 진화했다고!',{name:RIVAL});
  await battle({kind:'trainer',cls:'rival',name:RIVAL,team:rivalTeam(3),look:'rival',music:'rival',bg:'water',lose:'...인정할게. 넌 정말 강해.'});
  if(state!=='world')return;
  await say('하라 씨는 강하지만 너라면 이길 수 있을 거야. 나는 좀 더 수행하고 올게!',{name:RIVAL});
  rv.hide=1;sfx('exit');Music.play(curMap().music);}
centerMap('center2','town2',9,5,'town2');
martMap('mart2','town2',4,12,'town2');
defMap('thouse',{name:'물결마을 민가',music:'city',bg:'lab',floor:'wood',wall:'#d8e8f0',region:'town2',
 rows:['wwwwwwwwww','wwwwwwwwww','pp..v..SSS','..........','.....TT...','.....TT...','p........p','....mm....'],
 warps:{'4,7':['town2',3,18,'down'],'5,7':['town2',3,18,'down']},
 npcs:[{id:'wife',x:3,y:4,dir:'right',look:'granny',name:'아주머니',talk:async()=>{const o={name:'아주머니'};
   if(!G.flags.gift3){await say('먼 길 오느라 고생했지? 이거 가져가렴. 우리 남편이 호수에서 주운 거란다.',o);await giveItem('revive',1);G.flags.gift3=1;return;}
   await say('부활의깃털은 쓰러진 몬스터를 되살려 준단다. 아껴 쓰렴.',o);}}]});

/* ------------------------------ 물결마을 체육관 ------------------------------ */
defMap('gym2',{name:'물결마을 체육관',music:'gym',bg:'water',floor:'pool',wall:'#7ab8e0',region:'town2',
 rows:['wwwwwwwwwwwww','wwwwwwwwwwwww','~~~..ccc..~~~','~~~.......~~~','~~~~~~.~~~~~~','~..........~~','~.~~~~~~~~.~~','~.~~~~~~~~.~~','~..........~~','~~~~~.~~~~~~~','~~.........~~','~~.~~~~~~~.~~','~~.~~~~~~~.~~','~~..Y...Y..~~','~~.........~~','~~~~~~m~~~~~~'],
 warps:{'6,15':['town2',19,13,'down']},
 obj:{'4,13':()=>statue(1),'8,13':()=>statue(1)},
 npcs:[{id:'g2_guide',x:3,y:14,dir:'right',look:'guide',name:'체육관 안내원',text:['또 만났군, 도전자! 이곳 관장 하라는 물 타입의 달인이야.','물 타입에는 전기와 풀 기술이 효과가 굉장하지.','하지만 관장의 물파리는 독 타입이기도 해서 풀 기술은 보통 정도밖에 안 통해!']},
   {id:'tr_mina',x:2,y:12,dir:'up',look:'swim',trainer:{cls:'swimmer',name:'미나',team:[[19,16],[29,15]],intro:['물속에서는 내가 최강이야!'],lose:'물을 너무 많이 먹었어...',after:['하라 님의 개굴왕은 엄청 빨라!']}},
   {id:'tr_junho',x:10,y:6,dir:'down',look:'swim',trainer:{cls:'swimmer',name:'준호',team:[[20,17]],intro:['파도를 타는 것처럼 승부를 즐기자!'],lose:'파도에 휩쓸렸다...',after:['전기 타입 몬스터를 데려왔어? 그럼 관장님도 고전하실걸.']}},
   {id:'leader2',x:6,y:2,dir:'down',look:'leaderWater',name:'관장 하라',talk:leaderWater}]});
async function leaderWater(){const o={name:'관장 하라'};
  if(G.badges[1]){await say('또 와 줬구나. 네 몬스터들은 정말 행복해 보여.',o);await say('앞으로도 함께 넓은 세상을 원정하렴!',o);return;}
  await say('어서 와. 나는 물결마을 체육관 관장 하라.',o);
  await say('물은 부드럽지만 바위도 깎아 내는 힘이 있지. 너와 몬스터의 유대, 내 물결로 시험해 볼게!',o);
  const r=await battle({kind:'trainer',cls:'leader',name:'하라',look:'leaderWater',team:[[29,18],[19,19],[20,21]],music:'leader',bg:'water',leader:1,
    lose:'멋져... 너희의 물결이 내 물결보다 더 높았어.'});
  if(r!=='win')return;
  await say('정말 훌륭한 승부였어. 이 배지를 받아 줘.',o);
  G.badges[1]=1;G.flags.badge1=1;await Music.jingle('badge');await say(`${J(G.name,'은')} 관장 하라에게서 물결 배지를 받았다!`);
  await say('두 개의 배지를 모은 너는 이제 어엿한 원정대원이야. 축하해!',o);
  if(!G.flags.clear){G.flags.clear=1;await credits();}}
