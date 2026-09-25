(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const canvas=$('jersey'), range=$('progress'), play=$('play');
  const seasons=[
    {year:'1998/99',detail:'Umbro · Autoglass',construction:'Kerah lipat · panel raglan',src:'assets/chelsea-1998-v2.png'},
    {year:'2004/05',detail:'Umbro · Fly Emirates',construction:'Kerah V · lengan set-in',src:'assets/chelsea-2004-v2.png'},
    {year:'2006/07',detail:'Adidas · Samsung mobile',construction:'Kerah membulat · panel Teamgeist',src:'assets/chelsea-2006.png'},
    {year:'2011/12',detail:'Adidas · Samsung',construction:'Kerah crew-neck · hoop tonal',src:'assets/chelsea-2011.png'},
    {year:'2016/17',detail:'Adidas · Yokohama Tyres',construction:'Kerah V · singa tonal di depan · three stripes samping',src:'assets/chelsea-2016-v4.png'},
    {year:'2020/21',detail:'Nike · Three',construction:'Kerah crew-neck · pola zigzag',src:'assets/chelsea-2020-v3.png'}
  ];
  let value=0,target=0,playing=false,direction=1,last=0,queued=false,ready=false;
  let render=()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops=[...document.querySelectorAll('.stops button')],segments=seasons.length-1,lines=[];
  for(let i=0;i<=80;i++){
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',3+i*7.425);line.setAttribute('x2',3+i*7.425);line.setAttribute('y2',80);line.setAttribute('stroke-linecap','round');line.classList.toggle('major',i%5===0);
    $('ruler').append(line);lines.push(line);
  }
  let rulerMin=3,rulerMax=597;
  function alignRulerEnds(){
    const svg=$('ruler').getBoundingClientRect();
    const labels=document.querySelector('.stops').getBoundingClientRect();
    const edge=Math.max(...stops.map(button=>button.getBoundingClientRect().width/2));
    stops.forEach((button,i)=>{
      button.style.left=`${edge+(labels.width-2*edge)*i/segments}px`;
      button.style.top='0';
      button.style.transform='translateX(-50%)';
    });
    const a=stops[0].getBoundingClientRect(),b=stops.at(-1).getBoundingClientRect();
    const left=a.left+a.width/2-svg.left,right=b.left+b.width/2-svg.left;
    rulerMin=left/svg.width*600;rulerMax=right/svg.width*600;
    lines.forEach((line,i)=>{const x=rulerMin+(rulerMax-rulerMin)*i/80;line.setAttribute('x1',x);line.setAttribute('x2',x);});
    range.style.left=left+'px';range.style.right='auto';range.style.width=(right-left)+'px';
  }
  alignRulerEnds();window.addEventListener('resize',alignRulerEnds);
  range.max=String(segments*1000);
  const activeMarker=document.createElementNS('http://www.w3.org/2000/svg','line');
  activeMarker.setAttribute('id','active-marker');activeMarker.setAttribute('y2','80');activeMarker.setAttribute('stroke','#234c93');activeMarker.setAttribute('stroke-width','1.8');activeMarker.setAttribute('stroke-linecap','round');$('ruler').append(activeMarker);
  function ui(){
    range.value=Math.round(value*1000);
    const markerX=rulerMin+(value/segments)*(rulerMax-rulerMin);activeMarker.setAttribute('x1',markerX);activeMarker.setAttribute('x2',markerX);activeMarker.setAttribute('y1',10);
    const i=Math.min(segments-1,Math.floor(value)),t=value-i,nearest=Math.max(0,Math.min(segments,Math.round(value))),atStop=Math.abs(value-nearest)<.002;
    const active=seasons[nearest];
    range.setAttribute('aria-valuetext',atStop?active.year+' '+active.detail:`${seasons[i].year} ke ${seasons[i+1].year}, ${Math.round(t*100)} persen`);
    $('garment').setAttribute('aria-label',`Jersey Chelsea ${atStop?active.year:'dalam transisi'}. Klik untuk musim berikutnya.`);
    stops.forEach((b,j)=>{b.classList.toggle('active',j===nearest);b.setAttribute('aria-pressed',String(atStop&&j===nearest));});
    lines.forEach((l,j)=>{const d=j/80-value/segments,h=Math.exp(-d*d/.025);l.setAttribute('y1',80-9-61*h);l.setAttribute('stroke',j%5===0?'rgba(96,111,132,.32)':`rgba(96,111,132,${.19+.12*h})`);l.setAttribute('stroke-width',j%5===0?'1.8':'1.1');});
  }
  function request(){if(!queued){queued=true;requestAnimationFrame(tick);}}
  function tick(now){
    queued=false;const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
    if(playing){target+=direction*dt/5.5;if(target>=segments){target=segments;direction=-1;}if(target<=0){target=0;direction=1;}value=target;}
    else{value+=(target-value)*(reduced?1:1-Math.exp(-4*dt));if(Math.abs(target-value)<.0001)value=target;}
    render(value);ui();
    if(playing||value!==target)request();else last=0;
  }
  function setPlaying(on){playing=on;play.setAttribute('aria-pressed',String(on));play.setAttribute('aria-label',on?'Jeda transisi':'Putar transisi');$('play-icon').setAttribute('d',on?'M7 6H10V18H7ZM14 6H17V18H14Z':'M9 6L18 12L9 18Z');if(on){direction=value>=segments-.001?-1:1;request();}}
  function move(n,immediate=false){if(!ready)return;setPlaying(false);target=Math.max(0,Math.min(segments,n));if(immediate)value=target;request();}
  range.addEventListener('input',()=>move(Number(range.value)/1000,true));
  function snapToNearestYear(){move(Math.round(Number(range.value)/1000));}
  range.addEventListener('change',snapToNearestYear);
  range.addEventListener('pointerup',()=>requestAnimationFrame(snapToNearestYear));
  range.addEventListener('keyup',e=>{if(e.key.startsWith('Arrow'))snapToNearestYear();});
  stops.forEach((b,i)=>b.addEventListener('click',()=>move(i)));
  play.addEventListener('click',()=>{if(ready){const wasPlaying=playing;setPlaying(!playing);if(wasPlaying)snapToNearestYear();}});
  $('garment').addEventListener('click',()=>move((Math.floor(target+.01)+1)%seasons.length));
  document.addEventListener('keydown',e=>{
    if(!ready||e.ctrlKey||e.altKey||e.metaKey)return;
    if(e.code==='Space'&&(e.target===range||e.target===document.body)){e.preventDefault();setPlaying(!playing);}
    else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(target+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?.005:.05));}
    else if(e.target===range&&(e.key==='Home'||e.key==='End')){e.preventDefault();move(e.key==='Home'?0:segments);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});ui();
  function fail(message){setPlaying(false);ready=false;$('loading').hidden=false;$('loading').textContent=message;$('fallback').hidden=false;canvas.style.opacity=0;[range,play,...stops].forEach(b=>b.disabled=true);}
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true});
  if(!gl){fail('Preview gerak tidak tersedia. Foto jersey tetap dapat dilihat.');return;}

  // Same landmark topology, individual positions for each garment. These landmarks
  // move the neckline and garment boundaries; they do not apply a generic slim-fit.
  const points=seasons.map(()=>[]);
  function add(a,b=a,c=b,d=c){[a,b,c,d,d,d].forEach((p,i)=>points[i].push(p));}
  [[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]].forEach(p=>add(p));
  function symmetric(a,b=a,c=b,d=c){add(a,b,c,d);add([1-a[0],a[1]],[1-b[0],b[1]],[1-c[0],c[1]],[1-d[0],d[1]]);}
  symmetric([.41,.105],[.404,.043],[.386,.031],[.414,.090]); // back neck endpoints
  add([.5,.106],[.5,.051],[.5,.055],[.5,.052]);
  symmetric([.376,.143],[.378,.080],[.357,.058],[.382,.126]); // outside neck/shoulder
  symmetric([.392,.220],[.430,.156],[.398,.135],[.408,.170]); // collar side fronts
  add([.5,.279],[.5,.190],[.5,.170],[.5,.192]); // lower collar centre
  add([.5,.251],[.5,.165],[.5,.149],[.5,.174]); // inner collar
  symmetric([.44,.227],[.452,.160],[.443,.163],[.448,.177]);
  symmetric([.201,.201],[.199,.132],[.203,.119],[.177,.194]); // shoulder/yoke seam
  symmetric([.008,.254],[.015,.328],[.019,.432],[.010,.276]); // outer cuff top
  symmetric([.063,.447],[.151,.460],[.223,.479],[.118,.426]); // cuff inside bottom
  symmetric([.202,.474],[.235,.384],[.225,.452],[.218,.402]); // armpit
  symmetric([.201,.570],[.232,.570],[.231,.570],[.216,.570]);
  symmetric([.198,.720],[.227,.720],[.221,.720],[.214,.720]);
  symmetric([.191,.891],[.214,.941],[.208,.928],[.180,.910]); // hem corners
  add([.5,.899],[.5,.956],[.5,.965],[.5,.960]);
  // Shared neutral chest anchors keep crest and sponsor local, instead of pulling
  // the whole torso towards the relocated adidas mark.
  [[.30,.26],[.50,.26],[.70,.26],[.30,.34],[.50,.34],[.70,.34],
   [.30,.49],[.50,.49],[.70,.49],[.5,.62],[.5,.78],[.5,.88]].forEach(p=>add(p));
  // Later cuts taper slightly through the waist; the 2016 shirt uses a V-neck,
  // while the 2020 shirt returns to a dark crew collar and a more athletic torso.
  points[4].forEach((p,i)=>{
    const factor=p[1]>.28&&p[1]<.88?.94:1;
    points[4][i]=[.5+(p[0]-.5)*factor,p[1]];
  });
  points[5].forEach((p,i)=>{
    const factor=p[1]>.28&&p[1]<.88?.90:1;
    points[5][i]=[.5+(p[0]-.5)*factor,p[1]];
  });
  // V-neck landmarks for 2016/17; all other seasons keep their own neckline.
  points[4][15]=[.5,.248];points[4][16]=[.5,.218];

  // Bowyer-Watson triangulation on averaged landmarks. All three states reuse
  // these triangles, with separate UV coordinates for their own photographs.
  function triangulate(input){
    const p=input.concat([[-10,-10],[10,-10],[0,10]]),n=input.length;
    let triangles=[[n,n+1,n+2]];
    function circle(tri,q){
      const [a,b,c]=tri.map(i=>p[i]),d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));
      if(Math.abs(d)<1e-12)return false;
      const a2=a[0]**2+a[1]**2,b2=b[0]**2+b[1]**2,c2=c[0]**2+c[1]**2;
      const x=(a2*(b[1]-c[1])+b2*(c[1]-a[1])+c2*(a[1]-b[1]))/d;
      const y=(a2*(c[0]-b[0])+b2*(a[0]-c[0])+c2*(b[0]-a[0]))/d;
      return (q[0]-x)**2+(q[1]-y)**2<=(a[0]-x)**2+(a[1]-y)**2+1e-10;
    }
    for(let i=0;i<n;i++){
      const bad=triangles.filter(t=>circle(t,p[i])),edges=new Map();
      bad.forEach(t=>[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]].forEach(e=>{const k=e.slice().sort((a,b)=>a-b).join(':');if(edges.has(k))edges.delete(k);else edges.set(k,e);}));
      triangles=triangles.filter(t=>!bad.includes(t));edges.forEach(e=>triangles.push([e[0],e[1],i]));
    }
    return triangles.filter(t=>t.every(i=>i<n));
  }
  points[0][35]=[.5,.31];
  const mean=points[0].map((p,i)=>points.reduce((sum,set)=>[sum[0]+set[i][0]/points.length,sum[1]+set[i][1]/points.length],[0,0]));
  const triangles=triangulate(mean);
  const vertex=`precision highp float;
    attribute vec2 aFrom,aTo;uniform float uT,uZoom;
    varying vec2 vFrom,vTo;
    void main(){vFrom=aFrom;vTo=aTo;vec2 p=mix(aFrom,aTo,uT);p=(p-.5)*.95+.5;p=(p-vec2(.5,.30))*uZoom+vec2(.5,.30);gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);}`;
  const brandingBoxes=[
    [[.336,.395,.321,.084],[.336,.326,.136,.031],[.550,.278,.108,.104]],
    [[.345,.325,.323,.140],[.320,.245,.107,.037],[.584,.218,.096,.092]],
    [[.330,.355,.326,.140],[.460,.203,.073,.057],[.570,.250,.102,.106]],
    // The 2006/07 and 2011/12 shirts use the same Chelsea badge. Keep its crop
    // registration fixed so the badge does not scale or drift during this morph.
    [[.315,.365,.370,.125],[.325,.260,.115,.075],[.570,.250,.102,.106]]
    ,[[.302,.354,.396,.132],[.329,.258,.100,.058],[.575,.215,.104,.104]]
    ,[[.390,.345,.220,.265],[.315,.260,.104,.050],[.575,.215,.104,.104]]
  ];
  const fragment=`precision highp float;
    uniform sampler2D uFrom,uTo,uOriginalA,uOriginalB,uArtA,uArtB;
    uniform vec4 uBoxA[3],uBoxB[3];uniform float uT;
    varying vec2 vFrom,vTo;
    void main(){
      if(uT<.0001){gl_FragColor=texture2D(uOriginalA,vFrom);return;}
      if(uT>.9999){gl_FragColor=texture2D(uOriginalB,vTo);return;}
      float t=smoothstep(0.,1.,uT);
      vec3 col=mix(texture2D(uFrom,vFrom).rgb,texture2D(uTo,vTo).rgb,t);
      vec2 pos=mix(vFrom,vTo,uT);
      for(int i=0;i<3;i++){
        vec4 box=mix(uBoxA[i],uBoxB[i],uT);
        vec2 q=(pos-box.xy)/box.zw;
        if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){
          vec2 atlas=vec2((float(i)+q.x)/3.,q.y);
          vec4 a=texture2D(uArtA,atlas),b=texture2D(uArtB,atlas);
          float field=mix(a.a,b.a,t)+sin(t*3.14159265)*.075;
          float ink=smoothstep(.489,.511,field);
          col=mix(col,mix(a.rgb,b.rgb,t),ink);
        }
      }
      // Recover original embroidery and print texture smoothly near the stops.
      float start=1.-smoothstep(0.,.07,uT),end=smoothstep(.93,1.,uT);
      col=mix(col,texture2D(uOriginalA,vFrom).rgb,start);
      col=mix(col,texture2D(uOriginalB,vTo).rgb,end);
      gl_FragColor=vec4(col,1.);
    }`;
  function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  try{
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const tLoc=gl.getUniformLocation(program,'uT'),zLoc=gl.getUniformLocation(program,'uZoom');
    const buffers=['aFrom','aTo'].map(name=>({buffer:gl.createBuffer(),location:gl.getAttribLocation(program,name)}));
    gl.uniform1i(gl.getUniformLocation(program,'uFrom'),0);gl.uniform1i(gl.getUniformLocation(program,'uTo'),1);
    const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
    Promise.all(seasons.map(s=>load(s.src))).then(images=>{
      const layers=images.map((image,i)=>window.buildBranding(image,brandingBoxes[i]));
      // The Chelsea badge is the same design in 2006/07 and 2011/12. Reuse
      // one registered crest sprite for that segment instead of blending two
      // independently reconstructed badge interiors into a doubled emblem.
      const crestTile=layers[2].atlas.getContext('2d').getImageData(2*256,0,256,256);
      layers[3].atlas.getContext('2d').putImageData(crestTile,2*256,0);
      const upload=image=>{
        const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);return tex;
      };
      const textures=layers.map(l=>upload(l.clean)),originals=images.map(upload),art=layers.map(l=>upload(l.atlas));
      for(const [name,unit] of [['uOriginalA',2],['uOriginalB',3],['uArtA',4],['uArtB',5]])gl.uniform1i(gl.getUniformLocation(program,name),unit);
      const boxA=gl.getUniformLocation(program,'uBoxA[0]'),boxB=gl.getUniformLocation(program,'uBoxB[0]');
      const data=points.map(set=>new Float32Array(triangles.flatMap(tri=>tri.flatMap(i=>set[i]))));let current=-1;
      const maxSize=Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),gl.getParameter(gl.MAX_TEXTURE_SIZE),3072);
      render=(position)=>{
        const segment=Math.min(seasons.length-2,Math.floor(position)),t=position-segment;
        if(current!==segment){
          buffers.forEach((b,j)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.bufferData(gl.ARRAY_BUFFER,data[segment+j],gl.STATIC_DRAW);gl.enableVertexAttribArray(b.location);gl.vertexAttribPointer(b.location,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0+j);gl.bindTexture(gl.TEXTURE_2D,textures[segment+j]);});
          [originals[segment],originals[segment+1],art[segment],art[segment+1]].forEach((tex,i)=>{gl.activeTexture(gl.TEXTURE2+i);gl.bindTexture(gl.TEXTURE_2D,tex);});
          gl.uniform4fv(boxA,brandingBoxes[segment].flat());gl.uniform4fv(boxB,brandingBoxes[segment+1].flat());current=segment;
        }
        // Zoom is performed by the vertex shader, never by stretching the canvas.
        const size=Math.min(maxSize,Math.ceil(canvas.clientWidth*Math.min(devicePixelRatio,3)));
        if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}
        gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(tLoc,t);gl.uniform1f(zLoc,1.);gl.drawArrays(gl.TRIANGLES,0,triangles.length*3);
      };
      ready=true;$('loading').hidden=true;$('fallback').hidden=true;canvas.style.opacity=1;request();new ResizeObserver(request).observe(canvas);
    }).catch(error=>{console.error(error);fail('Aset gagal dimuat. Muat ulang untuk mencoba lagi.');});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('Preview terhenti. Muat ulang untuk melanjutkan.');});
  }catch(error){console.error(error);fail('Preview gerak tidak tersedia di browser ini.');}
})();
