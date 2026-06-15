import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'que-pais';
const BACK = '../../geografia.html';

// Cada pregunta muestra una capital; las opciones son nombres de países.
// 'correct' es el índice del país al que pertenece la capital.
const LEVELS = [
  {
    label: 'Nivel 1 — Capitales famosas',
    questions: [
      { prompt: '<span class="big">Ciudad de México</span>¿De qué país es esta capital?', options: ['México', 'España', 'Argentina'], correct: 0, reason: 'Ciudad de México es la capital de México.' },
      { prompt: '<span class="big">París</span>¿De qué país es esta capital?', options: ['Italia', 'Francia', 'Alemania'], correct: 1, reason: 'París es la capital de Francia.' },
      { prompt: '<span class="big">Madrid</span>¿De qué país es esta capital?', options: ['Portugal', 'México', 'España'], correct: 2, reason: 'Madrid es la capital de España.' },
      { prompt: '<span class="big">Roma</span>¿De qué país es esta capital?', options: ['Italia', 'Grecia', 'España'], correct: 0, reason: 'Roma es la capital de Italia.' },
      { prompt: '<span class="big">Tokio</span>¿De qué país es esta capital?', options: ['China', 'Japón', 'Corea del Sur'], correct: 1, reason: 'Tokio es la capital de Japón.' },
    ],
  },
  {
    label: 'Nivel 2 — Más capitales',
    questions: [
      { prompt: '<span class="big">Berlín</span>¿De qué país es esta capital?', options: ['Austria', 'Suiza', 'Alemania'], correct: 2, reason: 'Berlín es la capital de Alemania.' },
      { prompt: '<span class="big">Londres</span>¿De qué país es esta capital?', options: ['Reino Unido', 'Irlanda', 'Estados Unidos'], correct: 0, reason: 'Londres es la capital del Reino Unido.' },
      { prompt: '<span class="big">Buenos Aires</span>¿De qué país es esta capital?', options: ['Chile', 'Argentina', 'Uruguay'], correct: 1, reason: 'Buenos Aires es la capital de Argentina.' },
      { prompt: '<span class="big">Lima</span>¿De qué país es esta capital?', options: ['Chile', 'Bolivia', 'Perú'], correct: 2, reason: 'Lima es la capital de Perú.' },
      { prompt: '<span class="big">Bogotá</span>¿De qué país es esta capital?', options: ['Colombia', 'Venezuela', 'Ecuador'], correct: 0, reason: 'Bogotá es la capital de Colombia.' },
      { prompt: '<span class="big">Santiago</span>¿De qué país es esta capital?', options: ['Perú', 'Chile', 'Argentina'], correct: 1, reason: 'Santiago es la capital de Chile.' },
    ],
  },
  {
    label: 'Nivel 3 — Capitales difíciles',
    questions: [
      { prompt: '<span class="big">Washington D.C.</span>¿De qué país es esta capital?', options: ['Estados Unidos', 'Canadá', 'México'], correct: 0, reason: 'Washington D.C. es la capital de Estados Unidos.' },
      { prompt: '<span class="big">Ottawa</span>¿De qué país es esta capital?', options: ['Estados Unidos', 'Canadá', 'Reino Unido'], correct: 1, reason: 'Ottawa es la capital de Canadá, no Toronto.' },
      { prompt: '<span class="big">Brasilia</span>¿De qué país es esta capital?', options: ['Argentina', 'Portugal', 'Brasil'], correct: 2, reason: 'Brasilia es la capital de Brasil, no Río de Janeiro.' },
      { prompt: '<span class="big">Canberra</span>¿De qué país es esta capital?', options: ['Australia', 'Nueva Zelanda', 'Reino Unido'], correct: 0, reason: 'Canberra es la capital de Australia, no Sídney.' },
      { prompt: '<span class="big">El Cairo</span>¿De qué país es esta capital?', options: ['Marruecos', 'Egipto', 'Turquía'], correct: 1, reason: 'El Cairo es la capital de Egipto.' },
      { prompt: '<span class="big">Lisboa</span>¿De qué país es esta capital?', options: ['España', 'Italia', 'Portugal'], correct: 2, reason: 'Lisboa es la capital de Portugal.' },
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
        <h2>🗺️ ¿Qué País Es?</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿De qué país es esta capital?</span>
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
  else showToast('🏆 ¡Conoces los países del mundo!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
