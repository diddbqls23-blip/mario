// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════
const TILE    = 32;
const GRAV    = 0.55;
const JUMP_V  = -13;
const JUMP2_V = -11;
const SPD     = 4.0;
const RUN_SPD = 7.0;
const LEVEL_W = 7200;
const GND_Y   = H - TILE;   // 418
const SML_H   = 32, BIG_H = 52;
const GIANT_H = Math.floor(H/2);                    // 225 (화면 절반)
const GIANT_W = Math.round(24 * GIANT_H / BIG_H);  // ~104 (비례 너비)

// ═══════════════════════════════════════════════════════════════
//  Stage definitions  (stageIdx = 0/1/2)
// ═══════════════════════════════════════════════════════════════

// ── Stage 1: 평원 ────────────────────────────────────────────────
const STAGE1 = (() => {
  const rawPlatforms = [
    {x:0,    y:GND_Y, w:2400, type:'ground'},
    {x:2560, y:GND_Y, w:1600, type:'ground'},
    {x:4320, y:GND_Y, w:960,  type:'ground'},
    {x:5440, y:GND_Y, w:1760, type:'ground'},
    {x:300,  y:GND_Y-96,  w:96,  type:'brick'},
    {x:432,  y:GND_Y-128, w:32,  type:'qblock', reward:'mushroom'},
    {x:560,  y:GND_Y-96,  w:64,  type:'brick'},
    {x:800,  y:GND_Y-128, w:32,  type:'qblock', reward:'coin'},
    {x:864,  y:GND_Y-128, w:32,  type:'brick'},
    {x:896,  y:GND_Y-128, w:32,  type:'qblock', reward:'mushroom'},
    {x:928,  y:GND_Y-128, w:32,  type:'brick'},
    {x:960,  y:GND_Y-128, w:32,  type:'qblock', reward:'coin'},
    {x:1100, y:GND_Y-160, w:128, type:'brick'},
    {x:1300, y:GND_Y-96,  w:96,  type:'brick'},
    {x:1440, y:GND_Y-128, w:32,  type:'qblock', reward:'fire'},
    {x:1472, y:GND_Y-128, w:32,  type:'qblock', reward:'lightning'},
    {x:1600, y:GND_Y-192, w:160, type:'brick'},
    {x:1800, y:GND_Y-96,  w:128, type:'brick'},
    {x:2000, y:GND_Y-128, w:32,  type:'qblock', reward:'star'},
    {x:2048, y:GND_Y-192, w:32,  type:'qblock', reward:'giant_mushroom'},
    {x:2080, y:GND_Y-128, w:96,  type:'brick'},
    {x:2200, y:GND_Y-192, w:128, type:'brick'},
    {x:2700, y:GND_Y-128, w:160, type:'brick'},
    {x:2900, y:GND_Y-96,  w:96,  type:'brick'},
    {x:3050, y:GND_Y-160, w:32,  type:'qblock', reward:'mushroom'},
    {x:3200, y:GND_Y-128, w:192, type:'brick'},
    {x:3450, y:GND_Y-192, w:128, type:'brick'},
    {x:3600, y:GND_Y-96,  w:64,  type:'brick'},
    {x:3750, y:GND_Y-128, w:32,  type:'qblock', reward:'coin'},
    {x:3850, y:GND_Y-160, w:160, type:'brick'},
    {x:4050, y:GND_Y-96,  w:96,  type:'brick'},
    {x:4150, y:GND_Y-128, w:32,  type:'qblock', reward:'mushroom'},
    {x:4500, y:GND_Y-128, w:160, type:'brick'},
    {x:4700, y:GND_Y-192, w:128, type:'brick'},
    {x:4900, y:GND_Y-128, w:64,  type:'brick'},
    {x:5000, y:GND_Y-96,  w:32,  type:'qblock', reward:'star'},
    {x:5100, y:GND_Y-160, w:192, type:'brick'},
    {x:5350, y:GND_Y-128, w:96,  type:'brick'},
    {x:5600, y:GND_Y-128, w:128, type:'brick'},
    {x:5800, y:GND_Y-160, w:32,  type:'qblock', reward:'fire'},
    {x:5832, y:GND_Y-160, w:32,  type:'qblock', reward:'invisible'},
    {x:5900, y:GND_Y-96,  w:160, type:'brick'},
    {x:6100, y:GND_Y-128, w:96,  type:'brick'},
    {x:6300, y:GND_Y-192, w:128, type:'brick'},
  ];
  const pipeDefs = [
    {x:480,h:64},{x:900,h:96},{x:1500,h:64},{x:2100,h:96},
    {x:2800,h:64},{x:3500,h:80},{x:4400,h:64},{x:5200,h:96},
    {x:6000,h:64},{x:6600,h:80},
  ];
  const platforms = [...rawPlatforms];
  pipeDefs.forEach(p=>{
    platforms.push({x:p.x, y:GND_Y-p.h,    w:64, type:'pipe_top'});
    if(p.h>32) platforms.push({x:p.x, y:GND_Y-p.h+32, w:64, h:p.h-32, type:'pipe_body'});
  });

  const rawCoins = [];
  function coinArc(cx,y,n,sp){
    for(let i=0;i<n;i++){
      const f=n===1?0:i/(n-1);
      rawCoins.push({x:cx-sp/2+f*sp, y:y-Math.sin(f*Math.PI)*32});
    }
  }
  coinArc(350,GND_Y-130,5,100); coinArc(870,GND_Y-160,7,140); coinArc(1140,GND_Y-200,5,96);
  coinArc(1450,GND_Y-130,5,100); coinArc(1640,GND_Y-230,7,128); coinArc(1850,GND_Y-130,5,100);
  coinArc(2050,GND_Y-160,7,140); coinArc(2240,GND_Y-230,5,96); coinArc(2730,GND_Y-160,5,120);
  coinArc(2950,GND_Y-130,5,100); coinArc(3250,GND_Y-160,7,160); coinArc(3500,GND_Y-230,5,96);
  coinArc(3640,GND_Y-130,5,100); coinArc(3900,GND_Y-200,7,140); coinArc(4060,GND_Y-130,5,96);
  coinArc(4540,GND_Y-160,7,140); coinArc(4750,GND_Y-230,5,100); coinArc(5150,GND_Y-200,7,160);
  coinArc(5420,GND_Y-160,5,96);  coinArc(5640,GND_Y-160,5,100); coinArc(5850,GND_Y-200,7,140);
  coinArc(6140,GND_Y-160,5,100); coinArc(6380,GND_Y-230,5,96);

  const enemySpawns = [
    {x:500,type:'goomba'},{x:700,type:'goomba'},{x:900,type:'goomba'},
    {x:1200,type:'goomba'},{x:1400,type:'goomba'},{x:1650,type:'koopa'},
    {x:1900,type:'goomba'},{x:2050,type:'goomba'},{x:2200,type:'koopa'},
    {x:2700,type:'goomba'},{x:2900,type:'goomba'},{x:3100,type:'koopa'},
    {x:3300,type:'goomba'},{x:3500,type:'goomba'},{x:3700,type:'koopa'},
    {x:3900,type:'goomba'},{x:4100,type:'goomba'},{x:4400,type:'koopa'},
    {x:4600,type:'goomba'},{x:4800,type:'goomba'},{x:5000,type:'koopa'},
    {x:5200,type:'goomba'},{x:5400,type:'goomba'},{x:5600,type:'koopa'},
    {x:5800,type:'goomba'},{x:6000,type:'goomba'},{x:6200,type:'koopa'},
    {x:6400,type:'goomba'},{x:6600,type:'goomba'},
  ];

  return { platforms, rawCoins, enemySpawns, bg:'plains' };
})();

