// Format the game's generated art for store/launcher asset dimensions.
const fs=require('fs'),path=require('path'),sharp=require(process.env.ART_SHARP||'sharp');
const root=path.resolve(__dirname,'..');
async function main(){const creature=await sharp(path.join(root,'assets/runtime/monsters.webp')).extract({left:0,top:0,width:160,height:160}).png().toBuffer();
 const icon=await sharp(creature).resize(512,512).flatten({background:'#2d7776'}).png().toBuffer();fs.writeFileSync(path.join(root,'store/icon-512.png'),icon);
 for(const [density,size,adaptive]of [['mdpi',48,108],['hdpi',72,162],['xhdpi',96,216],['xxhdpi',144,324],['xxxhdpi',192,432]]){
  const dir=path.join(root,'android/app/src/main/res','mipmap-'+density);
  await sharp(icon).resize(size,size).png().toFile(path.join(dir,'ic_launcher.png'));
  const foreground=await sharp(creature).resize(Math.round(adaptive*.66),Math.round(adaptive*.66)).extend({top:Math.floor(adaptive*.17),bottom:adaptive-Math.round(adaptive*.66)-Math.floor(adaptive*.17),left:Math.floor(adaptive*.17),right:adaptive-Math.round(adaptive*.66)-Math.floor(adaptive*.17),background:'#00000000'}).png().toBuffer();
  fs.writeFileSync(path.join(dir,'ic_launcher_foreground.png'),foreground);
  await sharp({create:{width:adaptive,height:adaptive,channels:4,background:'#2d7776'}}).png().toFile(path.join(dir,'ic_launcher_background.png'));
  const {data,info}=await sharp(foreground).raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)data[i]=data[i+1]=data[i+2]=255;
  await sharp(data,{raw:info}).png().toFile(path.join(dir,'ic_launcher_monochrome.png'));
 }
 const scene=await sharp(path.join(root,'assets/runtime/scenes.webp')).extract({left:0,top:0,width:512,height:384}).resize(1024,500,{fit:'cover'}).flatten({background:'#2d7776'}).png().toBuffer();fs.writeFileSync(path.join(root,'store/feature-graphic.png'),scene);
 console.log('Updated store and Android launcher assets');}
main().catch(e=>{console.error(e);process.exitCode=1;});
