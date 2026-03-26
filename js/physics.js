// ═══════════════════════════════════════════════════════════════
//  Collision helpers
// ═══════════════════════════════════════════════════════════════
function overlap(ax,ay,aw,ah,bx,by,bw,bh){
  return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
}

function resolvePlayer(p){
  // 대왕 상태: 겹치는 벽돌을 모두 파괴
  if(p.giant){
    platforms.forEach(pl=>{
      if(pl.type==='brick'&&!pl.hit&&overlap(p.x,p.y,p.w,p.h,pl.x,pl.y,pl.w,pl.h||TILE)){
        pl.hit=true; sndBreak(); score+=50;
        spawnParticles(pl.x+pl.w/2,pl.y+8,10,['#c88050','#a05828','#e0a060','#fff8e0'],
          {speed:5,upBias:1,life:35,r:5,shape:'rect'});
      }
    });
  }
  // 대왕: 바닥(ground)만 충돌 / 일반: 파괴된 벽돌은 통과
  const hits=platforms.filter(pl=>{
    if(!overlap(p.x,p.y,p.w,p.h,pl.x,pl.y,pl.w,pl.h||TILE)) return false;
    if(p.giant) return pl.type==='ground';
    if(pl.type==='brick'&&pl.hit) return false;
    return true;
  });
  p.onGround=false;
  for(const pl of hits){
    const pw=pl.w, ph=pl.h||TILE;
    const ox=Math.min(p.x+p.w,pl.x+pw)-Math.max(p.x,pl.x);
    const oy=Math.min(p.y+p.h,pl.y+ph)-Math.max(p.y,pl.y);
    if(ox<=0||oy<=0) continue;
    if(ox<oy){
      if(p.x<pl.x){p.x-=ox;if(p.vx>0)p.vx=0;}
      else         {p.x+=ox;if(p.vx<0)p.vx=0;}
    } else {
      if(p.y<pl.y){
        p.y=pl.y-p.h; p.vy=0; p.onGround=true;
        p.jumpsLeft=2; p.lastJumpWas2nd=false;
      } else {
        p.y=pl.y+ph;
        if(p.vy<0){ hitBlockBelow(pl,p); p.vy=0; }
      }
    }
  }
}

function hitBlockBelow(pl,p){
  const qb=qblocks.find(q=>q.x===pl.x&&q.y===pl.y&&!q.hit);
  if(qb){
    qb.hit=true; qb.bounceY=-8;
    if(qb.reward==='coin'){
      coinCount++; score+=200;
      addFloat(qb.x+qb.w/2, qb.y-10, '+200','#ffe033'); sndCoin();
      spawnParticles(qb.x+qb.w/2, qb.y, 12, ['#ffe033','#ffcc00','#fff','#ffd700'],
        {speed:4, upBias:2, life:35, r:5, shape:'star'});
    } else if(qb.reward==='mushroom'){
      spawnPowerup(qb.x, qb.y, 'mushroom');
      spawnParticles(qb.x+qb.w/2, qb.y, 10, ['#e03020','#ff6666','#ff8800','#fff'],
        {speed:3, upBias:1, life:30, r:4});
    } else if(qb.reward==='star'){
      spawnPowerup(qb.x, qb.y, 'star');
      spawnParticles(qb.x+qb.w/2, qb.y, 14, ['#ffe033','#ffaa00','#fff','#ffffaa'],
        {speed:5, upBias:2, life:40, r:5, shape:'star'});
    } else if(qb.reward==='giant_mushroom'){
      spawnPowerup(qb.x, qb.y, 'giant_mushroom');
      spawnParticles(qb.x+qb.w/2, qb.y, 18, ['#ff8800','#ffd700','#fff','#ff4400','#ffe033'],
        {speed:6, upBias:3, life:50, r:7, shape:'star'});
    } else if(qb.reward==='fire'){
      spawnPowerup(qb.x, qb.y, 'fire');
      spawnParticles(qb.x+qb.w/2, qb.y, 16, ['#ff4400','#ff8800','#ffcc00','#fff','#ff2200'],
        {speed:5, upBias:3, life:45, r:5, shape:'star'});
    } else if(qb.reward==='lightning'){
      spawnPowerup(qb.x, qb.y, 'lightning');
      spawnParticles(qb.x+qb.w/2, qb.y, 16, ['#ffff00','#aaff00','#fff','#ffee44'],
        {speed:5, upBias:3, life:40, r:5, shape:'star'});
    } else if(qb.reward==='invisible'){
      spawnPowerup(qb.x, qb.y, 'invisible');
      spawnParticles(qb.x+qb.w/2, qb.y, 16, ['#aaccff','#ffffff','#88aaff','#ddaaff'],
        {speed:5, upBias:3, life:40, r:5, shape:'star'});
    } else if(qb.reward==='blackhole'){
      spawnPowerup(qb.x, qb.y, 'blackhole');
      spawnParticles(qb.x+qb.w/2, qb.y, 18, ['#8800ff','#bb44ff','#330066','#ffffff','#4400cc'],
        {speed:6, upBias:3, life:50, r:6, shape:'star'});
    }
  } else if(pl.type==='brick'&&!pl.hit){
    if(p.big){
      pl.hit=true; sndBreak();
      addFloat(pl.x+16,pl.y-10,'💥','#f84'); score+=50;
      spawnParticles(pl.x+16, pl.y, 14, ['#c88050','#a05828','#e0a060','#fff8e0'],
        {speed:5, upBias:3, life:35, r:5, shape:'rect'});
    }
  }
}

