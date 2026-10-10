/* Original generated miniature art. Rendering only: saves, maps and combat rules
   keep their existing IDs. All images are embedded for the Android offline app. */
const ART={ready:false,images:{},cells:{},rigs:{},motion:null,throwUntil:0};
const ART_LOOK=Object.keys(LOOK);
function artCell(key,index){const cache=key+':'+index;if(ART.cells[cache])return ART.cells[cache];
 const a=ART_ASSETS[key],[cv,g]=mkCanvas(a.cw,a.ch);g.imageSmoothingEnabled=true;
 g.drawImage(ART.images[key],index%a.cols*a.cw,Math.floor(index/a.cols)*a.ch,a.cw,a.ch,0,0,a.cw,a.ch);
 return ART.cells[cache]=cv;}
function artShadow(g,x,y,w,h,a=.22){g.save();g.translate(x,y);g.scale(w,h);
 const grad=g.createRadialGradient(0,0,0,0,0,1);grad.addColorStop(0,`rgba(17,29,28,${a})`);grad.addColorStop(1,'rgba(17,29,28,0)');
 g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();g.restore();}
// Normalize the visible silhouette, not the transparent atlas cell dimensions.
function artTightCell(key,index){const cache='tight:'+key+':'+index;if(ART.cells[cache])return ART.cells[cache];
 const source=artCell(key,index),g=source.getContext('2d'),data=g.getImageData(0,0,source.width,source.height).data;
 let x0=source.width,y0=source.height,x1=0,y1=0;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(data[(y*source.width+x)*4+3]>64){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x0>x1)return source;const[c,cg]=mkCanvas(x1-x0+5,y1-y0+5);cg.drawImage(source,x0,y0,x1-x0+1,y1-y0+1,2,2,x1-x0+1,y1-y0+1);return ART.cells[cache]=c;}
// Cut-out limbs have their own shoulder/hip pivots, giving both NPCs and combat
// characters actual arm/foot motion instead of moving an entire static image.
function artRig(cv){if(ART.rigs[cv.__artId])return ART.rigs[cv.__artId];cv.__artId||=Object.keys(ART.rigs).length+1;
 const w=cv.width,h=cv.height,regions=[[[0,.44],[.28,.44],[.34,.72],[0,.77]],[[.72,.44],[1,.44],[1,.77],[.66,.72]],[[0,.76],[.5,.76],[.5,1],[0,1]],[[.5,.76],[1,.76],[1,1],[.5,1]]];
 const body=mkCanvas(w,h)[0],bg=body.getContext('2d');bg.drawImage(cv,0,0);
 const parts=regions.map(points=>{const[c,g]=mkCanvas(w,h);g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x*w,y*h):g.moveTo(x*w,y*h));g.closePath();g.save();g.clip();g.drawImage(cv,0,0);g.restore();
  bg.save();bg.globalCompositeOperation='destination-out';bg.drawImage(c,0,0);bg.restore();return c;});
 return ART.rigs[cv.__artId]={body,parts,w,h};}
function artDrawRig(g,cv,x,y,w,h,phase,strength=1){const rig=artRig(cv);g.save();g.translate(x,y);g.scale(w/rig.w,h/rig.h);
 const pivots=[[.27,.47],[.73,.47],[.37,.76],[.63,.76]];
 rig.parts.forEach((c,i)=>{const [px,py]=pivots[i],s=i%2?1:-1;
  g.save();g.translate(px*rig.w,py*rig.h);g.rotate(Math.sin(phase)*s*(i<2?.12:.14)*strength);g.drawImage(c,-px*rig.w,-py*rig.h);g.restore();});
 g.drawImage(rig.body,0,0);g.restore();}
