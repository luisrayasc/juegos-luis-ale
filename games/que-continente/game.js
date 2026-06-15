import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'que-continente';
const BACK = '../../geografia.html';

// Cada pregunta muestra un país; las opciones son continentes.
// 'correct' es el índice del continente correcto.
const LEVELS = [
  {
    label: 'Nivel 1 — Países famosos',
    questions: [
      { prompt: '<span class="big">🇲🇽</span>¿En qué continente está México?', options: ['América', 'Europa', 'Asia'], correct: 0, reason: 'México está en América.' },
      { prompt: '<span class="big">🇫🇷</span>¿En qué continente está Francia?', options: ['Asia', 'Europa', 'África'], correct: 1, reason: 'Francia está en Europa.' },
      { prompt: '<span class="big">🇯🇵</span>¿En qué continente está Japón?', options: ['Europa', 'Oceanía', 'Asia'], correct: 2, reason: 'Japón está en Asia.' },
      { prompt: '<span class="big">🇧🇷</span>¿En qué continente está Brasil?', options: ['América', 'África', 'Europa'], correct: 0, reason: 'Brasil está en América.' },
      { prompt: '<span class="big">🇪🇸</span>¿En qué continente está España?', options: ['América', 'Europa', 'Asia'], correct: 1, reason: 'España está en Europa.' },
    ],
  },
  {
    label: 'Nivel 2 — Más países',
    questions: [
      { prompt: '<span class="big">🇪🇬</span>¿En qué continente está Egipto?', options: ['Asia', 'Europa', 'África'], correct: 2, reason: 'Egipto está en África.' },
      { prompt: '<span class="big">🇦🇺</span>¿En qué continente está Australia?', options: ['Oceanía', 'Asia', 'América'], correct: 0, reason: 'Australia está en Oceanía.' },
      { prompt: '<span class="big">🇨🇳</span>¿En qué continente está China?', options: ['Europa', 'Asia', 'África'], correct: 1, reason: 'China está en Asia.' },
      { prompt: '<span class="big">🇦🇷</span>¿En qué continente está Argentina?', options: ['Europa', 'Oceanía', 'América'], correct: 2, reason: 'Argentina está en América.' },
      { prompt: '<span class="big">🇮🇹</span>¿En qué continente está Italia?', options: ['Europa', 'Asia', 'África'], correct: 0, reason: 'Italia está en Europa.' },
      { prompt: '<span class="big">🇨🇦</span>¿En qué continente está Canadá?', options: ['Europa', 'América', 'Asia'], correct: 1, reason: 'Canadá está en América.' },
    ],
  },
  {
    label: 'Nivel 3 — Países difíciles',
    questions: [
      { prompt: '<span class="big">🇮🇳</span>¿En qué continente está la India?', options: ['África', 'Europa', 'Asia'], correct: 2, reason: 'La India está en Asia.' },
      { prompt: '<span class="big">🇳🇬</span>¿En qué continente está Nigeria?', options: ['África', 'Asia', 'América'], correct: 0, reason: 'Nigeria está en África.' },
      { prompt: '<span class="big">🇵🇹</span>¿En qué continente está Portugal?', options: ['América', 'Europa', 'África'], correct: 1, reason: 'Portugal está en Europa.' },
      { prompt: '<span class="big">🇰🇪</span>¿En qué continente está Kenia?', options: ['Asia', 'Oceanía', 'África'], correct: 2, reason: 'Kenia está en África.' },
      { prompt: '<span class="big">🇨🇴</span>¿En qué continente está Colombia?', options: ['América', 'Europa', 'Asia'], correct: 0, reason: 'Colombia está en América.' },
      { prompt: '<span class="big">🇩🇪</span>¿En qué continente está Alemania?', options: ['Asia', 'Europa', 'América'], correct: 1, reason: 'Alemania está en Europa.' },
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
        <h2>🌍 ¿Qué Continente?</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿En qué continente está este país?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qIndex + 1} de ${total}</div>

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
  else showToast('🏆 ¡Conoces los continentes!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
