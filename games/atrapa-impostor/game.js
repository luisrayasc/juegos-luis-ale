import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'atrapa-impostor';

// impostor:true = aunque parezca conocido, está intentando engañarte.
const LEVELS = [
  {
    label: 'Nivel 1 — Primeras pistas',
    questions: [
      { avatar: '🧒', name: 'Tu amigo Beto', sub: 'En el chat del juego',
        text: 'Oye, ¿jugamos un rato hoy en la tarde?',
        impostor: false, reason: 'Solo te invita a jugar, sin pedir datos. Puedes confiar.' },
      { avatar: '👤', name: 'Beto_Oficial_2', sub: 'Cuenta nueva, nunca habías hablado con ella',
        text: 'Soy Beto pero perdí mi cuenta. Pásame tu contraseña para "recuperarla". 😉',
        impostor: true, reason: 'Un amigo de verdad nunca te pide tu contraseña. ¡Es un impostor!' },
      { avatar: '👮', name: 'Policía del juego', sub: 'Mensaje sorpresa',
        text: 'Tu cuenta tiene un problema. Dame tu clave o la borraré en 5 minutos.',
        impostor: true, reason: 'Nadie del juego te pide la clave ni te apura así. Es trampa.' },
      { avatar: '👧', name: 'Tu prima Sofi', sub: 'Videollamada de siempre',
        text: '¡Hola! ¿Le dices a tu mamá que la llamo al rato?',
        impostor: false, reason: 'Es un mensaje normal de tu prima, sin pedir datos. Confía.' },
    ],
  },
  {
    label: 'Nivel 2 — Más astutos',
    questions: [
      { avatar: '🎁', name: 'Regalos YouTube', sub: 'Te escribió de la nada',
        text: 'Eres el fan #1. Dame tu usuario y clave para enviarte un regalo especial.',
        impostor: true, reason: 'Los "regalos" que piden tu usuario y clave son para robarte la cuenta.' },
      { avatar: '🧑‍🏫', name: 'Maestra Ana', sub: 'Correo de la escuela',
        text: 'Recuerden la tarea de ciencias para el lunes. Saludos.',
        impostor: false, reason: 'Es tu maestra recordando tarea, sin pedir datos. Confía.' },
      { avatar: '👥', name: 'Mamá', sub: 'Pero desde un número desconocido',
        text: 'Hijo, cambié de número. Mándame el código que te llegó por mensaje. 🙏',
        impostor: true, reason: 'Pedir el código que te llegó es una trampa clásica, aunque diga ser tu mamá. Verifica en persona.' },
      { avatar: '🧒', name: 'Tu amigo Beto', sub: 'Chat de siempre',
        text: '¿Viste la tarea? No le entendí al problema 3. 😅',
        impostor: false, reason: 'Conversación normal entre amigos. Puedes confiar.' },
      { avatar: '💼', name: 'Soporte Técnico', sub: 'Llamada inesperada',
        text: 'Para arreglar tu compu necesito que me digas la contraseña de tus papás.',
        impostor: true, reason: 'El soporte real nunca pide contraseñas. Cuelga y avisa a un adulto.' },
    ],
  },
  {
    label: 'Nivel 3 — Detective experto',
    questions: [
      { avatar: '👤', name: 'Niña de 10 años 🙂', sub: 'Desconocida, te agregó hoy',
        text: '¿Me mandas una foto tuya y me dices en qué escuela estás? Quiero ser tu amiga.',
        impostor: true, reason: 'Un desconocido pidiendo fotos y tu escuela es muy peligroso. No respondas y avisa.' },
      { avatar: '👵', name: 'Abuela', sub: 'Llamada normal',
        text: '¿Cómo te fue en el examen, mi amor?',
        impostor: false, reason: 'Es tu abuela preguntando por ti, sin pedir datos. Confía.' },
      { avatar: '🏆', name: 'Torneo Oficial', sub: 'Mensaje emocionante',
        text: '¡Clasificaste! Solo confirma con la tarjeta de tus papás para reservar tu lugar.',
        impostor: true, reason: 'Ningún torneo de niños pide tarjetas. Es para robar dinero.' },
      { avatar: '🧑', name: 'Tu hermano', sub: 'Chat de siempre',
        text: 'Ya voy llegando, ¿me abres la puerta?',
        impostor: false, reason: 'Mensaje normal de tu hermano. Puedes confiar.' },
      { avatar: '🤖', name: 'Asistente del Juego', sub: 'Ventana emergente',
        text: 'Verifica que eres humano escribiendo tu correo y tu contraseña aquí.',
        impostor: true, reason: 'Las verificaciones reales no piden tu contraseña en ventanas sorpresa.' },
      { avatar: '👨‍👩‍👧', name: 'Papá', sub: 'Mensaje de siempre',
        text: '¿Ya hiciste la tarea? Cenamos en 20 minutos. 🍝',
        impostor: false, reason: 'Mensaje cotidiano de tu papá, sin nada raro. Confía.' },
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
        <h2>🕵️ Atrapa al Impostor</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Confías en este mensaje o sospechas?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Mensaje ${qIndex + 1} de ${total}</div>

      <div class="chat-card">
        <div class="chat-who">
          <span class="chat-avatar">${q.avatar}</span>
          <div>
            <div class="chat-name">${q.name}</div>
            <div class="chat-sub">${q.sub}</div>
          </div>
        </div>
        <div class="chat-bubble">${q.text}</div>
      </div>

      <div class="choice-row">
        <button class="btn btn-success choice-btn" id="btn-trust">🤝 Confío</button>
        <button class="btn btn-danger choice-btn" id="btn-suspect">🕵️ Sospecho</button>
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`${q.name} dice: ${q.text}`));
  document.getElementById('btn-trust').addEventListener('click', () => answer(false));
  document.getElementById('btn-suspect').addEventListener('click', () => answer(true));
}

async function answer(saidSuspect) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = saidSuspect === q.impostor;

  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Atrapado! ' : '❌ ¡Cuidado! '}${q.reason}</div>`;
  document.getElementById('btn-trust').disabled = true;
  document.getElementById('btn-suspect').disabled = true;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Cuidado. ' + q.reason); }

  await delay(correct ? 2200 : 3400);
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
  else showToast('🏆 ¡Detective experto en impostores!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
