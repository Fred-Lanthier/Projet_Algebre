let sliders = [];
let buttons = [];
let activeSlider = null;
let pressedButton = null;
let draggingTestPoint = false;

const W = 860;
const H = 1020;

const PLOT_X = 25;
const PLOT_Y = 70;
const PLOT_W = 810;
const PLOT_H = 462;

const CONTROL_X = 25;
const CONTROL_Y = 544;
const CONTROL_W = 810;
const CONTROL_H = 170;

const INFO_X = 25;
const INFO_Y = 726;
const INFO_W = 810;
const INFO_H = 162;

const FEEDBACK_X = 25;
const FEEDBACK_Y = 900;
const FEEDBACK_W = 810;
const FEEDBACK_H = 100;

const WORLD_X_MIN = -7;
const WORLD_X_MAX = 7;
const WORLD_Y_MIN = -4;
const WORLD_Y_MAX = 4;
const REFERENCE_COUNT = 42;

const COLORS = {
  ink: [23, 35, 55],
  muted: [92, 107, 128],
  border: [207, 218, 231],
  grid: [226, 233, 242],
  blue: [37, 99, 235],
  blueDark: [29, 78, 216],
  blueSoft: [219, 234, 254],
  cyan: [8, 145, 178],
  violet: [124, 58, 237],
  green: [22, 163, 74],
  greenSoft: [220, 252, 231],
  amber: [217, 119, 6],
  amberSoft: [254, 243, 199],
  red: [220, 38, 38],
  redSoft: [254, 226, 226]
};

let referenceLatent = [];
let referencePoints = [];
let testPoints = [];
let selectedTest = 1;

let model = null;
let confidence = 0.95;
let cloudWidth = 0.38;
let trueAngle = 0;
let trueCenter = { x: 0, y: 0 };
let caseIndex = 0;
let rngState = 1;
let showAllProjections = true;
let statusMessage = "Fais glisser un point test hors de la tendance principale.";

function setup() {
  if (typeof removeElements === "function") {
    removeElements();
  }

  createCanvas(W, H);
  textFont("monospace");
  strokeCap(ROUND);
  resetActivity();
}

function draw() {
  background(241, 245, 249);
  updateAnimation();
  drawHeader();
  drawPlotPanel();
  drawControlPanel();
  drawInformationPanel();
  drawFeedbackPanel();
  drawUI();
}

function resetActivity() {
  confidence = 0.95;
  cloudWidth = 0.38;
  caseIndex = 0;
  selectedTest = 1;
  showAllProjections = true;
  activeSlider = null;
  pressedButton = null;
  draggingTestPoint = false;
  statusMessage = "La SVD apprend l'orientation et les deux echelles de la gaussienne.";
  setupUI();
  generateCase();
}

function setupUI() {
  sliders = [];
  buttons = [];

  addSlider("confidence", "Confiance", 45, 190, 605, 300, 0.80, 0.99, confidence, 0.01);
  addSlider("width", "Bruit transverse", 45, 190, 660, 300, 0.10, 1.10, cloudWidth, 0.05);

  addButton("projections", "Masquer composantes", 548, 584, 132, 38, true);
  addButton("new", "Nouveau nuage", 693, 584, 122, 38, false);
  addButton("reset", "Reinitialiser", 548, 638, 132, 38, false);
  addButton("demo", "Placer anomalie", 693, 638, 122, 38, false);
}

function addSlider(id, label, labelX, trackX, y, w, minVal, maxVal, value, step) {
  sliders.push({
    id: id,
    label: label,
    labelX: labelX,
    trackX: trackX,
    y: y,
    w: w,
    minVal: minVal,
    maxVal: maxVal,
    value: value,
    step: step
  });
}

function addButton(id, label, x, y, w, h, primary) {
  buttons.push({
    id: id,
    label: label,
    x: x,
    y: y,
    w: w,
    h: h,
    primary: primary
  });
}

function generateCase() {
  rngState = 1847 + (caseIndex + 2) * 7919;
  const angleChoices = [0.50, -0.38, 0.78, -0.66, 0.27];
  trueAngle = angleChoices[caseIndex % angleChoices.length];
  trueCenter = {
    x: -0.45 + 0.9 * seededRandom(),
    y: -0.25 + 0.5 * seededRandom()
  };

  referenceLatent = [];
  for (let i = 0; i < REFERENCE_COUNT; i++) {
    let along = gaussianRandom() * 2.05;
    let across = gaussianRandom();
    along = clamp(along, -4.7, 4.7);
    across = clamp(across, -2.2, 2.2);
    referenceLatent.push({ along: along, across: across });
  }

  rebuildReferencePoints(false);
  createTestPoints();
  updateDynamicLabels();
}

