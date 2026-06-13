import { showConfetti, playSuccess, playError, playTone, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'operadores-locos';

const LEVELS = [
  {
    label: 'Nivel 1 — Operador AND',
    gate: 'AND',
    gateLabel: 'Y (AND)',
    leverNames: ['A', 'B'],
    goalOn: true,
    goal: 'Enciende la bombilla con AND',
    explain: 'AND significa "Y": la bombilla se enciende SOLO si AMBAS palancas están ON.',
    truthTable: [
      { a: false, b: false, out: false },
      { a: true,  b: false, out: false },
      { a: false, b: true,  out: false },
      { a: true,  b: true,  out: true  },
    ],
  },
  {
    label: 'Nivel 2 — Operador OR',
    gate: 'OR',
    gateLabel: 'O (OR)',
    leverNames: ['A', 'B'],
    goalOn: true,
    goal: 'Enciende la bombilla con OR usando UNA sola palanca',
    explain: 'OR significa "O": la bombilla se enciende si AL MENOS UNA palanca está ON.',
    truthTable: [
      { a: false, b: false, out: false },
      { a: true,  b: false, out: true  },
      { a: false, b: true,  out: true  },
      { a: true,  b: true,  out: true  },
    ],
    winCondition: (inputs) => inputs[0] !== inputs[1],
  },
  {
    label: 'Nivel 3 — Operador NOT',
    gate: 'NOT',
    gateLabel: 'NO (NOT)',
    leverNames: ['A'],
    goalOn: true,
    goal: 'Enciende la bombilla con NOT dejando la palanca en OFF',
    explain: 'NOT significa "NO": invierte el valor. Si A es OFF (falso), NOT A es ON (verdadero).',
    truthTable: [
      { a: false, out: true  },
      { a: true,  out: false },
    ],
    winCondition: (inputs) => inputs[0] === false,
  },
];

let level = 0;
let earned = getStars(GAME_ID);
let inputs = [];
let solved = false;

function evaluate(gate, inputs) {
  if (gate === 'AND') return inputs[0] && inputs[1];
  if (gate === 'OR')  return inputs[0] || inputs[1];
  if (gate === 'NOT') return !inputs[0];
  return false;
}

function build() {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  inputs = cfg.leverNames.map(() => false);
  solved = false;
  render(cfg);
}

function render(cfg) {
  const result = evaluate(cfg.gate, inputs);

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="ops-stage">
      <div class="ops-header">
        <div class="back-row">
          <a href="../../programacion.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}</span>
        </div>
        <h2>⚡ Operadores Locos</h2>
        <div class="level-info">${cfg.label}</div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instruction-text">${cfg.explain}</span>
        </div>
      </div>

      <div class="challenge-panel">
        <div class="goal-text">🎯 Objetivo: ${cfg.goal}</div>
        <div class="explain-text">${cfg.explain}</div>
      </div>

      <div class="circuit">
        <div class="levers-col" id="levers-col">
          ${cfg.leverNames.map((name, i) => `
            <div class="lever-wrap">
              <div class="lever ${inputs[i] ? 'on' : 'off'}" id="lever-${i}">
                <div class="lever-knob"></div>
              </div>
              <div class="lever-label">Palanca ${name}</div>
              <div class="lever-state">${inputs[i] ? '✅ ON (verdadero)' : '❌ OFF (falso)'}</div>
            </div>`).join('')}
        </div>

        <div class="wire">⚡</div>

        <div class="gate-box">
          <div class="gate-name">${cfg.gateLabel}</div>
          <div class="gate-label">Operador</div>
        </div>

        <div class="wire">⚡</div>

        <div>
          <div class="bulb ${result ? 'on' : ''}" id="bulb">💡</div>
          <div class="bulb-label" id="bulb-label">${result ? '✅ Encendida (true)' : '❌ Apagada (false)'}</div>
        </div>
      </div>

      <div class="truth-table">
        <h3>📊 Tabla de verdad — ${cfg.gateLabel}</h3>
        ${buildTruthTable(cfg)}
      </div>
    </div>
  `;

  document.getElementById('speak-btn').addEventListener('click', () => speak(cfg.explain));

  cfg.leverNames.forEach((_, i) => {
    document.getElementById(`lever-${i}`)?.addEventListener('click', () => toggle(i, cfg));
  });
}

function toggle(idx, cfg) {
  if (solved) return;
  inputs[idx] = !inputs[idx];
  playTone(inputs[idx] ? 660 : 330, 'sine', 0.12, 0.3);
  render(cfg);

  const result = evaluate(cfg.gate, inputs);
  const winCheck = cfg.winCondition ? cfg.winCondition(inputs) : result === cfg.goalOn;

  if (winCheck) {
    setTimeout(() => win(cfg), 300);
  }
}

async function win(cfg) {
  solved = true;
  const bulb = document.getElementById('bulb');
  if (bulb) bulb.classList.add('on');
  playSuccess();
  showConfetti();
  level++;
  const stars = level >= 3 ? 3 : level >= 2 ? 2 : 1;
  if (stars > earned) { earned = stars; saveStars(GAME_ID, stars); }
  updateStarDisplay();
  const msg = `¡Correcto! Entiendes ${cfg.gateLabel} 🎉`;
  showToast(msg, 2500);
  speak(msg);
  await delay(2600);
  if (level < LEVELS.length) build();
  else showToast('🏆 ¡Completaste Operadores Locos!', 3000);
}

function buildTruthTable(cfg) {
  const result = evaluate(cfg.gate, inputs);

  if (cfg.gate === 'NOT') {
    const rows = cfg.truthTable.map(r => {
      const active = r.a === inputs[0];
      return `<tr ${active ? 'class="highlight"' : ''}>
        <td>${r.a ? '✅ ON' : '❌ OFF'}</td>
        <td style="color:${r.out ? 'var(--green)':'var(--red)'}">${r.out ? '✅ ON' : '❌ OFF'}</td>
      </tr>`;
    }).join('');
    return `<table>
      <thead><tr><th>A</th><th>NOT A (resultado)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  const rows = cfg.truthTable.map(r => {
    const active = r.a === inputs[0] && r.b === inputs[1];
    return `<tr ${active ? 'class="highlight"' : ''}>
      <td>${r.a ? '✅ ON' : '❌ OFF'}</td>
      <td>${r.b ? '✅ ON' : '❌ OFF'}</td>
      <td style="color:${r.out ? 'var(--green)':'var(--red)'}">${r.out ? '✅ ON' : '❌ OFF'}</td>
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr><th>A</th><th>B</th><th>${cfg.gateLabel} (resultado)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function updateStarDisplay() {
  const el = document.getElementById('star-display');
  if (el) el.textContent = '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

build();
