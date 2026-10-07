/* =========================================================
   data.js — 타입, 기술, 몬스터, 도구, 성격, 트레이너 (모두 오리지널)
   ========================================================= */
const TYPES={normal:{n:'노말',c:'#a8a878'},fire:{n:'불꽃',c:'#f08030'},water:{n:'물',c:'#6890f0'},grass:{n:'풀',c:'#78c850'},
  elec:{n:'전기',c:'#f0c418'},rock:{n:'바위',c:'#b8a038'},ground:{n:'땅',c:'#d8a858'},fly:{n:'비행',c:'#a890f0'},bug:{n:'벌레',c:'#98b020'},poison:{n:'독',c:'#a040a0'}};
const CHART={normal:{rock:.5},
  fire:{grass:2,bug:2,fire:.5,water:.5,rock:.5},
  water:{fire:2,rock:2,ground:2,water:.5,grass:.5},
  grass:{water:2,rock:2,ground:2,fire:.5,grass:.5,fly:.5,bug:.5,poison:.5},
  elec:{water:2,fly:2,grass:.5,elec:.5,ground:0},
  rock:{fire:2,fly:2,bug:2,ground:.5},
  ground:{fire:2,elec:2,rock:2,poison:2,grass:.5,bug:.5,fly:0},
  fly:{grass:2,bug:2,rock:.5,elec:.5},
  bug:{grass:2,fire:.5,fly:.5,poison:.5},
  poison:{grass:2,poison:.5,ground:.5,rock:.5}};
const eff1=(a,d)=>{const r=CHART[a]&&CHART[a][d];return r===undefined?1:r;};
const effT=(a,ts)=>ts.reduce((m,t)=>m*eff1(a,t),1);
const tb=t=>`<span class="tb" style="background:${TYPES[t].c}">${TYPES[t].n}</span>`;
const STN=['HP','공격','방어','특수공격','특수방어','스피드'];
const STATUS={psn:{n:'독',c:'#a040a0'},brn:{n:'화상',c:'#e8622c'},par:{n:'마비',c:'#d8b020'},slp:{n:'잠듦',c:'#8a8aa0'}};
const stb=s=>s?`<span class="stb" style="background:${STATUS[s].c}">${STATUS[s].n}</span>`:'';

