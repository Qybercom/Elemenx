import { afterEach, describe, expect, it } from 'vitest';
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

afterEach(function () {
	while (temporary.length) {
		fs.rmSync(temporary.pop(), {recursive: true, force: true});
	}
});

describe('elemenx meta', function () {
	it('collects the $Meta of every definition of a library, normalized as Elemenx.Meta gives it, and its classes', function () {
		var root = folder();

		fs.writeFileSync(path.join(root, 'index.js'), '[\'index.css\', \'components/Card/Card.js\', \'services/Count.js\', \'directives/Mark.js\']');
		fs.mkdirSync(path.join(root, 'components', 'Card'), {recursive: true});
		fs.mkdirSync(path.join(root, 'services'));
		fs.mkdirSync(path.join(root, 'directives'));
		fs.writeFileSync(path.join(root, 'index.css'), '.my-row { display: flex; }\n.my-row.fill { flex: 1; }\n');
		fs.writeFileSync(path.join(root, 'components', 'Card', 'Card.js'), 'Elemenx.Component(\'Card\', {$Meta: {Group: \'layout\', Props: {Title: \'The title.\', Look: {Options: [\'flat\', \'raised\'], Description: \'Its look.\'}}}, Title: \'\', Look: \'flat\', Count: 0});\n');
		fs.writeFileSync(path.join(root, 'components', 'Card', 'Card.css'), '.my-card { color: red; }\n.my-card.raised { color: blue; }\n');
		fs.writeFileSync(path.join(root, 'services', 'Count.js'), 'Elemenx.Service(\'Count\', {$Meta: {Description: \'Counts.\', Methods: [\'Count()\']}, Count: function () { return 1; }});\nElemenx.Service(\'Count\').Count();\n');
		fs.writeFileSync(path.join(root, 'directives', 'Mark.js'), 'Elemenx.Directive(\'Mark\', {$Meta: {Description: \'Marks.\'}});\n');

		expect(Meta.Build(root, path.join(root, 'meta.json'))).toEqual({
			Components: [{
				Name: 'Card', Kind: 'Component', Group: 'layout', Icon: '', Description: '', Slots: [], Container: false, Children: [], Current: '', Events: [], Methods: [], Sample: {},
				Props: [
					{Name: 'Title', Type: 'text', Default: '', Options: null, Schema: null, Description: 'The title.'},
					{Name: 'Look', Type: 'select', Default: 'flat', Options: ['flat', 'raised'], Schema: null, Description: 'Its look.'}
				]
			}],
			Services: [{Name: 'Count', Kind: 'Service', Group: '', Icon: '', Description: 'Counts.', Props: [], Slots: [], Container: false, Children: [], Current: '', Events: [], Methods: ['Count()'], Sample: {}}],
			Directives: [{Name: 'mark', Kind: 'Directive', Group: '', Icon: '', Description: 'Marks.', Props: [], Slots: [], Container: false, Children: [], Current: '', Events: [], Methods: [], Sample: {}}],
			Classes: {}
		});

		expect(JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8')).Components[0].Name).toBe('Card');
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

	it('runs from the command line', function () {
		var root = folder();
		var output = childProcess.execFileSync(process.execPath, [path.resolve('elemenx-cli.js'), 'meta', library, path.join(root, 'meta.json')], {encoding: 'utf8'});

		expect(output).toMatch(/^Elemenx meta: \d+ components, \d+ services, \d+ directives, \d+ classes in /);
		expect(JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8')).Components.length).toBeGreaterThan(120);
	});
});
