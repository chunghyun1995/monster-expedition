import java.util.Base64

plugins {
    id("com.android.application")
}

// 저장소 맨 위의 index.html(웹 게임 배포 파일)이 그대로 앱 화면이 된다.
val gameHtmlFile: File = rootProject.file("../index.html")
// 앱 버전 이름에 게임 빌드 번호(index.html의 BUILD)를 붙인다. 예: 3.0 (e1838253)
val gameBuild = Regex("const BUILD='(\\w+)'").find(gameHtmlFile.readText())?.groupValues?.get(1) ?: "dev"
// 빌드할 때마다 커지는 버전 코드(분 단위) — 새 APK를 지우지 않고 덮어 설치해 리포트를 유지한다.
val buildMinutes = ((System.currentTimeMillis() / 1000 - 1_700_000_000L) / 60).toInt()

fun env(name: String): String? = System.getenv(name)?.takeIf { it.isNotBlank() }

android {
    namespace = "io.github.chunghyun1995.monsterexpedition"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.chunghyun1995.monsterexpedition"
        minSdk = 24
        targetSdk = 35
        versionCode = buildMinutes
        versionName = "3.0 ($gameBuild)"
    }

    signingConfigs {
        // 배포용 개인 서명 키. 키 파일은 저장소에 올리지 않고, GitHub Actions에서는 저장소 시크릿,
        // 로컬에서는 환경 변수(ME_KEYSTORE_FILE·ME_KEYSTORE_PASSWORD·ME_KEY_ALIAS·ME_KEY_PASSWORD)로 넘긴다.
        env("ME_KEYSTORE_FILE")?.let { path ->
            create("private") {
                storeFile = file(path)
                storePassword = env("ME_KEYSTORE_PASSWORD") ?: error("ME_KEYSTORE_PASSWORD 환경 변수가 없습니다.")
                keyAlias = env("ME_KEY_ALIAS") ?: error("ME_KEY_ALIAS 환경 변수가 없습니다.")
                keyPassword = env("ME_KEY_PASSWORD") ?: env("ME_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        val privateKey = signingConfigs.findByName("private")
        release {
            isMinifyEnabled = false
            // 개인 키가 없으면 서명하지 않은 APK(app-release-unsigned.apk)가 나온다
            signingConfig = privateKey
        }
        debug {
            // 개인 키가 있으면 디버그 APK도 같은 키로 서명해 배포용 위에 덮어 설치할 수 있게 한다
            if (privateKey != null) signingConfig = privateKey
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
}

/**
 * 웹 게임(index.html)을 앱 assets로 복사하면서, CDN에서 받던 Galmuri 글꼴을 파일 안에 넣는다.
 * 인터넷이 없어도 글꼴이 그대로 보인다.
 */
abstract class PrepareGameAssets : DefaultTask() {
    @get:InputFile
    @get:PathSensitive(PathSensitivity.NONE)
    abstract val gameHtml: RegularFileProperty

    @get:InputDirectory
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val fontDir: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @TaskAction
    fun run() {
        val html = gameHtml.get().asFile.readText(Charsets.UTF_8)
        val link = Regex("<link rel=\"stylesheet\" href=\"https://cdn\\.jsdelivr\\.net/npm/galmuri@[^\"]+\">")
        check(link.containsMatchIn(html)) { "index.html에서 Galmuri 글꼴 링크를 찾지 못했습니다." }
        val fonts = fontDir.get().asFile
        fun face(family: String, weight: Int, file: String): String {
            val b64 = Base64.getEncoder().encodeToString(File(fonts, file).readBytes())
            return "@font-face{font-family:$family;font-style:normal;font-weight:$weight;font-display:block;" +
                "src:url(data:font/woff2;base64,$b64) format('woff2')}"
        }
        val css = listOf(
            "<style>/* Galmuri — SIL Open Font License 1.1 (OFL-Galmuri.txt) */",
            face("Galmuri11", 400, "Galmuri11.woff2"),
            face("Galmuri11", 700, "Galmuri11-Bold.woff2"),
            face("Galmuri9", 400, "Galmuri9.woff2"),
            "</style>",
        ).joinToString("\n")
        val out = outputDir.get().asFile
        out.deleteRecursively()
        out.mkdirs()
        File(out, "index.html").writeText(link.replace(html) { css }, Charsets.UTF_8)
        File(fonts, "OFL.txt").copyTo(File(out, "OFL-Galmuri.txt"), overwrite = true)
    }
}

androidComponents {
    onVariants { variant ->
        val name = variant.name.replaceFirstChar { it.uppercase() }
        val task = tasks.register<PrepareGameAssets>("prepare${name}GameAssets") {
            gameHtml.set(gameHtmlFile)
            fontDir.set(rootProject.layout.projectDirectory.dir("fonts"))
        }
        variant.sources.assets?.addGeneratedSourceDirectory(task, PrepareGameAssets::outputDir)
    }
}
