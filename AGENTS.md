# AGENTS.md

## Objectif

Ce fichier définit les règles à respecter pour générer des fichiers **p5.js destinés à ALIVE Code**.

Le but est d'obtenir du code qui fonctionne du premier coup dans un widget ALIVE Code, sans problème de format, de téléchargement, de largeur, de superposition ou d'éléments inaccessibles.

Ces règles sont basées sur les contraintes observées pendant les tests dans ALIVE Code.

---

## 1. Format obligatoire : JavaScript p5.js pur

ALIVE Code doit recevoir du **JavaScript p5.js pur**.

Ne jamais fournir une page HTML complète pour ALIVE Code.

À éviter :

```html
<!DOCTYPE html>
<html>
<head>
  <script src="p5.js"></script>
</head>
<body>
</body>
</html>
```

Ce type de fichier peut fonctionner dans Chrome, mais pas dans ALIVE Code.

Erreur typique :

```text
SyntaxError: Unexpected token '<'
```

Cause :

```text
ALIVE Code essaie d'exécuter du HTML comme du JavaScript.
```

Format attendu :

```javascript
let variable = 0;

function setup() {
  createCanvas(860, 1000);
}

function draw() {
  background(255);
}
```

---

## 2. Ne pas inclure de balises HTML

Pour ALIVE Code, ne jamais inclure :

```text
<!DOCTYPE html>
<html>
<head>
<body>
<script>
<style>
```

Le code doit commencer directement par du JavaScript.

---

## 3. p5.js est supposé déjà chargé par ALIVE Code

Ne pas importer p5.js avec un CDN dans le fichier.

Ne pas écrire :

```javascript
import p5 from "p5";
```

Ne pas écrire :

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/..."></script>
```

Dans ALIVE Code, le sketch doit simplement utiliser les fonctions p5.js disponibles :

```javascript
createCanvas(...)
background(...)
line(...)
rect(...)
text(...)
mousePressed()
mouseDragged()
mouseReleased()
```

---

## 4. Toujours fournir le code dans un bloc copiable

Quand un fichier p5.js est demandé, fournir le code complet dans un vrai bloc Markdown :

````markdown
```javascript
// code complet ici
```
````

Ne pas donner seulement un lien de téléchargement.

Ne pas mettre le code comme du texte normal.

L'utilisateur doit pouvoir copier-coller directement le code dans ALIVE Code.

---

## 5. Largeur maximale à respecter

Le widget ALIVE Code observé a une largeur utile d'environ :

```text
866 px
```

Utiliser une largeur sécuritaire :

```javascript
const W = 860;
```

Ne pas dépasser 860 px de largeur pour le canvas.

À éviter :

```javascript
createCanvas(1120, 710);
```

car cela force une interface trop large, avec des zones coupées ou superposées.

---

## 6. Hauteur recommandée

Comme la largeur est limitée, utiliser une mise en page verticale.

La hauteur peut être plus grande si le widget permet de scroller.

Valeurs recommandées :

```javascript
const H = 980;
```

ou :

```javascript
const H = 1020;
```

Ne pas essayer de mettre visualisation, contrôles, formules et feedback dans seulement 500 ou 600 px de hauteur.

---

## 7. Mise en page recommandée

Pour un canvas de 860 px de largeur, utiliser une structure verticale claire :

```text
0-50       : titre
50-480     : visualisation principale
510-785    : contrôles
805-950    : calculs / explications
965-1005   : statut / feedback
```

Exemple de constantes :

```javascript
const W = 860;
const H = 1020;