const artOldMon=monCanvas,artOldPerson=person,artOldTileOut=drawTileOut,artOldTileIn=drawTileIn,artOldPortrait=portraitSVG,artOldBg=battleBg;
monCanvas=function(sid,back=false,shiny=false){if(!ART.ready)return artOldMon(sid,back,shiny);
 const key='art'+sid+(back?'b':'f')+(shiny?'s':'');if(MONC[key])return MONC[key];
 const sp=SP[sid];if(!sp)return artOldMon(sid,back,shiny);
 let cv;if(sp.human){const i=Math.max(0,ART_LOOK.indexOf(sp.human)),src=artCell(back?'peopleBack':'people',i);const[c,g]=mkCanvas(192,192);g.imageSmoothingEnabled=true;g.drawImage(src,32,0,128,192);cv=c;}
 else cv=artCell(back?'backs':'monsters',sid-1);
 if(shiny){const[c,g]=mkCanvas(cv.width,cv.height);g.filter='hue-rotate(70deg) saturate(1.15)';g.drawImage(cv,0,0);cv=c;}
 return MONC[key]=cv;};
drawMon=function(g,sid,fx,fy,scale,o={}){if(!sid)return;const cv=monCanvas(sid,o.back,o.shiny),w=24*scale*(o.sx||1),h=24*scale*(o.sy||1);
 const side=o.back?'p':'e',active=state==='battle'&&ART.motion?.side===side,motion=active?ART.motion:null;
 let tilt=0,squash=0;if(motion){const t=(performance.now()-motion.start)/1000;tilt=Math.sin(Math.min(t/.18,1)*Math.PI/2)*(side==='p'?-.12:.12);squash=motion.stage==='prepare'?.08:.025;}
 g.save();g.imageSmoothingEnabled=true;if(o.alpha!=null)g.globalAlpha=clamp(o.alpha,0,1);
 if(o.clipY!=null){g.beginPath();g.rect(0,0,W,o.clipY);g.clip();}
 g.translate(fx,fy);g.rotate(tilt);const breath=state==='battle'&&!motion?Math.sin(performance.now()/600+sid)*.006:0;g.scale(1+squash,1-squash+breath);
 const rendered=o.dark?tinted(cv,'#14141e'):cv;
 if(SP[sid]?.human&&!o.dark)artDrawRig(g,rendered,-w/2,-h,w,h,performance.now()/80,active?1.8:.12);
 else if(active&&!o.dark)artDrawRig(g,rendered,-w/2,-h,w,h,(performance.now()-motion.start)/75,1.2);
 else g.drawImage(rendered,-w/2,-h,w,h);
 if(o.white>0){g.globalAlpha=(o.alpha??1)*clamp(o.white,0,1);g.drawImage(tinted(cv,o.whiteCol||'#fff'),-w/2,-h,w,h);}
 g.restore();};
person=function(g,sx,sy,dir,fr,L){if(!ART.ready)return artOldPerson(g,sx,sy,dir,fr,L);
 const player=L===LOOK.player,i=Math.max(0,ART_LOOK.findIndex(k=>LOOK[k]===L)),moving=player?(state==='world'?P.moving:fr>0||Math.abs(B?.ptr?.x||0)>1):fr>0;
 const phase=player&&state==='world'?(P.step+P.t)*Math.PI*2:performance.now()/110;
 let cv;if(player){const row={down:0,up:1,left:2,right:3}[dir]||0,throwing=performance.now()<ART.throwUntil;
  const col=throwing?3:moving?(Math.sin(phase)>=0?1:2):0;cv=artTightCell('walk',row*4+col);
 }else cv=artTightCell(dir==='up'?'peopleBack':'people',i);
 const h=26,w=Math.min(24,h*cv.width/cv.height),hop=moving?-Math.abs(Math.sin(phase))*(player&&P.run?1.1:.55):Math.sin(performance.now()/850+i)*.12;
 artShadow(g,sx+8,sy+19,7,2.5);g.save();g.imageSmoothingEnabled=true;
 if(!player&&(dir==='left'||dir==='right')){g.translate(sx+8,0);g.scale(dir==='left'?-.86:.86,1);sx=-8;}
 artDrawRig(g,cv,sx+8-w/2,sy+20-h+hop,w,h,phase,moving?1:0);g.restore();};
portraitSVG=function(key){if(!ART.ready)return artOldPortrait(key);const i=Math.max(0,ART_LOOK.indexOf(key)),cache='portrait:'+i;
 if(!ART.cells[cache]){const[c,g]=mkCanvas(160,160);g.imageSmoothingEnabled=true;g.drawImage(artCell('people',i),0,0,128,124,8,8,144,140);ART.cells[cache]=c.toDataURL('image/webp');}
 return `<img src="${ART.cells[cache]}" alt="${key==='player'?'원정대원':'등장인물'}" style="width:100%;height:100%;object-fit:contain">`;};
