// ═══════════════════════════════════════════════════════════════
//  Multiplayer  (socket.io)  —  P1 = 호스트 권한
// ═══════════════════════════════════════════════════════════════
let socket        = null;
let isMultiplayer = false;
let myPlayerNum   = 1;
let remotePlayer  = null;
let _lastSent     = 0;
let _hostStateLast = 0;      // 호스트 상태 마지막 전송 시각
let partnerGoaled = false;   // 협력 클리어: 파트너가 골에 도달했는지 여부

// ── 소켓 초기화 ─────────────────────────────────────────────────
function initSocket() {
  socket = io();

  // P2가 방에 입장했을 때 (P1에게 알림)
  socket.on('p2-joined', () => {
    document.getElementById('mp-waiting').style.display = 'none';
    document.getElementById('mp-p2ready').style.display = 'block';
    setTimeout(() => { hideLobby(); startGame(); }, 700);
  });

  // 상대방 위치/상태 수신 (매 프레임 전송)
  socket.on('remote-player-update', (data) => {
    if (!remotePlayer) remotePlayer = {};
    Object.assign(remotePlayer, data);
    remotePlayer.w = data.giant ? GIANT_W : 24;
    remotePlayer.h = data.h || (data.giant ? GIANT_H : (data.big ? BIG_H : SML_H));
    if (typeof data.score === 'number') score = Math.max(score, data.score);
  });

  // 게임 이벤트 수신 (코인·적·파워업·보스 등)
  socket.on('game-event', (ev) => { applyGameEvent(ev); });

  // ── P1→P2 전체 상태 동기화 (2초마다) ──────────────────────────
  socket.on('host-state', (data) => {
    if (myPlayerNum !== 2) return;

    // 적 alive/squish 상태 보정
    if (data.enemies && enemies) {
      data.enemies.forEach((es, i) => {
        if (!enemies[i]) return;
        if (!es.alive && enemies[i].alive)          enemies[i].alive = false;
        if (es.squished && !enemies[i].squished)    { enemies[i].squished = true; enemies[i].squishTimer = es.squishTimer | 0; }
      });
    }
    // 코인 alive 상태 보정
    if (data.coins && coins) {
      data.coins.forEach((cs, i) => { if (coins[i] && !cs.alive) coins[i].alive = false; });
    }
    // 파워업: P1의 배열로 완전 교체
    if (data.powerups !== undefined) {
      powerups = data.powerups.map(p => Object.assign(
        { frameTimer: 0, frame: 0, onGround: false, bounced: false }, p
      ));
    }
    // 보스 HP / alive
    if (data.boss && boss) {
      boss.hp = data.boss.hp;
      if (!data.boss.alive) boss.alive = false;
    }
    // 점수 공유 (최댓값)
    if (typeof data.score === 'number') score = Math.max(score, data.score);
    // 생명 공유 (최솟값 — 어느 쪽이 죽든 적용)
    if (typeof data.lives === 'number' && data.lives < lives) lives = data.lives;
    // stageIdx 불일치 감지 시 재동기화
    if (typeof data.stageIdx === 'number' && data.stageIdx !== stageIdx && gameState === 'playing') {
      stageIdx = data.stageIdx;
      if (typeof initLevel === 'function') initLevel();
      if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
    }
  });

  // 파트너가 골 지점 도달
  socket.on('partner-goal', () => {
    partnerGoaled = true;
    if (player && typeof addFloat === 'function') {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너 골인! 빨리 와! 🏁', '#ffcc00');
    }
  });

  // 상대방 접속 끊김 → 솔로 진행
  socket.on('player-disconnected', () => {
    remotePlayer = null;
    partnerGoaled = true;
    if (player && typeof addFloat === 'function') {
      addFloat(player.x + player.w / 2, player.y - 30, '상대방 연결 끊김 😢', '#ff8888');
    }
  });

  // 파트너 사망 → 같은 스테이지로 즉시 리셋
  socket.on('partner-died', (data) => {
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너가 죽었습니다! 리셋! 💀', '#ff6666');
    }
    if (typeof data === 'object' && typeof data.stageIdx === 'number') stageIdx = data.stageIdx;
    if (typeof initLevel === 'function') initLevel();
    gameState = 'playing';
    if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
  });

  // 파트너 게임 오버 → 솔로 전환
  socket.on('partner-gameover', () => {
    remotePlayer = null;
    partnerGoaled = true;
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너 게임 오버 — 혼자 계속! 🎮', '#ffaa44');
    }
  });
}

