/* =========================================================
   npcfight.js — NPC와 대결: 대화가 끝나면 "싸우자 / 대화를 그만한다"
   NPC가 몬스터 없이 직접 싸우고(battle kind 'npc'), 캡슐로 붙잡으면 동료(사람)가 된다.
   붙잡힌 NPC는 맵에서 사라지고, 시설·이야기를 맡은 NPC 자리에는 대신 일하는 사람이 나타나 같은 일을 한다.
   ========================================================= */

/* ---------- 붙잡힌 NPC와 대타 ---------- */
// 시설·이야기를 맡은 NPC(talk가 있는 NPC)가 붙잡히면 대신 나타나는 사람 [이름, 외형, 첫인사]
const SUBST={
 nurse:['새 간호사','nurse','전에 계시던 간호사 선생님이 갑자기 사라지셔서 제가 대신 왔어요!'],
 clerk:['새 점원','clerk','전 점원이 손님한테 붙잡혀 갔다나 뭐라나... 아무튼 제가 이어서 일해요!'],
 fuse:['새 합성 연구원','aide','선배가 원정을 떠났다고 해서 제가 연구를 이어받았어요.'],
 mom:['옆집 아주머니','granny','@아, 네 엄마가 갑자기 안 보인다며? 걱정 말렴, 아줌마가 집을 봐 주고 있단다.'],
 sister:['누나 친구','girl','세은이가 갑자기 연락이 안 돼서 와 봤어. 대신 내가 도와줄게!'],
 prof:['박사님 조수','aide','박사님이 캡슐에 들어가 버리셨다니... 연구는 제가 이어 가겠습니다!'],
 granny:['이웃 할머니','granny','이 집 할멈이 마실을 나가서 내가 대신 집을 보고 있단다.'],
 wife:['이웃 아주머니','mom','이 집 아주머니가 안 계셔서 제가 대신 와 있어요.'],
 boss:['검은안개단 부두목','villain','두목님이 사라지셨다! 이제부터 내가 검은안개단을 이끈다!'],
 t5_elder:['장로님 제자','old','스승님께서 자리를 비우셨네. 전설 이야기는 내가 대신 전해 주지.'],
 tw_rec:['새 탑 안내원','aide','전 안내원이 갑자기 사라져서 제가 대신 탑을 안내해 드려요.'],
 leader:['현장 책임자 대리','guide','현장 책임자님이 자리를 비우셔서 제가 대신 관측소을 지키고 있습니다!']};
const SUBST_REFUSE='저, 저까지 잡아가시면 여기 일은 누가 해요?! 싸움은 사양할게요!';
let TALKING=null; // 지금 말을 건 NPC: 현장 책임자·두목처럼 대화 중에 시작된 배틀에서 붙잡으면 그 NPC가 붙잡힌 것으로 기록
const npcCaught=n=>!!(G&&G.flags['cap_'+n.id]);
function substOf(n){if(!npcCaught(n)||!n.talk)return null;
  const k=SUBST[n.id]?n.id:/^leader\d/.test(n.id)?'leader':n.id.replace(/_.*$/,'');
  const s=SUBST[k]||['대신 온 '+n.name,n.look,`${J(n.name,'이')} 자리를 비워서 제가 대신 맡고 있어요.`];return{name:s[0],look:s[1],hello:s[2]};}
const npcGone=n=>npcCaught(n)&&!n.talk;                  // 붙잡혀서 사라진 NPC (대타가 없는 NPC)
const npcLook=n=>{const s=substOf(n);return s?s.look:n.look;};
const npcName=n=>{const s=substOf(n);return s?s.name:n.trainer?tname(n):n.name;};
/* 대타가 원래 NPC의 일을 한다: 대화창 이름표만 대타로 바꿔 보여 준다 (엄마 대신 온 아주머니는 따로 말한다) */
const SUBST_TALK={mom:async s=>{const o={name:s.name,look:s.look};await say('피곤해 보이는구나. 잠깐 쉬었다 가렴.',o);
  await fadeTo(1);healParty();await Music.jingle('heal');await fadeTo(0);G.heal={map:'home',x:4,y:6};
  await say('몬스터들이 기운을 되찾았다!');await say('네 엄마 몫까지 아줌마가 응원할게!',o);}};
