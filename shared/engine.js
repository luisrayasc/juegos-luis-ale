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

/* Banderas: convierte emojis de bandera (🇲🇽) en <img> a SVG locales, para que
   se vean igual en todos los dispositivos (incluido Windows, que no dibuja los
   emojis de bandera). `base` es la ruta relativa a la raíz (p. ej. '../../'). */
export function flagImg(str, base = '') {
  return String(str).replace(
    /([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/gu,
    (_, a, b) => {
      const code = String.fromCharCode(97 + (a.codePointAt(0) - 0x1F1E6)) +
                   String.fromCharCode(97 + (b.codePointAt(0) - 0x1F1E6));
      return `<img class="flag" src="${base}assets/flags/${code}.svg" alt="bandera">`;
    }
  );
}

/* Modal de confirmación — bonito, reemplaza al confirm() del navegador.
   Devuelve una promesa que resuelve true (aceptar) o false (cancelar). */
export function showConfirm(message, { okText = 'Sí, borrar', cancelText = 'Cancelar', emoji = '🗑️' } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-emoji">${emoji}</div>
        <div class="modal-msg">${message}</div>
        <div class="modal-actions">
          <button class="btn btn-back modal-cancel">${cancelText}</button>
          <button class="btn btn-danger modal-ok">${okText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    function close(val) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    }
    overlay.querySelector('.modal-ok').addEventListener('click', () => close(true));
    overlay.querySelector('.modal-cancel').addEventListener('click', () => close(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKey);
  });
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
