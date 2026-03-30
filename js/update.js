// ═══════════════════════════════════════════════════════════════
//  Update
// ═══════════════════════════════════════════════════════════════
function update(){
  // 우주 스테이지: 감소된 중력
  const curGrav = stageIdx===5 ? GRAV*0.38 : GRAV;
  const maxFall = stageIdx===5 ? 7 : 16;

  // 스테이지 클리어: 파티클/폭죽만 업데이트
  if(gameState==='stageclear'||gameState==='allclear'){
    particles.forEach(pt=>{ pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=pt.gravity; pt.vx*=0.96; pt.life--; });
    particles=particles.filter(pt=>pt.life>0);
    if(Math.random()<0.07){
      const rx=camX+Math.random()*W;
      const ry=Math.random()*(H*0.55)+30;
      const palettes=[
        ['#ff4444','#ff8800','#ffff00','#fff'],
        ['#44ff44','#00ffcc','#4488ff','#fff'],
        ['#ff44ff','#ff8800','#ffee00','#fff'],
        ['#00ffff','#4444ff','#ff44ff','#fff'],
        ['#ffd700','#ffee44','#ffffff','#ff8800'],
      ];
      spawnParticles(rx, ry, 24, palettes[Math.floor(Math.random()*palettes.length)],
        {speed:5.5, upBias:1.5, life:60, r:5, shape:'star', gravity:0.06});
    }
    if(screenFlash){ screenFlash.alpha-=screenFlash.decay; if(screenFlash.alpha<=0) screenFlash=null; }
    return;
  }
  if(gameState==='title'||gameState==='gameover'||gameState==='win') return;
  if(gameState==='shop'){
    // 상점 중 파티클/플로트만 업데이트 (게임 일시정지)
    floatTexts.forEach(t=>{t.y+=t.vy;t.life--;});
    floatTexts=floatTexts.filter(t=>t.life>0);
    if(shopMsg && shopMsg.timer>0) shopMsg.timer--;
    return;
  }

  timeTimer++;
  if(timeTimer>=60){ timeTimer=0; timeLeft=Math.max(0,timeLeft-1); }
  if(timeLeft===0) killPlayer();

  floatTexts.forEach(t=>{t.y+=t.vy;t.life--;});
  floatTexts=floatTexts.filter(t=>t.life>0);

  // 파티클 업데이트
  particles.forEach(pt=>{
    pt.x+=pt.vx; pt.y+=pt.vy;
    pt.vy+=pt.gravity;
    pt.vx*=0.96;
    pt.life--;
  });
  particles=particles.filter(pt=>pt.life>0);

  if(gameState==='dead'){
    player.deadTimer--;
    player.vy+=curGrav*0.5; player.y+=player.vy;
    if(player.deadTimer<=0){
      lives--;
      if(lives<=0){ gameState='gameover'; stopBGM(); sndGameOver(); return; }
      initLevel(); gameState='playing'; startBGM(1+stageIdx*0.05);
    }
    return;
  }

  const p=player;

  // 성장 애니 (대왕 상태가 아닐 때만)
  if(!p.giant && p.powerupAnim>0){
    p.powerupAnim--;
    const flash=Math.floor(p.powerupAnim/5)%2===0;
    p.h = flash ? BIG_H : SML_H;
  } else if(!p.giant && p.big && p.h!==BIG_H){ p.h=BIG_H; }

  // 대왕 버섯 타이머 처리
  if(p.giantTimer>0){
    p.giantTimer--;
    if(p.giantTimer===0){
      // 대왕 종료 → 일반 큰 마리오로 복귀
      p.giant=false;
      const feetY=p.y+p.h;
      p.w=24; p.h=BIG_H;
      p.y=feetY-BIG_H;
      p.x=Math.max(0, Math.min(p.x+(GIANT_W-24)/2, LEVEL_W-24));
      p.big=true;
      p.invincible=60;
      if(p.starTimer>0) startBGM(1.5);
      else startBGM(1+stageIdx*0.05);
      addFloat(p.x+p.w/2, p.y-20,'대왕 종료!','#ff8800');
      spawnParticles(p.x+p.w/2, p.y+p.h/2, 20,
        ['#ff8800','#ffcc00','#fff'],{speed:5,upBias:3,life:40,r:5});
    }
  }

  // 불꽃 타이머
  if(p.fireTimer>0) p.fireTimer--;
  if(p.fireCooldown>0) p.fireCooldown--;

  // 상점 부스트 타이머
  if(p.jumpBoostTimer>0) p.jumpBoostTimer--;
  if(p.speedBoostTimer>0) p.speedBoostTimer--;

  // 투명화 타이머
  if(p.invisibleTimer>0) p.invisibleTimer--;

  // 블랙홀 타이머
  if(p.blackholeTimer>0) p.blackholeTimer--;
  if(p.blackholeAbilityTimer>0) p.blackholeAbilityTimer--;

  // 흡입 상태 (X키 + 블랙홀 남아있을 때)
  p.sucking = !!(keys['KeyX'] && p.blackholeTimer>0 && p.state!=='dead' && p.state!=='win');
  if(p.sucking && Math.random()<0.05) sndSuck();

  // 별 무적 처리
  if(p.starTimer>0){
    p.starTimer--;
    p.invincible=p.starTimer>0 ? p.starTimer : 0;
    p.invincibleTick++;
    if(p.invincibleTick%30===0) sndInvincibleTick();
    if(p.starTimer===0) startBGM(1+stageIdx*0.05);
  }

  // Win walk
  if(p.state==='win'){
    const waitingPartner = isMultiplayer && !partnerGoaled;
    if(p.winTimer<=120){
      // 골인 후 2초간 우측으로 걷는 애니메이션
      p.x+=2; p.winTimer++;
      p.frameTimer++; if(p.frameTimer>8){p.frame=(p.frame+1)%2;p.frameTimer=0;}
    } else if(waitingPartner){
      // 파트너 대기 중: 제자리 idle 애니메이션 유지
      p.frameTimer++; if(p.frameTimer>12){p.frame=(p.frame+1)%2;p.frameTimer=0;}
    }
    if(p.winTimer>120 && !waitingPartner){
      // 솔로이거나 파트너도 골인 → 스테이지 클리어
      stopBGM(); sndWin();
      clearedStage=stageIdx;
      gameState='stageclear';
      triggerScreenFlash('#ffffff',0.8,0.025);
    }
    resolvePlayer(p);
    camX=Math.min(Math.max(p.x-W/2,0),LEVEL_W-W);
    return;
  }

  // 파이어볼 발사 (Z키)
  if(keys['KeyZ'] && p.fireTimer>0 && p.fireCooldown===0 && p.state!=='dead' && p.state!=='win'){
    const fbx = p.facing===1 ? p.x+p.w : p.x-12;
    fireballs.push({x:fbx, y:p.y+(p.h*0.4), vx:p.facing*10, vy:-2,
      alive:true, bounced:false, frame:0, frameTimer:0});
    p.fireCooldown=20;
    sndFireball();
  }

  // P1/P2 공통: 방향키(이동) + ArrowUp/Space(점프) + Shift(달리기)
  const left  = keys['ArrowLeft']  || keys['KeyA'];
  const right = keys['ArrowRight'] || keys['KeyD'];
  const jumpK = keys['Space'] || keys['ArrowUp'];
  const shift = keys['ShiftLeft'] || keys['ShiftRight'];

  const abilitySpeedMult = (p.blackholeAbility==='speed' && p.blackholeAbilityTimer>0) ? 1.8 : 1.0;
  const shopSpeedMult = (p.speedBoostTimer > 0) ? 1.5 : 1.0;
  const curSpd = (shift ? RUN_SPD : SPD) * abilitySpeedMult * shopSpeedMult;
  const accel  = (shift ? 0.9 : 0.6) * abilitySpeedMult;
  // 협력 카메라: 화면 오른쪽 끝 근접 시 우측 이동만 감속 (이전 프레임 camX 기준)
  const _rtLim = (typeof isMultiplayer!=='undefined'&&isMultiplayer&&remotePlayer&&typeof remotePlayer.x==='number')
    ? camX+W-48 : Infinity;
  const _distLim = _rtLim-(p.x+p.w);
  const _camSpd = _distLim>=120 ? curSpd : (_distLim<=0 ? 0 : curSpd*_distLim/120);
  p.running = shift && (left||right) && p.onGround;

  if(left) {p.vx=Math.max(p.vx-accel,-curSpd);p.facing=-1;}
  if(right){p.vx=Math.min(p.vx+accel, _camSpd);p.facing= 1;}
  if(!left&&!right){p.vx*=0.78;if(Math.abs(p.vx)<0.2)p.vx=0;}

  if(p.jumpCooldown>0) p.jumpCooldown--;
  if(jumpK&&p.jumpHeld&&p.jumpTimer>0&&!p.lastJumpWas2nd){
    p.jumpTimer--;
    p.vy=Math.min(p.vy,JUMP_V+(12-p.jumpTimer)*0.5);
  } else if(!jumpK){ p.jumpHeld=false; }

  const abilityGrav = (p.blackholeAbility==='float' && p.blackholeAbilityTimer>0) ? 0.15 : 1.0;
  p.vy=Math.min(p.vy+curGrav*abilityGrav, maxFall);
  p.x+=p.vx; p.x=Math.max(0,Math.min(p.x,LEVEL_W-p.w));
  p.y+=p.vy;
  resolvePlayer(p);
  // 협력 카메라: 화면 오른쪽 경계 초과 강제 보정
  if(p.x+p.w>_rtLim){ p.x=_rtLim-p.w; if(p.vx>0) p.vx=0; }

  if(p.y>H+80) killPlayer();
  // 실드 능력 중엔 invincible 유지
  if(p.blackholeAbility==='shield'&&p.blackholeAbilityTimer>0) p.invincible=Math.max(p.invincible,2);
  if(p.invincible>0&&p.starTimer===0) p.invincible--;

  p.frameTimer++;
  if(p.onGround){
    p.state=Math.abs(p.vx)>0.3?'run':'idle';
    const fs=Math.abs(p.vx)>5?3:(Math.abs(p.vx)>2?5:10);
    if(p.frameTimer>fs){p.frame=(p.frame+1)%4;p.frameTimer=0;}
    // 먼지 이펙트 (달릴 때)
    if(p.running && Math.abs(p.vx)>4.5){
      p.dustTimer++;
      if(p.dustTimer%3===0){
        const fx=p.facing===1?p.x:p.x+p.w;
        spawnParticles(fx, p.y+p.h, 2,
          ['#bbbbbb','#999999','#dddddd','#cccccc'],
          {speed:1.2, upBias:0.2, life:20, r:4, gravity:false});
      }
    } else { p.dustTimer=0; }
  } else { p.state='jump'; p.dustTimer=0; }

  // 협력 카메라: 뒤처진 플레이어 기준, 부드러운 보간
  if(typeof isMultiplayer!=='undefined'&&isMultiplayer&&remotePlayer&&typeof remotePlayer.x==='number'){
    const laggingX=Math.min(p.x, remotePlayer.x);
    const targetCam=Math.min(Math.max(laggingX-80,0),LEVEL_W-W);
    camX=Math.round(camX+(targetCam-camX)*0.15);
  } else {
    camX=Math.min(Math.max(p.x-W/3,0),LEVEL_W-W);
  }
  qblocks.forEach(q=>{if(q.bounceY<0){q.bounceY+=2;if(q.bounceY>0)q.bounceY=0;}});

  // Power-ups
  powerups.forEach(pw=>{
    if(!pw.alive) return;
    pw.frameTimer++; if(pw.frameTimer>8){pw.frame=(pw.frame+1)%4;pw.frameTimer=0;}
    if(pw.emerging){
      pw.y-=1.5;
      if(pw.y<=pw.emergeY){ pw.y=pw.emergeY; pw.emerging=false; }
      return;
    }
    pw.vy=Math.min(pw.vy+GRAV,16);
    pw.x+=pw.vx; pw.y+=pw.vy;
    resolvePowerup(pw);
    if(pw.type==='star'&&pw.onGround) pw.vy=-9;
    if(pw.type==='blackhole'&&pw.onGround) pw.vy=-5;
    if(pw.y>H+50){ pw.alive=false; return; }
    if(pw.x<0||pw.x>LEVEL_W) { pw.vx*=-1; }
    if(overlap(p.x,p.y,p.w,p.h,pw.x,pw.y,pw.w,pw.h)){
      pw.alive=false;
      if(pw.type==='mushroom') collectMushroom();
      else if(pw.type==='star')  collectStar();
      else if(pw.type==='giant_mushroom') collectGiantMushroom();
      else if(pw.type==='fire')  collectFire();
      else if(pw.type==='lightning') collectLightning();
      else if(pw.type==='invisible') collectInvisible();
      else if(pw.type==='blackhole') collectBlackhole();
    }
  });
  powerups=powerups.filter(pw=>pw.alive||pw.emerging);

  // 파이어볼 업데이트
  fireballs.forEach(fb=>{
    if(!fb.alive) return;
    fb.vy=Math.min(fb.vy+0.45, 12);
    fb.x+=fb.vx; fb.y+=fb.vy;
    fb.frameTimer++; if(fb.frameTimer>3){fb.frame=(fb.frame+1)%4;fb.frameTimer=0;}
    // 바닥/플랫폼 충돌
    let hitFloor=false;
    for(const pl of platforms){
      const ph=pl.h||TILE;
      if(overlap(fb.x,fb.y,12,12,pl.x,pl.y,pl.w,ph)){
        if(!fb.bounced && fb.vy>0){
          fb.vy*=-0.55; fb.vx*=0.8; fb.bounced=true;
        } else { hitFloor=true; break; }
      }
    }
    if(hitFloor||fb.x<0||fb.x>LEVEL_W||fb.y>H+30){
      fb.alive=false;
      spawnParticles(fb.x, fb.y, 8, ['#ff6600','#ff8800','#ffcc00'],{speed:3,upBias:1,life:20,r:4});
      return;
    }
    // 적 충돌
    enemies.forEach((e,_fei)=>{
      if(!e.alive||e.squished||!fb.alive) return;
      if(overlap(fb.x,fb.y,12,12,e.x,e.y,e.w,e.h)){
        fb.alive=false;
        e.squished=true; e.squishTimer=25;
        score+=150;
        addFloat(e.x+e.w/2, e.y-20,'+150🔥','#ff6600'); sndFireballHit();
        spawnParticles(e.x+e.w/2, e.y, 18,
          ['#ff4400','#ff8800','#ffcc00','#fff'],{speed:5,upBias:3,life:35,r:5,shape:'star'});
        emitGameEvent('enemy',_fei);
      }
    });
    // 보스 충돌
    if(boss&&boss.alive&&fb.alive&&boss.hurtTimer===0&&overlap(fb.x,fb.y,12,12,boss.x,boss.y,boss.w,boss.h)){
      fb.alive=false;
      boss.hp--; boss.hurtTimer=60;
      sndFireballHit();
      addFloat(boss.x+boss.w/2, boss.y-20,`💥 HP:${boss.hp}`,'#ff6600');
      spawnParticles(boss.x+boss.w/2, boss.y+boss.h/2, 20,
        ['#ff4400','#ff8800','#ffcc00','#fff'],{speed:6,upBias:3,life:45,r:6});
      if(boss.hp<=0){
        boss.alive=false; score+=5000;
        addFloat(boss.x+boss.w/2, boss.y-40,'👑 +5000','#ffd700');
        for(let i=0;i<5;i++) setTimeout(()=>spawnParticles(
          boss.x+Math.random()*boss.w, boss.y+Math.random()*boss.h, 15,
          ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff','#00ffff'],
          {speed:7, upBias:4, life:50, r:7, shape:'star'}),i*120);
      }
    }
  });
  fireballs=fireballs.filter(fb=>fb.alive);

  // screenFlash 업데이트
  if(screenFlash){
    screenFlash.alpha-=screenFlash.decay;
    if(screenFlash.alpha<=0) screenFlash=null;
  }

  // Enemies
  enemies.forEach((e,_ei)=>{
    if(!e.alive) return;
    if(e.squished){e.squishTimer--;if(e.squishTimer<=0)e.alive=false;return;}
    if(Math.abs(e.x-(camX+W/2))>W+100) return;
    e.frameTimer++; if(e.frameTimer>((e.type==='bat'||e.type==='ufo')?8:12)){e.frame=(e.frame+1)%2;e.frameTimer=0;}

    // 흡입 처리
    if(p.sucking && p.blackholeTimer>0){
      const mouthX = p.x+(p.facing===1 ? p.w+10 : -10);
      const mouthY = p.y+p.h*0.4;
      const dx = mouthX-(e.x+e.w/2);
      const dy = mouthY-(e.y+e.h/2);
      const dist = Math.sqrt(dx*dx+dy*dy);
      const inFront = p.facing===1 ? e.x+e.w/2>p.x-30 : e.x+e.w/2<p.x+p.w+30;
      if(dist<220 && inFront){
        if(dist<22){
          e.alive=false;
          grantBlackholeAbility(e.type);
          sndAbsorb();
          score+=200;
          addFloat(e.x+e.w/2, e.y-20,'💫 흡수! +200','#aa00ff');
          spawnParticles(e.x+e.w/2, e.y+e.h/2, 22,
            ['#8800ff','#bb00ff','#00ffff','#ffffff'],
            {speed:6, upBias:3, life:35, r:6, shape:'star'});
          emitGameEvent('enemy',_ei);
          return;
        }
        const pull=Math.min(2.8, 45/dist);
        e.vx+=dx/dist*pull; e.vy+=dy/dist*pull;
        const spd=Math.sqrt(e.vx*e.vx+e.vy*e.vy);
        if(spd>5){e.vx=e.vx/spd*5; e.vy=e.vy/spd*5;}
        if(Math.random()<0.15) spawnParticles(e.x+e.w/2,e.y+e.h/2,1,
          ['#8800ff','#aa44ff','#ffffff'],{speed:0.5,life:12,r:2.5,gravity:false});
        e.x+=e.vx; e.y+=e.vy;
        if(e.y>H+50){e.alive=false;return;}
        return; // 흡입 중: 일반 AI 및 플레이어 충돌 스킵
      }
    }

    if(e.type==='bat'||e.type==='ufo'){
      // 박쥐/UFO: 투명화 중엔 추적 안함
      const dx=(p.x+p.w/2)-(e.x+e.w/2);
      const dy=(p.y+p.h/2)-(e.y+e.h/2);
      const dist=Math.sqrt(dx*dx+dy*dy);
      const seekRange = e.type==='ufo' ? 450 : 380;
      const topSpeed  = e.type==='ufo' ? 3.0 : 2.5;
      if(dist<seekRange && p.invisibleTimer===0){
        e.vx+=(dx>0?0.06:-0.06);
        e.vy+=(dy>0?0.06:-0.06);
      } else {
        e.vy=Math.sin(Date.now()*0.002+e.x*0.005)*1.5;
        e.vx*=0.97;
      }
      e.vx=Math.max(-topSpeed,Math.min(topSpeed,e.vx))*0.98;
      e.vy=Math.max(-topSpeed,Math.min(topSpeed,e.vy));
      e.x+=e.vx; e.y+=e.vy;
      if(e.y<50){e.y=50;e.vy=0;}
      if(e.y>GND_Y-e.h){e.y=GND_Y-e.h;e.vy=0;}
    } else {
      // 일반 적 (goomba, koopa, skeleton, alien)
      e.vy=Math.min(e.vy+curGrav, maxFall);
      e.x+=e.vx; e.y+=e.vy;
      resolveEnemy(e);
      if(e.onGround){
        const ax=e.vx>0?e.x+e.w+2:e.x-2;
        if(!platforms.some(pl=>{return ax>=pl.x&&ax<=pl.x+pl.w&&Math.abs((e.y+e.h)-pl.y)<8;}))
          e.vx*=-1;
      }
    }
    if(e.y>H+50){e.alive=false;return;}

    if(overlap(p.x,p.y,p.w,p.h,e.x,e.y,e.w,e.h)){
      // 투명화 중엔 적 충돌 무효
      if(p.invisibleTimer>0) return;
      if(p.starTimer>0 || p.giantTimer>0){
        e.squished=true; e.squishTimer=20;
        const pts=p.giantTimer>0?300:200;
        const tag=p.giantTimer>0?'+300👑':'+200⭐';
        const clr=p.giantTimer>0
          ?['#ff8800','#ffd700','#fff','#ff4400']
          :['#ff4444','#ff8800','#ffff00','#fff'];
        score+=pts;
        addFloat(e.x+e.w/2,e.y-20,tag,'#ff8800'); sndStomp();
        spawnParticles(e.x+e.w/2, e.y, 12, clr,
          {speed:4, upBias:2, life:30, r:4});
        emitGameEvent('enemy',_ei);
      } else if(p.vy>0&&p.y+p.h<e.y+14){
        e.squished=true; e.squishTimer=30;
        p.vy=-8; p.jumpsLeft=2; p.lastJumpWas2nd=false;
        score+=100;
        addFloat(e.x+e.w/2,e.y-20,'+100','#0f0'); sndStomp();
        const clr = e.type==='goomba' ? ['#8b4513','#c06030','#fff','#ffcc88']
          : e.type==='koopa'   ? ['#406820','#80c040','#fff','#aaffaa']
          : e.type==='alien'   ? ['#00cc44','#44ff88','#fff','#aaffcc']
          : e.type==='ufo'     ? ['#4488ff','#88ccff','#fff','#aaddff']
          : ['#c0c0c4','#888888','#fff','#cccccc'];
        spawnParticles(e.x+e.w/2, e.y, 14, clr, {speed:5, upBias:3, life:35, r:5});
        emitGameEvent('enemy',_ei);
      } else {
        takeDamage();
      }
    }
  });

  // Coins
  coins.forEach((c,_ci)=>{
    if(!c.alive) return;
    c.frameTimer++; if(c.frameTimer>8){c.frame=(c.frame+1)%4;c.frameTimer=0;}
    if(overlap(p.x,p.y,p.w,p.h,c.x-8,c.y-8,c.w,c.h)){
      c.alive=false; coinCount++; score+=50;
      addFloat(c.x,c.y-10,'+50','#ffe033'); sndCoin();
      spawnParticles(c.x, c.y, 12, ['#ffe033','#ffcc00','#fff','#ffd700','#ffee88'],
        {speed:4, upBias:3, life:35, r:5, shape:'star'});
      triggerScreenFlash('#ffdd00',0.12,0.08);
      emitGameEvent('coin',_ci);
    }
  });

  // 보스 업데이트
  if(boss && boss.alive) updateBoss();

  // 골 체크
  if(!boss){
    if(p.x+p.w>=FLAG_X&&p.state!=='win'){
      p.state='win'; p.winTimer=0; p.vx=2; p.vy=0;
      addFloat(FLAG_X,GND_Y-80,'🎉 클리어!','#ff0');
      score+=timeLeft*10;
      notifyGoal();
    }
  } else {
    if(!boss.alive && p.x+p.w>=FLAG_X&&p.state!=='win'){
      p.state='win'; p.winTimer=0; p.vx=2; p.vy=0;
      addFloat(FLAG_X,GND_Y-80,'🏆 BOSS 처치!','#ff0');
      score+=timeLeft*10+5000;
      notifyGoal();
    }
  }
}