// ── 방 만들기 ───────────────────────────────────────────────────
function createRoom() {
  if (!socket) initSocket();
  socket.emit('create-room', (res) => {
    if (!res.ok) { showLobbyError(res.error); return; }
    myPlayerNum   = 1;
    isMultiplayer = true;
    document.getElementById('mp-main').style.display  = 'none';
    document.getElementById('mp-room').style.display  = 'block';
    document.getElementById('mp-code').textContent    = res.roomId;
    document.getElementById('mp-waiting').style.display  = 'block';
    document.getElementById('mp-p2ready').style.display  = 'none';
  });
}

// ── 방 참여하기 ─────────────────────────────────────────────────
function joinRoom() {
  const code = document.getElementById('mp-join-input').value.trim().toUpperCase();
  if (!code) { showLobbyError('방 코드를 입력해주세요'); return; }
  if (!socket) initSocket();
  socket.emit('join-room', code, (res) => {
    if (!res.ok) { showLobbyError(res.error); return; }
    myPlayerNum   = 2;
    isMultiplayer = true;
    hideLobby();
    startGame();
  });
}

// ── 혼자 플레이 ─────────────────────────────────────────────────
function soloPlay() {
  isMultiplayer = false;
  myPlayerNum   = 1;
  hideLobby();
  startGame();
}

// ── 골 도달 알림 ────────────────────────────────────────────────
function notifyGoal() {
  if (socket && isMultiplayer) socket.emit('player-goal');
}

// ── 게임 이벤트 전송 ─────────────────────────────────────────────
// type: 'coin' | 'enemy' | 'powerup-removed' | 'p2-powerup' | 'boss-hit' ...
function emitGameEvent(type, idx, extra) {
  if (!socket || !isMultiplayer) return;
  socket.emit('game-event', Object.assign({ type, idx }, extra || {}));
}

// ── 사망 알림 ──────────────────────────────────────────────────
function emitPlayerDied() {
  if (!socket || !isMultiplayer) return;
  socket.emit('player-died', { stageIdx });
}

// ── 게임 오버 알림 ──────────────────────────────────────────────
function emitPlayerGameOver() {
  if (!socket || !isMultiplayer) return;
  socket.emit('player-gameover');
}

// ── 호스트 전체 상태 전송 (P1, 2초마다, main loop에서 호출) ────────
function sendHostState() {
  if (!socket || !isMultiplayer || myPlayerNum !== 1) return;
  const now = Date.now();
  if (now - _hostStateLast < 2000) return;
  _hostStateLast = now;
  socket.emit('host-state', {
    enemies:  (enemies  || []).map(e  => ({
      alive: e.alive, squished: e.squished, squishTimer: e.squishTimer | 0,
    })),
    coins:    (coins    || []).map(c  => ({ alive: c.alive })),
    powerups: (powerups || []).filter(pw => pw.alive || pw.emerging).map(pw => ({
      x: pw.x, y: pw.y, vx: pw.vx || 0, vy: pw.vy || 0,
      type: pw.type, alive: pw.alive, emerging: pw.emerging || false,
      w: pw.w || 20, h: pw.h || 20,
      frame: pw.frame | 0, frameTimer: pw.frameTimer | 0,
      emergeY: pw.emergeY || pw.y, onGround: pw.onGround || false, bounced: pw.bounced || false,
    })),
    boss:  boss ? { hp: boss.hp, alive: boss.alive } : null,
    score, lives, stageIdx,
  });
}

