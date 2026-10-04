# MDE Kusto Saver

Extension Chrome / Edge (Manifest V3) : bibliothèque locale de requêtes KQL pour la chasse avancée Microsoft Defender (`security.microsoft.com`).

## Installation

1. `chrome://extensions` (ou `edge://extensions`), activer le mode développeur.
2. « Charger l'extension non empaquetée », choisir ce dossier.

## Utilisation

- **Enregistrer** : sur la page de chasse avancée, ouvrir le menu de l'extension. La requête de l'éditeur est lue automatiquement (bouton « ↻ Lire l'éditeur » pour relire). Donner un nom, des tags, « Enregistrer ».
- **Charger** : « ▶ Charger » ouvre la requête dans un nouvel onglet de requête de la chasse avancée (les onglets ouverts gardent leur contenu), via un lien profond `?query=` (KQL en UTF-16LE, compressée gzip puis Base64 : format attendu par le portail).
- **Modifier** : clic sur le nom, puis « Enregistrer ». « Nouveau » vide le formulaire.
- **Rechercher** : tous les mots doivent apparaître dans le nom, les tags ou la requête.
- **Exporter / Importer** : fichier JSON. L'import s'ouvre dans un onglet (le sélecteur de fichier ferme le menu) ; une entrée importée remplace celle de même `id`.

## Architecture

Inspirée de Tenant Compass : pas de build, JavaScript vanilla, fonctions pures dans `lib.js` testées sous Node.

| Fichier | Rôle |
|---|---|
| `manifest.json` | Permissions `storage`, `unlimitedStorage`, `scripting` ; hôte `security.microsoft.com` uniquement |
| `popup.html` / `popup.js` | Menu (aussi page d'options en onglet) : formulaire, liste, import / export |
| `lib.js` | `huntingUrl`, `isHunting`, `parseTags`, `matches`, `upsert`, `mergeImport` |
| `test.js` | `node test.js` (Node 18+) |

Aucun content script permanent : le menu injecte à la demande (`chrome.scripting.executeScript`, monde MAIN) une fonction qui lit l'éditeur Monaco via `window.monaco`. Aucun appel réseau, aucun jeton lu.

Stockage : `chrome.storage.local`, clé `queries` :

```json
[{ "id": "uuid", "name": "Exemple", "tags": ["mde"], "query": "DeviceEvents | take 10", "updated": "2026-10-04T12:00:00.000Z" }]
```

Les données restent dans le profil du navigateur : exporter régulièrement pour sauvegarder ou partager.
