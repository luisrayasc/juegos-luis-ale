import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'division-express';

const EMOJIS = ['🍎','⭐','🌸','🔵','🍕','🎈','🐱','🏀'];

const LEVELS = [
  { label:'Nivel 1 — Dividir entre 2 y 3', divisors:[2,3], maxQ:5,  questions:5 },
  { label:'Nivel 2 — Dividir entre 4 y 5', divisors:[4,5], maxQ:10, questions:6 },
  { label:'Nivel 3 — Dividir entre 6-10',  divisors:[6,7,8,9,10], maxQ:10, questions:7 },
];

let level=0,earned=getStars(GAME_ID),score=0,qNum=0,answered=false;

function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=rnd(0,i);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}

function build(){const cfg=LEVELS[Math.min(level,LEVELS.length-1)];score=0;qNum=0;answered=false;nextQ(cfg);}

function makeQ(cfg){
  const divisor=cfg.divisors[rnd(0,cfg.divisors.length-1)];
  const answer=rnd(1,cfg.maxQ);
  const dividend=divisor*answer;
  const emoji=EMOJIS[rnd(0,EMOJIS.length-1)];
  // genera 3 distractores distintos y positivos sin riesgo de bucle infinito
  const wrongs=new Set();
  const offsets=shuffle([-3,-2,-1,1,2,3,4,-4]);
  for(const d of offsets){
    if(wrongs.size>=3)break;
    const c=answer+d;
    if(c>0&&c!==answer)wrongs.add(c);
  }
  // relleno de seguridad por si no hay suficientes positivos (answer muy pequeño)
  for(let fill=1;wrongs.size<3;fill++){
    if(fill!==answer)wrongs.add(fill);
  }
  return{dividend,divisor,answer,emoji,choices:shuffle([answer,...wrongs])};
}

function nextQ(cfg){answered=false;qNum++;const q=makeQ(cfg);render(cfg,q);}

function buildVisual(q){
  // Muestra el total repartido en `divisor` grupos de `answer` cada uno
  // Si hay demasiados elementos, solo muestra el número
  if(q.dividend>40)return`
    <div style="text-align:center;">
      <div style="font-size:3rem;margin-bottom:8px;">${q.emoji}</div>
      <div style="font-size:1.8rem;font-weight:900;color:var(--text2);">
        ${q.dividend} ${q.emoji} entre ${q.divisor} grupos
      </div>
    </div>`;
  let html='';
  for(let g=0;g<q.divisor;g++){
    if(g>0)html+=`<div class="group-sep"></div>`;
    html+=`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">`;
    for(let i=0;i<q.answer;i++)html+=`<span class="dot">${q.emoji}</span>`;
    html+=`</div>`;
  }
  return html;
}

function render(cfg,q){
  const pct=Math.round(((qNum-1)/cfg.questions)*100);
  document.getElementById('app').innerHTML=`
    <div class="div-stage">
      <div class="div-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3-earned)}</span>
        </div>
        <h2>➗ División Express</h2>
        <div class="level-info"><span>${cfg.label}</span><span style="color:var(--text2);font-size:.9rem;">${qNum}/${cfg.questions}</span></div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>¿Cuánto es ${q.dividend} ÷ ${q.divisor}?</span>
        </div>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qNum} de ${cfg.questions}</div>
      <div class="div-card">
        <div class="visual-row">${buildVisual(q)}</div>
        <div class="equation-text">${q.dividend} ÷ ${q.divisor} = <span class="question-mark">?</span></div>
      </div>
      <div class="choices-grid">
        ${q.choices.map(c=>`<button class="choice-btn" data-val="${c}">${c}</button>`).join('')}
      </div>
    </div>`;

  document.getElementById('speak-btn').addEventListener('click',()=>speak(`¿Cuánto es ${q.dividend} entre ${q.divisor}?`));
  document.querySelectorAll('.choice-btn').forEach(btn=>
    btn.addEventListener('click',()=>onPick(parseInt(btn.dataset.val),btn,q.answer,cfg)));
}

async function onPick(val,btn,correct,cfg){
  if(answered)return;answered=true;playClick();
  if(val===correct){btn.classList.add('correct');score++;playSuccess();speak('¡Correcto!');}
  else{
    btn.classList.add('wrong');playError();
    document.querySelectorAll('.choice-btn').forEach(b=>{if(parseInt(b.dataset.val)===correct)b.classList.add('correct');});
    speak(`La respuesta es ${correct}`);
  }
  await delay(1400);
  if(qNum>=cfg.questions)await finish(cfg);else nextQ(cfg);
}

async function finish(cfg){
  const pct=score/cfg.questions;level++;
  const stars=pct>=.85?3:pct>=.6?2:1;
  if(stars>earned){earned=stars;saveStars(GAME_ID,stars);}
  updateStars();playSuccess();showConfetti();
  showToast(score===cfg.questions?'🏆 ¡Perfecto!':`🌟 ${score}/${cfg.questions}`,2500);
  await delay(2600);
  if(level<LEVELS.length)build();else showToast('🏆 ¡Eres un campeón de la división!',3000);
}
function updateStars(){const el=document.getElementById('star-display');if(el)el.textContent='★'.repeat(earned)+'☆'.repeat(3-earned);}
build();