// ── 수신한 게임 이벤트 적용 ──────────────────────────────────────
function applyGameEvent(ev) {
  switch (ev.type) {

    // ─ 코인 ─────────────────────────────────────────────────────
    case 'coin':
      if (coins && coins[ev.idx] && coins[ev.idx].alive) {
        const c = coins[ev.idx];
        c.alive = false;
        coinCount++;
        spawnParticles(c.x, c.y, 6,
          ['#ffe033','#ffcc00','#fff','#ffd700'],
          { speed: 2, upBias: 2, life: 18, r: 3, shape: 'star' });
      }
      break;

    // ─ 적 ───────────────────────────────────────────────────────
    case 'enemy':
      if (enemies && enemies[ev.idx] && enemies[ev.idx].alive) {
        const en = enemies[ev.idx];
        if (ev.instant) {
          en.alive = false;
        } else {
          en.squished    = true;
          en.squishTimer = ev.squishTimer || 30;
        }
      }
      break;

    // ─ 파워업 제거 (위치 기반 탐색) ─────────────────────────────
    case 'powerup-removed':
      if (powerups) {
        const pw = powerups.find(p =>
          p.alive && Math.abs(p.x - ev.pwx) < 40 && Math.abs(p.y - ev.pwy) < 40
        );
        if (pw) pw.alive = false;
      }
      break;

    // ─ P2가 파워업 먹음 (P1이 감지해서 전송) ────────────────────
    case 'p2-powerup':
      if (myPlayerNum === 2 && player) {
        const _effects = {
          mushroom:       typeof collectMushroom      !== 'undefined' ? collectMushroom      : null,
          star:           typeof collectStar          !== 'undefined' ? collectStar          : null,
          fire:           typeof collectFire          !== 'undefined' ? collectFire          : null,
          giant_mushroom: typeof collectGiantMushroom !== 'undefined' ? collectGiantMushroom : null,
          lightning:      typeof collectLightning     !== 'undefined' ? collectLightning     : null,
          invisible:      typeof collectInvisible     !== 'undefined' ? collectInvisible     : null,
          blackhole:      typeof collectBlackhole     !== 'undefined' ? collectBlackhole     : null,
        };
        // 중복 방지: 이미 해당 상태면 무시
        const alreadyHas = (
          (ev.effect === 'mushroom'       && player.big) ||
          (ev.effect === 'star'           && player.starTimer > 0) ||
          (ev.effect === 'fire'           && player.fireTimer > 0) ||
          (ev.effect === 'giant_mushroom' && player.giant) ||
          (ev.effect === 'invisible'      && player.invisibleTimer > 0)
        );
        if (!alreadyHas && typeof _effects[ev.effect] === 'function') _effects[ev.effect]();
      }
      break;

    // ─ 보스 HP ──────────────────────────────────────────────────
    case 'boss-hit':
      if (boss && boss.alive && typeof ev.hp === 'number') {
        boss.hp = ev.hp;
        if (boss.hp <= 0) boss.alive = false;
        if (typeof addFloat === 'function' && boss.alive)
          addFloat(boss.x + boss.w / 2, boss.y - 20, `💥 HP:${boss.hp}`, '#ff8800');
      }
      break;

    // ─ 보스 사망 (P2가 처치) ────────────────────────────────────
    case 'boss-dead':
      if (boss) {
        boss.alive = false; boss.hp = 0;
        spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, 30,
          ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff','#00ffff'],
          { speed: 7, upBias: 4, life: 50, r: 7, shape: 'star' });
      }
      break;
  }
}

// ── 위치 전송 (게임 루프에서 호출) ─────────────────────────────
function sendPlayerUpdate() {
  if (!socket || !isMultiplayer || !player) return;
  const now = Date.now();
  if (now - _lastSent < 33) return; // ~30fps
  _lastSent = now;
  socket.emit('player-update', {
    x: player.x, y: player.y,
    vx: player.vx, vy: player.vy,
    facing:          player.facing,
    state:           player.state,
    frame:           player.frame,
    big:             player.big,
    giant:           player.giant,
    h:               player.h,
    score,
    giantTimer:      player.giantTimer,
    starTimer:       player.starTimer,
    invincible:      player.invincible,
    fireTimer:       player.fireTimer,
    invisibleTimer:  player.invisibleTimer,
    blackholeTimer:  player.blackholeTimer,
  });
}

// ── 유틸 ────────────────────────────────────────────────────────
function hideLobby() {
  document.getElementById('lobby').style.display = 'none';
}

function showLobbyError(msg) {
  const el = document.getElementById('mp-error');
  el.textContent    = msg;
  el.style.display  = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}
