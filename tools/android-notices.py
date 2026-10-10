"""Refresh dependency evidence and included licence texts from upstream POMs."""
import json,re,urllib.request,xml.etree.ElementTree as E
from pathlib import Path
R=Path(__file__).resolve().parent.parent
strings=json.loads((R.parent/'monster-expedition-ip-audit/evidence/android-dependency-strings.json').read_text())
out=[]
for i,g in enumerate(strings[:-2]):
    if not re.fullmatch(r'(androidx\.[\w.]+|org\.jetbrains(?:\.[\w.]+)?|org\.jspecify|com\.google\.guava)',g):continue
    a=strings[i+1].rstrip('*');v=strings[i+2]
    if g=='com.google.guava' and a=='listenablefuture':v='1.0'
    if not re.match(r'^\d+\.',v):raise ValueError((g,a,v))
    host='https://dl.google.com/dl/android/maven2/' if g.startswith('androidx.') else 'https://repo.maven.apache.org/maven2/'
    url=host+g.replace('.','/')+'/'+a+'/'+v+'/'+a+'-'+v+'.pom'
    req=urllib.request.Request(url,headers={'User-Agent':'Veloria-license-review/1.0'})
    with urllib.request.urlopen(req,timeout=40) as f:data=f.read()
    root=E.fromstring(data);ns={'m':'http://maven.apache.org/POM/4.0.0'}
    licenses=[{'name':n.findtext('m:name',namespaces=ns),'url':n.findtext('m:url',namespaces=ns)} for n in root.findall('m:licenses/m:license',ns)]
    if not licenses:
        parent=root.find('m:parent',ns)
        assert parent is not None,(g,a,v)
        pg=parent.findtext('m:groupId',namespaces=ns);pa=parent.findtext('m:artifactId',namespaces=ns);pv=parent.findtext('m:version',namespaces=ns)
        parent_url=host+pg.replace('.','/')+'/'+pa+'/'+pv+'/'+pa+'-'+pv+'.pom'
        with urllib.request.urlopen(parent_url,timeout=40) as f:pr=E.fromstring(f.read())
        licenses=[{'name':n.findtext('m:name',namespaces=ns),'url':n.findtext('m:url',namespaces=ns)} for n in pr.findall('m:licenses/m:license',ns)]
    assert licenses,(g,a,v)
    out.append({'group':g,'artifact':a,'version':v,'pom':url,'licenses':licenses})
    print(g,a,v,','.join(x['name'] or '' for x in licenses))
dest=R/'godot/licenses';dest.mkdir(exist_ok=True)
(dest/'Android-dependencies.json').write_text(json.dumps({'basis':'godot-41 AAB dependency metadata; Godot 4.7.2 export template. Recheck after export.','components':out},ensure_ascii=False,indent=2),encoding='utf-8')
urls={
'JSpecify-LICENSE.txt':'https://raw.githubusercontent.com/jspecify/jspecify/v1.0.0/LICENSE',
'JetBrains-annotations-LICENSE.txt':'https://raw.githubusercontent.com/JetBrains/java-annotations/13.0/LICENSE',
'Kotlin-LICENSE.txt':'https://raw.githubusercontent.com/JetBrains/kotlin/v2.1.21/license/LICENSE.txt',
'Coroutines-LICENSE.txt':'https://raw.githubusercontent.com/Kotlin/kotlinx.coroutines/1.6.4/LICENSE.txt',
}
for name,url in urls.items():
    try:
        with urllib.request.urlopen(url,timeout=35) as f:content=f.read().decode('utf-8')
        (dest/name).write_text(content,encoding='utf-8')
    except Exception as exc:print('UPSTREAM_LICENSE_FETCH_FAILED',name,exc)
text='Android export dependencies\n\nThis application exports with Godot 4.7.2. The following Android template dependencies are distributed under the licenses identified by their upstream Maven POMs. The JSON inventory contains exact versions and links. Apache License 2.0 is included in Apache-2.0.txt. Kotlin, kotlinx.coroutines, AndroidX, JetBrains annotations and Guava are separately credited below. JSpecify uses Apache-2.0 and has its full upstream licence included.\n\n'
text+='\n'.join(f"{c['group']}:{c['artifact']}:{c['version']} — "+'; '.join((l['name'] or '')+' '+(l['url'] or '') for l in c['licenses']) for c in out)
text+='\n\nCopyright holders credited by upstream projects: The Android Open Source Project (AndroidX); JetBrains s.r.o. and contributors (Kotlin, kotlinx.coroutines, annotations); Google LLC and Guava authors (listenablefuture); JSpecify Authors (JSpecify). No authorship of these dependencies is claimed.\n'
(dest/'Android-NOTICE.txt').write_text(text,encoding='utf-8')
print('Recorded',len(out),'dependencies')
