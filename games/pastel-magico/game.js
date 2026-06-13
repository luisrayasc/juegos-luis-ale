import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'pastel-magico';

const SLICE_COLORS = ['#e94560','#f5a623','#4ecdc4','#ffe66d','#a8ff78','#c77dff'];

const LEVELS = [
  {
    label: 'Nivel 1 — Mitades y cuartos',
    questions: [
      { question: '¿Cuál pastel muestra 1/2?',      answer: '1/2', options: ['1/2','1/3','1/4','1/1'] },
      { question: '¿Cuál muestra 1/4 coloreado?',   answer: '1/4', options: ['1/2','1/3','1/4','2/4'] },
      { question: '¿Cuál tiene 2/4 coloreado?',     answer: '2/4', options: ['1/4','2/4','3/4','1/2'] },
    ],
  },
  {
    label: 'Nivel 2 — Tercios y más',
    questions: [
      { question: '¿Cuál muestra 1/3?',             answer: '1/3', options: ['1/2','1/3','1/4','2/3'] },
      { question: '¿Cuál muestra 2/3?',             answer: '2/3', options: ['1/3','2/3','3/3','1/2'] },
      { question: '¿Cuál muestra 3/4?',             answer: '3/4', options: ['1/4','2/4','3/4','4/4'] },
    ],
  },
  {
    label: 'Nivel 3 — Fracciones mixtas',
    questions: [
      { question: '¿Cuál muestra 2/5?',             answer: '2/5', options: ['1/5','2/5','3/5','2/4'] },
      { question: '¿Cuál muestra 3/6?',             answer: '3/6', options: ['2/6','3/6','4/6','1/2'] },
      { question: '¿Cuál muestra 4/5?',             answer: '4/5', options: ['3/5','4/5','5/5','3/4'] },
    ],
  },
];

let level = 0;
let qIdx = 0;
let earned = getStars(GAME_ID);
let answered = false;

function parseFrac(str) {
  const [n, d] = str.split('/').map(Number);
  return { n, d };
}

function makePieSVG(fracStr, filled = true) {
  const { n, d } = parseFrac(fracStr);
  const cx = 80, cy = 80, r = 72;
  const slices = [];

  for (let i = 0; i < d; i++) {
    const startAngle = (i / d) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = (1 / d) > 0.5 ? 1 : 0;
    const color = i < n ? SLICE_COLORS[i % SLICE_COLORS.length] : '#0f3460';
    slices.push(`<path d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z"
      fill="${color}" stroke="#1a1a2e" stroke-width="2"/>`);
  }

  return `<svg class="pie-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#16213e" stroke="#4ecdc433" stroke-width="2"/>
    ${slices.join('\n')}
    <circle cx="${cx}" cy="${cy}" r="4" fill="#1a1a2e"/>
  </svg>`;
}

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  qIdx = 0;
  answered = false;
  renderQuestion(cfg);
}

function renderQuestion(cfg) {
  answered = false;
  const q = cfg.questions[qIdx];
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="pastel-stage">
      <div class="pastel-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🍰 Pastel Mágico</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span style="color:var(--text2); font-size:0.9rem;">Pregunta ${qIdx+1} de ${cfg.questions.length}</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Haz clic en el pastel que muestra la fracción correcta.</span>
        </div>
      </div>

      <div class="challenge-text">${q.question}</div>

      <div class="hint-text">
        💡 La fracción <strong>${q.answer}</strong> significa:
        <strong>${parseFrac(q.answer).n}</strong> parte${parseFrac(q.answer).n > 1 ? 's' : ''}
        de <strong>${parseFrac(q.answer).d}</strong> en total
      </div>

      <div class="pies-row" id="pies-row">
        ${q.options.map(opt => `
          <div class="pie-wrap" data-frac="${opt}">
            ${makePieSVG(opt)}
          </div>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () => speak(q.question));

  document.querySelectorAll('.pie-wrap').forEach(el => {
    el.addEventListener('click', () => onPick(el.dataset.frac, el, q, cfg));
  });
}

async function onPick(frac, el, q, cfg) {
  if (answered) return;
  answered = true;
  playClick();

  if (frac === q.answer) {
    el.classList.add('correct');
    playSuccess();
    showToast('¡Correcto! 🍰', 1500);
    speak('¡Correcto!');
  } else {
    el.classList.add('wrong');
    playError();
    document.querySelectorAll('.pie-wrap').forEach(p => {
      if (p.dataset.frac === q.answer) p.classList.add('correct');
    });
    showToast(`No. La fracción ${q.answer} es la correcta.`, 2000);
    speak(`No. La respuesta correcta es ${q.answer.replace('/', ' de ')}`);
  }

  await delay(1800);
  qIdx++;

  if (qIdx >= cfg.questions.length) {
    level++;
    const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    playSuccess();
    showConfetti();
    showToast('¡Nivel completado! 🍰✨', 2500);
    speak('¡Excelente! ¡Sabes leer fracciones!');
    await delay(2600);
    if (level < LEVELS.length) build();
    else showToast('🏆 ¡Completaste Pastel Mágico!', 3000);
  } else {
    renderQuestion(cfg);
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
