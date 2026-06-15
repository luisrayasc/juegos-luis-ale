import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'ortografia';
const BACK = '../../espanol.html';

// Cada pregunta ofrece 3 formas de escribir una palabra; solo una es correcta.
// 'correct' es el índice de la palabra bien escrita.
const LEVELS = [
  {
    label: 'Nivel 1 — Palabras fáciles',
    questions: [
      { prompt: '¿Cuál está bien escrita?', options: ['ventana', 'bentana', 'ventaná'], correct: 0, reason: '"ventana" se escribe con v y sin acento.' },
      { prompt: '¿Cuál está bien escrita?', options: ['mochila', 'mochíla', 'muchila'], correct: 0, reason: 'Se escribe "mochila", con o y sin acento.' },
      { prompt: '¿Cuál está bien escrita?', options: ['eskalera', 'escalera', 'escalerra'], correct: 1, reason: 'Se escribe "escalera", con sc y una sola r.' },
      { prompt: '¿Cuál está bien escrita?', options: ['paragua', 'paraguas', 'parahuas'], correct: 1, reason: 'Es "paraguas", con s al final y sin h.' },
      { prompt: '¿Cuál está bien escrita?', options: ['jirrafa', 'girafa', 'jirafa'], correct: 2, reason: 'Es "jirafa", con j y una sola r.' },
    ],
  },
  {
    label: 'Nivel 2 — ¡Más difícil!',
    questions: [
      { prompt: '¿Cuál está bien escrita?', options: ['bicicleta', 'bisicleta', 'bicicletta'], correct: 0, reason: 'Es "bicicleta", con c y no con s.' },
      { prompt: '¿Cuál está bien escrita?', options: ['ospital', 'hospital', 'hozpital'], correct: 1, reason: 'Es "hospital", lleva h al inicio.' },
      { prompt: '¿Cuál está bien escrita?', options: ['estrella', 'estreya', 'extrella'], correct: 0, reason: 'Es "estrella", con st y ll.' },
      { prompt: '¿Cuál está bien escrita?', options: ['sanahoria', 'zanahoria', 'zanaoria'], correct: 1, reason: 'Es "zanahoria", con z y con h.' },
      { prompt: '¿Cuál está bien escrita?', options: ['anbulancia', 'ambulansia', 'ambulancia'], correct: 2, reason: 'Es "ambulancia": mb y c.' },
      { prompt: '¿Cuál está bien escrita?', options: ['escalofrío', 'eskalofrio', 'escalofrio'], correct: 0, reason: 'Es "escalofrío", lleva acento en la í.' },
    ],
  },
  {
    label: 'Nivel 3 — ¡Experto en ortografía!',
    questions: [
      { prompt: '¿Cuál está bien escrita?', options: ['almuada', 'almohada', 'almoada'], correct: 1, reason: 'Es "almohada", lleva h en medio.' },
      { prompt: '¿Cuál está bien escrita?', options: ['murciélago', 'murcielago', 'mursiélago'], correct: 0, reason: 'Es "murciélago", con c y acento en la é.' },
      { prompt: '¿Cuál está bien escrita?', options: ['exámen', 'examen', 'eczamen'], correct: 1, reason: 'Es "examen", con x y sin acento.' },
      { prompt: '¿Cuál está bien escrita?', options: ['avión', 'abión', 'avion'], correct: 0, reason: 'Es "avión", con v y acento en la ó.' },
      { prompt: '¿Cuál está bien escrita?', options: ['cigueña', 'cigüeña', 'sigüeña'], correct: 1, reason: 'Es "cigüeña", la ü lleva diéresis.' },
      { prompt: '¿Cuál está bien escrita?', options: ['vergüenza', 'verguenza', 'bergüenza'], correct: 0, reason: 'Es "vergüenza", con v y diéresis en la ü.' },
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
        <h2>📝 ¿Cómo se Escribe?</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Elige la palabra bien escrita.</span>
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
  else showToast('🏆 ¡Eres un experto en ortografía!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
