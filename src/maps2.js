/* =========================================================
   maps2.js — 물결마을 이후: 3번 도로 → 붉은재마을 → 4번 도로 → 번개도시(검은안개단 발전소) → 5번 도로 → 하늘봉마을
   ========================================================= */
const ASH={ash:1,tg:'#5e7a3a'},ALP={g:'#98cc7c',tg:'#3f8f48'};
function houseMap(id,name,out,ox,oy,region,npcs){defMap(id,{name,music:'town',bg:'lab',floor:'wood',wall:'#e8d8c0',region,
  rows:['wwwwwwwwww','wwwwwwwwww','SS..v...pp','..........','...TT.....','...TT.....','p........p','....mm....'],
  warps:{'4,7':[out,ox,oy,'down'],'5,7':[out,ox,oy,'down']},npcs});}
const rv=(id,x,y,dir,cond,run)=>({id,x,y,dir,look:'rival',name:RIVAL,cond,talk:run,sight:run});
const gate=(id,x,y,cond,text)=>({id,x,y,dir:'down',look:'guide',name:'경비원',cond,text});

/* ------------------------------ 3번 도로 (화산길) ------------------------------ */
defMap('route3',{name:'3번 도로',out:1,music:'route',bg:'rock',region:'route3',pal:ASH,
 rows:[
  '^^^^^^^^^^^=^^^^^^^^^^^^',
  '^^^^^^^::::=:::::^^^^^^^',
  '^^^^^^^::::=:::::^^^^^^^',
  '^^^^^^^::::=:s:::^^^^^^^',
  '^^^^^^^::::=======^^^^^^',
  '^^^^^^^:::::::,,,=,,:::^',
  '^:::::::::::::,,,=,,:::^',
  '^::,,,,,,:::::,,,=,,:::^',
  '^::,,,,,,:::::,,,=,,:::^',
  '^::,,,,,,::::::::=:::::^',
  '^::,,,,,,::=======:::::^',
  '^::::::::::=:::::::::::^',
  '^^^^^^^^^^:=::^^^^^^^^^^',
  '^:::::======:::::::::::^',
  '^:::r:=::::::::::::::::^',
  '^:::::=:::::,,,,,,,,,::^',
  '^:::::======,,,,,,,,,::^',
  '^:,,,,,,,::=,,,,,,,,,::^',
  '^:,,,,,,,::=,,,,,,,,,::^',
  '^:,,,,,,,::=,,,,,,,,,::^',
  '^:,,,,,,,LL=LLL::::::::^',
  '^::::::::::=:::::::::::^',
  '^^^^^::::::=:::::::^^^^^',
  '^^^^^::::::=::::%%%^^^^^',
  '^^^^^%%%:::=::::%%%^^^^^',
  '^^^^^%%%:::=:::::::^^^^^',
  '^^^^^::::::=:::::::^^^^^',
  '^^^^^^^^^^^=^^^^^^^^^^^^'],
 links:{n:'town2',s:'town3'},
 enc:[[23,17,20,18],[27,17,20,16],[21,17,19,16],[24,19,21,6],[22,20,21,4],[29,17,19,8],[19,17,19,8],[28,19,21,6],[25,17,19,10],[2,19,20,2]],
 signs:{'13,3':['3번 도로','↑ 물결마을 · ↓ 붉은재마을  (용암 조심!)']},
 items:[{x:20,y:6,item:'super',n:1,flag:'i_r3a'},{x:2,y:21,item:'lvup',n:2,flag:'i_r3b'},{x:3,y:14,item:'great',n:2,flag:'i_r3c'},{x:21,y:21,item:'burnheal',n:2,flag:'i_r3d'}],
 npcs:[{id:'tr_taesan',x:15,y:3,dir:'down',look:'hiker',trainer:{cls:'hiker',name:'태산',team:[[23,18],[27,18]],intro:['화산길을 오르려면 다리 힘부터 길러야지!'],lose:'용암보다 뜨거운 승부였다...',after:['붉은재마을 관장 화련은 불꽃 타입의 달인이야. 물 기술을 챙겨 가라고!']}},
   {id:'tr_minhyuk',x:20,y:9,dir:'left',look:'camper',trainer:{cls:'camper',name:'민혁',team:[[21,18],[25,18],[10,19]],intro:['여기서 캠핑하면 밤에도 따뜻해!'],lose:'텐트가 타 버렸어...',after:['남쪽 마을 사람들이 요즘 검은 옷 입은 무리 때문에 걱정이 많대.']}},
   {id:'tr_grunt1',x:5,y:13,dir:'right',look:'villain',trainer:{cls:'grunt',name:'정찰병',team:[[25,19],[29,19]],intro:['멈춰라! 검은안개단의 정찰을 방해하지 마!'],lose:'크윽... 두목님께 보고해야겠다!',after:['우리 검은안개단은 이 지방 몬스터들의 힘을 모으고 있지. 흐흐...']}},
   {id:'tr_yuna',x:14,y:17,dir:'left',look:'lady',trainer:{cls:'lass',name:'유나',team:[[19,19],[20,20]],intro:['화산길에서도 물 타입이 최고예요!'],lose:'증발해 버렸어요...',after:['개굴왕은 빨라서 선공을 잡기 좋아요.']}},
   {id:'r3_old',x:8,y:21,dir:'right',look:'old',name:'할아버지',wander:1,text:['저 아래 붉은재마을은 화산 기슭에 있는 온천 마을이라네.','용암 웅덩이에는 절대 다가가지 말게!']}]});

