import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'caza-phishing';

// phish:true = es una trampa (phishing). El niño decide Confiable / Trampa.
const LEVELS = [
  {
    label: 'Nivel 1 — Mensajes fáciles',
    questions: [
      { channel: '📧 Correo', from: 'profe.ana@miescuela.mx', subject: 'Tarea de mañana',
        body: 'Hola, recuerden traer la tarea de matemáticas. ¡Nos vemos!',
        phish: false, reason: 'Es tu profe, sin pedir datos ni dinero. Es confiable.' },
      { channel: '📱 Mensaje', from: 'Número desconocido', subject: '',
        body: '¡GANASTE un celular GRATIS! 🎉 Da clic aquí y escribe tu contraseña para reclamarlo.',
        phish: true, reason: 'Regalos sorpresa que piden tu contraseña SIEMPRE son trampa.' },
      { channel: '📧 Correo', from: 'soporte@bancoo-seguro.com', subject: 'Tu cuenta será bloqueada',
        body: 'Urgente: confirma tu clave y tu NIP en este enlace o perderás tu cuenta HOY.',
        phish: true, reason: 'Un banco nunca pide tu clave por correo, y "urgente" es señal de engaño.' },
      { channel: '📱 Mensaje', from: 'Mamá', subject: '',
        body: 'Hijo, ya voy llegando por ti a la escuela. 💛',
        phish: false, reason: 'Es un mensaje normal de tu mamá, sin pedir datos. Confiable.' },
    ],
  },
  {
    label: 'Nivel 2 — Más tramposos',
    questions: [
      { channel: '📧 Correo', from: 'premios@ganaste-millones.net', subject: 'Eres el visitante 1,000,000',
        body: 'Haz clic para reclamar tu premio. Solo necesitamos los datos de la tarjeta de tus papás.',
        phish: true, reason: 'Pide datos de tarjetas y promete premios enormes: trampa clarísima.' },
      { channel: '🎮 Juego', from: 'FreeRobux_Gratis', subject: '',
        body: '¡Monedas infinitas! Escribe tu usuario y contraseña aquí y te las regalamos.',
        phish: true, reason: 'Nadie regala monedas a cambio de tu contraseña. Es para robar tu cuenta.' },
      { channel: '📧 Correo', from: 'biblioteca@miescuela.mx', subject: 'Libro por devolver',
        body: 'Recuerda devolver "El Principito" esta semana. Gracias.',
        phish: false, reason: 'Aviso normal de la escuela, sin pedir datos. Confiable.' },
      { channel: '📱 Mensaje', from: 'Tía Rosa', subject: '',
        body: 'Préstame rápido tu contraseña de la tablet, es una emergencia, no le digas a nadie.',
        phish: true, reason: 'Pedir tu contraseña "en secreto y rápido" es una trampa, aunque parezca un familiar.' },
      { channel: '📧 Correo', from: 'equipo@correo-escolar.mx', subject: 'Boletín de la semana',
        body: 'Estas son las actividades de la semana. ¡Que tengas un buen día!',
        phish: false, reason: 'Información general, sin enlaces raros ni peticiones. Confiable.' },
    ],
  },
  {
    label: 'Nivel 3 — Cazador experto',
    questions: [
      { channel: '📧 Correo', from: 'no-responder@netfllix-cuenta.com', subject: 'Renueva tu cuenta',
        body: 'Tu cuenta caducó. Escribe tu contraseña y tarjeta para no perder tus series.',
        phish: true, reason: 'Mira bien: dice "netfllix" con doble L. Es un sitio falso que copia al real.' },
      { channel: '📱 Mensaje', from: 'Paquetería', subject: '',
        body: 'Tu paquete está detenido. Paga $5 aquí con la tarjeta para liberarlo: bit.ly/xz9',
        phish: true, reason: 'Enlaces cortos raros + pago urgente con tarjeta = trampa muy común.' },
      { channel: '📧 Correo', from: 'director@miescuela.mx', subject: 'Junta de padres',
        body: 'Estimadas familias, la junta será el viernes a las 5 pm en el auditorio.',
        phish: false, reason: 'Correo normal del director, sin pedir datos. Confiable.' },
      { channel: '🎮 Juego', from: 'Soporte Oficial', subject: '',
        body: 'Detectamos un problema. Confirma tu cuenta dándonos tu contraseña por el chat.',
        phish: true, reason: 'El soporte de verdad NUNCA te pide tu contraseña por chat.' },
      { channel: '📱 Mensaje', from: 'Mejor amigo', subject: '',
        body: '¿Jugamos en la tarde? 😄',
        phish: false, reason: 'Mensaje normal de un amigo, sin pedir nada raro. Confiable.' },
      { channel: '📧 Correo', from: 'regalos@app-monedas.co', subject: '500 gemas gratis',
        body: 'Descarga este archivo .exe y tendrás gemas infinitas en todos tus juegos.',
        phish: true, reason: 'Archivos que prometen trucos infinitos suelen traer virus. Trampa.' },
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
        <h2>🎣 Caza Phishing</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Este mensaje es confiable o es una trampa?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Mensaje ${qIndex + 1} de ${total}</div>

      <div class="msg-card">
        <div class="msg-channel">${q.channel}</div>
        <div class="msg-from">De: <b>${q.from}</b></div>
        ${q.subject ? `<div class="msg-subject">${q.subject}</div>` : ''}
        <div class="msg-body">${q.body}</div>
      </div>

      <div class="choice-row">
        <button class="btn btn-success choice-btn" id="btn-safe">✅ Confiable</button>
        <button class="btn btn-danger choice-btn" id="btn-trap">🎣 ¡Trampa!</button>
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`${q.subject ? q.subject + '. ' : ''}${q.body}`));
  document.getElementById('btn-safe').addEventListener('click', () => answer(false));
  document.getElementById('btn-trap').addEventListener('click', () => answer(true));
}

async function answer(saidTrap) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = saidTrap === q.phish;

  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Bien cazado! ' : '❌ ¡Cuidado! '}${q.reason}</div>`;
  document.getElementById('btn-safe').disabled = true;
  document.getElementById('btn-trap').disabled = true;

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
  else showToast('🏆 ¡Eres cazador experto de phishing!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
