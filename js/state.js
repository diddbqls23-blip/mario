// ═══════════════════════════════════════════════════════════════
//  Game state
// ═══════════════════════════════════════════════════════════════
let gameState = 'title';
let stageIdx  = 0;
let clearedStage = 0;
let score = 0, lives = 3, coinCount = 0, timeLeft = 300, timeTimer = 0, camX = 0;
let floatTexts = [];
let particles  = [];
let player, enemies, coins, qblocks, powerups;
let boss = null;
let platforms = [];
let fireballs  = [];          // 불꽃 투사체
let screenFlash = null;       // {color, alpha, decay}  화면 플래시
let stageFireworks = [];      // 스테이지 클리어 폭죽

// ── 상점 ────────────────────────────────────────────────────────
let shopSelectedIdx = 0;
let shopMsg = null; // {text, color, timer}

const SHOP_ITEMS = [
  { name: '목숨 추가',   icon: '❤',  desc: '+1 목숨 즉시 추가',    cost: 20, action: 'life'  },
  { name: '무적 연장',   icon: '⭐',  desc: '별 무적 10초 부여',    cost: 15, action: 'star'  },
  { name: '점프력 강화', icon: '🦘',  desc: '점프 높이 UP (10초)',  cost: 10, action: 'jump'  },
  { name: '속도 부스트', icon: '⚡',  desc: '이동 속도 UP (10초)',  cost: 10, action: 'speed' },
];

function buyShopItem(){
  const item = SHOP_ITEMS[shopSelectedIdx];
  if(coinCount < item.cost){
    shopMsg = { text: '코인이 부족합니다! 🪙', color: '#cc2222', timer: 90 };
    return;
  }
  coinCount -= item.cost;
  if(item.action === 'life'){
    lives++;
    shopMsg = { text: `❤ 목숨 +1! (현재 ${lives}개)`, color: '#cc2244', timer: 90 };
  } else if(item.action === 'star'){
    player.starTimer = Math.max(player.starTimer, 600);
    player.invincible = Math.max(player.invincible, 600);
    shopMsg = { text: '⭐ 무적 10초 발동!', color: '#886600', timer: 90 };
    startBGM(1.5);
  } else if(item.action === 'jump'){
    player.jumpBoostTimer = 600;
    shopMsg = { text: '🦘 점프력 강화 10초!', color: '#224488', timer: 90 };
  } else if(item.action === 'speed'){
    player.speedBoostTimer = 600;
    shopMsg = { text: '⚡ 속도 부스트 10초!', color: '#666600', timer: 90 };
  }
  sndCoin();
}

// ─ 현재 스테이지 데이터 헬퍼 ────────────────────────────────────
function currentStage() { return STAGES[stageIdx]; }

// ── 파티클 ──────────────────────────────────────────────────────
function spawnParticles(x, y, count, colors, opts={}) {
  for(let i=0;i<count;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = (opts.speed||3) * (0.5+Math.random());
    particles.push({
      x, y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed - (opts.upBias||0),
      color: colors[Math.floor(Math.random()*colors.length)],
      life: (opts.life||40) + Math.random()*20|0,
      maxLife: (opts.life||40)+20,
      r: (opts.r||4) * (0.5+Math.random()*0.8),
      gravity: opts.gravity===false ? 0 : 0.18,
      shape: opts.shape||'circle',
    });
  }
}

function addFloat(x, y, text, color='#fff'){
  floatTexts.push({x, y, text, color, life:60, vy:-1.2});
}

// ═══════════════════════════════════════════════════════════════
//  Init / Reset
// ═══════════════════════════════════════════════════════════════
function initLevel(){
  const stage = currentStage();
  platforms = stage.platforms;

  // 벽돌 상태 초기화 (이전 플레이에서 부순 벽돌 복구)
  platforms.forEach(pl=>{ if(pl.type==='brick') pl.hit=false; });

  camX=0; timeLeft=300+(stageIdx*10); timeTimer=0;
  floatTexts=[]; particles=[]; powerups=[];
  fireballs=[]; screenFlash=null; stageFireworks=[];
  boss=null;

  player={
    x:80, y:GND_Y-SML_H,
    w:24, h:SML_H,
    vx:0, vy:0,
    onGround:false, facing:1,
    state:'idle',
    deadTimer:0, winTimer:0,
    frame:0, frameTimer:0,
    invincible:0,
    jumpHeld:false, jumpTimer:0,
    jumpsLeft:2, lastJumpWas2nd:false, jumpCooldown:0,
    big:false,
    starTimer:0,
    powerupAnim:0,
    invincibleTick:0,
    giant:false,
    giantTimer:0,
    running:false, dustTimer:0,
    fireTimer:0, fireCooldown:0,
    invisibleTimer:0,
    lightningFlash:0,
    blackholeTimer:0,
    sucking:false,
    blackholeAbility:null,
    blackholeAbilityTimer:0,
    jumpBoostTimer:0,
    speedBoostTimer:0,
  };

  // 적 속도 스테이지별 배율
  const speedMult = 1 + stageIdx * 0.35;
  enemies = stage.enemySpawns.map(s=>{
    const isFlying = s.type==='bat'||s.type==='ufo';
    return {
      x:s.x,
      y: isFlying ? (s.startY||GND_Y-180) : GND_Y-32,
      w: s.type==='ufo' ? 36 : (s.type==='bat' ? 24 : 28),
      h: s.type==='ufo' ? 22 : (s.type==='bat' ? 20 : (s.type==='skeleton'||s.type==='alien'?36:(s.type==='koopa'?32:28))),
      vx: isFlying ? 0 : -1.2 * speedMult, vy:0, type:s.type,
      alive:true, squished:false, squishTimer:0,
      onGround:false, frame:0, frameTimer:0,
    };
  });

  coins = stage.rawCoins.map(c=>({x:c.x,y:c.y,w:16,h:16,alive:true,frame:0,frameTimer:0}));

  qblocks = platforms.filter(p=>p.type==='qblock')
    .map(p=>({x:p.x,y:p.y,w:p.w,hit:false,bounceY:0,reward:p.reward||'coin'}));

  // 스테이지 3: 보스 초기화
  if(stageIdx===2){
    boss = {
      x: BOSS_SPAWN_X,
      y: GND_Y - 72,
      w: 60, h: 72,
      vx: -2.0, vy: 0,
      hp: 3, maxHp: 3,
      alive: true,
      onGround: false,
      frame: 0, frameTimer: 0,
      hurtTimer: 0,
      jumpTimer: 0,
      attackPhase: 0,
    };
  }
}

function triggerScreenFlash(color='#ffffff', alpha=0.85, decay=0.04){
  screenFlash = {color, alpha, decay};
}

function resetGame(){ score=0; lives=3; coinCount=0; stageIdx=0; initLevel(); }

function nextStage(){
  stageIdx++;
  if(stageIdx>=STAGES.length){
    // 모든 스테이지 클리어
    gameState='allclear';
    stopBGM(); sndWin();
  } else {
    initLevel();
    gameState='playing';
    startBGM(1 + stageIdx*0.05);
  }
}