/* ------------------------------ 붉은재마을 ------------------------------ */
defMap('town3',{name:'붉은재마을',out:1,music:'city',bg:'rock',region:'town3',pal:ASH,
 rows:[
  '^^^^^^^^^^^=^^^^^^^^^^^^',
  '^::::::::::=::::::::^^^^',
  '^::CCCCC:::=:::GGGGGG::^',
  '^::CCCCC:::=:::GGGGGG::^',
  '^::CCCCC:::=:::GGGGGG::^',
  '^::CCDCC:::=:::GGGDGG::^',
  '^::::=:::::=:s::::=::::^',
  '^::::=:::::=::::::=::::^',
  '^:::==:::::=============',
  '^:::=::::::=:::::::::::^',
  '^::MMMM::::=::::::::ff:^',
  '^::MMMM::::=:::::::::::^',
  '^::MMMM::::=::::HHHH:::^',
  '^::MDMM:::%%%%r:HHHH:::^',
  '^:::=::::r%%%%::HHHH:::^',
  '^:::=:::::%%%%::HDHH:::^',
  '^^^^=::::::::::::=:::::^',
  '^^^^===ff=========:::::^',
  '^^^^:::::::::::::::::::^',
  '^^^^^^^^^^^^^^^^^^^^^^^^'],
 links:{n:'route3',e:'route4'},
 warps:{'5,5':['center3',6,8,'up'],'4,13':['mart3',5,7,'up'],'18,5':['gym3',6,14,'up'],'17,15':['house3',4,6,'up']},
 signs:{'13,6':['붉은재마을','화산이 지켜 주는 따끈한 온천 마을']},
 npcs:[{id:'t3_old',x:8,y:7,dir:'down',look:'old',name:'할아버지',text:['붉은재마을의 온천은 몬스터의 피로도 싹 풀어 준다네.','관장 화련은 불같은 성격이지만 정이 많은 사람이야.']},
   {id:'t3_lady',x:14,y:10,dir:'left',look:'lady',name:'아가씨',wander:1,text:['며칠 전에 검은 옷을 입은 사람들이 동쪽으로 몰려갔어요.','번개도시 쪽이라던데... 무슨 일이 생기지 않았으면 좋겠어요.']},
   {id:'t3_kid',x:20,y:13,dir:'up',look:'kid',name:'꼬마',wander:1,text:['불꽃 타입에는 물, 바위, 땅 기술이 잘 통해!']},
   gate('t3_gate',22,8,()=>!G.flags.badge2,['이 앞 4번 도로는 검은안개단 때문에 위험해서 막아 두었어.','붉은재마을 체육관의 불꽃 배지를 얻으면 지나가게 해 주지.']),
   rv('rival4',21,7,'down',()=>G.flags.badge2&&!G.flags.rival4,rival4)]});
centerMap('center3','town3',5,6,'town3');
martMap('mart3','town3',4,14,'town3');
houseMap('house3','붉은재마을 민가','town3',17,16,'town3',[{id:'h3_m',x:6,y:4,dir:'left',look:'granny',name:'할머니',text:['온천 달걀 하나 먹고 가렴. 아, 몬스터는 못 먹는다고?','레벨업 물약은 상점에서 싸게 팔더구나. 몬스터를 빨리 키우고 싶을 때 쓰렴.']}]);
async function rival4(){if(G.flags.rival4)return;G.flags.rival4=1;const r=npcById('rival4');Music.play('rival');
  await say(`${nm()}! 불꽃 배지도 땄다며? 나도 방금 땄다고!`,{name:RIVAL});
  await say('근데 들었어? 검은안개단이라는 녀석들이 번개도시 발전소를 점령했대. 그 전에 몸 좀 풀고 가자!',{name:RIVAL});
  await battle({kind:'trainer',cls:'rival',name:RIVAL,team:rivalTeam(4),look:'rival',music:'rival',bg:'rock',lose:'쳇... 역시 넌 강하구나.'});
  if(state!=='world')return;
  await say('좋아, 같이 가자고 하고 싶지만... 나는 나만의 방식으로 검은안개단을 막아 보겠어. 번개도시에서 보자!',{name:RIVAL});
  r.hide=1;sfx('exit');Music.play(curMap().music);}
