import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'mensaje-cifrado';

// Cifrado César al revés: dado un texto, elige cómo queda al mover las letras.
const LEVELS = [
  { label: 'Nivel 1 — Palabras cortas', words: ['HOLA', 'GATO', 'SOL', 'LUNA'], maxShift: 2, rounds: 3 },
  { label: 'Nivel 2 — Palabras secretas', words: ['AMIGO', 'CLAVE', 'ROBOT', 'PIZZA', 'TIGRE'], maxShift: 3, rounds: 4 },
  { label: 'Nivel 3 — Mensajes espía', words: ['CODIGO ROJO', 'BUEN HACKER', 'OJO ESPIA'], maxShift: 5, rounds: 4 },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let roundNum = 0;
let word = '';
let shift = 0;
let options = [];
let correctIdx = 0;
let answered = false;

function build() { score = 0; roundNum = 0; nextRound(); }

function shiftChar(ch, s) {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode((code - 65 + s + 26) % 26 + 65);
  return ch;
}
function shiftText(text, s) { return text.split('').map(c => shiftChar(c, s)).join(''); }

function nextRound() {
  const cfg = LEVELS[level];
  answered = false;
  roundNum++;
  word = cfg.words[Math.floor(Math.random() * cfg.words.length)];
  shift = 1 + Math.floor(Math.random() * cfg.maxShift);

  const correct = shiftText(word, shift);
  const set = new Set([correct]);
  // Distractores: el mismo texto con desplazamientos cercanos distintos.
  let d = 1;
  while (set.size < 3) {
    set.add(shiftText(word, shift + d));
    if (set.size < 3) set.add(shiftText(word, shift - d));
    d++;
  }
  options = shuffle([...set]);
  correctIdx = options.indexOf(correct);
  render();
}

function render() {
  const cfg = LEVELS[level];
  const pct = Math.round(((roundNum - 1) / cfg.rounds) * 100);
  const app = document.getElementById('app');
  const sample = 'A';

  app.innerHTML = `
    <div class="cyber-stage">
      <div class="cyber-header">
        <div class="back-row">
          <a href="../../ciberseguridad.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>✉️ Mensaje Cifrado</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Cómo queda el mensaje al cifrarlo?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Mensaje ${roundNum} de ${cfg.rounds}</div>

      <div class="task-card">
        <div class="task-label">Mensaje original</div>
        <div class="plain-word">${word}</div>
        <div class="rule">Mueve cada letra <span class="num">${shift}</span> ${shift === 1 ? 'lugar' : 'lugares'} ➡️</div>
        <div class="example">${sample} ➡️ ${shiftChar(sample, shift)}</div>
      </div>

      <div class="opt-list" id="opt-list">
        ${options.map((o, i) => `<button class="opt-btn" data-i="${i}">${o}</button>`).join('')}
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`Cifra ${word} moviendo cada letra ${shift} ${shift === 1 ? 'lugar' : 'lugares'} hacia adelante.`));
  document.querySelectorAll('.opt-btn').forEach(btn =>
    btn.addEventListener('click', () => answer(parseInt(btn.dataset.i, 10))));
}

async function answer(choice) {
  if (answered) return;
  answered = true;
  const correct = choice === correctIdx;

  document.querySelectorAll('.opt-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correctIdx) btn.classList.add('right');
    else if (i === choice) btn.classList.add('wrong');
  });

  const answerText = shiftText(word, shift);
  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct
    ? '✅ ¡Cifrado perfecto!'
    : `❌ ¡Casi! ${word} se convierte en ${answerText}.`}</div>`;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak(`Casi. Queda ${answerText}.`); }

  await delay(correct ? 2000 : 3200);
  const cfg = LEVELS[level];
  if (roundNum >= cfg.rounds) await finishLevel();
  else nextRound();
}

async function finishLevel() {
  const cfg = LEVELS[level];
  const pct = score / cfg.rounds;
  const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  playSuccess();
  showConfetti();
  const msg = score === cfg.rounds ? `🏆 ¡Perfecto! ${score}/${cfg.rounds}` : `🌟 ${score} de ${cfg.rounds} correctas`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  level++;
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Eres un maestro del cifrado!', 3000);
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