/* 기술: [id, 이름, 타입, 분류(p 물리/s 특수/x 변화), 위력, 명중(0=필중), PP, 효과, 설명] */
const MV={};
[['tackle','들이받기','normal','p',40,100,35,null,'몸 전체로 상대에게 부딪친다.'],
 ['scratch','할퀴기','normal','p',40,100,35,null,'날카로운 발톱으로 상대를 할퀸다.'],
 ['growl','으르렁대기','normal','x',0,100,40,{foe:[[1,-1]]},'으르렁거려 상대의 공격을 떨어뜨린다.'],
 ['tailwag','꼬리살랑','normal','x',0,100,30,{foe:[[2,-1]]},'꼬리를 흔들어 방심시켜 상대의 방어를 떨어뜨린다.'],
 ['harden','몸굳히기','normal','x',0,0,30,{self:[[2,1]]},'온몸에 힘을 주어 자신의 방어를 올린다.'],
 ['quick','날쌘돌격','normal','p',40,100,30,{pri:1},'눈에 보이지 않는 속도로 반드시 먼저 공격한다.'],
 ['headbutt','돌진박치기','normal','p',70,100,15,{flinch:30},'머리부터 돌진한다. 상대가 풀죽을 때가 있다.'],
 ['focus','기합모으기','normal','x',0,0,20,{self:[[1,2]]},'기합을 모아 자신의 공격을 크게 올린다.'],
 ['sing','자장노래','normal','x',0,55,15,{status:'slp'},'포근한 노래로 상대를 잠재운다.'],
 ['takedown','무모한돌진','normal','p',90,85,20,{recoil:25},'맹렬하게 부딪친다. 자신도 반동 데미지를 입는다.'],
 ['struggle','발버둥','normal','p',50,0,1,{recoil:25},'쓸 수 있는 기술이 없을 때 쓰는 마지막 수단.'],
 ['ember','불씨뿌리기','fire','s',40,100,25,{st:['brn',10]},'작은 불꽃을 뿌린다. 화상을 입힐 때가 있다.'],
 ['flamewheel','화염구르기','fire','p',60,100,25,{st:['brn',10]},'불꽃을 두르고 구르며 돌진한다. 화상을 입힐 때가 있다.'],
 ['willo','도깨비불꽃','fire','x',0,85,15,{status:'brn'},'불길한 불꽃을 날려 상대에게 화상을 입힌다.'],
 ['firefang','불꽃엄니','fire','p',65,95,15,{st:['brn',10],flinch:10},'불꽃을 머금은 이빨로 문다.'],
 ['flameburst','업화폭발','fire','s',90,100,15,{st:['brn',10]},'거센 불꽃을 터뜨린다. 화상을 입힐 때가 있다.'],
 ['bubble','물방울총','water','s',40,100,30,{stat:['foe',5,-1,10]},'거품을 쏘아 공격한다. 스피드를 떨어뜨릴 때가 있다.'],
 ['watergun','물줄기','water','s',60,100,25,null,'강한 물줄기를 뿜어 공격한다.'],
 ['withdraw','껍질숨기','water','x',0,0,40,{self:[[2,1]]},'몸을 웅크려 자신의 방어를 올린다.'],
 ['aquatail','물꼬리치기','water','p',80,90,10,null,'물결처럼 꼬리를 휘둘러 공격한다.'],
 ['wave','해일','water','s',90,100,10,null,'거대한 파도로 상대를 덮친다.'],
 ['vine','덩굴때리기','grass','p',45,100,25,null,'채찍 같은 덩굴로 때린다.'],
 ['absorb','뿌리흡수','grass','s',40,100,25,{drain:50},'상대의 양분을 빨아들여 준 데미지의 절반만큼 회복한다.'],
 ['leaf','잎사귀칼날','grass','p',60,95,25,{crit:1},'날카로운 잎사귀로 벤다. 급소에 맞기 쉽다.'],
 ['sleeppowder','잠가루','grass','x',0,75,15,{status:'slp'},'졸음이 오는 가루를 뿌려 상대를 잠재운다.'],
 ['growth','광합성','grass','x',0,0,20,{self:[[1,1],[3,1]]},'햇빛을 모아 공격과 특수공격을 올린다.'],
 ['petal','꽃잎폭풍','grass','s',90,100,10,null,'꽃잎을 폭풍처럼 흩날려 공격한다.'],
 ['thundershock','전기충격','elec','s',40,100,30,{st:['par',10]},'전기를 흘려 공격한다. 마비시킬 때가 있다.'],
 ['spark','찌릿돌진','elec','p',65,100,20,{st:['par',30]},'전기를 두르고 돌진한다. 마비시킬 때가 있다.'],
 ['thunderwave','마비파동','elec','x',0,90,20,{status:'par'},'약한 전기를 흘려 상대를 마비시킨다.'],
 ['thunder','천둥벼락','elec','s',90,100,15,{st:['par',10]},'강한 번개를 떨어뜨린다. 마비시킬 때가 있다.'],
 ['rockthrow','돌던지기','rock','p',50,90,15,null,'작은 바위를 들어 던진다.'],
 ['rocktomb','바위감옥','rock','p',60,95,15,{stat:['foe',5,-1,100]},'바위로 가둬 상대의 스피드를 떨어뜨린다.'],
 ['rockslide','바위사태','rock','p',75,90,10,{flinch:30},'큰 바위들을 쏟아붓는다. 풀죽게 할 때가 있다.'],
 ['defcurl','바위껍질','rock','x',0,0,20,{self:[[2,2]]},'몸을 바위처럼 굳혀 방어를 크게 올린다.'],
 ['mudslap','진흙뿌리기','ground','s',20,100,10,{stat:['foe',5,-1,100]},'진흙을 뿌려 상대의 스피드를 떨어뜨린다.'],
 ['dig','땅흔들기','ground','p',60,100,20,null,'땅을 흔들어 상대를 공격한다.'],
 ['bulldoze','대지가르기','ground','p',90,100,10,null,'대지를 갈라 엄청난 힘으로 공격한다.'],
 ['gust','돌풍','fly','s',40,100,35,null,'날개로 돌풍을 일으켜 공격한다.'],
 ['wing','날갯짓','fly','p',60,100,35,null,'커다란 날개로 상대를 친다.'],
 ['aerial','급강하','fly','p',80,95,15,null,'높은 곳에서 급강하하며 들이받는다.'],
 ['stringshot','끈적실','bug','x',0,95,40,{foe:[[5,-2]]},'끈적한 실을 감아 상대의 스피드를 크게 떨어뜨린다.'],
 ['bite','물어뜯기','bug','p',45,100,25,null,'튼튼한 턱으로 물어뜯는다.'],
 ['silver','반짝가루','bug','s',60,100,15,{stat:['self',3,1,30]},'반짝이는 가루를 날린다. 특수공격이 오를 때가 있다.'],
 ['leechsting','흡혈침','bug','p',40,100,20,{drain:50},'침을 꽂아 데미지의 절반만큼 회복한다.'],
 ['poisonsting','독바늘','poison','p',20,100,35,{st:['psn',30]},'독바늘로 찌른다. 독에 걸리게 할 때가 있다.'],
 ['acid','독액분사','poison','s',65,100,20,{st:['psn',30]},'독액을 뿜는다. 독에 걸리게 할 때가 있다.'],
 ['toxspore','독포자','poison','x',0,75,35,{status:'psn'},'독이 든 포자를 뿌려 상대를 독에 걸리게 한다.'],
].forEach(([id,n,t,c,p,a,pp,fx,d])=>MV[id]={id,n,t,c,p,a,pp,fx:fx||{},d});
const CATN={p:'물리',s:'특수',x:'변화'};

