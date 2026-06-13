import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'mide-todo';

const LEVELS = [
  {
    label:'Nivel 1 — cm y m',
    questions:[
      {q:'¿Cuántos centímetros tiene 1 metro?', answer:'100 cm', choices:['10 cm','100 cm','1000 cm','50 cm'], hint:'1 metro = 100 centímetros'},
      {q:'¿Cuántos metros tiene 1 km?', answer:'1,000 m', choices:['100 m','10 m','1,000 m','500 m'], hint:'1 km = 1,000 metros'},
      {q:'Un lápiz mide 15 cm. ¿Cuánto mide en mm?', answer:'150 mm', choices:['15 mm','1,500 mm','150 mm','1.5 mm'], hint:'1 cm = 10 mm'},
      {q:'¿Cuál es MÁS LARGO?', answer:'2 metros', choices:['150 cm','2 metros','180 cm','190 cm'], hint:'2 metros = 200 cm'},
      {q:'Una cancha mide 40 m. ¿Cuántos cm son?', answer:'4,000 cm', choices:['400 cm','40,000 cm','4,000 cm','4 cm'], hint:'1 m = 100 cm'},
    ],
  },
  {
    label:'Nivel 2 — kg y g',
    questions:[
      {q:'¿Cuántos gramos tiene 1 kilogramo?', answer:'1,000 g', choices:['100 g','10 g','1,000 g','500 g'], hint:'1 kg = 1,000 gramos'},
      {q:'Una manzana pesa 200 g. ¿Cuántas manzanas hacen 1 kg?', answer:'5', choices:['2','10','5','4'], hint:'1,000 ÷ 200 = 5'},
      {q:'¿Cuál pesa MÁS?', answer:'2 kg', choices:['1,500 g','2 kg','1,800 g','1,900 g'], hint:'2 kg = 2,000 g'},
      {q:'Tienes 3 kg de arroz. ¿Cuántos gramos son?', answer:'3,000 g', choices:['300 g','30,000 g','3,000 g','3 g'], hint:'1 kg = 1,000 g'},
      {q:'Medio kilogramo equivale a...', answer:'500 g', choices:['50 g','5,000 g','500 g','250 g'], hint:'La mitad de 1,000 es 500'},
    ],
  },
  {
    label:'Nivel 3 — Tiempo y temperatura',
    questions:[
      {q:'¿Cuántos minutos tiene 1 hora?', answer:'60 min', choices:['100 min','60 min','50 min','30 min'], hint:'1 hora = 60 minutos'},
      {q:'¿Cuántos segundos tiene 1 minuto?', answer:'60 seg', choices:['100 seg','10 seg','60 seg','30 seg'], hint:'1 minuto = 60 segundos'},
      {q:'¿Cuántas horas tiene 1 día?', answer:'24 h', choices:['12 h','48 h','24 h','20 h'], hint:'El día tiene 24 horas'},
      {q:'¿Qué temperatura es MÁS CALIENTE?', answer:'35 °C', choices:['20 °C','15 °C','35 °C','28 °C'], hint:'Más grados = más calor'},
      {q:'Una película dura 90 min. ¿Cuántas horas y minutos son?', answer:'1 h 30 min', choices:['2 h','1 h 30 min','1 h 20 min','1 h 45 min'], hint:'60 min = 1 hora, sobran 30 min'},
    ],
  },
];

let level=0,earned=getStars(GAME_ID),score=0,qIdx=0,answered=false;
function delay(ms){return new Promise(r=>setTimeout(r,ms));}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

function build(){const cfg=LEVELS[Math.min(level,LEVELS.length-1)];score=0;qIdx=0;answered=false;renderQ(cfg);}

function renderQ(cfg){
  answered=false;
  const q=cfg.questions[qIdx];
  const choices=shuffle([...q.choices]);
  const pct=Math.round((qIdx/cfg.questions.length)*100);
  document.getElementById('app').innerHTML=`
    <div class="mide-stage">
      <div class="mide-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3-earned)}</span>
        </div>
        <h2>📐 Mide Todo</h2>
        <div class="level-info"><span>${cfg.label}</span><span style="color:var(--text2);font-size:.9rem;">${qIdx+1}/${cfg.questions.length}</span></div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span>${q.q}</span>
        </div>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-label">Pregunta ${qIdx+1} de ${cfg.questions.length}</div>
      <div class="measure-card">
        <div class="measure-question">${q.q}</div>
        <div class="conversion-hint">💡 ${q.hint}</div>
      </div>
      <div class="choices-grid">
        ${choices.map(c=>`<button class="choice-btn" data-val="${c}">${c}</button>`).join('')}
      </div>
    </div>`;

  document.getElementById('speak-btn').addEventListener('click',()=>speak(q.q));
  document.querySelectorAll('.choice-btn').forEach(btn=>
    btn.addEventListener('click',()=>onPick(btn.dataset.val,btn,q.answer,cfg)));
}

async function onPick(val,btn,correct,cfg){
  if(answered)return;answered=true;playClick();
  if(val===correct){btn.classList.add('correct');score++;playSuccess();speak('¡Correcto!');}
  else{
    btn.classList.add('wrong');playError();
    document.querySelectorAll('.choice-btn').forEach(b=>{if(b.dataset.val===correct)b.classList.add('correct');});
    speak(`La respuesta es ${correct}`);
  }
  await delay(1500);qIdx++;
  if(qIdx>=cfg.questions.length)await finish(cfg);else renderQ(cfg);
}

async function finish(cfg){
  const pct=score/cfg.questions.length;level++;
  const stars=pct>=.85?3:pct>=.6?2:1;
  if(stars>earned){earned=stars;saveStars(GAME_ID,stars);}
  updateStars();playSuccess();showConfetti();
  showToast(score===cfg.questions.length?'🏆 ¡Perfecto!':`🌟 ${score}/${cfg.questions.length}`,2500);
  await delay(2600);
  if(level<LEVELS.length)build();else showToast('🏆 ¡Eres un experto en medidas!',3000);
}
function updateStars(){const el=document.getElementById('star-display');if(el)el.textContent='★'.repeat(earned)+'☆'.repeat(3-earned);}
build();
