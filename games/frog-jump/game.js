import { showConfetti, playTone, playSuccess, playError, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'frog-jump';

const LEVELS = [
  { pads: 3, target: 4, label: 'Nivel 1 — Laguna pequeña' },
  { pads: 5, target: 6, label: 'Nivel 2 — Laguna mediana' },
  { pads: 7, target: 8, label: 'Nivel 3 — Laguna grande' },
];

let level = 0;
let jumps = 1;
let animating = false;
let earned = getStars(GAME_ID);

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  jumps = 1;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="pond-stage">
      <div class="pond-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🐸 Frog Jump</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span>Meta: <strong>${cfg.target} saltos</strong></span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Elige cuántas veces quieres que la rana salte para llegar al otro lado.</span>
        </div>
      </div>

      <div class="pond-container" id="pond-container">
        <div class="pond-row" id="pond-row">
          <div class="bank" id="left-bank">🌿</div>
          <div class="water" id="water">
            ${buildPads(cfg)}
          </div>
          <div class="bank right-bank" id="right-bank">🏁</div>
        </div>
        <div class="frog" id="frog" style="left: 16px;">🐸</div>
      </div>

      <div class="controls">
        <p class="jump-hint">¿Cuántas veces debe saltar la rana?</p>
        <div class="counter-row">
          <button class="counter-btn minus" id="btn-minus">−</button>
          <div class="counter-display" id="jump-count">1</div>
          <button class="counter-btn plus" id="btn-plus">+</button>
        </div>
        <button class="btn btn-success" id="btn-jump" style="font-size:1.4rem; padding: 18px 48px;">
          🐸 ¡Saltar!
        </button>
        <button class="btn btn-back" id="btn-reset">🔄 Reiniciar</button>
      </div>
    </div>
  `;

  positionFrog(0, cfg);

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(document.getElementById('instruction-text').textContent));
  document.getElementById('btn-plus').addEventListener('click', () => changeJumps(1, cfg));
  document.getElementById('btn-minus').addEventListener('click', () => changeJumps(-1, cfg));
  document.getElementById('btn-jump').addEventListener('click', () => doJump(cfg));
  document.getElementById('btn-reset').addEventListener('click', build);
}

function buildPads(cfg) {
  let html = '';
  for (let i = 0; i < cfg.pads; i++) {
    const pct = ((i + 1) / (cfg.pads + 1)) * 100;
    html += `<div class="lily-pad" style="left: calc(${pct}% - 26px);">🍃</div>`;
  }
  return html;
}

function getPadPositions(cfg) {
  const water = document.getElementById('water');
  if (!water) return [];
  const w = water.offsetWidth;
  const pos = [];
  for (let i = 0; i < cfg.pads; i++) {
    pos.push(((i + 1) / (cfg.pads + 1)) * w);
  }
  return pos;
}

function positionFrog(step, cfg) {
  const frog = document.getElementById('frog');
  const pond = document.getElementById('pond-container');
  const bank = document.getElementById('left-bank');
  const rightBank = document.getElementById('right-bank');
  const water = document.getElementById('water');
  if (!frog || !pond || !water) return;

  const bankW = bank.offsetWidth;
  const waterW = water.offsetWidth;
  const rightBankLeft = bankW + waterW;

  if (step === 0) {
    frog.style.left = (bankW / 2 - 20) + 'px';
  } else if (step >= cfg.target) {
    frog.style.left = (rightBankLeft + rightBank.offsetWidth / 2 - 20) + 'px';
  } else {
    const pads = getPadPositions(cfg);
    const padIdx = step - 1;
    if (padIdx < pads.length) {
      frog.style.left = (bankW + pads[padIdx] - 20) + 'px';
    }
  }
}

function changeJumps(delta, cfg) {
  jumps = Math.max(1, Math.min(cfg.target + 3, jumps + delta));
  document.getElementById('jump-count').textContent = jumps;
  playTone(440 + jumps * 40, 'sine', 0.05, 0.2);
}

async function doJump(cfg) {
  if (animating) return;
  animating = true;
  document.getElementById('btn-jump').disabled = true;

  const frog = document.getElementById('frog');
  let step = 0;

  for (let i = 0; i < jumps; i++) {
    step++;
    if (step > cfg.target + 1) break;
    frog.classList.add('jumping');
    playTone(350 + step * 20, 'sine', 0.12, 0.25);
    await delay(100);
    frog.classList.remove('jumping');
    positionFrog(Math.min(step, cfg.target + 1), cfg);
    await delay(150);
  }

  await delay(200);

  if (step === cfg.target) {
    await win(cfg);
  } else if (step < cfg.target) {
    await tooFew(cfg, step);
  } else {
    await tooMany(cfg);
  }
}

async function win(cfg) {
  const frog = document.getElementById('frog');
  frog.textContent = '🥳';
  playSuccess();
  showConfetti();
  level++;
  const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  showToast('¡Lo lograste! 🌟', 2000);
  speak('¡Lo lograste! ¡La rana llegó al otro lado!');
  await delay(2000);
  animating = false;
  if (level < LEVELS.length) {
    build();
  } else {
    showToast('🏆 ¡Completaste todos los niveles!', 3000);
    document.getElementById('btn-jump').disabled = true;
  }
}

async function tooFew(cfg, step) {
  const frog = document.getElementById('frog');
  frog.classList.add('splash');
  await delay(300);
  frog.textContent = '💦';
  frog.classList.remove('splash');
  playError();
  showToast('¡Splash! La rana cayó al agua 😅', 2000);
  speak('¡Uy! La rana cayó al agua. Necesita más saltos.');
  await delay(1800);
  frog.textContent = '🐸';
  positionFrog(0, cfg);
  animating = false;
  jumps = 1;
  document.getElementById('jump-count').textContent = jumps;
  document.getElementById('btn-jump').disabled = false;
}

async function tooMany(cfg) {
  const frog = document.getElementById('frog');
  frog.textContent = '😵';
  playTone(200, 'sawtooth', 0.3, 0.3);
  showToast('¡Se pasó! La rana saltó de más 😄', 2000);
  speak('La rana se pasó. Necesita menos saltos.');
  await delay(1800);
  frog.textContent = '🐸';
  positionFrog(0, cfg);
  animating = false;
  document.getElementById('btn-jump').disabled = false;
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
