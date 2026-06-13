import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'magic-variables';

const JARS = [
  { id: 'coins',  emoji: '🪙', label: 'monedas', color: '#ffe66d', text: '#1a1a2e' },
  { id: 'stars',  emoji: '⭐', label: 'estrellas', color: '#f5a623', text: '#1a1a2e' },
  { id: 'hearts', emoji: '❤️', label: 'vidas',    color: '#e94560', text: '#fff' },
];

const CHALLENGES = [
  {
    setup: { coins: 5, stars: 3, hearts: 2 },
    question: '¿Cuánto es monedas + estrellas?',
    solve: v => v.coins + v.stars,
    hint: 'Suma el valor de "monedas" más el valor de "estrellas".',
  },
  {
    setup: { coins: 8, stars: 2, hearts: 3 },
    question: 'Si tienes más de 5 monedas, ganas 2 estrellas. ¿Cuántas estrellas tienes ahora?',
    solve: v => v.coins > 5 ? v.stars + 2 : v.stars,
    hint: 'Comprueba si monedas es mayor que 5. Si sí, suma 2 a estrellas.',
  },
  {
    setup: { coins: 10, stars: 4, hearts: 1 },
    question: 'Pierdes 3 monedas y ganas 1 vida. ¿Cuántas monedas quedan?',
    solve: v => v.coins - 3,
    hint: 'Resta 3 al valor de "monedas".',
  },
  {
    setup: { coins: 6, stars: 2, hearts: 3 },
    question: '¿Cuánto es estrellas × vidas?',
    solve: v => v.stars * v.hearts,
    hint: 'Multiplica el valor de "estrellas" por el valor de "vidas".',
  },
  {
    setup: { coins: 9, stars: 1, hearts: 2 },
    question: 'Si vidas es igual a 2, monedas vale el doble. ¿Cuánto vale monedas ahora?',
    solve: v => v.hearts === 2 ? v.coins * 2 : v.coins,
    hint: 'Verifica si vidas es 2. Si sí, multiplica monedas por 2.',
  },
];

let challengeIdx = 0;
let answer = 0;
let vars = {};
let earned = getStars(GAME_ID);

function build() {
  const ch = CHALLENGES[challengeIdx % CHALLENGES.length];
  vars = { ...ch.setup };
  answer = 0;

  const app = document.getElementById('app');
  const levelNum = Math.floor(challengeIdx / CHALLENGES.length) + 1;
  app.innerHTML = `
    <div class="vars-stage">
      <div class="vars-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🫙 Magic Variables</h2>
        <div class="level-info">Desafío ${challengeIdx + 1} de ${CHALLENGES.length}</div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Los frascos guardan números. Lee el desafío y calcula la respuesta.</span>
        </div>
      </div>

      <div class="jars-row" id="jars-row">
        ${JARS.map(j => buildJar(j, vars[j.id])).join('')}
      </div>

      <div class="challenge-card">
        <div class="challenge-question" id="question-text">${ch.question}</div>
        <div class="answer-row">
          <button class="jar-btn minus" id="ans-minus">−</button>
          <div class="answer-display" id="answer-display">0</div>
          <button class="jar-btn plus" id="ans-plus">+</button>
        </div>
        <button class="btn btn-success" id="btn-check" style="font-size:1.2rem;">
          ✅ ¡Verificar!
        </button>
        <div style="margin-top:12px;">
          <button class="speak-btn" id="hint-btn" title="Pista">💡 Pista</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(ch.question));
  document.getElementById('hint-btn').addEventListener('click', () => {
    showToast(ch.hint, 3000);
    speak(ch.hint);
  });
  document.getElementById('ans-plus').addEventListener('click', () => changeAnswer(1));
  document.getElementById('ans-minus').addEventListener('click', () => changeAnswer(-1));
  document.getElementById('btn-check').addEventListener('click', () => checkAnswer(ch));
}

function buildJar(j, val) {
  return `
    <div class="jar-wrap">
      <div class="jar" style="background: ${j.color}; color: ${j.text};">
        <span class="jar-emoji">${j.emoji}</span>
        <span class="jar-value" id="jar-val-${j.id}">${val}</span>
      </div>
      <span class="jar-name">${j.label}</span>
    </div>
  `;
}

function changeAnswer(delta) {
  answer = Math.max(0, answer + delta);
  playTone(300 + answer * 15, 'sine', 0.06, 0.2);
  const el = document.getElementById('answer-display');
  if (el) {
    el.textContent = answer;
    el.classList.add('anim-pop');
    setTimeout(() => el.classList.remove('anim-pop'), 300);
  }
  spawnParticle(delta > 0 ? '✨' : '💨');
}

function spawnParticle(emoji) {
  const el = document.createElement('div');
  el.className = 'particle';
  el.textContent = emoji;
  el.style.left = (window.innerWidth / 2 + (Math.random() - 0.5) * 100) + 'px';
  el.style.top  = (window.innerHeight / 2) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function checkAnswer(ch) {
  const correct = ch.solve(vars);
  if (answer === correct) {
    playSuccess();
    showConfetti();
    challengeIdx++;
    const stars = challengeIdx >= 4 ? 3 : challengeIdx >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    showToast('¡Correcto! 🌟', 1800);
    speak('¡Correcto! ¡Eres increíble!');

    document.getElementById('btn-check').disabled = true;
    setTimeout(() => {
      if (challengeIdx < CHALLENGES.length) {
        build();
      } else {
        showToast('🏆 ¡Completaste todos los desafíos! ¡Eres un genio!', 3000);
        speak('¡Felicidades! Completaste todos los desafíos de variables.');
      }
    }, 2000);
  } else {
    playError();
    showToast(`Casi... La respuesta es ${correct}. ¡Inténtalo de nuevo!`, 2500);
    speak(`No es correcto. Piénsalo otra vez. La respuesta es ${correct}.`);
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

build();
