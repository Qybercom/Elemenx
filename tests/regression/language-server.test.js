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
			Components: [{Name: 'Card', Description: 'A card.', Group: 'layout', Props: [{Name: 'Title', Type: 'text', Description: 'Its title.'}, {Name: 'Variant', Type: 'text', Options: ['flat', 'raised'], Description: 'Its look.'}], Events: ['pick'], Slots: ['footer']}],
			Services: [{Name: 'Toast', Description: 'Toasts.', Methods: ['Show(options)']}],
			Directives: [{Name: 'tip', Description: 'A tip.'}]
		}));
		write('libraries/Kit/components/Card/Card.js', "Elemenx.Component('Card', {});\n");
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
		expect(language.Hover(knowledge, "$Service('Toast')", 11, 'js').Markdown).toContain('`Show(options)`');

		expect(language.Definition(knowledge, '<Board />', 2, 'html', file)).toEqual({File: path.join(project, 'application/components/Board/Board.js'), Line: 1, Character: 0});
		expect(language.Definition(knowledge, '<Card (pick)="Picked" />', 17, 'html', file)).toMatchObject({File: path.join(project, 'application/components/Board/Board.js'), Line: 12});
		expect(language.Definition(knowledge, "$Service('Store')", 11, 'js')).toMatchObject({File: path.join(project, 'application/services/Store.js'), Line: 0});
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
