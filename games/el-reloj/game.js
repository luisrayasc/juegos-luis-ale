import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'el-reloj';

const LEVELS = [
  { label: 'Nivel 1 — Horas exactas',    minutes: [0],          questions: 5 },
  { label: 'Nivel 2 — Medias y cuartos', minutes: [0,15,30,45], questions: 6 },
  { label: 'Nivel 3 — Cualquier hora',   minutes: null,         questions: 8 },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let qNum = 0;
let answered = false;

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  score = 0; qNum = 0; answered = false;
  nextQ(cfg);
}

function makeTime(cfg) {
  const h = rnd(1, 12);
  const m = cfg.minutes
    ? cfg.minutes[rnd(0, cfg.minutes.length - 1)]
    : rnd(0, 11) * 5;
  return { h, m };
}

function fmt(h, m) {
  return `${h}:${String(m).padStart(2, '0')}`;
}

function makeChoices(correct) {
  const set = new Set([fmt(correct.h, correct.m)]);
  while (set.size < 4) {
    const dh = rnd(-2, 2) || 1;
    const dm = [-30,-15,15,30][rnd(0,3)];
    let nh = ((correct.h + dh - 1 + 12) % 12) + 1;
    let nm = ((correct.m + dm) + 60) % 60;
    if (nm % 5 !== 0) nm = Math.round(nm / 5) * 5 % 60;
    set.add(fmt(nh, nm));
  }
  return shuffle([...set]);
}

function clockSVG(h, m) {
  const cx = 100, cy = 100, r = 90;
  const mAngle = (m / 60) * 2 * Math.PI - Math.PI / 2;
  const hAngle = ((h % 12 + m / 60) / 12) * 2 * Math.PI - Math.PI / 2;
  const mx = cx + 70 * Math.cos(mAngle);
  const my = cy + 70 * Math.sin(mAngle);
  const hx = cx + 48 * Math.cos(hAngle);
  const hy = cy + 48 * Math.sin(hAngle);

  const ticks = Array.from({length: 12}, (_, i) => {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + (r - 8) * Math.cos(a), y1 = cy + (r - 8) * Math.sin(a);
    const x2 = cx + r * Math.cos(a),       y2 = cy + r * Math.sin(a);
    const num = i === 0 ? 12 : i;
    const nx = cx + (r - 22) * Math.cos(a), ny = cy + (r - 22) * Math.sin(a);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff44" stroke-width="3"/>
      <text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central"
        font-family="Nunito,sans-serif" font-size="14" font-weight="900" fill="#ffffffcc">${num}</text>`;
  }).join('');

  return `<svg class="clock-svg" width="200" height="200" viewBox="0 0 200 200">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#16213e" stroke="#4ecdc4" stroke-width="4"/>
    ${ticks}
    <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#ffe66d" stroke-width="6" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="#e94560"/>
  </svg>`;
}

function nextQ(cfg) {
  answered = false;
  qNum++;
  const time = makeTime(cfg);
  const choices = makeChoices(time);
  render(cfg, time, choices);
}

function render(cfg, time, choices) {
  const pct = Math.round(((qNum - 1) / cfg.questions) * 100);
  document.getElementById('app').innerHTML = `
    <div class="reloj-stage">
      <div class="reloj-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🕐 El Reloj</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span style="color:var(--text2);font-size:.9rem;">Pregunta ${qNum}/${cfg.questions}</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Qué hora muestra el reloj?</span>
        </div>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qNum} de ${cfg.questions}</div>
      <div class="clock-wrap">${clockSVG(time.h, time.m)}</div>
      <div class="choices-grid">
        ${choices.map(c => `<button class="choice-btn" data-val="${c}">${c}</button>`).join('')}
      </div>
    </div>`;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak('¿Qué hora muestra el reloj?'));
  document.querySelectorAll('.choice-btn').forEach(btn =>
    btn.addEventListener('click', () => onPick(btn.dataset.val, btn, fmt(time.h, time.m), cfg)));
}

async function onPick(val, btn, correct, cfg) {
  if (answered) return;
  answered = true;
  playClick();
  if (val === correct) {
    btn.classList.add('correct'); score++;
    playSuccess(); speak(`¡Correcto! Son las ${correct}`);
  } else {
    btn.classList.add('wrong'); playError();
    document.querySelectorAll('.choice-btn').forEach(b => { if (b.dataset.val === correct) b.classList.add('correct'); });
    speak(`Son las ${correct}`);
  }
  await delay(1400);
  if (qNum >= cfg.questions) await finish(cfg);
  else nextQ(cfg);
}

async function finish(cfg) {
  const pct = score / cfg.questions;
  level++;
  const stars = pct >= .85 ? 3 : pct >= .6 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStars(); playSuccess(); showConfetti();
  showToast(score === cfg.questions ? '🏆 ¡Perfecto!' : `🌟 ${score}/${cfg.questions} correctas`, 2500);
  speak(`${score} de ${cfg.questions} correctas`);
  await delay(2600);
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Dominas el reloj!', 3000);
}

function updateStars() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function shuffle(arr) { for (let i = arr.length-1; i > 0; i--) { const j = rnd(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