const PLOT_X = 30;
const PLOT_Y = 50;
const PLOT_W = 800;
const PLOT_H = 430;
```

---

## 8. Éviter les interfaces côte à côte trop larges

Ne pas mettre un grand graphe à gauche et un grand panneau de contrôle à droite dans un canvas de 860 px.

Cela cause :

```text
- texte superposé ;
- sliders coupés ;
- boutons inaccessibles ;
- panneaux trop serrés ;
- éléments qui débordent.
```

Préférer :

```text
graphe en haut
contrôles en bas
calculs sous les contrôles
statut sous les calculs
```

---

## 9. Éviter les éléments DOM pour les interfaces complexes

Les fonctions suivantes créent des éléments HTML séparés du canvas :

```javascript
createSlider()
createButton()
createDiv()
createInput()
```

Dans ALIVE Code, ces éléments peuvent se superposer au canvas ou aux textes dessinés.

Même si cela peut fonctionner dans un exemple simple, ce n'est pas fiable pour une activité complexe.

Règle par défaut :

```text
Pour une activité propre dans ALIVE Code, dessiner les sliders et boutons directement dans le canvas.
```

Utiliser :

```javascript
line()
circle()
rect()
text()
```

pour dessiner l'interface.

Utiliser :

```javascript
mousePressed()
mouseDragged()
mouseReleased()
```

pour gérer les interactions.

---

## 10. Nettoyer les anciens éléments HTML

Si des versions précédentes ont utilisé `createSlider()`, `createButton()` ou `createDiv()`, des éléments HTML peuvent rester dans le widget après relance.

Ajouter au début de `setup()` :

```javascript
function setup() {
  if (typeof removeElements === "function") {
    removeElements();
  }

  createCanvas(W, H);
}
```

Même si la version finale n'utilise pas d'éléments DOM, cela aide à nettoyer les anciens essais.

---

## 11. Interface custom recommandée

Utiliser des tableaux pour stocker les sliders et les boutons.

Exemple de slider custom :

```javascript
let sliders = [];

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
```

Exemple de bouton custom :

```javascript
let buttons = [];

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
```

---

## 12. Dessiner les sliders dans le canvas

Un slider custom doit être dessiné avec :

```javascript
text(...)     // label
line(...)     // track
line(...)     // portion active
circle(...)   // poignée
text(...)     // valeur numérique
```

Prévoir assez d'espace entre :

```text
label
track
valeur numérique
```

Exemple de dimensions raisonnables :

```javascript
labelX = x
trackX = x + 105
trackW = 210
valueX = trackX + trackW + 12
```

---

## 13. Dessiner les boutons dans le canvas

Un bouton custom doit être dessiné avec :

```javascript
rect(...)
text(...)
```

Dimensions recommandées :

```javascript
w = 105 à 130
h = 34 à 40
```

Éviter les boutons trop larges si plusieurs boutons sont sur la même ligne.

Toujours vérifier que :

```text
x + w <= 830
```

pour rester dans le canvas de largeur 860 avec une marge à droite.

---

## 14. Gérer les interactions souris

Les interactions doivent être gérées avec :

```javascript
function mousePressed() {}
function mouseDragged() {}
function mouseReleased() {}
```

Logique recommandée :

```text
1. Vérifier si un bouton est cliqué.
2. Vérifier si un slider est cliqué.
3. Vérifier si un objet de la scène est cliqué.
```

Cela évite les conflits entre déplacer un objet et utiliser un slider.

---

## 15. Structure de code recommandée

Organiser le fichier p5.js en sections :

```text
Variables globales
Constantes de layout
setup()
draw()
Calculs
Dessin de la scène
Dessin des panneaux
Dessin de l'interface custom
Interactions souris
Actions des boutons
Fonctions utilitaires
```

Cela rend le fichier plus facile à corriger.

---

## 16. Utiliser des constantes de layout

Ne pas disperser des nombres magiques partout.

Définir au début :

```javascript
const W = 860;
const H = 1020;