battleBg=function(kind){if(!ART.ready)return artOldBg(kind);const key='art:'+kind;if(BGC[key])return BGC[key];
 const[c,g]=mkCanvas(W*SC,H*SC);g.imageSmoothingEnabled=true;g.drawImage(artCell('scenes',Math.max(0,['grass','forest','city','rock','water','lab'].indexOf(kind))),0,0,c.width,c.height);
 // Existing renderer expects logical dimensions, so store a logical canvas with
 // high resolution source separately and pass explicit sizes at the call site.
 return BGC[key]=c;};
platform=function(g,x,y,rx,ry){artShadow(g,x,y,rx,ry,.2);};
function artTerrain(i,sx,sy,tx,ty){ctx.save();ctx.imageSmoothingEnabled=true;ctx.translate(sx+8,sy+8);ctx.scale(tx&1?-1:1,ty&1?-1:1);const c=artCell('terrain',i);ctx.drawImage(c,4,4,c.width-8,c.height-8,-8,-8,16,16);
 if(i===0){ctx.fillStyle='rgba(113,149,81,.62)';ctx.fillRect(-8,-8,16,16);}ctx.restore();}
function artProp(g,i,sx,sy,w=18,h=23){const c=artCell('props',i);g.imageSmoothingEnabled=true;g.drawImage(c,sx+8-w/2,sy+16-h,w,h);}
drawTileOut=function(m,tx,ty,sx,sy){if(!ART.ready)return artOldTileOut(m,tx,ty,sx,sy);const c=tileAt(m,tx,ty);if(c==null){R('#162c2e',sx,sy,16,16);return;}
 const ground=c==='='?1:c==='~'||c==='Q'?3:c===':'?13:c==='%'?14:c==='^'||c==='O'?12:m.pal?.ash?13:0;
 artTerrain(ground,sx,sy,tx,ty);
 if(c==='~'||c==='%'){ctx.save();ctx.globalAlpha=.18+.1*Math.sin(performance.now()/900+tx+ty);ctx.strokeStyle=c==='~'?'#e4ffff':'#fff6b2';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(sx+8,sy+8,5,1,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(c===',')artProp(ctx,2,sx,sy,17,17);if(c==='f')artProp(ctx,3,sx,sy,16,14);
 if(c==='Q')artProp(ctx,14,sx,sy,18,17);if(c==='L'){ctx.fillStyle='#467849';ctx.fillRect(sx,sy+12,16,4);ctx.strokeStyle='#9fc792';ctx.beginPath();ctx.moveTo(sx,sy+12);ctx.lineTo(sx+16,sy+12);ctx.stroke();}
};
drawTileIn=function(m,tx,ty,sx,sy){if(!ART.ready)return artOldTileIn(m,tx,ty,sx,sy);const c=tileAt(m,tx,ty);
 if(c==='x'){R('#19212e',sx,sy,16,16);return;}artTerrain(c==='w'?11:c==='~'?3:c==='%'?14:m.floor==='wood'?8:9,sx,sy,tx,ty);
 if(c==='m'||c==='c'){ctx.fillStyle=c==='m'?'#698f80':'#af7184';ctx.fillRect(sx+1,sy+3,14,11);ctx.strokeStyle='#e8cf8f';ctx.strokeRect(sx+2,sy+4,12,9);}
 if(c==='u'){ctx.fillStyle='#625b70';ctx.fillRect(sx+1,sy+1,14,14);for(let j=0;j<4;j++){ctx.fillStyle='#c9c4d5';ctx.fillRect(sx+2,sy+2+j*3,12,1.5);}}
};
const ART_BUILDINGS=new WeakMap();
const ART_FURNITURE=new WeakMap();
function artFurniture(m){if(ART_FURNITURE.has(m))return ART_FURNITURE.get(m);const seen=new Set(),groups=[];
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(tileAt(m,x,y)!=='T'||seen.has(x+','+y))continue;const stack=[[x,y]],cells=[];
  while(stack.length){const[a,b]=stack.pop(),key=a+','+b;if(seen.has(key)||tileAt(m,a,b)!=='T')continue;seen.add(key);cells.push([a,b]);for(const[dx,dy]of Object.values(DV))stack.push([a+dx,b+dy]);}
  const xs=cells.map(p=>p[0]),ys=cells.map(p=>p[1]);groups.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs)+1,h:Math.max(...ys)-Math.min(...ys)+1});
 }ART_FURNITURE.set(m,groups);return groups;}
