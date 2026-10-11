// Godot 데이터 재생성 시에도 병원·작은 관측소 구성을 유지한다.
function reviseMaps(maps) {
  const towns = ['city', 'town2', 'town3', 'town4', 'town5'];
  const routes = {route2: 1, route3: 2, route4: 3, route5: 4,
    crater: 2, spring: 3, storm: 4, towerLobby: 5, towerFloor: 5};
  for (const [id, index] of Object.entries(routes)) maps[id].hospital = `center${index}`;
  for (let i = 1; i <= 5; i++) {
    const town = maps[towns[i - 1]], hospitalId = `center${i}`, stationId = `gym${i}`;
    town.hospital = hospitalId;
    const hospital = maps[hospitalId];
    hospital.name = '병원';
    hospital.hospital = hospitalId;
    hospital.recovery = [6, 4]; // 접수대 바로 앞의 비어 있는 바닥
    for (const npc of hospital.npcs) {
      if (npc.id.startsWith('nurse_')) npc.name = '병원 의무원';
    }
    // 민가·보급소·관측소·발전소도 같은 마을의 병원으로 복귀한다.
    for (const warp of Object.values(town.warps)) maps[warp[0]].hospital = hospitalId;
    const station = maps[stationId];
    station.rows = ['wwwwwwww', 'wwwwwwww', '........', '........', '........', '........', '...m....'];
    station.floor = 'wood';
    station.entry = [3, 5];
    station.npcs = station.npcs.filter(n => n.id === `leader${i}`);
    Object.assign(station.npcs[0], {x: 2, y: 3, dir: 'down'});
    station.obj = {};
    station.items = [];
    station.trig = [];
    const stationExit = Object.values(station.warps)[0];
    station.warps = {'3,6': stationExit};
    for (const [key, warp] of Object.entries(town.warps)) {
      if (warp[0] !== stationId) continue;
      warp[1] = 3; warp[2] = 5;
      const [doorX, doorY] = key.split(',').map(Number);
      const rows = town.rows.map(r => [...r]);
      // 큰 관측소 외관도 3×3칸으로 줄인다. 기존 문과 마을 동선은 유지한다.
      for (const row of rows) for (let x = 0; x < row.length; x++) if (row[x] === 'G') row[x] = '.';
      for (let y = doorY - 2; y <= doorY; y++) {
        for (let x = doorX - 1; x <= doorX + 1; x++) rows[y][x] = 'G';
      }
      rows[doorY][doorX] = 'D';
      town.rows = rows.map(r => r.join(''));
    }
  }
  // 조사관·주민의 대사와 표지판까지 치료 장소 이름을 통일한다.
  return renameFacilities(maps);
}
function renameFacilities(data) {
  const clean = JSON.stringify(data).replaceAll('관측 캠프로', '병원으로')
    .replaceAll('관측 캠프', '병원').replaceAll('캠프 의무원', '병원 의무원');
  return JSON.parse(clean);
}
module.exports = {reviseMaps, renameFacilities};
