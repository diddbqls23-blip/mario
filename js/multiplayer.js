// ═══════════════════════════════════════════════════════════════
//  Multiplayer  (socket.io)  —  P1 = 호스트 권한
// ═══════════════════════════════════════════════════════════════
let socket               = null;
let isMultiplayer        = false;
let myPlayerNum          = 1;
let myRoomId             = null;   // 재접속용 방 코드 보관
let remotePlayer         = null;
let _lastSent            = 0;
let _hostStateLast       = 0;
let _evCounter           = 0;     // 이벤트 ID 생성 카운터
let _bossHitSeq          = 0;     // 보스 피격 순번 (스테이지마다 리셋)
let partnerGoaled        = false; // 협력 클리어: 파트너 골인 여부
let _partnerDisconnectedAt = 0;   // 파트너 접속 끊긴 시각

// ── 핑 측정 ─────────────────────────────────────────────────────
let _pingMs   = 0;
let _pingLast = 0;

// ── 델타 동기화: 마지막 전송값 캐시 ─────────────────────────────
let _lastSentState = {};

// ── 소켓 초기화 ─────────────────────────────────────────────────
function initSocket() {
  socket = io();

  // ── 초기 접속 / 재접속 ─────────────────────────────────────
  // socket.io는 자동으로 재연결한다. 재연결 시 'connect' 이벤트가 다시 발생한다.
  // myRoomId가 설정돼 있으면 방에 다시 합류 시도한다.
  socket.on('connect', () => {
    if (!myRoomId || !isMultiplayer) return; // 초기 접속 또는 솔로는 무시
    socket.emit('rejoin-room', { roomId: myRoomId, playerNum: myPlayerNum }, (res) => {
      if (!res || !res.ok) {
        // 방이 만료됨 → 솔로 전환
        isMultiplayer = false;
        if (typeof addFloat === 'function' && player) {
          addFloat(player.x + player.w / 2, player.y - 40, '방이 만료되었습니다 😢', '#ff6666');
        }
        if (gameState === 'paused') { gameState = 'playing'; }
        return;
      }
      // 재접속 성공 → 마지막 스냅샷으로 복구
      if (res.hostState) _applyHostStateData(res.hostState);
      if (gameState === 'paused') {
        gameState = 'playing';
        if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
      }
      _partnerDisconnectedAt = 0;
      if (typeof addFloat === 'function' && player) {
        addFloat(player.x + player.w / 2, player.y - 40, '재접속 완료! 🔄', '#44ff88');
      }
    });
  });

  // ── 접속 에러 ──────────────────────────────────────────────
  socket.on('connect_error', (err) => {
    if (isMultiplayer && typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 30, `서버 연결 오류: ${err.message}`, '#ff4444');
    }
  });

  // ── 게임 카운트다운 시작 (P1·P2 동시 수신) ─────────────────
  socket.on('start-countdown', () => {
    hideLobby();
    if (typeof startCountdown === 'function') startCountdown();
    else if (typeof startGame === 'function') startGame();
  });

  // ── 상대방 위치/상태 수신 (~30fps) ─────────────────────────
  socket.on('remote-player-update', (data) => {
    if (!remotePlayer) remotePlayer = {};
    Object.assign(remotePlayer, data);
    remotePlayer.w = data.giant ? GIANT_W : 24;
    remotePlayer.h = data.h || (data.giant ? GIANT_H : (data.big ? BIG_H : SML_H));
    if (typeof data.score === 'number') score = Math.max(score, data.score);
  });

  // ── 게임 이벤트 수신 ───────────────────────────────────────
  socket.on('game-event', (ev) => { applyGameEvent(ev); });

  // ── P1→P2 전체 상태 동기화 (2초마다) ──────────────────────
  socket.on('host-state', (data) => {
    if (myPlayerNum !== 2) return;
    _applyHostStateData(data);
  });

  // ── 파트너 골인 ────────────────────────────────────────────
  socket.on('partner-goal', () => {
    partnerGoaled = true;
    if (player && typeof addFloat === 'function') {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너 골인! 빨리 와! 🏁', '#ffcc00');
    }
  });

  // ── 파트너 접속 끊김 → 게임 일시정지 ──────────────────────
  socket.on('partner-disconnected-pause', ({ reconnectWindow }) => {
    remotePlayer = null;
    _partnerDisconnectedAt = Date.now();
    if (gameState === 'playing' || gameState === 'dead') {
      gameState = 'paused';
    }
    if (typeof addFloat === 'function' && player) {
      const sec = Math.round(reconnectWindow / 1000);
      addFloat(player.x + player.w / 2, player.y - 40,
        `파트너 연결 끊김 — ${sec}초 대기 중...`, '#ffaa44');
    }
  });

  // ── 파트너 재접속 → 게임 재개 ─────────────────────────────
  socket.on('partner-reconnected', () => {
    _partnerDisconnectedAt = 0;
    if (gameState === 'paused') {
      gameState = 'playing';
      if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
    }
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너 재접속! 계속합니다 🎮', '#44ff88');
    }
  });

  // ── 파트너 재접속 시간 초과 → 솔로 전환 ───────────────────
  socket.on('partner-timeout', () => {
    remotePlayer  = null;
    partnerGoaled = true;
    _partnerDisconnectedAt = 0;
    if (gameState === 'paused') {
      gameState = 'playing';
      if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
    }
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 30, '파트너 연결 시간 초과 — 솔로 모드 😢', '#ff8888');
    }
  });

  // ── 파트너 사망 → 같은 스테이지로 즉시 리셋 ───────────────
  socket.on('partner-died', (data) => {
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너 사망! 스테이지 리셋 💀', '#ff6666');
    }
    if (typeof data === 'object' && typeof data.stageIdx === 'number') stageIdx = data.stageIdx;
    if (typeof initLevel === 'function') initLevel();
    gameState = 'playing';
    if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
  });

  // ── 파트너 게임 오버 → 솔로 전환 ─────────────────────────
  socket.on('partner-gameover', () => {
    remotePlayer  = null;
    partnerGoaled = true;
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 40, '파트너 게임 오버 — 혼자 계속! 🎮', '#ffaa44');
    }
  });

  // ── 방 만료 (10분 경과) ────────────────────────────────────
  socket.on('room-expired', () => {
    isMultiplayer = false;
    myRoomId      = null;
    remotePlayer  = null;
    if (typeof addFloat === 'function' && player) {
      addFloat(player.x + player.w / 2, player.y - 40, '방이 만료되었습니다 (10분 경과)', '#ff8888');
    }
  });
}