async function substTalk(n){const s=substOf(n);await say(fmtName(s.hello),{name:s.name,look:s.look});
  if(SUBST_TALK[n.id]){await SUBST_TALK[n.id](s);return;}
  TALK_ALIAS=[n.name,s.name,s.look];try{await n.talk(n);}finally{TALK_ALIAS=null;}}

/* ---------- 싸우자 했을 때의 반응 ----------
   go: 싸우자 했을 때, lose: NPC가 졌을 때, win: NPC가 이겼을 때, lv: 레벨 보정(파티 최고 레벨 기준)
   @ = 주인공 이름, @아/@이/@은/@을/@과 = 주인공 이름 + 조사 */
const FIGHT={
 mom:{go:['@아, 엄마랑 싸우자고...? 뭘 잘못 먹었니...?','...좋아. 오늘 저녁은 반찬 없는 줄 알아!'],lv:5,lose:'어머, 우리 @이 이렇게 컸구나... 엄마는 기쁘다...',win:'엄마를 이기려면 아직 멀었단다. 얼른 씻고 자렴!'},
 sister:{go:['나랑 한판 붙자고? 후후, 누나는 봐주는 거 없다~!'],lv:2,lose:'와, 진짜 많이 컸네! 이건 사진으로 남겨 둬야겠다!',win:'아직은 누나가 한 수 위지? 힘내라, 동생!'},
 prof:{go:['이런 건방진 녀석... 연륜의 무서움을 보여 주마!'],lv:8,lose:'허허... 청출어람이로구나. 생태기록 완성은 자네에게 맡기겠네.',win:'아직 배울 게 많구먼. 생태기록이나 더 채워 오게!'},
 aide1:{go:['네? 저랑요? 마침 실험 데이터가 필요했는데... 좋아요!'],lose:'실험 실패... 그래도 데이터는 잘 받았어요...',win:'가설이 증명됐어요! 논문으로 써야지!'},
 aide2:{go:['연구원도 몸이 재산이에요! 밤새 실험한 체력을 보여 드리죠!'],lose:'역시 밤샘은 몸에 안 좋아...',win:'후후, 연구실 체력을 얕보지 마세요!'},
 t_girl:{go:['나랑? 좋아, 풀숲에서 갈고닦은 실력 보여 줄게!'],lv:-2},
 t_man:{go:['허허, 요즘 젊은이는 겁이 없구먼! 아저씨 박치기 맛 좀 볼 텐가?']},
 r1_tip:{go:['야생 몬스터 말고 나를 잡겠다고? 허허, 어디 해 보게!']},
 c_old:{go:['이 늙은이가 왕년에 바위시티 최강이었다는 걸 모르는 게로구먼!'],lv:2},
 c_girl:{go:['어머, 데이트 신청인 줄 알았는데... 싸움이라니 실망이에요!']},
 c_kid:{go:['나랑 싸우자고? 좋아! 대신 엄마한테 이르기 없기다!'],lv:-3},
 c_guard:{go:['경비원에게 싸움을 걸다니, 간도 크군! 공무 집행 방해로 처리하겠다!'],lv:2},
 granny:{go:['아이고, 이 할미랑 싸우자고? 허리 좀 펴고... 자, 덤비거라!']},
 ch_kid:{go:['우리 형이 현장 책임자이라고 했지? 나도 형한테 배운 게 있다구!'],lv:-2},
 g1_guide:{go:['안내원도 싸울 줄 안다고! 바위처럼 단단하게 알려 주지!'],lv:2},
 g2_guide:{go:['또 만났군! 이번엔 물 흐르듯 몸으로 알려 주지!'],lv:2},
 g3_guide:{go:['여기 덥지? 더 뜨겁게 해 주지! 각오해!'],lv:2},
 g4_guide:{go:['전기가 돌아와서 힘이 넘친다고! 찌릿하게 상대해 주지!'],lv:2},
 g5_guide:{go:['마지막 관측소 안내원의 실력, 바람처럼 보여 주지!'],lv:2},
 leader1:{go:['다시 도전하겠다고? 이번엔 몬스터 없이, 바위 같은 주먹으로 상대해 주마!'],lv:5,lose:'크윽... 바위도 깨지는 날이 있군.',win:'아직 단단함이 부족하다!'},
 leader2:{go:['몬스터 없이 맨몸으로요? 후후, 물처럼 흘려보내 드릴게요.'],lv:5,lose:'물살에 휩쓸린 건 저였네요...',win:'파도는 맞서는 게 아니라 타는 거랍니다.'},
 leader3:{go:['하! 좋아, 그 패기 마음에 든다! 같이 불타오르자!'],lv:5,lose:'불씨가 꺼져 버렸어... 하지만 즐거웠다!',win:'아직 불꽃이 약해! 더 뜨겁게 와라!'},
 leader4:{go:['찌릿찌릿~ 맨손 승부도 자신 있다구! 감전 주의!'],lv:5,lose:'으앗, 방전돼 버렸어...',win:'번개보다 빠른 나를 따라잡긴 무리였지?'},
 leader5:{go:['바람은 형태가 없어요. 잡을 수 있다면 잡아 보세요.'],lv:5,lose:'바람이... 멎었네요.',win:'바람을 읽지 못했군요.'},
 r2_girl:{go:['숲에서 놀던 실력 보여 줄게! 개굴물보다 빠르다구!'],lv:-2},
 w_fisher:{go:['오늘 입질이 없다 싶더니 큰 놈이 걸렸구먼! 낚아 주마!']},
 w_lady:{go:['물결마을 아가씨는 얌전한 줄 알았죠? 후훗.']},
 w_kid:{go:['나 수영도 잘하고 싸움도 잘해! 덤벼!'],lv:-3},
 t2_gate:{go:['관측 인증가 있어도 나를 이기지 않으면 못 지나간다! ...농담이야. 그래도 한판 붙어 볼까?'],lv:2},
 wife:{go:['어머머, 이 아줌마한테 싸움을 걸어? 국자 맛 좀 볼래?']},
 r3_old:{go:['화산길보다 뜨거운 이 늙은이의 열정을 보여 주지!']},
 t3_old:{go:['온천에서 다진 이 몸, 아직 쌩쌩하다네!']},
 t3_lady:{go:['검은 옷 사람들인 줄 알고 깜짝 놀랐잖아요! 혼내 줄 거예요!']},
 t3_kid:{go:['불꽃처럼 뜨거운 내 주먹을 받아라!'],lv:-3},
 h3_m:{go:['온천 달걀 대신 할미 꿀밤을 먹고 싶은 게로구나!']},
 r4_kid:{go:['전기처럼 빠르게 끝내 줄게!'],lv:-3},
 t4_man:{go:['정전 때문에 안 그래도 화가 나 있었는데 잘 됐다!']},
 t4_man2:{go:['전기를 고쳐 준 은인이랑 싸우라고? ...좋아, 이것도 보답이다!']},
 t4_girl:{go:['찌나 언니한테 배운 찌릿 펀치를 보여 줄게!']},
 h4_m:{go:['정전 때문에 스트레스가 쌓였는데... 너로 풀어야겠다!']},
 boss:{go:['크크크... 감히 이 흑운에게 덤비겠다고? 검은 안개 속으로 사라져라!'],lv:6,lose:'이, 이럴 수가... 검은안개단의 두목이 맨손 승부에서 지다니...',win:'크하하! 애송이 따위가!'},
 t5_old:{go:['구름 위에서 다져진 이 다리 힘을 보여 주마!']},
 t5_girl:{go:['하늘봉마을 소녀는 바람처럼 날렵하다구!']},
 t5_elder:{go:['허허... 수호신들의 시험보다 이 늙은이가 더 무서울 게야.'],lv:10,lose:'허허, 수호신들이 자네를 인정할 만하구먼.',win:'아직 하늘의 뜻을 받기엔 이르네.'},
 h5_m:{go:['오늘의 날씨를 알려 드리죠. 맑은 뒤 한 대 맞음!']},
 tw_rec:{go:['탑에 오르기 전에 저부터 넘어가시겠다고요? 좋습니다!'],lv:3},
 t5_summit:{go:['몬스터 없이 맨손으로? 좋아, 너한텐 주먹으로도 안 져!'],lv:3,lose:'칫... 맨손 승부까지 지다니. 다음엔 꼭 이긴다!',win:'봤지? 이게 진짜 실력이야!'}};