// ─ 보스 AI ──────────────────────────────────────────────────────
function updateBoss(){
  const b=boss;
  if(b.hurtTimer>0) b.hurtTimer--;

  b.frameTimer++; if(b.frameTimer>10){b.frame=(b.frame+1)%4;b.frameTimer=0;}
  b.vy=Math.min(b.vy+GRAV,16);
  b.x+=b.vx; b.y+=b.vy;
  resolveBoss(b);

  b.jumpTimer++;
  const px=player.x;
  if(b.jumpTimer>90&&b.onGround){
    b.vy=-12; b.vx=(px<b.x?-1:1)*3.5;
    b.jumpTimer=0;
  }
  if(b.x<100||b.x>LEVEL_W-200) b.vx*=-1;
  if(b.y>H+100){ b.alive=false; return; }

  const p=player;
  if(overlap(p.x,p.y,p.w,p.h,b.x,b.y,b.w,b.h)){
    if(b.hurtTimer===0 && p.giantTimer>0){
      // 대왕: 접촉만으로 보스 피격
      b.hp--;
      b.hurtTimer=60;
      sndStomp();
      spawnParticles(b.x+b.w/2, b.y+b.h/2, 20,
        ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff'],
        {speed:6, upBias:3, life:45, r:6});
      addFloat(b.x+b.w/2, b.y-20, `💥 HP:${b.hp}`, '#ff8800');
      if(b.hp<=0){
        b.alive=false;
        score+=5000;
        addFloat(b.x+b.w/2, b.y-40,'👑 +5000','#ffd700');
        for(let i=0;i<5;i++){
          setTimeout(()=>spawnParticles(
            b.x+Math.random()*b.w, b.y+Math.random()*b.h, 15,
            ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff','#00ffff'],
            {speed:7, upBias:4, life:50, r:7, shape:'star'}
          ), i*120);
        }
      }
    } else if(b.hurtTimer===0 && p.vy>0 && p.y+p.h<b.y+20){
      b.hp--;
      b.hurtTimer=60;
      p.vy=-10; p.jumpsLeft=2;
      sndStomp();
      spawnParticles(b.x+b.w/2, b.y+b.h/2, 20,
        ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff'],
        {speed:6, upBias:3, life:45, r:6});
      addFloat(b.x+b.w/2, b.y-20, `💥 HP:${b.hp}`, '#ff0');
      if(b.hp<=0){
        b.alive=false;
        score+=5000;
        addFloat(b.x+b.w/2, b.y-40,'👑 +5000','#ffd700');
        for(let i=0;i<5;i++){
          setTimeout(()=>spawnParticles(
            b.x+Math.random()*b.w, b.y+Math.random()*b.h, 15,
            ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff','#00ffff'],
            {speed:7, upBias:4, life:50, r:7, shape:'star'}
          ), i*120);
        }
      }
    } else if(b.hurtTimer===0){
      takeDamage();
    }
  }
}

