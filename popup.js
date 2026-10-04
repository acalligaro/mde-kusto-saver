// Popup (also the options page opened in a tab). The library lives in chrome.storage.local `queries`:
// [{ id, name, tags: [string], query, updated: ISO date }], newest first.
const $ = id => document.getElementById(id);
let items = [];
let editingId = null;

// Run in the page's MAIN world: the advanced hunting editor is Monaco, reachable through window.monaco.
function readEditor() {
  const m = window.monaco && window.monaco.editor;
  const eds = (m && m.getEditors && m.getEditors()) || [];
  const ed = eds.find(e => e.hasTextFocus()) || eds[0];
  if (ed) return ed.getValue();
  const model = m && m.getModels && m.getModels()[0];
  return model ? model.getValue() : (String(getSelection()) || null);
}
function writeEditor(text) {
  const m = window.monaco && window.monaco.editor;
  const ed = m && m.getEditors && m.getEditors()[0];
  if (!ed) return false;
  ed.setValue(text);
  ed.focus();
  return true;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab && isHunting(tab.url) ? tab : null;
}
// First non-empty result over all frames, null if the page is unreachable.
async function inPage(tabId, func, args = []) {
  try {
    const res = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: 'MAIN', func, args });
    return res.map(r => r.result).find(Boolean) || null;
  } catch { return null; }
}

function say(text) { $('msg').textContent = text; }
const save = () => chrome.storage.local.set({ queries: items });

async function grab() {
  const tab = await activeTab();
  const q = tab && await inPage(tab.id, readEditor);
  if (q) { $('query').value = q; say('Requête lue depuis l\'éditeur.'); }
  else say(tab ? 'Éditeur non lu : collez la requête.' : 'Ouvrez la chasse avancée sur security.microsoft.com.');
}

// Replaces the content of the active query tab; without a reachable editor, falls back to a new query tab.
async function loadHere(item) {
  const tab = await activeTab();
  if (tab && await inPage(tab.id, writeEditor, [item.query])) return say(`« ${item.name} » chargée dans l'éditeur.`);
  loadNew(item);
}

// The deep link opens the query in a new query tab of advanced hunting (page reload): the open tabs keep their content.
async function loadNew(item) {
  const tab = await activeTab();
  const url = await huntingUrl(item.query);
  if (tab) chrome.tabs.update(tab.id, { url }); else chrome.tabs.create({ url });
}

function edit(item) {
  editingId = item.id;
  $('name').value = item.name;
  $('tags').value = item.tags.join(', ');
  $('query').value = item.query;
  say(`Modification de « ${item.name} ».`);
}

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}
function btn(text, onclick, className = '') { return el('button', { textContent: text, onclick, className }); }
function tip(e, text) { e.dataset.tip = text; e.setAttribute('aria-label', `${e.textContent} : ${text}`); return e; }

function render() {
  const search = $('search').value;
  const shown = items.filter(x => matches(x, search));
  $('count').textContent = items.length;
  $('list').replaceChildren(...(shown.length ? shown.map(item => {
    const del = btn('Supprimer', () => {
      if (del.textContent !== 'Confirmer ?') return (del.textContent = 'Confirmer ?');
      items = items.filter(x => x.id !== item.id);
      if (editingId === item.id) editingId = null;
      save(); render();
    }, 'del');
    return el('li', { className: 'item' },
      el('div', {}, el('span', { className: 'name', textContent: item.name, title: 'Modifier', onclick: () => edit(item) }),
        ...item.tags.map(t => el('span', { className: 'tag', textContent: t }))),
      el('pre', { textContent: item.query }),
      el('div', { className: 'actions' },
        tip(btn('▶ Charger ici', () => loadHere(item), 'primary'), 'Remplace le contenu de l\'onglet de requête actif'),
        tip(btn('＋ Nouvel onglet', () => loadNew(item)), 'Rafraîchissement automatique de la page'),
        btn('Copier KQL', () => navigator.clipboard.writeText(item.query).then(() => say('KQL copiée.'))),
        btn('Modifier', () => edit(item)),
        del));
  }) : [el('li', { className: 'empty', textContent: items.length ? 'Aucun résultat.' : 'Bibliothèque vide.' })]));
}

$('grab').onclick = grab;
const clearForm = () => { editingId = null; $('name').value = $('tags').value = $('query').value = ''; };
$('clear').onclick = () => { clearForm(); say(''); };
$('save').onclick = () => {
  const name = $('name').value.trim(), query = $('query').value.trim();
  if (!name || !query) return say('Nom et requête obligatoires.');
  items = upsert(items, { id: editingId || crypto.randomUUID(), name, tags: parseTags($('tags').value), query, updated: new Date().toISOString() });
  // Empty form after saving: the next save is a new entry, never a silent overwrite of this one.
  clearForm();
  save(); render(); say(`« ${name} » enregistrée.`);
};
$('search').oninput = render;
$('export').onclick = () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })),
    download: `mde-kusto-queries-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('import').onclick = async () => {
  // The file picker closes the popup: import from the options page opened in a tab.
  if (await chrome.tabs.getCurrent()) $('file').click(); else chrome.runtime.openOptionsPage();
};
$('file').onchange = async () => {
  try {
    const before = items.length;
    items = mergeImport(items, JSON.parse(await $('file').files[0].text()));
    save(); render(); say(`Import : ${items.length - before} nouvelle(s), doublons d'id remplacés.`);
  } catch (e) { say(`Import refusé : ${e.message}`); }
  $('file').value = '';
};

(async () => {
  if (await chrome.tabs.getCurrent()) document.body.classList.add('tab');
  ({ queries: items = [] } = await chrome.storage.local.get('queries'));
  render();
  if (await activeTab()) grab();
})();