// 같은 일을 하는 NPC(쉼터·상점 등 여러 곳에 있는 NPC)
const FIGHT_ROLE={
 nurse:{go:['어머, 싸우자고요? 다친 몬스터는 제가 다 고쳐 드릴 테니... 마음껏 다쳐 보세요!'],lv:3,lose:'간호사가 쓰러지면 큰일인데...',win:'자, 치료해 드릴게요. 다음부턴 조심하세요!'},
 clerk:{go:['손님, 그건 판매 품목이 아닌데요... 하지만 특별히 서비스해 드리죠!'],lose:'오늘 장사는 여기까지인가 봐요...',win:'감사합니다, 또 오세요!'},
 fuse:{go:['저를 합성 재료로 쓰시려고요?! 그렇게는 안 되죠!'],lose:'합성... 당하는 줄 알았어요...',win:'연구원을 얕보면 안 돼요!'}};
// 이긴 원정가에게 다시 싸우자 하면 (원정가 클래스별)
const FIGHT_CLASS={
 kid:'또 하자고? 이번엔 몬스터 없이 맨손 승부다!',girl:'몬스터 없이도 나 강하거든?',camper:'캠프파이어처럼 활활 타오르는 주먹을 받아라!',
 bugboy:'곤충 잡듯 너도 잡아 주지!',hiker:'산에서 단련한 이 몸으로 직접 상대해 주마!',swimmer:'물 밖에서도 내가 더 빠르다고!',
 fisher:'이번엔 내가 너를 낚아 주마!',lass:'어머, 이번엔 제가 직접 상대해 드릴게요.',grunt:'검은안개단원은 맨손으로도 무섭다! 각오해라!',
 birdkeeper:'새처럼 날렵한 몸놀림을 보여 주지!',engineer:'공구 없이도 너쯤은 손봐 줄 수 있다!',ranger:'구조대 체력 훈련의 성과를 보여 주마!'};