// ── Stage 2: 사막 (Desert) ──────────────────────────────────────
const STAGE2 = (() => {
  const rawPlatforms = [
    {x:0,    y:GND_Y, w:2200, type:'ground'},
    {x:2400, y:GND_Y, w:1800, type:'ground'},
    {x:4400, y:GND_Y, w:800,  type:'ground'},
    {x:5400, y:GND_Y, w:1800, type:'ground'},
    {x:250,  y:GND_Y-96,  w:64,  type:'brick'},
    {x:400,  y:GND_Y-160, w:32,  type:'qblock', reward:'coin'},
    {x:500,  y:GND_Y-96,  w:96,  type:'brick'},
    {x:700,  y:GND_Y-128, w:32,  type:'qblock', reward:'fire'},
    {x:850,  y:GND_Y-192, w:128, type:'brick'},
    {x:1050, y:GND_Y-128, w:32,  type:'qblock', reward:'lightning'},
    {x:1200, y:GND_Y-160, w:96,  type:'brick'},
    {x:1400, y:GND_Y-96,  w:32,  type:'qblock', reward:'invisible'},
    {x:1550, y:GND_Y-192, w:128, type:'brick'},
    {x:1750, y:GND_Y-128, w:32,  type:'qblock', reward:'fire'},
    {x:1900, y:GND_Y-96,  w:96,  type:'brick'},
    {x:2100, y:GND_Y-160, w:32,  type:'qblock', reward:'coin'},
    {x:2500, y:GND_Y-128, w:160, type:'brick'},
    {x:2750, y:GND_Y-192, w:96,  type:'brick'},
    {x:2950, y:GND_Y-128, w:32,  type:'qblock', reward:'mushroom'},
    {x:3100, y:GND_Y-160, w:128, type:'brick'},
    {x:3350, y:GND_Y-96,  w:64,  type:'brick'},
    {x:3500, y:GND_Y-192, w:32,  type:'qblock', reward:'star'},
    {x:3548, y:GND_Y-256, w:32,  type:'qblock', reward:'giant_mushroom'},
    {x:3650, y:GND_Y-128, w:160, type:'brick'},
    {x:3900, y:GND_Y-96,  w:96,  type:'brick'},
    {x:4050, y:GND_Y-160, w:32,  type:'qblock', reward:'coin'},
    {x:4500, y:GND_Y-128, w:128, type:'brick'},
    {x:4700, y:GND_Y-192, w:64,  type:'brick'},
    {x:4900, y:GND_Y-128, w:32,  type:'qblock', reward:'mushroom'},
    {x:5100, y:GND_Y-160, w:128, type:'brick'},
    {x:5450, y:GND_Y-96,  w:96,  type:'brick'},
    {x:5650, y:GND_Y-128, w:32,  type:'qblock', reward:'star'},
    {x:5800, y:GND_Y-192, w:128, type:'brick'},
    {x:6000, y:GND_Y-128, w:96,  type:'brick'},
    {x:6200, y:GND_Y-160, w:32,  type:'qblock', reward:'mushroom'},
    {x:6400, y:GND_Y-96,  w:128, type:'brick'},
  ];
  const pipeDefs = [
    {x:460,h:80},{x:980,h:64},{x:1480,h:96},{x:2050,h:80},
    {x:2820,h:64},{x:3480,h:96},{x:4350,h:80},{x:5050,h:64},
    {x:5780,h:96},{x:6500,h:80},
  ];
  const platforms = [...rawPlatforms];
  pipeDefs.forEach(p=>{
    platforms.push({x:p.x, y:GND_Y-p.h,    w:64, type:'pipe_top'});
    if(p.h>32) platforms.push({x:p.x, y:GND_Y-p.h+32, w:64, h:p.h-32, type:'pipe_body'});
  });

  const rawCoins = [];
  function coinArc(cx,y,n,sp){
    for(let i=0;i<n;i++){
      const f=n===1?0:i/(n-1);
      rawCoins.push({x:cx-sp/2+f*sp, y:y-Math.sin(f*Math.PI)*32});
    }
  }
  coinArc(300,GND_Y-130,5,100);  coinArc(750,GND_Y-200,7,130);  coinArc(1100,GND_Y-160,5,96);
  coinArc(1500,GND_Y-230,7,140); coinArc(1800,GND_Y-130,5,100); coinArc(2150,GND_Y-160,5,96);
  coinArc(2600,GND_Y-200,7,140); coinArc(2900,GND_Y-230,5,100); coinArc(3200,GND_Y-160,7,150);
  coinArc(3700,GND_Y-130,5,100); coinArc(4000,GND_Y-200,5,96);  coinArc(4600,GND_Y-160,7,140);
  coinArc(4950,GND_Y-230,5,100); coinArc(5200,GND_Y-200,7,150); coinArc(5700,GND_Y-160,5,96);
  coinArc(6050,GND_Y-130,5,100); coinArc(6350,GND_Y-200,7,140);

  const enemySpawns = [
    {x:450,type:'goomba'},{x:650,type:'goomba'},{x:800,type:'koopa'},
    {x:1050,type:'goomba'},{x:1250,type:'goomba'},{x:1450,type:'koopa'},
    {x:1700,type:'goomba'},{x:1900,type:'goomba'},{x:2100,type:'koopa'},
    {x:2500,type:'goomba'},{x:2700,type:'koopa'},{x:2900,type:'goomba'},
    {x:3150,type:'koopa'},{x:3350,type:'goomba'},{x:3550,type:'koopa'},
    {x:3800,type:'goomba'},{x:4000,type:'goomba'},{x:4200,type:'koopa'},
    {x:4550,type:'goomba'},{x:4750,type:'koopa'},{x:4950,type:'goomba'},
    {x:5200,type:'koopa'},{x:5400,type:'goomba'},{x:5600,type:'koopa'},
    {x:5800,type:'goomba'},{x:6050,type:'koopa'},{x:6250,type:'goomba'},
    {x:6450,type:'goomba'},{x:6600,type:'koopa'},
  ];

  return { platforms, rawCoins, enemySpawns, bg:'desert' };
})();

