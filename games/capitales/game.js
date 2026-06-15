import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'capitales';
const BACK = '../../geografia.html';

// Cada pregunta muestra un país; las opciones son ciudades.
// 'correct' es el índice de la capital correcta.
const LEVELS = [
  {
    label: 'Nivel 1 — Capitales famosas',
    questions: [
      { prompt: '<span class="big">🇲🇽</span>¿Cuál es la capital de México?', options: ['Ciudad de México', 'Guadalajara', 'Cancún'], correct: 0, reason: 'La capital de México es Ciudad de México.' },
      { prompt: '<span class="big">🇫🇷</span>¿Cuál es la capital de Francia?', options: ['Roma', 'París', 'Madrid'], correct: 1, reason: 'La capital de Francia es París.' },
      { prompt: '<span class="big">🇪🇸</span>¿Cuál es la capital de España?', options: ['Barcelona', 'Sevilla', 'Madrid'], correct: 2, reason: 'La capital de España es Madrid.' },
      { prompt: '<span class="big">🇮🇹</span>¿Cuál es la capital de Italia?', options: ['Roma', 'Milán', 'Venecia'], correct: 0, reason: 'La capital de Italia es Roma.' },
      { prompt: '<span class="big">🇯🇵</span>¿Cuál es la capital de Japón?', options: ['Kioto', 'Tokio', 'Osaka'], correct: 1, reason: 'La capital de Japón es Tokio.' },
    ],
  },
  {
    label: 'Nivel 2 — Más capitales',
    questions: [
      { prompt: '<span class="big">🇩🇪</span>¿Cuál es la capital de Alemania?', options: ['Múnich', 'Hamburgo', 'Berlín'], correct: 2, reason: 'La capital de Alemania es Berlín.' },
      { prompt: '<span class="big">🇬🇧</span>¿Cuál es la capital del Reino Unido?', options: ['Londres', 'Mánchester', 'Liverpool'], correct: 0, reason: 'La capital del Reino Unido es Londres.' },
      { prompt: '<span class="big">🇦🇷</span>¿Cuál es la capital de Argentina?', options: ['Córdoba', 'Buenos Aires', 'Rosario'], correct: 1, reason: 'La capital de Argentina es Buenos Aires.' },
      { prompt: '<span class="big">🇵🇪</span>¿Cuál es la capital de Perú?', options: ['Cusco', 'Arequipa', 'Lima'], correct: 2, reason: 'La capital de Perú es Lima.' },
      { prompt: '<span class="big">🇨🇱</span>¿Cuál es la capital de Chile?', options: ['Santiago', 'Valparaíso', 'Concepción'], correct: 0, reason: 'La capital de Chile es Santiago.' },
      { prompt: '<span class="big">🇨🇴</span>¿Cuál es la capital de Colombia?', options: ['Medellín', 'Bogotá', 'Cali'], correct: 1, reason: 'La capital de Colombia es Bogotá.' },
    ],
  },
  {
    label: 'Nivel 3 — Capitales difíciles',
    questions: [
      { prompt: '<span class="big">🇺🇸</span>¿Cuál es la capital de Estados Unidos?', options: ['Washington D.C.', 'Nueva York', 'Los Ángeles'], correct: 0, reason: 'La capital de Estados Unidos es Washington D.C., no Nueva York.' },
      { prompt: '<span class="big">🇨🇦</span>¿Cuál es la capital de Canadá?', options: ['Toronto', 'Ottawa', 'Montreal'], correct: 1, reason: 'La capital de Canadá es Ottawa, no Toronto.' },
      { prompt: '<span class="big">🇧🇷</span>¿Cuál es la capital de Brasil?', options: ['Río de Janeiro', 'São Paulo', 'Brasilia'], correct: 2, reason: 'La capital de Brasil es Brasilia, no Río de Janeiro.' },
      { prompt: '<span class="big">🇦🇺</span>¿Cuál es la capital de Australia?', options: ['Canberra', 'Sídney', 'Melbourne'], correct: 0, reason: 'La capital de Australia es Canberra, no Sídney.' },
      { prompt: '<span class="big">🇪🇬</span>¿Cuál es la capital de Egipto?', options: ['Alejandría', 'El Cairo', 'Luxor'], correct: 1, reason: 'La capital de Egipto es El Cairo.' },
      { prompt: '<span class="big">🇵🇹</span>¿Cuál es la capital de Portugal?', options: ['Oporto', 'Coímbra', 'Lisboa'], correct: 2, reason: 'La capital de Portugal es Lisboa.' },
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
        <h2>🏛️ Capitales del Mundo</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Cuál es la capital de este país?</span>
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
  else showToast('🏆 ¡Conoces las capitales del mundo!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
