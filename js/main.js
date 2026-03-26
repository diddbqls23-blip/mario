// ═══════════════════════════════════════════════════════════════
//  Main loop
// ═══════════════════════════════════════════════════════════════
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