// ── Stage 3: 성 (Castle) – 보스 스테이지 ───────────────────────
const STAGE3 = (() => {
  const rawPlatforms = [
    {x:0,    y:GND_Y, w:2000, type:'ground'},
    {x:2200, y:GND_Y, w:1600, type:'ground'},
    {x:4000, y:GND_Y, w:1200, type:'ground'},
    {x:5400, y:GND_Y, w:1800, type:'ground'},
    {x:200,  y:GND_Y-128, w:64,  type:'brick'},
    {x:350,  y:GND_Y-192, w:32,  type:'qblock', reward:'star'},
    {x:500,  y:GND_Y-160, w:128, type:'brick'},
    {x:700,  y:GND_Y-224, w:32,  type:'qblock', reward:'mushroom'},
    {x:850,  y:GND_Y-192, w:96,  type:'brick'},
    {x:1050, y:GND_Y-160, w:32,  type:'qblock', reward:'coin'},
    {x:1200, y:GND_Y-224, w:128, type:'brick'},
    {x:1450, y:GND_Y-192, w:32,  type:'qblock', reward:'star'},
    {x:1600, y:GND_Y-160, w:96,  type:'brick'},
    {x:1800, y:GND_Y-224, w:64,  type:'brick'},
    {x:2300, y:GND_Y-192, w:32,  type:'qblock', reward:'mushroom'},
    {x:2500, y:GND_Y-160, w:128, type:'brick'},
    {x:2750, y:GND_Y-224, w:64,  type:'brick'},
    {x:2950, y:GND_Y-192, w:32,  type:'qblock', reward:'star'},
    {x:2998, y:GND_Y-256, w:32,  type:'qblock', reward:'giant_mushroom'},
    {x:3100, y:GND_Y-160, w:96,  type:'brick'},
    {x:3350, y:GND_Y-224, w:128, type:'brick'},
    {x:3600, y:GND_Y-192, w:32,  type:'qblock', reward:'coin'},
    {x:3800, y:GND_Y-160, w:96,  type:'brick'},
    {x:4100, y:GND_Y-192, w:128, type:'brick'},
    {x:4350, y:GND_Y-224, w:32,  type:'qblock', reward:'mushroom'},
    {x:4550, y:GND_Y-192, w:128, type:'brick'},
    {x:4800, y:GND_Y-160, w:64,  type:'brick'},
    {x:5000, y:GND_Y-224, w:32,  type:'qblock', reward:'star'},
    {x:5500, y:GND_Y-160, w:96,  type:'brick'},
    {x:5700, y:GND_Y-224, w:96,  type:'brick'},
    {x:5900, y:GND_Y-192, w:96,  type:'brick'},
    {x:6100, y:GND_Y-160, w:96,  type:'brick'},
  ];
  const pipeDefs = [
    {x:420,h:96},{x:980,h:64},{x:1550,h:80},{x:2150,h:96},
    {x:2900,h:64},{x:3700,h:96},{x:4380,h:80},{x:5150,h:64},
    {x:6000,h:80},
  ];
  const platforms = [...rawPlatforms];
  pipeDefs.forEach(p=>{
    platforms.push({x:p.x, y:GND_Y-p.h,    w:64, type:'pipe_top'});
    if(p.h>32) platforms.push({x:p.x, y:GND_Y-p.h+32, w:64, h:p.h-32, type:'pipe_body'});
  });

  const rawCoins = [];
  function coinArc(cx,y,n,sp){
    for(let i=0;i<n;i++){
      const f=n===1?0:i/(n-1);
      rawCoins.push({x:cx-sp/2+f*sp, y:y-Math.sin(f*Math.PI)*32});
    }
  }
  coinArc(300,GND_Y-160,5,100);  coinArc(700,GND_Y-230,5,96);   coinArc(1100,GND_Y-200,7,140);
  coinArc(1500,GND_Y-260,5,100); coinArc(1850,GND_Y-200,5,96);  coinArc(2400,GND_Y-230,7,140);
  coinArc(2800,GND_Y-260,5,100); coinArc(3100,GND_Y-200,5,96);  coinArc(3500,GND_Y-260,7,150);
  coinArc(3900,GND_Y-200,5,96);  coinArc(4300,GND_Y-260,7,140); coinArc(4700,GND_Y-200,5,100);
  coinArc(5100,GND_Y-260,5,96);  coinArc(5550,GND_Y-200,5,100); coinArc(5900,GND_Y-230,7,140);
  coinArc(6300,GND_Y-200,5,96);

  const enemySpawns = [
    {x:400,type:'koopa'},{x:600,type:'goomba'},{x:800,type:'koopa'},
    {x:1000,type:'goomba'},{x:1200,type:'koopa'},{x:1400,type:'koopa'},
    {x:1700,type:'goomba'},{x:1900,type:'koopa'},{x:2100,type:'koopa'},
    {x:2400,type:'goomba'},{x:2600,type:'koopa'},{x:2800,type:'koopa'},
    {x:3050,type:'goomba'},{x:3250,type:'koopa'},{x:3500,type:'koopa'},
    {x:3700,type:'goomba'},{x:3950,type:'koopa'},{x:4200,type:'koopa'},
    {x:4450,type:'goomba'},{x:4650,type:'koopa'},{x:4850,type:'koopa'},
    {x:5100,type:'goomba'},{x:5300,type:'koopa'},
    {x:5550,type:'goomba'},{x:5800,type:'koopa'},{x:6100,type:'goomba'},
    {x:6350,type:'koopa'},
  ];

  return { platforms, rawCoins, enemySpawns, bg:'castle' };
})();

