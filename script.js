/* ================================================================
   BIRTHDAY WEBSITE — script.js  (REDESIGN v2)
   Full interactive logic: Vault, Countdown, Candles, Mic, Photos, Confetti
================================================================ */

'use strict';

// ================================================================
// SECTION 1 — DOM REFERENCES
// ================================================================
const $ = id => document.getElementById(id);

// Screens & overlay
const vaultScreen = $('vaultScreen');
const birthdayScreen = $('birthdayScreen');
const transitionOverlay = $('transitionOverlay');
const balloonsLayer = $('balloonsLayer');

// Vault elements
const vault = $('vault');
const vaultHandle = $('vaultHandle');
const displayText = $('displayText');
const vaultError = $('vaultError');
const keypad = $('keypad');

// Birthday elements
const birthdayTitle = $('birthdayTitle');
const birthdaySubtitle = $('birthdaySubtitle');
const countdownWrapper = $('countdownWrapper');
const countdownNumber = $('countdownNumber');
const cakeContainer = $('cakeContainer');
const cakeWrapper = $('cakeWrapper');
const cakeScene = $('cakeScene');
const orbitRing = $('orbitRing');
const candlesRow = $('candlesRow');
const candleWraps = document.querySelectorAll('.candle-wrap');
const blowPrompt = $('blowPrompt');
const blowControls = $('blowControls');
const blowBtn = $('blowBtn');
const micStatus = $('micStatus');
const photoGallery = $('photoGallery');
const polaroids = document.querySelectorAll('.polaroid');
const finalMessage = $('finalMessage');
const msgLines = document.querySelectorAll('.msg-line');
const confettiContainer = $('confettiContainer');
const musicBtn = $('musicBtn');
const bgMusic = $('bgMusic');
const canvas = $('particleCanvas');
const ctx = canvas.getContext('2d');

// ================================================================
// SECTION 2 — STATE
// ================================================================
const CORRECT_CODE = '20120706';
let enteredCode = '';
let candlesBlow = false;
let micListening = false;
let micStream = null;
let audioContext = null;
let musicPlaying = false;

// ================================================================
// SECTION 3 — PARTICLE / SPARKLE BACKGROUND
// ================================================================
const particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles(count = 80) {
  particles.length = 0;
  for (let i = 0; i < count; i++) particles.push(newParticle());
}

function newParticle() {
  const types = ['sparkle', 'dot', 'star'];
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -Math.random() * 0.45 - 0.08,
    alpha: Math.random(),
    alphaDir: Math.random() > 0.5 ? 1 : -1,
    size: Math.random() * 2.2 + 0.5,
    type: types[Math.floor(Math.random() * types.length)],
    color: randomColor(),
    twinkleSpd: Math.random() * 0.018 + 0.004,
  };
}

function randomColor() {
  const p = [
    'rgba(255,255,255,',
    'rgba(255,180,190,',
    'rgba(255,220,100,',
    'rgba(255,100,130,',
    'rgba(255,240,200,',
  ];
  return p[Math.floor(Math.random() * p.length)];
}

function drawParticle(p) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

  if (p.type === 'sparkle') {
    ctx.fillStyle = p.color + '1)';
    ctx.shadowColor = p.color + '1)';
    ctx.shadowBlur = 7;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? p.size * 2.4 : p.size * 0.75;
      ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.type === 'star') {
    ctx.fillStyle = p.color + '0.9)';
    ctx.font = `${p.size * 6}px serif`;
    ctx.fillText('✦', p.x, p.y);
  } else {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color + '0.75)';
    ctx.fill();
  }

  ctx.restore();
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha += p.alphaDir * p.twinkleSpd;
    if (p.alpha >= 1 || p.alpha <= 0) p.alphaDir *= -1;
    if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
    if (p.x < -10) { p.x = canvas.width + 10; }
    if (p.x > canvas.width + 10) { p.x = -10; }
    drawParticle(p);
  });
  requestAnimationFrame(animateParticles);
}

// Init
resizeCanvas();
createParticles(90);
animateParticles();
window.addEventListener('resize', () => {
  resizeCanvas();
  createParticles(90);
});

