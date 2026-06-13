import { showConfetti, playTone, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'spell-factory';

const STEP_OPTIONS = [
  { id: 'fly',    emoji: '🕊️', label: 'Volar' },
  { id: 'spin',   emoji: '🌀', label: 'Girar' },
  { id: 'glow',   emoji: '✨', label: 'Brillar' },
  { id: 'jump',   emoji: '⬆️', label: 'Saltar' },
  { id: 'vanish', emoji: '💨', label: 'Desaparecer' },
  { id: 'heal',   emoji: '💚', label: 'Curar' },
];

const LEVELS = [
  {
    label: 'Nivel 1 — Un hechizo sencillo',
    spellName: '🔮 Escapar',
    requiredSteps: ['fly'],
    callsNeeded: 1,
    character: '🧙',
    puzzle: 'El mago está encerrado. Crea el hechizo "Escapar" con el paso VOLAR y llámalo 1 vez.',
    successMsg: '¡El mago escapó volando! 🎉',
  },
  {
    label: 'Nivel 2 — Hechizo de 3 pasos',
    spellName: '⭐ Brillar',
    requiredSteps: ['glow', 'spin', 'glow'],
    callsNeeded: 2,
    character: '🧚',
    puzzle: 'El hada necesita brillar: BRILLAR → GIRAR → BRILLAR. Crea el hechizo y llámalo 2 veces.',
    successMsg: '¡El hada brilló dos veces! 🌟',
  },
  {
    label: 'Nivel 3 — Dos hechizos',
    spellName: null,
    spells: [
      { name: '🐉 Curar', steps: ['heal'], callsNeeded: 1 },
      { name: '🌀 Escapar', steps: ['vanish', 'fly'], callsNeeded: 1 },
    ],
    character: '🐉',
    puzzle: 'El dragón está herido y atrapado. Crea DOS hechizos: "Curar" (CURAR) y "Escapar" (DESAPARECER + VOLAR). Llámalos en ese orden.',
    successMsg: '¡El dragón fue curado y escapó! 🏆',
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let userSteps = [];
let callsMade = 0;
let animating = false;

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  userSteps = [];
  callsMade = 0;
  animating = false;

  const app = document.getElementById('app');

  if (cfg.spells) {
    buildLevel3(cfg);
    return;
  }

  app.innerHTML = `
    <div class="spell-stage">
      <div class="spell-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🔮 Spell Factory</h2>
        <div class="level-info">${cfg.label}</div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">${cfg.puzzle}</span>
        </div>
      </div>

      <div class="spell-arena">
        <div class="panel">
          <h3>🪄 Pasos disponibles</h3>
          <div class="steps-pool" id="steps-pool">
            ${STEP_OPTIONS.map(s => `
              <div class="step-tile" data-id="${s.id}">
                <span>${s.emoji}</span><span>${s.label}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="panel">
          <h3>📜 Hechizo: <span style="color:var(--purple)">${cfg.spellName}</span></h3>
          <div class="spell-recipe" id="spell-recipe">
            <div style="color:var(--text2); text-align:center; padding:12px;">
              Haz clic en los pasos para agregarlos
            </div>
          </div>
          <div style="margin-top:12px; text-align:center;">
            <button class="btn btn-back" id="btn-clear" style="font-size:0.9rem; padding:8px 20px;">
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      <div class="challenge-box">
        <div class="character-display" id="char-display">${cfg.character}</div>
        <div class="cast-log" id="cast-log">Crea el hechizo y presiónalo para lanzarlo</div>
        <div class="cast-zone">
          <button class="cast-btn" id="btn-cast">
            ✨ Lanzar ${cfg.spellName}
          </button>
          <span class="calls-counter" id="calls-counter">
            Llamadas: 0 / ${cfg.callsNeeded}
          </span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(cfg.puzzle));
  document.getElementById('btn-clear').addEventListener('click', () => {
    userSteps = [];
    renderRecipe();
  });
  document.getElementById('btn-cast').addEventListener('click', () => castSpell(cfg));

  document.querySelectorAll('.step-tile').forEach(el => {
    el.addEventListener('click', () => addStep(el.dataset.id));
  });
}

function addStep(id) {
  playClick();
  userSteps.push(id);
  renderRecipe();
}

function renderRecipe() {
  const container = document.getElementById('spell-recipe');
  if (!container) return;
  if (userSteps.length === 0) {
    container.innerHTML = `<div style="color:var(--text2); text-align:center; padding:12px;">Haz clic en los pasos para agregarlos</div>`;
    return;
  }
  container.innerHTML = userSteps.map((id, i) => {
    const s = STEP_OPTIONS.find(x => x.id === id);
    return `<div class="recipe-step">
      <span>${s.emoji} ${s.label}</span>
      <button class="remove-btn" data-idx="${i}">×</button>
    </div>`;
  }).join('');
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      userSteps.splice(parseInt(btn.dataset.idx), 1);
      renderRecipe();
    });
  });
}