// 외형별 기본 반응과 레벨 보정
const FIGHT_LOOK={
 kid:{go:'싸움? 좋아, 나 잘해!',lose:'으앙! 엄마한테 이를 거야!',win:'내가 이겼다! 메롱~',lv:-3},
 girl:{go:'나랑 싸우자고? 각오는 됐지?',lose:'흑... 너무해!',win:'흥, 나를 얕보지 마!',lv:-2},
 lady:{go:'어머, 무례하시네요. 그럼 사양 않겠어요.',lose:'이런 꼴을 보이다니...',win:'실례했어요, 호호.'},
 old:{go:'허허, 이 늙은이가 아직 녹슬지 않았다는 걸 보여 주마!',lose:'세월엔 장사 없구먼...',win:'젊은이, 아직 멀었네!',lv:1},
 granny:{go:'아이고, 할미랑 싸우자고? 허리 좀 펴고... 자, 오너라!',lose:'아이고 허리야...',win:'이 할미가 이겼다! 사탕 하나 줄까?',lv:1},
 man:{go:'허허, 겁 없는 녀석이구먼! 아저씨 맛 좀 볼 텐가?',lose:'아이고, 운동 좀 해 둘걸...',win:'아저씨 아직 안 죽었다!'},
 mom:{go:'어머머, 아줌마한테 싸움을 걸어?',lose:'아이고, 요즘 애들 힘이 세네...',win:'아줌마를 얕보면 안 되지!',lv:2},
 aide:{go:'연구원도 몸이 재산이에요! 각오하세요!',lose:'실험 실패...',win:'가설이 증명됐네요!'},
 guide:{go:'안내원도 싸울 줄 안다고! 몸으로 알려 주지!',lose:'공략법이... 통하지 않았어...',win:'이게 바로 공략이다!',lv:2},
 fisher:{go:'오늘 큰 놈이 걸렸구먼!',lose:'놓친 고기가 더 크다더니...',win:'월척이다!'},
 hiker:{go:'산사나이의 주먹을 받아라!',lose:'산사태 같은 공격이었다...',win:'산은 정직하지!',lv:2},
 camper:{go:'모닥불처럼 타오르는 주먹이다!',lose:'모닥불이 꺼졌어...',win:'캠핑으로 다진 체력이라고!'},
 bug:{go:'곤충 잡듯 잡아 주지!',lose:'잠자리채가 부러졌어...',win:'잡았다!',lv:-2},
 swim:{go:'물 밖에서도 빠르다고!',lose:'숨이 차...',win:'수영으로 다진 체력이다!'},
 villain:{go:'검은안개단을 얕보지 마라!',lose:'두, 두목님께 혼나겠다...',win:'크크크, 덤빈 게 잘못이다!',lv:1},
 rival:{go:'좋아, 맨손 승부다! 너한텐 안 져!',lose:'칫... 다음엔 꼭 이긴다!',win:'봤지? 이게 진짜 실력이야!',lv:3},
 boss:{go:'크크크... 덤벼라!',lose:'이럴 수가...',win:'애송이 따위가!',lv:6},
 prof:{go:'허허, 한번 겨뤄 볼까?',lose:'허허, 훌륭하구먼.',win:'아직 멀었네!',lv:8},
 sister:{go:'봐주는 거 없다~!',lose:'많이 컸네!',win:'아직은 내가 위지?',lv:2},
 nurse:{go:'마음껏 다쳐 보세요!',lose:'간호사가 쓰러지면 큰일인데...',win:'치료해 드릴게요!',lv:3},
 clerk:{go:'특별히 서비스해 드리죠!',lose:'오늘 장사는 여기까지...',win:'또 오세요!'}};
