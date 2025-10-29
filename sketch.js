// Pac-Man menor + 3 fantasmas menores e mais lentos
// Colisão: vira SAPINHO por alguns frames (com pulinho leve)
// Renato Valente — Bicudo 2025

let delayFrames = 20;                 // pode ajustar com [ e ], mas não mostra HUD
const MAX_TRAIL = 220;
const trail = [];

let pacSize = 45;                     // Pac-Man menor
let lastAngle = 0;
let pacFreezeFrames = 0;              // esconde Pac-Man quando vira sapinho

// Fantasmas com escala menor e mais lentos
const ghosts = [
  { x: undefined, y: undefined, col: null, scale: 0.70, smooth: 0.12, extraDelay: 0, freeze: 0 },
  { x: undefined, y: undefined, col: null, scale: 0.60, smooth: 0.10, extraDelay: 8, freeze: 0 },
  { x: undefined, y: undefined, col: null, scale: 0.55, smooth: 0.08, extraDelay:16, freeze: 0 },
];

// Sapinhos temporários após colisão
const frogs = []; // {x,y,frames}

function setup(){
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.elt.style.position = 'fixed';
  cnv.elt.style.inset = '0';
  cnv.elt.style.pointerEvents = 'none';
  cnv.elt.style.zIndex = '7';
  cursor('none');

  ghosts[0].col = color(120, 220, 255); // ciano
  ghosts[1].col = color(255, 90, 180);  // rosa
  ghosts[2].col = color(255, 150, 60);  // laranja
}

function draw(){
  clear();

  // trilha para atraso
  trail.push({ x: mouseX, y: mouseY });
  if (trail.length > MAX_TRAIL) trail.shift();

  // ângulo do Pac-Man
  const vx = mouseX - pmouseX, vy = mouseY - pmouseY;
  if (abs(vx) + abs(vy) > 0.01) lastAngle = atan2(vy, vx);

  // Atualiza fantasmas + colisão
  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i];

    const idx = max(0, trail.length - 1 - (delayFrames + g.extraDelay));
    const target = trail[idx] || { x: mouseX, y: mouseY };

    if (g.x === undefined) { g.x = target.x; g.y = target.y; }
    else if (g.freeze <= 0) { // só move se não estiver "virado sapinho"
      g.x += (target.x - g.x) * g.smooth;
      g.y += (target.y - g.y) * g.smooth;
    }

    // Colisão (só considera se ninguém estiver congelado)
    if (pacFreezeFrames <= 0 && g.freeze <= 0) {
      const pacR   = (pacSize * 0.85) * 0.5;
      const ghostR = (pacSize * g.scale) * 0.5;
      const hit = dist(mouseX, mouseY, g.x, g.y) < (pacR + ghostR);
      if (hit) {
        // cria sapinho no meio
        const mx = (mouseX + g.x) * 0.5;
        const my = (mouseY + g.y) * 0.5;
        frogs.push({ x: mx, y: my, frames: 28 });
        // congela os dois por alguns frames (somem e aparece o sapo)
        pacFreezeFrames = 18;
        g.freeze = 18;
      }
    }
  }

  // Desenha fantasmas (se não estiverem congelados)
  for (const g of ghosts) {
    if (g.freeze > 0) g.freeze--;
    else drawGhost(g.x, g.y, pacSize * g.scale, g.col, mouseX, mouseY);
  }

  // Desenha Pac-Man (se não congelado)
  if (pacFreezeFrames > 0) pacFreezeFrames--;
  else drawPacman(mouseX, mouseY, pacSize * 0.85, lastAngle);

  // Desenha sapinhos e atualiza vida/efeito
  for (let i = frogs.length - 1; i >= 0; i--) {
    const f = frogs[i];
    drawFrog(f.x, f.y, pacSize * 0.8, f.frames); // sapo ~ do tamanho do Pac-Man
    f.frames--;
    if (f.frames <= 0) frogs.splice(i, 1);
  }
}

// ---------- Desenhos ----------
function drawGhost(cx, cy, s, cMain, lookX, lookY){
  push();
  translate(cx, cy);
  rectMode(CENTER);
  noStroke(); fill(cMain);
  const w = s, h = s * 0.9;
  rect(0, 0, w, h, w/2, w/2, 0, 0);

  const r = w/6, yFeet = h/2 - r;
  circle(-w/3, yFeet, r*2); circle(0, yFeet, r*2); circle(w/3, yFeet, r*2);

  const eyeR = s * 0.12, eyeLx = -w * .15, eyeLy = -h * .18, eyeRx = w * .15, eyeRy = -h * .18;
  fill(255); circle(eyeLx, eyeLy, eyeR*2); circle(eyeRx, eyeRy, eyeR*2);

  const dx = lookX - cx, dy = lookY - cy, m = max(1, sqrt(dx*dx + dy*dy));
  const off = eyeR * .45, ox = (dx / m) * off, oy = (dy / m) * off;
  fill(30, 60, 120); circle(eyeLx + ox, eyeLy + oy, eyeR * .9); circle(eyeRx + ox, eyeRy + oy, eyeR * .9);
  pop();
}

function drawPacman(x, y, s, ang){
  push(); translate(x, y); rotate(ang); noStroke();
  const open = map(sin(frameCount * 0.25), -1, 1, 10, 36);
  const a = radians(open);
  fill(255, 230, 0);
  arc(0, 0, s, s, a, TWO_PI - a, PIE);
  const eo = s * .14, ei = eo * .45, ex = s * .18, ey = -s * .18;
  fill(255); circle(ex, ey, eo);
  fill(30);  circle(ex + eo * .15, ey + eo * .10, ei);
  pop();
}

// Sapinho cartoon com leve "pulo" amortecido
function drawFrog(x, y, size, life){
  push();
  translate(x, y);
  const t = (28 - life);                 // do 0 ao ~28
  const hop = -abs(sin(t * 0.35)) * (size * 0.15); // pulinho
  translate(0, hop);

  noStroke();
  // corpo
  fill(60, 190, 80);
  ellipse(0, 0, size * 1.1, size * 0.75);

  // pernas traseiras
  fill(55, 170, 70);
  ellipse(-size*0.42, size*0.08, size*0.45, size*0.25);
  ellipse( size*0.42, size*0.08, size*0.45, size*0.25);

  // cabeça
  fill(70, 210, 90);
  ellipse(0, -size*0.38, size * 0.8, size * 0.55);

  // olhos
  fill(255);
  ellipse(-size*0.22, -size*0.52, size*0.22, size*0.22);
  ellipse( size*0.22, -size*0.52, size*0.22, size*0.22);
  fill(30);
  const blink = max(0.35, sin(frameCount * 0.12) * 0.5 + 0.5);
  ellipse(-size*0.22, -size*0.52, size*0.10, size*0.10 * blink);
  ellipse( size*0.22, -size*0.52, size*0.10, size*0.10 * blink);

  // boca
  stroke(20,120,40); strokeWeight(2);
  noFill(); arc(0, -size*0.40, size*0.35, size*0.20, 0, PI);

  pop();
}

// Controles (continua funcionando, só não exibimos HUD)
function keyPressed(){
  if (key === '[') delayFrames = max(0, delayFrames - 1);
  if (key === ']') delayFrames = min(MAX_TRAIL - 1, delayFrames + 1);
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
