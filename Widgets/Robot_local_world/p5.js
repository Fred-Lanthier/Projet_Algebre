let robot = { x: -3, y: -1, theta: 35 };
let target = { x: 4, y: 2 };

let oldRobot = { x: robot.x, y: robot.y };
let trail = [];
let dragging = null;
let activeSlider = null;
let activeButton = null;

let animatingTheta = false;
let moveAnim = null;

const W = 860;
const H = 1020;

const PLOT_X = 30;
const PLOT_Y = 50;
const PLOT_W = 800;
const PLOT_H = 430;
const UNIT = 58;

const BLUE = [24, 95, 165];
const RED = [190, 40, 40];
const GREEN = [15, 110, 86];
const AMBER = [210, 125, 20];
const DARK = [35, 35, 45];
const PURPLE = [110, 70, 180];

let sliders = [];
let buttons = [];

function setup() {
  if (typeof removeElements === "function") {
    removeElements();
  }

  createCanvas(W, H);
  textFont("monospace");

  setupUI();
  pushTrail();
}

function setupUI() {
  sliders = [];
  buttons = [];

  addSlider("robotX", "Robot X", 55, 600, 210, -6, 6, robot.x, 0.1);
  addSlider("robotY", "Robot Y", 55, 637, 210, -3, 3, robot.y, 0.1);
  addSlider("theta", "Angle θ", 55, 674, 210, -180, 180, robot.theta, 1);
  addSlider("targetX", "Cible X", 55, 711, 210, -6, 6, target.x, 0.1);
  addSlider("targetY", "Cible Y", 55, 748, 210, -3, 3, target.y, 0.1);

  addSlider("cmdX", "Ordre x'", 455, 600, 210, -8, 8, 0, 0.1);
  addSlider("cmdY", "Ordre y'", 455, 637, 210, -8, 8, 0, 0.1);

  addButton("solution", "Solution", 455, 700, 105, 34, true);
  addButton("test", "Tester", 585, 700, 105, 34, true);
  addButton("theta", "Animer θ", 715, 700, 105, 34, false);

  addButton("reset", "Reset", 455, 745, 105, 34, false);
  addButton("random", "Défi", 585, 745, 105, 34, false);
  addButton("undo", "Revenir", 715, 745, 105, 34, false);
}

function draw() {
  background(255);

  updateStateFromUI();

  if (animatingTheta) {
    robot.theta += 0.5;
    if (robot.theta > 180) robot.theta = -180;
    getSlider("theta").value = robot.theta;
  }

  updateMoveAnimation();

  const data = computeChangeOfBasis();

  drawTitle();
  drawPlot();

  drawTrail();
  drawWorldAxes();
  drawVectorWorld(data);
  drawLocalProjections(data);
  drawPredictedCommand(data);
  drawTarget();
  drawRobot(data);

  drawControlPanels();
  drawMathPanel(data);
  drawStatusPanel(data);

  drawUI();
}

function updateStateFromUI() {
  robot.x = getSlider("robotX").value;
  robot.y = getSlider("robotY").value;
  robot.theta = getSlider("theta").value;

  target.x = getSlider("targetX").value;
  target.y = getSlider("targetY").value;
}

function computeChangeOfBasis() {
  const theta = radians(robot.theta);
  const c = Math.cos(theta);
  const s = Math.sin(theta);

  const dx = target.x - robot.x;
  const dy = target.y - robot.y;

  const localX = c * dx + s * dy;
  const localY = -s * dx + c * dy;

  const cmdX = getSlider("cmdX").value;
  const cmdY = getSlider("cmdY").value;

  const cmdWorldX = c * cmdX - s * cmdY;
  const cmdWorldY = s * cmdX + c * cmdY;

  const predictedX = robot.x + cmdWorldX;
  const predictedY = robot.y + cmdWorldY;

  const err = dist(predictedX, predictedY, target.x, target.y);

  return {
    theta,
    c,
    s,
    dx,
    dy,
    localX,
    localY,
    cmdX,
    cmdY,
    cmdWorldX,
    cmdWorldY,
    predictedX,
    predictedY,
    err
  };
}

function drawTitle() {
  noStroke();
  fill(40);
  textSize(18);
  textAlign(LEFT, TOP);
  text("Activité 1 — Le Défi du Robot Voyageur", 30, 12);
}

