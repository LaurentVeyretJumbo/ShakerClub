# Shake Club

Shake Club est une petite application web single-page qui se teste sur ordinateur avec le clavier/la souris, et sur mobile avec les capteurs de mouvement du navigateur.

## Tester en local

```bash
npm run dev
```

Puis ouvrir <http://localhost:5173>.

Sur ordinateur, utilisez le fallback de test :

- touche `Espace`, `↑` ou `W` ;
- clic ;
- glisser verticalement avec la souris ou le trackpad.

## Tester en ligne sur téléphone

Les capteurs `DeviceMotionEvent` nécessitent généralement un contexte sécurisé. Pour tester le vrai shake sur mobile, publiez donc l'application en `https://`.

### Option rapide : Netlify Drop

1. Allez sur <https://app.netlify.com/drop>.
2. Glissez-déposez le dossier du projet `ShakerClub`.
3. Ouvrez l'URL HTTPS fournie par Netlify sur votre téléphone.
4. Appuyez sur `PLAY`, puis autorisez les mouvements si iOS affiche la demande.

### Option GitHub Pages

1. Poussez ce dépôt sur GitHub.
2. Dans le dépôt GitHub, ouvrez `Settings` → `Pages`.
3. Choisissez la branche à publier et le dossier racine (`/`).
4. Attendez la génération, puis ouvrez l'URL GitHub Pages HTTPS sur mobile.

### Option Vercel

1. Importez le dépôt dans <https://vercel.com/new>.
2. Utilisez les réglages par défaut pour un site statique.
3. Déployez, puis ouvrez l'URL HTTPS Vercel sur mobile.

## Notes importantes pour iOS

- Ouvrez le site avec Safari ou un navigateur iOS récent.
- L'autorisation de mouvement doit être déclenchée par une action utilisateur : appuyez sur `PLAY` ou sur le bouton d'activation des mouvements.
- Si l'autorisation est refusée, rechargez la page ou vérifiez les réglages Safari liés aux capteurs/mouvements.

## Vérifier le projet

```bash
npm run build
```

Cette commande lance une vérification statique des fichiers et des snippets importants de l'application.
