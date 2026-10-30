import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Meta = require('../../tools/meta.js');
var library = path.resolve('libraries/ElemenxUI');
var temporary = [];

function folder () {
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-meta-'));

	temporary.push(root);

	return root;
}

/* The text of the first argument of a call whose arguments start at index: up to its comma or its parenthesis. */
function firstArgument (source, index) {
	var depth = 0;
	var quote = '';
	var at;

	for (at = index; at < source.length; at++) {
		if (quote) {
			if (source[at] === '\\') at++;
			else if (source[at] === quote) quote = '';
		}
		else if (source[at] === '\'' || source[at] === '"') {
			quote = source[at];
		}
		else if ('([{'.indexOf(source[at]) !== -1) {
			depth++;
		}
		else if (depth && ')]}'.indexOf(source[at]) !== -1) {
			depth--;
		}
		else if (!depth && (source[at] === ',' || source[at] === ')')) {
			break;
		}
	}

	return source.substring(index, at);
}

afterEach(function () {
	while (temporary.length) {
		fs.rmSync(temporary.pop(), {recursive: true, force: true});
	}
});

describe('elemenx meta', function () {
	it('gives a Component of a base and of Traits the meta of all of its layers, as the framework merges them', function () {
		var root = folder();
		var made;
		var big;

		fs.writeFileSync(path.join(root, 'index.js'), '[\'traits/Selectable.js\', \'components/Card/Card.js\', \'components/BigCard/BigCard.js\']');
		fs.mkdirSync(path.join(root, 'traits'));
		fs.mkdirSync(path.join(root, 'components', 'Card'), {recursive: true});
		fs.mkdirSync(path.join(root, 'components', 'BigCard'), {recursive: true});
		fs.writeFileSync(path.join(root, 'traits', 'Selectable.js'), "Elemenx.Trait('Selectable', {$Meta: {Props: {Selected: 'Whether it is selected.'}, Events: ['toggle']}, Selected: false});\n");
		fs.writeFileSync(path.join(root, 'components', 'Card', 'Card.js'), "Elemenx.Component('Card', {$Meta: {Group: 'layout', Description: 'A card.', Props: {Title: 'Its title.'}, Events: {pick: 'Picked.'}}, Title: 'Card'});\n");
		fs.writeFileSync(path.join(root, 'components', 'BigCard', 'BigCard.js'), "Elemenx.Component('BigCard', {$Extends: 'Card', $Traits: ['Selectable'], $Meta: {Description: 'A big card.', Props: {Size: 'Its size.'}}, Title: 'Big', Size: 2});\n");

		made = Meta.Build(root, null);
		big = made.Components.filter(function (component) {
			return component.Name === 'BigCard';
		})[0];

		expect(big.Description).toBe('A big card.');
		expect(big.Group).toBe('layout');
		expect(big.Props.map(function (prop) {
			return prop.Name + '=' + JSON.stringify(prop.Default);
		})).toEqual(['Title="Big"', 'Selected=false', 'Size=2']);
		expect(big.Events).toEqual(['pick', 'toggle']);
		expect(big.EventDescriptions).toEqual({pick: 'Picked.', toggle: ''});
		expect(made.Components.map(function (component) {
			return component.Name;
		})).toEqual(['Card', 'BigCard']);
	});

	it('collects the $Meta of every definition of a library, normalized as Elemenx.Meta gives it, and its classes', function () {
		var root = folder();

		fs.writeFileSync(path.join(root, 'index.js'), '[\'index.css\', \'components/Card/Card.js\', \'services/Count.js\', \'directives/Mark.js\']');
		fs.mkdirSync(path.join(root, 'components', 'Card'), {recursive: true});
		fs.mkdirSync(path.join(root, 'services'));
		fs.mkdirSync(path.join(root, 'directives'));
		fs.writeFileSync(path.join(root, 'index.css'), '.my-row { display: flex; }\n.my-row.fill { flex: 1; }\n');
		fs.writeFileSync(path.join(root, 'components', 'Card', 'Card.js'), 'Elemenx.Component(\'Card\', {$Meta: {Group: \'layout\', Events: {open: \'It opened.\'}, Props: {Title: \'The title.\', Look: {Options: [\'flat\', \'raised\'], Description: \'Its look.\'}}}, Title: \'\', Look: \'flat\', Count: 0});\n');
		fs.writeFileSync(path.join(root, 'components', 'Card', 'Card.css'), '.my-card { color: red; }\n.my-card.raised { color: blue; }\n');
		fs.writeFileSync(path.join(root, 'services', 'Count.js'), 'Elemenx.Service(\'Count\', {$Meta: {Description: \'Counts.\', Methods: [\'Count()\']}, Count: function () { return 1; }});\nElemenx.Service(\'Count\').Count();\n');
		fs.writeFileSync(path.join(root, 'directives', 'Mark.js'), 'Elemenx.Directive(\'Mark\', {$Meta: {Description: \'Marks.\'}});\n');

		expect(Meta.Build(root, path.join(root, 'meta.json'))).toEqual({
			Components: [{
				Name: 'Card', Kind: 'Component', Group: 'layout', Icon: '', Description: '', Slots: [], Container: false, Children: [], Current: '', Events: ['open'], EventDescriptions: {open: 'It opened.'}, Methods: [], Sample: {},
				Props: [
					{Name: 'Title', Type: 'text', Default: '', Options: null, Schema: null, Body: false, Description: 'The title.'},
					{Name: 'Look', Type: 'select', Default: 'flat', Options: ['flat', 'raised'], Schema: null, Body: false, Description: 'Its look.'}
				]
			}],
			Services: [{Name: 'Count', Kind: 'Service', Group: '', Icon: '', Description: 'Counts.', Props: [], Slots: [], Container: false, Children: [], Current: '', Events: [], EventDescriptions: {}, Methods: ['Count()'], Sample: {}}],
			Directives: [{Name: 'mark', Kind: 'Directive', Group: '', Icon: '', Description: 'Marks.', Props: [], Slots: [], Container: false, Children: [], Current: '', Events: [], EventDescriptions: {}, Methods: [], Sample: {}}],
			Classes: {}
		});

		expect(JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8')).Components[0].Name).toBe('Card');
	});

	/* A bug: an IDE that indexed data/meta.json held it a moment, and elemenx meta failed (UNKNOWN on Windows). */
	it('writes its file again while it is held a moment, and gives up on another error', function () {
		var root = folder();
		var write = fs.writeFileSync;
		var tries = 0;

		fs.writeFileSync(path.join(root, 'index.js'), '[]');

		vi.spyOn(fs, 'writeFileSync').mockImplementation(function (file, text) {
			var error;

			if (/meta\.json$/.test(String(file)) && ++tries < 3) {
				error = new Error('UNKNOWN: unknown error, open \'' + file + '\'');
				error.code = 'UNKNOWN';

				throw error;
			}

			return write.call(fs, file, text);
		});

		Meta.Build(root, path.join(root, 'meta.json'));

		expect(tries).toBe(3);
		expect(JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8')).Components).toEqual([]);

		vi.restoreAllMocks();

		vi.spyOn(fs, 'writeFileSync').mockImplementation(function () {
			var error = new Error('ENOSPC: no space left on device');

			error.code = 'ENOSPC';

			throw error;
		});

		expect(function () {
			Meta.Build(root, path.join(root, 'other.json'));
		}).toThrow('ENOSPC');

		vi.restoreAllMocks();
	});

	it('every Component of ElemenxUI declares $Meta with its group, its icon and a description of each prop', function () {
		var root = folder();
		var result = Meta.Build(library, path.join(root, 'meta.json'));
		var names = fs.readdirSync(path.join(library, 'components')).filter(function (name) {
			return fs.existsSync(path.join(library, 'components', name, name + '.js'));
		});

		expect(result.Components.map(function (meta) {
			return meta.Name;
		}).sort()).toEqual(names.slice().sort());

		expect(result.Components.filter(function (meta) {
			return !meta.Group || !meta.Icon || !meta.Description || meta.Props.some(function (prop) {
				return !prop.Description;
			});
		}).map(function (meta) {
			return meta.Name;
		})).toEqual([]);

		/* The folder of a Window, its levels and its look are choices; the classes of the layouts take their modifiers. */
		expect(result.Components.find(function (meta) {
			return meta.Name === 'Window';
		}).Props.filter(function (prop) {
			return ['Variant', 'Level', 'HeaderShape'].indexOf(prop.Name) !== -1;
		}).map(function (prop) {
			return prop.Options;
		})).toEqual([['default', 'game'], ['primary', 'secondary', 'plain'], ['default', 'trapezoid']]);

		expect(result.Classes['elemenx-screen']).toEqual(['fill', 'fill-fixed', 'non-fill']);
		expect(result.Classes['elemenx-container']).toEqual(expect.arrayContaining(['wrappable', 'centered', 'grid', 'fill']));
		expect(result.Services.length).toBeGreaterThan(30);
		expect(result.Directives.length).toBeGreaterThan(10);
	});

	/* Regression: MoneyInput emitted input and change without declaring them, CallStage declared a layout it never emitted. */
	it('every event a Component of ElemenxUI emits by its name is in its $Meta.Events, with a description, and no other', function () {
		var result = Meta.Build(library, path.join(folder(), 'meta.json'));
		var wrong = [];

		result.Components.forEach(function (meta) {
			var base = path.join(library, 'components', meta.Name, meta.Name);
			var source = fs.readFileSync(base + '.js', 'utf8') + (fs.existsSync(base + '.html') ? fs.readFileSync(base + '.html', 'utf8') : '');
			var calls = /(?:\$Emit|this\.Emit)\(/g;
			var emitted = {};
			var match;

			/* The names in the first argument of an $Emit: $Emit('close'), $Emit(open ? 'popout' : 'popin'). */
			match = calls.exec(source);

			while (match) {
				firstArgument(source, match.index + match[0].length).replace(/'([a-z][\w-]*)'(?!\s*[=!]==)/g, function (all, name) {
					emitted[name] = true;
				});

				match = calls.exec(source);
			}

			Object.keys(emitted).forEach(function (event) {
				if (meta.Events.indexOf(event) === -1)
					wrong.push(meta.Name + ' emits ' + event + ' and does not declare it');
			});

			meta.Events.forEach(function (event) {
				if (!emitted[event])
					wrong.push(meta.Name + ' declares ' + event + ' and does not emit it');

				if (!meta.EventDescriptions[event])
					wrong.push(meta.Name + ' does not describe ' + event);
			});
		});

		expect(wrong).toEqual([]);
	});

	it('keeps data/meta.json of ElemenxUI, where the Designer Service reads it, as elemenx meta makes it now', function () {
		var root = folder();
		var made = Meta.Build(library, path.join(root, 'meta.json'));

		/* Run npm run meta when a $Meta or a stylesheet of the Library changes. */
		expect(JSON.parse(fs.readFileSync(path.join(library, 'data', 'meta.json'), 'utf8'))).toEqual(JSON.parse(JSON.stringify(made)));
		expect(fs.readFileSync(path.join(library, 'index.js'), 'utf8')).toContain('\'data/meta.json\'');
		expect(made.Services.find(function (meta) {
			return meta.Name === 'Designer';
		}).Methods).toEqual(expect.arrayContaining(['Load(callback)', 'Use(meta)', 'SetStyle(id, property, value)']));
	});

	it('leaves $Meta out of a build of the Library that asks nothing of it, braces in its texts and all', function () {
		var Builder = require('../../tools/builder.js');
		var source = 'Elemenx.Component(\'Card\', {\n\t$TemplateURL: \'Card.html\',\n\t$Meta: {\n\t\tGroup: \'layout\',\n\t\tProps: {Items: \'The items: [{ID, Label}] } or \\\' a quote.\', Look: {Options: [\'a\', \'b\']}}\n\t},\n\tTitle: \'\'\n});\n';

		expect(Builder.StripMeta(source)).toBe('Elemenx.Component(\'Card\', {\n\t$TemplateURL: \'Card.html\',\n\tTitle: \'\'\n});\n');
	});

	/* A bug: only the entry and the page were looked at, so a component that read Elemenx.Meta got nothing in a build. */
	it('keeps the $Meta of the libraries in a build whose own component reads Elemenx.Meta, and leaves it out otherwise', function () {
		var root = folder();
		var button = function (reads) {
			var source;
			var start;

			fs.writeFileSync(path.join(root, 'Shop', 'Page', 'Page.js'), 'Elemenx.Component(\'Page\', {\n\t$Template: \'<Button Label="Buy" />\',\n\tProps: function () {\n\t\treturn ' + (reads ? 'Elemenx.Meta(\'Button\').Props' : '[]') + ';\n\t}\n});\n');

			childProcess.execFileSync(process.execPath, [path.resolve('elemenx-cli.js'), 'build', root], {stdio: 'ignore'});

			source = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
			start = source.indexOf('Elemenx.Component(\'Button\'');

			return source.substring(start, source.indexOf('Elemenx.Component(', start + 1));
		};

		fs.mkdirSync(path.join(root, 'Shop', 'Page'), {recursive: true});
		fs.writeFileSync(path.join(root, 'index.html'), '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><script src="/elemenx.js"></script><script src="/app.js"></script></head><body></body></html>\n');
		fs.writeFileSync(path.join(root, 'app.js'), 'Elemenx.Application(\'Shop\', {$Component: \'Page\', $Root: \'Shop\', $Mount: \'body\', $Use: [\'ElemenxUI\']});\n');
		fs.writeFileSync(path.join(root, 'Shop', 'index.js'), '[\'Page/Page.js\'];\n');

		expect(button(true)).toContain('$Meta:');
		expect(button(false)).not.toContain('$Meta:');
	});

	it('runs from the command line', function () {
		var root = folder();
		var output = childProcess.execFileSync(process.execPath, [path.resolve('elemenx-cli.js'), 'meta', library, path.join(root, 'meta.json')], {encoding: 'utf8'});

		expect(output).toMatch(/^Elemenx meta: \d+ components, \d+ services, \d+ directives, \d+ classes in /);
		expect(JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8')).Components.length).toBeGreaterThan(120);
	});
});