/* 습득 기술 (진화 계열 공용) */
const LS={
 fire:[[1,'scratch'],[1,'growl'],[5,'ember'],[9,'quick'],[13,'focus'],[16,'flamewheel'],[21,'firefang'],[27,'willo'],[33,'flameburst'],[36,'bulldoze']],
 water:[[1,'tackle'],[1,'tailwag'],[5,'bubble'],[9,'withdraw'],[13,'watergun'],[18,'headbutt'],[23,'aquatail'],[29,'rocktomb'],[34,'rockslide'],[38,'wave']],
 grass:[[1,'tackle'],[1,'growl'],[5,'vine'],[9,'absorb'],[13,'toxspore'],[15,'sleeppowder'],[19,'leaf'],[24,'growth'],[29,'acid'],[34,'petal']],
 bird:[[1,'tackle'],[1,'growl'],[5,'gust'],[9,'quick'],[14,'wing'],[19,'focus'],[25,'aerial'],[31,'takedown']],
 bug:[[1,'tackle'],[1,'stringshot'],[7,'harden'],[10,'gust'],[12,'sleeppowder'],[15,'silver'],[18,'leechsting'],[23,'wing'],[28,'toxspore']],
 rat:[[1,'tackle'],[1,'tailwag'],[4,'quick'],[8,'bite'],[13,'headbutt'],[20,'focus'],[24,'takedown']],
 elec:[[1,'tackle'],[1,'growl'],[5,'thundershock'],[9,'quick'],[13,'thunderwave'],[17,'spark'],[24,'focus'],[30,'thunder']],
 frog:[[1,'bubble'],[1,'growl'],[7,'quick'],[11,'watergun'],[16,'mudslap'],[22,'aquatail'],[28,'wave']],
 fox:[[1,'ember'],[1,'tailwag'],[7,'quick'],[12,'willo'],[17,'flamewheel'],[24,'firefang'],[30,'flameburst']],
 rock:[[1,'tackle'],[1,'defcurl'],[5,'mudslap'],[9,'rockthrow'],[13,'rocktomb'],[18,'dig'],[24,'rockslide'],[30,'bulldoze']],
 shroom:[[1,'poisonsting'],[1,'absorb'],[6,'toxspore'],[11,'sleeppowder'],[16,'acid'],[22,'leechsting'],[28,'leaf']],
 mole:[[1,'scratch'],[1,'growl'],[5,'mudslap'],[9,'quick'],[14,'dig'],[20,'headbutt'],[26,'bulldoze']],
 jelly:[[1,'poisonsting'],[1,'bubble'],[7,'withdraw'],[12,'acid'],[17,'watergun'],[23,'toxspore'],[30,'wave']]};

