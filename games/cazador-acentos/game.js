import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'cazador-acentos';
const BACK = '../../espanol.html';

// Cada pregunta muestra tres escrituras de la misma palabra.
// 'correct' es el índice de la palabra BIEN escrita (con su acento correcto).
const LEVELS = [
  {
    label: 'Nivel 1 — Acentos fáciles',
    questions: [
      { prompt: '¿Cuál está bien escrita?', options: ['arbol', 'árbol', 'arból'], correct: 1, reason: '"árbol" es palabra grave terminada en consonante distinta de n o s, por eso lleva acento en la a.' },
      { prompt: '¿Cuál está bien escrita?', options: ['corazon', 'córazon', 'corazón'], correct: 2, reason: '"corazón" es aguda terminada en n, lleva acento en la o final.' },
      { prompt: '¿Cuál está bien escrita?', options: ['lápiz', 'lapiz', 'lapíz'], correct: 0, reason: '"lápiz" es grave terminada en z, lleva acento en la a.' },
      { prompt: '¿Cuál está bien escrita?', options: ['cafe', 'cafén', 'café'], correct: 2, reason: '"café" es aguda terminada en vocal, lleva acento en la e.' },
      { prompt: '¿Cuál está bien escrita?', options: ['sofá', 'sofa', 'sófa'], correct: 0, reason: '"sofá" es aguda terminada en vocal, lleva acento en la a.' },
    ],
  },
  {
    label: 'Nivel 2 — Cazador atento',
    questions: [
      { prompt: '¿Cuál está bien escrita?', options: ['musica', 'música', 'musíca'], correct: 1, reason: '"música" es esdrújula: todas las esdrújulas llevan acento.' },
      { prompt: '¿Cuál está bien escrita?', options: ['telefóno', 'telefono', 'teléfono'], correct: 2, reason: '"teléfono" es esdrújula, siempre lleva acento.' },
      { prompt: '¿Cuál está bien escrita?', options: ['fácil', 'facil', 'facíl'], correct: 0, reason: '"fácil" es grave terminada en l, lleva acento en la a.' },
      { prompt: '¿Cuál está bien escrita?', options: ['cancion', 'cancíon', 'canción'], correct: 2, reason: '"canción" es aguda terminada en n, lleva acento en la o.' },
      { prompt: '¿Cuál está bien escrita?', options: ['ratón', 'raton', 'rátón'], correct: 0, reason: '"ratón" es aguda terminada en n, lleva acento en la o.' },
      { prompt: '¿Cuál está bien escrita?', options: ['jardin', 'jardín', 'járdin'], correct: 1, reason: '"jardín" es aguda terminada en n, lleva acento en la i.' },
    ],
  },
  {
    label: 'Nivel 3 — Cazador experto',
    questions: [
      { prompt: '¿Cuál está bien escrita?', options: ['Mexíco', 'Mexico', 'México'], correct: 2, reason: '"México" es esdrújula, lleva acento en la e.' },
      { prompt: '¿Cuál está bien escrita?', options: ['América', 'America', 'Améríca'], correct: 0, reason: '"América" es esdrújula, lleva acento en la e.' },
      { prompt: '¿Cuál está bien escrita?', options: ['examenes', 'exámenes', 'examénes'], correct: 1, reason: '"exámenes" es esdrújula, lleva acento en la a.' },
      { prompt: '¿Cuál está bien escrita?', options: ['pájaro', 'pajaro', 'pajáro'], correct: 0, reason: '"pájaro" es esdrújula, lleva acento en la a.' },
      { prompt: '¿Cuál está bien escrita?', options: ['miercoles', 'miércoles', 'miercóles'], correct: 1, reason: '"miércoles" es esdrújula, lleva acento en la e.' },
      { prompt: '¿Cuál está bien escrita?', options: ['rapído', 'rapido', 'rápido'], correct: 2, reason: '"rápido" es esdrújula, lleva acento en la a.' },
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
        <h2>🎯 Cazador de Acentos</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Cuál palabra está bien escrita (con su acento)?</span>
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
  else showToast('🏆 ¡Eres un cazador experto de acentos!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
