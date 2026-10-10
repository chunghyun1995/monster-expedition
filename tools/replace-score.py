"""New field-expedition scores, written 2026-10-11 without external music inputs."""
from pathlib import Path
import json, re
root = Path(__file__).resolve().parents[1]
specs = {
 'title': (118,['E','Bm','A','F#m'], ['F#5.3 A5.1 B5.4 -.2 E5.2 G#5.4','D6.2 B5.3 F#5.1 A5.4 E5.2 -.4','C#6.3 E6.1 B5.2 A5.2 F#5.4 E5.4','G#5.2 B5.2 F#5.3 E5.1 D5.2 E5.6']),
 'town': (103,['D','G','Bm','A'], ['A4.3 D5.1 F#5.2 E5.2 -.4 B4.4','G5.2 D5.3 B4.1 E5.4 F#5.2 A5.4','F#5.3 B5.1 A5.2 D5.2 E5.4 F#5.4','B4.2 E5.2 C#5.3 A4.1 D5.2 E5.6']),
 'route': (127,['Am','D','G','Em'], ['E5.2 A5.3 B5.1 D6.4 G5.2 -.4','F#5.3 E5.1 A5.2 D5.2 B5.4 A5.4','G5.3 B5.1 D6.2 E6.2 C6.4 B5.4','A5.2 F#5.2 B5.3 E5.1 G5.2 E5.6']),
 'city': (109,['Bb','Gm','Eb','F'], ['D5.3 F5.1 A5.4 -.2 C6.2 Bb5.4','G5.2 D5.3 F5.1 Bb5.4 A5.2 G5.4','Eb5.3 G5.1 D6.2 C6.2 Bb5.4 F5.4','A5.2 C6.2 G5.3 F5.1 Eb5.2 F5.6']),
 'center': (89,['G','Em','C','D'], ['B4.3 E5.1 A5.4 -.2 G5.2 D5.4','F#5.2 G5.3 B5.1 E5.4 D5.2 -.4','E5.3 A5.1 G5.2 C5.2 D5.4 E5.4','F#5.2 B4.2 E5.3 D5.1 A4.2 G4.6']),
 'gym': (116,['F#m','D','E','Bm'], ['C#5.3 F#5.1 A5.2 B5.2 -.4 E5.4','D6.2 A5.3 F#5.1 E5.4 G#5.2 A5.4','B5.3 E6.1 G#5.2 F#5.2 D5.4 E5.4','F#5.2 A5.2 C#5.3 B4.1 E5.2 F#5.6']),
 'wild': (159,['Em','C','Am','Bm'], ['B5.1 E5.3 G5.2 A5.2 F#5.1 D5.3 E5.4','C6.2 G5.1 E5.3 A5.2 B5.2 D6.2 G5.4','A5.3 E5.1 B5.2 C6.2 G5.4 F#5.4','D6.2 B5.2 F#5.3 A5.1 E5.2 B5.6']),
 'trainer': (151,['Bm','G','D','A'], ['F#5.3 B5.1 D6.2 E6.2 A5.4 G5.4','B5.2 G5.3 E5.1 F#5.4 D6.2 B5.4','A5.3 D6.1 F#6.2 E6.2 B5.4 A5.4','E6.2 C#6.2 G5.3 A5.1 F#5.2 B5.6']),
 'leader': (166,['Cm','Ab','Fm','Bb'], ['G5.3 C6.1 Eb6.2 D6.2 Bb5.4 Ab5.4','C6.2 Ab5.3 F5.1 G5.4 Eb6.2 C6.4','F6.3 C6.1 G5.2 Ab5.2 Eb5.4 F5.4','D6.2 Bb5.2 F5.3 G5.1 Ab5.2 C6.6']),
 'rival': (137,['A','D','Bm','E'], ['C#5.3 A5.1 F#5.2 E5.2 -.4 B5.4','A5.2 D6.3 F#5.1 G5.4 E5.2 D5.4','B5.3 F#5.1 A5.2 C#6.2 E6.4 D6.4','G#5.2 E5.2 B5.3 F#5.1 A5.2 E5.6']),
 'victory': (121,['F','Bb','Dm','C'], ['A5.3 D6.1 C6.4 F5.2 G5.2 E5.4','D6.2 F6.3 C6.1 Bb5.4 A5.2 F5.4','A5.3 E6.1 D6.2 C6.2 F6.4 E6.4','G5.2 C6.2 F5.3 E5.1 A5.2 F5.6']),
 'evolve': (92,['Dm','G','Bb','A'], ['A5.3 D6.1 F6.2 E6.2 B5.4 A5.4','G5.2 B5.3 D6.1 E6.4 F6.2 D6.4','F5.3 Bb5.1 A5.2 E6.2 D6.4 C6.4','E6.2 C#6.2 G5.3 A5.1 B5.2 D6.6']),
 'intro': (94,['F#m','E','D','A'], ['C#5.3 E5.1 B5.4 -.2 A5.2 F#5.4','G#5.2 B5.3 D6.1 A5.4 E5.2 -.4','F#5.3 A5.1 E6.2 D6.2 B5.4 A5.4','C#6.2 E6.2 B5.3 A5.1 F#5.2 E5.6'])
}
songs = {}
for name,(tempo,chords,phrases) in specs.items():
    assert all(sum(int(t.split('.')[1]) for t in phrase.split()) == 16 for phrase in phrases),name
    songs[name] = {'bpm':tempo,'bars':chords,'bass':'slow' if name in ['intro','center','evolve'] else 'pulse','arp':'pad' if name in ['intro','center'] else 'off','drum':'none' if name in ['intro','center','evolve'] else 'soft','mel':' '.join(phrases)}
