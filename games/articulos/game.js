import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'articulos';
const BACK = '../../espanol.html';

// Cada pregunta muestra un sustantivo con un hueco para el artículo.
// Opciones: 'el' o 'la'. 'correct' es el índice del artículo correcto.
const LEVELS = [
  {
    label: 'Nivel 1 — Fáciles',
    questions: [
      { prompt: '<span class="big">___ perro</span>', options: ['el', 'la'], correct: 0, reason: '"el perro" es masculino.' },
      { prompt: '<span class="big">___ mesa</span>', options: ['el', 'la'], correct: 1, reason: '"la mesa" es femenino.' },
      { prompt: '<span class="big">___ sol</span>', options: ['el', 'la'], correct: 0, reason: '"el sol" es masculino.' },
      { prompt: '<span class="big">___ luna</span>', options: ['el', 'la'], correct: 1, reason: '"la luna" es femenino.' },
      { prompt: '<span class="big">___ casa</span>', options: ['el', 'la'], correct: 1, reason: '"la casa" es femenino.' },
      { prompt: '<span class="big">___ libro</span>', options: ['el', 'la'], correct: 0, reason: '"el libro" es masculino.' },
    ],
  },
  {
    label: 'Nivel 2 — ¡Pon atención!',
    questions: [
      { prompt: '<span class="big">___ flor</span>', options: ['el', 'la'], correct: 1, reason: '"la flor" es femenino, aunque termine en consonante.' },
      { prompt: '<span class="big">___ árbol</span>', options: ['el', 'la'], correct: 0, reason: '"el árbol" es masculino.' },
      { prompt: '<span class="big">___ silla</span>', options: ['el', 'la'], correct: 1, reason: '"la silla" es femenino.' },
      { prompt: '<span class="big">___ reloj</span>', options: ['el', 'la'], correct: 0, reason: '"el reloj" es masculino.' },
      { prompt: '<span class="big">___ nube</span>', options: ['el', 'la'], correct: 1, reason: '"la nube" es femenino.' },
      { prompt: '<span class="big">___ pez</span>', options: ['el', 'la'], correct: 0, reason: '"el pez" es masculino.' },
    ],
  },
  {
    label: 'Nivel 3 — ¡Casos difíciles!',
    questions: [
      { prompt: '<span class="big">___ mano</span>', options: ['el', 'la'], correct: 1, reason: '"la mano" es femenino, aunque termine en -o.' },
      { prompt: '<span class="big">___ día</span>', options: ['el', 'la'], correct: 0, reason: '"el día" es masculino, aunque termine en -a.' },
      { prompt: '<span class="big">___ mapa</span>', options: ['el', 'la'], correct: 0, reason: '"el mapa" es masculino, aunque termine en -a.' },
      { prompt: '<span class="big">___ agua</span>', options: ['el', 'la'], correct: 0, reason: 'Se dice "el agua" (femenino que empieza con a tónica).' },
      { prompt: '<span class="big">___ problema</span>', options: ['el', 'la'], correct: 0, reason: '"el problema" es masculino, aunque termine en -a.' },
      { prompt: '<span class="big">___ radio</span>', options: ['el', 'la'], correct: 1, reason: '"la radio" (el aparato) es femenino, aunque termine en -o.' },
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
        <h2>🚦 ¿El o La?</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Va con 'el' o con 'la'?</span>
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
  else showToast('🏆 ¡Ya dominas el y la!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
