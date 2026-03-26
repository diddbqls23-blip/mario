// ═══════════════════════════════════════════════════════════════
//  Draw helpers
// ═══════════════════════════════════════════════════════════════
function lpx(x){ return Math.round(x-camX); }
function lpy(y){ return Math.round(y); }

const RAINBOW=['#ff4444','#ff9900','#ffee00','#44ff44','#4488ff','#cc44ff'];

// ── Stage palette / theme ────────────────────────────────────────
const THEMES = {
  plains: {
    skyTop:'#5c94fc', skyBot:'#9bbcff',
    hillFar:'#5aad3a', hillNear:'#4a9a2a',
    cloudColor:'rgba(255,255,255,0.9)',
    groundTop:'#70b050', groundFill:['#c88840','#a06828'],
  },
  desert: {
    skyTop:'#f4c56a', skyBot:'#f8e090',
    hillFar:'#d4a040', hillNear:'#c08030',
    cloudColor:'rgba(255,245,220,0.7)',
    groundTop:'#c8a030', groundFill:['#b07820','#8a5810'],
  },
  castle: {
    skyTop:'#1a1a3a', skyBot:'#2a2050',
    hillFar:'#3a2a5a', hillNear:'#2a1a4a',
    cloudColor:'rgba(150,120,200,0.5)',
    groundTop:'#555577', groundFill:['#444466','#333355'],
  },
  dungeon: {
    skyTop:'#080612', skyBot:'#130d20',
    hillFar:'#1a1228', hillNear:'#120a1e',
    cloudColor:'rgba(80,60,120,0.2)',
    groundTop:'#4a4060', groundFill:['#2e2848','#1e1830'],
  },
  volcano: {
    skyTop:'#1a0300', skyBot:'#4a0e00',
    hillFar:'#8a1500', hillNear:'#6a1000',
    cloudColor:'rgba(255,80,10,0.25)',
    groundTop:'#cc2200', groundFill:['#881000','#550800'],
  },
  space: {
    skyTop:'#000008', skyBot:'#00051a',
    hillFar:'#001440', hillNear:'#000e28',
    cloudColor:'rgba(80,120,255,0.15)',
    groundTop:'#2255aa', groundFill:['#112266','#080e33'],
  },
};

const C={
  brick:'#c88050', brickD:'#a05828',
  qb:'#e8c040', qbHit:'#c8a030', qbMark:'#e05030',
  pg:'#50b840', pgD:'#308830', pgL:'#60c850',
};
const CC=['#ffd700','#ffe44d','#ffee88','#ffe44d'];

// ── Background ───────────────────────────────────────────────────
function drawBG(){
  const theme = THEMES[currentStage().bg] || THEMES.plains;
  const bg = currentStage().bg;
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,theme.skyTop); g.addColorStop(1,theme.skyBot);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  if(bg==='castle'){
    drawCastleStars();
  } else if(bg==='desert'){
    drawDesertSun();
  } else if(bg==='dungeon'){
    drawDungeonDecor();
    return;
  } else if(bg==='volcano'){
    drawVolcanoBG();
    return;
  } else if(bg==='space'){
    drawSpaceBG();
    return;
  }

  ctx.fillStyle=theme.hillFar;   drawHills(0.3,120,80,40);
  ctx.fillStyle=theme.hillNear;  drawHills(0.5,60,50,20);
  ctx.fillStyle=theme.cloudColor;
  [0,400,900,1500,2100,2800,3400,4000,4600,5200,5800,6400].forEach(cx=>{
    drawCloud(((cx-camX*0.4)%(LEVEL_W+200))-100, 60+Math.sin(cx*.01)*20, 70+Math.cos(cx*.007)*20);
    drawCloud(((cx+200-camX*0.25)%(LEVEL_W+200))-50, 110+Math.cos(cx*.009)*15, 50);
  });
}

function drawCastleStars(){
  ctx.fillStyle='rgba(255,255,200,0.8)';
  const seed=1234;
  for(let i=0;i<60;i++){
    const sx=((i*347+seed)%W);
    const sy=((i*213+seed)%(H*0.65));
    const tw=Date.now()*0.001+i;
    const alpha=0.3+0.7*Math.abs(Math.sin(tw));
    ctx.globalAlpha=alpha;
    ctx.fillRect(sx,sy,2,2);
  }
  ctx.globalAlpha=1;
}

function drawDungeonDecor(){
  ctx.fillStyle='rgba(40,30,60,0.45)';
  for(let y=50;y<H-50;y+=38+Math.sin(y*.31)*8){
    ctx.fillRect(0,Math.round(y),W,2);
  }
  ctx.fillStyle='#111020';
  for(let i=0;i<18;i++){
    const wx=150+i*420;
    const sx=Math.round(wx-camX);
    if(sx<-60||sx>W+60) continue;
    const sh=18+(i*83%28);
    const sw=7+(i*41%7);
    ctx.beginPath();
    ctx.moveTo(sx-sw,0); ctx.lineTo(sx+sw,0); ctx.lineTo(sx,sh);
    ctx.closePath(); ctx.fill();
  }
  const t=Date.now()*.004;
  for(let wx=280;wx<LEVEL_W;wx+=580){
    const sx=Math.round(wx-camX);
    if(sx<-90||sx>W+90) continue;
    const ty=95;
    ctx.fillStyle='#6a6a80';
    ctx.fillRect(sx-3,ty-14,6,18);
    ctx.fillRect(sx-8,ty,16,6);
    ctx.fillStyle='#8b4513';
    ctx.fillRect(sx-2,ty,5,10);
    const flicker=.78+Math.sin(t*3.8+wx*.008)*.14+Math.sin(t*6.3+wx)*.06;
    const glowR=52*flicker;
    const grd=ctx.createRadialGradient(sx,ty-4,3,sx,ty-8,glowR);
    grd.addColorStop(0,`rgba(255,155,30,${.42*flicker})`);
    grd.addColorStop(.5,`rgba(255,70,10,${.15*flicker})`);
    grd.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=grd;
    ctx.beginPath(); ctx.arc(sx,ty-4,glowR,0,Math.PI*2); ctx.fill();
    const fh=21*flicker, fw=9*flicker;
    ctx.fillStyle=`rgba(255,195,35,0.95)`;
    ctx.beginPath();
    ctx.moveTo(sx,ty-fh);
    ctx.quadraticCurveTo(sx-fw,ty-fh*.45,sx,ty);
    ctx.quadraticCurveTo(sx+fw,ty-fh*.45,sx,ty-fh);
    ctx.fill();
    ctx.fillStyle='rgba(255,255,190,0.9)';
    const ch=fh*.6, cw=fw*.38;
    ctx.beginPath();
    ctx.moveTo(sx,ty-ch);
    ctx.quadraticCurveTo(sx-cw,ty-ch*.45,sx,ty);
    ctx.quadraticCurveTo(sx+cw,ty-ch*.45,sx,ty-ch);
    ctx.fill();
  }
}

