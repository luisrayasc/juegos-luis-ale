import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'letra-correcta';
const BACK = '../../espanol.html';

// Cada pregunta muestra una palabra con un hueco "_" y una pista.
// Las opciones son letras candidatas; 'correct' es el índice de la letra correcta.
const LEVELS = [
  {
    label: 'Nivel 1 — Letras fáciles',
    questions: [
      { prompt: '<span class="big">VA_A</span><span class="sub">animal que da leche</span>', options: ['B', 'V', 'C'], correct: 2, reason: 'Es "VACA", se escribe con C.' },
      { prompt: '<span class="big">_OLA</span><span class="sub">saludo de amigos</span>', options: ['H', 'O', 'J'], correct: 0, reason: 'Es "HOLA", lleva H muda al inicio.' },
      { prompt: '<span class="big">GA_O</span><span class="sub">mascota que maúlla</span>', options: ['T', 'D', 'P'], correct: 0, reason: 'Es "GATO", se escribe con T.' },
      { prompt: '<span class="big">_APATO</span><span class="sub">se pone en el pie</span>', options: ['S', 'Z', 'C'], correct: 1, reason: 'Es "ZAPATO", se escribe con Z.' },
      { prompt: '<span class="big">CA_A</span><span class="sub">lugar donde vivimos</span>', options: ['B', 'S', 'Z'], correct: 1, reason: 'Es "CASA", se escribe con S.' },
    ],
  },
  {
    label: 'Nivel 2 — ¡Más difícil!',
    questions: [
      { prompt: '<span class="big">_IRAFA</span><span class="sub">animal de cuello largo</span>', options: ['G', 'J', 'Y'], correct: 1, reason: 'Es "JIRAFA", se escribe con J.' },
      { prompt: '<span class="big">_UEVO</span><span class="sub">lo pone la gallina</span>', options: ['G', 'B', 'H'], correct: 2, reason: 'Es "HUEVO", lleva H al inicio.' },
      { prompt: '<span class="big">_LAVE</span><span class="sub">abre la puerta</span>', options: ['Y', 'LL', 'L'], correct: 1, reason: 'Es "LLAVE", se escribe con LL.' },
      { prompt: '<span class="big">BUR_O</span><span class="sub">animal con orejas largas</span>', options: ['R', 'RR', 'D'], correct: 1, reason: 'Es "BURRO", lleva RR (sonido fuerte).' },
      { prompt: '<span class="big">JU_O</span><span class="sub">bebida de fruta</span>', options: ['G', 'J', 'F'], correct: 0, reason: 'Es "JUGO", se escribe con G.' },
      { prompt: '<span class="big">_UESO</span><span class="sub">parte dura del cuerpo</span>', options: ['G', 'H', 'B'], correct: 1, reason: 'Es "HUESO", lleva H al inicio.' },
    ],
  },
  {
    label: 'Nivel 3 — ¡Experto en letras!',
    questions: [
      { prompt: '<span class="big">LÁPI_</span><span class="sub">sirve para escribir</span>', options: ['S', 'C', 'Z'], correct: 2, reason: 'Es "LÁPIZ", termina en Z.' },
      { prompt: '<span class="big">_ELA</span><span class="sub">da luz cuando se enciende</span>', options: ['V', 'B', 'V'], correct: 0, reason: 'Es "VELA", se escribe con V.' },
      { prompt: '<span class="big">_ARCO</span><span class="sub">navega en el mar</span>', options: ['V', 'B', 'P'], correct: 1, reason: 'Es "BARCO", se escribe con B.' },
      { prompt: '<span class="big">_LUVIA</span><span class="sub">cae del cielo y moja</span>', options: ['Y', 'L', 'LL'], correct: 2, reason: 'Es "LLUVIA", se escribe con LL.' },
      { prompt: '<span class="big">_APO</span><span class="sub">animal que salta y croa</span>', options: ['S', 'Z', 'C'], correct: 0, reason: 'Es "SAPO", se escribe con S.' },
      { prompt: '<span class="big">_ELADO</span><span class="sub">postre frío de fresa</span>', options: ['E', 'H', 'J'], correct: 1, reason: 'Es "HELADO", lleva H al inicio.' },
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
        <h2>✍️ La Letra Correcta</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Elige la letra que falta.</span>
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
  else showToast('🏆 ¡Eres un experto en letras!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
