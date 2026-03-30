// ═══════════════════════════════════════════════════════════════
//  Main loop
// ═══════════════════════════════════════════════════════════════
let _countdownStartTime = 0; // draw.js / update.js에서 참조

function startGame() {
  resetGame();
  loop();
}

// 멀티플레이어 게임 시작 전 3,2,1 카운트다운
function startCountdown() {
  resetGame();
  gameState = 'countdown';
  _countdownStartTime = Date.now();
  loop();
}

function loop(){
  update();
  sendPlayerUpdate(); // 위치/상태 ~30fps 전송
  sendHostState();    // P1만: 전체 게임 상태 2초마다 동기화
  maybePing();        // 핑 측정 5초마다
  draw();
  requestAnimationFrame(loop);
}