function spawnPowerup(bx,by,type){
  const slidingTypes = ['mushroom','giant_mushroom','fire','invisible'];
  const bouncingTypes = ['star','lightning'];
  powerups.push({
    x:bx, y:by-1,
    w:28, h:28,
    vx: type==='blackhole' ? 0.4 : (slidingTypes.includes(type) ? 1.5 : 2.5),
    vy: (bouncingTypes.includes(type)||type==='blackhole') ? -7 : 0,
    type,
    alive:true,
    onGround:false,
    emergeY: by-28,
    emerging: true,
    frame:0, frameTimer:0,
  });
}

function resolveEnemy(e){
  for(const pl of platforms){
    const pw=pl.w, ph=pl.h||TILE;
    if(!overlap(e.x,e.y,e.w,e.h,pl.x,pl.y,pw,ph)) continue;
    const ox=Math.min(e.x+e.w,pl.x+pw)-Math.max(e.x,pl.x);
    const oy=Math.min(e.y+e.h,pl.y+ph)-Math.max(e.y,pl.y);
    if(ox<=0||oy<=0) continue;
    if(ox<oy){
      if(e.x<pl.x){e.x-=ox;e.vx=-Math.abs(e.vx);}
      else         {e.x+=ox;e.vx= Math.abs(e.vx);}
    } else {
      if(e.y<pl.y){e.y=pl.y-e.h;e.vy=0;e.onGround=true;}
      else         {e.y=pl.y+ph; if(e.vy<0)e.vy=0;}
    }
  }
}

function resolvePowerup(pw){
  for(const pl of platforms){
    const pw2=pl.w, ph=pl.h||TILE;
    if(!overlap(pw.x,pw.y,pw.w,pw.h,pl.x,pl.y,pw2,ph)) continue;
    const ox=Math.min(pw.x+pw.w,pl.x+pw2)-Math.max(pw.x,pl.x);
    const oy=Math.min(pw.y+pw.h,pl.y+ph)-Math.max(pw.y,pl.y);
    if(ox<=0||oy<=0) continue;
    if(ox<oy){
      if(pw.x<pl.x){pw.x-=ox;pw.vx=-Math.abs(pw.vx);}
      else          {pw.x+=ox;pw.vx= Math.abs(pw.vx);}
    } else {
      if(pw.y<pl.y){pw.y=pl.y-pw.h;pw.vy=0;pw.onGround=true;}
      else          {pw.y=pl.y+ph;  if(pw.vy<0){pw.vy*=-0.7;}}
    }
  }
}

