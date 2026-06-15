import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'monumentos';
const BACK = '../../geografia.html';

// Cada pregunta muestra un monumento famoso; las opciones son países.
// 'correct' es el índice del país donde está el monumento.
const LEVELS = [
  {
    label: 'Nivel 1 — Monumentos famosos',
    questions: [
      { prompt: '<img class="monument" src="../../assets/monuments/eiffel.jpg" alt="La Torre Eiffel">La Torre Eiffel', options: ['Francia', 'Italia', 'España'], correct: 0, reason: 'La Torre Eiffel está en Francia.' },
      { prompt: '<img class="monument" src="../../assets/monuments/libertad.jpg" alt="La Estatua de la Libertad">La Estatua de la Libertad', options: ['México', 'Estados Unidos', 'Canadá'], correct: 1, reason: 'La Estatua de la Libertad está en Estados Unidos.' },
      { prompt: '<img class="monument" src="../../assets/monuments/coliseo.jpg" alt="El Coliseo">El Coliseo', options: ['Grecia', 'España', 'Italia'], correct: 2, reason: 'El Coliseo está en Italia.' },
      { prompt: '<img class="monument" src="../../assets/monuments/giza.jpg" alt="Las Pirámides de Giza">Las Pirámides de Giza', options: ['Egipto', 'México', 'Perú'], correct: 0, reason: 'Las Pirámides de Giza están en Egipto.' },
      { prompt: '<img class="monument" src="../../assets/monuments/muralla.jpg" alt="La Gran Muralla">La Gran Muralla', options: ['Japón', 'China', 'India'], correct: 1, reason: 'La Gran Muralla está en China.' },
    ],
  },
  {
    label: 'Nivel 2 — Más monumentos',
    questions: [
      { prompt: '<img class="monument" src="../../assets/monuments/bigben.jpg" alt="El Big Ben">El Big Ben', options: ['Estados Unidos', 'Francia', 'Reino Unido'], correct: 2, reason: 'El Big Ben está en el Reino Unido.' },
      { prompt: '<img class="monument" src="../../assets/monuments/cristo.jpg" alt="El Cristo Redentor">El Cristo Redentor', options: ['Brasil', 'Argentina', 'Portugal'], correct: 0, reason: 'El Cristo Redentor está en Brasil.' },
      { prompt: '<img class="monument" src="../../assets/monuments/chichen.jpg" alt="Chichén Itzá">Chichén Itzá', options: ['Perú', 'México', 'Guatemala'], correct: 1, reason: 'Chichén Itzá está en México.' },
      { prompt: '<img class="monument" src="../../assets/monuments/pisa.jpg" alt="La Torre de Pisa">La Torre de Pisa', options: ['España', 'Francia', 'Italia'], correct: 2, reason: 'La Torre de Pisa está en Italia.' },
      { prompt: '<img class="monument" src="../../assets/monuments/machupicchu.jpg" alt="Machu Picchu">Machu Picchu', options: ['Perú', 'Chile', 'Bolivia'], correct: 0, reason: 'Machu Picchu está en Perú.' },
    ],
  },
  {
    label: 'Nivel 3 — Experto en monumentos',
    questions: [
      { prompt: '<img class="monument" src="../../assets/monuments/opera.jpg" alt="La Casa de la Ópera de Sídney">La Casa de la Ópera de Sídney', options: ['Nueva Zelanda', 'Australia', 'Reino Unido'], correct: 1, reason: 'La Casa de la Ópera de Sídney está en Australia.' },
      { prompt: '<img class="monument" src="../../assets/monuments/muralla.jpg" alt="La Gran Muralla">La Gran Muralla', options: ['China', 'Japón', 'Corea'], correct: 0, reason: 'La Gran Muralla está en China.' },
      { prompt: '<img class="monument" src="../../assets/monuments/libertad.jpg" alt="La Estatua de la Libertad">La Estatua de la Libertad', options: ['Canadá', 'México', 'Estados Unidos'], correct: 2, reason: 'La Estatua de la Libertad está en Estados Unidos.' },
      { prompt: '<img class="monument" src="../../assets/monuments/giza.jpg" alt="Las Pirámides de Giza">Las Pirámides de Giza', options: ['Egipto', 'Sudán', 'Marruecos'], correct: 0, reason: 'Las Pirámides de Giza están en Egipto.' },
      { prompt: '<img class="monument" src="../../assets/monuments/coliseo.jpg" alt="El Coliseo">El Coliseo', options: ['Grecia', 'Italia', 'Turquía'], correct: 1, reason: 'El Coliseo está en Italia.' },
      { prompt: '<img class="monument" src="../../assets/monuments/eiffel.jpg" alt="La Torre Eiffel">La Torre Eiffel', options: ['Bélgica', 'Suiza', 'Francia'], correct: 2, reason: 'La Torre Eiffel está en Francia.' },
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
function stripTags(s) { return s.replace(/<[^>]+>/g, ''); }

function render() {
  answered = false;
  const cfg = LEVELS[level];
  const q = current();
  const total = cfg.questions.length;
  const pct = Math.round((qIndex / total) * 100);
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="quiz-stage">
      <div class="quiz-header">
        <div class="back-row">
          <a href="${BACK}" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🗽 Monumentos del Mundo</h2>
        <div class="level-info">
          <span>${cfg.label}</span>
          <span class="score-badge">⭐ ${score} puntos</span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿En qué país está este monumento?</span>
        </div>
      </div>

      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qIndex + 1} de ${total}</div>

      <div class="prompt-card">${q.prompt}</div>

      <div class="opt-list" id="opt-list">
        ${q.options.map((o, i) => `<button class="opt-btn" data-i="${i}">${o}</button>`).join('')}
      </div>
      <div id="reason-slot"></div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () => speak(stripTags(q.prompt)));
  document.querySelectorAll('.opt-btn').forEach(btn =>
    btn.addEventListener('click', () => answer(parseInt(btn.dataset.i, 10))));
}

async function answer(choice) {
  if (answered) return;
  answered = true;
  const q = current();
  const correct = choice === q.correct;

  document.querySelectorAll('.opt-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('right');
    else if (i === choice) btn.classList.add('wrong');
  });

  document.getElementById('reason-slot').innerHTML =
    `<div class="reason-box ${correct ? 'ok' : 'bad'}">${correct ? '✅ ¡Correcto! ' : '❌ ¡Casi! '}${q.reason}</div>`;

  if (correct) { score++; playTone(660, 'sine', 0.22, 0.4); speak('¡Correcto!'); }
  else { playError(); speak('Casi. ' + q.reason); }

  await delay(correct ? 1800 : 3000);
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
  else showToast('🏆 ¡Eres un experto en monumentos!', 3000);
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