// ================================================================
// SECTION 4 — VAULT DISPLAY
// ================================================================

function updateDisplay() {
  const filled = enteredCode.padEnd(8, '_');
  displayText.textContent = filled.split('').join(' ');
}

function triggerKeyRipple(btn) {
  btn.classList.remove('ripple');
  void btn.offsetWidth;
  btn.classList.add('ripple');
  setTimeout(() => btn.classList.remove('ripple'), 450);
}

function wrongCode() {
  vault.classList.remove('shake');
  void vault.offsetWidth;
  vault.classList.add('shake');
  vault.addEventListener('animationend', () => vault.classList.remove('shake'), { once: true });

  vaultError.classList.add('visible');
  setTimeout(() => vaultError.classList.remove('visible'), 2400);

  setTimeout(() => {
    enteredCode = '';
    updateDisplay();
  }, 600);
}

function correctCode() {
  vault.classList.add('unlock');

  // Cinematic transition
  setTimeout(() => {
    transitionOverlay.classList.add('visible');
  }, 700);

  setTimeout(() => {
    vaultScreen.classList.remove('active');
    birthdayScreen.classList.add('active');
    musicBtn.classList.add('visible');
    // Balloons follow us to birthday screen
    startBirthdayScene();
    tryAutoplayMusic();
  }, 1500);

  setTimeout(() => {
    transitionOverlay.classList.remove('visible');
  }, 2400);
}

// Keypad click handler
keypad.addEventListener('click', e => {
  const key = e.target.closest('.key');
  if (!key) return;
  triggerKeyRipple(key);

  const num = key.dataset.num;
  const action = key.dataset.action;

  if (num !== undefined) {
    if (enteredCode.length < 8) {
      enteredCode += num;
      updateDisplay();
    }
  } else if (action === 'clear') {
    enteredCode = enteredCode.slice(0, -1);
    updateDisplay();
    vaultError.classList.remove('visible');
  } else if (action === 'enter') {
    if (enteredCode === CORRECT_CODE) correctCode();
    else wrongCode();
  }
});

// Physical keyboard support
document.addEventListener('keydown', e => {
  if (!vaultScreen.classList.contains('active')) return;
  if (e.key >= '0' && e.key <= '9') {
    if (enteredCode.length < 8) { enteredCode += e.key; updateDisplay(); }
  } else if (e.key === 'Backspace') {
    enteredCode = enteredCode.slice(0, -1);
    updateDisplay();
  } else if (e.key === 'Enter') {
    if (enteredCode === CORRECT_CODE) correctCode();
    else wrongCode();
  }
});

updateDisplay();

// ================================================================
// SECTION 5 — BIRTHDAY SCENE ORCHESTRATION
// ================================================================

function startBirthdayScene() {
  // Titles appear
  setTimeout(() => birthdayTitle.classList.add('visible'), 400);
  setTimeout(() => birthdaySubtitle.classList.add('visible'), 900);

  // Countdown
  setTimeout(() => {
    countdownWrapper.classList.add('visible');
    runCountdown(5, () => {
      // fade out countdown
      countdownWrapper.style.transition = 'opacity 0.5s ease';
      countdownWrapper.style.opacity = '0';
      setTimeout(() => { countdownWrapper.style.display = 'none'; }, 500);
      // Light candles
      lightCandlesSequentially();
    });
  }, 1400);
}

function runCountdown(from, onDone) {
  let current = from;
  function tick() {
    countdownNumber.textContent = current;
    countdownNumber.style.animation = 'none';
    void countdownNumber.offsetWidth;
    countdownNumber.style.animation = 'countPulse 1s ease';
    if (current > 0) {
      current--;
      setTimeout(tick, 1000);
    } else {
      countdownNumber.textContent = '🎂';
      countdownNumber.style.animation = 'none';
      void countdownNumber.offsetWidth;
      countdownNumber.style.animation = 'countPulse 1s ease';
      setTimeout(onDone, 800);
    }
  }
  tick();
}

// ================================================================
// SECTION 6 — CANDLE LIGHTING
// ================================================================