// ── 방 만들기 ───────────────────────────────────────────────────
function createRoom() {
  if (!socket) initSocket();
  socket.emit('create-room', (res) => {
    if (!res.ok) { showLobbyError(res.error); return; }
    myPlayerNum   = 1;
    myRoomId      = res.roomId;
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
    myRoomId      = res.roomId;
    isMultiplayer = true;
    // hideLobby / startCountdown은 'start-countdown' 이벤트가 처리
  });
}

// ── 혼자 플레이 ─────────────────────────────────────────────────
function soloPlay() {
  isMultiplayer = false;
  myPlayerNum   = 1;
  myRoomId      = null;
  hideLobby();
  startGame();
}

// ── 골 도달 알림 ────────────────────────────────────────────────
function notifyGoal() {
  if (socket && isMultiplayer) socket.emit('player-goal');
}

// ── 게임 이벤트 전송 ─────────────────────────────────────────────
// evId: 서버 중복 방지용 고유 키
//   - coin/enemy/powerup-removed: 게임 오브젝트 기반 (같은 오브젝트 2번 처리 방지)
//   - boss-hit: 피격 순번 기반
function emitGameEvent(type, idx, extra) {
  if (!socket || !isMultiplayer) return;
  let evId;
  if (type === 'boss-hit' || type === 'boss-dead') {
    evId = `${type}-s${stageIdx}-${++_bossHitSeq}`;
  } else if (type === 'powerup-removed') {
    // 위치 기반 키 (소수점 버림으로 미세 오차 흡수)
    evId = `${type}-s${stageIdx}-${Math.round((extra && extra.pwx) || 0)}-${Math.round((extra && extra.pwy) || 0)}`;
  } else {
    evId = `${type}-s${stageIdx}-i${idx}`;
  }
  socket.emit('game-event', Object.assign({ type, idx, evId }, extra || {}));
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

// ── 호스트 전체 상태 전송 (P1, 2초마다) ────────────────────────
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

// ── 위치 전송 — 델타 동기화 (~30fps) ──────────────────────────
// 변경된 필드만 전송. x/y/vx/vy는 항상 포함 (위치 보간에 필요).
function sendPlayerUpdate() {
  if (!socket || !isMultiplayer || !player) return;
  const now = Date.now();
  if (now - _lastSent < 33) return;
  _lastSent = now;

  const full = {
    x: player.x,            y: player.y,
    vx: player.vx,          vy: player.vy,
    facing:         player.facing,
    state:          player.state,
    frame:          player.frame,
    big:            player.big,
    giant:          player.giant,
    h:              player.h,
    score,
    giantTimer:     player.giantTimer,
    starTimer:      player.starTimer,
    invincible:     player.invincible,
    fireTimer:      player.fireTimer,
    invisibleTimer: player.invisibleTimer,
    blackholeTimer: player.blackholeTimer,
  };

  // 위치/속도는 항상 포함; 나머지는 변경된 것만 포함
  const delta = { x: full.x, y: full.y, vx: full.vx, vy: full.vy };
  const alwaysSend = new Set(['x','y','vx','vy']);
  for (const key in full) {
    if (!alwaysSend.has(key) && full[key] !== _lastSentState[key]) {
      delta[key] = full[key];
    }
  }
  Object.assign(_lastSentState, full);

  socket.emit('player-update', delta);
}

// ── 핑 측정 (5초마다, main loop에서 호출) ──────────────────────
function maybePing() {
  if (!socket || !isMultiplayer) return;
  const now = Date.now();
  if (now - _pingLast < 5000) return;
  _pingLast = now;
  const sent = now;
  socket.emit('ping-check', sent, (ts) => {
    if (typeof ts === 'number') _pingMs = Date.now() - ts;
  });
}

// ── 호스트 스냅샷 적용 (내부 함수) ──────────────────────────────
function _applyHostStateData(data) {
  if (!data) return;
  if (data.enemies && enemies) {
    data.enemies.forEach((es, i) => {
      if (!enemies[i]) return;
      if (!es.alive && enemies[i].alive) enemies[i].alive = false;
      if (es.squished && !enemies[i].squished) {
        enemies[i].squished    = true;
        enemies[i].squishTimer = es.squishTimer | 0;
      }
    });
  }
  if (data.coins && coins) {
    data.coins.forEach((cs, i) => { if (coins[i] && !cs.alive) coins[i].alive = false; });
  }
  if (data.powerups !== undefined) {
    powerups = data.powerups.map(p =>
      Object.assign({ frameTimer: 0, frame: 0, onGround: false, bounced: false }, p)
    );
  }
  if (data.boss && boss) {
    boss.hp = data.boss.hp;
    if (!data.boss.alive) boss.alive = false;
  }
  if (typeof data.score === 'number') score = Math.max(score, data.score);
  if (typeof data.lives === 'number' && data.lives < lives) lives = data.lives;
  if (typeof data.stageIdx === 'number' && data.stageIdx !== stageIdx && gameState === 'playing') {
    stageIdx = data.stageIdx;
    if (typeof initLevel === 'function') initLevel();
    if (typeof startBGM === 'function') startBGM(1 + stageIdx * 0.05);
  }
}

// ── 수신한 게임 이벤트 적용 ──────────────────────────────────────
function applyGameEvent(ev) {
  switch (ev.type) {

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

    case 'powerup-removed':
      if (powerups) {
        const pw = powerups.find(p =>
          p.alive && Math.abs(p.x - ev.pwx) < 40 && Math.abs(p.y - ev.pwy) < 40
        );
        if (pw) pw.alive = false;
      }
      break;

    case 'p2-powerup':
      if (myPlayerNum === 2 && player) {
        const _efns = {
          mushroom:       typeof collectMushroom      !== 'undefined' ? collectMushroom      : null,
          star:           typeof collectStar          !== 'undefined' ? collectStar          : null,
          fire:           typeof collectFire          !== 'undefined' ? collectFire          : null,
          giant_mushroom: typeof collectGiantMushroom !== 'undefined' ? collectGiantMushroom : null,
          lightning:      typeof collectLightning     !== 'undefined' ? collectLightning     : null,
          invisible:      typeof collectInvisible     !== 'undefined' ? collectInvisible     : null,
          blackhole:      typeof collectBlackhole     !== 'undefined' ? collectBlackhole     : null,
        };
        const alreadyHas = (
          (ev.effect === 'mushroom'       && player.big)               ||
          (ev.effect === 'star'           && player.starTimer > 0)     ||
          (ev.effect === 'fire'           && player.fireTimer > 0)     ||
          (ev.effect === 'giant_mushroom' && player.giant)             ||
          (ev.effect === 'invisible'      && player.invisibleTimer > 0)
        );
        if (!alreadyHas && typeof _efns[ev.effect] === 'function') _efns[ev.effect]();
      }
      break;

    case 'boss-hit':
      if (boss && boss.alive && typeof ev.hp === 'number') {
        boss.hp = ev.hp;
        if (boss.hp <= 0) boss.alive = false;
        if (typeof addFloat === 'function' && boss.alive)
          addFloat(boss.x + boss.w / 2, boss.y - 20, `💥 HP:${boss.hp}`, '#ff8800');
      }
      break;

    case 'boss-dead':
      if (boss) {
        boss.alive = false; boss.hp = 0;
        spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, 30,
          ['#ff4444','#ff8800','#ffff00','#ff00ff','#fff','#00ffff'],
          { speed: 7, upBias: 4, life: 50, r: 7, shape: 'star' });
      }
      break;
  }
}

// ── 유틸 ────────────────────────────────────────────────────────
function hideLobby() {
  document.getElementById('lobby').style.display = 'none';
}

function showLobbyError(msg) {
  const el = document.getElementById('mp-error');
  el.textContent   = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}
