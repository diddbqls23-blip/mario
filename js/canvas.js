// ═══════════════════════════════════════════════════════════════
//  Canvas setup
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const W = 800, H = 450;

let scaleX = 1, scaleY = 1;

function resize(){
  const sw = window.innerWidth / W;
  const sh = window.innerHeight / H;
  const s  = Math.min(sw, sh);
  canvas.width  = W * s;
  canvas.height = H * s;
  scaleX = s; scaleY = s;
}

window.addEventListener('resize', resize);
resize();