function lightCandlesSequentially() {
  cakeWrapper.classList.add('paused');

  candleWraps.forEach((wrap, i) => {
    setTimeout(() => {
      wrap.classList.add('lit');
      createCandleSparkle(wrap);

      if (i === candleWraps.length - 1) {
        setTimeout(() => {
          cakeWrapper.classList.remove('paused');
          showBlowPrompt();
        }, 500);
      }
    }, i * 420 + 200);
  });
}

function createCandleSparkle(wrap) {
  const rect = wrap.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div');
    const angle = (i / 8) * 360;
    const dist = 18 + Math.random() * 18;
    const dx = Math.cos((angle * Math.PI) / 180) * dist;
    const dy = Math.sin((angle * Math.PI) / 180) * dist;
    const colors = ['#FFD700', '#FF6B00', '#FFF', '#ff4466'];
    const color = colors[i % colors.length];

    const kId = `sparkOut_${Date.now()}_${i}`;
    const style = document.createElement('style');
    style.textContent = `@keyframes ${kId}{0%{transform:translate(0,0) scale(1);opacity:1;}100%{transform:translate(${dx}px,${dy}px) scale(0);opacity:0;}}`;
    document.head.appendChild(style);

    s.style.cssText = `
      position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top}px;
      width:5px;height:5px;border-radius:50%;background:${color};
      pointer-events:none;z-index:1000;
      animation:${kId} 0.65s ease forwards;
    `;
    document.body.appendChild(s);
    setTimeout(() => { s.remove(); style.remove(); }, 700);
  }
}

// ================================================================
// SECTION 7 — BLOW PROMPT & MIC
// ================================================================

function showBlowPrompt() {
  blowPrompt.classList.add('visible');
  blowControls.classList.add('visible');
  initMicrophone();
}

async function initMicrophone() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micStatus.textContent = '🎤 المايك غير متاح — استخدمي الزر!';
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    micStatus.textContent = '🎤 المايك جاهز — انفخي!';
    micListening = true;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let blowFrames = 0;

    function detectBlow() {
      if (!micListening || candlesBlow) return;
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
      if (avg > 88) {
        blowFrames++;
        if (blowFrames > 4) { triggerBlow(); return; }
      } else {
        blowFrames = Math.max(0, blowFrames - 1);
      }
      requestAnimationFrame(detectBlow);
    }
    detectBlow();
  } catch {
    micStatus.textContent = '🎤 المايك محجوب — استخدمي الزر!';
  }
}

function stopMicrophone() {
  micListening = false;
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
}

blowBtn.addEventListener('click', () => { if (!candlesBlow) triggerBlow(); });

// ================================================================
// SECTION 8 — BLOW SEQUENCE
// ================================================================

function triggerBlow() {
  if (candlesBlow) return;
  candlesBlow = true;
  stopMicrophone();

  blowPrompt.classList.remove('visible');
  blowControls.style.opacity = '0';
  blowControls.style.pointerEvents = 'none';

  extinguishCandles();
  createGlowBurst();
  setTimeout(launchConfetti, 300);

  // Cake 360° spin (whole wrapper), then photos fly out
  setTimeout(() => {
    cakeWrapper.classList.remove('paused');
    cakeWrapper.classList.add('spinning');
    setTimeout(() => {
      cakeWrapper.classList.remove('spinning');
      flyOutPhotos();
    }, 1350);
  }, 700);
}

function extinguishCandles() {
  candleWraps.forEach((wrap, i) => {
    setTimeout(() => {
      const flame = wrap.querySelector('.flame');
      if (flame) flame.style.animation = 'flameFlicker 0.04s ease-in-out infinite alternate';
      setTimeout(() => wrap.classList.add('extinguished'), 110);
    }, i * 75);
  });
}

function createGlowBurst() {
  const burst = document.createElement('div');
  burst.className = 'glow-burst';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1900);
}

// ================================================================
// SECTION 9 — CONFETTI
// ================================================================
const CONFETTI_COLORS = ['#C1121F', '#F4C430', '#FFE066', '#FF6B6B', '#fff', '#FFB347', '#ff88aa', '#ffcc44'];

