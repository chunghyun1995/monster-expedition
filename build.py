"""src/ 의 파일들을 하나의 index.html로 묶습니다.  사용법: python3 build.py"""
import pathlib
root=pathlib.Path(__file__).parent
src=root/'src'
ORDER=['vendor_qr','core','audio','data','mon','gfx','portrait','ui','maps','menus','battle','world']
shell=(src/'shell.html').read_text(encoding='utf-8')
css=(src/'style.css').read_text(encoding='utf-8')
js='\n'.join((src/f'{n}.js').read_text(encoding='utf-8') for n in ORDER)
out=shell.replace('/*CSS*/',css).replace('/*JS*/',js)
(root/'index.html').write_text(out,encoding='utf-8')
print('index.html', len(out.splitlines()), 'lines', len(out.encode())//1024, 'KB')
