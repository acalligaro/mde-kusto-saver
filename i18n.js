// UI strings, Français (FR) and English (US). Language stored in chrome.storage.sync key `lang`.⁣‌‌‌‌‌‌‌​​​‌​​​‌​​‍‌⁣
const I18N = {
  fr: {
    'save.title': 'Enregistrer',
    'name.ph': 'Nom de la requête',
    'tags.ph': 'Tags séparés par des virgules (optionnel)',
    'query.ph': "Requête KQL (lue depuis l'éditeur de chasse avancée, ou à coller)",
    'grab': "↻ Lire l'éditeur",
    'save': 'Enregistrer',
    'clear': 'Nouveau',
    'lib.title': 'Bibliothèque',
    'search.ph': 'Rechercher (nom, tag, contenu)',
    'export': 'Exporter JSON',
    'import': 'Importer JSON',
    'loadHere': '▶ Charger ici',
    'loadHere.tip': "Remplace le contenu de l'onglet de requête actif",
    'loadNew': '＋ Nouvel onglet',
    'loadNew.tip': 'Rafraîchissement automatique de la page',
    'copy': 'Copier KQL',
    'edit': 'Modifier',
    'delete': 'Supprimer',
    'confirm': 'Confirmer ?',
    'empty': 'Bibliothèque vide.',
    'noMatch': 'Aucun résultat.',
    'msg.read': "Requête lue depuis l'éditeur.",
    'msg.notRead': 'Éditeur non lu : collez la requête.',
    'msg.openHunting': 'Ouvrez la chasse avancée sur security.microsoft.com.',
    'msg.loaded': "« {name} » chargée dans l'éditeur.",
    'msg.editing': 'Modification de « {name} ».',
    'msg.copied': 'KQL copiée.',
    'msg.required': 'Nom et requête obligatoires.',
    'msg.saved': '« {name} » enregistrée.',
    'msg.imported': "Import : {n} nouvelle(s), doublons d'id remplacés.",
    'msg.importError': 'Import refusé : {error}',
    'err.format': 'format invalide, un tableau JSON est attendu.',
  },
  en: {
    'save.title': 'Save',
    'name.ph': 'Query name',
    'tags.ph': 'Comma-separated tags (optional)',
    'query.ph': 'KQL query (read from the advanced hunting editor, or paste it)',
    'grab': '↻ Read the editor',
    'save': 'Save',
    'clear': 'New',
    'lib.title': 'Library',
    'search.ph': 'Search (name, tag, content)',
    'export': 'Export JSON',
    'import': 'Import JSON',
    'loadHere': '▶ Load here',
    'loadHere.tip': 'Replaces the content of the active query tab',
    'loadNew': '＋ New tab',
    'loadNew.tip': 'The page reloads automatically',
    'copy': 'Copy KQL',
    'edit': 'Edit',
    'delete': 'Delete',
    'confirm': 'Confirm?',
    'empty': 'Library is empty.',
    'noMatch': 'No match.',
    'msg.read': 'Query read from the editor.',
    'msg.notRead': 'Editor not read: paste the query.',
    'msg.openHunting': 'Open advanced hunting on security.microsoft.com.',
    'msg.loaded': '"{name}" loaded in the editor.',
    'msg.editing': 'Editing "{name}".',
    'msg.copied': 'KQL copied.',
    'msg.required': 'Name and query are required.',
    'msg.saved': '"{name}" saved.',
    'msg.imported': 'Import: {n} new, same-id entries replaced.',
    'msg.importError': 'Import rejected: {error}',
    'err.format': 'invalid format, a JSON array is expected.',
  },
};
const LANGS = Object.keys(I18N);

let lang = (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en'; // until storage answers

function t(key, vars) {
  const s = I18N[lang][key] ?? I18N.fr[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

function applyI18n(root = document) {
  document.documentElement.lang = lang === 'en' ? 'en-US' : 'fr-FR';
  for (const n of root.querySelectorAll('[data-i18n]')) n.textContent = t(n.dataset.i18n);
  for (const n of root.querySelectorAll('[data-i18n-ph]')) n.placeholder = t(n.dataset.i18nPh);
  for (const b of root.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
}

function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  return chrome.storage.sync.set({ lang });
}

// Resolves once the stored language is known (popup.js waits for it before rendering).
const i18nReady = typeof chrome !== 'undefined' && chrome.storage
  ? chrome.storage.sync.get('lang').then(r => { if (LANGS.includes(r.lang)) lang = r.lang; }).catch(() => {})
  : Promise.resolve();

if (typeof module !== 'undefined') module.exports = { I18N };
