// ═══════════════════════════════════════════════════════════════
//  Main loop
// ═══════════════════════════════════════════════════════════════
function startGame() {
  resetGame();
  loop();
}

function loop(){
  update();
  sendPlayerUpdate(); // 위치/상태 ~30fps 전송
  sendHostState();    // P1만: 전체 게임 상태 2초마다 동기화
  draw();
  requestAnimationFrame(loop);
}
