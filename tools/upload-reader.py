"""Read reviewable local content for the connected GitHub Git-data API.
This helper has no credentials or network access.
"""
import base64,hashlib,json,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parent.parent
if len(sys.argv)==1:
    changed=subprocess.check_output(['git','diff','--name-only','-z'],cwd=R).decode('utf-8').split('\0')
    new=subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z'],cwd=R).decode('utf-8').split('\0')
    rows=[]
    for name in sorted(set(changed+new)):
        if not name or name.endswith('.import'):continue
        p=R/name
        if p.is_file():
            b=p.read_bytes();sha=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
            rows.append({'path':name,'bytes':len(b),'sha':sha})
    print(json.dumps(rows,ensure_ascii=False))
else:
    p=(R/sys.argv[1]).resolve();assert p.is_relative_to(R)
    b=p.read_bytes()
    if len(sys.argv)>2:
        offset=int(sys.argv[2]);length=int(sys.argv[3]);b=b[offset:offset+length]
    print(base64.b64encode(b).decode('ascii'))