function rebuildReferencePoints(keepDisplay) {
  const direction = { x: Math.cos(trueAngle), y: Math.sin(trueAngle) };
  const normal = { x: -direction.y, y: direction.x };
  const previous = referencePoints;
  referencePoints = [];

  for (let i = 0; i < referenceLatent.length; i++) {
    const latent = referenceLatent[i];
    const x = trueCenter.x + latent.along * direction.x + latent.across * cloudWidth * normal.x;
    const y = trueCenter.y + latent.along * direction.y + latent.across * cloudWidth * normal.y;
    const oldPoint = previous[i];
    referencePoints.push({
      x: x,
      y: y,
      displayX: keepDisplay && oldPoint ? oldPoint.displayX : x,
      displayY: keepDisplay && oldPoint ? oldPoint.displayY : y
    });
  }

  computeSVDModel();
}

function createTestPoints() {
  const standardizedTests = [
    { z1: -1.90, z2: 0.25, label: "A" },
    { z1: 0.70, z2: 2.90, label: "B" },
    { z1: 2.85, z2: 0.15, label: "C" },
    { z1: -0.80, z2: -1.25, label: "D" }
  ];

  testPoints = [];
  for (let i = 0; i < standardizedTests.length; i++) {
    const item = standardizedTests[i];
    const along = item.z1 * model.std1;
    const across = item.z2 * model.std2;
    const x = model.mean.x + along * model.v1.x + across * model.v2.x;
    const y = model.mean.y + along * model.v1.y + across * model.v2.y;
    testPoints.push({
      x: clamp(x, WORLD_X_MIN + 0.2, WORLD_X_MAX - 0.2),
      y: clamp(y, WORLD_Y_MIN + 0.2, WORLD_Y_MAX - 0.2),
      displayX: clamp(x, WORLD_X_MIN + 0.2, WORLD_X_MAX - 0.2),
      displayY: clamp(y, WORLD_Y_MIN + 0.2, WORLD_Y_MAX - 0.2),
      label: item.label
    });
  }
}

function computeSVDModel() {
  if (referencePoints.length === 0) return;

  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < referencePoints.length; i++) {
    meanX += referencePoints[i].x;
    meanY += referencePoints[i].y;
  }
  meanX /= referencePoints.length;
  meanY /= referencePoints.length;

  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (let i = 0; i < referencePoints.length; i++) {
    const dx = referencePoints[i].x - meanX;
    const dy = referencePoints[i].y - meanY;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }

  const trace = xx + yy;
  const discriminant = Math.sqrt(Math.max(0, (xx - yy) * (xx - yy) + 4 * xy * xy));
  const lambda1 = Math.max(0, (trace + discriminant) / 2);
  const lambda2 = Math.max(0, (trace - discriminant) / 2);
  let angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  let v1 = { x: Math.cos(angle), y: Math.sin(angle) };

  if (v1.x < 0) {
    v1.x *= -1;
    v1.y *= -1;
    angle += Math.PI;
  }

  const v2 = { x: -v1.y, y: v1.x };
  const sigma1 = Math.sqrt(lambda1);
  const sigma2 = Math.sqrt(lambda2);
  const sampleDivisor = Math.max(1, referencePoints.length - 1);
  const divisor = Math.sqrt(sampleDivisor);
  const std1 = Math.max(1e-6, sigma1 / divisor);
  const std2 = Math.max(1e-6, sigma2 / divisor);
  const tau = Math.sqrt(-2 * Math.log(Math.max(1e-9, 1 - confidence)));
  const u1 = [];
  const u2 = [];
  let reconstructionSquaredError = 0;

  for (let i = 0; i < referencePoints.length; i++) {
    const dx = referencePoints[i].x - meanX;
    const dy = referencePoints[i].y - meanY;
    const left1 = sigma1 > 1e-12 ? (dx * v1.x + dy * v1.y) / sigma1 : 0;
    const left2 = sigma2 > 1e-12 ? (dx * v2.x + dy * v2.y) / sigma2 : 0;
    u1.push(left1);
    u2.push(left2);

    const reconstructedX = sigma1 * left1 * v1.x + sigma2 * left2 * v2.x;
    const reconstructedY = sigma1 * left1 * v1.y + sigma2 * left2 * v2.y;
    reconstructionSquaredError += (dx - reconstructedX) * (dx - reconstructedX) +
      (dy - reconstructedY) * (dy - reconstructedY);
  }

  model = {
    mean: { x: meanX, y: meanY },
    v1: v1,
    v2: v2,
    sigma1: sigma1,
    sigma2: sigma2,
    std1: std1,
    std2: std2,
    tau: tau,
    radius1: tau * std1,
    radius2: tau * std2,
    covariance: {
      xx: xx / sampleDivisor,
      xy: xy / sampleDivisor,
      yy: yy / sampleDivisor
    },
    U: {
      column1: u1,
      column2: u2
    },
    reconstructionError: Math.sqrt(reconstructionSquaredError),
    angle: angle
  };
}

