import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'tablas-locas';

const LEVELS = [
  { label: 'Tablas del 2, 3 y 4', tables: [2, 3, 4], questions: 6 },
  { label: 'Tablas del 5, 6 y 7', tables: [5, 6, 7], questions: 8 },
  { label: 'Tablas del 8, 9 y 10', tables: [8, 9, 10], questions: 10 },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let streak = 0;
let questionNum = 0;
let answered = false;
let learned = new Set();

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  score = 0; streak = 0; questionNum = 0; answered = false; learned = new Set();
  nextQuestion(cfg);
}

function makeQuestion(cfg) {
  const table = cfg.tables[Math.floor(Math.random() * cfg.tables.length)];
  const mult = rnd(1, 10);
  const answer = table * mult;
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const d = rnd(-4, 4);
    const c = answer + d * table;
    if (c > 0 && c !== answer) wrongs.add(c);
  }
  return { table, mult, answer, choices: shuffle([answer, ...wrongs]) };
}

function nextQuestion(cfg) {
  answered = false;
  questionNum++;
  const q = makeQuestion(cfg);
  render(cfg, q);
}

function render(cfg, q) {
  const pct = Math.round(((questionNum - 1) / cfg.questions) * 100);
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="tablas-stage">
      <div class="tablas-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>✖️ Tablas Locas</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">✖️ ${score} correctas</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">¿Cuánto es ${q.table} × ${q.mult}?</span>
        </div>
      </div>

      <div style="width:100%;max-width:500px;background:var(--card);border-radius:20px;height:10px;overflow:hidden;margin-bottom:20px;">
        <div style="height:100%;width:${pct}%;background:var(--purple);border-radius:20px;transition:width 0.3s;"></div>
      </div>

      <div class="equation-card">
        <div class="equation-text">
          ${q.table} × ${q.mult} = <span class="question-mark">?</span>
        </div>
      </div>

      <div class="streak-display" id="streak">
        ${streak >= 3 ? `🔥 ¡Racha de ${streak}!` : ''}
      </div>

      <div class="choices-grid" id="choices">
        ${q.choices.map(c => `<button class="choice-btn" data-val="${c}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`¿Cuánto es ${q.table} por ${q.mult}?`));

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => onAnswer(parseInt(btn.dataset.val), btn, cfg, q));
  });
}

async function onAnswer(val, btn, cfg, q) {
  if (answered) return;
  answered = true;

  if (val === q.answer) {
    btn.classList.add('correct');
    score++;
    streak++;
    learned.add(`${q.table}x${q.mult}`);
    playTone(550 + streak * 40, 'sine', 0.2, 0.3);
    speak(streak >= 3 ? `¡Racha de ${streak}!` : '¡Correcto!');
  } else {
    btn.classList.add('wrong');
    streak = 0;
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (parseInt(b.dataset.val) === q.answer) b.classList.add('correct');
    });
    playError();
    speak(`${q.table} por ${q.mult} es ${q.answer}`);
  }

  await delay(1200);

  if (questionNum >= cfg.questions) {
    await finishLevel(cfg);
  } else {
    nextQuestion(cfg);
  }
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
    ? `🏆 ¡Perfecto! Todas correctas`
    : `🌟 ${score} de ${cfg.questions} correctas`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Conoces todas las tablas!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
