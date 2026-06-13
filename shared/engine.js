/* Confetti burst — canvas-based, no library */
let _confettiFrame;
let _confettiPieces = [];
let _confettiTicks = 0;

export function showConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#e94560','#f5a623','#4ecdc4','#ffe66d','#a8ff78','#c77dff','#ffffff'];
  _confettiPieces = Array.from({ length: 80 }, () => ({  // reducido de 160 a 80
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.4,
    w: 7 + Math.random() * 8,
    h: 5 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 5,
    vy: 3 + Math.random() * 4,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.15,
  }));

  cancelAnimationFrame(_confettiFrame);
  _confettiTicks = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of _confettiPieces) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.vr;
    }
    _confettiTicks++;
    if (_confettiTicks < 90) {        // reducido de 120 a 90
      _confettiFrame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  draw();
}

/* Web Audio — un solo contexto, con resume automático */
let _audioCtx;
function getAudio() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

export function playTone(freq = 440, type = 'sine', duration = 0.2, vol = 0.35) {
  try {
    const ctx  = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export function playSuccess() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playTone(f, 'sine', 0.22, 0.3), i * 80));
}

export function playError() {
  playTone(220, 'sawtooth', 0.25, 0.25);
}

export function playClick() {
  playTone(880, 'sine', 0.04, 0.15);
}

/* Text-to-speech — diferido para no bloquear el hilo principal */
let _speakTimer;
export function speak(text) {
  if (!window.speechSynthesis) return;
  clearTimeout(_speakTimer);
  _speakTimer = setTimeout(() => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, 80);   // espera 80ms para no interrumpir animaciones
}

/* Toast */
export function showToast(text, durationMs = 1800) {
  let el = document.getElementById('game-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'game-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), durationMs);
}
