// Landmark correspondence for the actual 2006, 2011, 2016, 2020 and 2026 photographs.
// Coordinates describe the image, never a generic fit adjustment.
window.chelseaMotion = [
  { // 2006: upright collar, low sleeves, curved hem.
    edge:[[.386,.030],[.332,.058],[.200,.120],[.105,.270],[.019,.431],[.027,.445],[.120,.470],[.223,.479],[.224,.492],[.231,.580],[.218,.740],[.207,.930],[.350,.958],[.500,.970]],
    neck:[[.388,.033],[.399,.092],[.405,.126],[.394,.137],[.430,.153],[.466,.170],[.500,.176]],
    inner:[[.403,.043],[.410,.092],[.410,.119],[.404,.131],[.433,.145],[.467,.158],[.500,.162]],
    back:[.500,.055],seam:[[.345,.141],[.262,.218],[.223,.314]],
    panel:[[.279,.530],[.296,.700],[.345,.815],[.389,.903]]
  },
  { // 2011: high open sleeves, white shoulder yoke, round collar.
    edge:[[.425,.046],[.399,.054],[.145,.182],[.071,.233],[.011,.272],[.045,.321],[.087,.382],[.115,.426],[.207,.395],[.216,.580],[.196,.740],[.177,.908],[.335,.942],[.500,.957]],
    neck:[[.425,.046],[.405,.080],[.416,.113],[.428,.142],[.449,.173],[.474,.188],[.500,.194]],
    inner:[[.431,.064],[.428,.090],[.434,.119],[.445,.146],[.460,.166],[.479,.176],[.500,.179]],
    back:[.500,.055],seam:[[.395,.157],[.280,.194],[.272,.285]],
    panel:[[.275,.530],[.312,.675],[.335,.800],[.305,.905]]
  },
  { // 2016: set-in sleeves, front V, three stripes along the side.
    edge:[[.400,.030],[.373,.047],[.232,.107],[.112,.225],[.014,.316],[.058,.360],[.107,.407],[.152,.450],[.219,.350],[.196,.580],[.184,.740],[.174,.952],[.337,.965],[.500,.968]],
    neck:[[.400,.030],[.376,.058],[.394,.119],[.420,.160],[.447,.171],[.474,.188],[.500,.204]],
    inner:[[.407,.041],[.403,.071],[.415,.120],[.438,.157],[.460,.159],[.479,.170],[.500,.179]],
    back:[.500,.046],seam:[[.351,.110],[.245,.142],[.257,.252]],
    panel:[[.224,.530],[.216,.675],[.210,.800],[.202,.905]]
  },
  { // 2020: dark round collar, set-in sleeve and straight hem.
    edge:[[.406,.027],[.374,.043],[.230,.102],[.112,.211],[.016,.318],[.060,.363],[.110,.407],[.158,.445],[.200,.380],[.190,.580],[.181,.740],[.169,.959],[.335,.970],[.500,.973]],
    neck:[[.406,.027],[.375,.049],[.384,.095],[.408,.139],[.438,.165],[.471,.180],[.500,.184]],
    inner:[[.414,.047],[.414,.071],[.423,.107],[.438,.134],[.457,.148],[.480,.153],[.500,.154]],
    back:[.500,.044],seam:[[.350,.102],[.253,.119],[.263,.250]],
    panel:[[.211,.530],[.204,.675],[.197,.800],[.190,.905]]
  },
  { // 2026: folded polo, diagonal front yoke and curved Nike side panels.
    edge:[[.406,.033],[.371,.073],[.260,.108],[.124,.206],[.020,.306],[.064,.360],[.112,.411],[.159,.455],[.219,.431],[.205,.580],[.193,.740],[.172,.958],[.335,.968],[.500,.969]],
    neck:[[.406,.033],[.371,.077],[.389,.149],[.433,.215],[.464,.189],[.484,.183],[.500,.185]],
    inner:[[.418,.057],[.411,.090],[.431,.125],[.459,.164],[.478,.175],[.490,.180],[.500,.181]],
    back:[.500,.064],seam:[[.365,.104],[.304,.267],[.236,.420]],
    panel:[[.205,.530],[.235,.675],[.223,.800],[.189,.905]]
  }
].map(s=>{
  const points=[[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]];
  const left=[],right=[];
  const pair=(p,edge=false)=>{const i=points.length;points.push(p);if(p[0]!==.5)points.push([1-p[0],p[1]]);if(edge){left.push(i);right.push(p[0]===.5?i:i+1);}};
  // Keep the exterior edge and both edges of the collar independently registered.
  for(const path of [s.edge,s.neck,s.inner]){
    path.forEach((p,i)=>{
      pair(p,path===s.edge);
      if(i<path.length-1){const q=path[i+1];pair([(p[0]+q[0])/2,(p[1]+q[1])/2],path===s.edge);}
    });
  }
  const back=points.length;points.push(s.back);left.unshift(back);right.unshift(back);
  s.seam.forEach(p=>pair(p));s.panel.forEach(p=>pair(p));
  [[.32,.32],[.50,.29],[.68,.32],[.32,.42],[.50,.42],[.68,.42],
   [.35,.56],[.50,.56],[.65,.56],[.38,.70],[.50,.70],[.62,.70],
   [.39,.84],[.50,.84],[.61,.84],[.50,.92]].forEach(p=>points.push(p));
  points.outline=[...new Set([...left,...right])];points.contours=[left,right];return points;
});

// Snap measured silhouette samples to the photographed edge, including the
// asymmetric cuffs. This prevents two pale outlines around a moving sleeve.
window.registerChelseaSilhouettes=function(images){
  images.forEach((image,index)=>{
    const w=image.width,h=image.height,c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,w,h).data;
    const white=(x,y)=>{const i=(y*w+x)*4;return pixels[i]>235&&pixels[i+1]>235&&pixels[i+2]>235;};
    const outside=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
    function visit(i){if(i<0||i>=w*h||outside[i]||!white(i%w,Math.floor(i/w)))return;outside[i]=1;queue[tail++]=i;}
    for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
    while(head<tail){const i=queue[head++],x=i%w;if(x)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w);}
    const set=window.chelseaMotion[index],radius=Math.ceil(w*.028);
    for(const id of set.outline){
      if(id<16||id>60)continue;
      const [u,v]=set[id],cx=Math.round(u*w),cy=Math.round(v*h);let best=radius*radius,point=set[id];
      for(let y=Math.max(1,cy-radius);y<Math.min(h-1,cy+radius);y++)for(let x=Math.max(1,cx-radius);x<Math.min(w-1,cx+radius);x++){
        const i=y*w+x,d=(x-cx)**2+(y-cy)**2;
        if(d>=best||outside[i]||!(outside[i-1]||outside[i+1]||outside[i-w]||outside[i+w]))continue;
        best=d;point=[x/w,y/h];
      }
      set[id]=point;
    }
  });
};
