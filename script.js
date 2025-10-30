
/* Client-side "smart" AI-like calorie estimator and UI for Fit AI Tracker */
const COMMON = {
  "black coffee": {cal: 2, per: "cup (240ml)", img: "images/coffee.jpg", ing: ["coffee","water"]},
  "latte": {cal: 150, per: "cup (240ml)", img: "images/coffee.jpg", ing: ["milk","coffee"]},
  "pizza": {cal: 285, per: "slice (1/8 large)", img: "images/pizza.jpg", ing: ["dough","cheese","tomato"]},
  "burger": {cal: 400, per: "regular", img: "images/burger.jpg", ing: ["bun","beef","cheese","mayo"]},
  "chicken biryani": {cal: 520, per: "plate", img: "images/pizza.jpg", ing: ["rice","chicken","oil","spices"]},
  "cake": {cal: 350, per: "slice (100g)", img: "images/cake.jpg", ing: ["flour","sugar","butter","eggs"]},
  "smoothie": {cal: 180, per: "cup (300ml)", img: "images/smoothie.jpg", ing: ["fruits","yogurt","milk"]},
  "salad": {cal: 90, per: "bowl", img: "images/salad.jpg", ing: ["lettuce","tomato","cucumber","olive oil"]}
};

function norm(s){ return (s||'').trim().toLowerCase(); }

function inferFromWords(text){
  const words = text.split(/\s+/);
  let est = {cal:0, ing:[], img:null, per: 'serving'};
  if(words.includes('chicken')){ est.cal += 200; est.ing.push('chicken'); est.img = est.img || 'images/pizza.jpg'; }
  if(words.includes('rice') || text.includes('biryani')){ est.cal += 240; est.ing.push('rice'); est.img = est.img || 'images/pizza.jpg'; }
  if(words.includes('cake') || words.includes('chocolate')){ est.cal += 320; est.ing.push('flour','sugar','butter'); est.img = est.img || 'images/cake.jpg'; }
  if(words.includes('coffee')){ est.cal += 5; est.ing.push('coffee'); est.img = est.img || 'images/coffee.jpg'; }
  if(words.includes('pizza') || words.includes('pepperoni')){ est.cal += 280; est.ing.push('dough','cheese'); est.img = est.img || 'images/pizza.jpg'; }
  if(words.includes('burger')){ est.cal += 380; est.ing.push('beef','bread'); est.img = est.img || 'images/burger.jpg'; }
  if(words.includes('salad') || words.includes('lettuce')){ est.cal += 60; est.ing.push('lettuce','tomato'); est.img = est.img || 'images/salad.jpg'; }
  return est.cal > 0 ? est : null;
}

function generateEstimate(query){
  const q = norm(query);
  if(!q) return {error:'Please type a food name.'};
  if(COMMON[q]){
    const c = COMMON[q];
    return {name: q, calories: c.cal, per: c.per, img: c.img, ingredients: c.ing, note: 'Estimate based on typical serving.'};
  }
  const inferred = inferFromWords(q);
  if(inferred){
    const variability = Math.round(inferred.cal * (0.9 + Math.random()*0.2));
    return {name: query, calories: variability, per: inferred.per, img: inferred.img, ingredients: inferred.ing, note: 'Heuristic estimate based on detected ingredients.'};
  }
  const tokens = q.split(/\s+/);
  let base = 150;
  tokens.forEach(t => {
    if(t.length>6) base += 20;
    if(['large','big','extra','double'].includes(t)) base *= 1.5;
    if(['small','mini','light'].includes(t)) base *= 0.7;
  });
  const rand = Math.round(base * (0.8 + Math.random()*0.6));
  const imgs = Object.values(COMMON).map(x=>x.img);
  const img = imgs[Math.floor(Math.random()*imgs.length)];
  const ing = tokens.slice(0,3).map(s=>s.replace(/[^a-z]/g,''));
  return {name: query, calories: rand, per: 'serving (approx)', img: img, ingredients: ing, note: 'Approximate AI-style estimate.'};
}

/* UI */
document.addEventListener('DOMContentLoaded', ()=>{
  const input = document.getElementById('foodInput');
  const btn = document.getElementById('checkBtn');
  const resBox = document.getElementById('result');
  const addBtn = document.getElementById('addBtn');
  const clearBtn = document.getElementById('clearPlate');
  const plateList = document.getElementById('plateList');
  const totalCal = document.getElementById('totalCal');
  let lastItem = null;
  let plate = [];

  function renderResult(obj){
    if(obj.error){ resBox.innerHTML = '<p class="err">'+obj.error+'</p>'; return; }
    lastItem = obj;
    const html = `
      <div class="item">
        <img src="${obj.img}" alt="${escapeHtml(obj.name)}" loading="lazy" />
        <div class="meta">
          <h4>${escapeHtml(obj.name)}</h4>
          <p><strong>Calories:</strong> ${obj.calories} kcal <span class="muted">(${obj.per})</span></p>
          <p><strong>Ingredients:</strong> ${obj.ingredients.join(', ') || '—'}</p>
          <p class="note">${obj.note}</p>
        </div>
      </div>`;
    resBox.innerHTML = html;
  }

  btn.addEventListener('click', ()=>{
    const q = input.value;
    const out = generateEstimate(q);
    renderResult(out);
  });

  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); btn.click(); } });

  addBtn.addEventListener('click', ()=>{
    if(!lastItem) return alert('Please estimate an item first.');
    plate.push(lastItem);
    updatePlate();
  });
  clearBtn.addEventListener('click', ()=>{ plate = []; updatePlate(); });

  function updatePlate(){
    plateList.innerHTML = '';
    let sum = 0;
    plate.forEach((it,idx)=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(it.name)}</span><span>${it.calories} kcal</span>`;
      plateList.appendChild(li);
      sum += Number(it.calories) || 0;
    });
    totalCal.textContent = sum;
  }
});

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
