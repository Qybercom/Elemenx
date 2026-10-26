/*
 * Elemenx for VS Code: completion, hover, the definition and diagnostics of the templates and the code of an
 * Elemenx project, from the knowledge of ./core/elemenx-language.js (taken in the host of the extension: no language
 * server to start), and the colors of the syntax of the templates ({{ }}, [prop], (event), *directive).
 * Settings: elemenx.meta (a meta.json of a Library beside the ones of the project), elemenx.diagnostics.
 */
var vscode = require('vscode');
var path = require('path');
var language = require(path.join(__dirname, 'core', 'elemenx-language.js'));

var Kinds = {
	component: vscode.CompletionItemKind.Class,
	prop: vscode.CompletionItemKind.Property,
	event: vscode.CompletionItemKind.Event,
	directive: vscode.CompletionItemKind.Keyword,
	value: vscode.CompletionItemKind.Value,
	service: vscode.CompletionItemKind.Module,
	field: vscode.CompletionItemKind.Field,
	method: vscode.CompletionItemKind.Method
};

var Severities = {
	error: vscode.DiagnosticSeverity.Error,
	warning: vscode.DiagnosticSeverity.Warning,
	information: vscode.DiagnosticSeverity.Information
};

function kindOf (document) {
	if (document.languageId === 'html') return 'html';
	if (document.languageId === 'javascript') return 'js';

	return null;
}

function activate (context) {
	var knowledge = null;
	var problems = vscode.languages.createDiagnosticCollection('elemenx');
	var timers = {};
	var selector = [{language: 'html', scheme: 'file'}, {language: 'javascript', scheme: 'file'}];

	function create () {
		var folders = (vscode.workspace.workspaceFolders || []).map(function (folder) {
			return folder.uri.fsPath;
		});

		knowledge = language.Create({Roots: folders, Meta: vscode.workspace.getConfiguration('elemenx').get('meta') || null});

		vscode.workspace.textDocuments.forEach(diagnose);
	}

	function range (document, start, end) {
		return new vscode.Range(document.positionAt(start), document.positionAt(end));
	}

	function diagnose (document) {
		if (kindOf(document) !== 'html' || vscode.workspace.getConfiguration('elemenx').get('diagnostics') === false) {
			problems.delete(document.uri);

			return;
		}

		problems.set(document.uri, language.Diagnose(knowledge, document.getText(), 'html', document.uri.fsPath).map(function (problem) {
			var diagnostic = new vscode.Diagnostic(range(document, problem.Start, problem.End), problem.Message, Severities[problem.Severity]);

			diagnostic.source = 'elemenx';

			return diagnostic;
		}));
	}

	function later (document) {
		clearTimeout(timers[document.uri.toString()]);

		timers[document.uri.toString()] = setTimeout(function () {
			diagnose(document);
		}, 200);
	}

	create();

	context.subscriptions.push(problems);

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(selector, {
		provideCompletionItems: function (document, position) {
			var kind = kindOf(document);
			if (!kind)
				return [];

			return language.Complete(knowledge, document.getText(), document.offsetAt(position), kind, document.uri.fsPath).map(function (item) {
				var completion = new vscode.CompletionItem(item.Label, Kinds[item.Kind]);

				completion.detail = item.Detail;
				completion.documentation = item.Documentation ? new vscode.MarkdownString(item.Documentation) : undefined;
				completion.insertText = item.Snippet ? new vscode.SnippetString(item.Insert) : item.Insert;
				completion.range = range(document, item.Start, item.End);
				completion.filterText = item.Label;
				completion.sortText = item.Sort;

				return completion;
			});
		}
	}, '<', ' ', '[', '(', '*', '"', '\'', '.'));

	context.subscriptions.push(vscode.languages.registerHoverProvider(selector, {
		provideHover: function (document, position) {
			var kind = kindOf(document);
			var hover = kind ? language.Hover(knowledge, document.getText(), document.offsetAt(position), kind, document.uri.fsPath) : null;

			return hover ? new vscode.Hover(new vscode.MarkdownString(hover.Markdown), range(document, hover.Start, hover.End)) : null;
		}
	}));

	context.subscriptions.push(vscode.languages.registerDefinitionProvider(selector, {
		provideDefinition: function (document, position) {
			var kind = kindOf(document);
			var place = kind ? language.Definition(knowledge, document.getText(), document.offsetAt(position), kind, document.uri.fsPath) : null;

			return place ? new vscode.Location(vscode.Uri.file(place.File), new vscode.Position(place.Line, place.Character)) : null;
		}
	}));

	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(diagnose));

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(function (event) {
		/* A Component changed in the code: what the templates know of it changes too. */
		if (kindOf(event.document) === 'js')
			knowledge.Update(event.document.uri.fsPath, event.document.getText());

		later(event.document);
	}));

	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(function (document) {
		problems.delete(document.uri);
	}));

	context.subscriptions.push((function () {
		var watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,mjs,json}');

		watcher.onDidChange(function (uri) {
			knowledge.Update(uri.fsPath);
		});

		watcher.onDidCreate(function (uri) {
			knowledge.Update(uri.fsPath);
		});

		watcher.onDidDelete(function (uri) {
			knowledge.Forget(uri.fsPath);
		});

		return watcher;
	})());

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(function (event) {
		if (event.affectsConfiguration('elemenx'))
			create();
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(create));

	context.subscriptions.push(vscode.commands.registerCommand('elemenx.refresh', create));
}

function deactivate () {}

module.exports = {activate: activate, deactivate: deactivate};
