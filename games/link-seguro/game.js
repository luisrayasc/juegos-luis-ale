import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'link-seguro';

// 'options' lista direcciones; 'safe' es el índice de la verdadera.
const LEVELS = [
  {
    label: 'Nivel 1 — Mira con cuidado',
    questions: [
      { brand: '🎮', title: 'Quieres entrar al sitio real del juego',
        options: ['juego-gratis-premios.xyz', 'www.minijuegos.com', 'minijuegos-login.tk'],
        safe: 1, reason: 'El verdadero termina en .com y no promete premios ni pide "login" raro.' },
      { brand: '📺', title: '¿Cuál es la página real de videos?',
        options: ['www.youtube.com', 'youtube-regalos.net', 'y0utube.com'],
        safe: 0, reason: 'El real es youtube.com. "y0utube" usa un cero para engañarte.' },
      { brand: '🏫', title: 'La página de tu escuela',
        options: ['miescuela-premios.click', 'www.miescuela.edu.mx', 'mi-escuela-gratis.info'],
        safe: 1, reason: 'Termina en .edu.mx (escuelas) y no ofrece premios. Esa es la real.' },
    ],
  },
  {
    label: 'Nivel 2 — Imitaciones astutas',
    questions: [
      { brand: '💳', title: 'El banco real de tus papás',
        options: ['www.bancoazul.com.mx', 'bancoazul-seguro-login.com', 'banco-azul.verifica.net'],
        safe: 0, reason: 'El real es corto y directo. Los otros añaden palabras como "seguro" o "verifica" para engañar.' },
      { brand: '🛒', title: 'La tienda real en línea',
        options: ['ofertas-tienda.win', 'www.latienda.com', 'latlenda.com'],
        safe: 1, reason: '"latlenda" cambió una letra. El verdadero es latienda.com.' },
      { brand: '✉️', title: 'Tu correo electrónico',
        options: ['www.gmail.com', 'gmail-premios2026.com', 'gmai1.com'],
        safe: 0, reason: '"gmai1" usa un 1 en vez de la L. El real es gmail.com.' },
      { brand: '🎁', title: '¿Cuál es seguro para entrar?',
        options: ['regalos-gratis-ya.xyz', 'tu-premio-espera.click', 'www.tienda-oficial.com'],
        safe: 2, reason: 'Los que gritan "regalos gratis" o "premio" son trampa. El .com oficial es el seguro.' },
    ],
  },
  {
    label: 'Nivel 3 — Ojo de experto',
    questions: [
      { brand: '🔐', title: 'Página real para cambiar tu contraseña',
        options: ['cuenta-segura-login.info', 'www.miapp.com/cuenta', 'miapp.com.verifica-ahora.net'],
        safe: 1, reason: 'El real empieza con miapp.com. Lo de después del .com extra es un truco.' },
      { brand: '📦', title: 'Rastrear tu paquete',
        options: ['www.paqueteria.com.mx', 'paqueteria-pago.bit.ly', 'paqueterla.com'],
        safe: 0, reason: '"paqueterla" cambió una letra y el otro pide pago. El real es .com.mx.' },
      { brand: '🎬', title: 'Ver tus series',
        options: ['netflix-cuenta-gratis.tv', 'www.netflix.com', 'netfllix.com'],
        safe: 1, reason: '"netfllix" tiene doble L. El verdadero es netflix.com.' },
      { brand: '🏦', title: '¿Cuál NO es una trampa?',
        options: ['www.bancoazul.com.mx', 'bancoazul-mx.support', 'secure-bancoazul.online'],
        safe: 0, reason: 'Los bancos usan su dominio corto y oficial, no ".support" ni ".online" raros.' },
      { brand: '🕹️', title: 'Sitio oficial del juego',
        options: ['descarga-hack-gratis.exe.com', 'www.superjuego.com', 'superjuego-monedas.vip'],
        safe: 1, reason: 'Nada de "hack" ni "monedas vip". El oficial es superjuego.com.' },
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
        <h2>🔗 ¿Link Seguro?</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>Elige la dirección verdadera y segura.</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Reto ${qIndex + 1} de ${total}</div>

      <div class="prompt-card"><span class="brand">${q.brand}</span>${q.title}</div>

      <div class="url-list" id="url-list">
        ${q.options.map((url, i) => `<button class="url-btn" data-i="${i}">${url}</button>`).join('')}
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(`${q.title}. Elige la dirección verdadera.`));
  document.querySelectorAll('.url-btn').forEach(btn =>
    btn.addEventListener('click', () => answer(parseInt(btn.dataset.i, 10))));
}

async function answer(choice) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = choice === q.safe;

  document.querySelectorAll('.url-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.safe) btn.classList.add('right');
    else if (i === choice) btn.classList.add('wrong');
  });

  const slot = document.getElementById('reason-slot');
  slot.innerHTML = `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Bien elegido! ' : '❌ ¡Ojo! '}${q.reason}</div>`;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Ojo. ' + q.reason); }

  await delay(correct ? 2400 : 3600);
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
  else showToast('🏆 ¡Detectas enlaces falsos como experto!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