const fmtName=l=>l.replace(/@(아|이|은|을|과)?/g,(m,p)=>p?J(G.name,p):G.name);
function fightLines(n){const role=n.id.replace(/_.*$/,''),look=FIGHT_LOOK[n.look]||FIGHT_LOOK.man;
  const f=FIGHT[n.id]||FIGHT_ROLE[role]||(n.trainer&&FIGHT_CLASS[n.trainer.cls]?{go:[FIGHT_CLASS[n.trainer.cls]],lose:'크윽, 맨손 승부에서도 지다니...',win:'어때, 맨손 승부도 만만치 않지?'}:{});
  return{go:(f.go||[look.go]).map(fmtName),lose:fmtName(f.lose||look.lose),win:fmtName(f.win||look.win),lv:f.lv!=null?f.lv:(look.lv||0)};}

/* ---------- 대화가 끝난 뒤: 싸우자 / 대화를 그만한다 ---------- */
async function npcFightChoice(n){
  if(n.mon||n.id==='tw_guard'||!G.party.some(m=>m.hp>0))return; // 몬스터 NPC·탑의 수호자는 제외, 싸울 몬스터가 있어야 함
  const name=npcName(n),look=npcLook(n);
  const r=await ask(`${J(name,'과')} 무엇을 할까?`,['싸우자','대화를 그만한다'],{start:1});
  if(r!==0)return;
  if(substOf(n)){await say(SUBST_REFUSE,{name,look});return;}
  const f=fightLines(n);for(const l of f.go)await say(l,{name,look});
  const top=Math.max(...G.party.map(m=>m.lv));
  await battle({kind:'npc',name:n.trainer?n.trainer.name:n.name,cls:n.trainer?n.trainer.cls:undefined,look:n.look,
    lv:clamp(top+f.lv,2,100),npc:n.id,lose:f.lose,winMsg:f.win,bg:curMap().bg});}
