import { showConfetti, playSuccess, playError, playClick, speak, showToast } from '../../shared/engine.js';
import { saveStars, getStars } from '../../shared/progress.js';

const GAME_ID = 'la-tiendita';

const PRODUCTS = [
  { name:'Paleta',    emoji:'🍭', price:5  },
  { name:'Jugo',      emoji:'🧃', price:10 },
  { name:'Pan',       emoji:'🍞', price:15 },
  { name:'Manzana',   emoji:'🍎', price:8  },
  { name:'Chocolate', emoji:'🍫', price:12 },
  { name:'Agua',      emoji:'💧', price:6  },
  { name:'Naranja',   emoji:'🍊', price:7  },
  { name:'Galletas',  emoji:'🍪', price:20 },
  { name:'Leche',     emoji:'🥛', price:18 },
  { name:'Plátano',   emoji:'🍌', price:4  },
];

const LEVELS = [
  { label:'Nivel 1 — Cambio sencillo', maxPay:30,  questions:5 },
  { label:'Nivel 2 — Dos productos',   maxPay:50,  questions:6, twoProducts:true },
  { label:'Nivel 3 — Cambio exacto',   maxPay:100, questions:6, twoProducts:true },
];

let level=0, earned=getStars(GAME_ID), score=0, qNum=0, answered=false;

function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=rnd(0,i);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}

function build(){
  const cfg=LEVELS[Math.min(level,LEVELS.length-1)];
  score=0;qNum=0;answered=false;nextQ(cfg);
}

// Billetes de denominaciones realistas en pesos MX
const BILLS = [10, 20, 50, 100, 200];

function roundUpToBill(total) {
  // Elige el billete más pequeño que cubra el total
  for (const b of BILLS) {
    if (b > total) return b;
  }
  return BILLS[BILLS.length - 1];
}

function makeQ(cfg){
  const p1=PRODUCTS[rnd(0,PRODUCTS.length-1)];
  const p2=cfg.twoProducts?PRODUCTS[rnd(0,PRODUCTS.length-1)]:null;
  const total=p1.price+(p2?p2.price:0);
  // Pago con el billete más chico que alcance, o el siguiente mayor
  const minBill = roundUpToBill(total);
  const billOptions = BILLS.filter(b => b > total && b <= (cfg.maxPay || 200));
  const pay = billOptions.length > 0
    ? billOptions[rnd(0, Math.min(billOptions.length - 1, 1))]  // uno de los 2 billetes más chicos
    : minBill;
  const change=pay-total;
  const wrongs=new Set([change]);
  const offsets=shuffle([-10,-5,5,10,15,-15]);
  for(const d of offsets){
    if(wrongs.size>=4)break;
    const c=change+d;
    if(c>0&&c!==change)wrongs.add(c);
  }
  for(let f=1;wrongs.size<4;f++){if(f!==change)wrongs.add(f);}
  wrongs.delete(change);
  return{p1,p2,total,pay,change,choices:shuffle([change,...wrongs])};
}

function nextQ(cfg){answered=false;qNum++;const q=makeQ(cfg);render(cfg,q);}

function render(cfg,q){
  document.getElementById('app').innerHTML=`
    <div class="tienda-stage">
      <div class="tienda-header">
        <div class="back-row">
          <a href="../../matematicas.html" class="btn btn-back">← Inicio</a>
          <span id="star-display">${'★'.repeat(earned)}${'☆'.repeat(3-earned)}</span>
        </div>
        <h2>💰 La Tiendita</h2>
        <div class="level-info"><span>${cfg.label}</span><span style="color:var(--text2);font-size:.9rem;">Pregunta ${qNum}/${cfg.questions}</span></div>
        <div class="instruction-box">
          <button class="speak-btn" id="speak-btn">🔊</button>
          <span id="instr">¿Cuánto cambio recibes?</span>
        </div>
      </div>
      <div class="shop-card">
        <div class="product-row">
          ${productBox(q.p1)}
          ${q.p2?`<span style="font-size:2rem;color:var(--text2)">+</span>${productBox(q.p2)}`:''}
        </div>
        <div class="pays-row">
          <span class="pays-label">Total:</span>
          <span class="pays-amount">$${q.total}</span>
          <span class="pays-label" style="margin-left:16px">Pagas con billete de:</span>
          <span class="pays-amount">$${q.pay}</span>
        </div>
        <div class="question-text">¿Cuánto cambio recibes? 🤔</div>
      </div>
      <div class="choices-grid">
        ${q.choices.map(c=>`<button class="choice-btn" data-val="${c}">$${c}</button>`).join('')}
      </div>
    </div>`;

  const instrText=`Compraste ${q.p1.name}${q.p2?' y '+q.p2.name:''} por $${q.total}. Pagaste $${q.pay}. ¿Cuánto te regresan?`;
  document.getElementById('speak-btn').addEventListener('click',()=>speak(instrText));
  document.querySelectorAll('.choice-btn').forEach(btn=>
    btn.addEventListener('click',()=>onPick(parseInt(btn.dataset.val),btn,q.change,cfg)));
}

function productBox(p){
  return`<div class="product-box">
    <span class="product-emoji">${p.emoji}</span>
    <div class="product-name">${p.name}</div>
    <div class="product-price">$${p.price}</div>
  </div>`;}

async function onPick(val,btn,correct,cfg){
  if(answered)return;answered=true;playClick();
  if(val===correct){
    btn.classList.add('correct');score++;playSuccess();
    speak(`¡Correcto! Tu cambio es $${correct}`);
    showToast(`✅ ¡Correcto! Cambio: $${correct}`,1400);
  }else{
    btn.classList.add('wrong');playError();
    document.querySelectorAll('.choice-btn').forEach(b=>{if(parseInt(b.dataset.val)===correct)b.classList.add('correct');});
    speak(`No. El cambio correcto es $${correct}`);
  }
  await delay(1500);
  if(qNum>=cfg.questions)await finish(cfg);else nextQ(cfg);
}

async function finish(cfg){
  const pct=score/cfg.questions;level++;
  const stars=pct>=.85?3:pct>=.6?2:1;
  if(stars>earned){earned=stars;saveStars(GAME_ID,stars);}
  updateStars();playSuccess();showConfetti();
  showToast(score===cfg.questions?'🏆 ¡Perfecto!':`🌟 ${score}/${cfg.questions} correctas`,2500);
  await delay(2600);
  if(level<LEVELS.length)build();else showToast('🏆 ¡Eres un experto en la tiendita!',3000);
}

function updateStars(){
  const el=document.getElementById('star-display');
  if(el)el.textContent='★'.repeat(earned)+'☆'.repeat(3-earned);
}
build();