function drawPlot() {
  stroke(220);
  strokeWeight(1);
  fill(250);
  rect(PLOT_X, PLOT_Y, PLOT_W, PLOT_H, 12);

  stroke(230);
  strokeWeight(1);

  for (let x = -6; x <= 6; x++) {
    line(wx(x), PLOT_Y, wx(x), PLOT_Y + PLOT_H);
  }

  for (let y = -3; y <= 3; y++) {
    line(PLOT_X, wy(y), PLOT_X + PLOT_W, wy(y));
  }

  stroke(170);
  strokeWeight(2);
  line(PLOT_X, wy(0), PLOT_X + PLOT_W, wy(0));
  line(wx(0), PLOT_Y, wx(0), PLOT_Y + PLOT_H);

  noStroke();
  fill(140);
  textSize(11);

  textAlign(CENTER, TOP);
  for (let x = -6; x <= 6; x++) {
    if (x !== 0) text(x, wx(x), wy(0) + 5);
  }

  textAlign(LEFT, CENTER);
  for (let y = -3; y <= 3; y++) {
    if (y !== 0) text(y, wx(0) + 5, wy(y));
  }
}

function drawWorldAxes() {
  drawArrow(wx(0), wy(0), wx(5.6), wy(0), [100, 100, 100], 2);
  drawArrow(wx(0), wy(0), wx(0), wy(2.7), [100, 100, 100], 2);

  noStroke();
  fill(100);
  textSize(13);
  textAlign(LEFT, CENTER);
  text("X monde", wx(4.4), wy(0) - 16);
  text("Y monde", wx(0) + 10, wy(2.55));
}

function drawRobot(data) {
  const x = wx(robot.x);
  const y = wy(robot.y);

  push();
  translate(x, y);
  rotate(-data.theta);

  fill(...DARK);
  stroke(...DARK);
  strokeWeight(2);
  triangle(25, 0, -18, -15, -18, 15);

  fill(255);
  noStroke();
  circle(0, 0, 10);
  pop();

  const ex = {
    x: robot.x + 1.35 * Math.cos(data.theta),
    y: robot.y + 1.35 * Math.sin(data.theta)
  };

  const ey = {
    x: robot.x - 1.35 * Math.sin(data.theta),
    y: robot.y + 1.35 * Math.cos(data.theta)
  };

  drawArrow(x, y, wx(ex.x), wy(ex.y), BLUE, 4);
  drawArrow(x, y, wx(ey.x), wy(ey.y), RED, 4);

  noStroke();
  textSize(14);
  textStyle(BOLD);

  fill(...BLUE);
  textAlign(CENTER, CENTER);
  text("x'", wx(ex.x) + 14, wy(ex.y));

  fill(...RED);
  text("y'", wx(ey.x) + 14, wy(ey.y));

  textStyle(NORMAL);
  fill(...DARK);
  textSize(12);
  text("Robot", x, y + 28);
}

function drawTarget() {
  const x = wx(target.x);
  const y = wy(target.y);

  stroke(130, 80, 20);
  strokeWeight(2);
  fill(...AMBER);
  circle(x, y, 24);

  noFill();
  stroke(...AMBER);
  circle(x, y, 42);

  noStroke();
  fill(130, 80, 20);
  textSize(13);
  textStyle(BOLD);
  textAlign(CENTER, BOTTOM);
  text("Cible", x, y - 24);
  textStyle(NORMAL);
}

function drawVectorWorld(data) {
  const x1 = wx(robot.x);
  const y1 = wy(robot.y);
  const x2 = wx(target.x);
  const y2 = wy(target.y);

  stroke(110);
  strokeWeight(2);
  drawingContext.setLineDash([7, 7]);
  line(x1, y1, x2, y2);
  drawingContext.setLineDash([]);

  noStroke();
  fill(90);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  text("v monde = cible - robot", (x1 + x2) / 2, (y1 + y2) / 2 - 6);
}

function drawLocalProjections(data) {
  const theta = data.theta;

  const ax = robot.x + data.localX * Math.cos(theta);
  const ay = robot.y + data.localX * Math.sin(theta);

  const bx = ax + data.localY * (-Math.sin(theta));
  const by = ay + data.localY * Math.cos(theta);

  drawArrow(wx(robot.x), wy(robot.y), wx(ax), wy(ay), BLUE, 3);
  drawArrow(wx(ax), wy(ay), wx(bx), wy(by), RED, 3);

  noStroke();
  textSize(12);

  fill(...BLUE);
  textAlign(CENTER, BOTTOM);
  text("x' = " + data.localX.toFixed(2), wx(ax), wy(ay) - 5);

  fill(...RED);
  text("y' = " + data.localY.toFixed(2), wx((ax + bx) / 2) + 14, wy((ay + by) / 2) - 5);
}

