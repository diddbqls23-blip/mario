// ═══════════════════════════════════════════════════════════════
//  Input
// ═══════════════════════════════════════════════════════════════
const keys = {};

function doJump(){
  if(gameState==='title'){ gameState='playing'; startBGM(1); return; }
  if(gameState==='gameover'){ resetGame(); gameState='playing'; startBGM(1); return; }
  if(gameState==='stageclear'){ nextStage(); return; }
  if(gameState==='allclear'){ resetGame(); gameState='playing'; startBGM(1); return; }

  const p = player;
  if(gameState==='playing' && p && p.state!=='dead' && p.state!=='win'){
    if(p.jumpCooldown===0){
      const isSecond = !p.onGround && p.jumpsLeft===1;
      const jumpMult = (p.jumpBoostTimer > 0) ? 1.28 : 1.0;
      p.vy = isSecond ? JUMP2_V * jumpMult : JUMP_V * jumpMult;
      if(p.jumpsLeft>0) p.jumpsLeft--;
      p.jumpHeld = true;
      p.jumpTimer = 12;
      p.lastJumpWas2nd = false;
      p.onGround = false;
      p.jumpCooldown = 18;
      const fx = p.x + p.w/2;
      const fy = p.y + p.h;
      spawnParticles(fx, fy, 7,
        ['#ffffff','#cceeff','#aaddff','#88ccff','#eeeeff'],
        {speed:2.5, upBias:-1, life:18, r:3, gravity:false});
      if(isSecond) sndDoubleJump();
      else         sndJump();
    }
  }
}

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='ArrowLeft'||e.code==='ArrowRight'||e.code==='KeyX') e.preventDefault();

  // 상점 열기 / 닫기 (Escape 전용; 멀티플레이 P2의 S키 충돌 방지)
  if(!e.repeat && e.code==='Escape'){
    if(gameState==='playing'){ gameState='shop'; shopSelectedIdx=0; shopMsg=null; return; }
    if(gameState==='shop'){ gameState='playing'; return; }
  }

  // 상점 내 조작
  if(gameState==='shop'){
    if(!e.repeat){
      if(e.code==='ArrowUp'){
        shopSelectedIdx=(shopSelectedIdx-1+SHOP_ITEMS.length)%SHOP_ITEMS.length;
      }
      if(e.code==='ArrowDown'){
        shopSelectedIdx=(shopSelectedIdx+1)%SHOP_ITEMS.length;
      }
      if(e.code==='Space'||e.code==='Enter'||e.code==='KeyZ'){
        buyShopItem();
      }
    }
    return;
  }

  // 점프 트리거: Space 또는 ArrowUp (P1/P2 공통)
  if((e.code==='Space'||e.code==='ArrowUp') && !e.repeat) doJump();
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if((e.code==='Space'||e.code==='ArrowUp') && player) player.jumpHeld = false;
});

// ── 터치 버튼 ─────────────────────────────────────────────────
function setupTouchButtons(){
  const btnMap = {
    'btn-left':  ()=>{ keys['ArrowLeft']=true;  },
    'btn-right': ()=>{ keys['ArrowRight']=true; },
    'btn-jump':  ()=>{ keys['Space']=true; doJump(); },
    'btn-fire':  ()=>{ keys['KeyZ']=true; },
    'btn-run':   ()=>{ keys['ShiftLeft']=true; },
    'btn-suck':  ()=>{ keys['KeyX']=true; },
  };
  const releaseMap = {
    'btn-left':  ()=>{ keys['ArrowLeft']=false;  },
    'btn-right': ()=>{ keys['ArrowRight']=false; },
    'btn-jump':  ()=>{ keys['Space']=false; if(player) player.jumpHeld=false; },
    'btn-fire':  ()=>{ keys['KeyZ']=false; },
    'btn-run':   ()=>{ keys['ShiftLeft']=false; },
    'btn-suck':  ()=>{ keys['KeyX']=false; },
  };
  Object.keys(btnMap).forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    const press=btnMap[id], release=releaseMap[id];
    el.addEventListener('touchstart',e=>{e.preventDefault();press();},{passive:false});
    el.addEventListener('touchend',  e=>{e.preventDefault();release();},{passive:false});
    el.addEventListener('touchcancel',e=>{e.preventDefault();release();},{passive:false});
    // 마우스 지원 (데스크탑 테스트용)
    el.addEventListener('mousedown',e=>{e.preventDefault();press();});
    el.addEventListener('mouseup',  e=>{e.preventDefault();release();});
    el.addEventListener('mouseleave',e=>{release();});
  });
}
window.addEventListener('DOMContentLoaded', setupTouchButtons);
