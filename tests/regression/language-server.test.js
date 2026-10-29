import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import child from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

var require = createRequire(import.meta.url);
var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var language = require(path.join(root, 'editors', 'core', 'elemenx-language.js'));

/* A project of its own: a Library with its meta.json, a Component of the project and its template, a Service, a Directive. */
var project;
var knowledge;
var template = '<div>\n\t<Card Title="Hi" Varient="x" [title]="Count" (pick)="Picked" (vanish)="Gone" *nope="1">\n\t\t<Missing />\n\t\t<Card \n\t</div>\n{{ Cou }}\n';

function write (file, text) {
	fs.mkdirSync(path.dirname(path.join(project, file)), {recursive: true});
	fs.writeFileSync(path.join(project, file), text);
}

describe('Contract: the language of Elemenx for the editors (the core, and its LSP server)', function () {
	beforeAll(function () {
		project = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-language-'));

		write('libraries/Kit/data/meta.json', JSON.stringify({
			Components: [{Name: 'Card', Description: 'A card.', Group: 'layout', Props: [{Name: 'Title', Type: 'text', Description: 'Its title.'}, {Name: 'Variant', Type: 'text', Options: ['flat', 'raised'], Description: 'Its look.'}], Events: ['pick'], EventDescriptions: {pick: 'A card was picked.'}, Slots: ['footer']}],
			Services: [{Name: 'Toast', Description: 'Toasts.', Methods: ['Show(options)']}],
			Directives: [{Name: 'tip', Description: 'A tip.'}]
		}));
		write('libraries/Kit/components/Card/Card.js', "Elemenx.Component('Card', {\n\tTitle: '',\n\n\tPick: function () {\n\t\tthis.$Emit('pick', {});\n\t}\n});\n");
		write('libraries/Kit/directives/Tip.js', "/* A tip. */\nElemenx.Directive('tip', {});\n");
		write('elemenx.js', "(function () {\n\tvar Runtime = {};\n\n\tRuntime.Directive.Register('if', {});\n})();\n");
		write('application/components/Board/Board.js', "/* The board of the project. */\nElemenx.Component('Board', {\n\t$TemplateURL: 'Board.html',\n\tCount: 0,\n\tItems: [],\n\n\t$OnCreate: function () {\n\t\tthis.Counted = function (count) {\n\t\t\treturn count;\n\t\t};\n\t},\n\n\tPicked: function () {\n\t\tthis.$Emit('chosen', {});\n\t}\n});\n");
		write('application/components/Board/Board.html', template);
		write('application/services/Store.js', "Elemenx.Service('Store', {\n\tGet: function () {}\n});\nElemenx.Directive('unless', {});\n");

		knowledge = language.Create({Roots: [project]});
	});

	afterAll(function () {
		fs.rmSync(project, {recursive: true, force: true});
	});

	it('knows the Components, Services and Directives of the Libraries and of the project', function () {
		expect(knowledge.Component('card')).toMatchObject({Name: 'Card', Library: true, Events: ['pick'], File: path.join(project, 'libraries/Kit/components/Card/Card.js')});
		expect(knowledge.Component('Board')).toMatchObject({Name: 'Board', Library: false, Description: 'The board of the project.', Events: ['chosen']});
		expect(knowledge.Component('Board').Props.map(function (prop) {
			return prop.Name;
		})).toEqual(['Count', 'Items']);
		expect(knowledge.Component('Board').Methods.map(function (method) {
			return method.Name;
		}).sort()).toEqual(['Counted', 'Picked']);
		expect(knowledge.Services().map(function (service) {
			return service.Name;
		}).sort()).toEqual(['Store', 'Toast']);
		expect(knowledge.Directives().map(function (directive) {
			return directive.Name;
		})).toEqual(expect.arrayContaining(['if', 'for', 'tip', 'unless']));
	});

	it('completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component', function () {
		var file = path.join(project, 'application/components/Board/Board.html');
		var labels = function (text, language_) {
			return language.Complete(knowledge, text, text.length, language_ || 'html', file).map(function (item) {
				return item.Label;
			});
		};
		var item;

		expect(labels('<Ca')).toEqual(['Card']);
		expect(labels('<Card T')).toEqual(['Title']);
		expect(labels('<Card [')).toEqual(['[Title]', '[Variant]', '[attribute.]', '[class.]', '[style.]']);
		expect(labels('<Card (')).toEqual(['(pick)']);
		expect(labels('<Card *')).toEqual(expect.arrayContaining(['*if', '*for', '*tip', '*unless']));
		expect(labels('<Card Variant="r')).toEqual(['raised']);
		expect(labels('<Card [title]="Co')).toEqual(['Count', 'Counted']);
		expect(labels('<Card (pick)="P')).toEqual(['Picked']);

		/* An (event) that is an expression, and {{ }} in the value of a plain attribute. */
		expect(labels('<Card (pick)="Count = Co')).toEqual(['Count', 'Counted']);
		expect(labels('<button (click)="Picked($')).toEqual(['$event', '$node']);
		expect(labels('<a title="Hello, {{Co')).toEqual(['Count', 'Counted']);
		expect(labels('<a title="Hello, Co')).toEqual([]);
		expect(labels('{{ It')).toEqual(['Items']);
		expect(labels("this.$Service('To", 'js')).toEqual(['Toast']);

		/* A binding goes in as a snippet, replacing what was typed of it. */
		item = language.Complete(knowledge, '<Card [Ti', 9, 'html', file)[0];

		expect(item).toMatchObject({Label: '[Title]', Insert: '[Title]="$1"', Snippet: true, Start: 6, End: 9});
	});

	it('tells of a Component, a prop, a directive and a Service on hover, and finds their definitions', function () {
		var file = path.join(project, 'application/components/Board/Board.html');

		expect(language.Hover(knowledge, '<Card />', 2, 'html', file).Markdown).toContain('**Card** · Elemenx');
		expect(language.Hover(knowledge, '<Card Variant="flat" />', 8, 'html', file).Markdown).toContain('One of: `flat`, `raised`');
		expect(language.Hover(knowledge, '<div *tip="x">', 7, 'html', file).Markdown).toContain('A tip.');
		expect(language.Hover(knowledge, '<Card (pick)="x" />', 8, 'html', file).Markdown).toContain('A card was picked.');
		expect(language.Hover(knowledge, '<Card />', 2, 'html', file).Markdown).toContain('- `pick`: A card was picked.');
		expect(language.Hover(knowledge, "$Service('Toast')", 11, 'js').Markdown).toContain('`Show(options)`');

		expect(language.Definition(knowledge, '<Board />', 2, 'html', file)).toEqual({File: path.join(project, 'application/components/Board/Board.js'), Line: 1, Character: 0});
		expect(language.Definition(knowledge, '<Card (pick)="Picked" />', 17, 'html', file)).toMatchObject({File: path.join(project, 'application/components/Board/Board.js'), Line: 12});
		expect(language.Definition(knowledge, "$Service('Store')", 11, 'js')).toMatchObject({File: path.join(project, 'application/services/Store.js'), Line: 0});
	});

	it('knows the references of a template (#Name): completes, tells and finds them from $Ref, and marks a $Ref of none', function () {
		var code = "Elemenx.Component('Panel', {\n\t$TemplateURL: 'Panel.html',\n\n\t$OnReady: function () {\n\t\tthis.$Ref('Theme').focus();\n\t\tthis.$Ref('Gone');\n\t}\n});\n";
		var markup = '<header>\n\t<button class="a" #Theme (click)="Toggle">{{Theme}}</button>\n\t<Card #Box Title="x" />\n</header>\n';
		var js = path.join(project, 'application/components/Panel/Panel.js');
		var html = path.join(project, 'application/components/Panel/Panel.html');
		var labels;

		write('application/components/Panel/Panel.js', code);
		write('application/components/Panel/Panel.html', markup);

		knowledge.Refresh();

		labels = language.Complete(knowledge, "this.$Ref('", 11, 'js', js).map(function (item) {
			return item.Label;
		});

		expect(labels).toEqual(['Theme', 'Box']);
		expect(language.Complete(knowledge, "this.$Ref('B", 12, 'js', js).map(function (item) {
			return item.Label;
		})).toEqual(['Box']);

		/* From $Ref to the element, and from the element to its first $Ref. */
		expect(language.Definition(knowledge, code, code.indexOf("'Theme'") + 2, 'js', js)).toEqual({File: html, Line: 1, Character: 19});
		expect(language.Definition(knowledge, markup, markup.indexOf('#Theme') + 2, 'html', html)).toEqual({File: js, Line: 4, Character: 7});
		expect(language.Hover(knowledge, code, code.indexOf("'Theme'") + 2, 'js', js).Markdown).toContain('**#Theme** · the element of Panel.html');
		expect(language.Hover(knowledge, markup, markup.indexOf('#Box') + 1, 'html', html).Markdown).toContain("this.$Ref('Box')");

		/* A $Ref of no element is marked; the references are no props or unknown attributes. */
		expect(language.Diagnose(knowledge, code, 'js', js).map(function (problem) {
			return [problem.Severity, problem.Message, code.substring(problem.Start, problem.End)];
		})).toEqual([['warning', 'No #Gone in Panel.html', 'Gone']]);
		expect(language.Diagnose(knowledge, markup, 'html', html)).toEqual([]);

		/* $Refs as $Ref: its names completed, a name to its element, and one of no element marked. */
		expect(language.Complete(knowledge, "this.$Refs('", 12, 'js', js).map(function (item) {
			return item.Label;
		})).toEqual(['Theme', 'Box']);
		expect(language.Definition(knowledge, "this.$Refs('Box');", 13, 'js', js)).toEqual({File: html, Line: 2, Character: 7});
		expect(language.Diagnose(knowledge, "Elemenx.Component('Panel', {\n\t$TemplateURL: 'Panel.html',\n\tGo: function () {\n\t\tthis.$Refs('None');\n\t}\n});\n", 'js', js).map(function (problem) {
			return problem.Message;
		})).toEqual(['No #None in Panel.html']);
	});

	/* Regression: a <template id> of a page knew no Component, so its names and references went nowhere. */
	it('finds the Component of a <template id> of a page by its $TemplateID, and marks a name in $Template', function () {
		var page = '<html>\n<head>\n<script>\n\tElemenx.Component(\'PageApp\', {\n\t\t$TemplateID: \'page-app\',\n\t\tTheme: \'light\',\n\n\t\tToggle: function () {\n\t\t\tthis.$Ref(\'Theme\').blur();\n\t\t}\n\t});\n\tElemenx.Component(\'PageOther\', {\n\t\t$TemplateID: \'page-other\',\n\t\tCount: 0\n\t});\n</script>\n</head>\n<body>\n<template id="page-app">\n\t<button #Theme (click)="Toggle">{{Theme}}</button>\n\t<template slot="x"></template>\n\t<i>{{Theme}}</i>\n</template>\n<template id="page-other"><b>{{Count}}</b></template>\n</body>\n</html>\n';
		var file = path.join(project, 'pages/index.html');

		write('pages/index.html', page);

		knowledge.Refresh();

		expect(language.Definition(knowledge, page, page.indexOf('{{Theme}}') + 3, 'html', file)).toEqual({File: file, Line: 5, Character: 0});
		expect(language.Definition(knowledge, page, page.lastIndexOf('{{Theme}}') + 3, 'html', file)).toEqual({File: file, Line: 5, Character: 0});
		expect(language.Definition(knowledge, page, page.indexOf('"Toggle"') + 2, 'html', file)).toEqual({File: file, Line: 7, Character: 2});
		expect(language.Definition(knowledge, page, page.indexOf('#Theme') + 2, 'html', file)).toEqual({File: file, Line: 8, Character: 8});
		expect(language.Definition(knowledge, page, page.indexOf('{{Count}}') + 3, 'html', file)).toEqual({File: file, Line: 13, Character: 0});
		expect(language.Complete(knowledge, page, page.indexOf('Toggle"'), 'html', file).map(function (item) {
			return item.Label;
		})).toContain('Toggle');
		expect(language.Diagnose(knowledge, "Elemenx.Component('Old', {\n\t$Template: '#old-app'\n});\n", 'js', path.join(project, 'pages/old.js')).map(function (problem) {
			return [problem.Severity, problem.Message];
		})).toEqual([['error', '$Template is the template itself, not a name: use $TemplateID: \'old-app\'']]);
	});

	/* Regression: a click on *if, on a prop or on an event of a template went nowhere. */
	it('goes from a directive to its definition (the core ones in elemenx.js), and from a prop or an event to its Component', function () {
		var file = path.join(project, 'application/components/Board/Board.html');
		var card = path.join(project, 'libraries/Kit/components/Card/Card.js');

		expect(language.Definition(knowledge, '<div *if="x">', 6, 'html', file)).toEqual({File: path.join(project, 'elemenx.js'), Line: 3, Character: 9});
		expect(language.Definition(knowledge, '<div *tip="x">', 6, 'html', file)).toEqual({File: path.join(project, 'libraries/Kit/directives/Tip.js'), Line: 1, Character: 0});
		expect(language.Definition(knowledge, '<div *unless="x">', 6, 'html', file)).toMatchObject({File: path.join(project, 'application/services/Store.js'), Line: 3});
		expect(language.Definition(knowledge, '<Card Title="x" />', 8, 'html', file)).toEqual({File: card, Line: 1, Character: 1});
		expect(language.Definition(knowledge, '<Card [Title]="x" />', 8, 'html', file)).toEqual({File: card, Line: 1, Character: 1});
		expect(language.Definition(knowledge, '<Card (pick)="x" />', 8, 'html', file)).toEqual({File: card, Line: 4, Character: 7});
		expect(language.Definition(knowledge, '<Board Count="1" />', 9, 'html', file)).toMatchObject({File: path.join(project, 'application/components/Board/Board.js'), Line: 3});
	});

	/* A project with builds of dist alone: the sources the extension carries, never its bundles (regression: *tip went into a bundle). */
	it('goes to the sources the extension carries in a project that has only builds of dist, and reads no bundle', function () {
		var extension = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-extension-'));
		var site = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-site-'));
		var core = path.join(extension, 'core');
		var carried;
		var copy;
		var page = path.join(site, 'index.html');

		try {
			fs.mkdirSync(path.join(core, 'library', 'data'), {recursive: true});
			fs.mkdirSync(path.join(core, 'library', 'directives'), {recursive: true});
			fs.mkdirSync(path.join(core, 'library', 'components', 'Card'), {recursive: true});
			fs.mkdirSync(path.join(site, 'vendor'), {recursive: true});
			fs.copyFileSync(path.join(root, 'editors', 'core', 'elemenx-language.js'), path.join(core, 'elemenx-language.js'));
			fs.writeFileSync(path.join(core, 'library', 'data', 'meta.json'), JSON.stringify({Components: [{Name: 'Card', Props: [{Name: 'Title', Type: 'text'}]}], Directives: [{Name: 'tip', Description: 'A tip.'}]}));
			fs.writeFileSync(path.join(core, 'library', 'directives', 'Tip.js'), "/* A tip. */\nElemenx.Directive('tip', {});\n");
			fs.writeFileSync(path.join(core, 'library', 'components', 'Card', 'Card.js'), "Elemenx.Component('Card', {\n\tTitle: ''\n});\n");
			fs.writeFileSync(path.join(core, 'elemenx.js'), "(function () {\n\tRuntime.Directive.Register('if', {});\n})();\n");
			fs.writeFileSync(path.join(site, 'vendor', 'elemenx.all.js'), "/*! Elemenx 0.10.1 | LGPL-3.0 */\nElemenx.Directive('tip', {});\nElemenx.Component('Card', {\n\tTitle: ''\n});\n");
			fs.writeFileSync(path.join(site, 'vendor', 'elemenx-ui.min.js'), "Elemenx.Directive('tip',{});Elemenx.Component('Card',{Title:''});");

			copy = require(path.join(core, 'elemenx-language.js'));
			carried = copy.Create({Roots: [site]});

			expect(copy.Definition(carried, '<div *tip="x">', 6, 'html', page)).toEqual({File: path.join(core, 'library', 'directives', 'Tip.js'), Line: 1, Character: 0});
			expect(copy.Definition(carried, '<div *if="x">', 6, 'html', page)).toEqual({File: path.join(core, 'elemenx.js'), Line: 1, Character: 9});
			expect(copy.Definition(carried, '<Card Title="x" />', 8, 'html', page)).toEqual({File: path.join(core, 'library', 'components', 'Card', 'Card.js'), Line: 1, Character: 1});
			expect(copy.Hover(carried, '<div *tip="x">', 7, 'html', page).Markdown).toContain('A tip.');
		}
		finally {
			fs.rmSync(extension, {recursive: true, force: true});
			fs.rmSync(site, {recursive: true, force: true});
		}
	});

	it('marks the unknown Components, props, events and directives of a template, not the attributes of every element', function () {
		expect(language.Diagnose(knowledge, template, 'html').map(function (problem) {
			return [problem.Severity, problem.Message, template.substring(problem.Start, problem.End)];
		})).toEqual([
			['information', 'Card has no prop Varient', 'Varient'],
			['information', 'Card tells no event vanish', '(vanish)'],
			['warning', 'Unknown directive: *nope', '*nope'],
			['warning', 'Unknown Elemenx Component: Missing', 'Missing']
		]);
		expect(language.Diagnose(knowledge, '<Card class="a" id="b" data-x="1" aria-label="c" slot="footer" page-title="no" />', 'html').map(function (problem) {
			return problem.Message;
		})).toEqual(['Card has no prop page-title']);

		/* A <Fragment> is of the framework: no warning, and the completion of a tag offers it. */
		expect(language.Diagnose(knowledge, '<ul><Fragment *for="item of Items"><li>{{item}}</li></Fragment></ul>', 'html')).toEqual([]);
		expect(language.Complete(knowledge, '<Fra', 4, 'html').map(function (item) {
			return item.Label;
		})).toContain('Fragment');
	});

	/* A bug: Ctrl+click on $T or on its key went nowhere (and in IntelliJ, LSP4IJ cancelled the click). */
	it('goes from $T to elemenx.js and from its key to the phrase of the nearest locales, and tells the phrase in each language', function () {
		var own = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-phrases-'));
		var put = function (file, text) {
			fs.mkdirSync(path.dirname(path.join(own, file)), {recursive: true});
			fs.writeFileSync(path.join(own, file), text);
		};
		var page = '<button [title]="$T(\'ui.call.leave\')">{{ $T(\'app.title\') }}</button>\n';
		var at = function (text, needle, shift) {
			return text.indexOf(needle) + (shift || 1);
		};
		var phrases;

		put('elemenx.js', '(function () {\n\tvar Locale = {\n\t\t\t$T: function (key, params) {\n\t\t\t\treturn key;\n\t\t\t}\n\t};\n})();\n');
		put('libraries/Kit/data/meta.json', '{"Components": []}');
		put('libraries/Kit/locales/en.json', '{\n\t"ui": {\n\t\t"label": "Label",\n\t\t"call": {\n\t\t\t"label": "Call",\n\t\t\t"leave": "Leave"\n\t\t}\n\t}\n}\n');
		put('libraries/Kit/locales/ru.json', '{\n\t"ui": {\n\t\t"call": {\n\t\t\t"leave": "Выйти"\n\t\t}\n\t}\n}\n');
		put('application/locales/en.json', '{\n\t"app.title": "My \\"app\\"",\n\t"ui": {"call": {"leave": "Go away"}}\n}\n');
		put('other/locales/en.json', '{"app": {"title": "Not this one"}}\n');
		put('application/components/Board/Board.js', "Elemenx.Component('Board', {\n\t$TemplateURL: 'Board.html'\n});\n");
		put('application/components/Board/Board.html', page);

		phrases = language.Create({Roots: [own]});

		try {
			/* $T: to its definition in elemenx.js. */
			expect(language.Definition(phrases, page, at(page, '$T(') + 1, 'html', path.join(own, 'application/components/Board/Board.html'))).toEqual({File: path.join(own, 'elemenx.js'), Line: 2, Character: 3});

			/* A key: to its last part in the locales nearest to the file (the Application before the Library, and the one beside it before other/). */
			expect(language.Definition(phrases, page, at(page, 'app.title', 3), 'html', path.join(own, 'application/components/Board/Board.html'))).toEqual({File: path.join(own, 'application/locales/en.json'), Line: 1, Character: 2});
			expect(language.Definition(phrases, page, at(page, 'ui.call', 4), 'html', path.join(own, 'application/components/Board/Board.html'))).toEqual({File: path.join(own, 'application/locales/en.json'), Line: 2, Character: 18});
			expect(language.Definition(phrases, "this.$T('ui.call.leave');", 12, 'js', path.join(own, 'libraries/Kit/components/Card/Card.js'))).toEqual({File: path.join(own, 'libraries/Kit/locales/en.json'), Line: 5, Character: 4});
			expect(language.Definition(phrases, "this.$T('ui.none');", 12, 'js', path.join(own, 'libraries/Kit/components/Card/Card.js'))).toBe(null);

			/* The hover: the phrase in each language of those locales, English first. */
			expect(language.Hover(phrases, "this.$T('ui.call.leave');", 12, 'js', path.join(own, 'libraries/Kit/components/Card/Card.js')).Markdown).toBe('`ui.call.leave`\n\n- **en**: Leave\n- **ru**: Выйти');
			expect(language.Hover(phrases, page, at(page, 'app.title', 3), 'html', path.join(own, 'application/components/Board/Board.html')).Markdown).toBe('`app.title`\n\n- **en**: My "app"');
			expect(language.Hover(phrases, "this.$T('ui.none');", 12, 'js', path.join(own, 'libraries/Kit/components/Card/Card.js')).Markdown).toContain('No phrase of this key');
		}
		finally {
			fs.rmSync(own, {recursive: true, force: true});
		}
	});

	it('speaks LSP over stdio: initialize, a document opened, its diagnostics, a completion, shutdown', async function () {
		var server = child.spawn(process.execPath, [path.join(root, 'editors', 'server', 'elemenx-language-server.js'), '--stdio'], {stdio: ['pipe', 'pipe', 'inherit']});
		var received = [];
		var buffer = Buffer.alloc(0);
		var uri = 'file:///' + path.join(project, 'application/components/Board/Board.html').replace(/\\/g, '/').replace(/^\//, '');

		server.stdout.on('data', function (chunk) {
			var end;
			var length;

			buffer = Buffer.concat([buffer, chunk]);

			while ((end = buffer.indexOf('\r\n\r\n')) !== -1) {
				length = Number(/Content-Length: (\d+)/.exec(buffer.slice(0, end).toString())[1]);

				if (buffer.length < end + 4 + length) break;

				received.push(JSON.parse(buffer.slice(end + 4, end + 4 + length).toString()));

				buffer = buffer.slice(end + 4 + length);
			}
		});

		function send (message) {
			var text = JSON.stringify(Object.assign({jsonrpc: '2.0'}, message));

			server.stdin.write('Content-Length: ' + Buffer.byteLength(text) + '\r\n\r\n' + text);
		}

		async function answer (test) {
			var started = Date.now();

			/* It answers as soon as it can: the limit is for a busy machine, where the server starts slowly (regression: 5 seconds failed under load). */
			while (Date.now() - started < 30000) {
				var found = received.filter(test)[0];
				if (found)
					return found;

				await new Promise(function (resolve) {
					setTimeout(resolve, 20);
				});
			}

			throw new Error('No answer: ' + JSON.stringify(received));
		}

		try {
			send({id: 1, method: 'initialize', params: {rootUri: 'file:///' + project.replace(/\\/g, '/').replace(/^\//, ''), capabilities: {}}});

			expect((await answer(function (message) {
				return message.id === 1;
			})).result.capabilities).toMatchObject({hoverProvider: true, definitionProvider: true, completionProvider: {triggerCharacters: expect.arrayContaining(['<', '['])}});

			send({method: 'initialized', params: {}});
			send({method: 'textDocument/didOpen', params: {textDocument: {uri: uri, languageId: 'html', version: 1, text: template}}});

			expect((await answer(function (message) {
				return message.method === 'textDocument/publishDiagnostics';
			})).params.diagnostics.map(function (problem) {
				return [problem.severity, problem.message, problem.range.start];
			})).toEqual([
				[3, 'Card has no prop Varient', language.Position(template, template.indexOf('Varient'))],
				[3, 'Card tells no event vanish', language.Position(template, template.indexOf('(vanish)'))],
				[2, 'Unknown directive: *nope', language.Position(template, template.indexOf('*nope'))],
				[2, 'Unknown Elemenx Component: Missing', language.Position(template, template.indexOf('Missing'))]
			]);

			/* After <Card on the fourth line: its props, events and directives. */
			send({id: 2, method: 'textDocument/completion', params: {textDocument: {uri: uri}, position: {line: 3, character: 8}}});

			expect((await answer(function (message) {
				return message.id === 2;
			})).result.items.map(function (item) {
				return item.label;
			})).toEqual(expect.arrayContaining(['Title', '[Variant]', '(pick)', '*if']));

			send({id: 3, method: 'textDocument/unknownThing', params: {}});

			expect((await answer(function (message) {
				return message.id === 3;
			})).error.code).toBe(-32601);

			send({id: 4, method: 'shutdown'});

			await answer(function (message) {
				return message.id === 4;
			});

			send({method: 'exit'});
		}
		finally {
			server.kill();
		}
	});
});