function artBuildings(m){if(ART_BUILDINGS.has(m))return ART_BUILDINGS.get(m);const seen=new Set(),list=[];
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const code=tileAt(m,x,y),id=x+','+y;if(!'HKBCMGT'.includes(code||' ')||seen.has(id))continue;
  const stack=[[x,y]],cells=[];while(stack.length){const [a,b]=stack.pop(),key=a+','+b;if(seen.has(key)||![code,'D'].includes(tileAt(m,a,b)))continue;seen.add(key);cells.push([a,b]);for(const[dx,dy]of Object.values(DV))stack.push([a+dx,b+dy]);}
  const xs=cells.map(p=>p[0]),ys=cells.map(p=>p[1]);list.push({code,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs)+1,h:Math.max(...ys)-Math.min(...ys)+1,doors:cells.filter(([a,b])=>tileAt(m,a,b)==='D')});
 }ART_BUILDINGS.set(m,list);return list;}
function artMapObjects(m,cx,cy,ents){if(!ART.ready)return;
 const props=m.out?{'#':0,s:5,r:4,F:13,E:23,O:22}:{K:21,S:16,P:15,h:21,v:15,b:18,p:19,R:4,Y:20};
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const c=tileAt(m,x,y),i=props[c];if(i==null)continue;
  const sx=x*T-cx,sy=y*T-cy;if(sx<-40||sx>W+40||sy<-40||sy>H+40)continue;
  ents.push({y:y*T,f:()=>artProp(ctx,c==='#'&&m.bg==='forest'&&((x+y)&1)?1:i,sx,sy,c==='#'?23:c==='F'?17:19,c==='#'?29:c==='O'?24:23)});
 }
 if(!m.out)for(const b of artFurniture(m)){const x=b.x*T-cx,y=b.y*T-cy,w=b.w*T,h=b.h*T;
  ents.push({y:(b.y+b.h-1)*T-.2,f:()=>{ctx.drawImage(artTightCell('props',17),x,y-2,w,h+2);}});
 }
 if(m.out)for(const b of artBuildings(m)){const sx=b.x*T-cx,sy=b.y*T-cy,w=b.w*T,h=b.h*T;
  ents.push({y:(b.y+b.h-1)*T-1,f:()=>{artShadow(ctx,sx+w/2,sy+h-1,w*.5,4);ctx.drawImage(artCell('props',{H:6,K:7,B:8,C:9,M:10,G:11,T:12}[b.code]),sx-2,sy-7,w+4,h+7);
   for(const [x,y]of b.doors){const dx=x*T-cx;ctx.fillStyle='#334844';ctx.fillRect(dx+3,y*T-cy+7,10,9);ctx.fillStyle='#d8c79b';ctx.fillRect(dx+2,y*T-cy+15,12,1);}
  }});
 }
}
grassOver=function(g,m,x,y,sx,sy){if(!ART.ready||tileAt(m,x,y)!==',')return;g.save();g.beginPath();g.rect(sx,sy+15,16,5);g.clip();artProp(g,2,sx,sy+4,18,17);g.restore();};
const artOldMove=animMove;
animMove=async function(side,mv,weak){if(!SET.anim)return artOldMove(side,mv,weak);const actor=B[side],opponent=B[OTHER(side)],d=side==='p'?1:-1;
 ART.motion={side,start:performance.now(),stage:'prepare'};
 try{await tween(140,k=>{actor.sx=1+.08*k;actor.sy=1-.08*k;actor.x=-d*3*k;});actor.x=0;actor.sx=actor.sy=1;ART.motion.stage='release';
  const origin=center(side),colour=TYPES[mv.t]?.c||'#c0f1e6';for(let j=0;j<7;j++)FX.add({x:origin.x,y:origin.y,vx:Math.cos(j*Math.PI*2/7)*.6,vy:Math.sin(j*Math.PI*2/7)*.6,shape:'circ',c:colour,s:1.5,life:20});
  await artOldMove(side,mv,weak);
  if(mv.pow>0||mv.p>0){await tween(110,k=>{opponent.x=d*Math.sin(k*Math.PI)*3;opponent.sy=1-Math.sin(k*Math.PI)*.04;});}
 }finally{ART.motion=null;for(const a of [actor,opponent]){a.x=a.y=0;a.sx=a.sy=1;a.white=0;a.alpha=1;}}
};
const artOldSend=sendPlayer;
sendPlayer=async function(){ART.throwUntil=performance.now()+750;return artOldSend();};
// A faceted seed lantern, with no two-tone ball seam or central button.
capsule=function(g,x,y,r=0,o={}){g.save();g.translate(x,y);g.rotate(r);const col=o.kind==='great'?'#b886ed':'#52cfb6';
 const grad=g.createLinearGradient(-4,-6,4,6);grad.addColorStop(0,'#e9fff5');grad.addColorStop(.4,col);grad.addColorStop(1,'#285c60');
 g.fillStyle=grad;g.strokeStyle='#c5ae68';g.lineWidth=.8;g.beginPath();g.moveTo(0,-6);g.lineTo(4,-2);g.lineTo(3,4);g.lineTo(0,6);g.lineTo(-3,4);g.lineTo(-4,-2);g.closePath();g.fill();g.stroke();
 g.strokeStyle='rgba(255,255,255,.65)';g.beginPath();g.moveTo(0,-5);g.lineTo(-1,4);g.moveTo(-3,-2);g.lineTo(3,2);g.stroke();
 if(o.open){g.strokeStyle='#e8ffdc';g.beginPath();g.ellipse(0,-7,6,2,0,0,Math.PI*2);g.stroke();}g.restore();};
