import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'secreto-publico';

// secret:true = es información privada que NO se debe compartir.
const LEVELS = [
  {
    label: 'Nivel 1 — Lo básico',
    questions: [
      { emoji: '🎨', text: 'Tu color favorito', secret: false, reason: 'Tu color favorito no es peligroso: lo puedes compartir.' },
      { emoji: '🔑', text: 'Tu contraseña', secret: true, reason: 'La contraseña es SÚPER secreta. ¡Nunca se comparte!' },
      { emoji: '🏠', text: 'La dirección de tu casa', secret: true, reason: 'Tu dirección es privada: solo la saben tu familia y personas de confianza.' },
      { emoji: '⚽', text: 'Tu deporte favorito', secret: false, reason: 'Tu deporte favorito se puede compartir sin problema.' },
    ],
  },
  {
    label: 'Nivel 2 — A pensar',
    questions: [
      { emoji: '📞', text: 'Tu número de teléfono', secret: true, reason: 'Tu teléfono es privado; dáselo solo a personas de confianza.' },
      { emoji: '🍕', text: 'Tu comida favorita', secret: false, reason: 'Tu comida favorita no es peligrosa: la puedes compartir.' },
      { emoji: '🏫', text: 'El nombre de tu escuela', secret: true, reason: 'Mejor mantén en privado tu escuela con desconocidos en internet.' },
      { emoji: '🎮', text: 'Tu videojuego favorito', secret: false, reason: 'Tu videojuego favorito se puede compartir tranquilamente.' },
      { emoji: '🔢', text: 'El NIP de la tarjeta de tus papás', secret: true, reason: 'Los NIP y claves de tarjetas son ultra secretos.' },
    ],
  },
  {
    label: 'Nivel 3 — Guardián experto',
    questions: [
      { emoji: '🤳', text: 'Tu foto en pijama en tu cuarto', secret: true, reason: 'Las fotos en tu casa dan pistas de dónde vives: mejor en privado.' },
      { emoji: '📚', text: 'Tu libro favorito', secret: false, reason: 'Tu libro favorito se puede compartir sin riesgo.' },
      { emoji: '🗓️', text: 'Tu fecha y lugar de nacimiento', secret: true, reason: 'Estos datos sirven para suplantarte: mantenlos privados.' },
      { emoji: '🎵', text: 'Tu canción favorita', secret: false, reason: 'Tu canción favorita no es peligrosa: compártela.' },
      { emoji: '🛏️', text: 'A qué hora te quedas solo en casa', secret: true, reason: 'Nunca digas cuándo estás solo: es información muy privada.' },
      { emoji: '🐶', text: 'Que te gustan los perros', secret: false, reason: 'Que te gusten los perros se puede compartir sin problema.' },
    ],
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let qIndex = 0;
let answered = false;

function build() { score = 0; qIndex = 0; render(); }
function current() { return LEVELS[level].questions[qIndex]; }

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
        <h2>🤫 Secreto o Público</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Esto lo puedes compartir o es secreto?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Dato ${qIndex + 1} de ${total}</div>

      <div class="item-card">
        <div class="item-emoji">${q.emoji}</div>
        <div class="item-text">${q.text}</div>
      </div>

      <div class="choice-row">
        <button class="btn btn-success choice-btn" id="btn-share">📢 Puedo compartir</button>
        <button class="btn btn-danger choice-btn" id="btn-secret">🔒 Es secreto</button>
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`${q.text}. ¿Lo puedes compartir o es secreto?`));
  document.getElementById('btn-share').addEventListener('click', () => answer(false));
  document.getElementById('btn-secret').addEventListener('click', () => answer(true));
}

async function answer(saidSecret) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = saidSecret === q.secret;

  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Correcto! ' : '❌ ¡Ojo! '}${q.reason}</div>`;
  document.getElementById('btn-share').disabled = true;
  document.getElementById('btn-secret').disabled = true;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Ojo. ' + q.reason); }

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
  else showToast('🏆 ¡Cuidas muy bien tus datos!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