function analyzePoint(point) {
  const dx = point.x - model.mean.x;
  const dy = point.y - model.mean.y;
  const coefficient1 = dx * model.v1.x + dy * model.v1.y;
  const coefficient2 = dx * model.v2.x + dy * model.v2.y;
  const projection = {
    x: model.mean.x + coefficient1 * model.v1.x,
    y: model.mean.y + coefficient1 * model.v1.y
  };
  const residual = {
    x: point.x - projection.x,
    y: point.y - projection.y
  };
  const z1 = coefficient1 / model.std1;
  const z2 = coefficient2 / model.std2;
  const score = Math.sqrt(z1 * z1 + z2 * z2);
  const distanceToMean = Math.sqrt(dx * dx + dy * dy);
  const relativeDensity = Math.exp(-0.5 * score * score);

  return {
    coefficient1: coefficient1,
    coefficient2: coefficient2,
    z1: z1,
    z2: z2,
    projection: projection,
    residual: residual,
    score: score,
    distanceToMean: distanceToMean,
    relativeDensity: relativeDensity,
    anomaly: score > model.tau
  };
}

function updateAnimation() {
  for (let i = 0; i < referencePoints.length; i++) {
    const point = referencePoints[i];
    point.displayX = mix(point.displayX, point.x, 0.16);
    point.displayY = mix(point.displayY, point.y, 0.16);
  }

  for (let i = 0; i < testPoints.length; i++) {
    const point = testPoints[i];
    const speed = draggingTestPoint && i === selectedTest ? 1 : 0.25;
    point.displayX = mix(point.displayX, point.x, speed);
    point.displayY = mix(point.displayY, point.y, speed);
  }
}

function drawHeader() {
  noStroke();
  fillColor(COLORS.ink);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(23);
  text("Le Detecteur SVD gaussien", 25, 25);

  textStyle(NORMAL);
  textSize(11);
  fillColor(COLORS.muted);
  text("La SVD oriente une gaussienne 2D; Mahalanobis detecte les ecarts sur v1 et v2", 25, 49);

  drawPill("X = U Sigma V^T", 671, 18, 164, 28, COLORS.blueSoft, COLORS.blueDark);
}

function drawPlotPanel() {
  drawPanel(PLOT_X, PLOT_Y, PLOT_W, PLOT_H, 12);

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(PLOT_X + 1, PLOT_Y + 1, PLOT_W - 2, PLOT_H - 2);
  drawingContext.clip();
  drawGrid();
  drawGaussianContours();
  drawPrincipalAxes();
  drawReferenceCloud();
  drawTestPointProjections();
  drawTestPoints();
  drawingContext.restore();
  pop();

  drawPlotLabels();
}

function drawGrid() {
  strokeColor(COLORS.grid);
  strokeWeight(1);

  for (let x = Math.ceil(WORLD_X_MIN); x <= WORLD_X_MAX; x++) {
    const sx = wx(x);
    line(sx, PLOT_Y + 1, sx, PLOT_Y + PLOT_H - 1);
  }

  for (let y = Math.ceil(WORLD_Y_MIN); y <= WORLD_Y_MAX; y++) {
    const sy = wy(y);
    line(PLOT_X + 1, sy, PLOT_X + PLOT_W - 1, sy);
  }

  stroke(173, 187, 205);
  strokeWeight(1.2);
  line(wx(0), PLOT_Y + 1, wx(0), PLOT_Y + PLOT_H - 1);
  line(PLOT_X + 1, wy(0), PLOT_X + PLOT_W - 1, wy(0));
}

function drawGaussianContours() {
  const levels = [model.tau, 0.80 * model.tau, 0.60 * model.tau, 0.40 * model.tau, 0.20 * model.tau];
  const alphas = [16, 22, 30, 40, 52];

  for (let i = 0; i < levels.length; i++) {
    noStroke();
    fill(COLORS.blue[0], COLORS.blue[1], COLORS.blue[2], alphas[i]);
    drawGaussianEllipse(levels[i]);
  }

  noFill();
  strokeColor(COLORS.blueDark);
  strokeWeight(2.2);
  drawGaussianEllipse(model.tau);

  const pulseLevel = 0.45 + 0.30 * (1 + Math.sin(frameCount * 0.035));
  stroke(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2], 90);
  strokeWeight(1.4);
  drawGaussianEllipse(pulseLevel * model.tau);
}