async function castSpell(cfg) {
  if (animating) return;
  if (userSteps.length === 0) {
    showToast('¡El hechizo está vacío! Agrega pasos primero.', 1500);
    speak('El hechizo está vacío. Agrega pasos primero.');
    return;
  }

  const correctSteps = cfg.requiredSteps;
  const correct = userSteps.length === correctSteps.length &&
    correctSteps.every((s, i) => userSteps[i] === s);

  if (!correct) {
    playError();
    showToast('Los pasos no son correctos. ¡Inténtalo de nuevo!', 2000);
    speak('Los pasos del hechizo no son correctos. Revísalos.');
    return;
  }

  animating = true;
  document.getElementById('btn-cast').disabled = true;
  const charEl = document.getElementById('char-display');
  const logEl = document.getElementById('cast-log');

  for (const stepId of userSteps) {
    const s = STEP_OPTIONS.find(x => x.id === stepId);
    logEl.textContent = `Ejecutando: ${s.emoji} ${s.label}...`;
    playTone(400 + Math.random() * 300, 'sine', 0.2, 0.3);
    charEl.classList.add('anim-bounce');
    await delay(500);
    charEl.classList.remove('anim-bounce');
  }

  callsMade++;
  document.getElementById('calls-counter').textContent = `Llamadas: ${callsMade} / ${cfg.callsNeeded}`;

  if (callsMade >= cfg.callsNeeded) {
    charEl.textContent = '🥳';
    playSuccess();
    showConfetti();
    level++;
    const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    logEl.textContent = cfg.successMsg;
    showToast(cfg.successMsg, 2500);
    speak(cfg.successMsg);
    await delay(2500);
    animating = false;
    if (level < LEVELS.length) build();
    else showToast('🏆 ¡Completaste Spell Factory!', 3000);
  } else {
    logEl.textContent = `¡Bien! ${callsMade} de ${cfg.callsNeeded} llamadas. ¡Otra vez!`;
    playTone(660, 'sine', 0.15, 0.3);
    await delay(500);
    animating = false;
    document.getElementById('btn-cast').disabled = false;
  }
}