const PLOT_X = 30;
const PLOT_Y = 50;
const PLOT_W = 800;
const PLOT_H = 430;
```

Pour une scène 2D, définir aussi :

```javascript
const UNIT = 58;
```

ou une autre valeur adaptée.

---

## 17. Garder les objets dans les limites visibles

Si la scène utilise un repère 2D, limiter les coordonnées.

Exemple :

```javascript
x entre -6 et 6
y entre -3 et 3
```

Utiliser :

```javascript
constrain(...)
```

Exemple :

```javascript
robot.x = constrain(robot.x, -6, 6);
robot.y = constrain(robot.y, -3, 3);
```

---

## 18. Fonctions utiles pour les coordonnées

Pour une scène avec coordonnées monde/canvas, définir :

```javascript
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
```

Cela évite les erreurs de conversion et rend le code plus clair.

---

## 19. Toujours inclure un bouton Reset

Toute activité interactive doit inclure une façon de revenir à l'état initial.

Le bouton peut s'appeler :

```text
Reset
Réinitialiser
```

La fonction doit remettre :

```text
- les variables principales ;
- les sliders ;
- les animations ;
- les états temporaires ;
- les traces si nécessaire.
```

---

## 20. Prévoir un état initial clair

Le sketch doit être utilisable immédiatement après collage.

Inclure des valeurs initiales raisonnables :

```javascript
let robot = { x: -3, y: -1, theta: 35 };
let target = { x: 4, y: 2 };
```

ou des valeurs équivalentes selon l'activité.

---

## 21. Toujours afficher un feedback

Une activité pédagogique doit afficher un retour clair :

```text
- réussi / échoué ;
- erreur ;
- étape courante ;
- état actuel ;
- valeur calculée ;
- consigne.
```

Le feedback doit être dans une zone dédiée, pas superposé à la visualisation.

---

## 22. Garder les formules cohérentes avec le code

Si une formule est affichée, elle doit correspondre exactement au calcul.

Exemple :

```text
x' =  cos(theta) * dx + sin(theta) * dy
y' = -sin(theta) * dx + cos(theta) * dy
```

doit correspondre à :

```javascript
const localX = c * dx + s * dy;
const localY = -s * dx + c * dy;
```

Ne pas afficher une formule différente de ce que le code calcule.

---

## 23. Unicode : possible, mais rester prudent

ALIVE Code semble accepter certains caractères Unicode comme :

```text
θ
°
×
ᵀ
'
```

Mais pour maximiser la robustesse, préférer parfois :

```text
theta
deg
*
R^T
```

Surtout dans les noms de variables, utiliser ASCII :

```javascript
theta
localX
localY
cmdX
cmdY
```

Éviter les noms de variables comme :

```javascript
θ
x′
```

---

## 24. Ne pas dépendre du téléchargement

Même si un fichier `.js` est généré, l'utilisateur peut ne pas pouvoir le télécharger.

Toujours fournir le code complet dans la réponse, dans un bloc copiable.

Le fichier téléchargeable peut être fourni en plus, mais jamais seul.

---

## 25. Ne pas donner seulement un extrait

Pour ALIVE Code, fournir le fichier complet.

Ne pas dire seulement :

```javascript
// remplace cette fonction
```

sauf si l'utilisateur demande explicitement un patch.

Par défaut, donner une version complète qui peut remplacer tout le code existant.

---

## 26. Toujours préciser où coller le code

Inclure une phrase simple :

```text
Colle ce code directement dans le widget ALIVE Code.
```

ou :

```text
Remplace entièrement ton code actuel par celui-ci.
```

---

## 27. Checklist avant de livrer un fichier p5.js pour ALIVE Code

Avant de répondre, vérifier :

````text
[ ] Le code est du JavaScript p5.js pur.
[ ] Il n'y a aucun HTML.
[ ] Il n'y a aucun import ou CDN.
[ ] Le code est complet.
[ ] Le code est dans un bloc ```javascript.
[ ] Le canvas ne dépasse pas 860 px de largeur.
[ ] La mise en page est verticale si l'interface est complexe.
[ ] Les contrôles ne sont pas des éléments DOM si on veut éviter les superpositions.
[ ] Les sliders et boutons sont dessinés dans le canvas.
[ ] Les interactions sont gérées avec mousePressed/mouseDragged/mouseReleased.
[ ] Les panneaux ne se chevauchent pas.
[ ] Les textes ne chevauchent pas les sliders.
[ ] Les boutons restent dans le canvas.
[ ] Les valeurs initiales sont définies.
[ ] Il y a un bouton Reset.
[ ] Il y a un feedback visible.
[ ] Les formules affichées correspondent aux calculs.
[ ] Le code peut être copié-collé directement dans ALIVE Code.
````

---

## 28. Patron minimal recommandé

Utiliser ce squelette comme base pour les prochains fichiers ALIVE Code :

```javascript
let sliders = [];
let buttons = [];

const W = 860;
const H = 1020;

function setup() {
  if (typeof removeElements === "function") {
    removeElements();
  }

  createCanvas(W, H);
  textFont("monospace");
  setupUI();
}

function draw() {
  background(255);

  updateState();
  drawScene();
  drawPanels();
  drawUI();
}

function setupUI() {
  sliders = [];
  buttons = [];

  // addSlider(...)
  // addButton(...)
}

function updateState() {
  // synchroniser les variables avec les sliders custom
}

function drawScene() {
  // dessiner la visualisation principale
}

function drawPanels() {
  // dessiner les panneaux de contrôle, calcul et feedback
}

function drawUI() {
  for (let s of sliders) drawSlider(s);
  for (let b of buttons) drawButton(b);
}

function mousePressed() {
  // détecter boutons, sliders, objets
}

function mouseDragged() {
  // déplacer slider ou objet
}

function mouseReleased() {
  // exécuter bouton si nécessaire
}
```

---

## 29. Résumé ultra-court

Pour ALIVE Code :

```text
JavaScript p5.js pur.
Pas de HTML.
Pas de CDN.
Code complet dans un bloc copiable.
Canvas largeur max 860 px.
Mise en page verticale.
Éviter createSlider/createButton/createDiv.
Dessiner les contrôles dans le canvas.
Utiliser mousePressed/mouseDragged/mouseReleased.
Prévoir Reset, feedback et valeurs initiales.
Ne pas dépendre du téléchargement.
```
