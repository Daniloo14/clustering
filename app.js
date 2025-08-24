// Simple K-Means interactive demo
const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const kInput = document.getElementById('kInput');
const nInput = document.getElementById('nInput');
const genBtn = document.getElementById('genBtn');
const initBtn = document.getElementById('initBtn');
const stepBtn = document.getElementById('stepBtn');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const iterEl = document.getElementById('iteration');
const inertiaEl = document.getElementById('inertia');
const explainEl = document.getElementById('explain');
const legendBoxes = document.getElementById('legendBoxes');

let points = [];
let centroids = [];
let assignments = [];
let iteration = 0;
let running = false;
let runTimer = null;
let phase = 'idle'; // 'idle' | 'assign' | 'update'

const colors = [
  '#7c5cff','#4b8bff','#26c6da','#34d399','#f59e0b','#f97316','#ef4444','#c084fc','#60a5fa','#f472b6'
];

function rand(min, max){ return Math.random()*(max-min)+min }

function generatePoints(n){
  points = [];
  for(let i=0;i<n;i++){
    // cluster-like random by mixing multiple gaussian blobs
    const cx = rand(0.12, 0.88)*canvas.width;
    const cy = rand(0.12, 0.88)*canvas.height;
    const r = Math.max(8, Math.abs(rand(-1,1))*80);
    const angle = rand(0,Math.PI*2);
    const x = cx + Math.cos(angle)*Math.random()*r;
    const y = cy + Math.sin(angle)*Math.random()*r;
    points.push({x, y});
  }
  assignments = new Array(points.length).fill(-1);
}

function initCentroids(k){
  // choose k random points as initial centroids (if available) otherwise random positions
  centroids = [];
  const n = points.length;
  for(let i=0;i<k;i++){
    if(n>0){
      const p = points[Math.floor(Math.random()*n)];
      centroids.push({x: p.x + rand(-12,12), y: p.y + rand(-12,12)});
    }else{
      centroids.push({x: rand(0,canvas.width), y: rand(0,canvas.height)});
    }
  }
  phase = 'assign';
  explain('Centroids initialized. Next: assign each point to the nearest centroid.');
}

function assignPoints(){
  if(centroids.length===0) return false;
  let changed = false;
  for(let i=0;i<points.length;i++){
    let best = -1; let bestd = Infinity;
    for(let j=0;j<centroids.length;j++){
      const dx = points[i].x - centroids[j].x;
      const dy = points[i].y - centroids[j].y;
      const d = dx*dx + dy*dy;
      if(d<bestd){ bestd = d; best = j }
    }
    if(assignments[i] !== best){ changed = true; assignments[i]=best }
  }
  phase = 'update';
  explain('Assigned points to nearest centroids. Now update centroid positions (mean of assigned points).');
  return changed;
}

function updateCentroids(){
  const k = centroids.length;
  const sums = new Array(k).fill(0).map(()=>({x:0,y:0,count:0}));
  for(let i=0;i<points.length;i++){
    const a = assignments[i];
    if(a>=0){ sums[a].x += points[i].x; sums[a].y += points[i].y; sums[a].count++ }
  }
  let moved = false;
  for(let j=0;j<k;j++){
    if(sums[j].count>0){
      const nx = sums[j].x/sums[j].count;
      const ny = sums[j].y/sums[j].count;
      const dx = nx - centroids[j].x;
      const dy = ny - centroids[j].y;
      if(Math.hypot(dx,dy) > 0.5) moved = true;
      centroids[j].x = nx; centroids[j].y = ny;
    }
  }
  phase = 'assign';
  iteration++;
  explain('Centroids updated. That completes one iteration. You can step again or run until convergence.');
  return moved;
}

function computeInertia(){
  let s=0;
  for(let i=0;i<points.length;i++){
    const a = assignments[i];
    if(a>=0){
      const dx = points[i].x - centroids[a].x;
      const dy = points[i].y - centroids[a].y;
      s += dx*dx + dy*dy;
    }
  }
  return s;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw grid
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#ffffff';
  for(let x=0;x<canvas.width;x+=60){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke() }
  for(let y=0;y<canvas.height;y+=60){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke() }
  ctx.restore();

  // draw points
  for(let i=0;i<points.length;i++){
    const p = points[i];
    const a = assignments[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
    ctx.fillStyle = (a>=0 ? colors[a%colors.length] : 'rgba(255,255,255,0.08)');
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();
  }

  // draw centroids
  for(let j=0;j<centroids.length;j++){
    const c = centroids[j];
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI*2);
    ctx.fillStyle = colors[j%colors.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    // inner dot
    ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI*2); ctx.fillStyle = '#071024'; ctx.fill();
  }

}

