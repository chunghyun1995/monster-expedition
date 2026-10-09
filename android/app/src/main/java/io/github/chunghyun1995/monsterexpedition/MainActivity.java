package io.github.chunghyun1995.monsterexpedition;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

/**
 * 몬스터 원정대 안드로이드 앱.
 * assets/index.html(웹 게임 그대로, 글꼴만 내장)을 전체 화면 WebView로 띄운다.
 * 리포트(세이브)는 WebView의 localStorage에 저장되어 앱을 업데이트해도 유지된다.
 */
public class MainActivity extends Activity {
    private static final String GAME_URL = "file:///android_asset/index.html";
    private static final String ASSET_PREFIX = "file:///android_asset/";

    private FrameLayout root;
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setVolumeControlStream(AudioManager.STREAM_MUSIC); // 볼륨 키로 게임 소리 조절
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); // 자동 사냥 중 화면 꺼짐 방지

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(0x14, 0x16, 0x1f));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(0x14, 0x16, 0x1f));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setHapticFeedbackEnabled(false);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // localStorage(리포트·설정)
        s.setMediaPlaybackRequiresUserGesture(false); // BGM·효과음
        s.setTextZoom(100);                           // 시스템 글자 크기와 무관하게 게임 화면 유지
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true); // 디버그 빌드: PC 크롬 chrome://inspect 로 확인
        }

        web.addJavascriptInterface(new AppBridge(), "MEApp");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openOutside(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openOutside(Uri.parse(url));
            }
        });

        setupFullscreen();
        setupBack();
        web.loadUrl(GAME_URL);
    }

    /** 게임 밖 주소(웹 링크 등)는 브라우저로 연다. */
    private boolean openOutside(Uri uri) {
        String url = uri.toString();
        if (url.startsWith(ASSET_PREFIX)) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            // 열 수 있는 앱이 없으면 무시
        }
        return true;
    }

    /** 상태 표시줄·내비게이션 바를 숨기고, 카메라 구멍(컷아웃)과 키보드만큼은 비워 둔다. */
    private void setupFullscreen() {
        Window w = getWindow();
        w.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false);
        }
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            @SuppressWarnings("deprecation")
            public WindowInsets onApplyWindowInsets(View v, WindowInsets in) {
                int l = 0, t = 0, r = 0, b = 0;
                if (Build.VERSION.SDK_INT >= 30) {
                    android.graphics.Insets cut = in.getInsets(WindowInsets.Type.displayCutout());
                    android.graphics.Insets ime = in.getInsets(WindowInsets.Type.ime());
                    l = cut.left;
                    t = cut.top;
                    r = cut.right;
                    b = Math.max(cut.bottom, ime.bottom);
                } else {
                    if (Build.VERSION.SDK_INT >= 28) {
                        DisplayCutout cut = in.getDisplayCutout();
                        if (cut != null) {
                            l = cut.getSafeInsetLeft();
                            t = cut.getSafeInsetTop();
                            r = cut.getSafeInsetRight();
                            b = cut.getSafeInsetBottom();
                        }
                    }
                    // 내비게이션 바 높이보다 크면 키보드가 올라온 것
                    int sys = in.getSystemWindowInsetBottom();
                    if (sys > in.getStableInsetBottom()) b = Math.max(b, sys);
                }
                v.setPadding(l, t, r, b);
                return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : in.consumeSystemWindowInsets();
            }
        });
        hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    /** 뒤로 가기 = B(취소) 버튼. Android 13+는 OnBackInvokedCallback, 12 이하는 onBackPressed로 받는다. */
    private void setupBack() {
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, new OnBackInvokedCallback() {
                        @Override
                        public void onBackInvoked() {
                            pressB();
                        }
                    });
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        pressB();
    }

    private void pressB() {
        web.evaluateJavascript(
                "dispatchEvent(new KeyboardEvent('keydown',{key:'Backspace'}));"
                        + "dispatchEvent(new KeyboardEvent('keyup',{key:'Backspace'}));", null);
    }

    @Override
    protected void onPause() {
        // 앱을 벗어나면 소리를 멈춘다(돌아오면 다시 재생)
        web.evaluateJavascript("typeof audioPause==='function'&&audioPause()", null);
        web.onPause();
        web.pauseTimers();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.resumeTimers();
        web.onResume();
        web.evaluateJavascript("typeof audioResume==='function'&&audioResume()", null);
        hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        root.removeView(web);
        web.destroy();
        super.onDestroy();
    }

    /** 게임(JS)에서 window.MEApp 으로 부르는 기능. */
    private class AppBridge {
        /** 저장 코드·링크 복사: 웹 클립보드 API 대신 안드로이드 클립보드에 바로 넣는다. */
        @JavascriptInterface
        public void copyText(String text) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("몬스터 원정대", text));
        }
    }
}
