/*
 * The language server of Elemenx (LSP over stdio): completion, hover, the definition and diagnostics of the
 * templates and the code of an Elemenx project, for any editor that speaks LSP (IntelliJ through LSP4IJ, Neovim, Zed,
 * Sublime...). Its knowledge is the one of ../core/elemenx-language.js. Options: --meta <file> (a meta.json of a
 * Library, beside the ones the project has), --stdio (the default and only transport).
 */
var path = require('path');
var language = require(path.join(__dirname, '..', 'core', 'elemenx-language.js'));

var documents = {};
var knowledge = null;
var buffer = Buffer.alloc(0);
var timers = {};
var meta = null;
var index = process.argv.indexOf('--meta');
if (index !== -1)
	meta = process.argv[index + 1] || null;

/* A file URI as a path, and back. */
function toPath (uri) {
	var value = decodeURIComponent(String(uri).replace(/^file:\/\//, ''));

	return /^\/[A-Za-z]:/.test(value) ? value.substring(1) : value;
}

function toUri (file) {
	var value = path.resolve(file).replace(/\\/g, '/');

	return 'file://' + (value.charAt(0) === '/' ? '' : '/') + value.split('/').map(function (part, at) {
		return at === 0 && /^[A-Za-z]:$/.test(part) ? part : encodeURIComponent(part);
	}).join('/');
}

function kindOf (uri) {
	if (/\.html?$/i.test(uri)) return 'html';
	if (/\.(m?js)$/i.test(uri)) return 'js';

	return null;
}

function send (message) {
	var text = JSON.stringify(message);

	process.stdout.write('Content-Length: ' + Buffer.byteLength(text, 'utf8') + '\r\n\r\n' + text);
}

function respond (id, result) {
	send({jsonrpc: '2.0', id: id, result: result});
}

function notify (method, params) {
	send({jsonrpc: '2.0', method: method, params: params});
}

/* The kinds of the completion items, as LSP numbers them. */
var Kinds = {component: 7, prop: 10, event: 23, directive: 14, value: 12, service: 9, field: 5, method: 2};
var Severities = {error: 1, warning: 2, information: 3};

function range (text, start, end) {
	return {start: language.Position(text, start), end: language.Position(text, end)};
}

function diagnose (uri) {
	var document = documents[uri];
	if (!document || !knowledge) return;

	notify('textDocument/publishDiagnostics', {uri: uri, diagnostics: language.Diagnose(knowledge, document.Text, kindOf(uri), toPath(uri)).map(function (problem) {
		return {range: range(document.Text, problem.Start, problem.End), severity: Severities[problem.Severity] || 3, source: 'elemenx', message: problem.Message};
	})});
}

function later (uri) {
	clearTimeout(timers[uri]);

	timers[uri] = setTimeout(function () {
		diagnose(uri);
	}, 200);
}

function roots (params) {
	var list = (params.workspaceFolders || []).map(function (folder) {
		return toPath(folder.uri);
	});
	if (!list.length && params.rootUri)
		list.push(toPath(params.rootUri));

	if (!list.length && params.rootPath)
		list.push(params.rootPath);

	return list;
}

function handle (message) {
	var params = message.params || {};
	var document;
	var offset;
	var file;

	switch (message.method) {
		case 'initialize':
			knowledge = language.Create({Roots: roots(params), Meta: meta});

			respond(message.id, {
				capabilities: {
					textDocumentSync: {openClose: true, change: 1, save: {includeText: false}},
					completionProvider: {triggerCharacters: ['<', ' ', '[', '(', '*', '"', '\'', '.']},
					hoverProvider: true,
					definitionProvider: true
				},
				serverInfo: {name: 'elemenx-language-server', version: '1.0.0'}
			});

			return;

		case 'shutdown':
			respond(message.id, null);

			return;

		case 'exit':
			process.exit(0);

			return;

		case 'textDocument/didOpen':
			documents[params.textDocument.uri] = {Text: params.textDocument.text};

			later(params.textDocument.uri);

			return;

		case 'textDocument/didChange':
			if (documents[params.textDocument.uri] && params.contentChanges.length)
				documents[params.textDocument.uri].Text = params.contentChanges[params.contentChanges.length - 1].text;

			/* A Component changed in the code (or in a script of a page): what the templates know of it changes too. */
			if (knowledge && documents[params.textDocument.uri])
				knowledge.Update(toPath(params.textDocument.uri), documents[params.textDocument.uri].Text);

			later(params.textDocument.uri);

			return;

		case 'textDocument/didClose':
			delete documents[params.textDocument.uri];

			notify('textDocument/publishDiagnostics', {uri: params.textDocument.uri, diagnostics: []});

			return;

		case 'textDocument/didSave':
			if (knowledge && /\.(m?js|json|html?)$/i.test(params.textDocument.uri))
				knowledge.Update(toPath(params.textDocument.uri));

			return;

		case 'workspace/didChangeWatchedFiles':
			if (knowledge) {
				(params.changes || []).forEach(function (change) {
					if (change.type === 3) knowledge.Forget(toPath(change.uri));
					else knowledge.Update(toPath(change.uri));
				});
			}

			return;

		case 'textDocument/completion':
		case 'textDocument/hover':
		case 'textDocument/definition':
			document = documents[params.textDocument.uri];

			if (!document || !knowledge || !kindOf(params.textDocument.uri)) {
				respond(message.id, null);

				return;
			}

			offset = language.Offset(document.Text, params.position);
			file = toPath(params.textDocument.uri);

			if (message.method === 'textDocument/completion') {
				respond(message.id, {isIncomplete: false, items: language.Complete(knowledge, document.Text, offset, kindOf(params.textDocument.uri), file).map(function (item) {
					return {
						label: item.Label,
						kind: Kinds[item.Kind] || 1,
						detail: item.Detail,
						documentation: item.Documentation ? {kind: 'markdown', value: item.Documentation} : undefined,
						insertTextFormat: item.Snippet ? 2 : 1,
						textEdit: {range: range(document.Text, item.Start, item.End), newText: item.Insert},
						filterText: item.Label,
						sortText: item.Sort
					};
				})});
			}
			else if (message.method === 'textDocument/hover') {
				respond(message.id, (function (hover) {
					return hover ? {contents: {kind: 'markdown', value: hover.Markdown}, range: range(document.Text, hover.Start, hover.End)} : null;
				})(language.Hover(knowledge, document.Text, offset, kindOf(params.textDocument.uri), file)));
			}
			else {
				respond(message.id, (function (place) {
					return place ? {uri: toUri(place.File), range: {start: {line: place.Line, character: place.Character}, end: {line: place.Line, character: place.Character}}} : null;
				})(language.Definition(knowledge, document.Text, offset, kindOf(params.textDocument.uri), file)));
			}

			return;

		default:
			/* A request it does not know: an empty answer, a notification nothing. */
			if (message.id !== undefined && message.id !== null)
				send({jsonrpc: '2.0', id: message.id, error: {code: -32601, message: 'Method not found: ' + message.method}});
	}
}

/* The messages of LSP: a header with their length, then their JSON. */
process.stdin.on('data', function (chunk) {
	var end;
	var header;
	var length;
	var body;

	buffer = Buffer.concat([buffer, chunk]);

	while (true) {
		end = buffer.indexOf('\r\n\r\n');

		if (end === -1) return;

		header = buffer.slice(0, end).toString('ascii');
		length = Number((/Content-Length:\s*(\d+)/i.exec(header) || [])[1]);

		if (buffer.length < end + 4 + length) return;

		body = buffer.slice(end + 4, end + 4 + length).toString('utf8');
		buffer = buffer.slice(end + 4 + length);

		try {
			handle(JSON.parse(body));
		}
		catch (error) {
			process.stderr.write('elemenx-language-server: ' + (error && error.stack || error) + '\n');
		}
	}
});
