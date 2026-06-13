import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'guardian-datos';

// good:true = es un buen hábito de seguridad.
const LEVELS = [
  {
    label: 'Nivel 1 — Hábitos básicos',
    questions: [
      { emoji: '🤐', text: 'No le digo mi contraseña a nadie, ni a mis amigos.', good: true, reason: 'Las contraseñas son solo tuyas (y de tus papás). ¡Muy bien!' },
      { emoji: '📝', text: 'Pego mi contraseña en una nota en la pantalla.', good: false, reason: 'Si la dejas a la vista, cualquiera puede usarla. Mejor recuérdala.' },
      { emoji: '🚪', text: 'Cierro sesión cuando uso una computadora prestada.', good: true, reason: 'Cerrar sesión evita que otros entren a tu cuenta. ¡Excelente!' },
      { emoji: '♻️', text: 'Uso la misma contraseña para TODO.', good: false, reason: 'Si descubren una, entran a todo. Mejor usa claves distintas.' },
    ],
  },
  {
    label: 'Nivel 2 — Guardián atento',
    questions: [
      { emoji: '🙋', text: 'Si algo raro pasa, le aviso a un adulto de confianza.', good: true, reason: 'Pedir ayuda a un adulto es lo más inteligente. ¡Muy bien!' },
      { emoji: '🔗', text: 'Doy clic en cualquier enlace que me llega.', good: false, reason: 'Los enlaces desconocidos pueden ser trampas o virus. Piénsalo antes.' },
      { emoji: '🔄', text: 'Cambio mi contraseña si creo que alguien la vio.', good: true, reason: 'Cambiarla a tiempo te protege. ¡Buen reflejo!' },
      { emoji: '📷', text: 'Acepto videollamadas de personas que no conozco.', good: false, reason: 'Nunca hables por cámara con desconocidos. Avisa a un adulto.' },
      { emoji: '🛡️', text: 'Activo la verificación en dos pasos cuando puedo.', good: true, reason: 'Dos pasos = doble escudo. ¡Gran hábito!' },
    ],
  },
  {
    label: 'Nivel 3 — Maestro guardián',
    questions: [
      { emoji: '🧩', text: 'Mi contraseña mezcla letras, números y símbolos.', good: true, reason: 'Mientras más variada, más difícil de adivinar. ¡Perfecto!' },
      { emoji: '🎁', text: 'Si me ofrecen premios gratis, doy mis datos rápido.', good: false, reason: 'Los premios que piden tus datos casi siempre son trampa.' },
      { emoji: '👀', text: 'Tapo el teclado cuando escribo mi contraseña.', good: true, reason: 'Así nadie ve lo que escribes. ¡Muy astuto!' },
      { emoji: '💾', text: 'Guardo mi contraseña en un chat público del juego.', good: false, reason: 'Todos podrían leerla. Las claves nunca van en chats.' },
      { emoji: '🤔', text: 'Antes de descargar algo, le pregunto a un adulto.', good: true, reason: 'Preguntar antes evita virus y problemas. ¡Bien hecho!' },
      { emoji: '🌐', text: 'Comparto mi ubicación en vivo con desconocidos.', good: false, reason: 'Nunca compartas dónde estás con gente que no conoces.' },
    ],
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let score = 0;
let qIndex = 0;
let answered = false;

function build() { score = 0; qIndex = 0; render(); }
function current() { return LEVELS[level].questions[qIndex]; }

function render() {
  answered = false;
  const cfg = LEVELS[level];
  const q = current();
  const total = cfg.questions.length;
  const pct = Math.round((qIndex / total) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="cyber-stage">
      <div class="cyber-header">
        <div class="back-row">
          <a href="../../ciberseguridad.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🗝️ Guardián de Datos</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Es una buena o una mala idea?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Hábito ${qIndex + 1} de ${total}</div>

      <div class="item-card">
        <div class="item-emoji">${q.emoji}</div>
        <div class="item-text">${q.text}</div>
      </div>

      <div class="choice-row">
        <button class="btn btn-success choice-btn" id="btn-good">👍 Buena idea</button>
        <button class="btn btn-danger choice-btn" id="btn-bad">👎 Mala idea</button>
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () => speak(q.text));
  document.getElementById('btn-good').addEventListener('click', () => answer(true));
  document.getElementById('btn-bad').addEventListener('click', () => answer(false));
}

async function answer(saidGood) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = saidGood === q.good;

  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Correcto! ' : '❌ ¡Casi! '}${q.reason}</div>`;
  document.getElementById('btn-good').disabled = true;
  document.getElementById('btn-bad').disabled = true;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Casi. ' + q.reason); }

  await delay(correct ? 2000 : 3200);
  next();
}

async function next() {
  qIndex++;
  if (qIndex < LEVELS[level].questions.length) { render(); return; }
  await finishLevel();
}

async function finishLevel() {
  const total = LEVELS[level].questions.length;
  const pct = score / total;
  const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  playSuccess();
  showConfetti();
  const msg = score === total ? `🏆 ¡Perfecto! ${score}/${total}` : `🌟 ${score} de ${total} correctas`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  level++;
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Eres un maestro guardián!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
