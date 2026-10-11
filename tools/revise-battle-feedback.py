"""One-time battle display and wording refinement requested during release."""
import re
from pathlib import Path
R=Path(__file__).resolve().parent.parent
p=R/'godot/scripts/battle.gd';s=p.read_text(encoding='utf-8')
s=s.replace('Color(0.99, 0.98, 0.94, 0.95)','Color(0.94, 0.97, 0.94, 0.97), Color("#426b69")')
s=s.replace('UI.label(root, "HP", Vector2(26, 54), 24','UI.label(root, "체력", Vector2(16, 54), 20')
s=s.replace('exp_bg.position = Vector2(20, 132)','exp_bg.position = Vector2(bw - 16, 58)')
s=s.replace('exp_bg.size = Vector2(bw - 40, 8)','exp_bg.size = Vector2(8, 72)')
s=s.replace('exp_bar.color = Color(0.35, 0.65, 0.95)','exp_bar.color = Color("#d8aa56")')
s=s.replace('exp_bar.size = Vector2(0, 8)','exp_bar.size = Vector2(4, 0)\n\t\texp_bar.position = Vector2(2, 70)\n\t\tUI.label(root, "성장", Vector2(bw - 60, 130), 16, Color("#79603b"))')
s=s.replace('Color(0.24, 0.81, 0.35) if k > 0.5 else Color(0.95, 0.76, 0.19) if k > 0.2 else Color(0.91, 0.28, 0.23)','Color("#3baba2") if k > 0.5 else Color("#d7a255") if k > 0.2 else Color("#c96d68")')
body='''func set_exp(instant := false) -> void:
\tif not huds.has("p") or huds.p.exp == null or hero != null:
\t\treturn
\tvar m := pm()
\tvar lo := Game.exp_for(int(m.lv))
\tvar hi := Game.exp_for(int(m.lv) + 1)
\tvar k := 1.0 if int(m.lv) >= 100 else clampf(float(int(m.exp) - lo) / maxf(1, hi - lo), 0, 1)
\tvar draw_growth := func(value: float) -> void:
\t\thuds.p.exp.size = Vector2(4, 68.0 * value)
\t\thuds.p.exp.position = Vector2(2, 70.0 - 68.0 * value)
\tif instant:
\t\tdraw_growth.call(k)
\telse:
\t\tvar tw := create_tween()
\t\ttw.tween_method(draw_growth, huds.p.exp.size.y / 68.0, k, 0.6)
\t\tawait tw.finished


'''
s,n=re.subn(r'^func set_exp\([^\n]*\)[^\n]*:\n.*?(?=^func )',lambda m:body,s,flags=re.M|re.S);assert n==1
s=s.replace('"\\n효과 없음" if e == 0 else "\\n효과 굉장" if e > 1 else "\\n효과 별로" if e < 1 else ""','"\\n피해 차단" if e == 0 else "\\n상성 우세 · %s배" % e if e > 1 else "\\n상성 저항 · %s배" % e if e < 1 else ""')
s=s.replace('await bsay("효과가 굉장했다!")','await bsay("상성 우세 · 피해 배율 %s배" % r.e)')
s=s.replace('await bsay("효과가 별로인 듯하다...")','await bsay("상성 저항 · 피해 배율 %s배" % r.e)')
s=s.replace('await bsay("%s에게는 효과가 없는 것 같다..." % bname(ts))','await bsay("%s의 속성이 이 기술의 피해를 차단했다." % bname(ts))')
s=s.replace('await bsay("급소에 맞았다!")','await bsay("빈틈 포착 · 정밀 타격!")')
p.write_text(s,encoding='utf-8')
p=R/'src/battle.js';s=p.read_text(encoding='utf-8')
for a,b in {'효과가 굉장했다!':'상성 우세로 피해가 증폭됐다.','효과가 별로인 듯하다...':'상성 저항으로 피해가 감소했다.','효과가 굉장하다':'상성 우세','효과가 별로다':'상성 저항','급소에 맞았다!':'빈틈 포착 · 정밀 타격!'}.items():s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
p=R/'docs/ASSET_RECORD_2026-10-11.md';s=p.read_text(encoding='utf-8');s+='''
## 추가 확인: 체력·성장 표시와 전투 문구

체력/경험치 표시와 속성 상성은 일반적인 기능이다. 그 기능 자체가 특정 게임의 저작권 침해라고 단정하지 않았다. 미국 저작권청의 설명은 아이디어·방법·시스템과 표현을 구분하고 짧은 문구의 보호 제한을 설명하지만, 미국 기준을 한국이나 모든 국가에 그대로 적용하지 않는다. 국내 실질적 유사성 판단도 보호되는 창작적 표현을 비교하는 문제다.

이번 개정에서는 원작을 연상시키는 표현을 줄이기 위해 `효과가 굉장했다`/`효과가 별로인 듯하다`를 상성 우세/저항과 실제 배율로 바꿨다. 적·아군 정보는 상단에 나란히 배치하고, 체력은 청록색 계기, 경험치는 별도의 세로 성장 계기로 변경했다. 기존 녹색 체력/파란색 가로 경험치와 동일한 조합을 유지하지 않는다. 이것은 예방적 디자인 변경이며 기존 바나 짧은 문구가 그 자체로 불법이라는 법률 판단이 아니다.

참고: https://www.copyright.gov/help/faq/faq-protect.html ; https://law.go.kr/LSW/precInfoP.do?precSeq=186221
''';p.write_text(s,encoding='utf-8')
print('Replaced battle feedback and HP/growth display; recorded scope of legal review.')

