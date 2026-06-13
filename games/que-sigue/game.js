import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'que-sigue';

const LEVEL_PATTERNS = [
  {
    label: 'Nivel 1 — Sumar de 2 en 2',
    patterns: [
      { start: 2,  step: 2,  type: '+', show: 4 },
      { start: 5,  step: 2,  type: '+', show: 4 },
      { start: 10, step: 2,  type: '+', show: 4 },
      { start: 1,  step: 3,  type: '+', show: 4 },
      { start: 0,  step: 5,  type: '+', show: 4 },
    ],
  },
  {
    label: 'Nivel 2 — Patrones variados',
    patterns: [
      { start: 1,  step: 4,  type: '+', show: 4 },
      { start: 3,  step: 3,  type: '+', show: 4 },
      { start: 100,step: -10,type: '-', show: 4 },
      { start: 2,  step: 2,  type: '×', show: 4 },
      { start: 1,  step: 3,  type: '×', show: 4 },
    ],
  },
  {
    label: 'Nivel 3 — Patrones difíciles',
    patterns: [
      { start: 1,  step: 10, type: '+', show: 4 },
      { start: 50, step: -5, type: '-', show: 4 },
      { start: 2,  step: 3,  type: '×', show: 4 },
      { start: 5,  step: 5,  type: '+', show: 5 },
      { start: 1,  step: 4,  type: '×', show: 4 },
    ],
  },
];

let level = 0;
let qIdx = 0;
let earned = getStars(GAME_ID);
let answered = false;

function build() {
  const cfg = LEVEL_PATTERNS[Math.min(level, LEVEL_PATTERNS.length - 1)];
  qIdx = 0;
  answered = false;
  renderQ(cfg);
}

function makeSequence(pat) {
  const nums = [pat.start];
  for (let i = 1; i < pat.show + 1; i++) {
    const prev = nums[i - 1];
    nums.push(pat.type === '+' ? prev + pat.step
            : pat.type === '-' ? prev + pat.step
            : prev * pat.step);
  }
  return nums;
}

function renderQ(cfg) {
  answered = false;
  const pat = cfg.patterns[qIdx % cfg.patterns.length];
  const nums = makeSequence(pat);
  const shown = nums.slice(0, pat.show);
  const answer = nums[pat.show];

  const wrongSet = new Set([answer]);
  while (wrongSet.size < 4) {
    const d = [pat.step, -pat.step, pat.step * 2, Math.floor(pat.step / 2) || 1]
      [wrongSet.size - 1];
    const c = pat.type === '×' ? answer + d : answer + d;
    if (c > 0) wrongSet.add(c);
  }
  wrongSet.delete(answer);
  const choices = shuffle([answer, ...[...wrongSet].slice(0, 3)]);

  const patternDesc = pat.type === '+' ? `+${pat.step} cada vez`
    : pat.type === '-' ? `${pat.step} cada vez`
    : `×${pat.step} cada vez`;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="qs-stage">
      <div class="qs-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🔢 ¿Qué Sigue?</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span style="color:var(--text2); font-size:0.9rem;">Patrón ${qIdx+1} de ${cfg.patterns.length}</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">¿Qué número viene después en el patrón?</span>
        </div>
      </div>

      <div class="sequence-card">
        <div class="sequence-row">
          ${shown.map((n, i) => `
            <span class="seq-num">${n}</span>
            ${i < shown.length - 1 ? `<span class="seq-arrow">→</span>` : ''}
          `).join('')}
          <span class="seq-arrow">→</span>
          <span class="seq-blank">?</span>
        </div>
        <div class="pattern-hint">Pista: ${patternDesc}</div>
      </div>

      <div class="choices-grid">
        ${choices.map(c => `<button class="choice-btn" data-val="${c}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`¿Qué número sigue en la secuencia: ${shown.join(', ')}?`));

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => onPick(parseInt(btn.dataset.val), btn, answer, cfg));
  });
}

async function onPick(val, btn, answer, cfg) {
  if (answered) return;
  answered = true;
  playClick();

  if (val === answer) {
    btn.classList.add('correct');
    playTone(660, 'sine', 0.2, 0.3);
    showToast('¡Correcto! 🔢', 1400);
    speak('¡Correcto!');
  } else {
    btn.classList.add('wrong');
    playError();
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (parseInt(b.dataset.val) === answer) b.classList.add('correct');
    });
    showToast(`La respuesta es ${answer}`, 1800);
    speak(`No. El siguiente es ${answer}.`);
  }

  await delay(1600);
  qIdx++;

  if (qIdx >= cfg.patterns.length) {
    level++;
    const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    playSuccess();
    showConfetti();
    showToast('¡Nivel completado! 🔢✨', 2500);
    speak('¡Excelente! ¡Entiendes los patrones!');
    await delay(2600);
    if (level < LEVEL_PATTERNS.length) build();
    else showToast('🏆 ¡Completaste ¿Qué Sigue?!', 3000);
  } else {
    renderQ(cfg);
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
