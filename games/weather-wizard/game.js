import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'weather-wizard';

const CONDITIONS = [
  { id: 'rain',   emoji: '🌧️', label: 'SI llueve' },
  { id: 'sun',    emoji: '☀️', label: 'SI hay sol' },
  { id: 'wind',   emoji: '💨', label: 'SI hay viento' },
  { id: 'snow',   emoji: '❄️', label: 'SI nieva' },
  { id: 'storm',  emoji: '⛈️', label: 'SI hay tormenta' },
];

const ACTIONS = [
  { id: 'umbrella', emoji: '☂️',  label: 'abrir paraguas',  condId: 'rain' },
  { id: 'sunglasses',emoji:'🕶️', label: 'usar lentes',      condId: 'sun' },
  { id: 'kite',     emoji: '🪁',  label: 'volar cometa',    condId: 'wind' },
  { id: 'scarf',    emoji: '🧣',  label: 'usar bufanda',    condId: 'snow' },
  { id: 'inside',   emoji: '🏠',  label: 'quedarse adentro',condId: 'storm' },
];

const LEVELS = [
  { condCount: 2, label: 'Nivel 1 — 2 reglas' },
  { condCount: 3, label: 'Nivel 2 — 3 reglas' },
  { condCount: 5, label: 'Nivel 3 — 5 reglas' },
];

let level = 0;
let earned = getStars(GAME_ID);
let selectedCond = null;
let rules = {};
let levelConds = [];

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  levelConds = CONDITIONS.slice(0, cfg.condCount);
  rules = {};
  selectedCond = null;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="wizard-stage">
      <div class="wizard-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>🧙 Weather Wizard</h2>
        <div class="level-info">${cfg.label}</div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">Conecta cada clima con la acción correcta. Haz clic en un clima y luego en la acción.</span>
        </div>
      </div>

      <div class="rule-display" id="rule-display">
        <span class="rule-text">Selecciona un clima para empezar</span>
      </div>

      <div class="rule-builder">
        <div class="rule-panel">
          <h3>🌍 Clima (SI...)</h3>
          <div class="rule-tiles" id="cond-tiles">
            ${levelConds.map(c => `
              <div class="rule-tile" id="cond-${c.id}" data-id="${c.id}">
                <span>${c.emoji}</span><span>${c.label}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="arrow-col">➡️</div>

        <div class="rule-panel">
          <h3>🎒 Acción (ENTONCES...)</h3>
          <div class="rule-tiles" id="action-tiles">
            ${ACTIONS.filter(a => levelConds.some(c => c.id === a.condId)).map(a => `
              <div class="rule-tile" id="act-${a.id}" data-id="${a.id}">
                <span>${a.emoji}</span><span>${a.label}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="action-row">
        <button class="btn btn-success" id="btn-test">🌦️ ¡Probar reglas!</button>
        <button class="btn btn-back" id="btn-reset">🔄 Reiniciar</button>
      </div>

      <div id="scene-area" style="margin-top:24px; display:none;">
        <div class="wizard-scene">
          <div class="weather-display" id="weather-display">
            <span class="weather-emoji" id="weather-emoji"></span>
            <span class="weather-label" id="weather-label"></span>
          </div>
          <div style="font-size:3rem;">→</div>
          <div class="wizard-figure">
            🧙
            <div class="wizard-item" id="wizard-item"></div>
          </div>
        </div>
        <div class="action-row">
          <button class="btn btn-primary" id="btn-next-weather">Siguiente clima →</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () =>
    speak(document.getElementById('instruction-text').textContent));
  document.getElementById('btn-reset').addEventListener('click', build);
  document.getElementById('btn-test').addEventListener('click', testRules);

  document.querySelectorAll('#cond-tiles .rule-tile').forEach(el => {
    el.addEventListener('click', () => selectCond(el.dataset.id));
  });
  document.querySelectorAll('#action-tiles .rule-tile').forEach(el => {
    el.addEventListener('click', () => selectAction(el.dataset.id));
  });
}

function selectCond(id) {
  playClick();
  selectedCond = id;
  document.querySelectorAll('#cond-tiles .rule-tile').forEach(el => {
    el.classList.toggle('selected', el.dataset.id === id);
  });
  const c = CONDITIONS.find(x => x.id === id);
  updateRuleDisplay(`${c.emoji} ${c.label} → ?`);
}

function selectAction(id) {
  if (!selectedCond) {
    showToast('Primero selecciona un clima ☝️', 1500);
    speak('Primero selecciona un clima.');
    return;
  }
  playClick();
  rules[selectedCond] = id;

  document.querySelector(`#cond-${selectedCond}`)?.classList.add('matched');
  document.querySelector(`#act-${id}`)?.classList.add('matched');

  const c = CONDITIONS.find(x => x.id === selectedCond);
  const a = ACTIONS.find(x => x.id === id);
  updateRuleDisplay(`${c.emoji} ${c.label} → ${a.emoji} ${a.label} ✅`);

  document.querySelectorAll('#cond-tiles .rule-tile').forEach(el => el.classList.remove('selected'));
  selectedCond = null;
}

function updateRuleDisplay(text) {
  const el = document.getElementById('rule-display');
  if (el) el.querySelector('.rule-text').textContent = text;
}

async function testRules() {
  const rulesSet = Object.keys(rules).length;
  if (rulesSet < levelConds.length) {
    showToast(`¡Faltan reglas! Conecta los ${levelConds.length} climas.`, 1800);
    speak(`Todavía faltan ${levelConds.length - rulesSet} reglas por conectar.`);
    return;
  }

  document.getElementById('scene-area').style.display = 'block';
  document.getElementById('btn-test').disabled = true;

  let correct = 0;
  for (const cond of levelConds) {
    await showWeatherEvent(cond);
    const chosenActionId = rules[cond.id];
    const correctAction = ACTIONS.find(a => a.condId === cond.id);
    if (chosenActionId === correctAction.id) correct++;
    await delay(2000);
  }

  if (correct === levelConds.length) {
    playSuccess();
    showConfetti();
    level++;
    const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
    if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
    updateStarDisplay();
    showToast('¡Todas las reglas son correctas! 🧙✨', 2500);
    speak('¡Excelente! Todas tus reglas son correctas. ¡Eres un mago del código!');
    document.getElementById('btn-next-weather').textContent = level < LEVELS.length ? 'Siguiente nivel →' : '¡Felicidades! 🏆';
    document.getElementById('btn-next-weather').addEventListener('click', () => {
      if (level < LEVELS.length) build();
    });
  } else {
    playError();
    showToast(`${correct} de ${levelConds.length} correctas. ¡Inténtalo de nuevo!`, 2500);
    speak(`Acertaste ${correct} de ${levelConds.length}. Revisa las reglas e inténtalo de nuevo.`);
    document.getElementById('btn-next-weather').textContent = '🔄 Intentar de nuevo';
    document.getElementById('btn-next-weather').addEventListener('click', build);
  }
}

async function showWeatherEvent(cond) {
  const action = ACTIONS.find(a => a.condId === cond.id);
  const chosenId = rules[cond.id];
  const chosenAction = ACTIONS.find(a => a.id === chosenId);

  document.getElementById('weather-emoji').textContent = cond.emoji;
  document.getElementById('weather-label').textContent = cond.label.replace('SI ', '');

  const item = document.getElementById('wizard-item');
  item.textContent = chosenAction ? chosenAction.emoji : '❓';
  item.classList.remove('show');
  await delay(400);
  item.classList.add('show');

  if (chosenId === action.id) {
    playSuccess();
  } else {
    playError();
  }
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