function drawGaussianEllipse(level) {
  beginShape();
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const angle = 2 * Math.PI * i / steps;
    const along = level * model.std1 * Math.cos(angle);
    const across = level * model.std2 * Math.sin(angle);
    const x = model.mean.x + along * model.v1.x + across * model.v2.x;
    const y = model.mean.y + along * model.v1.y + across * model.v2.y;
    vertex(wx(x), wy(y));
  }
  endShape(CLOSE);
}

function drawPrincipalAxes() {
  const mainLine = lineRectEndpoints(0);
  if (mainLine) {
    strokeColor(COLORS.blueDark);
    strokeWeight(2.5);
    line(wx(mainLine.a.x), wy(mainLine.a.y), wx(mainLine.b.x), wy(mainLine.b.y));
  }

  const meanX = wx(model.mean.x);
  const meanY = wy(model.mean.y);
  const v1Length = 2.15;
  const v2Length = 1.25;

  drawVectorArrow(
    meanX,
    meanY,
    wx(model.mean.x + v1Length * model.v1.x),
    wy(model.mean.y + v1Length * model.v1.y),
    COLORS.blueDark,
    "v1"
  );

  drawVectorArrow(
    meanX,
    meanY,
    wx(model.mean.x + v2Length * model.v2.x),
    wy(model.mean.y + v2Length * model.v2.y),
    COLORS.violet,
    "v2"
  );

  noStroke();
  fill(255);
  circle(meanX, meanY, 15);
  fillColor(COLORS.ink);
  circle(meanX, meanY, 7);

  fillColor(COLORS.ink);
  textAlign(LEFT, BOTTOM);
  textStyle(BOLD);
  textSize(9);
  text("moyenne", meanX + 9, meanY - 8);
}

function drawReferenceCloud() {
  noStroke();
  for (let i = 0; i < referencePoints.length; i++) {
    const point = referencePoints[i];
    fill(COLORS.blue[0], COLORS.blue[1], COLORS.blue[2], 125);
    circle(wx(point.displayX), wy(point.displayY), 8);
  }
}

function drawTestPointProjections() {
  for (let i = 0; i < testPoints.length; i++) {
    if (!showAllProjections && i !== selectedTest) continue;

    const point = testPoints[i];
    const analysis = analyzePoint(point);
    const color = analysis.anomaly ? COLORS.red : COLORS.green;
    const alpha = i === selectedTest ? 220 : 100;
    const pointX = wx(point.displayX);
    const pointY = wy(point.displayY);
    const projectionX = wx(analysis.projection.x);
    const projectionY = wy(analysis.projection.y);
    const meanX = wx(model.mean.x);
    const meanY = wy(model.mean.y);

    if (i === selectedTest) {
      stroke(COLORS.blueDark[0], COLORS.blueDark[1], COLORS.blueDark[2], 175);
      strokeWeight(2.2);
      drawDashedLine(meanX, meanY, projectionX, projectionY, 7, 5);
    }

    stroke(color[0], color[1], color[2], alpha);
    strokeWeight(i === selectedTest ? 2.5 : 1.4);
    drawDashedLine(pointX, pointY, projectionX, projectionY, 6, 5);

    noStroke();
    fill(color[0], color[1], color[2], alpha);
    circle(projectionX, projectionY, i === selectedTest ? 9 : 6);

    if (i === selectedTest) {
      const alongMidX = (meanX + projectionX) / 2;
      const alongMidY = (meanY + projectionY) / 2;
      const acrossMidX = (pointX + projectionX) / 2;
      const acrossMidY = (pointY + projectionY) / 2;
      drawValueTag("z1 = " + analysis.z1.toFixed(2), alongMidX + 8, alongMidY - 8, COLORS.blueDark);
      drawValueTag("z2 = " + analysis.z2.toFixed(2), acrossMidX + 8, acrossMidY - 8, color);
    }
  }
}

function drawTestPoints() {
  for (let i = 0; i < testPoints.length; i++) {
    const point = testPoints[i];
    const analysis = analyzePoint(point);
    const color = analysis.anomaly ? COLORS.red : COLORS.green;
    const sx = wx(point.displayX);
    const sy = wy(point.displayY);
    const selected = i === selectedTest;
    const pulse = selected ? 2 + 2 * Math.sin(frameCount * 0.09) : 0;

    if (selected) {
      noFill();
      stroke(color[0], color[1], color[2], 70);
      strokeWeight(3);
      circle(sx, sy, 29 + pulse);
    }

    noStroke();
    fill(255);
    circle(sx, sy, selected ? 22 : 18);
    fillColor(color);
    circle(sx, sy, selected ? 15 : 12);

    fillColor(COLORS.ink);
    textAlign(CENTER, BOTTOM);
    textStyle(BOLD);
    textSize(10);
    text(point.label, sx, sy - 13);
  }
}

