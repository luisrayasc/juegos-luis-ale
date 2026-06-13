import { showConfetti, playTone, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'light-show';

const BUTTONS = [
  { id: 'red',    emoji: '🔴', label: 'Rojo',    color: '#e94560', freq: 261 },
  { id: 'yellow', emoji: '🟡', label: 'Amarillo', color: '#ffe66d', freq: 329 },
  { id: 'green',  emoji: '🟢', label: 'Verde',   color: '#a8ff78', freq: 392 },
  { id: 'blue',   emoji: '🔵', label: 'Azul',    color: '#4ecdc4', freq: 523 },
  { id: 'purple', emoji: '🟣', label: 'Morado',  color: '#c77dff', freq: 659 },
];

const LEVELS = [3, 4, 5, 6, 7];

let mode = 'free';
let simonSeq = [];
let playerSeq = [];
let currentLevel = 0;
let canInput = false;
let earned = getStars(GAME_ID);

function build() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stage">
      <div class="stage-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <div>
            <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
          </div>
        </div>
        <h2>🎵 Light Show DJ</h2>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn" title="Escuchar">🔊</button>
          <span id="instruction-text">¡Haz clic en los botones para encender las luces!</span>
        </div>
        <div class="mode-btns">
          <button class="btn btn-primary" id="btn-free">🎶 Modo Libre</button>
          <button class="btn btn-warn" id="btn-simon">🎯 Reto Simón</button>
        </div>
      </div>

      <div class="spotlights" id="spotlights"></div>

      <div id="simon-ui" style="display:none; text-align:center;">
        <div class="simon-display" id="simon-status">Nivel 1</div>
        <div class="simon-progress" id="simon-dots"></div>
        <button class="btn btn-success" id="btn-start-simon">¡Empezar!</button>
      </div>
    </div>
  `;

  const container = document.getElementById('spotlights');
  BUTTONS.forEach(b => {
    const wrap = document.createElement('div');
    wrap.className = 'spot-wrap';
    wrap.innerHTML = `
      <div class="spotlight" id="spot-${b.id}"
           style="background: linear-gradient(180deg, ${b.color}44, ${b.color}22); color: ${b.color}; border-color: ${b.color}44;">
        <span>${b.emoji}</span>
      </div>
      <span class="spot-label">${b.label}</span>
    `;
    container.appendChild(wrap);
    document.getElementById(`spot-${b.id}`).addEventListener('click', () => onSpotClick(b));
  });

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(document.getElementById('instruction-text').textContent));
  document.getElementById('btn-free').addEventListener('click', setFreeMode);
  document.getElementById('btn-simon').addEventListener('click', setSimonMode);
  document.getElementById('btn-start-simon').addEventListener('click', startSimon);

  setFreeMode();
}

function setInstruction(text) {
  document.getElementById('instruction-text').textContent = text;
}

function setFreeMode() {
  mode = 'free';
  canInput = true;
  document.getElementById('simon-ui').style.display = 'none';
  setInstruction('¡Haz clic en cualquier botón para encender las luces! Cada botón produce un sonido diferente.');
}

function setSimonMode() {
  mode = 'simon';
  canInput = false;
  currentLevel = 0;
  simonSeq = [];
  playerSeq = [];
  document.getElementById('simon-ui').style.display = 'block';
  document.getElementById('btn-start-simon').style.display = 'inline-flex';
  setInstruction('¡Sigue la secuencia de luces! Memoriza el orden y repítelo.');
  updateSimonStatus('¡Listo para empezar!');
  buildDots(0);
}

function buildDots(total) {
  const c = document.getElementById('simon-dots');
  c.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'simon-dot';
    d.id = `dot-${i}`;
    c.appendChild(d);
  }
}

function updateSimonStatus(text) {
  document.getElementById('simon-status').textContent = text;
}

async function startSimon() {
  document.getElementById('btn-start-simon').style.display = 'none';
  canInput = false;
  playerSeq = [];

  const len = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];
  simonSeq = Array.from({ length: len }, () => BUTTONS[Math.floor(Math.random() * BUTTONS.length)]);
  buildDots(len);
  updateSimonStatus(`¡Mira la secuencia! (${len} pasos)`);

  await delay(600);
  for (let i = 0; i < simonSeq.length; i++) {
    await lightUp(simonSeq[i], 600);
    await delay(200);
  }

  canInput = true;
  updateSimonStatus('¡Tu turno! Repite la secuencia');
  setInstruction('¡Ahora repite la secuencia en el mismo orden!');
}

function lightUp(b, duration = 500) {
  return new Promise(resolve => {
    const el = document.getElementById(`spot-${b.id}`);
    el.classList.add('lit');
    playTone(b.freq, 'sine', duration / 1000, 0.4);
    setTimeout(() => {
      el.classList.remove('lit');
      resolve();
    }, duration);
  });
}

function onSpotClick(b) {
  playClick();
  if (mode === 'free') {
    const el = document.getElementById(`spot-${b.id}`);
    el.classList.add('lit');
    playTone(b.freq, 'sine', 0.3, 0.4);
    setTimeout(() => el.classList.remove('lit'), 350);
    return;
  }
  if (!canInput) return;

  lightUp(b, 300);
  playerSeq.push(b.id);
  const idx = playerSeq.length - 1;

  const dot = document.getElementById(`dot-${idx}`);
  if (dot) dot.classList.add('done');

  if (playerSeq[idx] !== simonSeq[idx].id) {
    canInput = false;
    document.getElementById(`spot-${b.id}`).classList.add('wrong');
    setTimeout(() => document.getElementById(`spot-${b.id}`)?.classList.remove('wrong'), 600);
    playError();
    showToast('¡Casi! Inténtalo de nuevo 💪');
    setTimeout(() => {
      playerSeq = [];
      buildDots(simonSeq.length);
      updateSimonStatus('¡Vuelve a intentarlo!');
      setTimeout(() => startSimon(), 1200);
    }, 1000);
    return;
  }

  if (playerSeq.length === simonSeq.length) {
    canInput = false;
    currentLevel++;
    const stars = currentLevel >= 3 ? 3 : currentLevel >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    const msg = currentLevel >= 5
      ? '🏆 ¡Eres un Maestro DJ!'
      : '🌟 ¡Excelente! ¡Secuencia correcta!';
    showToast(msg, 2000);
    playSuccess();
    showConfetti();
    updateStarDisplay();
    setTimeout(() => {
      if (currentLevel < LEVELS.length) {
        updateSimonStatus(`Nivel ${currentLevel + 1} — ¡Más larga!`);
        document.getElementById('btn-start-simon').style.display = 'inline-flex';
        document.getElementById('btn-start-simon').textContent = `¡Nivel ${currentLevel + 1}!`;
      } else {
        updateSimonStatus('🏆 ¡Completaste todos los niveles!');
      }
    }, 2200);
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
