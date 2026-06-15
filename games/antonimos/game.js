import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'antonimos';
const BACK = '../../espanol.html';

// El enunciado muestra una palabra. Las opciones son tres palabras.
// 'correct' es el índice del ANTÓNIMO (la palabra contraria u opuesta).
const LEVELS = [
  {
    label: 'Nivel 1 — Contrarios fáciles',
    questions: [
      { prompt: '<b>grande</b>', options: ['enorme', 'pequeño', 'gigante'], correct: 1, reason: 'Lo contrario de "grande" es "pequeño".' },
      { prompt: '<b>alto</b>', options: ['bajo', 'grande', 'largo'], correct: 0, reason: 'Lo contrario de "alto" es "bajo".' },
      { prompt: '<b>frío</b>', options: ['fresco', 'helado', 'caliente'], correct: 2, reason: 'Lo contrario de "frío" es "caliente".' },
      { prompt: '<b>día</b>', options: ['noche', 'tarde', 'sol'], correct: 0, reason: 'Lo contrario de "día" es "noche".' },
      { prompt: '<b>feliz</b>', options: ['alegre', 'contento', 'triste'], correct: 2, reason: 'Lo contrario de "feliz" es "triste".' },
    ],
  },
  {
    label: 'Nivel 2 — Buscando opuestos',
    questions: [
      { prompt: '<b>rápido</b>', options: ['lento', 'veloz', 'ligero'], correct: 0, reason: 'Lo contrario de "rápido" es "lento".' },
      { prompt: '<b>abrir</b>', options: ['empujar', 'cerrar', 'tocar'], correct: 1, reason: 'Lo contrario de "abrir" es "cerrar".' },
      { prompt: '<b>subir</b>', options: ['saltar', 'correr', 'bajar'], correct: 2, reason: 'Lo contrario de "subir" es "bajar".' },
      { prompt: '<b>lleno</b>', options: ['vacío', 'completo', 'grande'], correct: 0, reason: 'Lo contrario de "lleno" es "vacío".' },
      { prompt: '<b>claro</b>', options: ['blanco', 'oscuro', 'brillante'], correct: 1, reason: 'Lo contrario de "claro" es "oscuro".' },
      { prompt: '<b>dentro</b>', options: ['cerca', 'arriba', 'fuera'], correct: 2, reason: 'Lo contrario de "dentro" es "fuera".' },
    ],
  },
  {
    label: 'Nivel 3 — Experto en antónimos',
    questions: [
      { prompt: '<b>antes</b>', options: ['después', 'ahora', 'pronto'], correct: 0, reason: 'Lo contrario de "antes" es "después".' },
      { prompt: '<b>limpio</b>', options: ['nuevo', 'sucio', 'seco'], correct: 1, reason: 'Lo contrario de "limpio" es "sucio".' },
      { prompt: '<b>fuerte</b>', options: ['duro', 'pesado', 'débil'], correct: 2, reason: 'Lo contrario de "fuerte" es "débil".' },
      { prompt: '<b>ganar</b>', options: ['perder', 'jugar', 'correr'], correct: 0, reason: 'Lo contrario de "ganar" es "perder".' },
      { prompt: '<b>cerca</b>', options: ['junto', 'lejos', 'aquí'], correct: 1, reason: 'Lo contrario de "cerca" es "lejos".' },
      { prompt: '<b>mojado</b>', options: ['húmedo', 'frío', 'seco'], correct: 2, reason: 'Lo contrario de "mojado" es "seco".' },
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
        <h2>↔️ Antónimos</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Elige la palabra contraria (opuesta).</span>
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
  else showToast('🏆 ¡Eres experto en antónimos!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