/* 몬스터: t 타입, b [HP,공격,방어,특공,특방,스피드], x 경험치, c 포획률, ev [진화Lv, 번호], st 단계, cat 분류, h 키(m), w 몸무게(kg) */
const SP={
 1:{n:'불똥이',t:['fire'],b:[39,52,43,60,50,65],x:62,c:45,ls:LS.fire,ev:[16,2],st:0,line:1,cat:'불씨',h:.6,w:8.5,d:'꼬리 끝의 불씨로 기분을 나타낸다. 신이 나면 불꽃이 커진다.'},
 2:{n:'화르릉',t:['fire'],b:[58,64,58,80,65,80],x:142,c:45,ls:LS.fire,ev:[34,3],st:1,line:1,cat:'화염',h:1.1,w:19,d:'온몸에 열기를 두르고 있다. 화가 나면 주변 공기가 일렁인다.'},
 3:{n:'폭염수',t:['fire','ground'],b:[78,94,78,100,80,95],x:240,c:45,ls:LS.fire,st:2,line:1,cat:'폭염',h:1.8,w:90.5,d:'발걸음마다 땅이 녹아내린다. 화산 지대를 영역으로 삼는다.'},
 4:{n:'물방울',t:['water'],b:[44,48,65,50,64,43],x:63,c:45,ls:LS.water,ev:[16,5],st:0,line:4,cat:'물방울',h:.5,w:9,d:'몸이 말랑한 물로 되어 있다. 햇볕이 강하면 조금 작아진다.'},
 5:{n:'물결군',t:['water'],b:[59,63,80,65,80,58],x:142,c:45,ls:LS.water,ev:[34,6],st:1,line:4,cat:'물결',h:1,w:22.5,d:'등지느러미로 파도를 일으킨다. 바다의 수호자라 불린다.'},
 6:{n:'해일왕',t:['water','rock'],b:[79,83,100,85,105,78],x:239,c:45,ls:LS.water,st:2,line:4,cat:'해일',h:1.6,w:85.5,d:'바위 갑옷을 두른 바다의 왕. 한 번 울면 해일이 일어난다고 한다.'},
 7:{n:'새싹콩',t:['grass'],b:[45,49,49,65,65,45],x:64,c:45,ls:LS.grass,ev:[16,8],st:0,line:7,cat:'새싹',h:.7,w:6.9,d:'머리의 새싹으로 햇빛을 모은다. 비 오는 날을 좋아한다.'},
 8:{n:'덩굴콩',t:['grass','poison'],b:[60,62,63,80,80,60],x:141,c:45,ls:LS.grass,ev:[32,9],st:1,line:7,cat:'덩굴',h:1,w:13,d:'튼튼한 덩굴로 적을 붙잡는다. 덩굴 끝에는 약한 독이 있다.'},
 9:{n:'숲거목',t:['grass','poison'],b:[80,82,83,100,100,80],x:236,c:45,ls:LS.grass,st:2,line:7,cat:'거목',h:2,w:100,d:'등의 거목에서 독꽃이 핀다. 숲 전체의 나무와 대화한다고 한다.'},
 10:{n:'짹짹이',t:['normal','fly'],b:[40,45,40,35,35,56],x:50,c:255,ls:LS.bird,ev:[14,11],st:0,line:10,cat:'꼬마새',h:.3,w:1.8,d:'아침마다 시끄럽게 지저귄다. 무리 지어 날아다닌다.'},
 11:{n:'날쌘매',t:['normal','fly'],b:[63,60,55,50,50,71],x:122,c:120,ls:LS.bird,st:1,line:10,cat:'맹금',h:1.1,w:30,d:'눈 깜짝할 새에 먹잇감을 낚아챈다. 시력이 매우 좋다.'},
 12:{n:'꼬물이',t:['bug'],b:[45,30,35,20,20,45],x:39,c:255,ls:LS.bug,ev:[7,13],st:0,line:12,cat:'애벌레',h:.3,w:2.9,d:'나뭇잎을 갉아 먹으며 자란다. 금방 진화하는 편이다.'},
 13:{n:'단단고치',t:['bug'],b:[50,20,55,25,25,30],x:72,c:120,ls:LS.bug,ev:[10,14],st:1,line:12,cat:'고치',h:.7,w:9.9,d:'단단한 껍질 속에서 진화를 기다린다. 거의 움직이지 않는다.'},
 14:{n:'나풀나비',t:['bug','fly'],b:[60,45,50,90,80,70],x:160,c:45,ls:LS.bug,st:2,line:12,cat:'나비',h:1.1,w:32,d:'날개의 가루가 반짝인다. 꽃밭 위를 우아하게 난다.'},
 15:{n:'들쥐롱',t:['normal'],b:[30,56,35,25,35,72],x:51,c:255,ls:LS.rat,ev:[20,16],st:0,line:15,cat:'들쥐',h:.3,w:3.5,d:'어디에나 사는 흔한 몬스터. 앞니가 평생 자란다.'},
 16:{n:'큰쥐롱',t:['normal'],b:[55,81,60,50,70,97],x:145,c:127,ls:LS.rat,st:1,line:15,cat:'들쥐',h:.7,w:18.5,d:'튼튼한 앞니로 통나무도 갉아 버린다. 무리의 대장이다.'},
 17:{n:'찌릿쥐',t:['elec'],b:[35,55,40,50,50,90],x:82,c:190,ls:LS.elec,ev:[22,18],st:0,line:17,cat:'찌릿',h:.4,w:6,d:'볼에 전기를 모아 둔다. 함부로 만지면 찌릿하다.'},
 18:{n:'번개냥',t:['elec'],b:[60,85,55,90,80,110],x:160,c:75,ls:LS.elec,st:1,line:17,cat:'번개',h:.9,w:30,d:'번개처럼 빠르게 움직인다. 털이 항상 곤두서 있다.'},
 19:{n:'개굴물',t:['water'],b:[40,50,40,40,40,90],x:77,c:190,ls:LS.frog,ev:[22,20],st:0,line:19,cat:'개구리',h:.5,w:5.5,d:'숲속 연못에 산다. 혀를 쭉 뻗어 벌레를 잡는다.'},
 20:{n:'개굴왕',t:['water'],b:[65,70,65,75,75,95],x:165,c:75,ls:LS.frog,st:1,line:19,cat:'개구리',h:1.1,w:32,d:'연못의 우두머리. 굵은 울음소리로 비를 부른다.'},
 21:{n:'불여우',t:['fire'],b:[38,41,40,50,65,65],x:60,c:190,ls:LS.fox,ev:[24,22],st:0,line:21,cat:'여우',h:.6,w:9.9,d:'작은 불꽃을 뿜으며 장난치기를 좋아한다.'},
 22:{n:'구미염',t:['fire'],b:[73,76,75,81,100,100],x:177,c:75,ls:LS.fox,st:1,line:21,cat:'여우',h:1.1,w:19.9,d:'여러 갈래의 꼬리에 불꽃을 품고 있다. 매우 영리하다.'},
 23:{n:'돌돌이',t:['rock','ground'],b:[40,80,100,30,30,20],x:60,c:190,ls:LS.rock,ev:[25,24],st:0,line:23,cat:'돌',h:.4,w:20,d:'바위에 섞여 낮잠을 잔다. 모르고 밟으면 화를 낸다.'},
 24:{n:'바위거북',t:['rock','ground'],b:[70,95,115,45,45,35],x:137,c:60,ls:LS.rock,st:1,line:23,cat:'바위',h:1,w:105,d:'등껍질이 바위보다 단단하다. 천 년을 산다는 소문이 있다.'},
 25:{n:'독버섯',t:['poison','grass'],b:[35,70,55,45,55,25],x:60,c:190,ls:LS.shroom,ev:[24,26],st:0,line:25,cat:'버섯',h:.3,w:5.4,d:'축축한 숲 그늘에 산다. 갓의 무늬가 화려할수록 독이 강하다.'},
 26:{n:'맹독버섯',t:['poison','grass'],b:[60,95,80,60,80,30],x:150,c:75,ls:LS.shroom,st:1,line:25,cat:'버섯',h:1,w:29.5,d:'포자 구름을 뿜어 숲 한 구역을 독으로 물들인다.'},
 27:{n:'흙두더',t:['ground'],b:[35,55,45,35,45,80],x:58,c:190,ls:LS.mole,ev:[26,28],st:0,line:27,cat:'두더지',h:.3,w:4.5,d:'하루 종일 땅굴을 판다. 밭을 부드럽게 해 줘서 농부들이 반긴다.'},
 28:{n:'굴착왕',t:['ground'],b:[60,90,65,50,70,100],x:149,c:75,ls:LS.mole,st:1,line:27,cat:'두더지',h:.7,w:33,d:'강철 같은 발톱으로 바위산도 순식간에 뚫는다.'},
 29:{n:'물파리',t:['water','poison'],b:[40,40,35,50,100,70],x:67,c:190,ls:LS.jelly,ev:[30,30],st:0,line:29,cat:'해파리',h:.9,w:45.5,d:'투명한 몸으로 물속에 숨어 있다. 촉수에 독이 있다.'},
 30:{n:'독물파리',t:['water','poison'],b:[80,70,65,80,120,100],x:180,c:60,ls:LS.jelly,st:1,line:29,cat:'해파리',h:1.6,w:55,d:'수십 개의 촉수를 자유롭게 다룬다. 바다의 무법자.'}};
