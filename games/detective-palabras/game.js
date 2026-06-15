import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'detective-palabras';
const BACK = '../../espanol.html';

// Cada pregunta muestra un enunciado; las opciones son palabras del enunciado.
// 'correct' es el índice de la palabra MAL ESCRITA.
const LEVELS = [
  {
    label: 'Nivel 1 — Pistas fáciles',
    questions: [
      { prompt: 'Mi <b>kasa</b> es muy bonita.', options: ['kasa', 'muy', 'bonita'], correct: 0, reason: 'Se escribe "casa", con c.' },
      { prompt: 'El niño juega en el <b>parke</b>.', options: ['niño', 'juega', 'parke'], correct: 2, reason: '"parque" se escribe con q-u-e.' },
      { prompt: 'Tengo <b>doss</b> perros.', options: ['Tengo', 'doss', 'perros'], correct: 1, reason: '"dos" lleva una sola s.' },
      { prompt: 'La <b>vaka</b> come pasto.', options: ['La', 'vaka', 'come'], correct: 1, reason: '"vaca" se escribe con c.' },
      { prompt: 'Me gusta el <b>elado</b> de fresa.', options: ['gusta', 'elado', 'fresa'], correct: 1, reason: '"helado" lleva h al inicio.' },
    ],
  },
  {
    label: 'Nivel 2 — Ojo de detective',
    questions: [
      { prompt: 'El árbol tiene muchas <b>ojas</b>.', options: ['árbol', 'tiene', 'ojas'], correct: 2, reason: '"hojas" se escribe con h.' },
      { prompt: 'Mi hermano es muy <b>fuherte</b>.', options: ['hermano', 'muy', 'fuherte'], correct: 2, reason: '"fuerte" no lleva h.' },
      { prompt: 'Vamos a <b>aser</b> la tarea.', options: ['Vamos', 'aser', 'tarea'], correct: 1, reason: '"hacer" se escribe con h y c.' },
      { prompt: 'El <b>cabayo</b> corre rápido.', options: ['cabayo', 'corre', 'rápido'], correct: 0, reason: '"caballo" se escribe con b y ll.' },
      { prompt: 'Ella <b>tubo</b> un buen día.', options: ['Ella', 'tubo', 'día'], correct: 1, reason: 'Del verbo tener es "tuvo", con v.' },
    ],
  },
  {
    label: 'Nivel 3 — Detective experto',
    questions: [
      { prompt: 'El <b>esamen</b> fue difícil.', options: ['esamen', 'fue', 'difícil'], correct: 0, reason: '"examen" se escribe con x.' },
      { prompt: 'El perro movía la <b>kola</b>.', options: ['perro', 'movía', 'kola'], correct: 2, reason: '"cola" se escribe con c.' },
      { prompt: 'La burbuja <b>esplota</b> en el aire.', options: ['burbuja', 'esplota', 'aire'], correct: 1, reason: '"explota" se escribe con x.' },
      { prompt: 'Ese <b>jugete</b> es nuevo.', options: ['Ese', 'jugete', 'nuevo'], correct: 1, reason: '"juguete" lleva g-u-e.' },
      { prompt: 'El <b>sapato</b> es negro.', options: ['sapato', 'es', 'negro'], correct: 0, reason: '"zapato" se escribe con z.' },
      { prompt: 'Vi una <b>aguila</b> en el cielo.', options: ['Vi', 'aguila', 'cielo'], correct: 1, reason: '"águila" lleva acento en la á.' },
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
        <h2>🔍 Detective de Palabras</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Encuentra la palabra mal escrita.</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pista ${qIndex + 1} de ${total}</div>

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
  else showToast('🏆 ¡Eres un detective experto!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
