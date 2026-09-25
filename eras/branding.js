// Extract actual artwork contours for the animation, in normalized local boxes.
// Each atlas tile stores photograph color in RGB and signed distance in alpha.
window.buildBranding = function(image, boxes, options={}) {
  const size=256,atlas=document.createElement('canvas');atlas.width=size*boxes.length;atlas.height=size;
  const actx=atlas.getContext('2d'),source=document.createElement('canvas');source.width=image.width;source.height=image.height;
  const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const original=ctx.getImageData(0,0,source.width,source.height),erase=new Uint8Array(source.width*source.height);
  function distance(mask,seed){
    const d=Float32Array.from(mask,v=>v===seed?0:10000),w=size,h=size,s=Math.SQRT2;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let i=y*w+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y)d[i]=Math.min(d[i],d[i-w]+1);if(x&&y)d[i]=Math.min(d[i],d[i-w-1]+s);if(y&&x<w-1)d[i]=Math.min(d[i],d[i-w+1]+s);}
    for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){let i=y*w+x;if(x<w-1)d[i]=Math.min(d[i],d[i+1]+1);if(y<h-1)d[i]=Math.min(d[i],d[i+w]+1);if(x<w-1&&y<h-1)d[i]=Math.min(d[i],d[i+w+1]+s);if(x&&y<h-1)d[i]=Math.min(d[i],d[i+w-1]+s);}
    return d;
  }
  boxes.forEach((box,k)=>{
    const c=document.createElement('canvas');c.width=c.height=size;const cx=c.getContext('2d',{willReadFrequently:true});
    cx.drawImage(image,box[0]*image.width,box[1]*image.height,box[2]*image.width,box[3]*image.height,0,0,size,size);
    const data=cx.getImageData(0,0,size,size),mask=new Uint8Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,r=data.data[i*4],g=data.data[i*4+1],b=data.data[i*4+2];
      if(options.hiddenSlots?.includes(k))mask[i]=0;
      else if(k===2&&options.lionCrest)mask[i]=r>150&&g>100&&b<125?1:0;
      else if(k===2&&options.crestSplit){
        // Carry the lion inside the 2020 badge into the standalone 2026 lion.
        mask[i]=r<115&&g<170&&b>65&&b>r*1.35?1:0;
      }
      else if(k===3&&options.crestSplit){
        const radius=((x/size-.5)/.49)**2+((y/size-.5)/.49)**2;
        const px=box[0]+x/size*box[2],py=box[1]+y/size*box[3],lion=boxes[2];
        const inLion=px>=lion[0]&&px<=lion[0]+lion[2]&&py>=lion[1]&&py<=lion[1]+lion[3];
        mask[i]=radius<1&&!(inLion&&r<115&&g<170&&b>65&&b>r*1.35)?1:0;
      }
      else if(k===2){const radius=options.lightPrintOnly?.495:.47;mask[i]=((x/size-.5)/radius)**2+((y/size-.5)/radius)**2<1?1:0;}
      else {
        const lightInk=r>115&&g>115&&b-r<85;
        const redInk=k===0&&r>110&&g<110&&b<125;
        const navyInk=!options.lightPrintOnly&&k===0&&r<65&&g<95&&b<135;
        mask[i]=lightInk||redInk||navyInk?1:0;
      }
    }
    // Suppress embroidered texture holes before deriving a continuous contour.
    if(k!==2||options.lionCrest){
      const filtered=new Uint8Array(mask.length);
      for(let y=2;y<size-2;y++)for(let x=2;x<size-2;x++){
        let sum=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)sum+=mask[(y+dy)*size+x+dx];
        filtered[y*size+x]=sum>=10?1:0;
      }
      mask.set(filtered);
    }
    const outside=distance(mask,1),inside=distance(mask,0);
    for(let i=0;i<mask.length;i++){
      data.data[i*4+3]=Math.max(0,Math.min(255,128+(inside[i]-outside[i])*4));
      // Extend white ink color outside its boundary for stable resampling.
      if(k!==2&&!(options.crestSplit&&k===3)&&(options.lightPrintOnly||!mask[i])){
        const keepNike=options.preserveNikeInk&&k===1;
        if(!keepNike||!mask[i]){
          const red=options.lightPrintOnly&&k===0&&data.data[i*4]>110&&data.data[i*4+1]<110&&data.data[i*4+2]<125;
          data.data[i*4]=keepNike?244:red?230:247;
          data.data[i*4+1]=keepNike?216:red?38:248;
          data.data[i*4+2]=keepNike?61:red?37:250;
        }
      }
      if(k===2&&options.crestSplit){data.data[i*4]=22;data.data[i*4+1]=65;data.data[i*4+2]=151;}
      if(k===2&&options.lionCrest){data.data[i*4]=244;data.data[i*4+1]=216;data.data[i*4+2]=61;}
      if(k===1&&options.lionCrest){data.data[i*4]=244;data.data[i*4+1]=216;data.data[i*4+2]=61;}
    }
    actx.putImageData(data,k*size,0);
    const left=Math.floor(box[0]*image.width),top=Math.floor(box[1]*image.height),w=Math.ceil(box[2]*image.width),h=Math.ceil(box[3]*image.height);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const ix=Math.min(255,Math.floor(x/w*256)),iy=Math.min(255,Math.floor(y/h*256));
      const fullBadge=options.crestSplit&&k===3&&((ix/256-.5)/.50)**2+((iy/256-.5)/.50)**2<1;
      if(fullBadge||outside[iy*size+ix]<12)erase[(top+y)*source.width+left+x]=1;
    }
  });
  // Fill only print pixels from the nearest unprinted fabric boundary. This is
  // runtime preparation of the morph layer, leaving source files untouched.
  const w=source.width,h=source.height,n=w*h,queue=new Int32Array(n),known=Uint8Array.from(erase,v=>1-v);let head=0,tail=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!erase[i]&&(erase[i-1]||erase[i+1]||erase[i-w]||erase[i+w]))queue[tail++]=i;}
  while(head<tail){const i=queue[head++];for(const j of [i-1,i+1,i-w,i+w]){if(j<0||j>=n||known[j])continue;known[j]=1;for(let k=0;k<3;k++)original.data[j*4+k]=original.data[i*4+k];queue[tail++]=j;}}
  ctx.putImageData(original,0,0);
  return {clean:source,atlas};
};