defMap('gym3',{name:'붉은재마을 체육관',music:'gym',bg:'rock',floor:'stone',wall:'#a8483a',region:'town3',
 rows:['wwwwwwwwwwwww','wwwwwwwwwwwww','%%%..ccc..%%%','%...........%','%.%%%%.%%%%.%','%...........%','%%%.%%%%%.%%%','%...........%','%.%%%%.%%%%.%','%...........%','%%%%.%%%.%%%%','%...........%','%...........%','%...Y...Y...%','%...........%','%%%%%%m%%%%%%'],
 warps:{'6,15':['town3',18,6,'down']},
 obj:{'4,13':()=>statue(2),'8,13':()=>statue(2)},
 npcs:[{id:'g3_guide',x:3,y:14,dir:'right',look:'guide',name:'체육관 안내원',text:['여긴 정말 덥지? 관장 화련은 불꽃 타입의 달인이야.','불꽃에는 물·바위·땅 기술이 효과가 굉장해. 풀이나 벌레는 금방 타 버리지!']},
   {id:'tr_bulsoo',x:10,y:11,dir:'left',look:'camper',trainer:{cls:'camper',name:'불수',team:[[21,23],[22,24]],intro:['내 불꽃 여우들의 춤을 봐라!'],lose:'불씨가 꺼졌다...',after:['관장님의 화르릉은 불꽃을 두 번이나 뿜는다니까!']}},
   {id:'tr_hwaa',x:2,y:7,dir:'right',look:'girl',trainer:{cls:'girl',name:'화아',team:[[1,22],[2,24]],intro:['뜨거운 승부 좋아해?'],lose:'앗 뜨거워!',after:['물 타입 몬스터를 데려왔구나? 현명해!']}},
   {id:'leader3',x:6,y:2,dir:'down',look:'leaderFire',name:'관장 화련',talk:leaderFire}]});
async function leaderFire(){const o={name:'관장 화련'};
  if(G.badges[2]){await say('하하! 다시 왔구나. 네 몬스터들의 눈빛은 아직도 활활 타오르고 있어!',o);await say('동쪽 번개도시에 검은안개단이 있다던데... 조심하라고!',o);return;}
  await say('왔구나, 도전자! 나는 붉은재마을 체육관 관장 화련!',o);
  await say('화산처럼 끓어오르는 열정이 없으면 이길 수 없어. 네 열정, 불꽃으로 시험해 주지!',o);
  const r=await battle({kind:'trainer',cls:'leader',name:'화련',look:'leaderFire',team:[[21,25],[2,27],[22,29]],music:'leader',bg:'rock',leader:1,lose:'크하하! 완전히 불타 버렸어! 네 열정이 더 뜨거웠다!'});
  if(r!=='win')return;
  await say('좋아, 이 배지를 받아라!',o);
  G.badges[2]=1;G.flags.badge2=1;await Music.jingle('badge');await say(`${J(G.name,'은')} 관장 화련에게서 불꽃 배지를 받았다!`);
  await say('이제 동쪽 4번 도로로 갈 수 있을 거야. 그 너머 번개도시 발전소를 검은안개단이 점령했다는 소문이 있다.',o);
  await say('도시 전체가 정전이라 체육관도 문을 닫았다더군. 네가 가서 해결해 주지 않겠어?',o);}

