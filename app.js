(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('jersey'), range = $('progress'), play = $('play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let value = 0, target = 0, playing = false, direction = 1, previous = 0;
  let render = () => {}, framePending = false, ready = false;
  const lines = [];
  for (let i=0;i<=80;i++) {
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',String(3+i*7.425));line.setAttribute('x2',String(3+i*7.425));line.setAttribute('y2','80');line.setAttribute('stroke-width','1');
    $('ruler').append(line);lines.push(line);
  }
  function updateUI() {
    const pct = Math.round(value*100);
    range.value = String(Math.round(value*1000));
    range.setAttribute('aria-valuetext',`${pct}% — ${pct<35?'kerah bulat':pct>65?'kerah V':'bentuk peralihan'}`);
    $('percent').textContent = `${pct}%`;
    $('state-title').textContent = pct<15?'Kerah bulat':pct>85?'Kerah V':'Bentuk dalam transisi';
    $('state-detail').textContent = pct<15?'Potongan klasik':pct>85?'Potongan ramping':`${pct}% menuju Studi B`;
    $('start').classList.toggle('active',pct<50);$('end').classList.toggle('active',pct>=50);
    $('start').setAttribute('aria-pressed',String(pct===0));$('end').setAttribute('aria-pressed',String(pct===100));
    lines.forEach((line,i)=>{
      const d=i/80-value, emphasis=Math.exp(-d*d/0.045);
      line.setAttribute('y1',String(80-(9+61*emphasis)));
      line.setAttribute('stroke',Math.abs(d)<0.0064?'#224b91':`rgba(96,111,132,${0.14+0.28*emphasis})`);
      line.setAttribute('stroke-width',Math.abs(d)<0.0064?'1.7':'1');
    });
  }
  function requestFrame(){if(!framePending){framePending=true;requestAnimationFrame(tick);}}
  function tick(time){
    framePending=false;
    const dt=previous?Math.min((time-previous)/1000,0.05):1/60;previous=time;
    if(playing){target+=direction*dt/4.5;if(target>=1){target=1;direction=-1;}if(target<=0){target=0;direction=1;}value=target;}
    else {value += (target-value)*(reduced?1:1-Math.exp(-dt*12));if(Math.abs(target-value)<0.0001)value=target;}
    render(value);updateUI();
    if(playing||value!==target)requestFrame();else previous=0;
  }
  function setPlaying(next){playing=next;play.setAttribute('aria-pressed',String(next));play.setAttribute('aria-label',next?'Jeda transisi':'Putar transisi');$('play-icon').setAttribute('d',next?'M7 6H10V18H7ZM14 6H17V18H14Z':'M9 6L18 12L9 18Z');if(next){direction=value>=.999?-1:1;requestFrame();}}
  function move(next,immediate=false){if(!ready)return;setPlaying(false);target=Math.max(0,Math.min(1,next));if(immediate)value=target;requestFrame();}
  range.addEventListener('input',()=>move(Number(range.value)/1000,true));
  $('start').addEventListener('click',()=>move(0));$('end').addEventListener('click',()=>move(1));
  play.addEventListener('click',()=>{if(ready)setPlaying(!playing);});
  $('garment').addEventListener('click',()=>move(target<.5?1:0));
  document.addEventListener('keydown',e=>{
    if(!ready||e.altKey||e.metaKey||e.ctrlKey)return;
    if(e.code==='Space' && (e.target===range||e.target===document.body)){e.preventDefault();setPlaying(!playing);}
    else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(target+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?.005:.05));}
    else if((e.key==='Home'||e.key==='End') && e.target===range){e.preventDefault();move(e.key==='Home'?0:1);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});
  updateUI();
  function fail(message){$('loading').textContent=message;canvas.style.opacity='0';$('fallback').hidden=false;range.disabled=true;play.disabled=true;$('start').disabled=true;$('end').disabled=true;ready=false;}
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  if(!gl){fail('Browser ini belum mendukung preview gerak.');return;}
  const vertex=`
    precision highp float;
    attribute vec2 aUV;
    uniform float uMorph;
    varying vec2 vUV;
    void main(){
      vUV=aUV;vec2 p=aUV;float t=uMorph;
      float c=.5;float dx=p.x-c;float ax=abs(dx);
      // The same cloth vertices move; texture coordinates never switch images.
      float r=.128;
      float n=clamp(ax/r,0.0,1.0);
      float roundEdge=.062+.100*sqrt(max(0.0,1.0-n*n));
      float veeEdge=.062+.190*(1.0-n);
      float neckFalloff=exp(-pow((p.y-roundEdge)/.066,2.0));
      float neckMask=1.0-smoothstep(.122,.149,ax);
      p.y+=(veeEdge-roundEdge)*neckFalloff*neckMask*t;
      // Tailored waist and a shorter hem, away from the chest crest.
      float waist=smoothstep(.42,.80,aUV.y);
      p.x-=dx*.135*waist*t;
      p.y-=.025*smoothstep(.70,.95,aUV.y)*t;
      // Sleeve endpoints travel inward and up, shoulders stay anchored.
      float sleeve=smoothstep(.245,.44,ax)*(1.0-smoothstep(.43,.53,aUV.y));
      p.x-=sign(dx)*.034*sleeve*t;
      p.y-=.026*sleeve*t;
      // Slightly restrained composition keeps every endpoint inside the stage.
      p=(p-.5)*.96+.5;
      gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
    }`;
  const fragment=`precision mediump float;uniform sampler2D uImage;varying vec2 vUV;void main(){vec4 cloth=texture2D(uImage,vUV);if(cloth.a<.025)discard;gl_FragColor=cloth;}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  try{
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const N=160,uv=[],indices=[];
    for(let y=0;y<=N;y++)for(let x=0;x<=N;x++)uv.push(x/N,y/N);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=y*(N+1)+x,b=a+1,c=a+N+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,'aUV');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program,'uImage'),0);const morphLoc=gl.getUniformLocation(program,'uMorph');
    const img=new Image();img.onload=()=>{
      gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      render=(amount)=>{const size=Math.round(canvas.clientWidth*Math.min(devicePixelRatio,2));if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(morphLoc,amount);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);};
      ready=true;$('loading').hidden=true;$('fallback').hidden=true;canvas.style.opacity='1';requestFrame();new ResizeObserver(requestFrame).observe(canvas);
    };img.onerror=()=>fail('Aset jersey gagal dimuat. Muat ulang halaman untuk mencoba lagi.');img.src=$('fallback').src;
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPlaying(false);fail('Preview terhenti. Muat ulang halaman untuk melanjutkan.');});
  }catch(error){console.error(error);fail('Preview gerak tidak tersedia di browser ini.');}
})();
