// Godot 웹 빌드로 스토어 스크린샷 6장(1080x1920) 찍기
//   node tools/capture-godot-store.cjs <웹 빌드 주소(…/index.html)> <출력 폴더>
//   주소 뒤 #notips:w:지도:x:y[:명령] 으로 장면을 연다 (첫 사용 안내 끔). 540x960 화면을 2배로 찍는다.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const [base, out] = process.argv.slice(2);
const SCENES = [
  ['01-title', '', 10000, []],
  ['02-field', '#notips:w:town2:7:7', 11000, []],
  ['03-survey', '#notips:w:route1:4:2', 11000, ['ArrowLeft', 500, 'z', 1800]],
  ['04-battle', '#notips:w:route1:9:20:battle:24', 11000, [9000]],
  ['05-start', '#notips:w:town:4:13:opening_starter', 11000, ['z', 900, 'z', 1200]],
  ['06-menu', '#notips:w:town2:7:7:menu', 11000, [1200]],
];
(async () => {
  const fs = require('fs');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [name, hash, wait, keys] of SCENES) {
    const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
    await p.goto(base + hash);
    await p.waitForTimeout(wait);
    for (const k of keys) {
      if (typeof k === 'number') await p.waitForTimeout(k);
      else { await p.keyboard.down(k); await p.waitForTimeout(80); await p.keyboard.up(k); }
    }
    await p.screenshot({ path: `${out}/${name}.png` });
    await p.close();
    console.log(name);
  }
  await b.close();
})();