/* ------------------------------ 4번 도로 (들판) ------------------------------ */
defMap('route4',{name:'4번 도로',out:1,music:'route',bg:'grass',region:'route4',
 rows:[
  '##################################',
  '#................................#',
  '#.,,,,,,,,.~~...........,,,,,,,..#',
  '#.,,,,,,,,.~~.....r.....,,,,,,,..#',
  '#.,,,,,,,,.~~...........,,,,,,,..#',
  '#.,,,,,,,,.~~...........,,,,,,,..#',
  '#..s.......~~.........F..........#',
  '#...E.....E~~...E.....E.....E....#',
  '==================================',
  '#=================================',
  '#...E.....E.....E.....E.....E....#',
  '#............,,,,,,,,.....,,,,,,.#',
  '#.....FFFF...,,,,,,,,.....,,,,,,.#',
  '#............,,,,,,,,.....,,,,,,.#',
  '#fff.........,,,,,,,,.....,,,,,,.#',
  '#fff.........,,,,,,,,.........r..#',
  '#................................#',
  '##################################'],
 links:{w:'town3',e:'town4'},
 enc:[[17,22,26,14],[15,22,25,8],[16,24,27,8],[10,22,25,12],[11,24,26,6],[12,22,24,6],[14,24,26,4],[25,22,25,10],[19,23,25,8],[18,25,27,4],[13,22,24,6]],
 signs:{'3,6':['4번 도로','← 붉은재마을 · → 번개도시']},
 items:[{x:30,y:3,item:'lvup',n:2,flag:'i_r4a'},{x:2,y:12,item:'fullheal',n:1,flag:'i_r4b'},{x:31,y:15,item:'great',n:3,flag:'i_r4c'}],
 npcs:[{id:'tr_gicheol',x:9,y:5,dir:'down',look:'man',trainer:{cls:'engineer',name:'기철',team:[[17,23],[18,25]],intro:['이 전신주들은 내가 다 점검했다고! 근데 갑자기 전기가 끊겼어...'],lose:'합선이다...',after:['번개도시 발전소에 이상한 녀석들이 들어갔다는 얘기가 있어.']}},
   {id:'tr_sol',x:17,y:12,dir:'up',look:'camper',trainer:{cls:'birdkeeper',name:'솔이',team:[[10,23],[11,25]],intro:['새들의 날갯짓을 봐!'],lose:'깃털이 다 빠졌어...',after:['하늘봉마을의 관장은 비행 타입을 아주 잘 다룬대.']}},
   {id:'tr_grunt2',x:24,y:7,dir:'left',look:'villain',trainer:{cls:'grunt',name:'단원',team:[[26,24],[30,24]],intro:['여기서부턴 검은안개단의 구역이다! 썩 돌아가!'],lose:'이, 이럴 수가...',after:['두목님은 발전소에서 거대한 계획을 준비 중이시다!']}},
   {id:'tr_grunt3',x:29,y:10,dir:'up',look:'villain',trainer:{cls:'grunt',name:'단원',team:[[16,24],[28,25]],intro:['발전소에는 한 발짝도 못 들어간다!'],lose:'크윽, 꼬마 주제에...',after:['흥, 두목님께는 상대도 안 될걸!']}},
   {id:'r4_kid',x:6,y:14,dir:'right',look:'kid',name:'꼬마',wander:1,text:['전기 타입은 물이랑 비행에 강해! 땅에는 하나도 안 통하고.']}]});

/* ------------------------------ 번개도시 ------------------------------ */
defMap('town4',{name:'번개도시',out:1,music:'city',bg:'city',region:'town4',
 rows:[
  '############=#############',
  '#...........=............#',
  '#.CCCCC.....=.....GGGGGG.#',
  '#.CCCCC.....=.....GGGGGG.#',
  '#.CCCCC.....=.....GGGGGG.#',
  '#.CCDCC.....=.....GGGDGG.#',
  '#...=...E.s.=...E....=...#',
  '#...=.......=........=...#',
  '==========================',
  '=========================#',
  '#............=.........ff#',
  '#............=.BBBBBBBB..#',
  '#.MMMM.......=.BBBBBBBB..#',
  '#.MMMM..HHHH.=.BBBBBBBB..#',
  '#.MMMM..HHHH.=.BBBBBBBB..#',
  '#.MDMM..HHHH.=.BBBBDBBB..#',
  '#..=....HDHH.=.....=.....#',
  '#..=================.....#',
  '#........................#',
  '##########################'],
 links:{w:'route4',n:'route5'},
 warps:{'4,5':['center4',6,8,'up'],'3,15':['mart4',5,7,'up'],'21,5':['gym4',6,14,'up'],'19,15':['plant',7,10,'up'],'9,16':['house4',4,6,'up']},
 signs:{'10,6':['번개도시','반짝이는 전기의 도시']},
 npcs:[gate('t4_gymgate',21,6,()=>!G.flags.plantClear,['발전소를 검은안개단이 점령해서 도시 전체가 정전이야...','체육관도 문을 닫았어. 누가 발전소를 되찾아 주면 좋을 텐데.']),
   gate('t4_north',12,1,()=>!G.flags.badge3,['이 앞 5번 도로는 험한 산길이야.','번개 배지를 가진 트레이너만 지나갈 수 있지.']),
   {id:'t4_man',x:15,y:9,dir:'down',look:'man',name:'아저씨',cond:()=>!G.flags.plantClear,text:['정전 때문에 아무것도 못 하겠어!','검은안개단 녀석들, 발전소 전기로 몬스터를 조종하는 기계를 만든다나 뭐라나...']},
   {id:'t4_man2',x:15,y:9,dir:'down',look:'man',name:'아저씨',cond:()=>G.flags.plantClear,text:['전기가 돌아왔어! 네가 해결해 줬다며? 정말 고마워!']},
   {id:'t4_girl',x:7,y:10,dir:'right',look:'girl',name:'소녀',wander:1,text:['관장 찌나 언니는 엄청 빠른 전기 몬스터를 쓴대!']},
   {id:'t4_rival',x:18,y:16,dir:'up',look:'rival',name:RIVAL,cond:()=>G.flags.rival4&&!G.flags.plantClear,talk:async()=>{await say(`${nm()}! 발전소 입구는 여기야. 안에 검은안개단 두목이 있대.`,{name:RIVAL});await say('나는 밖에서 도망치는 단원들을 막고 있을게. 안은 너한테 맡긴다!',{name:RIVAL});}}]});
