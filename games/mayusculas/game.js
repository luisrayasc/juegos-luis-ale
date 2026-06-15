import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'mayusculas';
const BACK = '../../espanol.html';

// Las opciones son tres palabras en minúscula.
// 'correct' es el índice de la que es NOMBRE PROPIO y debe llevar mayúscula.
const LEVELS = [
  {
    label: 'Nivel 1 — Nombres y lugares',
    questions: [
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['perro', 'ana', 'mesa'], correct: 1, reason: '"Ana" es nombre propio de persona, por eso lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['méxico', 'casa', 'flor'], correct: 0, reason: '"México" es nombre propio de país, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['libro', 'árbol', 'juan'], correct: 2, reason: '"Juan" es nombre propio de persona, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['monterrey', 'silla', 'gato'], correct: 0, reason: '"Monterrey" es nombre propio de ciudad, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['pelota', 'pedro', 'ventana'], correct: 1, reason: '"Pedro" es nombre propio de persona, lleva mayúscula.' },
    ],
  },
  {
    label: 'Nivel 2 — Países y continentes',
    questions: [
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['camino', 'españa', 'piedra'], correct: 1, reason: '"España" es nombre propio de país, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['europa', 'nube', 'zapato'], correct: 0, reason: '"Europa" es nombre propio de continente, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['cuaderno', 'lluvia', 'francia'], correct: 2, reason: '"Francia" es nombre propio de país, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['lucía', 'manzana', 'puerta'], correct: 0, reason: '"Lucía" es nombre propio de persona, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['camino', 'sombrero', 'guadalajara'], correct: 2, reason: '"Guadalajara" es nombre propio de ciudad, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['italia', 'cuchara', 'caballo'], correct: 0, reason: '"Italia" es nombre propio de país, lleva mayúscula.' },
    ],
  },
  {
    label: 'Nivel 3 — Experto en nombres propios',
    questions: [
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['estrella', 'sofía', 'cocina'], correct: 1, reason: '"Sofía" es nombre propio de persona, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['argentina', 'bosque', 'reloj'], correct: 0, reason: '"Argentina" es nombre propio de país, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['cielo', 'paloma', 'oaxaca'], correct: 2, reason: '"Oaxaca" es nombre propio de estado y ciudad, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['colombia', 'jardín', 'mochila'], correct: 0, reason: '"Colombia" es nombre propio de país, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['montaña', 'fernando', 'galleta'], correct: 1, reason: '"Fernando" es nombre propio de persona, lleva mayúscula.' },
      { prompt: '¿Cuál palabra debe llevar mayúscula?', options: ['camión', 'helado', 'asia'], correct: 2, reason: '"Asia" es nombre propio de continente, lleva mayúscula.' },
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
function stripTags(s) { return s.replace(/<[^>]+>/g, ''); }

function render() {
  answered = false;
  const cfg = LEVELS[level];
  const q = current();
  const total = cfg.questions.length;
  const pct = Math.round((qIndex / total) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="quiz-stage">
      <div class="quiz-header">
        <div class="back-row">
          <a href="${BACK}" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🔠 Mayúscula o Minúscula</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Cuál palabra debe escribirse con MAYÚSCULA?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Palabra ${qIndex + 1} de ${total}</div>

      <div class="prompt-card">${q.prompt}</div>

      <div class="opt-list" id="opt-list">
        ${q.options.map((o, i) => `<button class="opt-btn" data-i="${i}">${o}</button>`).join('')}
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () => speak(stripTags(q.prompt)));
  document.querySelectorAll('.opt-btn').forEach(btn =>
    btn.addEventListener('click', () => answer(parseInt(btn.dataset.i, 10))));
}

async function answer(choice) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = choice === q.correct;

  document.querySelectorAll('.opt-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('right');
    else if (i === choice) btn.classList.add('wrong');
  });

  document.getElementById('reason-slot').innerHTML =
    `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Correcto! ' : '❌ ¡Casi! '}${q.reason}</div>`;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Casi. ' + q.reason); }

  await delay(correct ? 1800 : 3000);
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
  else showToast('🏆 ¡Dominas las mayúsculas!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