function drawPlotLabels() {
  noStroke();
  fill(255, 255, 255, 230);
  rect(PLOT_X + 14, PLOT_Y + 13, 236, 49, 8);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(11);
  fillColor(COLORS.ink);
  text("Gaussienne apprise par SVD", PLOT_X + 27, PLOT_Y + 29);
  textStyle(NORMAL);
  textSize(9);
  fillColor(COLORS.muted);
  text("Contours elliptiques; bord externe = decision", PLOT_X + 27, PLOT_Y + 47);

  let anomalyCount = 0;
  for (let i = 0; i < testPoints.length; i++) {
    if (analyzePoint(testPoints[i]).anomaly) anomalyCount++;
  }
  drawPill(anomalyCount + " anomalie" + (anomalyCount === 1 ? "" : "s"), PLOT_X + PLOT_W - 142, PLOT_Y + 15, 122, 27,
    anomalyCount > 0 ? COLORS.redSoft : COLORS.greenSoft,
    anomalyCount > 0 ? COLORS.red : COLORS.green);

  drawPill("tau auto " + model.tau.toFixed(2), PLOT_X + PLOT_W - 142, PLOT_Y + 48, 122, 24,
    COLORS.blueSoft, COLORS.blueDark);

  textAlign(RIGHT, BOTTOM);
  textStyle(NORMAL);
  textSize(9);
  fillColor(COLORS.muted);
  text("Clique ou glisse un point test A-D", PLOT_X + PLOT_W - 18, PLOT_Y + PLOT_H - 13);
}

function drawControlPanel() {
  drawPanel(CONTROL_X, CONTROL_Y, CONTROL_W, CONTROL_H, 12);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(13);
  fillColor(COLORS.ink);
  text("Experimenter", 45, CONTROL_Y + 21);

  textStyle(NORMAL);
  textSize(9);
  fillColor(COLORS.muted);
  text("La confiance fixe une probabilite; tau et l'ellipse sont calcules automatiquement.", 45, CONTROL_Y + 40);
}

function drawInformationPanel() {
  drawPanel(INFO_X, INFO_Y, INFO_W, INFO_H, 12);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(13);
  fillColor(COLORS.ink);
  text("Ce que calcule la SVD", 45, INFO_Y + 20);

  drawMetricCard(45, INFO_Y + 38, 180, 63, "sigma1", model.sigma1.toFixed(2), "ecart-type s1 = " + model.std1.toFixed(2), COLORS.blue);
  drawMetricCard(237, INFO_Y + 38, 180, 63, "sigma2", model.sigma2.toFixed(2), "ecart-type s2 = " + model.std2.toFixed(2), COLORS.violet);
  drawMetricCard(429, INFO_Y + 38, 190, 63, "Confiance gaussienne", formatPercent(confidence), "tau auto = " + model.tau.toFixed(2), COLORS.cyan);

  const selectedAnalysis = analyzePoint(testPoints[selectedTest]);
  drawMetricCard(631, INFO_Y + 38, 184, 63, "Distance d_M du point " + testPoints[selectedTest].label,
    selectedAnalysis.score.toFixed(2), "tau " + model.tau.toFixed(2) + " | densite " + formatPercent(selectedAnalysis.relativeDensity),
    selectedAnalysis.anomaly ? COLORS.red : COLORS.green);

  textStyle(BOLD);
  textSize(10);
  fillColor(COLORS.ink);
  text("v1 = " + formatVector(model.v1), 45, INFO_Y + 121);
  text("v2 = " + formatVector(model.v2), 300, INFO_Y + 121);
  text("v1 . v2 = " + dotProduct(model.v1, model.v2).toFixed(3), 555, INFO_Y + 121);

  textStyle(NORMAL);
  textSize(9);
  fillColor(COLORS.muted);
  text("X^T X = V Sigma^2 V^T;  d_M^2 = (c1/s1)^2 + (c2/s2)^2;  tau vient du khi-deux.", 45, INFO_Y + 143);
}