centerMap('center4','town4',4,6,'town4');
martMap('mart4','town4',3,16,'town4');
houseMap('house4','번개도시 민가','town4',9,17,'town4',[{id:'h4_m',x:6,y:4,dir:'left',look:'mom',name:'아주머니',text:['TV도 안 나오고 냉장고도 꺼지고... 정전은 정말 싫어!']}]);
defMap('plant',{name:'번개 발전소',music:'gym',bg:'lab',floor:'lab',wall:'#4a4a5a',region:'town4',
 rows:['wwwwwwwwwwwwwww','wwwwwwwwwwwwwww','vvv...ccc...vvv','...............','KKKKK.....KKKKK','...............','..KKK.KKK.KKK..','...............','KKKK..KKK..KKKK','...............','...............','.......m.......'],
 warps:{'7,11':['town4',19,16,'down']},
 obj:{'0,2':['모니터에 "몬스터 조종 장치 · 충전 87%"라고 떠 있다.'],'1,2':['발전기가 위험하게 웅웅거리고 있다.'],'13,2':['모니터에 검은안개단의 문양이 떠 있다.'],'14,2':['발전기가 위험하게 웅웅거리고 있다.']},
 npcs:[{id:'tr_pg1',x:1,y:9,dir:'right',look:'villain',trainer:{cls:'grunt',name:'경비 단원',team:[[18,26],[26,26]],intro:['침입자다! 여기서 끝장을 내 주마!'],lose:'경, 경보를...!',after:['두목님은 안쪽에 계신다...']}},
   {id:'tr_pg2',x:13,y:5,dir:'left',look:'villain',trainer:{cls:'grunt',name:'경비 단원',team:[[30,26],[28,27]],intro:['두목님께 가려면 나를 쓰러뜨려야 할걸!'],lose:'두목님, 죄송합니다...',after:['우리 계획이...']}},
   {id:'boss',x:7,y:2,dir:'down',look:'boss',name:'흑운',cond:()=>!G.flags.plantClear,talk:bossPlant}]});
async function bossPlant(){const o={name:'검은안개단 두목 흑운'};
  await say('호오... 여기까지 오다니 제법이구나, 꼬마 트레이너.',o);
  await say('이 발전소의 전기로 몬스터 조종 장치를 완성하면, 이 지방의 모든 몬스터는 우리 검은안개단의 것이 된다!',o);
  await say('방해꾼은 안개 속으로 사라져라!',o);
  const r=await battle({kind:'trainer',cls:'boss',name:'흑운',look:'boss',team:[[26,30],[28,31],[30,32]],music:'rival',bg:'lab',lose:'이럴 수가... 나의 안개가 걷히다니...'});
  if(r!=='win')return;
  await say('크윽... 조종 장치는 포기하지. 하지만 검은안개단은 사라지지 않는다!',o);
  const b=npcById('boss');sfx('exit');b.hide=1;G.flags.plantClear=1;
  await sleep(400);sfx('save');await say('발전기가 다시 정상적으로 돌아가기 시작했다! 번개도시에 전기가 들어왔다!');
  await giveItem('lvup',3);
  await say('발전소 직원이 감사의 표시로 레벨업 물약을 주었다!');}
