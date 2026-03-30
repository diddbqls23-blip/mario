require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer);

// ── 정적 파일 (에셋 캐싱 1시간) ────────────────────────────────
app.use(express.static(path.join(__dirname), {
  maxAge:     '1h',
  etag:       true,
  lastModified: true,
  setHeaders(res, filePath) {
    // HTML은 캐시 안 함 (항상 최신 버전)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

const RECONNECT_WINDOW = 30000; // 재접속 허용 (ms)
const ROOM_EXPIRE_MS   = 10 * 60 * 1000; // 방 만료 10분
const MAX_SPEED_PX     = 900; // 한 업데이트 주기(~33ms) 허용 최대 이동량 (픽셀)

// rooms[id] = {
//   players:         [socketId|null, socketId|null],
//   hostState:       null,    // 마지막 P1 스냅샷
//   processedEvents: Set,     // 이벤트 중복 방지
//   reconnectTimers: {},      // { playerNum: handle }
//   lastPositions:   {},      // { socketId: {x,y,ts} }  텔레포트 감지용
//   createdAt:       Date.now(),
// }
const rooms = {};

// ── 만료/빈 방 주기적 정리 (1분마다) ────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const id in rooms) {
    const room = rooms[id];
    const expired  = now - room.createdAt > ROOM_EXPIRE_MS;
    const allEmpty = room.players.every(p => p === null);
    if (expired || allEmpty) {
      if (expired) io.to(id).emit('room-expired');
      Object.values(room.reconnectTimers || {}).forEach(t => clearTimeout(t));
      delete rooms[id];
    }
  }
}, 60_000);

function genRoomId() {
  let id;
  do { id = Math.random().toString(36).slice(2, 8).toUpperCase(); }
  while (rooms[id]);
  return id;
}

// ── 입력값 기본 검증 ────────────────────────────────────────────
function isValidNumber(v) { return typeof v === 'number' && isFinite(v); }
function isValidPlayerUpdate(data) {
  if (!data || typeof data !== 'object') return false;
  // x, y는 있으면 숫자여야 함
  if ('x'  in data && !isValidNumber(data.x))  return false;
  if ('y'  in data && !isValidNumber(data.y))  return false;
  if ('vx' in data && !isValidNumber(data.vx)) return false;
  if ('vy' in data && !isValidNumber(data.vy)) return false;
  // 범위 체크 (LEVEL_W ~6000, H ~400)
  if ('x'  in data && (data.x  < -200 || data.x  > 7000))  return false;
  if ('y'  in data && (data.y  < -400 || data.y  > 1200))  return false;
  if ('vx' in data && Math.abs(data.vx) > 60)               return false;
  if ('vy' in data && Math.abs(data.vy) > 40)               return false;
  return true;
}

io.on('connection', (socket) => {

  // ── 방 만들기 ──────────────────────────────────────────────
  socket.on('create-room', (cb) => {
    if (typeof cb !== 'function') return;
    const roomId = genRoomId();
    rooms[roomId] = {
      players:         [socket.id, null],
      hostState:       null,
      processedEvents: new Set(),
      reconnectTimers: {},
      lastPositions:   {},
      createdAt:       Date.now(),
    };
    socket.join(roomId);
    socket.data.roomId    = roomId;
    socket.data.playerNum = 1;
    cb({ ok: true, roomId, playerNum: 1 });
  });

  // ── 방 참여 ────────────────────────────────────────────────
  socket.on('join-room', (roomId, cb) => {
    if (typeof cb !== 'function') return;
    const id   = (roomId || '').toString().toUpperCase().trim().slice(0, 10);
    const room = rooms[id];
    if (!room)                    { cb({ ok: false, error: '방을 찾을 수 없어요 🥺' }); return; }
    if (room.players[1] !== null) { cb({ ok: false, error: '방이 가득 찼어요 😅'    }); return; }

    room.players[1] = socket.id;
    socket.join(id);
    socket.data.roomId    = id;
    socket.data.playerNum = 2;
    cb({ ok: true, roomId: id, playerNum: 2 });

    // 양쪽 모두에게 카운트다운 시작 알림 (P1 로비 숨김 + P2 게임 시작 신호)
    setTimeout(() => { io.to(id).emit('start-countdown', { countdown: 3 }); }, 200);
  });

  // ── 재접속 ────────────────────────────────────────────────
  socket.on('rejoin-room', ({ roomId, playerNum }, cb) => {
    const id   = (roomId || '').toString().toUpperCase().trim();
    const room = rooms[id];
    if (!room) { if (cb) cb({ ok: false, error: '방이 만료되었어요' }); return; }

    const slot = (playerNum | 0) - 1;
    if (slot < 0 || slot > 1 || room.players[slot] !== null) {
      if (cb) cb({ ok: false, error: '이미 접속 중인 슬롯입니다' });
      return;
    }

    if (room.reconnectTimers[playerNum]) {
      clearTimeout(room.reconnectTimers[playerNum]);
      delete room.reconnectTimers[playerNum];
    }

    room.players[slot] = socket.id;
    delete room.lastPositions[socket.id]; // 재접속 시 위치 초기화
    socket.join(id);
    socket.data.roomId    = id;
    socket.data.playerNum = playerNum;

    if (cb) cb({ ok: true, hostState: room.hostState });
    socket.to(id).emit('partner-reconnected');
  });

  // ── 위치 업데이트 (입력 검증 + 텔레포트 감지) ────────────────
  socket.on('player-update', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    // 기본 타입 검증
    if (!isValidPlayerUpdate(data)) return;

    // 텔레포트 감지 (위치 점프 > MAX_SPEED_PX)
    const room = rooms[roomId];
    if (room && 'x' in data && 'y' in data) {
      const last = room.lastPositions[socket.id];
      if (last) {
        const dx = Math.abs(data.x - last.x);
        const dy = Math.abs(data.y - last.y);
        // 죽음/리셋은 순간이동처럼 보이므로 양쪽 모두 큰 경우만 차단
        if (dx > MAX_SPEED_PX && dy > MAX_SPEED_PX) return;
      }
      room.lastPositions[socket.id] = { x: data.x, y: data.y };
    }

    socket.to(roomId).emit('remote-player-update', data);
  });

  // ── 골 알림 ──────────────────────────────────────────────
  socket.on('player-goal', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-goal');
  });

  // ── 게임 이벤트 (중복 방지) ───────────────────────────────
  socket.on('game-event', (data) => {
    if (!data || typeof data !== 'object') return;
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;

    if (data.evId) {
      const id = String(data.evId).slice(0, 64); // 길이 제한
      if (room.processedEvents.has(id)) return;
      room.processedEvents.add(id);
      if (room.processedEvents.size > 500) {
        const arr = [...room.processedEvents];
        arr.slice(0, arr.length - 500).forEach(k => room.processedEvents.delete(k));
      }
    }

    socket.to(roomId).emit('game-event', data);
  });

  // ── 호스트 상태 스냅샷 (저장 + 릴레이) ──────────────────────
  socket.on('host-state', (data) => {
    if (!data || typeof data !== 'object') return;
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (room) room.hostState = data;
    socket.to(roomId).emit('host-state', data);
  });

  // ── 사망 알림 ─────────────────────────────────────────────
  socket.on('player-died', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    // 사망 시 위치 추적 초기화 (리셋 후 순간이동 허용)
    const room = rooms[roomId];
    if (room) delete room.lastPositions[socket.id];
    socket.to(roomId).emit('partner-died', data);
  });

  // ── 게임 오버 알림 ────────────────────────────────────────
  socket.on('player-gameover', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-gameover');
  });

  // ── 핑 측정 (RTT) ─────────────────────────────────────────
  socket.on('ping-check', (ts, cb) => {
    if (typeof cb === 'function' && isValidNumber(ts)) cb(ts);
  });

  // ── 접속 끊김 ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomId, playerNum } = socket.data || {};
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;

    const slot = (playerNum | 0) - 1;
    if (room.players[slot] === socket.id) room.players[slot] = null;
    delete room.lastPositions[socket.id];

    const hasOthers = room.players.some(p => p !== null);
    if (!hasOthers) {
      Object.values(room.reconnectTimers).forEach(t => clearTimeout(t));
      delete rooms[roomId];
      return;
    }

    socket.to(roomId).emit('partner-disconnected-pause', {
      reconnectWindow: RECONNECT_WINDOW,
    });

    room.reconnectTimers[playerNum] = setTimeout(() => {
      socket.to(roomId).emit('partner-timeout', { playerNum });
      delete room.reconnectTimers[playerNum];
      if (room.players.every(p => p === null)) delete rooms[roomId];
    }, RECONNECT_WINDOW);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`서버 실행 중 → http://localhost:${PORT}`));