// ── 보스 플랫폼 충돌 ─────────────────────────────────────────────
function resolveBoss(b){
  b.onGround=false;
  for(const pl of platforms){
    const pw=pl.w, ph=pl.h||TILE;
    if(!overlap(b.x,b.y,b.w,b.h,pl.x,pl.y,pw,ph)) continue;
    const ox=Math.min(b.x+b.w,pl.x+pw)-Math.max(b.x,pl.x);
    const oy=Math.min(b.y+b.h,pl.y+ph)-Math.max(b.y,pl.y);
    if(ox<=0||oy<=0) continue;
    if(ox<oy){
      if(b.x<pl.x){b.x-=ox;b.vx=-Math.abs(b.vx);}
      else         {b.x+=ox;b.vx= Math.abs(b.vx);}
    } else {
      if(b.y<pl.y){b.y=pl.y-b.h;b.vy=0;b.onGround=true;}
      else         {b.y=pl.y+ph;if(b.vy<0)b.vy=0;}
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  Damage / Power-up effects
// ═══════════════════════════════════════════════════════════════
function takeDamage(){
  const p=player;
  if(p.invincible>0||p.starTimer>0||p.giantTimer>0) return;
  if(p.big){
    p.big=false;
    p.h=SML_H;
    p.y=p.y+(BIG_H-SML_H);
    p.invincible=180;
    sndHurt();
    addFloat(p.x+p.w/2, p.y-10,'💫','#f88');
    spawnParticles(p.x+p.w/2, p.y+p.h/2, 10, ['#ff4444','#ff8800','#ffff00'],
      {speed:4, upBias:1, life:30, r:4});
  } else {
    killPlayer();
  }
}

function collectMushroom(){
  const p=player;
  p.big=true;
  p.powerupAnim=40;
  p.invincible=40;
  sndMushroom();
  score+=1000;
  addFloat(p.x+p.w/2, p.y-16,'🍄 +1000','#f0a');
  spawnParticles(p.x+p.w/2, p.y, 16, ['#e03020','#ff6666','#fff','#ff8800'],
    {speed:5, upBias:2, life:40, r:5});
}

function collectStar(){
  const p=player;
  p.starTimer=600;
  p.invincible=600;
  sndStar();
  score+=1000;
  addFloat(p.x+p.w/2, p.y-16,'⭐ 무적!','#ff0');
  spawnParticles(p.x+p.w/2, p.y, 20, ['#ffe033','#ffaa00','#fff','#ffffaa','#ffdd00'],
    {speed:6, upBias:3, life:50, r:6, shape:'star'});
  startBGM(1.5);
}

function collectFire(){
  const p=player;
  p.fireTimer=600; p.fireCooldown=0;
  sndFire();
  score+=1000;
  addFloat(p.x+p.w/2, p.y-16,'🔥 불꽃! +1000','#ff6600');
  triggerScreenFlash('#ff4400',0.5,0.06);
  spawnParticles(p.x+p.w/2, p.y, 20,
    ['#ff4400','#ff8800','#ffcc00','#fff','#ff2200'],
    {speed:6, upBias:3, life:45, r:6, shape:'star'});
}

function collectLightning(){
  const p=player;
  sndLightning();
  score+=500;
  triggerScreenFlash('#ffffaa',0.9,0.05);
  // 화면 내 모든 살아있는 적 즉시 처치
  let killed=0;
  enemies.forEach(e=>{
    if(!e.alive||e.squished) return;
    if(Math.abs(e.x-(camX+W/2)) > W+50) return;
    e.squished=true; e.squishTimer=25;
    score+=150; killed++;
    spawnParticles(e.x+e.w/2, e.y+e.h/2, 18,
      ['#ffff00','#aaff00','#00ffff','#ffffff','#ffcc00'],
      {speed:7, upBias:4, life:40, r:6, shape:'star'});
  });
  if(killed>0){
    addFloat(p.x+p.w/2, p.y-24,`⚡ ${killed}마리 처치! +${killed*150}`,'#ffff00');
  } else {
    addFloat(p.x+p.w/2, p.y-24,'⚡ 번개! +500','#ffff00');
  }
  // 보스도 데미지
  if(boss&&boss.alive&&boss.hurtTimer===0){
    boss.hp--;
    boss.hurtTimer=60;
    if(boss.hp<=0){
      boss.alive=false;
      score+=5000;
      addFloat(boss.x+boss.w/2, boss.y-40,'👑 +5000','#ffd700');
    }
    spawnParticles(boss.x+boss.w/2, boss.y, 25,
      ['#ffff00','#00ffff','#ffffff'],{speed:8, upBias:4, life:50, r:7, shape:'star'});
  }
}

function collectInvisible(){
  const p=player;
  p.invisibleTimer=600;
  sndInvisible();
  score+=1000;
  addFloat(p.x+p.w/2, p.y-16,'👻 투명화! +1000','#aaccff');
  triggerScreenFlash('#aaccff',0.5,0.06);
  spawnParticles(p.x+p.w/2, p.y, 18,
    ['#aaccff','#ffffff','#88aaff','#ddaaff','#00ffff'],
    {speed:5, upBias:3, life:40, r:5, shape:'star'});
}

function collectBlackhole(){
  const p=player;
  p.blackholeTimer=600;
  sndBlackhole();
  score+=1000;
  addFloat(p.x+p.w/2, p.y-16,'🌀 블랙홀! +1000','#aa00ff');
  triggerScreenFlash('#330066',0.65,0.04);
  spawnParticles(p.x+p.w/2, p.y, 22,
    ['#8800ff','#bb44ff','#330066','#ffffff','#4400cc'],
    {speed:6, upBias:3, life:50, r:6, shape:'star'});
}

function collectGiantMushroom(){
  const p=player;
  const oldH=p.h, oldW=p.w;
  p.giant=true;
  p.big=true;
  p.giantTimer=600;
  p.powerupAnim=0; // 애니메이션 스킵
  // 발 위치 고정하고 크기 변경
  const feetY=p.y+oldH;
  p.h=GIANT_H;
  p.w=GIANT_W;
  p.y=feetY-GIANT_H;
  // 가로 중앙 정렬
  p.x=Math.max(0, Math.min(p.x-(GIANT_W-oldW)/2, LEVEL_W-GIANT_W));
  sndGiantMushroom();
  score+=3000;
  addFloat(p.x+p.w/2, p.y-20,'👑 대왕! +3000','#ff8800');
  spawnParticles(p.x+p.w/2, p.y+p.h/2, 30,
    ['#ff8800','#ffd700','#fff','#ff4400','#ffe033'],
    {speed:8, upBias:4, life:60, r:8, shape:'star'});
  startBGM(0.7); // 웅장한 저음 BGM
}