defMap('gym4',{name:'번개도시 체육관',music:'gym',bg:'city',floor:'lab',wall:'#3a3a5a',region:'town4',
 rows:['wwwwwwwwwwwww','wwwwwwwwwwwww','K....ccc....K','K...........K','K.KKKKKKKKK.K','K...........K','KKKKK.K.KKKKK','K...........K','K.KKK.K.KKK.K','K...........K','KKK.KKKKK.KKK','K...........K','K...........K','K...Y...Y...K','K...........K','KKKKKKmKKKKKK'],
 warps:{'6,15':['town4',21,6,'down']},
 obj:{'4,13':()=>statue(3),'8,13':()=>statue(3)},
 npcs:[{id:'g4_guide',x:3,y:14,dir:'right',look:'guide',name:'체육관 안내원',text:['전기가 돌아와서 다행이야! 관장 찌나는 전기 타입 전문이지.','전기는 땅 타입에게 전혀 통하지 않아. 땅 타입 몬스터가 있다면 든든할 거야!']},
   {id:'tr_jjirit',x:10,y:9,dir:'left',look:'man',trainer:{cls:'engineer',name:'번쩍',team:[[17,28],[17,28],[18,29]],intro:['고압 전류 맛 좀 볼래?'],lose:'퓨즈가 나갔다...',after:['관장님의 번개냥은 정말 빨라!']}},
   {id:'tr_zap',x:2,y:5,dir:'right',look:'girl',trainer:{cls:'girl',name:'찌릿',team:[[18,29],[30,28]],intro:['찌릿찌릿 승부!'],lose:'방전됐어...',after:['땅 타입은 반칙이야!']}},
   {id:'leader4',x:6,y:2,dir:'down',look:'leaderElec',name:'관장 찌나',talk:leaderElec}]});
async function leaderElec(){const o={name:'관장 찌나'};
  if(G.badges[3]){await say('또 왔어? 발전소를 되찾아 준 거, 정말 고마워!',o);await say('북쪽 5번 도로 끝 하늘봉마을에 마지막 체육관이 있어. 힘내!',o);return;}
  await say('네가 발전소를 되찾아 준 트레이너구나! 고마워. 나는 번개도시 체육관 관장 찌나야.',o);
  await say('그렇다고 봐주진 않아! 번개처럼 빠른 내 몬스터들을 따라올 수 있을까?',o);
  const r=await battle({kind:'trainer',cls:'leader',name:'찌나',look:'leaderElec',team:[[17,31],[30,32],[18,34]],music:'leader',bg:'city',leader:1,lose:'와... 번개보다 빨랐어!'});
  if(r!=='win')return;
  await say('대단해! 이 배지를 받아!',o);
  G.badges[3]=1;G.flags.badge3=1;await Music.jingle('badge');await say(`${J(G.name,'은')} 관장 찌나에게서 번개 배지를 받았다!`);
  await say('이제 북쪽 5번 도로를 지나갈 수 있어. 산 정상의 하늘봉마을에 마지막 관장 하늬가 기다리고 있어!',o);}

/* ------------------------------ 5번 도로 (산길) ------------------------------ */
defMap('route5',{name:'5번 도로',out:1,music:'route',bg:'rock',region:'route5',pal:ALP,
 rows:[
  '^^^^^^^^^^^^=^^^^^^^^^^^^^',
  '^^^^^^......=.......^^^^^^',
  '^^^^^^.,,,,,=.......^^^^^^',
  '^^^^^^.,,,,,=.......^^^^^^',
  '^^^^^^.,,,,,=.......^^^^^^',
  '^^^^^^.,,,,,=.......^^^^^^',
  '^^^r^^......=.......^^^^^^',
  '^........LLL=LLLL...^^^^^^',
  '^...........======..^^^^^^',
  '^.............,,,=,,,....^',
  '^.,,,,,,,.....,,,=,,,....^',
  '^.,,,,,,,.....,,,=,,,....^',
  '^.,,,,,,,.....,,,=,,,....^',
  '^.,,,,,,,.....,,,=,,,....^',
  '^.,,,,,,,........=.......^',
  '^...........======....r..^',
  '^^^^^^^.....=....^^^^^^^^^',
  '^^^^^^^.....=....^^^^^^^^^',
  '^.....=======............^',
  '^.....=.,,,,,,,,.........^',
  '^.....=.,,,,,,,,..,,,,,,.^',
  '^.....=.,,,,,,,,..,,,,,,.^',
  '^.....=.,,,,,,,,..,,,,,,.^',
  '^.....=...........,,,,,,.^',
  '^..LLL=LL.........,,,,,,.^',
  '^.....=======............^',
  '^...........=.......rrr..^',
  '^...........=.s.....rrr..^',
  '^...........=............^',
  '^^^^^^^^^^^^=^^^^^^^^^^^^^'],
 links:{s:'town4',n:'town5'},
 enc:[[11,30,34,14],[24,30,34,12],[28,30,34,10],[22,31,34,8],[14,31,34,8],[26,30,33,10],[20,31,34,6],[18,32,34,6],[16,31,34,10],[30,32,34,4],[3,33,34,1],[6,33,34,1],[9,33,34,1]],
 signs:{'14,27':['5번 도로','↑ 하늘봉마을 · ↓ 번개도시  (가파른 산길)']},
 items:[{x:2,y:21,item:'revive',n:1,flag:'i_r5a'},{x:23,y:9,item:'lvup',n:3,flag:'i_r5b'},{x:7,y:1,item:'super',n:2,flag:'i_r5c'},{x:22,y:24,item:'fullheal',n:2,flag:'i_r5d'}],
 npcs:[{id:'tr_sandeul',x:4,y:20,dir:'right',look:'hiker',trainer:{cls:'ranger',name:'산들',team:[[24,32],[28,33]],intro:['산에서 조난당하지 않으려면 강해야 해!'],lose:'구조가 필요한 건 나였군...',after:['정상까지 조금만 더 힘내!']}},
   {id:'tr_baram',x:14,y:13,dir:'up',look:'camper',trainer:{cls:'birdkeeper',name:'바람',team:[[11,32],[14,32],[11,33]],intro:['산바람을 타는 새들이다!'],lose:'바람이 멎었다...',after:['하늬 관장님은 하늘을 나는 몬스터의 달인이셔.']}},
   {id:'tr_seokjin',x:18,y:18,dir:'left',look:'hiker',trainer:{cls:'hiker',name:'석진',team:[[24,34]],intro:['이 산의 바위처럼 단단한 내 몬스터!'],lose:'산이 무너졌다...',after:['물이나 풀 기술은 바위에 잘 통하지.']}},
   {id:'tr_grunt4',x:7,y:8,dir:'right',look:'villain',trainer:{cls:'grunt',name:'남은 단원',team:[[26,32],[30,33]],intro:['두목님의 복수다!'],lose:'흑흑, 검은안개단은 이제 끝이야...',after:['두목님은 조직을 해체하고 수행을 떠나셨대...']}}]});

