// Tous les textes visibles de l'application.
// Modifiez ce fichier pour changer le wording sans toucher à la logique.

export const STRINGS = {

  // Statut affiché sur l'écran d'accueil au démarrage
  initialStatus: 'Appuyez sur PLAY pour lancer le club.',

  // Écran d'accueil
  home: {
    eyebrow: 'Cocktail challenge',
    heroCopy: 'Secouez votre téléphone pour shaker le cocktail parfait !',
    playButton: 'PLAY',
  },

  // Écran de jeu
  game: {
    eyebrow: 'shake shake shake !',
    title: 'Préparez le cocktail',
    progressAriaLabel: 'Progression du shake',
    permissionRequesting: 'Autorisation…',
    permissionActive: 'Capteurs actifs',
    permissionIdle: 'Activer les mouvements',
    quitButton: 'Quitter',
    hint: 'Fallback desktop : appuyez sur <kbd>Espace</kbd>/<kbd>↑</kbd>, cliquez, ou glissez verticalement dans la fenêtre.',
    rescueAriaLabel: 'Etat des sauvetages',
  },

  // Overlay loterie
  lottery: {
    rollingIcon: '🎲',
    rollingTitle: (attempt) => `Tentative ${attempt}`,
    resultIcon: '✅',
    resultTitle: 'Réussi !',
    failIcon: '😵',
    failTitle: 'Cocktail raté !',
    wonIcon: '🏆',
    wonTitle: 'Cocktail parfait !',
    wonSubtitle: 'Toutes les tentatives réussies !',
  },

  // Messages de statut (barre en bas de l'écran de jeu)
  status: {
    lotteryRolling: 'Vérification du Cocktail…',
    lotteryWon: 'Cocktail parfait ! Toutes les tentatives réussies !',
    lotteryShake: "Secouez jusqu'à 100 % pour le prochain tirage !",
    sensorReady: 'Secouez verticalement. Les mouvements horizontaux sont ignorés.',
    sensorUnavailable: 'Capteur indisponible : utilisez le clavier ou la souris pour tester.',
    sensorNotSupported: 'DeviceMotionEvent indisponible : fallback desktop activé.',
    iosPermissionPending: 'iOS demande une autorisation pour accéder aux mouvements.',
    iosPermissionDenied: 'Autorisation refusée : utilisez le fallback clavier/souris.',
    iosPermissionError: 'Autorisation impossible : utilisez le fallback clavier/souris.',
    sensorDetected: 'Shake vertical détecté ! Continuez.',
    sensorActive: 'Capteurs actifs : secouez le téléphone de haut en bas.',
    fallbackDesktop: 'Fallback desktop : shake vertical simulé.',
  },
};
