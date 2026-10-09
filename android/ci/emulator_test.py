#!/usr/bin/env python3
"""안드로이드 에뮬레이터에서 APK를 설치·실행해 확인한다 (GitHub Actions에서 실행).

  1. 배포용 APK: 실행 → 앱이 살아 있는지, 터치·뒤로 가기 후에도 꺼지지 않는지, 오류(크래시·JS 오류)가 없는지
  2. 디버그 APK(같은 서명, 덮어 설치): WebView 원격 디버깅으로 게임 내부를 직접 확인
     - 게임 페이지·내장 글꼴·앱 브리지(MEApp 복사·링크 열기)·소리 일시정지 함수
     - 뒤로 가기 → 게임의 B(취소) 키로 전달되는지
     - 앱을 완전히 종료했다 다시 켜도 localStorage(리포트)가 남는지

사용법: emulator_test.py <api> <release.apk> <debug.apk> <결과 폴더>
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

import websocket  # pip install websocket-client

PKG = 'io.github.chunghyun1995.monsterexpedition'
ACT = PKG + '/.MainActivity'
api, release_apk, debug_apk, out = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
report = {'api': int(api)}


def adb(*args, check=True):
    return subprocess.run(['adb', *args], check=check, capture_output=True, text=True).stdout.strip()


def pid():
    return adb('shell', 'pidof', PKG, check=False)


def shot(name):
    png = subprocess.run(['adb', 'exec-out', 'screencap', '-p'], check=True, capture_output=True).stdout
    with open(f'{out}/api{api}-{name}.png', 'wb') as f:
        f.write(png)


def launch(wait):
    # 설치·강제 종료 직후에는 패키지 관리자가 마무리하면서 막 띄운 앱을 한 번 더 종료하기도 한다
    # ("Force stopping ...: pkg removed"). 프로세스가 없으면 다시 띄운다. 크래시는 끝에서 따로 검사한다.
    for attempt in range(3):
        report['last_launch'] = adb('shell', 'am', 'start', '-W', '-n', ACT)
        time.sleep(wait)
        if pid():
            return
        print(f'앱 프로세스가 없어 다시 실행 ({attempt + 1})', flush=True)


def key(code, wait=2):
    adb('shell', 'input', 'keyevent', str(code))
    time.sleep(wait)


def expect(ok, what):
    print(('✔ ' if ok else '✘ ') + what, flush=True)
    report.setdefault('checks', []).append({'ok': bool(ok), 'what': what})
    if not ok:
        diagnose()
        finish(1)


def diagnose():
    # 실패 원인을 작업 로그에서 바로 볼 수 있게 실행 결과와 logcat 핵심 줄을 출력한다
    print('--- last am start ---\n' + report.get('last_launch', ''), flush=True)
    keys = ('AndroidRuntime', PKG, 'MonsterExpedition', 'AwBrowserTerminator', 'cr_AwContents', 'sandboxed_process',
            'lowmemorykiller', 'lmkd', 'WebViewFactory')
    lines = [l for l in adb('logcat', '-d', check=False).splitlines() if any(k in l for k in keys)]
    print('--- logcat ---\n' + '\n'.join(lines[-120:]), flush=True)


def kill_log():
    # 앱이 크래시 없이 사라졌을 때 누가 종료했는지(패키지 관리자·메모리 부족 등) 보여 준다
    keys = ('Force stopping', 'Killing', 'am_kill', 'am_proc_died', 'lowmemorykiller', 'WebView renderer gone')
    lines = [l for l in adb('logcat', '-d', check=False).splitlines() if PKG in l and any(k in l for k in keys)]
    print('pid:', pid() or '(없음)', '\n' + '\n'.join(lines[-20:]), flush=True)


def finish(code):
    with open(f'{out}/api{api}-logcat.txt', 'w') as f:
        f.write(adb('logcat', '-d', check=False))
    with open(f'{out}/api{api}-report.json', 'w') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    sys.exit(code)


class Page:
    """디버그 빌드의 WebView에 크롬 개발자 도구 프로토콜로 붙어 JS를 실행한다."""

    port = 9222

    def __init__(self):
        Page.port += 1  # 연결마다 새 포트(이전 연결의 포워딩이 남아 있어도 섞이지 않게)
        self.port = Page.port
        pages = []
        for _ in range(60):
            # 앱이 막 켜지는 중이면 PID·디버깅 소켓이 아직 없을 수 있어 매번 다시 찾는다
            p = pid().split()
            if p:
                adb('forward', f'tcp:{self.port}', f'localabstract:webview_devtools_remote_{p[0]}', check=False)
                try:
                    url = f'http://127.0.0.1:{self.port}/json'
                    pages = [x for x in json.load(urllib.request.urlopen(url, timeout=5)) if x.get('type') == 'page']
                    if pages:
                        break
                except Exception:
                    pass
            time.sleep(1)
        if not pages:
            print('pid:', pid(), 'devtools sockets:', adb('shell', 'grep', 'devtools', '/proc/net/unix', check=False),
                  flush=True)
        expect(pages, 'WebView 원격 디버깅 연결')
        # Origin 헤더를 보내면 최신 WebView(Chrome 111+)가 연결을 거부한다
        self.ws = websocket.create_connection(pages[0]['webSocketDebuggerUrl'], timeout=30, suppress_origin=True)
        self.n = 0

    def js(self, expr):
        self.n += 1
        self.ws.send(json.dumps({'id': self.n, 'method': 'Runtime.evaluate',
                                 'params': {'expression': expr, 'returnByValue': True, 'awaitPromise': True}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') == self.n:
                res = msg['result']
                if 'exceptionDetails' in res:
                    raise RuntimeError(json.dumps(res['exceptionDetails'], ensure_ascii=False))
                return res['result'].get('value')

    def close(self):
        self.ws.close()
        adb('forward', '--remove', f'tcp:{self.port}', check=False)


# ---------- 1. 배포용 APK ----------
adb('install', '-r', release_apk)
adb('logcat', '-c')
launch(20)
first = pid()
expect(first, '배포용 APK 실행')
shot('1-title')
size = adb('shell', 'wm', 'size').split()[-1]
w, h = (int(v) for v in size.split('x'))
adb('shell', 'input', 'tap', str(w // 2), str(h * 6 // 10))  # 아래 화면 터치 → 게임 시작
time.sleep(4)
shot('2-start')
key(4)  # 뒤로 가기
expect(pid() == first, '뒤로 가기를 눌러도 앱이 꺼지지 않음')
shot('3-back')
log = adb('logcat', '-d')
expect(f'Process: {PKG}' not in log, '앱 크래시 없음')
js_errors = [l for l in log.splitlines() if 'chromium' in l and 'Uncaught' in l]
expect(not js_errors, 'JS 오류 없음' + (': ' + js_errors[0] if js_errors else ''))

# ---------- 2. 디버그 APK로 게임 내부 확인 ----------
def debug_checks():
    page = Page()
    info = json.loads(page.js("""JSON.stringify({
      title: document.title, url: location.href, size: innerWidth + 'x' + innerHeight,
      webview: (navigator.userAgent.match(/Chrome\\/[\\d.]+/) || [''])[0],
      bridge: !!window.MEApp, openUrl: typeof (window.MEApp && MEApp.openUrl),
      audio: typeof audioPause + '/' + typeof audioResume,
      build: typeof BUILD !== 'undefined' ? BUILD : null })"""))
    print(info, flush=True)
    report['game'] = info
    expect(info['title'] == '몬스터 원정대' and info['url'] == 'file:///android_asset/index.html', '게임 페이지 로드')
    # 아직 화면에 안 쓰인 글꼴은 구버전 WebView에서 check()가 false라서, 직접 불러와 디코딩되는지 본다
    fonts = page.js("""Promise.all(['16px Galmuri11', 'bold 16px Galmuri11', '16px Galmuri9'].map(f =>
      document.fonts.load(f).then(a => f + ':' + (a.length ? a.map(x => x.status).join('/') : 'none'),
                                  e => f + ':error ' + e)))""")
    print(fonts, flush=True)
    report['fonts'] = fonts
    expect(all(f.endswith(':loaded') for f in fonts), '내장 Galmuri 글꼴 불러오기')
    expect(info['bridge'] and info['openUrl'] == 'function', '앱 브리지(MEApp: 클립보드 복사·링크 열기) 연결')
    expect(info['audio'] == 'function/function', '소리 일시정지/재개 함수')
    page.js("window.__back=0;addEventListener('keydown',e=>{if(e.key==='Backspace')window.__back++});1")
    key(4)  # (뒤로 가기에 앱이 꺼지지 않는지는 1단계에서 확인)
    expect(page.js('window.__back') == 1, '뒤로 가기 → 게임 B(취소) 키 전달')
    page.js("localStorage.setItem('ci-test','saved');1")
    page.close()


adb('install', '-r', debug_apk)
time.sleep(3)  # 패키지 교체 마무리(이전 프로세스 종료·브로드캐스트) 대기
launch(15)
for attempt in range(2):
    try:
        debug_checks()
        break
    except (websocket.WebSocketException, ConnectionError) as e:
        # 설치 직후 패키지 관리자가 앱을 늦게 한 번 더 종료하면 연결이 끊긴다. 크래시는 끝에서 따로 검사한다.
        print(f'개발자 도구 연결이 끊김({type(e).__name__}) — 앱을 다시 실행해 한 번 더 확인', flush=True)
        kill_log()
        if attempt:
            diagnose()
            finish(1)
        adb('shell', 'am', 'force-stop', PKG)
        launch(15)
key(3, wait=8)  # 홈으로 나가기(onPause) — WebView가 localStorage를 디스크에 쓰는 시간(약 5초)
adb('shell', 'am', 'force-stop', PKG)
launch(15)
page = Page()
expect(page.js("localStorage.getItem('ci-test')") == 'saved', '앱을 완전히 껐다 켜도 저장(localStorage) 유지')
page.js("localStorage.removeItem('ci-test');1")
page.close()
shot('4-relaunch')
log = adb('logcat', '-d')
expect(f'Process: {PKG}' not in log, '테스트 전체에서 앱 크래시 없음')
gone = [l for l in log.splitlines() if 'WebView renderer gone' in l]
if gone:
    print('참고: WebView 렌더러 종료 후 다시 만듦\n' + '\n'.join(gone), flush=True)
finish(0)