/* ------------------------------ 하늘봉마을 ------------------------------ */
defMap('town5',{name:'하늘봉마을',out:1,music:'town',bg:'grass',region:'town5',pal:ALP,
 rows:[
  '^^^^^^^^^^^^^^^^^^^^^^^^^^',
  '^^^^^^^^^.FFFFFF.^^^^^^^^^',
  '^^^^^^^^^.....r..^^^^^^^^^',
  '^^^^^^^^^...=....^^^^^^^^^',
  '^^^^^^^^^...=....^^^^^^^^^',
  '^^^^^^^^^...=....^^^^^^^^^',
  '^........f..=..f.........^',
  '^........f..=..f..GGGGGG.^',
  '^.CCCCC..f..=..f..GGGGGG.^',
  '^.CCCCC..f..=..f..GGGGGG.^',
  '^.CCCCC.....=.s...GGGGGG.^',
  '^.CCDCC.....=.....GGGDGG.^',
  '^...=.......=........=...^',
  '^...==================...^',
  '^...........=............^',
  '^.MMMM......=............^',
  '^.MMMM......=......KKKK..^',
  '^.MMMM......=......KKKK..^',
  '^.MDMM......=......KKKK..^',
  '^..=........=......KDKK..^',
  '^..=........=.......=....^',
  '^..==================....^',
  '^...........=............^',
  '^^^^^^^^^^^^=^^^^^^^^^^^^^'],
 links:{s:'route5'},
 warps:{'4,11':['center5',6,8,'up'],'3,18':['mart5',5,7,'up'],'21,11':['gym5',6,14,'up'],'20,19':['house5',4,6,'up']},
 signs:{'14,10':['하늘봉마을','구름 위의 마을 · 정상까지 조금 더!']},
 npcs:[gate('t5_gate',12,5,()=>!G.flags.badge4,['이 위는 하늘봉 정상이야.','다섯 개의 배지를 모두 모은 트레이너만 오를 수 있지.']),
   {id:'t5_old',x:7,y:14,dir:'right',look:'old',name:'할아버지',wander:1,text:['이 마을은 구름보다 높은 곳에 있다네.','정상에서 보는 일출은 평생 잊지 못할 거야.']},
   {id:'t5_girl',x:16,y:20,dir:'up',look:'girl',name:'소녀',wander:1,text:['하늬 관장님의 몬스터는 하늘을 춤추듯 날아!','바위나 전기 기술이 비행 타입에 잘 통한대.']},
   {id:'t5_summit',x:12,y:2,dir:'down',look:'rival',name:RIVAL,cond:()=>G.flags.badge4&&!G.flags.clear2,talk:finalRival,sight:finalRival}]});
