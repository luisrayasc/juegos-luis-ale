import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'robot-chef';

const RECIPES = [
  {
    name: 'Sándwich 🥪',
    steps: ['🍞 Pan', '🧀 Queso', '🥬 Lechuga', '🍅 Tomate', '🍞 Pan'],
    hint: 'Primero el pan de abajo, luego el relleno, y el pan de arriba al final.'
  },
  {
    name: 'Hotcakes 🥞',
    steps: ['🥚 Huevo', '🥛 Leche', '🌾 Harina', '🍳 Cocinar', '🍯 Miel'],
    hint: 'Mezcla los ingredientes primero, cocina y pon la miel al final.'
  },
  {
    name: 'Ensalada 🥗',
    steps: ['🥬 Lechuga', '🍅 Tomate', '🥕 Zanahoria', '🧅 Cebolla', '🫒 Aceite'],
    hint: 'Primero los vegetales y el aceite al final.'
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let sequence = [];
let dragItem = null;
let selected = null;

function build() {
  const recipe = RECIPES[level % RECIPES.length];
  const shuffled = shuffle([...recipe.steps]);
  sequence = [];
  selected = null;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="chef-stage">
      <div class="chef-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🤖 Robot Chef</h2>
        <div class="level-info">
          <span>Nivel ${level + 1}</span>
          <span>Receta: <strong>${recipe.name}</strong></span>
        </div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Toca un ingrediente y luego el paso donde va, en el orden correcto. En computadora también puedes arrastrarlo.</span>
        </div>
      </div>

      <div class="arena">
        <div class="panel">
          <h3>🛒 Ingredientes</h3>
          <div class="ingredient-pool" id="pool">
            ${shuffled.map((s, i) => `
              <div class="ingredient" draggable="true" data-step="${s}" id="ing-${i}">
                ${s}
              </div>`).join('')}
          </div>
        </div>

        <div class="robot-area">
          <div class="robot-emoji" id="robot">🤖</div>
          <div class="result-box" id="result-box">?</div>
          <button class="btn btn-primary" id="btn-cook">🍳 ¡Cocinar!</button>
          <button class="btn btn-back" id="btn-reset" style="margin-top:8px;">🔄 Reiniciar</button>
        </div>

        <div class="panel">
          <h3>📋 Mi Receta (${recipe.steps.length} pasos)</h3>
          <div class="recipe-slots" id="slots">
            ${recipe.steps.map((_, i) => `
              <div class="slot" id="slot-${i}" data-index="${i}">
                <span>Paso ${i + 1}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="action-row" id="action-row" style="display:none;">
        <button class="btn btn-success" id="btn-next">Siguiente receta →</button>
      </div>
    </div>
  `;

  setupDragDrop(recipe);

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(document.getElementById('instruction-text').textContent));
  document.getElementById('btn-cook').addEventListener('click', () => cook(recipe));
  document.getElementById('btn-reset').addEventListener('click', build);
  document.getElementById('btn-next')?.addEventListener('click', () => { level++; build(); });
}

function clearSelection() {
  if (selected) selected.classList.remove('selected');
  selected = null;
}

function placeInSlot(sourceEl, slot) {
  if (!sourceEl || slot.querySelector('.ingredient')) return;
  const idx = parseInt(slot.dataset.index);
  playClick();

  const clone = sourceEl.cloneNode(true);
  clone.classList.remove('dragging', 'selected');
  clone.removeAttribute('id');
  clone.draggable = false;
  clone.style.cursor = 'pointer';
  slot.innerHTML = '';
  slot.appendChild(clone);

  sourceEl.classList.add('used');
  slot._source = sourceEl;
  sequence[idx] = sourceEl.dataset.step;
}

function removeFromSlot(slot) {
  if (!slot.querySelector('.ingredient')) return;
  const idx = parseInt(slot.dataset.index);
  playClick();
  if (slot._source) { slot._source.classList.remove('used'); slot._source = null; }
  slot.innerHTML = `<span>Paso ${idx + 1}</span>`;
  sequence[idx] = undefined;
}

function setupDragDrop(recipe) {
  document.querySelectorAll('.ingredient').forEach(el => {
    // Arrastre (escritorio)
    el.addEventListener('dragstart', () => {
      dragItem = el;
      clearSelection();
      setTimeout(() => el.classList.add('dragging'), 0);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      dragItem = null;
    });
    // Toque / clic (móvil y escritorio): seleccionar el ingrediente
    el.addEventListener('click', () => {
      if (el.classList.contains('used')) return;
      if (selected === el) { clearSelection(); return; }
      clearSelection();
      selected = el;
      el.classList.add('selected');
      playClick();
    });
  });

  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      placeInSlot(dragItem, slot);
      dragItem = null;
    });
    // Toque / clic: colocar el seleccionado, o devolver el que ya está
    slot.addEventListener('click', () => {
      if (slot.querySelector('.ingredient')) {
        removeFromSlot(slot);
        clearSelection();
      } else if (selected) {
        placeInSlot(selected, slot);
        clearSelection();
      }
    });
  });
}

function cook(recipe) {
  const filled = sequence.filter(Boolean);
  if (filled.length < recipe.steps.length) {
    showToast('¡Faltan pasos! Pon todos los ingredientes.', 1500);
    speak('Faltan ingredientes en la receta.');
    return;
  }

  const robot = document.getElementById('robot');
  robot.classList.add('cooking');
  document.getElementById('btn-cook').disabled = true;

  let i = 0;
  const interval = setInterval(() => {
    document.getElementById('result-box').textContent = sequence[i] || '?';
    i++;
    if (i >= recipe.steps.length) {
      clearInterval(interval);
      robot.classList.remove('cooking');
      setTimeout(() => checkResult(recipe), 300);
    }
  }, 500);
}

function checkResult(recipe) {
  const robot = document.getElementById('robot');
  const ok = recipe.steps.every((step, i) => sequence[i] === step);

  if (ok) {
    robot.classList.add('happy');
    robot.textContent = '🥳';
    document.getElementById('result-box').textContent = recipe.name.split(' ').pop();
    playSuccess();
    showConfetti();
    level++;
    const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    showToast('¡Receta perfecta! 🌟', 2000);
    speak('¡Excelente! ¡Receta perfecta!');
    const ar = document.getElementById('action-row');
    if (ar) ar.style.display = 'flex';
  } else {
    robot.classList.add('sad');
    robot.textContent = '😵';
    document.getElementById('result-box').textContent = '💥';
    playError();
    showToast('¡Ups! El orden está mal. Inténtalo de nuevo.', 2000);
    speak('El orden de los pasos está incorrecto. Inténtalo de nuevo.');
    setTimeout(() => {
      robot.classList.remove('sad');
      robot.textContent = '🤖';
      document.getElementById('btn-cook').disabled = false;
    }, 1500);
  }
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

build();
