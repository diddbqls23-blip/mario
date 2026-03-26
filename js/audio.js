// ═══════════════════════════════════════════════════════════════
//  Audio
// ═══════════════════════════════════════════════════════════════
let aCtx = null;
function ac() { if(!aCtx) aCtx = new (window.AudioContext||window.webkitAudioContext)(); return aCtx; }

function beep(freq, type, dur, vol=0.12, startTime=null) {
  try {
    const a=ac(), o=a.createOscillator(), g=a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type=type; o.frequency.value=freq;
    const t = startTime ?? a.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.start(t); o.stop(t+dur);
  } catch(e){}
}

function sndJump()       { beep(440,'square',0.12,0.12); setTimeout(()=>beep(600,'square',0.08,0.08),80); }
function sndDoubleJump() { beep(660,'square',0.07,0.1); setTimeout(()=>beep(880,'square',0.06,0.1),55); setTimeout(()=>beep(1100,'square',0.05,0.1),110); }
function sndCoin()       { beep(988,'sine',0.05,0.18); setTimeout(()=>beep(1319,'sine',0.09,0.18),55); }
function sndStomp()      { beep(200,'square',0.1,0.2); beep(110,'sawtooth',0.14,0.18); }
function sndBreak()      { beep(300,'sawtooth',0.07,0.25); beep(200,'sawtooth',0.1,0.25); }

function sndHurt() {
  [440,330,220].forEach((f,i)=>setTimeout(()=>beep(f,'square',0.12,0.25),i*80));
}
function sndGameOver() {
  const a=ac(), t=a.currentTime;
  [[392,0],[349,0.3],[330,0.6],[294,0.9],[262,1.2]].forEach(([f,d])=>beep(f,'square',0.35,0.2,t+d));
}
function sndMushroom() {
  const a=ac(), t=a.currentTime;
  [[523,0],[659,0.08],[784,0.16],[1047,0.24]].forEach(([f,d])=>beep(f,'square',0.12,0.18,t+d));
}
function sndStar() {
  const a=ac(), t=a.currentTime;
  [[1047,0],[1319,0.06],[1568,0.12],[2093,0.18]].forEach(([f,d])=>beep(f,'sine',0.1,0.22,t+d));
}
function sndWin() {
  const a=ac(), t=a.currentTime;
  [[523,0],[659,0.13],[784,0.26],[659,0.39],[784,0.52],[1047,0.65],[784,0.78],[1047,0.91],[1319,1.04]]
    .forEach(([f,d])=>beep(f,'square',0.15,0.22,t+d));
}
function sndDead() {
  const a=ac(), t=a.currentTime;
  [[440,0],[330,0.12],[220,0.24],[110,0.36]].forEach(([f,d])=>beep(f,'sawtooth',0.12,0.28,t+d));
}
function sndInvincibleTick() { beep(880,'sine',0.04,0.08); beep(1100,'sine',0.04,0.06); }

function sndFire() {
  const a=ac(), t=a.currentTime;
  [[880,0],[1100,0.05],[1320,0.10]].forEach(([f,d])=>beep(f,'sawtooth',0.09,0.14,t+d));
}
function sndFireball() {
  beep(500,'sawtooth',0.05,0.10);
}
function sndFireballHit() {
  const a=ac(), t=a.currentTime;
  beep(350,'sawtooth',0.08,0.12,t);
  beep(200,'sawtooth',0.10,0.14,t+0.06);
}
function sndLightning() {
  const a=ac(), t=a.currentTime;
  beep(60,'sawtooth',0.35,0.28,t);
  beep(120,'sawtooth',0.22,0.25,t+0.02);
  beep(960,'square',0.12,0.12,t+0.08);
  beep(1800,'sine',0.08,0.10,t+0.18);
}
function sndInvisible() {
  const a=ac(), t=a.currentTime;
  [[1319,0],[1047,0.07],[784,0.14],[1047,0.21],[1319,0.28]].forEach(([f,d])=>beep(f,'sine',0.07,0.13,t+d));
}

// 대왕 버섯: 깊고 웅장한 성장 사운드
function sndGiantMushroom() {
  const a=ac(), t=a.currentTime;
  // 저음에서 고음으로 올라가는 웅장한 사운드
  [[65,0],[98,0.1],[130,0.2],[196,0.3],[261,0.4],[392,0.5],[523,0.65]]
    .forEach(([f,d])=>beep(f,'sawtooth',0.18,0.35,t+d));
  // 위에 반짝이는 고음 하이라이트
  [[1568,0.4],[2093,0.55],[2794,0.7]].forEach(([f,d])=>beep(f,'sine',0.07,0.18,t+d));
}