// ── Stage 4: 지하 던전 (Dungeon) ────────────────────────────────
const STAGE4 = (() => {
  const rawPlatforms = [
    // 바닥 (구멍 있는 위험한 던전)
    {x:0,    y:GND_Y, w:1200, type:'ground'},
    {x:1400, y:GND_Y, w:1000, type:'ground'},
    {x:2600, y:GND_Y, w:1300, type:'ground'},
    {x:4100, y:GND_Y, w:950,  type:'ground'},
    {x:5250, y:GND_Y, w:1950, type:'ground'},
    // 돌 벽돌 플랫폼
    {x:200,  y:GND_Y-96,  w:96,  type:'brick'},
    {x:400,  y:GND_Y-160, w:32,  type:'qblock', reward:'coin'},
    {x:600,  y:GND_Y-128, w:128, type:'brick'},
    {x:900,  y:GND_Y-192, w:32,  type:'qblock', reward:'mushroom'},
    {x:1050, y:GND_Y-160, w:96,  type:'brick'},
    {x:1500, y:GND_Y-128, w:32,  type:'qblock', reward:'star'},
    {x:1700, y:GND_Y-192, w:128, type:'brick'},
    {x:1950, y:GND_Y-128, w:32,  type:'qblock', reward:'coin'},
    {x:2200, y:GND_Y-160, w:96,  type:'brick'},
    {x:2750, y:GND_Y-192, w:32,  type:'qblock', reward:'mushroom'},
    {x:2950, y:GND_Y-128, w:128, type:'brick'},
    {x:3200, y:GND_Y-192, w:32,  type:'qblock', reward:'star'},
    {x:3250, y:GND_Y-256, w:32,  type:'qblock', reward:'giant_mushroom'},
    {x:3500, y:GND_Y-160, w:96,  type:'brick'},
    {x:3750, y:GND_Y-128, w:128, type:'brick'},
    {x:4200, y:GND_Y-192, w:32,  type:'qblock', reward:'coin'},
    {x:4450, y:GND_Y-160, w:96,  type:'brick'},
    {x:4750, y:GND_Y-128, w:32,  type:'qblock', reward:'mushroom'},
    {x:5000, y:GND_Y-192, w:128, type:'brick'},
    {x:5400, y:GND_Y-160, w:32,  type:'qblock', reward:'star'},
    {x:5700, y:GND_Y-128, w:96,  type:'brick'},
    {x:5950, y:GND_Y-192, w:32,  type:'qblock', reward:'coin'},
    {x:6200, y:GND_Y-160, w:128, type:'brick'},
    {x:6500, y:GND_Y-128, w:96,  type:'brick'},
  ];
  const pipeDefs = [
    {x:360,h:80},{x:950,h:64},{x:1550,h:96},{x:2300,h:80},
    {x:3050,h:64},{x:3820,h:96},{x:4550,h:80},{x:5480,h:64},
    {x:6280,h:80},
  ];
  const platforms = [...rawPlatforms];
  pipeDefs.forEach(p=>{
    platforms.push({x:p.x, y:GND_Y-p.h,    w:64, type:'pipe_top'});
    if(p.h>32) platforms.push({x:p.x, y:GND_Y-p.h+32, w:64, h:p.h-32, type:'pipe_body'});
  });

  const rawCoins = [];
  function coinArc(cx,y,n,sp){
    for(let i=0;i<n;i++){
      const f=n===1?0:i/(n-1);
      rawCoins.push({x:cx-sp/2+f*sp, y:y-Math.sin(f*Math.PI)*32});
    }
  }
  coinArc(250,GND_Y-130,5,100);  coinArc(650,GND_Y-200,7,130);  coinArc(1100,GND_Y-160,5,96);
  coinArc(1580,GND_Y-230,5,100); coinArc(1830,GND_Y-160,5,96);  coinArc(2250,GND_Y-200,7,140);
  coinArc(2800,GND_Y-230,5,100); coinArc(3080,GND_Y-200,5,96);  coinArc(3580,GND_Y-260,7,150);
  coinArc(3950,GND_Y-160,5,96);  coinArc(4350,GND_Y-230,7,140); coinArc(4830,GND_Y-160,5,100);
  coinArc(5180,GND_Y-230,5,96);  coinArc(5580,GND_Y-200,5,100); coinArc(5950,GND_Y-230,7,140);
  coinArc(6350,GND_Y-200,5,96);

  const enemySpawns = [
    // 해골 (지상)
    {x:400,  type:'skeleton'},
    {x:700,  type:'skeleton'},
    {x:1000, type:'skeleton'},
    {x:1300, type:'skeleton'},
    {x:1700, type:'skeleton'},
    {x:2100, type:'skeleton'},
    {x:2600, type:'skeleton'},
    {x:3000, type:'skeleton'},
    {x:3500, type:'skeleton'},
    {x:3900, type:'skeleton'},
    {x:4400, type:'skeleton'},
    {x:4900, type:'skeleton'},
    {x:5400, type:'skeleton'},
    {x:5900, type:'skeleton'},
    {x:6400, type:'skeleton'},
    // 박쥐 (공중)
    {x:550,  type:'bat', startY:GND_Y-180},
    {x:850,  type:'bat', startY:GND_Y-220},
    {x:1150, type:'bat', startY:GND_Y-160},
    {x:1500, type:'bat', startY:GND_Y-200},
    {x:1900, type:'bat', startY:GND_Y-240},
    {x:2300, type:'bat', startY:GND_Y-180},
    {x:2800, type:'bat', startY:GND_Y-200},
    {x:3200, type:'bat', startY:GND_Y-160},
    {x:3700, type:'bat', startY:GND_Y-220},
    {x:4200, type:'bat', startY:GND_Y-180},
    {x:4700, type:'bat', startY:GND_Y-200},
    {x:5200, type:'bat', startY:GND_Y-160},
    {x:5700, type:'bat', startY:GND_Y-220},
    {x:6200, type:'bat', startY:GND_Y-180},
  ];

  return { platforms, rawCoins, enemySpawns, bg:'dungeon' };
})();

