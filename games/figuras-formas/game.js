import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'figuras-formas';

const COLORS = ['#4ecdc4','#f5a623','#e94560','#a8ff78','#c77dff','#ffe66d'];

function svgCircle(c)   { return `<circle cx="90" cy="90" r="75" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`; }
function svgTriangle(c) { return `<polygon points="90,10 170,170 10,170" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`; }
function svgSquare(c)   { return `<rect x="15" y="15" width="150" height="150" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`; }
function svgRect(c)     { return `<rect x="5" y="40" width="170" height="100" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`; }
function svgPentagon(c) {
  const pts = [90,10,170,65,140,160,40,160,10,65].map((v,i,a)=> i%2===0?v+',':v+' ').join('').trim();
  return `<polygon points="${pts}" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`;
}
function svgHex(c) {
  const pts = [90,8,164,50,164,130,90,172,16,130,16,50].map((v,i,a)=> i%2===0?v+',':v+' ').join('').trim();
  return `<polygon points="${pts}" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`;
}
function svgDiamond(c)  { return `<polygon points="90,10 170,90 90,170 10,90" fill="${c}" stroke="#1a1a2e" stroke-width="3"/>`; }

const SHAPES = [
  { id:'circle',   name:'Círculo',    svg: svgCircle,   sides: 0, area: (r=75) => Math.round(Math.PI * r * r), hint:'¡No tiene lados! Es redondo como la luna.' },
  { id:'triangle', name:'Triángulo',  svg: svgTriangle, sides: 3, area: () => Math.round(0.5*160*160), hint:'Tres lados, tres esquinas. Como una pizza en rebanada.' },
  { id:'square',   name:'Cuadrado',   svg: svgSquare,   sides: 4, area: () => 150*150, hint:'4 lados iguales. Como una servilleta.' },
  { id:'rect',     name:'Rectángulo', svg: svgRect,     sides: 4, area: () => 170*100, hint:'4 lados pero no todos iguales. Como una puerta.' },
  { id:'pentagon', name:'Pentágono',  svg: svgPentagon, sides: 5, area: () => 0, hint:'5 lados. Como la señal de pare en EE.UU.' },
  { id:'hexagon',  name:'Hexágono',   svg: svgHex,      sides: 6, area: () => 0, hint:'6 lados. Como la celda de una colmena de abejas.' },
  { id:'diamond',  name:'Rombo',      svg: svgDiamond,  sides: 4, area: () => 0, hint:'4 lados iguales pero inclinado. Como una cometa.' },
];

const LEVELS = [
  {
    label: 'Nivel 1 — ¿Cómo se llama?',
    type: 'name',
    shapes: ['circle','triangle','square','rect'],
    questions: 4,
  },
  {
    label: 'Nivel 2 — ¿Cuántos lados?',
    type: 'sides',
    shapes: ['triangle','square','pentagon','hexagon'],
    questions: 4,
  },
  {
    label: 'Nivel 3 — Identificar con más figuras',
    type: 'name',
    shapes: ['pentagon','hexagon','diamond','circle','triangle'],
    questions: 5,
  },
];

let level = 0;
let qNum = 0;
let earned = getStars(GAME_ID);
let answered = false;

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  qNum = 0;
  answered = false;
  renderQ(cfg);
}

function renderQ(cfg) {
  answered = false;
  const shapeId = cfg.shapes[qNum % cfg.shapes.length];
  const shape = SHAPES.find(s => s.id === shapeId);
  const color = COLORS[qNum % COLORS.length];

  let question, choices, correctAnswer;

  if (cfg.type === 'name') {
    question = '¿Cómo se llama esta figura?';
    const others = SHAPES.filter(s => s.id !== shapeId && cfg.shapes.includes(s.id)).slice(0, 3);
    choices = shuffle([shape, ...others]).map(s => ({ label: s.name, value: s.id }));
    correctAnswer = shapeId;
  } else {
    question = '¿Cuántos lados tiene esta figura?';
    const wrongSides = shuffle([...new Set([0,3,4,5,6,8].filter(n => n !== shape.sides))]).slice(0, 3);
    choices = shuffle([shape.sides, ...wrongSides]).map(n => ({
      label: n === 0 ? '0 (ninguno)' : `${n} lados`,
      value: n,
    }));
    correctAnswer = shape.sides;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="geo-stage">
      <div class="geo-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🔺 Figuras y Formas</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span style="color:var(--text2); font-size:0.9rem;">Figura ${qNum+1} de ${cfg.questions}</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">${question}</span>
        </div>
      </div>

      <div class="shape-card">
        <svg class="shape-svg" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
          ${shape.svg(color)}
        </svg>
        <div class="shape-question">${question}</div>
      </div>

      <div class="choices-grid">
        ${choices.map(c => `
          <button class="choice-btn" data-val="${c.value}">${c.label}</button>
        `).join('')}
      </div>

      <div class="fact-box">💡 ${shape.hint}</div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () => speak(question));

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = isNaN(btn.dataset.val) ? btn.dataset.val : parseInt(btn.dataset.val);
      onPick(val, btn, correctAnswer, cfg, shape);
    });
  });
}

async function onPick(val, btn, correct, cfg, shape) {
  if (answered) return;
  answered = true;
  playClick();

  const isCorrect = String(val) === String(correct);
  if (isCorrect) {
    btn.classList.add('correct');
    playSuccess();
    showToast(`¡Correcto! Es un ${shape.name} 🎉`, 1500);
    speak(`¡Correcto! Es un ${shape.name}`);
  } else {
    btn.classList.add('wrong');
    playError();
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (String(b.dataset.val) === String(correct)) b.classList.add('correct');
    });
    showToast(`Es un ${shape.name}. ${shape.hint}`, 2500);
    speak(`No. Es un ${shape.name}. ${shape.hint}`);
  }

  await delay(2000);
  qNum++;

  if (qNum >= cfg.questions) {
    level++;
    const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    playSuccess();
    showConfetti();
    showToast('¡Nivel completado! 🔺✨', 2500);
    speak('¡Excelente! ¡Conoces las figuras geométricas!');
    await delay(2600);
    if (level < LEVELS.length) build();
    else showToast('🏆 ¡Completaste Figuras y Formas!', 3000);
  } else {
    renderQ(cfg);
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