function sndBlackhole(){
  const a=ac(), t=a.currentTime;
  [[100,0],[70,0.1],[50,0.2],[35,0.35]].forEach(([f,d])=>beep(f,'sawtooth',0.28,0.32,t+d));
  [[1200,0],[880,0.15],[660,0.3],[440,0.5]].forEach(([f,d])=>beep(f,'sine',0.06,0.18,t+d));
}
function sndSuck(){
  beep(100,'sawtooth',0.06,0.12);
  beep(180,'sine',0.04,0.06);
}
function sndAbsorb(){
  const a=ac(), t=a.currentTime;
  [[900,0],[500,0.08],[280,0.18],[120,0.3]].forEach(([f,d])=>beep(f,'sawtooth',0.20,0.22,t+d));
  beep(1400,'sine',0.07,0.18,t);
}

// ── BGM Scheduler ────────────────────────────────────────────────
const T = 0.15;
const BGM_NOTES = [
  [659,T],[659,T],[0,T],[659,T],[0,T],[523,T],[659,T],[0,T],
  [784,T*2],[0,T*2],[392,T*2],[0,T*2],
  [523,T*2],[0,T],[392,T*2],[0,T],[330,T*2],[0,T],
  [440,T],[0,T],[494,T],[0,T],[466,T],[440,T],[0,T],
  [392,T*1.5],[659,T*1.5],[784,T*1.5],[880,T],[0,T],[698,T],[784,T],
  [0,T],[659,T*2],[523,T],[440,T],[392,T*2],
  [659,T],[784,T],[0,T],[880,T*2],[0,T],[932,T*2],
  [880,T*2],[0,T],[784,T],[659,T*2],[0,T],
  [523,T],[587,T],[494,T*2],[0,T*2],
  [523,T],[392,T],[330,T*2],[0,T*2],
  [523,T],[0,T],[494,T],[0,T],[466,T],[0,T],[440,T],[0,T],
  [392,T],[659,T],[784,T],[880,T],[0,T],[659,T],[880,T],[932,T*2],
  [880,T*2],[0,T],[784,T],[659,T*2],[0,T],
  [523,T],[587,T],[494,T*2],[0,T*2],
  [392,T*2],[0,T*2],[0,T*2],[0,T*2],
];

const ST = 0.5;
const SPACE_BGM_NOTES = [
  [330,ST],[0,ST*0.5],[294,ST],[0,ST*0.5],[262,ST*2],[0,ST],
  [294,ST],[0,ST*0.5],[330,ST],[0,ST*0.5],[392,ST*2],[0,ST],
  [440,ST],[0,ST*0.5],[392,ST],[0,ST*0.5],[349,ST*2],[0,ST],
  [330,ST*3],[0,ST*1.5],
  [262,ST],[0,ST*0.5],[294,ST],[0,ST*0.5],[330,ST],[0,ST*0.5],[349,ST],[0,ST*0.5],
  [392,ST*2],[0,ST],[440,ST*2],[0,ST],
  [494,ST],[0,ST*0.5],[440,ST],[0,ST*0.5],[392,ST*2],[0,ST],
  [349,ST*3],[0,ST*1.5],
];

let bgmActive=false, bgmNextTime=0, bgmIdx=0, bgmTimer=null, bgmPitch=1, bgmMode='normal';

function startBGM(pitch=1) {
  stopBGM();
  bgmMode = (typeof stageIdx!=='undefined' && stageIdx===5) ? 'space' : 'normal';
  bgmActive=true; bgmPitch=pitch;
  bgmIdx=0; bgmNextTime=ac().currentTime+0.1;
  tickBGM();
}
function stopBGM()  { bgmActive=false; clearTimeout(bgmTimer); }
function tickBGM()  {
  if(!bgmActive) return;
  const a=ac(), ahead=0.12;
  const notes = bgmMode==='space' ? SPACE_BGM_NOTES : BGM_NOTES;
  const wave  = bgmMode==='space' ? 'sine' : 'square';
  const vol   = bgmMode==='space' ? 0.075 : 0.055;
  while(bgmNextTime < a.currentTime + ahead) {
    const [f,d] = notes[bgmIdx];
    if(f>0) beep(f*bgmPitch,wave,d*0.78,vol,bgmNextTime);
    bgmNextTime += d;
    bgmIdx=(bgmIdx+1)%notes.length;
  }
  bgmTimer=setTimeout(tickBGM,25);
}
