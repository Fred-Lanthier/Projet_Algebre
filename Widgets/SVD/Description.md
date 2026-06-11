# Description.md

## Activite : Le Detecteur SVD gaussien 2D

Cette activite p5.js doit montrer comment la decomposition en valeurs
singulieres permet d'apprendre la forme et l'orientation d'un nuage de points,
puis de detecter des anomalies dans toutes les directions.

Les points de reference, centres autour de leur moyenne `mu`, forment une
matrice `X` de taille `n x 2` :

```text
X = U Sigma V^T
```

Les colonnes de `V` donnent les directions principales du nuage :

```text
v1 : direction de plus grande dispersion
v2 : direction orthogonale de plus faible dispersion
```

Les valeurs singulieres donnent les ecarts-types estimes dans ces directions :

```text
s1 = sigma1 / sqrt(n - 1)
s2 = sigma2 / sqrt(n - 1)
```

## Calcul effectivement realise

Le widget ne choisit pas les axes ou les rayons a partir des points situes aux
limites du nuage. Il effectue le calcul suivant sur tous les points de reference :

```text
1. calcul de la moyenne mu ;
2. construction de la matrice centree X ;
3. calcul de X^T X ;
4. diagonalisation de X^T X = V Sigma^2 V^T ;
5. extraction de v1, v2, sigma1 et sigma2 ;
6. calcul des colonnes de U avec ui = X vi / sigmai ;
7. verification de X = U Sigma V^T ;
8. estimation de la covariance C = X^T X / (n - 1).
```

Comme les donnees sont en dimension 2, la diagonalisation de la matrice
symetrique `2 x 2` est effectuee analytiquement. Elle est mathematiquement
equivalente au calcul des vecteurs singuliers droits et des valeurs singulieres
de `X`. Les vecteurs singuliers gauches sont ensuite calcules explicitement,
ce qui complete la decomposition SVD.

La gaussienne affichee est donc la gaussienne estimee a partir de l'echantillon :

```text
C = V diag(s1^2, s2^2) V^T
```

Il ne s'agit pas d'une ellipse forcee a contenir tous les points. Avec une
confiance de 95 %, certains points de reference peuvent legitimement se trouver
hors du contour. Sur un echantillon fini, la moyenne et la covariance estimees
peuvent aussi differer legerement des parametres utilises pour generer le nuage.

## Modele gaussien 2D

Le nuage normal est represente par une gaussienne 2D dont les courbes de niveau
sont des ellipses centrees en `mu`, orientees selon `v1` et `v2`.

Pour un point test `p`, on calcule ses coordonnees dans la base singuliere :

```text
c1 = (p - mu) . v1
c2 = (p - mu) . v2
```

Ces coordonnees sont normalisees par la dispersion du nuage :

```text
z1 = c1 / s1
z2 = c2 / s2
```

Le score d'anomalie est la distance de Mahalanobis :

```text
d_M(p) = sqrt(z1^2 + z2^2)
```

Cette distance detecte deux types d'anomalies :

```text
un point trop loin selon v1 ;
un point trop loin selon v2.
```

## Seuil automatique

Le seuil `tau` ne doit pas etre choisi directement par l'utilisateur. Il est
calcule automatiquement a partir d'un niveau de confiance `q`.

Pour une gaussienne 2D, `d_M^2` suit une loi du khi-deux a deux degres de
liberte. Le contour contenant une proportion `q` de la distribution satisfait :

```text
tau = sqrt(-2 ln(1 - q))
```

La regle de detection est donc :

```text
anomalie si d_M(p) > tau
```

Quand le nuage change, la SVD recalcule `v1`, `v2`, `s1` et `s2`. L'ellipse de
decision se redimensionne et se reoriente automatiquement. Si le niveau de
confiance change, `tau` est lui aussi recalcule automatiquement.

## Ce que l'activite doit afficher

L'interface doit presenter :

1. un grand repere 2D contenant le nuage de reference ;
2. la moyenne `mu` ;
3. les directions singulieres `v1` et `v2` ;
4. plusieurs courbes de niveau de la gaussienne 2D ;
5. l'ellipse de decision correspondant a `tau` ;
6. plusieurs points tests normaux ou anormaux ;
7. les composantes `c1` et `c2` du point selectionne ;
8. les valeurs `sigma1`, `sigma2`, `s1`, `s2` et `tau` ;
9. une explication dynamique de la classification.

Les composantes numeriques des vecteurs principaux doivent etre affichees :

```text
v1 = (v11, v12)
v2 = (v21, v22)
```

## Interactions attendues

L'utilisateur doit pouvoir :

* regler le niveau de confiance, ce qui recalcule automatiquement `tau` ;
* regler la largeur transverse du nuage pour voir evoluer `sigma2` et l'ellipse ;
* cliquer dans la carte pour placer le point test selectionne ;
* faire glisser un point et observer son score dans les deux directions ;
* selectionner un autre point test en cliquant dessus ;
* afficher ou masquer les composantes dans la base SVD ;
* generer un nouveau nuage gaussien ;
* reinitialiser l'activite.

## Objectifs pedagogiques

L'activite doit faire comprendre que :

```text
la SVD apprend les axes principaux du nuage ;
les valeurs singulieres mesurent la dispersion sur ces axes ;
une gaussienne 2D produit des contours elliptiques ;
la distance de Mahalanobis tient compte des deux directions ;
un point peut etre anormal longitudinalement ou transversalement.
```

La SVD n'est donc pas, a elle seule, un detecteur probabiliste. Elle fournit la
base et les echelles principales. L'hypothese gaussienne et le quantile du
khi-deux fournissent ensuite une regle de decision interpretable.

## Defi propose

```text
Deplace les points tests et prevois leur classification avant de lire le score.
Compare une grande distance brute avec une grande distance normalisee.
```

L'activite doit rester fluide, epuree et directement copiable dans ALIVE Code.
Elle utilise uniquement du JavaScript p5.js pur, un canvas de largeur maximale
860 px et des controles dessines dans le canvas.
