import { showConfetti, playSuccess, playError, playClick, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'lista-magica';

const ITEMS = ['🍎','🗡️','🧲','🪙','🐉','🧸','🍕','🎸','🌟','🐱'];

const CHALLENGES = [
  {
    label: 'Nivel 1 — Agregar y leer',
    startBag: ['🍎', '🗡️', '🧲'],
    tasks: [
      { type: 'read', question: '¿Qué hay en la posición 1?', answer: '🗡️', choices: ['🍎','🗡️','🧲','🪙'] },
      { type: 'push', question: 'Agrega 🪙 al final de la lista', item: '🪙' },
      { type: 'count', question: '¿Cuántos elementos hay ahora?', answer: 4, choices: [3,4,5,6] },
    ],
  },
  {
    label: 'Nivel 2 — Quitar elementos',
    startBag: ['🐉','🧸','🍕','🎸'],
    tasks: [
      { type: 'read', question: '¿Qué hay en la posición 0?', answer: '🐉', choices: ['🐉','🧸','🍕','🎸'] },
      { type: 'shift', question: 'Quita el PRIMER elemento de la lista' },
      { type: 'read', question: 'Ahora, ¿qué hay en la posición 0?', answer: '🧸', choices: ['🐉','🧸','🍕','🎸'] },
    ],
  },
  {
    label: 'Nivel 3 — Buscar un elemento',
    startBag: ['🌟','🪙','🐱','🗡️','🍎'],
    tasks: [
      { type: 'indexOf', question: '¿En qué posición está 🐱?', answer: 2, choices: [0,1,2,3,4] },
      { type: 'pop', question: 'Quita el ÚLTIMO elemento de la lista' },
      { type: 'count', question: '¿Cuántos elementos quedan?', answer: 4, choices: [3,4,5,6] },
    ],
  },
];

let challengeIdx = 0;
let taskIdx = 0;
let bag = [];
let earned = getStars(GAME_ID);

function build() {
  const ch = CHALLENGES[Math.min(challengeIdx, CHALLENGES.length - 1)];
  bag = [...ch.startBag];
  taskIdx = 0;
  renderFull(ch);
}

function renderFull(ch) {
  const task = ch.tasks[taskIdx];
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="lista-stage">
      <div class="lista-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🎒 Lista Mágica</h2>
        <div class="level-info">${ch.label} — Tarea ${taskIdx + 1} de ${ch.tasks.length}</div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Las listas guardan elementos en orden, empezando desde la posición 0.</span>
        </div>
      </div>

      <div class="bag-container">
        <h3>🎒 Mi Lista</h3>
        <div class="bag-visual" id="bag-visual">
          ${renderBagHTML()}
        </div>
      </div>

      <div class="challenge-card">
        <div class="challenge-text" id="challenge-text">${task.question}</div>
        <div id="interaction-zone"></div>
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(task.question));

  renderInteraction(task, ch);
}

function renderBagHTML() {
  if (bag.length === 0) return `<div class="bag-empty">La lista está vacía []</div>`;
  return bag.map((item, i) => `
    <div class="bag-item">
      <div class="item-emoji">${item}</div>
      <div class="item-index">[${i}]</div>
    </div>`).join('');
}

function refreshBag() {
  const el = document.getElementById('bag-visual');
  if (el) el.innerHTML = renderBagHTML();
}

function renderInteraction(task, ch) {
  const zone = document.getElementById('interaction-zone');
  if (!zone) return;

  if (task.type === 'push') {
    zone.innerHTML = `<p style="color:var(--text2); margin-bottom:12px;">Haz clic en el objeto para agregarlo al final:</p>
      <div class="items-chooser">
        <button class="item-choice" id="btn-push">${task.item}</button>
      </div>`;
    document.getElementById('btn-push').addEventListener('click', () => {
      bag.push(task.item);
      playTone(660, 'sine', 0.15, 0.3);
      refreshBag();
      showToast(`${task.item} agregado al final (posición ${bag.length - 1})`, 1500);
      speak(`${task.item} fue agregado. Ahora hay ${bag.length} elementos.`);
      setTimeout(() => advanceTask(ch), 1600);
    });

  } else if (task.type === 'shift') {
    zone.innerHTML = `<button class="btn btn-danger" id="btn-shift">
      ✂️ Quitar el primero (posición 0)
    </button>`;
    document.getElementById('btn-shift').addEventListener('click', () => {
      const removed = bag.shift();
      playError();
      refreshBag();
      showToast(`${removed} fue quitado de la posición 0`, 1500);
      speak(`${removed} fue eliminado. La lista ahora empieza desde el inicio.`);
      setTimeout(() => advanceTask(ch), 1600);
    });

  } else if (task.type === 'pop') {
    zone.innerHTML = `<button class="btn btn-danger" id="btn-pop">
      ✂️ Quitar el último
    </button>`;
    document.getElementById('btn-pop').addEventListener('click', () => {
      const removed = bag.pop();
      playError();
      refreshBag();
      showToast(`${removed} fue quitado del final`, 1500);
      speak(`${removed} fue eliminado del final de la lista.`);
      setTimeout(() => advanceTask(ch), 1600);
    });

  } else if (task.type === 'read' || task.type === 'count' || task.type === 'indexOf') {
    zone.innerHTML = `<div class="answer-choices">
      ${task.choices.map(c => `
        <button class="answer-btn" data-val="${c}">${c}</button>
      `).join('')}
    </div>`;
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = isNaN(btn.dataset.val) ? btn.dataset.val : parseInt(btn.dataset.val);
        const correct = val == task.answer;
        if (correct) {
          playSuccess();
          showToast('¡Correcto! 🌟', 1500);
          speak('¡Correcto!');
          btn.style.borderColor = 'var(--green)';
          setTimeout(() => advanceTask(ch), 1600);
        } else {
          playError();
          showToast(`No es correcto. La respuesta es ${task.answer}`, 2000);
          speak(`No es correcto. La respuesta es ${task.answer}`);
          btn.style.borderColor = 'var(--red)';
        }
      });
    });
  }
}

async function advanceTask(ch) {
  taskIdx++;
  if (taskIdx >= ch.tasks.length) {
    challengeIdx++;
    const stars = challengeIdx >= 3 ? 3 : challengeIdx >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    showConfetti();
    playSuccess();
    showToast('¡Nivel completado! 🎒✨', 2000);
    speak('¡Nivel completado! ¡Eres un experto en listas!');
    await delay(2200);
    if (challengeIdx < CHALLENGES.length) build();
    else showToast('🏆 ¡Completaste Lista Mágica!', 3000);
  } else {
    renderFull(ch);
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
