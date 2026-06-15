import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'mundo-datos';
const BACK = '../../geografia.html';

// Preguntas de geografía con datos universalmente aceptados.
// 'correct' es el índice de la respuesta correcta.
const LEVELS = [
  {
    label: 'Nivel 1 — Nuestro planeta',
    questions: [
      { prompt: '<span class="big">🌊</span>¿Cuál es el océano más grande?', options: ['Atlántico', 'Pacífico', 'Índico'], correct: 1, reason: 'El océano Pacífico es el más grande.' },
      { prompt: '<span class="big">🌍</span>¿Cuál es el continente más grande?', options: ['Asia', 'África', 'América'], correct: 0, reason: 'Asia es el continente más grande.' },
      { prompt: '<span class="big">🏜️</span>¿Cuál es el desierto cálido más grande?', options: ['Atacama', 'Gobi', 'Sahara'], correct: 2, reason: 'El Sahara es el desierto cálido más grande.' },
      { prompt: '<span class="big">❄️</span>¿Cómo se llama el continente helado del sur?', options: ['Antártida', 'Groenlandia', 'Siberia'], correct: 0, reason: 'La Antártida es el continente helado del sur.' },
      { prompt: '<span class="big">🌎</span>¿En qué continente vivimos en México?', options: ['Europa', 'América', 'Asia'], correct: 1, reason: 'México está en el continente americano.' },
    ],
  },
  {
    label: 'Nivel 2 — Mares y montañas',
    questions: [
      { prompt: '<span class="big">⛰️</span>¿Cuál es la montaña más alta del mundo?', options: ['Everest', 'Kilimanjaro', 'Aconcagua'], correct: 0, reason: 'El Everest es la montaña más alta.' },
      { prompt: '<span class="big">🏔️</span>¿Cuál es la cordillera más larga del mundo?', options: ['Los Alpes', 'Los Andes', 'Las Rocosas'], correct: 1, reason: 'Los Andes son la cordillera más larga.' },
      { prompt: '<span class="big">🐫</span>¿En qué continente está Egipto?', options: ['Asia', 'Europa', 'África'], correct: 2, reason: 'Egipto está en África.' },
      { prompt: '<span class="big">🗺️</span>¿Cuál es el continente más pequeño?', options: ['Oceanía', 'Europa', 'Antártida'], correct: 0, reason: 'Oceanía es el continente más pequeño.' },
      { prompt: '<span class="big">🏞️</span>¿Cuál es el río más largo de América?', options: ['Misisipi', 'Amazonas', 'Paraná'], correct: 1, reason: 'El Amazonas es el río más largo de América.' },
    ],
  },
  {
    label: 'Nivel 3 — Experto del mundo',
    questions: [
      { prompt: '<span class="big">🌐</span>¿Cuántos océanos hay en la Tierra?', options: ['3', '5', '7'], correct: 1, reason: 'En la Tierra hay 5 océanos.' },
      { prompt: '<span class="big">🗺️</span>¿Cuál es el país más grande del mundo?', options: ['China', 'Canadá', 'Rusia'], correct: 2, reason: 'Rusia es el país más grande del mundo.' },
      { prompt: '<span class="big">🌊</span>¿Cuál es el océano más grande?', options: ['Pacífico', 'Atlántico', 'Ártico'], correct: 0, reason: 'El océano Pacífico es el más grande.' },
      { prompt: '<span class="big">🌍</span>¿En qué continente está Egipto?', options: ['África', 'Asia', 'Europa'], correct: 0, reason: 'Egipto está en África.' },
      { prompt: '<span class="big">⛰️</span>¿Cuál es la montaña más alta del mundo?', options: ['Aconcagua', 'Mont Blanc', 'Everest'], correct: 2, reason: 'El Everest es la montaña más alta.' },
      { prompt: '<span class="big">❄️</span>¿Cuál es el continente helado del sur?', options: ['Antártida', 'Oceanía', 'Europa'], correct: 0, reason: 'La Antártida es el continente helado del sur.' },
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
        <h2>🌐 Datos del Mundo</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Responde la pregunta sobre nuestro planeta.</span>
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
  else showToast('🏆 ¡Eres un experto del mundo!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