// ── Stage 5: 화산 (Volcano) ──────────────────────────────────────
const STAGE5 = (() => {
  const rawPlatforms = [
    {x:0,    y:GND_Y, w:1000, type:'ground'},
    {x:1200, y:GND_Y, w:900,  type:'ground'},
    {x:2300, y:GND_Y, w:1100, type:'ground'},
    {x:3600, y:GND_Y, w:900,  type:'ground'},
    {x:4700, y:GND_Y, w:1000, type:'ground'},
    {x:5900, y:GND_Y, w:1300, type:'ground'},
    // 용암 위 발판
    {x:1060, y:GND_Y-64,  w:96,  type:'brick'},
    {x:1130, y:GND_Y-144, w:96,  type:'brick'},
    {x:4570, y:GND_Y-64,  w:96,  type:'brick'},
    {x:4640, y:GND_Y-144, w:96,  type:'brick'},
    // 일반 블록
    {x:200,  y:GND_Y-96,  w:96,  type:'brick'},
    {x:400,  y:GND_Y-160, w:32,  type:'qblock', reward:'fire'},
    {x:600,  y:GND_Y-128, w:128, type:'brick'},
    {x:850,  y:GND_Y-192, w:32,  type:'qblock', reward:'mushroom'},
    {x:1300, y:GND_Y-128, w:32,  type:'qblock', reward:'fire'},
    {x:1500, y:GND_Y-192, w:128, type:'brick'},
    {x:1750, y:GND_Y-128, w:32,  type:'qblock', reward:'coin'},
    {x:2000, y:GND_Y-192, w:96,  type:'brick'},
    {x:2400, y:GND_Y-160, w:32,  type:'qblock', reward:'lightning'},
    {x:2650, y:GND_Y-128, w:128, type:'brick'},
    {x:2900, y:GND_Y-192, w:32,  type:'qblock', reward:'fire'},
    {x:3100, y:GND_Y-160, w:96,  type:'brick'},
    {x:3300, y:GND_Y-128, w:32,  type:'qblock', reward:'star'},
    {x:3350, y:GND_Y-224, w:32,  type:'qblock', reward:'giant_mushroom'},
    {x:3700, y:GND_Y-192, w:128, type:'brick'},
    {x:4000, y:GND_Y-128, w:32,  type:'qblock', reward:'fire'},
    {x:4200, y:GND_Y-192, w:96,  type:'brick'},
    {x:4850, y:GND_Y-192, w:32,  type:'qblock', reward:'lightning'},
    {x:5050, y:GND_Y-128, w:128, type:'brick'},
    {x:5300, y:GND_Y-192, w:32,  type:'qblock', reward:'fire'},
    {x:5500, y:GND_Y-160, w:96,  type:'brick'},
    {x:6000, y:GND_Y-192, w:128, type:'brick'},
    {x:6250, y:GND_Y-128, w:32,  type:'qblock', reward:'fire'},
    {x:6500, y:GND_Y-192, w:96,  type:'brick'},
  ];
  const pipeDefs = [
    {x:350,h:80},{x:800,h:64},{x:1380,h:96},{x:2000,h:80},
    {x:2700,h:64},{x:3150,h:96},{x:3950,h:80},{x:4550,h:64},
    {x:5450,h:96},{x:6300,h:80},
  ];
  const platforms = [...rawPlatforms];
  pipeDefs.forEach(p=>{
    platforms.push({x:p.x, y:GND_Y-p.h,    w:64, type:'pipe_top'});
    if(p.h>32) platforms.push({x:p.x, y:GND_Y-p.h+32, w:64, h:p.h-32, type:'pipe_body'});
  });
  const rawCoins = [];
  function coinArc(cx,y,n,sp){
    for(let i=0;i<n;i++){
      const f=n===1?0:i/(n-1);
      rawCoins.push({x:cx-sp/2+f*sp, y:y-Math.sin(f*Math.PI)*32});
    }
  }
  coinArc(250,GND_Y-130,5,100); coinArc(650,GND_Y-200,7,130); coinArc(900,GND_Y-160,5,96);
  coinArc(1350,GND_Y-160,5,100); coinArc(1600,GND_Y-230,7,140); coinArc(1900,GND_Y-160,5,96);
  coinArc(2450,GND_Y-200,7,140); coinArc(2700,GND_Y-230,5,100); coinArc(2950,GND_Y-200,5,96);
  coinArc(3150,GND_Y-260,5,100); coinArc(3750,GND_Y-230,7,140); coinArc(4050,GND_Y-160,5,96);
  coinArc(4900,GND_Y-230,5,100); coinArc(5100,GND_Y-160,7,140); coinArc(5500,GND_Y-200,5,96);
  coinArc(5700,GND_Y-160,5,100); coinArc(6200,GND_Y-230,7,140); coinArc(6450,GND_Y-160,5,96);

  const enemySpawns = [
    {x:300,  type:'skeleton'},{x:500,  type:'bat', startY:GND_Y-180},
    {x:700,  type:'skeleton'},{x:950,  type:'bat', startY:GND_Y-200},
    {x:1250, type:'skeleton'},{x:1450, type:'bat', startY:GND_Y-160},
    {x:1650, type:'skeleton'},{x:1900, type:'skeleton'},
    {x:2100, type:'bat', startY:GND_Y-220},{x:2400, type:'skeleton'},
    {x:2600, type:'bat', startY:GND_Y-180},{x:2900, type:'skeleton'},
    {x:3100, type:'skeleton'},{x:3300, type:'bat', startY:GND_Y-200},
    {x:3700, type:'skeleton'},{x:3950, type:'bat', startY:GND_Y-160},
    {x:4100, type:'skeleton'},{x:4300, type:'skeleton'},
    {x:4600, type:'bat', startY:GND_Y-220},{x:4850, type:'skeleton'},
    {x:5050, type:'skeleton'},{x:5250, type:'bat', startY:GND_Y-180},
    {x:5450, type:'skeleton'},{x:5700, type:'bat', startY:GND_Y-200},
    {x:5900, type:'skeleton'},{x:6100, type:'skeleton'},
    {x:6300, type:'bat', startY:GND_Y-160},{x:6550, type:'skeleton'},
  ];
  return { platforms, rawCoins, enemySpawns, bg:'volcano' };
})();