function drawFeedbackPanel() {
  const point = testPoints[selectedTest];
  const analysis = analyzePoint(point);
  const backgroundColor = analysis.anomaly ? COLORS.redSoft : COLORS.greenSoft;
  const accent = analysis.anomaly ? COLORS.red : COLORS.green;
  const ratio = analysis.score / model.tau;

  noStroke();
  fillColor(backgroundColor);
  rect(FEEDBACK_X, FEEDBACK_Y, FEEDBACK_W, FEEDBACK_H, 12);
  fillColor(accent);
  circle(FEEDBACK_X + 22, FEEDBACK_Y + 27, 13);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(13);
  fillColor(COLORS.ink);
  text(analysis.anomaly ? "Point " + point.label + " detecte comme anomalie" : "Point " + point.label + " explique par le modele", FEEDBACK_X + 38, FEEDBACK_Y + 26);

  textStyle(NORMAL);
  textSize(10);
  fillColor(COLORS.ink);
  text("d_M = " + analysis.score.toFixed(2) + ", tau auto = " + model.tau.toFixed(2) +
    ", score/tau = " + ratio.toFixed(2) + ". " + getPedagogicalMessage(analysis), FEEDBACK_X + 20, FEEDBACK_Y + 53);

  fillColor(COLORS.muted);
  text(statusMessage, FEEDBACK_X + 20, FEEDBACK_Y + 77);
}

function getPedagogicalMessage(analysis) {
  if (analysis.anomaly) {
    if (Math.abs(analysis.z1) >= Math.abs(analysis.z2)) {
      return "L'ecart normalise selon v1 domine : anomalie longitudinale.";
    }
    return "L'ecart normalise selon v2 domine : anomalie transverse.";
  }
  return "Ses deux coordonnees normalisees restent dans l'ellipse.";
}

function drawUI() {
  for (let i = 0; i < sliders.length; i++) drawSlider(sliders[i]);
  for (let i = 0; i < buttons.length; i++) drawButton(buttons[i]);
}

function drawSlider(slider) {
  const t = (slider.value - slider.minVal) / (slider.maxVal - slider.minVal);
  const knobX = slider.trackX + t * slider.w;

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(10);
  fillColor(COLORS.ink);
  text(slider.label, slider.labelX, slider.y);

  stroke(203, 213, 225);
  strokeWeight(6);
  line(slider.trackX, slider.y, slider.trackX + slider.w, slider.y);
  strokeColor(COLORS.blue);
  line(slider.trackX, slider.y, knobX, slider.y);

  noStroke();
  fill(255);
  circle(knobX, slider.y, 19);
  fillColor(COLORS.blue);
  circle(knobX, slider.y, 11);

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(12);
  fillColor(COLORS.blueDark);
  const valueLabel = slider.id === "confidence" ? formatPercent(slider.value) : slider.value.toFixed(2);
  text(valueLabel, slider.trackX + slider.w + 16, slider.y);

  textStyle(NORMAL);
  textSize(8);
  fillColor(COLORS.muted);
  const minLabel = slider.id === "confidence" ? formatPercent(slider.minVal) : slider.minVal.toFixed(1);
  const maxLabel = slider.id === "confidence" ? formatPercent(slider.maxVal) : slider.maxVal.toFixed(1);
  text(minLabel, slider.trackX, slider.y + 15);
  textAlign(RIGHT, CENTER);
  text(maxLabel, slider.trackX + slider.w, slider.y + 15);
}

function drawButton(button) {
  const hovering = pointInRect(mouseX, mouseY, button.x, button.y, button.w, button.h);
  const pressed = pressedButton === button.id;

  noStroke();
  if (button.primary) {
    if (pressed) fillColor(COLORS.blueDark);
    else if (hovering) fill(59, 130, 246);
    else fillColor(COLORS.blue);
  } else {
    if (pressed) fill(226, 232, 240);
    else if (hovering) fill(248, 250, 252);
    else fill(255);
  }
  rect(button.x, button.y, button.w, button.h, 8);

  if (!button.primary) {
    noFill();
    stroke(190, 201, 216);
    strokeWeight(1);
    rect(button.x, button.y, button.w, button.h, 8);
  }

  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(9);
  if (button.primary) fill(255);
  else fillColor(COLORS.ink);
  text(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
}

function mousePressed() {
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    if (pointInRect(mouseX, mouseY, button.x, button.y, button.w, button.h)) {
      pressedButton = button.id;
      return false;
    }
  }

  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (mouseX >= slider.trackX - 12 && mouseX <= slider.trackX + slider.w + 12 &&
        mouseY >= slider.y - 17 && mouseY <= slider.y + 17) {
      activeSlider = slider.id;
      updateSliderFromMouse(slider);
      return false;
    }
  }

  if (pointInRect(mouseX, mouseY, PLOT_X, PLOT_Y, PLOT_W, PLOT_H)) {
    let nearest = -1;
    let nearestDistance = 24;
    for (let i = 0; i < testPoints.length; i++) {
      const dx = mouseX - wx(testPoints[i].displayX);
      const dy = mouseY - wy(testPoints[i].displayY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < nearestDistance) {
        nearest = i;
        nearestDistance = distance;
      }
    }

    if (nearest >= 0) {
      selectedTest = nearest;
      statusMessage = "Point " + testPoints[selectedTest].label + " selectionne : glisse-le pour tester le modele.";
    } else {
      moveSelectedPointToMouse();
      statusMessage = "Point " + testPoints[selectedTest].label + " deplace : son score est recalcule en direct.";
    }
    draggingTestPoint = true;
    return false;
  }

  return false;
}

