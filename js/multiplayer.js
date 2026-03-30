// ═══════════════════════════════════════════════════════════════
//  Multiplayer  (socket.io)
// ═══════════════════════════════════════════════════════════════
let socket        = null;
let isMultiplayer = false;
let myPlayerNum   = 1;
let remotePlayer  = null;
let _lastSent     = 0;

// ── 소켓 초기화 ─────────────────────────────────────────────────
function initSocket() {
  socket = io();

  // P2가 방에 입장했을 때 (P1에게 알림)
  socket.on('p2-joined', () => {
    document.getElementById('mp-waiting').style.display = 'none';
    document.getElementById('mp-p2ready').style.display = 'block';
    setTimeout(() => { hideLobby(); startGame(); }, 700);
  });

  // 상대방 위치/상태 수신
  socket.on('remote-player-update', (data) => {
    if (!remotePlayer) remotePlayer = {};
    Object.assign(remotePlayer, data);
    remotePlayer.w = data.giant ? GIANT_W : 24;
    // h를 직접 수신해 powerup 애니메이션 중 크기도 정확히 반영
    remotePlayer.h = data.h || (data.giant ? GIANT_H : (data.big ? BIG_H : SML_H));
  });

  // 상대방 접속 끊김
  socket.on('player-disconnected', () => {
    remotePlayer = null;
    if (player && typeof addFloat === 'function') {
      addFloat(player.x + player.w / 2, player.y - 30, '상대방 연결 끊김 😢', '#ff8888');
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

// ── 위치 전송 (게임 루프에서 호출) ─────────────────────────────
function sendPlayerUpdate() {
  if (!socket || !isMultiplayer || !player) return;
  const now = Date.now();
  if (now - _lastSent < 33) return; // ~30fps
  _lastSent = now;
  socket.emit('player-update', {
    x: player.x, y: player.y,
    vx: player.vx, vy: player.vy,
    facing:  player.facing,
    state:   player.state,
    frame:   player.frame,
    big:     player.big,
    giant:   player.giant,
    h:       player.h,
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