function drawVolcanoBG(){
  const t=Date.now()*0.001;
  // 화산 산 (먼 배경)
  ctx.fillStyle='#5a0800';
  const cnt=Math.ceil(W/180)+4, off=(camX*0.2)%(180*2);
  for(let i=0;i<cnt;i++){
    const hx=i*180-off, hh=120+Math.abs(Math.sin(i*1.7))*80;
    ctx.beginPath(); ctx.moveTo(hx-hh*0.7,H); ctx.lineTo(hx,H-hh); ctx.lineTo(hx+hh*0.7,H); ctx.fill();
    // 분화구 글로우
    const grd=ctx.createRadialGradient(hx,H-hh,0,hx,H-hh,40);
    grd.addColorStop(0,'rgba(255,80,0,0.4)');
    grd.addColorStop(1,'rgba(255,20,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(hx,H-hh,40,0,Math.PI*2); ctx.fill();
  }
  // 용암 바닥 (맥동)
  const lavaH=28+Math.sin(t*2)*4;
  const lavGrd=ctx.createLinearGradient(0,H-lavaH,0,H);
  lavGrd.addColorStop(0,'#ff6600');
  lavGrd.addColorStop(0.4,'#ff2200');
  lavGrd.addColorStop(1,'#880000');
  ctx.fillStyle=lavGrd; ctx.fillRect(0,H-lavaH,W,lavaH);
  // 용암 표면 물결
  ctx.fillStyle='rgba(255,160,0,0.6)';
  for(let x=0;x<W;x+=60){
    const wave=Math.sin(t*3+x*0.05)*5;
    ctx.beginPath(); ctx.arc(x+30,H-lavaH+wave,18,Math.PI,0); ctx.fill();
  }
  // 불씨 파티클 (배경용)
  ctx.fillStyle='rgba(255,120,0,0.7)';
  for(let i=0;i<14;i++){
    const ex=((i*300+t*40*(i%3===0?1:-1))%(W+100))-50;
    const ey=H-lavaH-20-(Math.sin(t*2+i)*60+60)*(i%2===0?1:0.5);
    const er=2+Math.sin(t*5+i)*1.5;
    ctx.beginPath(); ctx.arc(ex,ey,er,0,Math.PI*2); ctx.fill();
  }
}

function drawSpaceBG(){
  const t=Date.now()*0.001;
  // 별 (3레이어 시차)
  for(let i=0;i<120;i++){
    const layer = i%3;
    const par   = layer===0?0.1:layer===1?0.25:0.5;
    const bsx   = ((i*367+100 - camX*par) % (W+100) + W+100) % (W+100);
    const bsy   = (i*241+50) % Math.round(H*0.85);
    const alpha = 0.3+0.7*Math.abs(Math.sin(t*0.7+i*0.4));
    const size  = i%7===0?2.5:i%3===0?1.5:1;
    const color = i%9===0?'#aaddff':i%7===0?'#ffeecc':'#ffffff';
    ctx.globalAlpha=alpha;
    ctx.fillStyle=color;
    if(size>1.5){ ctx.beginPath(); ctx.arc(bsx,bsy,size*0.6,0,Math.PI*2); ctx.fill(); }
    else ctx.fillRect(bsx,bsy,size,size);
  }
  ctx.globalAlpha=1;

  // 행성 (시차 배경)
  const px=((W*0.78 - camX*0.04) % (LEVEL_W+200) + 200) % (W+200);
  const py=75;
  const pGrd=ctx.createRadialGradient(px-15,py-15,5,px,py,52);
  pGrd.addColorStop(0,'rgba(80,160,255,0.85)');
  pGrd.addColorStop(0.55,'rgba(40,80,180,0.65)');
  pGrd.addColorStop(1,'rgba(10,20,80,0)');
  ctx.fillStyle=pGrd; ctx.beginPath(); ctx.arc(px,py,52,0,Math.PI*2); ctx.fill();
  // 행성 표면 무늬
  ctx.fillStyle='rgba(100,180,255,0.25)';
  ctx.beginPath(); ctx.ellipse(px-8,py-5,28,8,0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(px+6,py+12,20,5,0.2,0,Math.PI*2); ctx.fill();
  // 고리
  ctx.strokeStyle='rgba(150,200,255,0.4)';
  ctx.lineWidth=5;
  ctx.beginPath(); ctx.ellipse(px,py,85,17,Math.PI*0.22,0,Math.PI*2); ctx.stroke();
  ctx.lineWidth=1;

  // 작은 행성 2
  const px2=((W*0.2 - camX*0.06) % (LEVEL_W+300) + 300) % (W+200);
  const py2=140;
  const pGrd2=ctx.createRadialGradient(px2-6,py2-6,2,px2,py2,24);
  pGrd2.addColorStop(0,'rgba(255,160,80,0.8)');
  pGrd2.addColorStop(0.6,'rgba(200,80,30,0.55)');
  pGrd2.addColorStop(1,'rgba(100,20,0,0)');
  ctx.fillStyle=pGrd2; ctx.beginPath(); ctx.arc(px2,py2,24,0,Math.PI*2); ctx.fill();

  // 성운 글로우
  const nGrd=ctx.createRadialGradient(W*0.35,H*0.28,20,W*0.35,H*0.28,180);
  nGrd.addColorStop(0,'rgba(80,0,140,0.18)');
  nGrd.addColorStop(1,'rgba(0,20,80,0)');
  ctx.fillStyle=nGrd; ctx.fillRect(0,0,W,H);
  const nGrd2=ctx.createRadialGradient(W*0.7,H*0.5,10,W*0.7,H*0.5,140);
  nGrd2.addColorStop(0,'rgba(0,80,160,0.12)');
  nGrd2.addColorStop(1,'rgba(0,0,80,0)');
  ctx.fillStyle=nGrd2; ctx.fillRect(0,0,W,H);

  // 우주 지면 금속 패널 질감
  ctx.fillStyle='rgba(80,140,255,0.08)';
  for(let y=GND_Y-TILE;y<H;y+=8){ ctx.fillRect(0,y,W,2); }
  ctx.strokeStyle='rgba(80,160,255,0.18)'; ctx.lineWidth=1;
  for(let x=((-(camX*0.2))%(80))+0;x<W;x+=80){
    ctx.beginPath(); ctx.moveTo(x,GND_Y-TILE); ctx.lineTo(x,H); ctx.stroke();
  }
  ctx.lineWidth=1;
}

function drawDesertSun(){
  const sx=W-80, sy=60;
  const grd=ctx.createRadialGradient(sx,sy,20,sx,sy,80);
  grd.addColorStop(0,'rgba(255,220,80,0.7)');
  grd.addColorStop(1,'rgba(255,180,0,0)');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx,sy,80,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffe040';
  ctx.beginPath(); ctx.arc(sx,sy,30,0,Math.PI*2); ctx.fill();
}

function drawHills(par,sp,mH,mh){
  const cnt=Math.ceil(W/sp)+4, off=(camX*par)%(sp*2);
  for(let i=0;i<cnt;i++){
    const hx=i*sp-off, hh=mh+Math.abs(Math.sin(i*2.3))*mH;
    ctx.beginPath(); ctx.arc(hx,H,hh,Math.PI,0); ctx.fill();
  }
}
function drawCloud(x,y,s){
  [0,-s*.3,s*.3].forEach((ox,i)=>{
    ctx.beginPath(); ctx.arc(x+ox,y,s*(i===0?.5:.38),0,Math.PI*2); ctx.fill();
  });
}

// ── Platforms ────────────────────────────────────────────────────
function drawPlatforms(){
  const theme = THEMES[currentStage().bg] || THEMES.plains;
  const bg = currentStage().bg;
  platforms.forEach(pl=>{
    const sx=lpx(pl.x), sy=lpy(pl.y), pw=pl.w, ph=pl.h||TILE;
    if(sx+pw<0||sx>W) return;
    if(pl.type==='ground'){
      ctx.fillStyle=theme.groundTop; ctx.fillRect(sx,sy,pw,8);
      ctx.fillStyle=theme.groundFill[0]; ctx.fillRect(sx,sy+8,pw,H-sy-8+20);
      // 용암 스테이지: 지면 위에 열기 글로우
      if(bg==='volcano'){
        const grd=ctx.createLinearGradient(0,sy,0,sy+20);
        grd.addColorStop(0,'rgba(255,80,0,0.25)');
        grd.addColorStop(1,'rgba(255,0,0,0)');
        ctx.fillStyle=grd; ctx.fillRect(sx,sy,pw,20);
      }
    } else if(pl.type==='brick'){
      if(pl.hit){ctx.fillStyle='#c0b080';ctx.fillRect(sx,sy,pw,ph);return;}
      const bc = bg==='castle'?'#888':bg==='dungeon'?'#4a4070':bg==='volcano'?'#882020':bg==='space'?'#2244aa':C.brick;
      const bd = bg==='castle'?'#555':bg==='dungeon'?'#2a2050':bg==='volcano'?'#551010':bg==='space'?'#112266':C.brickD;
      ctx.fillStyle=bc; ctx.fillRect(sx,sy,pw,ph);
      ctx.fillStyle=bd;
      for(let r=0;r<ph;r+=16) ctx.fillRect(sx,sy+r,pw,1);
      for(let r=0;r<ph;r+=16){const o=(Math.floor(r/16)%2)*TILE/2;for(let c2=o;c2<pw;c2+=TILE)ctx.fillRect(sx+c2,sy+r,1,16);}
    } else if(pl.type==='qblock'){
      const qb=qblocks.find(q=>q.x===pl.x&&q.y===pl.y);
      const hit=qb&&qb.hit, by=sy+(qb?qb.bounceY:0);
      const reward=qb&&qb.reward;
      const isGiantMushroom=reward==='giant_mushroom';
      const isStar=reward==='star';
      const isFire=reward==='fire';
      const isLightning=reward==='lightning';
      const isInvisible=reward==='invisible';
      const isBlackhole=reward==='blackhole';
      let qColor=C.qb, qBorder='#a08020', qLabel='?';
      if(hit){qColor=C.qbHit; qBorder='#907020';}
      else if(isGiantMushroom){qColor='#cc6600'; qBorder='#884400'; qLabel='👑';}
      else if(isStar){qColor='#c060e0'; qBorder='#8030a0'; qLabel='★';}
      else if(isFire){qColor='#cc3300'; qBorder='#882200'; qLabel='🔥';}
      else if(isLightning){qColor='#ccaa00'; qBorder='#886600'; qLabel='⚡';}
      else if(isInvisible){qColor='#2266cc'; qBorder='#114488'; qLabel='👻';}
      else if(isBlackhole){qColor='#440088'; qBorder='#220044'; qLabel='🌀';}
      ctx.fillStyle=qColor;
      ctx.fillRect(sx,by,pw,ph);
      ctx.fillStyle=qBorder;
      ctx.fillRect(sx,by,pw,2); ctx.fillRect(sx,by+ph-2,pw,2);
      ctx.fillRect(sx,by,2,ph); ctx.fillRect(sx+pw-2,by,2,ph);
      if(!hit){
        ctx.fillStyle=isGiantMushroom?'#ffd700':isFire?'#ffaa44':isLightning?'#ffee00':isInvisible?'#aaccff':isBlackhole?'#cc88ff':C.qbMark;
        ctx.font='bold 16px Arial';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(qLabel,sx+pw/2,by+ph/2+1);
      }
    } else if(pl.type==='pipe_top'){
      const pg  = bg==='castle'?'#9944aa':bg==='dungeon'?'#555577':bg==='volcano'?'#882200':bg==='space'?'#1144aa':C.pg;
      const pgL = bg==='castle'?'#bb66cc':bg==='dungeon'?'#7777aa':bg==='volcano'?'#cc4422':bg==='space'?'#2266cc':C.pgL;
      const pgD = bg==='castle'?'#661188':bg==='dungeon'?'#333355':bg==='volcano'?'#551100':bg==='space'?'#002288':C.pgD;
      ctx.fillStyle=pgL; ctx.fillRect(sx-4,sy,pw+8,12);
      ctx.fillStyle=pgD; ctx.fillRect(sx-4,sy,2,12); ctx.fillRect(sx+pw+6,sy,2,12);
      ctx.fillStyle=pg;  ctx.fillRect(sx,sy+12,pw,ph-12);
      ctx.fillStyle=pgL; ctx.fillRect(sx,sy+12,8,ph-12);
      ctx.fillStyle=pgD; ctx.fillRect(sx+pw-4,sy+12,4,ph-12);
    } else if(pl.type==='pipe_body'){
      const pg  = bg==='castle'?'#9944aa':bg==='dungeon'?'#555577':bg==='volcano'?'#882200':bg==='space'?'#1144aa':C.pg;
      const pgL = bg==='castle'?'#bb66cc':bg==='dungeon'?'#7777aa':bg==='volcano'?'#cc4422':bg==='space'?'#2266cc':C.pgL;
      const pgD = bg==='castle'?'#661188':bg==='dungeon'?'#333355':bg==='volcano'?'#551100':bg==='space'?'#002288':C.pgD;
      ctx.fillStyle=pg;  ctx.fillRect(sx,sy,pw,ph);
      ctx.fillStyle=pgL; ctx.fillRect(sx,sy,8,ph);
      ctx.fillStyle=pgD; ctx.fillRect(sx+pw-4,sy,4,ph);
    }
  });
}

// ── Coins ────────────────────────────────────────────────────────
function drawCoins(){
  coins.forEach(c=>{
    if(!c.alive) return;
    const sx=lpx(c.x), sy=lpy(c.y);
    if(sx<-20||sx>W+20) return;
    const narrow=c.frame===1||c.frame===3;
    // 코인 글로우
    const grd=ctx.createRadialGradient(sx,sy,0,sx,sy,12);
    grd.addColorStop(0,'rgba(255,220,0,0.35)');
    grd.addColorStop(1,'rgba(255,180,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx,sy,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=CC[c.frame];
    ctx.beginPath(); ctx.ellipse(sx,sy,narrow?2.5:7,8,0,0,Math.PI*2); ctx.fill();
    if(!narrow){
      ctx.fillStyle='rgba(255,255,200,.6)';
      ctx.beginPath(); ctx.ellipse(sx-2,sy-2,3,5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#b8860b'; ctx.font='bold 9px Arial';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('★',sx,sy+.5);
    }
  });
}

// ── Power-ups ─────────────────────────────────────────────────────
function drawPowerups(){
  powerups.forEach(pw=>{
    if(!pw.alive&&!pw.emerging) return;
    const sx=lpx(pw.x+pw.w/2), sy=lpy(pw.y+pw.h/2);
    if(sx<-40||sx>W+40) return;
    if(pw.type==='mushroom'){
      ctx.fillStyle='#e03020';
      ctx.beginPath(); ctx.arc(sx,sy,14,Math.PI,0); ctx.fill();
      ctx.fillStyle='#fff';
      [[0,-10,5],[-8,-5,4],[8,-5,4]].forEach(([dx,dy,r])=>{
        ctx.beginPath(); ctx.arc(sx+dx,sy+dy,r,0,Math.PI*2); ctx.fill();
      });
      ctx.fillStyle='#f8e0b0'; ctx.fillRect(sx-10,sy,20,14);
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.arc(sx-4,sy+4,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+4,sy+4,3,0,Math.PI*2); ctx.fill();
    } else if(pw.type==='star'){
      const spin=Date.now()*0.004;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(spin);
      const grd=ctx.createRadialGradient(0,0,5,0,0,18);
      grd.addColorStop(0,'rgba(255,255,100,.8)');
      grd.addColorStop(1,'rgba(255,200,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffe033';
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const a=i*4*Math.PI/5-Math.PI/2;
        const ia=a+2*Math.PI/5;
        i===0?ctx.moveTo(Math.cos(a)*13,Math.sin(a)*13):ctx.lineTo(Math.cos(a)*13,Math.sin(a)*13);
        ctx.lineTo(Math.cos(ia)*5,Math.sin(ia)*5);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#ffaa00'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    } else if(pw.type==='giant_mushroom'){
      ctx.save();
      const pulse=1.0+Math.sin(Date.now()*0.005)*0.08;
      ctx.translate(sx, sy); ctx.scale(pulse, pulse);
      const glow=ctx.createRadialGradient(0,-4,4,0,-4,26);
      glow.addColorStop(0,'rgba(255,200,0,0.5)');
      glow.addColorStop(1,'rgba(255,140,0,0)');
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(0,-4,26,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffd700';
      ctx.beginPath();
      ctx.moveTo(-14,-14); ctx.lineTo(-10,-23); ctx.lineTo(-5,-17);
      ctx.lineTo(0,-25); ctx.lineTo(5,-17); ctx.lineTo(10,-23); ctx.lineTo(14,-14);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#cc8800'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#ff4444'; ctx.beginPath(); ctx.arc(0,-21,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4444ff'; ctx.beginPath(); ctx.arc(-9,-19,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(9,-19,2,0,Math.PI*2); ctx.fill();
      const capGrd=ctx.createRadialGradient(-4,-10,2,0,-4,17);
      capGrd.addColorStop(0,'#ffe050'); capGrd.addColorStop(0.5,'#ff9900'); capGrd.addColorStop(1,'#cc5500');
      ctx.fillStyle=capGrd;
      ctx.beginPath(); ctx.arc(0,-2,16,Math.PI,0); ctx.fill();
      ctx.fillStyle='rgba(255,255,220,0.9)';
      [[0,-13,5.5],[-9,-8,4.5],[9,-8,4.5]].forEach(([dx,dy,r])=>{
        ctx.beginPath(); ctx.arc(dx,dy,r,0,Math.PI*2); ctx.fill();
      });
      ctx.fillStyle='#ffe0a0'; ctx.fillRect(-11,0,22,14);
      ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(-11,0,22,2);
      ctx.fillStyle='#4a2800';
      ctx.beginPath(); ctx.arc(-5,6,3.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5,6,3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.fillRect(-6,4,2,2); ctx.fillRect(4,4,2,2);
      ctx.restore();
    } else if(pw.type==='fire'){
      // 불꽃 꽃 아이템
      ctx.save();
      const t=Date.now()*0.005;
      ctx.translate(sx,sy);
      const pulse=1+Math.sin(t)*0.1;
      ctx.scale(pulse,pulse);
      // 글로우
      const grd=ctx.createRadialGradient(0,0,3,0,0,20);
      grd.addColorStop(0,'rgba(255,100,0,0.7)');
      grd.addColorStop(1,'rgba(255,30,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
      // 꽃잎 4장
      for(let i=0;i<4;i++){
        ctx.save(); ctx.rotate(i*Math.PI/2+t*0.5);
        ctx.fillStyle=i%2===0?'#ff4400':'#ff8800';
        ctx.beginPath(); ctx.ellipse(0,-10,5,8,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // 중심
      ctx.fillStyle='#ffee00';
      ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff8800';
      ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else if(pw.type==='lightning'){
      // 번개 아이템
      ctx.save();
      const t=Date.now()*0.006;
      ctx.translate(sx,sy);
      const flash=0.7+Math.sin(t*4)*0.3;
      // 글로우
      const grd=ctx.createRadialGradient(0,0,3,0,0,22);
      grd.addColorStop(0,`rgba(255,255,0,${0.6*flash})`);
      grd.addColorStop(1,'rgba(255,200,0,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
      // 번개 볼트 모양
      ctx.fillStyle=`rgba(255,230,0,${flash})`;
      ctx.beginPath();
      ctx.moveTo(4,-14); ctx.lineTo(-2,-2); ctx.lineTo(3,-2);
      ctx.lineTo(-4,14); ctx.lineTo(2,2); ctx.lineTo(-3,2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle=`rgba(255,255,200,${flash*0.8})`;
      ctx.lineWidth=1; ctx.stroke();
      ctx.restore();
    } else if(pw.type==='invisible'){
      // 투명화 아이템 (유령 모양)
      ctx.save();
      const t=Date.now()*0.003;
      ctx.translate(sx,sy);
      const float=Math.sin(t)*3;
      ctx.translate(0,float);
      const alpha=0.5+Math.sin(t*2)*0.3;
      // 글로우
      const grd=ctx.createRadialGradient(0,0,3,0,0,20);
      grd.addColorStop(0,`rgba(150,200,255,${alpha*0.6})`);
      grd.addColorStop(1,'rgba(100,150,255,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
      // 유령 몸체
      ctx.globalAlpha=alpha;
      ctx.fillStyle='rgba(200,220,255,0.9)';
      ctx.beginPath();
      ctx.arc(0,-4,12,Math.PI,0);
      ctx.lineTo(12,8);
      for(let i=2;i>=0;i--){
        const wx=-12+i*12, wy=8;
        ctx.quadraticCurveTo(wx+4,wy+8, wx+6,wy);
      }
      ctx.closePath(); ctx.fill();
      // 눈
      ctx.fillStyle='rgba(50,80,180,0.9)';
      ctx.beginPath(); ctx.arc(-4,-4,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(4,-4,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      ctx.restore();
    } else if(pw.type==='blackhole'){
      ctx.save();
      ctx.translate(sx,sy);
      const t=Date.now()*0.003;
      // 블랙홀 중심
      const cg=ctx.createRadialGradient(0,0,0,0,0,16);
      cg.addColorStop(0,'#000000');
      cg.addColorStop(0.35,'#220044');
      cg.addColorStop(0.7,'#8800ff');
      cg.addColorStop(1,'rgba(88,0,255,0)');
      ctx.fillStyle=cg;
      ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();
      // 회전 나선
      for(let i=0;i<3;i++){
        ctx.save();
        ctx.rotate(t*2+i*Math.PI*2/3);
        ctx.globalAlpha=0.65;
        const ag=ctx.createLinearGradient(0,0,18,0);
        ag.addColorStop(0,'#ffffff'); ag.addColorStop(0.4,'#cc44ff'); ag.addColorStop(1,'rgba(100,0,200,0)');
        ctx.fillStyle=ag;
        ctx.beginPath();
        ctx.moveTo(0,-2); ctx.quadraticCurveTo(9,-9,18,0); ctx.quadraticCurveTo(9,9,0,2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // 외부 글로우
      const og=ctx.createRadialGradient(0,0,13,0,0,30);
      og.addColorStop(0,`rgba(136,0,255,${0.3+Math.sin(t*3)*0.15})`);
      og.addColorStop(1,'rgba(80,0,180,0)');
      ctx.globalAlpha=1;
      ctx.fillStyle=og; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });
}

// ── Fireballs ─────────────────────────────────────────────────────
function drawFireballs(){
  fireballs.forEach(fb=>{
    if(!fb.alive) return;
    const sx=lpx(fb.x), sy=lpy(fb.y);
    if(sx<-20||sx>W+20) return;
    // 글로우
    const grd=ctx.createRadialGradient(sx+6,sy+6,0,sx+6,sy+6,18);
    grd.addColorStop(0,'rgba(255,120,0,0.7)');
    grd.addColorStop(1,'rgba(255,40,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx+6,sy+6,18,0,Math.PI*2); ctx.fill();
    // 불꽃 코어
    ctx.fillStyle='#ffee00';
    ctx.beginPath(); ctx.arc(sx+6,sy+6,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff6600';
    ctx.beginPath(); ctx.arc(sx+6,sy+6,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,200,0,0.9)';
    ctx.beginPath(); ctx.arc(sx+6,sy+6,4,0,Math.PI*2); ctx.fill();
  });
}

// ── Particles ────────────────────────────────────────────────────
function drawParticles(){
  particles.forEach(pt=>{
    const sx=lpx(pt.x), sy=lpy(pt.y);
    if(sx<-20||sx>W+20||sy<-20||sy>H+20) return;
    const alpha=pt.life/pt.maxLife;
    ctx.globalAlpha=alpha;
    ctx.fillStyle=pt.color;
    if(pt.shape==='star'){
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(Date.now()*0.005+pt.x);
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const a=i*4*Math.PI/5-Math.PI/2;
        const ia=a+2*Math.PI/5;
        const r=pt.r, ri=pt.r*0.4;
        i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
        ctx.lineTo(Math.cos(ia)*ri,Math.sin(ia)*ri);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if(pt.shape==='rect'){
      ctx.fillRect(sx-pt.r/2,sy-pt.r/2,pt.r,pt.r);
    } else {
      ctx.beginPath(); ctx.arc(sx,sy,pt.r,0,Math.PI*2); ctx.fill();
    }
  });
  ctx.globalAlpha=1;
}

// ── Player (태권도 어린이) ───────────────────────────────────────
const PC={
  hair:'#111111', skin:'#f5c08a', skinD:'#d4905a',
  dobok:'#f0f0f0', dobS:'#d4d4d4',
  belt:'#111111', beltH:'#333333',
  blush:'#ffaaaa', eye:'#1a0800', eyeW:'#ffffff',
  mouth:'#c07858', brow:'#222222',
};

function tkdSmall(bx,by,state,frame){
  const P=PC;
  ctx.fillStyle=P.hair;
  ctx.fillRect(bx+2,by+5,20,6);
  ctx.fillRect(bx+0,by+7,3,6);
  ctx.fillRect(bx+21,by+7,3,6);
  ctx.beginPath(); ctx.arc(bx+7, by+5,4,Math.PI,0); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+12,by+4,4,Math.PI,0); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+17,by+5,4,Math.PI,0); ctx.fill();
  ctx.fillStyle=P.skin;
  ctx.fillRect(bx+3,by+9,18,9);
  ctx.beginPath(); ctx.arc(bx+3, by+15,2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+21,by+15,2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.brow; ctx.fillRect(bx+5,by+10,5,1); ctx.fillRect(bx+14,by+10,5,1);
  ctx.fillStyle=P.eye; ctx.fillRect(bx+5,by+12,5,4); ctx.fillRect(bx+14,by+12,5,4);
  ctx.fillStyle=P.eyeW; ctx.fillRect(bx+6,by+12,3,3); ctx.fillRect(bx+15,by+12,3,3);
  ctx.fillStyle=P.eye; ctx.fillRect(bx+7,by+13,2,2); ctx.fillRect(bx+16,by+13,2,2);
  ctx.fillStyle=P.eyeW; ctx.fillRect(bx+7,by+12,1,1); ctx.fillRect(bx+16,by+12,1,1);
  ctx.fillStyle=P.blush; ctx.fillRect(bx+3,by+15,4,2); ctx.fillRect(bx+17,by+15,4,2);
  ctx.fillStyle=P.skinD; ctx.fillRect(bx+11,by+15,2,1);
  ctx.fillStyle=P.mouth; ctx.fillRect(bx+8,by+17,8,1); ctx.fillRect(bx+7,by+16,2,1); ctx.fillRect(bx+15,by+16,2,1);
  ctx.fillStyle=P.dobok; ctx.fillRect(bx+1,by+18,22,7);
  ctx.fillStyle=P.skin; ctx.fillRect(bx+9,by+18,6,4);
  ctx.fillStyle=P.dobok; ctx.fillRect(bx+1,by+18,9,5); ctx.fillRect(bx+1,by+22,7,3);
  ctx.fillRect(bx+14,by+18,9,5); ctx.fillRect(bx+16,by+22,7,3);
  ctx.fillStyle=P.dobS; ctx.fillRect(bx+3,by+18,1,7); ctx.fillRect(bx+20,by+18,1,7);
  ctx.fillStyle=P.belt; ctx.fillRect(bx+1,by+24,22,3);
  ctx.fillStyle=P.beltH; ctx.fillRect(bx+10,by+24,4,3);
  const lo=state==='run'?(frame%2===0?3:-3):0;
  ctx.fillStyle=P.dobok; ctx.fillRect(bx+1,by+27,10,6+lo); ctx.fillRect(bx+13,by+27,10,6-lo);
  ctx.fillStyle=P.dobS; ctx.fillRect(bx+5,by+27,1,5+lo); ctx.fillRect(bx+17,by+27,1,5-lo);
  ctx.fillStyle=P.skin; ctx.fillRect(bx+0,by+31+lo,12,2); ctx.fillRect(bx+12,by+31-lo,12,2);
  ctx.fillStyle=P.skinD; ctx.fillRect(bx+0,by+32+lo,8,1); ctx.fillRect(bx+12,by+32-lo,8,1);
}

function tkdBig(bx,by,state,frame){
  const P=PC;
  ctx.fillStyle=P.hair;
  ctx.fillRect(bx+1,by+7,22,8); ctx.fillRect(bx+0,by+10,3,10); ctx.fillRect(bx+21,by+10,3,10);
  ctx.beginPath(); ctx.arc(bx+7, by+7,5,Math.PI,0); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+12,by+5,5,Math.PI,0); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+17,by+7,5,Math.PI,0); ctx.fill();
  ctx.fillStyle=P.skin;
  ctx.fillRect(bx+3,by+14,18,13);
  ctx.beginPath(); ctx.arc(bx+3, by+22,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx+21,by+22,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.brow; ctx.fillRect(bx+4,by+15,6,2); ctx.fillRect(bx+14,by+15,6,2);
  ctx.fillStyle=P.eye; ctx.fillRect(bx+4,by+17,6,5); ctx.fillRect(bx+14,by+17,6,5);
  ctx.fillStyle=P.eyeW; ctx.fillRect(bx+5,by+17,4,4); ctx.fillRect(bx+15,by+17,4,4);
  ctx.fillStyle=P.eye; ctx.fillRect(bx+7,by+18,2,3); ctx.fillRect(bx+17,by+18,2,3);
  ctx.fillStyle=P.eyeW; ctx.fillRect(bx+7,by+17,2,1); ctx.fillRect(bx+17,by+17,2,1);
  ctx.fillStyle=P.blush; ctx.fillRect(bx+2,by+22,5,3); ctx.fillRect(bx+17,by+22,5,3);
  ctx.fillStyle=P.skinD; ctx.fillRect(bx+10,by+22,4,2);
  ctx.fillStyle=P.mouth; ctx.fillRect(bx+7,by+25,10,2); ctx.fillRect(bx+5,by+24,3,2); ctx.fillRect(bx+16,by+24,3,2);
  ctx.fillStyle=P.dobok; ctx.fillRect(bx+0,by+27,24,12);
  ctx.fillStyle=P.skin; ctx.fillRect(bx+8,by+27,8,5);
  ctx.fillStyle=P.dobok; ctx.fillRect(bx+0,by+27,12,8); ctx.fillRect(bx+0,by+33,8,6);
  ctx.fillRect(bx+12,by+27,12,8); ctx.fillRect(bx+16,by+33,8,6);
  ctx.fillStyle=P.dobS; ctx.fillRect(bx+3,by+27,1,12); ctx.fillRect(bx+20,by+27,1,12);
  ctx.fillStyle=P.belt; ctx.fillRect(bx+0,by+38,24,4);
  ctx.fillStyle=P.beltH; ctx.fillRect(bx+9,by+38,6,4);
  const lo=state==='run'?(frame%2===0?4:-4):0;
  ctx.fillStyle=P.dobok; ctx.fillRect(bx+0,by+42,12,10+lo); ctx.fillRect(bx+12,by+42,12,10-lo);
  ctx.fillStyle=P.dobS; ctx.fillRect(bx+5,by+42,1,9+lo); ctx.fillRect(bx+17,by+42,1,9-lo);
  ctx.fillStyle=P.skin; ctx.fillRect(bx-1,by+50+lo,14,3); ctx.fillRect(bx+11,by+50-lo,14,3);
  ctx.fillStyle=P.skinD; ctx.fillRect(bx+0,by+52+lo,10,1); ctx.fillRect(bx+12,by+52-lo,10,1);
}

function tkdDead(bx,by){
  ctx.fillStyle=PC.dobok; ctx.fillRect(bx+1,by+4,22,10);
  ctx.fillStyle=PC.belt;  ctx.fillRect(bx+1,by+10,22,3);
  ctx.fillStyle=PC.skin;  ctx.fillRect(bx+2,by+0,20,6);
  ctx.fillStyle=PC.hair;  ctx.fillRect(bx+2,by+0,20,3);
  ctx.fillStyle=PC.eye;   ctx.fillRect(bx+7,by+3,2,2); ctx.fillRect(bx+15,by+3,2,2);
  ctx.fillStyle=PC.mouth;
  ctx.fillRect(bx+6,by+2,4,1); ctx.fillRect(bx+8,by+3,1,2);
  ctx.fillRect(bx+14,by+2,4,1); ctx.fillRect(bx+16,by+3,1,2);
}

function drawPlayer(){
  const p=player;
  const sx=lpx(p.x), sy=lpy(p.y);

  if(p.giant && p.giantTimer>0 && p.giantTimer<120 && Math.floor(p.giantTimer/6)%2===0) return;

  // 투명화 효과
  if(p.invisibleTimer>0){
    const alpha=0.25+Math.sin(Date.now()*0.01)*0.1;
    ctx.globalAlpha=alpha;
    // 투명화 글로우 아우라
    const grd=ctx.createRadialGradient(sx+p.w/2,sy+p.h/2,0,sx+p.w/2,sy+p.h/2,p.h);
    grd.addColorStop(0,'rgba(100,180,255,0.15)');
    grd.addColorStop(1,'rgba(50,100,255,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx+p.w/2,sy+p.h/2,p.h,0,Math.PI*2); ctx.fill();
  }

  let starGlow=false;
  if(p.starTimer>0){
    const rc=RAINBOW[Math.floor(Date.now()/80)%RAINBOW.length];
    ctx.save(); starGlow=true;
    ctx.shadowColor=rc; ctx.shadowBlur=20;
    if(Math.floor(p.invincible/4)%2===0){ ctx.restore(); ctx.globalAlpha=1; return; }
  }

  // 블랙홀 능력 아우라
  if(p.blackholeAbilityTimer>0 && p.blackholeAbility && p.starTimer===0){
    const ratio=p.blackholeAbilityTimer/360;
    const abilityColors={
      speed:   ['rgba(0,255,136,', 'rgba(0,200,100,'],
      lightning:['rgba(0,200,255,', 'rgba(0,120,220,'],
      shield:  ['rgba(220,220,255,','rgba(150,150,220,'],
      float:   ['rgba(150,255,200,','rgba(100,200,150,'],
    };
    const ac2=abilityColors[p.blackholeAbility]||['rgba(180,0,255,','rgba(100,0,180,'];
    const ag=ctx.createRadialGradient(sx+p.w/2,sy+p.h/2,0,sx+p.w/2,sy+p.h/2,p.h*0.8);
    ag.addColorStop(0,ac2[0]+(0.18*ratio)+')');
    ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(sx+p.w/2,sy+p.h/2,p.h*0.8,0,Math.PI*2); ctx.fill();
    if(p.blackholeAbilityTimer<80 && Math.floor(p.blackholeAbilityTimer/5)%2===0){
      ctx.shadowColor=ac2[0]+'0.8)'; ctx.shadowBlur=12;
    }
  }

  // 불꽃 아우라
  if(p.fireTimer>0 && p.starTimer===0){
    const ratio=p.fireTimer/600;
    const grd=ctx.createRadialGradient(sx+p.w/2,sy+p.h/2,0,sx+p.w/2,sy+p.h/2,p.h*0.7);
    grd.addColorStop(0,`rgba(255,80,0,${0.2*ratio})`);
    grd.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(sx+p.w/2,sy+p.h/2,p.h*0.7,0,Math.PI*2); ctx.fill();
    if(p.fireTimer<120 && Math.floor(p.fireTimer/6)%2===0){
      // 끝나기 전 깜빡임 (불꽃 색으로)
      ctx.shadowColor='#ff4400'; ctx.shadowBlur=15;
    }
  }

  if(p.invincible>0&&p.starTimer===0&&!p.giant&&Math.floor(p.invincible/4)%2===0){
    ctx.globalAlpha=1; return;
  }

  if(p.state==='dead'){
    ctx.save(); tkdDead(sx,sy); ctx.restore();
    if(starGlow) ctx.restore();
    ctx.globalAlpha=1; return;
  }

  ctx.save();

  if(p.giant && p.giantTimer>0){
    const rc=['#ff8800','#ffd700','#ff4400'][Math.floor(Date.now()/100)%3];
    ctx.shadowColor=rc; ctx.shadowBlur=40;
    const scale=GIANT_H/BIG_H;
    const flip=p.facing===-1;
    ctx.translate(sx+(flip?p.w:0), sy+p.h);
    ctx.scale(flip?-scale:scale, scale);
    tkdBig(0,-BIG_H,p.state,p.frame);
  } else {
    if(p.facing===-1){ ctx.scale(-1,1); ctx.translate(-sx*2-p.w,0); }
    const bx=sx, by=sy;
    const big=p.big||(p.powerupAnim>0&&p.h===BIG_H);
    if(big) tkdBig(bx,by,p.state,p.frame);
    else    tkdSmall(bx,by,p.state,p.frame);
    if(!p.onGround&&p.jumpsLeft===0){
      ctx.globalAlpha=0.7+Math.sin(Date.now()*.008)*.3;
      ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('✨',bx+p.w/2,by-9);
      ctx.globalAlpha=1;
    }
  }

  ctx.restore();
  if(starGlow) ctx.restore();
  ctx.globalAlpha=1;

  // 흡입 이펙트 (블랙홀 능력 사용 중)
  if(p.sucking && p.blackholeTimer>0 && p.state!=='dead'){
    const mouthX = lpx(p.x)+(p.facing===1 ? p.w+2 : -2);
    const mouthY = lpy(p.y)+p.h*0.35;
    const t=Date.now()*0.004;
    const dir=p.facing===1 ? 1 : -1;
    ctx.save();
    // 흡입 원뿔
    for(let i=0;i<4;i++){
      const alpha=(0.08+0.04*Math.sin(t*4+i))*(i%2===0?1:0.7);
      ctx.globalAlpha=alpha;
      const g=ctx.createLinearGradient(mouthX,mouthY,mouthX+dir*180,mouthY);
      g.addColorStop(0,'#aa00ff'); g.addColorStop(1,'rgba(40,0,100,0)');
      ctx.fillStyle=g;
      ctx.beginPath();
      ctx.moveTo(mouthX,mouthY-5);
      ctx.lineTo(mouthX+dir*180,mouthY-(42+i*8));
      ctx.lineTo(mouthX+dir*180,mouthY+(42+i*8));
      ctx.lineTo(mouthX,mouthY+5);
      ctx.closePath(); ctx.fill();
    }
    // 흡입 링
    for(let d=28;d<=160;d+=32){
      const r=(42*d/180)+Math.sin(t*3+d*0.05)*3;
      ctx.globalAlpha=0.5*(1-d/180);
      ctx.strokeStyle='#cc44ff'; ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.ellipse(mouthX+dir*d, mouthY, r*0.22, r, 0, 0, Math.PI*2);
      ctx.stroke();
    }
    // 입구 소용돌이
    ctx.globalAlpha=0.65+Math.sin(t*5)*0.2;
    const vg=ctx.createRadialGradient(mouthX,mouthY,0,mouthX,mouthY,12);
    vg.addColorStop(0,'#ffffff'); vg.addColorStop(0.45,'#aa00ff'); vg.addColorStop(1,'rgba(80,0,150,0)');
    ctx.fillStyle=vg; ctx.beginPath(); ctx.arc(mouthX,mouthY,12,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.globalAlpha=1;
  }
}

// ── Enemies ──────────────────────────────────────────────────────
function drawEnemies(){
  enemies.forEach(e=>{
    if(!e.alive) return;
    const sx=lpx(e.x), sy=lpy(e.y);
    if(sx+e.w<0||sx>W) return;
    if(e.squished){
      ctx.fillStyle=e.type==='koopa'?'#406820':(e.type==='skeleton'||e.type==='alien')?'#c0c0c4':(e.type==='bat'||e.type==='ufo')?'#442255':'#8b4513';
      ctx.fillRect(sx,sy+e.h-8,e.w,8); return;
    }
    if(e.type==='skeleton'){
      const wk=e.frame%2===0;
      ctx.fillStyle='#dedee2';
      ctx.beginPath(); ctx.arc(sx+e.w/2,sy+11,11,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#111122';
      ctx.fillRect(sx+e.w/2-8,sy+7,6,6);
      ctx.fillRect(sx+e.w/2+2,sy+7,6,6);
      ctx.fillStyle='rgba(160,80,255,0.85)';
      ctx.beginPath(); ctx.arc(sx+e.w/2-5,sy+10,2.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+e.w/2+5,sy+10,2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#dedee2';
      ctx.fillRect(sx+e.w/2-5,sy+19,4,3); ctx.fillRect(sx+e.w/2+1,sy+19,4,3);
      ctx.fillStyle='#111122'; ctx.fillRect(sx+e.w/2-5,sy+21,4,1); ctx.fillRect(sx+e.w/2+1,sy+21,4,1);
      ctx.fillStyle='#c8c8cc';
      ctx.fillRect(sx+5,sy+22,e.w-10,12);
      ctx.fillStyle='#444455';
      ctx.fillRect(sx+5,sy+24,e.w-10,1);
      ctx.fillRect(sx+5,sy+27,e.w-10,1);
      ctx.fillRect(sx+5,sy+30,e.w-10,1);
      ctx.fillStyle='#c8c8cc';
      ctx.fillRect(sx+1,sy+22,4,11); ctx.fillRect(sx+e.w-5,sy+22,4,11);
      const lL=wk?11:7, lR=wk?7:11;
      ctx.fillStyle='#c8c8cc';
      ctx.fillRect(sx+5,sy+34,5,lL); ctx.fillRect(sx+e.w-10,sy+34,5,lR);
      ctx.fillStyle='#aaaaae';
      ctx.fillRect(sx+3,sy+34+lL-3,8,4); ctx.fillRect(sx+e.w-12,sy+34+lR-3,8,4);
    } else if(e.type==='bat'){
      const flap=e.frame%2===0;
      const cx=sx+e.w/2, cy=sy+e.h/2;
      ctx.fillStyle='#3a1850';
      if(flap){
        ctx.beginPath();
        ctx.moveTo(cx,cy); ctx.bezierCurveTo(cx-4,cy-9,cx-19,cy-7,cx-15,cy+5);
        ctx.bezierCurveTo(cx-8,cy+7,cx,cy+3,cx,cy); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx,cy); ctx.bezierCurveTo(cx+4,cy-9,cx+19,cy-7,cx+15,cy+5);
        ctx.bezierCurveTo(cx+8,cy+7,cx,cy+3,cx,cy); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(cx,cy); ctx.bezierCurveTo(cx-4,cy+5,cx-19,cy+3,cx-15,cy-5);
        ctx.bezierCurveTo(cx-8,cy-7,cx,cy-3,cx,cy); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx,cy); ctx.bezierCurveTo(cx+4,cy+5,cx+19,cy+3,cx+15,cy-5);
        ctx.bezierCurveTo(cx+8,cy-7,cx,cy-3,cx,cy); ctx.fill();
      }
      ctx.fillStyle='#553070';
      ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff2200';
      ctx.beginPath(); ctx.arc(cx-3,cy-2,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+3,cy-2,2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,50,0,0.4)';
      ctx.beginPath(); ctx.arc(cx-3,cy-2,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+3,cy-2,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#3a1850';
      ctx.beginPath(); ctx.moveTo(cx-4,cy-6); ctx.lineTo(cx-9,cy-13); ctx.lineTo(cx-1,cy-7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+4,cy-6); ctx.lineTo(cx+9,cy-13); ctx.lineTo(cx+1,cy-7); ctx.fill();
    } else if(e.type==='goomba'){
      const wk=e.frame%2===0;
      ctx.fillStyle='#8b4513';
      ctx.beginPath(); ctx.arc(sx+e.w/2,sy+e.h/2,e.w/2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#5a2000';
      ctx.fillRect(sx+(wk?0:4),sy+e.h-8,10,8); ctx.fillRect(sx+e.w-(wk?10:14),sy+e.h-8,10,8);
      ctx.fillStyle='#fff'; ctx.fillRect(sx+4,sy+6,7,7); ctx.fillRect(sx+e.w-11,sy+6,7,7);
      ctx.fillStyle='#000'; ctx.fillRect(sx+5,sy+7,4,5); ctx.fillRect(sx+e.w-10,sy+7,4,5);
      ctx.fillRect(sx+3,sy+5,8,2); ctx.fillRect(sx+e.w-11,sy+5,8,2);
      ctx.fillStyle='#fff'; ctx.fillRect(sx+6,sy+e.h-10,4,3); ctx.fillRect(sx+e.w-10,sy+e.h-10,4,3);
    } else if(e.type==='alien'){
      const cx=sx+e.w/2, wk=e.frame%2===0;
      // 몸통
      ctx.fillStyle='#00aa44';
      ctx.beginPath(); ctx.ellipse(cx,sy+e.h*0.68,9,12,0,0,Math.PI*2); ctx.fill();
      // 머리
      ctx.fillStyle='#00cc55';
      ctx.beginPath(); ctx.ellipse(cx,sy+e.h*0.32,11,10,0,0,Math.PI*2); ctx.fill();
      // 큰 눈
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.ellipse(cx-5,sy+e.h*0.29,5,7,-0.25,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+5,sy+e.h*0.29,5,7,0.25,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#00ffaa';
      ctx.beginPath(); ctx.ellipse(cx-4,sy+e.h*0.29,2.5,3.5,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+5,sy+e.h*0.29,2.5,3.5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffffff';
      ctx.beginPath(); ctx.arc(cx-3.5,sy+e.h*0.24,1.2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+5.5,sy+e.h*0.24,1.2,0,Math.PI*2); ctx.fill();
      // 안테나
      ctx.strokeStyle='#009933'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(cx,sy+e.h*0.20); ctx.lineTo(cx-5,sy+e.h*0.04); ctx.stroke();
      ctx.fillStyle='#ffcc00';
      ctx.beginPath(); ctx.arc(cx-5,sy+e.h*0.02,3,0,Math.PI*2); ctx.fill();
      ctx.lineWidth=1;
      // 팔
      ctx.fillStyle='#00aa44';
      ctx.fillRect(cx-16,sy+e.h*0.52+(wk?2:-2),7,3);
      ctx.fillRect(cx+9, sy+e.h*0.52+(!wk?2:-2),7,3);
      // 다리
      ctx.fillRect(cx-8,sy+e.h*0.78+(wk?3:-3),5,e.h*0.22);
      ctx.fillRect(cx+3, sy+e.h*0.78+(!wk?3:-3),5,e.h*0.22);
    } else if(e.type==='ufo'){
      const cx=sx+e.w/2, cy=sy+e.h/2;
      const t=Date.now()*0.003;
      // 디스크 (하단)
      const dg=ctx.createRadialGradient(cx,cy+4,2,cx,cy+4,20);
      dg.addColorStop(0,'#ccccdd'); dg.addColorStop(1,'#667788');
      ctx.fillStyle=dg;
      ctx.beginPath(); ctx.ellipse(cx,cy+4,20,8,0,0,Math.PI*2); ctx.fill();
      // 회전 빛
      for(let i=0;i<4;i++){
        const ang=t*2+i*Math.PI/2;
        const lx=cx+Math.cos(ang)*15, ly=cy+4+Math.sin(ang)*5;
        ctx.fillStyle=['#ff4444','#ffff44','#44ff44','#4488ff'][i];
        ctx.beginPath(); ctx.arc(lx,ly,2.5,0,Math.PI*2); ctx.fill();
      }
      // 돔 (상단)
      const dmg=ctx.createRadialGradient(cx-4,cy-6,2,cx,cy-2,14);
      dmg.addColorStop(0,'rgba(180,220,255,0.9)');
      dmg.addColorStop(0.6,'rgba(80,140,220,0.7)');
      dmg.addColorStop(1,'rgba(40,80,180,0.5)');
      ctx.fillStyle=dmg;
      ctx.beginPath(); ctx.ellipse(cx,cy-2,12,10,0,Math.PI,0); ctx.fill();
      // 돔 안 외계인
      ctx.fillStyle='#00cc55';
      ctx.beginPath(); ctx.arc(cx,cy-5,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000';
      ctx.fillRect(cx-2,cy-7,2,3); ctx.fillRect(cx+1,cy-7,2,3);
      // 하단 빛 글로우
      const bg=ctx.createRadialGradient(cx,cy+4,0,cx,cy+4,22);
      bg.addColorStop(0,`rgba(100,200,255,${0.15+Math.sin(t*3)*0.1})`);
      bg.addColorStop(1,'rgba(50,100,255,0)');
      ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(cx,cy+4,22,0,Math.PI*2); ctx.fill();
    } else {
      // 쿠파
      const wk=e.frame%2===0;
      ctx.fillStyle='#406820'; ctx.beginPath(); ctx.arc(sx+e.w/2,sy+e.h/2-2,e.w/2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#50880a'; ctx.beginPath(); ctx.arc(sx+e.w/2,sy+e.h/2-4,e.w/2-5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#70b830'; ctx.fillRect(sx+6,sy,16,12);
      ctx.fillStyle='#fff'; ctx.fillRect(sx+(e.vx<0?7:13),sy+2,5,5);
      ctx.fillStyle='#000'; ctx.fillRect(sx+(e.vx<0?8:14),sy+3,3,3);
      ctx.fillStyle='#406820';
      ctx.fillRect(sx+(wk?1:4),sy+e.h-7,9,7); ctx.fillRect(sx+e.w-(wk?10:13),sy+e.h-7,9,7);
    }
  });
}

// ── Boss ─────────────────────────────────────────────────────────
function drawBoss(){
  if(!boss || !boss.alive) return;
  const b=boss;
  const sx=lpx(b.x), sy=lpy(b.y);
  if(sx+b.w<0||sx>W) return;

  const hurt=b.hurtTimer>0;
  ctx.save();
  if(hurt){ ctx.globalAlpha=0.5+0.5*Math.sin(Date.now()*0.05); }

  ctx.fillStyle=hurt?'#ff4444':'#7700cc';
  ctx.fillRect(sx+8,sy+20,b.w-16,b.h-20);
  ctx.fillStyle='#cc44ff';
  ctx.fillRect(sx+12,sy+28,b.w-24,b.h-36);
  ctx.fillStyle='#7700cc';
  ctx.beginPath(); ctx.arc(sx+b.w/2,sy+18,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ff4400';
  [[sx+8,sy+2],[sx+b.w-8,sy+2]].forEach(([hx,hy])=>{
    ctx.beginPath(); ctx.moveTo(hx,hy+14); ctx.lineTo(hx-6,hy); ctx.lineTo(hx+6,hy); ctx.fill();
  });
  ctx.fillStyle='#ffff00';
  ctx.fillRect(sx+12,sy+10,10,7); ctx.fillRect(sx+b.w-22,sy+10,10,7);
  ctx.fillStyle='#ff0000';
  ctx.fillRect(sx+15,sy+12,5,4); ctx.fillRect(sx+b.w-20,sy+12,5,4);
  ctx.fillStyle='#000';
  ctx.fillRect(sx+10,sy+6,14,3); ctx.fillRect(sx+b.w-24,sy+6,14,3);
  ctx.fillStyle='#fff';
  for(let i=0;i<4;i++) ctx.fillRect(sx+12+i*9,sy+26,6,6);
  const armOff=Math.sin(Date.now()*0.005+b.frame)*8;
  ctx.fillStyle=hurt?'#ff4444':'#7700cc';
  ctx.fillRect(sx-10,sy+22+armOff,14,24);
  ctx.fillRect(sx+b.w-4,sy+22-armOff,14,24);
  ctx.fillStyle='#550099';
  const legOff=b.frame%2===0?4:-4;
  ctx.fillRect(sx+6,sy+b.h-12,18,14+legOff);
  ctx.fillRect(sx+b.w-24,sy+b.h-12,18,14-legOff);

  ctx.restore();
  drawBossHPBar();
}

function drawBossHPBar(){
  if(!boss||!boss.alive) return;
  const bx=W/2-130, by=38;
  const bw=260, bh=18;
  // 배경 패널 (라이트 모드)
  rrect(bx-4,by-4,bw+8,bh+8,6,'rgba(255,255,255,0.88)','rgba(0,0,0,0.2)');
  ctx.fillStyle='#ffdddd'; ctx.fillRect(bx,by,bw,bh);
  const ratio=boss.hp/boss.maxHp;
  const hpColor=ratio>0.6?'#22cc22':ratio>0.3?'#ee8800':'#ee1111';
  // HP 바 그라데이션
  const hpGrd=ctx.createLinearGradient(bx,by,bx,by+bh);
  hpGrd.addColorStop(0,hpColor);
  hpGrd.addColorStop(1,ratio>0.6?'#119911':ratio>0.3?'#bb6600':'#aa0000');
  ctx.fillStyle=hpGrd; ctx.fillRect(bx,by,bw*ratio,bh);
  // 반짝임
  ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(bx,by,bw*ratio,bh/3);
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
  ctx.fillStyle='#1a1a1a'; ctx.font='bold 13px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=3;
  ctx.fillText(`👑 BOSS  HP: ${boss.hp}/${boss.maxHp}`, W/2, by+bh/2);
  ctx.shadowBlur=0;
  for(let i=1;i<boss.maxHp;i++){
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(bx+bw*(i/boss.maxHp),by); ctx.lineTo(bx+bw*(i/boss.maxHp),by+bh); ctx.stroke();
  }
}

// ── Flag ─────────────────────────────────────────────────────────
function drawFlag(){
  const sx=lpx(FLAG_X); if(sx<-20||sx>W+20) return;
  ctx.fillStyle='#888'; ctx.fillRect(sx,GND_Y-FLAG_H,4,FLAG_H);
  const wave=Math.sin(Date.now()*.006)*4;
  ctx.fillStyle='#e80000';
  for(let i=0;i<3;i++){
    ctx.beginPath();
    ctx.moveTo(sx+4,GND_Y-FLAG_H+i*14);
    ctx.lineTo(sx+4+36+wave,GND_Y-FLAG_H+i*14+7);
    ctx.lineTo(sx+4,GND_Y-FLAG_H+i*14+14);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(sx+2,GND_Y-FLAG_H,6,0,Math.PI*2); ctx.fill();
}

function drawFloatTexts(){
  floatTexts.forEach(t=>{
    const alpha=Math.min(1,t.life/20);
    ctx.globalAlpha=alpha;
    ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=4;
    ctx.fillStyle=t.color; ctx.font='bold 15px Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(t.text,lpx(t.x),lpy(t.y));
    ctx.shadowBlur=0;
  });
  ctx.globalAlpha=1;
}

// ── HUD ──────────────────────────────────────────────────────────
function drawHUD(){
  // HUD 배경 그라데이션 (라이트 모드)
  const hudGrd=ctx.createLinearGradient(0,0,0,36);
  hudGrd.addColorStop(0,'rgba(255,255,255,0.92)');
  hudGrd.addColorStop(1,'rgba(240,246,255,0.75)');
  ctx.fillStyle=hudGrd; ctx.fillRect(0,0,W,36);
  // 아래 테두리
  ctx.strokeStyle='rgba(0,0,80,0.18)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,36); ctx.lineTo(W,36); ctx.stroke();

  ctx.font='bold 15px Arial'; ctx.textBaseline='middle';
  ctx.shadowColor='rgba(255,255,255,0.6)'; ctx.shadowBlur=2;

  // 라이프
  ctx.textAlign='left';
  ctx.fillStyle='#ee3333'; ctx.fillText('❤',8,18);
  ctx.fillStyle='#1a1a3a'; ctx.fillText(` x${lives}`,22,18);

  // 코인
  ctx.fillStyle='#cc8800'; ctx.fillText('🪙',90,18);
  ctx.fillStyle='#1a1a3a'; ctx.fillText(` x${coinCount}`,106,18);

  // 점수 (중앙)
  ctx.textAlign='center';
  const scoreStr=String(score).padStart(6,'0');
  ctx.fillStyle='#996600';
  ctx.font='bold 16px monospace';
  ctx.fillText(`🏆 ${scoreStr}`,W/2,18);
  ctx.font='bold 15px Arial';

  // 타이머
  ctx.textAlign='right';
  ctx.fillStyle=timeLeft<=60?'#cc2222':timeLeft<=120?'#cc6600':'#0066aa';
  ctx.fillText(`⏱ ${timeLeft}`,W-10,18);

  ctx.shadowBlur=0;

  // 스테이지 표시
  ctx.fillStyle='rgba(0,0,60,0.5)';
  ctx.font='11px Arial'; ctx.textAlign='center';
  ctx.fillText(`STAGE ${stageIdx+1} / ${STAGES.length}`, W/2, H-14);

  if(player&&gameState==='playing'){
    const p=player;
    let barY=42;

    // 대왕 버섯 바
    if(p.giantTimer>0){
      const ratio=p.giantTimer/600;
      const barColor=ratio>0.33?'#ff8800':ratio>0.15?'#ffaa00':'#ff4400';
      rrect(8,barY,176,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      ctx.fillStyle=barColor; ctx.fillRect(10,barY+2,172*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,172*ratio,5);
      if(p.giantTimer<120 && Math.floor(p.giantTimer/10)%2===0){
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,barY+2,172*ratio,14);
      }
      ctx.fillStyle='#2a1000'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      ctx.fillText('👑 대왕! '+Math.ceil(p.giantTimer/60)+'s', 14, barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // 별 무적 바
    if(p.starTimer>0){
      const ratio=p.starTimer/600;
      const rc=RAINBOW[Math.floor(Date.now()/80)%RAINBOW.length];
      rrect(8,barY,168,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      ctx.fillStyle=rc; ctx.fillRect(10,barY+2,164*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,164*ratio,5);
      ctx.fillStyle='#1a0040'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      ctx.fillText('⭐ 무적! '+Math.ceil(p.starTimer/60)+'s',14,barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // 불꽃 바
    if(p.fireTimer>0){
      const ratio=p.fireTimer/600;
      rrect(8,barY,168,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      const fireGrd=ctx.createLinearGradient(10,0,10+160*ratio,0);
      fireGrd.addColorStop(0,'#ff8800'); fireGrd.addColorStop(1,'#ff2200');
      ctx.fillStyle=fireGrd; ctx.fillRect(10,barY+2,160*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,160*ratio,5);
      if(p.fireTimer<120 && Math.floor(p.fireTimer/6)%2===0){
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,barY+2,160*ratio,14);
      }
      ctx.fillStyle='#3a0800'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      ctx.fillText('🔥 불꽃! Z키 발사 '+Math.ceil(p.fireTimer/60)+'s',14,barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // 투명화 바
    if(p.invisibleTimer>0){
      const ratio=p.invisibleTimer/600;
      rrect(8,barY,168,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      const invGrd=ctx.createLinearGradient(10,0,10+160*ratio,0);
      invGrd.addColorStop(0,'#88aaff'); invGrd.addColorStop(1,'#2244cc');
      ctx.fillStyle=invGrd; ctx.fillRect(10,barY+2,160*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,160*ratio,5);
      if(p.invisibleTimer<120 && Math.floor(p.invisibleTimer/6)%2===0){
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,barY+2,160*ratio,14);
      }
      ctx.fillStyle='#001040'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      ctx.fillText('👻 투명! '+Math.ceil(p.invisibleTimer/60)+'s',14,barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // 블랙홀 바
    if(p.blackholeTimer>0){
      const ratio=p.blackholeTimer/600;
      rrect(8,barY,194,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      const bhGrd=ctx.createLinearGradient(10,0,10+186*ratio,0);
      bhGrd.addColorStop(0,'#cc44ff'); bhGrd.addColorStop(1,'#440088');
      ctx.fillStyle=bhGrd; ctx.fillRect(10,barY+2,186*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,186*ratio,5);
      if(p.blackholeTimer<120 && Math.floor(p.blackholeTimer/6)%2===0){
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,barY+2,186*ratio,14);
      }
      ctx.fillStyle='#1a0030'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      const abilityNames={speed:'⚡스피드',lightning:'⚡번개',shield:'🛡실드',float:'🌊부유'};
      const aText=p.blackholeAbilityTimer>0&&p.blackholeAbility?(` [${abilityNames[p.blackholeAbility]||''}]`):'  X키:흡입';
      ctx.fillText('🌀 블랙홀!'+aText+' '+Math.ceil(p.blackholeTimer/60)+'s',14,barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // 점프력 강화 바
    if(p.jumpBoostTimer>0){
      const ratio=p.jumpBoostTimer/600;
      rrect(8,barY,168,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      const jGrd=ctx.createLinearGradient(10,0,10+160*ratio,0);
      jGrd.addColorStop(0,'#4488ff'); jGrd.addColorStop(1,'#0033cc');
      ctx.fillStyle=jGrd; ctx.fillRect(10,barY+2,160*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,160*ratio,5);
      if(p.jumpBoostTimer<120 && Math.floor(p.jumpBoostTimer/6)%2===0){
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,barY+2,160*ratio,14);
      }
      ctx.fillStyle='#001040'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      ctx.fillText('🦘 점프UP! '+Math.ceil(p.jumpBoostTimer/60)+'s',14,barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // 속도 부스트 바
    if(p.speedBoostTimer>0){
      const ratio=p.speedBoostTimer/600;
      rrect(8,barY,168,18,4,'rgba(255,255,255,0.82)','rgba(0,0,0,0.18)');
      const sGrd=ctx.createLinearGradient(10,0,10+160*ratio,0);
      sGrd.addColorStop(0,'#ffcc00'); sGrd.addColorStop(1,'#cc8800');
      ctx.fillStyle=sGrd; ctx.fillRect(10,barY+2,160*ratio,14);
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(10,barY+2,160*ratio,5);
      if(p.speedBoostTimer<120 && Math.floor(p.speedBoostTimer/6)%2===0){
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(10,barY+2,160*ratio,14);
      }
      ctx.fillStyle='#332200'; ctx.font='bold 11px Arial'; ctx.textAlign='left';
      ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=2;
      ctx.fillText('⚡ 속도UP! '+Math.ceil(p.speedBoostTimer/60)+'s',14,barY+10);
      ctx.shadowBlur=0;
      barY+=22;
    }

    // BIG 표시
    if(p.big && !p.giant && p.starTimer===0 && p.fireTimer===0 && p.invisibleTimer===0){
      rrect(W-115,38,105,20,4,'rgba(255,200,180,0.75)','rgba(200,60,60,0.3)');
      ctx.fillStyle='#882200'; ctx.font='11px Arial'; ctx.textAlign='right';
      ctx.fillText('🍄 BIG',W-12,49);
    }

    // 조작 안내 & 점프 카운터
    ctx.textAlign='right'; ctx.font='10px Arial'; ctx.fillStyle='rgba(0,0,60,0.6)';
    ctx.fillText('↑점프  Shift달리기  Z불꽃  X흡입  S/ESC🏪상점',W-10,H-14);
    for(let i=0;i<2;i++){
      const filled=i<p.jumpsLeft;
      ctx.fillStyle=filled?'#cc8800':'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.arc(W-38+i*18,H-26,6,0,Math.PI*2); ctx.fill();
      if(filled){ ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1; ctx.stroke(); }
    }
    ctx.lineWidth=1;
  }
}

// ── Screen flash ─────────────────────────────────────────────────
function drawScreenFlash(){
  if(!screenFlash || screenFlash.alpha<=0) return;
  ctx.globalAlpha=Math.min(1, screenFlash.alpha);
  ctx.fillStyle=screenFlash.color;
  ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;
}

// ── Overlays ────────────────────────────────────────────────────
function rrect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}

function drawTitle(){
  // 배경 블러 (라이트)
  ctx.fillStyle='rgba(180,210,240,0.4)'; ctx.fillRect(0,0,W,H);
  // 타이틀 패널
  const px=W/2-240, py=H/2-210, pw=480, ph=420;
  const panelGrd=ctx.createLinearGradient(px,py,px,py+ph);
  panelGrd.addColorStop(0,'rgba(245,250,255,0.97)');
  panelGrd.addColorStop(1,'rgba(220,235,255,0.97)');
  rrect(px,py,pw,ph,20,null,null);
  ctx.fillStyle=panelGrd; ctx.fill();
  ctx.strokeStyle='#4488ff'; ctx.lineWidth=2.5; ctx.stroke();

  // 타이틀
  ctx.shadowColor='#2266cc'; ctx.shadowBlur=14;
  ctx.fillStyle='#cc5500'; ctx.font='bold 44px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🍄 슈퍼 마리오',W/2,H/2-155);
  ctx.shadowBlur=0;

  // 기본 조작
  ctx.fillStyle='#224488'; ctx.font='14px Arial';
  ctx.fillText('← → 이동  |  Space / ↑  점프(2단)  |  Shift 달리기',W/2,H/2-108);
  ctx.fillText('적 머리 밟기 = 처치!  |  Z: 불꽃 발사  |  X: 블랙홀 흡입 (아이템 획득 후)',W/2,H/2-80);

  // 아이템 설명
  const items=[
    ['#cc5500','🍄 버섯','성장 (데미지 1회 무효)'],
    ['#886600','⭐ 별','10초 무적 + 적 자동 처치'],
    ['#996600','👑 대왕버섯','화면 절반 크기! 10초 무적'],
    ['#aa2200','🔥 불꽃','10초간 Z키로 파이어볼 발사'],
    ['#887700','⚡ 번개','화면 내 모든 적 즉시 처치!'],
    ['#2244aa','👻 투명화','10초간 적 감지 무효 + 무적'],
  ];
  items.forEach(([color,icon,desc],i)=>{
    const row=Math.floor(i/2), col=i%2;
    const ix=W/2-220+col*220, iy=H/2-48+row*28;
    ctx.fillStyle=color; ctx.font='bold 13px Arial'; ctx.textAlign='left';
    ctx.fillText(icon+' '+desc, ix, iy);
  });

  // 스테이지 안내
  ctx.fillStyle='rgba(100,60,0,0.9)'; ctx.font='12px Arial'; ctx.textAlign='center';
  ctx.fillText('1→평원  2→사막  3→성(보스)  4→던전  5→화산🌋  6→우주🚀(블랙홀🌀)',W/2,H/2+45);

  if(Math.floor(Date.now()/500)%2===0){
    ctx.shadowColor='#2266cc'; ctx.shadowBlur=8;
    ctx.fillStyle='#1144cc'; ctx.font='bold 22px Arial';
    ctx.fillText('Space 를 눌러 시작',W/2,H/2+90);
    ctx.shadowBlur=0;
  }
}

function drawStageClear(){
  ctx.fillStyle='rgba(150,220,150,0.25)'; ctx.fillRect(0,0,W,H);
  const px=W/2-230, py=H/2-140, pw=460, ph=280;
  const panelGrd=ctx.createLinearGradient(px,py,px,py+ph);
  panelGrd.addColorStop(0,'rgba(230,255,230,0.97)');
  panelGrd.addColorStop(1,'rgba(200,245,205,0.97)');
  rrect(px,py,pw,ph,20,null,null);
  ctx.fillStyle=panelGrd; ctx.fill();
  ctx.strokeStyle='#22aa22'; ctx.lineWidth=2.5; ctx.stroke();

  ctx.shadowColor='#44cc44'; ctx.shadowBlur=10;
  ctx.fillStyle='#225500'; ctx.font='bold 42px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(`🎉 STAGE ${clearedStage+1} 클리어!`,W/2,H/2-88);
  ctx.shadowBlur=0;

  ctx.fillStyle='#1a1a1a'; ctx.font='bold 22px Arial';
  ctx.fillText(`점수: ${String(score).padStart(6,'0')}점  코인: ${coinCount}개`,W/2,H/2-40);

  if(clearedStage+1<STAGES.length){
    const nextTheme=['평원','사막','성(보스)','지하던전','화산','우주'][clearedStage+1]||'';
    ctx.fillStyle='#005577'; ctx.font='16px Arial';
    ctx.fillText(`다음 → STAGE ${clearedStage+2}: ${nextTheme}`,W/2,H/2+0);
  }

  // 시간 보너스
  ctx.fillStyle='#664400'; ctx.font='15px Arial';
  ctx.fillText(`⏱ 시간 보너스: ${timeLeft} × 10 = +${timeLeft*10}pt`,W/2,H/2+30);

  if(Math.floor(Date.now()/500)%2===0){
    ctx.shadowColor='#22aa22'; ctx.shadowBlur=6;
    ctx.fillStyle='#115500'; ctx.font='bold 20px Arial';
    ctx.fillText('Space 를 눌러 계속',W/2,H/2+80);
    ctx.shadowBlur=0;
  }
}

function drawAllClear(){
  ctx.fillStyle='rgba(180,150,220,0.25)'; ctx.fillRect(0,0,W,H);
  const px=W/2-250, py=H/2-165, pw=500, ph=330;
  const panelGrd=ctx.createLinearGradient(px,py,px,py+ph);
  panelGrd.addColorStop(0,'rgba(248,240,255,0.97)');
  panelGrd.addColorStop(1,'rgba(230,215,255,0.97)');
  rrect(px,py,pw,ph,22,null,null);
  ctx.fillStyle=panelGrd; ctx.fill();
  ctx.strokeStyle='#8822cc'; ctx.lineWidth=2.5; ctx.stroke();

  const rc=RAINBOW[Math.floor(Date.now()/100)%RAINBOW.length];
  ctx.shadowColor=rc; ctx.shadowBlur=16;
  ctx.fillStyle=rc; ctx.font='bold 50px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('👑 ALL CLEAR! 👑',W/2,H/2-105);
  ctx.shadowBlur=0;

  ctx.fillStyle='#1a1a1a'; ctx.font='bold 26px Arial';
  ctx.fillText(`최종 점수: ${String(score).padStart(6,'0')}점`,W/2,H/2-50);
  ctx.fillStyle='#664400'; ctx.font='20px Arial';
  ctx.fillText(`코인: ${coinCount}개  모든 스테이지 완료!`,W/2,H/2-10);
  ctx.fillStyle='#663300'; ctx.font='16px Arial';
  ctx.fillText('🌋 화산과 🚀 우주까지 정복했습니다!',W/2,H/2+28);
  ctx.fillStyle='#551188'; ctx.font='14px Arial';
  ctx.fillText('보스를 물리치고 왕국을 구했습니다!',W/2,H/2+55);

  if(Math.floor(Date.now()/500)%2===0){
    ctx.shadowColor='#6622cc'; ctx.shadowBlur=6;
    ctx.fillStyle='#330088'; ctx.font='bold 20px Arial';
    ctx.fillText('Space 를 눌러 처음부터',W/2,H/2+100);
    ctx.shadowBlur=0;
  }
}

function drawGameOver(){
  ctx.fillStyle='rgba(220,100,100,0.25)'; ctx.fillRect(0,0,W,H);
  const px=W/2-210, py=H/2-120, pw=420, ph=240;
  const panelGrd=ctx.createLinearGradient(px,py,px,py+ph);
  panelGrd.addColorStop(0,'rgba(255,235,235,0.97)');
  panelGrd.addColorStop(1,'rgba(255,210,210,0.97)');
  rrect(px,py,pw,ph,18,null,null);
  ctx.fillStyle=panelGrd; ctx.fill();
  ctx.strokeStyle='#cc2020'; ctx.lineWidth=2.5; ctx.stroke();

  ctx.shadowColor='#ff8888'; ctx.shadowBlur=12;
  ctx.fillStyle='#cc1111'; ctx.font='bold 52px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('GAME OVER',W/2,H/2-50);
  ctx.shadowBlur=0;

  ctx.fillStyle='#1a1a1a'; ctx.font='18px Arial';
  ctx.fillText(`최종 점수: ${score}점  |  코인: ${coinCount}개`,W/2,H/2+0);
  ctx.fillStyle='rgba(140,60,0,0.9)'; ctx.font='14px Arial';
  ctx.fillText(`도달 스테이지: ${stageIdx+1} / ${STAGES.length}`,W/2,H/2+28);

  if(Math.floor(Date.now()/500)%2===0){
    ctx.shadowColor='#cc4400'; ctx.shadowBlur=5;
    ctx.fillStyle='#882200'; ctx.font='bold 18px Arial';
    ctx.fillText('Space 를 눌러 재시작',W/2,H/2+72);
    ctx.shadowBlur=0;
  }
}

// ── Shop ─────────────────────────────────────────────────────────
function drawShop(){
  // 일시정지 오버레이
  ctx.fillStyle='rgba(30,30,60,0.55)'; ctx.fillRect(0,0,W,H);

  const pw=480, ph=400;
  const px=W/2-pw/2, py=H/2-ph/2;

  // 패널 배경
  const panelGrd=ctx.createLinearGradient(px,py,px,py+ph);
  panelGrd.addColorStop(0,'rgba(248,250,255,0.98)');
  panelGrd.addColorStop(1,'rgba(225,235,255,0.98)');
  rrect(px,py,pw,ph,16,null,null);
  ctx.fillStyle=panelGrd; ctx.fill();
  ctx.strokeStyle='#3355bb'; ctx.lineWidth=2.5; ctx.stroke();

  // 제목
  ctx.shadowColor='#3355bb'; ctx.shadowBlur=10;
  ctx.fillStyle='#112277'; ctx.font='bold 26px Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🏪 코인 상점',W/2,py+30);
  ctx.shadowBlur=0;

  // 일시정지 뱃지
  ctx.fillStyle='rgba(100,120,200,0.18)';
  rrect(px+pw-100,py+14,88,22,6,'rgba(100,120,200,0.18)','rgba(60,80,180,0.4)');
  ctx.fillStyle='#334488'; ctx.font='11px Arial';
  ctx.fillText('⏸ 일시정지',px+pw-56,py+25);

  // 보유 코인
  ctx.fillStyle='#664400'; ctx.font='bold 17px Arial'; ctx.textAlign='center';
  ctx.fillText(`🪙 보유 코인: ${coinCount}개`,W/2,py+62);

  // 구분선
  ctx.strokeStyle='rgba(0,0,100,0.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(px+20,py+80); ctx.lineTo(px+pw-20,py+80); ctx.stroke();

  // 아이템 목록
  SHOP_ITEMS.forEach((item,i)=>{
    const iy=py+96+i*68;
    const sel=i===shopSelectedIdx;
    const canAfford=coinCount>=item.cost;

    // 선택 배경
    if(sel){
      rrect(px+14,iy-8,pw-28,58,10,
        'rgba(80,120,255,0.12)','rgba(60,100,220,0.45)');
    } else {
      rrect(px+14,iy-8,pw-28,58,10,
        'rgba(0,0,0,0.03)','rgba(0,0,80,0.08)');
    }

    // 선택 화살표
    if(sel){
      ctx.fillStyle='#2244cc'; ctx.font='bold 16px Arial'; ctx.textAlign='left';
      ctx.fillText('▶',px+18,iy+10);
    }

    // 아이콘 + 이름
    ctx.fillStyle=sel?'#112288':(canAfford?'#223366':'#999999');
    ctx.font=`bold 19px Arial`; ctx.textAlign='left';
    ctx.fillText(`${item.icon} ${item.name}`,px+34,iy+10);

    // 설명
    ctx.fillStyle=sel?'#334499':'#667799';
    ctx.font='12px Arial';
    ctx.fillText(item.desc,px+42,iy+34);

    // 가격 배지
    const priceX=px+pw-22;
    ctx.textAlign='right';
    if(!canAfford){
      ctx.fillStyle='rgba(200,50,50,0.12)';
      rrect(priceX-72,iy+1,76,24,6,'rgba(200,50,50,0.12)','rgba(180,30,30,0.3)');
      ctx.fillStyle='#cc1111';
    } else if(sel){
      ctx.fillStyle='rgba(80,160,80,0.15)';
      rrect(priceX-72,iy+1,76,24,6,'rgba(80,160,80,0.15)','rgba(40,140,40,0.35)');
      ctx.fillStyle='#115511';
    } else {
      ctx.fillStyle='#664400';
    }
    ctx.font='bold 15px Arial';
    ctx.fillText(`🪙 ${item.cost}`,priceX,iy+16);
  });

  // 구매 메시지
  if(shopMsg && shopMsg.timer>0){
    const alpha=Math.min(1,shopMsg.timer/30);
    ctx.globalAlpha=alpha;
    ctx.fillStyle=shopMsg.color; ctx.font='bold 15px Arial'; ctx.textAlign='center';
    ctx.shadowColor='rgba(255,255,255,0.8)'; ctx.shadowBlur=6;
    ctx.fillText(shopMsg.text,W/2,py+ph-50);
    ctx.shadowBlur=0;
    ctx.globalAlpha=1;
  }

  // 조작 안내
  ctx.fillStyle='rgba(0,0,60,0.45)'; ctx.font='12px Arial'; ctx.textAlign='center';
  ctx.fillText('▲▼ 선택   Space/Z 구매   ESC/S 닫기',W/2,py+ph-18);
}

// ── Main draw ────────────────────────────────────────────────────
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.scale(scaleX,scaleY);

  drawBG();
  drawFlag();
  drawPlatforms();
  drawCoins();
  drawPowerups();
  drawFireballs();
  drawEnemies();
  drawBoss();
  drawPlayer();
  drawParticles();
  drawFloatTexts();
  drawScreenFlash();
  drawHUD();
  if(boss&&boss.alive) drawBossHPBar();

  if(gameState==='title')      drawTitle();
  if(gameState==='stageclear') drawStageClear();
  if(gameState==='allclear')   drawAllClear();
  if(gameState==='gameover')   drawGameOver();
  if(gameState==='shop')       drawShop();

  ctx.restore();
}