function mouseDragged() {
  if (activeSlider !== null) {
    const slider = getSlider(activeSlider);
    if (slider) updateSliderFromMouse(slider);
  } else if (draggingTestPoint) {
    moveSelectedPointToMouse();
  }
  return false;
}

function mouseReleased() {
  if (pressedButton !== null) {
    const button = getButton(pressedButton);
    if (button && pointInRect(mouseX, mouseY, button.x, button.y, button.w, button.h)) {
      runButtonAction(button.id);
    }
  }

  activeSlider = null;
  pressedButton = null;
  draggingTestPoint = false;
  return false;
}

function moveSelectedPointToMouse() {
  const world = screenToWorld(mouseX, mouseY);
  const point = testPoints[selectedTest];
  point.x = clamp(world.x, WORLD_X_MIN + 0.12, WORLD_X_MAX - 0.12);
  point.y = clamp(world.y, WORLD_Y_MIN + 0.12, WORLD_Y_MAX - 0.12);
  point.displayX = point.x;
  point.displayY = point.y;
}

function updateSliderFromMouse(slider) {
  const t = clamp((mouseX - slider.trackX) / slider.w, 0, 1);
  const raw = slider.minVal + t * (slider.maxVal - slider.minVal);
  const stepped = Math.round(raw / slider.step) * slider.step;
  const value = clamp(stepped, slider.minVal, slider.maxVal);

  if (Math.abs(value - slider.value) < 1e-9) return;
  slider.value = value;

  if (slider.id === "confidence") {
    confidence = value;
    computeSVDModel();
    statusMessage = "tau = sqrt(-2 ln(1 - q)) est recalcule a partir de la confiance.";
  } else if (slider.id === "width") {
    cloudWidth = value;
    rebuildReferencePoints(true);
    statusMessage = "Le nuage s'elargit : sigma2 et le rayon de l'ellipse selon v2 augmentent.";
  }
}

function runButtonAction(id) {
  if (id === "projections") {
    showAllProjections = !showAllProjections;
    statusMessage = showAllProjections ?
      "Les composantes z1 et z2 de tous les points sont visibles." :
      "Seules les composantes du point selectionne restent visibles.";
    updateDynamicLabels();
  } else if (id === "new") {
    caseIndex++;
    selectedTest = 1;
    statusMessage = "Nouveau nuage : la SVD recalcule automatiquement v1, v2, sigma1 et sigma2.";
    generateCase();
  } else if (id === "reset") {
    resetActivity();
  } else if (id === "demo") {
    selectedTest = 1;
    const along = 0.55 * model.std1;
    const across = (model.tau + 0.70) * model.std2;
    const point = testPoints[selectedTest];
    point.x = model.mean.x + along * model.v1.x + across * model.v2.x;
    point.y = model.mean.y + along * model.v1.y + across * model.v2.y;
    point.x = clamp(point.x, WORLD_X_MIN + 0.2, WORLD_X_MAX - 0.2);
    point.y = clamp(point.y, WORLD_Y_MIN + 0.2, WORLD_Y_MAX - 0.2);
    statusMessage = "Le point B depasse le contour gaussien principalement selon v2.";
  }
}

function updateDynamicLabels() {
  const projectionButton = getButton("projections");
  if (projectionButton) {
    projectionButton.label = showAllProjections ? "Masquer composantes" : "Voir composantes";
  }

  const confidenceSlider = getSlider("confidence");
  if (confidenceSlider) confidenceSlider.value = confidence;
  const widthSlider = getSlider("width");
  if (widthSlider) widthSlider.value = cloudWidth;
}

function lineRectEndpoints(offset) {
  const origin = {
    x: model.mean.x + offset * model.v2.x,
    y: model.mean.y + offset * model.v2.y
  };
  let tMin = -1000;
  let tMax = 1000;

  const xInterval = directionInterval(origin.x, model.v1.x, WORLD_X_MIN, WORLD_X_MAX);
  const yInterval = directionInterval(origin.y, model.v1.y, WORLD_Y_MIN, WORLD_Y_MAX);
  if (!xInterval || !yInterval) return null;

  tMin = Math.max(tMin, xInterval.min, yInterval.min);
  tMax = Math.min(tMax, xInterval.max, yInterval.max);
  if (tMin > tMax) return null;

  return {
    a: { x: origin.x + tMin * model.v1.x, y: origin.y + tMin * model.v1.y },
    b: { x: origin.x + tMax * model.v1.x, y: origin.y + tMax * model.v1.y }
  };
}

