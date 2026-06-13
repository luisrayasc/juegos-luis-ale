import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'bug-buster';

const LEVELS = [
  {
    label: 'Nivel 1 — 1 bug fácil',
    robotMsg: '¡Fui a hacer un sándwich y algo salió MUY MAL! 😵',
    steps: [
      { text: '🍞 Poner el pan de abajo', correct: true },
      { text: '🍅 Poner el tomate', correct: false, bugHint: 'El queso va ANTES que el tomate', fixes: ['🧀 Poner el queso', '🥬 Poner la lechuga', '🍟 Poner papas fritas'], correctFix: '🧀 Poner el queso' },
      { text: '🧀 Poner el queso', correct: true },
      { text: '🍞 Poner el pan de arriba', correct: true },
    ],
    bugCount: 1,
  },
  {
    label: 'Nivel 2 — 1 bug escondido',
    robotMsg: 'Quise regar las plantas pero las maté 😢',
    steps: [
      { text: '🪣 Llenar el balde con agua', correct: true },
      { text: '☀️ Poner las plantas al sol', correct: true },
      { text: '🔥 Calentar el agua', correct: false, bugHint: '¡No debes calentar el agua! Las plantas quieren agua fría', fixes: ['❄️ Enfriar el agua', '🌧️ Usar agua de lluvia', '🔥 Calentar más'], correctFix: '❄️ Enfriar el agua' },
      { text: '💧 Regar las plantas', correct: true },
      { text: '🌱 Ver crecer las plantas', correct: true },
    ],
    bugCount: 1,
  },
  {
    label: 'Nivel 3 — 2 bugs',
    robotMsg: 'Intenté enviar una carta pero nunca llegó 📭',
    steps: [
      { text: '📝 Escribir la carta', correct: true },
      { text: '✉️ Meter la carta al sobre', correct: true },
      { text: '🏠 Escribir la dirección', correct: false, bugHint: 'El sello postal va ANTES de la dirección', fixes: ['📮 Poner el sello postal', '🖊️ Firmar la carta', '🏠 Poner dirección en la carta'], correctFix: '📮 Poner el sello postal' },
      { text: '📮 Poner el sello postal', correct: false, bugHint: 'La dirección va ANTES del sello', fixes: ['🏠 Escribir la dirección', '📦 Meter en caja', '🔒 Cerrar el sobre'], correctFix: '🏠 Escribir la dirección' },
      { text: '📬 Echar al buzón', correct: true },
    ],
    bugCount: 2,
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let fixedBugs = 0;
let currentSteps = [];

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  fixedBugs = 0;
  currentSteps = cfg.steps.map(s => ({ ...s }));
  renderGame(cfg);
}

function renderGame(cfg) {
  const remainingBugs = currentSteps.filter(s => s.correct === false).length;
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="bug-stage">
      <div class="bug-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🐛 Bug Buster</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="bugs-found">🐛 Bugs: ${fixedBugs} / ${cfg.bugCount}</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Encuentra el paso INCORRECTO y haz clic en él para corregirlo.</span>
        </div>
      </div>

      <div class="robot-scene">
        <div class="robot-figure" id="robot-figure">🤖</div>
        <div class="speech-bubble">${cfg.robotMsg}</div>
      </div>

      <div class="steps-list" id="steps-list">
        ${currentSteps.map((s, i) => `
          <div class="step-row ${s.fixed ? 'correct-step' : ''}" data-idx="${i}">
            <span class="step-num">${i + 1}</span>
            <span>${s.fixed ? ('✅ ' + s.fixedText) : s.text}</span>
            ${s.fixed ? '<span style="margin-left:auto; color:var(--green);">✔ Corregido</span>' : ''}
          </div>`).join('')}
      </div>

      <div class="run-log" id="run-log">
        Haz clic en el paso que está MAL 👆
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak('Encuentra el paso incorrecto y haz clic en él para corregirlo.'));

  document.querySelectorAll('.step-row').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('correct-step')) return;
      const idx = parseInt(el.dataset.idx);
      onStepClick(idx, cfg);
    });
  });
}

function onStepClick(idx, cfg) {
  const step = currentSteps[idx];
  if (step.fixed) return;
  playClick();

  if (step.correct) {
    playError();
    showToast('Este paso está correcto. Busca el que está MAL.', 1800);
    speak('Este paso está bien. Sigue buscando el error.');
    const el = document.querySelector(`[data-idx="${idx}"]`);
    el.classList.add('anim-shake');
    setTimeout(() => el.classList.remove('anim-shake'), 500);
    return;
  }

  document.querySelectorAll('.step-row').forEach(el => el.classList.remove('selected'));
  const el = document.querySelector(`[data-idx="${idx}"]`);
  el.classList.add('selected');

  showFixPanel(idx, step, cfg);
}

function showFixPanel(idx, step, cfg) {
  let panel = document.getElementById('fix-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'fix-panel';
    panel.className = 'fix-panel';
    document.querySelector('.steps-list').after(panel);
  }
  panel.innerHTML = `
    <h3>🔧 ¿Cuál es el paso correcto?</h3>
    <p style="color:var(--text2); margin-bottom:12px;">${step.bugHint}</p>
    <div class="fix-choices">
      ${step.fixes.map(f => `<button class="fix-btn" data-fix="${f}">${f}</button>`).join('')}
    </div>
  `;

  panel.querySelectorAll('.fix-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.fix === step.correctFix) {
        step.correct = true;
        step.fixed = true;
        step.fixedText = step.correctFix;
        fixedBugs++;
        playTone(660, 'sine', 0.2, 0.3);
        showToast('¡Bug encontrado y corregido! 🐛✅', 1500);
        speak('¡Correcto! Bug eliminado.');
        panel.remove();

        if (fixedBugs >= cfg.bugCount) {
          setTimeout(() => runFixed(cfg), 600);
        } else {
          renderGame(cfg);
          showToast(`¡Bien! Todavía hay ${cfg.bugCount - fixedBugs} bug más.`, 1800);
        }
      } else {
        playError();
        showToast('Esa no es la corrección correcta. ¡Intenta otra!', 1800);
        speak('Esa no es la solución correcta.');
        btn.style.borderColor = 'var(--red)';
      }
    });
  });
}

async function runFixed(cfg) {
  renderGame(cfg);
  const logEl = document.getElementById('run-log');
  const robotEl = document.getElementById('robot-figure');
  if (logEl) logEl.textContent = '✅ ¡Todos los bugs corregidos! Ejecutando...';

  for (let i = 0; i < currentSteps.length; i++) {
    const el = document.querySelector(`[data-idx="${i}"]`);
    if (el) {
      el.style.background = '#4ecdc422';
      el.style.borderColor = 'var(--teal)';
    }
    if (robotEl) { robotEl.classList.add('anim-bounce'); }
    playTone(350 + i * 60, 'sine', 0.15, 0.25);
    await delay(400);
    if (robotEl) robotEl.classList.remove('anim-bounce');
  }

  if (robotEl) robotEl.textContent = '🥳';
  playSuccess();
  showConfetti();
  level++;
  const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  showToast('¡El robot funciona perfectamente! 🤖✨', 2500);
  speak('¡Increíble! Encontraste el bug y el robot funciona perfecto.');
  await delay(2600);
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Completaste Bug Buster!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