function explain(text){ explainEl.innerHTML = text }

function step(){
  if(points.length===0){ explain('No points — click Generate.'); return }
  if(centroids.length===0){ explain('No centroids — initializing now.'); initCentroids(parseInt(kInput.value,10)); draw(); return }
  if(phase==='assign'){
    const changed = assignPoints();
    draw();
    iterEl.textContent = iteration;
    inertiaEl.textContent = computeInertia().toFixed(1);
    return changed;
  } else if(phase==='update'){
    const moved = updateCentroids();
    draw();
    iterEl.textContent = iteration;
    inertiaEl.textContent = computeInertia().toFixed(1);
    return moved;
  }
}

function run(){
  if(running) return stopRun();
  running = true; runBtn.textContent = 'Stop';
  runTimer = setInterval(()=>{
    if(centroids.length===0) { initCentroids(parseInt(kInput.value,10)); draw(); return }
    // do assign then update in one loop
    assignPoints();
    draw();
    const moved = updateCentroids();
    draw();
    iterEl.textContent = iteration;
    inertiaEl.textContent = computeInertia().toFixed(1);
    // stop when centroids not moved or max iterations
    if(!moved || iteration>100){ stopRun(); explain('Run complete (converged or reached iteration limit).') }
  }, 600);
}
function stopRun(){ running=false; runBtn.textContent = 'Run'; if(runTimer){ clearInterval(runTimer); runTimer=null } }

function reset(){ stopRun(); points=[]; centroids=[]; assignments=[]; iteration=0; phase='idle'; explain('Reset state. Click Generate to create points.'); draw(); iterEl.textContent = '0'; inertiaEl.textContent = '—'; buildLegend(); }

function buildLegend(){ legendBoxes.innerHTML=''; const k = Math.max(1, parseInt(kInput.value,10)); for(let i=0;i<k;i++){ const div = document.createElement('div'); div.className='box'; div.innerHTML = `<div class="sw" style="background:${colors[i%colors.length]}"></div> Cluster ${i+1}`; legendBoxes.appendChild(div) } }

// UI wiring
genBtn.addEventListener('click', ()=>{
  stopRun(); const n = Math.max(1, Math.min(1000, parseInt(nInput.value,10)||50)); generatePoints(n); iteration=0; centroids=[]; assignments=new Array(points.length).fill(-1); phase='idle'; explain('Points generated. Initialize centroids next.'); buildLegend(); draw(); iterEl.textContent = '0'; inertiaEl.textContent = '—';
});
initBtn.addEventListener('click', ()=>{ stopRun(); const k = Math.max(1, Math.min(20, parseInt(kInput.value,10)||3)); if(k>points.length) { explain('k is larger than number of points — reduce k or increase points.'); return } initCentroids(k); buildLegend(); draw(); iterEl.textContent = iteration; inertiaEl.textContent = computeInertia().toFixed(1); });
stepBtn.addEventListener('click', ()=>{ stopRun(); const ok = step(); if(ok===false){} });
runBtn.addEventListener('click', ()=>{ if(running) stopRun(); else run(); });
resetBtn.addEventListener('click', reset);

// canvas resize handling
function fitCanvas(){ const ratio = window.devicePixelRatio||1; const w = canvas.clientWidth || 720; const h = canvas.clientHeight || 520; canvas.width = Math.floor(w*ratio); canvas.height = Math.floor(h*ratio); ctx.setTransform(ratio,0,0,ratio,0,0); }
window.addEventListener('resize', ()=>{ fitCanvas(); draw(); });

// initial
fitCanvas(); reset();

// nice little feature: click to add a point
canvas.addEventListener('click', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  points.push({x,y}); assignments.push(-1); explain('Added a point.'); draw(); });