function drawPredictedCommand(data) {
  const x1 = wx(robot.x);
  const y1 = wy(robot.y);
  const x2 = wx(data.predictedX);
  const y2 = wy(data.predictedY);

  const good = data.err < 0.18;
  const col = good ? GREEN : PURPLE;

  stroke(...col);
  strokeWeight(2);
  drawingContext.setLineDash([4, 6]);
  line(x1, y1, x2, y2);
  drawingContext.setLineDash([]);

  noStroke();
  fill(...col);
  circle(x2, y2, 11);

  textSize(12);
  textAlign(LEFT, CENTER);
  text("fin prédite", x2 + 8, y2);
}

function drawTrail() {
  if (trail.length < 2) return;

  stroke(200);
  strokeWeight(3);
  noFill();

  beginShape();
  for (let p of trail) {
    vertex(wx(p.x), wy(p.y));
  }
  endShape();

  noStroke();
  fill(200);
  for (let p of trail) {
    circle(wx(p.x), wy(p.y), 4);
  }
}

function drawControlPanels() {
  stroke(220);
  strokeWeight(1);
  fill(248);
  rect(30, 510, 380, 275, 12);

  noStroke();
  fill(50);
  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("Paramètres du monde", 55, 530);

  textStyle(NORMAL);
  textSize(12);
  fill(90);
  text("Robot, cible et orientation du repère local.", 55, 555);

  stroke(220);
  strokeWeight(1);
  fill(248);
  rect(430, 510, 400, 275, 12);

  noStroke();
  fill(50);
  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("Commande locale", 455, 530);

  textStyle(NORMAL);
  textSize(12);
  fill(90);
  text("Trouve l'ordre local (x', y') du robot.", 455, 555);
}

function drawMathPanel(data) {
  stroke(220);
  strokeWeight(1);
  fill(252, 249, 240);
  rect(30, 805, 800, 145, 12);

  noStroke();
  fill(100, 78, 20);
  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("Calcul en direct", 55, 825);

  textStyle(NORMAL);
  textSize(12.5);
  fill(70, 60, 35);

  const leftText =
    "Robot monde : (" + robot.x.toFixed(1) + ", " + robot.y.toFixed(1) + ")\n" +
    "Cible monde : (" + target.x.toFixed(1) + ", " + target.y.toFixed(1) + ")\n" +
    "θ = " + robot.theta.toFixed(0) + "°\n\n" +
    "v_monde = (" + data.dx.toFixed(2) + ", " + data.dy.toFixed(2) + ")\n" +
    "v_local = (" + data.localX.toFixed(2) + ", " + data.localY.toFixed(2) + ")";

  const rightText =
    "v_local = Rᵀ × v_monde\n\n" +
    "x' =  cosθ · dx + sinθ · dy\n" +
    "y' = -sinθ · dx + cosθ · dy\n\n" +
    "Ordre testé = (" + data.cmdX.toFixed(1) + ", " + data.cmdY.toFixed(1) + ")";

  text(leftText, 55, 855);
  text(rightText, 430, 855);
}

function drawStatusPanel(data) {
  stroke(210);
  strokeWeight(1);
  fill(250);
  rect(30, 965, 800, 38, 12);

  noStroke();
  textSize(13);
  textAlign(LEFT, CENTER);

  if (data.err < 0.18) {
    fill(...GREEN);
    text("Réussi : l'ordre local atteint la cible.", 55, 984);
  } else {
    fill(100);
    text("Erreur à la cible : " + data.err.toFixed(2), 55, 984);
  }
}

function addSlider(id, label, x, y, w, minVal, maxVal, value, step) {
  sliders.push({
    id,
    label,
    x,
    y,
    w,
    minVal,
    maxVal,
    value,
    step
  });
}

function addButton(id, label, x, y, w, h, primary) {
  buttons.push({
    id,
    label,
    x,
    y,
    w,
    h,
    primary
  });
}

function drawUI() {
  for (let s of sliders) {
    drawSlider(s);
  }

  for (let b of buttons) {
    drawButton(b);
  }
}