function directionInterval(origin, direction, low, high) {
  if (Math.abs(direction) < 1e-10) {
    if (origin < low || origin > high) return null;
    return { min: -1000, max: 1000 };
  }
  const t1 = (low - origin) / direction;
  const t2 = (high - origin) / direction;
  return { min: Math.min(t1, t2), max: Math.max(t1, t2) };
}

function drawVectorArrow(x1, y1, x2, y2, color, label) {
  strokeColor(color);
  strokeWeight(3);
  line(x1, y1, x2, y2);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 9;
  noStroke();
  fillColor(color);
  triangle(
    x2,
    y2,
    x2 - size * Math.cos(angle - 0.48),
    y2 - size * Math.sin(angle - 0.48),
    x2 - size * Math.cos(angle + 0.48),
    y2 - size * Math.sin(angle + 0.48)
  );

  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(11);
  fillColor(color);
  text(label, x2 + 7, y2 - 7);
}

function drawDashedLine(x1, y1, x2, y2, dashLength, gapLength) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 0.001) return;

  const ux = dx / distance;
  const uy = dy / distance;
  const step = dashLength + gapLength;
  for (let start = 0; start < distance; start += step) {
    const end = Math.min(start + dashLength, distance);
    line(x1 + ux * start, y1 + uy * start, x1 + ux * end, y1 + uy * end);
  }
}

function drawValueTag(label, x, y, color) {
  const tagW = 95;
  const tagH = 21;
  noStroke();
  fill(255, 255, 255, 235);
  rect(x, y - tagH, tagW, tagH, 6);
  fillColor(color);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(8);
  text(label, x + tagW / 2, y - tagH / 2);
}

function drawMetricCard(x, y, w, h, label, value, detail, accent) {
  noStroke();
  fill(248, 250, 253);
  rect(x, y, w, h, 9);
  fillColor(accent);
  rect(x, y, 4, h, 9, 0, 0, 9);

  textAlign(LEFT, CENTER);
  textStyle(NORMAL);
  textSize(8);
  fillColor(COLORS.muted);
  text(label, x + 13, y + 13);

  textStyle(BOLD);
  textSize(16);
  fillColor(COLORS.ink);
  text(value, x + 13, y + 34);

  textStyle(NORMAL);
  textSize(8);
  fillColor(COLORS.muted);
  text(detail, x + 13, y + 52);
}

function drawPanel(x, y, w, h, radius) {
  noStroke();
  fill(255);
  rect(x, y, w, h, radius);
  noFill();
  strokeColor(COLORS.border);
  strokeWeight(1);
  rect(x, y, w, h, radius);
}

function drawPill(label, x, y, w, h, backgroundColor, textColor) {
  noStroke();
  fillColor(backgroundColor);
  rect(x, y, w, h, h / 2);
  fillColor(textColor);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(9);
  text(label, x + w / 2, y + h / 2 + 1);
}

function getSlider(id) {
  for (let i = 0; i < sliders.length; i++) {
    if (sliders[i].id === id) return sliders[i];
  }
  return null;
}

function getButton(id) {
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].id === id) return buttons[i];
  }
  return null;
}

function wx(x) {
  return PLOT_X + (x - WORLD_X_MIN) * PLOT_W / (WORLD_X_MAX - WORLD_X_MIN);
}

function wy(y) {
  return PLOT_Y + PLOT_H - (y - WORLD_Y_MIN) * PLOT_H / (WORLD_Y_MAX - WORLD_Y_MIN);
}

function screenToWorld(px, py) {
  return {
    x: WORLD_X_MIN + (px - PLOT_X) * (WORLD_X_MAX - WORLD_X_MIN) / PLOT_W,
    y: WORLD_Y_MIN + (PLOT_Y + PLOT_H - py) * (WORLD_Y_MAX - WORLD_Y_MIN) / PLOT_H
  };
}

function seededRandom() {
  rngState = (1664525 * rngState + 1013904223) >>> 0;
  return rngState / 4294967296;
}

function gaussianRandom() {
  const u1 = Math.max(1e-9, seededRandom());
  const u2 = seededRandom();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function pointInRect(px, py, x, y, w, h) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y;
}

function formatVector(vector) {
  return "(" + formatSigned(vector.x) + ", " + formatSigned(vector.y) + ")";
}

function formatSigned(value) {
  return (value >= 0 ? "+" : "") + value.toFixed(3);
}

function formatPercent(value) {
  return (100 * value).toFixed(value > 0.995 ? 1 : 0) + "%";
}

function fillColor(rgb) {
  fill(rgb[0], rgb[1], rgb[2]);
}

function strokeColor(rgb) {
  stroke(rgb[0], rgb[1], rgb[2]);
}
