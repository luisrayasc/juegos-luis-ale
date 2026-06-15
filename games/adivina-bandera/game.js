import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'adivina-bandera';
const BACK = '../../geografia.html';

// Cada pregunta muestra una bandera; las opciones son nombres de países.
// 'correct' es el índice del país al que pertenece la bandera.
const LEVELS = [
  {
    label: 'Nivel 1 — Banderas famosas',
    questions: [
      { prompt: '<span class="big">🇲🇽</span>¿De qué país es esta bandera?', options: ['México', 'España', 'Italia'], correct: 0, reason: 'Es la bandera de México.' },
      { prompt: '<span class="big">🇺🇸</span>¿De qué país es esta bandera?', options: ['Canadá', 'Estados Unidos', 'Brasil'], correct: 1, reason: 'Es la bandera de Estados Unidos.' },
      { prompt: '<span class="big">🇫🇷</span>¿De qué país es esta bandera?', options: ['Alemania', 'Italia', 'Francia'], correct: 2, reason: 'Es la bandera de Francia.' },
      { prompt: '<span class="big">🇯🇵</span>¿De qué país es esta bandera?', options: ['Japón', 'China', 'Canadá'], correct: 0, reason: 'Es la bandera de Japón.' },
      { prompt: '<span class="big">🇧🇷</span>¿De qué país es esta bandera?', options: ['Argentina', 'Brasil', 'Portugal'], correct: 1, reason: 'Es la bandera de Brasil.' },
    ],
  },
  {
    label: 'Nivel 2 — Más banderas',
    questions: [
      { prompt: '<span class="big">🇨🇦</span>¿De qué país es esta bandera?', options: ['Estados Unidos', 'Reino Unido', 'Canadá'], correct: 2, reason: 'Es la bandera de Canadá.' },
      { prompt: '<span class="big">🇩🇪</span>¿De qué país es esta bandera?', options: ['Alemania', 'Bélgica', 'España'], correct: 0, reason: 'Es la bandera de Alemania.' },
      { prompt: '<span class="big">🇨🇳</span>¿De qué país es esta bandera?', options: ['Japón', 'China', 'Vietnam'], correct: 1, reason: 'Es la bandera de China.' },
      { prompt: '<span class="big">🇦🇷</span>¿De qué país es esta bandera?', options: ['Chile', 'Uruguay', 'Argentina'], correct: 2, reason: 'Es la bandera de Argentina.' },
      { prompt: '<span class="big">🇮🇹</span>¿De qué país es esta bandera?', options: ['Italia', 'México', 'Irlanda'], correct: 0, reason: 'Es la bandera de Italia.' },
      { prompt: '<span class="big">🇪🇸</span>¿De qué país es esta bandera?', options: ['Portugal', 'España', 'Colombia'], correct: 1, reason: 'Es la bandera de España.' },
    ],
  },
  {
    label: 'Nivel 3 — Banderas difíciles',
    questions: [
      { prompt: '<span class="big">🇵🇹</span>¿De qué país es esta bandera?', options: ['España', 'Portugal', 'Italia'], correct: 1, reason: 'Es la bandera de Portugal.' },
      { prompt: '<span class="big">🇨🇴</span>¿De qué país es esta bandera?', options: ['Colombia', 'Venezuela', 'Ecuador'], correct: 0, reason: 'Es la bandera de Colombia.' },
      { prompt: '<span class="big">🇵🇪</span>¿De qué país es esta bandera?', options: ['Chile', 'Argentina', 'Perú'], correct: 2, reason: 'Es la bandera de Perú.' },
      { prompt: '<span class="big">🇪🇬</span>¿De qué país es esta bandera?', options: ['Egipto', 'Marruecos', 'Turquía'], correct: 0, reason: 'Es la bandera de Egipto.' },
      { prompt: '<span class="big">🇦🇺</span>¿De qué país es esta bandera?', options: ['Reino Unido', 'Australia', 'Nueva Zelanda'], correct: 1, reason: 'Es la bandera de Australia.' },
      { prompt: '<span class="big">🇨🇱</span>¿De qué país es esta bandera?', options: ['Perú', 'Argentina', 'Chile'], correct: 2, reason: 'Es la bandera de Chile.' },
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
        <h2>🏳️ Adivina la Bandera</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿De qué país es esta bandera?</span>
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
  else showToast('🏆 ¡Eres un experto en banderas!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