centerMap('center5','town5',4,12,'town5');
martMap('mart5','town5',3,19,'town5');
houseMap('house5','하늘봉마을 민가','town5',20,20,'town5',[{id:'h5_m',x:6,y:4,dir:'left',look:'aide',name:'기상학자',text:['여기서는 구름이 발밑으로 흘러가지.','날씨가 좋은 날엔 새싹마을까지 보인다네.']}]);
defMap('gym5',{name:'하늘봉마을 체육관',music:'gym',bg:'grass',floor:'sky',wall:'#bcd8f8',region:'town5',
 rows:['wwwwwwwwwwwww','wwwwwwwwwwwww','p....ccc....p','.............','pp.ppp.ppp.pp','.............','..ppp...ppp..','.............','ppp..ppp..ppp','.............','.pp.ppppp.pp.','.............','.............','....Y...Y....','.............','......m......'],
 warps:{'6,15':['town5',21,12,'down']},
 obj:{'4,13':()=>statue(4),'8,13':()=>statue(4)},
 npcs:[{id:'g5_guide',x:3,y:14,dir:'right',look:'guide',name:'체육관 안내원',text:['드디어 마지막 체육관이야! 관장 하늬는 비행 타입의 달인.','비행 타입에는 전기·바위 기술이 효과가 굉장하지!']},
   {id:'tr_gureum',x:11,y:11,dir:'left',look:'camper',trainer:{cls:'birdkeeper',name:'구름',team:[[11,34],[14,34]],intro:['구름 위의 승부다!'],lose:'추락했다...',after:['관장님의 마지막 몬스터는 정말 강해!']}},
   {id:'tr_haeun',x:1,y:7,dir:'right',look:'lady',trainer:{cls:'lass',name:'하은',team:[[10,33],[11,35]],intro:['하늘처럼 맑은 승부를!'],lose:'흐려졌어요...',after:['바위 기술을 준비했나요?']}},
   {id:'leader5',x:6,y:2,dir:'down',look:'leaderSky',name:'관장 하늬',talk:leaderSky}]});
async function leaderSky(){const o={name:'관장 하늬'};
  if(G.badges[4]){await say('정상에 올라가 보았니? 그곳에서 네 원정의 끝과 새로운 시작을 볼 수 있을 거야.',o);return;}
  await say('구름 위까지 잘 왔어. 나는 하늘봉마을 체육관 관장 하늬.',o);
  await say('네 개의 배지를 모은 트레이너라면 하늘을 날 자격이 있지. 마지막 시험을 시작할게!',o);
  const r=await battle({kind:'trainer',cls:'leader',name:'하늬',look:'leaderSky',team:[[14,37],[11,38],[26,38],[22,39],[11,41]],music:'leader',bg:'grass',leader:1,lose:'...아름다운 비행이었어. 너희는 진짜 하늘을 날았구나.'});
  if(r!=='win')return;
  await say('축하해. 마지막 배지야.',o);
  G.badges[4]=1;G.flags.badge4=1;await Music.jingle('badge');await say(`${J(G.name,'은')} 관장 하늬에게서 창공 배지를 받았다!`);
  await say('다섯 개의 배지를 모두 모았구나! 이제 하늘봉 정상에 오를 수 있어.',o);
  await say('정상에서 누군가 너를 기다리고 있는 것 같던데?',o);}
async function finalRival(){if(G.flags.clear2)return;const r=npcById('t5_summit');Music.play('rival');
  await say(`왔구나, ${nm()}. 나도 다섯 번째 배지를 따고 여기서 기다리고 있었어.`,{name:RIVAL});
  await say('새싹마을에서 처음 몬스터를 받은 날부터 지금까지... 넌 늘 나보다 한 발 앞서 있었지.',{name:RIVAL});
  await say('하지만 오늘은 다를 거야. 이 정상에서, 누가 진짜 최고의 원정대원인지 가리자!',{name:RIVAL});
  const res=await battle({kind:'trainer',cls:'rival',name:RIVAL,team:rivalTeam(5),look:'rival',music:'leader',bg:'grass',lose:'...졌다. 완벽하게 졌어.',noLose:1,winMsg:'이겼다...! 하지만 다음엔 너도 더 강해져서 오겠지.'});
  if(state!=='world')return;
  await say(res==='win'?'역시 넌 대단해. 인정할게... 네가 최고의 원정대원이야!':'후우... 이번엔 내가 이겼지만, 넌 정말 강했어.',{name:RIVAL});
  await say('봐, 해가 뜬다. 우리 원정은 여기서 끝이 아니야. 언젠가 또 승부하자!',{name:RIVAL});
  G.flags.clear2=1;r.hide=1;await credits(true);}