function drawSlider(s) {
  const labelX = s.x;
  const trackX = s.x + 105;
  const trackY = s.y;
  const trackW = s.w;

  noStroke();
  fill(65);
  textSize(12.5);
  textAlign(LEFT, CENTER);
  text(s.label, labelX, trackY);

  stroke(180);
  strokeWeight(2);
  line(trackX, trackY, trackX + trackW, trackY);

  const t = map(s.value, s.minVal, s.maxVal, 0, 1);
  const knobX = trackX + t * trackW;

  stroke(30, 120, 230);
  strokeWeight(5);
  line(trackX, trackY, knobX, trackY);

  noStroke();
  fill(30, 120, 230);
  circle(knobX, trackY, 17);

  fill(90);
  textSize(11);
  textAlign(LEFT, CENTER);

  let valText;
  if (s.step >= 1) {
    valText = Math.round(s.value);
  } else {
    valText = s.value.toFixed(1);
  }

  if (s.id === "theta") valText += "°";

  text(valText, trackX + trackW + 12, trackY);
}

function drawButton(b) {
  let bg = b.primary ? [31, 41, 55] : [245, 245, 245];
  let fg = b.primary ? [255, 255, 255] : [40, 40, 40];

  if (activeButton === b.id) {
    bg = b.primary ? [15, 23, 42] : [225, 225, 225];
  }

  stroke(150);
  strokeWeight(1);
  fill(...bg);
  rect(b.x, b.y, b.w, b.h, 9);

  noStroke();
  fill(...fg);
  textSize(12.5);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(b.label, b.x + b.w / 2, b.y + b.h / 2);
  textStyle(NORMAL);
}

function getSlider(id) {
  for (let s of sliders) {
    if (s.id === id) return s;
  }
  return null;
}

function setSlider(id, value) {
  const s = getSlider(id);
  if (s) s.value = constrain(value, s.minVal, s.maxVal);
}

function updateSliderFromMouse(s) {
  const trackX = s.x + 105;
  const t = constrain((mouseX - trackX) / s.w, 0, 1);
  let v = lerp(s.minVal, s.maxVal, t);
  v = roundTo(v, s.step);
  s.value = constrain(v, s.minVal, s.maxVal);
}

function mousePressed() {
  activeSlider = null;
  activeButton = null;
  dragging = null;

  for (let b of buttons) {
    if (inside(mouseX, mouseY, b.x, b.y, b.w, b.h)) {
      activeButton = b.id;
      return;
    }
  }

  for (let s of sliders) {
    const trackX = s.x + 105;
    const trackY = s.y;

    if (
      mouseX >= trackX - 12 &&
      mouseX <= trackX + s.w + 12 &&
      abs(mouseY - trackY) <= 14
    ) {
      activeSlider = s;
      updateSliderFromMouse(s);
      return;
    }
  }

  const rx = wx(robot.x);
  const ry = wy(robot.y);
  const tx = wx(target.x);
  const ty = wy(target.y);

  if (dist(mouseX, mouseY, tx, ty) < 25) {
    dragging = "target";
  } else if (dist(mouseX, mouseY, rx, ry) < 30) {
    dragging = "robot";
  }
}

function mouseDragged() {
  if (activeSlider) {
    updateSliderFromMouse(activeSlider);
    return;
  }

  if (!dragging) return;

  const p = screenToWorld(mouseX, mouseY);

  if (dragging === "robot") {
    robot.x = constrain(roundTo(p.x, 0.1), -6, 6);
    robot.y = constrain(roundTo(p.y, 0.1), -3, 3);

    setSlider("robotX", robot.x);
    setSlider("robotY", robot.y);

    pushTrail();
  }

  if (dragging === "target") {
    target.x = constrain(roundTo(p.x, 0.1), -6, 6);
    target.y = constrain(roundTo(p.y, 0.1), -3, 3);

    setSlider("targetX", target.x);
    setSlider("targetY", target.y);
  }
}

function mouseReleased() {
  if (activeButton) {
    handleButton(activeButton);
  }

  activeSlider = null;
  activeButton = null;
  dragging = null;
}

