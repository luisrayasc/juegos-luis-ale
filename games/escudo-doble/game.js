import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'escudo-doble';

// Verificación en 2 pasos: la clave ya es correcta (paso 1) y hay que escribir
// el código que "llega al teléfono" (paso 2). Más nivel = código más largo.
const LEVELS = [
  { label: 'Nivel 1 — Código de 4', digits: 4, rounds: 3 },
  { label: 'Nivel 2 — Código de 5', digits: 5, rounds: 3 },
  { label: 'Nivel 3 — Código de 6', digits: 6, rounds: 4 },
];

const APPS = ['tu correo', 'tu juego favorito', 'tu cuenta de videos', 'tu nube de fotos', 'tu chat'];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let roundNum = 0;
let code = '';
let userInput = '';
let appName = '';
let answered = false;

function build() { score = 0; roundNum = 0; nextRound(); }

function makeCode(digits) {
  let c = '';
  for (let i = 0; i < digits; i++) c += Math.floor(Math.random() * 10);
  return c;
}

function nextRound() {
  const cfg = LEVELS[level];
  answered = false;
  userInput = '';
  roundNum++;
  code = makeCode(cfg.digits);
  appName = APPS[Math.floor(Math.random() * APPS.length)];
  render();
}

function render() {
  const cfg = LEVELS[level];
  const pct = Math.round(((roundNum - 1) / cfg.rounds) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="cyber-stage">
      <div class="cyber-header">
        <div class="back-row">
          <a href="../../ciberseguridad.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🛡️ Escudo Doble</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Entrando a ${appName}.</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Acceso ${roundNum} de ${cfg.rounds}</div>

      <div class="steps">
        <span class="step-chip done">✅ Paso 1: Clave</span>
        <span class="step-chip active">🔢 Paso 2: Código</span>
      </div>

      <div class="phone">
        <div class="phone-top">📱 Tu teléfono recibió un código:</div>
        <div class="code-big">${code}</div>
      </div>

      <div class="verify-box">
        <input class="verify-input" id="verify-input" type="text" inputmode="numeric"
               placeholder="${'•'.repeat(code.length)}" maxlength="${code.length}" readonly value="${userInput}">
      </div>

      <div class="numpad" id="numpad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="numpad-btn" data-n="${n}">${n}</button>`).join('')}
        <button class="numpad-btn delete" id="btn-del">⌫</button>
        <button class="numpad-btn" data-n="0">0</button>
        <button class="numpad-btn check" id="btn-check">✅</button>
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`Escribe el código que llegó a tu teléfono: ${code.split('').join(' ')}`));
  document.querySelectorAll('[data-n]').forEach(b =>
    b.addEventListener('click', () => pressDigit(b.dataset.n)));
  document.getElementById('btn-del').addEventListener('click', pressDelete);
  document.getElementById('btn-check').addEventListener('click', check);
  document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  if (answered) return;
  if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
  if (e.key === 'Backspace') pressDelete();
  if (e.key === 'Enter') check();
}

function pressDigit(d) {
  if (answered || userInput.length >= code.length) return;
  playTone(600 + parseInt(d) * 30, 'sine', 0.05, 0.2);
  userInput += d;
  updateDisplay();
}

function pressDelete() {
  if (answered) return;
  playClick();
  userInput = userInput.slice(0, -1);
  updateDisplay();
}

function updateDisplay() {
  const inp = document.getElementById('verify-input');
  if (inp) inp.value = userInput;
}

async function check() {
  if (answered) return;
  if (userInput.length < code.length) {
    showToast('Escribe el código completo', 1200);
    speak('Escribe el código completo.');
    return;
  }
  answered = true;
  document.removeEventListener('keydown', handleKeydown);
  const inp = document.getElementById('verify-input');
  disableNumpad();

  if (userInput === code) {
    inp.classList.add('correct');
    score++;
    playTone(660, 'sine', 0.25, 0.4);
    speak('¡Acceso correcto! El segundo paso te protege.');
    showToast('🔓 ¡Acceso seguro!', 1400);
  } else {
    inp.classList.add('wrong');
    playError();
    speak(`Casi. El código era ${code.split('').join(' ')}.`);
    await delay(500);
    inp.value = code;
    inp.classList.remove('wrong');
    inp.classList.add('correct');
  }

  await delay(1500);
  const cfg = LEVELS[level];
  if (roundNum >= cfg.rounds) await finishLevel();
  else nextRound();
}

function disableNumpad() {
  document.querySelectorAll('.numpad-btn').forEach(b => {
    b.style.opacity = '0.4';
    b.style.pointerEvents = 'none';
  });
}

async function finishLevel() {
  const cfg = LEVELS[level];
  const pct = score / cfg.rounds;
  const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  playSuccess();
  showConfetti();
  const msg = score === cfg.rounds ? `🏆 ¡Perfecto! ${score}/${cfg.rounds}` : `🌟 ${score} de ${cfg.rounds} accesos`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  level++;
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Dominas el escudo doble!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
