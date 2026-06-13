import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'suma-rapida';

const LEVELS = [
  { label: 'Nivel 1 — 4 cifras', digits: 4, op: '+',   questions: 5 },
  { label: 'Nivel 2 — 6 cifras', digits: 6, op: '+',   questions: 5 },
  { label: 'Nivel 3 — 7 cifras', digits: 7, op: 'mix', questions: 6 },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let questionNum = 0;
let current = null;
let userInput = '';
let answered = false;

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  score = 0;
  questionNum = 0;
  nextQuestion(cfg);
}

function makeQuestion(cfg) {
  const min = Math.pow(10, cfg.digits - 1);
  const max = Math.pow(10, cfg.digits) - 1;
  const op = cfg.op === 'mix' ? (Math.random() < 0.5 ? '+' : '-') : cfg.op;

  let a, b, answer;
  if (op === '+') {
    a = rnd(min, max);
    b = rnd(min, max);
    answer = a + b;
  } else {
    a = rnd(min, max);
    b = rnd(min, a);
    answer = a - b;
  }
  return { a, b, op, answer };
}

function nextQuestion(cfg) {
  answered = false;
  userInput = '';
  questionNum++;
  current = makeQuestion(cfg);
  render(cfg);
}

function render(cfg) {
  const pct = Math.round(((questionNum - 1) / cfg.questions) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="suma-stage">
      <div class="suma-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>➕ Suma Rápida</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Escribe el resultado de la operación.</span>
        </div>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="progress-label">Pregunta ${questionNum} de ${cfg.questions}</div>

      <div class="operation-card" id="op-card">
        <div class="op-row">
          <span class="op-sign"> </span>
          <span class="op-number">${current.a.toLocaleString('es-MX')}</span>
        </div>
        <div class="op-row">
          <span class="op-sign ${cfg.op === '+' ? 'plus' : 'minus'}">${cfg.op}</span>
          <span class="op-number">${current.b.toLocaleString('es-MX')}</span>
        </div>
        <hr class="op-line">
        <div class="answer-row">
          <span class="op-sign"> </span>
          <input
            class="answer-input"
            id="answer-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="?"
            maxlength="9"
            autocomplete="off"
            readonly
            value="${userInput}"
          />
        </div>
      </div>

      <div class="numpad" id="numpad">
        ${[7,8,9,4,5,6,1,2,3].map(n => `
          <button class="numpad-btn" data-n="${n}">${n}</button>
        `).join('')}
        <button class="numpad-btn delete" id="btn-del">⌫ Borrar</button>
        <button class="numpad-btn" data-n="0">0</button>
        <button class="numpad-btn" id="btn-clear-input" style="color:var(--text2); font-size:1rem;">✕ Limpiar</button>
        <button class="numpad-btn check" id="btn-check">✅ Verificar</button>
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`¿Cuánto es ${current.a} ${cfg.op === '+' ? 'más' : 'menos'} ${current.b}?`));

  document.querySelectorAll('[data-n]').forEach(btn => {
    btn.addEventListener('click', () => pressDigit(btn.dataset.n));
  });
  document.getElementById('btn-del').addEventListener('click', pressDelete);
  document.getElementById('btn-clear-input').addEventListener('click', () => { userInput = ''; updateDisplay(); });
  document.getElementById('btn-check').addEventListener('click', () => checkAnswer(cfg));

  document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  if (answered) return;
  if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
  if (e.key === 'Backspace') pressDelete();
  if (e.key === 'Enter') {
    const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
    checkAnswer(cfg);
  }
}

function pressDigit(d) {
  if (answered || userInput.length >= 9) return;
  playTone(600 + parseInt(d) * 30, 'sine', 0.05, 0.2);
  userInput = d + userInput;   // nuevo dígito entra por la derecha
  updateDisplay();
}

function pressDelete() {
  if (answered) return;
  playClick();
  userInput = userInput.slice(1);  // borra el dígito más a la derecha (último ingresado)
  updateDisplay();
}

function updateDisplay() {
  const inp = document.getElementById('answer-input');
  if (inp) inp.value = userInput || '';
}

async function checkAnswer(cfg) {
  if (answered || userInput === '') {
    if (userInput === '') {
      showToast('¡Escribe un número primero!', 1200);
      speak('Escribe un número primero.');
    }
    return;
  }
  answered = true;
  document.removeEventListener('keydown', handleKeydown);

  const inp = document.getElementById('answer-input');
  const val = parseInt(userInput, 10);

  if (val === current.answer) {
    inp.classList.add('correct');
    score++;
    playTone(660, 'sine', 0.25, 0.4);
    speak('¡Correcto!');
  } else {
    inp.classList.add('wrong');
    playError();
    speak(`No. La respuesta es ${current.answer}.`);
    await delay(400);
    inp.value = current.answer;
    inp.classList.remove('wrong');
    inp.classList.add('correct');
  }

  disableNumpad();
  await delay(1400);

  if (questionNum >= cfg.questions) {
    await finishLevel(cfg);
  } else {
    nextQuestion(cfg);
  }
}

function disableNumpad() {
  document.querySelectorAll('.numpad-btn').forEach(b => {
    b.style.opacity = '0.4';
    b.style.pointerEvents = 'none';
  });
}

async function finishLevel(cfg) {
  const pct = score / cfg.questions;
  const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
  level++;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  playSuccess();
  showConfetti();
  const msg = score === cfg.questions
    ? `🏆 ¡Perfecto! ${score}/${cfg.questions}`
    : `🌟 ${score} de ${cfg.questions} correctas`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Completaste Suma Rápida!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
