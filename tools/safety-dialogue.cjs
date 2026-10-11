// 통행은 개인 인증이 아니라 관측망 복구에 따른 지역 안전 점검으로 설명한다.
// 저장 키 badge0..4 / badges는 기존 일지와 웹 저장 코드 호환을 위해 유지한다.
const GATES = {
  t2_gate: ['폭풍 뒤 호수 수위가 불안정해서 잿빛 화산길을 잠시 닫았어.', '관측소의 수변 센서가 복구되어 안전 점검을 마치면 길을 열 거야. 현장 책임자 하라에게 상황을 물어봐.'],
  t3_gate: ['갈대 들길은 과열 구간이 확인되어 잠시 통제 중이야.', '현장 책임자 화련이 열원 센서를 보정하고 안전 점검을 마치면 누구나 지나갈 수 있어.'],
  t4_north: ['구름 능선길은 기상 통신이 끊겨 위험 상황을 확인할 수 없어.', '현장 책임자 찌나가 통신 센서를 복구하고 안전 점검을 마치면 길을 열 거야.'],
  t5_gate: ['하늘봉 정상은 강풍 때문에 잠시 출입을 통제하고 있어.', '현장 책임자 하늬가 고도 센서를 복구해 안전 점검을 마치면 정상으로 가는 길을 열 거야.']
};
function reviseSafetyDialogue(data) {
  // 원정가 카드·상점 안내·완료 메시지도 수집 인증 대신 복구 기록으로 통일.
  const text = JSON.stringify(data)
    .replaceAll('반석 관측 인증', '지반 센서 복구').replaceAll('물결 관측 인증', '수변 센서 복구')
    .replaceAll('불꽃 관측 인증', '열원 센서 복구').replaceAll('번개 관측 인증', '통신 센서 복구')
    .replaceAll('창공 관측 인증', '고도 센서 복구').replaceAll('관측 인증', '복구 기록');
  const out = JSON.parse(text);
  for (const map of Object.values(out.maps)) {
    for (const npc of map.npcs) if (GATES[npc.id]) npc.text = [...GATES[npc.id]];
  }
  if (out.fight.npc.t2_gate) out.fight.npc.t2_gate.go = ['안전 점검을 기다리는 동안 동료들의 대응을 비교해 볼까?'];
  return out;
}
module.exports = {reviseSafetyDialogue};
