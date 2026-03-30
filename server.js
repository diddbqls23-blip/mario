require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const path     = require('path');

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer);

app.use(express.static(path.join(__dirname)));

const rooms = {};

function genRoomId() {
  let id;
  do { id = Math.random().toString(36).substr(2, 6).toUpperCase(); }
  while (rooms[id]);
  return id;
}

io.on('connection', (socket) => {

  socket.on('create-room', (cb) => {
    const roomId = genRoomId();
    rooms[roomId] = { players: [socket.id] };
    socket.join(roomId);
    socket.data.roomId    = roomId;
    socket.data.playerNum = 1;
    cb({ ok: true, roomId, playerNum: 1 });
  });

  socket.on('join-room', (roomId, cb) => {
    const id   = (roomId || '').toUpperCase().trim();
    const room = rooms[id];
    if (!room)                    { cb({ ok: false, error: '방을 찾을 수 없어요 🥺' }); return; }
    if (room.players.length >= 2) { cb({ ok: false, error: '방이 가득 찼어요 😅'    }); return; }
    room.players.push(socket.id);
    socket.join(id);
    socket.data.roomId    = id;
    socket.data.playerNum = 2;
    cb({ ok: true, roomId: id, playerNum: 2 });
    socket.to(id).emit('p2-joined');
  });

  socket.on('player-update', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('remote-player-update', data);
  });

  socket.on('player-goal', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-goal');
  });

  // 코인/적/파워업/보스 등 게임 이벤트 릴레이
  socket.on('game-event', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('game-event', data);
  });

  // P1→P2 전체 게임 상태 동기화 (호스트 권한)
  socket.on('host-state', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('host-state', data);
  });

  // 플레이어 사망 → 상대방에게 레벨 리셋 알림
  socket.on('player-died', (data) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-died', data);
  });

  // 플레이어 게임 오버 → 상대방은 솔로 진행
  socket.on('player-gameover', () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit('partner-gameover');
  });

  socket.on('disconnect', () => {
    const { roomId, playerNum } = socket.data || {};
    if (roomId) {
      socket.to(roomId).emit('player-disconnected', { playerNum });
      const room = rooms[roomId];
      if (room) {
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0) delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`서버 실행 중 → http://localhost:${PORT}`));