const DEX_N=Object.keys(SP).length;

/* 성격 [이름, 오르는 능력, 내려가는 능력] (인덱스 1~5) */
const NATURES=[['씩씩함',1,5],['고집셈',1,3],['듬직함',2,1],['꼼꼼함',4,3],['날렵함',5,1],['영리함',3,1],['온화함',4,1],['성급함',5,2],['느긋함',0,0],['수줍음',0,0],['명랑함',5,3],['차분함',4,5]];

/* 도구 */
const ITEMS={
 ball:{n:'포획캡슐',p:'ball',price:200,ball:1,d:'야생 몬스터에게 던져서 붙잡는 캡슐.'},
 great:{n:'슈퍼캡슐',p:'ball',price:600,ball:1.5,d:'포획캡슐보다 몬스터를 더 잘 붙잡을 수 있는 캡슐.'},
 potion:{n:'회복약',p:'heal',price:300,heal:20,d:'몬스터 1마리의 HP를 20 회복한다.'},
 super:{n:'고급회복약',p:'heal',price:700,heal:60,d:'몬스터 1마리의 HP를 60 회복한다.'},
 antidote:{n:'해독약',p:'heal',price:100,cure:'psn',d:'몬스터 1마리의 독 상태를 치료한다.'},
 burnheal:{n:'화상연고',p:'heal',price:250,cure:'brn',d:'몬스터 1마리의 화상 상태를 치료한다.'},
 parheal:{n:'마비풀림약',p:'heal',price:200,cure:'par',d:'몬스터 1마리의 마비 상태를 치료한다.'},
 awake:{n:'잠깨는종',p:'heal',price:250,cure:'slp',d:'맑은 소리로 잠든 몬스터를 깨운다.'},
 fullheal:{n:'만능치료제',p:'heal',price:600,cure:'all',d:'몬스터 1마리의 모든 상태 이상을 치료한다.'},
 revive:{n:'부활의깃털',p:'heal',price:1500,revive:.5,d:'기절한 몬스터를 HP 절반으로 되살린다.'},
 dex:{n:'몬스터도감',p:'key',d:'만난 몬스터와 붙잡은 몬스터를 기록하는 도감.'},
 pad:{n:'원정패드',p:'key',d:'시계·파티·지도·만보기 앱이 들어 있는 휴대 단말기.'},
 shoes:{n:'질주신발',p:'key',d:'B버튼을 누른 채 이동하면 빠르게 달릴 수 있는 신발.'}};
const POCKETS=[['heal','회복'],['ball','캡슐'],['key','중요한 물건']];

/* 트레이너 클래스: 상금 배율, 외형 */
const TCLASS={kid:{n:'꼬마',m:16,look:'kid'},girl:{n:'소녀',m:20,look:'girl'},camper:{n:'캠퍼',m:20,look:'camper'},bugboy:{n:'곤충소년',m:16,look:'bug'},
  hiker:{n:'등산가',m:32,look:'hiker'},swimmer:{n:'수영선수',m:20,look:'swim'},fisher:{n:'낚시꾼',m:28,look:'fisher'},lass:{n:'아가씨',m:24,look:'lady'},
  leader:{n:'관장',m:100},rival:{n:'라이벌',m:35,look:'rival'}};
/* 라이벌 파티: 라이벌은 주인공의 스타터에 유리한 몬스터를 고른다 */
const COUNTER={1:4,4:7,7:1};
function rivalTeam(stage){const r=G.rivalStarter;
  if(stage===1)return[[r,5]];
  if(stage===2)return[[10,9],[15,9],[r,12]];
  return[[11,16],[17,15],[21,16],[r+1,19]];}
