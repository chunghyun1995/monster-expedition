// Equivalent to build.py, for machines with Node instead of Python.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),src=path.join(root,'src');
const order=['vendor_qr','core','audio','data','mon','gfx','portrait','ui','maps','maps2','postgame','menus','battle','world','npcfight','auto','assets25d','art25d'];
const read=f=>fs.readFileSync(path.join(src,f),'utf8').replace(/\r\n?/g,'\n');
const shell=read('shell.html'),css=read('style.css'),js=order.map(n=>read(n+'.js')).join('\n');
const build=crypto.createHash('sha1').update(shell+css+js).digest('hex').slice(0,8);
const out=shell.replace('/*CSS*/',()=>css).replace('/*JS*/',()=>`const BUILD='${build}';\n${js}`);
fs.writeFileSync(path.join(root,'index.html'),out);console.log('Built',build,Math.round(Buffer.byteLength(out)/1024)+' KB');