function launchConfetti() {
  for (let i = 0; i < 180; i++) setTimeout(spawnConfettiPiece, i * 17);
  setTimeout(() => { for (let i = 0; i < 80; i++) setTimeout(spawnConfettiPiece, i * 24); }, 1700);
}

function spawnConfettiPiece() {
  const el = document.createElement('div');
  el.className = 'confetti-piece';
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const left = Math.random() * 100;
  const size = Math.random() * 8 + 5;
  const dur = Math.random() * 2.5 + 2.5;
  const delay = Math.random() * 0.5;
  const skew = (Math.random() - 0.5) * 30;
  const shape = Math.random() > 0.5 ? '50%' : '2px';

  el.style.cssText = `
    left:${left}%;
    width:${size}px;height:${size * (Math.random() > 0.5 ? 0.5 : 1)}px;
    background:${color};border-radius:${shape};
    transform:skewX(${skew}deg);
    animation:confettiFall ${dur}s ${delay}s linear forwards;
  `;
  confettiContainer.appendChild(el);
  setTimeout(() => el.remove(), (dur + delay + 0.5) * 1000);
}

// ================================================================
// SECTION 10 — PHOTO POSITIONS
// Layout: 2 on left | 1 center-top | 2 on right
// ================================================================

function getPhotoPositions() {
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Target viewport positions (optimized for 1080x1920 and desktop)
  // Layout: 2 left | 1 center-top | 2 right
  const rawPositions = [
    { x: W * 0.15, y: H * 0.18 },   // left-top
    { x: W * 0.12, y: H * 0.65 },   // left-bottom
    { x: W * 0.50, y: H * 0.10 },   // center-top (above cake)
    { x: W * 0.85, y: H * 0.18 },   // right-top
    { x: W * 0.88, y: H * 0.65 },   // right-bottom
  ];

  const pw = 145; const ph = 175;

  // Clamp positions to ensure they don't overflow the viewport on smaller screens
  return rawPositions.map(pos => ({
    x: Math.max(pw / 2 + 10, Math.min(W - pw / 2 - 10, pos.x)),
    y: Math.max(ph / 2 + 10, Math.min(H - ph / 2 - 10, pos.y)),
  }));
}

function flyOutPhotos() {
  // Gallery rect — polaroids are position:absolute relative to this
  const galleryRect = photoGallery.getBoundingClientRect();
  const cakeRect   = cakeContainer.getBoundingClientRect();

  // Origin: cake center, relative to photo-gallery
  const originX = (cakeRect.left + cakeRect.width  / 2) - galleryRect.left;
  const originY = (cakeRect.top  + cakeRect.height / 2) - galleryRect.top;

  // Gallery dimensions (use these for % calculations — avoids viewport offset bugs)
  const GW = galleryRect.width;
  const GH = galleryRect.height;
  const pw = 145, ph = 175;

  // Target positions — all gallery-relative
  const rawPositions = [
    { x: GW * 0.15, y: GH * 0.20 },   // left-top
    { x: GW * 0.12, y: GH * 0.72 },   // left-bottom
    { x: GW * 0.50, y: GH * 0.08 },   // center-top (above cake)
    { x: GW * 0.85, y: GH * 0.20 },   // right-top
    { x: GW * 0.88, y: GH * 0.72 },   // right-bottom
  ];

  // Clamp so photos don't escape the gallery bounds
  const positions = rawPositions.map(pos => ({
    x: Math.max(pw / 2 + 10, Math.min(GW - pw / 2 - 10, pos.x)),
    y: Math.max(ph / 2 + 10, Math.min(GH - ph / 2 - 10, pos.y)),
  }));

  // Angles for each slot
  const angles = [-12, 8, -5, 10, -8];

  // Start all photos at cake center, invisible
  polaroids.forEach((p, i) => {
    p.style.setProperty('--angle', angles[i] + 'deg');
    p.style.transition  = 'none';
    p.style.left        = `${originX}px`;
    p.style.top         = `${originY}px`;
    p.style.marginLeft  = `-${p.offsetWidth  / 2}px`;
    p.style.marginTop   = `-${p.offsetHeight / 2}px`;
    p.style.opacity     = '0';
    p.style.transform   = `rotate(${angles[i]}deg) scale(0)`;
  });

  void polaroids[0].offsetWidth; // force reflow

  polaroids.forEach((p, i) => {
    const pos = positions[i];
    setTimeout(() => {
      p.style.left       = `${pos.x}px`;
      p.style.top        = `${pos.y}px`;
      p.style.marginLeft = `-${p.offsetWidth  / 2}px`;
      p.style.marginTop  = `-${p.offsetHeight / 2}px`;
      p.classList.add('landed');

      if (i === polaroids.length - 1) {
        setTimeout(showFinalMessage, 1000);
      }
    }, i * 240 + 80);
  });
}