jingles = {
 'heal': {'bpm':98,'mel':'E5.3 A5.2 F#5.1 -.2 C#6.4 B5.3 D6.5','chords':['A']},
 'item': {'bpm':123,'mel':'A5.3 D6.1 F#5.2 B5.4 -.2 E6.6','chords':['D']},
 'key': {'bpm':111,'mel':'F#5.3 B5.1 E6.4 C#6.2 A5.2 D6.6','chords':['Bm']},
 'level': {'bpm':136,'mel':'D6.3 A5.1 C#6.2 E6.3 B5.1 F#6.6','chords':['A']},
 'caught': {'bpm':107,'mel':'B5.3 E6.1 A5.2 F#5.2 C#6.4 D6.2 E6.6','chords':['E']},
 'badge': {'bpm':117,'mel':'F5.3 Bb5.1 D6.2 C6.4 G5.2 A5.3 F6.5','chords':['Bb']},
 'evolved': {'bpm':101,'mel':'A5.3 D6.1 B5.2 G5.4 C#6.2 E6.3 D6.5','chords':['D']},
 'save': {'bpm':104,'mel':'F#5.3 B5.1 A5.2 D6.2 E6.3 C#6.5','chords':['Bm']}
}
source=(root/'src/audio.js').read_text(encoding='utf-8')
start,end=source.index('const SONGS={'),source.index('const Music=')
source=source[:start]+'// Revised 2026-10-11: new scores, no external song references.\nconst SONGS='+json.dumps(songs,ensure_ascii=False,indent=1)+';\nconst JINGLES='+json.dumps(jingles,ensure_ascii=False,indent=1)+';\n'+source[end:]
(root/'src/audio.js').write_text(source,encoding='utf-8')
(root/'assets/SCORE_2026-10-11.json').write_text(json.dumps({'date':'2026-10-11','method':'New explicit MIDI-style pitch/duration phrases and chord arrangements authored in this task; no external recordings or melodies provided. Existing synthesizer used for rendering.','songs':songs,'jingles':jingles},ensure_ascii=False,indent=2),encoding='utf-8')
print('Replaced all 13 BGM and 8 jingles, preserving event IDs.')
