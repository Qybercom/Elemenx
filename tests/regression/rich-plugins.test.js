import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PluginsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* The plugins of the RichText Service: what Markdown has no element for, drawn by a Component or a function. */
describe('Contract: the plugins of RichText, in Markdown and in a RichEditor', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Markdown', 'RichEditor', 'QRCode', 'Barcode', 'Chart', 'FileBrowser', 'Topology', 'service:RichText']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were', function () {
		var rich = Elemenx.Service('RichText');
		var text = '# Title\n\n```qr size=120\nhttps://elemenx.dev\n```\n\n::: warning title="Careful"\nThe **floor** is wet.\n:::\n\n```js\nvar a = 1;\n```\n\nA :tag[new]{tone=success} word.\n';
		var html;
		var back;

		rich.Extend({Name: 'tag', Inline: ['tag'], Render: function (node, data) {
			node.textContent = '#' + data.Text + ' (' + data.Attributes.tone + ')';
		}});

		expect(rich.Plugins()).toEqual(expect.arrayContaining(['diagram', 'chart', 'qrcode', 'barcode', 'callout', 'tag']));
		expect(rich.PluginFor('fence', 'mermaid').Name).toBe('diagram');
		expect(rich.PluginFor('directive', 'tip').Name).toBe('callout');
		expect(rich.PluginFor('fence', 'js')).toBe(null);

		html = rich.FromMarkdown(text);

		expect(html).toContain('data-elemenx-plugin="qrcode"');
		expect(html).toContain('data-elemenx-plugin="callout"');
		expect(html).toContain('<span data-elemenx-plugin="tag"');
		expect(html).toContain('<pre>var a = 1;</pre>');

		/* Sanitize keeps a known plugin, its data alone, and drops one it does not know. */
		expect(rich.Sanitize(html)).toBe(html);
		expect(rich.Sanitize('<div data-elemenx-plugin="nothing" data-elemenx-data="{&quot;Name&quot;:&quot;nothing&quot;}"><script>x()</script></div><p>Kept</p>')).toBe('<p>Kept</p>');
		expect(rich.Sanitize(rich.PluginHTML({Name: 'qrcode', Kind: 'fence', Language: 'qr', Attributes: {}, Text: 'x'}).replace('></div>', '><img src=x onerror=alert(1)></div>'))).toBe(rich.PluginHTML({Name: 'qrcode', Kind: 'fence', Language: 'qr', Attributes: {}, Text: 'x'}));

		back = rich.ToMarkdown(html);

		expect(back).toContain('```qr size=120\nhttps://elemenx.dev\n```');
		expect(back).toContain('::: warning title=Careful\nThe **floor** is wet.\n:::');
		expect(back).toContain(':tag[new]{tone=success}');
		expect(rich.FromMarkdown(back)).toBe(html);

		/* A directive no plugin takes gives its blocks. */
		expect(rich.FromMarkdown('::: aside\nJust *text*.\n:::')).toBe('<p>Just <em>text</em>.</p>');

		expect(function () {
			rich.Extend({Name: 'bad'});
		}).toThrow('Elemenx RichText.Extend expects {Name, Component or Render(node, data)}');
	});

	it('Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again', async function () {
		var host = mount('<div><Markdown [value]="Text" /></div>', {
			Text: '```qr\nhttps://elemenx.dev\n```\n\n```barcode format=ean13 height=40\n400638133393\n```\n\n::: tip\nA **tip**.\n:::\n\n```chart\n{"Type": "bar", "Labels": ["A", "B"], "Series": [{"Name": "N", "Values": [1, 2]}]}\n```\n\n```js\nvar a = 1;\n```\n\n```chart\nnot json\n```\n'
		});
		var root;

		root = await waitFor(function () {
			var element = host.$Element();

			return element.querySelector('.elemenx-qr-code svg') && element.querySelector('.elemenx-barcode svg') && element.querySelector('.elemenx-chart svg') ? element : null;
		}, 4000);

		expect(root).toBeTruthy();
		expect(root.querySelector('.elemenx-rich-plugin.elemenx-callout.success strong').textContent).toBe('tip');
		expect(root.querySelector('pre[data-language="js"]')).toBeTruthy();
		expect(root.querySelector('.elemenx-rich-plugin.error').textContent).toContain('a chart is a JSON of the props of Chart');

		/* The barcode took the attributes of its fence as its props. */
		expect(root.querySelector('.elemenx-barcode').getAttribute('aria-label')).toContain('400638133393');

		host.Text = 'Plain now.';

		await tick();

		expect(root.querySelector('.elemenx-rich-plugin')).toBe(null);
	});

	it('Markdown in an Application draws a plugin whose Component its Library has not loaded yet', async function () {
		var library = unique('PluginsKit');
		var root = unique('PluginsRoot');
		var plugin = unique('badge').toLowerCase();
		var application;

		Elemenx.Library(library, {$Root: '/library-contracts', $Locales: {URL: 'locales/{language}.json', Languages: ['en']}});
		/* The plugin of the Application: its RichText Service is its own. */
		Elemenx.Component(root, {
			$Template: '<main><Markdown [value]="Text" /></main>',
			Text: '```' + plugin + ' name=Ada\nA badge\n```\n',
			$OnCreate: function () {
				this.$Service('RichText').Extend({Name: plugin, Fences: [plugin], Component: 'LibraryBadge'});
			}
		});

		application = Elemenx.Application(unique('PluginsApplication'), {$Component: root, $Mount: '#mount', $Use: library});

		try {
			expect(await waitFor(function () {
				var greeting = document.querySelector('.elemenx-rich-plugin .library-greeting');

				return greeting && greeting.textContent === 'Hello, Ada';
			}, 4000)).toBe(true);
		}
		finally {
			application.$Destroy();
		}
	});

	it('RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown', async function () {
		var editor = null;
		var values = [];
		var host = mount('<div><RichEditor [value]="Html" (ready)="Ready" (change)="Changed" /></div>', {
			Html: '<p>Before</p>' + Elemenx.Service('RichText').PluginHTML({Name: 'qrcode', Kind: 'fence', Language: 'qr', Attributes: {}, Text: 'one'}),
			Ready: function (instance) {
				editor = instance;
			},
			Changed: function (value) {
				values.push(value);
			}
		});
		var content;
		var node;
		var area;

		await waitFor(function () {
			return editor;
		});

		content = host.$Element().querySelector('.elemenx-rich-editor-content');
		node = content.querySelector('[data-elemenx-plugin="qrcode"]');

		expect(node.getAttribute('contenteditable')).toBe('false');
		expect(node.querySelector('.elemenx-qr-code svg')).toBeTruthy();

		/* A double press edits its text; Mod+Enter keeps it, and it is drawn again. */
		node.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		area = node.querySelector('.elemenx-rich-plugin-editor');

		expect(area.value).toBe('one');

		area.value = 'two';

		area.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', ctrlKey: true, bubbles: true}));

		expect(node.classList.contains('editing')).toBe(false);
		expect(node.querySelector('.elemenx-qr-code svg')).toBeTruthy();
		expect(editor.Value).toContain('&quot;Text&quot;:&quot;two&quot;');

		/* Escape leaves it as it was. */
		node.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		node.querySelector('.elemenx-rich-plugin-editor').value = 'three';

		node.querySelector('.elemenx-rich-plugin-editor').dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

		expect(editor.Value).toContain('&quot;Text&quot;:&quot;two&quot;');

		/* Command plugin puts one in at the caret, its Insert data by default; a name it does not know is refused. */
		content.focus();

		var range = document.createRange();

		range.selectNodeContents(content.querySelector('p'));
		range.collapse(false);

		document.getSelection().removeAllRanges();
		document.getSelection().addRange(range);

		expect(editor.Command('plugin', 'callout')).toBe(true);
		expect(editor.Command('plugin', 'nothing')).toBe(false);

		await tick();

		expect(content.querySelector('[data-elemenx-plugin="callout"].elemenx-callout')).toBeTruthy();
		expect(editor.Markdown()).toContain('```qr\ntwo\n```');
		expect(editor.Markdown()).toContain('::: info\nA note for the reader.\n:::');
	});

	it('reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree', async function () {
		var rich = Elemenx.Service('RichText');

		expect(rich.FileTree('src/\n  components/\n    App.js   # the root\n  index.js\nREADME.md\n\nempty/')).toEqual([
			{ID: 'src', Name: 'src', Items: [{ID: 'src/components', Name: 'components', Items: [{ID: 'src/components/App.js', Name: 'App.js'}]}, {ID: 'src/index.js', Name: 'index.js'}]},
			{ID: 'README.md', Name: 'README.md'},
			{ID: 'empty', Name: 'empty', Items: []}
		]);
		expect(rich.FileTree('.\n├── package.json\n├── src\n│   ├── index.js\n│   └── lib\n│       └── a.js\n└── docs\n    \tguide.md')).toEqual([
			{ID: '.', Name: '.', Items: [
				{ID: './package.json', Name: 'package.json'},
				{ID: './src', Name: 'src', Items: [{ID: './src/index.js', Name: 'index.js'}, {ID: './src/lib', Name: 'lib', Items: [{ID: './src/lib/a.js', Name: 'a.js'}]}]},
				{ID: './docs', Name: 'docs', Items: [{ID: './docs/guide.md', Name: 'guide.md'}]}
			]}
		]);
		/* A tab is four spaces: two of them go deeper than four spaces. */
		expect(rich.FileTree('a/\n    b/\n\t\tc.js')[0].Items[0].Items).toEqual([{ID: 'a/b/c.js', Name: 'c.js'}]);
		expect(rich.Plugins()).toContain('files');

		var host = mount('<div><Markdown [value]="Text" /></div>', {
			Text: 'The project:\n\n```files\nsrc/\n  index.js\nREADME.md\n```\n'
		});
		var browser = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-file-browser.tree');
		}, 4000);

		/* A tree, every folder open, the names alone: no bar, no sizes. */
		expect(Array.from(browser.querySelectorAll('.elemenx-file-browser-name')).map(function (node) {
			return node.textContent;
		})).toEqual(['src', 'index.js', 'README.md']);
		expect(browser.querySelector('[data-id="src/index.js"]').getAttribute('aria-level')).toBe('2');
		expect(browser.classList.contains('plain')).toBe(true);
		expect(browser.querySelector('.elemenx-file-browser-bar')).toBe(null);
	});

	it('reads a topology of nodes and links, their icons, statuses and details, and Markdown draws it by Topology', async function () {
		var rich = Elemenx.Service('RichText');

		expect(rich.TopologyOf('internet: Internet [icon=globe]\nweb: Web [icon=server status=ok cpu=8]  # the front\ninternet -> web : HTTPS [status=warning]\nweb -- db\ndb <- backup : nightly')).toEqual({
			Nodes: [
				{ID: 'internet', Label: 'Internet', Icon: 'globe'},
				{ID: 'web', Label: 'Web', Icon: 'server', Status: 'ok', Details: {cpu: '8'}},
				{ID: 'db', Label: 'db'},
				{ID: 'backup', Label: 'backup'}
			],
			Links: [
				{From: 'internet', To: 'web', Label: 'HTTPS', Status: 'warning'},
				{From: 'web', To: 'db'},
				{From: 'backup', To: 'db', Label: 'nightly'}
			]
		});
		expect(rich.PluginFor('fence', 'network').Name).toBe('topology');

		var host = mount('<div><Markdown [value]="Text" /></div>', {
			Text: 'The network:\n\n```topology layout=layers\nlb: Balancer\nweb: Web\nlb -> web\n```\n'
		});
		var drawn = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-topology [data-node="web"]');
		}, 4000);

		expect(drawn.textContent).toContain('Web');
		expect(host.$Element().querySelector('.elemenx-topology [data-node="lb"]').textContent).toContain('Balancer');
	});
});