// ================================================================
// SECTION 11 — FINAL MESSAGE
// ================================================================

function showFinalMessage() {
  finalMessage.classList.add('visible');
  msgLines.forEach((line, i) => {
    setTimeout(() => line.classList.add('visible'), i * 420 + 300);
  });
  setTimeout(() => {
    finalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 800);
}

// ================================================================
// SECTION 12 — MUSIC
// ================================================================

function tryAutoplayMusic() {
  bgMusic.volume = 0.4;
  bgMusic.play().then(() => {
    musicPlaying = true;
    musicBtn.textContent = '🎵 إيقاف الموسيقى';
  }).catch(() => {
    musicBtn.textContent = '🎵 تشغيل الموسيقى';
  });
}

musicBtn.addEventListener('click', () => {
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    musicBtn.textContent = '🎵 تشغيل الموسيقى';
  } else {
    bgMusic.volume = 0.4;
    bgMusic.play().then(() => {
      musicPlaying = true;
      musicBtn.textContent = '🎵 إيقاف الموسيقى';
    }).catch(() => { });
  }
});

// ================================================================
// SECTION 13 — WHEEL HOVER EFFECT
// ================================================================
vaultHandle.addEventListener('mouseenter', () => vaultHandle.style.filter = 'brightness(1.25)');
vaultHandle.addEventListener('mouseleave', () => vaultHandle.style.filter = '');

// ================================================================
// SECTION 14 — POST-BLOW CELEBRATION ORBS
// ================================================================
function spawnCelebrationOrbs() {
  const colors = ['#C1121F', '#F4C430', '#fff', '#FFB347', '#ff88aa', '#ffcc44'];
  for (let i = 0; i < 25; i++) {
    const orb = document.createElement('div');
    const size = Math.random() * 14 + 7;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const kId = `orb_${i}_${Date.now()}`;
    const dx = (Math.random() - 0.5) * 90;
    const dy = (Math.random() - 0.5) * 90;
    const style = document.createElement('style');
    style.textContent = `@keyframes ${kId}{0%{transform:translate(0,0) scale(1);}100%{transform:translate(${dx}px,${dy}px) scale(${0.5 + Math.random()});}}`;
    document.head.appendChild(style);
    orb.style.cssText = `
      position:fixed;left:${Math.random() * 100}vw;top:${Math.random() * 100}vh;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};opacity:0.75;pointer-events:none;z-index:300;
      animation:${kId} ${2 + Math.random() * 3}s ease-in-out infinite alternate;
    `;
    document.body.appendChild(orb);
    setTimeout(() => { orb.remove(); style.remove(); }, 6500);
  }
}

// Watch for all candles extinguished then launch orbs
const orbObserver = new MutationObserver(() => {
  const ext = document.querySelectorAll('.candle-wrap.extinguished');
  if (ext.length === candleWraps.length) {
    spawnCelebrationOrbs();
    orbObserver.disconnect();
  }
});
orbObserver.observe(candlesRow, { subtree: true, attributes: true, attributeFilter: ['class'] });

// ================================================================
// SECTION 15 — INIT LOG
// ================================================================
updateDisplay();
console.log('%c🎂 Happy Birthday! 🎂', 'color:#F4C430;font-size:24px;font-weight:bold;');
console.log('%cHint: الرمز هو تاريخ الميلاد 😉', 'color:#C1121F;font-size:14px;');
