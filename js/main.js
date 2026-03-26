// ═══════════════════════════════════════════════════════════════
//  Main loop
// ═══════════════════════════════════════════════════════════════
function startGame() {
  resetGame();
  loop();
}

function loop(){
  update();
  sendPlayerUpdate(); // multiplayer.js에서 정의; 솔로 모드면 no-op
  draw();
  requestAnimationFrame(loop);
}
