import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'codigo-secreto';

// Cifrado César: gira la rueda hasta que el mensaje secreto se lea de verdad.
const LEVELS = [
  { label: 'Nivel 1 — Palabras cortas', words: ['HOLA', 'GATO', 'SOL', 'LUNA'], maxShift: 3, rounds: 3 },
  { label: 'Nivel 2 — Palabras secretas', words: ['AMIGO', 'CLAVE', 'ROBOT', 'PIZZA', 'TIGRE'], maxShift: 5, rounds: 4 },
  { label: 'Nivel 3 — Mensajes espía', words: ['CODIGO ROJO', 'BUEN HACKER', 'OJO ESPIA', 'MISION SECRETA'], maxShift: 7, rounds: 4 },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;       // mensajes descifrados (solo para mostrar puntos)
let roundNum = 0;
let original = '';   // texto real
let shift = 0;       // desplazamiento secreto usado para cifrar
let cipher = '';     // texto cifrado mostrado
let guess = 0;       // desplazamiento que el jugador prueba para descifrar
let mistakes = 0;    // veces que pulsó "¡Listo!" sin haberlo descifrado aún
let answered = false;

function build() { score = 0; roundNum = 0; mistakes = 0; nextRound(); }

function shiftChar(ch, s) {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode((code - 65 + s + 26) % 26 + 65);
  return ch; // espacios u otros, sin cambio
}
function shiftText(text, s) { return text.split('').map(c => shiftChar(c, s)).join(''); }

function nextRound() {
  const cfg = LEVELS[level];
  answered = false;
  roundNum++;
  original = cfg.words[Math.floor(Math.random() * cfg.words.length)];
  shift = 1 + Math.floor(Math.random() * cfg.maxShift);
  cipher = shiftText(original, shift);
  guess = 0;
  render();
}

function decodedNow() {
  // Al descifrar restamos el desplazamiento que prueba el jugador.
  return shiftText(cipher, -guess);
}

function render() {
  const cfg = LEVELS[level];
  const pct = Math.round(((roundNum - 1) / cfg.rounds) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="cyber-stage">
      <div class="cyber-header">
        <div class="back-row">
          <a href="../../ciberseguridad.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🔓 Código Secreto</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Gira la rueda hasta leer el mensaje real.</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Mensaje ${roundNum} de ${cfg.rounds}</div>

      <div class="secret-card">
        <div class="secret-label">🔒 Mensaje cifrado</div>
        <div class="cipher-text">${cipher}</div>
        <div class="secret-label">🔓 Lo que lees ahora</div>
        <div class="decoded-text" id="decoded">${decodedNow()}</div>
      </div>

      <div class="wheel">
        <button class="wheel-btn" id="btn-minus">◀</button>
        <div class="shift-display">
          <div class="shift-num" id="shift-num">${guess}</div>
          <div class="shift-cap">vueltas</div>
        </div>
        <button class="wheel-btn" id="btn-plus">▶</button>
      </div>

      <div class="action-row">
        <button class="btn btn-success" id="btn-ready">✅ ¡Listo!</button>
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak('Gira la rueda con las flechas hasta que el mensaje se lea de verdad. Luego presiona Listo.'));
  document.getElementById('btn-minus').addEventListener('click', () => turn(-1));
  document.getElementById('btn-plus').addEventListener('click', () => turn(1));
  document.getElementById('btn-ready').addEventListener('click', check);
}

function turn(dir) {
  if (answered) return;
  guess = (guess + dir + 26) % 26;
  playClick();
  document.getElementById('shift-num').textContent = guess;
  document.getElementById('decoded').textContent = decodedNow();
}

async function check() {
  if (answered) return;
  const decoded = decodedNow();
  const correct = decoded === original;
  if (!correct) {
    mistakes++;
    playError();
    showToast('Aún no se lee bien... ¡sigue girando!', 1400);
    speak('Aún no se lee bien. Sigue girando la rueda.');
    return;
  }
  answered = true;
  score++;
  const el = document.getElementById('decoded');
  el.classList.add('solved');
  playTone(660, 'sine', 0.25, 0.4);
  speak(`¡Lo descifraste! Dice ${original}.`);
  document.getElementById('reason-slot').innerHTML =
    `<div class="reason-box ok">✅ ¡Descifrado! El código movía las letras ${shift} ${shift === 1 ? 'lugar' : 'lugares'}.</div>`;

  await delay(2200);
  const cfg = LEVELS[level];
  if (roundNum >= cfg.rounds) await finishLevel();
  else nextRound();
}

async function finishLevel() {
  const cfg = LEVELS[level];
  // Siempre se descifran todos para avanzar; las estrellas premian hacerlo
  // con pocos intentos fallidos al pulsar "¡Listo!".
  const stars = mistakes === 0 ? 3 : mistakes <= cfg.rounds ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  playSuccess();
  showConfetti();
  const msg = mistakes === 0 ? `🏆 ¡Perfecto! ${cfg.rounds}/${cfg.rounds} sin errores` : `🌟 ${cfg.rounds} descifrados`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  level++;
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Eres un descifrador experto!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