function grantBlackholeAbility(type){
  const p=player;
  if(type==='alien'){
    p.blackholeAbility='speed';
    p.blackholeAbilityTimer=360;
    addFloat(p.x+p.w/2, p.y-22,'⚡ 외계인 스피드!','#00ff88');
    triggerScreenFlash('#00ff88',0.4,0.06);
    spawnParticles(p.x+p.w/2, p.y+p.h/2, 14,
      ['#00ff88','#88ffcc','#ffffff'],{speed:5,upBias:3,life:35,r:5,shape:'star'});
  } else if(type==='ufo'){
    p.blackholeAbility='lightning';
    p.blackholeAbilityTimer=360;
    addFloat(p.x+p.w/2, p.y-28,'⚡ UFO 번개 파워!','#00ccff');
    triggerScreenFlash('#00ccff',0.6,0.05);
    collectLightning(); // 즉시 번개 폭발
  } else if(type==='skeleton'){
    p.blackholeAbility='shield';
    p.blackholeAbilityTimer=360;
    p.invincible=360;
    addFloat(p.x+p.w/2, p.y-22,'🛡 해골 실드!','#ffffff');
    triggerScreenFlash('#ffffff',0.5,0.05);
    spawnParticles(p.x+p.w/2, p.y+p.h/2, 14,
      ['#ffffff','#aaaacc','#ddddff'],{speed:5,upBias:3,life:35,r:5,shape:'star'});
  } else if(type==='bat'){
    p.blackholeAbility='float';
    p.blackholeAbilityTimer=360;
    addFloat(p.x+p.w/2, p.y-22,'🌊 박쥐 부유!','#aaffcc');
    triggerScreenFlash('#aaffcc',0.4,0.06);
    spawnParticles(p.x+p.w/2, p.y+p.h/2, 14,
      ['#aaffcc','#88ffbb','#ccffee'],{speed:4,upBias:3,life:35,r:5,shape:'star'});
  }
}

function killPlayer(){
  if(player.state==='dead') return;
  if(player.giant){
    player.giant=false;
    player.w=24; player.h=BIG_H;
  }
  player.state='dead'; player.vx=0; player.vy=-12;
  player.deadTimer=90; gameState='dead';
  stopBGM(); sndDead();
  setTimeout(()=>{ if(gameState==='dead') startBGM(1+stageIdx*0.05); }, 1500);
}
