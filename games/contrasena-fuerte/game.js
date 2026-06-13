import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'contrasena-fuerte';

// Cada pregunta muestra una contraseña; el niño decide si es FUERTE o DÉBIL.
const LEVELS = [
  {
    label: 'Nivel 1 — Lo básico',
    questions: [
      { pw: '123456',        strong: false, reason: 'Solo números seguidos: ¡la más fácil de adivinar!' },
      { pw: 'Sol3$Luna99',   strong: true,  reason: 'Larga y con mayúsculas, números y un símbolo. ¡Muy fuerte!' },
      { pw: 'luis',          strong: false, reason: 'Es un nombre corto: súper fácil de adivinar.' },
      { pw: 'Tigre$Azul2026', strong: true, reason: 'Larga, con mayúscula, símbolo y números. ¡Excelente!' },
    ],
  },
  {
    label: 'Nivel 2 — Más astuto',
    questions: [
      { pw: 'password',      strong: false, reason: '"password" es de las claves más usadas del mundo.' },
      { pw: 'Kiwi7!verde',   strong: true,  reason: 'Mezcla palabras, número y símbolo. ¡Difícil de adivinar!' },
      { pw: 'qwerty',        strong: false, reason: 'Son teclas seguidas del teclado: muy conocida.' },
      { pw: 'R0bot#Pizza44', strong: true,  reason: 'Larga y con todo: mayúscula, números y símbolo.' },
      { pw: 'mascota',       strong: false, reason: 'Una sola palabra común y corta: débil.' },
    ],
  },
  {
    label: 'Nivel 3 — Experto',
    questions: [
      { pw: 'Ale2015',        strong: false, reason: 'Tu nombre y tu año de nacimiento son fáciles de descubrir.' },
      { pw: 'Bg7$mPq2!xL',    strong: true,  reason: 'Letras al azar, números y símbolos: ¡casi imposible de adivinar!' },
      { pw: 'aaaaaa',         strong: false, reason: 'La misma letra repetida no protege nada.' },
      { pw: 'Cohete#Verde88', strong: true,  reason: 'Larga, variada y sin datos personales. ¡Perfecta!' },
      { pw: 'iloveyou',       strong: false, reason: 'Es una frase famosísima entre las contraseñas filtradas.' },
      { pw: 'Nube*Feliz#31',  strong: true,  reason: 'Combina palabras, símbolos y números. ¡Muy segura!' },
    ],
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let qIndex = 0;
let answered = false;

function build() {
  score = 0;
  qIndex = 0;
  render();
}

function current() {
  return LEVELS[level].questions[qIndex];
}

function render() {
  answered = false;
  const cfg = LEVELS[level];
  const q = current();
  const total = cfg.questions.length;
  const pct = Math.round((qIndex / total) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="cyber-stage">
      <div class="cyber-header">
        <div class="back-row">
          <a href="../../ciberseguridad.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🔐 Contraseña Fuerte</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Esta contraseña es fuerte o débil?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qIndex + 1} de ${total}</div>

      <div class="pw-display">
        <div class="pw-text">${q.pw}</div>
        <div class="meter-wrap"><div class="meter-fill" id="meter"></div></div>
        <div class="meter-label" id="meter-label">&nbsp;</div>
      </div>

      <div class="choice-row">
        <button class="btn btn-success choice-btn" id="btn-strong">💪 Fuerte</button>
        <button class="btn btn-danger choice-btn" id="btn-weak">👎 Débil</button>
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak('¿La contraseña es fuerte o débil?'));
  document.getElementById('btn-strong').addEventListener('click', () => answer(true));
  document.getElementById('btn-weak').addEventListener('click', () => answer(false));
}

async function answer(saidStrong) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = saidStrong === q.strong;

  // Llena el medidor según la fuerza real.
  const meter = document.getElementById('meter');
  const label = document.getElementById('meter-label');
  if (q.strong) {
    meter.style.width = '100%';
    meter.style.background = 'var(--green)';
    label.textContent = '💪 Contraseña fuerte';
    label.style.color = 'var(--green)';
  } else {
    meter.style.width = '28%';
    meter.style.background = 'var(--red)';
    label.textContent = '👎 Contraseña débil';
    label.style.color = 'var(--red)';
  }

  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Correcto! ' : '❌ ¡Casi! '}${q.reason}</div>`;

  document.getElementById('btn-strong').disabled = true;
  document.getElementById('btn-weak').disabled = true;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Casi. ' + q.reason); }

  await delay(correct ? 2000 : 3200);
  next();
}

async function next() {
  qIndex++;
  if (qIndex < LEVELS[level].questions.length) { render(); return; }
  await finishLevel();
}

async function finishLevel() {
  const total = LEVELS[level].questions.length;
  const pct = score / total;
  const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  playSuccess();
  showConfetti();
  const msg = score === total ? `🏆 ¡Perfecto! ${score}/${total}` : `🌟 ${score} de ${total} correctas`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  level++;
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Eres experto en contraseñas!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
