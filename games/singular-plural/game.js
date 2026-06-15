import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'singular-plural';
const BACK = '../../espanol.html';

// Cada pregunta muestra una palabra en singular; las opciones son plurales.
// 'correct' es el índice del plural bien formado.
const LEVELS = [
  {
    label: 'Nivel 1 — Plurales fáciles',
    questions: [
      { prompt: '<b>gato</b>', options: ['gatos', 'gatoes', 'gates'], correct: 0, reason: 'Termina en vocal: se agrega -s → "gatos".' },
      { prompt: '<b>casa</b>', options: ['casaes', 'casas', 'cases'], correct: 1, reason: 'Termina en vocal: se agrega -s → "casas".' },
      { prompt: '<b>perro</b>', options: ['perres', 'perroes', 'perros'], correct: 2, reason: 'Termina en vocal: se agrega -s → "perros".' },
      { prompt: '<b>niño</b>', options: ['niños', 'niñoes', 'niñes'], correct: 0, reason: 'Termina en vocal: se agrega -s → "niños".' },
      { prompt: '<b>mesa</b>', options: ['mesaes', 'meses', 'mesas'], correct: 2, reason: 'Termina en vocal: se agrega -s → "mesas".' },
    ],
  },
  {
    label: 'Nivel 2 — Termina en consonante',
    questions: [
      { prompt: '<b>flor</b>', options: ['flors', 'flores', 'florses'], correct: 1, reason: 'Termina en consonante: se agrega -es → "flores".' },
      { prompt: '<b>color</b>', options: ['colores', 'colors', 'coloros'], correct: 0, reason: 'Termina en consonante: se agrega -es → "colores".' },
      { prompt: '<b>animal</b>', options: ['animals', 'animalos', 'animales'], correct: 2, reason: 'Termina en consonante: se agrega -es → "animales".' },
      { prompt: '<b>rey</b>', options: ['reyes', 'reys', 'reis'], correct: 0, reason: 'Termina en -y: se agrega -es → "reyes".' },
      { prompt: '<b>árbol</b>', options: ['árbols', 'árboles', 'árboltes'], correct: 1, reason: 'Termina en consonante: se agrega -es → "árboles".' },
      { prompt: '<b>papel</b>', options: ['papeles', 'papels', 'papelos'], correct: 0, reason: 'Termina en consonante: se agrega -es → "papeles".' },
    ],
  },
  {
    label: 'Nivel 3 — ¡Plurales difíciles!',
    questions: [
      { prompt: '<b>lápiz</b>', options: ['lápizs', 'lápizes', 'lápices'], correct: 2, reason: 'La z cambia a c: "lápiz" → "lápices".' },
      { prompt: '<b>pez</b>', options: ['peces', 'pezes', 'pezs'], correct: 0, reason: 'La z cambia a c: "pez" → "peces".' },
      { prompt: '<b>luz</b>', options: ['luzs', 'luces', 'luzes'], correct: 1, reason: 'La z cambia a c: "luz" → "luces".' },
      { prompt: '<b>lombriz</b>', options: ['lombrizes', 'lombrices', 'lombrizs'], correct: 1, reason: 'La z cambia a c: "lombriz" → "lombrices".' },
      { prompt: '<b>país</b>', options: ['países', 'paíss', 'paises'], correct: 0, reason: '"país" → "países" (lleva acento en la í).' },
      { prompt: '<b>sofá</b>', options: ['sofáes', 'sofás', 'sofaes'], correct: 1, reason: '"sofá" → "sofás" (se agrega solo -s).' },
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
function stripTags(s) { return s.replace(/<[^>]+>/g, ' '); }

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
        <h2>🔢 Singular y Plural</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Elige el plural correcto.</span>
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
  else showToast('🏆 ¡Eres un experto en plurales!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