const artOldItem=itemIcon,artOldMenu=menuIcon;
itemIcon=function(id){if(!ITEMS[id]?.ball)return artOldItem(id);const key='artitem:'+id;if(UIIC[key])return UIIC[key];const[c,g]=mkCanvas(64,64);g.scale(4,4);capsule(g,8,8,0,{kind:id});return UIIC[key]=c.toDataURL();};
menuIcon=function(key){if(key!=='party')return artOldMenu(key);return monIcon(1);};
const artOldFxDraw=FX.draw;
FX.draw=function(g){g.save();g.globalCompositeOperation='screen';for(const p of this.list.slice(0,32)){
 if(!['flame','bolt','beam','circ','wisp','impact','aura'].includes(p.shape))continue;const radius=Math.max(3,Math.min(12,(p.s||2)*2));
 const grad=g.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);grad.addColorStop(0,p.c||'#ffd198');grad.addColorStop(1,'rgba(0,0,0,0)');
 g.globalAlpha=.24*clamp(1-p.t/p.life,0,1);g.fillStyle=grad;g.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);
 }g.restore();artOldFxDraw.call(this,g);};
const artOldTitle=drawTitle;
drawTitle=function(g){if(!ART.ready)return artOldTitle(g);g.drawImage(artCell('scenes',0),0,0,W,H);
 const grad=g.createLinearGradient(0,0,0,H);grad.addColorStop(0,'rgba(14,47,54,.48)');grad.addColorStop(.55,'rgba(14,47,54,0)');g.fillStyle=grad;g.fillRect(0,0,W,H);
 TITLE_MONS.forEach((sid,i)=>{const x=48+i*80,y=174-Math.sin(performance.now()/800+i)*2;artShadow(g,x,173,24,5);drawMon(g,sid,x,y,3);});
 // The existing DOM logo owns the title and subtitle; don't paint a second one.
};
async function artBoot(){try{await Promise.all(Object.entries(ART_ASSETS).map(async([key,a])=>{const im=new Image();im.src=a.src;await im.decode();ART.images[key]=im;}));ART.ready=true;
 document.getElementById('app').classList.add('art25d');
 }catch(error){console.error('2.5D asset loading failed',error);document.getElementById('help').textContent='이미지를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';}
 Pad.init();requestAnimationFrame(loop);titleScreen();}
artBoot();