function handleButton(id) {
  if (id === "solution") {
    showSolution();
  }

  if (id === "test") {
    testCommand();
  }

  if (id === "theta") {
    animatingTheta = !animatingTheta;
    const btn = getButton("theta");
    btn.label = animatingTheta ? "Pause θ" : "Animer θ";
  }

  if (id === "reset") {
    resetScene();
  }

  if (id === "random") {
    randomChallenge();
  }

  if (id === "undo") {
    undoMove();
  }
}

function getButton(id) {
  for (let b of buttons) {
    if (b.id === id) return b;
  }
  return null;
}

function showSolution() {
  const data = computeChangeOfBasis();

  setSlider("cmdX", data.localX);
  setSlider("cmdY", data.localY);
}

function testCommand() {
  oldRobot = { x: robot.x, y: robot.y };

  const data = computeChangeOfBasis();

  moveAnim = {
    t: 0,
    duration: 55,
    startX: robot.x,
    startY: robot.y,
    endX: constrain(data.predictedX, -6, 6),
    endY: constrain(data.predictedY, -3, 3)
  };
}

function updateMoveAnimation() {
  if (!moveAnim) return;

  moveAnim.t++;
  const u = constrain(moveAnim.t / moveAnim.duration, 0, 1);
  const eased = 1 - Math.pow(1 - u, 3);

  robot.x = lerp(moveAnim.startX, moveAnim.endX, eased);
  robot.y = lerp(moveAnim.startY, moveAnim.endY, eased);

  setSlider("robotX", robot.x);
  setSlider("robotY", robot.y);

  if (frameCount % 3 === 0) pushTrail();

  if (u >= 1) {
    robot.x = moveAnim.endX;
    robot.y = moveAnim.endY;

    setSlider("robotX", robot.x);
    setSlider("robotY", robot.y);

    moveAnim = null;
    pushTrail();
  }
}

function undoMove() {
  robot.x = oldRobot.x;
  robot.y = oldRobot.y;

  setSlider("robotX", robot.x);
  setSlider("robotY", robot.y);

  moveAnim = null;
  pushTrail();
}

function resetScene() {
  robot = { x: -3, y: -1, theta: 35 };
  target = { x: 4, y: 2 };
  oldRobot = { x: robot.x, y: robot.y };

  setSlider("robotX", robot.x);
  setSlider("robotY", robot.y);
  setSlider("theta", robot.theta);

  setSlider("targetX", target.x);
  setSlider("targetY", target.y);

  setSlider("cmdX", 0);
  setSlider("cmdY", 0);

  animatingTheta = false;
  getButton("theta").label = "Animer θ";

  moveAnim = null;
  trail = [];
  pushTrail();
}

function randomChallenge() {
  robot.x = roundTo(random(-5, 1), 0.1);
  robot.y = roundTo(random(-2.5, 2.5), 0.1);
  robot.theta = Math.round(random(-170, 170));

  target.x = roundTo(random(-1, 5.5), 0.1);
  target.y = roundTo(random(-2.5, 2.5), 0.1);

  oldRobot = { x: robot.x, y: robot.y };

  setSlider("robotX", robot.x);
  setSlider("robotY", robot.y);
  setSlider("theta", robot.theta);

  setSlider("targetX", target.x);
  setSlider("targetY", target.y);

  setSlider("cmdX", 0);
  setSlider("cmdY", 0);

  moveAnim = null;
  trail = [];
  pushTrail();
}

function pushTrail() {
  const last = trail[trail.length - 1];

  if (!last || dist(last.x, last.y, robot.x, robot.y) > 0.05) {
    trail.push({ x: robot.x, y: robot.y });
  }

  if (trail.length > 80) {
    trail.shift();
  }
}

function drawArrow(x1, y1, x2, y2, col, weight) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 8 + weight;

  stroke(...col);
  strokeWeight(weight);
  line(x1, y1, x2, y2);

  push();
  translate(x2, y2);
  rotate(a);
  fill(...col);
  noStroke();
  triangle(0, 0, -head, head * 0.45, -head, -head * 0.45);
  pop();
}

function wx(x) {
  return PLOT_X + PLOT_W / 2 + x * UNIT;
}

function wy(y) {
  return PLOT_Y + PLOT_H / 2 - y * UNIT;
}

function screenToWorld(px, py) {
  return {
    x: (px - (PLOT_X + PLOT_W / 2)) / UNIT,
    y: ((PLOT_Y + PLOT_H / 2) - py) / UNIT
  };
}

function roundTo(v, step) {
  return Math.round(v / step) * step;
}

function inside(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}
