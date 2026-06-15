import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'sinonimos';
const BACK = '../../espanol.html';

// El enunciado muestra una palabra. Las opciones son tres palabras.
// 'correct' es el índice del SINÓNIMO (significa lo mismo).
const LEVELS = [
  {
    label: 'Nivel 1 — Sinónimos fáciles',
    questions: [
      { prompt: '<b>bonito</b>', options: ['feo', 'lindo', 'roto'], correct: 1, reason: '"bonito" significa lo mismo que "lindo".' },
      { prompt: '<b>contento</b>', options: ['feliz', 'triste', 'cansado'], correct: 0, reason: '"contento" significa lo mismo que "feliz".' },
      { prompt: '<b>rápido</b>', options: ['lento', 'gordo', 'veloz'], correct: 2, reason: '"rápido" significa lo mismo que "veloz".' },
      { prompt: '<b>casa</b>', options: ['hogar', 'calle', 'jardín'], correct: 0, reason: '"casa" significa lo mismo que "hogar".' },
      { prompt: '<b>grande</b>', options: ['chico', 'flaco', 'enorme'], correct: 2, reason: '"grande" significa lo mismo que "enorme".' },
    ],
  },
  {
    label: 'Nivel 2 — Buscando parejas',
    questions: [
      { prompt: '<b>comenzar</b>', options: ['empezar', 'terminar', 'guardar'], correct: 0, reason: '"comenzar" significa lo mismo que "empezar".' },
      { prompt: '<b>triste</b>', options: ['alegre', 'apenado', 'fuerte'], correct: 1, reason: '"triste" significa lo mismo que "apenado".' },
      { prompt: '<b>bonita</b>', options: ['sucia', 'vieja', 'hermosa'], correct: 2, reason: '"bonita" significa lo mismo que "hermosa".' },
      { prompt: '<b>error</b>', options: ['equivocación', 'acierto', 'premio'], correct: 0, reason: '"error" significa lo mismo que "equivocación".' },
      { prompt: '<b>miedo</b>', options: ['valor', 'risa', 'temor'], correct: 2, reason: '"miedo" significa lo mismo que "temor".' },
      { prompt: '<b>regalo</b>', options: ['obsequio', 'castigo', 'tarea'], correct: 0, reason: '"regalo" significa lo mismo que "obsequio".' },
    ],
  },
  {
    label: 'Nivel 3 — Experto en sinónimos',
    questions: [
      { prompt: '<b>contestar</b>', options: ['preguntar', 'responder', 'callar'], correct: 1, reason: '"contestar" significa lo mismo que "responder".' },
      { prompt: '<b>asustar</b>', options: ['espantar', 'calmar', 'abrazar'], correct: 0, reason: '"asustar" significa lo mismo que "espantar".' },
      { prompt: '<b>delgado</b>', options: ['gordo', 'alto', 'flaco'], correct: 2, reason: '"delgado" significa lo mismo que "flaco".' },
      { prompt: '<b>tonto</b>', options: ['necio', 'listo', 'amable'], correct: 0, reason: '"tonto" significa lo mismo que "necio".' },
      { prompt: '<b>brillante</b>', options: ['oscuro', 'sucio', 'reluciente'], correct: 2, reason: '"brillante" significa lo mismo que "reluciente".' },
      { prompt: '<b>tranquilo</b>', options: ['calmado', 'nervioso', 'enojado'], correct: 0, reason: '"tranquilo" significa lo mismo que "calmado".' },
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
        <h2>🟰 Sinónimos</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Elige la palabra que significa lo mismo.</span>
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
  else showToast('🏆 ¡Eres experto en sinónimos!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
