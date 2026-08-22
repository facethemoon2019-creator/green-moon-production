from pathlib import Path
p=Path('/mnt/data/greenmoon/final_work/index.html')
s=p.read_text(encoding='utf-8')
# Music source fix
s=s.replace('<audio id="gmMagazineAudio" preload="metadata" loop playsinline><source src="/default-music.mp4" type="audio/mp4"></audio>',
            '<audio id="gmMagazineAudio" preload="auto" loop playsinline><source src="/default-music.mp3" type="audio/mpeg"></audio>')
# Scratch CSS: add used state, improve canvas/card
s=s.replace('.revealed .scratchFoil{display:none}.scratchCard:before{content:"GREEN MOON • SURPRISE";position:absolute;inset:12px;border:1px dashed #76561d;border-radius:19px;display:grid;place-items:center;color:#70531c;font-size:19px;font-weight:1000;letter-spacing:2px}.scratchPrize{position:absolute;inset:28px;display:grid;place-items:center;text-align:center;color:#fff;font-weight:1000;font-size:23px;background:linear-gradient(135deg,#1b8655,#3bb071);border-radius:17px;opacity:0;transform:scale(.96);transition:.35s;pointer-events:none;padding:18px}.revealed .scratchPrize{opacity:1;transform:scale(1)}.scratchCanvas{position:absolute;inset:0;width:100%;height:100%;z-index:4;border-radius:22px;touch-action:none}.scratchHint{position:absolute;z-index:5;left:50%;top:50%;transform:translate(-50%,-50%);color:#fff;background:#0007;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:900;pointer-events:none}.revealed .scratchHint{display:none}',
'.revealed .scratchFoil{display:none}.scratchCard:before{content:"GREEN MOON • SURPRISE";position:absolute;inset:12px;border:1px dashed #76561d;border-radius:19px;display:grid;place-items:center;color:#70531c;font-size:19px;font-weight:1000;letter-spacing:2px}.scratchPrize{position:absolute;inset:28px;display:grid;place-items:center;text-align:center;color:#fff;font-weight:1000;font-size:23px;background:linear-gradient(135deg,#1b8655,#3bb071);border-radius:17px;opacity:0;transform:scale(.96);transition:.35s;pointer-events:none;padding:18px;z-index:2}.revealed .scratchPrize{opacity:1;transform:scale(1)}.scratchCard.used .scratchPrize{opacity:0;transform:scale(.96)}.scratchCard.used:after{content:"🎁 تمت إضافة هديتك للفاتورة";position:absolute;inset:28px;z-index:2;display:grid;place-items:center;text-align:center;color:#fff;font-size:18px;font-weight:1000;background:linear-gradient(135deg,#0d5f3d,#1f9360);border-radius:17px;padding:18px}.scratchCanvas{position:absolute;inset:0;width:100%;height:100%;z-index:4;border-radius:22px;touch-action:none;cursor:crosshair}.scratchHint{position:absolute;z-index:5;left:50%;top:50%;transform:translate(-50%,-50%);color:#fff;background:#0007;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:900;pointer-events:none}.revealed .scratchHint{display:none}.scratchCard.used .scratchHint{display:block;background:#0a4b31;color:#fff}')
# Scratch section text and HTML
old='<div class="scratchStage" id="scratchStage"><div class="scratchCard"><div class="scratchPrize">🎉 مبروك!<br><span style="font-size:15px">خصم 100 جنيه على طلبك القادم</span></div><canvas id="scratchCanvas" class="scratchCanvas"></canvas><div class="scratchHint">اسحب بإصبعك للخربشة</div></div></div>'
new='<div class="scratchStage" id="scratchStage"><div class="scratchCard"><div class="scratchPrize">🎉 مبروك!<br><span style="font-size:15px">خصم 100 جنيه على طلبك القادم</span></div><canvas id="scratchCanvas" class="scratchCanvas" aria-label="كارت الخربشة"></canvas><div class="scratchHint">اسحب بإصبعك للخربشة</div></div></div>'
s=s.replace(old,new)
# Render cart: include scratch result even if cart empty? Keep checkout only if cart exists, but show reward line in cart panel.
old=""" if(!cart.length){\n   box.innerHTML='<div class=\"empty\">السلة فاضية 🌿<br>اختار حاجة تعجبك.</div>';\n   tot.innerHTML=\"\"; return;\n }"""
new=""" if(!cart.length){\n   box.innerHTML='<div class=\"empty\">السلة فاضية 🌿<br>اختار حاجة تعجبك.</div>';\n   tot.innerHTML=scratchResultApplied?`<div class=\"total\"><div class=\"line\"><span>🎁 كارت الخربشة</span><b style=\"color:#2f8d5b\">${scratchCfg.prize}</b></div><div style=\"font-size:10px;color:#718078;margin-top:6px\">الجائزة محفوظة وستُضاف تلقائيًا عند إتمام الطلب.</div></div>`:\"\"; return;\n }"""
s=s.replace(old,new)
# Confirm order reward line make it explicit as zero-cost gift
old="const rewardLine=scratchResultApplied?`🎁 هدية/نتيجة كارت الخربشة: ${scratchCfg.prize}${scratchDelta?` (${scratchDelta<0?'خصم ':'إضافة '}${Math.abs(scratchDelta)} ج)`:''}`:'';"
new="const rewardLine=scratchResultApplied?`🎁 هدية كارت الخربشة: ${scratchCfg.prize} — 0 ج${scratchDelta?` | ${scratchDelta<0?'خصم ':'إضافة '}${Math.abs(scratchDelta)} ج`:''}`:'';"
s=s.replace(old,new)
# Replace initScratch block through scratchAudioTick with robust implementation
start=s.index('function initScratch(){')
end=s.index('// Start up safely after all functions exist.')
newblock=r'''function initScratch(){
  const stage=document.getElementById('scratchStage');
  const card=document.querySelector('.scratchCard');
  const canvas=document.getElementById('scratchCanvas');
  const prize=document.querySelector('.scratchPrize');
  if(!stage||!card||!canvas||!prize)return;
  prize.innerHTML=`🎉 مبروك!<br><span style="font-size:15px">${scratchCfg.prize||'هديتك جاهزة 🎁'}</span>`;
  const used=!!scratchResultApplied;
  const hint=document.querySelector('.scratchHint');
  if(used){
    card.classList.remove('revealed');
    card.classList.add('used');
    canvas.style.display='none';
    if(hint){hint.textContent='🎁 تمت إضافة هديتك للفاتورة';hint.style.display='block';}
    return;
  }
  card.classList.remove('revealed','used');
  canvas.style.display='block';
  if(hint){hint.textContent='اسحب بإصبعك للخربشة';hint.style.display='block';}
  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  const rect=card.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  canvas.style.width=w+'px';canvas.style.height=h+'px';
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // Draw the actual scratch foil on the canvas. Erasing this canvas reveals the prize underneath.
  ctx.globalCompositeOperation='source-over';
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#8b8b8b');g.addColorStop(.22,'#eeeeee');g.addColorStop(.45,'#a3a3a3');g.addColorStop(.68,'#f5f5f5');g.addColorStop(1,'#777777');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){
    const x=Math.random()*w,y=Math.random()*h,r=Math.random()*1.6+.3;
    ctx.fillStyle=Math.random()>.5?'rgba(255,255,255,.42)':'rgba(40,40,40,.18)';
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=2;
  for(let x=-h;x<w+h;x+=18){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+h,h);ctx.stroke();}
  ctx.fillStyle='#3d3d3d';ctx.font='900 23px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('خربش هنا',w/2,h/2);
  ctx.globalCompositeOperation='destination-out';
  let drawing=false,lastX=null,lastY=null,erasedSamples=0,revealed=false;
  function pos(e){const r=canvas.getBoundingClientRect();const t=e.touches?.[0]||e;return {x:t.clientX-r.left,y:t.clientY-r.top};}
  function erase(x,y){
    ctx.save();ctx.globalCompositeOperation='destination-out';
    ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.fill();
    if(lastX!==null&&lastY!==null){ctx.lineWidth=50;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(x,y);ctx.stroke();}
    ctx.restore();lastX=x;lastY=y;erasedSamples++;
    if(erasedSamples%10===0)checkReveal();
  }
  function start(e){if(revealed)return;drawing=true;const p=pos(e);lastX=null;lastY=null;erase(p.x,p.y);scratchAudioTick();e.preventDefault?.();}
  function move(e){if(!drawing||revealed)return;const p=pos(e);erase(p.x,p.y);if(erasedSamples%3===0)scratchAudioTick();e.preventDefault?.();}
  function end(){if(!drawing)return;drawing=false;lastX=lastY=null;checkReveal();}
  canvas.onpointerdown=start;canvas.onpointermove=move;canvas.onpointerup=end;canvas.onpointercancel=end;canvas.onpointerleave=()=>{if(drawing)end()};
  canvas.ontouchstart=start;canvas.ontouchmove=move;canvas.ontouchend=end;
  function checkReveal(){
    if(revealed)return;
    try{
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let clear=0,total=data.length/4;
      for(let i=3;i<data.length;i+=4)if(data[i]<25)clear++;
      if(clear/total>=.42){
        revealed=true;
        card.classList.add('revealed');
        canvas.style.display='none';
        if(hint)hint.style.display='none';
        scratchResultApplied=true;
        localStorage.gmScratchAppliedV2='true';
        localStorage.gmScratchRewardV2=JSON.stringify({prize:scratchCfg.prize,invoiceDelta:scratchCfg.invoiceDelta,at:new Date().toISOString()});
        renderCart();
        toast(`🎁 ${scratchCfg.prize} — اتضافت تلقائيًا للفاتورة`);
        // Show the revealed prize briefly, then hide it and lock the card.
        setTimeout(()=>{
          card.classList.remove('revealed');
          card.classList.add('used');
          if(hint){hint.textContent='🎁 تمت إضافة هديتك للفاتورة';hint.style.display='block';}
        },3500);
      }
    }catch(e){console.error('scratch reveal check failed',e);}
  }
}
let scratchAudioCtx=null,scratchNoise=null;
function scratchAudioTick(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    scratchAudioCtx=scratchAudioCtx||new AC();
    if(scratchAudioCtx.state==='suspended')scratchAudioCtx.resume();
    const buffer=scratchAudioCtx.createBuffer(1,scratchAudioCtx.sampleRate*.045,scratchAudioCtx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,1.7);
    const src=scratchAudioCtx.createBufferSource(),gain=scratchAudioCtx.createGain(),filter=scratchAudioCtx.createBiquadFilter();
    filter.type='bandpass';filter.frequency.value=1500;filter.Q.value=.65;gain.gain.value=.035;src.buffer=buffer;src.connect(filter).connect(gain).connect(scratchAudioCtx.destination);src.start();
  }catch(e){}
}

'''
s=s[:start]+newblock+s[end:]
# Music script: default URL and don't block on empty url; set src correctly
s=s.replace('enabled:true, url:"", volume:.35, autoplay:true, loop:true', 'enabled:true, url:"/default-music.mp3", volume:.35, autoplay:false, loop:true')
s=s.replace('    if(!cfg.enabled||!cfg.url)return;\n    try{\n      await audio.play();', '    if(!cfg.enabled)return;\n    try{\n      if(cfg.url && audio.src!==new URL(cfg.url,location.href).href) audio.src=cfg.url;\n      await audio.play();')
# render should set default if no url
s=s.replace('    if(cfg.url) audio.src=cfg.url;', '    if(cfg.url) audio.src=cfg.url;\n    else audio.src="/default-music.mp3";')
# autoplay only after explicit click; don't show fallback immediately
s=s.replace('  if(cfg.autoplay) setTimeout(play,250);', '  if(cfg.autoplay) setTimeout(play,250);')
p.write_text(s,encoding='utf-8')
