// Run with: node test.js (Node 18+)
const assert = require('node:assert');
const zlib = require('node:zlib');
const { huntingUrl, isHunting, parseTags, matches, upsert, mergeImport } = require('./lib.js');

(async () => {
  const kql = 'DeviceProcessEvents\n| where FileName =~ "powershell.exe" // é';
  const url = new URL(await huntingUrl(kql));
  assert.strictEqual(url.origin + url.pathname, 'https://security.microsoft.com/v2/advanced-hunting');
  assert.strictEqual(url.searchParams.get('timeRangeId'), 'week');
  assert.strictEqual(zlib.gunzipSync(Buffer.from(url.searchParams.get('query'), 'base64')).toString('utf16le'), kql);

  assert.ok(isHunting('https://security.microsoft.com/v2/advanced-hunting'));
  assert.ok(!isHunting('https://security.microsoft.com.evil.example/'));
  assert.ok(!isHunting('not a url'));

  assert.deepStrictEqual(parseTags(' mde, hunting,,mde '), ['mde', 'hunting']);

  const item = { id: 'a', name: 'PowerShell encodé', tags: ['lolbin'], query: 'DeviceProcessEvents' };
  assert.ok(matches(item, 'powershell deviceprocess'));
  assert.ok(matches(item, 'LOLBIN'));
  assert.ok(matches(item, ''));
  assert.ok(!matches(item, 'powershell registry'));

  const list = upsert(upsert([], item), { ...item, id: 'b' });
  assert.deepStrictEqual(upsert(list, { ...item, name: 'x' }).map(x => x.id + x.name), ['ax', 'bPowerShell encodé']);

  const merged = mergeImport(list, [{ id: 'a', name: 'new', query: 'q', tags: ['t', 3] }, { name: '', query: 'q' }, null, { name: 'n', query: 'q2' }]);
  assert.strictEqual(merged.length, 3);
  assert.deepStrictEqual(merged.find(x => x.id === 'a').tags, ['t']);
  assert.throws(() => mergeImport(list, { name: 'x' }));

  console.log('mde-kusto-saver: all checks passed');
})();
