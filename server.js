require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer);

app.use(express.static(path.join(__dirname)));

const RECONNECT_WINDOW = 30000; // 재접속 허용 시간 (ms)

// rooms[id] = {
//   players:         [socketId|null, socketId|null],  // index = playerNum-1
//   hostState:       null,    // P1의 마지막 전체 상태 스냅샷
//   processedEvents: Set,     // 중복 이벤트 방지
//   reconnectTimers: {},      // { playerNum: timerHandle }
// }
const rooms = {};

function genRoomId() {
  let id;
  do { id = Math.random().toString(36).substr(2, 6).toUpperCase(); }
  while (rooms[id]);
  return id;
}

io.on('connection', (socket) => {

  // ── 방 만들기 ────────────────────────────────────────────────
  socket.on('create-room', (cb) => {
    const roomId = genRoomId();
    rooms[roomId] = {
      players:         [socket.id, null],
      hostState:       null,
      processedEvents: new Set(),
      reconnectTimers: {},
    };
    socket.join(roomId);
    socket.data.roomId    = roomId;
    socket.data.playerNum = 1;
    cb({ ok: true, roomId, playerNum: 1 });
  });

  // ── 방 참여 ──────────────────────────────────────────────────
  socket.on('join-room', (roomId, cb) => {
    const id   = (roomId || '').toUpperCase().trim();
    const room = rooms[id];
    if (!room)                    { cb({ ok: false, error: '방을 찾을 수 없어요 🥺' }); return; }
    if (room.players[1] !== null) { cb({ ok: false, error: '방이 가득 찼어요 😅'    }); return; }

    room.players[1] = socket.id;
    socket.join(id);
    socket.data.roomId    = id;
    socket.data.playerNum = 2;
    cb({ ok: true, roomId: id, playerNum: 2 });
    socket.to(id).emit('p2-joined');
  });

  // ── 재접속 ───────────────────────────────────────────────────
  socket.on('rejoin-room', ({ roomId, playerNum }, cb) => {
    const id   = (roomId || '').toUpperCase().trim();
    const room = rooms[id];
    if (!room) { if (cb) cb({ ok: false, error: '방이 만료되었어요' }); return; }

    const slot = playerNum - 1;
    if (room.players[slot] !== null) {
      if (cb) cb({ ok: false, error: '이미 접속 중인 슬롯입니다' });
      return;
    }

    // 재접속 타이머 취소
    if (room.reconnectTimers[playerNum]) {
      clearTimeout(room.reconnectTimers[playerNum]);
      delete room.reconnectTimers[playerNum];
    }

    room.players[slot] = socket.id;
    socket.join(id);
    socket.data.roomId    = id;
    socket.data.playerNum = playerNum;

    // 재접속한 플레이어에게 마지막 게임 상태 전송
    if (cb) cb({ ok: true, hostState: room.hostState });

    // 상대방에게 재접속 알림
    socket.to(id).emit('partner-reconnected');
  });

  // ── 위치 업데이트 ────────────────────────────────────────────
  socket.on('player-update', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('remote-player-update', data);
  });

  // ── 골 알림 ─────────────────────────────────────────────────
  socket.on('player-goal', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-goal');
  });

  // ── 게임 이벤트 (중복 방지 포함) ─────────────────────────────
  socket.on('game-event', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;

    // evId 기반 중복 차단
    if (data.evId) {
      if (room.processedEvents.has(data.evId)) return;
      room.processedEvents.add(data.evId);
      // 오래된 이벤트 ID 정리 (최근 500개 유지)
      if (room.processedEvents.size > 500) {
        const arr = [...room.processedEvents];
        arr.slice(0, arr.length - 500).forEach(id => room.processedEvents.delete(id));
      }
    }

    socket.to(roomId).emit('game-event', data);
  });

  // ── 호스트 전체 상태 스냅샷 (저장 + 릴레이) ──────────────────
  socket.on('host-state', (data) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (room) room.hostState = data; // 스냅샷 보관 (재접속 시 복구용)
    socket.to(roomId).emit('host-state', data);
  });

  // ── 사망 알림 ────────────────────────────────────────────────
  socket.on('player-died', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-died', data);
  });

  // ── 게임 오버 알림 ───────────────────────────────────────────
  socket.on('player-gameover', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-gameover');
  });

  // ── 접속 끊김 처리 ───────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomId, playerNum } = socket.data || {};
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    // 슬롯 비우기
    const slot = playerNum - 1;
    if (room.players[slot] === socket.id) room.players[slot] = null;

    // 방에 남은 플레이어가 없으면 즉시 삭제
    if (room.players.every(p => p === null)) {
      Object.values(room.reconnectTimers).forEach(t => clearTimeout(t));
      delete rooms[roomId];
      return;
    }

    // 상대방에게 재접속 대기 알림 (30초 카운트다운)
    socket.to(roomId).emit('partner-disconnected-pause', {
      playerNum,
      reconnectWindow: RECONNECT_WINDOW,
    });

    // 30초 타임아웃 타이머
    room.reconnectTimers[playerNum] = setTimeout(() => {
      socket.to(roomId).emit('partner-timeout', { playerNum });
      delete room.reconnectTimers[playerNum];
      if (room.players.every(p => p === null)) delete rooms[roomId];
    }, RECONNECT_WINDOW);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`서버 실행 중 → http://localhost:${PORT}`));