// ── Stage 6: 우주 (Space) – 최종 스테이지 ────────────────────────
const STAGE6 = (() => {
  const rawPlatforms = [
    // 우주 지면 (큰 간격 있음)
    {x:0,    y:GND_Y, w:1400, type:'ground'},
    {x:1600, y:GND_Y, w:1000, type:'ground'},
    {x:2800, y:GND_Y, w:1200, type:'ground'},
    {x:4200, y:GND_Y, w:1100, type:'ground'},
    {x:5500, y:GND_Y, w:1700, type:'ground'},
    // 우주 정거장 부유 플랫폼
    {x:200,  y:GND_Y-96,  w:128, type:'brick'},
    {x:500,  y:GND_Y-192, w:32,  type:'qblock', reward:'blackhole'},
    {x:700,  y:GND_Y-160, w:96,  type:'brick'},
    {x:950,  y:GND_Y-224, w:32,  type:'qblock', reward:'fire'},
    {x:1100, y:GND_Y-192, w:128, type:'brick'},
    {x:1300, y:GND_Y-160, w:32,  type:'qblock', reward:'blackhole'},
    // 간격 구간 부유 발판
    {x:1490, y:GND_Y-128, w:64,  type:'brick'},
    {x:1640, y:GND_Y-192, w:64,  type:'brick'},
    {x:1800, y:GND_Y-128, w:32,  type:'qblock', reward:'blackhole'},
    {x:2000, y:GND_Y-192, w:128, type:'brick'},
    {x:2250, y:GND_Y-160, w:32,  type:'qblock', reward:'lightning'},
    {x:2600, y:GND_Y-224, w:96,  type:'brick'},
    {x:2900, y:GND_Y-192, w:32,  type:'qblock', reward:'invisible'},
    {x:2950, y:GND_Y-288, w:32,  type:'qblock', reward:'giant_mushroom'},
    {x:3100, y:GND_Y-160, w:128, type:'brick'},
    {x:3400, y:GND_Y-224, w:32,  type:'qblock', reward:'blackhole'},
    {x:3700, y:GND_Y-192, w:96,  type:'brick'},
    {x:4000, y:GND_Y-160, w:32,  type:'qblock', reward:'fire'},
    {x:4300, y:GND_Y-128, w:128, type:'brick'},
    {x:4600, y:GND_Y-192, w:32,  type:'qblock', reward:'blackhole'},
    {x:4900, y:GND_Y-160, w:96,  type:'brick'},
    {x:5200, y:GND_Y-224, w:32,  type:'qblock', reward:'blackhole'},
    {x:5700, y:GND_Y-192, w:128, type:'brick'},
    {x:5950, y:GND_Y-160, w:32,  type:'qblock', reward:'fire'},
    {x:6200, y:GND_Y-224, w:96,  type:'brick'},
    {x:6450, y:GND_Y-192, w:96,  type:'brick'},
  ];
  // 우주 정거장 도관 (파이프 줄임)
  const pipeDefs = [
    {x:450,h:80},{x:1050,h:64},{x:2050,h:96},
    {x:3300,h:80},{x:4200,h:64},{x:5850,h:96},{x:6600,h:80},
  ];
  const platforms = [...rawPlatforms];
  pipeDefs.forEach(p=>{
    platforms.push({x:p.x, y:GND_Y-p.h,    w:64, type:'pipe_top'});
    if(p.h>32) platforms.push({x:p.x, y:GND_Y-p.h+32, w:64, h:p.h-32, type:'pipe_body'});
  });
  const rawCoins = [];
  function coinArc(cx,y,n,sp){
    for(let i=0;i<n;i++){
      const f=n===1?0:i/(n-1);
      rawCoins.push({x:cx-sp/2+f*sp, y:y-Math.sin(f*Math.PI)*42});
    }
  }
  // 우주에선 코인 더 높이 떠있음
  coinArc(300,GND_Y-170,5,100);  coinArc(750,GND_Y-240,5,96);   coinArc(1150,GND_Y-210,7,140);
  coinArc(1600,GND_Y-270,5,100); coinArc(1950,GND_Y-210,5,96);  coinArc(2350,GND_Y-260,7,140);
  coinArc(2750,GND_Y-300,5,100); coinArc(3150,GND_Y-240,5,96);  coinArc(3550,GND_Y-300,7,150);
  coinArc(3950,GND_Y-240,5,96);  coinArc(4450,GND_Y-300,7,140); coinArc(4750,GND_Y-240,5,100);
  coinArc(5150,GND_Y-300,5,96);  coinArc(5600,GND_Y-240,5,100); coinArc(5950,GND_Y-270,7,140);
  coinArc(6350,GND_Y-240,5,96);

  const enemySpawns = [
    // 외계인 (지상)
    {x:350,  type:'alien'},{x:650,  type:'alien'},
    {x:950,  type:'alien'},{x:1250, type:'alien'},
    {x:1700, type:'alien'},{x:2050, type:'alien'},
    {x:2550, type:'alien'},{x:2950, type:'alien'},
    {x:3450, type:'alien'},{x:3850, type:'alien'},
    {x:4350, type:'alien'},{x:4800, type:'alien'},
    {x:5300, type:'alien'},{x:5750, type:'alien'},
    {x:6200, type:'alien'},{x:6500, type:'alien'},
    // UFO (공중)
    {x:500,  type:'ufo', startY:GND_Y-200},
    {x:800,  type:'ufo', startY:GND_Y-180},
    {x:1100, type:'ufo', startY:GND_Y-220},
    {x:1450, type:'ufo', startY:GND_Y-180},
    {x:1850, type:'ufo', startY:GND_Y-210},
    {x:2250, type:'ufo', startY:GND_Y-170},
    {x:2750, type:'ufo', startY:GND_Y-220},
    {x:3150, type:'ufo', startY:GND_Y-185},
    {x:3650, type:'ufo', startY:GND_Y-205},
    {x:4100, type:'ufo', startY:GND_Y-165},
    {x:4650, type:'ufo', startY:GND_Y-215},
    {x:5100, type:'ufo', startY:GND_Y-185},
    {x:5650, type:'ufo', startY:GND_Y-200},
    {x:6050, type:'ufo', startY:GND_Y-175},
  ];
  return { platforms, rawCoins, enemySpawns, bg:'space' };
})();

const STAGES = [STAGE1, STAGE2, STAGE3, STAGE4, STAGE5, STAGE6];
const FLAG_X  = LEVEL_W - 400;
const FLAG_H  = 220;

// ─ 보스 스폰 위치 (스테이지 3 전용) ─────────────────────────────
const BOSS_SPAWN_X = LEVEL_W - 800;
