import { showConfetti, playSuccess, playError, playTone, speak, showToast, flagImg } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'idiomas';
const BACK = '../../geografia.html';

// Cada pregunta muestra un país; las opciones son idiomas.
// 'correct' es el índice del idioma principal de ese país.
const LEVELS = [
  {
    label: 'Nivel 1 — Países conocidos',
    questions: [
      { prompt: '<span class="big">🇲🇽</span>México', options: ['Español', 'Inglés', 'Francés'], correct: 0, reason: 'En México se habla español.' },
      { prompt: '<span class="big">🇫🇷</span>Francia', options: ['Italiano', 'Francés', 'Alemán'], correct: 1, reason: 'En Francia se habla francés.' },
      { prompt: '<span class="big">🇧🇷</span>Brasil', options: ['Español', 'Inglés', 'Portugués'], correct: 2, reason: 'En Brasil se habla portugués.' },
      { prompt: '<span class="big">🇯🇵</span>Japón', options: ['Japonés', 'Chino', 'Coreano'], correct: 0, reason: 'En Japón se habla japonés.' },
      { prompt: '<span class="big">🇮🇹</span>Italia', options: ['Francés', 'Italiano', 'Español'], correct: 1, reason: 'En Italia se habla italiano.' },
    ],
  },
  {
    label: 'Nivel 2 — Más países',
    questions: [
      { prompt: '<span class="big">🇩🇪</span>Alemania', options: ['Inglés', 'Francés', 'Alemán'], correct: 2, reason: 'En Alemania se habla alemán.' },
      { prompt: '<span class="big">🇺🇸</span>Estados Unidos', options: ['Inglés', 'Español', 'Francés'], correct: 0, reason: 'En Estados Unidos se habla inglés.' },
      { prompt: '<span class="big">🇨🇳</span>China', options: ['Japonés', 'Chino', 'Coreano'], correct: 1, reason: 'En China se habla chino (mandarín).' },
      { prompt: '<span class="big">🇦🇷</span>Argentina', options: ['Portugués', 'Inglés', 'Español'], correct: 2, reason: 'En Argentina se habla español.' },
      { prompt: '<span class="big">🇵🇹</span>Portugal', options: ['Español', 'Portugués', 'Italiano'], correct: 1, reason: 'En Portugal se habla portugués.' },
    ],
  },
  {
    label: 'Nivel 3 — Experto en idiomas',
    questions: [
      { prompt: '<span class="big">🇷🇺</span>Rusia', options: ['Alemán', 'Ruso', 'Inglés'], correct: 1, reason: 'En Rusia se habla ruso.' },
      { prompt: '<span class="big">🇪🇬</span>Egipto', options: ['Árabe', 'Francés', 'Inglés'], correct: 0, reason: 'En Egipto se habla árabe.' },
      { prompt: '<span class="big">🇬🇧</span>Reino Unido', options: ['Francés', 'Alemán', 'Inglés'], correct: 2, reason: 'En el Reino Unido se habla inglés.' },
      { prompt: '<span class="big">🇦🇹</span>Austria', options: ['Alemán', 'Italiano', 'Ruso'], correct: 0, reason: 'En Austria se habla alemán.' },
      { prompt: '<span class="big">🇦🇺</span>Australia', options: ['Español', 'Inglés', 'Portugués'], correct: 1, reason: 'En Australia se habla inglés.' },
      { prompt: '<span class="big">🇵🇪</span>Perú', options: ['Portugués', 'Inglés', 'Español'], correct: 2, reason: 'En Perú se habla español.' },
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
        <h2>🗣️ Idiomas del Mundo</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Qué idioma se habla en este país?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qIndex + 1} de ${total}</div>

      <div class="prompt-card">${flagImg(q.prompt, '../../')}</div>

      <div class="opt-list" id="opt-list">
        ${q.options.map((o, i) => `<button class="opt-btn" data-i="${i}">${flagImg(o, '../../')}</button>`).join('')}
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
  else showToast('🏆 ¡Eres un experto en idiomas!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