function buildLevel3(cfg) {
  const app = document.getElementById('app');
  const spellDefs = cfg.spells;
  let spellProgress = spellDefs.map(() => ({ steps: [], calls: 0 }));
  let activeSpellIdx = 0;

  const renderAll = () => {
    app.innerHTML = `
      <div class="spell-stage">
        <div class="spell-header">
          <div class="back-row">
            <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
            <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
          </div>
          <h2>🔮 Spell Factory</h2>
          <div class="level-info">${cfg.label}</div>
          <div class="instruction-box">
            <button class="speak-btn" id="speak-btn">🔊</button>
            <span id="instruction-text">${cfg.puzzle}</span>
          </div>
        </div>

        <div class="spell-arena">
          <div class="panel">
            <h3>🪄 Pasos disponibles</h3>
            <div class="steps-pool" id="steps-pool">
              ${STEP_OPTIONS.map(s => `
                <div class="step-tile" data-id="${s.id}">
                  <span>${s.emoji}</span><span>${s.label}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="panel">
            <h3>📜 Hechizo activo</h3>
            <div class="spell-name-row">
              ${spellDefs.map((sp, i) => `
                <button class="btn ${i === activeSpellIdx ? 'btn-purple' : 'btn-back'}"
                  id="spell-tab-${i}" style="font-size:1rem; padding:10px 20px;">
                  ${sp.name}
                </button>`).join('')}
            </div>
            <div class="spell-recipe" id="spell-recipe">
              ${spellProgress[activeSpellIdx].steps.length === 0
                ? `<div style="color:var(--text2); text-align:center; padding:12px;">Haz clic en los pasos</div>`
                : spellProgress[activeSpellIdx].steps.map((id, i) => {
                    const s = STEP_OPTIONS.find(x => x.id === id);
                    return `<div class="recipe-step"><span>${s.emoji} ${s.label}</span><button class="remove-btn" data-idx="${i}">×</button></div>`;
                  }).join('')}
            </div>
            <div style="margin-top:10px; text-align:center;">
              <button class="btn btn-back" id="btn-clear" style="font-size:0.9rem; padding:8px 20px;">🗑️ Limpiar</button>
            </div>
          </div>
        </div>

        <div class="challenge-box">
          <div class="character-display" id="char-display">${cfg.character}</div>
          <div class="cast-log" id="cast-log">Crea los dos hechizos y llámalos en orden</div>
          <div class="cast-zone">
            ${spellDefs.map((sp, i) => `
              <button class="cast-btn" id="cast-btn-${i}">✨ ${sp.name}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('speak-btn').addEventListener('click', () => speak(cfg.puzzle));
    document.getElementById('btn-clear').addEventListener('click', () => {
      spellProgress[activeSpellIdx].steps = [];
      renderAll();
    });

    spellDefs.forEach((_, i) => {
      document.getElementById(`spell-tab-${i}`)?.addEventListener('click', () => {
        activeSpellIdx = i;
        renderAll();
      });
      document.getElementById(`cast-btn-${i}`)?.addEventListener('click', () => castSpell3(i));
    });

    document.querySelectorAll('.step-tile').forEach(el => {
      el.addEventListener('click', () => {
        playClick();
        spellProgress[activeSpellIdx].steps.push(el.dataset.id);
        renderAll();
      });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        spellProgress[activeSpellIdx].steps.splice(parseInt(btn.dataset.idx), 1);
        renderAll();
      });
    });
  };

  async function castSpell3(idx) {
    if (animating) return;
    const sp = spellDefs[idx];
    const prog = spellProgress[idx];
    const correct = prog.steps.length === sp.steps.length &&
      sp.steps.every((s, i) => prog.steps[i] === s);

    if (!correct) {
      playError();
      showToast(`Los pasos de "${sp.name}" no son correctos.`, 2000);
      return;
    }

    animating = true;
    const logEl = document.getElementById('cast-log');
    const charEl = document.getElementById('char-display');

    for (const stepId of prog.steps) {
      const s = STEP_OPTIONS.find(x => x.id === stepId);
      if (logEl) logEl.textContent = `${sp.name}: ${s.emoji} ${s.label}`;
      playTone(400 + Math.random() * 300, 'sine', 0.2, 0.3);
      if (charEl) { charEl.classList.add('anim-bounce'); await delay(500); charEl.classList.remove('anim-bounce'); }
    }
    prog.calls++;

    const allDone = spellDefs.every((sp2, i) => spellProgress[i].calls >= sp2.callsNeeded);
    if (allDone) {
      if (charEl) charEl.textContent = '🥳';
      playSuccess();
      showConfetti();
      level++;
      const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
      if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
      updateStarDisplay();
      showToast(cfg.successMsg, 2500);
      speak(cfg.successMsg);
      await delay(2500);
      animating = false;
      if (level < LEVELS.length) build();
      else showToast('🏆 ¡Completaste Spell Factory!', 3000);
    } else {
      if (logEl) logEl.textContent = `"${sp.name}" lanzado. ¡Ahora lanza el siguiente!`;
      playTone(660, 'sine', 0.15, 0.3);
      await delay(400);
      animating = false;
    }
  }

  renderAll();
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
